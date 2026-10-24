// ELEC-16 SCI, ROM bank 6: CPLX, complex numbers (docs/elec16-sci.md section 14.6). The line is
// the calculator's own in LINE, i typed by HYP and ∠ by SHIFT HYP, evaluated here by a descent
// of its own in the order of section 6.3, each number a real and an imaginary part of the maths
// unit's decimals (no exact forms). Its Ans is its own (CPLX_ANS): CALC's is left as it was.

import {
  addr,
  type bool,
  bytes,
  i16,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { K_AC, refuse } from './calc.e16'
import { constValue } from './consts.e16'
import { drawBig, textOf } from './display.e16'
import { readNumber } from './eval.e16'
import { digitOf } from './keymap.e16'
import { bandWith, lineY, textAt, textRight } from './lcd.e16'
import {
  CPLX_ANS,
  CPLX_STACK,
  copy8,
  copyValue,
  E_MATH,
  E_STACK,
  E_SYNTAX,
  fail,
  isNegative,
  isZero,
  KEEP_ANGLE,
  KEEP_ANS,
  M_ABS,
  M_ACS,
  M_ADD,
  M_ASN,
  M_ATN,
  M_ATN2,
  M_CMP,
  M_COS,
  M_DIV,
  M_EXP,
  M_FRAC,
  M_LN,
  M_LOG,
  M_MUL,
  M_NEG,
  M_PARSE,
  M_PI,
  M_SIN,
  M_SQR,
  M_SUB,
  M_TAN,
  M_TOINT,
  MATH_ANGLE,
  MATH_ARG,
  MATH_RESULT,
  math,
  push,
  varAt,
  wholeInto,
} from './numbers.e16'
import {
  isConstant,
  isDigit,
  isVariable,
  T_ABS,
  T_ACOS,
  T_ANS,
  T_ARG,
  T_ASIN,
  T_ATAN,
  T_CLOSE,
  T_CONJ,
  T_COS,
  T_CUBE,
  T_DIVIDE,
  T_E,
  T_EXP,
  T_I,
  T_IM,
  T_INVERSE,
  T_LN,
  T_LOG,
  T_MINUS,
  T_NEG,
  T_OPEN,
  T_PI,
  T_PLUS,
  T_POINT,
  T_POLAR,
  T_POW,
  T_RE,
  T_SIN,
  T_SLASH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TEN,
  T_TIMES,
} from './tokens.e16'

/** A complex number: its real part, then its imaginary part, 8 bytes each. */
const C_SIZE = 16
const C_DEPTH = 24
const IM = 8

/** The line being read, and where. */
let cFrom: u16 = 0
let cLength: u16 = 0
let cPos: u16 = 0
let cDepth: u16 = 0

/** Numbers worked on, past the stack in its room: never one on the stack. */
const ct1 = CPLX_STACK + C_DEPTH * C_SIZE
const ct2 = ct1 + 8
const ct3 = ct1 + 16
const ct4 = ct1 + 24
const cText = bytes(32)

/** The answer shown as r∠θ (F⇄D) rather than a + bi. */
let polarShown: bool = false

function ctok(): u16 {
  return cPos < cLength ? peek(cFrom + cPos) : 0
}

function cpush(at: u16): u16 {
  if (cDepth >= C_DEPTH) fail(E_STACK, at)
  const z = CPLX_STACK + cDepth * C_SIZE
  cDepth++
  wholeInto(z, 0)
  wholeInto(z + IM, 0)
  return z
}

function ctop(): u16 {
  return CPLX_STACK + (cDepth - 1) * C_SIZE
}

function cpop(): void {
  cDepth--
}

/* ---------------- the evaluation ---------------- */

/**
 * The line at `from`, `length` tokens, worked out into CPLX's Ans. Calculator's Ans goes onto the
 * value stack as it was, so = keeps it.
 */
export function cplxEvaluate(from: u16, length: u16): void {
  cFrom = from
  cLength = length
  cPos = 0
  cDepth = 0
  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  if (length === 0) fail(E_SYNTAX, 0)
  csum()
  if (cPos < cLength) fail(E_SYNTAX, cPos)
  const z = ctop()
  tidy(z, z + IM)
  tidy(z + IM, z)
  copy8(z, CPLX_ANS)
  copy8(z + IM, CPLX_ANS + IM)
  polarShown = false
  copyValue(KEEP_ANS, push(0))
}

/** A part 10⁻¹¹ of the other's size or less is made 0 (e^(iπ) is -1). */
function tidy(part: u16, other: u16): void {
  if (isZero(part)) return
  // |other| x 10⁻¹¹, which underflows to 0 rather than overflow (1ᴇ90 x 10¹¹ did).
  copy8(other, ct1)
  math(M_ABS, ct1, 0, 0)
  poke16(MATH_ARG, 6)
  math(M_PARSE, ct2, elevenText(), 0)
  math(M_MUL, ct1, ct2, 0)
  copy8(part, ct2)
  math(M_ABS, ct2, 0, 0)
  math(M_CMP, ct2, ct1, 0)
  if (i16(peek16(MATH_RESULT)) <= 0) wholeInto(part, 0)
}

const eleven = bytes(6)

/** 1E-11 as PARSE reads it, in RAM. */
function elevenText(): u16 {
  eleven[0] = 0x31
  eleven[1] = 0x45
  eleven[2] = 0x2d
  eleven[3] = 0x31
  eleven[4] = 0x31
  eleven[5] = 0
  return addr(eleven)
}

function csum(): void {
  cprod()
  for (;;) {
    const t = ctok()
    if (t !== T_PLUS && t !== T_MINUS) return
    const at = cPos
    cPos++
    cprod()
    cbinary(t === T_PLUS ? M_ADD : M_SUB, at)
  }
}

function cprod(): void {
  cimplied()
  for (;;) {
    const t = ctok()
    if (t !== T_TIMES && t !== T_DIVIDE) return
    const at = cPos
    cPos++
    cimplied()
    cbinary(t === T_TIMES ? M_MUL : M_DIV, at)
  }
}

/** Whether a value starts at the token: what a multiplication with no sign multiplies by. */
function cstarts(t: u16): bool {
  return (
    isDigit(t) ||
    t === T_POINT ||
    t === T_EXP ||
    t === T_OPEN ||
    t === T_I ||
    t === T_PI ||
    t === T_E ||
    t === T_ANS ||
    t === T_TEN ||
    t === T_SQRT ||
    isVariable(t) ||
    isConstant(t) ||
    cfunction(t)
  )
}

function cimplied(): void {
  cangled()
  while (cstarts(ctok())) {
    const at = cPos
    cangled()
    cbinary(M_MUL, at)
  }
}

/** r∠θ: weaker than the sign, stronger than a multiplication. */
function cangled(): void {
  cslash()
  if (ctok() !== T_POLAR) return
  const at = cPos
  cPos++
  cslash()
  const t = ctop()
  const r = t - C_SIZE
  if (!isZero(r + IM) || !isZero(t + IM)) fail(E_MATH, at)
  // r cos θ + i r sin θ, θ in SETUP's unit.
  copy8(t, ct1)
  math(M_COS, ct1, 0, at)
  math(M_SIN, t, 0, at)
  math(M_MUL, t, r, at)
  math(M_MUL, ct1, r, at)
  copy8(ct1, r)
  copy8(t, r + IM)
  cpop()
}

/** LINE's fraction a / b. */
function cslash(): void {
  cunary()
  while (ctok() === T_SLASH) {
    const at = cPos
    cPos++
    cunary()
    cbinary(M_DIV, at)
  }
}

function cunary(): void {
  const t = ctok()
  if (t === T_NEG || t === T_MINUS) {
    const at = cPos
    cPos++
    cunary()
    math(M_NEG, ctop(), 0, at)
    math(M_NEG, ctop() + IM, 0, at)
    return
  }
  if (t === T_PLUS) {
    cPos++
    cunary()
    return
  }
  cpost()
}

function cpost(): void {
  cprimary()
  for (;;) {
    const t = ctok()
    const at = cPos
    if (t === T_POW) {
      cPos++
      csum()
      if (ctok() === T_CLOSE) cPos++
      cpower(at)
    } else if (t === T_SQUARE || t === T_CUBE) {
      cPos++
      const n = cpush(at)
      wholeInto(n, t === T_SQUARE ? 2 : 3)
      cpower(at)
    } else if (t === T_INVERSE) {
      cPos++
      const z = ctop()
      const one = cpush(at)
      wholeInto(one, 1)
      cswap(z, one)
      cbinary(M_DIV, at)
    } else return
  }
}

/** The two complex numbers at `a` and `b` swapped. */
function cswap(a: u16, b: u16): void {
  for (let i: u16 = 0; i < C_SIZE; i++) {
    const v = peek(a + i)
    poke(a + i, peek(b + i))
    poke(b + i, v)
  }
}

function cprimary(): void {
  const t = ctok()
  const at = cPos
  if (isDigit(t) || t === T_POINT || t === T_EXP) {
    cnumber()
    return
  }
  if (t === 0) fail(E_SYNTAX, at)
  cPos++
  const z = cpush(at)
  if (t === T_I) wholeInto(z + IM, 1)
  else if (t === T_PI) math(M_PI, z, 0, at)
  else if (t === T_E) {
    wholeInto(z, 1)
    math(M_EXP, z, 0, at)
  } else if (t === T_TEN) wholeInto(z, 10)
  else if (t === T_ANS) {
    copy8(CPLX_ANS, z)
    copy8(CPLX_ANS + IM, z + IM)
  } else if (isVariable(t)) copy8(varAt(t), z)
  else if (isConstant(t)) {
    constValue(t, ct4)
    copy8(ct4, z)
  } else {
    cpop()
    cbracketed(t, at)
  }
}

/** A bracket or a function and what is in it. */
function cbracketed(t: u16, at: u16): void {
  if (t !== T_OPEN && !cfunction(t)) fail(E_SYNTAX, at)
  csum()
  if (ctok() === T_CLOSE) cPos++
  if (t !== T_OPEN) capply(t, at)
}

/** Whether CPLX takes a function: its own five, √, and the real functions. */
function cfunction(t: u16): bool {
  return (t >= T_ARG && t <= T_IM) || t === T_ABS || realOp(t) !== 0
}

/** The maths unit's operation for a real function (of a number with no imaginary part). */
function realOp(t: u16): u16 {
  switch (t) {
    case T_SIN:
      return M_SIN
    case T_COS:
      return M_COS
    case T_TAN:
      return M_TAN
    case T_ASIN:
      return M_ASN
    case T_ACOS:
      return M_ACS
    case T_ATAN:
      return M_ATN
    case T_LOG:
      return M_LOG
    case T_LN:
      return M_LN
  }
  return t === T_SQRT ? M_SQR : 0
}

function capply(t: u16, at: u16): void {
  const z = ctop()
  if (t === T_SQRT) csqrt(z, at)
  else if (t === T_ABS) {
    cabs(z, at)
    wholeInto(z + IM, 0)
  } else if (t === T_ARG) {
    copy8(z + IM, ct1)
    math(M_ATN2, ct1, z, at)
    copy8(ct1, z)
    wholeInto(z + IM, 0)
  } else if (t === T_CONJ) math(M_NEG, z + IM, 0, at)
  else if (t === T_RE) wholeInto(z + IM, 0)
  else if (t === T_IM) {
    copy8(z + IM, z)
    wholeInto(z + IM, 0)
  } else {
    if (!isZero(z + IM)) fail(E_MATH, at)
    math(realOp(t), z, 0, at)
  }
}

/** |z| into z's real part, scaled by its larger part so neither square leaves the range. */
function cabs(z: u16, at: u16): void {
  copy8(z, ct1)
  math(M_ABS, ct1, 0, at)
  copy8(z + IM, ct2)
  math(M_ABS, ct2, 0, at)
  math(M_CMP, ct1, ct2, at)
  if (i16(peek16(MATH_RESULT)) < 0) {
    copy8(ct2, z)
    copy8(ct1, ct2)
    copy8(z, ct1)
  }
  // m = the larger (ct1), k = smaller/m: |z| = m √(1 + k²).
  if (isZero(ct1)) {
    wholeInto(z, 0)
    return
  }
  math(M_DIV, ct2, ct1, at)
  math(M_MUL, ct2, ct2, at)
  wholeInto(z, 1)
  math(M_ADD, ct2, z, at)
  math(M_SQR, ct2, 0, at)
  math(M_MUL, ct2, ct1, at)
  copy8(ct2, z)
}

/** The principal √z: √((|z| + a)/2) + i sign(b) √((|z| - a)/2). */
function csqrt(z: u16, at: u16): void {
  copy8(z, ct3)
  const negative = isNegative(z + IM)
  cabs(z, at)
  copy8(z, ct4)
  wholeInto(ct2, 2)
  // re = √((|z| + a)/2), im = √((|z| - a)/2)
  math(M_ADD, z, ct3, at)
  math(M_DIV, z, ct2, at)
  math(M_SQR, z, 0, at)
  math(M_SUB, ct4, ct3, at)
  math(M_DIV, ct4, ct2, at)
  math(M_SQR, ct4, 0, at)
  copy8(ct4, z + IM)
  if (negative) math(M_NEG, z + IM, 0, at)
}

/* ---------------- arithmetic ---------------- */

/** The two numbers on top made one by + - x or /. */
function cbinary(op: u16, at: u16): void {
  const b = ctop()
  const a = b - C_SIZE
  if (op === M_ADD || op === M_SUB) {
    math(op, a, b, at)
    math(op, a + IM, b + IM, at)
  } else if (op === M_MUL) cmul(a, b, at)
  else cdiv(a, b, at)
  cpop()
}

/** a x b into a: (ac - bd) + (ad + bc)i. */
function cmul(a: u16, b: u16, at: u16): void {
  copy8(a, ct1)
  math(M_MUL, ct1, b, at)
  copy8(a + IM, ct2)
  math(M_MUL, ct2, b + IM, at)
  math(M_SUB, ct1, ct2, at)
  copy8(a, ct2)
  math(M_MUL, ct2, b + IM, at)
  copy8(a + IM, ct3)
  math(M_MUL, ct3, b, at)
  math(M_ADD, ct2, ct3, at)
  copy8(ct1, a)
  copy8(ct2, a + IM)
}

/**
 * a / b into a by Smith's way, which squares neither part of b: with |c| >= |d|, r = d/c and
 * e = c + dr, (a.re + a.im r)/e + (a.im - a.re r)/e i; the other way round with c and d swapped.
 * MATH for 0.
 */
function cdiv(a: u16, b: u16, at: u16): void {
  if (isZero(b) && isZero(b + IM)) fail(E_MATH, at)
  copy8(b, ct1)
  math(M_ABS, ct1, 0, at)
  copy8(b + IM, ct2)
  math(M_ABS, ct2, 0, at)
  math(M_CMP, ct1, ct2, at)
  const across = i16(peek16(MATH_RESULT)) >= 0
  // across: r = d/c, e = c + d r; else r = c/d, e = c r + d.
  const big = across ? b : b + IM
  const small = across ? b + IM : b
  copy8(small, ct1)
  math(M_DIV, ct1, big, at)
  copy8(small, ct4)
  math(M_MUL, ct4, ct1, at)
  math(M_ADD, ct4, big, at)
  // re: (a.re + a.im r)/e or (a.re r + a.im)/e; im: (a.im - a.re r)/e or (a.im r - a.re)/e.
  copy8(across ? a + IM : a, ct2)
  math(M_MUL, ct2, ct1, at)
  math(M_ADD, ct2, across ? a : a + IM, at)
  copy8(across ? a : a + IM, ct3)
  math(M_MUL, ct3, ct1, at)
  if (across) {
    copy8(a + IM, ct1)
    math(M_SUB, ct1, ct3, at)
  } else {
    copy8(ct3, ct1)
    math(M_SUB, ct1, a, at)
  }
  math(M_DIV, ct2, ct4, at)
  math(M_DIV, ct1, ct4, at)
  copy8(ct2, a)
  copy8(ct1, a + IM)
}

/**
 * z^w (w on top, z under it) into z: by multiplying for a whole w from -64 to 64, else as
 * exp(w ln z) in radians - the principal value.
 */
function cpower(at: u16): void {
  const w = ctop()
  const z = w - C_SIZE
  if (isZero(w + IM) && cSmallWhole(w, at)) {
    let n = i16(peek16(MATH_ARG))
    const negative = n < 0
    if (negative) n = -n
    // z kept, the power built up on top.
    copy8(z, w)
    copy8(z + IM, w + IM)
    wholeInto(z, 1)
    wholeInto(z + IM, 0)
    for (let k: i16 = 0; k < n; k++) cmul(z, w, at)
    if (negative) {
      cswap(z, w)
      wholeInto(z, 1)
      wholeInto(z + IM, 0)
      cdiv(z, w, at)
    }
    cpop()
    return
  }
  cpowGeneral(z, w, at)
  cpop()
}

/** Whether a real number is whole and -64 to 64: then MATH_ARG holds it. */
function cSmallWhole(v: u16, at: u16): bool {
  copy8(v, ct1)
  math(M_FRAC, ct1, 0, at)
  if (!isZero(ct1)) return false
  copy8(v, ct1)
  math(M_ABS, ct1, 0, at)
  wholeInto(ct2, 64)
  math(M_CMP, ct1, ct2, at)
  if (i16(peek16(MATH_RESULT)) > 0) return false
  copy8(v, ct1)
  math(M_TOINT, ct1, 0, at)
  return true
}

/** exp(w ln z) into z: ln z = ln|z| + i arg z, exp(x + iy) = eˣ(cos y + i sin y), in radians. */
function cpowGeneral(z: u16, w: u16, at: u16): void {
  if (isZero(z) && isZero(z + IM)) {
    if (isNegative(w) || isZero(w)) fail(E_MATH, at)
    return
  }
  poke16(MATH_ANGLE, 1)
  // ln z into z: arg first (it needs both parts), then ln|z|.
  copy8(z + IM, ct3)
  math(M_ATN2, ct3, z, at)
  cabs(z, at)
  math(M_LN, z, 0, at)
  copy8(ct3, z + IM)
  cmul(z, w, at)
  // exp(x + iy)
  math(M_EXP, z, 0, at)
  copy8(z + IM, ct1)
  copy8(z + IM, ct2)
  math(M_COS, ct1, 0, at)
  math(M_SIN, ct2, 0, at)
  math(M_MUL, ct1, z, at)
  math(M_MUL, ct2, z, at)
  copy8(ct1, z)
  copy8(ct2, z + IM)
  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
}

/** A number as typed (eval.e16.ts readNumber), its imaginary part 0. */
function cnumber(): void {
  const z = cpush(cPos)
  cPos = readNumber(cFrom, cLength, cPos, z)
}

/* ---------------- keys and the screen ---------------- */

/** F⇄D on an answer: a + bi and r∠θ in turn. */
export function cplxTurn(): void {
  polarShown = !polarShown
}

/** FUNC in CPLX: i, ∠ and its functions. */
export function cplxFuncScreen(): void {
  bandWith(str('FUNC'), 0)
  textAt(str('1:i      2:\x98'), 1, lineY(0))
  textAt(str('3:abs(   4:arg('), 1, lineY(1))
  textAt(str('5:conj(  6:Re('), 1, lineY(2))
  textAt(str('7:Im('), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
}

/** A key on CPLX's FUNC: the token it types, 1 back, 0 stay. */
export function cplxFuncKey(k: u16): u16 {
  if (k === K_AC) return 1
  return cplxItem(digitOf(k))
}

function cplxItem(d: u16): u16 {
  switch (d) {
    case 1:
      return T_I
    case 2:
      return T_POLAR
    case 3:
      return T_ABS
    case 4:
      return T_ARG
    case 5:
      return T_CONJ
    case 6:
      return T_RE
    case 7:
      return T_IM
  }
  refuse()
  return 0
}

/**
 * CPLX's answer under the line: a real one in big digits; else a + bi on two lines, or r and
 * ∠θ after F⇄D, as SETUP shows a decimal.
 */
export function cplxAnswer(): void {
  copy8(CPLX_ANS, ct1)
  copy8(CPLX_ANS + IM, ct2)
  if (polarShown) {
    // θ into ct3, then |z| on the stack's first place (the stack is not in use now).
    copy8(ct2, ct3)
    math(M_ATN2, ct3, ct1, 0)
    const z = CPLX_STACK
    copy8(CPLX_ANS, z)
    copy8(CPLX_ANS + IM, z + IM)
    cabs(z, 0)
    textRight(textOf(z), lineY(4))
    lineWith(0x98, ct3, 0)
    return
  }
  if (isZero(ct2)) {
    drawBig(ct1)
    return
  }
  textRight(textOf(ct1), lineY(4))
  lineWith(isNegative(ct2) ? 0 : 0x2b, ct2, 0x69)
}

/** On the last line: `before` (0 for none), the number at `v`, `after` (0 for none), right. */
function lineWith(before: u16, v: u16, after: u16): void {
  const s = textOf(v)
  let n: u16 = 0
  if (before !== 0) {
    cText[0] = before
    n = 1
  }
  let p = s
  while (peek(p) !== 0 && n < 30) {
    cText[n] = peek(p)
    n++
    p++
  }
  if (after !== 0) {
    cText[n] = after
    n++
  }
  cText[n] = 0
  textRight(addr(cText), lineY(5))
}
