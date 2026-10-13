<script lang="ts">
import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { untrack } from 'svelte'
import { displayPath } from '../../layout/tab-labels.ts'
import { releaseWebglContexts } from '../../lib/webgl.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { boot } from '../../stores/boot.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sessions, shellName } from '../../stores/sessions.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import {
  BellRate,
  CLIPBOARD_WRITE_ONLY,
  HeldInput,
  opensLink,
  pasteLines,
  pasteNeedsAsking,
  pastePreview,
  validPattern,
} from './input.ts'
import TerminalSearch, { type SearchHow } from './TerminalSearch.svelte'
import { WebglKeeper } from './webgl-keeper.ts'
import './xterm-css.ts'
import {
  buildXtermTheme,
  minimumContrastRatio,
  monoFontFamily,
  paletteFromCss,
  searchDecorations,
} from './xterm-theme.ts'

/**
 * One terminal, for one pane.
 *
 * Tabs are not this widget's concern any more - a tab group is a layout node,
 * so a terminal is simply a leaf like every other widget. That is what lets the
 * same terminal be split, tabbed, or placed anywhere in the tree.
 */
const { paneId, state: paneState, active, visible = true }: WidgetProps = $props()

/**
 * How long a size must hold before the shell is told about it.
 *
 * xterm reflows its own buffer losslessly, but Windows ConPTY rewraps its buffer
 * to every size it is given and repaints the screen from the result, so a single
 * wrong size garbles the shell's history for good. Two sources of wrong sizes:
 * fitting a pane that is not displayed (a background tab measured as 12x5), which
 * the fit guard below refuses, and the transient sizes a container passes through
 * while panes are rearranged, which this delay absorbs.
 */
const PTY_RESIZE_SETTLE_MS = 120

/** How long after attaching the screen sent with it is taken to have come. */
const ATTACH_SETTLE_MS = 600

let host = $state<HTMLDivElement | null>(null)
// State, so the focus effect below runs again once the terminal exists: at startup
// the pane is already active before its session has been created.
let term = $state.raw<Terminal | null>(null)
let fit: FitAddon | null = null
let webgl: WebglKeeper | null = null
/** Tells the shell the terminal's size if it has not been told it yet; set once attached. */
let syncSize: (() => void) | null = null
// State: the search bar is rendered only once its addon exists.
let search = $state.raw<SearchAddon | null>(null)
let searchOpen = $state(false)
/** Bumped by the shortcut, to put the keyboard back in a bar that is already open. */
let searchFocus = $state(0)
/**
 * Whether the selection on screen was put there by a search rather than by the
 * user.
 *
 * Selecting text in this terminal copies it (bindClipboard), so without this
 * every match stepped through would land on the clipboard - and the last one
 * would still be there after the bar was closed. It is not a window in time:
 * xterm reports a selection change after the call that caused it, so the flag
 * stays set until the mouse goes down in the terminal, which is how a selection
 * the user makes begins.
 */
let selectionIsSearch = false

const info = $derived(sessions.get(paneId))

/**
 * Bumped to start the pane's shell again after it ended: the terminal is made afresh on a new
 * session in the folder the last one was in (a key pressed on "[process exited]").
 */
let generation = $state(0)

/** Output came while this pane was behind another tab: its tab is marked until it is shown. */
let activity = $state(false)
$effect(() => {
  if (visible) activity = false
})

/** The pane flashing for a bell, for a moment. */
let ringing = $state(false)
/** Bells taken, on the frame for the tests: a flash of a quarter second is easily missed. */
let rung = $state(0)
const bells = new BellRate()
let ringTimer: ReturnType<typeof setTimeout> | null = null
$effect(() => () => {
  if (ringTimer !== null) clearTimeout(ringTimer)
})

function bell(): void {
  const mode = appearance.settings.terminal.bell
  if (mode === 'off' || !bells.ring(performance.now())) return
  if (mode !== 'flash') sfx.play('glitch')
  if (mode === 'sound') return
  ringing = true
  rung += 1
  if (ringTimer !== null) clearTimeout(ringTimer)
  ringTimer = setTimeout(() => {
    ringing = false
    ringTimer = null
  }, 260)
}

/**
 * The folder the pane's shell was last in, kept in the pane's state so that a
 * pane brought back (the next start, a saved layout) starts its new shell
 * there. A new pane has none and starts where the settings say (main decides,
 * and falls back the same way when the folder has gone).
 */
function lastFolder(): string | undefined {
  return typeof paneState?.cwd === 'string' && paneState.cwd !== '' ? paneState.cwd : undefined
}

function recordFolder(cwd: string | null): void {
  if (cwd !== null && cwd !== lastFolder()) widgetState.patch(paneId, { cwd })
}

/** What a live session's pane shows of its end: nothing. */
const LIVE = { exited: null, error: null, lastCommand: null } as const

/**
 * Adopts a session: reuses the one recorded in the pane's layout state when it
 * is still alive, otherwise creates one. This is what makes a pane survive a
 * window reload with its shell intact.
 */
async function adoptSession(gone: () => boolean): Promise<string | null> {
  const recorded = typeof paneState?.sessionId === 'string' ? paneState.sessionId : null

  if (recorded !== null) {
    const alive = await window.elecdex.pty.list()
    const found = alive.find((s) => s.id === recorded)
    if (found) {
      sessions.patch(paneId, {
        ...LIVE,
        sessionId: found.id,
        shell: shellName(found.shell),
        cwd: found.cwd,
      })
      recordFolder(found.cwd)
      return found.id
    }
  }

  try {
    const folder = lastFolder()
    const created = await window.elecdex.pty.create(folder === undefined ? {} : { cwd: folder })
    // Closed while the shell was made: end it now, not written into a pane that has gone and
    // left for the reaper.
    if (gone()) {
      void window.elecdex.pty.dispose(created.id)
      return null
    }
    // A new shell, perhaps for a pane whose last one ended: nothing of that end stays (found in
    // review: a pane remounted after its shell exited kept "exited", and its first key started a
    // third shell).
    sessions.patch(paneId, {
      ...LIVE,
      sessionId: created.id,
      shell: shellName(created.shell),
      cwd: created.cwd,
    })
    // A patch, not a replacement: the folder kept beside it must stay.
    widgetState.patch(paneId, { sessionId: created.id })
    return created.id
  } catch (cause) {
    sessions.patch(paneId, {
      error: cause instanceof Error ? cause.message : String(cause),
    })
    return null
  }
}

// Publish what the pane header and tab should show.
$effect(() => {
  // The header says TERMINAL (the registry title) and the tab says where the
  // shell is; the shell's own name falls back to the tab until it reports that.
  paneMeta.set(paneId, {
    tabName: info.shell,
    ...(info.cwd !== null
      ? {
          subtitle: displayPath(info.cwd),
          tabPath: info.cwd,
          tooltip: `${info.shell} — ${displayPath(info.cwd)}`,
        }
      : { subtitle: info.integrationPending ? '…' : 'no tracking', tooltip: info.shell }),
    // A command's exit code is not shown on the tab (user decision): only the shell's own end.
    ...(info.exited !== null
      ? { badge: `exited ${info.exited.code}`, badgeKind: 'warn' as const }
      : {}),
    ...(activity ? { activity: true } : {}),
  })
})

$effect(() => {
  const el = host
  if (el === null) return
  void generation

  let disposed = false
  let detach: (() => void) | null = null
  let detachClipboard: (() => void) | null = null
  let terminal: Terminal | null = null
  let observer: ResizeObserver | null = null
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  /** Whether output now is the shell's own, for the tab's dot; not the screen sent on attaching. */
  let watching = false
  let watchTimer: ReturnType<typeof setTimeout> | null = null

  void (async () => {
    // Untracked: the pane's state is read to adopt a session, and its every change (the folder
    // after a cd) made the whole terminal again - its screen, scroll and what was being typed
    // (found in review). A restart asks for a new one through `generation`.
    const id = await untrack(() => adoptSession(() => disposed))
    if (id === null || disposed) return

    terminal = new Terminal({
      allowProposedApi: true,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10_000,
      // Right-click pastes (below), so it must not also select a word first.
      rightClickSelectsWord: false,
      fontFamily: monoFontFamily(el),
      fontSize: untrack(() => appearance.settings.terminal.fontSize),
      lineHeight: 1.15,
      theme: buildXtermTheme(paletteFromCss(el), appearance.theme.terminal?.ansi),
      minimumContrastRatio: minimumContrastRatio(appearance.theme.mode),
      // A link a program marks (OSC 8) opens as a printed one does, on Ctrl+click: without this,
      // xterm asked with window.confirm() on a plain click, blocking the page, then opened
      // nothing (found in review).
      linkHandler: {
        activate: (event, uri) => {
          if (opensLink(event)) void window.elecdex.system.openExternal(uri)
        },
      },
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    // OSC 52 may write the clipboard (a yank in vim or tmux) but never read it: answered, a
    // query handed whatever was copied - a password - to any program printing one (found in
    // review), as most terminals refuse.
    terminal.loadAddon(new ClipboardAddon(undefined, CLIPBOARD_WRITE_ONLY))

    const searchAddon = new SearchAddon()
    terminal.loadAddon(searchAddon)

    // A link goes to the user's browser, never into a pane: what a shell prints
    // is not a site elecdex chose to show. main refuses anything but http(s).
    terminal.loadAddon(
      new WebLinksAddon((event, uri) => {
        if (opensLink(event)) void window.elecdex.system.openExternal(uri)
      }),
    )

    const unicode = new Unicode11Addon()
    terminal.loadAddon(unicode)
    terminal.unicode.activeVersion = '11'

    terminal.open(el)

    // WebGL must load after open(), and can fail where there is no usable GPU -
    // the DOM renderer draws instead of a blank pane. A lost context (a crashed
    // video driver) drops to the DOM renderer at once; see WebglKeeper.
    const drawn = terminal
    webgl = new WebglKeeper({
      element: el,
      create: () => new WebglAddon(),
      load: (addon) => drawn.loadAddon(addon),
      visible: () => hasSize(el),
      changed: () => {
        safeFit()
        drawn.refresh(0, drawn.rows - 1)
      },
    })

    term = terminal
    fit = fitAddon
    search = searchAddon

    // Size the terminal before attaching: the session's current screen arrives as
    // a snapshot on attach, and it should reflow into the pane's real width
    // rather than xterm's default 80x24.
    safeFit()

    const typed = new HeldInput()
    const send = (data: string): void => window.elecdex.pty.write(id, data)
    const ended = (): boolean => untrack(() => sessions.get(paneId).exited) !== null
    terminal.onData((data) => {
      if (!ended()) typed.type(data, send)
    })
    // Its shell has ended: a key starts a new one where it was. A key, not any data - a
    // program that died with focus or mouse reports on would restart it on a click (found in
    // review).
    terminal.onKey(() => {
      if (ended()) restart()
    })
    terminal.onBell(bell)
    detachClipboard = bindClipboard(terminal, el)
    const t = terminal
    /** The size the shell was last told, so a pane shown again can tell whether it is stale. */
    let told = ''
    const sendSize = (): void => {
      if (resizeTimer !== null) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resizeTimer = null
        // A pane hidden since the size was taken sends its real one when shown
        // (syncSize, from the fit); before the attach there is no shell to tell.
        if (disposed || !hasSize(el) || detach === null) return
        const size = `${t.cols}x${t.rows}`
        if (size === told) return
        told = size
        window.elecdex.pty.resize(id, t.cols, t.rows)
      }, PTY_RESIZE_SETTLE_MS)
    }
    terminal.onResize(sendSize)

    const decoder = new TextDecoder()
    let off: () => void
    try {
      off = await window.elecdex.pty.attach(id, {
        onData: (chunk) => {
          terminal?.write(decoder.decode(chunk, { stream: true }))
          // Assigned only when it changes: output comes many times a second. Not for what comes
          // first, the screen sent as the pane attaches (every tab behind another was marked
          // after a reload, found in review).
          if (watching && !untrack(() => visible) && !untrack(() => activity)) activity = true
        },
        onCwd: (cwd) => {
          sessions.patch(paneId, { cwd, integrationPending: false })
          recordFolder(cwd)
        },
        onCommandEnd: (exitCode, durationMs) =>
          sessions.patch(paneId, { lastCommand: { exitCode, durationMs } }),
        onIntegrationUnavailable: () => sessions.patch(paneId, { integrationPending: false }),
        onExit: (code, signal) => {
          sessions.patch(paneId, { exited: { code, signal } })
          terminal?.write(
            `\r\n\u001b[2m[process exited with code ${code} · press a key to start a new shell]\u001b[0m\r\n`,
          )
        },
      })
    } catch (cause) {
      // The pane went while it was reaching its shell, and the shell was reaped with it.
      if (disposed) return
      // Still here, and its shell gone before it could attach: say so in the pane rather than
      // leave it blank. (The reaper no longer ends a shell this young: see layout/reap.ts.)
      sessions.patch(paneId, { error: (cause as Error).message })
      return
    }

    if (disposed) {
      off()
      return
    }
    detach = off
    typed.release(send)
    // The screen it was sent on attaching has come by now; what comes after is the shell's.
    watchTimer = setTimeout(() => {
      watching = true
    }, ATTACH_SETTLE_MS)
    // Hidden before a new size had held, a pane once never told the shell: shown
    // again at that size, xterm reports no resize, and the shell went on
    // wrapping at the old width. Every fit of a shown pane checks.
    syncSize = () => {
      if (resizeTimer === null && `${t.cols}x${t.rows}` !== told) sendSize()
    }

    // Fit on container size changes rather than on a timer. The original
    // project re-fitted every 10 seconds from inside its data handler and
    // carried per-aspect-ratio fudge factors; an observer is exact and cheaper.
    observer = new ResizeObserver(() => safeFit())
    observer.observe(el)
    safeFit()
    // The fit above happened before the port existed, so the shell has not been
    // told this pane's size yet.
    sendSize()
  })()

  return () => {
    disposed = true
    syncSize = null
    if (resizeTimer !== null) clearTimeout(resizeTimer)
    if (watchTimer !== null) clearTimeout(watchTimer)
    observer?.disconnect()
    detach?.()
    detachClipboard?.()
    // Before the contexts are let go, or that would read as a loss to recover from.
    webgl?.dispose()
    webgl = null
    // Before dispose, which removes the canvases this has to find.
    releaseWebglContexts(el)
    terminal?.dispose()
    term = null
    fit = null
    search = null
    searchOpen = false
    // The session is deliberately NOT disposed here: unmounting a pane must not
    // kill the shell, or a reload would lose the user's work. Orphaned sessions
    // are reaped by the workspace once the layout has settled.
  }
})

/**
 * The shell the pane's state names, apart from the rest of the state: a cd changes the folder
 * and must not make the terminal again, but another saved layout's pane of the same id keeps
 * this one mounted and names its own shell (or none), which the pane then takes up. Untracking
 * the whole state lost that, and the pane went on showing the last layout's shell under a state
 * that named another (found in the full run after the review).
 */
const named = $derived(typeof paneState?.sessionId === 'string' ? paneState.sessionId : null)
$effect(() => {
  const wanted = named
  const shown = untrack(() => sessions.get(paneId).sessionId)
  if (shown !== null && wanted !== shown) generation += 1
})

/**
 * A new shell where the ended one was: the pane forgets its session and is made again, which
 * starts one in the folder kept beside it (lastFolder).
 */
function restart(): void {
  widgetState.patch(paneId, { sessionId: undefined })
  sessions.patch(paneId, {
    sessionId: null,
    exited: null,
    error: null,
    lastCommand: null,
    integrationPending: true,
  })
  generation += 1
}

// The shells' type size, from the settings (Ctrl+Shift+= and -): every terminal follows it.
$effect(() => {
  const size = appearance.settings.terminal.fontSize
  const t = term
  if (t === null || t.options.fontSize === size) return
  t.options.fontSize = size
  safeFit()
})

// The shortcut (Ctrl+Shift+K), answered by the pane that has the keyboard, remembered by number
// as find is: the scrollback goes, the line being typed stays.
let clearSeen = ui.shellClear
$effect(() => {
  const request = ui.shellClear
  const mine = active
  if (request === clearSeen) return
  clearSeen = request
  if (!mine || term === null) return
  term.clear()
  // Main's copy too: an attach (a move, a reload) would otherwise bring it all back.
  const id = sessions.get(paneId).sessionId
  if (id !== null) window.elecdex.pty.clearScrollback(id)
})

// A theme switch restyles the terminal in place: palette, and font if it changed.
$effect(() => {
  void appearance.revision
  const t = term
  const el = host
  if (t === null || el === null) return
  t.options.theme = buildXtermTheme(paletteFromCss(el), appearance.theme.terminal?.ansi)
  t.options.minimumContrastRatio = minimumContrastRatio(appearance.theme.mode)
  const family = monoFontFamily(el)
  if (t.options.fontFamily !== family) {
    t.options.fontFamily = family
    safeFit()
  }
})

// A hidden tab has zero size, so fitting it would compute nonsense dimensions.
$effect(() => {
  // Asked again from the keyboard (Ctrl+Shift+S) while already the focused pane.
  void ui.shellFocus
  // A concealed workspace cannot take focus, so try again once it is shown.
  if (!active || boot.concealed) return
  safeFit()
  term?.focus()
})

/**
 * PuTTY / Windows Terminal style clipboard: selecting text copies it, and a
 * right-click pastes. Ctrl+C stays the shell's interrupt, so there is no key to
 * copy with. Both go through navigator.clipboard, which main permits (window.ts).
 */
function bindClipboard(t: Terminal, el: HTMLElement): () => void {
  const selection = t.onSelectionChange(() => {
    // A match the search bar moved to is not a selection the user made.
    if (selectionIsSearch) return
    const text = t.getSelection()
    if (text !== '') void navigator.clipboard.writeText(text).catch(() => {})
  })
  // A selection the user makes starts with the mouse going down in the terminal.
  const press = (): void => {
    selectionIsSearch = false
  }
  el.addEventListener('mousedown', press)
  const paste = (event: MouseEvent): void => {
    event.preventDefault()
    t.focus()
    navigator.clipboard
      .readText()
      .then((text) => void pasteChecked(t, text))
      .catch(() => {})
  }
  el.addEventListener('contextmenu', paste)
  // The keyboard's paste (Ctrl+Shift+V, Shift+Insert) arrives as the textarea's paste event,
  // which xterm would pass straight in: taken here, through the same question.
  const keyPaste = (event: ClipboardEvent): void => {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    event.preventDefault()
    event.stopImmediatePropagation()
    void pasteChecked(t, text)
  }
  el.addEventListener('paste', keyPaste, true)
  return () => {
    selection.dispose()
    el.removeEventListener('mousedown', press)
    el.removeEventListener('contextmenu', paste)
    el.removeEventListener('paste', keyPaste, true)
  }
}

/** Pastes, asking first when the text has a line break and the settings ask (PasteDialog). */
async function pasteChecked(t: Terminal, text: string): Promise<void> {
  if (text === '') return
  if (pasteNeedsAsking(text, appearance.settings.terminal.confirmPaste)) {
    const go = await ui.askPaste({ lines: pasteLines(text), ...pastePreview(text) })
    t.focus()
    if (!go) return
  }
  t.paste(text)
}

// The shortcut (Ctrl+Shift+F), answered by the pane that has the keyboard. The
// number answered is remembered, so the bar does not open again every time this
// pane regains focus - and it is remembered whoever answered, so a later focus
// does not open a bar for a request that was another pane's.
let findSeen = ui.shellFind
$effect(() => {
  const request = ui.shellFind
  const mine = active
  if (request === findSeen) return
  findSeen = request
  if (!mine) return
  searchOpen = true
  searchFocus += 1
})

/** Moves the selection to a match, with the clipboard held back while it does. */
function runSearch(addon: SearchAddon, query: string, back: boolean, how: SearchHow): boolean {
  const el = host
  if (el === null) return true
  // The addon makes a RegExp of it unguarded: "(" half typed threw on every key (found in review).
  if (how.regex && !validPattern(query)) return false
  const options = {
    ...how,
    // Incremental only going forward: it expands the selection while the term is
    // still being typed, which is what the addon supports for findNext alone.
    incremental: !back,
    decorations: searchDecorations(paletteFromCss(el), appearance.theme.mode),
  }
  selectionIsSearch = true
  if (back) addon.findPrevious(query, options)
  else addon.findNext(query, options)
  return true
}

function closeSearch(): void {
  searchOpen = false
  // Stays set: clearing the decorations clears the selection too, and xterm
  // reports that change after this call rather than inside it.
  selectionIsSearch = true
  search?.clearDecorations()
  term?.focus()
}

/** A pane that is not displayed measures as zero; fitting it yields a nonsense size. */
function hasSize(el: HTMLElement): boolean {
  return el.clientWidth > 0 && el.clientHeight > 0
}

function safeFit(): void {
  if (host === null || !hasSize(host)) return
  // A pane coming back into view may take WebGL again after a lost context.
  webgl?.resume()
  try {
    fit?.fit()
  } catch {
    // No layout yet, or the pane is detached.
  }
  syncSize?.()
}
</script>

{#if info.error !== null}
  <p class="error" data-testid="terminal-error">{info.error}</p>
{:else}
  <div class="frame" data-bells={rung}>
    <div class="host" bind:this={host} data-testid="terminal-host"></div>
    {#if ringing}
      <div class="bell" aria-hidden="true" data-testid="terminal-bell"></div>
    {/if}
    {#if searchOpen && search !== null}
      {@const addon = search}
      <TerminalSearch
        {addon}
        find={(query, back, how) => runSearch(addon, query, back, how)}
        focusToken={searchFocus}
        onclose={closeSearch}
      />
    {/if}
  </div>
{/if}

<style>
/* The search bar is placed against this, over the terminal rather than beside
   it: a row of its own would change the pane's height and send a new size to
   the shell every time the bar opened. */
.frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.host {
  width: 100%;
  height: 100%;
  padding: var(--space-1) var(--space-2);
}

/* A bell: the pane's edge lit a moment, by opacity alone (never a colour in keyframes). */
.bell {
  position: absolute;
  inset: 0;
  z-index: 4;
  border: 2px solid var(--accent-strong);
  pointer-events: none;
  opacity: 0;
  animation: bell-flash 260ms ease-out;
}

@keyframes bell-flash {
  from {
    opacity: calc(0.9 * var(--motion-scale, 1) + 0.1);
  }
  to {
    opacity: 0;
  }
}

.error {
  padding: var(--space-4);
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
</style>
