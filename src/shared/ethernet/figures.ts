import {
  correlation,
  DIAGNOSIS_WINDOW_MS,
  GONE_AFTER,
  meanOf,
  median,
  PATH_LIMITS,
  type ProbeStats,
  probeStats,
} from '../netpath.js'
import { isUp, medianOf, sum, wayOutLost } from './parts.js'
import type { EtherPoint } from './points.js'

// ---------------------------------------------------------------------------
// Limits and figures
// ---------------------------------------------------------------------------

/**
 * The limits a wired path is judged by. The gateway's are tighter than Wi-Fi's
 * on delay and looser on jitter and loss: a router one cable away answers within
 * a millisecond or two, but home routers answer pings from a busy processor and
 * thin them out. CRC errors need a count as well as a share, so one damaged frame
 * among a thousand is never a fault. Tuned in one place, quoted by the cards.
 */
export const ETHER_LIMITS = {
  gatewayRtt: { warn: 5, bad: 20 },
  gatewayJitter: { warn: 5, bad: 15 },
  gatewayLoss: { warn: 3, bad: 10 },
  crc: { warnCount: 5, warnShare: 0.01, badCount: 20, badShare: 0.1 },
  drops: { warn: 2, bad: 4 },
  broadcast: { warn: 300, bad: 3000 },
  ...PATH_LIMITS,
} as const

/** How far back the link's counters are judged: errors and drops are rare, so a minute is too short. */
export const LINK_WINDOW_MS = 600_000
/** A drop is the link down and back within this; longer is unplugging, docking or sleep. */
export const DROP_MAX_MS = 60_000
/** Seconds of broadcast whose median is judged, so a ten-second network scan does not count. */
export const BROADCAST_SECONDS = 30
/** Seconds a link may be up without an address before it is a fault: a switch port's spanning tree. */
export const ADDRESS_WAIT_S = 45
/** A USB adapter's traffic flat in this band, for this long, looks like a USB 2.0 port. */
export const USB2_PLATEAU = { lowMbps: 250, highMbps: 350, seconds: 20, within: 0.05 }

/** Figures the diagnosis, the panel and the cards share. */
export interface EtherFigures {
  gateway: ProbeStats
  internet: ProbeStats
  up: number | null
  down: number | null
  uploadDrag: number | null
  upstreamGone: boolean
  /** Damaged frames and frames received over the last ten minutes. */
  errors: number
  packets: number
  /** Errors as a share of packets, percent; null with no packets. */
  errorShare: number | null
  /** Drops over the last ten minutes, and when each began. */
  drops: number
  dropTimes: number[]
  /** Broadcast frames a second, the median of the last half minute; null where not counted. */
  broadcast: number | null
  multicast: number | null
  /** The speed now, and the best this adapter has had while the pane watched it. */
  speed: number | null
  bestSeen: number | null
  /** Seconds since the link last came up; null while down. */
  upFor: number | null
  /** Traffic flat where a USB 2.0 port would hold it. */
  usbPlateau: boolean
  /** The moment the figures were taken at, epoch ms. */
  now: number
}

/**
 * Drops the second-by-second reading could not see: the system's count of the link
 * going down rose between two readings that both found it up - down and back
 * inside a second.
 */
export function quickDrops(previous: EtherPoint, p: EtherPoint): number {
  if (!isUp(previous) || !isUp(p) || previous.carrierDowns === null || p.carrierDowns === null)
    return 0
  return Math.max(0, p.carrierDowns - previous.carrierDowns)
}

/** A drop the readings saw: when it began, and its start kept once it ended in time. */
function seenDrop(
  previous: EtherPoint | null,
  p: EtherPoint,
  downAt: number | null,
  starts: number[],
): number | null {
  if (previous !== null && isUp(previous) && p.state === 'no-carrier') return p.at
  if (downAt !== null && isUp(p)) {
    if (p.at - downAt <= DROP_MAX_MS) starts.push(downAt)
    return null
  }
  return downAt
}

/**
 * The readings that end a drop inside a second: the system counted one since the
 * reading before. Not across a gap in the watching, where a rise is the drops
 * while not watched (`unseen`), as `dropsIn` counts it.
 */
export function quickDropPoints(points: readonly EtherPoint[]): Set<EtherPoint> {
  const out = new Set<EtherPoint>()
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1] as EtherPoint
    const p = points[i] as EtherPoint
    if (p.at - previous.at <= 5000 && quickDrops(previous, p) > 0) out.add(p)
  }
  return out
}

/**
 * Drops in the stretch: the link down and back within a minute, the adapter not
 * switched off - those the readings saw, and those inside a second that only the
 * system's count saw.
 */
export function dropsIn(points: readonly EtherPoint[]): number[] {
  const starts: number[] = []
  let downAt: number | null = null
  let previous: EtherPoint | null = null
  for (const p of points) {
    const gap = previous !== null && p.at - previous.at > 5000
    downAt = gap ? null : seenDrop(previous, p, downAt, starts)
    if (previous !== null && !gap)
      for (let i = quickDrops(previous, p); i > 0; i--) starts.push(p.at)
    previous = p
  }
  // Down now and for less than a drop's length: it counts already.
  const last = points[points.length - 1]
  if (downAt !== null && last !== undefined && last.at - downAt <= DROP_MAX_MS) starts.push(downAt)
  return starts
}

/** Seconds since the link last came up, or null while it is down. */
function upSince(points: readonly EtherPoint[]): number | null {
  const last = points[points.length - 1]
  if (last === undefined || !isUp(last)) return null
  let first = last
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i]
    if (p === undefined || !isUp(p)) break
    const next = points[i + 1]
    if (next !== undefined && next.at - p.at > 5000) break
    first = p
  }
  return (last.at - first.at) / 1000
}

/** Whether a USB adapter's traffic sat flat in USB 2.0's band for long enough. */
export function usbPlateau(points: readonly EtherPoint[]): boolean {
  const tail = points.slice(-USB2_PLATEAU.seconds)
  if (tail.length < USB2_PLATEAU.seconds) return false
  const mbps = tail.map((p) => ((p.down ?? 0) * 8) / 1e6)
  const mid = median([...mbps].sort((a, b) => a - b))
  if (mid === null || mid < USB2_PLATEAU.lowMbps || mid > USB2_PLATEAU.highMbps) return false
  return mbps.every((v) => Math.abs(v - mid) <= mid * USB2_PLATEAU.within)
}

export function etherFigures(
  points: readonly EtherPoint[],
  now: number,
  bestSeen: number | null,
  span = DIAGNOSIS_WINDOW_MS,
): EtherFigures {
  // Echoes while the link was down blame the link, so they stay out of the hops' figures.
  const recent = points.filter((p) => p.at > now - span && p.at <= now && isUp(p))
  // The internet's figures from the readings on the route there is now: an echo recorded with no
  // route known (shown, never judged) does not join this adapter's once the route is back.
  const route = recent[recent.length - 1]?.route ?? null
  const routed = recent.filter((p) => p.route === route)
  const judged = recent.filter((p) => p.route === 'default')
  const tail = points.filter((p) => p.at <= now).slice(-GONE_AFTER)
  const upstreamGone = tail.length === GONE_AFTER && tail.every((p) => isUp(p) && wayOutLost(p))
  const ten = points.filter((p) => p.at > now - LINK_WINDOW_MS && p.at <= now)
  // Counted a second at a time from counters a second apart: whole frames over the ten minutes.
  const errors = Math.round(sum(ten.map((p) => p.errors)))
  const packets = Math.round(sum(ten.map((p) => p.rxPackets)))
  const lately = ten.filter(isUp).slice(-BROADCAST_SECONDS)
  const dropTimes = dropsIn(ten)
  const last = points[points.length - 1]
  return {
    gateway: probeStats(recent.map((p) => p.gateway)),
    internet: probeStats(routed.map((p) => p.internet)),
    up: meanOf(recent.slice(-5).map((p) => p.up)),
    down: meanOf(recent.slice(-5).map((p) => p.down)),
    uploadDrag: correlation(
      judged
        .filter((p) => p.up !== null && typeof p.internet === 'number')
        .map((p) => [p.up as number, p.internet as number] as const),
    ),
    upstreamGone,
    errors,
    packets,
    errorShare: packets > 0 ? (errors / packets) * 100 : null,
    drops: dropTimes.length,
    dropTimes,
    broadcast:
      lately.length < BROADCAST_SECONDS / 2 ? null : medianOf(lately.map((p) => p.broadcast)),
    multicast: medianOf(lately.map((p) => p.multicast)),
    speed: last !== undefined && isUp(last) ? last.speed : null,
    bestSeen,
    upFor: upSince(points),
    usbPlateau: usbPlateau(recent),
    now,
  }
}
