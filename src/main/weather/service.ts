import {
  isOfficeCode,
  type JmaForecast,
  JmaForecastSchema,
  lastCheckAt,
  nextCheckAt,
  type OfficeInfo,
  type WeatherUpdate,
} from '@shared/weather'
import { z } from 'zod'

/**
 * Fetches JMA forecasts for the offices someone is watching, and nothing else.
 *
 *  - A forecast is requested only while a weather pane shows its office, and
 *    only when a new one may have been published: shortly before and after
 *    each publication slot (see nextCheckAt). No polling in between.
 *  - Every request after the first is conditional (If-None-Match), so an
 *    unchanged forecast costs JMA a 304.
 *  - A failure is retried with backoff, but never more often than every few
 *    minutes, and the last good forecast stays on screen meanwhile.
 *  - The last forecast per office is kept on disk, so a restart shows it at once
 *    and does not re-download a forecast that cannot have changed.
 *
 * Electron-free: the network, the clock, timers and storage are injected, so
 * the scheduling is unit-tested.
 */

export interface FetchResponse {
  status: number
  headers: { get(name: string): string | null }
  json(): Promise<unknown>
}

export interface WeatherDeps {
  fetch(url: string, init: { headers: Record<string, string> }): Promise<FetchResponse>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  /** Base of JMA's `bosai` tree; overridable so tests never touch the real site. */
  baseUrl: string
  userAgent: string
  loadCache(): CachedForecasts
  saveCache(cache: CachedForecasts): void
  /** Delivers an update to everyone watching the office. */
  publish(update: WeatherUpdate): void
}

const CachedEntry = z.object({
  forecast: z.unknown(),
  etag: z.string().nullable(),
  fetchedAt: z.number(),
  checkedAt: z.number(),
})
export const CachedForecastsSchema = z.record(z.string(), CachedEntry)
export type CachedForecasts = z.infer<typeof CachedForecastsSchema>

/** Delays after consecutive failures, capped at the last. */
export const RETRY_BACKOFF_MS = [5 * 60_000, 15 * 60_000, 30 * 60_000]

interface OfficeState {
  forecast: JmaForecast | null
  etag: string | null
  fetchedAt: number | null
  /** Last time a request succeeded, 200 or 304. */
  checkedAt: number | null
  error: string | null
  failures: number
  timer: unknown
  inFlight: Promise<void> | null
}

export class WeatherService {
  private readonly offices = new Map<string, OfficeState>()
  private readonly watched = new Set<string>()
  private officeList: Promise<OfficeInfo[]> | null = null
  private disposed = false
  private readonly deps: WeatherDeps

  constructor(deps: WeatherDeps) {
    this.deps = deps
    const cache = deps.loadCache()
    for (const [code, entry] of Object.entries(cache)) {
      const parsed = JmaForecastSchema.safeParse(entry.forecast)
      if (!isOfficeCode(code) || !parsed.success) continue
      this.offices.set(code, {
        forecast: parsed.data,
        etag: entry.etag,
        fetchedAt: entry.fetchedAt,
        checkedAt: entry.checkedAt,
        error: null,
        failures: 0,
        timer: null,
        inFlight: null,
      })
    }
  }

  /** The current state of an office, as sent to a newly watching page. */
  snapshot(office: string): WeatherUpdate {
    const s = this.offices.get(office)
    return {
      office,
      forecast: s?.forecast ?? null,
      fetchedAt: s?.fetchedAt ?? null,
      error: s?.error ?? null,
    }
  }

  /** Starts keeping an office up to date. Fetches at once if the copy may be stale. */
  watch(office: string): void {
    if (!isOfficeCode(office) || this.watched.has(office)) return
    this.watched.add(office)
    const state = this.state(office)
    const stale = state.checkedAt === null || state.checkedAt < lastCheckAt(this.deps.now())
    if (stale) void this.refresh(office)
    else this.schedule(office, nextCheckAt(this.deps.now()) - this.deps.now())
  }

  unwatch(office: string): void {
    if (!this.watched.delete(office)) return
    const state = this.offices.get(office)
    if (state?.timer != null) {
      this.deps.clearTimer(state.timer)
      state.timer = null
    }
  }

  watching(): string[] {
    return [...this.watched].sort()
  }

  /** The forecast offices, from JMA's area list; fetched once per run, on demand. */
  listOffices(): Promise<OfficeInfo[]> {
    this.officeList ??= this.fetchOffices().catch((cause) => {
      this.officeList = null // let the next attempt retry
      throw cause
    })
    return this.officeList
  }

  dispose(): void {
    this.disposed = true
    for (const office of [...this.watched]) this.unwatch(office)
  }

  private state(office: string): OfficeState {
    let s = this.offices.get(office)
    if (!s) {
      s = {
        forecast: null,
        etag: null,
        fetchedAt: null,
        checkedAt: null,
        error: null,
        failures: 0,
        timer: null,
        inFlight: null,
      }
      this.offices.set(office, s)
    }
    return s
  }

  private schedule(office: string, delayMs: number): void {
    const state = this.state(office)
    if (state.timer != null) this.deps.clearTimer(state.timer)
    state.timer = this.deps.setTimer(
      () => {
        state.timer = null
        if (this.watched.has(office)) void this.refresh(office)
      },
      Math.max(1000, delayMs),
    )
  }

  private refresh(office: string): Promise<void> {
    const state = this.state(office)
    state.inFlight ??= this.fetchForecast(office, state).finally(() => {
      state.inFlight = null
    })
    return state.inFlight
  }

  private async fetchForecast(office: string, state: OfficeState): Promise<void> {
    const headers: Record<string, string> = { 'User-Agent': this.deps.userAgent }
    if (state.etag !== null && state.forecast !== null) headers['If-None-Match'] = state.etag

    try {
      const response = await this.deps.fetch(
        `${this.deps.baseUrl}/forecast/data/forecast/${office}.json`,
        { headers },
      )
      const now = this.deps.now()
      await this.accept(state, response, now)
      state.error = null
      state.failures = 0
      this.persist()
      if (this.disposed) return
      this.deps.publish(this.snapshot(office))
      if (this.watched.has(office)) this.schedule(office, nextCheckAt(now) - now)
    } catch (cause) {
      if (this.disposed) return
      state.error = cause instanceof Error ? cause.message : String(cause)
      const backoff = RETRY_BACKOFF_MS[Math.min(state.failures, RETRY_BACKOFF_MS.length - 1)] ?? 0
      state.failures += 1
      this.deps.publish(this.snapshot(office))
      if (this.watched.has(office)) {
        // Retry, but never later than the next publication check.
        const now = this.deps.now()
        this.schedule(office, Math.min(backoff, nextCheckAt(now) - now))
      }
    }
  }

  /** Applies a 200 or 304 to the office's state; anything else throws. */
  private async accept(state: OfficeState, response: FetchResponse, now: number): Promise<void> {
    if (response.status === 304) {
      state.checkedAt = now
      return
    }
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
    const parsed = JmaForecastSchema.safeParse(await response.json())
    if (!parsed.success) throw new Error('unexpected forecast format')
    state.forecast = parsed.data
    state.etag = response.headers.get('etag')
    state.fetchedAt = now
    state.checkedAt = now
  }

  private async fetchOffices(): Promise<OfficeInfo[]> {
    const response = await this.deps.fetch(`${this.deps.baseUrl}/common/const/area.json`, {
      headers: { 'User-Agent': this.deps.userAgent },
    })
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
    const parsed = z
      .object({
        offices: z.record(z.string(), z.object({ name: z.string(), enName: z.string() }).loose()),
      })
      .loose()
      .safeParse(await response.json())
    if (!parsed.success) throw new Error('unexpected area list format')
    return Object.entries(parsed.data.offices)
      .filter(([code]) => isOfficeCode(code))
      .map(([code, o]) => ({ code, name: o.name, enName: o.enName }))
      .sort((a, b) => a.code.localeCompare(b.code))
  }

  private persist(): void {
    const cache: CachedForecasts = {}
    for (const [code, s] of this.offices) {
      if (s.forecast === null || s.fetchedAt === null || s.checkedAt === null) continue
      cache[code] = {
        forecast: s.forecast,
        etag: s.etag,
        fetchedAt: s.fetchedAt,
        checkedAt: s.checkedAt,
      }
    }
    try {
      this.deps.saveCache(cache)
    } catch {
      // A cache that cannot be written only costs a download on the next start.
    }
  }
}
