import type {
  AppInfo,
  ElecdexApi,
  MachineFacts,
  PtyCreateOptions,
  PtyHandlers,
  PtySessionSummary,
  StartDirectory,
  ThemeCatalog,
  WindowState,
} from '@shared/api'
import type { MixerUpdate, SpectrumUpdate } from '@shared/audio'
import { CH, type PtyPortMessage, type PtyPortRequest } from '@shared/channels'
import type { FeedUpdate } from '@shared/feeds'
import type { DirResult, DriveInfo } from '@shared/fs'
import type { LauncherEntry, LaunchResult } from '@shared/launcher'
import { chartKey, type MarketUpdate } from '@shared/markets'
import type { MetricSample, MetricSourceId, MetricsStats } from '@shared/metrics'
import type { PluginCatalog } from '@shared/plugins'
import type { QuakeAlert, QuakeState } from '@shared/quakes'
import type { LayoutTree } from '@shared/schemas/layout'
import type { Settings } from '@shared/settings'
import type { UpdateStatus } from '@shared/updates'
import type { OfficeInfo } from '@shared/weather'
import type { WeatherUpdate } from '@shared/weather-report'
import { contextBridge, ipcRenderer } from 'electron'

/**
 * The only bridge between the sandboxed renderer and the main process.
 *
 * Rules for this file:
 *  - never expose `ipcRenderer` itself, only narrow typed functions
 *  - never expose a function that takes a channel name from the caller
 *  - keep it free of Node API usage so it keeps working under `sandbox: true`
 *
 * A MessagePort cannot cross `contextBridge`, so this file holds the ports and
 * relays them: main transfers a port here, and the renderer only ever sees the
 * callbacks. See docs/architecture.md section 4.3.
 */

/** Ports handed to us by main, keyed by session id, awaiting an attach. */
const ports = new Map<string, MessagePort>()
/** Sessions whose port has not arrived yet, with the resolver waiting for it. */
const pending = new Map<string, (port: MessagePort) => void>()

ipcRenderer.on(CH.pty.port, (event, payload: { id: string }) => {
  const port = event.ports[0]
  if (!port) return

  const waiting = pending.get(payload.id)
  if (waiting) {
    pending.delete(payload.id)
    waiting(port)
  } else {
    ports.set(payload.id, port)
  }
})

/** Resolves once main has transferred the port for `id`. */
function awaitPort(id: string): Promise<MessagePort> {
  const existing = ports.get(id)
  if (existing) {
    ports.delete(id)
    return Promise.resolve(existing)
  }
  return new Promise((resolve) => pending.set(id, resolve))
}

async function attach(id: string, handlers: PtyHandlers): Promise<() => void> {
  // Ask for the port first, then wait: main posts it during the invoke, so the
  // listener above may well receive it before this promise settles.
  const portPromise = awaitPort(id)
  const ok = (await ipcRenderer.invoke(CH.pty.attach, id)) as boolean
  if (!ok) {
    pending.delete(id)
    throw new Error(`No such terminal session: ${id}`)
  }

  const port = await portPromise
  let detached = false

  port.onmessage = (event: MessageEvent) => {
    if (detached) return
    const msg = event.data as PtyPortMessage
    switch (msg.t) {
      case 'data':
        handlers.onData(msg.chunk)
        break
      case 'exit':
        handlers.onExit(msg.code, msg.signal)
        break
      case 'cwd':
        handlers.onCwd(msg.cwd)
        break
      case 'commandEnd':
        handlers.onCommandEnd(msg.exitCode, msg.durationMs)
        break
      case 'integrationUnavailable':
        handlers.onIntegrationUnavailable()
        break
    }
  }
  port.start()
  live.set(id, port)

  return () => {
    if (detached) return
    detached = true
    port.onmessage = null
    port.close()
    if (live.get(id) === port) live.delete(id)
  }
}

/** Attached ports, so write/resize can reach the right session synchronously. */
const live = new Map<string, MessagePort>()

function post(id: string, request: PtyPortRequest): void {
  live.get(id)?.postMessage(request)
}

/*
 * Metrics.
 *
 * Reference-counted here so that ten widgets reading `cpu.load` are one
 * subscription as far as main is concerned, and the source stops being polled
 * only when the last of them lets go. The last sample per source is cached so a
 * widget mounted after the first one renders immediately rather than waiting for
 * the next tick - main only replays on the *first* subscription.
 */
type SampleHandler = (sample: MetricSample) => void
const metricHandlers = new Map<MetricSourceId, Set<SampleHandler>>()
const lastSample = new Map<MetricSourceId, MetricSample>()

ipcRenderer.on(CH.metrics.sample, (_event, sample: MetricSample) => {
  lastSample.set(sample.id, sample)
  for (const handler of metricHandlers.get(sample.id) ?? []) handler(sample)
})

function subscribeMetric(id: MetricSourceId, handler: SampleHandler): () => void {
  let handlers = metricHandlers.get(id)
  if (!handlers) {
    handlers = new Set()
    metricHandlers.set(id, handlers)
    ipcRenderer.send(CH.metrics.subscribe, id)
  } else {
    const cached = lastSample.get(id)
    if (cached) queueMicrotask(() => handler(cached))
  }
  handlers.add(handler)

  let active = true
  return () => {
    if (!active) return
    active = false
    const set = metricHandlers.get(id)
    if (!set) return
    set.delete(handler)
    if (set.size === 0) {
      metricHandlers.delete(id)
      lastSample.delete(id)
      ipcRenderer.send(CH.metrics.unsubscribe, id)
    }
  }
}

/**
 * A reference-counted fan-out for a keyed main-process subscription: the first
 * handler for a key sends `subscribe`, the last one to leave sends
 * `unsubscribe`, and every event for the key reaches every handler. Used for
 * directory watches, weather locations, market symbols and feeds, which follow
 * the metrics rules.
 */
function keyedSubscriptions<T>(channels: {
  subscribe: string
  unsubscribe: string
  event: string
  keyOf: (payload: T) => string
}) {
  const handlers = new Map<string, Set<(payload: T) => void>>()
  const last = new Map<string, T>()

  ipcRenderer.on(channels.event, (_event, payload: T) => {
    const key = channels.keyOf(payload)
    last.set(key, payload)
    for (const handler of handlers.get(key) ?? []) handler(payload)
  })

  return (key: string, handler: (payload: T) => void): (() => void) => {
    let set = handlers.get(key)
    if (!set) {
      set = new Set()
      handlers.set(key, set)
      ipcRenderer.send(channels.subscribe, key)
    } else {
      const cached = last.get(key)
      if (cached !== undefined) queueMicrotask(() => handler(cached))
    }
    set.add(handler)

    let active = true
    return () => {
      if (!active) return
      active = false
      const current = handlers.get(key)
      if (!current) return
      current.delete(handler)
      if (current.size === 0) {
        handlers.delete(key)
        last.delete(key)
        ipcRenderer.send(channels.unsubscribe, key)
      }
    }
  }
}

const watchDir = keyedSubscriptions<string>({
  subscribe: CH.fs.watch,
  unsubscribe: CH.fs.unwatch,
  event: CH.fs.changed,
  keyOf: (dir) => dir,
})

const subscribeWeather = keyedSubscriptions<WeatherUpdate>({
  subscribe: CH.weather.subscribe,
  unsubscribe: CH.weather.unsubscribe,
  event: CH.weather.update,
  keyOf: (update) => update.key,
})

/** Registers a listener for a main -> renderer broadcast; returns its removal. */
function listen<T>(channel: string, handler: (payload: T) => void): () => void {
  const wrapped = (_event: unknown, payload: T) => handler(payload)
  ipcRenderer.on(channel, wrapped)
  return () => {
    ipcRenderer.removeListener(channel, wrapped)
  }
}

const subscribeMarket = keyedSubscriptions<MarketUpdate>({
  subscribe: CH.markets.subscribe,
  unsubscribe: CH.markets.unsubscribe,
  event: CH.markets.update,
  keyOf: (update) => update.key,
})

const subscribeFeed = keyedSubscriptions<FeedUpdate>({
  subscribe: CH.feeds.subscribe,
  unsubscribe: CH.feeds.unsubscribe,
  event: CH.feeds.update,
  keyOf: (update) => update.url,
})

/**
 * The earthquake list: every change is broadcast, so observing is just listening
 * (after one read of the current state); subscribing also tells main, reference
 * counted, that a pane needs the list kept current.
 */
let quakeSubscribers = 0

function observeQuakes(handler: (state: QuakeState) => void): () => void {
  let live = true
  // A change broadcast before the read answers is newer than what the read returns.
  let updated = false
  const off = listen<QuakeState>(CH.quakes.update, (state) => {
    updated = true
    handler(state)
  })
  void (ipcRenderer.invoke(CH.quakes.state) as Promise<QuakeState>).then((state) => {
    if (live && !updated) handler(state)
  })
  return () => {
    live = false
    off()
  }
}

function subscribeQuakes(handler: (state: QuakeState) => void): () => void {
  const off = observeQuakes(handler)
  quakeSubscribers += 1
  if (quakeSubscribers === 1) ipcRenderer.send(CH.quakes.subscribe)
  let active = true
  return () => {
    if (!active) return
    active = false
    off()
    quakeSubscribers -= 1
    if (quakeSubscribers === 0) ipcRenderer.send(CH.quakes.unsubscribe)
  }
}

/**
 * A reference-counted subscription to one main-process stream: the first handler
 * subscribes, the last to leave unsubscribes, and every update reaches every handler.
 */
function sharedStream<T>(channels: { subscribe: string; unsubscribe: string; event: string }) {
  const handlers = new Set<(update: T) => void>()
  let off: (() => void) | null = null
  return (handler: (update: T) => void): (() => void) => {
    handlers.add(handler)
    if (handlers.size === 1) {
      off = listen<T>(channels.event, (update) => {
        for (const h of handlers) h(update)
      })
      ipcRenderer.send(channels.subscribe)
    }
    let active = true
    return () => {
      if (!active) return
      active = false
      handlers.delete(handler)
      if (handlers.size > 0) return
      off?.()
      off = null
      ipcRenderer.send(channels.unsubscribe)
    }
  }
}

const subscribeSpectrum = sharedStream<SpectrumUpdate>({
  subscribe: CH.audio.spectrumSubscribe,
  unsubscribe: CH.audio.spectrumUnsubscribe,
  event: CH.audio.spectrum,
})

const subscribeMixer = sharedStream<MixerUpdate>({
  subscribe: CH.audio.mixerSubscribe,
  unsubscribe: CH.audio.mixerUnsubscribe,
  event: CH.audio.mixer,
})

const api: ElecdexApi = {
  system: {
    platform: process.platform,
    info: () => ipcRenderer.invoke(CH.system.info) as Promise<AppInfo>,
    machine: () => ipcRenderer.invoke(CH.system.machine) as Promise<MachineFacts>,
    openExternal: (url) => ipcRenderer.invoke(CH.system.openExternal, url) as Promise<void>,
    revealInFolder: (path) => ipcRenderer.invoke(CH.system.revealInFolder, path) as Promise<void>,
    toggleDevTools: () => ipcRenderer.send(CH.system.toggleDevTools),
    setFullscreen: (on) => ipcRenderer.send(CH.system.setFullscreen, on),
    toggleFullscreen: () => ipcRenderer.send(CH.system.toggleFullscreen),
    quit: () => ipcRenderer.send(CH.system.quit),
    minimize: () => ipcRenderer.send(CH.system.minimize),
    windowState: () => ipcRenderer.invoke(CH.system.windowState) as Promise<WindowState>,
    onWindowState: (handler) => listen<WindowState>(CH.system.windowStateChanged, handler),
    setTitleBarColors: (colors) => ipcRenderer.send(CH.system.setTitleBarColors, colors),
  },
  pty: {
    create: (opts?: PtyCreateOptions) =>
      ipcRenderer.invoke(CH.pty.create, opts ?? {}) as Promise<PtySessionSummary>,
    attach,
    write: (id, data) => post(id, { t: 'write', data }),
    resize: (id, cols, rows) => post(id, { t: 'resize', cols, rows }),
    dispose: (id) => ipcRenderer.invoke(CH.pty.dispose, id) as Promise<void>,
    list: () => ipcRenderer.invoke(CH.pty.list) as Promise<PtySessionSummary[]>,
  },
  metrics: {
    subscribe: (id, handler) => subscribeMetric(id, handler as SampleHandler),
    stats: () => ipcRenderer.invoke(CH.metrics.stats) as Promise<MetricsStats>,
  },
  settings: {
    get: () => ipcRenderer.invoke(CH.settings.get) as Promise<Settings>,
    patch: (patch) => ipcRenderer.invoke(CH.settings.patch, patch) as Promise<Settings>,
    onChange: (handler) => listen<Settings>(CH.settings.changed, handler),
    openFile: () => ipcRenderer.invoke(CH.settings.openFile) as Promise<string | null>,
    startDirectory: () => ipcRenderer.invoke(CH.settings.startDirectory) as Promise<StartDirectory>,
    chooseStartDirectory: () =>
      ipcRenderer.invoke(CH.settings.chooseStartDirectory) as Promise<string | null>,
  },
  markets: {
    subscribe: (symbol, range, handler) => subscribeMarket(chartKey(symbol, range), handler),
    watching: () => ipcRenderer.invoke(CH.markets.watching) as Promise<string[]>,
    charts: () => ipcRenderer.invoke(CH.markets.charts) as Promise<string[]>,
  },
  feeds: {
    subscribe: (url, handler) => subscribeFeed(url, handler),
    watching: () => ipcRenderer.invoke(CH.feeds.watching) as Promise<string[]>,
  },
  audio: {
    spectrum: subscribeSpectrum,
    restoreMonitor: () => ipcRenderer.send(CH.audio.restoreMonitor),
    mixer: subscribeMixer,
    mixerCommand: (command) => ipcRenderer.send(CH.audio.mixerCommand, command),
  },
  plugins: {
    catalog: () => ipcRenderer.invoke(CH.plugins.catalog) as Promise<PluginCatalog>,
    onChange: (handler) => listen<PluginCatalog>(CH.plugins.changed, handler),
    openFolder: () => ipcRenderer.invoke(CH.plugins.openFolder) as Promise<void>,
    fetch: (id, url, headers) => ipcRenderer.invoke(CH.plugins.fetch, id, url, headers),
    storageLoad: (id) =>
      ipcRenderer.invoke(CH.plugins.storageLoad, id) as Promise<Record<string, unknown>>,
    storageSet: (id, key, value, remove) =>
      ipcRenderer.invoke(CH.plugins.storageSet, id, key, value, remove) as Promise<boolean>,
    signIn: (id, host) => ipcRenderer.invoke(CH.plugins.signIn, id, host) as Promise<void>,
    signOut: (id) => ipcRenderer.invoke(CH.plugins.signOut, id) as Promise<void>,
    closeSignIn: (id) => ipcRenderer.send(CH.plugins.closeSignIn, id),
    onSession: (handler) => listen<string>(CH.plugins.session, handler),
    notify: (id, message) => ipcRenderer.send(CH.plugins.notify, id, message),
    forget: (id) => ipcRenderer.invoke(CH.plugins.forget, id) as Promise<void>,
  },
  quakes: {
    subscribe: subscribeQuakes,
    observe: observeQuakes,
    onAlert: (handler) => listen<QuakeAlert>(CH.quakes.alert, handler),
  },
  updates: {
    status: () => ipcRenderer.invoke(CH.updates.status) as Promise<UpdateStatus>,
    check: () => ipcRenderer.invoke(CH.updates.check) as Promise<UpdateStatus>,
    onChange: (handler) => listen<UpdateStatus>(CH.updates.changed, handler),
  },
  launcher: {
    list: () => ipcRenderer.invoke(CH.launcher.list) as Promise<LauncherEntry[]>,
    icon: (id) => ipcRenderer.invoke(CH.launcher.icon, id) as Promise<string | null>,
    launch: (id) => ipcRenderer.invoke(CH.launcher.launch, id) as Promise<LaunchResult>,
  },
  themes: {
    list: () => ipcRenderer.invoke(CH.themes.list) as Promise<ThemeCatalog>,
    folder: () => ipcRenderer.invoke(CH.themes.folder) as Promise<string>,
    onChange: (handler) => listen<ThemeCatalog>(CH.themes.changed, handler),
  },
  fs: {
    readDir: (path) => ipcRenderer.invoke(CH.fs.readDir, path) as Promise<DirResult>,
    drives: () => ipcRenderer.invoke(CH.fs.drives) as Promise<DriveInfo[]>,
    // Main reports the directory normalised; a "changed" event for it is only
    // matched if the watch was keyed the same way, so callers pass listing paths.
    watch: (path, handler) => watchDir(path, () => handler()),
  },
  weather: {
    subscribe: (office, handler) => subscribeWeather(office, handler),
    offices: () => ipcRenderer.invoke(CH.weather.offices) as Promise<OfficeInfo[]>,
    watching: () => ipcRenderer.invoke(CH.weather.watching) as Promise<string[]>,
  },
  layout: {
    load: () => ipcRenderer.invoke(CH.layout.load) as Promise<LayoutTree>,
    save: (tree) => ipcRenderer.invoke(CH.layout.save, tree) as Promise<LayoutTree>,
    reset: () => ipcRenderer.invoke(CH.layout.reset) as Promise<LayoutTree>,
    filePath: () => ipcRenderer.invoke(CH.layout.revealFile) as Promise<string>,
  },
}

contextBridge.exposeInMainWorld('elecdex', api)
