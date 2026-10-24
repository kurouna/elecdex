// ELEC-16 SCI, ROM bank 9: a table of numbers edited cell by cell (docs/elec16-sci.md sections
// 4.5 and 6.8), STATS' data and EQUATION's coefficients. The arrows go from cell to cell, a
// line typed into a cell is evaluated into it by = (or by an arrow), and = with nothing typed
// tells the mode it is done. The frame follows section 4.5: column heads on line 0, a rule
// under them, five rows from row 21, numbers right in their columns, the chosen cell inverted.
import {
  addr,
  type bool,
  bytes,
  div,
  peek,
  peek16,
  poke,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { K_AC, K_DEL, K_DOWN, K_EQ, K_LEFT, K_RIGHT, K_UP, refuse, tokenOf } from './calc.e16'
import { evaluate } from './eval.e16'
import { dot, glyphAt, invertBox, lineY, textAt } from './lcd.e16'
import {
  clearStack,
  copy8,
  copyValue,
  EQN_COEFFS,
  M_FORMAT,
  MATH_ARG,
  math,
  STATS_COUNT,
  STATS_DATA,
  STATS_FREQ,
  STATS_ROWS,
  STATS_TYPE,
  top,
  VALUE_SIZE,
} from './numbers.e16'
import { tokenText } from './tokens.e16'

export const GRID_STATS = 0
export const GRID_EQN = 1
/** What a key on the grid did, for the mode. */
export const GRID_STAY = 0
export const GRID_DONE = 1
export const GRID_AC = 2

/** Which table, its size (EQUATION's fixed; STATS' its rows and one more for a new one). */
let gridKind: u16 = 0
let gridRows: u16 = 0
let gridCols: u16 = 0
/** The chosen cell, and the first row on screen. */
let row: u16 = 0
let col: u16 = 0
let firstRow: u16 = 0
/** What is typed into the chosen cell. */
const cellEntry = bytes(32)
let cellLength: u16 = 0
/** A number's text in a cell. */
const cellText = bytes(24)

const SHOWN_ROWS = 5
/** The column of row numbers: 13 dots, its rule at x = 13. */
const INDEX_WIDTH = 13

/** EQUATION's table of `rows` x `cols` coefficients, or STATS' (its columns by its type). */
export function gridOpen(which: u16, rows: u16, cols: u16): void {
  gridKind = which
  gridRows = rows
  gridCols = which === GRID_STATS ? statsCols() : cols
  row = 0
  col = 0
  firstRow = 0
  cellLength = 0
}

/** STATS' columns: X, Y for 2-VAR, FREQ when it is on. */
function statsCols(): u16 {
  let n: u16 = 1
  if (peek(STATS_TYPE) === 1) n++
  if (peek(STATS_FREQ) !== 0) n++
  return n
}

/** The row being edited (STATS' rows come and go by FUNC). */
export function gridRow(): u16 {
  return row
}

/** Rows there are to move through: STATS has one more, empty, for a new row. */
function rowsNow(): u16 {
  if (gridKind !== GRID_STATS) return gridRows
  const n = peek16(STATS_COUNT)
  return n < STATS_ROWS ? n + 1 : n
}

/** STATS' data column under the grid's column `c`: X 0, Y 1, FREQ 2. */
function dataColumn(c: u16): u16 {
  if (c === 0) return 0
  if (c === 1 && peek(STATS_TYPE) === 1) return 1
  return 2
}

/** Where cell (r, c) is kept: STATS an 8-byte number, EQUATION a value. */
function cellAt(r: u16, c: u16): u16 {
  if (gridKind === GRID_STATS) return STATS_DATA + (r * 3 + dataColumn(c)) * 8
  return EQN_COEFFS + (r * gridCols + c) * VALUE_SIZE
}

/** Where column `c` begins (its left rule); the last ends at 128. */
function edge(c: u16): u16 {
  return INDEX_WIDTH + div(c * (128 - INDEX_WIDTH), gridCols)
}

/* ---------------- keys ---------------- */

/** A key on the grid: a token typed, DEL, the arrows, = and AC. */
export function gridKey(k: u16, shift: bool): u16 {
  if (k === K_AC || k === K_DEL) return clearKey(k === K_AC)
  if (k === K_EQ) {
    if (cellLength === 0) return GRID_DONE
    commit()
    advance()
    return GRID_STAY
  }
  if (k === K_UP || k === K_DOWN || k === K_LEFT || k === K_RIGHT) {
    if (cellLength > 0) commit()
    move(k)
    return GRID_STAY
  }
  const t = tokenOf(k, shift)
  if (t === 0 || cellLength >= 32) refuse()
  else {
    cellEntry[cellLength] = t
    cellLength++
  }
  return GRID_STAY
}

/** AC: what is typed cleared (with nothing typed, AC for the mode); DEL: its last token. */
function clearKey(all: bool): u16 {
  if (all) {
    if (cellLength === 0) return GRID_AC
    cellLength = 0
  } else if (cellLength > 0) cellLength--
  else refuse()
  return GRID_STAY
}

function move(k: u16): void {
  if (k === K_UP && row > 0) row--
  else if (k === K_DOWN && row + 1 < rowsNow()) row++
  else if (k === K_LEFT && col > 0) col--
  else if (k === K_RIGHT && col + 1 < gridCols) col++
  else refuse()
}

/** After a cell is filled: STATS goes down, EQUATION along the row and on to the next. */
function advance(): void {
  if (gridKind === GRID_STATS) {
    if (row + 1 < rowsNow()) row++
  } else if (col + 1 < gridCols) col++
  else if (row + 1 < gridRows) {
    row++
    col = 0
  }
}

/** The line typed evaluated into the chosen cell; in STATS' new row, the row made. */
function commit(): void {
  clearStack()
  evaluate(addr(cellEntry), cellLength)
  cellLength = 0
  if (gridKind !== GRID_STATS) {
    copyValue(top(), cellAt(row, col))
    return
  }
  const count = peek16(STATS_COUNT)
  if (row === count) newRow(row)
  copy8(top(), cellAt(row, col))
}

/* ---------------- STATS' rows ---------------- */

/** An empty row at `r`, the rows from there down one (its FREQ 1). */
export function newRow(r: u16): void {
  const count = peek16(STATS_COUNT)
  if (count >= STATS_ROWS) {
    refuse()
    return
  }
  const at = STATS_DATA + r * 24
  for (let i = STATS_DATA + count * 24 + 23; i >= at + 24; i--) poke(i, peek(i - 24))
  for (let i: u16 = 0; i < 24; i++) poke(at + i, 0)
  // FREQ 1: the maths unit's 1 (exponent 0, the digit 1).
  poke(at + 18, 0x10)
  poke16(STATS_COUNT, count + 1)
}

/** The chosen row taken out, the rows below up one. */
export function deleteRow(): void {
  const count = peek16(STATS_COUNT)
  if (row >= count) {
    refuse()
    return
  }
  const at = STATS_DATA + row * 24
  for (let i = at; i < STATS_DATA + (count - 1) * 24; i++) poke(i, peek(i + 24))
  poke16(STATS_COUNT, count - 1)
  if (row > 0 && row >= count - 1) row--
}

/** Every row taken out. */
export function clearRows(): void {
  poke16(STATS_COUNT, 0)
  row = 0
  firstRow = 0
}

/* ---------------- drawing ---------------- */

/** The frame and the rows on screen (below a title the mode drew). */
export function gridDraw(): void {
  if (row < firstRow) firstRow = row
  if (row >= firstRow + SHOWN_ROWS) firstRow = row - SHOWN_ROWS + 1
  for (let c: u16 = 0; c < gridCols; c++) head(c)
  for (let x: u16 = 0; x < 128; x++) dot(x, 19)
  for (let c: u16 = 0; c < gridCols; c++) {
    for (let y: u16 = 10; y < 64; y++) dot(edge(c), y)
  }
  const count = rowsNow()
  for (let k: u16 = 0; k < SHOWN_ROWS && firstRow + k < count; k++)
    drawRow(firstRow + k, 21 + 9 * k)
}

/** A column's head, in the middle of its column. */
function head(c: u16): void {
  const left = edge(c)
  const right = c + 1 < gridCols ? edge(c + 1) : 128
  const name = headOf(c)
  const width = name === 0x46 ? 24 : 6
  const x = left + ((right - left - width) >> 1)
  if (name === 0x46) textAt(freqName(), x, lineY(0))
  else glyphAt(name, x, lineY(0))
}

const freqText = bytes(5)

function freqName(): u16 {
  freqText[0] = 0x46
  freqText[1] = 0x52
  freqText[2] = 0x45
  freqText[3] = 0x51
  freqText[4] = 0
  return addr(freqText)
}

/** A column's name: X, Y, F (FREQ) in STATS; a, b, c, d in EQUATION. */
function headOf(c: u16): u16 {
  if (gridKind !== GRID_STATS) return 0x61 + c
  const d = dataColumn(c)
  return d === 0 ? 0x58 : d === 1 ? 0x59 : 0x46
}

/** Row `r` at dot row `y`: its number, its cells, the chosen one inverted. */
function drawRow(r: u16, y: u16): void {
  rowNumber(r + 1)
  textAt(addr(cellText), 1, y)
  const filled = gridKind !== GRID_STATS || r < peek16(STATS_COUNT)
  for (let c: u16 = 0; c < gridCols; c++) {
    const right = c + 1 < gridCols ? edge(c + 1) : 128
    const chosen = r === row && c === col
    if (chosen && cellLength > 0) entryText(right, y)
    else if (filled) cellValue(cellAt(r, c), right, y)
    if (chosen) invertBox(edge(c) + 1, y - 1, right - 1, y + 7)
  }
}

function rowNumber(n: u16): void {
  let i: u16 = 0
  if (n >= 10) {
    cellText[0] = 0x30 + div(n, 10)
    i = 1
  }
  cellText[i] = 0x30 + (n % 10)
  cellText[i + 1] = 0
}

/** A cell's number, right in its column, in as many digits as the column holds. */
function cellValue(v: u16, right: u16, y: u16): void {
  const room = div(right - 3 - edgeLeft(right), 6)
  let digits = room
  if (digits > 10) digits = 10
  let length: u16 = 99
  // Fewer digits until the text fits: a sign, a point or an exponent take room too.
  while (length > room && digits > 0) {
    poke16(MATH_ARG, digits)
    math(M_FORMAT, v, addr(cellText), 0)
    length = peek16(MATH_ARG)
    digits--
  }
  cellText[length] = 0
  textAt(addr(cellText), right - 1 - length * 6, y)
}

/** The left rule of the column ending at `right`. */
function edgeLeft(right: u16): u16 {
  for (let c: u16 = 0; c < gridCols; c++) {
    const r = c + 1 < gridCols ? edge(c + 1) : 128
    if (r === right) return edge(c)
  }
  return INDEX_WIDTH
}

/** What is typed, its end at the column's right (as much as fits). */
function entryText(right: u16, y: u16): void {
  let n: u16 = 0
  for (let i: u16 = 0; i < cellLength && n < 23; i++) n = charsInto(cellEntry[i], n)
  const room = div(right - 2 - edgeLeft(right), 6)
  const from = n > room ? n - room : 0
  cellText[n] = 0
  textAt(addr(cellText) + from, right - 1 - (n - from) * 6, y)
}

function charsInto(t: u16, n: u16): u16 {
  const s = tokenText(t)
  if (s === 0) {
    cellText[n] = t
    return n + 1
  }
  let k = n
  let p = s
  while (peek(p) !== 0 && k < 23) {
    cellText[k] = peek(p)
    k++
    p++
  }
  return k
}
