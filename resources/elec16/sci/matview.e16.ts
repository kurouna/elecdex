// ELEC-16 SCI, ROM bank 4: MATRIX's EDIT, its FUNC and its own screens (docs/elec16-sci.md
// section 14.7) - a matrix sized and filled on the grid, an answer shown on it - apart from its
// evaluation (matrix.e16.ts, in the grid's bank).

import { addr, type bool, bytes, poke, str, type u16 } from '../../../src/shared/e16c/builtins'
import { K_AC, K_DOWN, K_EQ, K_UP, refuse } from './calc.e16'
import { GRID_STAY, gridDraw, gridKey, gridOpenMatrix } from './grid.e16'
import { digitOf } from './keymap.e16'
import { bandWith, cls, lineY, textAt } from './lcd.e16'
import { el, matrixAnswer, matrixAt, mCols, mRows } from './matrix.e16'
import { wholeInto } from './numbers.e16'
import { T_DET, T_MAT } from './tokens.e16'

/* ---------------- EDIT, the grid and the screen ---------------- */

export const MAT_LINE = 0
const MAT_DIMS = 1
const MAT_GRID = 2
let matNow: u16 = MAT_LINE
/** The matrix on the grid or being sized (0-4), and the rows asked for (0: not yet). */
let editing: u16 = 0
let rowsAsked: u16 = 0

export function matPhase(): u16 {
  return matNow
}

/** MATRIX entered: its line. */
export function matStart(): void {
  matNow = MAT_LINE
}

/** Whether the answer on screen is a matrix (MatAns), for the line's screen. */
export function matAnswered(): bool {
  return matrixAnswer
}

export function openGrid(k: u16): void {
  editing = k
  const m = matrixAt(k)
  gridOpenMatrix(m, mRows(m), mCols(m))
  matNow = MAT_GRID
}

/** A key on EDIT's size or on the grid. */
export function matKey(k: u16, shift: bool): void {
  if (matNow === MAT_GRID) {
    if (gridKey(k, shift) !== GRID_STAY) matNow = MAT_LINE
    return
  }
  if (k === K_AC) {
    matNow = MAT_LINE
    return
  }
  const m = matrixAt(editing)
  if (k === K_EQ && rowsAsked === 0 && mRows(m) !== 0) {
    openGrid(editing)
    return
  }
  const d = digitOf(k)
  if (d < 1 || d > 3) {
    refuse()
    return
  }
  if (rowsAsked === 0) {
    rowsAsked = d
    return
  }
  resize(m, rowsAsked, d)
  openGrid(editing)
}

/** `m` made r x c: what both sizes have kept, the rest 0. */
function resize(m: u16, r: u16, c: u16): void {
  for (let i: u16 = 0; i < 3; i++) {
    for (let j: u16 = 0; j < 3; j++) {
      if (i >= r || j >= c || i >= mRows(m) || j >= mCols(m)) wholeInto(el(m, i, j), 0)
    }
  }
  poke(m, r)
  poke(m + 1, c)
}

/** MATRIX's own screens: EDIT's size, or the grid under its matrix's name. */
const sizeText = bytes(2)

export function matDraw(): void {
  bandWith(matName(editing), 0)
  if (matNow === MAT_GRID) {
    gridDraw()
    return
  }
  textAt(str('ROWS? 1-3'), 1, lineY(0))
  if (rowsAsked !== 0) {
    sizeText[0] = 0x30 + rowsAsked
    sizeText[1] = 0
    textAt(addr(sizeText), 49, lineY(0))
    textAt(str('COLS? 1-3'), 1, lineY(1))
  }
  textAt(str('=:AS IT IS AC:BACK'), 1, lineY(5))
}

function matName(k: u16): u16 {
  if (k === 0) return str('MatA')
  if (k === 1) return str('MatB')
  if (k === 2) return str('MatC')
  if (k === 3) return str('MatD')
  return str('MatAns')
}

/** FUNC in MATRIX: the matrices, the functions, EDIT (▼ ▲). */
let matFuncPage: u16 = 0

export function matFuncScreen(): void {
  matFuncPage = 0
  drawMatFunc()
}

function drawMatFunc(): void {
  cls()
  if (matFuncPage === 0) bandWith(str('FUNC'), str('1/3'))
  else if (matFuncPage === 1) bandWith(str('FUNC'), str('2/3'))
  else bandWith(str('FUNC EDIT'), str('3/3'))
  if (matFuncPage === 1) {
    textAt(str('1:det(   2:trn('), 1, lineY(0))
    textAt(str('3:dot(   4:cross('), 1, lineY(1))
    textAt(str('5:angle('), 1, lineY(2))
  } else {
    textAt(str('1:MatA   2:MatB'), 1, lineY(0))
    textAt(str('3:MatC   4:MatD'), 1, lineY(1))
    if (matFuncPage === 0) textAt(str('5:MatAns'), 1, lineY(2))
  }
  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
}

/** A key on MATRIX's FUNC: a token, 1 back, 0 stay, 0xff EDIT begun. */
export function matFuncKey(k: u16): u16 {
  if (k === K_AC) return 1
  if (k === K_DOWN || k === K_UP) {
    turnMatPage(k === K_DOWN)
    return 0
  }
  const d = digitOf(k)
  // Five items a page, four on EDIT's.
  if (d < 1 || d > 5 || (d === 5 && matFuncPage === 2)) {
    refuse()
    return 0
  }
  if (matFuncPage === 0) return T_MAT + d - 1
  if (matFuncPage === 1) return T_DET + d - 1
  editing = d - 1
  rowsAsked = 0
  matNow = MAT_DIMS
  return 0xff
}

function turnMatPage(down: bool): void {
  if (down && matFuncPage < 2) matFuncPage++
  else if (!down && matFuncPage > 0) matFuncPage--
  else refuse()
  drawMatFunc()
}
