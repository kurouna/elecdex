/**
 * Article pictures for the RSS pane's CARD view and article view.
 *
 * The page may load no image from the network (CSP `img-src 'self' data:`), so main fetches
 * one when a pane shows it and hands it over as a data URL. A picture's address comes from a
 * feed, which is untrusted, so:
 *
 *  - Only a picture named by an item of a feed some pane watches is fetched (`feedOf`): the
 *    page cannot make main fetch an address of its choosing.
 *  - A picture on this machine or the local network (loopback, private and link-local
 *    addresses, `localhost`, `.local` and single-label names) is fetched only for a feed on the
 *    same host: a feed on the internet cannot make main reach into the LAN. An answer that
 *    ends on such a host after redirects is dropped.
 *  - At most MAX_IMAGE_BYTES, of a raster type, and no larger than MAX_IMAGE_SIDE a side and
 *    MAX_IMAGE_PIXELS in all, read from its header before anything decodes it: a small file
 *    can declare a picture of gigabytes (found in review).
 *  - A PNG or JPEG is decoded and shrunk to IMAGE_WIDTH as a JPEG; other types go to the page
 *    as they came. Kept in memory only (the last IMAGES_KEPT), asked for at most twice at a
 *    time. A failure is remembered for the session, so a broken picture is not asked for again
 *    on every redraw.
 *
 * Electron-free: the network and decoding are injected.
 */

export const MAX_IMAGE_BYTES = 1024 * 1024
export const MAX_IMAGE_SIDE = 8192
export const MAX_IMAGE_PIXELS = 24_000_000
export const IMAGE_WIDTH = 480
export const IMAGES_KEPT = 60
export const IMAGES_AT_ONCE = 2
/** Failures remembered, so the list cannot grow without bound either. */
const FAILURES_KEPT = 200

/** Raster types a page can show whose size can be read from the header; never SVG, a document. */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface ImageResponse {
  status: number
  type: string | null
  /** Where the answer came from, after any redirects. */
  url: string
  /** The body, cut off at the size limit (throws past it). */
  bytes(): Promise<Uint8Array>
  /** Lets go of a body that will not be read, so its connection is freed. */
  cancel(): void
}

export interface ImageDeps {
  fetch(url: string): Promise<ImageResponse>
  /**
   * A JPEG data URL of the picture no wider than `width`, or null when it cannot be decoded
   * here (Electron's nativeImage reads PNG and JPEG).
   */
  shrink(bytes: Uint8Array, width: number): string | null
  /** The URL of a watched feed naming this picture now, or null when none does. */
  feedOf(url: string): string | null
  now(): number
}

/**
 * How long a picture that could not be had for a passing reason (no answer, a server error,
 * too many requests) waits before it is asked for again. A refusal - not a picture, too large,
 * on the local network - is kept for the session: asking again would get the same answer.
 * Before, a picture missed while offline stayed missing until a restart (found in review).
 */
export const IMAGE_RETRY_MS = 10 * 60_000

/** A failure that asking again later may not repeat. */
class PassingFailure extends Error {}

/* ---- Where a picture may come from ---- */

function ipv4Private(host: string): boolean {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255))
    return false
  const [a = 0, b = 0] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

/** An IPv6 address as its eight 16-bit groups, a dotted IPv4 tail included; null if it is none. */
export function ipv6Groups(address: string): number[] | null {
  let h = address.replace(/^\[|\]$/g, '').toLowerCase()
  const dotted = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h)
  if (dotted !== null) {
    const [a, b, c, d] = dotted.slice(1).map(Number) as [number, number, number, number]
    if ([a, b, c, d].some((n) => n > 255)) return null
    h = `${h.slice(0, dotted.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = h.split('::')
  if (halves.length > 2) return null
  const part = (s: string | undefined) => (s === undefined || s === '' ? [] : s.split(':'))
  const head = part(halves[0])
  const tail = part(halves[1])
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...new Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null
  return groups.map((g) => Number.parseInt(g, 16))
}

/**
 * Whether an IPv6 address is this machine or the local network. An IPv4 address carried in one
 * (mapped ::ffff:a.b.c.d, the old compatible ::a.b.c.d, NAT64's 64:ff9b::/96) is judged as that
 * IPv4 address: the URL parser writes [::ffff:127.0.0.1] as [::ffff:7f00:1], so a test of the
 * dotted form alone let loopback and 169.254.169.254 through (found in review).
 */
function ipv6Private(host: string): boolean {
  const g = ipv6Groups(host)
  if (g === null) return false
  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] = g
  const v4 = `${g6 >> 8}.${g6 & 255}.${g7 >> 8}.${g7 & 255}`
  const zeroHead = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0
  // :: and ::1, then IPv4 mapped (::ffff:a.b.c.d) and the old compatible form (::a.b.c.d).
  if (zeroHead && g5 === 0 && g6 === 0) return true
  if (zeroHead && (g5 === 0xffff || g5 === 0)) return ipv4Private(v4)
  // NAT64's well-known prefix 64:ff9b::/96 reaches the IPv4 address in its tail.
  if (g0 === 0x64 && g1 === 0xff9b && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0) {
    return ipv4Private(v4)
  }
  // Unique local fc00::/7 and link-local fe80::/10.
  return (g0 & 0xfe00) === 0xfc00 || (g0 & 0xffc0) === 0xfe80
}

/** Whether a host is this machine or the local network, by its name or address. */
export function isLocalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true
  if (h.endsWith('.internal') || h.endsWith('.lan') || h.endsWith('.home.arpa')) return true
  if (ipv4Private(h) || (h.includes(':') && ipv6Private(h))) return true
  // A single label ("router", "nas") is resolved on the local network.
  return !h.includes('.') && !h.includes(':')
}

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/** Whether a picture at `image` may be fetched for the feed at `feed` (see the file's head). */
export function mayFetchImage(image: string, feed: string): boolean {
  let url: URL
  try {
    url = new URL(image)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (!isLocalHost(url.hostname)) return true
  return url.hostname === hostOf(feed)
}

/* ---- How large a picture says it is ---- */

const u16be = (b: Uint8Array, at: number) => ((b[at] ?? 0) << 8) | (b[at + 1] ?? 0)
const u16le = (b: Uint8Array, at: number) => (b[at] ?? 0) | ((b[at + 1] ?? 0) << 8)
const u24le = (b: Uint8Array, at: number) => u16le(b, at) | ((b[at + 2] ?? 0) << 16)
const u32be = (b: Uint8Array, at: number) => u16be(b, at) * 65536 + u16be(b, at + 2)
const ascii = (b: Uint8Array, at: number, n: number) =>
  String.fromCharCode(...b.subarray(at, at + n))

function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  let at = 2
  while (at + 9 < b.length) {
    if (b[at] !== 0xff) return null
    const marker = b[at + 1] ?? 0
    // Fill bytes (0xFF repeated) may come before a marker, and TEM (01) and RST0-7 (D0-D7)
    // stand alone, with no length: read past them, or the size is lost (found in review).
    if (marker === 0xff) {
      at += 1
      continue
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2
      continue
    }
    // Start-of-frame markers carry the size; DHT (C4), JPG (C8) and DAC (CC) do not.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: u16be(b, at + 5), width: u16be(b, at + 7) }
    }
    at += 2 + u16be(b, at + 2)
  }
  return null
}

function webpSize(b: Uint8Array): { width: number; height: number } | null {
  const chunk = ascii(b, 12, 4)
  if (chunk === 'VP8X') return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 }
  if (chunk === 'VP8L') {
    const bits = (b[21] ?? 0) | ((b[22] ?? 0) << 8) | ((b[23] ?? 0) << 16) | ((b[24] ?? 0) << 24)
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8 ') return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff }
  return null
}

/** The size a picture declares in its header, or null when it is not one this can read. */
export function imageSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.length >= 24 && ascii(b, 1, 3) === 'PNG')
    return { width: u32be(b, 16), height: u32be(b, 20) }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) return jpegSize(b)
  if (b.length >= 10 && ascii(b, 0, 3) === 'GIF') return { width: u16le(b, 6), height: u16le(b, 8) }
  if (b.length >= 30 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return webpSize(b)
  return null
}

/** Whether a declared size is one main and the page may decode. */
export function sizeAllowed(size: { width: number; height: number } | null): boolean {
  if (size === null || size.width < 1 || size.height < 1) return false
  if (size.width > MAX_IMAGE_SIDE || size.height > MAX_IMAGE_SIDE) return false
  return size.width * size.height <= MAX_IMAGE_PIXELS
}

/** Why an answer is not taken before its body is read, or null when it may be. */
function refusalOf(response: ImageResponse, type: string, url: string, feed: string): Error | null {
  if (response.status === 429 || response.status >= 500) {
    return new PassingFailure(`HTTP ${response.status}`)
  }
  if (response.status !== 200 || !IMAGE_TYPES.includes(type)) return new Error('not an image')
  // Redirected onto this machine or the local network: not taken.
  if (!mayFetchImage(response.url || url, feed)) return new Error('redirected to a local host')
  return null
}

export class FeedImages {
  private readonly deps: ImageDeps
  private readonly kept = new Map<string, string>()
  /** Failed pictures, with when they may be asked for again (Infinity: not this session). */
  private readonly failed = new Map<string, number>()
  private readonly pending = new Map<string, Promise<string | null>>()
  private readonly waiting: Array<() => void> = []
  private running = 0

  constructor(deps: ImageDeps) {
    this.deps = deps
  }

  /** The picture as a data URL, or null when it is not one main will fetch or could not. */
  get(url: string): Promise<string | null> {
    const feed = this.deps.feedOf(url)
    if (feed === null || !mayFetchImage(url, feed) || this.resting(url)) {
      return Promise.resolve(null)
    }
    const hit = this.kept.get(url)
    if (hit !== undefined) {
      // Most recently used goes last, so the oldest is first out.
      this.kept.delete(url)
      this.kept.set(url, hit)
      return Promise.resolve(hit)
    }
    const already = this.pending.get(url)
    if (already) return already
    const job = this.turn(() => this.load(url, feed)).finally(() => this.pending.delete(url))
    this.pending.set(url, job)
    return job
  }

  /** Pictures in memory, for diagnostics and tests. */
  size(): number {
    return this.kept.size
  }

  private async turn<T>(work: () => Promise<T>): Promise<T> {
    // A slot freed goes straight to the one waiting longest, never back to the count: a request
    // coming in before that one has woken took it too, and three ran at once (found in review).
    if (this.running >= IMAGES_AT_ONCE) await new Promise<void>((go) => this.waiting.push(go))
    else this.running += 1
    try {
      return await work()
    } finally {
      const next = this.waiting.shift()
      if (next) next()
      else this.running -= 1
    }
  }

  /** Whether a failed picture is still to be left alone. */
  private resting(url: string): boolean {
    const until = this.failed.get(url)
    if (until === undefined) return false
    if (this.deps.now() < until) return true
    this.failed.delete(url)
    return false
  }

  private async load(url: string, feed: string): Promise<string | null> {
    try {
      const data = await this.fetchPicture(url, feed)
      this.keep(url, data)
      return data
    } catch (error) {
      this.fail(url, error instanceof PassingFailure)
      return null
    }
  }

  /** The picture as a data URL; throws a PassingFailure for what may go another time. */
  private async fetchPicture(url: string, feed: string): Promise<string> {
    let response: ImageResponse
    try {
      response = await this.deps.fetch(url)
    } catch (error) {
      throw new PassingFailure(error instanceof Error ? error.message : String(error))
    }
    const type = (response.type ?? '').split(';')[0]?.trim().toLowerCase() ?? ''
    const refusal = refusalOf(response, type, url, feed)
    if (refusal !== null) {
      // Not read: let the body go, so the connection is not held for nothing.
      response.cancel()
      throw refusal
    }
    const bytes = await response.bytes()
    if (!sizeAllowed(imageSize(bytes))) throw new Error('picture too large or unreadable')
    return (
      this.deps.shrink(bytes, IMAGE_WIDTH) ??
      `data:${type};base64,${Buffer.from(bytes).toString('base64')}`
    )
  }

  private fail(url: string, passing: boolean): void {
    this.failed.set(url, passing ? this.deps.now() + IMAGE_RETRY_MS : Number.POSITIVE_INFINITY)
    if (this.failed.size > FAILURES_KEPT) {
      const first = this.failed.keys().next().value
      if (first !== undefined) this.failed.delete(first)
    }
  }

  private keep(url: string, data: string): void {
    this.kept.set(url, data)
    while (this.kept.size > IMAGES_KEPT) {
      const oldest = this.kept.keys().next().value
      if (oldest === undefined) break
      this.kept.delete(oldest)
    }
  }
}
