import { GONE_AFTER, newestFirst, roundMs } from '../netpath.js'
import { errorHealth } from './diagnose.js'
import { BROADCAST_SECONDS, ETHER_LIMITS, quickDrops } from './figures.js'
import { isUp, medianOf, wayOutLost } from './parts.js'
import type { EtherPoint } from './points.js'
import { speedLabel } from './speed.js'
import type { EtherLink } from './types.js'

// ---------------------------------------------------------------------------
// Events: what the history shows happening
// ---------------------------------------------------------------------------

export type EtherEventKind =
  | 'connected'
  | 'link-lost'
  | 'speed'
  | 'duplex'
  | 'upstream-lost'
  | 'upstream-back'
  | 'sign-in'
  | 'crc'
  | 'broadcast'
  | 'unseen'
  | 'conflict'

/** A mark on the timeline and a row in the log. */
export interface EtherEvent {
  key: string
  at: number
  kind: EtherEventKind
  detail: string
  /** Seconds the link was down, for a drop the pane saw end. */
  downFor: number | null
}

const event = (
  at: number,
  kind: EtherEventKind,
  detail: string,
  downFor: number | null = null,
): EtherEvent => ({
  key: `${kind}:${at}`,
  at,
  kind,
  detail,
  downFor,
})

interface Walk {
  lostRun: number
  gone: boolean
  downAt: number | null
  errorsMinute: number[]
  /** Frames received in each of the same seconds, for the errors' share. */
  framesMinute: number[]
  crcOn: boolean
  broadcast: number[]
  stormOn: boolean
}

const fresh = (): Walk => ({
  lostRun: 0,
  gone: false,
  downAt: null,
  errorsMinute: [],
  framesMinute: [],
  crcOn: false,
  broadcast: [],
  stormOn: false,
})

/**
 * What the history shows happening: the link going and coming back, its speed or
 * duplex changing, the way out going and coming back, a sign-in page, CRC errors
 * beginning, a broadcast flood beginning - and, where the platform counts the
 * link's drops (Linux), the ones that happened while the pane was not looking.
 * Nothing is claimed across a gap otherwise. Newest first.
 */
export function etherEvents(points: readonly EtherPoint[]): EtherEvent[] {
  const out: EtherEvent[] = []
  let walk = fresh()
  let previous: EtherPoint | null = null
  for (const p of points) {
    if (previous !== null && p.at - previous.at > 5000) {
      out.push(...unseen(previous, p))
      walk = fresh()
    } else if (previous !== null) {
      out.push(...linkChanges(walk, previous, p), ...wayOut(walk, p), ...counted(walk, p))
    }
    previous = p
  }
  return newestFirst(out)
}

function unseen(before: EtherPoint, after: EtherPoint): EtherEvent[] {
  if (before.carrierDowns === null || after.carrierDowns === null) return []
  const n = after.carrierDowns - before.carrierDowns
  return n > 0
    ? [event(after.at, 'unseen', `${n} drop${n === 1 ? '' : 's'} while not watched`)]
    : []
}

/** What changed while the link stayed up: a drop inside a second, the speed, the duplex. */
function whileUp(a: EtherPoint, b: EtherPoint): EtherEvent[] {
  const out: EtherEvent[] = []
  const quick = quickDrops(a, b)
  if (quick > 0) {
    const times = quick > 1 ? ` (${quick} times)` : ''
    out.push(event(b.at, 'link-lost', `down and back inside a second${times}`, 0))
  }
  if (!isUp(a) || !isUp(b)) return out
  if (a.speed !== null && b.speed !== null && a.speed !== b.speed)
    out.push(event(b.at, 'speed', `${speedLabel(a.speed)} → ${speedLabel(b.speed)}`))
  if (a.duplex !== null && b.duplex !== null && a.duplex !== b.duplex)
    out.push(event(b.at, 'duplex', `${a.duplex} → ${b.duplex}`))
  return out
}

function linkChanges(walk: Walk, a: EtherPoint, b: EtherPoint): EtherEvent[] {
  const out: EtherEvent[] = []
  if (isUp(a) && b.state === 'no-carrier') {
    walk.downAt = b.at
    out.push(event(b.at, 'link-lost', 'nothing at the other end of the cable'))
  }
  if (!isUp(a) && isUp(b)) {
    const downFor = walk.downAt === null ? null : Math.round((b.at - walk.downAt) / 1000)
    walk.downAt = null
    out.push(event(b.at, 'connected', `${speedLabel(b.speed)} ${b.duplex ?? ''}`.trim(), downFor))
  }
  out.push(...whileUp(a, b))
  if (b.internetState === 'constrained' && a.internetState !== 'constrained')
    out.push(event(b.at, 'sign-in', 'captive portal'))
  return out
}

function wayOut(walk: Walk, p: EtherPoint): EtherEvent[] {
  const lost = isUp(p) && wayOutLost(p)
  walk.lostRun = lost ? walk.lostRun + 1 : 0
  if (!walk.gone && walk.lostRun === GONE_AFTER) {
    walk.gone = true
    return [event(p.at - (GONE_AFTER - 1) * 1000, 'upstream-lost', 'gateway up, internet silent')]
  }
  if (walk.gone && typeof p.internet === 'number') {
    walk.gone = false
    return [event(p.at, 'upstream-back', `internet ${roundMs(p.internet)}`)]
  }
  return []
}

/** CRC errors and broadcast floods beginning, judged as the diagnosis judges them, over a sliding window. */
function counted(walk: Walk, p: EtherPoint): EtherEvent[] {
  const out: EtherEvent[] = []
  walk.errorsMinute.push(p.errors ?? 0)
  walk.framesMinute.push(p.rxPackets ?? 0)
  if (walk.errorsMinute.length > 60) walk.errorsMinute.shift()
  if (walk.framesMinute.length > 60) walk.framesMinute.shift()
  const minute = walk.errorsMinute.reduce((a, b) => a + b, 0)
  const frames = walk.framesMinute.reduce((a, b) => a + b, 0)
  // A count and a share together, as the verdict asks: the count is the verdict's ten-minute
  // count reached in a minute (errors beginning, not a trickle), the share the verdict's own. A
  // platform that counts no frames has no share, and no event, as it has no verdict on them.
  const crcNow = frames > 0 && errorHealth(minute, (minute / frames) * 100) !== 'ok'
  if (crcNow && !walk.crcOn) out.push(event(p.at, 'crc', `${minute} damaged frames in a minute`))
  walk.crcOn = crcNow
  // A link not up counts no frames: what it read before it went says nothing of after.
  if (!isUp(p)) {
    walk.broadcast = []
    walk.stormOn = false
    return out
  }
  if (p.broadcast !== null) walk.broadcast.push(p.broadcast)
  if (walk.broadcast.length > BROADCAST_SECONDS) walk.broadcast.shift()
  const level = walk.broadcast.length === BROADCAST_SECONDS ? medianOf(walk.broadcast) : null
  const stormNow = level !== null && level >= ETHER_LIMITS.broadcast.warn
  if (stormNow && !walk.stormOn)
    out.push(
      event(
        p.at,
        'broadcast',
        `${Math.round(level ?? 0).toLocaleString('en')}/s for ${BROADCAST_SECONDS} s`,
      ),
    )
  walk.stormOn = stormNow
  return out
}

/** The address conflicts the system logged for this adapter, as events (the last day). */
export function conflictEvents(link: EtherLink | null, since = 0): EtherEvent[] {
  // The log can hold two records of the same millisecond; one row each moment, keyed by it.
  const moments = [...new Set(link?.conflicts ?? [])].filter((at) => at > since)
  return moments.map((at) => event(at, 'conflict', 'another machine claims this address'))
}

/** The pane's own events and the system's conflicts together, newest first. */
export function mergeEtherEvents(
  seen: readonly EtherEvent[],
  logged: readonly EtherEvent[],
): EtherEvent[] {
  return newestFirst(seen, logged)
}
