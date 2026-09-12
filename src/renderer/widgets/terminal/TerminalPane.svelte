<script lang="ts">
import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import type { Tab } from '../../stores/sessions.svelte.ts'
import { sessions } from '../../stores/sessions.svelte.ts'
import './xterm-css.ts'
import { buildXtermTheme, monoFontFamily, paletteFromCss } from './xterm-theme.ts'

interface Props {
  tab: Tab
  /** Only the visible pane is fitted and focused. */
  active: boolean
}

const { tab, active }: Props = $props()

let host = $state<HTMLDivElement | null>(null)
let term: Terminal | null = null
let fit: FitAddon | null = null
let detach: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

$effect(() => {
  const el = host
  const id = tab.sessionId
  if (el === null || id === null) return

  const terminal = new Terminal({
    allowProposedApi: true,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 10_000,
    fontFamily: monoFontFamily(el),
    fontSize: 14,
    lineHeight: 1.15,
    letterSpacing: 0,
    // xterm's own bell is a no-op we do not want; audio comes from our SFX layer.
    theme: buildXtermTheme(paletteFromCss(el)),
  })

  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(new ClipboardAddon())

  const unicode = new Unicode11Addon()
  terminal.loadAddon(unicode)
  terminal.unicode.activeVersion = '11'

  terminal.open(el)

  // WebGL must be loaded after open(), and can fail on a machine with no usable
  // GPU - fall back to the DOM renderer rather than showing a blank pane.
  try {
    const webgl = new WebglAddon()
    webgl.onContextLoss(() => webgl.dispose())
    terminal.loadAddon(webgl)
  } catch {
    // DOM renderer it is.
  }

  term = terminal
  fit = fitAddon

  terminal.onData((data) => window.elecdex.pty.write(id, data))
  terminal.onResize(({ cols, rows }) => window.elecdex.pty.resize(id, cols, rows))

  const decoder = new TextDecoder()
  let cancelled = false

  window.elecdex.pty
    .attach(id, {
      onData: (chunk) => terminal.write(decoder.decode(chunk, { stream: true })),
      onCwd: (cwd) => {
        const t = sessions.find(tab.key)
        if (t) {
          t.cwd = cwd
          t.integrationPending = false
        }
      },
      onCommandEnd: (exitCode, durationMs) => {
        const t = sessions.find(tab.key)
        if (t) t.lastCommand = { exitCode, durationMs }
      },
      onIntegrationUnavailable: () => {
        const t = sessions.find(tab.key)
        if (t) t.integrationPending = false
      },
      onExit: (code, signal) => {
        const t = sessions.find(tab.key)
        if (t) t.exited = { code, signal }
        terminal.write(`\r\n\u001b[2m[process exited with code ${code}]\u001b[0m\r\n`)
      },
    })
    .then((off) => {
      if (cancelled) off()
      else detach = off
    })
    .catch((cause: unknown) => {
      const t = sessions.find(tab.key)
      if (t) t.error = cause instanceof Error ? cause.message : String(cause)
    })

  // Fit on container size changes rather than on a timer. The original project
  // re-fitted every 10 seconds from the data handler and carried per-aspect-ratio
  // fudge factors; a ResizeObserver is both exact and cheaper.
  resizeObserver = new ResizeObserver(() => {
    if (el.clientWidth > 0 && el.clientHeight > 0) safeFit()
  })
  resizeObserver.observe(el)

  return () => {
    cancelled = true
    resizeObserver?.disconnect()
    resizeObserver = null
    detach?.()
    detach = null
    terminal.dispose()
    term = null
    fit = null
  }
})

// Fit and focus when this pane becomes the visible one: a hidden pane has zero
// size, so fitting it would compute nonsense dimensions.
$effect(() => {
  if (!active) return
  safeFit()
  term?.focus()
})

function safeFit(): void {
  try {
    fit?.fit()
  } catch {
    // The pane is detached or has no layout yet.
  }
}
</script>

<div class="pane" class:active>
  {#if tab.error !== null}
    <p class="error" data-testid="terminal-error">{tab.error}</p>
  {:else}
    <div class="host" bind:this={host} data-testid="terminal-host"></div>
  {/if}
</div>

<style>
.pane {
  position: absolute;
  inset: 0;
  display: none;
  padding: var(--space-2);
}

.pane.active {
  display: block;
}

.host {
  width: 100%;
  height: 100%;
}

.error {
  padding: var(--space-4);
  color: var(--danger);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
</style>
