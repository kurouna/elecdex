import type { ElectronApplication, Page } from '@playwright/test'
import { pickerAnswers } from '../support/os.js'

/**
 * The table every contract runs over (docs/e2e-design.md, section 3.2): one row per built-in
 * widget of src/renderer/widgets/builtins.ts. tests/unit/e2e-contracts.test.ts holds it to the
 * registry, so a widget added there and not here fails before any e2e runs.
 *
 * A row says what only the running app can show about the pane in general: what main does for
 * it while it is seen (its footprint), what it keeps doing unseen, and how to put it to work.
 * What is particular to one pane stays in that pane's spec.
 */

/** What main is doing for the pages, as the contracts compare it. */
export interface Footprint {
  /** The metric sources the collector is polling. */
  metrics: string[]
  /** Each main module's `watching()`, by name. */
  weather: string[]
  markets: string[]
  feeds: string[]
  orbits: string[]
  git: string[]
  agents: string[]
  clipboard: string[]
  nowPlaying: string[]
  docker: string[]
  logwatch: string[]
  /** The earthquake list is being kept current (`quakes.observe`'s `active`). */
  quakes: boolean
  /** The hidden capture window of the spectrum is open. */
  capture: boolean
}

/** What a seen pane adds to the footprint: sources it reads, modules that watch for it. */
export interface Seen {
  metrics?: string[]
  modules?: (keyof Omit<Footprint, 'metrics' | 'quakes' | 'capture'>)[]
  quakes?: true
  capture?: true
}

/** What the world gives the contracts' app: a repository, a Claude folder, a log, a feed. */
export interface World {
  repo: string
  log: string
}

export interface PaneRow {
  widget: string
  /** Pane state to start from (a feed for RSS). */
  state?: Record<string, unknown>
  /** What main does for it while it is seen; absent for a pane that is the page's alone. */
  seen?: Seen
  /** Sources it keeps behind a tab (builtins.ts `keepWhileHidden`). */
  kept?: string[]
  /**
   * What goes on while it is not seen, and why (CLAUDE.md, Subscriptions): checked by the
   * contract where a check is written, otherwise named so no contract expects it to stop.
   */
  goesOn?: string
  /** Puts the pane to work once it is first shown (choose a repository, a log). */
  work?: (app: ElectronApplication, page: Page, world: World) => Promise<void>
  /** builtins.ts `popup: true`. */
  popup: boolean
  /** builtins.ts `zoom`. */
  zoom: 'full' | 'panel' | null
}

const FEED = 'http://127.0.0.1:9/feed.xml'

/** Answers main's next file or folder picker with `answer`, then presses `button` in the pane. */
async function pick(app: ElectronApplication, page: Page, answer: string, button: string) {
  await pickerAnswers(app, answer)
  await page.locator(`[data-testid=pane]:not(.hidden) [data-testid=${button}]`).click()
}

export const PANES: PaneRow[] = [
  {
    widget: 'terminal',
    goesOn: 'its shell: a session runs behind a tab and in a minimised window',
    popup: false,
    zoom: 'full',
  },
  { widget: 'clock', popup: true, zoom: 'full' },
  {
    widget: 'sysinfo',
    seen: { metrics: ['os.uptime', 'os.info', 'power.battery', 'hardware.system'] },
    kept: ['os.info', 'hardware.system'],
    popup: true,
    zoom: null,
  },
  {
    widget: 'cpu',
    seen: { metrics: ['cpu.info', 'cpu.load', 'cpu.speed', 'cpu.temperature', 'proc.list'] },
    kept: ['cpu.info', 'cpu.load'],
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'memory',
    seen: { metrics: ['mem.usage', 'mem.swap'] },
    kept: ['mem.usage', 'mem.swap'],
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'gpu',
    seen: { metrics: ['gpu.usage'] },
    kept: ['gpu.usage'],
    popup: true,
    zoom: 'full',
  },
  { widget: 'disk', seen: { metrics: ['disk.volumes', 'disk.io'] }, popup: true, zoom: 'panel' },
  { widget: 'toplist', seen: { metrics: ['proc.list'] }, popup: true, zoom: 'panel' },
  { widget: 'netstat', seen: { metrics: ['net.interface', 'net.ping'] }, popup: true, zoom: null },
  { widget: 'connections', seen: { metrics: ['net.sockets'] }, popup: true, zoom: 'full' },
  { widget: 'wifi', seen: { metrics: ['net.wifi', 'net.wifi.events'] }, popup: true, zoom: 'full' },
  { widget: 'ethernet', seen: { metrics: ['net.ethernet'] }, popup: true, zoom: 'full' },
  {
    widget: 'throughput',
    seen: { metrics: ['net.throughput', 'net.ping'] },
    kept: ['net.throughput'],
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'cluster',
    seen: {
      metrics: [
        'cpu.load',
        'mem.usage',
        'net.throughput',
        'disk.io',
        'net.ping',
        'net.interface',
        'mem.swap',
        'disk.volumes',
        'net.connections',
        'proc.list',
        'power.battery',
        'os.uptime',
        'os.info',
        'hardware.system',
        'cpu.info',
        'gpu.usage',
      ],
    },
    kept: [
      'cpu.load',
      'mem.usage',
      'gpu.usage',
      'net.throughput',
      'os.info',
      'hardware.system',
      'cpu.info',
    ],
    popup: true,
    zoom: 'full',
  },
  { widget: 'filesystem', popup: false, zoom: 'full' },
  { widget: 'weather', seen: { modules: ['weather'] }, popup: true, zoom: 'full' },
  {
    widget: 'globe',
    seen: { metrics: ['net.connections', 'net.ping'] },
    popup: true,
    zoom: 'full',
  },
  { widget: 'launcher', popup: true, zoom: 'full' },
  { widget: 'markets', seen: { modules: ['markets'] }, popup: true, zoom: 'full' },
  {
    widget: 'aichat',
    goesOn: 'an answer being written (main finishes it; aichat.spec follows one through a reload)',
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'elec',
    goesOn: 'a council sitting (main runs it to its end; elec.spec)',
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'git',
    seen: { modules: ['git'] },
    work: (app, page, world) => pick(app, page, world.repo, 'git-select'),
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'logwatch',
    seen: { modules: ['logwatch'] },
    work: (app, page, world) => pick(app, page, world.log, 'logwatch-select'),
    popup: true,
    zoom: 'full',
  },
  { widget: 'agents', seen: { modules: ['agents'] }, popup: true, zoom: 'full' },
  { widget: 'docker', seen: { modules: ['docker'] }, popup: true, zoom: 'full' },
  { widget: 'orbit', seen: { modules: ['orbits'] }, popup: true, zoom: 'full' },
  {
    widget: 'rss',
    state: { feeds: [FEED] },
    seen: { modules: ['feeds'] },
    popup: true,
    zoom: 'full',
  },
  {
    widget: 'quakes',
    seen: { quakes: true },
    goesOn: 'quake alerts, when they are on (main keeps the list for them; quakes.spec)',
    popup: true,
    zoom: 'full',
  },
  { widget: 'calendar', popup: true, zoom: 'full' },
  { widget: 'spectrum', seen: { capture: true }, popup: true, zoom: 'full' },
  { widget: 'mixer', popup: true, zoom: 'panel' },
  { widget: 'nowplaying', seen: { modules: ['nowPlaying'] }, popup: true, zoom: 'panel' },
  {
    widget: 'utility',
    goesOn: "AWAKE's hold, which is main's and outlives every pane (utility.spec)",
    popup: true,
    zoom: 'panel',
  },
  { widget: 'chip8', popup: false, zoom: 'full' },
  { widget: 'elec16', popup: false, zoom: 'full' },
  { widget: 'calc', popup: true, zoom: 'panel' },
  { widget: 'notes', popup: true, zoom: 'full' },
  { widget: 'todo', popup: true, zoom: 'full' },
  { widget: 'clipboard', seen: { modules: ['clipboard'] }, popup: true, zoom: 'full' },
  {
    widget: 'timer',
    goesOn: 'a running countdown, stopwatch or alarm (main waits on one setTimeout; desk.spec)',
    popup: false,
    zoom: 'panel',
  },
]

/** The row of `widget`. */
export function row(widget: string): PaneRow {
  const found = PANES.find((r) => r.widget === widget)
  if (found === undefined) throw new Error(`no contract row for ${widget}`)
  return found
}

/** Every metric source some pane keeps behind a tab, sorted: what a group of all of them keeps. */
export const ALL_KEPT = [...new Set(PANES.flatMap((r) => r.kept ?? []))].sort()
