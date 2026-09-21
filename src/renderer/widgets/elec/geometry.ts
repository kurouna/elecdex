import type { UnitIndex } from '@shared/elec'

/**
 * The council's drawing, in the board's 100 x 100 (the board is stretched to between 1.6 and
 * 2.3 times as wide as it is high, so percentages are not the same length both ways).
 */

/**
 * Each plate's outline, the corner that faces the core cut away. The three are one height and
 * one area (a unit test holds them to both): no seat of the council is drawn bigger than
 * another. Their cuts differ - the top plate loses two corners, the lower ones one - so the
 * top one is a little wider to make up the area.
 */
export const PLATE_POINTS: Record<UnitIndex, ReadonlyArray<readonly [number, number]>> = {
  0: [
    [2, 62],
    [36, 62],
    [42, 70],
    [42, 97],
    [2, 97],
  ],
  1: [
    [29.65, 2],
    [70.35, 2],
    [70.35, 30],
    [63.35, 37],
    [36.65, 37],
    [29.65, 30],
  ],
  2: [
    [64, 62],
    [98, 62],
    [98, 97],
    [58, 97],
    [58, 70],
  ],
}

/** Where each plate's words go: its bounding box as left, top, width, height in percent. */
export function plateBox(unit: UnitIndex): [number, number, number, number] {
  const xs = PLATE_POINTS[unit].map(([x]) => x)
  const ys = PLATE_POINTS[unit].map(([, y]) => y)
  const [left, top] = [Math.min(...xs), Math.min(...ys)]
  return [left, top, Math.max(...xs) - left, Math.max(...ys) - top]
}

/** Where each plate's spoke leaves it: the middle of the edge that faces the core. */
export const MOUTHS: Record<UnitIndex, readonly [number, number]> = {
  0: [39, 66],
  1: [50, 37],
  2: [61, 66],
}

/** The ring between the plates: a triangle through the middle of each. */
export const RING: ReadonlyArray<readonly [number, number]> = [
  [50, 19.5],
  [22, 79.5],
  [78, 79.5],
]

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
const TOP_EDGE = 37
const CUT_FROM = [36, 62] as const
const CUT_TO = [42, 70] as const

/**
 * Where the core's centre goes down the board, in percent: as far from the top plate's lower
 * edge as from the cut edges of the two lower plates, measured on the screen - in pixels, since
 * the board is not square. The core is on the centre line, so one cut stands for both.
 *
 * With the core at (W/2, y), its distance to the top edge is y - 0.37H; to the cut's line it is
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
