// ELECDRILL's words on the screen (docs/elec16-elecdrill.md section 2): lettering and figures
// on BG1, in front of the sprites, and the score. In RAM, so code in any bank may hand these
// its own strings (a string is read where it was written: panel.e16.ts reads its readings).
import { div, i16, type u16, words } from '../../../../src/shared/e16c/builtins'
import { cellAt, S16, spr, text, vfill, vpoke } from '../lib/kit.e16'
import { BAND_TILE, FONT_TILE, PANELS_TILE } from './assets.e16'

/** Slots for words: white (the panel's), gold (the flash's), red (the red blocks'). */
export const W_WHITE = 7
export const W_GOLD = 6
export const W_RED = 1
export const W_GREEN = 3
export const W_BLUE = 4

/** The score and the best, two words each (the low word to 9999). */
export const score = words(2)
export const best = words(2)

/** Words at cell (x, y) of BG1 in slot `sl`, in front of the sprites. */
export function say(x: u16, y: u16, s: u16, sl: u16): void {
  text(cellAt(1, x, y), s, FONT_TILE | (sl << 10) | 0x8000)
}

/** `n` cells of BG1 from (x, y) clear again. */
export function unsay(x: u16, y: u16, n: u16): void {
  vfill(cellAt(1, x, y), PANELS_TILE, n)
}

/** The well's part of BG1 (columns 11-28) clear, and its banner's band gone. */
export function wellClear(): void {
  bandH = 0
  let y: u16 = 0
  while (y < 36) {
    unsay(11, y, 18)
    y++
  }
}

/** A font tile in slot `sl`, in front. */
export function glyph(c: u16, sl: u16): u16 {
  return (FONT_TILE + c - 32) | (sl << 10) | 0x8000
}

/** `n` with `digits` digits (leading blanks) at (x, y) in slot `sl`. */
export function figure(cell: u16, n: u16, digits: u16, sl: u16): void {
  let at = cell + (digits - 1) * 2
  let v = n
  let k: u16 = 0
  while (k < digits) {
    const c: u16 = k > 0 && v === 0 ? 32 : 48 + (v % 10)
    vpoke(at, glyph(c, sl))
    v = div(v, 10)
    at = at - 2
    k++
  }
}

/* ---------------- the band behind a banner ---------------- */

let bandY: u16 = 0
let bandH: u16 = 0

/** A dark band across the well from `y` (points), `rows` sprites high, behind the words. */
export function band(y: u16, rows: u16): void {
  bandY = y
  bandH = rows
}

/** The band's sprites: drawn last of a frame's, so behind everything else. */
export function bandDraw(): void {
  let r: u16 = 0
  while (r < bandH) {
    const part: u16 = r === 0 ? 0 : r === bandH - 1 ? 2 : 1
    let k: u16 = 0
    while (k < 9) {
      spr(i16(88 + k * 16), i16(bandY + r * 16), (BAND_TILE + part * 4) | (5 << 10), S16)
      k++
    }
    r++
  }
}
