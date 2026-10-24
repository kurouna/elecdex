// The ELEC-16 SCI ROM's screen (docs/elec16-sci.md section 4), in e16c's TypeScript, compiled
// into sci.s by npm run gen:elec16. The LCD is 128 x 64 dots of one bit in the E000 window:
// eight bands of 128 bytes, a byte a column of eight dots, bit 0 at the top. Text is the 6 x 8
// cells of the machine's font, 21 columns and 8 rows; an answer's digits are the big ones,
// 7 x 14 on a pitch of 8, set in bands 6 and 7.
import {
  div,
  memcpy,
  memset,
  peek,
  peek16,
  poke,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'

/* ---------------- the hand-written ROM (main.s) ---------------- */

/** The font: five column bytes a character from 0x20, bit 0 at the top. */
export declare function font_base(): u16
/** The big digits (shared/elec16/font.ts): 0-9 and -, seven columns of two bytes each. */
export declare function big_base(): u16

/* ---------------- the machine ---------------- */

export const VRAM = 0xe000
export const WIDTH = 128
export const BANDS = 8
export const IO_CURSOR = 0xff2a
export const IO_CURMODE = 0xff2c
export const IO_ANNUNCIATORS = 0xff2e
/** CURMODE's bar (3), blinking (4), eight rows high (bits 4-7: pairs of rows). */
const BAR_8 = 0x47
/** The big digits' size and place (font.ts BIG_WIDTH, BIG_PITCH; a test holds them alike). */
export const BIG_WIDTH = 7
export const BIG_PITCH = 8
export const BIG_BAND = 6

/* ---------------- text ---------------- */

export const COLS = 21
export const ROWS = 8
const FIRST_CODE = 0x20
const CH_BS = 0x08
const CH_CLS = 0x0c
const CH_CR = 0x0d

let curX: u16 = 0
let curY: u16 = 0

export function cls(): void {
  memset(VRAM, 0, WIDTH * BANDS)
  curX = 0
  curY = 0
}

/** Character `c` in the cell at `column`, `row`. */
export function drawChar(c: u16, column: u16, row: u16): void {
  const at = VRAM + row * WIDTH + column * 6
  memcpy(at, font_base() + (c - FIRST_CODE) * 5, 5)
  poke(at + 5, 0)
}

/** Every band up by one, the last one cleared. */
function scroll(): void {
  memcpy(VRAM, VRAM + WIDTH, WIDTH * (BANDS - 1))
  memset(VRAM + WIDTH * (BANDS - 1), 0, WIDTH)
}

export function newline(): void {
  curX = 0
  if (curY + 1 < ROWS) {
    curY++
    return
  }
  scroll()
}

export function putc(c: u16): void {
  if (c === CH_CR) {
    newline()
    return
  }
  if (c === CH_CLS) {
    cls()
    return
  }
  if (c === CH_BS) {
    if (curX > 0) curX--
    return
  }
  if (c < FIRST_CODE) return
  drawChar(c, curX, curY)
  curX++
  if (curX >= COLS) newline()
}

export function puts(at: u16): void {
  let p = at
  while (peek(p) !== 0) {
    putc(peek(p))
    p++
  }
}

export function locate(column: u16, row: u16): void {
  curX = column < COLS ? column : COLS - 1
  curY = row < ROWS ? row : ROWS - 1
}

export function puthex(v: u16): void {
  for (let s: u16 = 0; s < 4; s++) {
    const d = (v >> (12 - s * 4)) & 15
    putc(d < 10 ? 0x30 + d : 0x37 + d)
  }
}

/** A whole number 0-65535 in decimal, where the cursor is. */
export function putDecimal(v: u16): void {
  if (v >= 10) putDecimal(div(v, 10))
  putc(0x30 + (v % 10))
}

/** Band `band` cleared. */
export function clearBand(band: u16): void {
  memset(VRAM + band * WIDTH, 0, WIDTH)
}

/** The dots from column `x0` to `x1` of band `band` turned over: a title band, a chosen item. */
export function invert(band: u16, x0: u16, x1: u16): void {
  for (let x = x0; x <= x1 && x < WIDTH; x++) {
    const at = VRAM + band * WIDTH + x
    poke(at, peek(at) ^ 0xff)
  }
}

/** `length` characters of text at `at`, centred on `row`. */
export function centre(row: u16, at: u16, length: u16): void {
  locate((COLS - length) >> 1, row)
  puts(at)
}

/** A title band: text at `at` on band 0, the band inverted. */
export function title(at: u16): void {
  clearBand(0)
  locate(0, 0)
  puts(at)
  invert(0, 0, WIDTH - 1)
}

/* ---------------- the cursor and the marks ---------------- */

/** The bar cursor at the left of the cell at `column`, `row` (in the gap before it), blinking. */
export function barAt(column: u16, row: u16): void {
  const x = column === 0 ? 0 : column * 6 - 1
  poke16(IO_CURSOR, row * 8 * 256 + x)
  poke16(IO_CURMODE, BAR_8)
}

/** The bar cursor with its top-left dot at (x, top) (the 2D display's), blinking. */
export function barDots(x: u16, top: u16): void {
  poke16(IO_CURSOR, top * 256 + x)
  poke16(IO_CURMODE, BAR_8)
}

export function noCursor(): void {
  poke16(IO_CURMODE, 0)
}

export function marks(bits: u16): void {
  poke16(IO_ANNUNCIATORS, bits)
}

/* ---------------- big digits ---------------- */

/** One big glyph, its left column at `x`: a digit (0-9) or the minus (10). */
function bigGlyph(index: u16, x: u16): void {
  const glyph = big_base() + index * BIG_WIDTH * 2
  for (let c: u16 = 0; c < BIG_WIDTH; c++) {
    const word = peek16(glyph + c * 2)
    poke(VRAM + BIG_BAND * WIDTH + x + c, word & 0xff)
    poke(VRAM + (BIG_BAND + 1) * WIDTH + x + c, word >> 8)
  }
}

/** The point: two dots square at the digits' foot, its left column at `x`. */
function bigPoint(x: u16): void {
  const at = VRAM + (BIG_BAND + 1) * WIDTH + x
  poke(at, peek(at) | 0x30)
  poke(at + 1, peek(at + 1) | 0x30)
}

/**
 * The characters at `at` (digits, a minus, a point), `length` of them, in big digits ending
 * at column `right`: its first column, where anything to the left can go.
 */
export function bigNumber(at: u16, length: u16, right: u16): u16 {
  let x = right + 1
  let i = length
  while (i > 0) {
    i--
    const c = peek(at + i)
    if (c === 0x2e) {
      x -= 3
      bigPoint(x)
    } else {
      x -= BIG_PITCH
      bigGlyph(c === 0x2d ? 10 : c - 0x30, x)
    }
  }
  return x
}

/* ---------------- dots ---------------- */

/** The dot at (x, y) lit. */
export function dot(x: u16, y: u16): void {
  if (x >= WIDTH || y >= BANDS * 8) return
  const at = VRAM + (y >> 3) * WIDTH + x
  poke(at, peek(at) | (1 << (y & 7)))
}

/* ---------------- text anywhere ---------------- */

/** Character `c` with its top-left dot at (`x`, `y`), drawn over what is there (OR). */
export function glyphAt(c: u16, x: u16, y: u16): void {
  const src = font_base() + (c - FIRST_CODE) * 5
  const band = y >> 3
  const shift = y & 7
  for (let k: u16 = 0; k < 5; k++) {
    const col = peek(src + k) << shift
    if (x + k >= WIDTH) return
    if (band < BANDS) {
      const at = VRAM + band * WIDTH + x + k
      poke(at, peek(at) | (col & 0xff))
    }
    if (shift !== 0 && band + 1 < BANDS) {
      const below = VRAM + (band + 1) * WIDTH + x + k
      poke(below, peek(below) | (col >> 8))
    }
  }
}

/** The text at `at` from (`x`, `y`), six dots a character: its right edge, past its last gap. */
export function textAt(at: u16, x: u16, y: u16): u16 {
  let p = at
  let left = x
  while (peek(p) !== 0) {
    glyphAt(peek(p), left, y)
    left += 6
    p++
  }
  return left
}

/** The text at `at` ending at the screen's right edge, its last character's gap off it. */
export function textRight(at: u16, y: u16): void {
  let n: u16 = 0
  while (peek(at + n) !== 0) n++
  textAt(at, WIDTH + 1 - n * 6, y)
}

/** Rows `y0` to `y1` from column `x0` to `x1` turned over. */
export function invertBox(x0: u16, y0: u16, x1: u16, y1: u16): void {
  for (let y = y0; y <= y1 && y < BANDS * 8; y++) {
    const bit = 1 << (y & 7)
    const row = VRAM + (y >> 3) * WIDTH
    for (let x = x0; x <= x1 && x < WIDTH; x++) poke(row + x, peek(row + x) ^ bit)
  }
}

/**
 * The screens' one rhythm (docs/elec16-sci.md section 4.5): a title band over rows 0-8, its
 * text a dot in from the top and the left; then a line every nine rows from row 11.
 */
export function band(at: u16): void {
  bandWith(at, 0)
}

/**
 * A title band with text at its right end too (`right`, 0 for none). Both are written before
 * the band is inverted: a character drawn over the lit band afterwards would not show.
 */
export function bandWith(at: u16, right: u16): void {
  cls()
  textAt(at, 1, 1)
  if (right !== 0) textRight(right, 1)
  invertBox(0, 0, WIDTH - 1, 8)
}

/** The row of line `n` (0-5) under the title band. */
export function lineY(n: u16): u16 {
  return 11 + n * 9
}

/** A chosen item: from column `col` (in characters) for `length` characters on line `n`. */
export function mark(col: u16, length: u16, n: u16): void {
  const y = lineY(n)
  invertBox(col * 6, y - 1, col * 6 + length * 6, y + 7)
}
