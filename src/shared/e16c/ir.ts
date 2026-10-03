/**
 * e16c's intermediate form (docs/elec16.md section 6, e16c): a stack machine's code, one list
 * of operations a function, with the types already decided by the front end - which compare
 * is signed, which load is a byte. The back ends turn it into E16 assembly; the interpreter
 * (interp.ts) runs it, for tests and for working out pure calls at compile time.
 */

export type Ty = 'u16' | 'i16' | 'u8' | 'bool' | 'void'

export type BinOp =
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'divu'
  | 'rem'
  | 'remu'
  | 'and'
  | 'or'
  | 'xor'
  | 'shl'
  | 'shr'
  | 'sar'
  | 'eq'
  | 'ne'
  | 'lt'
  | 'ltu'
  | 'le'
  | 'leu'
  | 'gt'
  | 'gtu'
  | 'ge'
  | 'geu'

export type UnOp = 'neg' | 'not' | 'lnot'

export type Op =
  /** A constant (held to 16 bits). */
  | { k: 'push'; v: number }
  /** The address of a label: a string in ROM, a static array in RAM. */
  | { k: 'addr'; label: string }
  | { k: 'ld'; slot: number }
  | { k: 'st'; slot: number }
  /** A global variable, at a fixed address in RAM. */
  | { k: 'ldg'; at: number; byte: boolean }
  | { k: 'stg'; at: number; byte: boolean }
  /** Memory through an address on the stack. Store takes the value, then the address. */
  | { k: 'load'; byte: boolean }
  | { k: 'store'; byte: boolean }
  | { k: 'bin'; op: BinOp }
  | { k: 'un'; op: UnOp }
  | { k: 'label'; name: string }
  | { k: 'jmp'; to: string }
  | { k: 'jz'; to: string }
  | { k: 'jnz'; to: string }
  /** Arguments are on the stack, the first deepest; a value is left when `ret`. */
  | { k: 'call'; fn: string; argc: number; ret: boolean }
  | { k: 'ret'; value: boolean }
  /** The service number deepest, then up to four arguments; leaves a0. */
  | { k: 'ecall'; argc: number }
  | { k: 'csrr'; csr: number }
  | { k: 'csrw'; csr: number }
  | { k: 'wfi' }
  | { k: 'asm'; text: string }
  | { k: 'drop' }
  | { k: 'dup' }
  /** Where in the source the operations after this come from, for the listing. */
  | { k: 'line'; file: string; line: number; text: string }

export interface Fn {
  name: string
  params: number
  /** Every local slot, parameters first. */
  slots: string[]
  returns: boolean
  body: Op[]
  exported: boolean
  file: string
  line: number
  /** The ROM bank the function's code goes in, or null for the fixed ROM. */
  bank: number | null
}

export interface Global {
  name: string
  at: number
  byte: boolean
  init: number
}

export interface StaticArray {
  name: string
  at: number
  bytes: number
}

export interface RomString {
  label: string
  bytes: number[]
  /** The ROM bank it is kept in, with the functions that read it; null for the fixed ROM. */
  bank: number | null
}

export interface Program {
  fns: Fn[]
  globals: Global[]
  arrays: StaticArray[]
  strings: RomString[]
  /** Functions written by hand in assembly, named by `declare function`. */
  externs: Map<string, { params: number; returns: boolean }>
}

/** Every operation that leaves the stack one deeper, one shallower, or as it was. */
export function stackEffect(op: Op): number {
  switch (op.k) {
    case 'push':
    case 'addr':
    case 'ld':
    case 'ldg':
    case 'dup':
    case 'csrr':
      return 1
    case 'st':
    case 'stg':
    case 'bin':
    case 'jz':
    case 'jnz':
    case 'drop':
    case 'csrw':
      return -1
    case 'store':
      return -2
    case 'call':
      return (op.ret ? 1 : 0) - op.argc
    case 'ret':
      return op.value ? -1 : 0
    case 'ecall':
      return -op.argc
    default:
      return 0
  }
}
