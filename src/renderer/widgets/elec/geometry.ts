import type { UnitIndex } from '@shared/elec'

/**
 * The council's drawing, in the board's 100 x 100 (the board is stretched to between 1.6 and
 * 2.3 times as wide as it is high, so percentages are not the same length both ways).
 */

/**
 * Each plate's outline, the corner that faces the core cut away. The three are one area (a
 * unit test holds them to it): no seat of the council is drawn bigger than another. The top
 * one is lower than the other two, so it is wider; the lower two give up their outer edges,
 * which leaves every edge that faces the core - and so the core's place - where it was.
 */
export const PLATE_POINTS: Record<UnitIndex, ReadonlyArray<readonly [number, number]>> = {
  0: [
    [4.5, 58],
    [36, 58],
    [42, 66],
    [42, 97],
    [4.5, 97],
  ],
  1: [
    [26, 2],
    [74, 2],
    [74, 26],
    [67, 33],
    [33, 33],
    [26, 26],
  ],
  2: [
    [64, 58],
    [95.5, 58],
    [95.5, 97],
    [58, 97],
    [58, 66],
  ],
}

/** A plate's area in the board's units (the shoelace formula). */
export function plateArea(unit: UnitIndex): number {
  const points = PLATE_POINTS[unit]
  const twice = points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length] ?? [x, y]
    return sum + x * ny - nx * y
  }, 0)
  return Math.abs(twice) / 2
}

/** The top plate's lower edge, and UNIT-1's cut (UNIT-3's is its mirror): the edges facing the core. */
const TOP_EDGE = 33
const CUT_FROM = [36, 58] as const
const CUT_TO = [42, 66] as const

/**
 * Where the core's centre goes down the board, in percent: as far from the top plate's lower
 * edge as from the cut edges of the two lower plates, measured on the screen - in pixels, since
 * the board is not square. The core is on the centre line, so one cut stands for both.
 *
 * With the core at (W/2, y), its distance to the top edge is y - 0.33H; to the cut's line it is
 * |(C - P1) x v| / |v|. Setting them equal is linear in y.
 */
export function coreTop(width: number, height: number): number {
  if (width <= 0 || height <= 0) return (TOP_EDGE + CUT_FROM[1]) / 2
  const [x1, y1] = [(CUT_FROM[0] / 100) * width, (CUT_FROM[1] / 100) * height]
  const vx = ((CUT_TO[0] - CUT_FROM[0]) / 100) * width
  const vy = ((CUT_TO[1] - CUT_FROM[1]) / 100) * height
  const length = Math.hypot(vx, vy)
  const top = (TOP_EDGE / 100) * height
  const cx = width / 2 - x1
  // distance to the cut = (cx * vy - (y - y1) * vx) / length, for a core above and right of it.
  const y = (top + (cx * vy + y1 * vx) / length) / (1 + vx / length)
  return (y / height) * 100
}

/** How far a point is from the top edge and from the cut, in pixels: what `coreTop` makes equal. */
export function coreGaps(width: number, height: number, topPercent: number): [number, number] {
  const y = (topPercent / 100) * height
  const [x1, y1] = [(CUT_FROM[0] / 100) * width, (CUT_FROM[1] / 100) * height]
  const vx = ((CUT_TO[0] - CUT_FROM[0]) / 100) * width
  const vy = ((CUT_TO[1] - CUT_FROM[1]) / 100) * height
  const toCut = Math.abs((width / 2 - x1) * vy - (y - y1) * vx) / Math.hypot(vx, vy)
  return [y - (TOP_EDGE / 100) * height, toCut]
}
