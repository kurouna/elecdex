/**
 * What the Wi-Fi and Ethernet panes share: a path from this machine to the
 * internet, measured an echo a second to the gateway and to a host beyond it
 * (architecture.md §5.12, §5.23).
 *
 * The statistics over a stretch of echoes, the call score, the limits the
 * internet's segment and the machine's own upload are judged by, the spans a
 * timeline shows, and the masks a copied report uses. Each pane keeps only what
 * its own link adds - the radio for Wi-Fi, the cable for Ethernet - in
 * shared/wifi/ and shared/ethernet/. Pure, so unit-tested on its own.
 */

// ---------------------------------------------------------------------------
// The echo round
// ---------------------------------------------------------------------------

/**
 * One round of pings, taken together: to the gateway of every connected adapter
 * the panes follow, and to the host the network status pane pings (one ICMP echo
 * serves all three panes). The internet's echo leaves by the system's default
 * route, which no adapter chosen in a pane changes.
 *
 * A number is a round trip in ms; null is an echo that did not come back. An
 * adapter with no gateway to ask has no entry, which is not a loss.
 */
export interface PathProbe {
  /** Epoch ms of the round: the key a history is kept by, so no round is counted twice. */
  at: number
  host: string
  internet: number | null
  gateways: GatewayEcho[]
}

/** One adapter's gateway and its echo this round. */
export interface GatewayEcho {
  /** The link's id. */
  link: string
  address: string
  rtt: number | null
}

/** A link's own gateway echo this round: undefined when it had none to ask. */
export function gatewayEcho(
  probe: PathProbe | null,
  link: string | null,
): number | null | undefined {
  if (probe === null || link === null) return undefined
  const echo = probe.gateways.find((g) => g.link === link)
  return echo === undefined ? undefined : echo.rtt
}

/** How the network itself says the way out is, from the system's connection profile. */
export type PathInternet = 'internet' | 'constrained' | 'local' | 'none'

// ---------------------------------------------------------------------------
// History: one point a second while a pane is seen
// ---------------------------------------------------------------------------

/** The span a timeline shows. */
export const PATH_WINDOWS = [
  { id: '1m', ms: 60_000, label: '1M' },
  { id: '5m', ms: 300_000, label: '5M' },
  { id: '15m', ms: 900_000, label: '15M' },
  { id: '60m', ms: 3_600_000, label: '60M' },
] as const
export type PathWindowId = (typeof PATH_WINDOWS)[number]['id']

/** The longest span kept: the widest timeline. */
export const HISTORY_MS = 3_600_000

export function windowMs(id: string | undefined): number {
  return (PATH_WINDOWS.find((w) => w.id === id) ?? PATH_WINDOWS[1]).ms
}

/** Counters as they stood at a moment, for rates over the last minute. */
export interface CounterMark<C> {
  at: number
  counters: C
}

/** Each counter's increase per minute; null for one not kept or reset. */
export type Rates<C> = { [K in keyof C]?: number | null }

/**
 * Each counter's increase per minute, from the mark nearest a minute ago to the
 * latest - for the Wi-Fi and Ethernet panes alike. Null as a whole with under ten
 * seconds between the marks; a counter not kept, or reset between them (it went
 * down), is null alone, and the others still say what they counted.
 */
export function perMinute<C extends { [K in keyof C]: number | null }>(
  marks: readonly CounterMark<C>[],
): Rates<C> | null {
  const last = marks[marks.length - 1]
  if (last === undefined) return null
  const target = last.at - 60_000
  let first: CounterMark<C> | undefined
  for (const m of marks)
    if (first === undefined || Math.abs(m.at - target) < Math.abs(first.at - target)) first = m
  if (first === undefined || last.at - first.at < 10_000) return null
  const minutes = (last.at - first.at) / 60_000
  const out: Rates<C> = {}
  for (const key of Object.keys(last.counters) as (keyof C)[]) {
    const a = first.counters[key] as number | null
    const b = last.counters[key] as number | null
    out[key] = a === null || b === null || b < a ? null : (b - a) / minutes
  }
  return out
}

/**
 * Adds a point, dropping what fell out of the longest window. A point not newer
 * than the last is ignored: a re-subscription replays the last sample.
 */
export function pushPoint<T extends { at: number }>(points: readonly T[], point: T): T[] {
  const last = points[points.length - 1]
  if (last !== undefined && point.at <= last.at) return points as T[]
  const cutoff = point.at - HISTORY_MS
  const start = points.findIndex((p) => p.at >= cutoff)
  const kept = start < 0 ? [] : points.slice(start)
  kept.push(point)
  return kept
}

/** The point nearest a moment, within a column's width, for the crosshair. */
export function pointAt<T extends { at: number }>(
  points: readonly T[],
  at: number,
  tolerance: number,
): T | null {
  let best: T | null = null
  for (const p of points) {
    if (Math.abs(p.at - at) > tolerance) continue
    if (best === null || Math.abs(p.at - at) < Math.abs(best.at - at)) best = p
  }
  return best
}

// ---------------------------------------------------------------------------
// Statistics over a stretch of pings
// ---------------------------------------------------------------------------

export interface ProbeStats {
  /** Echoes asked for. */
  sent: number
  /** Echoes that came back. */
  received: number
  /** Percent lost. */
  loss: number
  min: number | null
  median: number | null
  max: number | null
  /** Mean change between consecutive round trips (RFC 3550's idea), ms. */
  jitter: number | null
}

/** Stats over one target's round trips; undefined entries were not asked and do not count. */
export function probeStats(samples: readonly (number | null | undefined)[]): ProbeStats {
  const asked = samples.filter((s): s is number | null => s !== undefined)
  const got = asked.filter((s): s is number => s !== null)
  const sorted = [...got].sort((a, b) => a - b)
  let jitter: number | null = null
  if (got.length >= 2) {
    let total = 0
    for (let i = 1; i < got.length; i++) total += Math.abs((got[i] ?? 0) - (got[i - 1] ?? 0))
    jitter = total / (got.length - 1)
  }
  return {
    sent: asked.length,
    received: got.length,
    loss: asked.length === 0 ? 0 : ((asked.length - got.length) / asked.length) * 100,
    min: sorted[0] ?? null,
    median: median(sorted),
    max: sorted[sorted.length - 1] ?? null,
    jitter,
  }
}

/** The middle of sorted numbers (the mean of the two middles for an even count). */
export function median(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

export function meanOf(values: readonly (number | null | undefined)[]): number | null {
  const got = values.filter((v): v is number => typeof v === 'number')
  return got.length === 0 ? null : got.reduce((a, b) => a + b, 0) / got.length
}

/**
 * The mean opinion score a voice call would get over this path, 1-4.5, from
 * the simplified E-model (ITU-T G.107) that network tools commonly use: the
 * round trip plus twice the jitter as effective latency, less 2.5 R per percent
 * lost. An estimate for a call's audio, not a measurement of one.
 */
export function mosEstimate(rttMs: number, jitterMs: number, lossPercent: number): number {
  const effective = rttMs + jitterMs * 2 + 10
  let r = effective < 160 ? 93.2 - effective / 40 : 93.2 - (effective - 120) / 10
  r -= lossPercent * 2.5
  r = Math.min(100, Math.max(0, r))
  const mos = 1 + 0.035 * r + 0.000007 * r * (r - 60) * (100 - r)
  return Math.min(4.5, Math.max(1, mos))
}

/** The call score over a stretch, or null before any echo was asked for. */
export function mosOf(s: ProbeStats): number | null {
  if (s.sent === 0) return null
  if (s.received === 0) return 1
  return mosEstimate(s.median ?? 0, s.jitter ?? 0, s.loss)
}

/** Pearson's correlation, or null with too few pairs or no spread. */
export function correlation(pairs: readonly (readonly [number, number])[]): number | null {
  if (pairs.length < 8) return null
  const mx = pairs.reduce((s, [x]) => s + x, 0) / pairs.length
  const my = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my)
    sxx += (x - mx) ** 2
    syy += (y - my) ** 2
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy)
}

/**
 * Whether moments recur at a steady interval - drops every 30 minutes (a
 * service's session limit), stalls every minute (a background scan), a link
 * that sleeps every few minutes (power saving). The median gap, when at least
 * three gaps agree with it to within a fifth; null otherwise.
 */
export function regularInterval(times: readonly number[]): number | null {
  const sorted = [...times].sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] ?? 0) - (sorted[i - 1] ?? 0))
  if (gaps.length < 3) return null
  const typical = median([...gaps].sort((a, b) => a - b))
  if (typical === null || typical <= 0) return null
  const agreeing = gaps.filter((g) => Math.abs(g - typical) <= typical * 0.2)
  return agreeing.length >= 3 && agreeing.length >= gaps.length * 0.75 ? typical : null
}

/** A column's lowest, middle and highest, for a timeline drawn in bands. */
export interface Spread {
  min: number
  mid: number
  max: number
}

export function spread(values: readonly (number | null | undefined)[]): Spread | null {
  const got = values.filter((v): v is number => typeof v === 'number').sort((a, b) => a - b)
  if (got.length === 0) return null
  return { min: got[0] ?? 0, mid: median(got) ?? 0, max: got[got.length - 1] ?? 0 }
}

/**
 * The points between `from` and `to` in `count` equal columns - one second each
 * for the short windows, several for the long ones. A column with no points is
 * time the pane was not watched.
 */
export function columnsOf<T extends { at: number }>(
  points: readonly T[],
  from: number,
  to: number,
  count: number,
): T[][] {
  const width = (to - from) / Math.max(1, count)
  const columns: T[][] = Array.from({ length: Math.max(1, count) }, () => [])
  for (const p of points) {
    if (p.at < from || p.at >= to) continue
    const i = Math.min(columns.length - 1, Math.floor((p.at - from) / width))
    columns[i]?.push(p)
  }
  return columns
}

// ---------------------------------------------------------------------------
// Judging a segment
// ---------------------------------------------------------------------------

export type Health = 'ok' | 'warn' | 'bad' | 'idle'

export const worse = (a: Health, b: Health): Health => {
  const order: Health[] = ['idle', 'ok', 'warn', 'bad']
  return order.indexOf(a) >= order.indexOf(b) ? a : b
}

/** Higher is worse: a latency, a jitter, a loss. */
export function over(value: number | null, limit: { warn: number; bad: number }): Health {
  if (value === null) return 'idle'
  if (value >= limit.bad) return 'bad'
  if (value >= limit.warn) return 'warn'
  return 'ok'
}

/** Lower is worse: a signal. */
export function under(value: number | null, limit: { warn: number; bad: number }): Health {
  if (value === null) return 'idle'
  if (value < limit.bad) return 'bad'
  if (value < limit.warn) return 'warn'
  return 'ok'
}

/**
 * The limits beyond the gateway, the same whatever carries the first hop:
 * chosen from what calls tolerate (ITU-T G.114 puts one-way delay under 150 ms;
 * video services ask for jitter under 30 ms and loss under 1 %).
 */
export const PATH_LIMITS = {
  internetRtt: { warn: 120, bad: 250 },
  internetJitter: { warn: 30, bad: 60 },
  internetLoss: { warn: 1, bad: 5 },
  /** Bytes per second sent that can crowd a call out of its own uplink. */
  ownUpload: 500_000,
} as const

/** The seconds a diagnosis looks back over. */
export const DIAGNOSIS_WINDOW_MS = 60_000

/** Consecutive lost echoes to the internet, with the gateway answering, that make the way out "gone". */
export const GONE_AFTER = 4

/** One hop judged by its round trip, jitter and loss; a hop never asked is idle. */
export function hopHealth(
  s: ProbeStats,
  limits: {
    rtt: { warn: number; bad: number }
    jitter: { warn: number; bad: number }
    loss: { warn: number; bad: number }
  },
): Health {
  if (s.sent === 0) return 'idle'
  return worse(
    over(s.median, limits.rtt),
    worse(over(s.jitter, limits.jitter), over(s.loss, limits.loss)),
  )
}

/** The internet's hop, judged by PATH_LIMITS. */
export function internetHealth(s: ProbeStats): Health {
  return hopHealth(s, {
    rtt: PATH_LIMITS.internetRtt,
    jitter: PATH_LIMITS.internetJitter,
    loss: PATH_LIMITS.internetLoss,
  })
}

/** Sending enough to fill an uplink, with the internet's delay rising with it (a bufferbloated uplink). */
export function ownUploadDrags(up: number | null, uploadDrag: number | null): boolean {
  return up !== null && up >= PATH_LIMITS.ownUpload && (uploadDrag ?? 0) >= 0.6
}

/** A round trip as the panes write it: whole milliseconds, which is all an ICMP echo measures. */
export const roundMs = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : v < 1 ? '<1 ms' : `${Math.round(v)} ms`

/** A share in percent, one decimal below ten. */
export const roundPct = (v: number): string => `${v < 10 ? v.toFixed(1) : Math.round(v)} %`

// ---------------------------------------------------------------------------
// The report the copy buttons write
// ---------------------------------------------------------------------------

/** Shows the first and last characters of a name, the rest as dots. */
export function maskName(name: string): string {
  const chars = [...name]
  if (chars.length <= 2) return '•'.repeat(chars.length)
  return `${chars[0]}${'•'.repeat(chars.length - 2)}${chars[chars.length - 1]}`
}

/** An address with its host part hidden: 192.168.1.23 -> 192.168.x.x. */
export function maskAddress(address: string): string {
  if (address.includes('.')) return address.split('.').slice(0, 2).concat('x', 'x').join('.')
  if (address.includes(':')) return `${address.split(':').slice(0, 2).join(':')}:…`
  return '•••'
}

/** A local time as the reports write it. */
export function stamp(at: number): string {
  const d = new Date(at)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}

const fmtMs = (v: number | null): string => (v === null ? '-' : `${Math.round(v)}ms`)

/** One hop's line in a report. */
export function hopLine(name: string, s: ProbeStats): string {
  return `${name.padEnd(9)} median ${fmtMs(s.median)}  jitter ${fmtMs(s.jitter)}  loss ${s.loss.toFixed(1)}% (${s.sent - s.received}/${s.sent})  max ${fmtMs(s.max)}`
}
