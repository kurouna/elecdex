// ELEC-16 SCI, ROM bank 8: BASE (docs/elec16-sci.md sections 4.5 and 6.6). Whole numbers of
// 32 bits, two's complement, typed in HEX, DEC, OCT or BIN (A-F on the keys that carry them
// after ALPHA, with no ALPHA) and worked with + - x / (towards 0), AND, OR, XOR, XNOR, not(
// and neg(; every result is brought back into 32 bits. The answer is shown in the base chosen
// and in the other three, BIN sixteen bits at a time (▲ ▼), and its low or high sixteen bits
// again as a row of dots. The line is the calculator's own (calc.e16.ts), with its history.
import {
  addr,
  type bool,
  bytes,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import {
  answered,
  cursor,
  K_0,
  K_1,
  K_2,
  K_3,
  K_4,
  K_6,
  K_7,
  K_9,
  K_AC,
  K_ADD,
  K_ANS,
  K_DIV,
  K_DOWN,
  K_FD,
  K_LP,
  K_MUL,
  K_NEG,
  K_RP,
  K_SUB,
  K_UP,
  length,
  letterOf,
  line,
  refuse,
} from './calc.e16'
import { exactWhole } from './exact.e16'
import { bandWith, barDots, cls, dot, glyphAt, lineY, noCursor, textAt, textRight } from './lcd.e16'
import {
  BASE_RADIX,
  copy8,
  E_SYNTAX,
  fail,
  isNegative,
  KEEP_ANS,
  M_ADD,
  M_FORMAT,
  M_IDIV,
  M_MOD,
  M_MUL,
  M_NEG,
  M_SUB,
  MATH_ARG,
  math,
  pop,
  push,
  pushInt,
  top,
  VALUE_SIZE,
  WORK,
} from './numbers.e16'
import {
  T_AND,
  T_ANS,
  T_BNEG,
  T_CLOSE,
  T_DIVIDE,
  T_MINUS,
  T_NOT,
  T_OPEN,
  T_OR,
  T_PLUS,
  T_TIMES,
  T_XNOR,
  T_XOR,
  tokenText,
} from './tokens.e16'

const M_FROMI32 = 0x29
const M_TOI32 = 0x2a
const HEX = 0
const BIN = 3
const PEN = 4
/** HEX, DEC, OCT, BIN and PEN (base 5, after EL-509E's list). */
const RADIXES = 5

/** BIN's sixteen bits shown: the high ones (▲) or the low. */
let high: bool = false

function radix(): u16 {
  return peek(BASE_RADIX)
}

function radixValue(r: u16): u16 {
  if (r === HEX) return 16
  if (r === BIN) return 2
  if (r === PEN) return 5
  return r === 1 ? 10 : 8
}

/* ---------------- keys ---------------- */

/** The token a key types in BASE: a digit of the base, A-F in HEX, + - x / ( ) Ans; 0 for none. */
export function baseToken(k: u16): u16 {
  const d = baseDigit(k)
  if (d !== 0xffff) return d < radixValue(radix()) ? 0x30 + d : 0
  if (radix() === HEX) {
    const l = letterOf(k)
    if (l >= 0x41 && l <= 0x46) return l
  }
  switch (k) {
    case K_NEG:
      return T_MINUS
    case K_ADD:
      return T_PLUS
    case K_SUB:
      return T_MINUS
    case K_MUL:
      return T_TIMES
    case K_DIV:
      return T_DIVIDE
    case K_LP:
      return T_OPEN
    case K_RP:
      return T_CLOSE
    case K_ANS:
      return T_ANS
  }
  return 0
}

function baseDigit(k: u16): u16 {
  if (k === K_0) return 0
  if (k === K_1) return 1
  if (k === K_2) return 2
  if (k === K_3) return 3
  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  return 0xffff
}

/** BASE's own keys: F⇄D the next base, ▲ ▼ BIN's halves of an answer. Done, true. */
export function baseCommand(k: u16): bool {
  if (k === K_FD) {
    poke(BASE_RADIX, radix() + 1 < RADIXES ? radix() + 1 : 0)
    return true
  }
  if (answered && (k === K_UP || k === K_DOWN)) {
    high = k === K_UP
    return true
  }
  return false
}

/** FUNC in BASE: page 1 the bases (1-5), page 2 the logic (1-6, its token); 1 back, 0 stay. */
let baseFuncPage: u16 = 0

export function baseFuncKey(k: u16): u16 {
  if (k === K_AC) return 1
  if (k === K_DOWN || k === K_UP) {
    baseFuncPage = k === K_DOWN ? 1 : 0
    drawBaseFunc()
    return 0
  }
  const d = baseDigit(k)
  if (baseFuncPage === 0 && d >= 1 && d <= RADIXES) {
    poke(BASE_RADIX, d - 1)
    return 1
  }
  const t = baseFuncPage === 1 ? logicOf(d) : 0
  if (t === 0) refuse()
  return t
}

function logicOf(d: u16): u16 {
  if (d === 1) return T_AND
  if (d === 2) return T_OR
  if (d === 3) return T_XOR
  if (d === 4) return T_XNOR
  if (d === 5) return T_NOT
  return d === 6 ? T_BNEG : 0
}

export function baseFuncScreen(): void {
  baseFuncPage = 0
  drawBaseFunc()
}

function drawBaseFunc(): void {
  cls()
  bandWith(str('FUNC'), baseFuncPage === 0 ? str('1/2') : str('2/2'))
  if (baseFuncPage === 0) {
    textAt(str('1:HEX 2:DEC 3:OCT'), 1, lineY(0))
    textAt(str('4:BIN 5:PEN'), 1, lineY(1))
  } else {
    textAt(str('1:AND 2:OR 3:XOR'), 1, lineY(0))
    textAt(str('4:XNOR 5:not( 6:neg('), 1, lineY(1))
  }
  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
}

/* ---------------- the evaluation ---------------- */

/** The line being read, and where. */
let lineFrom: u16 = 0
let count: u16 = 0
let basePos: u16 = 0

function peekToken(): u16 {
  return basePos < count ? peek(lineFrom + basePos) : 0
}

/** 2³² and 2³¹ as the maths unit's numbers. */
const TWO32 = bytes(8)
const TWO31 = bytes(8)

function constants(): void {
  setNumber(addr(TWO32), 0x4294, 0x9672, 0x9600)
  setNumber(addr(TWO31), 0x2147, 0x4836, 0x4800)
}

/** A ten-digit number d.ddd x 10⁹ from its BCD, four digits a word. */
function setNumber(n: u16, a: u16, b: u16, c: u16): void {
  poke(n, 0)
  poke(n + 1, 9)
  poke(n + 2, a >> 8)
  poke(n + 3, a & 0xff)
  poke(n + 4, b >> 8)
  poke(n + 5, b & 0xff)
  poke(n + 6, c >> 8)
  poke(n + 7, c & 0xff)
}

/** The line at `from`, `length` tokens, worked out in 32 bits: its value on top of the stack. */
export function baseEvaluate(from: u16, size: u16): void {
  lineFrom = from
  count = size
  basePos = 0
  constants()
  if (size === 0) fail(E_SYNTAX, 0)
  either()
  if (basePos < count) fail(E_SYNTAX, basePos)
}

/** OR, XOR and XNOR, the weakest. */
function either(): void {
  both()
  for (;;) {
    const t = peekToken()
    if (t !== T_OR && t !== T_XOR && t !== T_XNOR) return
    const where = basePos
    basePos++
    both()
    logic(t, where)
  }
}

function both(): void {
  sum32()
  while (peekToken() === T_AND) {
    const where = basePos
    basePos++
    sum32()
    logic(T_AND, where)
  }
}

function sum32(): void {
  prod32()
  for (;;) {
    const t = peekToken()
    if (t !== T_PLUS && t !== T_MINUS) return
    const where = basePos
    basePos++
    prod32()
    arithmetic(t === T_PLUS ? M_ADD : M_SUB, where)
  }
}

function prod32(): void {
  sign32()
  for (;;) {
    const t = peekToken()
    if (t !== T_TIMES && t !== T_DIVIDE) return
    const where = basePos
    basePos++
    sign32()
    arithmetic(t === T_TIMES ? M_MUL : M_IDIV, where)
  }
}

function sign32(): void {
  if (peekToken() === T_MINUS) {
    const where = basePos
    basePos++
    sign32()
    math(M_NEG, top(), 0, where)
    wrap32(top(), where)
    return
  }
  primary32()
}

function primary32(): void {
  const t = peekToken()
  const where = basePos
  if (isDigitOf(t)) {
    number32()
    return
  }
  basePos++
  if (t === T_ANS) {
    copy8(KEEP_ANS, push(where))
    wrap32(top(), where)
  } else if (t === T_OPEN || t === T_NOT || t === T_BNEG) {
    either()
    if (peekToken() === T_CLOSE) basePos++
    if (t === T_NOT) logic(T_NOT, where)
    else if (t === T_BNEG) {
      math(M_NEG, top(), 0, where)
      wrap32(top(), where)
    }
  } else fail(E_SYNTAX, where)
}

/** A digit's value in any base (0-9, A-F), or 0xffff. */
function digitValue(t: u16): u16 {
  if (t >= 0x30 && t <= 0x39) return t - 0x30
  if (t >= 0x41 && t <= 0x46) return t - 0x37
  return 0xffff
}

function isDigitOf(t: u16): bool {
  const d = digitValue(t)
  return d !== 0xffff && d < radixValue(radix())
}

/** A number in the base: each digit added to the number so far times the base. */
function number32(): void {
  const where = basePos
  const n = pushInt(0, where)
  const base = pushInt(radixValue(radix()), where)
  const digit = push(where)
  while (isDigitOf(peekToken())) {
    copy8(base, digit)
    math(M_MUL, n, digit, where)
    setDigit(digit, digitValue(peekToken()))
    math(M_ADD, n, digit, where)
    wrap32(n, where)
    basePos++
  }
  pop()
  pop()
}

/** A whole number below 16 as the maths unit's: one digit, exponent 0. */
function setDigit(n: u16, v: u16): void {
  for (let k: u16 = 0; k < 8; k++) poke(n + k, 0)
  if (v >= 10) {
    poke(n + 1, 1)
    // 1 then the digit: 10-15 are 0x10-0x15.
    poke(n + 2, v + 6)
  } else poke(n + 2, v << 4)
}

/** The two values on top worked by `op`, the result brought back into 32 bits. */
function arithmetic(op: u16, where: u16): void {
  const b = top()
  const a = b - VALUE_SIZE
  math(op, a, b, where)
  wrap32(a, where)
  pop()
}

/** `v` taken into -2³¹ .. 2³¹ - 1, as the 32 bits would hold it. */
function wrap32(v: u16, where: u16): void {
  math(M_MOD, v, addr(TWO32), where)
  if (isNegative(v)) math(M_ADD, v, addr(TWO32), where)
  const t = push(where)
  copy8(v, t)
  math(M_SUB, t, addr(TWO31), where)
  if (!isNegative(t)) math(M_SUB, v, addr(TWO32), where)
  pop()
  exactWhole(v)
}

/** The bits of the two values on top (or of the one, for Not) by `t`. */
const left = bytes(4)
const right = bytes(4)

function logic(t: u16, where: u16): void {
  const b = top()
  if (t === T_NOT) {
    math(M_TOI32, b, addr(left), where)
    for (let k: u16 = 0; k < 4; k++) left[k] = ~left[k] & 0xff
    math(M_FROMI32, b, addr(left), where)
    exactWhole(b)
    return
  }
  const a = b - VALUE_SIZE
  math(M_TOI32, a, addr(left), where)
  math(M_TOI32, b, addr(right), where)
  for (let k: u16 = 0; k < 4; k++) left[k] = bitsOf(t, left[k], right[k])
  math(M_FROMI32, a, addr(left), where)
  exactWhole(a)
  pop()
}

function bitsOf(t: u16, a: u16, b: u16): u16 {
  if (t === T_AND) return a & b
  if (t === T_OR) return a | b
  if (t === T_XOR) return a ^ b
  return ~(a ^ b) & 0xff
}

/* ---------------- drawing ---------------- */

/** The bits of Ans, for the answer's lines. */
const bits = bytes(4)
const baseText = bytes(40)

export function baseDraw(): void {
  cls()
  bandWith(str('BASE 32'), radixName(radix()))
  drawLine32()
  if (!answered) return
  noCursor()
  constants()
  math(M_TOI32, KEEP_ANS, addr(bits), 0)
  radixText(radix())
  textRight(addr(baseText), lineY(1))
  // The other bases under it: in PEN the four, down to line 5, and no dots; else three and BIN's dots.
  let n: u16 = 2
  for (let r: u16 = 0; r < 4; r++) {
    if (r === radix()) continue
    textAt(r === BIN ? binName() : radixName(r), 1, lineY(n))
    radixText(r)
    textRight(addr(baseText), lineY(n))
    n++
  }
  if (radix() !== PEN) dots()
}

function radixName(r: u16): u16 {
  if (r === HEX) return str('HEX')
  if (r === 1) return str('DEC')
  if (r === 2) return str('OCT')
  return r === PEN ? str('PEN') : str('BIN')
}

/** BIN with the arrow that shows the other half. */
function binName(): u16 {
  return high ? str('BIN\x8e') : str('BIN\x8d')
}

/** The line on one row at line 0, scrolled so the cursor is on it. */
function drawLine32(): void {
  let chars: u16 = 0
  let cursorAt: u16 = 0
  for (let i: u16 = 0; i < length; i++) {
    if (i === cursor) cursorAt = chars
    chars = into(line[i], chars)
  }
  if (cursor >= length) cursorAt = chars
  const from = cursorAt > 20 ? cursorAt - 20 : 0
  const end = chars - from > 21 ? from + 21 : chars
  for (let c = from; c < end; c++) glyphAt(baseText[c], (c - from) * 6 + 1, lineY(0))
  if (!answered) barDots((cursorAt - from) * 6, lineY(0) - 1)
}

/** A token's characters into the text from `n` (40 at most): where they end. */
function into(t: u16, n: u16): u16 {
  const s = tokenText(t)
  if (s === 0) {
    if (n < 40) baseText[n] = t
    return n + 1
  }
  let k = n
  let p = s
  while (peek(p) !== 0) {
    if (k < 40) baseText[k] = peek(p)
    k++
    p++
  }
  return k
}

/** Ans in base `r` into the text: HEX 8 digits, OCT 11, BIN 16 (a half), DEC signed. */
function radixText(r: u16): void {
  if (r === PEN) {
    penText()
    return
  }
  if (r === 1) {
    poke16(MATH_ARG, 10)
    math(M_FORMAT, KEEP_ANS, addr(baseText), 0)
    baseText[peek16(MATH_ARG)] = 0
    return
  }
  const width: u16 = r === HEX ? 4 : r === BIN ? 1 : 3
  const digits: u16 = r === HEX ? 8 : r === BIN ? 16 : 11
  const first: u16 = r === BIN && high ? 16 : 0
  for (let k: u16 = 0; k < digits; k++) {
    const d = field(first + (digits - 1 - k) * width, width)
    baseText[k] = d < 10 ? 0x30 + d : 0x37 + d
  }
  baseText[digits] = 0
}

/**
 * Ans in base 5, its 32 bits as an unsigned number (as HEX shows them): 14 digits, each the
 * remainder by 5 of what is left, the last first.
 */
function penText(): void {
  const left = WORK + 64
  const five = WORK + 72
  const digit = WORK + 80
  copy8(KEEP_ANS, left)
  if (isNegative(left)) math(M_ADD, left, addr(TWO32), 0)
  setDigit(five, 5)
  for (let k: u16 = 14; k > 0; k--) {
    copy8(left, digit)
    math(M_MOD, digit, five, 0)
    baseText[k - 1] = 0x30 + (peek(digit + 2) >> 4)
    math(M_IDIV, left, five, 0)
  }
  baseText[14] = 0
}

/** `width` bits of Ans from bit `from` (the high bits past 31 are 0). */
function field(from: u16, width: u16): u16 {
  let v: u16 = 0
  for (let k: u16 = 0; k < width; k++) {
    const b = from + k
    if (b < 32 && ((bits[b >> 3] >> (b & 7)) & 1) !== 0) v |= 1 << k
  }
  return v
}

/** BIN's half again as dots at the foot: a block for 1, a line for 0, a gap between bytes. */
function dots(): void {
  const first: u16 = high ? 16 : 0
  for (let b: u16 = 0; b < 16; b++) {
    const x = 122 - b * 7 - (b >= 8 ? 2 : 0)
    const on = field(first + b, 1) === 1
    for (let y: u16 = on ? 57 : 62; y <= 62; y++) {
      for (let dx: u16 = 0; dx < 5; dx++) dot(x + dx, y)
    }
  }
}
