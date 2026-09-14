import {
  type Intensity,
  parseQuakeList,
  QUAKE_INTERVAL_MS,
  type Quake,
  type QuakeState,
  quakesToAlert,
} from '@shared/quakes'

/**
 * Keeps JMA's earthquake list current while something needs it, and decides
 * which earthquakes to announce.
 *
 *  - Active only while earthquake alerts are on or a quakes pane is open; off,
 *    it holds no timer and makes no request.
 *  - One request a minute, as JMA's max-age asks, conditional on the ETag: with
 *    no new report the answer is a 304 with no body, and nothing is parsed or sent.
 *  - A failure keeps the last list and retries with backoff.
 *  - Alerts go out once per earthquake, only for recent ones (so starting the app
 *    does not announce old news); the ids already announced are kept on disk.
 *
 * Electron-free: the network, clock, timers and storage are injected.
 */

export interface QuakeResponse {
  status: number
  headers: { get(name: string): string | null }
  json(): Promise<unknown>
}

export interface QuakeDeps {
  fetch(url: string, init: { headers: Record<string, string> }): Promise<QuakeResponse>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  /** Base of JMA's `bosai` tree; overridable so tests never touch the real site. */
  baseUrl: string
  userAgent: string
  loadAlerted(): string[]
  saveAlerted(ids: string[]): void
  /** The list changed (or activity, or the error). */
  publish(state: QuakeState): void
  /** Earthquakes to announce, newest first. */
  alert(quakes: Quake[]): void
}

/** Delays after consecutive failures, capped at the last. */
export const RETRY_BACKOFF_MS = [60_000, 2 * 60_000, 5 * 60_000, 10 * 60_000]
/** Announced ids remembered: far more earthquakes than an alert window can hold. */
export const ALERTED_KEPT = 200
/** Announcements of this run kept for pages that open later. */
export const ANNOUNCED_KEPT = 10

export class QuakeService {
  private readonly deps: QuakeDeps
  private active = false
  private quakes: Quake[] = []
  private etag: string | null = null
  private fetchedAt: number | null = null
  private error: string | null = null
  private failures = 0
  private timer: unknown = null
  private inFlight = false
  private alerts: { minIntensity: Intensity } | null = null
  /** Read from disk when first needed, so an app with alerts off never touches the file. */
  private alertedIds: Set<string> | null = null
  /** Announced in this run, newest first; a page that opens later shows the recent ones. */
  private announced: string[] = []

  constructor(deps: QuakeDeps) {
    this.deps = deps
  }

  private get alerted(): Set<string> {
    this.alertedIds ??= new Set(this.deps.loadAlerted().slice(-ALERTED_KEPT))
    return this.alertedIds
  }

  state(): QuakeState {
    return {
      active: this.active,
      quakes: this.quakes,
      fetchedAt: this.fetchedAt,
      error: this.error,
      announced: this.announced,
    }
  }

  /** Starts or stops keeping the list current. */
  setActive(active: boolean): void {
    if (active === this.active) return
    this.active = active
    if (active) {
      this.check()
    } else {
      this.cancel()
      this.failures = 0
    }
    this.deps.publish(this.state())
  }

  /**
   * Alerts at this intensity and above, or none. Turned on (or lowered) with a
   * list already at hand, a recent earthquake that now qualifies is announced at
   * once rather than at the next new report.
   */
  setAlerts(alerts: { minIntensity: Intensity } | null): void {
    this.alerts = alerts
    if (this.active && this.fetchedAt !== null) this.announce(this.deps.now())
  }

  dispose(): void {
    this.cancel()
    this.active = false
  }

  private cancel(): void {
    if (this.timer !== null) this.deps.clearTimer(this.timer)
    this.timer = null
  }

  private schedule(delayMs: number): void {
    this.cancel()
    if (!this.active) return
    this.timer = this.deps.setTimer(() => {
      this.timer = null
      this.check()
    }, delayMs)
  }

  private check(): void {
    if (this.inFlight || !this.active) return
    this.inFlight = true
    void this.request()
      .then(
        () => {
          this.failures = 0
          this.schedule(QUAKE_INTERVAL_MS)
        },
        (cause: unknown) => {
          const delay =
            RETRY_BACKOFF_MS[Math.min(this.failures, RETRY_BACKOFF_MS.length - 1)] ?? 60_000
          this.failures += 1
          const error = cause instanceof Error ? cause.message : String(cause)
          if (this.active && error !== this.error) {
            this.error = error
            this.deps.publish(this.state())
          }
          this.schedule(delay)
        },
      )
      .finally(() => {
        this.inFlight = false
      })
  }

  private async request(): Promise<void> {
    const headers: Record<string, string> = { 'User-Agent': this.deps.userAgent }
    if (this.etag !== null) headers['If-None-Match'] = this.etag
    const response = await this.deps.fetch(`${this.deps.baseUrl}/quake/data/list.json`, {
      headers,
    })
    if (!this.active) return
    const now = this.deps.now()
    if (response.status === 304 && this.fetchedAt !== null) {
      this.recovered()
      return
    }
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
    const body = await response.json()
    if (!Array.isArray(body)) throw new Error('unexpected earthquake list')
    this.quakes = parseQuakeList(body)
    this.etag = response.headers.get('etag')
    this.fetchedAt = now
    this.error = null
    if (!this.active) return
    this.deps.publish(this.state())
    this.announce(now)
  }

  private recovered(): void {
    if (this.error === null) return
    this.error = null
    this.deps.publish(this.state())
  }

  private announce(now: number): void {
    if (this.alerts === null) return
    const due = quakesToAlert(this.quakes, {
      minIntensity: this.alerts.minIntensity,
      now,
      alerted: this.alerted,
    })
    if (due.length === 0) return
    for (const quake of due) this.alerted.add(quake.id)
    const kept = [...this.alerted].slice(-ALERTED_KEPT)
    this.alertedIds = new Set(kept)
    try {
      this.deps.saveAlerted(kept)
    } catch (error) {
      console.warn('[elecdex] could not save announced earthquakes', error)
    }
    this.announced = [...due.map((q) => q.id), ...this.announced].slice(0, ANNOUNCED_KEPT)
    this.deps.publish(this.state())
    this.deps.alert(due)
  }
}
