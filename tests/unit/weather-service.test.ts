import { readFileSync } from 'node:fs'
import type { JmaUpdate } from '@shared/weather'
import { describe, expect, it } from 'vitest'
import {
  type CachedForecasts,
  type FetchResponse,
  RETRY_BACKOFF_MS,
  WeatherService,
} from '../../src/main/weather/service.js'

const forecast = JSON.parse(
  readFileSync(new URL('./fixtures/jma-forecast-130000.json', import.meta.url), 'utf8'),
)

const jst = (s: string) => Date.parse(`${s}+09:00`)

/** A fake world: a clock, timers that run when the clock passes them, and a scripted server. */
function harness(opts: { now: number; cache?: CachedForecasts }) {
  let now = opts.now
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const requests: Array<{ url: string; headers: Record<string, string>; at: number }> = []
  const published: JmaUpdate[] = []
  let saved: CachedForecasts | null = null
  const responses: Array<
    Partial<FetchResponse> & { status: number; body?: unknown; etag?: string }
  > = []

  const service = new WeatherService({
    fetch: async (url, init) => {
      requests.push({ url, headers: init.headers, at: now })
      const next = responses.shift() ?? { status: 200, body: forecast, etag: '"v1"' }
      if (next.status === -1) throw new Error('offline')
      return {
        status: next.status,
        headers: { get: (name) => (name === 'etag' ? (next.etag ?? null) : null) },
        json: async () => next.body,
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
    baseUrl: 'https://example.test/bosai',
    userAgent: 'elecdex-test',
    loadCache: () => opts.cache ?? {},
    saveCache: (cache) => {
      saved = cache
    },
    publish: (update) => published.push(update),
  })

  const settle = () => new Promise((r) => setTimeout(r, 0))

  /** Advances the clock, running due timers in order and letting fetches settle. */
  async function advanceTo(target: number) {
    for (;;) {
      timers.sort((a, b) => a.at - b.at)
      const due = timers[0]
      if (!due || due.at > target) break
      timers.shift()
      now = due.at
      due.fn()
      await settle()
      await settle()
    }
    now = target
  }

  return {
    service,
    requests,
    published,
    responses,
    saved: () => saved,
    timers,
    settle,
    advanceTo,
  }
}

describe('WeatherService', () => {
  it('fetches once when a pane starts watching, then waits for the next publication', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.service.watch('130000')
    await h.settle()
    await h.settle()

    expect(h.requests).toHaveLength(1)
    expect(h.requests[0]?.url).toBe('https://example.test/bosai/forecast/data/forecast/130000.json')
    expect(h.requests[0]?.headers['User-Agent']).toBe('elecdex-test')
    expect(h.published.at(-1)?.forecast).not.toBeNull()

    // Nothing until 16:48, however long the pane stays open.
    await h.advanceTo(jst('2026-09-13T16:47:00'))
    expect(h.requests).toHaveLength(1)
    await h.advanceTo(jst('2026-09-13T16:48:30'))
    expect(h.requests).toHaveLength(2)
    expect(h.requests[1]?.at).toBe(jst('2026-09-13T16:48:00'))
  })

  it('asks conditionally after the first download, and a 304 keeps the forecast', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.service.watch('130000')
    await h.settle()
    await h.settle()

    h.responses.push({ status: 304 })
    await h.advanceTo(jst('2026-09-13T16:49:00'))
    expect(h.requests[1]?.headers['If-None-Match']).toBe('"v1"')
    expect(h.service.snapshot('130000').forecast).not.toBeNull()
    expect(h.service.snapshot('130000').error).toBeNull()
  })

  it('makes about a dozen requests a day at most', async () => {
    const h = harness({ now: jst('2026-09-13T00:30:00') })
    h.service.watch('130000')
    await h.advanceTo(jst('2026-09-14T00:30:00'))
    // 4 slots x 3 checks, plus the initial fetch.
    expect(h.requests.length).toBeLessThanOrEqual(13)
  })

  it('stops requesting when the last pane goes away', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.service.watch('130000')
    await h.settle()
    h.service.unwatch('130000')
    await h.advanceTo(jst('2026-09-15T12:00:00'))
    expect(h.requests).toHaveLength(1)
    expect(h.service.watching()).toEqual([])
  })

  it('retries a failure with backoff, keeping the last good forecast', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.service.watch('130000')
    await h.settle()
    await h.settle()

    h.responses.push({ status: -1 }, { status: 503 })
    await h.advanceTo(jst('2026-09-13T16:48:00'))
    expect(h.service.snapshot('130000').error).toBe('offline')
    expect(h.service.snapshot('130000').forecast).not.toBeNull()

    const failedAt = jst('2026-09-13T16:48:00')
    await h.advanceTo(failedAt + (RETRY_BACKOFF_MS[0] ?? 0))
    expect(h.requests.at(-1)?.at).toBe(failedAt + (RETRY_BACKOFF_MS[0] ?? 0))
    expect(h.service.snapshot('130000').error).toBe('HTTP 503')
  })

  it('rejects a response that is not a forecast', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.responses.push({ status: 200, body: { hello: 'world' } })
    h.service.watch('130000')
    await h.settle()
    await h.settle()
    expect(h.service.snapshot('130000')).toMatchObject({
      forecast: null,
      error: 'unexpected forecast format',
    })
  })

  it('does not re-download on restart when the cached copy is current', async () => {
    const checkedAt = jst('2026-09-13T11:21:00')
    const cache: CachedForecasts = {
      '130000': { forecast, etag: '"v1"', fetchedAt: checkedAt, checkedAt },
    }
    const h = harness({ now: jst('2026-09-13T12:00:00'), cache })
    h.service.watch('130000')
    await h.settle()
    expect(h.requests).toHaveLength(0)
    expect(h.service.snapshot('130000').forecast).not.toBeNull()
  })

  it('refreshes a cached copy from before the latest publication', async () => {
    const checkedAt = jst('2026-09-13T06:00:00')
    const cache: CachedForecasts = {
      '130000': { forecast, etag: '"v1"', fetchedAt: checkedAt, checkedAt },
    }
    const h = harness({ now: jst('2026-09-13T12:00:00'), cache })
    h.service.watch('130000')
    await h.settle()
    expect(h.requests).toHaveLength(1)
    expect(h.requests[0]?.headers['If-None-Match']).toBe('"v1"')
  })

  it('ignores anything that is not an office code', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.service.watch('../../etc')
    h.service.watch('13000')
    await h.settle()
    expect(h.requests).toHaveLength(0)
  })

  it('lists offices from the area list, once', async () => {
    const h = harness({ now: jst('2026-09-13T12:00:00') })
    h.responses.push({
      status: 200,
      body: {
        centers: {},
        offices: {
          '130000': { name: '東京都', enName: 'Tokyo', children: [] },
          '016000': { name: '石狩・空知・後志地方', enName: 'Ishikari', children: [] },
        },
      },
    })
    const first = await h.service.listOffices()
    const second = await h.service.listOffices()
    expect(first.map((o) => o.code)).toEqual(['016000', '130000'])
    expect(second).toBe(first)
    expect(h.requests.filter((r) => r.url.endsWith('area.json'))).toHaveLength(1)
  })
})
