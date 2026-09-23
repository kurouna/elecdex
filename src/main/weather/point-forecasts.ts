import type { WeatherReport, WeatherUpdate } from '@shared/weather-report'
import { parseLocationKey } from '@shared/weather-report'
import {
  type MetForecast,
  MetForecastSchema,
  metReport,
  type NwsForecast,
  NwsForecastSchema,
  type NwsPoint,
  NwsPointSchema,
  nwsReport,
} from '@shared/weather-sources'
import { z } from 'zod'
import type { FetchResponse } from './service.js'
import { RETRY_BACKOFF_MS } from './service.js'

/**
 * Forecasts for a point on the map, from MET Norway (everywhere) or the US
 * National Weather Service, kept current only while a pane shows them.
 *
 * Each source's terms are followed to the letter:
 *
 *  - MET Norway: an identifying User-Agent, coordinates to four decimals, no
 *    request before the `Expires` the last response gave, and If-Modified-Since
 *    with the exact `Last-Modified` value. Requests are spread out with a small
 *    per-location offset, so every copy of the app does not ask at the same
 *    second.
 *  - NWS: an identifying User-Agent; the /points lookup, which only maps a place
 *    to its forecast office grid, is kept for a day; forecasts are asked for
 *    hourly, conditionally where the server gives Last-Modified.
 *
 * The raw responses are kept (and cached on disk) and a report is built from
 * them whenever one is sent, so "today" moves on at midnight without a fetch.
 * Electron-free and deterministic, for unit tests.
 */

export interface PointDeps {
  fetch(url: string, init: { headers: Record<string, string> }): Promise<FetchResponse>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  metBaseUrl: string
  nwsBaseUrl: string
  userAgent: string
  loadCache(): PointCache
  saveCache(cache: PointCache): void
  publish(update: WeatherUpdate): void
}

const Entry = z.object({
  raw: z.unknown(),
  hourly: z.unknown().optional(),
  point: z.unknown().optional(),
  pointAt: z.number().optional(),
  lastModified: z.string().nullable(),
  expiresAt: z.number(),
  fetchedAt: z.number(),
})
export const PointCacheSchema = z.record(z.string(), Entry)
export type PointCache = z.infer<typeof PointCacheSchema>

/** MET Norway asks for no more than this often, whatever Expires says. */
export const MET_MIN_INTERVAL_MS = 30 * 60_000
export const NWS_INTERVAL_MS = 60 * 60_000
export const NWS_POINT_TTL_MS = 24 * 60 * 60_000
/** A place no pane has fetched for this long is dropped from the cache. */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60_000
/** At most this much is added to a location's schedule, the same amount every time. */
const SPREAD_MS = 90_000

interface State {
  raw: unknown
  hourly: unknown
  point: NwsPoint | null
  pointAt: number
  lastModified: string | null
  expiresAt: number
  fetchedAt: number | null
  error: string | null
  failures: number
  timer: unknown
  inFlight: Promise<void> | null
  /** `raw` and `hourly` read into their forecasts once, for the raw they were read from. */
  read: { raw: unknown; hourly: unknown; report: ReadForecast | null } | null
  /** The report last sent to the pages, to send another only when it differs. */
  sent: string | null
}

/** A place's forecast as validated, whichever source gave it. */
type ReadForecast =
  | { source: 'met'; forecast: MetForecast }
  | { source: 'nws'; forecast: NwsForecast; hourly: NwsForecast | null }

const blank = (): State => ({
  raw: null,
  hourly: null,
  point: null,
  pointAt: 0,
  lastModified: null,
  expiresAt: 0,
  fetchedAt: null,
  error: null,
  failures: 0,
  timer: null,
  inFlight: null,
  read: null,
  sent: null,
})

/** A stable offset in [0, SPREAD_MS) for a key. */
export function spreadFor(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (h >>> 0) % SPREAD_MS
}

export class PointForecasts {
  private readonly deps: PointDeps
  private readonly states = new Map<string, State>()
  private readonly watched = new Set<string>()
  private disposed = false

  constructor(deps: PointDeps) {
    this.deps = deps
    for (const [key, entry] of Object.entries(deps.loadCache())) {
      if (parseLocationKey(key) === null) continue
      const point = NwsPointSchema.safeParse(entry.point)
      this.states.set(key, {
        ...blank(),
        raw: entry.raw,
        hourly: entry.hourly ?? null,
        point: point.success ? point.data : null,
        pointAt: entry.pointAt ?? 0,
        lastModified: entry.lastModified,
        expiresAt: entry.expiresAt,
        fetchedAt: entry.fetchedAt,
      })
    }
  }

  snapshot(key: string): WeatherUpdate {
    const s = this.states.get(key)
    return {
      key,
      report: s ? this.report(key, s) : null,
      fetchedAt: s?.fetchedAt ?? null,
      error: s?.error ?? null,
    }
  }

  watch(key: string): void {
    const parsed = parseLocationKey(key)
    if (this.watched.has(key) || parsed === null || parsed.source === 'jma') return
    this.watched.add(key)
    const state = this.state(key)
    const wait = state.raw === null ? 0 : state.expiresAt - this.deps.now()
    if (wait <= 0) void this.refresh(key)
    else this.schedule(key, wait)
  }

  unwatch(key: string): void {
    if (!this.watched.delete(key)) return
    const state = this.states.get(key)
    if (state?.timer != null) {
      this.deps.clearTimer(state.timer)
      state.timer = null
    }
  }

  watching(): string[] {
    return [...this.watched].sort()
  }

  dispose(): void {
    this.disposed = true
    for (const key of [...this.watched]) this.unwatch(key)
  }

  private state(key: string): State {
    let s = this.states.get(key)
    if (!s) {
      s = blank()
      this.states.set(key, s)
    }
    return s
  }

  private report(key: string, s: State): WeatherReport | null {
    const parsed = parseLocationKey(key)
    if (parsed === null || parsed.source === 'jma' || s.raw === null) return null
    const read = this.read(parsed.source, s)
    try {
      if (read?.source === 'met') {
        return metReport(read.forecast, { name: '', timeZone: parsed.timeZone }, this.deps.now())
      }
      if (read?.source !== 'nws' || s.point === null) return null
      return nwsReport(s.point, read.forecast, read.hourly, '')
    } catch {
      return null
    }
  }

  /**
   * The raw documents validated into forecasts, once per download: a report
   * is built for every page that subscribes and every update, and a forecast
   * is a large document to validate each time.
   */
  private read(source: 'met' | 'nws', s: State): ReadForecast | null {
    if (s.read !== null && s.read.raw === s.raw && s.read.hourly === s.hourly) return s.read.report
    let report: ReadForecast | null = null
    if (source === 'met') {
      const forecast = MetForecastSchema.safeParse(s.raw)
      if (forecast.success) report = { source, forecast: forecast.data }
    } else {
      const forecast = NwsForecastSchema.safeParse(s.raw)
      const hourly = NwsForecastSchema.safeParse(s.hourly)
      if (forecast.success)
        report = { source, forecast: forecast.data, hourly: hourly.success ? hourly.data : null }
    }
    s.read = { raw: s.raw, hourly: s.hourly, report }
    return report
  }

  private schedule(key: string, delayMs: number): void {
    const state = this.state(key)
    if (state.timer != null) this.deps.clearTimer(state.timer)
    state.timer = this.deps.setTimer(
      () => {
        state.timer = null
        if (this.watched.has(key)) void this.refresh(key)
      },
      Math.max(1000, delayMs),
    )
  }

  private refresh(key: string): Promise<void> {
    const state = this.state(key)
    state.inFlight ??= this.fetchFor(key, state).finally(() => {
      state.inFlight = null
    })
    return state.inFlight
  }

  private async fetchFor(key: string, state: State): Promise<void> {
    const parsed = parseLocationKey(key)
    if (parsed === null || parsed.source === 'jma') return
    const failing = state.error !== null
    try {
      const nextAt =
        parsed.source === 'met'
          ? await this.fetchMet(parsed.lat, parsed.lon, state)
          : await this.fetchNws(parsed.lat, parsed.lon, state)
      state.error = null
      state.failures = 0
      state.expiresAt = nextAt
      // Kept on disk either way: when the source may be asked again must hold across a restart.
      this.persist()
      if (this.disposed) return
      // Sent when a page would see something new: a 304 still moves "now" on through
      // the forecast (reports are built for the time of asking), and ends a run of failures.
      const update = this.snapshot(key)
      const report = JSON.stringify(update.report)
      if (report !== state.sent || failing) {
        state.sent = report
        this.deps.publish(update)
      }
      if (this.watched.has(key)) this.schedule(key, nextAt + spreadFor(key) - this.deps.now())
    } catch (cause) {
      if (this.disposed) return
      state.error = cause instanceof Error ? cause.message : String(cause)
      const backoff = RETRY_BACKOFF_MS[Math.min(state.failures, RETRY_BACKOFF_MS.length - 1)] ?? 0
      state.failures += 1
      this.deps.publish(this.snapshot(key))
      // Never sooner than the source allows, even when retrying.
      const earliest = Math.max(backoff, state.expiresAt - this.deps.now())
      if (this.watched.has(key)) this.schedule(key, earliest)
    }
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { 'User-Agent': this.deps.userAgent, ...extra }
  }

  /** Returns when the next request may be made. */
  private async fetchMet(lat: number, lon: number, state: State): Promise<number> {
    const url = `${this.deps.metBaseUrl}/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`
    const conditional =
      state.lastModified !== null && state.raw !== null
        ? { 'If-Modified-Since': state.lastModified }
        : undefined
    const response = await this.deps.fetch(url, { headers: this.headers(conditional) })
    const now = this.deps.now()
    const expires = Date.parse(response.headers.get('expires') ?? '')
    const nextAt = Math.max(Number.isFinite(expires) ? expires : 0, now + MET_MIN_INTERVAL_MS)
    if (response.status === 304) return nextAt
    if (response.status !== 200) throw new Error(`MET Norway answered HTTP ${response.status}`)
    const body = await response.json()
    if (!MetForecastSchema.safeParse(body).success) throw new Error('unexpected MET Norway format')
    state.raw = body
    state.lastModified = response.headers.get('last-modified')
    state.fetchedAt = now
    return nextAt
  }

  private async fetchNws(lat: number, lon: number, state: State): Promise<number> {
    const now = this.deps.now()
    const accept = { Accept: 'application/geo+json' }
    if (state.point === null || now - state.pointAt > NWS_POINT_TTL_MS) {
      const response = await this.deps.fetch(`${this.deps.nwsBaseUrl}/points/${lat},${lon}`, {
        headers: this.headers(accept),
      })
      if (response.status === 404) throw new Error('outside the National Weather Service area')
      if (response.status !== 200) throw new Error(`NWS answered HTTP ${response.status}`)
      const point = NwsPointSchema.safeParse(await response.json())
      if (!point.success) throw new Error('unexpected NWS point format')
      // The forecast URLs come from the response: follow them only to the same server.
      const origin = new URL(this.deps.nwsBaseUrl).origin
      for (const u of [point.data.properties.forecast, point.data.properties.forecastHourly]) {
        if (new URL(u).origin !== origin) throw new Error('NWS pointed to another server')
      }
      state.point = point.data
      state.pointAt = now
    }
    const forecast = await this.nwsGet(state.point.properties.forecast, state.lastModified)
    const hourly = await this.nwsGet(state.point.properties.forecastHourly, null)
    if (forecast !== null) {
      state.raw = forecast.body
      state.lastModified = forecast.lastModified
      state.fetchedAt = this.deps.now()
    }
    if (hourly !== null) state.hourly = hourly.body
    return this.deps.now() + NWS_INTERVAL_MS
  }

  /** A forecast document, or null when it has not changed. */
  private async nwsGet(
    url: string,
    lastModified: string | null,
  ): Promise<{ body: NwsForecast; lastModified: string | null } | null> {
    const response = await this.deps.fetch(url, {
      headers: this.headers({
        Accept: 'application/geo+json',
        ...(lastModified ? { 'If-Modified-Since': lastModified } : {}),
      }),
    })
    if (response.status === 304) return null
    if (response.status !== 200) throw new Error(`NWS answered HTTP ${response.status}`)
    const parsed = NwsForecastSchema.safeParse(await response.json())
    if (!parsed.success) throw new Error('unexpected NWS forecast format')
    return { body: parsed.data, lastModified: response.headers.get('last-modified') }
  }

  private persist(): void {
    const cache: PointCache = {}
    const now = this.deps.now()
    for (const [key, s] of this.states) {
      if (s.raw === null || s.fetchedAt === null) continue
      if (!this.watched.has(key) && now - s.fetchedAt > CACHE_TTL_MS) {
        this.states.delete(key)
        continue
      }
      cache[key] = {
        raw: s.raw,
        ...(s.hourly !== null ? { hourly: s.hourly } : {}),
        ...(s.point !== null ? { point: s.point, pointAt: s.pointAt } : {}),
        lastModified: s.lastModified,
        expiresAt: s.expiresAt,
        fetchedAt: s.fetchedAt,
      }
    }
    try {
      this.deps.saveCache(cache)
    } catch {
      // A cache that cannot be written only costs a download on the next start.
    }
  }
}
