// ELECDRILL's field (docs/elec16-elecdrill.md section 5): the well of blocks, nine columns wide,
// kept as a ring of 32 rows that moves down with the driller - 31 rows in use and one row of
// wall between the deepest and the highest, so a search never runs off either end - and drawn
// into BG0 as it changes: a cell and its eight neighbours marked, a few redrawn each frame.
import { type bool, bytes, poke16, type u16, wrap16 } from '../../../../src/shared/e16c/builtins'
import { palette, palKeep, rand, randBelow, VPAGE, VWIN, vfill } from '../lib/kit.e16'
import {
  ALLOY_TILE,
  CAPSULE_TILE,
  CORE_TILE,
  GROUND_TILE,
  PAL_EARTH1,
  QUARTERS_TILE,
  TANK_TILE,
} from './assets.e16'

/** What a cell holds: its low four bits. */
export const T_EMPTY = 0
export const T_RED = 1
export const T_BLUE = 4
export const T_ALLOY = 5
export const T_AIR = 6
export const T_CORE = 7
export const T_WALL = 15
/** A block that has lost its footing (wobbling or falling): it is drawn as a sprite. */
export const F_LOOSE = 0x80
/** A block about to vanish: it flashes, and still holds up what rests on it. */
export const F_PEND = 0x40
/** ALLOY's hits so far, in bits 4-5. */
export const ALLOY_HITS = 4

/** The well: nine columns at x 88 (cell 11) of the screen, a block 16 points square. */
export const COLS = 9
export const FIELD_X = 88
/** The ground starts at row 6; the core at 500 m below it. */
export const GROUND = 6
export const CORE_ROW = 506

/** Palette slots: the backgrounds, then the sprites (8 and up). */
export const SL_EARTH_A = 0
export const SL_EARTH_B = 5
export const SL_FLASH = 6
export const SL_PANEL = 7

/** The ring: row r of the field is at (r & 31) * 16, columns 0-8; 9-15 are wall. */
export const cells = bytes(512)
/** Per cell: bit 7 to be redrawn, bits 0-6 a search's mark (`stamp`). */
export const marks = bytes(512)
/** Per ring row: whether a cell of it is marked to be redrawn. */
const rowMarked = bytes(32)
/** The highest row in the ring; the rows from it to `top + 30` are the field. */
export let top: u16 = 0
/** The search's mark of now (1-127). */
export let stamp: u16 = 1

/** Each stratum's chance of ALLOY in a hundred, per cell. */
function alloyChance(s: u16): u16 {
  return s === 0 ? 3 : s === 1 ? 5 : s === 2 ? 7 : s === 3 ? 9 : 11
}

/** Which stratum (0-4) row `r` is in. */
export function stratumOf(r: u16): u16 {
  if (r < GROUND) return 0
  const d = r - GROUND
  return d >= 400 ? 4 : d >= 300 ? 3 : d >= 200 ? 2 : d >= 100 ? 1 : 0
}

export function cellOf(col: u16, r: u16): u16 {
  return ((r & 31) << 4) + col
}

/** The absolute row of ring row `ring`. */
export function rowOf(ring: u16): u16 {
  return top + (wrap16(ring - top) & 31)
}

/** A fresh field: walls, rows from 0, the ring full; BG0 redrawn as it comes. */
export function fieldNew(): void {
  let k: u16 = 0
  while (k < 512) {
    cells[k] = T_WALL
    marks[k] = 0
    k++
  }
  stamp = 1
  top = 0
  earthFor(0)
  let r: u16 = 0
  while (r < 31) {
    rowMake(r)
    r++
  }
  // Everything outside the well on BG0: the panels' dark, seen behind their lettering.
  vfill(0x8000, (TANK_TILE + 1) | (SL_PANEL << 10), 4096)
}

/** The ring moves down a row: the highest row becomes the wall, a new deepest row is made. */
export function fieldAdvance(): void {
  const base = (top & 31) << 4
  let c: u16 = 0
  while (c < COLS) {
    cells[base + c] = T_WALL
    c++
  }
  top++
  rowMake(top + 30)
}

/** Row `r` made: empty above the ground, the core at the bottom, else blocks by chance. */
function rowMake(r: u16): void {
  const base = (r & 31) << 4
  const above = ((r - 1) & 31) << 4
  if (r === GROUND || (r > GROUND && r < CORE_ROW && (r - GROUND) % 100 === 0)) earthFor(r)
  let c: u16 = 0
  while (c < COLS) {
    let v: u16 = T_EMPTY
    if (r >= CORE_ROW) v = T_CORE
    else if (r >= GROUND) v = blockFor(c, r, base, above)
    cells[base + c] = v
    markAround(base + c)
    c++
  }
  // An air capsule every ten metres, somewhere along the row.
  if (r >= GROUND + 4 && r < CORE_ROW && (r - GROUND) % 10 === 7) {
    cells[base + randBelow(COLS)] = T_AIR
  }
}

/** A block by chance: often its left or upper neighbour's colour again, so groups form. */
function blockFor(c: u16, r: u16, base: u16, above: u16): u16 {
  if (randBelow(100) < alloyChance(stratumOf(r))) return T_ALLOY
  const p = randBelow(100)
  const left = c > 0 ? cells[base + c - 1] & 15 : 0
  if (p < 20 && left >= T_RED && left <= T_BLUE) return left
  const up = r > GROUND ? cells[above + c] & 15 : 0
  if (p < 34 && up >= T_RED && up <= T_BLUE) return up
  return T_RED + (rand() & 3)
}

/** The earth of the stratum row `r` starts: into slot 0 or 5, by turns. */
function earthFor(r: u16): void {
  const s = stratumOf(r)
  const slot = (s & 1) === 0 ? SL_EARTH_A : SL_EARTH_B
  palette(PAL_EARTH1 + s, slot)
  palKeep(PAL_EARTH1 + s, slot)
}

/* ---------------- searches ---------------- */

/** A new mark for a search: every cell's mark is older. */
export function stampNext(): void {
  stamp++
  if (stamp < 128) return
  let k: u16 = 0
  while (k < 512) {
    marks[k] = marks[k] & 0x80
    k++
  }
  stamp = 1
}

export function stamped(i: u16): bool {
  return (marks[i] & 127) === stamp
}

export function stampIt(i: u16): void {
  marks[i] = (marks[i] & 0x80) | stamp
}

/* ---------------- drawing ---------------- */

/** Cell `i` and its eight neighbours to be redrawn. */
export function markAround(i: u16): void {
  marks[(i - 17) & 511] = marks[(i - 17) & 511] | 0x80
  marks[(i - 16) & 511] = marks[(i - 16) & 511] | 0x80
  marks[(i - 15) & 511] = marks[(i - 15) & 511] | 0x80
  marks[(i - 1) & 511] = marks[(i - 1) & 511] | 0x80
  marks[i] = marks[i] | 0x80
  marks[(i + 1) & 511] = marks[(i + 1) & 511] | 0x80
  marks[(i + 15) & 511] = marks[(i + 15) & 511] | 0x80
  marks[(i + 16) & 511] = marks[(i + 16) & 511] | 0x80
  marks[(i + 17) & 511] = marks[(i + 17) & 511] | 0x80
  const r = i >> 4
  rowMarked[(r - 1) & 31] = 1
  rowMarked[r] = 1
  rowMarked[(r + 1) & 31] = 1
}

/** Cells still to draw this frame (`fieldDraw`'s allowance as it goes). */
let drawLeft: u16 = 0

/**
 * Redraws marked cells of the rows from `from` (absolute) for `rows` rows, at most `most`
 * of them; the rest wait for a later frame.
 */
export function fieldDraw(from: u16, rows: u16, most: u16): void {
  drawLeft = most
  let r: u16 = 0
  while (r < rows) {
    const row = from + r
    if (wrap16(row - top) < 31 && rowMarked[row & 31] !== 0 && rowDraw(row)) {
      rowMarked[row & 31] = 0
    }
    r++
  }
}

/** Row `row`'s marked cells, while the allowance lasts: answers whether all were drawn. */
function rowDraw(row: u16): bool {
  const base = (row & 31) << 4
  let all = true
  let c: u16 = 0
  while (c < COLS) {
    if ((marks[base + c] & 0x80) !== 0) {
      if (drawLeft > 0) {
        marks[base + c] = marks[base + c] & 127
        cellDraw(base + c, row)
        drawLeft--
      } else all = false
    }
    c++
  }
  return all
}

/** The four tiles of cell `i` (row `row`) into BG0. */
function cellDraw(i: u16, row: u16): void {
  const at = 0x8000 + ((i & 0x1f0) << 4) + 22 + ((i & 15) << 2)
  poke16(VPAGE, at >> 12)
  const p = VWIN + (at & 0xfff)
  const v = cells[i]
  const t = v & 15
  if (t === T_EMPTY || (v & F_LOOSE) !== 0) {
    groundDraw(p, i, row)
    return
  }
  if (t <= T_BLUE) {
    blockDraw(p, i, v)
    return
  }
  let tile: u16 = CORE_TILE | (SL_FLASH << 10)
  if (t === T_ALLOY) tile = (ALLOY_TILE + ((v >> 4) & 3) * 4) | (SL_PANEL << 10)
  else if (t === T_AIR) tile = CAPSULE_TILE | (SL_PANEL << 10)
  poke16(p, tile)
  poke16(p + 2, tile + 1)
  poke16(p + 128, tile + 2)
  poke16(p + 130, tile + 3)
}

/** A dug cell: the stratum's ground, shadowed by a block above or to the left. */
function groundDraw(p: u16, i: u16, row: u16): void {
  const a: u16 = solid(cells[(i - 16) & 511]) ? 1 : 0
  const l: u16 = solid(cells[(i - 1) & 511]) ? 1 : 0
  const slot = (stratumOf(row) & 1) === 0 ? SL_EARTH_A : SL_EARTH_B
  const base = (GROUND_TILE + (((row + (i & 15) * 3) >> 1) & 1) * 9) | (slot << 10)
  poke16(p, base + a * 2 + l)
  poke16(p + 2, base + 4 + a)
  poke16(p + 128, base + 6 + l)
  poke16(p + 130, base + 8)
}

/** Something that stays put: not empty, not loose. */
export function solid(v: u16): bool {
  return (v & 15) !== 0 && (v & F_LOOSE) === 0
}

/**
 * A coloured block, joined to its like: each quarter by its vertical, horizontal and diagonal
 * neighbour (QUARTERS: five cases a quarter). A vanishing block flashes in its own slot.
 */
function blockDraw(p: u16, i: u16, v: u16): void {
  const key = v & 0xcf
  const n = like(i - 16, key)
  const s = like(i + 16, key)
  const w = like(i - 1, key)
  const e = like(i + 1, key)
  const slot = (v & F_PEND) !== 0 ? SL_FLASH : v & 15
  const base = QUARTERS_TILE | (slot << 10)
  poke16(p, base + quarter(n, w, like(i - 17, key)))
  poke16(p + 2, base + 5 + quarter(n, e, like(i - 15, key)))
  poke16(p + 128, base + 10 + quarter(s, w, like(i + 15, key)))
  poke16(p + 130, base + 15 + quarter(s, e, like(i + 17, key)))
}

function like(i: u16, key: u16): u16 {
  return (cells[i & 511] & 0xcf) === key ? 1 : 0
}

/** A quarter's case: 0 alone, 1 joined up or down, 2 across, 3 both round a corner, 4 inside. */
function quarter(v: u16, h: u16, d: u16): u16 {
  if (v !== 0) {
    if (h !== 0) return d !== 0 ? 4 : 3
    return 1
  }
  return h !== 0 ? 2 : 0
}

/** Every cell of the ring marked (after a reset), so the screen fills over a few frames. */
export function markAll(): void {
  let k: u16 = 0
  while (k < 512) {
    marks[k] = marks[k] | 0x80
    k++
  }
  k = 0
  while (k < 32) {
    rowMarked[k] = 1
    k++
  }
}

/** Whether cell `i` is in the ring's rows (not the wall row) and a column of the well. */
export function inField(i: u16): bool {
  return (i & 15) < COLS && (wrap16((i >> 4) - (top & 31)) & 31) !== 31
}

/** Row `r`'s distance below `top`, or a large number above it. */
export function rowIn(r: u16): u16 {
  return wrap16(r - top)
}
