// The ELEC-16 PLAY ROM's screen and start screen (docs/elec16-play.md section 4), in e16c's
// TypeScript, compiled into play.s by npm run gen:elec16. Mode 0's bitmap is 320 x 288 dots of
// two bits, 80 bytes a row, the leftmost dot in bits 7-6, in the video memory reached 4 KB at a
// time through the E000 window (VPAGE). Text is the 6 x 8 cells of the pocket ROM's font, 53
// columns and 36 rows, in colour 3 on colour 0 of palette 0.
import {
  addr,
  bytes,
  div,
  memcpy,
  memset,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'

/* ---------------- the hand-written ROM (main.s) ---------------- */

/** The font: five column bytes a character from 0x20, bit 0 at the top. */
export declare function font_base(): u16

/* ---------------- the machine (shared/elec16/video.ts; a unit test holds them alike) ---------------- */

export const VCTRL = 0xf800
export const VPAGE = 0xf802
export const WINDOW = 0xe000
export const PAGE_SIZE = 0x1000
export const ROW_BYTES = 80
export const SCREEN_ROWS = 288
export const BITMAP_SIZE = 23040
export const PALETTE = 0xc400
/** The bank register, and where extended RAM starts and the most banks it has. */
export const IO_BANK = 0xff04
export const XRAM_BANK = 0x20
export const XRAM_BANKS = 64

/* ---------------- text ---------------- */

export const COLS = 53
export const ROWS = 36
const FIRST_CODE = 0x20
const CH_BS = 0x08
const CH_CLS = 0x0c
const CH_CR = 0x0d
const PAPER = 0
const INK = 3

let curX: u16 = 0
let curY: u16 = 0

/**
 * The machine's own colours, RGB555 (red in the low bits): a night blue ground and three
 * steps up to a pale white, like the pocket models' shades but in colour.
 */
export const COLOUR_0 = 0x1862
export const COLOUR_1 = 0x3d29
export const COLOUR_2 = 0x5e72
export const COLOUR_3 = 0x7fdc

/** A row of the bitmap, carried through RAM while the screen scrolls. */
const rowBuffer = bytes(80)

/* ---------------- the video memory ---------------- */

/** The window's address for video address `at`, its page put in the window first. */
function window(at: u16): u16 {
  poke16(VPAGE, at >> 12)
  return WINDOW + (at & (PAGE_SIZE - 1))
}

/** `n` bytes of video memory from `at` into RAM at `to`, across a page's end when they reach it. */
function videoOut(at: u16, to: u16, n: u16): void {
  const first = PAGE_SIZE - (at & (PAGE_SIZE - 1))
  if (n <= first) {
    memcpy(to, window(at), n)
    return
  }
  memcpy(to, window(at), first)
  memcpy(to + first, window(at + first), n - first)
}

/** `n` bytes from RAM at `from` into video memory at `at`, across a page's end as above. */
function videoIn(from: u16, at: u16, n: u16): void {
  const first = PAGE_SIZE - (at & (PAGE_SIZE - 1))
  if (n <= first) {
    memcpy(window(at), from, n)
    return
  }
  memcpy(window(at), from, first)
  memcpy(window(at + first), from + first, n - first)
}

/** `n` bytes of video memory from `at` filled with `value`, page by page. */
function videoFill(at: u16, value: u16, n: u16): void {
  let left = n
  let to = at
  while (left > 0) {
    const room = PAGE_SIZE - (to & (PAGE_SIZE - 1))
    const now = left < room ? left : room
    memset(window(to), value, now)
    to += now
    left -= now
  }
}

/** A dot of the bitmap set to colour `c` (0-3). */
export function plot(x: u16, y: u16, c: u16): void {
  const at = window(y * ROW_BYTES + (x >> 2))
  const shift = 6 - ((x & 3) << 1)
  poke(at, (peek(at) & (0xff ^ (3 << shift))) | (c << shift))
}

/* ---------------- the screen ---------------- */

/** The display on in mode 0, palette 0's four colours, the screen cleared. */
export function screenInit(): void {
  poke16(VCTRL, 1)
  const at = window(PALETTE)
  poke16(at, COLOUR_0)
  poke16(at + 2, COLOUR_1)
  poke16(at + 4, COLOUR_2)
  poke16(at + 6, COLOUR_3)
  cls()
}

/** The screen cleared to the ground, the cursor at the top left. */
export function cls(): void {
  videoFill(0, 0, BITMAP_SIZE)
  curX = 0
  curY = 0
}

/** A character at a cell, its five columns and the gap after them. */
function drawChar(c: u16, column: u16, row: u16): void {
  const glyph = font_base() + (c - FIRST_CODE) * 5
  const x0 = column * 6
  const y0 = row * 8
  for (let cx: u16 = 0; cx < 6; cx++) {
    const bits = cx < 5 ? peek(glyph + cx) : 0
    for (let r: u16 = 0; r < 8; r++) plot(x0 + cx, y0 + r, ((bits >> r) & 1) === 1 ? INK : PAPER)
  }
}

/** Every text row moved up one, the last cleared. */
function scroll(): void {
  for (let y: u16 = 0; y < SCREEN_ROWS - 8; y++) {
    videoOut((y + 8) * ROW_BYTES, addr(rowBuffer), ROW_BYTES)
    videoIn(addr(rowBuffer), y * ROW_BYTES, ROW_BYTES)
  }
  videoFill((SCREEN_ROWS - 8) * ROW_BYTES, 0, 8 * ROW_BYTES)
}

export function newline(): void {
  curX = 0
  if (curY + 1 < ROWS) {
    curY++
    return
  }
  scroll()
}

/** A character at the cursor: CR a new line, BS back one, CLS the screen cleared. */
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

/** Text ended by a zero. */
export function puts(at: u16): void {
  for (let p = at; peek(p) !== 0; p++) putc(peek(p))
}

/** The cursor to a column and row, held to the screen. */
export function locate(column: u16, row: u16): void {
  curX = column < COLS ? column : COLS - 1
  curY = row < ROWS ? row : ROWS - 1
}

/** A word as four hex digits. */
export function puthex(v: u16): void {
  for (let s: u16 = 0; s < 4; s++) {
    const d = (v >> (12 - s * 4)) & 15
    putc(d < 10 ? 0x30 + d : 0x37 + d)
  }
}

/** A number in decimal, without leading zeros. */
function putDecimal(v: u16): void {
  const tens = div(v, 10)
  if (tens > 0) putDecimal(tens)
  putc(0x30 + v - tens * 10)
}

/** Text in the middle of a row. */
function centre(row: u16, at: u16, length: u16): void {
  locate((COLS - length) >> 1, row)
  puts(at)
}

/* ---------------- the start screen ---------------- */

const TITLE = str('ELEC-16 PLAY')
const MODEL = str('PLAY-320')

/** Extended RAM's banks: the bank register keeps the bank it had when told one the machine lacks. */
function xramBanks(): u16 {
  const was = peek16(IO_BANK)
  let banks: u16 = 0
  while (banks < XRAM_BANKS) {
    poke16(IO_BANK, XRAM_BANK + banks)
    if (peek16(IO_BANK) !== XRAM_BANK + banks) break
    banks++
  }
  poke16(IO_BANK, was)
  return banks
}

/**
 * The start screen: the machine's name, its memory, the cartridge's place (G4), and what
 * stopped the last program - `cause` its mcause and `pc` where, or 0 for nothing.
 */
export function bootScreen(cause: u16, pc: u16): void {
  cls()
  centre(4, TITLE, 12)
  centre(6, MODEL, 8)
  locate(15, 10)
  puts(str('RAM 32K  XRAM '))
  putDecimal(xramBanks() * 8)
  putc(0x4b)
  centre(16, str('NO CARTRIDGE'), 12)
  if (cause === 0) return
  locate(2, ROWS - 3)
  // BRK, and EBREAK - a breakpoint a program wrote - say where; anything else is a fault.
  if (cause === 0x800f || cause === 3) {
    puts(str('BREAK AT '))
  } else {
    puts(str('FAULT '))
    puthex(cause)
    puts(str(' AT '))
  }
  puthex(pc)
}
