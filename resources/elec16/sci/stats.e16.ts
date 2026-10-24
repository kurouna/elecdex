// ELEC-16 SCI, ROM bank 7: STATS (docs/elec16-sci.md sections 6.6 and 6.8). One variable or
// two (the straight line y = a + bx), a FREQ column if wanted; the data typed into the grid
// (grid.e16.ts) and kept when the power goes; = with nothing typed works out the results -
// n, the means, both standard deviations (σ of the population, s of a sample), the sums, and
// for two variables r, a and b - shown six a page.
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
import { K_1, K_2, K_3, K_4, K_AC, K_DOWN, K_FUNC, K_UP, refuse } from './calc.e16'
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
  isNegative,
  isZero,
  M_ADD,
  M_DIV,
  M_FROMINT,
  M_MUL,
  M_SQR,
  M_SUB,
  MATH_ARG,
  math,
  STATS_COUNT,
  STATS_DATA,
  STATS_FREQ,
  STATS_TYPE,
} from './numbers.e16'

/** What STATS shows: its kind chosen, the grid, FUNC's row menu, the results. */
const PH_TYPE = 0
const PH_GRID = 1
const PH_FUNC = 2
const PH_RESULT = 3
let phase: u16 = PH_TYPE
let resultPage: u16 = 0

/** STATS chosen from MENU: its kind first, the one it was marked. */
export function statsStart(): void {
  phase = PH_TYPE
}

/** AC or ON from an error: back to the grid. */
export function statsReset(): void {
  phase = PH_GRID
  gridOpen(GRID_STATS, 0, 0)
}

function twoVar(): bool {
  return peek(STATS_TYPE) === 1
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

/** 1 one variable, 2 two, 3 FREQ on or off; AC back to the grid. */
function typeKey(k: u16): void {
  if (k === K_1 || k === K_2) {
    poke(STATS_TYPE, k === K_1 ? 0 : 1)
    statsReset()
  } else if (k === K_3) poke(STATS_FREQ, peek(STATS_FREQ) === 0 ? 1 : 0)
  else if (k === K_AC) statsReset()
  else refuse()
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
    bandWith(twoVar() ? str('STATS 2-VAR') : str('STATS 1-VAR'), addr(countChars))
    gridDraw()
  }
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
  textAt(str('1:1-VAR  2:2-VAR'), 1, lineY(0))
  textAt(str('3:FREQ'), 1, lineY(1))
  textAt(str('AC:BACK'), 1, lineY(5))
  if (twoVar()) mark(9, 7, 0)
  else mark(0, 7, 0)
  if (peek(STATS_FREQ) !== 0) mark(0, 6, 1)
}

function drawFunc(): void {
  band(str('FUNC'))
  textAt(str('1:INSERT ROW'), 1, lineY(0))
  textAt(str('2:DELETE ROW'), 1, lineY(1))
  textAt(str('3:CLEAR ALL'), 1, lineY(2))
  textAt(str('4:1-VAR/2-VAR'), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
}

/* ---------------- the results ---------------- */

/*
 * The sums, then the results, 8-byte numbers each (R_* their places); a result that has no
 * value (s with one value, r with no spread) is shown as -.
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
const T1 = 15
const T2 = 16
const T3 = 17
const FREQ = 18
const values = bytes(152)
const valid = bytes(19)

function at(k: u16): u16 {
  return addr(values) + k * 8
}

/** dst = a op b. */
function sop(op: u16, dst: u16, a: u16, b: u16): void {
  copy8(at(a), at(dst))
  math(op, at(dst), at(b), 0)
}

function zero(k: u16): void {
  for (let i: u16 = 0; i < 8; i++) poke(at(k) + i, 0)
}

/** The sums over the rows, then everything from them. */
function workOut(): void {
  for (let k: u16 = 0; k < 19; k++) {
    zero(k)
    valid[k] = 1
  }
  const n = peek16(STATS_COUNT)
  for (let r: u16 = 0; r < n; r++) addRow(STATS_DATA + r * 24)
  means(S_X, S_XX, R_MX)
  if (twoVar()) {
    means(S_Y, S_YY, R_MY)
    fitLine()
  }
}

/** One row into the sums, weighted by its FREQ (1 without the column). */
function addRow(row: u16): void {
  if (peek(STATS_FREQ) !== 0) copy8(row + 16, at(FREQ))
  else {
    poke16(MATH_ARG, 1)
    math(M_FROMINT, at(FREQ), 0, 0)
  }
  math(M_ADD, at(S_N), at(FREQ), 0)
  copy8(row, at(T1))
  math(M_MUL, at(T1), at(FREQ), 0)
  math(M_ADD, at(S_X), at(T1), 0)
  math(M_MUL, at(T1), row, 0)
  math(M_ADD, at(S_XX), at(T1), 0)
  copy8(row + 8, at(T2))
  math(M_MUL, at(T2), at(FREQ), 0)
  math(M_ADD, at(S_Y), at(T2), 0)
  copy8(at(T2), at(T3))
  math(M_MUL, at(T2), row + 8, 0)
  math(M_ADD, at(S_YY), at(T2), 0)
  math(M_MUL, at(T3), row, 0)
  math(M_ADD, at(S_XY), at(T3), 0)
}

/**
 * A variable's mean, σ and s from its sum and sum of squares: σ² = Σx²/n - x̄², s² = σ² n/(n-1).
 * A σ² rounding has put below 0 is 0.
 */
function means(sum: u16, squares: u16, mean: u16): void {
  // σ and s follow the mean in `values` (R_SDX, R_SX after R_MX; R_SDY, R_SY after R_MY).
  const sd = mean + 1
  const sample = mean + 2
  if (isZero(at(S_N)) || isNegative(at(S_N))) {
    valid[mean] = 0
    valid[sd] = 0
    valid[sample] = 0
    return
  }
  sop(M_DIV, mean, sum, S_N)
  sop(M_DIV, T1, squares, S_N)
  sop(M_MUL, T2, mean, mean)
  math(M_SUB, at(T1), at(T2), 0)
  if (isNegative(at(T1))) zero(T1)
  sop(M_SQR, sd, T1, T1)
  // s: σ² x n / (n - 1), only for more than one value.
  copy8(at(S_N), at(T2))
  poke16(MATH_ARG, 1)
  math(M_FROMINT, at(T3), 0, 0)
  math(M_SUB, at(T2), at(T3), 0)
  if (isZero(at(T2)) || isNegative(at(T2))) {
    valid[sample] = 0
    return
  }
  math(M_MUL, at(T1), at(S_N), 0)
  math(M_DIV, at(T1), at(T2), 0)
  sop(M_SQR, sample, T1, T1)
}

/**
 * The line y = a + bx by least squares: Sxy = Σxy - n x̄ ȳ, Sxx = Σx² - n x̄², b = Sxy / Sxx,
 * a = ȳ - b x̄, r = Sxy / √(Sxx Syy).
 */
function fitLine(): void {
  if (valid[R_MX] === 0) {
    valid[R_R] = 0
    valid[R_A] = 0
    valid[R_B] = 0
    return
  }
  spread(S_XY, R_MX, R_MY, T1)
  spread(S_XX, R_MX, R_MX, T2)
  spread(S_YY, R_MY, R_MY, T3)
  if (isZero(at(T2))) {
    valid[R_B] = 0
    valid[R_A] = 0
  } else {
    sop(M_DIV, R_B, T1, T2)
    sop(M_MUL, FREQ, R_B, R_MX)
    sop(M_SUB, R_A, R_MY, FREQ)
  }
  math(M_MUL, at(T2), at(T3), 0)
  if (isZero(at(T2)) || isNegative(at(T2))) {
    valid[R_R] = 0
    return
  }
  math(M_SQR, at(T2), 0, 0)
  sop(M_DIV, R_R, T1, T2)
}

/** Into `dst`: the sum `sums` less n x mean1 x mean2. */
function spread(sums: u16, mean1: u16, mean2: u16, dst: u16): void {
  sop(M_MUL, dst, mean1, mean2)
  math(M_MUL, at(dst), at(S_N), 0)
  copy8(at(sums), at(FREQ))
  math(M_SUB, at(FREQ), at(dst), 0)
  copy8(at(FREQ), at(dst))
}

/* ---------------- the results on screen ---------------- */

function drawResults(): void {
  const pages: u16 = twoVar() ? 3 : 1
  let arrow: u16 = 0
  if (resultPage + 1 < pages) arrow = str('\x8e')
  else if (resultPage > 0) arrow = str('\x8d')
  bandWith(twoVar() ? str('2-VAR RESULT') : str('1-VAR RESULT'), arrow)
  for (let i: u16 = 0; i < 6; i++) {
    const item = itemOf(resultPage * 6 + i)
    if (item !== 0xffff) resultLine(item, i)
  }
}

/** The result on the `n`th line of the list, by its place in `values`; 0xffff past the end. */
function itemOf(n: u16): u16 {
  if (!twoVar()) return n < 6 ? pick1(n) : 0xffff
  return n < 15 ? pick2(n) : 0xffff
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

/** Two variables: n, the means, r, a, b; then σ and s; then the sums. */
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
    case 5:
      return R_B
    case 6:
      return R_SDX
    case 7:
      return R_SX
    case 8:
      return R_SDY
    case 9:
      return R_SY
    case 10:
      return S_X
    case 11:
      return S_XX
    case 12:
      return S_Y
    case 13:
      return S_YY
  }
  return S_XY
}

function resultLine(item: u16, row: u16): void {
  textAt(nameOf(item), 1, lineY(row))
  if (valid[item] === 0) textRight(str('-'), lineY(row))
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
  }
  return str('b=')
}
