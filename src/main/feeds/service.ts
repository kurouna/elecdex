import { FEED_INTERVAL_MS, FEED_ITEMS_PER_FEED, type FeedUpdate } from '@shared/feeds'
import { z } from 'zod'
import type { ParsedFeed } from './parse.js'

/**
 * Keeps the feeds some RSS pane lists up to date, and nothing else.
 *
 *  - A feed is fetched only while watched: every 15 minutes, or less often when
 *    it asks to be (Cache-Control max-age, Expires, RSS `<ttl>`), up to an hour.
 *  - Requests after the first are conditional (If-None-Match, If-Modified-Since),
 *    so an unchanged feed costs a 304 and no parsing.
 *  - At most two feeds are fetched at once; the rest wait their turn.
 *  - A failure keeps the last items on screen and is retried with backoff.
 *  - The last items per feed are kept on disk, so a restart shows them at once and
 *    does not re-download a feed checked a moment ago.
 *
 * Electron-free: the network, parsing, clock, timers and storage are injected,
 * so the schedule is unit-tested.
 */

export interface FeedResponse {
  status: number
  headers: { get(name: string): string | null }
  /** The body, already cut off at the size limit (see readLimited). */
  bytes(): Promise<Uint8Array>
}

export interface FeedDeps {
  fetch(url: string, init: { headers: Record<string, string> }): Promise<FeedResponse>
  parse(xml: string, url: string): Promise<ParsedFeed>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  userAgent: string
  loadCache(): FeedCache
  saveCache(cache: FeedCache): void
  /** Delivers an update to every page watching the feed. */
  publish(update: FeedUpdate): void
}

/** The longest a feed's own caching hint may stretch the interval. */
export const MAX_INTERVAL_MS = 60 * 60_000
/** Delays after consecutive failures, capped at the last. */
export const RETRY_BACKOFF_MS = [5 * 60_000, 15 * 60_000, 30 * 60_000, 60 * 60_000]
/** Feeds fetched at the same time. */
export const MAX_CONCURRENT = 2
/** The most a feed download may be; a bigger one is refused, not parsed in part. */
export const MAX_FEED_BYTES = 2 * 1024 * 1024
/** A cached feed not checked for this long is forgotten. */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60_000
/** And at most this many are kept, the most recently checked. */
export const CACHE_MAX_FEEDS = 50

const CachedItem = z.object({
  title: z.string(),
  link: z.string().nullable(),
  at: z.number().nullable(),
})
const CachedFeed = z.object({
  title: z.string(),
  items: z.array(CachedItem).max(FEED_ITEMS_PER_FEED),
  etag: z.string().nullable(),
  lastModified: z.string().nullable(),
  hintMs: z.number().nullable(),
  fetchedAt: z.number(),
  checkedAt: z.number(),
})
export const FeedCacheSchema = z.record(z.string(), CachedFeed)
export type FeedCache = z.infer<typeof FeedCacheSchema>

interface FeedState {
  title: string
  items: FeedUpdate['items']
  etag: string | null
  lastModified: string | null
  /** How long the feed asked to be cached, from its last full response. */
  hintMs: number | null
  fetchedAt: number | null
  /** Last time a request succeeded, 200 or 304. */
  checkedAt: number | null
  error: string | null
  failures: number
  timer: unknown
}

/** A failed request, with how long the server asked us to wait before the next. */
class FeedError extends Error {
  readonly retryAfterMs: number

  constructor(message: string, retryAfterMs: number) {
    super(message)
    this.retryAfterMs = retryAfterMs
  }
}

/** A feed's host, shown until (or unless) the feed names itself. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** How long a response asks to be cached, from Cache-Control max-age or Expires, in ms. */
export function cacheHintMs(headers: FeedResponse['headers'], now: number): number | null {
  const maxAge = /(?:^|,)\s*max-age\s*=\s*(\d+)/i.exec(headers.get('cache-control') ?? '')
  if (maxAge?.[1] !== undefined) return Number(maxAge[1]) * 1000
  const expires = Date.parse(headers.get('expires') ?? '')
  return Number.isFinite(expires) ? Math.max(0, expires - now) : null
}

/** Retry-After, as seconds or a date, in ms. */
function retryAfterMs(headers: FeedResponse['headers'], now: number): number {
  const raw = headers.get('retry-after') ?? ''
  if (/^\d+$/.test(raw.trim())) return Number(raw) * 1000
  const at = Date.parse(raw)
  return Number.isFinite(at) ? Math.max(0, at - now) : 0
}

/**
 * Decodes a feed's bytes: the charset of the Content-Type, else the XML
 * declaration's encoding (Japanese feeds still use Shift_JIS or EUC-JP), else UTF-8.
 */
export function decodeFeed(bytes: Uint8Array, contentType: string | null): string {
  const fromHeader = /charset\s*=\s*"?([\w.:-]+)/i.exec(contentType ?? '')?.[1]
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 256))
  const fromDeclaration = /^\s*<\?xml[^>]*encoding\s*=\s*["']([\w.:-]+)["']/i.exec(head)?.[1]
  for (const label of [fromHeader, fromDeclaration]) {
    if (label === undefined) continue
    try {
      return new TextDecoder(label).decode(bytes)
    } catch {
      // An encoding name the runtime does not know; try the next source.
    }
  }
  return new TextDecoder('utf-8').decode(bytes)
}

/** Reads a body up to `maxBytes`, and throws (cancelling the download) past it. */
export async function readLimited(
  body: ReadableStream<Uint8Array> | null,
  maxBytes = MAX_FEED_BYTES,
): Promise<Uint8Array> {
  if (body === null) return new Uint8Array()
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new Error('feed too large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export class FeedService {
  private readonly deps: FeedDeps
  private readonly feeds = new Map<string, FeedState>()
  private readonly watched = new Set<string>()
  private readonly queue: string[] = []
  private readonly inFlight = new Set<string>()
  private disposed = false

  constructor(deps: FeedDeps) {
    this.deps = deps
    const now = deps.now()
    for (const [url, entry] of Object.entries(deps.loadCache())) {
      if (now - entry.checkedAt > CACHE_TTL_MS) continue
      this.feeds.set(url, { ...entry, error: null, failures: 0, timer: null })
    }
  }

  /** The feed as a newly watching page should first see it. */
  snapshot(url: string): FeedUpdate {
    const s = this.feeds.get(url)
    return {
      url,
      title: s?.title ?? hostOf(url),
      items: s?.items ?? [],
      fetchedAt: s?.fetchedAt ?? null,
      error: s?.error ?? null,
    }
  }

  /** Starts keeping a feed up to date: now, if its last check is older than its interval. */
  watch(url: string): void {
    if (this.disposed || this.watched.has(url)) return
    this.watched.add(url)
    const state = this.state(url)
    const due =
      state.checkedAt === null ? 0 : state.checkedAt + this.interval(state) - this.deps.now()
    if (due <= 0) this.enqueue(url)
    else this.schedule(url, due)
  }

  unwatch(url: string): void {
    if (!this.watched.delete(url)) return
    const state = this.feeds.get(url)
    if (state?.timer != null) {
      this.deps.clearTimer(state.timer)
      state.timer = null
    }
    const queued = this.queue.indexOf(url)
    if (queued >= 0) this.queue.splice(queued, 1)
  }

  watching(): string[] {
    return [...this.watched].sort()
  }

  dispose(): void {
    for (const url of [...this.watched]) this.unwatch(url)
    this.disposed = true
  }

  private state(url: string): FeedState {
    let s = this.feeds.get(url)
    if (!s) {
      s = {
        title: hostOf(url),
        items: [],
        etag: null,
        lastModified: null,
        hintMs: null,
        fetchedAt: null,
        checkedAt: null,
        error: null,
        failures: 0,
        timer: null,
      }
      this.feeds.set(url, s)
    }
    return s
  }

  private interval(state: FeedState): number {
    return Math.min(MAX_INTERVAL_MS, Math.max(FEED_INTERVAL_MS, state.hintMs ?? 0))
  }

  private schedule(url: string, delayMs: number): void {
    const state = this.state(url)
    if (state.timer != null) this.deps.clearTimer(state.timer)
    state.timer = this.deps.setTimer(
      () => {
        state.timer = null
        this.enqueue(url)
      },
      Math.max(1000, delayMs),
    )
  }

  private enqueue(url: string): void {
    if (!this.watched.has(url) || this.inFlight.has(url) || this.queue.includes(url)) return
    this.queue.push(url)
    this.pump()
  }

  private pump(): void {
    while (!this.disposed && this.inFlight.size < MAX_CONCURRENT) {
      const url = this.queue.shift()
      if (url === undefined) return
      this.inFlight.add(url)
      void this.check(url).finally(() => {
        this.inFlight.delete(url)
        this.pump()
      })
    }
  }

  private async check(url: string): Promise<void> {
    const state = this.state(url)
    try {
      await this.request(url, state)
      if (!this.disposed && this.watched.has(url)) this.schedule(url, this.interval(state))
    } catch (cause) {
      if (this.disposed) return
      state.error = cause instanceof Error ? cause.message : String(cause)
      const backoff = RETRY_BACKOFF_MS[Math.min(state.failures, RETRY_BACKOFF_MS.length - 1)] ?? 0
      const retryAfter = cause instanceof FeedError ? cause.retryAfterMs : 0
      state.failures += 1
      this.deps.publish(this.snapshot(url))
      if (this.watched.has(url)) this.schedule(url, Math.max(backoff, retryAfter))
    }
  }

  /** One request and what follows from its answer; throws on anything but a usable 200 or a 304. */
  private async request(url: string, state: FeedState): Promise<void> {
    const headers: Record<string, string> = { 'User-Agent': this.deps.userAgent }
    if (state.fetchedAt !== null) {
      if (state.etag !== null) headers['If-None-Match'] = state.etag
      if (state.lastModified !== null) headers['If-Modified-Since'] = state.lastModified
    }
    const response = await this.deps.fetch(url, { headers })
    const now = this.deps.now()
    if (response.status === 304) {
      state.checkedAt = now
      this.succeeded(url, state, false)
      return
    }
    if (response.status !== 200) {
      throw new FeedError(`HTTP ${response.status}`, retryAfterMs(response.headers, now))
    }
    const xml = decodeFeed(await response.bytes(), response.headers.get('content-type'))
    const parsed = await this.deps.parse(xml, url)
    const ttlMs = parsed.ttlMinutes === null ? null : parsed.ttlMinutes * 60_000
    const hint = cacheHintMs(response.headers, now)
    state.title = parsed.title ?? hostOf(url)
    state.items = parsed.items
    state.etag = response.headers.get('etag')
    state.lastModified = response.headers.get('last-modified')
    state.hintMs = hint === null && ttlMs === null ? null : Math.max(hint ?? 0, ttlMs ?? 0)
    state.fetchedAt = now
    state.checkedAt = now
    this.succeeded(url, state, true)
  }

  private succeeded(url: string, state: FeedState, changed: boolean): void {
    const hadError = state.error !== null
    state.error = null
    state.failures = 0
    if (changed) this.persist()
    if (!this.disposed && (changed || hadError)) this.deps.publish(this.snapshot(url))
  }

  private persist(): void {
    const now = this.deps.now()
    const entries = [...this.feeds.entries()]
      .filter(
        (entry): entry is [string, FeedState & { fetchedAt: number; checkedAt: number }] =>
          entry[1].fetchedAt !== null &&
          entry[1].checkedAt !== null &&
          now - entry[1].checkedAt <= CACHE_TTL_MS,
      )
      .sort((a, b) => b[1].checkedAt - a[1].checkedAt)
      .slice(0, CACHE_MAX_FEEDS)
    const cache: FeedCache = {}
    for (const [url, s] of entries) {
      cache[url] = {
        title: s.title,
        items: s.items,
        etag: s.etag,
        lastModified: s.lastModified,
        hintMs: s.hintMs,
        fetchedAt: s.fetchedAt,
        checkedAt: s.checkedAt,
      }
    }
    try {
      this.deps.saveCache(cache)
    } catch (error) {
      console.warn('[elecdex] could not save the feed cache', error)
    }
  }
}
