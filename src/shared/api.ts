import type { MixerCommand, MixerUpdate, SpectrumUpdate } from './audio.js'
import type { FeedUpdate } from './feeds.js'
import type { DirResult, DriveInfo } from './fs.js'
import type { LauncherEntry, LaunchResult } from './launcher.js'
import type { ChartRange, MarketUpdate } from './markets.js'
import type { MetricSample, MetricSourceId, MetricsStats } from './metrics.js'
import type { PluginCatalog } from './plugins.js'
import type { QuakeAlert, QuakeState } from './quakes.js'
import type { LayoutTree } from './schemas/layout.js'
import type { Settings, SettingsPatch } from './settings.js'
import type { Theme, ThemeProblem } from './theme.js'
import type { UpdateStatus } from './updates.js'
import type { OfficeInfo } from './weather.js'
import type { WeatherUpdate } from './weather-report.js'

/**
 * The single source of truth for the renderer <-> main boundary.
 *
 * The renderer has no Node access, no `@electron/remote` and no network origin
 * other than itself. Everything it can do off-thread goes through this surface,
 * which `preload` exposes on `window.elecdex` via `contextBridge`.
 *
 * Later phases extend this with `metrics`, `settings`, `theme`, `layout` and
 * `fs` - see docs/architecture.md section 4.2.
 */

export interface AppInfo {
  name: string
  version: string
  platform: NodeJS.Platform
  arch: string
  isPackaged: boolean
  versions: {
    electron: string
    chrome: string
    node: string
    v8: string
  }
  /** False when started with `--no-intro`: the boot sequence is skipped. */
  intro: boolean
  /** Facts about this machine, for the boot log and the greeting. */
  host: HostFacts
}

export interface HostFacts {
  /** Login name, or null where the OS will not say. */
  user: string | null
  /** The user's home directory, where a detached file browser starts. */
  home: string
  hostname: string
  osRelease: string
  cpuModel: string
  cpuThreads: number
  totalMemory: number
}

/**
 * What the boot log reports about the machine: all of it read from the OS and
 * Electron at the time, none of it invented. No network addresses: the log is on
 * screen for anyone looking.
 */
export interface MachineFacts {
  /** The OS's own name and version, e.g. "Windows 11 Pro", "10.0.26200". */
  kernel: { name: string; release: string; machine: string }
  /** The first processor's reported speed. */
  cpuSpeedMhz: number
  freeMemory: number
  /** The main process. */
  pid: number
  /** When the main process started, in ms since the epoch. */
  startedAt: number
  /** The command-line switches elecdex was started with, names only. */
  switches: string[]
  /** The volume holding the home folder: its root and sizes. */
  volume: { root: string; total: number; free: number } | null
  /** Network interfaces with an address beyond loopback, by name only. */
  network: string[]
  gpus: Array<{ vendorId: number; deviceId: number; name: string; driver: string }>
  displays: Array<{ width: number; height: number; hz: number; scale: number; internal: boolean }>
}

export interface WindowState {
  fullscreen: boolean
}

/** Colours for the window's own title bar controls, as #rrggbb. */
export interface TitleBarColors {
  background: string
  symbols: string
}

export interface SystemApi {
  /** The OS, known without a round trip: some controls exist only on some platforms. */
  readonly platform: NodeJS.Platform
  info(): Promise<AppInfo>
  machine(): Promise<MachineFacts>
  /** Opens a http(s) URL in the user's default browser. Rejects anything else. */
  openExternal(url: string): Promise<void>
  /** Reveals a path in the OS file manager. */
  revealInFolder(path: string): Promise<void>
  toggleDevTools(): void
  setFullscreen(on: boolean): void
  toggleFullscreen(): void
  /** Quits the app. Every shell is ended, as on any other exit. */
  quit(): void
  /**
   * Minimises the window, fullscreen or not. Windows and Linux only: macOS will
   * not minimise a fullscreen window, and there the native controls suffice.
   */
  minimize(): void
  windowState(): Promise<WindowState>
  /** Called when the window enters or leaves fullscreen. Returns an unsubscribe. */
  onWindowState(handler: (state: WindowState) => void): () => void
  /**
   * Paints the minimise/maximise/close controls (Windows, Linux) to match the
   * theme; the rest of the title bar is drawn by the page.
   */
  setTitleBarColors(colors: TitleBarColors): void
}

export interface PtyCreateOptions {
  /** Shell executable. Defaults to the platform shell. */
  shell?: string
  /** Extra arguments, appended after the shell-integration arguments. */
  args?: string[]
  cwd?: string
  cols?: number
  rows?: number
}

export interface PtySessionSummary {
  id: string
  shell: string
  /** Last reported working directory, or null before the first OSC 7. */
  cwd: string | null
  /** Whether an integration script was injected for this shell. */
  shellIntegration: boolean
  createdAt: number
}

export interface PtyHandlers {
  onData(chunk: Uint8Array): void
  onExit(code: number, signal: number | undefined): void
  onCwd(cwd: string): void
  onCommandEnd(exitCode: number | null, durationMs: number): void
  /**
   * Shell integration produced nothing - either the shell is not instrumented
   * or the script did not load. The UI should stop showing cwd as pending.
   */
  onIntegrationUnavailable(): void
}

export interface PtyApi {
  create(opts?: PtyCreateOptions): Promise<PtySessionSummary>
  /**
   * Subscribes to a session's output and events. Returns a detach function.
   *
   * Detaching does not kill the session - that is what makes a pane movable and
   * survivable across a window reload. Use `dispose` to actually end it.
   */
  attach(id: string, handlers: PtyHandlers): Promise<() => void>
  write(id: string, data: string): void
  resize(id: string, cols: number, rows: number): void
  dispose(id: string): Promise<void>
  list(): Promise<PtySessionSummary[]>
}

export interface LayoutApi {
  load(): Promise<LayoutTree>
  /** Persists the tree. Returns the normalised value that was actually written. */
  save(tree: LayoutTree): Promise<LayoutTree>
  reset(): Promise<LayoutTree>
  /** Absolute path of layout.json, for a "reveal in folder" action. */
  filePath(): Promise<string>
}

export interface SettingsApi {
  get(): Promise<Settings>
  /** Applies a partial change. Resolves with the settings actually in effect. */
  patch(patch: SettingsPatch): Promise<Settings>
  /** Called with the full settings after any change, including hand edits to the file. */
  onChange(handler: (settings: Settings) => void): () => void
  /** Opens settings.json in the user's editor. Resolves with an error message, or null. */
  openFile(): Promise<string | null>
  /**
   * Where a new shell starts under the current setting, and whether that is home
   * because the folder set is not one (missing, or not a folder).
   */
  startDirectory(): Promise<StartDirectory>
  /** Asks for a folder with the system's picker; resolves with it, or null when cancelled. */
  chooseStartDirectory(): Promise<string | null>
}

export interface StartDirectory {
  path: string
  fellBack: boolean
}

export interface UpdatesApi {
  status(): Promise<UpdateStatus>
  /** Checks GitHub now, whether or not the daily check is on. */
  check(): Promise<UpdateStatus>
  onChange(handler: (status: UpdateStatus) => void): () => void
}

export interface MarketsApi {
  /**
   * Keeps a symbol's quote and its chart over `range` current (about once a
   * minute). The handler gets the cached state at once and every update after.
   */
  subscribe(symbol: string, range: ChartRange, handler: (update: MarketUpdate) => void): () => void
  /** Diagnostics: symbols main is currently polling. */
  watching(): Promise<string[]>
  /** Diagnostics: the charts main is keeping, as "symbol|range". */
  charts(): Promise<string[]>
}

export interface FeedsApi {
  /**
   * Keeps an RSS or Atom feed's items current (every 15 minutes, or as the feed
   * asks, up to an hour). The URL must be in feedUrl's canonical form. The
   * handler gets the cached state at once and every update after.
   */
  subscribe(url: string, handler: (update: FeedUpdate) => void): () => void
  /** Diagnostics: feeds main is currently keeping up to date. */
  watching(): Promise<string[]>
}

export interface QuakesApi {
  /**
   * Keeps the earthquake list and tsunami state current while subscribed (a quakes pane). The
   * handler gets the current state at once and every change after. Returns an
   * unsubscribe.
   */
  subscribe(handler: (state: QuakeState) => void): () => void
  /**
   * Follows the list without keeping it current: the state now and every change,
   * which is empty and inactive unless alerts or a quakes pane keep it running.
   */
  observe(handler: (state: QuakeState) => void): () => void
  /** Earthquakes and a tsunami being announced, as they are decided in main. */
  onAlert(handler: (alert: QuakeAlert) => void): () => void
}

export interface LauncherApi {
  /** User entries from settings.json first, then the platform's applications. */
  list(): Promise<LauncherEntry[]>
  /** The entry's icon as a data: URL, or null. */
  icon(id: string): Promise<string | null>
  launch(id: string): Promise<LaunchResult>
}

export interface ThemeCatalog {
  themes: Theme[]
  /** Theme files that could not be used, and why. */
  problems: ThemeProblem[]
}

export interface ThemesApi {
  /** Built-in themes overlaid with those in the user's themes folder. */
  list(): Promise<ThemeCatalog>
  /** Absolute path of the user's themes folder. */
  folder(): Promise<string>
  onChange(handler: (catalog: ThemeCatalog) => void): () => void
}

export interface FsApi {
  /** Lists a directory. Paths must be absolute. */
  readDir(path: string): Promise<DirResult>
  drives(): Promise<DriveInfo[]>
  /**
   * Calls `handler` (debounced) when the directory's entries change. Returns a
   * function that stops watching. Watches are reference-counted per directory.
   */
  watch(path: string, handler: () => void): () => void
}

export interface WeatherApi {
  /**
   * Keeps the forecast for a location key (see locationKey in weather-report.ts)
   * current, from whichever source the key names. The handler gets the cached
   * state at once and every update after. Returns an unsubscribe.
   */
  subscribe(key: string, handler: (update: WeatherUpdate) => void): () => void
  /** JMA forecast offices, for choosing one in Japan. Fetched from JMA on first use. */
  offices(): Promise<OfficeInfo[]>
  /** Diagnostics: what main is currently keeping up to date (jma:office, met:..., nws:...). */
  watching(): Promise<string[]>
}

export interface MetricsApi {
  /**
   * Starts receiving a source. The handler gets the last known sample at once,
   * when there is one, and every new sample after. Returns an unsubscribe.
   *
   * Subscriptions are reference-counted: many widgets reading one source cost
   * one poll, and the source stops being polled when the last one unsubscribes.
   */
  subscribe<K extends MetricSourceId>(id: K, handler: (sample: MetricSample<K>) => void): () => void
  /** Diagnostics: what the collector is polling and how often it has run. */
  stats(): Promise<MetricsStats>
}

export interface AudioApi {
  /**
   * The spectrum of the system's output while a handler is subscribed: capture
   * starts with the first and stops with the last. The handler hears the capture's
   * status at once, then frames while there is sound.
   */
  spectrum(handler: (update: SpectrumUpdate) => void): () => void
  /**
   * Unmutes the monitor the spectrum records and sets it to 100%, after the pane
   * reported it `muted`. Only a page showing a spectrum may ask; Linux only.
   */
  restoreMonitor(): void
  /** The mixer's state and peak levels while a handler is subscribed. */
  mixer(handler: (update: MixerUpdate) => void): () => void
  /** Sets a channel's volume or mute; main checks the command against the channels it has. */
  mixerCommand(command: MixerCommand): void
}

export interface PluginsApi {
  catalog(): Promise<PluginCatalog>
  onChange(handler: (catalog: PluginCatalog) => void): () => void
  openFolder(): Promise<void>
  /** A GET for a plugin; main checks the URL and every redirect against the plugin's grant. */
  fetch(
    id: string,
    url: string,
    headers: Record<string, string> | undefined,
  ): Promise<
    | { ok: true; status: number; headers: Record<string, string>; body: string }
    | { ok: false; error: string }
  >
  storageLoad(id: string): Promise<Record<string, unknown>>
  /** One change to a plugin's storage; resolves false when it would be over the limit. */
  storageSet(id: string, key: string, value: unknown, remove: boolean): Promise<boolean>
  /** Opens the sign-in window for a session host; resolves when it is closed. */
  signIn(id: string, host: string): Promise<void>
  signOut(id: string): Promise<void>
  /** Closes the plugin's sign-in window, if one is open. */
  closeSignIn(id: string): void
  /**
   * Called with a plugin id when its sign-in session may have changed: the sign-in window
   * closed, its cookies changed while it was open, or the user signed out.
   */
  onSession(handler: (id: string) => void): () => void
  /** A system notification, shown only while no elecdex window is in front. */
  notify(id: string, message: { title: string; body?: string | undefined }): void
  /** Deletes the plugin's stored data and signs it out. */
  forget(id: string): Promise<void>
}

export interface ElecdexApi {
  system: SystemApi
  pty: PtyApi
  layout: LayoutApi
  metrics: MetricsApi
  fs: FsApi
  weather: WeatherApi
  settings: SettingsApi
  themes: ThemesApi
  launcher: LauncherApi
  markets: MarketsApi
  feeds: FeedsApi
  quakes: QuakesApi
  updates: UpdatesApi
  audio: AudioApi
  plugins: PluginsApi
}

declare global {
  interface Window {
    readonly elecdex: ElecdexApi
  }
}
