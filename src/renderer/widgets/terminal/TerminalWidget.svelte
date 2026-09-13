<script lang="ts">
import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { appearance } from '../../stores/appearance.svelte.ts'
import { boot } from '../../stores/boot.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sessions, shellName } from '../../stores/sessions.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import './xterm-css.ts'
import { buildXtermTheme, monoFontFamily, paletteFromCss } from './xterm-theme.ts'

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
let term: Terminal | null = null
let fit: FitAddon | null = null

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
  paneMeta.set(paneId, {
    title: info.shell,
    ...(info.cwd !== null
      ? { subtitle: info.cwd }
      : { subtitle: info.integrationPending ? '…' : 'no tracking' }),
    ...(info.exited !== null
      ? { badge: `exited ${info.exited.code}`, badgeKind: 'warn' as const }
      : info.lastCommand !== null &&
          info.lastCommand.exitCode !== null &&
          info.lastCommand.exitCode !== 0
        ? { badge: String(info.lastCommand.exitCode), badgeKind: 'danger' as const }
        : {}),
  })
})

$effect(() => {
  const el = host
  if (el === null) return

  let disposed = false
  let detach: (() => void) | null = null
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
      fontFamily: monoFontFamily(el),
      fontSize: 13,
      lineHeight: 1.15,
      theme: buildXtermTheme(paletteFromCss(el), appearance.theme.terminal?.ansi),
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new ClipboardAddon())

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

    // Size the terminal before attaching: the session's current screen arrives as
    // a snapshot on attach, and it should reflow into the pane's real width
    // rather than xterm's default 80x24.
    safeFit()

    terminal.onData((data) => window.elecdex.pty.write(id, data))
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
    const off = await window.elecdex.pty.attach(id, {
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
    terminal?.dispose()
    term = null
    fit = null
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
  const family = monoFontFamily(el)
  if (t.options.fontFamily !== family) {
    t.options.fontFamily = family
    safeFit()
  }
})

// A hidden tab has zero size, so fitting it would compute nonsense dimensions.
$effect(() => {
  // A concealed workspace cannot take focus, so try again once it is shown.
  if (!active || boot.concealed) return
  safeFit()
  term?.focus()
})

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
  <div class="host" bind:this={host} data-testid="terminal-host"></div>
{/if}

<style>
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
