import { GONE_AFTER, median } from '../netpath.js'
import type { WifiPoint } from './points.js'
import type { WifiEvent, WifiEventKind } from './types.js'

// ---------------------------------------------------------------------------
// Events: the OS's log, and what the history itself shows
// ---------------------------------------------------------------------------

export type TrackKind = WifiEventKind | 'handover' | 'upstream-lost' | 'upstream-back' | 'sign-in'

/** A mark on the timeline and a row in the log. */
export interface TrackEvent {
  key: string
  at: number
  kind: TrackKind
  /** Short words beside it: the OS's reason, or what changed. */
  detail: string
  code: number | null
  ssid: string | null
  /** Seconds the link was down, for a disconnection the log saw end. */
  downFor: number | null
}

/**
 * What the history shows happening that no log records: a change of channel
 * on a connection that stayed up (roaming to another access point - the pane
 * cannot see the access point itself, but a new channel is a new one), the way
 * out going and coming back, and a sign-in page appearing.
 */
export function derivedEvents(points: readonly WifiPoint[]): TrackEvent[] {
  const events: TrackEvent[] = []
  const way = { lostRun: 0, gone: false }
  let previous: WifiPoint | null = null
  for (const p of points) {
    if (previous !== null && p.at - previous.at > 5000) {
      // A gap (the pane was not seen): nothing is claimed across it.
      way.lostRun = 0
      way.gone = false
    } else {
      events.push(...changesBetween(previous, p), ...wayOut(way, p))
    }
    previous = p
  }
  return events
}

/** A new channel on a connection that stayed up, and a sign-in page appearing. */
function changesBetween(previous: WifiPoint | null, p: WifiPoint): TrackEvent[] {
  const out: TrackEvent[] = []
  const bothUp = previous?.state === 'connected' && p.state === 'connected'
  if (bothUp && previous?.channel != null && p.channel !== null && previous.channel !== p.channel) {
    out.push(mark(p.at, 'handover', `ch ${previous.channel} → ${p.channel}`))
  }
  if (p.internetState === 'constrained' && previous?.internetState !== 'constrained') {
    out.push(mark(p.at, 'sign-in', 'captive portal'))
  }
  return out
}

/** The way out going (a run of lost echoes with the gateway answering) and coming back. */
function wayOut(way: { lostRun: number; gone: boolean }, p: WifiPoint): TrackEvent[] {
  const lost = p.internet === null && typeof p.gateway === 'number' && p.state === 'connected'
  way.lostRun = lost ? way.lostRun + 1 : 0
  if (!way.gone && way.lostRun === GONE_AFTER) {
    way.gone = true
    return [mark(p.at - (GONE_AFTER - 1) * 1000, 'upstream-lost', 'gateway up, internet silent')]
  }
  if (way.gone && typeof p.internet === 'number') {
    way.gone = false
    return [mark(p.at, 'upstream-back', `internet ${Math.round(p.internet)} ms`)]
  }
  return []
}

const mark = (at: number, kind: TrackKind, detail: string): TrackEvent => ({
  key: `${kind}:${at}`,
  at,
  kind,
  detail,
  code: null,
  ssid: null,
  downFor: null,
})

/**
 * The log's events as marks, each disconnection told how long it lasted when
 * the connection after it is in the log too.
 */
export function logEvents(events: readonly WifiEvent[]): TrackEvent[] {
  const ascending = [...events].sort((a, b) => a.at - b.at)
  return ascending.map((e, i) => {
    let downFor: number | null = null
    if (e.kind === 'disconnected') {
      const back = ascending.slice(i + 1).find((next) => next.kind === 'connected')
      if (back !== undefined) downFor = Math.round((back.at - e.at) / 1000)
    }
    return {
      key: e.key,
      at: e.at,
      kind: e.kind,
      detail: e.reason,
      code: e.code,
      ssid: e.ssid,
      downFor,
    }
  })
}

export type LinkState = 'up' | 'down' | 'unknown'

/** What held at a moment: the last change before it, in events sorted oldest first. */
function stateAt(ascending: readonly WifiEvent[], at: number): LinkState {
  let state: LinkState = 'unknown'
  for (const e of ascending) {
    if (e.at >= at) break
    if (e.kind === 'connected') state = 'up'
    else if (e.kind === 'disconnected') state = 'down'
  }
  return state
}

/** A stretch of the day in one state, for the connection bar. */
export interface Stretch {
  from: number
  to: number
  state: LinkState
}

/**
 * The last `span` as stretches of up and down, from the system's log: up from a
 * connection until the next disconnection, down from a disconnection until the
 * next connection, unknown before the first event the log holds. A failed
 * attempt changes nothing: the link was down already, or stays up.
 */
export function availability(
  events: readonly WifiEvent[],
  now: number,
  span = 86_400_000,
): Stretch[] {
  const from = now - span
  const ascending = events.filter((e) => e.at <= now).sort((a, b) => a.at - b.at)
  let state = stateAt(ascending, from)
  const out: Stretch[] = []
  let at = from
  for (const e of ascending) {
    if (e.at < from || e.kind === 'failed') continue
    const next: LinkState = e.kind === 'connected' ? 'up' : 'down'
    if (next === state) continue
    if (e.at > at) out.push({ from: at, to: e.at, state })
    at = e.at
    state = next
  }
  out.push({ from: at, to: now, state })
  return out
}

/** Both kinds together, newest first. */
export function mergeEvents(
  log: readonly TrackEvent[],
  derived: readonly TrackEvent[],
): TrackEvent[] {
  return [...log, ...derived].sort((a, b) => b.at - a.at || a.key.localeCompare(b.key))
}

/**
 * The moments the internet's round trip jumped well above its usual level:
 * over three times the median and at least 50 ms more. What a background scan
 * does to a call, every minute or so.
 */
export function latencySpikes(points: readonly WifiPoint[]): number[] {
  const rtts = points
    .map((p) => p.internet)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b)
  const typical = median(rtts)
  if (typical === null) return []
  const spikes: number[] = []
  let inSpike = false
  for (const p of points) {
    const high = typeof p.internet === 'number' && p.internet > Math.max(typical * 3, typical + 50)
    if (high && !inSpike) spikes.push(p.at)
    inSpike = high
  }
  return spikes
}
