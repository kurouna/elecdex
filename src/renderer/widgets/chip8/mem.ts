import { BIG_FONT_AT, BIG_GLYPH_BYTES, SMALL_FONT_AT } from '@shared/chip8/fonts'
import type { Chip8State } from '@shared/chip8/state'
import { PROGRAM_START } from '@shared/chip8/types'

/**
 * What the MEM view shows of a machine (docs/architecture.md section 5.18): a window of its
 * memory, eight bytes a row, placed round what it follows - the program counter, I, or
 * where the player scrolled to - and the bytes at I drawn as the sprite they would be.
 * Pure: the view reads it ten times a second, and a test reads it directly.
 */

/** Bytes a row: one sprite row of a CHIP-8 sprite is one byte, so eight reads as bits too. */
export const MEM_COLUMNS = 8
/** Rows shown. */
export const MEM_ROWS = 16
/** Rows of the sprite at I: SUPER-CHIP's large sprites are 16 rows (of two bytes). */
export const SPRITE_ROWS = 16

export type MemFollow = 'pc' | 'i' | 'free'

/** What a byte is to the machine, for its colour. */
export type ByteKind = 'font' | 'program' | 'free'

export interface MemRow {
  address: number
  bytes: number[]
}

/**
 * The first address of the window: `target`'s row a quarter of the way down, so what comes
 * after it shows more than what came before; never past either end of memory.
 */
export function windowStart(target: number, size: number, rows = MEM_ROWS): number {
  const row = Math.floor(target / MEM_COLUMNS)
  const last = Math.max(0, size / MEM_COLUMNS - rows)
  const first = Math.min(last, Math.max(0, row - Math.floor(rows / 4)))
  return first * MEM_COLUMNS
}

/** Moves a window by whole rows, kept inside memory. */
export function scrollWindow(start: number, rows: number, size: number): number {
  const last = Math.max(0, size - MEM_ROWS * MEM_COLUMNS)
  return Math.min(last, Math.max(0, start + rows * MEM_COLUMNS))
}

/** The rows of memory from `start` (a row's first address). */
export function memoryRows(memory: Uint8Array, start: number, rows = MEM_ROWS): MemRow[] {
  const out: MemRow[] = []
  for (let r = 0; r < rows; r++) {
    const address = start + r * MEM_COLUMNS
    if (address >= memory.length) break
    out.push({ address, bytes: Array.from(memory.subarray(address, address + MEM_COLUMNS)) })
  }
  return out
}

/** Where the fonts end: the small glyphs, then the large ones. */
const FONT_END = BIG_FONT_AT + 16 * BIG_GLYPH_BYTES

/** Where a byte lies: the fonts the machine keeps below 0x200, the program's bytes, or neither. */
export function byteKind(address: number, programSize: number): ByteKind {
  if (address >= SMALL_FONT_AT && address < FONT_END) return 'font'
  if (address >= PROGRAM_START && address < PROGRAM_START + programSize) return 'program'
  return 'free'
}

/** The bytes from I, as the rows of the sprite they would draw (wrapping as the machine does). */
export function spriteAt(s: Readonly<Chip8State>, rows = SPRITE_ROWS): number[] {
  const size = s.memory.length
  return Array.from({ length: rows }, (_, k) => s.memory[(s.i + k) & (size - 1)] ?? 0)
}

/** The addresses whose byte differs from the last look, for a beat's mark. */
export function changedBytes(
  before: ReadonlyMap<number, number> | null,
  rows: MemRow[],
): Set<number> {
  const changed = new Set<number>()
  if (before === null) return changed
  for (const row of rows) {
    row.bytes.forEach((value, k) => {
      const was = before.get(row.address + k)
      if (was !== undefined && was !== value) changed.add(row.address + k)
    })
  }
  return changed
}

/** The bytes shown, by address, to compare the next look with. */
export function byteMap(rows: MemRow[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of rows) {
    row.bytes.forEach((value, k) => {
      map.set(row.address + k, value)
    })
  }
  return map
}
