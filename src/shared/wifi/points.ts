import {
  gatewayEcho,
  type CounterMark as NetCounterMark,
  type PathProbe,
  type Rates,
} from '../netpath.js'
import type { WifiCounters, WifiInternet, WifiLink, WifiState } from './types.js'

// ---------------------------------------------------------------------------
// History: one point a second while the pane is seen
// ---------------------------------------------------------------------------

/** What the timeline draws for a second. Null where nothing was read. */
export interface WifiPoint {
  at: number
  state: WifiState | null
  rssi: number | null
  quality: number | null
  rxMbps: number | null
  txMbps: number | null
  /**
   * Share of transmitted frames that needed a retry since the point before,
   * 0-100; null while too few frames went for a share to mean anything.
   */
  retry: number | null
  /** Frames transmitted and retried since the point before, for shares over longer spans. */
  frames: number | null
  retries: number | null
  /** Round trips; null a lost echo; undefined when not asked (no gateway, no probe). */
  gateway: number | null | undefined
  internet: number | null | undefined
  /** Bytes per second. */
  up: number | null
  down: number | null
  freqMhz: number | null
  channel: number | null
  internetState: WifiInternet | null
}

/** The link the pane follows: the one chosen, else the first connected, else the first. */
export function primaryLink(links: readonly WifiLink[], chosen: string | null): WifiLink | null {
  return (
    links.find((link) => link.id === chosen) ??
    links.find((link) => link.state === 'connected') ??
    links[0] ??
    null
  )
}

/**
 * Frames a second must carry for its retry share to be drawn. An idle link
 * sends a few dozen frames a second - keep-alives, power-save polls - and
 * retries a good half of them however clean the air is (measured on an Intel
 * AX211 at -55 dBm: 54 %), which says nothing about a call.
 */
export const RETRY_FRAMES_PER_SECOND = 100

/** The frames sent and retried between two counter readings; null across a reset or with none. */
export function counterDelta(
  before: WifiCounters | null,
  after: WifiCounters | null,
): { frames: number; retries: number } | null {
  if (before === null || after === null) return null
  const frames = after.txFrames - before.txFrames
  const retries = after.retries - before.retries
  return frames < 0 || retries < 0 ? null : { frames, retries }
}

/** The share of frames retried, or null below `minFrames`. */
export function retryShare(
  delta: { frames: number; retries: number } | null,
  minFrames = RETRY_FRAMES_PER_SECOND,
): number | null {
  if (delta === null || delta.frames < minFrames || delta.frames === 0) return null
  return Math.min(100, (delta.retries / delta.frames) * 100)
}

const NO_LINK = {
  state: null,
  rssi: null,
  quality: null,
  rxMbps: null,
  txMbps: null,
  up: null,
  down: null,
  freqMhz: null,
  channel: null,
  internetState: null,
} as const

/** The link's part of a point. */
function linkPart(link: WifiLink | null) {
  if (link === null) return NO_LINK
  return {
    state: link.state,
    rssi: link.rssi,
    quality: link.quality,
    rxMbps: link.rxMbps,
    txMbps: link.txMbps,
    up: link.txSec,
    down: link.rxSec,
    freqMhz: link.freqMhz,
    channel: link.channel,
    internetState: link.internet,
  }
}

/** The second a reading stands for, from the probe round or the sample. */
export function toPoint(
  link: WifiLink | null,
  probe: PathProbe | null,
  at: number,
  previous: WifiLink | null,
): WifiPoint {
  const counted = previous !== null && link !== null && previous.id === link.id
  const delta = counted ? counterDelta(previous.counters, link.counters) : null
  return {
    at,
    ...linkPart(link),
    retry: retryShare(delta),
    frames: delta?.frames ?? null,
    retries: delta?.retries ?? null,
    gateway: gatewayEcho(probe, link?.id ?? null),
    internet: probe === null ? undefined : probe.internet,
  }
}

/** Counters as they stood at a moment, for rates over the last minute (netpath's `perMinute`). */
export type CounterMark = NetCounterMark<WifiCounters>
/** Each counter's increase per minute; null for one reset since the mark a minute ago. */
export type WifiRates = Rates<WifiCounters>
