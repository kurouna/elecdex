/**
 * e16c's types and names (docs/elec16.md section 6, e16c). The machine has 16-bit words;
 * the subset names how a word is read: `u16` and `u8` unsigned, `i16` signed, `bool` 0 or 1,
 * and arrays of `u8` or `u16` that are addresses in RAM. Every one is a `number` (or a
 * `boolean`) to TypeScript, so the same source runs as TypeScript under the tests.
 */

import type { Ty } from './ir.js'

export type Scalar = Exclude<Ty, 'void'>

export type TypeRef = { kind: 'scalar'; ty: Scalar } | { kind: 'array'; elem: 'u8' | 'u16' }

/** A value's type, and its value when it is known while compiling. */
export interface Typed {
  type: TypeRef
  constant?: number
}

export const scalar = (ty: Scalar): TypeRef => ({ kind: 'scalar', ty })
export const U16 = scalar('u16')
export const I16 = scalar('i16')
export const BOOL = scalar('bool')

export const isSigned = (t: TypeRef): boolean => t.kind === 'scalar' && t.ty === 'i16'
export const isBool = (t: TypeRef): boolean => t.kind === 'scalar' && t.ty === 'bool'

/**
 * The constants a type holds alike in TypeScript and on the machine: a u16 of -1 is -1 in
 * one and 65535 in the other, a u8 of 300 is 300 and 44.
 */
export function rangeOf(ty: Exclude<Ty, 'void'>): [number, number] {
  if (ty === 'i16') return [-32768, 32767]
  if (ty === 'u8') return [0, 255]
  if (ty === 'bool') return [0, 1]
  return [0, 65535]
}

export const typeName = (t: TypeRef): string => (t.kind === 'array' ? `${t.elem}[]` : t.ty)

/** A value held to 16 bits, as the machine holds it. */
export const word = (v: number): number => v & 0xffff

/** A word as the assembly writes it: `0x0123`. */
export const hex = (n: number): string => `0x${word(n).toString(16).padStart(4, '0')}`

/** A word read as signed. */
export const signed = (v: number): number => (word(v) << 16) >> 16

/** RAM below this is within reach of an instruction's 14-bit offset from zero. */
export const NEAR = 0x2000

export interface CompileError {
  file: string
  line: number
  column: number
  message: string
}

/** A compile error at a place in the source, thrown and caught at the statement. */
export class Refusal extends Error {
  readonly at: number

  constructor(at: number, message: string) {
    super(message)
    this.at = at
  }
}

/** What a name means. */
export type Sym =
  | { kind: 'const'; value: number; type: TypeRef }
  | { kind: 'global'; at: number; type: TypeRef }
  /**
   * A static array in RAM or a string in ROM: its address is a label. A string in a ROM bank
   * (`bank`) is read only by functions in that bank: elsewhere the window may show another.
   */
  | { kind: 'static'; label: string; type: TypeRef; bank: number | null }
  /** A function; `bank` the ROM bank its code is in (null: the fixed ROM, or assembly). */
  | { kind: 'fn'; params: TypeRef[]; ret: Ty; extern: boolean; bank: number | null }
  | { kind: 'local'; slot: number; type: TypeRef }

/** The functions every program has without declaring them (prelude.ts says them to TypeScript). */
export const BUILTINS = new Set([
  'peek',
  'poke',
  'peek16',
  'poke16',
  'div',
  'wrap16',
  'ecall',
  'csrr',
  'csrw',
  'wfi',
  'asm',
  'bytes',
  'words',
  'str',
  'addr',
  'u8',
  'u16',
  'i16',
])
