/**
 * Fitting a key's label to its key (docs/elec16.md section 7). A face wider than Saira
 * Condensed does not fit MODE on a narrow body's key at --step--2: the label is narrowed
 * sideways - never made smaller - by at most the skin's floor. Pure, from widths measured once
 * per face in em (a canvas's measureText), never from the page's layout.
 */

/** The room a label leaves either side of it inside its key, in CSS pixels. */
export const CAP_MARGIN = 3

/**
 * How much a label is narrowed: 1 when it fits. `textEm` is its width in em without
 * tracking, `trackEm` the tracking after each letter.
 */
export function capScale(
  textEm: number,
  trackEm: number,
  letters: number,
  fontPx: number,
  keyPx: number,
  floor: number,
): number {
  const width = (textEm + trackEm * letters) * fontPx
  const room = keyPx - 2 * (CAP_MARGIN + 1)
  if (width <= room || width <= 0) return 1
  return Math.max(floor, room / width)
}

/** A key's width in CSS pixels: `span` half-columns of a grid `columns` wide in `width`. */
export function keyWidth(width: number, columns: number, gap: number, span: number): number {
  const half = (width - (columns - 1) * gap) / columns
  return half * span + gap * (span - 1)
}

/** An em length written in CSS (`0.04em`), as a number; 0 for anything else. */
export function emOf(length: string): number {
  const m = /^(-?\d*\.?\d+)em$/.exec(length.trim())
  return m === null ? 0 : Number(m[1])
}
