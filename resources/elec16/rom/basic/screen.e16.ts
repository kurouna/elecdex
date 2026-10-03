// ELEC-16 BASIC, ROM bank 1: the screen - LOCATE, CURSOR, PSET, PRESET, LINE, GPRINT and
// POINT (docs/elec16.md section 6). A dot is a bit of the LCD's memory: a byte is a column of
// eight dots, bit 0 at the top, a text row one band of WIDTH bytes; a four-shade screen has a
// second plane, and BASIC's dots are the darkest shade, as its text is.
import {
  type bool,
  div,
  type i16,
  peek,
  peek16,
  poke,
  poke16,
  u16,
} from '../../../../src/shared/e16c/builtins'
import {
  checkBreak,
  E_ARGUMENT,
  E_SYNTAX,
  expect,
  expr,
  fail,
  needNumber,
  next,
  nsp,
  push,
  setInt,
  setNsp,
  setStrType,
  step,
  stringAt,
  stringLength,
  strType,
  toInt,
  top,
} from './basic.e16'
import {
  CH_0,
  CH_A,
  CH_COMMA,
  CH_LPAREN,
  CH_MINUS,
  CH_RPAREN,
  CH_SEMI,
  COLS,
  CURX,
  CURY,
  DEPTH,
  IO_CURMODE,
  locate,
  PLANE,
  ROWS,
  VRAM,
  WIDTH,
} from './rom.e16'
import { T_CURSOR, T_GPRINT, T_LINE, T_LOCATE, T_PRESET, T_PSET } from './text.e16'

const CH_B = 0x42
const CH_F = 0x46

/** A whole number from an expression (taken off the stack). */
function whole(): i16 {
  expr()
  needNumber()
  const v = toInt(top())
  setNsp(nsp - 8)
  return v
}

/**
 * x, y: two whole numbers and the comma between, each within FAR of the screen. Farther, a
 * line's lengths would overflow 16 bits and it would never end.
 */
let atX: i16 = 0
let atY: i16 = 0
function point(): void {
  atX = near(whole())
  expect(CH_COMMA)
  atY = near(whole())
}

const FAR = 4096

function near(v: i16): i16 {
  if (v < -FAR || v > FAR) fail(E_ARGUMENT)
  return v
}

/** The byte of the LCD's memory holding dot (x, y), or 0 when the dot is off the screen. */
function cell(x: i16, y: i16): u16 {
  const width = peek16(WIDTH)
  if (x < 0 || y < 0 || u16(x) >= width || u16(y) >= peek16(ROWS) * 8) return 0
  return VRAM + (u16(y) >> 3) * width + u16(x)
}

/** A dot set or cleared, in every plane; one off the screen is nothing. */
function dot(x: i16, y: i16, on: bool): void {
  const at = cell(x, y)
  if (at === 0) return
  const bit: u16 = 1 << (u16(y) & 7)
  const plane = peek16(PLANE)
  for (let p: u16 = 0; p < peek16(DEPTH); p++) {
    const b = at + p * plane
    poke(b, on ? peek(b) | bit : peek(b) & (0xff ^ bit))
  }
}

/** LOCATE x, y: the text cursor's column and row. */
function locateStatement(): void {
  point()
  if (atX < 0 || atY < 0) fail(E_ARGUMENT)
  locate(u16(atX), u16(atY))
}

/** LINE (x1, y1)-(x2, y2)[, B | BF]: a line, or a box, or a box filled. */
function lineStatement(): void {
  expect(CH_LPAREN)
  point()
  const x1 = atX
  const y1 = atY
  expect(CH_RPAREN)
  expect(CH_MINUS)
  expect(CH_LPAREN)
  point()
  expect(CH_RPAREN)
  let box: u16 = 0
  if (next() === CH_COMMA) {
    step()
    if (next() !== CH_B) fail(E_SYNTAX)
    step()
    box = 1
    if (next() === CH_F) {
      step()
      box = 2
    }
  }
  if (box === 0) line(x1, y1, atX, atY)
  else rectangle(x1, y1, box === 2)
}

/** The box from (x1, y1) to (atX, atY), its sides or all of it. */
function rectangle(x1: i16, y1: i16, filled: bool): void {
  const x2 = atX
  const y2 = atY
  if (!filled) {
    line(x1, y1, x2, y1)
    line(x2, y1, x2, y2)
    line(x2, y2, x1, y2)
    line(x1, y2, x1, y1)
    return
  }
  const from = y1 < y2 ? y1 : y2
  const to = y1 < y2 ? y2 : y1
  for (let y = from; y <= to; y++) {
    checkBreak()
    line(x1, y, x2, y)
  }
}

/** The line from (x1, y1) to (x2, y2), every dot on it (Bresenham). */
function line(x1: i16, y1: i16, x2: i16, y2: i16): void {
  const dx: i16 = x2 > x1 ? x2 - x1 : x1 - x2
  const dy: i16 = y2 > y1 ? y2 - y1 : y1 - y2
  const sx: i16 = x1 < x2 ? 1 : -1
  const sy: i16 = y1 < y2 ? 1 : -1
  let err: i16 = dx - dy
  let x = x1
  let y = y1
  for (;;) {
    dot(x, y, true)
    if (x === x2 && y === y2) return
    const e2: i16 = err * 2
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

/**
 * GPRINT: columns of dots at the text cursor, each a byte (bit 0 the top dot), given as
 * numbers or as a string of hex pairs ("7F0808087F"), joined by ; or ,. The cursor goes on
 * past them, to the next whole character.
 */
function gprintStatement(): void {
  let x = peek16(CURX) * 6
  const row = peek16(CURY)
  for (;;) {
    expr()
    if (strType) {
      const at = stringAt(top())
      const n = stringLength(top())
      for (let k: u16 = 0; k + 1 < n; k += 2) {
        column(x, row, hex(peek(at + k)) * 16 + hex(peek(at + k + 1)))
        x++
      }
    } else column(x, row, u16(toInt(top())) & 0xff)
    if (!strType) x++
    setNsp(nsp - 8)
    const c = next()
    if (c !== CH_SEMI && c !== CH_COMMA) break
    step()
  }
  const cols = peek16(COLS)
  const after = div(x + 5, 6)
  locate(after < cols ? after : cols - 1, row)
}

/** One column of eight dots at dot x of a text row, in every plane. */
function column(x: u16, row: u16, bits: u16): void {
  const width = peek16(WIDTH)
  if (x >= width) return
  const plane = peek16(PLANE)
  for (let p: u16 = 0; p < peek16(DEPTH); p++) poke(VRAM + row * width + x + p * plane, bits)
}

/** A hex digit's value; ARGUMENT for anything else. */
function hex(c: u16): u16 {
  if (c >= CH_0 && c <= CH_0 + 9) return c - CH_0
  if (c >= CH_A && c <= CH_A + 5) return c - CH_A + 10
  fail(E_ARGUMENT)
  return 0
}

/** POINT(x, y): 1 when the dot is set, 0 when not or off the screen. */
export function pointFunction(): void {
  expect(CH_LPAREN)
  point()
  expect(CH_RPAREN)
  const at = cell(atX, atY)
  const on = at !== 0 && (peek(at) & (1 << (u16(atY) & 7))) !== 0
  setInt(push(), on ? 1 : 0)
  setStrType(false)
}

/** The statements of this bank. */
export function screenStatement(c: u16): void {
  if (c === T_LOCATE) locateStatement()
  else if (c === T_CURSOR) poke16(IO_CURMODE, u16(whole()) & 7)
  else if (c === T_PSET || c === T_PRESET) {
    point()
    dot(atX, atY, c === T_PSET)
  } else if (c === T_LINE) lineStatement()
  else if (c === T_GPRINT) gprintStatement()
  else fail(E_SYNTAX)
}
