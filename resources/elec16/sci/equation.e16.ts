// ELEC-16 SCI, ROM bank 11: EQUATION (docs/elec16-sci.md section 6.6). Two or three linear
// equations in as many unknowns, by elimination with the largest pivot; a quadratic, its
// roots in the exact form (p + r√s)/q where the coefficients have one, its vertex on ▼; a
// cubic, one real root found by halving [-R, R] (R from the coefficients), the other two from
// the quadratic left. Complex roots are shown as re ± im i. The coefficients are typed into
// the grid (grid.e16.ts) and kept when the power goes.
import {
  type bool,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { K_1, K_2, K_3, K_4, K_AC, K_DOWN, K_UP, refuse } from './calc.e16'
import { drawComplexAt, drawValueAt } from './display.e16'
import { exactBinary, exactNeg, exactSqrt, exactWhole } from './exact.e16'
import { GRID_AC, GRID_DONE, GRID_EQN, gridDraw, gridKey, gridOpen } from './grid.e16'
import { band, cls, lineY, mark, textAt } from './lcd.e16'
import {
  copyValue,
  E_MATH,
  EQN_COEFFS,
  EQN_TYPE,
  EQN_WORK,
  fail,
  inexact,
  isExact,
  isNegative,
  isZero,
  KEEP_DISPLAY,
  M_ABS,
  M_ADD,
  M_CMP,
  M_DIV,
  M_MUL,
  M_NEG,
  M_RNDTO,
  M_SQR,
  M_SUB,
  MATH_ARG,
  MATH_RESULT,
  math,
  VALUE_SIZE,
} from './numbers.e16'

const EQ_TYPE = 0
const EQ_GRID = 1
const EQ_RESULT = 2
let eqPhase: u16 = EQ_TYPE
/** The quadratic's second page: its vertex. */
let vertex: bool = false
/** The answers: how many, whether they came out (a linear system may have none, or many). */
let answers: u16 = 0
let unique: bool = true
/*
 * The roots' real parts and imaginary parts (0 for a real root), the vertex, the matrix
 * (3 x 4) and a few values: a value each, in EQN_WORK (e16c's own RAM is full).
 */
const ROOTS = EQN_WORK
const IMAGINARY = EQN_WORK + 3 * VALUE_SIZE
const VERTEX = EQN_WORK + 6 * VALUE_SIZE
const MATRIX = EQN_WORK + 8 * VALUE_SIZE
const E1 = EQN_WORK + 20 * VALUE_SIZE
const E2 = E1 + VALUE_SIZE
const E3 = E2 + VALUE_SIZE
const E4 = E3 + VALUE_SIZE

function kind(): u16 {
  return peek(EQN_TYPE)
}

/** Rows and columns of the coefficients: 2 x 3, 3 x 4, 1 x 3, 1 x 4. */
function rowsOf(k: u16): u16 {
  if (k === 1) return 2
  return k === 2 ? 3 : 1
}

function colsOf(k: u16): u16 {
  return k === 1 || k === 3 ? 3 : 4
}

function coeff(r: u16, c: u16): u16 {
  return EQN_COEFFS + (r * colsOf(kind()) + c) * VALUE_SIZE
}

function rootAt(k: u16): u16 {
  return ROOTS + k * VALUE_SIZE
}

function imAt(k: u16): u16 {
  return IMAGINARY + k * VALUE_SIZE
}

/* ---------------- keys ---------------- */

/** EQUATION chosen: its kind first. */
export function eqnStart(): void {
  eqPhase = EQ_TYPE
}

/** AC or ON from an error: the coefficients again. */
export function eqnReset(): void {
  if (kind() === 0) {
    eqPhase = EQ_TYPE
    return
  }
  eqPhase = EQ_GRID
  gridOpen(GRID_EQN, rowsOf(kind()), colsOf(kind()))
}

/** A key in EQUATION; true when it leaves the mode (AC on the kinds, none chosen yet). */
export function eqnKey(k: u16, shift: bool): bool {
  if (eqPhase === EQ_TYPE) return eqTypeKey(k)
  if (eqPhase === EQ_RESULT) eqResultKey(k)
  else {
    const r = gridKey(k, shift)
    if (r === GRID_DONE) {
      solve()
      vertex = false
      eqPhase = EQ_RESULT
    } else if (r === GRID_AC) eqPhase = EQ_TYPE
  }
  return false
}

/**
 * 1-4 the kind (its coefficients 0 when it changes); AC back to the coefficients, or out of
 * the mode (true) when no kind was ever chosen, as AC:BACK says.
 */
function eqTypeKey(k: u16): bool {
  const chosen = typeOf(k)
  if (chosen !== 0) {
    if (chosen !== kind()) {
      poke(EQN_TYPE, chosen)
      for (let i: u16 = 0; i < 12; i++) zeroValue(EQN_COEFFS + i * VALUE_SIZE)
    }
    eqnReset()
  } else if (k === K_AC) {
    if (kind() === 0) return true
    eqnReset()
  } else refuse()
  return false
}

/** The kind a key chooses, 1-4; 0 for another key. */
function typeOf(k: u16): u16 {
  if (k === K_1) return 1
  if (k === K_2) return 2
  if (k === K_3) return 3
  return k === K_4 ? 4 : 0
}

function eqResultKey(k: u16): void {
  if (k === K_AC) eqPhase = EQ_GRID
  else if (kind() === 3 && (k === K_DOWN || k === K_UP)) vertex = k === K_DOWN
  else refuse()
}

/** An exact 0. */
function zeroValue(v: u16): void {
  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(v + i, 0)
  exactWhole(v)
}

/* ---------------- drawing ---------------- */

export function eqnDraw(): void {
  cls()
  if (eqPhase === EQ_TYPE) eqDrawType()
  else if (eqPhase === EQ_GRID) {
    band(titleOf(kind()))
    gridDraw()
  } else eqDrawResults()
}

function titleOf(k: u16): u16 {
  if (k === 1) return str('aX+bY=c')
  if (k === 2) return str('aX+bY+cZ=d')
  if (k === 3) return str('aX\x84+bX+c=0')
  return str('aX\x85+bX\x84+cX+d=0')
}

function eqDrawType(): void {
  band(str('EQUATION'))
  textAt(str('1:aX+bY=c'), 1, lineY(0))
  textAt(str('2:aX+bY+cZ=d'), 1, lineY(1))
  textAt(str('3:aX\x84+bX+c=0'), 1, lineY(2))
  textAt(str('4:aX\x85+bX\x84+cX+d=0'), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
  const k = kind()
  if (k !== 0) mark(0, 2, k - 1)
}

/** The answers a line each, their feet 21 rows apart (room for a fraction with a root). */
function eqDrawResults(): void {
  const twoD = peek(KEEP_DISPLAY) === 0
  if (!unique) {
    band(titleOf(kind()))
    textAt(str('NO ONE SOLUTION:'), 1, lineY(0))
    textAt(str('NONE, OR MANY'), 1, lineY(1))
    textAt(str('AC:EDIT'), 1, lineY(5))
    return
  }
  if (vertex) {
    textAt(str('VERTEX'), 1, 0)
    textAt(str('X='), 1, 21)
    drawValueAt(VERTEX, 28, twoD)
    textAt(str('Y='), 1, 42)
    drawValueAt(VERTEX + VALUE_SIZE, 49, twoD)
    textAt(str('\x8d:ROOTS  AC:EDIT'), 1, 56)
    return
  }
  for (let k: u16 = 0; k < answers; k++) {
    const foot = 14 + 21 * k
    textAt(labelOf(k), 1, foot - 7)
    if (isZero(imAt(k))) drawValueAt(rootAt(k), foot, twoD)
    else complexAt(k, foot)
  }
  if (kind() === 3) textAt(str('\x8e:VERTEX  AC:EDIT'), 1, 56)
}

/** re ± |im| i: the size of the imaginary part, its sign the ± between. */
function complexAt(k: u16, foot: u16): void {
  const minus = isNegative(imAt(k))
  copyValue(imAt(k), E1)
  if (minus) vneg(E1)
  drawComplexAt(rootAt(k), E1, minus, foot)
}

function labelOf(k: u16): u16 {
  if (kind() <= 2) return k === 0 ? str('X=') : k === 1 ? str('Y=') : str('Z=')
  return k === 0 ? str('X1=') : k === 1 ? str('X2=') : str('X3=')
}

/* ---------------- solving ---------------- */

/** a = a op b, its exact form followed. */
function vop(op: u16, a: u16, b: u16): void {
  math(op, a, b, 0)
  exactBinary(op, a, b)
}

function vneg(a: u16): void {
  math(M_NEG, a, 0, 0)
  exactNeg(a)
}

function solve(): void {
  unique = true
  for (let k: u16 = 0; k < 3; k++) zeroValue(imAt(k))
  const k = kind()
  if (k <= 2) linear(k + 1)
  else if (k === 3) {
    quadratic(coeff(0, 0), coeff(0, 1), coeff(0, 2), 0)
    answers = 2
    vertexOf()
  } else cubic()
}

/* Linear: the matrix n x (n + 1) eliminated below the diagonal, then solved from the bottom. */

function cell(r: u16, c: u16, n: u16): u16 {
  return MATRIX + (r * (n + 1) + c) * VALUE_SIZE
}

function linear(n: u16): void {
  answers = n
  for (let r: u16 = 0; r < n; r++) {
    for (let c: u16 = 0; c <= n; c++) copyValue(coeff(r, c), cell(r, c, n))
  }
  for (let k: u16 = 0; k < n; k++) {
    const p = pivotRow(k, n)
    if (isZero(cell(p, k, n))) {
      unique = false
      return
    }
    if (p !== k) swapRows(p, k, n)
    for (let i = k + 1; i < n; i++) eliminate(i, k, n)
  }
  for (let i = n; i > 0; i--) backSubstitute(i - 1, n)
}

/** The row from `k` down whose value in column `k` is largest in size. */
function pivotRow(k: u16, n: u16): u16 {
  let best = k
  for (let i = k + 1; i < n; i++) {
    copyValue(cell(i, k, n), E1)
    math(M_ABS, E1, 0, 0)
    copyValue(cell(best, k, n), E2)
    math(M_ABS, E2, 0, 0)
    math(M_CMP, E1, E2, 0)
    if (peek16(MATH_RESULT) === 1) best = i
  }
  return best
}

function swapRows(a: u16, b: u16, n: u16): void {
  for (let c: u16 = 0; c <= n; c++) {
    copyValue(cell(a, c, n), E1)
    copyValue(cell(b, c, n), cell(a, c, n))
    copyValue(E1, cell(b, c, n))
  }
}

/** Row i less row k times the factor that clears column k. */
function eliminate(i: u16, k: u16, n: u16): void {
  copyValue(cell(i, k, n), E3)
  vop(M_DIV, E3, cell(k, k, n))
  for (let c = k; c <= n; c++) {
    copyValue(cell(k, c, n), E1)
    vop(M_MUL, E1, E3)
    vop(M_SUB, cell(i, c, n), E1)
  }
}

/** x_i = (b_i - the sum of the row's later terms) / its diagonal. */
function backSubstitute(i: u16, n: u16): void {
  copyValue(cell(i, n, n), E2)
  for (let j = i + 1; j < n; j++) {
    copyValue(cell(i, j, n), E1)
    vop(M_MUL, E1, rootAt(j))
    vop(M_SUB, E2, E1)
  }
  vop(M_DIV, E2, cell(i, i, n))
  copyValue(E2, rootAt(i))
}

/*
 * The quadratic a x² + b x + c into roots `first` and `first` + 1: D = b² - 4ac; real roots
 * (-b ± √D) / 2a, or -b/2a ± (√-D / 2|a|) i. a must not be 0.
 */
function quadratic(a: u16, b: u16, c: u16, first: u16): void {
  if (isZero(a)) fail(E_MATH, 0)
  copyValue(b, E1)
  vop(M_MUL, E1, b)
  copyValue(a, E2)
  vop(M_MUL, E2, c)
  eqSmall(E3, 4)
  vop(M_MUL, E2, E3)
  vop(M_SUB, E1, E2)
  // t2 = 2a, t3 = -b.
  copyValue(a, E2)
  eqSmall(E3, 2)
  vop(M_MUL, E2, E3)
  copyValue(b, E3)
  vneg(E3)
  const complex = isNegative(E1)
  if (complex) vneg(E1)
  math(M_SQR, E1, 0, 0)
  exactSqrt(E1)
  if (complex) {
    complexRoots(first)
    return
  }
  copyValue(E3, rootAt(first))
  vop(M_ADD, rootAt(first), E1)
  vop(M_DIV, rootAt(first), E2)
  copyValue(E3, rootAt(first + 1))
  vop(M_SUB, rootAt(first + 1), E1)
  vop(M_DIV, rootAt(first + 1), E2)
  // -b and ±√D nearly cancel in one root when 4ac is small beside b²: as a decimal it is
  // worked out again from the other, x1 x2 = c/a (x² + 10⁸x + 1 once had 0 for -10⁻⁸).
  const small = isNegative(b) ? first + 1 : first
  fromProduct(rootAt(small), rootAt(small === first ? first + 1 : first), a, c)
}

/** `r` as c / a / `other`, when it has no exact form and `other` is not 0. */
function fromProduct(r: u16, other: u16, a: u16, c: u16): void {
  if (isExact(r) || isZero(other)) return
  copyValue(c, r)
  vop(M_DIV, r, a)
  vop(M_DIV, r, other)
}

/** -b/2a ± (√-D / 2|a|) i, from t3 = -b, t1 = √-D, t2 = 2a. */
function complexRoots(first: u16): void {
  copyValue(E3, rootAt(first))
  vop(M_DIV, rootAt(first), E2)
  copyValue(rootAt(first), rootAt(first + 1))
  if (isNegative(E2)) vneg(E2)
  copyValue(E1, imAt(first))
  vop(M_DIV, imAt(first), E2)
  copyValue(imAt(first), imAt(first + 1))
  vneg(imAt(first + 1))
}

/** The vertex: X = -b/2a, Y = c - b²/4a. */
function vertexOf(): void {
  const x = VERTEX
  const y = VERTEX + VALUE_SIZE
  copyValue(coeff(0, 1), x)
  vneg(x)
  copyValue(coeff(0, 0), E1)
  eqSmall(E2, 2)
  vop(M_MUL, E1, E2)
  vop(M_DIV, x, E1)
  // Y = a X² + b X + c.
  copyValue(x, y)
  vop(M_MUL, y, coeff(0, 0))
  vop(M_ADD, y, coeff(0, 1))
  vop(M_MUL, y, x)
  vop(M_ADD, y, coeff(0, 2))
}

/** A whole number below 10, exact. */
function eqSmall(v: u16, n: u16): void {
  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(v + i, 0)
  poke(v + 2, n << 4)
  exactWhole(v)
}

/*
 * The cubic: one real root by halving, exact when it is a whole number that makes the cubic 0
 * exactly; the quadratic left by synthetic division, solved as above.
 */
function cubic(): void {
  answers = 3
  const a = coeff(0, 0)
  if (isZero(a)) fail(E_MATH, 0)
  halve()
  // A whole root, checked exactly: the quadratic then keeps its exact forms.
  copyValue(rootAt(0), E4)
  poke16(MATH_ARG, 0)
  math(M_RNDTO, E4, 0, 0)
  exactWhole(E4)
  cubicAt(E4, E1)
  if (isZero(E1)) copyValue(E4, rootAt(0))
  else inexact(rootAt(0))
  // a x² + (b + a r) x + (c + (b + a r) r).
  const qa = MATRIX
  const qb = qa + VALUE_SIZE
  const qc = qb + VALUE_SIZE
  copyValue(a, qa)
  copyValue(a, qb)
  vop(M_MUL, qb, rootAt(0))
  vop(M_ADD, qb, coeff(0, 1))
  copyValue(qb, qc)
  vop(M_MUL, qc, rootAt(0))
  vop(M_ADD, qc, coeff(0, 2))
  quadratic(qa, qb, qc, 1)
}

/** f(x) of the cubic into `out`, by Horner's rule on the coefficients as typed. */
function cubicAt(x: u16, out: u16): void {
  copyValue(coeff(0, 0), out)
  for (let c: u16 = 1; c < 4; c++) {
    vop(M_MUL, out, x)
    vop(M_ADD, out, coeff(0, c))
  }
}

/**
 * A real root into roots[0] by halving [-R, R], R = 1 + the largest of |b/a|, |c/a|, |d/a|:
 * the cubic's sign at -R and R differ, and 80 halvings leave less than the 12 digits hold.
 */
function halve(): void {
  const lo = MATRIX
  const hi = lo + VALUE_SIZE
  const mid = hi + VALUE_SIZE
  const flo = mid + VALUE_SIZE
  eqSmall(hi, 1)
  for (let c: u16 = 1; c < 4; c++) {
    copyValue(coeff(0, c), E1)
    math(M_DIV, E1, coeff(0, 0), 0)
    math(M_ABS, E1, 0, 0)
    eqSmall(E2, 1)
    math(M_ADD, E1, E2, 0)
    math(M_CMP, E1, hi, 0)
    if (peek16(MATH_RESULT) === 1) copyValue(E1, hi)
  }
  copyValue(hi, lo)
  math(M_NEG, lo, 0, 0)
  inexact(lo)
  inexact(hi)
  cubicAt(lo, flo)
  for (let k: u16 = 0; k < 80; k++) {
    copyValue(lo, mid)
    math(M_ADD, mid, hi, 0)
    eqSmall(E2, 2)
    math(M_DIV, mid, E2, 0)
    inexact(mid)
    cubicAt(mid, E3)
    if (isZero(E3)) break
    if (isNegative(E3) === isNegative(flo)) copyValue(mid, lo)
    else copyValue(mid, hi)
  }
  copyValue(mid, rootAt(0))
}
