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
 * Where a short label beside a mark at `x` goes in a band `width` wide: `gap` px to the mark's
 * right, or as far to its left, right-aligned, where it would run past the band's end - so it
 * never covers the mark and never leaves the band. `chars` and `size` estimate its width.
 */
export function besideMark(
  x: number,
  width: number,
  chars: number,
  size: number,
  gap = 3,
): { x: number; anchor: 'start' | 'end' } {
  const room = chars * size * 0.62 + gap
  return x + room <= width ? { x: x + gap, anchor: 'start' } : { x: x - gap, anchor: 'end' }
}
