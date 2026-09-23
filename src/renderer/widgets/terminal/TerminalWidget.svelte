<script lang="ts">
import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { displayPath } from '../../layout/tab-labels.ts'
import { releaseWebglContexts } from '../../lib/webgl.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { boot } from '../../stores/boot.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sessions, shellName } from '../../stores/sessions.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import TerminalSearch from './TerminalSearch.svelte'
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
const { paneId, state: paneState, active }: WidgetProps = $props()

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

let host = $state<HTMLDivElement | null>(null)
// State, so the focus effect below runs again once the terminal exists: at startup
// the pane is already active before its session has been created.
let term = $state.raw<Terminal | null>(null)
let fit: FitAddon | null = null
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
 * Adopts a session: reuses the one recorded in the pane's layout state when it
 * is still alive, otherwise creates one. This is what makes a pane survive a
 * window reload with its shell intact.
 */
async function adoptSession(): Promise<string | null> {
  const recorded = typeof paneState?.sessionId === 'string' ? paneState.sessionId : null

  if (recorded !== null) {
    const alive = await window.elecdex.pty.list()
    const found = alive.find((s) => s.id === recorded)
    if (found) {
      sessions.patch(paneId, {
        sessionId: found.id,
        shell: shellName(found.shell),
        cwd: found.cwd,
      })
      return found.id
    }
  }

  try {
    const created = await window.elecdex.pty.create({})
    sessions.patch(paneId, {
      sessionId: created.id,
      shell: shellName(created.shell),
      cwd: created.cwd,
    })
    layout.setPaneState(paneId, { sessionId: created.id })
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
    ...(info.exited !== null
      ? { badge: `exited ${info.exited.code}`, badgeKind: 'warn' as const }
      : // 表示を無効化: コマンド終了コードのバッジ表示
        // : info.lastCommand !== null &&
        //     info.lastCommand.exitCode !== null &&
        //     info.lastCommand.exitCode !== 0
        //   ? { badge: String(info.lastCommand.exitCode), badgeKind: 'danger' as const }
        {}),
  })
})

$effect(() => {
  const el = host
  if (el === null) return

  let disposed = false
  let detach: (() => void) | null = null
  let detachClipboard: (() => void) | null = null
  let terminal: Terminal | null = null
  let observer: ResizeObserver | null = null
  let resizeTimer: ReturnType<typeof setTimeout> | null = null

  void (async () => {
    const id = await adoptSession()
    if (id === null || disposed) return

    terminal = new Terminal({
      allowProposedApi: true,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10_000,
      // Right-click pastes (below), so it must not also select a word first.
      rightClickSelectsWord: false,
      fontFamily: monoFontFamily(el),
      fontSize: 13,
      lineHeight: 1.15,
      theme: buildXtermTheme(paletteFromCss(el), appearance.theme.terminal?.ansi),
      minimumContrastRatio: minimumContrastRatio(appearance.theme.mode),
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new ClipboardAddon())

    const searchAddon = new SearchAddon()
    terminal.loadAddon(searchAddon)

    // A link goes to the user's browser, never into a pane: what a shell prints
    // is not a site elecdex chose to show. main refuses anything but http(s).
    terminal.loadAddon(
      new WebLinksAddon((_event, uri) => void window.elecdex.system.openExternal(uri)),
    )

    const unicode = new Unicode11Addon()
    terminal.loadAddon(unicode)
    terminal.unicode.activeVersion = '11'

    terminal.open(el)

    // WebGL must load after open(), and can fail where there is no usable GPU -
    // fall back to the DOM renderer rather than showing a blank pane.
    try {
      const webgl = new WebglAddon()
      webgl.onContextLoss(() => webgl.dispose())
      terminal.loadAddon(webgl)
    } catch {
      // DOM renderer it is.
    }

    term = terminal
    fit = fitAddon
    search = searchAddon

    // Size the terminal before attaching: the session's current screen arrives as
    // a snapshot on attach, and it should reflow into the pane's real width
    // rather than xterm's default 80x24.
    safeFit()

    terminal.onData((data) => window.elecdex.pty.write(id, data))
    detachClipboard = bindClipboard(terminal, el)
    const t = terminal
    const sendSize = (): void => {
      if (resizeTimer !== null) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resizeTimer = null
        // A pane hidden since the size was taken will send its real one when shown.
        if (!disposed && hasSize(el)) window.elecdex.pty.resize(id, t.cols, t.rows)
      }, PTY_RESIZE_SETTLE_MS)
    }
    terminal.onResize(sendSize)

    const decoder = new TextDecoder()
    let off: () => void
    try {
      off = await window.elecdex.pty.attach(id, {
        onData: (chunk) => terminal?.write(decoder.decode(chunk, { stream: true })),
        onCwd: (cwd) => sessions.patch(paneId, { cwd, integrationPending: false }),
        onCommandEnd: (exitCode, durationMs) =>
          sessions.patch(paneId, { lastCommand: { exitCode, durationMs } }),
        onIntegrationUnavailable: () => sessions.patch(paneId, { integrationPending: false }),
        onExit: (code, signal) => {
          sessions.patch(paneId, { exited: { code, signal } })
          terminal?.write(`\r\n\u001b[2m[process exited with code ${code}]\u001b[0m\r\n`)
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
    if (resizeTimer !== null) clearTimeout(resizeTimer)
    observer?.disconnect()
    detach?.()
    detachClipboard?.()
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
      .then((text) => {
        if (text !== '') t.paste(text)
      })
      .catch(() => {})
  }
  el.addEventListener('contextmenu', paste)
  return () => {
    selection.dispose()
    el.removeEventListener('mousedown', press)
    el.removeEventListener('contextmenu', paste)
  }
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
function runSearch(addon: SearchAddon, query: string, back: boolean): void {
  const el = host
  if (el === null) return
  const options = {
    // Incremental only going forward: it expands the selection while the term is
    // still being typed, which is what the addon supports for findNext alone.
    incremental: !back,
    decorations: searchDecorations(paletteFromCss(el), appearance.theme.mode),
  }
  selectionIsSearch = true
  if (back) addon.findPrevious(query, options)
  else addon.findNext(query, options)
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
  try {
    fit?.fit()
  } catch {
    // No layout yet, or the pane is detached.
  }
}
</script>

{#if info.error !== null}
  <p class="error" data-testid="terminal-error">{info.error}</p>
{:else}
  <div class="frame">
    <div class="host" bind:this={host} data-testid="terminal-host"></div>
    {#if searchOpen && search !== null}
      {@const addon = search}
      <TerminalSearch
        {addon}
        find={(query, back) => runSearch(addon, query, back)}
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

.error {
  padding: var(--space-4);
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
</style>
