import { isMetricSourceId } from '@shared/metrics'
import type { Block, SelectOption, Tone } from '@shared/plugin-api'
import {
  type Grant,
  isCovered,
  NO_PERMISSIONS,
  PLUGIN_LIMITS,
  type PluginCatalog,
  type PluginDescriptor,
  type PluginSettings,
  type PluginSource,
  parseDescriptor,
  readBlocks,
  settingValues,
  type WorkerMessage,
  WorkerMessageSchema,
} from '@shared/plugins'
import { SvelteMap } from 'svelte/reactivity'
import { nextFrame } from '../lib/frame-loop.ts'
import { appearance } from '../stores/appearance.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { registerDynamic, unregisterDynamic } from '../widgets/registry.ts'
import PluginPane from './PluginPane.svelte'
import { createWorker, type PluginWorker, type WorkerFactory } from './worker.ts'

/**
 * The renderer's plugin host (docs/plugins.md sections 4, 5 and 8).
 *
 * It reads the catalog main keeps of the plugins folder, asks each plugin to describe
 * itself in a throwaway worker, registers the usable ones as `plugin:<id>` widgets, and
 * runs one worker per plugin while it is enabled, agreed to and needed - by a pane, or by
 * its background permission. Every message a worker posts is checked before it acts.
 */

const PROBE_TIMEOUT_MS = 3000
const PING_EVERY_MS = 2000
const UNRESPONSIVE_MS = 5000
/** A worker asked to stop gets this long to run its cleanup before it is ended. */
const STOP_GRACE_MS = 200
/** How long a pane glows after its plugin notifies. */
export const NOTIFY_GLOW_MS = 2400

export type PluginStatus =
  /** Found, descriptor not read yet. */
  | 'loading'
  /** Its source or descriptor is unusable. */
  | 'error'
  /** Written for a newer plugin API. */
  | 'newer'
  /** Two files claim the same id. */
  | 'duplicate'
  | 'disabled'
  /** Enabled, but it now asks for more than was agreed to. */
  | 'consent'
  | 'ready'

export interface PluginEntry {
  key: string
  source: PluginSource
  status: PluginStatus
  error: string | null
  descriptor: PluginDescriptor | null
  /**
   * The id the file had when it last described itself. A plugin broken by an edit keeps
   * it, so its panes say what is wrong rather than that the plugin is gone.
   */
  knownId: string | null
}

/** What one pane of a plugin shows. */
export interface PaneView {
  blocks: Block[]
  problems: string[]
  /** A view error for this pane, or the service's for all of them. */
  error: string | null
  /** Set when the worker stopped answering or failed to start. */
  stopped: 'unresponsive' | 'failed' | null
  glowAt: number
}

const emptyView = (): PaneView => ({
  blocks: [],
  problems: [],
  error: null,
  stopped: null,
  glowAt: 0,
})

interface Attached {
  size: { w: number; h: number }
  visible: boolean
  /** The pane's saved ctx.state. */
  state: unknown
}

/** One running plugin: its worker and the panes it draws. */
class Runner {
  readonly id: string
  private readonly host: PluginHost
  private worker: PluginWorker | null = null
  private source: PluginSource
  private descriptor: PluginDescriptor
  readonly panes = new Map<string, Attached>()
  private readonly metricReleases = new Map<string, () => void>()
  private pinger: ReturnType<typeof setInterval> | null = null
  private lastPong = 0
  private ping = 0
  /** Set once the start message is posted: views mount only after the service has started. */
  private started = false
  private sentSettings = ''
  /** Why the worker is not running, when it should be. */
  stopped: PaneView['stopped'] = null
  serviceError: string | null = null

  constructor(host: PluginHost, source: PluginSource, descriptor: PluginDescriptor) {
    this.host = host
    this.id = descriptor.id
    this.source = source
    this.descriptor = descriptor
  }

  get running(): boolean {
    return this.worker !== null
  }

  get background(): boolean {
    return this.descriptor.permissions.background
  }

  async start(): Promise<void> {
    if (this.worker !== null) return
    this.stopped = null
    this.serviceError = null
    let worker: PluginWorker
    try {
      worker = this.host.factory(this.source)
    } catch (error) {
      this.fail(error instanceof Error ? error.message : String(error))
      return
    }
    this.worker = worker
    worker.onMessage((data) => this.receive(worker, data))
    const storage = this.descriptor.hasService
      ? await window.elecdex.plugins.storageLoad(this.id).catch(() => ({}))
      : {}
    if (this.worker !== worker) return
    const settings = this.host.values(this.id)
    this.sentSettings = JSON.stringify(settings)
    worker.post({
      t: 'start',
      settings,
      locale: navigator.language,
      storage,
      service: this.descriptor.hasService,
    })
    this.started = true
    for (const [pane, attached] of this.panes) this.mount(pane, attached)
    this.lastPong = Date.now()
    this.pinger = setInterval(() => this.watch(), PING_EVERY_MS)
    this.host.refresh(this.id)
  }

  stop(): void {
    const worker = this.worker
    if (worker === null) return
    this.worker = null
    this.started = false
    if (this.pinger !== null) clearInterval(this.pinger)
    this.pinger = null
    for (const release of this.metricReleases.values()) release()
    this.metricReleases.clear()
    worker.post({ t: 'stop' })
    setTimeout(() => worker.terminate(), STOP_GRACE_MS)
  }

  /** Stops at once, for a worker that is not answering or failed. */
  private kill(reason: 'unresponsive' | 'failed', message: string | null): void {
    const worker = this.worker
    this.stop()
    worker?.terminate()
    this.stopped = reason
    this.serviceError = message
    this.host.refresh(this.id)
  }

  private fail(message: string): void {
    this.stopped = 'failed'
    this.serviceError = message
    this.host.refresh(this.id)
  }

  private watch(): void {
    if (this.worker === null) return
    if (Date.now() - this.lastPong > UNRESPONSIVE_MS) {
      this.kill('unresponsive', null)
      return
    }
    this.ping += 1
    this.worker.post({ t: 'ping', n: this.ping })
  }

  attach(pane: string, attached: Attached): void {
    this.panes.set(pane, attached)
    if (this.started) this.mount(pane, attached)
  }

  private mount(pane: string, attached: Attached): void {
    this.worker?.post({
      t: 'mount',
      pane,
      size: attached.size,
      visible: attached.visible,
      state: attached.state,
    })
  }

  /** Sends the plugin's settings when they differ from what it last had. */
  settings(values: Record<string, string | number | boolean>): void {
    const json = JSON.stringify(values)
    if (!this.started || json === this.sentSettings) return
    this.sentSettings = json
    this.worker?.post({ t: 'settings', settings: values })
  }

  detach(pane: string): void {
    if (!this.panes.delete(pane)) return
    this.worker?.post({ t: 'unmount', pane })
  }

  resize(pane: string, size: { w: number; h: number }): void {
    const attached = this.panes.get(pane)
    if (!attached) return
    attached.size = size
    this.worker?.post({ t: 'size', pane, size })
  }

  show(pane: string, visible: boolean): void {
    const attached = this.panes.get(pane)
    if (!attached || attached.visible === visible) return
    attached.visible = visible
    this.worker?.post({ t: 'visible', pane, visible })
  }

  post(message: Parameters<PluginWorker['post']>[0]): void {
    this.worker?.post(message)
  }

  private receive(worker: PluginWorker, data: unknown): void {
    if (worker !== this.worker) return
    const parsed = WorkerMessageSchema.safeParse(data)
    if (!parsed.success) return
    this.handle(parsed.data)
  }

  private handle(m: WorkerMessage): void {
    switch (m.t) {
      case 'render':
        if (this.panes.has(m.pane)) this.host.render(m.pane, m.blocks)
        return
      case 'subtitle':
        if (this.panes.has(m.pane)) paneMeta.patch(m.pane, { subtitle: m.text ?? '' })
        return
      case 'badge':
        if (this.panes.has(m.pane)) this.badge(m.pane, m.text, m.tone)
        return
      case 'state':
        this.saveState(m.pane, m.value)
        return
      case 'fetch':
        void this.fetch(m.id, m.url, m.headers)
        return
      case 'storage':
        void window.elecdex.plugins.storageSet(this.id, m.key, m.value, m.remove === true)
        return
      case 'metrics':
        this.metrics(m.id, m.on)
        return
      case 'notify':
        this.notify(m.title, m.body, m.sound)
        return
      case 'options':
        this.host.setOptions(this.id, m.key, m.options)
        return
      case 'log':
        // biome-ignore lint/suspicious/noConsole: a plugin's own log goes to the devtools console.
        console.info(`[plugin ${this.id}]`, m.text)
        return
      case 'error':
        this.error(m.pane, m.message, m.fatal)
        return
      case 'pong':
        this.lastPong = Date.now()
        return
      case 'descriptor':
        return
    }
  }

  /**
   * Keeps a pane's ctx.state in the layout. The runtime holds it to its limit, but a plugin
   * can post to the host directly, so the size is checked again before it reaches layout.json.
   */
  private saveState(pane: string, value: unknown): void {
    const attached = this.panes.get(pane)
    if (!attached) return
    let json: string | undefined
    try {
      json = JSON.stringify(value)
    } catch {
      json = undefined
    }
    if (json === undefined || json.length > PLUGIN_LIMITS.stateBytes) {
      this.host.paneError(pane, 'pane state was not saved: it must be JSON of at most 64 KiB')
      return
    }
    attached.state = value
    layout.setPaneState(pane, { plugin: JSON.parse(json) as unknown })
  }

  private badge(pane: string, text: string | null, tone: Tone | undefined): void {
    const kind = tone === 'danger' || tone === 'warn' || tone === 'ok' ? tone : 'ok'
    if (text === null) paneMeta.patch(pane, { badge: '' })
    else paneMeta.patch(pane, { badge: text, badgeKind: kind })
  }

  private async fetch(
    id: number,
    url: string,
    headers: Record<string, string> | undefined,
  ): Promise<void> {
    const result = await window.elecdex.plugins
      .fetch(this.id, url, headers)
      .catch((error: unknown) => ({ ok: false as const, error: String(error) }))
    if (result.ok) {
      this.post({
        t: 'fetched',
        id,
        response: { status: result.status, headers: result.headers, body: result.body },
      })
    } else {
      this.post({ t: 'fetched', id, error: result.error })
    }
  }

  private metrics(id: string, on: boolean): void {
    if (!on) {
      this.metricReleases.get(id)?.()
      this.metricReleases.delete(id)
      return
    }
    const granted = this.host.grant(this.id)
    if (!isMetricSourceId(id) || !granted.metrics.includes(id) || this.metricReleases.has(id)) {
      return
    }
    const release = window.elecdex.metrics.subscribe(id, (sample) =>
      this.post({ t: 'metric', id, value: sample.data }),
    )
    this.metricReleases.set(id, release)
  }

  private notify(title: string, body: string | undefined, sound: boolean | undefined): void {
    if (!this.host.grant(this.id).notify) return
    if (sound !== false) sfx.play('chime')
    for (const pane of this.panes.keys()) this.host.glow(pane)
    window.elecdex.plugins.notify(this.id, { title, body })
  }

  private error(pane: string | null, message: string, fatal: boolean): void {
    if (pane !== null && this.panes.has(pane)) {
      this.host.paneError(pane, message)
      return
    }
    if (fatal) {
      this.kill('failed', message)
      return
    }
    this.serviceError = message
    this.host.refresh(this.id)
  }
}

/**
 * Off, on, or waiting for the user: a plugin runs only as the file that was agreed to, and
 * only while it asks for no more than was agreed to.
 */
export function statusFor(
  key: string,
  descriptor: PluginDescriptor,
  stored: PluginSettings | undefined,
): PluginStatus {
  if (!stored?.enabled) return 'disabled'
  const agreed = stored.key === key && isCovered(descriptor.permissions, stored.granted)
  return agreed ? 'ready' : 'consent'
}

type ProbeResult = { descriptor: PluginDescriptor } | { error: string; newer?: boolean }

/** What a probing worker's message says about its plugin, or null for anything else. */
function probeResult(data: unknown): ProbeResult | null {
  const parsed = WorkerMessageSchema.safeParse(data)
  if (!parsed.success) return null
  if (parsed.data.t === 'error') return { error: parsed.data.message.split('\n')[0] ?? '' }
  if (parsed.data.t !== 'descriptor') return null
  const described = parseDescriptor(parsed.data.descriptor)
  if (described.ok) return { descriptor: described.descriptor }
  return { error: described.error, ...(described.newer ? { newer: true } : {}) }
}

export class PluginHost {
  readonly factory: WorkerFactory
  catalog = $state.raw<PluginCatalog | null>(null)
  readonly entries = new SvelteMap<string, PluginEntry>()
  readonly views = new SvelteMap<string, PaneView>()
  /** Choices a service supplied for its select settings, by plugin id then key. */
  readonly options = new SvelteMap<string, Record<string, readonly SelectOption[]>>()
  private readonly runners = new Map<string, Runner>()
  private readonly pendingRenders = new Map<string, unknown>()
  private started = false

  constructor(factory: WorkerFactory = createWorker) {
    this.factory = factory
  }

  /** Loads the catalog and follows the folder, the settings and sign-in changes. */
  async init(): Promise<void> {
    if (this.started) return
    this.started = true
    window.elecdex.plugins.onChange((catalog) => void this.apply(catalog))
    window.elecdex.plugins.onSession((id) => this.runners.get(id)?.post({ t: 'session' }))
    $effect.root(() => {
      $effect(() => {
        const plugins = appearance.settings.plugins
        queueMicrotask(() => this.sync(plugins))
      })
    })
    await this.apply(await window.elecdex.plugins.catalog())
  }

  /** The usable entry for a plugin id. */
  entry(id: string): PluginEntry | null {
    for (const entry of this.entries.values()) {
      if (entry.descriptor?.id === id && entry.status !== 'duplicate') return entry
    }
    for (const entry of this.entries.values()) {
      if (entry.descriptor === null && entry.knownId === id) return entry
    }
    return null
  }

  settingsOf(id: string): PluginSettings | undefined {
    return appearance.settings.plugins[id]
  }

  grant(id: string): Grant {
    return this.settingsOf(id)?.granted ?? NO_PERMISSIONS
  }

  values(id: string): Record<string, string | number | boolean> {
    const entry = this.entry(id)
    return settingValues(
      entry?.descriptor?.settings ?? [],
      this.settingsOf(id)?.values ?? {},
      this.options.get(id) ?? {},
    )
  }

  /** Whether a plugin's panes can show it now. */
  usable(id: string): boolean {
    return this.entry(id)?.status === 'ready'
  }

  async apply(catalog: PluginCatalog): Promise<void> {
    this.catalog = catalog
    const keys = new Set(catalog.plugins.map((p) => p.key))
    for (const [key, entry] of this.entries) {
      if (!keys.has(key)) this.remove(entry)
    }
    // One at a time: describing a plugin runs its top-level code, and a folder of plugins
    // that spin until the probe's deadline should hold one core, not all of them.
    for (const source of catalog.plugins) {
      const current = this.entries.get(source.key)
      if (current?.source.hash === source.hash && current.source.error === source.error) continue
      if (current) this.remove(current)
      await this.load(source, current?.descriptor?.id ?? current?.knownId ?? null)
    }
    this.markDuplicates()
    this.sync(appearance.settings.plugins)
  }

  private remove(entry: PluginEntry): void {
    this.entries.delete(entry.key)
    const id = entry.descriptor?.id
    if (id === undefined) return
    this.runners.get(id)?.stop()
    this.runners.delete(id)
    if (this.entry(id) === null) unregisterDynamic(id)
  }

  private async load(source: PluginSource, knownId: string | null): Promise<void> {
    const base: PluginEntry = {
      key: source.key,
      source,
      status: 'loading',
      error: null,
      descriptor: null,
      knownId,
    }
    this.entries.set(source.key, base)
    if (source.code === null) {
      this.entries.set(source.key, { ...base, status: 'error', error: source.error })
      return
    }
    const result = await this.probe(source)
    if (this.entries.get(source.key)?.source !== source) return
    if ('error' in result) {
      this.entries.set(source.key, {
        ...base,
        status: result.newer ? 'newer' : 'error',
        error: result.error,
      })
      return
    }
    this.entries.set(source.key, { ...base, status: 'disabled', descriptor: result.descriptor })
  }

  /** Asks a throwaway worker what the plugin is. */
  private probe(
    source: PluginSource,
  ): Promise<{ descriptor: PluginDescriptor } | { error: string; newer?: boolean }> {
    return new Promise((resolve) => {
      let worker: PluginWorker
      try {
        worker = this.factory(source)
      } catch (error) {
        resolve({ error: error instanceof Error ? error.message : String(error) })
        return
      }
      const finish = (
        result: { descriptor: PluginDescriptor } | { error: string; newer?: boolean },
      ) => {
        clearTimeout(timer)
        worker.terminate()
        resolve(result)
      }
      const timer = setTimeout(
        () => finish({ error: `did not describe itself within ${PROBE_TIMEOUT_MS / 1000}s` }),
        PROBE_TIMEOUT_MS,
      )
      worker.onMessage((data) => {
        const result = probeResult(data)
        if (result !== null) finish(result)
      })
      worker.post({ t: 'probe' })
    })
  }

  private markDuplicates(): void {
    const byId = new Map<string, PluginEntry[]>()
    for (const entry of this.entries.values()) {
      const id = entry.descriptor?.id
      if (id !== undefined) byId.set(id, [...(byId.get(id) ?? []), entry])
    }
    for (const [id, list] of byId) {
      if (list.length < 2) continue
      for (const entry of list) {
        this.entries.set(entry.key, {
          ...entry,
          status: 'duplicate',
          error: `${list.map((e) => e.key).join(' and ')} both use the id "${id}"`,
        })
      }
      this.runners.get(id)?.stop()
      this.runners.delete(id)
    }
  }

  /** Brings statuses, registrations and workers in line with the settings. */
  private sync(settings: Readonly<Record<string, PluginSettings>>): void {
    for (const entry of this.entries.values()) {
      const descriptor = entry.descriptor
      if (descriptor === null || entry.status === 'duplicate') continue
      const status = statusFor(entry.key, descriptor, settings[descriptor.id])
      if (status !== entry.status) this.entries.set(entry.key, { ...entry, status })
      this.register(descriptor)
      this.run(entry.source, descriptor, status === 'ready')
    }
  }

  private register(descriptor: PluginDescriptor): void {
    registerDynamic({
      id: descriptor.id,
      title: descriptor.title,
      description: descriptor.description,
      component: PluginPane,
      plugin: true,
      multiple: descriptor.multiple,
      ...(descriptor.minSize ? { minSize: descriptor.minSize } : {}),
    })
  }

  private run(source: PluginSource, descriptor: PluginDescriptor, allowed: boolean): void {
    let runner = this.runners.get(descriptor.id)
    if (!allowed) {
      runner?.stop()
      return
    }
    if (runner === undefined) {
      runner = new Runner(this, source, descriptor)
      this.runners.set(descriptor.id, runner)
    }
    const wanted = runner.background || runner.panes.size > 0
    if (wanted && !runner.running && runner.stopped === null) void runner.start()
    else if (!wanted) runner.stop()
    else if (runner.running) runner.settings(this.values(descriptor.id))
  }

  /** A pane of the plugin appeared; the worker starts if it is not running. */
  attach(id: string, pane: string, attached: Attached): void {
    const entry = this.entry(id)
    if (entry?.descriptor == null || entry.status !== 'ready') return
    this.views.set(pane, this.views.get(pane) ?? emptyView())
    this.run(entry.source, entry.descriptor, true)
    const runner = this.runners.get(id)
    runner?.attach(pane, attached)
    if (runner && !runner.running && runner.stopped === null) void runner.start()
    this.refresh(id)
  }

  detach(id: string, pane: string): void {
    this.views.delete(pane)
    this.pendingRenders.delete(pane)
    const runner = this.runners.get(id)
    if (!runner) return
    runner.detach(pane)
    if (runner.panes.size === 0 && !runner.background) runner.stop()
  }

  resize(id: string, pane: string, size: Attached['size']): void {
    this.runners.get(id)?.resize(pane, size)
  }

  show(id: string, pane: string, visible: boolean): void {
    this.runners.get(id)?.show(pane, visible)
  }

  action(id: string, pane: string, action: string, item?: string): void {
    this.runners
      .get(id)
      ?.post({ t: 'action', pane, action, ...(item === undefined ? {} : { item }) })
  }

  /** Starts a plugin again after it stopped answering or failed. */
  restart(id: string): void {
    const runner = this.runners.get(id)
    if (!runner) return
    runner.stopped = null
    runner.serviceError = null
    for (const pane of runner.panes.keys()) this.views.set(pane, emptyView())
    void runner.start()
  }

  /** Coalesces renders to the shared frame loop: only a pane's latest blocks are read. */
  render(pane: string, blocks: unknown): void {
    // A render means the view works again: its error goes now, so one reported after this
    // render - before the frame that draws it - is still shown.
    const current = this.views.get(pane)
    if (current?.error) this.views.set(pane, { ...current, error: null })
    const first = this.pendingRenders.size === 0
    this.pendingRenders.set(pane, blocks)
    if (!first) return
    nextFrame(() => {
      for (const [target, raw] of this.pendingRenders) {
        const view = this.views.get(target)
        if (!view) continue
        const { blocks: read, problems } = readBlocks(raw)
        this.views.set(target, { ...view, blocks: read, problems })
      }
      this.pendingRenders.clear()
    })
  }

  paneError(pane: string, message: string): void {
    const view = this.views.get(pane)
    if (view) this.views.set(pane, { ...view, error: message })
  }

  glow(pane: string): void {
    const view = this.views.get(pane)
    if (view) this.views.set(pane, { ...view, glowAt: Date.now() })
  }

  setOptions(id: string, key: string, options: readonly SelectOption[]): void {
    this.options.set(id, { ...(this.options.get(id) ?? {}), [key]: options })
  }

  /** Copies a runner's plugin-wide state into each of its panes' views. */
  refresh(id: string): void {
    const runner = this.runners.get(id)
    if (!runner) return
    for (const pane of runner.panes.keys()) {
      const view = this.views.get(pane) ?? emptyView()
      this.views.set(pane, {
        ...view,
        stopped: runner.stopped,
        error: runner.serviceError ?? view.error,
      })
    }
  }
}

export const plugins = new PluginHost()
