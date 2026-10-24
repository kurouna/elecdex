// ELEC-16 SCI, ROM bank 10: TABLE (docs/elec16-sci.md section 6.6). f(X) is typed as CALC's
// line is (calc.e16.ts, kept when the power goes); = asks for START, END and STEP
// (solve.e16.ts's X?), then the table shows X and f(X) for at most 30 rows, five at a time,
// worked out as they come on screen. ▲ ▼ move through it, AC goes back to f(X).

import { addr, type bool, peek16, str, type u16 } from '../../../src/shared/e16c/builtins'
import { K_AC, K_DOWN, K_UP, length, line, refuse } from './calc.e16'
import { evaluate } from './eval.e16'
import { fitNumber, rowNumberAt } from './grid.e16'
import { band, cls, dot, invertBox, lineY, textAt } from './lcd.e16'
import {
  clearStack,
  copyValue,
  E_RANGE,
  fail,
  holdX,
  isNegative,
  isZero,
  M_ADD,
  M_DIV,
  M_IDIV,
  M_MUL,
  M_SUB,
  M_TOINT,
  MATH_ARG,
  math,
  pop,
  push,
  pushInt,
  releaseX,
  TABLE_RANGE,
  top,
  VALUE_SIZE,
  varAt,
} from './numbers.e16'

/** f(X) being typed, START END STEP being asked for, or the table on screen. */
export const TABLE_EDIT = 0
export const TABLE_ASK = 1
export const TABLE_VIEW = 2
let tableNow: u16 = TABLE_EDIT
/** Which of START, END and STEP is asked for. */
let rangeAsked: u16 = 0
/** The rows, the chosen one, the first on screen. */
let rows: u16 = 0
let chosen: u16 = 0
let first: u16 = 0

const VAR_X = 0x58
export function tablePhase(): u16 {
  return tableNow
}

/** TABLE chosen, or AC from the table: f(X) to type. */
export function tableReset(): void {
  tableNow = TABLE_EDIT
}

/** Where START, END or STEP (`k` 0-2) is kept. */
export function rangeAt(k: u16): u16 {
  return TABLE_RANGE + k * VALUE_SIZE
}

/** = on f(X): START asked for first. */
export function tableAskFrom(): void {
  tableNow = TABLE_ASK
  rangeAsked = 0
}

export function tableAsking(): u16 {
  return rangeAsked
}

/** START, END or STEP given: the next asked for (true), or the table worked out (false). */
export function tableNext(): bool {
  rangeAsked++
  if (rangeAsked < 3) return true
  countRows()
  chosen = 0
  first = 0
  tableNow = TABLE_VIEW
  return false
}

/** (END - START) / STEP + 1 rows, whole and 1-30; RANGE otherwise (or STEP 0). */
function countRows(): void {
  if (isZero(rangeAt(2))) fail(E_RANGE, 0)
  clearStack()
  const n = push(0)
  copyValue(rangeAt(1), n)
  math(M_SUB, n, rangeAt(0), 0)
  math(M_DIV, n, rangeAt(2), 0)
  if (isNegative(n)) fail(E_RANGE, 0)
  const one = pushInt(1, 0)
  math(M_IDIV, n, one, 0)
  // A whole number into ARG (OVERFLOW beyond 32767, which is past 30 anyway).
  math(M_TOINT, n, 0, 0)
  const count = peek16(MATH_ARG) + 1
  pop()
  pop()
  if (count > 30) fail(E_RANGE, 0)
  rows = count
}

/** ▲ ▼ through the rows; AC back to f(X). */
export function tableKey(k: u16): void {
  if (k === K_UP && chosen > 0) chosen--
  else if (k === K_DOWN && chosen + 1 < rows) chosen++
  else if (k === K_AC) tableNow = TABLE_EDIT
  else refuse()
}

/* ---------------- drawing ---------------- */

const SPLIT = 58

export function tableDraw(): void {
  cls()
  band(str('TABLE'))
  if (chosen < first) first = chosen
  if (chosen >= first + 5) first = chosen - 4
  textAt(str('X'), 33, lineY(0))
  textAt(str('f(X)'), 81, lineY(0))
  for (let x: u16 = 0; x < 128; x++) dot(x, 19)
  for (let y: u16 = 10; y < 64; y++) {
    dot(13, y)
    dot(SPLIT, y)
  }
  holdX()
  for (let k: u16 = 0; k < 5 && first + k < rows; k++) drawTableRow(first + k, 21 + 9 * k)
  releaseX()
}

/** Row `r`: its number, X, f(X) worked out now, the chosen row's f(X) inverted. */
function drawTableRow(r: u16, y: u16): void {
  rowNumberAt(r + 1, y)
  // X = START + r x STEP.
  clearStack()
  const x = pushInt(r, 0)
  math(M_MUL, x, rangeAt(2), 0)
  math(M_ADD, x, rangeAt(0), 0)
  copyValue(x, varAt(VAR_X))
  fitNumber(x, 13, SPLIT, y)
  clearStack()
  evaluate(addr(line), length)
  fitNumber(top(), SPLIT, 128, y)
  if (r === chosen) invertBox(SPLIT + 1, y - 1, 127, y + 7)
}
