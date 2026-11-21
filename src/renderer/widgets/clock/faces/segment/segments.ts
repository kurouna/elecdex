import { TALL_FROM } from '../../parts/strip.js'
/**
 * SEGMENT's digits: a vacuum fluorescent display's seven segments, drawn as polygons of our own
 * rather than taken from a font, so every digit is the same shape on every machine and an unlit
 * segment can be drawn faintly where it would be.
 *
 * A digit stands in a cell 10 wide and 18 high, leaning forward a little as a VFD's do: a point
 * moves left by SLANT of its height. Two digits of a pair are 0.5 apart, the pairs further, and
 * the colon takes COLON_WIDTH between the hours and the minutes.
 */

export type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

export const DIGIT_WIDTH = 10
export const DIGIT_HEIGHT = 18
export const SLANT = 0.08
const COLON_WIDTH = 2.6

/** Segments a-g, top, clockwise and the middle bar, as points in the upright cell. */
export const SEGMENTS: Readonly<Record<Segment, readonly (readonly [number, number])[]>> = {
  a: [
    [1.4, 0],
    [8.6, 0],
    [7.4, 1.4],
    [2.6, 1.4],
  ],
  b: [
    [9, 0.4],
    [9, 8.4],
    [7.8, 7.6],
    [7.8, 1.8],
  ],
  c: [
    [9, 9.6],
    [9, 17.6],
    [7.8, 16.2],
    [7.8, 10.4],
  ],
  d: [
    [1.4, 18],
    [8.6, 18],
    [7.4, 16.6],
    [2.6, 16.6],
  ],
  e: [
    [1, 9.6],
    [1, 17.6],
    [2.2, 16.2],
    [2.2, 10.4],
  ],
  f: [
    [1, 0.4],
    [1, 8.4],
    [2.2, 7.6],
    [2.2, 1.8],
  ],
  g: [
    [1.6, 9],
    [2.6, 8.3],
    [7.4, 8.3],
    [8.4, 9],
    [7.4, 9.7],
    [2.6, 9.7],
  ],
}

export const SEGMENT_NAMES = Object.keys(SEGMENTS) as Segment[]

/** The segments each digit lights. */
export const DIGIT_SEGMENTS: readonly string[] = [
  'abcdef',
  'bc',
  'abdeg',
  'abcdg',
  'bcfg',
  'acdfg',
  'acdefg',
  'abc',
  'abcdefg',
  'abcdfg',
]

/** Whether digit `digit` lights `segment`; a character that is not a digit lights nothing. */
export function lit(digit: string, segment: Segment): boolean {
  const n = Number.parseInt(digit, 10)
  return Number.isInteger(n) && n >= 0 && n <= 9 && (DIGIT_SEGMENTS[n] ?? '').includes(segment)
}

const round = (n: number): number => Math.round(n * 100) / 100

/** A segment's polygon, for an SVG `points`, in a cell whose left edge is at `x`. */
export function segmentPoints(segment: Segment, x: number): string {
  return SEGMENTS[segment].map(([px, py]) => `${round(x + px - py * SLANT)},${round(py)}`).join(' ')
}

/** Where each digit's cell starts, along a run of `count` digits taken in pairs. */
export function digitOffsets(count: number, colonAfter?: number): number[] {
  const offsets: number[] = []
  let x = 0
  for (let i = 0; i < count; i++) {
    offsets.push(x)
    x += i % 2 ? 11.5 : 10.5
    if (i === colonAfter) x += COLON_WIDTH
  }
  return offsets
}

/** HH:MM's cells, and the colon's two dots (x, y of each, 1.4 by 1.6) between them. */
export const HM_OFFSETS = digitOffsets(4, 1)
export const COLON_DOTS: readonly (readonly [number, number])[] = [
  [21.8, 4.5],
  [21.1, 11.5],
]
export const DOT_WIDTH = 1.4
export const DOT_HEIGHT = 1.6
/** The seconds' two cells. */
export const SS_OFFSETS = digitOffsets(2)

/**
 * The boxes the two pictures are drawn in (x, y, width, height). The slant reaches left of a
 * cell by up to SLANT x 18, so each box starts a little left of zero.
 */
export const HM_BOX = [-1, -0.5, 46.6, 19] as const
export const SS_BOX = [-1, -0.5, 21.5, 19] as const

/** The seconds' size against HH:MM's: small enough that HH:MM leads, large enough to read. */
export const SECONDS_SCALE = 0.6

/**
 * The height in pixels of HH:MM's picture, for a face `width` x `height` with a zone of
 * `zoneChars` letters set at no less than `labelPx`. The whole row - HH:MM, a gap, and the
 * column of the zone over the seconds - must fit the width; the height leaves room around the
 * digits in a low strip and more in a tall pane, where digits to the edges look cramped.
 */
export function segmentSize(
  width: number,
  height: number,
  zoneChars: number,
  labelPx = 10,
): number {
  const pad = 16
  const hmRatio = HM_BOX[2] / HM_BOX[3]
  const ssRatio = (SS_BOX[2] / SS_BOX[3]) * SECONDS_SCALE
  const gap = 0.12
  // A zone's letter is about 0.6 of its size wide; the zone is set at 0.28 of the digits' size
  // or the label floor, whichever is larger, so both bounds are taken.
  const zoneRatio = zoneChars * 0.6 * 0.28
  const byWidth = (width - pad) / (hmRatio + gap + Math.max(ssRatio, zoneRatio))
  const byFloor = (width - pad - zoneChars * 0.6 * labelPx) / (hmRatio + gap)
  // Most of a strip's height, less of a block's: changing at TALL_FROM, the height every face
  // changes shape at - at a height of its own (80) the digits once fell 17 px mid-strip.
  const byHeight = height * (height < TALL_FROM ? 0.82 : 0.6)
  return Math.max(0, Math.min(byWidth, byFloor, byHeight))
}
