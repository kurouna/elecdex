// ELEC-16 SCI, ROM bank 0: the line evaluated (docs/elec16-sci.md section 6.3). A recursive
// descent over the tokens, each value a decimal number on the stack (numbers.e16.ts). From the
// strongest: brackets, functions and values; the powers and the other postfixes (a run of
// powers read from the right); the sign; nCr and nPr; a multiplication with no sign (stronger
// than x and /, as a textbook is read); x and /; + and -. A function or a bracket left open is
// closed by the line's end.
import {
  addr,
  type bool,
  bytes,
  peek,
  poke,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'
import {
  binary,
  copy8,
  E_MATH,
  E_SYNTAX,
  fail,
  isNegative,
  isZero,
  KEEP_ANGLE,
  KEEP_ANS,
  M_ACS,
  M_ADD,
  M_ASN,
  M_ATN,
  M_COS,
  M_DIV,
  M_EXP,
  M_LN,
  M_LOG,
  M_MUL,
  M_NEG,
  M_PARSE,
  M_PI,
  M_POW,
  M_SIN,
  M_SQR,
  M_SUB,
  M_TAN,
  MATH_ANGLE,
  MATH_ARG,
  math,
  pop,
  push,
  pushInt,
  smallWhole,
  top,
  varAt,
} from './numbers.e16'
import {
  isDigit,
  isFunction,
  isVariable,
  T_ACOS,
  T_ANS,
  T_ASIN,
  T_ATAN,
  T_BANG,
  T_CBRT,
  T_CLOSE,
  T_COS,
  T_CUBE,
  T_DIVIDE,
  T_E,
  T_EXP,
  T_INVERSE,
  T_LN,
  T_LOG,
  T_MINUS,
  T_NCR,
  T_NEG,
  T_NPR,
  T_OPEN,
  T_PI,
  T_PLUS,
  T_POINT,
  T_POW,
  T_SIN,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TEN,
  T_TIMES,
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
  unary()
  for (;;) {
    const t = tok()
    if (t !== T_NCR && t !== T_NPR) return
    const at = pos
    pos++
    unary()
    choose(t === T_NCR, at)
  }
}

function unary(): void {
  const t = tok()
  if (t === T_NEG || t === T_MINUS) {
    const at = pos
    pos++
    unary()
    math(M_NEG, top(), 0, at)
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
    if (t === T_POW) {
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
    } else return
  }
}

/** A run of powers on the value on top, read from the right: 2^3^2 is 2^9. */
function powers(): void {
  const at = pos
  pos++
  sum()
  if (tok() === T_CLOSE) pos++
  // The powers after this one belong to its exponent.
  if (tok() === T_POW) powers()
  binary(M_POW, at)
}

function raise(n: u16, at: u16): void {
  pushInt(n, at)
  binary(M_POW, at)
}

/** 1 / the value on top. */
function inverse(at: u16): void {
  const x = top()
  const one = pushInt(1, at)
  math(M_DIV, one, x, at)
  copy8(one, x)
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
  copy8(f, x)
  pop()
}

/** nCr (`c`) or nPr of the two values on top: whole, 0 <= r <= n. */
function choose(c: bool, at: u16): void {
  const r = top()
  const n = r - 8
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
  copy8(out, n)
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
  if (t === T_PI) {
    math(M_PI, push(at), 0, at)
  } else if (t === T_E) {
    const n = pushInt(1, at)
    math(M_EXP, n, 0, at)
  } else if (t === T_TEN) {
    pushInt(10, at)
  } else if (t === T_ANS) {
    copy8(KEEP_ANS, push(at))
  } else if (isVariable(t)) {
    copy8(varAt(t), push(at))
  } else if (t === T_OPEN) {
    sum()
    if (tok() === T_CLOSE) pos++
  } else if (isFunction(t)) {
    sum()
    if (tok() === T_CLOSE) pos++
    apply(t, at)
  } else fail(E_SYNTAX, at)
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

/** A function of the value on top. */
function apply(f: u16, at: u16): void {
  const x = top()
  if (f === T_SIN) math(M_SIN, x, 0, at)
  else if (f === T_COS) math(M_COS, x, 0, at)
  else if (f === T_TAN) math(M_TAN, x, 0, at)
  else if (f === T_ASIN) math(M_ASN, x, 0, at)
  else if (f === T_ACOS) math(M_ACS, x, 0, at)
  else if (f === T_ATAN) math(M_ATN, x, 0, at)
  else if (f === T_LOG) math(M_LOG, x, 0, at)
  else if (f === T_LN) math(M_LN, x, 0, at)
  else if (f === T_SQRT) math(M_SQR, x, 0, at)
  else if (f === T_CBRT) cubeRoot(x, at)
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
