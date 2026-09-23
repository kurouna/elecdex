import { fileURLToPath } from 'node:url'
import { CH } from '@shared/channels'
import {
  isMetricSourceId,
  type MetricSample,
  type MetricSourceId,
  type MetricsStats,
} from '@shared/metrics'
import { ipcMain, type UtilityProcess, utilityProcess, type WebContents } from 'electron'
import type { WorkerMessage, WorkerRequest } from '../../services/metrics.worker.js'
import { whenPageGoes } from '../ipc/page-gone.js'
import { SubscriptionRegistry } from './subscriptions.js'

const WORKER = fileURLToPath(new URL('./metrics.worker.js', import.meta.url))

/** Restart delays after the collector crashes, capped. */
const RESTART_BACKOFF_MS = [500, 2000, 5000, 15_000]

/**
 * Fans metric samples out from the collector process to subscribed renderers.
 *
 *  - The collector is forked lazily, on the first subscription; an app whose
 *    layout has no monitoring widgets never starts it.
 *  - The collector is always told the complete active set, never a delta, so it
 *    cannot drift from the registry.
 *  - A renderer that reloads or closes is dropped from every source. Without
 *    that, a reload would leave the old page's subscriptions polling forever -
 *    the same shape of leak the terminal session reaper had to fix in phase 2.
 *  - A new subscriber gets the last known sample at once, so a widget does not
 *    render empty until the next tick of a slow source (some are 10 minutes).
 */
export class MetricsBroker {
  private readonly registry = new SubscriptionRegistry<WebContents>()
  private readonly latest = new Map<string, MetricSample>()
  private worker: UtilityProcess | null = null
  private restarts = 0
  private restartTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private nextNonce = 1
  private readonly pendingStats = new Map<number, (m: WorkerMessage & { t: 'stats' }) => void>()

  subscribe(sender: WebContents, id: MetricSourceId): void {
    this.track(sender)
    const newlyActive = this.registry.subscribe(sender, id)

    const cached = this.latest.get(id)
    if (cached) this.send(sender, cached)

    if (newlyActive) this.syncWorker()
  }

  unsubscribe(sender: WebContents, id: MetricSourceId): void {
    if (this.registry.unsubscribe(sender, id)) this.syncWorker()
  }

  async stats(): Promise<MetricsStats> {
    const active = this.registry.activeSources().filter(isMetricSourceId)
    if (!this.worker) return { active, collections: {}, running: false }

    const nonce = this.nextNonce++
    const reply = await new Promise<(WorkerMessage & { t: 'stats' }) | null>((resolve) => {
      const timer = setTimeout(() => {
        this.pendingStats.delete(nonce)
        resolve(null)
      }, 2000)
      this.pendingStats.set(nonce, (m) => {
        clearTimeout(timer)
        resolve(m)
      })
      this.request({ t: 'stats', nonce })
    })

    return {
      // What the collector is actually polling, not what we asked it to poll:
      // the point of the diagnostic is to catch a disagreement between the two.
      active: (reply?.active ?? active).filter(isMetricSourceId),
      collections: (reply?.collections ?? {}) as MetricsStats['collections'],
      running: reply !== null,
    }
  }

  dispose(): void {
    this.disposed = true
    if (this.restartTimer) clearTimeout(this.restartTimer)
    this.worker?.kill()
    this.worker = null
  }

  /** Watches a renderer so its subscriptions die with its page. */
  private track(sender: WebContents): void {
    // A reload keeps the same WebContents but starts a fresh page whose preload
    // knows nothing of the old subscriptions.
    whenPageGoes(sender, this, () => {
      if (this.registry.dropSubscriber(sender)) this.syncWorker()
    })
  }

  private send(sender: WebContents, sample: MetricSample): void {
    if (!sender.isDestroyed()) sender.send(CH.metrics.sample, sample)
  }

  private syncWorker(): void {
    if (this.disposed) return
    const ids = this.registry.activeSources()
    if (ids.length > 0 && !this.worker) this.startWorker()
    this.request({ t: 'active', ids })
  }

  private request(message: WorkerRequest): void {
    this.worker?.postMessage(message)
  }

  private startWorker(): void {
    const child = utilityProcess.fork(WORKER, [], { serviceName: 'elecdex metrics' })
    this.worker = child

    child.on('message', (message: WorkerMessage) => this.onWorkerMessage(message))
    child.on('spawn', () => {
      this.restarts = 0
    })
    child.on('exit', (code) => {
      if (this.worker !== child) return
      this.worker = null
      if (this.disposed) return

      // Losing the collector must not silently freeze every widget. Log it and
      // restart with backoff, as long as anyone is still watching.
      console.error(`[elecdex] metrics collector exited with code ${code}`)
      const delay = RESTART_BACKOFF_MS[Math.min(this.restarts, RESTART_BACKOFF_MS.length - 1)]
      this.restarts += 1
      this.restartTimer = setTimeout(() => {
        this.restartTimer = null
        if (this.registry.activeSources().length > 0) this.syncWorker()
      }, delay)
    })

    // The fork's message queue opens asynchronously; messages sent before then
    // are queued by Electron, so the active set posted by syncWorker arrives.
  }

  private onWorkerMessage(message: WorkerMessage): void {
    switch (message.t) {
      case 'sample': {
        if (!isMetricSourceId(message.id)) return
        const sample = { id: message.id, at: message.at, data: message.data } as MetricSample
        this.latest.set(message.id, sample)
        for (const sender of this.registry.subscribers(message.id)) this.send(sender, sample)
        return
      }
      case 'error':
        // A single failed collection is not fatal - the next tick retries - but
        // it must be visible, not swallowed.
        console.warn(`[elecdex] metric ${message.id} failed: ${message.message}`)
        return
      case 'stats':
        this.pendingStats.get(message.nonce)?.(message)
        this.pendingStats.delete(message.nonce)
        return
    }
  }
}

export function registerMetricsIpc(): { dispose: () => void } {
  const broker = new MetricsBroker()

  ipcMain.on(CH.metrics.subscribe, (event, raw: unknown) => {
    if (isMetricSourceId(raw)) broker.subscribe(event.sender, raw)
  })
  ipcMain.on(CH.metrics.unsubscribe, (event, raw: unknown) => {
    if (isMetricSourceId(raw)) broker.unsubscribe(event.sender, raw)
  })
  ipcMain.handle(CH.metrics.stats, () => broker.stats())

  return {
    dispose: () => {
      broker.dispose()
      ipcMain.removeAllListeners(CH.metrics.subscribe)
      ipcMain.removeAllListeners(CH.metrics.unsubscribe)
      ipcMain.removeHandler(CH.metrics.stats)
    },
  }
}
