/**
 * Every IPC channel name used by the app, in one place.
 *
 * `main`, `preload` and `renderer` all import from here so a renamed channel is
 * a compile error rather than a silent no-op.
 */
export const CH = {
  system: {
    info: 'system:info',
    openExternal: 'system:open-external',
    revealInFolder: 'system:reveal-in-folder',
    toggleDevTools: 'system:toggle-devtools',
    setFullscreen: 'system:set-fullscreen',
    toggleFullscreen: 'system:toggle-fullscreen',
    quit: 'system:quit',
    windowState: 'system:window-state',
    windowStateChanged: 'system:window-state-changed',
    setTitleBarColors: 'system:set-title-bar-colors',
  },
  layout: {
    load: 'layout:load',
    save: 'layout:save',
    reset: 'layout:reset',
    revealFile: 'layout:reveal-file',
  },
  metrics: {
    /** renderer -> main, fire and forget: start receiving a source. */
    subscribe: 'metrics:subscribe',
    unsubscribe: 'metrics:unsubscribe',
    /** main -> renderer: a MetricSample. */
    sample: 'metrics:sample',
    stats: 'metrics:stats',
  },
  settings: {
    get: 'settings:get',
    patch: 'settings:patch',
    openFile: 'settings:open-file',
    /** main -> renderer: the whole Settings object after any change. */
    changed: 'settings:changed',
  },
  themes: {
    list: 'themes:list',
    folder: 'themes:folder',
    /** main -> renderer: the theme catalog after a theme file changed. */
    changed: 'themes:changed',
  },
  updates: {
    status: 'updates:status',
    check: 'updates:check',
    /** main -> renderer: an UpdateStatus. */
    changed: 'updates:changed',
  },
  markets: {
    /** renderer -> main, fire and forget: keep a symbol's quote current. */
    subscribe: 'markets:subscribe',
    unsubscribe: 'markets:unsubscribe',
    /** main -> renderer: a MarketUpdate. */
    update: 'markets:update',
    watching: 'markets:watching',
  },
  launcher: {
    list: 'launcher:list',
    icon: 'launcher:icon',
    launch: 'launcher:launch',
  },
  fs: {
    readDir: 'fs:read-dir',
    diskUsage: 'fs:disk-usage',
    drives: 'fs:drives',
    /** renderer -> main, fire and forget: report changes to a directory. */
    watch: 'fs:watch',
    unwatch: 'fs:unwatch',
    /** main -> renderer: a watched directory changed. */
    changed: 'fs:changed',
  },
  weather: {
    /** renderer -> main, fire and forget: keep an office's forecast up to date. */
    subscribe: 'weather:subscribe',
    unsubscribe: 'weather:unsubscribe',
    /** main -> renderer: a WeatherUpdate. */
    update: 'weather:update',
    offices: 'weather:offices',
    watching: 'weather:watching',
  },
  pty: {
    create: 'pty:create',
    /** Renderer asks for the MessagePort of a session; main replies on `port`. */
    attach: 'pty:attach',
    /** main -> preload, carrying the transferred MessagePort. */
    port: 'pty:port',
    dispose: 'pty:dispose',
    list: 'pty:list',
  },
} as const

/**
 * Messages sent over a session's MessagePort.
 *
 * Output travels as `Uint8Array` in a `data` message rather than a string, so
 * nothing re-encodes the stream on the way through. Everything else is small
 * and infrequent.
 */
export type PtyPortMessage =
  | { t: 'data'; chunk: Uint8Array }
  | { t: 'exit'; code: number; signal: number | undefined }
  | { t: 'cwd'; cwd: string }
  | { t: 'commandEnd'; exitCode: number | null; durationMs: number }
  | { t: 'integrationUnavailable' }

/** Messages the renderer sends back up the same port. */
export type PtyPortRequest =
  | { t: 'write'; data: string }
  | { t: 'resize'; cols: number; rows: number }
