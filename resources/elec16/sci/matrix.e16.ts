// ELEC-16 SCI, ROM bank 4: MATRIX, matrices and vectors up to 3 x 3 (docs/elec16-sci.md section
// 14.7). MatA-MatD and MatAns are kept in v2's region; EDIT asks for a size and fills one through
// the grid STATS and EQUATION use. The line is the calculator's own in LINE, evaluated here by a
// descent of its own: each value a matrix or a number, in decimals. A vector is a matrix of one
// row or one column. A matrix answer goes into MatAns and is shown on the grid.
import {
  type bool,
  i16,
  peek,
  peek16,
  poke,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { constValue } from './consts.e16'
import { readNumber } from './eval.e16'
import { openGrid } from './matview.e16'
import {
  copy8,
  E_DIM,
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
  M_CMP,
  M_COS,
  M_DIV,
  M_EXP,
  M_FRAC,
  M_LN,
  M_LOG,
  M_MUL,
  M_NEG,
  M_PI,
  M_POW,
  M_SIN,
  M_SQR,
  M_SUB,
  M_TAN,
  M_TOINT,
  MAT_ANSWERED,
  MATH_ANGLE,
  MATH_ARG,
  MATH_RESULT,
  MATRICES,
  MATRIX_SIZE,
  MATRIX_STACK,
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
  T_ANGLE,
  T_ANS,
  T_ASIN,
  T_ATAN,
  T_CLOSE,
  T_COMMA,
  T_COS,
  T_CROSS,
  T_CUBE,
  T_DET,
  T_DIVIDE,
  T_DOT,
  T_E,
  T_EXP,
  T_INVERSE,
  T_LN,
  T_LOG,
  T_MAT,
  T_MAT_ANS,
  T_MINUS,
  T_NEG,
  T_OPEN,
  T_PI,
  T_PLUS,
  T_POINT,
  T_POW,
  T_SIN,
  T_SLASH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TEN,
  T_TIMES,
  T_TRN,
} from './tokens.e16'

/*
 * A value (MATRIX_SIZE bytes, as a kept matrix): its rows and columns, 0 and 0 for a number,
 * then its numbers row by row, three to a row whatever its width (a number is the first).
 */
const M_DEPTH = 8
export const MAT_ANS = 4

/** Numbers worked on, past the stack in its room. */
const MT = MATRIX_STACK + M_DEPTH * MATRIX_SIZE

function mt(k: u16): u16 {
  return MT + k * 8
}

/** The line being read, and where. */
let mFrom: u16 = 0
let mLength: u16 = 0
let mPos: u16 = 0
let mDepth: u16 = 0

export function mRows(v: u16): u16 {
  return peek(v)
}

export function mCols(v: u16): u16 {
  return peek(v + 1)
}

function isNumber(v: u16): bool {
  return peek(v) === 0
}

/** Number (r, c) of the value at `v`. */
export function el(v: u16, r: u16, c: u16): u16 {
  return v + 2 + (r * 3 + c) * 8
}

export function matrixAt(k: u16): u16 {
  return MATRICES + k * MATRIX_SIZE
}

function mcopy(from: u16, to: u16): void {
  for (let i: u16 = 0; i < MATRIX_SIZE; i += 2) poke16(to + i, peek16(from + i))
}

/** An r x c matrix of zeros at `v` (0 x 0: the number 0). */
function zeros(v: u16, r: u16, c: u16): void {
  poke(v, r)
  poke(v + 1, c)
  for (let i: u16 = 0; i < 9; i++) wholeInto(v + 2 + i * 8, 0)
}

function mpush(at: u16): u16 {
  if (mDepth >= M_DEPTH) fail(E_STACK, at)
  const v = MATRIX_STACK + mDepth * MATRIX_SIZE
  mDepth++
  zeros(v, 0, 0)
  return v
}

function mtop(): u16 {
  return MATRIX_STACK + (mDepth - 1) * MATRIX_SIZE
}

function mpop(): void {
  mDepth--
}

/* ---------------- the evaluation ---------------- */

/**
 * The line at `from`, `length` tokens, worked out: a matrix into MatAns (shown on the grid),
 * a number onto the value stack for = to make Ans; with a matrix, Ans as it was.
 */
export function matEvaluate(from: u16, length: u16): void {
  mFrom = from
  mLength = length
  mPos = 0
  mDepth = 0
  poke16(MATH_ANGLE, peek(KEEP_ANGLE))
  if (length === 0) fail(E_SYNTAX, 0)
  msum()
  if (mPos < mLength) fail(E_SYNTAX, mPos)
  const v = mtop()
  const n = push(0)
  const isMatrix = !isNumber(v)
  poke(MAT_ANSWERED, isMatrix ? 1 : 0)
  if (isMatrix) {
    mcopy(v, matrixAt(MAT_ANS))
    for (let i: u16 = 0; i < 36; i += 2) poke16(n + i, peek16(KEEP_ANS + i))
    openGrid(MAT_ANS)
  } else copy8(v + 2, n)
}

function mtok(): u16 {
  return mPos < mLength ? peek(mFrom + mPos) : 0
}

function msum(): void {
  mprod()
  for (;;) {
    const t = mtok()
    if (t !== T_PLUS && t !== T_MINUS) return
    const at = mPos
    mPos++
    mprod()
    mAddSub(t === T_PLUS ? M_ADD : M_SUB, at)
  }
}

function mprod(): void {
  mimplied()
  for (;;) {
    const t = mtok()
    if (t !== T_TIMES && t !== T_DIVIDE) return
    const at = mPos
    mPos++
    mimplied()
    if (t === T_TIMES) mmul(at)
    else mdiv(at)
  }
}

/** Whether a value starts at the token. */
function mstarts(t: u16): bool {
  return (
    isDigit(t) ||
    t === T_POINT ||
    t === T_EXP ||
    t === T_OPEN ||
    t === T_PI ||
    t === T_E ||
    t === T_ANS ||
    t === T_TEN ||
    (t >= T_MAT && t <= T_MAT_ANS) ||
    isVariable(t) ||
    isConstant(t) ||
    mfunction(t)
  )
}

function mimplied(): void {
  mslash()
  while (mstarts(mtok())) {
    const at = mPos
    mslash()
    mmul(at)
  }
}

function mslash(): void {
  munary()
  while (mtok() === T_SLASH) {
    const at = mPos
    mPos++
    munary()
    mdiv(at)
  }
}

function munary(): void {
  const t = mtok()
  if (t === T_NEG || t === T_MINUS) {
    const at = mPos
    mPos++
    munary()
    scale(mtop(), M_NEG, 0, at)
    return
  }
  if (t === T_PLUS) {
    mPos++
    munary()
    return
  }
  mpost()
}

/** Every number of `v` run through `op` (with `b`, or alone). */
function scale(v: u16, op: u16, b: u16, at: u16): void {
  const r = isNumber(v) ? 1 : mRows(v)
  const c = isNumber(v) ? 1 : mCols(v)
  for (let i: u16 = 0; i < r; i++) {
    for (let j: u16 = 0; j < c; j++) math(op, el(v, i, j), b, at)
  }
}

function mpost(): void {
  mprimary()
  for (;;) {
    const t = mtok()
    const at = mPos
    if (t === T_POW) {
      mPos++
      msum()
      if (mtok() === T_CLOSE) mPos++
      mpower(at)
    } else if (t === T_SQUARE || t === T_CUBE) {
      mPos++
      wholeInto(mpush(at) + 2, t === T_SQUARE ? 2 : 3)
      mpower(at)
    } else if (t === T_INVERSE) {
      mPos++
      mInverse(mtop(), at)
    } else return
  }
}

function mprimary(): void {
  const t = mtok()
  const at = mPos
  if (isDigit(t) || t === T_POINT || t === T_EXP) {
    mnumber()
    return
  }
  if (t === 0) fail(E_SYNTAX, at)
  mPos++
  if (!mvalue(t, mpush(at), at)) {
    mpop()
    mbracketed(t, at)
  }
}

/** A matrix, Ans, π, e, 10, a variable or a constant into `v`: false for none of them. */
function mvalue(t: u16, v: u16, at: u16): bool {
  if (t >= T_MAT && t <= T_MAT_ANS) {
    const m = matrixAt(t - T_MAT)
    if (mRows(m) === 0) fail(E_DIM, at)
    mcopy(m, v)
  } else if (t === T_ANS) {
    if (peek(MAT_ANSWERED) !== 0) mcopy(matrixAt(MAT_ANS), v)
    else copy8(KEEP_ANS, v + 2)
  } else if (t === T_PI) math(M_PI, v + 2, 0, at)
  else if (t === T_E) {
    wholeInto(v + 2, 1)
    math(M_EXP, v + 2, 0, at)
  } else if (t === T_TEN) wholeInto(v + 2, 10)
  else if (isVariable(t)) copy8(varAt(t), v + 2)
  else if (isConstant(t)) constValue(t, v + 2)
  else return false
  return true
}

function mbracketed(t: u16, at: u16): void {
  if (t !== T_OPEN && !mfunction(t)) fail(E_SYNTAX, at)
  msum()
  const two = t === T_DOT || t === T_CROSS || t === T_ANGLE
  if (two) {
    if (mtok() !== T_COMMA) fail(E_SYNTAX, mPos)
    mPos++
    msum()
  }
  if (mtok() === T_CLOSE) mPos++
  if (two) twoVectors(t, at)
  else if (t !== T_OPEN) mapply(t, at)
}

/** Whether MATRIX takes a function: its own, abs( and the real functions of a number. */
function mfunction(t: u16): bool {
  return (t >= T_DET && t <= T_ANGLE) || t === T_ABS || mrealOp(t) !== 0
}

function mrealOp(t: u16): u16 {
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

/** det( trn( abs( or a real function of the value on top. */
function mapply(t: u16, at: u16): void {
  const v = mtop()
  if (t === T_DET) {
    square(v, at)
    determinant(v, mt(0), at)
    zeros(v, 0, 0)
    copy8(mt(0), v + 2)
  } else if (t === T_TRN) transpose(v, at)
  else if (t === T_ABS) {
    if (isNumber(v)) math(M_ABS, v + 2, 0, at)
    else {
      vectorLength(v, mt(0), at)
      zeros(v, 0, 0)
      copy8(mt(0), v + 2)
    }
  } else {
    if (!isNumber(v)) fail(E_DIM, at)
    math(mrealOp(t), v + 2, 0, at)
  }
}

/* ---------------- arithmetic ---------------- */

/** + or - of the two values on top: both numbers, or two matrices of one size. */
function mAddSub(op: u16, at: u16): void {
  const b = mtop()
  const a = b - MATRIX_SIZE
  if (mRows(a) !== mRows(b) || mCols(a) !== mCols(b)) fail(E_DIM, at)
  const r = isNumber(a) ? 1 : mRows(a)
  const c = isNumber(a) ? 1 : mCols(a)
  for (let i: u16 = 0; i < r; i++) {
    for (let j: u16 = 0; j < c; j++) math(op, el(a, i, j), el(b, i, j), at)
  }
  mpop()
}

/** x of the two values on top: a number with anything, or matrices whose sizes meet. */
function mmul(at: u16): void {
  const b = mtop()
  const a = b - MATRIX_SIZE
  if (isNumber(b)) scale(a, M_MUL, b + 2, at)
  else if (isNumber(a)) {
    copy8(a + 2, mt(0))
    mcopy(b, a)
    scale(a, M_MUL, mt(0), at)
  } else product(a, b, at)
  mpop()
}

/** a x b into a, both matrices; DIM unless a's columns are b's rows. */
function product(a: u16, b: u16, at: u16): void {
  const n = mCols(a)
  if (n !== mRows(b)) fail(E_DIM, at)
  const out = mpush(at)
  poke(out, mRows(a))
  poke(out + 1, mCols(b))
  for (let i: u16 = 0; i < mRows(a); i++) {
    for (let j: u16 = 0; j < mCols(b); j++) {
      const s = el(out, i, j)
      for (let k: u16 = 0; k < n; k++) {
        copy8(el(a, i, k), mt(1))
        math(M_MUL, mt(1), el(b, k, j), at)
        math(M_ADD, s, mt(1), at)
      }
    }
  }
  mcopy(out, a)
  mpop()
}

/** / of the two values on top: anything by a number. */
function mdiv(at: u16): void {
  const b = mtop()
  if (!isNumber(b)) fail(E_DIM, at)
  scale(b - MATRIX_SIZE, M_DIV, b + 2, at)
  mpop()
}

/** DIM unless `v` is a square matrix. */
function square(v: u16, at: u16): void {
  if (isNumber(v) || mRows(v) !== mCols(v)) fail(E_DIM, at)
}

/**
 * The value under the top to the power on top: a number to any power; a square matrix to a
 * whole power from -9 to 9 (0 the identity, below 0 its inverse's).
 */
function mpower(at: u16): void {
  const w = mtop()
  const v = w - MATRIX_SIZE
  if (!isNumber(w)) fail(E_DIM, at)
  if (isNumber(v)) {
    math(M_POW, v + 2, w + 2, at)
    mpop()
    return
  }
  square(v, at)
  copy8(w + 2, mt(0))
  math(M_FRAC, mt(0), 0, at)
  if (!isZero(mt(0))) fail(E_MATH, at)
  copy8(w + 2, mt(0))
  math(M_TOINT, mt(0), 0, at)
  let n = i16(peek16(MATH_ARG))
  if (n < -9 || n > 9) fail(E_MATH, at)
  if (n < 0) {
    mInverse(v, at)
    n = -n
  }
  // The base kept on top (where the power was), the answer built up in v.
  mcopy(v, w)
  identity(v)
  for (let k: i16 = 0; k < n; k++) product(v, w, at)
  mpop()
}

/** The identity of v's size into v. */
function identity(v: u16): void {
  const n = mRows(v)
  zeros(v, n, n)
  for (let i: u16 = 0; i < n; i++) wholeInto(el(v, i, i), 1)
}

/** The transpose of `v` into `v`. */
function transpose(v: u16, at: u16): void {
  if (isNumber(v)) return
  const t = mpush(at)
  poke(t, mCols(v))
  poke(t + 1, mRows(v))
  for (let i: u16 = 0; i < mRows(v); i++) {
    for (let j: u16 = 0; j < mCols(v); j++) copy8(el(v, i, j), el(t, j, i))
  }
  mcopy(t, v)
  mpop()
}

/** Where in the line the operation being worked out is, for an error found under it. */
let mAt: u16 = 0

/** The determinant of square `v` (1-3) into `out`: by cofactors, exact for whole numbers. */
function determinant(v: u16, out: u16, at: u16): void {
  mAt = at
  const n = mRows(v)
  if (n === 1) copy8(el(v, 0, 0), out)
  else if (n === 2) minor2(v, 0x01, 0x01, out)
  else {
    wholeInto(out, 0)
    for (let j: u16 = 0; j < 3; j++) {
      cofactor(v, 0, j, mt(2))
      math(M_MUL, mt(2), el(v, 0, j), at)
      math(M_ADD, out, mt(2), at)
    }
  }
}

/** v(r0,c0) v(r1,c1) - v(r0,c1) v(r1,c0) into `out`. */
function minor2(v: u16, rows: u16, cols: u16, out: u16): void {
  const r0 = rows >> 4
  const r1 = rows & 15
  const c0 = cols >> 4
  const c1 = cols & 15
  const at = mAt
  copy8(el(v, r0, c0), out)
  math(M_MUL, out, el(v, r1, c1), at)
  copy8(el(v, r0, c1), mt(3))
  math(M_MUL, mt(3), el(v, r1, c0), at)
  math(M_SUB, out, mt(3), at)
}

/** The cofactor of (r, c) in a 3 x 3 `v` into `out`: its minor, signed. */
function cofactor(v: u16, r: u16, c: u16, out: u16): void {
  const r0 = r === 0 ? 1 : 0
  const r1 = r === 2 ? 1 : 2
  const c0 = c === 0 ? 1 : 0
  const c1 = c === 2 ? 1 : 2
  minor2(v, r0 * 16 + r1, c0 * 16 + c1, out)
  if (((r + c) & 1) !== 0) math(M_NEG, out, 0, 0)
}

/** The inverse of `v` into `v` (a number's too): its adjugate over its determinant; MATH for 0. */
function mInverse(v: u16, at: u16): void {
  if (isNumber(v)) {
    wholeInto(mt(0), 1)
    math(M_DIV, mt(0), v + 2, at)
    copy8(mt(0), v + 2)
    return
  }
  square(v, at)
  determinant(v, mt(0), at)
  if (isZero(mt(0))) fail(E_MATH, at)
  mAt = at
  const n = mRows(v)
  const adj = mpush(at)
  poke(adj, n)
  poke(adj + 1, n)
  if (n === 1) wholeInto(el(adj, 0, 0), 1)
  else if (n === 2) {
    copy8(el(v, 1, 1), el(adj, 0, 0))
    copy8(el(v, 0, 0), el(adj, 1, 1))
    copy8(el(v, 0, 1), el(adj, 0, 1))
    math(M_NEG, el(adj, 0, 1), 0, at)
    copy8(el(v, 1, 0), el(adj, 1, 0))
    math(M_NEG, el(adj, 1, 0), 0, at)
  } else {
    for (let i: u16 = 0; i < 3; i++) {
      for (let j: u16 = 0; j < 3; j++) cofactor(v, j, i, el(adj, i, j))
    }
  }
  scale(adj, M_DIV, mt(0), at)
  mcopy(adj, v)
  mpop()
}

/* ---------------- vectors ---------------- */

/** How many numbers a vector has (a matrix of one row or one column); DIM for another value. */
function vectorSize(v: u16, at: u16): u16 {
  if (isNumber(v) || (mRows(v) !== 1 && mCols(v) !== 1)) fail(E_DIM, at)
  return mRows(v) === 1 ? mCols(v) : mRows(v)
}

/** A vector's number `k`, whichever way it lies. */
function vPart(v: u16, k: u16): u16 {
  return mRows(v) === 1 ? el(v, 0, k) : el(v, k, 0)
}

/** u . v into `out`. */
function dotOf(u: u16, v: u16, out: u16, at: u16): void {
  const n = vectorSize(u, at)
  if (vectorSize(v, at) !== n) fail(E_DIM, at)
  wholeInto(out, 0)
  for (let k: u16 = 0; k < n; k++) {
    copy8(vPart(u, k), mt(4))
    math(M_MUL, mt(4), vPart(v, k), at)
    math(M_ADD, out, mt(4), at)
  }
}

/** |v| into `out`. */
function vectorLength(v: u16, out: u16, at: u16): void {
  dotOf(v, v, out, at)
  math(M_SQR, out, 0, at)
}

/** dot(, cross( or angle( of the two values on top, into the lower. */
function twoVectors(t: u16, at: u16): void {
  const v = mtop()
  const u = v - MATRIX_SIZE
  if (t === T_CROSS) cross(u, v, at)
  else {
    dotOf(u, v, mt(5), at)
    if (t === T_ANGLE) {
      vectorLength(u, mt(6), at)
      vectorLength(v, mt(7), at)
      math(M_MUL, mt(6), mt(7), at)
      if (isZero(mt(6))) fail(E_MATH, at)
      math(M_DIV, mt(5), mt(6), at)
      // |u . v| / (|u| |v|) rounds past 1 for u = v: [1,1,1] came to 3 / 2.99999999999.
      clampOne(mt(5))
      math(M_ACS, mt(5), 0, at)
    }
    zeros(u, 0, 0)
    copy8(mt(5), u + 2)
  }
  mpop()
}

/** `v` held to -1 .. 1. */
function clampOne(v: u16): void {
  wholeInto(mt(8), 1)
  copy8(v, mt(7))
  math(M_ABS, mt(7), 0, 0)
  math(M_CMP, mt(7), mt(8), 0)
  if (i16(peek16(MATH_RESULT)) <= 0) return
  if (isNegative(v)) math(M_NEG, mt(8), 0, 0)
  copy8(mt(8), v)
}

/** u x v into u: 3 numbers (a vector of 2 has a z of 0), lying as u lies. */
function cross(u: u16, v: u16, at: u16): void {
  const nu = vectorSize(u, at)
  const nv = vectorSize(v, at)
  if (nu < 2 || nv < 2) fail(E_DIM, at)
  for (let k: u16 = 0; k < 3; k++) {
    copy8(k < nu ? vPart(u, k) : mZero(), mt(k))
    copy8(k < nv ? vPart(v, k) : mZero(), mt(k + 3))
  }
  const out = mpush(at)
  const across = mRows(u) === 1
  poke(out, across ? 1 : 3)
  poke(out + 1, across ? 3 : 1)
  for (let k: u16 = 0; k < 3; k++) {
    const i = k === 2 ? 0 : k + 1
    const j = k === 0 ? 2 : k - 1
    // (u x v)_k = u_i v_j - u_j v_i
    copy8(mt(i), mt(6))
    math(M_MUL, mt(6), mt(j + 3), at)
    copy8(mt(j), mt(7))
    math(M_MUL, mt(7), mt(i + 3), at)
    math(M_SUB, mt(6), mt(7), at)
    copy8(mt(6), vPart(out, k))
  }
  mcopy(out, u)
  mpop()
}

/** A zero to copy from (mt(8), set each time). */
function mZero(): u16 {
  wholeInto(mt(8), 0)
  return mt(8)
}

/** A number as typed (eval.e16.ts readNumber). */
function mnumber(): void {
  const v = mpush(mPos)
  mPos = readNumber(mFrom, mLength, mPos, v + 2)
}
