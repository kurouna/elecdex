// The ELEC-16 SCI ROM's screen and start screen (docs/elec16-sci.md), in e16c's TypeScript,
// compiled into sci.s by npm run gen:elec16. The LCD is 128 x 64 dots of one bit in the E000
// window: eight bands of 128 bytes, a byte a column of eight dots, bit 0 at the top. Text is
// the 6 x 8 cells of the pocket ROM's font, 21 columns and 8 rows.
//
// For now (S2) the start screen names each key pressed, so the body and its keys can be tried;
// SHIFT and ALPHA light their marks and are let go by the next key, as the calculator will.
import {
  memcpy,
  memset,
  peek,
  poke,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'

/* ---------------- the hand-written ROM (main.s) ---------------- */

/** The font: five column bytes a character from 0x20, bit 0 at the top. */
export declare function font_base(): u16
/** The keys' names: NAME_LENGTH bytes a key code, zero-padded (shared/elec16/sci-keys.ts). */
export declare function names_base(): u16

/* ---------------- the machine ---------------- */

export const VRAM = 0xe000
export const WIDTH = 128
export const BANDS = 8
export const IO_ANNUNCIATORS = 0xff2e
/** The marks this ROM lights (shared/elec16/state.ts SCI_ANNUNCIATORS; a test holds them). */
export const ANN_S = 0x2
export const ANN_A = 0x4
export const ANN_D = 0x80
/** The keys it knows by code (shared/elec16/sci-keys.ts; a test holds them). */
export const KEY_SHIFT = 6
export const KEY_ALPHA = 7
export const NAME_LENGTH = 6

/* ---------------- text ---------------- */

export const COLS = 21
export const ROWS = 8
const FIRST_CODE = 0x20
const CH_BS = 0x08
const CH_CLS = 0x0c
const CH_CR = 0x0d

let curX: u16 = 0
let curY: u16 = 0
let shifted: u16 = 0
let alphaOn: u16 = 0

export function cls(): void {
  memset(VRAM, 0, WIDTH * BANDS)
  curX = 0
  curY = 0
}

function drawChar(c: u16, column: u16, row: u16): void {
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

/** Row `row` cleared, the cursor at its start. */
function clearRow(row: u16): void {
  memset(VRAM + row * WIDTH, 0, WIDTH)
  locate(0, row)
}

/** `length` characters at `at`, centred on `row`. */
function centre(row: u16, at: u16, length: u16): void {
  locate((COLS - length) >> 1, row)
  puts(at)
}

/** The marks: DEG always (the calculator's angle to come), S and A while they wait. */
function marks(): void {
  let bits: u16 = ANN_D
  if (shifted !== 0) bits |= ANN_S
  if (alphaOn !== 0) bits |= ANN_A
  poke16(IO_ANNUNCIATORS, bits)
}

/* ---------------- the start screen ---------------- */

export function bootScreen(cause: u16, pc: u16): void {
  cls()
  shifted = 0
  alphaOn = 0
  marks()
  centre(1, str('ELEC-16 SCI'), 11)
  centre(2, str('SCI-128'), 7)
  centre(4, str('PRESS A KEY'), 11)
  if (cause === 0) return
  locate(0, ROWS - 1)
  // ON (BRK), and EBREAK - a breakpoint a program wrote - say where; anything else is a fault.
  if (cause === 0x800f || cause === 3) {
    puts(str('BREAK AT '))
  } else {
    puts(str('FAULT '))
    puthex(cause)
    puts(str(' AT '))
  }
  puthex(pc)
}

/**
 * A key from the start screen: its name and code on row 5, after S or A when SHIFT or ALPHA
 * was waiting. SHIFT and ALPHA wait for the next key, each letting the other go.
 */
export function keyPressed(code: u16): void {
  if (code === KEY_SHIFT) {
    shifted = shifted !== 0 ? 0 : 1
    alphaOn = 0
    marks()
    return
  }
  if (code === KEY_ALPHA) {
    alphaOn = alphaOn !== 0 ? 0 : 1
    shifted = 0
    marks()
    return
  }
  clearRow(5)
  puts(str('KEY '))
  if (shifted !== 0) puts(str('S '))
  if (alphaOn !== 0) puts(str('A '))
  const name = names_base() + code * NAME_LENGTH
  for (let i: u16 = 0; i < NAME_LENGTH; i++) {
    const c = peek(name + i)
    if (c === 0) break
    putc(c)
  }
  putc(0x20)
  puthex(code)
  shifted = 0
  alphaOn = 0
  marks()
}
