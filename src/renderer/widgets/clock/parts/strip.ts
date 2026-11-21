/**
 * The layout the band faces share (AHEAD, TAPE, LONGITUDE; Strip.svelte draws it): the time on
 * the left and a band across the rest, or, from TALL_FROM, the time over the band. Worked out
 * here once, so the three cannot drift apart - they once each took the paddings off the band's
 * width and forgot the gap, and all three ran into the right-hand padding (review 2026-11-22).
 */

/**
 * The height from which a face stops being a strip and lays itself out as a block. Below it is
 * the default layout's clock strip, which the standard column gives about 90 px at 1080 (user
 * request 2026-11-22): every face shares this one line, so they all change shape at once.
 */
export const TALL_FROM = 130

/** The padding on each side of a strip face, and the gap between its time and its band. */
export const STRIP_PAD = 12
export const STRIP_GAP = 12

export interface StripMetrics {
  tall: boolean
  /** The height of the time's HH:MM, in pixels. */
  size: number
  /** What is left for the band, in pixels; 0 when nothing is. */
  bandWidth: number
}

/** The strip's shape for a face `width` x `height` whose time is `readoutWidth` wide. */
export function stripMetrics(width: number, height: number, readoutWidth: number): StripMetrics {
  const tall = height >= TALL_FROM
  const size = tall
    ? Math.min(height * 0.34, width * 0.16)
    : Math.max(12, Math.min(height * 0.66, width * 0.11))
  const inner = width - 2 * STRIP_PAD
  const bandWidth = Math.max(0, tall ? inner : inner - readoutWidth - STRIP_GAP)
  return { tall, size, bandWidth }
}

/**
 * About how wide `text` is at `size` px: a full-width character (kana, kanji, hangul) about an
 * em, any other about 0.62 of one - the faces' condensed figures and capitals. An estimate, for
 * where a label goes; the band clips anything it gets wrong.
 */
export function labelWidth(text: string, size: number): number {
  let ems = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    ems += code >= 0x1100 && !(code >= 0x2000 && code <= 0x206f) ? 1 : 0.62
  }
  return ems * size
}

/**
 * Where a label beside a mark at `x` goes in a band `width` wide, and what of it is shown:
 * `gap` px to the mark's right where it fits, or as far to its left, right-aligned; where it fits
 * on neither side it goes on the side with more room, cut short with an ellipsis to fit. It never
 * covers its mark and never leaves the band: a long alarm name once ran off the band's left,
 * and a right-aligned one once ended on its own marker (reviews 2026-11-22).
 */
export function besideMark(
  x: number,
  width: number,
  label: string,
  size: number,
  gap = 3,
): { x: number; anchor: 'start' | 'end'; text: string } {
  const right = width - x - gap
  const left = x - gap
  const full = labelWidth(label, size)
  if (full <= right) return { x: x + gap, anchor: 'start', text: label }
  if (full <= left) return { x: x - gap, anchor: 'end', text: label }
  const start = right >= left
  const room = Math.max(0, start ? right : left)
  return {
    x: start ? x + gap : x - gap,
    anchor: start ? 'start' : 'end',
    text: cutTo(label, room, size),
  }
}

/** `label` cut short, an ellipsis at its end, to fit `room` px. */
function cutTo(label: string, room: number, size: number): string {
  const chars = [...label]
  while (chars.length > 0 && labelWidth(`${chars.join('')}…`, size) > room) chars.pop()
  return chars.length > 0 ? `${chars.join('').trimEnd()}…` : ''
}
