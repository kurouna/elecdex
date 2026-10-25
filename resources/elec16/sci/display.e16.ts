// ELEC-16 SCI, ROM bank 5: an answer on the screen (docs/elec16-sci.md sections 6.4 and 6.6).
// The same value shows in several ways - its exact form, as a mixed number, as a decimal the
// way SETUP says (AUTO, FIX or EXP), in ENG, in degrees-minutes-seconds - and F⇄D, SHIFT F⇄D
// and °′″ move between them. pol( and rec( show their two answers, FIND X its X and the
// difference left. The decimal is written in big digits, the rest set by the 2D layout or in
// the small font.
import {
  addr,
  type bool,
  bytes,
  div,
  i16,
  memcpy,
  peek,
  peek16,
  poke,
  poke16,
  str,
  u16,
} from '../../../src/shared/e16c/builtins'
import { convLabel } from './consts.e16'
import { setAnswer, setTokensAt, tokensWidth } from './layout.e16'
import { bigNumber, textAt, textRight } from './lcd.e16'
import {
  copy8,
  diffValue,
  FORMAT_AUTO2,
  FORMAT_EXP,
  FORMAT_FIX,
  isExact,
  isNegative,
  isZero,
  KEEP_ANS,
  KEEP_DIGITS,
  KEEP_DISPLAY,
  KEEP_FORMAT,
  KEEP_MIXED,
  M_ABS,
  M_ADD,
  M_CMP,
  M_FORMAT,
  M_FRAC,
  M_IDIV,
  M_INT,
  M_MOD,
  M_MUL,
  M_NEG,
  M_RNDTO,
  M_SQR,
  M_SUB,
  M_TOINT,
  MATH_ARG,
  MATH_RESULT,
  math,
  V_P,
  V_Q,
  V_R,
  V_S,
  varAt,
  wholeInto,
} from './numbers.e16'
import {
  isFunction,
  T_CLOSE,
  T_DEG,
  T_END,
  T_EXP,
  T_FRAC,
  T_MDIV,
  T_MIN,
  T_MINUS,
  T_MIXED,
  T_MSEP,
  T_OPEN,
  T_PLUS,
  T_POL,
  T_POW,
  T_POWT,
  T_REC,
  T_ROOT,
  T_SEC,
  T_SEP,
  T_TIMES,
} from './tokens.e16'

/** How the answer is shown now. */
export const SHOW_DECIMAL = 0
export const SHOW_FORM = 1
export const SHOW_MIXED = 2
export const SHOW_ENG = 3
export const SHOW_DMS = 4
export const SHOW_PAIR = 5
export const SHOW_FOUND = 6
/** A decimal CONV made, the conversion named over it (section 14.4). */
export const SHOW_CONV = 7
/** Ans as its prime factors, →PRIME's (section 15.4). */
export const SHOW_PRIME = 8
/** ENG with its exponent as an SI prefix, ENG pressed again (section 15.3). */
export const SHOW_PREFIX = 9

/** The text being written, and how long it is. */
const text = bytes(32)
let textLength: u16 = 0
/** Numbers worked on while writing: never Ans itself. */
const scratch = bytes(8)
const spare = bytes(8)
const unit = bytes(8)
const degreePart = bytes(8)
const minutePart = bytes(8)
/** An exact answer's tokens, for the 2D layout. */
const answerTokens = bytes(48)
let answerLength: u16 = 0

/* ---------------- which ways there are ---------------- */

/** Whether Ans has an exact form other than a whole number (which its decimal shows as well). */
export function hasForm(): bool {
  if (!isExact(KEEP_ANS)) return false
  return !isZero(KEEP_ANS + V_R) || !isOne(KEEP_ANS + V_Q)
}

/** Whether Ans is a fraction greater than 1 in size, which a mixed number can show. */
function mixable(): bool {
  if (!hasForm() || !isZero(KEEP_ANS + V_R)) return false
  copy8(KEEP_ANS + V_P, addr(scratch))
  math(M_ABS, addr(scratch), 0, 0)
  math(M_SUB, addr(scratch), KEEP_ANS + V_Q, 0)
  return !isNegative(addr(scratch)) && !isZero(addr(scratch))
}

/**
 * Whether the line at `at` is pol( or rec( alone (its ) may be left off): its two answers are
 * shown; with anything after it (pol(3,4)x2) the line's own value is.
 */
export function pairLine(at: u16, length: u16): bool {
  const first = peek(at)
  if (length === 0 || (first !== T_POL && first !== T_REC)) return false
  let depth: u16 = 1
  for (let i: u16 = 1; i < length; i++) {
    const t = peek(at + i)
    if (t === T_CLOSE) depth--
    else if (t === T_OPEN || t === T_POW || isFunction(t)) depth++
    if (depth === 0) return i === length - 1
  }
  return true
}

/** How an answer is shown first: in 2D its form unless asked for a decimal, as SETUP says. */
export function firstShown(form: bool): u16 {
  if (!form || !hasForm()) return SHOW_DECIMAL
  if (peek(KEEP_MIXED) !== 0 && mixable()) return SHOW_MIXED
  return SHOW_FORM
}

/** F⇄D: the form, the mixed number (where there is one), the decimal, and round again. */
export function nextShown(shown: u16): u16 {
  if (shown === SHOW_FORM) return mixable() ? SHOW_MIXED : SHOW_DECIMAL
  if (shown === SHOW_MIXED) return SHOW_DECIMAL
  return SHOW_FORM
}

/* ---------------- drawing ---------------- */

/** Ans on the answer rows, shown as `shown` says. */
export function drawAnswerAs(shown: u16): void {
  if (shown === SHOW_FORM) drawForm()
  else if (shown === SHOW_MIXED) showMixed()
  else if (shown === SHOW_DMS) drawDms()
  else if (shown === SHOW_PAIR) drawPair()
  else if (shown === SHOW_PRIME) drawPrimes()
  else {
    if (shown === SHOW_ENG || shown === SHOW_PREFIX) engText(KEEP_ANS)
    else decimalText(KEEP_ANS)
    prefixed = shown === SHOW_PREFIX
    drawDecimal()
    prefixed = false
    if (shown === SHOW_FOUND) drawFound()
    if (shown === SHOW_CONV) textAt(convLabel(), 1, 40)
  }
}

/* ---------------- the prime factors ---------------- */

/** Ans's prime factors as tokens, worked out once by primeAns, and how many. */
const primeTokens = bytes(48)
let primeLength: u16 = 0
/** What is left to factor, the two divisors tried, and a number worked with. */
const leftOver = bytes(8)
const tryLow = bytes(8)
const tryHigh = bytes(8)
const worked = bytes(8)
/** Divisors 6k - 1 and 6k + 1 are tried up to this k: past it, they are over √ of what is left. */
let lastK: u16 = 0

/**
 * Ans as its prime factors (section 15.4) into primeTokens, 2³×3²×5: false for anything that
 * is not a whole number from 2 to 10¹⁰ - 1 in size. 2 and 3, then 6k ± 1 up to √n; what is
 * left past that is a prime.
 */
export function primeAns(): bool {
  const n = addr(leftOver)
  if (formOf(KEEP_ANS)) return false
  memcpy(n, KEEP_ANS, 8)
  memcpy(addr(worked), n, 8)
  math(M_FRAC, addr(worked), 0, 0)
  if (!isZero(addr(worked))) return false
  answerLength = 0
  if (isNegative(n)) {
    answerToken(T_MINUS)
    math(M_NEG, n, 0, 0)
  }
  wholeInto(addr(worked), 2)
  if (below(n, addr(worked))) return false
  // 10¹⁰: 10000², x100.
  wholeInto(addr(worked), 10000)
  math(M_MUL, addr(worked), addr(worked), 0)
  wholeInto(addr(tryLow), 100)
  math(M_MUL, addr(worked), addr(tryLow), 0)
  if (!below(n, addr(worked))) return false
  wholeInto(addr(tryLow), 2)
  divideOut(addr(tryLow))
  wholeInto(addr(tryLow), 3)
  divideOut(addr(tryLow))
  wholeInto(addr(tryLow), 5)
  wholeInto(addr(tryHigh), 7)
  wholeInto(addr(worked), 6)
  findLastK()
  for (let k: u16 = 1; k <= lastK; k++) {
    divideOut(addr(tryLow))
    divideOut(addr(tryHigh))
    math(M_ADD, addr(tryLow), addr(worked), 0)
    math(M_ADD, addr(tryHigh), addr(worked), 0)
  }
  wholeInto(addr(worked), 1)
  if (below(addr(worked), n)) factorToken(n, 1)
  memcpy(addr(primeTokens), addr(answerTokens), answerLength)
  primeLength = answerLength
  return true
}

/** a < b, two numbers. */
function below(a: u16, b: u16): bool {
  math(M_CMP, a, b, 0)
  return i16(peek16(MATH_RESULT)) < 0
}

/** `d` divided out of what is left as often as it goes, written as a factor if it went. */
function divideOut(d: u16): void {
  let times: u16 = 0
  for (;;) {
    memcpy(addr(spare), addr(leftOver), 8)
    math(M_MOD, addr(spare), d, 0)
    if (!isZero(addr(spare))) break
    math(M_IDIV, addr(leftOver), d, 0)
    times++
  }
  if (times === 0) return
  factorToken(d, times)
  findLastK()
}

/** The largest k whose 6k - 1 is not over √ of what is left: (int(√n) + 1) / 6. */
function findLastK(): void {
  memcpy(addr(scratch), addr(leftOver), 8)
  math(M_SQR, addr(scratch), 0, 0)
  math(M_INT, addr(scratch), 0, 0)
  wholeInto(addr(unit), 1)
  math(M_ADD, addr(scratch), addr(unit), 0)
  wholeInto(addr(unit), 6)
  math(M_IDIV, addr(scratch), addr(unit), 0)
  math(M_TOINT, addr(scratch), 0, 0)
  lastK = peek16(MATH_ARG)
}

/** A factor `p` to the power `times` after those there are: ×, its digits, the power raised. */
function factorToken(p: u16, times: u16): void {
  if (answerLength > 0 && answerTokens[answerLength - 1] !== T_MINUS) answerToken(T_TIMES)
  answerNumber(p, true)
  if (times < 2) return
  answerToken(T_POWT)
  if (times >= 10) answerToken(0x30 + div(times, 10))
  answerToken(0x30 + (times % 10))
  answerToken(T_END)
}

/** The factors on the answer rows; too wide for them, on two lines, broken after the × nearest the middle. */
function drawPrimes(): void {
  const at = addr(primeTokens)
  const w = tokensWidth(at, primeLength)
  if (w <= 128) {
    setTokensAt(at, primeLength, 62)
    return
  }
  let split: u16 = 0
  let best: u16 = 0xffff
  for (let i: u16 = 0; i < primeLength; i++) {
    if (primeTokens[i] !== T_TIMES) continue
    const twice = tokensWidth(at, i + 1) * 2
    const off = twice > w ? twice - w : w - twice
    if (off < best) {
      best = off
      split = i + 1
    }
  }
  setTokensAt(at, split, 50)
  setTokensAt(at + split, primeLength - split, 62)
}

/** A decimal other than Ans in big digits, as SETUP shows one (CPLX's real answer). */
export function drawBig(v: u16): void {
  decimalText(v)
  drawDecimal()
}

/** The text in big digits, its exponent raised at the right edge after x10. */
function drawDecimal(): void {
  let mantissa = textLength
  for (let i: u16 = 0; i < textLength; i++) {
    if (text[i] === 0x45) mantissa = i
  }
  let right: u16 = 127
  if (prefixed && mantissa < textLength) {
    // The prefix of ENG's exponent in the small font at the foot's right, for x10 and it.
    prefixText[0] = peek(str('fpn\x9fmkMGT') + prefixIndex())
    textAt(addr(prefixText), 122, 55)
    right = 121
  } else if (mantissa < textLength) {
    const exponent = addr(text) + mantissa + 1
    const digits = textLength - mantissa - 1
    const x = 128 - digits * 6
    textAt(exponent, x, 48)
    textAt(str('\x8110'), x - 18, 55)
    right = x - 19
  }
  bigNumber(addr(text), mantissa, right)
}

/** Pol's or Rec's answers, X and Y, a line each. */
function drawPair(): void {
  textAt(str('X='), 1, 46)
  decimalText(varAt(0x58))
  textRight(addr(text), 46)
  textAt(str('Y='), 1, 55)
  decimalText(varAt(0x59))
  textRight(addr(text), 55)
}

/** FIND X's: X in big digits (as Ans), and what the line came to there, DIFF. */
function drawFound(): void {
  textAt(str('X='), 1, 55)
  textAt(str('DIFF='), 1, 37)
  decimalText(addr(diffValue))
  textRight(addr(text), 37)
}

/** Degrees, minutes and seconds in the small font, at the right of the answer rows. */
function drawDms(): void {
  dmsText(KEEP_ANS)
  textRight(addr(text), 55)
}

/* ---------------- the exact form ---------------- */

/** Ans's exact form (p + r√s)/q as tokens, set on the answer rows by the 2D layout. */
function drawForm(): void {
  answerLength = 0
  formTokens(KEEP_ANS)
  setAnswer(addr(answerTokens), answerLength)
}

/** A value's exact form as tokens after those there are. */
function formTokens(v: u16): void {
  const p = v + V_P
  const r = v + V_R
  const q = v + V_Q
  const fractionOf = !isOne(q)
  const oneTerm = isZero(p) || isZero(r)
  // A single negative term's sign goes before its fraction: -√2/2, not (-√2)/2.
  const signOut = oneTerm && fractionOf && (isZero(r) ? isNegative(p) : isNegative(r))
  if (signOut) answerToken(T_MINUS)
  if (fractionOf) answerToken(T_FRAC)
  if (!isZero(p) || isZero(r)) answerNumber(p, signOut)
  if (!isZero(r)) answerRoot(p, r, signOut)
  if (fractionOf) {
    answerToken(T_SEP)
    answerNumber(q, false)
    answerToken(T_END)
  }
}

/** Whether a value has an exact form other than a whole number. */
function formOf(v: u16): bool {
  return isExact(v) && (!isZero(v + V_R) || !isOne(v + V_Q))
}

/**
 * A value right on the line whose foot is at `foot`: its exact form in 2D (`twoD`), else its
 * decimal as SETUP shows one, in the small font.
 */
export function drawValueAt(v: u16, foot: u16, twoD: bool): void {
  if (twoD && formOf(v)) {
    answerLength = 0
    formTokens(v)
    setTokensAt(addr(answerTokens), answerLength, foot)
    return
  }
  decimalText(v)
  textRight(addr(text), foot - 7)
}

/**
 * re ± im i (`minus` the sign, im not negative) on the line whose foot is at `foot`: the exact
 * forms in 2D when both have one or are whole, else six digits each.
 */
export function drawComplexAt(re: u16, im: u16, minus: bool, foot: u16): void {
  answerLength = 0
  const exact = isExact(re) && isExact(im)
  if (!isZero(re)) {
    if (exact) formTokens(re)
    else shortNumber(re)
  }
  if (minus) answerToken(T_MINUS)
  else if (!isZero(re)) answerToken(T_PLUS)
  if (!exact || !isOne(im)) {
    if (exact) formTokens(im)
    else shortNumber(im)
  }
  answerToken(0x69)
  setTokensAt(addr(answerTokens), answerLength, foot)
}

/** Whether an inequality's pieces show their bounds as decimals (F⇄D on its answer). */
let pieceDecimals: bool = false

export function setPieceDecimals(on: bool): void {
  pieceDecimals = on
}

/**
 * One piece of an inequality's answer right on the line whose foot is at `foot` (section 15.6):
 * `lo` sign X sign `hi`, either bound 0 for none; `signs` the low sign's token and the high one's
 * above it. Bounds in their forms in 2D, else in ten digits; six where the line is too wide.
 */
export function drawPieceAt(lo: u16, hi: u16, signs: u16, foot: u16): void {
  pieceTokens(lo, hi, signs, 10)
  if (tokensWidth(addr(answerTokens), answerLength) > 128) pieceTokens(lo, hi, signs, 6)
  setTokensAt(addr(answerTokens), answerLength, foot)
}

function pieceTokens(lo: u16, hi: u16, signs: u16, digits: u16): void {
  answerLength = 0
  if (lo !== 0) {
    boundTokens(lo, digits)
    answerToken(signs & 0xff)
  }
  answerToken(0x58)
  if (hi !== 0) {
    answerToken(signs >> 8)
    boundTokens(hi, digits)
  }
}

/** A bound: its form in 2D (a whole number too), else its decimal in `digits` digits. */
function boundTokens(v: u16, digits: u16): void {
  if (peek(KEEP_DISPLAY) === 0 && !pieceDecimals && isExact(v)) {
    formTokens(v)
    return
  }
  formatTokens(v, digits)
}

/** A decimal in six significant digits as tokens (its characters are its tokens). */
function shortNumber(v: u16): void {
  formatTokens(v, 6)
}

/** A decimal in `digits` significant digits as tokens: its sign the minus, its exponent ᴇ. */
function formatTokens(v: u16, digits: u16): void {
  format(v, digits)
  for (let i: u16 = 0; i < textLength; i++) {
    const c = text[i]
    answerToken(c === 0x2d ? T_MINUS : c === 0x45 ? T_EXP : c)
  }
}

/** p/q as a mixed number: its sign before, the whole part, then what is left over q. */
function showMixed(): void {
  answerLength = 0
  const p = KEEP_ANS + V_P
  const q = KEEP_ANS + V_Q
  if (isNegative(p)) answerToken(T_MINUS)
  copy8(p, addr(scratch))
  math(M_ABS, addr(scratch), 0, 0)
  copy8(addr(scratch), addr(spare))
  math(M_IDIV, addr(scratch), q, 0)
  math(M_MOD, addr(spare), q, 0)
  answerToken(T_MIXED)
  answerNumber(addr(scratch), true)
  answerToken(T_MSEP)
  answerNumber(addr(spare), true)
  answerToken(T_MDIV)
  answerNumber(q, true)
  answerToken(T_END)
  setAnswer(addr(answerTokens), answerLength)
}

/** The r√s term after p: its sign (unless it went before the fraction), r unless ±1, √s. */
function answerRoot(p: u16, r: u16, signOut: bool): void {
  // s is a word after the decimal of the same value, V_S - V_R before r.
  const s = peek16(r - V_R + V_S)
  if (!isZero(p)) answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  else if (isNegative(r) && !signOut) answerToken(T_MINUS)
  if (!isOne(r) && !isMinusOne(r)) answerNumber(r, true)
  answerToken(T_ROOT)
  if (s >= 10) answerToken(0x30 + div(s, 10))
  answerToken(0x30 + (s % 10))
  answerToken(T_END)
}

function answerToken(t: u16): void {
  if (answerLength < 48) {
    answerTokens[answerLength] = t
    answerLength++
  }
}

/** A whole number's digits as tokens; its sign too, unless `bare`. */
function answerNumber(n: u16, bare: bool): void {
  format(n, 12)
  for (let i: u16 = 0; i < textLength; i++) {
    const c = text[i]
    if (c === 0x2d) {
      if (!bare) answerToken(T_MINUS)
    } else answerToken(c)
  }
}

function isOne(n: u16): bool {
  return peek(n) === 0 && isUnit(n)
}

function isMinusOne(n: u16): bool {
  return peek(n) !== 0 && isUnit(n)
}

/** Whether a number is 1 in size: exponent 0, the digits 1 then zeros. */
function isUnit(n: u16): bool {
  return peek(n + 1) === 0 && peek16(n + 2) === 0x10 && peek16(n + 4) === 0 && peek16(n + 6) === 0
}

/* ---------------- a decimal's text ---------------- */

/** `v` as the maths unit's FORMAT writes it in `digits` (1-12), into the text. */
function format(v: u16, digits: u16): void {
  poke16(MATH_ARG, digits)
  math(M_FORMAT, v, addr(text), 0)
  textLength = peek16(MATH_ARG)
  text[textLength] = 0
}

/** `v` rounded by RNDTO's `digits` (significant above 0, places at or below) into scratch. */
function rounded(v: u16, digits: u16): void {
  copy8(v, addr(scratch))
  poke16(MATH_ARG, digits)
  math(M_RNDTO, addr(scratch), 0, 0)
}

/** A number's exponent: its value is d.ddd x 10^exponent. */
function exponentOf(v: u16): i16 {
  const e = peek(v + 1)
  return e >= 128 ? i16(e) - 256 : i16(e)
}

/**
 * `v` as SETUP shows a decimal. AUTO: ten digits on the display - the 0 before a point counts -
 * from 10⁻⁹ up to 10¹⁰, an exponent outside; FIX n: n places, the zeros written; EXP n: n
 * significant digits (EXP 0 ten) with an exponent always.
 */
export function decimalText(v: u16): void {
  const shape = peek(KEEP_FORMAT)
  const n = peek(KEEP_DIGITS)
  if (shape === FORMAT_FIX) fixText(v, n)
  else if (shape === FORMAT_EXP) expText(v, n === 0 ? 10 : n, false)
  else autoText(v, shape === FORMAT_AUTO2)
}

/** `v` as SETUP shows a decimal: the text's address (it holds until the next text). */
export function textOf(v: u16): u16 {
  decimalText(v)
  return addr(text)
}

/** AUTO; AUTO2 (`small`) writes a number below 0.01 with an exponent too: 0.003 is 3E-3. */
function autoText(v: u16, small: bool): void {
  const e = exponentOf(v)
  if (small && !isZero(v) && e < -2) {
    trimmed = true
    expText(v, 10, false)
    trimmed = false
    return
  }
  if (isZero(v) || e < -9 || e > 9) {
    format(v, 10)
    return
  }
  const places: i16 = e >= 0 ? 9 - e : 9
  rounded(v, u16(-places))
  format(addr(scratch), 12)
}

function fixText(v: u16, n: u16): void {
  rounded(v, u16(-i16(n)))
  format(addr(scratch), 12)
  // A number too large for its places keeps its exponent; otherwise the zeros are written.
  let point = textLength
  for (let i: u16 = 0; i < textLength; i++) {
    if (text[i] === 0x45) return
    if (text[i] === 0x2e) point = i
  }
  if (n === 0) return
  if (point === textLength) addChar(0x2e)
  while (textLength - point - 1 < n) addChar(0x30)
}

/**
 * d.ddd E e in `digits` significant digits, read off the number's own BCD; in ENG (`eng`) the
 * exponent a multiple of 3, one to three digits before the point, the zeros after it dropped.
 */
function expText(v: u16, digits: u16, eng: bool): void {
  textLength = 0
  rounded(v, digits)
  const w = addr(scratch)
  if (isNegative(w)) addChar(0x2d)
  const e = exponentOf(w)
  let shift: i16 = 0
  if (eng) shift = e >= 0 ? e % 3 : (3 - (-e % 3)) % 3
  for (let k: u16 = 0; k < digits; k++) {
    const pair = peek(w + 2 + (k >> 1))
    addChar(0x30 + ((k & 1) === 0 ? pair >> 4 : pair & 15))
    if (i16(k) === shift && k + 1 < digits) addChar(0x2e)
  }
  if (eng || trimmed) trimZeros()
  addChar(0x45)
  numberChars(e - shift)
}

/** expText leaves no zeros after the point (AUTO2's exponent form). */
let trimmed: bool = false

/** Whether drawDecimal writes ENG's exponent as its prefix, and the prefix's letter. */
let prefixed: bool = false
const prefixText = bytes(2)

/** ENG's exponent for Ans: d.ddd x 10 to it, a multiple of 3. */
function engExponent(): i16 {
  rounded(KEEP_ANS, 10)
  const e = exponentOf(addr(scratch))
  return e - (e >= 0 ? e % 3 : (3 - (-e % 3)) % 3)
}

/** Whether Ans's ENG exponent has an SI prefix: -15 to 12, not 0 (section 15.3). */
export function engPrefixed(): bool {
  if (isZero(KEEP_ANS)) return false
  const n = engExponent()
  return n !== 0 && n >= -15 && n <= 12
}

/** The prefix's place in f p n μ m k M G T. */
function prefixIndex(): u16 {
  const n = engExponent()
  return n < 0 ? u16(div(u16(n + 15), 3)) : u16(div(u16(n + 12), 3))
}

/** ENG: ten significant digits, the exponent a multiple of 3. */
export function engText(v: u16): void {
  if (isZero(v)) {
    format(v, 10)
    return
  }
  expText(v, 10, true)
}

/** The zeros after the point dropped, and the point when nothing is left after it. */
function trimZeros(): void {
  let point = textLength
  for (let i: u16 = 0; i < textLength; i++) {
    if (text[i] === 0x2e) point = i
  }
  if (point === textLength) return
  while (textLength > point + 1 && text[textLength - 1] === 0x30) textLength--
  if (textLength === point + 1) textLength--
  text[textLength] = 0
}

/** A small signed number's digits, -99 to 99. */
function numberChars(n: i16): void {
  let k = n
  if (k < 0) {
    addChar(0x2d)
    k = -k
  }
  if (k >= 10) addChar(0x30 + div(u16(k), 10))
  addChar(0x30 + (u16(k) % 10))
}

function addChar(c: u16): void {
  if (textLength < 31) {
    text[textLength] = c
    textLength++
    text[textLength] = 0
  }
}

/* ---------------- degrees, minutes and seconds ---------------- */

/** `v` as d°m′s″, the seconds to two places; a number past 10¹⁰ as its decimal. */
function dmsText(v: u16): void {
  if (exponentOf(v) > 9) {
    decimalText(v)
    return
  }
  setDigits(1)
  copy8(v, addr(degreePart))
  math(M_ABS, addr(degreePart), 0, 0)
  // The minutes: what is past the degrees, x 60; the seconds what is past those, x 60.
  copy8(addr(degreePart), addr(minutePart))
  math(M_IDIV, addr(degreePart), addr(unit), 0)
  math(M_SUB, addr(minutePart), addr(degreePart), 0)
  sixty(addr(minutePart))
  copy8(addr(minutePart), addr(spare))
  math(M_IDIV, addr(minutePart), addr(unit), 0)
  math(M_SUB, addr(spare), addr(minutePart), 0)
  sixty(addr(spare))
  poke16(MATH_ARG, u16(-2))
  math(M_RNDTO, addr(spare), 0, 0)
  // Seconds rounded up to 60 are a minute (1.9999999 is 2°0′0″, never 1°59′60″).
  setDigits(1)
  copy8(addr(unit), addr(scratch))
  setDigits(60)
  carry(addr(spare), addr(minutePart))
  carry(addr(minutePart), addr(degreePart))
  setDigits(1)
  textLength = 0
  if (isNegative(v)) addChar(0x2d)
  part(addr(degreePart), T_DEG)
  part(addr(minutePart), T_MIN)
  part(addr(spare), T_SEC)
}

/** 60 of `low` (unit holds 60, scratch 1) taken into one of `high`. */
function carry(low: u16, high: u16): void {
  math(M_CMP, low, addr(unit), 0)
  if (i16(peek16(MATH_RESULT)) < 0) return
  math(M_SUB, low, addr(unit), 0)
  math(M_ADD, high, addr(scratch), 0)
}

/** x 60, in place (`unit` holds 1 again after). */
function sixty(n: u16): void {
  setDigits(60)
  math(M_MUL, n, addr(unit), 0)
  setDigits(1)
}

/** A part's digits after the text so far, then its mark. */
function part(n: u16, mark: u16): void {
  const at = textLength
  const before = addr(text) + at
  poke16(MATH_ARG, 10)
  math(M_FORMAT, n, before, 0)
  textLength = at + peek16(MATH_ARG)
  addChar(mark)
}

/** A whole number below 100 as a decimal in `unit`: sign 0, exponent, its BCD. */
function setDigits(n: u16): void {
  for (let k: u16 = 0; k < 8; k++) unit[k] = 0
  if (n >= 10) {
    unit[1] = 1
    unit[2] = (div(n, 10) << 4) | (n % 10)
  } else unit[2] = n << 4
}
