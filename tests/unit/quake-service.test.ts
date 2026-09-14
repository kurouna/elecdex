import { QUAKE_INTERVAL_MS, type Quake, type QuakeState } from '@shared/quakes'
import { describe, expect, it } from 'vitest'
import { ALERTED_KEPT, QuakeService, RETRY_BACKOFF_MS } from '../../src/main/quakes/service.js'

const NOW = Date.parse('2026-09-14T12:00:00+09:00')

/** A list.json entry for an earthquake `minutesAgo` before the clock. */
function entry(eid: string, minutesAgo: number, maxi: string, now: number) {
  const at = new Date(now - minutesAgo * 60_000).toISOString()
  return {
    ttl: '震源・震度情報',
    ift: '発表',
    eid,
    at,
    rdt: at,
    anm: '岩手県沖',
    en_anm: 'Off the Coast of Iwate Prefecture',
    cod: '+40.4+142.1-10000/',
    mag: '5.1',
    maxi,
  }
}

interface Reply {
  status: number
  body?: unknown
  etag?: string
}

function harness(opts: { alerted?: string[] } = {}) {
  let now = NOW
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const requests: Array<{ url: string; headers: Record<string, string> }> = []
  const published: QuakeState[] = []
  const alerts: Quake[][] = []
  const saved: string[][] = []
  const replies: Reply[] = []
  let loads = 0

  const service = new QuakeService({
    fetch: async (url, init) => {
      requests.push({ url, headers: init.headers })
      const reply = replies.shift() ?? { status: 304 }
      if (reply.status === -1) throw new Error('offline')
      return {
        status: reply.status,
        headers: { get: (name: string) => (name === 'etag' ? (reply.etag ?? null) : null) },
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
    baseUrl: 'https://example.test/bosai',
    userAgent: 'elecdex-test',
    loadAlerted: () => {
      loads += 1
      return opts.alerted ?? []
    },
    saveAlerted: (ids) => saved.push(ids),
    publish: (state) => published.push(state),
    alert: (quakes) => alerts.push(quakes),
  })

  const settle = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  }

  async function advanceBy(ms: number) {
    const target = now + ms
    for (;;) {
      timers.sort((a, b) => a.at - b.at)
      const due = timers[0]
      if (!due || due.at > target) break
      timers.shift()
      now = due.at
      due.fn()
      await settle()
    }
    now = target
  }

  const list = (...entries: unknown[]): Reply => ({
    status: 200,
    body: entries,
    etag: `"${requests.length}"`,
  })

  return {
    service,
    requests,
    published,
    alerts,
    saved,
    replies,
    timers,
    settle,
    advanceBy,
    list,
    now: () => now,
    loads: () => loads,
  }
}

describe('QuakeService', () => {
  it('does nothing while inactive, not even reading the announced ids', async () => {
    const h = harness()
    h.service.setAlerts(null)
    await h.advanceBy(10 * QUAKE_INTERVAL_MS)
    expect(h.requests).toEqual([])
    expect(h.timers).toEqual([])
    expect(h.loads()).toBe(0)
  })

  it('fetches when activated, then every minute, conditionally; a 304 sends nothing', async () => {
    const h = harness()
    h.replies.push(h.list(entry('a', 10, '3', NOW)))
    h.service.setActive(true)
    await h.settle()
    expect(h.requests[0]?.url).toBe('https://example.test/bosai/quake/data/list.json')
    expect(h.published.at(-1)).toMatchObject({ active: true, error: null })
    expect(h.published.at(-1)?.quakes.map((q) => q.id)).toEqual(['a'])
    const sent = h.published.length

    await h.advanceBy(QUAKE_INTERVAL_MS - 1)
    expect(h.requests).toHaveLength(1)
    await h.advanceBy(1)
    expect(h.requests).toHaveLength(2)
    expect(h.requests[1]?.headers['If-None-Match']).toBe('"0"')
    expect(h.published).toHaveLength(sent)
  })

  it('stops when deactivated, and says so', async () => {
    const h = harness()
    h.replies.push(h.list())
    h.service.setActive(true)
    await h.settle()
    h.service.setActive(false)
    expect(h.published.at(-1)?.active).toBe(false)
    expect(h.timers).toEqual([])
    await h.advanceBy(10 * QUAKE_INTERVAL_MS)
    expect(h.requests).toHaveLength(1)
  })

  it('keeps the list on a failure and retries with backoff', async () => {
    const h = harness()
    h.replies.push(h.list(entry('a', 10, '3', NOW)), { status: 503 }, { status: -1 })
    h.service.setActive(true)
    await h.settle()
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.published.at(-1)).toMatchObject({ error: 'HTTP 503' })
    expect(h.published.at(-1)?.quakes).toHaveLength(1)
    await h.advanceBy((RETRY_BACKOFF_MS[0] ?? 0) - 1)
    expect(h.requests).toHaveLength(2)
    await h.advanceBy(1)
    expect(h.requests).toHaveLength(3)
    // 304 after the failures: the error clears.
    await h.advanceBy(RETRY_BACKOFF_MS[1] ?? 0)
    expect(h.published.at(-1)?.error).toBeNull()
  })

  it('announces a recent strong earthquake once, not old or weak ones', async () => {
    const h = harness()
    h.service.setAlerts({ minIntensity: '5-' })
    h.replies.push(
      h.list(
        entry('strong', 3, '5-', NOW),
        entry('weak', 2, '3', NOW),
        entry('old', 120, '6+', NOW),
      ),
    )
    h.service.setActive(true)
    await h.settle()
    expect(h.alerts.map((batch) => batch.map((q) => q.id))).toEqual([['strong']])
    expect(h.saved.at(-1)).toEqual(['strong'])
    // Kept in the state too, for a page that was not listening yet (startup, reload).
    expect(h.published.at(-1)?.announced).toEqual(['strong'])

    // The same list again (a new ETag, say a report elsewhere): no second alert.
    h.replies.push(h.list(entry('strong', 4, '5-', NOW), entry('weak', 3, '3', NOW)))
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.alerts).toHaveLength(1)
  })

  it('announces an earthquake when a later report raises it to the threshold', async () => {
    const h = harness()
    h.service.setAlerts({ minIntensity: '5-' })
    h.replies.push(h.list(entry('q', 2, '4', NOW)))
    h.service.setActive(true)
    await h.settle()
    expect(h.alerts).toEqual([])
    h.replies.push(h.list(entry('q', 3, '5+', NOW)))
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.alerts.map((batch) => batch.map((q) => q.maxIntensity))).toEqual([['5+']])
  })

  it('does not announce again what an earlier run announced', async () => {
    const h = harness({ alerted: ['strong'] })
    h.service.setAlerts({ minIntensity: '5-' })
    h.replies.push(h.list(entry('strong', 3, '5-', NOW)))
    h.service.setActive(true)
    await h.settle()
    expect(h.alerts).toEqual([])
  })

  it('announces at once when alerts are turned on with a qualifying earthquake already listed', async () => {
    const h = harness()
    h.replies.push(h.list(entry('q', 5, '5-', NOW)))
    // A quakes pane keeps the list current with alerts off...
    h.service.setActive(true)
    await h.settle()
    expect(h.alerts).toEqual([])
    // ...then alerts go on: no need to wait for the next new report.
    h.service.setAlerts({ minIntensity: '5-' })
    expect(h.alerts.map((batch) => batch.map((q) => q.id))).toEqual([['q']])
  })

  it('remembers a bounded number of announced ids', async () => {
    const h = harness({ alerted: Array.from({ length: ALERTED_KEPT + 50 }, (_, i) => `old${i}`) })
    h.service.setAlerts({ minIntensity: '1' })
    h.replies.push(h.list(entry('new', 1, '1', NOW)))
    h.service.setActive(true)
    await h.settle()
    expect(h.saved.at(-1)).toHaveLength(ALERTED_KEPT)
    expect(h.saved.at(-1)?.at(-1)).toBe('new')
  })
})
