// ELEC-16 SCI, ROM bank 6: f(x) and FIND X (docs/elec16-sci.md section 6.6). Both ask for X
// first ("X?", the value it has now shown; = keeps it, or a line typed is evaluated into it).
// f(x) then evaluates the line with that X; FIND X looks for an X where the line comes to 0
// by Newton's method, the slope taken from either side of X, and shows what the line still
// came to there (DIFF). Neither changes the line.
import {
  addr,
  type bool,
  bytes,
  peek,
  peek16,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { evaluate } from './eval.e16'
import { band, barAt, cls, glyphAt, lineY, noCursor, textAt, textRight } from './lcd.e16'
import {
  clearStack,
  copyValue,
  diffValue,
  E_FIND,
  fail,
  inexact,
  isNegative,
  isZero,
  KEEP_ANS,
  M_ABS,
  M_ADD,
  M_CMP,
  M_DIV,
  M_FORMAT,
  M_MUL,
  M_SUB,
  MATH_ARG,
  MATH_RESULT,
  math,
  top,
  VALUE_SIZE,
  varAt,
} from './numbers.e16'
import { tokenText } from './tokens.e16'

/** What ask's keys mean to the calculator. */
export const ASK_STAY = 0
export const ASK_BACK = 1
export const ASK_DONE = 2

/** What is asked for: X for f(x) or FIND X, or TABLE's START, END or STEP. */
export const FOR_FX = 0
export const FOR_FIND = 1
export const FOR_TABLE = 2
/** The calculator's line, what it is asked for, and where the answer goes. */
let askingAt: u16 = 0
let askingLength: u16 = 0
let finding: bool = false
let askedFor: u16 = 0
let target: u16 = 0
let label: u16 = 0
/** What is typed after X?. */
const entry = bytes(40)
let entryLength: u16 = 0

/** X, and the values Newton's method works on: each a value (VALUE_SIZE bytes). */
const x = bytes(36)
const fx = bytes(36)
const step = bytes(36)
const ahead = bytes(36)
const small = bytes(36)
/** At most this many steps, then FIND X gives up. */
const STEPS = 60

const X = 0x58

/** f(x) (or FIND X, `find`) on the line at `at`: X? on screen. */
export function askStart(at: u16, length: u16, find: bool): void {
  askingAt = at
  askingLength = length
  finding = find
  askedFor = find ? FOR_FIND : FOR_FX
  target = varAt(X)
  label = str('X?')
  entryLength = 0
  drawAsk()
}

/** TABLE's START?, END? or STEP? (`k` 0-2), into the value at `into`. */
export function askRange(k: u16, into: u16): void {
  askedFor = FOR_TABLE
  target = into
  label = k === 0 ? str('START?') : k === 1 ? str('END?') : str('STEP?')
  entryLength = 0
  drawAsk()
}

/** A key while X? waits: a token typed (`t`, 0 for none), DEL, = or AC. */
export function askKey(isEquals: bool, isDelete: bool, isClear: bool, t: u16): u16 {
  if (isClear) return ASK_BACK
  if (isEquals) {
    finish()
    return ASK_DONE
  }
  if (isDelete) {
    if (entryLength > 0) entryLength--
  } else if (t !== 0 && entryLength < 40) {
    entry[entryLength] = t
    entryLength++
  }
  drawAsk()
  return ASK_STAY
}

/** The title, X now, and what is typed, the cursor after it. */
function drawAsk(): void {
  cls()
  band(askedFor === FOR_TABLE ? str('TABLE') : finding ? str('FIND X') : str('f(X)'))
  textAt(label, 1, lineY(0))
  formatInto(target)
  textRight(addr(xText), lineY(1))
  let col: u16 = 0
  for (let i: u16 = 0; i < entryLength; i++) col = shownAt(entry[i], col)
  textAt(str('=:GO   AC:BACK'), 1, lineY(5))
  barAt(col < 21 ? col : 20, 4)
}

/** A token's characters on row 4 from column `col`: where they end. */
function shownAt(t: u16, col: u16): u16 {
  const s = tokenText(t)
  if (s === 0) {
    if (col < 21) glyphAt(t, col * 6, 32)
    return col + 1
  }
  let c = col
  let p = s
  while (peek(p) !== 0) {
    if (c < 21) glyphAt(peek(p), c * 6, 32)
    c++
    p++
  }
  return c
}

const xText = bytes(16)

function formatInto(v: u16): void {
  poke16(MATH_ARG, 10)
  math(M_FORMAT, v, addr(xText), 0)
  xText[peek16(MATH_ARG)] = 0
}

/** = after X?: X set from the entry (if any), then the line evaluated or solved. */
function finish(): void {
  noCursor()
  if (entryLength > 0) {
    clearStack()
    evaluate(addr(entry), entryLength)
    copyValue(top(), target)
  }
  if (askedFor === FOR_TABLE) return
  if (finding) newton()
  else {
    evalWith(varAt(X))
    copyValue(top(), KEEP_ANS)
  }
}

/** The line evaluated with X = `v`: its value on top of the stack. */
function evalWith(v: u16): void {
  copyValue(v, varAt(X))
  clearStack()
  evaluate(askingAt, askingLength)
}

/**
 * Newton's method from X: x - f(x) / f'(x), the slope (f(x + h) - f(x - h)) / 2h with h a
 * millionth of x (of 1 below 1), until a step is below 10⁻¹¹ of x. ERR:FIND when the slope
 * is 0 or it has not settled in STEPS steps; X is left where it was then.
 */
function newton(): void {
  copyValue(varAt(X), addr(x))
  inexact(addr(x))
  let settled = false
  for (let k: u16 = 0; k < STEPS && !settled; k++) settled = newtonStep()
  copyValue(addr(x), varAt(X))
  if (!settled) fail(E_FIND, 0)
  evalWith(addr(x))
  copyValue(top(), addr(diffValue))
  copyValue(addr(x), varAt(X))
  copyValue(addr(x), KEEP_ANS)
}

/** One step from x: whether it has settled (f(x) is 0, or the step was small enough). */
function newtonStep(): bool {
  evalWith(addr(x))
  copyValue(top(), addr(fx))
  if (isZero(addr(fx))) return true
  // h: a millionth of |x|, or of 1 when |x| is below 1.
  copyValue(addr(x), addr(step))
  math(M_ABS, addr(step), 0, 0)
  setConstant(0, 0x10)
  math(M_CMP, addr(step), addr(small), 0)
  if (peek16(MATH_RESULT) === 0xffff) setOneInStep()
  setMillionth()
  math(M_MUL, addr(step), addr(small), 0)
  slope()
  if (isZero(addr(ahead))) fail(E_FIND, 0)
  // The step: f(x) / f'(x), taken from x.
  math(M_DIV, addr(fx), addr(ahead), 0)
  math(M_SUB, addr(x), addr(fx), 0)
  return smallStep()
}

/** f'(x) into `ahead`: (f(x + h) - f(x - h)) / 2h, h in `step`. */
function slope(): void {
  copyValue(addr(x), addr(ahead))
  math(M_ADD, addr(ahead), addr(step), 0)
  evalWith(addr(ahead))
  copyValue(top(), addr(ahead))
  copyValue(addr(x), addr(small))
  math(M_SUB, addr(small), addr(step), 0)
  evalWith(addr(small))
  math(M_SUB, addr(ahead), top(), 0)
  math(M_DIV, addr(ahead), addr(step), 0)
  setHalf()
  math(M_MUL, addr(ahead), addr(small), 0)
}

/** Whether the step just taken (in fx) is within 10⁻¹¹ of x (of 1 for a small x). */
function smallStep(): bool {
  math(M_ABS, addr(fx), 0, 0)
  copyValue(addr(x), addr(step))
  math(M_ABS, addr(step), 0, 0)
  setTiny()
  if (isNegative(addr(step)) || exponentBelowZero(addr(step))) {
    math(M_CMP, addr(fx), addr(small), 0)
  } else {
    math(M_MUL, addr(step), addr(small), 0)
    math(M_CMP, addr(fx), addr(step), 0)
  }
  return peek16(MATH_RESULT) !== 1
}

function exponentBelowZero(v: u16): bool {
  return peek(v + 1) >= 128
}

/* Small constants written straight as the maths unit's decimals: sign, exponent, BCD. */

function setConstant(exponent: u16, digits: u16): void {
  for (let k: u16 = 0; k < VALUE_SIZE; k++) small[k] = 0
  small[1] = exponent
  small[2] = digits
}

/** 10⁻⁶ in `small`. */
function setMillionth(): void {
  setConstant(0xfa, 0x10)
}

/** 0.5 in `small`. */
function setHalf(): void {
  setConstant(0xff, 0x50)
}

/** 10⁻¹¹ in `small`. */
function setTiny(): void {
  setConstant(0xf5, 0x10)
}

/** 1 in `step`. */
function setOneInStep(): void {
  for (let k: u16 = 0; k < VALUE_SIZE; k++) step[k] = 0
  step[2] = 0x10
}
