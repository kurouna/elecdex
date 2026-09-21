import type { Outcome, UnitIndex } from '@shared/elec'

/**
 * What the council's light is decided by, kept apart from the components that draw it so it
 * can be tested without a page: when an answer's traffic puts a packet on its spoke, where
 * each run of light is at a moment, and which plates step back once the council has decided.
 *
 * Everything that moves for as long as the council sits is stepped by the shared frame loop,
 * ten times a second, and never a CSS animation. One animation running is enough to have the
 * whole stage composited sixty times a second, and that - not any one effect - was the cost:
 * measured with two units answering, about 70% of one core with the lights, the floor and the
 * plates' fill transition as animations, and as much with any one of them left; 17% with none.
 */

/**
 * The moment of dark between the last vote and the resolution: the lights of the sitting go
 * out over it, and the resolution powers on after it.
 */
export const HOLD_MS = 250

/** A packet on a spoke: one piece of an answer arriving, drawn once from the plate to the core. */
export interface Packet {
  id: number
  unit: UnitIndex
  /** When it set out, on the clock `nextPackets` is given. */
  at: number
}

/** How long a packet takes down its spoke. */
export const PACKET_MS = 600
/** The least time between two packets of one unit: main sends ten deltas a second, the spoke shows four. */
export const PACKET_GAP_MS = 220
/** The most packets one spoke carries at once. */
export const PACKETS_PER_UNIT = 3

/**
 * The packets after a piece of `unit`'s answer arrived at `now`. The same list when the spoke
 * has no room for another - it was fed a moment ago, or is full.
 *
 * A packet is taken away by its animation ending, which never comes in a tab behind another
 * (`display: none` runs no animation): one older than twice its run is dropped here, so a pane
 * brought back forward does not find its spokes full of packets that never left.
 */
export function nextPackets(
  packets: readonly Packet[],
  unit: UnitIndex,
  now: number,
): readonly Packet[] {
  const fresh = packets.filter((p) => now - p.at < PACKET_MS * 2)
  const mine = fresh.filter((p) => p.unit === unit)
  const last = mine[mine.length - 1]
  const room =
    mine.length < PACKETS_PER_UNIT && (last === undefined || now - last.at >= PACKET_GAP_MS)
  if (!room) return fresh.length === packets.length ? packets : fresh
  const id = packets.reduce((most, p) => Math.max(most, p.id), 0) + 1
  return [...fresh, { id, unit, at: now }]
}

/** How long each run of light takes round its path, in ms. */
export const RUN_MS = { comet: 3200, trace: 2400, traceRx: 1200, tx: 900, floor: 900 } as const

/**
 * How far round its path a run of light is at `now`, 0 to 1: `period` ms a lap, `lead` of a
 * lap ahead (the second of a pair runs half a lap on).
 */
export function lap(now: number, period: number, lead = 0): number {
  if (!(period > 0)) return 0
  const at = (now / period + lead) % 1
  return at < 0 ? at + 1 : at
}

/** How far down its spoke a packet is at `now`, 0 to 1; 1 and over, it has landed. */
export const packetProgress = (packet: Packet, now: number): number =>
  Math.max(0, (now - packet.at) / PACKET_MS)

/** The packets still on their way at `now`; the same list when none has landed. */
export function inFlight(packets: readonly Packet[], now: number): readonly Packet[] {
  const flying = packets.filter((p) => packetProgress(p, now) < 1)
  return flying.length === packets.length ? packets : flying
}

/**
 * Whether a unit steps back once the council has decided: the ones that did not carry the
 * decision - the other side, the abstentions, the votes that did not count. With no decision
 * (a deadlock, no quorum, an interruption) nobody carried one, and all three step back alike.
 * Never while the council sits, or before a motion.
 */
export function steppedBack(outcome: Outcome | 'interrupted' | null, state: string): boolean {
  if (outcome === null) return false
  if (outcome === 'approved') return state !== 'approve'
  if (outcome === 'rejected') return state !== 'reject'
  return true
}
