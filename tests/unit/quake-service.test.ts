import { readFileSync } from 'node:fs'
import { notificationsFor } from '@shared/quake-notifications'
import { QUAKE_INTERVAL_MS, type QuakeAlert, type QuakeState } from '@shared/quakes'
import { describe, expect, it } from 'vitest'
import {
  ALERTED_KEPT,
  type QuakeConfig,
  QuakeService,
  RETRY_BACKOFF_MS,
} from '../../src/main/quakes/service.js'

const NOW = Date.parse('2026-09-14T12:00:00+09:00')
const JMA = 'https://jma.test/bosai'
const USGS = 'https://usgs.test'
const NOAA = 'https://noaa.test'
const JMA_QUAKES = `${JMA}/quake/data/list.json`
const JMA_TSUNAMI = `${JMA}/tsunami/data/list.json`
const USGS_FEED = `${USGS}/earthquakes/feed/v1.0/summary/4.5_day.geojson`
const PTWC = `${NOAA}/events/xml/PHEBAtom.xml`
const NTWC = `${NOAA}/events/xml/PAAQAtom.xml`

/** A list.json entry for an earthquake `minutesAgo` before the clock. */
function entry(eid: string, minutesAgo: number, maxi: string) {
  const at = new Date(NOW - minutesAgo * 60_000).toISOString()
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

function usgsFeature(id: string, minutesAgo: number, mag: number) {
  return {
    id,
    properties: {
      type: 'earthquake',
      time: NOW - minutesAgo * 60_000,
      mag,
      place: 'Somewhere far',
      url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
    },
    geometry: { coordinates: [140, 35, 20] },
  }
}

const tsunamiReport = (code: string) => ({
  Head: { Headline: { Text: '津波警報を発表しました。' } },
  Body: {
    Tsunami: {
      Forecast: {
        Item: [{ Area: { Name: '岩手県' }, Category: { Kind: { Code: code } } }],
      },
    },
  },
})

const noaaWarning = readFileSync(
  new URL('./fixtures/quakes/noaa-paaq-information.xml', import.meta.url),
  'utf8',
)
  .replace('<strong>Category:</strong> Information', '<strong>Category:</strong> Warning')
  .replaceAll(
    '2026-09-11T10:49:50Z',
    new Date(NOW - 10 * 60_000).toISOString().replace(/\.\d+Z$/, 'Z'),
  )

interface Reply {
  status: number
  body?: string
  etag?: string
}

/** A fake world: a clock, timers that run when it passes them, and a scripted server per URL. */
function harness(opts: { alerted?: string[] } = {}) {
  let now = NOW
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const requests: Array<{ url: string; headers: Record<string, string> }> = []
  const published: QuakeState[] = []
  const alerts: QuakeAlert[] = []
  const saved: string[][] = []
  const replies = new Map<string, Reply[]>()
  /** What a URL answers when nothing is scripted: an empty list, or a 304 when asked conditionally. */
  const fallback = (url: string, headers: Record<string, string>): Reply => {
    if (headers['If-None-Match'] || headers['If-Modified-Since']) return { status: 304 }
    if (url === USGS_FEED) return { status: 200, body: '{"features":[]}', etag: '"u"' }
    if (url === PTWC || url === NTWC) return { status: 200, body: '<feed></feed>', etag: '"n"' }
    return { status: 200, body: '[]', etag: '"e"' }
  }
  let loads = 0

  const service = new QuakeService({
    fetch: async (url, init) => {
      requests.push({ url, headers: init.headers })
      const reply = replies.get(url)?.shift() ?? fallback(url, init.headers)
      if (reply.status === -1) throw new Error('offline')
      return {
        status: reply.status,
        headers: { get: (name: string) => (name === 'etag' ? (reply.etag ?? null) : null) },
        text: async () => reply.body ?? '',
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
    urls: { jma: JMA, usgs: USGS, noaa: NOAA },
    userAgent: 'elecdex-test',
    loadAlerted: () => {
      loads += 1
      return opts.alerted ?? []
    },
    saveAlerted: (ids) => saved.push(ids),
    publish: (state) => published.push(state),
    alert: (alert) => alerts.push(alert),
  })

  const settle = async () => {
    for (let i = 0; i < 40; i++) await Promise.resolve()
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

  const reply = (url: string, ...list: Reply[]) =>
    replies.set(url, [...(replies.get(url) ?? []), ...list])
  let tag = 0
  const json = (value: unknown, etag = `"t${++tag}"`): Reply => ({
    status: 200,
    body: JSON.stringify(value),
    etag,
  })
  const count = (url: string) => requests.filter((r) => r.url === url).length
  const configure = (config: Partial<QuakeConfig>) =>
    service.configure({ active: true, source: 'jma', rule: null, tsunami: true, ...config })

  return {
    service,
    requests,
    published,
    alerts,
    saved,
    timers,
    settle,
    advanceBy,
    reply,
    json,
    count,
    configure,
    loads: () => loads,
  }
}

const jmaAlerts = { rule: { source: 'jma', minIntensity: '5-' } } as const

describe('QuakeService', () => {
  it('does nothing while inactive, not even reading the announced keys', async () => {
    const h = harness()
    h.configure({ active: false, ...jmaAlerts })
    await h.advanceBy(10 * QUAKE_INTERVAL_MS)
    expect(h.requests).toEqual([])
    expect(h.timers).toEqual([])
    expect(h.loads()).toBe(0)
  })

  it('checks JMA’s earthquake and tsunami lists every minute, conditionally; a 304 sends nothing', async () => {
    const h = harness()
    h.reply(JMA_QUAKES, h.json([entry('a', 10, '3')], '"q1"'))
    h.configure({})
    await h.settle()
    expect(h.count(JMA_QUAKES)).toBe(1)
    expect(h.count(JMA_TSUNAMI)).toBe(1)
    expect(h.published.at(-1)).toMatchObject({ active: true, source: 'jma', tsunami: null })
    expect(h.published.at(-1)?.quakes.map((q) => q.id)).toEqual(['a'])
    const sent = h.published.length

    await h.advanceBy(QUAKE_INTERVAL_MS - 1)
    expect(h.count(JMA_QUAKES)).toBe(1)
    await h.advanceBy(1)
    expect(h.count(JMA_QUAKES)).toBe(2)
    expect(h.requests.filter((r) => r.url === JMA_QUAKES)[1]?.headers['If-None-Match']).toBe('"q1"')
    expect(h.published).toHaveLength(sent)
    // The world's services are never asked while the source is Japan.
    expect(h.requests.some((r) => r.url.startsWith(USGS) || r.url.startsWith(NOAA))).toBe(false)
  })

  it('publishes a new list once, with what it announced', async () => {
    const h = harness()
    h.reply(
      JMA_QUAKES,
      h.json([entry('strong', 3, '5-'), entry('weak', 2, '3'), entry('old', 120, '6+')]),
    )
    h.configure(jmaAlerts)
    await h.settle()
    const lists = h.published.filter((s) => s.quakes.length > 0)
    expect(lists).toHaveLength(1)
    expect(lists[0]?.announced).toEqual(['strong'])
    expect(h.alerts).toEqual([
      { quakes: [expect.objectContaining({ id: 'strong' })], tsunami: null },
    ])
    expect(h.saved.at(-1)).toEqual(['strong'])
  })

  it('stops when deactivated, and says so', async () => {
    const h = harness()
    h.configure({})
    await h.settle()
    h.configure({ active: false })
    expect(h.published.at(-1)?.active).toBe(false)
    expect(h.timers).toEqual([])
    const asked = h.requests.length
    await h.advanceBy(10 * QUAKE_INTERVAL_MS)
    expect(h.requests).toHaveLength(asked)
  })

  it('keeps the list on a failure and retries with backoff; a tsunami failure does not count', async () => {
    const h = harness()
    h.reply(JMA_QUAKES, h.json([entry('a', 10, '3')]), { status: 503 }, { status: -1 })
    h.reply(JMA_TSUNAMI, { status: 500 }, { status: 500 })
    h.configure({})
    await h.settle()
    expect(h.published.at(-1)).toMatchObject({ error: null })
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.published.at(-1)).toMatchObject({ error: 'HTTP 503' })
    expect(h.published.at(-1)?.quakes).toHaveLength(1)
    await h.advanceBy((RETRY_BACKOFF_MS[0] ?? 0) - 1)
    expect(h.count(JMA_QUAKES)).toBe(2)
    await h.advanceBy(1)
    expect(h.count(JMA_QUAKES)).toBe(3)
    await h.advanceBy(RETRY_BACKOFF_MS[1] ?? 0)
    expect(h.published.at(-1)?.error).toBeNull()
  })

  it('announces an earthquake when a later report raises it, and not again after a restart', async () => {
    const h = harness()
    h.reply(JMA_QUAKES, h.json([entry('q', 2, '4')]), h.json([entry('q', 3, '5+')]))
    h.configure(jmaAlerts)
    await h.settle()
    expect(h.alerts).toEqual([])
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.alerts.map((a) => a.quakes.map((q) => q.maxIntensity))).toEqual([['5+']])

    const again = harness({ alerted: ['q'] })
    again.reply(JMA_QUAKES, again.json([entry('q', 3, '5+')]))
    again.configure(jmaAlerts)
    await again.settle()
    expect(again.alerts).toEqual([])
  })

  it('announces at once when alerts are turned on with a qualifying earthquake already listed', async () => {
    const h = harness()
    h.reply(JMA_QUAKES, h.json([entry('q', 5, '5-')]))
    h.configure({})
    await h.settle()
    expect(h.alerts).toEqual([])
    h.configure(jmaAlerts)
    expect(h.alerts.map((a) => a.quakes.map((q) => q.id))).toEqual([['q']])
    expect(h.published.at(-1)?.announced).toEqual(['q'])
  })

  it('reads a JMA tsunami report once, announces it once per level, and follows its lifting', async () => {
    const h = harness()
    const listed = (json: string, minutesAgo: number) => [
      { eid: 'ev', json, rdt: new Date(NOW - minutesAgo * 60_000).toISOString(), ift: '発表' },
    ]
    h.reply(JMA_TSUNAMI, h.json(listed('r1.json', 5)), { status: 304 })
    h.reply(JMA_TSUNAMI, h.json(listed('r2.json', 1)), h.json(listed('r3.json', 0)))
    h.reply(`${JMA}/tsunami/data/r1.json`, h.json(tsunamiReport('62')))
    h.reply(`${JMA}/tsunami/data/r2.json`, h.json(tsunamiReport('51')))
    h.reply(`${JMA}/tsunami/data/r3.json`, h.json(tsunamiReport('60')))
    h.configure(jmaAlerts)
    await h.settle()
    expect(h.published.at(-1)?.tsunami).toMatchObject({ level: 'advisory', eventId: 'ev' })
    expect(h.alerts.map((a) => a.tsunami?.level)).toEqual(['advisory'])

    // A 304 on the list: the report is not fetched again, and nothing is sent.
    const sent = h.published.length
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.count(`${JMA}/tsunami/data/r1.json`)).toBe(1)
    expect(h.published).toHaveLength(sent)

    // Raised to a warning: announced again.
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.published.at(-1)?.tsunami?.level).toBe('warning')
    expect(h.alerts.map((a) => a.tsunami?.level)).toEqual(['advisory', 'warning'])

    // Lifted: no tsunami in effect, nothing announced.
    await h.advanceBy(QUAKE_INTERVAL_MS)
    expect(h.published.at(-1)?.tsunami).toBeNull()
    expect(h.alerts).toHaveLength(2)
  })

  it('does not announce a tsunami with tsunami alerts off, but still shows it', async () => {
    const h = harness()
    h.reply(JMA_TSUNAMI, h.json([{ eid: 'ev', json: 'r.json', rdt: new Date(NOW).toISOString() }]))
    h.reply(`${JMA}/tsunami/data/r.json`, h.json(tsunamiReport('51')))
    h.configure({ ...jmaAlerts, tsunami: false })
    await h.settle()
    expect(h.published.at(-1)?.tsunami?.level).toBe('warning')
    expect(h.alerts).toEqual([])
  })

  it('reads the world from the USGS and NOAA, by magnitude', async () => {
    const h = harness()
    h.reply(
      USGS_FEED,
      h.json({ features: [usgsFeature('big', 20, 6.4), usgsFeature('small', 5, 5.2)] }),
    )
    h.reply(NTWC, { status: 200, body: noaaWarning, etag: '"w"' })
    h.configure({ source: 'usgs', rule: { source: 'usgs', minMagnitude: 6 } })
    await h.settle()
    const state = h.published.at(-1)
    expect(state).toMatchObject({ source: 'usgs' })
    expect(state?.quakes.map((q) => q.id)).toEqual(['small', 'big'])
    expect(state?.tsunami).toMatchObject({ source: 'noaa', level: 'warning' })
    expect(h.alerts).toHaveLength(1)
    expect(h.alerts[0]?.quakes.map((q) => q.id)).toEqual(['big'])
    expect(h.alerts[0]?.tsunami?.level).toBe('warning')
    expect(h.count(PTWC)).toBe(1)
    expect(h.requests.some((r) => r.url.startsWith(JMA))).toBe(false)
  })

  it('starts over when the source is switched, even with a check in flight', async () => {
    const h = harness()
    h.reply(JMA_QUAKES, h.json([entry('japan', 5, '3')]))
    h.configure({})
    // Switched before the JMA check has answered.
    h.configure({ source: 'usgs' })
    await h.settle()
    const state = h.published.at(-1)
    expect(state?.source).toBe('usgs')
    expect(state?.quakes.some((q) => q.source === 'jma')).toBe(false)
    expect(h.count(USGS_FEED)).toBe(1)

    // And back: JMA is asked afresh, not conditionally.
    h.reply(JMA_QUAKES, h.json([entry('japan', 6, '3')]))
    h.configure({ source: 'jma' })
    await h.settle()
    expect(h.published.at(-1)?.quakes.map((q) => q.id)).toEqual(['japan'])
    const lastJma = h.requests.filter((r) => r.url === JMA_QUAKES).at(-1)
    expect(lastJma?.headers['If-None-Match']).toBeUndefined()
  })

  it('remembers a bounded number of announced keys', async () => {
    const h = harness({ alerted: Array.from({ length: ALERTED_KEPT + 50 }, (_, i) => `old${i}`) })
    h.reply(JMA_QUAKES, h.json([entry('new', 1, '1')]))
    h.configure({ rule: { source: 'jma', minIntensity: '1' } })
    await h.settle()
    expect(h.saved.at(-1)).toHaveLength(ALERTED_KEPT)
    expect(h.saved.at(-1)?.at(-1)).toBe('new')
  })
})

describe('notificationsFor', () => {
  it('writes the tsunami first, then each earthquake, crediting the source', async () => {
    const h = harness()
    h.reply(USGS_FEED, h.json({ features: [usgsFeature('big', 20, 6.4)] }))
    h.reply(NTWC, { status: 200, body: noaaWarning, etag: '"w"' })
    h.configure({ source: 'usgs', rule: { source: 'usgs', minMagnitude: 6 } })
    await h.settle()
    const alert = h.alerts[0] as QuakeAlert
    const [tsunami, quake] = notificationsFor(alert, 'en')
    expect(tsunami?.title).toMatch(/^Tsunami warning · \d\d:\d\d$/)
    expect(tsunami?.body).toContain('Amchitka')
    expect(tsunami?.body).toContain('NOAA')
    expect(quake?.title).toMatch(/^Earthquake \d\d:\d\d · M6\.4$/)
    expect(quake?.body).toBe('Somewhere far · M6.4 · depth 20 km\nSource: USGS')
    expect(notificationsFor(alert, 'ja')[0]?.title).toMatch(/^津波警報 · /)
  })
})
