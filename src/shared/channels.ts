/**
 * Every IPC channel name used by the app, in one place.
 *
 * `main`, `preload` and `renderer` all import from here so a renamed channel is
 * a compile error rather than a silent no-op.
 */
export const CH = {
  system: {
    info: 'system:info',
    /** Facts about the machine for the boot log (MachineFacts); slower than info. */
    machine: 'system:machine',
    openExternal: 'system:open-external',
    revealInFolder: 'system:reveal-in-folder',
    toggleDevTools: 'system:toggle-devtools',
    setFullscreen: 'system:set-fullscreen',
    toggleFullscreen: 'system:toggle-fullscreen',
    quit: 'system:quit',
    closeWindow: 'system:close-window',
    minimize: 'system:minimize',
    windowState: 'system:window-state',
    windowStateChanged: 'system:window-state-changed',
    setTitleBarColors: 'system:set-title-bar-colors',
  },
  /** Running in the background (Windows): sign-in launch, the system-wide shortcut. */
  background: {
    state: 'background:state',
    /** main -> renderer: the state changed (BackgroundState). */
    changed: 'background:changed',
    setLaunchAtLogin: 'background:set-launch-at-login',
    /** renderer -> main: hold the system-wide shortcut while the settings record new keys. */
    suspendShortcut: 'background:suspend-shortcut',
    /** main -> renderer: the notification-area menu asked for the settings. */
    openSettings: 'background:open-settings',
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
    /** The folder a new shell starts in, as main resolves the setting now. */
    startDirectory: 'settings:start-directory',
    /** Opens the system's folder picker for the start directory. */
    chooseStartDirectory: 'settings:choose-start-directory',
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
    /** renderer -> main, fire and forget: keep a chart (chartKey: symbol and range) current. */
    subscribe: 'markets:subscribe',
    unsubscribe: 'markets:unsubscribe',
    /** main -> renderer: a MarketUpdate. */
    update: 'markets:update',
    watching: 'markets:watching',
    charts: 'markets:charts',
  },
  feeds: {
    /** renderer -> main, fire and forget: keep a feed's items current. */
    subscribe: 'feeds:subscribe',
    unsubscribe: 'feeds:unsubscribe',
    /** main -> renderer: a FeedUpdate. */
    update: 'feeds:update',
    watching: 'feeds:watching',
  },
  quakes: {
    /** renderer -> main, fire and forget: a quakes pane wants the list kept current. */
    subscribe: 'quakes:subscribe',
    unsubscribe: 'quakes:unsubscribe',
    /** The current QuakeState, without keeping anything alive. */
    state: 'quakes:state',
    /** main -> renderer: a QuakeState, whenever it changes. */
    update: 'quakes:update',
    /** main -> renderer: earthquakes and a tsunami to announce (QuakeAlert). */
    alert: 'quakes:alert',
  },
  audio: {
    /** renderer -> main, fire and forget: a spectrum pane is showing. */
    spectrumSubscribe: 'audio:spectrum-subscribe',
    spectrumUnsubscribe: 'audio:spectrum-unsubscribe',
    /** main -> renderer: a SpectrumUpdate, to subscribers only. */
    spectrum: 'audio:spectrum',
    /** renderer -> main, fire and forget: restore the muted monitor the spectrum records. */
    restoreMonitor: 'audio:restore-monitor',
    /** renderer -> main, fire and forget: a mixer pane is showing. */
    mixerSubscribe: 'audio:mixer-subscribe',
    mixerUnsubscribe: 'audio:mixer-unsubscribe',
    /** main -> renderer: a MixerUpdate, to subscribers only. */
    mixer: 'audio:mixer',
    /** renderer -> main, fire and forget: a MixerCommand, validated in main. */
    mixerCommand: 'audio:mixer-command',
  },
  /** The hidden audio capture window -> main; heard from that window's contents only. */
  audioCapture: {
    frame: 'audio-capture:frame',
    status: 'audio-capture:status',
  },
  plugins: {
    /** The plugins folder and every plugin found in it (PluginCatalog). */
    catalog: 'plugins:catalog',
    /** main -> renderer: the catalog after a change in the folder. */
    changed: 'plugins:changed',
    openFolder: 'plugins:open-folder',
    /** A plugin's ctx.fetch, checked against its grant in main. */
    fetch: 'plugins:fetch',
    storageLoad: 'plugins:storage-load',
    /** One ctx.storage change; answers false when it would pass the limit. */
    storageSet: 'plugins:storage-set',
    signIn: 'plugins:sign-in',
    signOut: 'plugins:sign-out',
    /** renderer -> main, fire and forget: a plugin's sign-in worked; close its window. */
    closeSignIn: 'plugins:close-sign-in',
    /** main -> renderer: a plugin's sign-in session changed (its id). */
    session: 'plugins:session',
    /** renderer -> main, fire and forget: a system notification for a plugin. */
    notify: 'plugins:notify',
    /** Deletes a plugin's stored data and session. */
    forget: 'plugins:forget',
  },
  /** Web panes (docs/architecture.md section 5.4), addressed by pane id. */
  web: {
    /** Creates or takes over the pane's view and answers its WebState. */
    open: 'web:open',
    /** renderer -> main, fire and forget: show the view at a rectangle. */
    show: 'web:show',
    /** Hides the view; answers a snapshot of it when asked for one. */
    hide: 'web:hide',
    /** renderer -> main, fire and forget: a WebCommand. */
    command: 'web:command',
    /** renderer -> main, fire and forget: the pane is gone; destroy its view. */
    close: 'web:close',
    /** The pane ids main holds views for, for the workspace's reaper. */
    list: 'web:list',
    /** renderer -> main, fire and forget: a WebAppearance for every view. */
    appearance: 'web:appearance',
    /** renderer -> main, fire and forget: put the keyboard in the pane's page. */
    focus: 'web:focus',
    /** renderer -> main, fire and forget: take the keyboard back from any page. */
    focusWorkspace: 'web:focus-workspace',
    /** Deletes the web panes' cookies, storage and cache. */
    clearData: 'web:clear-data',
    /** main -> renderer: a WebState. */
    state: 'web:state',
    /** main -> renderer: a shortcut pressed in a page (its action id). */
    shortcut: 'web:shortcut',
    /** main -> renderer: a fresh picture of a hidden view, which has changed under its pane. */
    snapshot: 'web:snapshot',
    /** main -> renderer: a page took the keyboard (its pane id). */
    focused: 'web:focused',
  },
  /** Notes (notes.json); main owns the text, a pane holds only which note it shows. */
  notes: {
    /** The whole file. */
    list: 'notes:list',
    create: 'notes:create',
    /** Replaces a note's body; answers the stored note, with its new revision. */
    save: 'notes:save',
    remove: 'notes:remove',
    /** Opens the system's save dialog and writes the note as markdown. */
    export: 'notes:export',
    /** main -> renderer: the whole file after any change, including a hand edit. */
    changed: 'notes:changed',
  },
  /** Tasks (tasks.json) and their reminders. */
  tasks: {
    list: 'tasks:list',
    add: 'tasks:add',
    update: 'tasks:update',
    remove: 'tasks:remove',
    /** Removes every completed task in a list; answers how many went. */
    clearCompleted: 'tasks:clear-completed',
    addList: 'tasks:add-list',
    renameList: 'tasks:rename-list',
    removeList: 'tasks:remove-list',
    /** main -> renderer: the whole file after any change. */
    changed: 'tasks:changed',
    /** main -> renderer: a TaskReminder, when one comes due. */
    remind: 'tasks:remind',
  },
  /** Alarms (alarms.json): a time of day announced whether or not a pane is open. */
  alarms: {
    list: 'alarms:list',
    add: 'alarms:add',
    update: 'alarms:update',
    remove: 'alarms:remove',
    /** main -> renderer: the whole file after any change. */
    changed: 'alarms:changed',
    /** main -> renderer: an AlarmRing, when one goes off. */
    ring: 'alarms:ring',
  },
  launcher: {
    list: 'launcher:list',
    icon: 'launcher:icon',
    launch: 'launcher:launch',
    /** main -> renderer: a background rescan found a different application list. */
    changed: 'launcher:changed',
  },
  fs: {
    readDir: 'fs:read-dir',
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
