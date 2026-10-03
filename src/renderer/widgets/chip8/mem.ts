import { BIG_FONT_AT, BIG_GLYPH_BYTES, SMALL_FONT_AT } from '@shared/chip8/fonts'
import type { Chip8State } from '@shared/chip8/state'
import { PROGRAM_START } from '@shared/chip8/types'

/**
 * What the MEM view shows of a CHIP-8 machine (docs/architecture.md section 5.18) beyond
 * the window every machine's MEM view has (shared/emu/mem-window.ts): what each byte is -
 * font, program or free - and the bytes at I drawn as the sprite they would be. Pure: the
 * view reads it ten times a second, and a test reads it directly.
 */

/** Rows of the sprite at I: SUPER-CHIP's large sprites are 16 rows (of two bytes). */
export const SPRITE_ROWS = 16

export type MemFollow = 'pc' | 'i' | 'free'

/** What a byte is to the machine, for its colour. */
export type ByteKind = 'font' | 'program' | 'free'

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
