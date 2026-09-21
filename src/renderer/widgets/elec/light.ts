import type { Outcome, UnitIndex } from '@shared/elec'

/**
 * What the council's light is decided by, kept apart from the components that draw it so it
 * can be tested without a page: when an answer's traffic puts a packet on its spoke, where the
 * floor stopped, and which plates step back once the council has decided.
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

/**
 * How far through a cell the floor's grid is, 0 to 1, read from the computed transform of its
 * running layer (`matrix(a, b, c, d, tx, ty)`) and the size of a cell in pixels. The floor is
 * stopped where it is by holding this and dropping the animation, and started again from it.
 */
export function floorPhase(transform: string, cell: number): number {
  if (!(cell > 0)) return 0
  const ty = Number(/^matrix\(([^)]+)\)$/.exec(transform)?.[1]?.split(',')[5])
  if (!Number.isFinite(ty)) return 0
  const phase = (ty / cell) % 1
  return Math.round((phase < 0 ? phase + 1 : phase) * 1000) / 1000
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
