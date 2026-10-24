// ELEC-16 SCI, ROM bank 0: the line evaluated (docs/elec16-sci.md section 6.3). A recursive
// descent over the tokens, each value a decimal number on the stack (numbers.e16.ts). From the
// strongest: brackets, functions and values; the powers and the other postfixes (a run of
// powers read from the right); the sign; nCr and nPr; a multiplication with no sign (stronger
// than x and /, as a textbook is read); x and /; + and -. A function or a bracket left open is
// closed by the line's end. S5 adds the hyperbolic functions, Abs, the FUNC menu's functions
// (two of them take two arguments, a comma between), %, degrees-minutes-seconds, a mixed
// number and a root of any index.
import {
  addr,
  type bool,
  bytes,
  peek,
  peek16,
  poke,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'
import {
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
  binary,
  copyValue,
  E_MATH,
  E_SYNTAX,
  fail,
  inexact,
  isNegative,
  isZero,
  KEEP_ANGLE,
  KEEP_ANS,
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
  MATH_ANGLE,
  MATH_ARG,
  MATH_RESULT,
  math,
  pop,
  push,
  pushInt,
  shownDigits,
  smallWhole,
  top,
  VALUE_SIZE,
  varAt,
} from './numbers.e16'
import {
  isDigit,
  isFunction,
  isVariable,
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
  T_COMMA,
  T_COS,
  T_COSH,
  T_CUBE,
  T_DEG,
  T_DIVIDE,
  T_E,
  T_END,
  T_EXP,
  T_FRAC,
  T_GCD,
  T_INT,
  T_INVERSE,
  T_LN,
  T_LOG,
  T_MDIV,
  T_MIN,
  T_MINUS,
  T_MIXED,
  T_MSEP,
  T_NCR,
  T_NEG,
  T_NPR,
  T_OPEN,
  T_PERCENT,
  T_PI,
  T_PLUS,
  T_POINT,
  T_POL,
  T_POW,
  T_POWT,
  T_RAN,
  T_REC,
  T_RND,
  T_ROOT,
  T_SEC,
  T_SEP,
  T_SIN,
  T_SINH,
  T_SLASH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TANH,
  T_TEN,
  T_TIMES,
  T_XROOT,
  T_XSEP,
  takesTwo,
} from './tokens.e16'

/** The line being read, its length, and where the reading is. */
let lineAt: u16 = 0
let lineLength: u16 = 0
let pos: u16 = 0

/** A number's characters, as the maths unit's PARSE reads them. */
const numberText = bytes(32)

/** The token where the reading is; 0 past the line's end. */
function tok(): u16 {
  return pos < lineLength ? peek(lineAt + pos) : 0
}

/**
 * The line at `at`, `length` tokens, evaluated: its value on top of the stack. SYNTAX where it
 * cannot be read, MATH where a value is out of a function's range.
 */
export function evaluate(at: u16, length: u16): void {
  lineAt = at
  lineLength = length
  pos = 0
  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  if (length === 0) fail(E_SYNTAX, 0)
  sum()
  if (pos < lineLength) fail(E_SYNTAX, pos)
}

function sum(): void {
  prod()
  for (;;) {
    const t = tok()
    if (t !== T_PLUS && t !== T_MINUS) return
    const at = pos
    pos++
    prod()
    binary(t === T_PLUS ? M_ADD : M_SUB, at)
  }
}

function prod(): void {
  implied()
  for (;;) {
    const t = tok()
    if (t !== T_TIMES && t !== T_DIVIDE) return
    const at = pos
    pos++
    implied()
    binary(t === T_TIMES ? M_MUL : M_DIV, at)
  }
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
  } else return false
  return true
}

/** A template, a bracket or a function and what is in it. */
function bracketed(t: u16, at: u16): void {
  if (template(t, at)) return
  if (t === T_OPEN) {
    sum()
    if (tok() === T_CLOSE) pos++
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

/**
 * A number as typed: digits with one point, and ᴇ with a signed exponent after it. ᴇ with
 * nothing before it means 1ᴇ. Read by the maths unit's PARSE.
 */
function number(): void {
  const at = pos
  let n: u16 = 0
  let points: u16 = 0
  let digits: u16 = 0
  while (isDigit(tok()) || tok() === T_POINT) {
    if (tok() === T_POINT) points++
    else digits++
    if (n < 30) {
      poke(addr(numberText) + n, tok())
      n++
    }
    pos++
  }
  if (points > 1 || (points === 1 && digits === 0)) fail(E_SYNTAX, at)
  if (tok() === T_EXP) n = exponentPart(digits === 0 ? 0 : n)
  poke(addr(numberText) + n, 0)
  const v = push(at)
  poke16(MATH_ARG, n)
  math(M_PARSE, v, addr(numberText), at)
  exactLiteral(v)
  if (tok() === T_DEG) minutes(at)
}

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
 * ᴇ and its exponent, written after the `n` characters of the number so far as PARSE reads it
 * (E, a sign, digits); with no digits before it (n 0) the number is 1. The characters there now.
 */
function exponentPart(n: u16): u16 {
  let k = n
  if (k === 0) {
    poke(addr(numberText), 0x31)
    k = 1
  }
  pos++
  poke(addr(numberText) + k, 0x45)
  k++
  if (tok() === T_NEG || tok() === T_MINUS) {
    poke(addr(numberText) + k, 0x2d)
    k++
    pos++
  }
  if (!isDigit(tok())) fail(E_SYNTAX, pos)
  while (isDigit(tok())) {
    if (k < 31) {
      poke(addr(numberText) + k, tok())
      k++
    }
    pos++
  }
  return k
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
    exactWhole(x)
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
