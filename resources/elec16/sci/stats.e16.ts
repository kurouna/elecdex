// ELEC-16 SCI, ROM bank 7: STATS (docs/elec16-sci.md sections 6.6 and 6.8). One variable or
// two, fitted by least squares to one of six curves - the line y = a + bx, the quadratic
// y = a + bx + cx², y = a·e^(bx), y = a + b·ln x, y = a·x^b, y = a + b/x - a FREQ column if
// wanted; the data typed into the grid (grid.e16.ts) and kept when the power goes; = with
// nothing typed works out the results - n, the means, both standard deviations (σ of the
// population, s of a sample), the sums, and for two variables r, a, b and c - shown six a page.
// The curves but the quadratic are fitted as a line to the data made straight (ln y, ln x or
// 1/x): r, a and b are that line's (a taken back through e^ where y was ln y), the rest the
// data's own. Its results and estimates go into any line through FUNC (`statValue`,
// `statEstimate`).
import {
  addr,
  type bool,
  bytes,
  i16,
  peek,
  peek16,
  poke,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import {
  K_1,
  K_2,
  K_3,
  K_4,
  K_5,
  K_6,
  K_7,
  K_8,
  K_AC,
  K_DOWN,
  K_FUNC,
  K_UP,
  refuse,
} from './calc.e16'
import { textOf } from './display.e16'
import {
  clearRows,
  deleteRow,
  GRID_AC,
  GRID_DONE,
  GRID_STATS,
  gridDraw,
  gridKey,
  gridOpen,
  gridRow,
  newRow,
} from './grid.e16'
import { band, bandWith, cls, lineY, mark, textAt, textRight } from './lcd.e16'
import {
  copy8,
  E_MATH,
  fail,
  inexact,
  isNegative,
  isZero,
  M_ADD,
  M_CMP,
  M_DIV,
  M_EXP,
  M_LN,
  M_MUL,
  M_NEG,
  M_PI,
  M_POW,
  M_SQR,
  M_SUB,
  MATH_RESULT,
  math,
  STATS_COUNT,
  STATS_DATA,
  STATS_FREQ,
  STATS_TYPE,
  STATS_WORK,
  wholeInto,
} from './numbers.e16'
import { T_NMID, T_NUP } from './tokens.e16'

/** What STATS shows: its kind chosen, the grid, FUNC's row menu, the results. */
const PH_TYPE = 0
const PH_GRID = 1
const PH_FUNC = 2
const PH_RESULT = 3
let phase: u16 = PH_TYPE
let resultPage: u16 = 0

/** STATS_TYPE: one variable, then the six curves two variables are fitted to. */
const KIND_1VAR = 0
const KIND_LINE = 1
const KIND_QUAD = 2
const KIND_EXP = 3
const KIND_LOG = 4
const KIND_PWR = 5
const KIND_INV = 6

/** STATS chosen from MENU: its kind first, the one it was marked. */
export function statsStart(): void {
  phase = PH_TYPE
}

/** AC or ON from an error: back to the grid. */
export function statsReset(): void {
  phase = PH_GRID
  gridOpen(GRID_STATS, 0, 0)
}

function statKind(): u16 {
  const t = peek(STATS_TYPE)
  return t <= KIND_INV ? t : KIND_1VAR
}

function twoVar(): bool {
  return statKind() !== KIND_1VAR
}

/* ---------------- keys ---------------- */

export function statsKey(k: u16, shift: bool): void {
  if (phase === PH_TYPE) typeKey(k)
  else if (phase === PH_FUNC) statsFuncKey(k)
  else if (phase === PH_RESULT) resultKey(k)
  else if (k === K_FUNC) phase = PH_FUNC
  else {
    const r = gridKey(k, shift)
    if (r === GRID_DONE) {
      if (peek16(STATS_COUNT) === 0) refuse()
      else {
        workOut()
        resultPage = 0
        phase = PH_RESULT
      }
    } else if (r === GRID_AC) refuse()
  }
}

/** 1-7 the kind (1-VAR, LINE, QUAD, EXP, LOG, PWR, INV), 8 FREQ on or off; AC back to the grid. */
function typeKey(k: u16): void {
  const t = typeOfKey(k)
  if (t !== 0xffff) {
    poke(STATS_TYPE, t)
    statsReset()
  } else if (k === K_8) poke(STATS_FREQ, peek(STATS_FREQ) === 0 ? 1 : 0)
  else if (k === K_AC) statsReset()
  else refuse()
}

function typeOfKey(k: u16): u16 {
  if (k === K_1) return KIND_1VAR
  if (k === K_2) return KIND_LINE
  if (k === K_3) return KIND_QUAD
  if (k === K_4) return KIND_EXP
  if (k === K_5) return KIND_LOG
  if (k === K_6) return KIND_PWR
  return k === K_7 ? KIND_INV : 0xffff
}

/** FUNC in STATS: a row put in or taken out, every row cleared, the kind chosen again. */
function statsFuncKey(k: u16): void {
  phase = PH_GRID
  if (k === K_1) newRow(gridRow())
  else if (k === K_2) deleteRow()
  else if (k === K_3) clearRows()
  else if (k === K_4) phase = PH_TYPE
  else if (k !== K_AC) {
    refuse()
    phase = PH_FUNC
  }
}

function resultKey(k: u16): void {
  const pages: u16 = twoVar() ? 3 : 1
  if (k === K_DOWN && resultPage + 1 < pages) resultPage++
  else if (k === K_UP && resultPage > 0) resultPage--
  else if (k === K_AC) phase = PH_GRID
  else refuse()
}

/* ---------------- drawing ---------------- */

export function statsDraw(): void {
  cls()
  if (phase === PH_TYPE) drawType()
  else if (phase === PH_FUNC) drawFunc()
  else if (phase === PH_RESULT) drawResults()
  else {
    countText()
    bandWith(kindTitle(str('STATS '), 0), addr(countChars))
    gridDraw()
  }
}

/** The kind's name, after `before` or before `after` (either 0): STATS LINE, QUAD RESULT. */
const titleText = bytes(16)

function kindTitle(before: u16, after: u16): u16 {
  let n: u16 = 0
  if (before !== 0) n = copyText(before, n)
  n = copyText(kindName(statKind()), n)
  if (after !== 0) n = copyText(after, n)
  titleText[n] = 0
  return addr(titleText)
}

function copyText(from: u16, n: u16): u16 {
  let k = n
  let p = from
  while (peek(p) !== 0 && k < 15) {
    titleText[k] = peek(p)
    k++
    p++
  }
  return k
}

function kindName(t: u16): u16 {
  switch (t) {
    case KIND_LINE:
      return str('LINE')
    case KIND_QUAD:
      return str('QUAD')
    case KIND_EXP:
      return str('EXP')
    case KIND_LOG:
      return str('LOG')
    case KIND_PWR:
      return str('PWR')
    case KIND_INV:
      return str('INV')
  }
  return str('1-VAR')
}

const countChars = bytes(8)

/** n=12 for the band's right. */
function countText(): void {
  const n = peek16(STATS_COUNT)
  countChars[0] = 0x6e
  countChars[1] = 0x3d
  let i: u16 = 2
  if (n >= 10) {
    countChars[i] = 0x30 + (n >= 40 ? 4 : n >= 30 ? 3 : n >= 20 ? 2 : 1)
    i++
  }
  countChars[i] = 0x30 + (n % 10)
  countChars[i + 1] = 0
}

function drawType(): void {
  band(str('STATS'))
  textAt(str('1:1-VAR 2:LINE'), 1, lineY(0))
  textAt(str('3:QUAD 4:EXP 5:LOG'), 1, lineY(1))
  textAt(str('6:PWR 7:INV'), 1, lineY(2))
  textAt(str('8:FREQ'), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
  markKind(statKind())
  if (peek(STATS_FREQ) !== 0) mark(0, 6, 3)
}

/** The kind chosen, marked where its item is on the screen. */
function markKind(t: u16): void {
  switch (t) {
    case KIND_1VAR:
      mark(0, 7, 0)
      return
    case KIND_LINE:
      mark(8, 6, 0)
      return
    case KIND_QUAD:
      mark(0, 6, 1)
      return
    case KIND_EXP:
      mark(7, 5, 1)
      return
    case KIND_LOG:
      mark(13, 5, 1)
      return
    case KIND_PWR:
      mark(0, 5, 2)
      return
  }
  mark(6, 5, 2)
}

function drawFunc(): void {
  band(str('FUNC'))
  textAt(str('1:INSERT ROW'), 1, lineY(0))
  textAt(str('2:DELETE ROW'), 1, lineY(1))
  textAt(str('3:CLEAR ALL'), 1, lineY(2))
  textAt(str('4:KIND'), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
}

/* ---------------- the results ---------------- */

/*
 * The data's sums and results, then the fit's sums (on the data made straight), the
 * quadratic's, work: 8-byte numbers each in STATS_WORK (e16c's own RAM is full), a byte each
 * after them saying whether it has a value (s with one value, r with no spread: shown as -).
 */
const S_N = 0
const S_X = 1
const S_XX = 2
const S_Y = 3
const S_YY = 4
const S_XY = 5
const R_MX = 6
const R_SDX = 7
const R_SX = 8
const R_MY = 9
const R_SDY = 10
const R_SY = 11
const R_R = 12
const R_A = 13
const R_B = 14
const R_C = 15
const F_U = 16
const F_V = 18
const F_MU = 21
const F_MV = 22
const Q_X3 = 23
const Q_X4 = 24
const Q_X2Y = 25
const T1 = 26
const T2 = 27
const T3 = 28
const FREQ = 29
const U = 30
const V = 31
/** The quadratic's normal equations, 3 rows of 4. */
const QM = 32
/** Squares and products about the means (aboutMeans): x, y, and the fit's u and v. */
const C_XX = 44
const C_YY = 45
const C_UU = 46
const C_VV = 47
const C_UV = 48
const SLOTS = 49

function at(k: u16): u16 {
  return STATS_WORK + k * 8
}

function isValid(k: u16): bool {
  return peek(STATS_WORK + SLOTS * 8 + k) !== 0
}

function setValid(k: u16, yes: bool): void {
  poke(STATS_WORK + SLOTS * 8 + k, yes ? 1 : 0)
}

/** dst = a op b. */
function sop(op: u16, dst: u16, a: u16, b: u16): void {
  copy8(at(a), at(dst))
  math(op, at(dst), at(b), 0)
}

function zero(k: u16): void {
  for (let i: u16 = 0; i < 8; i++) poke(at(k) + i, 0)
}

function setWhole(k: u16, v: u16): void {
  wholeInto(at(k), v)
}

/** The sums over the rows, then everything from them. */
function workOut(): void {
  for (let k: u16 = 0; k < SLOTS; k++) {
    zero(k)
    setValid(k, true)
  }
  const n = peek16(STATS_COUNT)
  for (let r: u16 = 0; r < n; r++) addRow(STATS_DATA + r * 24)
  setValid(R_C, false)
  if (isZero(at(S_N)) || isNegative(at(S_N))) {
    means(R_MX)
    if (twoVar()) {
      means(R_MY)
      fitLine()
    }
    return
  }
  sop(M_DIV, R_MX, S_X, S_N)
  sop(M_DIV, R_MY, S_Y, S_N)
  sop(M_DIV, F_MU, F_U, S_N)
  sop(M_DIV, F_MV, F_V, S_N)
  for (let r: u16 = 0; r < n; r++) aboutMeans(STATS_DATA + r * 24)
  means(R_MX)
  if (!twoVar()) return
  means(R_MY)
  if (statKind() === KIND_QUAD) fitQuadratic()
  else fitLine()
}

/** The row's weight into FREQ: its FREQ, 1 without the column. */
function weightOf(row: u16): void {
  if (peek(STATS_FREQ) !== 0) copy8(row + 16, at(FREQ))
  else setWhole(FREQ, 1)
}

/**
 * A second pass over a row: f(x - x̄)², f(y - ȳ)² and the fit's f(u - ū)², f(v - v̄)², f(u - ū)(v - v̄).
 * Σx² - n x̄² from the first pass loses the digits two close values share (100001, 100002,
 * 100003 came to σ = 0.837 for 0.8165); about the means nothing is lost.
 */
function aboutMeans(row: u16): void {
  weightOf(row)
  copy8(row, at(T1))
  math(M_SUB, at(T1), at(R_MX), 0)
  squared(T1, T1, C_XX)
  if (!twoVar()) return
  copy8(row + 8, at(T1))
  math(M_SUB, at(T1), at(R_MY), 0)
  squared(T1, T1, C_YY)
  uvOf(row)
  math(M_SUB, at(U), at(F_MU), 0)
  math(M_SUB, at(V), at(F_MV), 0)
  squared(U, U, C_UU)
  squared(V, V, C_VV)
  squared(U, V, C_UV)
}

/** f x a x b added to the slot `sum`. */
function squared(a: u16, b: u16, sum: u16): void {
  sop(M_MUL, T2, a, b)
  math(M_MUL, at(T2), at(FREQ), 0)
  math(M_ADD, at(sum), at(T2), 0)
}

/** One row into the sums, weighted by its FREQ (1 without the column). */
function addRow(row: u16): void {
  weightOf(row)
  math(M_ADD, at(S_N), at(FREQ), 0)
  addWeighted(row, S_X)
  copy8(row, at(T1))
  math(M_MUL, at(T1), row, 0)
  addWeighted(at(T1), S_XX)
  addWeighted(row + 8, S_Y)
  copy8(row + 8, at(T1))
  math(M_MUL, at(T1), row + 8, 0)
  addWeighted(at(T1), S_YY)
  copy8(row, at(T1))
  math(M_MUL, at(T1), row + 8, 0)
  addWeighted(at(T1), S_XY)
  if (twoVar()) fitRow(row)
}

/** f x `v` added to the sum in slot `sum`. */
function addWeighted(v: u16, sum: u16): void {
  copy8(v, at(T2))
  math(M_MUL, at(T2), at(FREQ), 0)
  math(M_ADD, at(sum), at(T2), 0)
}

/**
 * The row made straight for the fit - u = x, ln x or 1/x; v = y or ln y - into Σu and Σv; for
 * the quadratic, Σx³, Σx⁴ and Σx²y as well.
 */
function fitRow(row: u16): void {
  const t = statKind()
  uvOf(row)
  addWeighted(at(U), F_U)
  addWeighted(at(V), F_V)
  if (t === KIND_QUAD) quadRow(row)
}

/** The row made straight for the fit, into U and V: u = x, ln x or 1/x; v = y or ln y. */
function uvOf(row: u16): void {
  const t = statKind()
  copy8(row, at(U))
  copy8(row + 8, at(V))
  if (t === KIND_LOG || t === KIND_PWR) math(M_LN, at(U), 0, 0)
  if (t === KIND_INV) {
    setWhole(T3, 1)
    math(M_DIV, at(T3), at(U), 0)
    copy8(at(T3), at(U))
  }
  if (t === KIND_EXP || t === KIND_PWR) math(M_LN, at(V), 0, 0)
}

function quadRow(row: u16): void {
  copy8(row, at(T1))
  math(M_MUL, at(T1), row, 0)
  math(M_MUL, at(T1), row, 0)
  addWeighted(at(T1), Q_X3)
  math(M_MUL, at(T1), row, 0)
  addWeighted(at(T1), Q_X4)
  copy8(row, at(T1))
  math(M_MUL, at(T1), row, 0)
  math(M_MUL, at(T1), row + 8, 0)
  addWeighted(at(T1), Q_X2Y)
}

/**
 * A variable's σ and s (its mean worked out already) from its squares about the mean:
 * σ² = Σf(x - x̄)²/n, s² = σ² n/(n-1).
 */
function means(mean: u16): void {
  // σ and s follow the mean (R_SDX, R_SX after R_MX; R_SDY, R_SY after R_MY).
  const sd = mean + 1
  const sample = mean + 2
  if (isZero(at(S_N)) || isNegative(at(S_N))) {
    setValid(mean, false)
    setValid(sd, false)
    setValid(sample, false)
    return
  }
  sop(M_DIV, T1, mean === R_MX ? C_XX : C_YY, S_N)
  sop(M_SQR, sd, T1, T1)
  // s: σ² x n / (n - 1), only for more than one value.
  copy8(at(S_N), at(T2))
  setWhole(T3, 1)
  math(M_SUB, at(T2), at(T3), 0)
  if (isZero(at(T2)) || isNegative(at(T2))) {
    setValid(sample, false)
    return
  }
  math(M_MUL, at(T1), at(S_N), 0)
  math(M_DIV, at(T1), at(T2), 0)
  sop(M_SQR, sample, T1, T1)
}

/**
 * The line v = a + bu by least squares on the squares about the means: Suv = Σ(u - ū)(v - v̄),
 * Suu = Σ(u - ū)²,
 * b = Suv / Suu, a = v̄ - b ū, r = Suv / √(Suu Svv); a is e^a where v was ln y.
 */
function fitLine(): void {
  if (isZero(at(S_N))) {
    setValid(R_R, false)
    setValid(R_A, false)
    setValid(R_B, false)
    return
  }
  copy8(at(C_UV), at(T1))
  copy8(at(C_UU), at(T2))
  copy8(at(C_VV), at(T3))
  if (isZero(at(T2))) {
    setValid(R_B, false)
    setValid(R_A, false)
  } else {
    sop(M_DIV, R_B, T1, T2)
    sop(M_MUL, FREQ, R_B, F_MU)
    sop(M_SUB, R_A, F_MV, FREQ)
    const t = statKind()
    if (t === KIND_EXP || t === KIND_PWR) math(M_EXP, at(R_A), 0, 0)
  }
  math(M_MUL, at(T2), at(T3), 0)
  if (isZero(at(T2)) || isNegative(at(T2))) {
    setValid(R_R, false)
    return
  }
  math(M_SQR, at(T2), 0, 0)
  sop(M_DIV, R_R, T1, T2)
}

/** The quadratic's cell (row r, column c) of its normal equations. */
function qcell(r: u16, c: u16): u16 {
  return QM + r * 4 + c
}

/**
 * y = a + bx + cx² by least squares: the normal equations
 * [n Σx Σx²; Σx Σx² Σx³; Σx² Σx³ Σx⁴] (a b c) = (Σy Σxy Σx²y) solved by elimination. r has no
 * value for it.
 */
function fitQuadratic(): void {
  setValid(R_R, false)
  copy8(at(S_N), at(qcell(0, 0)))
  copy8(at(S_X), at(qcell(0, 1)))
  copy8(at(S_XX), at(qcell(0, 2)))
  copy8(at(S_Y), at(qcell(0, 3)))
  copy8(at(S_X), at(qcell(1, 0)))
  copy8(at(S_XX), at(qcell(1, 1)))
  copy8(at(Q_X3), at(qcell(1, 2)))
  copy8(at(S_XY), at(qcell(1, 3)))
  copy8(at(S_XX), at(qcell(2, 0)))
  copy8(at(Q_X3), at(qcell(2, 1)))
  copy8(at(Q_X4), at(qcell(2, 2)))
  copy8(at(Q_X2Y), at(qcell(2, 3)))
  for (let k: u16 = 0; k < 3; k++) {
    if (isZero(at(qcell(k, k)))) {
      setValid(R_A, false)
      setValid(R_B, false)
      return
    }
    for (let i = k + 1; i < 3; i++) clearBelow(i, k)
  }
  for (let i: u16 = 3; i > 0; i--) quadBack(i - 1)
  setValid(R_C, true)
}

/** Row i less row k times what clears column k. */
function clearBelow(i: u16, k: u16): void {
  sop(M_DIV, T3, qcell(i, k), qcell(k, k))
  for (let c = k; c < 4; c++) {
    sop(M_MUL, T1, qcell(k, c), T3)
    math(M_SUB, at(qcell(i, c)), at(T1), 0)
  }
}

/** The quadratic's coefficient i (a, b, c) from the bottom up. */
function quadBack(i: u16): void {
  copy8(at(qcell(i, 3)), at(T2))
  for (let j = i + 1; j < 3; j++) {
    sop(M_MUL, T1, qcell(i, j), R_A + j)
    math(M_SUB, at(T2), at(T1), 0)
  }
  math(M_DIV, at(T2), at(qcell(i, i)), 0)
  copy8(at(T2), at(R_A + i))
}

/* ---------------- the results on screen ---------------- */

function drawResults(): void {
  const pages: u16 = twoVar() ? 3 : 1
  let arrow: u16 = 0
  if (resultPage + 1 < pages) arrow = str('\x8e')
  else if (resultPage > 0) arrow = str('\x8d')
  bandWith(kindTitle(0, str(' RESULT')), arrow)
  for (let i: u16 = 0; i < 6; i++) {
    const item = itemOf(resultPage, i)
    if (item !== 0xffff) resultLine(item, i)
  }
}

/** The result on line `n` of page `page`, by its slot; 0xffff for none there. */
function itemOf(page: u16, n: u16): u16 {
  if (!twoVar()) return page === 0 ? pick1(n) : 0xffff
  if (page === 0) return pick2(n)
  if (page === 1) return n < 5 ? pickSpread(n) : 0xffff
  return n < 5 ? S_X + pickSum(n) : 0xffff
}

function pick1(n: u16): u16 {
  switch (n) {
    case 0:
      return S_N
    case 1:
      return R_MX
    case 2:
      return R_SDX
    case 3:
      return R_SX
    case 4:
      return S_X
  }
  return S_XX
}

/** Two variables, page 1: n, the means, r, a, b. */
function pick2(n: u16): u16 {
  switch (n) {
    case 0:
      return S_N
    case 1:
      return R_MX
    case 2:
      return R_MY
    case 3:
      return R_R
    case 4:
      return R_A
  }
  return R_B
}

/** Page 2: c, then σ and s of x and y. */
function pickSpread(n: u16): u16 {
  switch (n) {
    case 0:
      return R_C
    case 1:
      return R_SDX
    case 2:
      return R_SX
    case 3:
      return R_SDY
  }
  return R_SY
}

/** Page 3: Σx Σx² Σy Σy² Σxy, slots S_X on in order. */
function pickSum(n: u16): u16 {
  return n
}

function resultLine(item: u16, row: u16): void {
  textAt(nameOf(item), 1, lineY(row))
  if (!isValid(item)) textRight(str('-'), lineY(row))
  else textRight(textOf(at(item)), lineY(row))
}

/** A result's name and its =: x̄ is 95, ȳ 96, σ 91, Σ 90, ² 84. */
function nameOf(item: u16): u16 {
  switch (item) {
    case S_N:
      return str('n=')
    case R_MX:
      return str('\x95=')
    case R_MY:
      return str('\x96=')
    case R_SDX:
      return str('\x91x=')
    case R_SX:
      return str('sx=')
    case R_SDY:
      return str('\x91y=')
    case R_SY:
      return str('sy=')
    case S_X:
      return str('\x90x=')
    case S_XX:
      return str('\x90x\x84=')
    case S_Y:
      return str('\x90y=')
    case S_YY:
      return str('\x90y\x84=')
    case S_XY:
      return str('\x90xy=')
    case R_R:
      return str('r=')
    case R_A:
      return str('a=')
    case R_C:
      return str('c=')
  }
  return str('b=')
}

/* ---------------- the results in a line ---------------- */

/**
 * STATS' result `k` (tokens.e16.ts statIndex: n x̄ σx sx ȳ σy sy Σx Σx² Σy Σy² Σxy r a b c)
 * into the number at `dst`, worked out from the table now. MATH with no rows, for one with no
 * value, or for one of y's from one variable.
 */
export function statValue(k: u16, dst: u16): void {
  const item = statItem(k)
  const ofY =
    item === R_MY || item === R_SDY || item === R_SY || (item >= S_Y && item <= S_XY) || item >= R_R
  if (peek16(STATS_COUNT) === 0 || (ofY && !twoVar())) fail(E_MATH, 0)
  workOut()
  if (!isValid(item)) fail(E_MATH, 0)
  copy8(at(item), dst)
}

function statItem(k: u16): u16 {
  switch (k) {
    case 0:
      return S_N
    case 1:
      return R_MX
    case 2:
      return R_SDX
    case 3:
      return R_SX
    case 4:
      return R_MY
    case 5:
      return R_SDY
    case 6:
      return R_SY
    case 7:
      return S_X
    case 8:
      return S_XX
    case 9:
      return S_Y
    case 10:
      return S_YY
    case 11:
      return S_XY
    case 12:
      return R_R
    case 13:
      return R_A
    case 15:
      return R_C
  }
  return R_B
}

/** Which estimate: y′(x), x′(y), and the quadratic's other x, x₂′(y). */
export const EST_Y = 0
export const EST_X = 1
export const EST_X2 = 2

/**
 * An estimate on the curve STATS fits, of the number at `v`, in place: y′ = a + bx,
 * a + bx + cx², a·e^(bx), a + b·ln x, a·x^b, a + b/x; x′ the other way round (the quadratic's
 * two: (-b ± √(b² - 4c(a - y))) / 2c, + first). MATH with no fit, or x₂′ of another curve.
 */
export function statEstimate(which: u16, v: u16): void {
  const t = statKind()
  if (peek16(STATS_COUNT) === 0 || t === KIND_1VAR) fail(E_MATH, 0)
  workOut()
  if (!isValid(R_A) || !isValid(R_B)) fail(E_MATH, 0)
  copy8(v, at(U))
  if (t === KIND_QUAD) quadEstimate(which)
  else if (which === EST_X2) fail(E_MATH, 0)
  else if (which === EST_Y) yOf(t)
  else xOf(t)
  copy8(at(U), v)
}

/** y′ of x in U, into U. */
function yOf(t: u16): void {
  if (t === KIND_LOG) math(M_LN, at(U), 0, 0)
  if (t === KIND_INV) {
    setWhole(T1, 1)
    math(M_DIV, at(T1), at(U), 0)
    copy8(at(T1), at(U))
  }
  if (t === KIND_PWR) {
    copy8(at(U), at(T1))
    copy8(at(R_B), at(U))
    math(M_POW, at(T1), at(U), 0)
    sop(M_MUL, U, T1, R_A)
    return
  }
  math(M_MUL, at(U), at(R_B), 0)
  if (t === KIND_EXP) {
    math(M_EXP, at(U), 0, 0)
    math(M_MUL, at(U), at(R_A), 0)
  } else math(M_ADD, at(U), at(R_A), 0)
}

/** x′ of y in U, into U. */
function xOf(t: u16): void {
  if (t === KIND_EXP || t === KIND_PWR) {
    math(M_DIV, at(U), at(R_A), 0)
    if (t === KIND_EXP) {
      math(M_LN, at(U), 0, 0)
      math(M_DIV, at(U), at(R_B), 0)
    } else {
      setWhole(T1, 1)
      math(M_DIV, at(T1), at(R_B), 0)
      math(M_POW, at(U), at(T1), 0)
    }
    return
  }
  math(M_SUB, at(U), at(R_A), 0)
  if (t === KIND_INV) {
    copy8(at(R_B), at(T1))
    math(M_DIV, at(T1), at(U), 0)
    copy8(at(T1), at(U))
    return
  }
  math(M_DIV, at(U), at(R_B), 0)
  if (t === KIND_LOG) math(M_EXP, at(U), 0, 0)
}

/** The quadratic's y′ (a + bx + cx²) or x′, x₂′ (the roots of cx² + bx + a - y = 0). */
function quadEstimate(which: u16): void {
  if (which === EST_Y) {
    sop(M_MUL, T1, U, R_C)
    math(M_ADD, at(T1), at(R_B), 0)
    math(M_MUL, at(T1), at(U), 0)
    math(M_ADD, at(T1), at(R_A), 0)
    copy8(at(T1), at(U))
    return
  }
  if (isZero(at(R_C))) fail(E_MATH, 0)
  // D = b² - 4c(a - y).
  sop(M_SUB, T1, R_A, U)
  math(M_MUL, at(T1), at(R_C), 0)
  setWhole(T2, 4)
  math(M_MUL, at(T1), at(T2), 0)
  sop(M_MUL, T2, R_B, R_B)
  math(M_SUB, at(T2), at(T1), 0)
  math(M_SQR, at(T2), 0, 0)
  copy8(at(R_B), at(U))
  math(M_NEG, at(U), 0, 0)
  if (which === EST_X) math(M_ADD, at(U), at(T2), 0)
  else math(M_SUB, at(U), at(T2), 0)
  sop(M_ADD, T1, R_C, R_C)
  math(M_DIV, at(U), at(T1), 0)
}

/* ---------------- the normal distribution (section 15.5) ---------------- */

/** |t|, the area from 0 to it, the tail past it, and numbers worked with. */
const distAt = bytes(8)
const distArea = bytes(8)
const distTail = bytes(8)
const distTerm = bytes(8)
const distWork = bytes(8)
const distPi = bytes(8)

/**
 * nlow( nmid( nup( (`f`) of the value at `x`, into it: the standard normal distribution's
 * probabilities below t, from 0 to t and above t. The smaller of the area from 0 to |t| and the
 * tail past it is worked out directly (a series below 2, a continued fraction from 2) and the
 * other from 1/2, so a small tail keeps its digits.
 */
export function normal(f: u16, x: u16, at: u16): void {
  const negative = isNegative(x)
  copy8(x, addr(distAt))
  if (negative) math(M_NEG, addr(distAt), 0, at)
  wholeInto(addr(distWork), 2)
  const series = smaller(addr(distAt), addr(distWork))
  wholeInto(addr(distWork), 21)
  // Past 21 the tail is under 10⁻⁹⁹, the unit's least.
  if (!smaller(addr(distAt), addr(distWork))) wholeInto(addr(distTail), 0)
  else if (series) distSeries(at)
  else distFraction(at)
  if (series) {
    halfInto(addr(distTail))
    math(M_SUB, addr(distTail), addr(distArea), at)
  } else {
    halfInto(addr(distArea))
    math(M_SUB, addr(distArea), addr(distTail), at)
  }
  if (f === T_NMID) {
    copy8(addr(distArea), x)
    if (negative) math(M_NEG, x, 0, at)
  } else if ((f === T_NUP) !== negative) copy8(addr(distTail), x)
  else {
    halfInto(x)
    math(M_ADD, x, addr(distArea), at)
  }
}

/** a < b, two numbers. */
function smaller(a: u16, b: u16): bool {
  math(M_CMP, a, b, 0)
  return i16(peek16(MATH_RESULT)) < 0
}

function halfInto(v: u16): void {
  wholeInto(v, 1)
  wholeInto(addr(distTerm), 2)
  math(M_DIV, v, addr(distTerm), 0)
}

/** φ(|t|) = e^(-t²/2) / √(2π) into distWork. */
function density(at: u16): void {
  copy8(addr(distAt), addr(distWork))
  math(M_MUL, addr(distWork), addr(distAt), at)
  wholeInto(addr(distTerm), 2)
  math(M_DIV, addr(distWork), addr(distTerm), at)
  math(M_NEG, addr(distWork), 0, at)
  math(M_EXP, addr(distWork), 0, at)
  math(M_PI, addr(distPi), 0, at)
  math(M_MUL, addr(distPi), addr(distTerm), at)
  math(M_SQR, addr(distPi), 0, at)
  math(M_DIV, addr(distWork), addr(distPi), at)
}

/** 0 to |t| below 2: φ(t)(t + t³/3 + t⁵/(3·5) + ...), every term positive, until it adds nothing. */
function distSeries(at: u16): void {
  copy8(addr(distAt), addr(distArea))
  copy8(addr(distAt), addr(distTail))
  for (let n: u16 = 1; n < 80; n++) {
    math(M_MUL, addr(distTail), addr(distAt), at)
    math(M_MUL, addr(distTail), addr(distAt), at)
    wholeInto(addr(distTerm), 2 * n + 1)
    math(M_DIV, addr(distTail), addr(distTerm), at)
    copy8(addr(distArea), addr(distTerm))
    math(M_ADD, addr(distArea), addr(distTail), at)
    math(M_CMP, addr(distArea), addr(distTerm), 0)
    if (peek16(MATH_RESULT) === 0) break
  }
  density(at)
  math(M_MUL, addr(distArea), addr(distWork), at)
}

/** The tail past |t| from 2: φ(t) / (t + 1/(t + 2/(t + 3/(t + ...)))), 80 deep from the end. */
function distFraction(at: u16): void {
  copy8(addr(distAt), addr(distTail))
  for (let k: u16 = 80; k > 0; k--) {
    wholeInto(addr(distTerm), k)
    math(M_DIV, addr(distTerm), addr(distTail), at)
    copy8(addr(distAt), addr(distTail))
    math(M_ADD, addr(distTail), addr(distTerm), at)
  }
  density(at)
  math(M_DIV, addr(distWork), addr(distTail), at)
  copy8(addr(distWork), addr(distTail))
}

/** x→z: (x - x̄) / σx by STATS' table, at `v`; MATH without data or with σx 0. */
export function standardized(v: u16, at: u16): void {
  statValue(1, addr(distWork))
  math(M_SUB, v, addr(distWork), at)
  statValue(2, addr(distWork))
  if (isZero(addr(distWork))) fail(E_MATH, at)
  math(M_DIV, v, addr(distWork), at)
  inexact(v)
}
