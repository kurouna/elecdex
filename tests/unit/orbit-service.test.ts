import { readFileSync } from 'node:fs'
import {
  ORBIT_OFFLINE_MS,
  ORBIT_REFRESH_MS,
  ORBIT_REFUSED_MS,
  type OrbitSet,
  type OrbitUpdate,
} from '@shared/orbits'
import { describe, expect, it } from 'vitest'
import { type OrbitCache, type OrbitResponse, OrbitService } from '../../src/main/orbits/service.js'

/**
 * The orbit service against a made-up CelesTrak and a made-up clock: that it
 * asks as seldom as CelesTrak's rules ask, keeps what it got, and stops after a
 * refusal - across a restart too.
 */

const STATIONS = readFileSync('tests/fixtures/orbits/stations.json', 'utf8')
const STARLINK = readFileSync('tests/fixtures/orbits/starlink-60.tle', 'utf8')
const HOUR = 60 * 60_000

function harness(options: { status?: number; saved?: Partial<Record<OrbitSet, OrbitCache>> } = {}) {
  let now = Date.UTC(2026, 8, 23, 3, 0, 0)
  const timers: { at: number; fn: () => void }[] = []
  const asked: string[] = []
  const published: OrbitUpdate[] = []
  const disk: Partial<Record<OrbitSet, OrbitCache>> = { ...options.saved }
  let status = options.status ?? 200
  let bodyFails = false
  const service = new OrbitService({
    baseUrl: 'https://celestrak.test',
    userAgent: 'elecdex/test',
    fetch: async (url): Promise<OrbitResponse> => {
      asked.push(url)
      return {
        status,
        text: async () => {
          if (bodyFails) throw new Error('connection reset')
          return url.includes('starlink') ? STARLINK : STATIONS
        },
        discard: () => {},
      }
    },
    now: () => now,
    setTimer: (fn, ms) => {
      const timer = { at: now + ms, fn }
      timers.push(timer)
      return timer
    },
    clearTimer: (handle) => {
      const i = timers.indexOf(handle as (typeof timers)[number])
      if (i >= 0) timers.splice(i, 1)
    },
    load: (set) => disk[set] ?? null,
    save: (set, cache) => {
      disk[set] = cache
    },
    publish: (update) => published.push(update),
  })
  const flush = async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve()
  }
  return {
    service,
    asked,
    published,
    disk,
    setStatus: (next: number) => {
      status = next
    },
    failBody: (fails: boolean) => {
      bodyFails = fails
    },
    advance: async (ms: number) => {
      const until = now + ms
      await flush()
      for (;;) {
        timers.sort((a, b) => a.at - b.at)
        const next = timers[0]
        if (next === undefined || next.at > until) break
        timers.shift()
        now = next.at
        next.fn()
        await flush()
      }
      now = until
      await flush()
    },
  }
}

describe('the orbit service', () => {
  it('asks for nothing until a pane shows a set', async () => {
    const h = harness()
    await h.advance(3 * 24 * HOUR)
    expect(h.asked).toEqual([])
  })

  it('asks once, keeps the stations on disk, and asks again only twice a day', async () => {
    const h = harness()
    h.service.watch('stations')
    await h.advance(0)
    expect(h.asked).toHaveLength(1)
    expect(h.asked[0]).toContain('GROUP=stations')
    expect(h.published.at(-1)?.elements.map((e) => e.id)).toEqual([25544, 48274])
    expect(h.disk.stations?.fetchedAt).not.toBeNull()
    await h.advance(ORBIT_REFRESH_MS.stations - 1)
    expect(h.asked).toHaveLength(1)
    await h.advance(1)
    expect(h.asked).toHaveLength(2)
  })

  it('asks for Starlink only once a day, and only while shown', async () => {
    const h = harness()
    h.service.watch('starlink')
    await h.advance(0)
    expect(h.asked).toHaveLength(1)
    await h.advance(ORBIT_REFRESH_MS.starlink - HOUR)
    expect(h.asked).toHaveLength(1)
    h.service.unwatch('starlink')
    await h.advance(3 * 24 * HOUR)
    expect(h.asked).toHaveLength(1)
  })

  it('stops for the day after anything but a 200, and keeps the last good elements', async () => {
    const h = harness()
    h.service.watch('stations')
    await h.advance(0)
    h.setStatus(403)
    await h.advance(ORBIT_REFRESH_MS.stations)
    expect(h.asked).toHaveLength(2)
    expect(h.published.at(-1)?.error).toMatch(/403/)
    expect(h.published.at(-1)?.elements).toHaveLength(2)
    // Refused: nothing more until a day has passed, however long the pane stays open.
    h.setStatus(200)
    await h.advance(ORBIT_REFUSED_MS - 1)
    expect(h.asked).toHaveLength(2)
    await h.advance(1)
    expect(h.asked).toHaveLength(3)
  })

  it('treats a body that breaks off as the network down: kept, said, and asked again in an hour', async () => {
    const h = harness()
    h.service.watch('stations')
    await h.advance(0)
    h.failBody(true)
    await h.advance(ORBIT_REFRESH_MS.stations)
    expect(h.asked).toHaveLength(2)
    expect(h.published.at(-1)?.error).toMatch(/could not be reached/)
    expect(h.published.at(-1)?.elements).toHaveLength(2)
    // The wait is saved, so a restart is not a way round it either.
    expect(h.disk.stations?.quietUntil).not.toBeNull()
    h.failBody(false)
    await h.advance(ORBIT_OFFLINE_MS)
    expect(h.asked).toHaveLength(3)
    expect(h.published.at(-1)?.error).toBeNull()
  })

  it('keeps a refusal across a restart, and a fresh copy spares the download', async () => {
    const now = Date.UTC(2026, 8, 23, 3, 0, 0)
    const refused = harness({
      saved: {
        stations: { elements: [], fetchedAt: null, error: 'x', quietUntil: now + 5 * HOUR },
      },
    })
    refused.service.watch('stations')
    await refused.advance(5 * HOUR - 1)
    expect(refused.asked).toEqual([])

    const fresh = harness({
      saved: { stations: { elements: [], fetchedAt: now - HOUR, error: null, quietUntil: null } },
    })
    fresh.service.watch('stations')
    await fresh.advance(0)
    expect(fresh.asked).toEqual([])
    expect(fresh.service.snapshot('stations').fetchedAt).toBe(now - HOUR)
  })
})
