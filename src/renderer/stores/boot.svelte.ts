import type { AppInfo } from '@shared/api'
import { collectPanes } from '@shared/layout-ops'
import { METRIC_SOURCE_IDS } from '@shared/metrics'
import { type BootLine, bootLog, lineDelay, revealDelays } from '../lib/boot-sequence.ts'
import { listWidgets, resolveWidget } from '../widgets/registry.ts'
import { appearance } from './appearance.svelte.ts'
import { layout } from './layout.svelte.ts'
import { sfx } from './sound.svelte.ts'

/**
 * The boot sequence, modelled on eDEX-UI's: a scrolling boot log, the title
 * card, then the workspace powering on pane by pane like a bank of CRTs.
 *
 * The workspace is mounted from the very start, underneath and invisible, so
 * shells are already running and metrics already flowing by the time the panes
 * are shown - the sequence costs the user no startup time beyond its own length,
 * and any key or click skips the rest of it.
 */

export type BootPhase =
  /** Not yet known whether to play; the workspace stays hidden. */
  | 'pending'
  | 'log'
  | 'title'
  /** Panes are powering on. */
  | 'reveal'
  | 'done'

/** How long the title card holds, and when its parts change. */
export const TITLE_TIMING = { glitchAt: 650, glitchFor: 500, greetAt: 1150, offAt: 2100, end: 2450 }

/** How long one pane's power-on runs; a shell's is longer, as the main screen. */
export const CRT_MODULE_MS = 650
export const CRT_SHELL_MS = 900

/** Remembers, per window, that the intro has played, so a reload does not replay it. */
const PLAYED_KEY = 'elecdex.intro-played'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

class BootStore {
  phase = $state<BootPhase>('pending')
  lines = $state<BootLine[]>([])
  greeting = $state('')
  /** Title card sub-state, for the glitch and the greeting. */
  title = $state<{ glitch: boolean; greet: boolean; off: boolean }>({
    glitch: false,
    greet: false,
    off: false,
  })

  private delays = $state.raw(new Map<string, number>())
  private cancelled = false

  /** True while the workspace must not be seen yet. */
  get concealed(): boolean {
    return this.phase === 'pending' || this.phase === 'log' || this.phase === 'title'
  }

  /** Milliseconds into the reveal at which this pane powers on, or null outside it. */
  delayFor(paneId: string): number | null {
    if (this.phase !== 'reveal') return null
    return this.delays.get(paneId) ?? 0
  }

  async run(info: AppInfo): Promise<void> {
    if (!shouldPlay(info)) {
      this.finish()
      return
    }
    markPlayed()

    this.greeting = info.host.user ? `Welcome back, ${info.host.user}` : 'Welcome back'

    // Wait for the layout so the log can describe it and the reveal can order it.
    while (!layout.loaded && !this.cancelled) await wait(25)
    if (this.cancelled) return

    await this.playLog(info)
    if (this.cancelled) return
    await this.playTitle()
    if (this.cancelled) return
    await this.playReveal()
  }

  /** Jumps straight to the finished workspace. */
  skip(): void {
    if (this.phase === 'done') return
    this.cancelled = true
    this.finish()
  }

  private async playLog(info: AppInfo): Promise<void> {
    this.phase = 'log'
    const log = bootLog({
      info,
      now: new Date(),
      panes: layout.panes.map((p) => p.widget),
      widgets: listWidgets().map((w) => w.id),
      metricSources: METRIC_SOURCE_IDS.length,
    })
    for (const [index, line] of log.entries()) {
      if (this.cancelled) return
      this.lines = [...this.lines, line]
      sfx.play(line.text === 'Boot Complete' ? 'granted' : 'stdout')
      await wait(lineDelay(line, index, log.length))
    }
  }

  private async playTitle(): Promise<void> {
    // The title is set in the display face; do not let it flash in a fallback.
    await Promise.race([document.fonts.ready, wait(800)])
    this.lines = []
    this.phase = 'title'
    sfx.play('title')
    const t = TITLE_TIMING
    await wait(t.glitchAt)
    if (this.cancelled) return
    this.title = { ...this.title, glitch: true }
    sfx.play('glitch')
    await wait(t.glitchFor)
    this.title = { ...this.title, glitch: false }
    await wait(t.greetAt - t.glitchAt - t.glitchFor)
    this.title = { ...this.title, greet: true }
    await wait(t.offAt - t.greetAt)
    this.title = { ...this.title, off: true }
    await wait(t.end - t.offAt)
  }

  private async playReveal(): Promise<void> {
    const isShell = (widget: string) => resolveWidget(widget)?.chrome === 'shell'
    this.delays = revealDelays(layout.tree.root, isShell)
    this.phase = 'reveal'
    this.playRevealSounds()

    let end = 0
    for (const node of collectPanes(layout.tree.root)) {
      const duration = isShell(node.widget) ? CRT_SHELL_MS : CRT_MODULE_MS
      end = Math.max(end, (this.delays.get(node.id) ?? 0) + duration)
    }
    await wait(end + 50)
    if (!this.cancelled) this.finish()
  }

  /** One sound per moment something powers on: the shell opening, then each row. */
  private playRevealSounds(): void {
    const shells = new Set<number>()
    const rows = new Set<number>()
    for (const node of collectPanes(layout.tree.root)) {
      const delay = this.delays.get(node.id) ?? 0
      if (resolveWidget(node.widget)?.chrome === 'shell') shells.add(delay)
      else rows.add(delay)
    }
    for (const delay of shells) setTimeout(() => !this.cancelled && sfx.play('expand'), delay)
    for (const delay of rows) setTimeout(() => !this.cancelled && sfx.play('panel'), delay)
  }

  private finish(): void {
    this.phase = 'done'
    this.lines = []
  }
}

function shouldPlay(info: AppInfo): boolean {
  if (!info.intro) return false
  if (appearance.reducedMotion) return false
  try {
    return window.sessionStorage.getItem(PLAYED_KEY) === null
  } catch {
    return true
  }
}

function markPlayed(): void {
  try {
    window.sessionStorage.setItem(PLAYED_KEY, '1')
  } catch {
    // Storage unavailable: the intro will simply play again on reload.
  }
}

export const boot = new BootStore()
