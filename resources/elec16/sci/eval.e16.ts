// ELEC-16 SCI, ROM bank 0: the line evaluated (docs/elec16-sci.md section 6.3). A recursive
// descent over the tokens, each value a decimal number on the stack (numbers.e16.ts). From the
// strongest: brackets, functions and values; the powers and the other postfixes (a run of
// powers read from the right); the sign; nCr and nPr; a multiplication with no sign (stronger
// than x and /, as a textbook is read); x and /; + and -. A function or a bracket left open is
// closed by the line's end. S5 adds the hyperbolic functions, Abs, the FUNC menu's functions
// (two of them take two arguments, a comma between), %, degrees-minutes-seconds, a mixed
// number and a root of any index. v2 adds the physical constants, Σ, d/dx and ∫ (calculus.e16.ts)
// and a comparison at the line's outermost level, for programs (docs/elec16-sci.md section 14).
import {
  addr,
  type bool,
  bytes,
  i16,
  peek,
  peek16,
  poke16,
  u16,
} from '../../../src/shared/e16c/builtins'
import { calculus, integralReset } from './calculus.e16'
import { constValue } from './consts.e16'
import {
  exactBinary,
  exactLiteral,
  exactNeg,
  exactSqrt,
  exactTrig,
  exactWhole,
  TRIG_COS,
  TRIG_SIN,
  TRIG_TAN,
} from './exact.e16'
import {
  copy8,
  copyValue,
  E_MATH,
  E_SYNTAX,
  FORMAT_EXP,
  FORMAT_FIX,
  fail,
  inexact,
  isNegative,
  isZero,
  KEEP_ANGLE,
  KEEP_ANS,
  KEEP_DIGITS,
  KEEP_FORMAT,
  M_ACS,
  M_ACSH,
  M_ADD,
  M_ASN,
  M_ASNH,
  M_ATN,
  M_ATN2,
  M_ATNH,
  M_CMP,
  M_COS,
  M_COSH,
  M_DIV,
  M_EXP,
  M_FRAC,
  M_IDIV,
  M_LN,
  M_LOG,
  M_MOD,
  M_MUL,
  M_NEG,
  M_PARSE,
  M_PI,
  M_POW,
  M_RND,
  M_RNDTO,
  M_SIN,
  M_SINH,
  M_SQR,
  M_SUB,
  M_TAN,
  M_TANH,
  M_TOINT,
  MATH_ANGLE,
  MATH_ARG,
  MATH_RESULT,
  math,
  pop,
  push,
  pushInt,
  top,
  VALUE_SIZE,
  varAt,
} from './numbers.e16'
import { EST_X, EST_X2, EST_Y, statEstimate, statValue } from './stats.e16'
import {
  isConstant,
  isDigit,
  isFunction,
  isStatValue,
  isVariable,
  statIndex,
  T_ABS,
  T_ACOS,
  T_ACOSH,
  T_ANS,
  T_ASIN,
  T_ASINH,
  T_ATAN,
  T_ATANH,
  T_BANG,
  T_CBRT,
  T_CLOSE,
  T_COIN,
  T_COMMA,
  T_COS,
  T_COSH,
  T_CUBE,
  T_DEG,
  T_DERIV,
  T_DICE,
  T_DIVIDE,
  T_E,
  T_END,
  T_EQUAL,
  T_EXP,
  T_FRAC,
  T_GCD,
  T_GE,
  T_INT,
  T_INTEG,
  T_INVERSE,
  T_LE,
  T_LESS,
  T_LN,
  T_LOG,
  T_MDIV,
  T_MIN,
  T_MINUS,
  T_MOD,
  T_MIXED,
  T_MORE,
  T_MSEP,
  T_NCR,
  T_NE,
  T_NEG,
  T_NPR,
  T_OPEN,
  T_PERCENT,
  T_PI,
  T_PROD,
  T_PLUS,
  T_POINT,
  T_POL,
  T_POW,
  T_POWT,
  T_RAN,
  T_REC,
  T_RINT,
  T_RND,
  T_ROOT,
  T_SEC,
  T_SEP,
  T_SIGMA,
  T_SIN,
  T_SINH,
  T_SLASH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TANH,
  T_TEN,
  T_TIMES,
  T_X2EST,
  T_XEST,
  T_XROOT,
  T_XSEP,
  T_YEST,
  takesTwo,
} from './tokens.e16'

/** The line being read, its length, and where the reading is. */
let lineAt: u16 = 0
let lineLength: u16 = 0
let pos: u16 = 0
/** Where the reading was just after the last % (0xffff: none yet), for a + b% and a - b%. */
let percentEnd: u16 = 0xffff

/** A number's characters, as the maths unit's PARSE reads them. */
const numberText = bytes(32)

/** The token where the reading is; 0 past the line's end. */
function tok(): u16 {
  return pos < lineLength ? peek(lineAt + pos) : 0
}

/** The line's token `i`, for calculus.e16.ts; 0 past the line's end. */
export function evalToken(i: u16): u16 {
  return i < lineLength ? peek(lineAt + i) : 0
}

/** A sum read from `from` onto the stack, for calculus.e16.ts: where the reading stopped. */
export function evalSum(from: u16): u16 {
  pos = from
  sum()
  return pos
}

/**
 * The line at `at`, `length` tokens, evaluated: its value on top of the stack. SYNTAX where it
 * cannot be read, MATH where a value is out of a function's range.
 */
export function evaluate(at: u16, length: u16): void {
  lineAt = at
  lineLength = length
  pos = 0
  percentEnd = 0xffff
  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  integralReset()
  if (length === 0) fail(E_SYNTAX, 0)
  compared()
  if (pos < lineLength) fail(E_SYNTAX, pos)
}

/** Whether a token compares two values (a program's =, ≠, <, >, ≤ and ≥). */
function isComparison(t: u16): bool {
  return t === T_EQUAL || t === T_LESS || t === T_MORE || (t >= T_NE && t <= T_GE)
}

/** A sum, or two compared: 1 when the comparison holds, else 0. */
function compared(): void {
  sum()
  const t = tok()
  if (!isComparison(t)) return
  const at = pos
  pos++
  sum()
  const b = top()
  math(M_CMP, b - VALUE_SIZE, b, at)
  const c = i16(peek16(MATH_RESULT))
  let holds = false
  if (t === T_EQUAL) holds = c === 0
  else if (t === T_NE) holds = c !== 0
  else if (t === T_LESS) holds = c < 0
  else if (t === T_MORE) holds = c > 0
  else if (t === T_LE) holds = c <= 0
  else holds = c >= 0
  pop()
  pop()
  pushInt(holds ? 1 : 0, at)
}

function sum(): void {
  prod()
  for (;;) {
    const t = tok()
    if (t !== T_PLUS && t !== T_MINUS) return
    const at = pos
    pos++
    prod()
    if (percentEnd === pos) ofLeft(at)
    binary(t === T_PLUS ? M_ADD : M_SUB, at)
  }
}

/**
 * a + b% and a - b%: a term that ends in % is that share of what it is added to or taken from,
 * so 500+25% is 625 and 500-25% is 375 (x and / need nothing: 200x5% is 10, 50/25% is 200).
 * The share (b / 100, on top) is multiplied by a, under it.
 */
function ofLeft(at: u16): void {
  copyValue(top() - VALUE_SIZE, push(at))
  binary(M_MUL, at)
}

function prod(): void {
  implied()
  for (;;) {
    const t = tok()
    if (t !== T_TIMES && t !== T_DIVIDE && t !== T_MOD) return
    const at = pos
    pos++
    implied()
    if (t === T_MOD) remainder(at)
    else binary(t === T_TIMES ? M_MUL : M_DIV, at)
  }
}

/**
 * a mod b, the two values on top: as calculators' remainders are, a whole number from 0 by a
 * whole number from 1 alone, MATH for anything else (section 15.2). The unit's MOD is exact.
 */
function remainder(at: u16): void {
  const b = top()
  const a = b - VALUE_SIZE
  if (!isWhole(a, at) || !isWhole(b, at) || isNegative(a) || isNegative(b) || isZero(b))
    fail(E_MATH, at)
  math(M_MOD, a, b, at)
  exactWhole(a)
  pop()
}

/** Whether a value starts at the token: what a multiplication with no sign multiplies by. */
function startsValue(t: u16): bool {
  return (
    isDigit(t) ||
    t === T_POINT ||
    t === T_EXP ||
    t === T_OPEN ||
    t === T_PI ||
    t === T_E ||
    t === T_ANS ||
    t === T_TEN ||
    t === T_FRAC ||
    t === T_ROOT ||
    t === T_MIXED ||
    t === T_XROOT ||
    t === T_RAN ||
    isStatValue(t) ||
    t === T_DICE ||
    t === T_COIN ||
    t === T_RINT ||
    isConstant(t) ||
    isFunction(t) ||
    isVariable(t)
  )
}

function implied(): void {
  comb()
  while (startsValue(tok())) {
    const at = pos
    comb()
    binary(M_MUL, at)
  }
}

function comb(): void {
  slash()
  for (;;) {
    const t = tok()
    if (t !== T_NCR && t !== T_NPR) return
    const at = pos
    pos++
    slash()
    choose(t === T_NCR, at)
  }
}

/** LINE's fraction: a / b, stronger than nCr, weaker than the sign. */
function slash(): void {
  unary()
  while (tok() === T_SLASH) {
    const at = pos
    pos++
    unary()
    binary(M_DIV, at)
  }
}

function unary(): void {
  const t = tok()
  if (t === T_NEG || t === T_MINUS) {
    const at = pos
    pos++
    unary()
    math(M_NEG, top(), 0, at)
    exactNeg(top())
    return
  }
  if (t === T_PLUS) {
    pos++
    unary()
    return
  }
  post()
}

function post(): void {
  primary()
  for (;;) {
    const t = tok()
    const at = pos
    if (t === T_POW || t === T_POWT) {
      powers()
    } else if (t === T_SQUARE) {
      pos++
      raise(2, at)
    } else if (t === T_CUBE) {
      pos++
      raise(3, at)
    } else if (t === T_INVERSE) {
      pos++
      inverse(at)
    } else if (t === T_BANG) {
      pos++
      factorial(at)
    } else if (t === T_PERCENT) {
      pos++
      pushInt(100, at)
      binary(M_DIV, at)
      percentEnd = pos
    } else return
  }
}

/** A run of powers on the value on top, read from the right: 2^3^2 is 2^9. */
function powers(): void {
  const at = pos
  const template = tok() === T_POWT
  pos++
  sum()
  if (template) expect(T_END)
  else if (tok() === T_CLOSE) pos++
  // The powers after this one belong to its exponent.
  if (tok() === T_POW || tok() === T_POWT) powers()
  binary(M_POW, at)
}

/** The token a template's part must end with; SYNTAX where it does not. */
function expect(t: u16): void {
  if (tok() !== t) fail(E_SYNTAX, pos)
  pos++
}

function raise(n: u16, at: u16): void {
  pushInt(n, at)
  binary(M_POW, at)
}

/** 1 / the value on top. */
function inverse(at: u16): void {
  const x = top()
  const one = pushInt(1, at)
  copyValue(x, push(at))
  binary(M_DIV, at)
  copyValue(one, x)
  pop()
}

/** n! for a whole n from 0 to 69 (70! is past the unit's 99 of exponent). */
function factorial(at: u16): void {
  const x = top()
  const n = smallWhole(x, at)
  if (n > 69) fail(E_MATH, at)
  const f = pushInt(1, at)
  for (let k: u16 = 2; k <= n; k++) {
    pushInt(k, at)
    binary(M_MUL, at)
  }
  copyValue(f, x)
  pop()
}

/** nCr (`c`) or nPr of the two values on top: whole, 0 <= r <= n. */
function choose(c: bool, at: u16): void {
  const r = top()
  const n = r - VALUE_SIZE
  const nv = smallWhole(n, at)
  const rv = smallWhole(r, at)
  if (rv > nv) fail(E_MATH, at)
  const out = pushInt(1, at)
  for (let k: u16 = 0; k < rv; k++) {
    pushInt(nv - k, at)
    binary(M_MUL, at)
    if (c) {
      pushInt(k + 1, at)
      binary(M_DIV, at)
    }
  }
  copyValue(out, n)
  pop()
  pop()
}

function primary(): void {
  const t = tok()
  const at = pos
  if (isDigit(t) || t === T_POINT || t === T_EXP) {
    number()
    return
  }
  if (t === 0) fail(E_SYNTAX, at)
  pos++
  if (!constant(t, at)) bracketed(t, at)
}

/** π, e, the 10 of 10ˣ, Ans or a variable, pushed: false for none of them. */
function constant(t: u16, at: u16): bool {
  if (t === T_PI) {
    math(M_PI, push(at), 0, at)
  } else if (t === T_E) {
    const n = pushInt(1, at)
    math(M_EXP, n, 0, at)
    inexact(n)
  } else if (t === T_TEN) {
    pushInt(10, at)
  } else if (t === T_ANS) {
    copyValue(KEEP_ANS, push(at))
  } else if (isVariable(t)) {
    copyValue(varAt(t), push(at))
  } else if (t === T_RAN) {
    math(M_RND, push(at), 0, at)
  } else if (isStatValue(t)) {
    statValue(statIndex(t), push(at))
  } else if (t === T_DICE || t === T_COIN || t === T_RINT) {
    randomWhole(t, at)
  } else if (isConstant(t)) {
    constValue(t, push(at))
  } else return false
  return true
}

/** A template, a bracket or a function and what is in it. */
function bracketed(t: u16, at: u16): void {
  if (template(t, at)) return
  if (t === T_OPEN) {
    sum()
    if (tok() === T_CLOSE) pos++
  } else if (t === T_DERIV || t === T_INTEG || t === T_SIGMA || t === T_PROD) {
    pos = calculus(t, pos, at)
  } else if (isFunction(t)) {
    sum()
    if (takesTwo(t)) {
      expect(T_COMMA)
      sum()
    }
    if (tok() === T_CLOSE) pos++
    if (takesTwo(t)) applyTwo(t, at)
    else apply(t, at)
  } else fail(E_SYNTAX, at)
}

/** A whole random number: dice 1-6, coin 0 or 1, rint 0-99 (rand x 6 + 1, x 2, x 100, cut). */
function randomWhole(t: u16, at: u16): void {
  const v = push(at)
  math(M_RND, v, 0, at)
  const k = pushInt(t === T_DICE ? 6 : t === T_COIN ? 2 : 100, at)
  math(M_MUL, v, k, at)
  pop()
  const one = pushInt(1, at)
  math(M_IDIV, v, one, at)
  if (t === T_DICE) math(M_ADD, v, one, at)
  pop()
  exactWhole(v)
}

/** A template's parts and its value: false for a token that opens none. */
function template(t: u16, at: u16): bool {
  if (t === T_MIXED) {
    mixed(at)
    return true
  }
  if (t === T_XROOT) {
    sum()
    expect(T_XSEP)
    sum()
    expect(T_END)
    anyRoot(at)
    return true
  }
  if (t === T_FRAC) {
    sum()
    expect(T_SEP)
    sum()
    expect(T_END)
    binary(M_DIV, at)
  } else if (t === T_ROOT) {
    sum()
    expect(T_END)
    math(M_SQR, top(), 0, at)
    exactSqrt(top())
  } else return false
  return true
}

/** a b/c: the whole part, then the fraction, added away from 0 (-1 2/3 is -(1 + 2/3)). */
function mixed(at: u16): void {
  sum()
  expect(T_MSEP)
  sum()
  expect(T_MDIV)
  sum()
  expect(T_END)
  binary(M_DIV, at)
  binary(isNegative(top() - VALUE_SIZE) ? M_SUB : M_ADD, at)
}

/**
 * The index'th root of the value on top (the index under it): of a negative value only for an
 * odd whole index, the root of its size made negative. Index 2 keeps √'s exact form.
 */
function anyRoot(at: u16): void {
  const x = top()
  const n = x - VALUE_SIZE
  const negative = isNegative(x)
  if (negative) {
    if ((smallWhole(n, at) & 1) === 0) fail(E_MATH, at)
    math(M_NEG, x, 0, at)
  }
  const two = pushInt(2, at)
  math(M_CMP, n, two, at)
  pop()
  if (peek16(MATH_RESULT) === 0) {
    math(M_SQR, x, 0, at)
    exactSqrt(x)
  } else {
    const power = pushInt(1, at)
    copyValue(n, push(at))
    binary(M_DIV, at)
    math(M_POW, x, power, at)
    pop()
    exactWhole(x)
  }
  if (negative) {
    math(M_NEG, x, 0, at)
    exactNeg(x)
  }
  copyValue(x, n)
  pop()
}

/** A number as typed (readNumber), its exact form beside it, then any minutes and seconds. */
function number(): void {
  const at = pos
  const v = push(at)
  pos = readNumber(lineAt, lineLength, pos, v)
  exactLiteral(v)
  if (tok() === T_DEG) minutes(at)
}

/** The token `i` of the number being read; 0 past its line's end. */
let readFrom: u16 = 0
let readLength: u16 = 0

function readToken(i: u16): u16 {
  return i < readLength ? peek(readFrom + i) : 0
}

/**
 * The number typed from token `from` of the `length` tokens at `line` - digits with one point,
 * then ᴇ and a signed exponent, ᴇ alone meaning 1ᴇ - read by the maths unit's PARSE into the
 * 8 bytes at `dst`: where the reading goes on. SYNTAX where it is no number. CPLX and MATRIX
 * read their numbers here too.
 */
export function readNumber(line: u16, length: u16, from: u16, dst: u16): u16 {
  readFrom = line
  readLength = length
  let i = from
  let n: u16 = 0
  let points: u16 = 0
  while (isDigit(readToken(i)) || readToken(i) === T_POINT) {
    if (readToken(i) === T_POINT) points++
    // Longer than PARSE's room: SYNTAX, never a number cut short.
    if (n >= 30) fail(E_SYNTAX, from)
    numberText[n] = readToken(i)
    n++
    i++
  }
  if (points > 1 || (points === 1 && i - from === 1)) fail(E_SYNTAX, from)
  if (readToken(i) === T_EXP) {
    i = exponentPart(i + 1, n)
    n = exponentEnd
  }
  poke16(MATH_ARG, n)
  math(M_PARSE, dst, addr(numberText), from)
  return i
}

/** How many characters exponentPart left in numberText. */
let exponentEnd: u16 = 0

/** After 12°: minutes (30′) and seconds (15″) added, each its own number, in sixtieths. */
function minutes(at: u16): void {
  pos++
  if (startsNumber(tok())) sixtieth(T_MIN, 60, at)
  if (startsNumber(tok())) sixtieth(T_SEC, 3600, at)
}

/** A number ended by `mark`, divided by `parts` and added to the value under it. */
function sixtieth(mark: u16, parts: u16, at: u16): void {
  number()
  expect(mark)
  pushInt(parts, at)
  binary(M_DIV, at)
  binary(M_ADD, at)
}

function startsNumber(t: u16): bool {
  return isDigit(t) || t === T_POINT
}

/**
 * After ᴇ (token `i` on): E, a sign and the digits written after the `n` characters of the
 * number so far; with none before it the number is 1. Where the reading goes on.
 */
function exponentPart(i: u16, n: u16): u16 {
  let k = n
  let j = i
  if (k === 0) {
    numberText[0] = 0x31
    k = 1
  }
  numberText[k] = 0x45
  k++
  if (readToken(j) === T_NEG || readToken(j) === T_MINUS) {
    numberText[k] = 0x2d
    k++
    j++
  }
  if (!isDigit(readToken(j))) fail(E_SYNTAX, j)
  while (isDigit(readToken(j))) {
    if (k >= 31) fail(E_SYNTAX, i)
    numberText[k] = readToken(j)
    k++
    j++
  }
  exponentEnd = k
  return j
}

/** The argument of a trig function, kept for its special angles. */
const argument = bytes(36)

/** A function of the value on top; its exact form where it has one. */
function apply(f: u16, at: u16): void {
  const x = top()
  copyValue(x, addr(argument))
  if (f === T_SIN) trig(M_SIN, TRIG_SIN, x, at)
  else if (f === T_COS) trig(M_COS, TRIG_COS, x, at)
  else if (f === T_TAN) trig(M_TAN, TRIG_TAN, x, at)
  else if (f === T_SQRT) {
    math(M_SQR, x, 0, at)
    exactSqrt(x)
  } else {
    other(f, x, at)
    // abs( and round( have set their own form (abs( keeps the one it had).
    if (f !== T_ABS && f !== T_RND) exactWhole(x)
  }
}

/** A function whose answer has no form but a whole number. */
function other(f: u16, x: u16, at: u16): void {
  if (f >= T_SINH) {
    named(f, x, at)
    return
  }
  if (f === T_ASIN) math(M_ASN, x, 0, at)
  else if (f === T_ACOS) math(M_ACS, x, 0, at)
  else if (f === T_ATAN) math(M_ATN, x, 0, at)
  else if (f === T_LOG) math(M_LOG, x, 0, at)
  else if (f === T_LN) math(M_LN, x, 0, at)
  else if (f === T_CBRT) cubeRoot(x, at)
}

/** The functions from 0xE0 that take one argument (S5). */
function named(f: u16, x: u16, at: u16): void {
  if (f === T_XEST || f === T_YEST || f === T_X2EST) {
    // On the curve STATS fits (stats.e16.ts): y'(x), x'(y), the quadratic's x2'(y).
    statEstimate(f === T_YEST ? EST_Y : f === T_XEST ? EST_X : EST_X2, x)
    return
  }
  if (f === T_SINH) math(M_SINH, x, 0, at)
  else if (f === T_COSH) math(M_COSH, x, 0, at)
  else if (f === T_TANH) math(M_TANH, x, 0, at)
  else if (f === T_ASINH) math(M_ASNH, x, 0, at)
  else if (f === T_ACOSH) math(M_ACSH, x, 0, at)
  else if (f === T_ATANH) math(M_ATNH, x, 0, at)
  else wholeOrRounded(f, x, at)
}

/** int( (towards 0), round( (as the display rounds) and abs( - which keeps an exact form. */
function wholeOrRounded(f: u16, x: u16, at: u16): void {
  if (f === T_INT) {
    const one = pushInt(1, at)
    math(M_IDIV, x, one, at)
    pop()
  } else if (f === T_RND) {
    poke16(MATH_ARG, shownDigits())
    math(M_RNDTO, x, 0, at)
    exactLiteral(x)
  } else if (f === T_ABS && isNegative(x)) {
    math(M_NEG, x, 0, at)
    exactNeg(x)
  }
}

/* ---------------- the functions of two arguments ---------------- */

/** gcd, lcm, Pol and Rec of the two values on top (the first under the second). */
function applyTwo(f: u16, at: u16): void {
  const b = top()
  const a = b - VALUE_SIZE
  if (f === T_POL) polar(a, b, at)
  else if (f === T_REC) rectangular(a, b, at)
  else {
    whole(a, at)
    whole(b, at)
    if (f === T_GCD) gcdInto(a, b, at)
    else lcm(a, b, at)
    exactWhole(a)
  }
  pop()
}

/** MATH unless the value is a whole number. */
function whole(v: u16, at: u16): void {
  const t = push(at)
  copyValue(v, t)
  math(M_FRAC, t, 0, at)
  if (!isZero(t)) fail(E_MATH, at)
  pop()
  if (isNegative(v)) math(M_NEG, v, 0, at)
}

/** The greatest common divisor of whole a and b into a (Euclid, on the unit's exact MOD). */
function gcdInto(a: u16, b: u16, at: u16): void {
  const t = push(at)
  while (!isZero(b)) {
    copyValue(a, t)
    math(M_MOD, t, b, at)
    copyValue(b, a)
    copyValue(t, b)
  }
  pop()
}

/** The least common multiple: a x b / gcd; 0 when either is 0. */
function lcm(a: u16, b: u16, at: u16): void {
  const product = push(at)
  copyValue(a, product)
  math(M_MUL, product, b, at)
  if (isZero(product)) {
    copyValue(product, a)
    pop()
    return
  }
  gcdInto(a, b, at)
  math(M_DIV, product, a, at)
  copyValue(product, a)
  pop()
}

/** pol(x, y): r into a and X, θ (in the angle's unit) into Y. */
function polar(a: u16, b: u16, at: u16): void {
  const r = push(at)
  copyValue(a, r)
  math(M_MUL, r, a, at)
  const y2 = push(at)
  copyValue(b, y2)
  math(M_MUL, y2, b, at)
  math(M_ADD, r, y2, at)
  pop()
  math(M_SQR, r, 0, at)
  // θ = the angle of (x, y): ATN2 takes y in A and x in B.
  math(M_ATN2, b, a, at)
  copyValue(r, a)
  pop()
  pair(a, b)
}

/** rec(r, θ): x into a and X, y into Y. */
function rectangular(a: u16, b: u16, at: u16): void {
  const x = push(at)
  copyValue(b, x)
  math(M_COS, x, 0, at)
  math(M_MUL, x, a, at)
  math(M_SIN, b, 0, at)
  math(M_MUL, b, a, at)
  copyValue(x, a)
  pop()
  pair(a, b)
}

/** Pol's and Rec's two answers into X and Y, decimals alone. */
function pair(first: u16, second: u16): void {
  inexact(first)
  inexact(second)
  copyValue(first, varAt(0x58))
  copyValue(second, varAt(0x59))
}

function trig(op: u16, which: u16, x: u16, at: u16): void {
  math(op, x, 0, at)
  exactTrig(which, x, addr(argument))
}

/** The cube root, of a negative number too: -(|x|^(1/3)); 0 is 0. */
function cubeRoot(x: u16, at: u16): void {
  if (isZero(x)) return
  const negative = isNegative(x)
  if (negative) math(M_NEG, x, 0, at)
  const third = pushInt(1, at)
  pushInt(3, at)
  binary(M_DIV, at)
  math(M_POW, x, third, at)
  pop()
  if (negative) math(M_NEG, x, 0, at)
}

/* ---------------- helpers the evaluation alone uses (once in the fixed ROM) ---------------- */

/**
 * RNDTO's ARG for a number as the display shows it: FIX n is n places (-n), EXP n is n
 * significant digits (EXP 0 is ten), AUTO ten significant digits.
 */
function shownDigits(): u16 {
  const n = peek(KEEP_DIGITS)
  const format = peek(KEEP_FORMAT)
  if (format === FORMAT_FIX) return u16(-i16(n))
  if (format === FORMAT_EXP && n > 0) return n
  return 10
}

/** The two top values made one by `op`: the decimal by the unit, the exact form alongside. */
export function binary(op: u16, at: u16): void {
  const b = top()
  pop()
  const a = top()
  math(op, a, b, at)
  exactBinary(op, a, b)
}

/** Whether the number at `n` is whole. */
function isWhole(n: u16, at: u16): bool {
  const t = push(at)
  copy8(n, t)
  math(M_FRAC, t, 0, at)
  const whole = isZero(t)
  pop()
  return whole
}

/** The number at `n` as a small whole number (0-999 is all a factorial or nCr takes); MATH past that. */
function smallWhole(n: u16, at: u16): u16 {
  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  const t = push(at)
  copy8(n, t)
  math(M_TOINT, t, 0, at)
  pop()
  const v = peek16(MATH_ARG)
  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  return v
}
