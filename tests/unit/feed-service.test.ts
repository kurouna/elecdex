import { FEED_INTERVAL_MS, type FeedUpdate } from '@shared/feeds'
import { describe, expect, it } from 'vitest'
import type { ParsedFeed } from '../../src/main/feeds/parse.js'
import {
  CACHE_MAX_FEEDS,
  CACHE_TTL_MS,
  cacheHintMs,
  decodeFeed,
  type FeedCache,
  FeedService,
  MAX_CONCURRENT,
  MAX_INTERVAL_MS,
  RETRY_BACKOFF_MS,
  readLimited,
} from '../../src/main/feeds/service.js'

const START = Date.UTC(2026, 8, 14, 0, 0)
const A = 'https://a.test/feed'
const B = 'https://b.test/feed'
const C = 'https://c.test/feed'

interface Reply {
  status: number
  headers?: Record<string, string>
  parsed?: ParsedFeed
  /** Resolves the response only when released; for concurrency tests. */
  hold?: boolean
}

const parsedFeed = (title: string, ttlMinutes: number | null = null): ParsedFeed => ({
  title,
  items: [{ title: `${title} story`, link: `https://${title}.test/1`, at: START }],
  ttlMinutes,
})

/** A fake world: a clock, timers that run when the clock passes them, and a scripted server per URL. */
function harness(opts: { cache?: FeedCache; now?: number } = {}) {
  let now = opts.now ?? START
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  const requests: Array<{ url: string; headers: Record<string, string>; at: number }> = []
  const published: FeedUpdate[] = []
  const saved: FeedCache[] = []
  const replies = new Map<string, Reply[]>()
  const held: Array<() => void> = []
  let parses = 0

  const service = new FeedService({
    fetch: async (url, init) => {
      requests.push({ url, headers: init.headers, at: now })
      const reply = replies.get(url)?.shift() ?? { status: 200 }
      if (reply.hold) await new Promise<void>((resolve) => held.push(resolve))
      if (reply.status === -1) throw new Error('offline')
      const headers = new Map(Object.entries(reply.headers ?? {}))
      return {
        status: reply.status,
        headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
        bytes: async () => new TextEncoder().encode(JSON.stringify(reply.parsed ?? null)),
      }
    },
    parse: async (xml, url) => {
      parses += 1
      const parsed = JSON.parse(xml) as ParsedFeed | null
      return parsed ?? parsedFeed(new URL(url).hostname.split('.')[0] ?? 'x')
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
    userAgent: 'elecdex-test',
    loadCache: () => opts.cache ?? {},
    saveCache: (cache) => saved.push(cache),
    publish: (update) => published.push(update),
  })

  const settle = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve()
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

  const reply = (url: string, ...list: Reply[]) => replies.set(url, list)
  const count = (url: string) => requests.filter((r) => r.url === url).length

  return {
    service,
    requests,
    published,
    saved,
    held,
    timers,
    settle,
    advanceBy,
    reply,
    count,
    parses: () => parses,
  }
}

describe('FeedService', () => {
  it('fetches a feed when it is first watched, then every 15 minutes', async () => {
    const h = harness()
    h.service.watch(A)
    await h.settle()
    expect(h.count(A)).toBe(1)
    expect(h.requests[0]?.headers['User-Agent']).toBe('elecdex-test')
    expect(h.published.at(-1)).toMatchObject({ url: A, title: 'a', error: null })
    expect(h.published.at(-1)?.items).toHaveLength(1)

    await h.advanceBy(FEED_INTERVAL_MS - 1000)
    expect(h.count(A)).toBe(1)
    await h.advanceBy(1000)
    expect(h.count(A)).toBe(2)
    await h.advanceBy(60 * 60_000)
    expect(h.count(A)).toBe(6)
  })

  it('asks conditionally after a download; a 304 is not parsed, saved or sent again', async () => {
    const h = harness()
    h.reply(
      A,
      { status: 200, headers: { etag: '"v1"', 'last-modified': 'Mon, 14 Sep 2026 00:00:00 GMT' } },
      { status: 304 },
    )
    h.service.watch(A)
    await h.settle()
    const sent = h.published.length
    await h.advanceBy(FEED_INTERVAL_MS)
    expect(h.requests[1]?.headers['If-None-Match']).toBe('"v1"')
    expect(h.requests[1]?.headers['If-Modified-Since']).toBe('Mon, 14 Sep 2026 00:00:00 GMT')
    expect(h.parses()).toBe(1)
    expect(h.saved).toHaveLength(1)
    expect(h.published).toHaveLength(sent)
    expect(h.service.snapshot(A).items).toHaveLength(1)
  })

  it('waits longer when the feed asks, but never more than an hour', async () => {
    const h = harness()
    h.reply(
      B,
      { status: 200, parsed: parsedFeed('b', 40) },
      { status: 200, headers: { 'cache-control': 'public, max-age=86400' } },
    )
    h.service.watch(B)
    await h.settle()
    await h.advanceBy(39 * 60_000)
    expect(h.count(B)).toBe(1)
    await h.advanceBy(60_000)
    expect(h.count(B)).toBe(2)
    await h.advanceBy(MAX_INTERVAL_MS)
    expect(h.count(B)).toBe(3)
  })

  it('reads caching hints from max-age or Expires', () => {
    const headers = (values: Record<string, string>) => ({
      get: (name: string) => values[name] ?? null,
    })
    expect(cacheHintMs(headers({ 'cache-control': 'no-transform, max-age=600' }), START)).toBe(
      600_000,
    )
    expect(cacheHintMs(headers({ expires: new Date(START + 90_000).toUTCString() }), START)).toBe(
      90_000,
    )
    expect(cacheHintMs(headers({}), START)).toBeNull()
  })

  it('keeps the last items on a failure and retries with backoff, or as the server asks', async () => {
    const h = harness()
    h.reply(
      A,
      { status: 200 },
      { status: 500 },
      { status: -1 },
      { status: 503, headers: { 'retry-after': '3600' } },
    )
    h.service.watch(A)
    await h.settle()
    await h.advanceBy(FEED_INTERVAL_MS)
    expect(h.published.at(-1)).toMatchObject({ error: 'HTTP 500' })
    expect(h.published.at(-1)?.items).toHaveLength(1)

    await h.advanceBy(RETRY_BACKOFF_MS[0] ?? 0)
    expect(h.count(A)).toBe(3)
    expect(h.published.at(-1)?.error).toBe('offline')

    await h.advanceBy(RETRY_BACKOFF_MS[1] ?? 0)
    expect(h.count(A)).toBe(4)
    // Retry-After of an hour outweighs the 30-minute backoff.
    await h.advanceBy(59 * 60_000)
    expect(h.count(A)).toBe(4)
    await h.advanceBy(60_000)
    expect(h.count(A)).toBe(5)
    expect(h.published.at(-1)?.error).toBeNull()
  })

  it('stops when the last pane goes away, even with a check queued or scheduled', async () => {
    const h = harness()
    h.service.watch(A)
    await h.settle()
    h.service.unwatch(A)
    expect(h.timers).toHaveLength(0)
    await h.advanceBy(24 * 60 * 60_000)
    expect(h.count(A)).toBe(1)
    expect(h.service.watching()).toEqual([])
  })

  it('fetches two feeds at a time and queues the rest', async () => {
    const h = harness()
    for (const url of [A, B, C]) h.reply(url, { status: 200, hold: true })
    h.service.watch(A)
    h.service.watch(B)
    h.service.watch(C)
    await h.settle()
    expect(h.requests.map((r) => r.url)).toEqual([A, B])
    expect(MAX_CONCURRENT).toBe(2)

    h.held.shift()?.()
    await h.settle()
    expect(h.requests.map((r) => r.url)).toEqual([A, B, C])

    // A queued feed that is unwatched before its turn is never fetched.
    const d = 'https://d.test/feed'
    h.reply(d, { status: 200 })
    h.service.watch(d)
    h.service.unwatch(d)
    for (const release of h.held.splice(0)) release()
    await h.settle()
    expect(h.count(d)).toBe(0)
  })

  it('shows cached items at once after a restart, and does not refetch a fresh feed', async () => {
    const cache: FeedCache = {
      [A]: {
        title: 'cached A',
        items: [{ title: 'kept', link: null, at: START }],
        etag: '"v9"',
        lastModified: null,
        hintMs: null,
        fetchedAt: START - 5 * 60_000,
        checkedAt: START - 5 * 60_000,
      },
      [B]: {
        title: 'forgotten',
        items: [],
        etag: null,
        lastModified: null,
        hintMs: null,
        fetchedAt: START - CACHE_TTL_MS - 1,
        checkedAt: START - CACHE_TTL_MS - 1,
      },
    }
    const h = harness({ cache })
    expect(h.service.snapshot(A)).toMatchObject({ title: 'cached A', items: [{ title: 'kept' }] })
    expect(h.service.snapshot(B)).toMatchObject({ title: 'b.test', items: [] })

    h.service.watch(A)
    await h.settle()
    expect(h.count(A)).toBe(0)
    await h.advanceBy(10 * 60_000)
    expect(h.count(A)).toBe(1)
    expect(h.requests[0]?.headers['If-None-Match']).toBe('"v9"')
  })

  it('saves at most fifty feeds, the most recently checked', async () => {
    const cache: FeedCache = {}
    for (let i = 0; i < CACHE_MAX_FEEDS + 5; i++) {
      cache[`https://f${i}.test/`] = {
        title: `f${i}`,
        items: [],
        etag: null,
        lastModified: null,
        hintMs: null,
        fetchedAt: START - 60 * 60_000 - i,
        checkedAt: START - 60 * 60_000 - i,
      }
    }
    const h = harness({ cache })
    h.service.watch(A)
    await h.settle()
    const last = h.saved.at(-1) ?? {}
    expect(Object.keys(last)).toHaveLength(CACHE_MAX_FEEDS)
    expect(last[A]).toBeDefined()
    expect(last[`https://f${CACHE_MAX_FEEDS + 4}.test/`]).toBeUndefined()
  })
})

describe('reading a feed', () => {
  const stream = (chunks: Uint8Array[]) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk)
        controller.close()
      },
    })

  it('reads a body whole under the limit and refuses one over it', async () => {
    const bytes = await readLimited(stream([new Uint8Array([1, 2]), new Uint8Array([3])]), 3)
    expect([...bytes]).toEqual([1, 2, 3])
    await expect(readLimited(stream([new Uint8Array(3), new Uint8Array(1)]), 3)).rejects.toThrow(
      'feed too large',
    )
    expect(await readLimited(null)).toHaveLength(0)
  })

  it('decodes by the Content-Type charset, then the XML declaration, then UTF-8', () => {
    // 日本 in Shift_JIS and in EUC-JP.
    const sjis = new Uint8Array([0x93, 0xfa, 0x96, 0x7b])
    const declared = new Uint8Array([
      ...new TextEncoder().encode('<?xml version="1.0" encoding="EUC-JP"?><t>'),
      0xc6,
      0xfc,
      0xcb,
      0xdc,
    ])
    expect(decodeFeed(sjis, 'application/rss+xml; charset=Shift_JIS')).toBe('日本')
    expect(decodeFeed(declared, 'text/xml')).toContain('<t>日本')
    expect(decodeFeed(new TextEncoder().encode('日本'), null)).toBe('日本')
    expect(decodeFeed(new TextEncoder().encode('ok'), 'text/xml; charset=no-such-encoding')).toBe(
      'ok',
    )
  })
})
