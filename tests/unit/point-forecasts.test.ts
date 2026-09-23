import { readFileSync } from 'node:fs'
import type { WeatherUpdate } from '@shared/weather-report'
import { MetForecastSchema } from '@shared/weather-sources'
import { describe, expect, it, vi } from 'vitest'
import {
  MET_MIN_INTERVAL_MS,
  NWS_INTERVAL_MS,
  PointForecasts,
  spreadFor,
} from '../../src/main/weather/point-forecasts.js'

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'))

const MET_KEY = 'met:51.5085,-0.1257:Europe/London'
const NWS_KEY = 'nws:40.7143,-74.006:America/New_York'

interface Reply {
  status: number
  body?: unknown
  headers?: Record<string, string>
}

function harness(route: (url: string, headers: Record<string, string>) => Reply) {
  let now = Date.parse('2026-09-13T12:00:00Z')
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const requests: Array<{ url: string; headers: Record<string, string> }> = []
  const published: WeatherUpdate[] = []

  const service = new PointForecasts({
    fetch: async (url, init) => {
      requests.push({ url, headers: init.headers })
      const reply = route(url, init.headers)
      if (reply.status === -1) throw new Error('offline')
      return {
        status: reply.status,
        headers: { get: (name) => reply.headers?.[name.toLowerCase()] ?? null },
        json: async () => reply.body,
      }
    },
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextId++
      timers.push({ at: now + ms, fn, id })
      return id
    },
    clearTimer: (id) => {
      const i = timers.findIndex((t) => t.id === id)
      if (i >= 0) timers.splice(i, 1)
    },
    metBaseUrl: 'https://met.test/weatherapi',
    nwsBaseUrl: 'https://api.weather.gov',
    userAgent: 'elecdex-test',
    loadCache: () => ({}),
    saveCache: () => {},
    publish: (update) => published.push(update),
  })

  const settle = () => new Promise((r) => setTimeout(r, 0))
  /** Moves the clock forward, running timers that come due. */
  const advance = async (ms: number) => {
    const end = now + ms
    for (;;) {
      timers.sort((a, b) => a.at - b.at)
      const next = timers[0]
      if (!next || next.at > end) break
      timers.shift()
      now = next.at
      next.fn()
      await settle()
    }
    now = end
  }
  return { service, requests, published, timers, settle, advance, now: () => now }
}

describe('MET Norway forecasts', () => {
  const met = fixture('met-london.json')

  it('identifies itself, honours Expires, and asks conditionally after that', async () => {
    const expires = new Date(Date.parse('2026-09-13T13:00:00Z')).toUTCString()
    const h = harness((_url, headers) =>
      headers['If-Modified-Since']
        ? { status: 304, headers: { expires } }
        : {
            status: 200,
            body: met,
            headers: { expires, 'last-modified': 'Sun, 13 Sep 2026 11:40:00 GMT' },
          },
    )
    h.service.watch(MET_KEY)
    await h.settle()
    expect(h.requests).toHaveLength(1)
    expect(h.requests[0]?.url).toBe(
      'https://met.test/weatherapi/locationforecast/2.0/complete?lat=51.5085&lon=-0.1257',
    )
    expect(h.requests[0]?.headers['User-Agent']).toBe('elecdex-test')
    expect(h.published.at(-1)?.report?.source.id).toBe('met')

    // Nothing before Expires (an hour away) plus this location's offset.
    await h.advance(60 * 60_000 + spreadFor(MET_KEY) - 1000)
    expect(h.requests).toHaveLength(1)
    await h.advance(2000)
    expect(h.requests).toHaveLength(2)
    expect(h.requests[1]?.headers['If-Modified-Since']).toBe('Sun, 13 Sep 2026 11:40:00 GMT')
  })

  it('sends after a 304 only what a page would see differently, and reads the forecast once', async () => {
    const expires = new Date(Date.parse('2026-09-13T13:00:00Z')).toUTCString()
    const h = harness((_url, headers) =>
      headers['If-Modified-Since']
        ? { status: 304, headers: { expires } }
        : { status: 200, body: met, headers: { expires, 'last-modified': 'x' } },
    )
    h.service.watch(MET_KEY)
    await h.settle()
    // Four hours of checks answered 304: the forecast is the same, but "now" moves on through it.
    await h.advance(4 * 60 * 60_000)
    expect(h.requests.length).toBeGreaterThan(2)
    const reports = h.published.map((update) => JSON.stringify(update.report))
    // Nothing sent twice alike, and what the pane holds is the report as of now, not of the download.
    expect(reports.every((report, i) => i === 0 || report !== reports[i - 1])).toBe(true)
    expect(reports.at(-1)).toBe(JSON.stringify(h.service.snapshot(MET_KEY).report))
    // A page subscribing asks for a snapshot; the forecast is not validated again for it.
    const parse = vi.spyOn(MetForecastSchema, 'safeParse')
    for (let i = 0; i < 5; i += 1) expect(h.service.snapshot(MET_KEY).report).not.toBeNull()
    expect(parse).not.toHaveBeenCalled()
    parse.mockRestore()
  })

  it('waits at least thirty minutes even when Expires is sooner, and keeps the report on failure', async () => {
    let fail = false
    const h = harness(() =>
      fail
        ? { status: -1 }
        : { status: 200, body: met, headers: { expires: new Date(0).toUTCString() } },
    )
    h.service.watch(MET_KEY)
    await h.settle()
    fail = true
    await h.advance(MET_MIN_INTERVAL_MS - 1000)
    expect(h.requests).toHaveLength(1)
    await h.advance(spreadFor(MET_KEY) + 2000)
    expect(h.requests).toHaveLength(2)
    expect(h.published.at(-1)?.error).toBe('offline')
    // The last good report stays on screen.
    expect(h.published.at(-1)?.report).not.toBeNull()
  })

  it('stops when no pane watches', async () => {
    const h = harness(() => ({ status: 200, body: met }))
    h.service.watch(MET_KEY)
    await h.settle()
    h.service.unwatch(MET_KEY)
    expect(h.timers).toHaveLength(0)
    expect(h.service.watching()).toEqual([])
  })
})

describe('NWS forecasts', () => {
  const point = fixture('nws-point-nyc.json')
  const forecast = fixture('nws-forecast-nyc.json')
  const hourly = fixture('nws-hourly-nyc.json')

  const route = (url: string): Reply => {
    if (url.includes('/points/')) return { status: 200, body: point }
    if (url.endsWith('/forecast/hourly')) return { status: 200, body: hourly }
    if (url.endsWith('/forecast')) return { status: 200, body: forecast }
    return { status: 404 }
  }

  it('looks the point up once, then fetches the forecast hourly', async () => {
    const h = harness(route)
    h.service.watch(NWS_KEY)
    await h.settle()
    await h.settle()
    await h.settle()
    expect(h.requests.map((r) => new URL(r.url).pathname)).toEqual([
      '/points/40.7143,-74.006',
      '/gridpoints/OKX/33,42/forecast',
      '/gridpoints/OKX/33,42/forecast/hourly',
    ])
    expect(h.requests.every((r) => r.headers.Accept === 'application/geo+json')).toBe(true)
    expect(h.published.at(-1)?.report?.days.length).toBeGreaterThan(5)

    await h.advance(NWS_INTERVAL_MS + spreadFor(NWS_KEY) + 1000)
    await h.settle()
    expect(h.requests.filter((r) => r.url.includes('/points/'))).toHaveLength(1)
    expect(h.requests.filter((r) => r.url.endsWith('/forecast'))).toHaveLength(2)
  })

  it('says so for a place outside the United States', async () => {
    const h = harness(() => ({ status: 404 }))
    h.service.watch('nws:51.5085,-0.1257:Europe/London')
    await h.settle()
    expect(h.published.at(-1)?.error).toMatch(/outside/)
  })

  it('refuses forecast URLs on another server', async () => {
    const h = harness((url) =>
      url.includes('/points/')
        ? {
            status: 200,
            body: {
              properties: {
                forecast: 'https://evil.example/forecast',
                forecastHourly: 'https://evil.example/forecast/hourly',
                timeZone: 'America/New_York',
              },
            },
          }
        : { status: 200, body: forecast },
    )
    h.service.watch(NWS_KEY)
    await h.settle()
    expect(h.requests.some((r) => r.url.includes('evil.example'))).toBe(false)
    expect(h.published.at(-1)?.error).toMatch(/another server/)
  })
})
