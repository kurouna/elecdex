/**
 * The code that runs inside a plugin's worker, around the plugin (docs/plugins.md section 4).
 *
 * The host builds the worker script from these two functions' source text:
 *
 *   (stripGlobals)(self);
 *   (pluginRuntime)(self, {"index.ts": function (module, exports, require) {...}}, "index.ts");
 *
 * so neither function may refer to anything outside itself - no imports, no module
 * constants, no helpers - or the copy in the worker would reach for a name that is not
 * there. Types are fine: they are gone by then. Both are also called directly, with a
 * stand-in global, by the unit tests.
 */

/** The parts of a worker's global scope the runtime uses. */
export interface RuntimeScope {
  postMessage(message: unknown): void
  setInterval(fn: () => void, ms: number): unknown
  clearInterval(handle: unknown): void
  onmessage: ((event: { data: unknown }) => void) | null
  addEventListener?(type: string, fn: (event: unknown) => void): void
}

export type ModuleFunction = (
  module: { exports: unknown },
  exports: unknown,
  require: (specifier: string) => unknown,
) => void

/**
 * Takes away the worker's own ways out - network, storage, nested workers, script loading -
 * from the global and from every prototype it inherits them from. Defence in depth only:
 * the app's CSP (connect-src 'self', no unsafe-eval), which a blob worker inherits, is what
 * actually keeps a plugin off the network.
 */
export function stripGlobals(scope: object): void {
  const names = [
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'WebTransport',
    'EventSource',
    'importScripts',
    'Worker',
    'SharedWorker',
    'indexedDB',
    'caches',
    'BroadcastChannel',
    'RTCPeerConnection',
    'Notification',
  ]
  for (const name of names) {
    let proto: object | null = Object.getPrototypeOf(scope)
    while (proto !== null && proto !== Object.prototype) {
      try {
        Reflect.deleteProperty(proto, name)
      } catch {
        // A property that will not go is shadowed on the global below.
      }
      proto = Object.getPrototypeOf(proto)
    }
    try {
      Object.defineProperty(scope, name, { value: undefined, writable: false, configurable: false })
    } catch {
      // Already non-configurable: nothing more can be done from here.
    }
  }
}

export function pluginRuntime(
  scope: RuntimeScope,
  modules: Record<string, ModuleFunction>,
  entry: string,
): void {
  type Fn = (...args: never[]) => unknown
  type Listeners = Map<string, Set<Fn>>
  interface View {
    pane: string
    size: { w: number; h: number }
    visible: boolean
    state: unknown
    listeners: Listeners
    data: Set<(model: unknown) => void>
    timers: Set<{ stop: () => void; skipped: boolean; fn: () => unknown }>
    cleanup: unknown
  }
  interface Plugin {
    permissions?: { metrics?: unknown; notify?: unknown }
    service?: (ctx: unknown) => unknown
    view?: (ctx: unknown) => unknown
  }

  const MIN_EVERY_MS = 1000
  // The rule of isStorageKey in shared/plugins.ts, which main applies again.
  const storageKey = (key: string): void => {
    const plain = /^[A-Za-z0-9_.:-]{1,100}$/.test(key)
    if (!plain || ['__proto__', 'constructor', 'prototype'].includes(key)) {
      throw new TypeError(`"${key}" is not a storage key: use letters, digits and _ . : -`)
    }
  }
  const STATE_BYTES = 64 * 1024
  const STORAGE_BYTES = 1024 * 1024

  const post = (message: unknown): void => scope.postMessage(message)
  const describe = (error: unknown): string => {
    if (error instanceof Error) {
      const stack = (error.stack ?? '').split('\n').slice(1, 4).join('\n')
      return stack === ''
        ? `${error.name}: ${error.message}`
        : `${error.name}: ${error.message}\n${stack}`
    }
    return String(error)
  }
  const report = (pane: string | null, error: unknown, fatal = false): void =>
    post({ t: 'error', pane, message: describe(error), fatal })

  /** Calls a plugin function; a throw or a rejected promise is reported for its pane. */
  const call = (pane: string | null, fn: Fn, ...args: unknown[]): unknown => {
    try {
      const result = (fn as (...a: unknown[]) => unknown)(...args)
      if (result instanceof Promise) result.catch((error: unknown) => report(pane, error))
      return result
    } catch (error) {
      report(pane, error)
      return undefined
    }
  }

  // Modules: CommonJS, with require limited to the plugin's own files.
  const cache = new Map<string, { exports: unknown }>()
  const resolve = (from: string, specifier: string): string => {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      throw new Error(`a plugin can import only its own files, not "${specifier}"`)
    }
    const parts = from.split('/').slice(0, -1)
    for (const segment of specifier.split('/').filter((s) => s !== '.' && s !== '')) {
      if (segment !== '..') parts.push(segment)
      else if (parts.pop() === undefined) throw new Error(`"${specifier}" is outside the plugin`)
    }
    const base = parts.join('/')
    const found = [base, `${base}.ts`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`].find(
      (candidate) => Object.hasOwn(modules, candidate),
    )
    if (found === undefined) throw new Error(`cannot find "${specifier}" from ${from}`)
    return found
  }
  const load = (name: string): unknown => {
    const cached = cache.get(name)
    if (cached) return cached.exports
    const module = { exports: {} as unknown }
    cache.set(name, module)
    const fn = modules[name]
    if (fn === undefined) throw new Error(`no module ${name}`)
    fn(module, module.exports, (specifier) => load(resolve(name, specifier)))
    return module.exports
  }

  let plugin: Plugin | null = null
  const loadPlugin = (): Plugin => {
    if (plugin !== null) return plugin
    const exported = load(entry) as { default?: unknown } | null
    const value = (
      exported && typeof exported === 'object' && 'default' in exported
        ? exported.default
        : exported
    ) as Plugin | null
    if (value === null || typeof value !== 'object') {
      throw new Error('the plugin must export default an object')
    }
    plugin = value
    return value
  }

  const on = (listeners: Listeners, event: string, fn: Fn): (() => void) => {
    if (typeof fn !== 'function') throw new TypeError('on() needs a function')
    let set = listeners.get(event)
    if (set === undefined) {
      set = new Set()
      listeners.set(event, set)
    }
    set.add(fn)
    return () => {
      set.delete(fn)
    }
  }
  const emit = (listeners: Listeners, pane: string | null, event: string, ...args: unknown[]) => {
    for (const fn of listeners.get(event) ?? []) call(pane, fn, ...args)
  }
  const jsonSize = (value: unknown, what: string): string => {
    const json = JSON.stringify(value)
    if (json === undefined) throw new TypeError(`${what} must be JSON`)
    return json
  }

  // Plugin-wide state.
  let settings: Record<string, unknown> = {}
  let locale = 'en'
  let storage: Record<string, unknown> = {}
  let model: { value: unknown } | null = null
  const serviceListeners: Listeners = new Map()
  const serviceTimers = new Set<() => void>()
  let serviceCleanup: unknown
  const views = new Map<string, View>()
  const metricHandlers = new Map<string, Set<(value: unknown) => void>>()
  const fetches = new Map<number, { resolve: (r: unknown) => void; reject: (e: Error) => void }>()
  let nextFetch = 0

  const every = (
    pane: string | null,
    ms: number,
    fn: () => unknown,
    view: View | null,
  ): (() => void) => {
    if (typeof fn !== 'function') throw new TypeError('every() needs a function')
    const period = Math.max(MIN_EVERY_MS, Number.isFinite(ms) ? ms : MIN_EVERY_MS)
    const timer = { stop: () => {}, skipped: false, fn }
    const handle = scope.setInterval(() => {
      if (view !== null && !view.visible) {
        timer.skipped = true
        return
      }
      call(pane, fn)
    }, period)
    timer.stop = () => {
      scope.clearInterval(handle)
      view?.timers.delete(timer)
      serviceTimers.delete(timer.stop)
    }
    if (view !== null) view.timers.add(timer)
    else serviceTimers.add(timer.stop)
    return timer.stop
  }

  const log = (...args: unknown[]): void =>
    post({
      t: 'log',
      level: 'log',
      text: args
        .map((a) => (typeof a === 'string' ? a : (JSON.stringify(a) ?? String(a))))
        .join(' '),
    })

  const serviceContext = (p: Plugin) => ({
    get settings() {
      return settings
    },
    get locale() {
      return locale
    },
    every: (ms: number, fn: () => unknown) => every(null, ms, fn, null),
    log,
    publish(value: unknown): void {
      model = { value }
      for (const view of views.values()) {
        for (const fn of view.data) call(view.pane, fn, value)
      }
    },
    metrics: {
      on(id: string, fn: (value: unknown) => void): () => void {
        const declared = Array.isArray(p.permissions?.metrics) ? p.permissions.metrics : []
        if (!declared.includes(id)) throw new Error(`${id} is not in permissions.metrics`)
        let set = metricHandlers.get(id)
        if (set === undefined) {
          set = new Set()
          metricHandlers.set(id, set)
          post({ t: 'metrics', id, on: true })
        }
        set.add(fn)
        return () => {
          set.delete(fn)
          if (set.size === 0 && metricHandlers.get(id) === set) {
            metricHandlers.delete(id)
            post({ t: 'metrics', id, on: false })
          }
        }
      },
    },
    fetch(url: string, init?: { headers?: Record<string, string> }): Promise<unknown> {
      const id = nextFetch++
      return new Promise((resolve, reject) => {
        fetches.set(id, { resolve, reject })
        post({ t: 'fetch', id, url: String(url), headers: { ...(init?.headers ?? {}) } })
      })
    },
    storage: {
      get: (key: string): unknown =>
        Object.hasOwn(storage, key) ? structuredClone(storage[key]) : undefined,
      set(key: string, value: unknown): void {
        storageKey(key)
        const json = jsonSize(value, 'a stored value')
        const next = { ...storage, [key]: JSON.parse(json) as unknown }
        if (JSON.stringify(next).length > STORAGE_BYTES)
          throw new RangeError('storage is full (1 MiB)')
        storage = next
        post({ t: 'storage', key, value: storage[key] })
      },
      delete(key: string): void {
        if (!Object.hasOwn(storage, key)) return
        const { [key]: _gone, ...rest } = storage
        storage = rest
        post({ t: 'storage', key, value: null, remove: true })
      },
    },
    notify(message: { title: string; body?: string; sound?: boolean }): void {
      if (p.permissions?.notify !== true) throw new Error('notify needs permissions.notify')
      post({ t: 'notify', title: String(message.title), body: message.body, sound: message.sound })
    },
    setOptions(key: string, options: unknown): void {
      post({ t: 'options', key, options })
    },
    on: (event: string, fn: Fn) => on(serviceListeners, event, fn),
  })

  const viewContext = (view: View) => ({
    get settings() {
      return settings
    },
    get locale() {
      return locale
    },
    every: (ms: number, fn: () => unknown) => every(view.pane, ms, fn, view),
    log,
    onData(fn: (value: unknown) => void): () => void {
      if (typeof fn !== 'function') throw new TypeError('onData() needs a function')
      view.data.add(fn)
      const current = model
      if (current !== null)
        queueMicrotask(() => view.data.has(fn) && call(view.pane, fn, current.value))
      return () => {
        view.data.delete(fn)
      }
    },
    render: (blocks: unknown) => post({ t: 'render', pane: view.pane, blocks }),
    get size() {
      return { ...view.size }
    },
    get visible() {
      return view.visible
    },
    state: {
      get: (): unknown => structuredClone(view.state),
      set(value: unknown): void {
        const json = jsonSize(value, 'pane state')
        if (json.length > STATE_BYTES) throw new RangeError('pane state is too big (64 KiB)')
        view.state = JSON.parse(json) as unknown
        post({ t: 'state', pane: view.pane, value: view.state })
      },
    },
    subtitle: (text: string | null) =>
      post({ t: 'subtitle', pane: view.pane, text: text === null ? null : String(text) }),
    badge: (text: string | null, tone?: string) =>
      post({ t: 'badge', pane: view.pane, text: text === null ? null : String(text), tone }),
    on: (event: string, fn: Fn) => on(view.listeners, event, fn),
  })

  const unmount = (view: View): void => {
    for (const timer of [...view.timers]) timer.stop()
    views.delete(view.pane)
    if (typeof view.cleanup === 'function') call(view.pane, view.cleanup as Fn)
  }

  const handlers: Record<string, (m: Record<string, unknown>) => void> = {
    probe() {
      const p = loadPlugin()
      const data = JSON.parse(
        JSON.stringify(p, (_key, value: unknown) =>
          typeof value === 'function' ? undefined : value,
        ),
      ) as Record<string, unknown>
      post({
        t: 'descriptor',
        descriptor: { ...data, hasService: typeof p.service === 'function' },
      })
    },
    start(m) {
      settings = m.settings as Record<string, unknown>
      locale = String(m.locale)
      storage = (m.storage ?? {}) as Record<string, unknown>
      const p = loadPlugin()
      if (m.service === true && typeof p.service === 'function') {
        serviceCleanup = call(null, p.service as Fn, serviceContext(p))
      }
    },
    mount(m) {
      const p = loadPlugin()
      const pane = String(m.pane)
      const existing = views.get(pane)
      if (existing) unmount(existing)
      const view: View = {
        pane,
        size: m.size as View['size'],
        visible: m.visible === true,
        state: m.state,
        listeners: new Map(),
        data: new Set(),
        timers: new Set(),
        cleanup: undefined,
      }
      views.set(pane, view)
      if (typeof p.view !== 'function') throw new Error('the plugin has no view()')
      view.cleanup = call(pane, p.view as Fn, viewContext(view))
    },
    unmount(m) {
      const view = views.get(String(m.pane))
      if (view) unmount(view)
    },
    size(m) {
      const view = views.get(String(m.pane))
      if (!view) return
      view.size = m.size as View['size']
      emit(view.listeners, view.pane, 'resize')
    },
    visible(m) {
      const view = views.get(String(m.pane))
      if (!view || view.visible === (m.visible === true)) return
      view.visible = m.visible === true
      emit(view.listeners, view.pane, 'visibility')
      if (!view.visible) return
      for (const timer of view.timers) {
        if (!timer.skipped) continue
        timer.skipped = false
        call(view.pane, timer.fn)
      }
    },
    settings(m) {
      settings = m.settings as Record<string, unknown>
      emit(serviceListeners, null, 'settings')
      for (const view of views.values()) emit(view.listeners, view.pane, 'settings')
    },
    action(m) {
      const action = {
        action: String(m.action),
        pane: String(m.pane),
        ...(m.item === undefined ? {} : { item: String(m.item) }),
      }
      const view = views.get(action.pane)
      if (view) emit(view.listeners, view.pane, 'action', action)
      emit(serviceListeners, null, 'action', action)
    },
    metric(m) {
      for (const fn of metricHandlers.get(String(m.id)) ?? []) call(null, fn, m.value)
    },
    fetched(m) {
      const pending = fetches.get(Number(m.id))
      if (!pending) return
      fetches.delete(Number(m.id))
      const response = m.response as
        | { status: number; headers: Record<string, string>; body: string }
        | undefined
      if (response === undefined) {
        pending.reject(new Error(String(m.error ?? 'fetch failed')))
        return
      }
      pending.resolve({
        status: response.status,
        headers: response.headers,
        text: () => response.body,
        json: () => JSON.parse(response.body) as unknown,
      })
    },
    session() {
      emit(serviceListeners, null, 'session')
    },
    ping(m) {
      post({ t: 'pong', n: m.n })
    },
    stop() {
      for (const view of [...views.values()]) unmount(view)
      for (const stop of [...serviceTimers]) stop()
      if (typeof serviceCleanup === 'function') call(null, serviceCleanup as Fn)
    },
  }

  scope.onmessage = (event) => {
    const m = event.data as Record<string, unknown> | null
    const handler = m && typeof m.t === 'string' ? handlers[m.t] : undefined
    if (!handler || m === null) return
    try {
      handler(m)
    } catch (error) {
      const pane = m.t === 'mount' ? String(m.pane) : null
      report(pane, error, m.t === 'probe' || m.t === 'start')
    }
  }
  scope.addEventListener?.('error', (event) =>
    report(null, (event as { error?: unknown }).error ?? event),
  )
  scope.addEventListener?.('unhandledrejection', (event) =>
    report(null, (event as { reason?: unknown }).reason),
  )
}
