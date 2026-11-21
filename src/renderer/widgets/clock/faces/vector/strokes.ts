import { TALL_FROM } from '../../parts/strip.js'
/**
 * VECTOR's numerals and their places: single strokes in a 10 x 16 box, as a plotter's pen or a
 * vector-scan tube would draw them, one path each so the pen can be seen to draw a digit from
 * its start to its end (a stroke-dashoffset over the path's length).
 */

/** The numerals 0-9 as SVG paths in a 10 wide, 16 high box. */
export const NUMERALS: readonly string[] = [
  'M5 0C1.6 0 0 3 0 8C0 13 1.6 16 5 16C8.4 16 10 13 10 8C10 3 8.4 0 5 0Z',
  'M2 3.2L6 0V16',
  'M0.6 3.6C1.2 1.2 3 0 5 0C8 0 9.8 1.9 9.8 4.5C9.8 7.4 7.2 9.6 0 16H10',
  'M0.6 2C2 0.6 3.4 0 5 0C8 0 9.6 1.8 9.6 4C9.6 6.3 7.6 7.6 4.4 7.6C8 7.6 10 9.3 10 12C10 14.5 8 16 5 16C3 16 1.3 15.3 0 14',
  'M7.6 16V0L0 11.2H10',
  'M9.4 0H1.6L0.8 7C2 6.2 3.4 5.8 5 5.8C8 5.8 10 8 10 10.9C10 14 7.8 16 4.8 16C2.8 16 1.2 15.2 0 14',
  'M8.6 1C7.6 0.3 6.4 0 5.2 0C2 0 0 3.5 0 9C0 13.5 2 16 5 16C8 16 10 14 10 11C10 8 8 6.2 5.2 6.2C2.8 6.2 0.8 7.6 0 10',
  'M0 0H10L3.6 16',
  'M5 7.4C2.4 7.4 0.8 6 0.8 3.8C0.8 1.5 2.6 0 5 0C7.4 0 9.2 1.5 9.2 3.8C9.2 6 7.6 7.4 5 7.4C2 7.4 0 9.2 0 11.8C0 14.4 2.2 16 5 16C7.8 16 10 14.4 10 11.8C10 9.2 8 7.4 5 7.4Z',
  'M10 6C9.2 8.4 7.2 9.8 4.8 9.8C2 9.8 0 7.8 0 4.9C0 2 2 0 5 0C8 0 10 2.5 10 7C10 12.5 8 16 4.8 16C3.6 16 2.5 15.7 1.5 15',
]

/** The path of a digit character; anything else draws nothing. */
export function numeral(digit: string): string {
  return /^\d$/.test(digit) ? (NUMERALS[Number(digit)] ?? '') : ''
}

export const NUMERAL_HEIGHT = 16

/**
 * One digit's place on the face. `gen` counts its changes, so the page can draw the new one
 * afresh (the pen starts again) while the old one fades beside it; `old` is the digit it
 * replaced, null when there is nothing to fade (the first draw).
 */
export interface Slot {
  digit: string
  old: string | null
  gen: number
}

/**
 * The slots for `digits`, from the slots shown before: a slot whose digit did not change is
 * the same object, so only the digits that changed are drawn again.
 */
export function nextSlots(previous: readonly Slot[], digits: string): Slot[] {
  return [...digits].map((digit, i) => {
    const before = previous[i]
    if (before === undefined) return { digit, old: null, gen: 0 }
    if (before.digit === digit) return before
    return { digit, old: before.digit, gen: before.gen + 1 }
  })
}

/**
 * The digits' places in numeral units: HH, MM, then the two seconds at `q` of the size.
 * HH:MM spans 0-55 with the colon at 27.5; the seconds start at 61.
 */
const HM_UNITS = [0, 14, 31, 45]
const SS_START = 61
const SS_PITCH = 14
const COLON_X = 27.5

export interface VectorLayout {
  /** Fewer than COMPACT_BELOW pixels high: the zone goes at the right, the seconds line at the bottom. */
  compact: boolean
  /** Pixels per numeral unit. */
  k: number
  /** The seconds' scale against HH:MM. */
  q: number
  /** The left edge of the first digit and the top of HH:MM, in pixels. */
  x0: number
  top: number
  /** The pen's width in pixels. */
  stroke: number
  /** Each digit's top-left corner and scale (pixels per unit). */
  slots: { x: number; y: number; scale: number }[]
  /** The colon's two dots. */
  colon: { x: number; y: number; r: number }[]
  /** Where the zone's text starts and stands (its baseline). */
  zone: { x: number; y: number }
  /** The seconds line: from x1 to x2 at y. */
  line: { x1: number; x2: number; y: number }
}

export const COMPACT_BELOW = TALL_FROM

/**
 * Lays the face out in a `w` x `h` pane with a zone of `zoneChars` letters, set at `zonePx`.
 * A low strip puts everything on one line - the zone to the right - and draws the seconds as a
 * line along the bottom; a taller pane puts the zone above the small seconds and the line
 * under the digits, as long as they are.
 */
export function vectorLayout(w: number, h: number, zoneChars: number, zonePx = 10): VectorLayout {
  const compact = h < COMPACT_BELOW
  const q = compact ? 0.7 : 0.5
  const units = SS_START + (SS_PITCH + 10) * q
  const zoneW = compact && zoneChars > 0 ? zoneChars * zonePx * 0.62 + 8 : 0
  const k = Math.max(
    0,
    compact
      ? Math.min((h - 10) / NUMERAL_HEIGHT, (w - 20 - zoneW) / units)
      : Math.min((h * 0.6) / NUMERAL_HEIGHT, (w * 0.86) / units),
  )
  const digitH = NUMERAL_HEIGHT * k
  const x0 = (w - units * k - zoneW) / 2
  // A tall pane keeps room under the digits for the line, so the pair is centred together.
  const lineGap = compact ? 0 : Math.max(8, digitH * 0.14)
  const top = compact ? (h - digitH) / 2 - 1 : (h - digitH - lineGap) / 2
  const stroke = Math.min(3, Math.max(1.4, digitH * 0.05))
  const slots = [
    ...HM_UNITS.map((u) => ({ x: x0 + u * k, y: top, scale: k })),
    ...[0, 1].map((i) => ({
      x: x0 + (SS_START + i * SS_PITCH * q) * k,
      y: top + digitH * (1 - q),
      scale: k * q,
    })),
  ]
  const r = Math.max(1.1, stroke * 0.8)
  const colon = [5, 12].map((y) => ({ x: x0 + COLON_X * k, y: top + y * k, r }))
  const zone = compact
    ? { x: x0 + units * k + 8, y: top + digitH }
    : { x: x0 + SS_START * k, y: top + digitH * (1 - q) - Math.max(4, digitH * 0.08) }
  const line = compact
    ? { x1: 10, x2: w - 10, y: h - 2.5 }
    : { x1: x0, x2: x0 + units * k, y: Math.round(top + digitH + lineGap) + 0.5 }
  return { compact, k, q, x0, top, stroke, slots, colon, zone, line }
}

/** How far along the minute the seconds line has filled, 0 at :00. */
export const minuteShare = (seconds: number): number => Math.max(0, Math.min(1, seconds / 60))
