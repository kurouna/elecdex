import { gatewayEcho, type PathInternet, type PathProbe } from '../netpath.js'
import type { Duplex, EtherLink, EtherRoute, EtherState } from './types.js'

// ---------------------------------------------------------------------------
// History: one point a second while the pane is seen
// ---------------------------------------------------------------------------

/** What the timeline draws for a second. Null where nothing was read. */
export interface EtherPoint {
  at: number
  state: EtherState | null
  speed: number | null
  duplex: Duplex | null
  /** Bytes per second. */
  up: number | null
  down: number | null
  /** Frames received this second. */
  rxPackets: number | null
  /** Frames received damaged this second. */
  errors: number | null
  /** Broadcast frames received a second (from bytes on Windows: an estimate on the high side). */
  broadcast: number | null
  multicast: number | null
  /** Round trips; null a lost echo; undefined when not asked (no gateway, no probe). */
  gateway: number | null | undefined
  internet: number | null | undefined
  internetState: PathInternet | null
  route: EtherRoute | null
  carrierDowns: number | null
}

/**
 * Bytes of a broadcast frame, for the count Windows does not keep: an ARP request,
 * the commonest broadcast, is the smallest frame there is, so the estimate errs high.
 */
export const BROADCAST_FRAME_BYTES = 60

/** A counter's increase a second; null across a reset, with no baseline, or where it is not kept. */
function perSecond(
  now: number | null | undefined,
  then: number | null | undefined,
  seconds: number,
): number | null {
  if (now == null || then == null || seconds <= 0 || now < then) return null
  return (now - then) / seconds
}

function counterPart(
  link: EtherLink,
  previous: EtherLink | null,
  seconds: number,
): Pick<EtherPoint, 'rxPackets' | 'errors' | 'broadcast' | 'multicast'> {
  const c = link.counters
  const b = previous?.id === link.id ? previous.counters : null
  if (c === null || b === null)
    return { rxPackets: null, errors: null, broadcast: null, multicast: null }
  const nonUnicast = perSecond(c.rxNonUnicast, b.rxNonUnicast, seconds)
  const broadcastBytes = perSecond(c.rxBroadcastOctets, b.rxBroadcastOctets, seconds)
  const broadcast = broadcastBytes === null ? null : broadcastBytes / BROADCAST_FRAME_BYTES
  const multicast =
    c.rxMulticast !== null
      ? perSecond(c.rxMulticast, b.rxMulticast, seconds)
      : nonUnicast === null
        ? null
        : Math.max(0, nonUnicast - (broadcast ?? 0))
  return {
    rxPackets: perSecond(c.rxPackets, b.rxPackets, seconds),
    errors: perSecond(c.rxErrors, b.rxErrors, seconds),
    broadcast:
      broadcast === null || nonUnicast === null ? broadcast : Math.min(broadcast, nonUnicast),
    multicast,
  }
}

const NO_POINT: Omit<EtherPoint, 'at'> = {
  state: null,
  speed: null,
  duplex: null,
  up: null,
  down: null,
  rxPackets: null,
  errors: null,
  broadcast: null,
  multicast: null,
  gateway: undefined,
  internet: undefined,
  internetState: null,
  route: null,
  carrierDowns: null,
}

/** The second a reading stands for, from the probe round or the sample. */
export function toEtherPoint(
  link: EtherLink | null,
  probe: PathProbe | null,
  at: number,
  previous: { link: EtherLink; at: number } | null,
): EtherPoint {
  if (link === null) return { ...NO_POINT, at }
  const seconds = previous === null ? 0 : (at - previous.at) / 1000
  const base = {
    ...NO_POINT,
    at,
    state: link.state,
    up: link.txSec,
    down: link.rxSec,
    internetState: link.internet,
    route: link.route,
    carrierDowns: link.carrierDowns,
  }
  if (link.state !== 'up') return base
  return {
    ...base,
    speed: link.speedMbps,
    duplex: link.duplex,
    ...counterPart(link, previous?.link ?? null, seconds),
    gateway: gatewayEcho(probe, link.id),
    // Recorded while this adapter is the way out, and while no way out is known (shown, not
    // judged): only an echo that leaves by another adapter is not this cable's.
    internet:
      probe !== null && (link.route === 'default' || link.route === null)
        ? probe.internet
        : undefined,
  }
}
