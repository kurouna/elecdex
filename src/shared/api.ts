import type { DirResult, DiskUsage, DriveInfo } from './fs.js'
import type { LauncherEntry, LaunchResult } from './launcher.js'
import type { MarketUpdate } from './markets.js'
import type { MetricSample, MetricSourceId, MetricsStats } from './metrics.js'
import type { LayoutTree } from './schemas/layout.js'
import type { Settings, SettingsPatch } from './settings.js'
import type { Theme, ThemeProblem } from './theme.js'
import type { OfficeInfo, WeatherUpdate } from './weather.js'

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

export interface SystemApi {
  info(): Promise<AppInfo>
  /** Opens a http(s) URL in the user's default browser. Rejects anything else. */
  openExternal(url: string): Promise<void>
  /** Reveals a path in the OS file manager. */
  revealInFolder(path: string): Promise<void>
  toggleDevTools(): void
  setFullscreen(on: boolean): void
  toggleFullscreen(): void
  /** Quits the app. Every shell is ended, as on any other exit. */
  quit(): void
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
}

export interface MarketsApi {
  /**
   * Keeps a symbol's quote and intraday series current (about once a minute).
   * The handler gets the cached state at once and every update after.
   */
  subscribe(symbol: string, handler: (update: MarketUpdate) => void): () => void
  /** Diagnostics: symbols main is currently polling. */
  watching(): Promise<string[]>
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
  /** Usage of the volume holding a path, or null if it cannot be read. */
  diskUsage(path: string): Promise<DiskUsage | null>
  drives(): Promise<DriveInfo[]>
  /**
   * Calls `handler` (debounced) when the directory's entries change. Returns a
   * function that stops watching. Watches are reference-counted per directory.
   */
  watch(path: string, handler: () => void): () => void
}

export interface WeatherApi {
  /**
   * Keeps an office's JMA forecast current. The handler gets the cached state at
   * once and every update after. Returns an unsubscribe.
   */
  subscribe(office: string, handler: (update: WeatherUpdate) => void): () => void
  /** Forecast offices, for choosing one. Fetched from JMA on first use. */
  offices(): Promise<OfficeInfo[]>
  /** Diagnostics: offices main is currently keeping up to date. */
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
}

declare global {
  interface Window {
    readonly elecdex: ElecdexApi
  }
}
