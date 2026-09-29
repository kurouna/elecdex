import { disassemble } from '@shared/chip8/disasm'
import { type Chip8State, word } from '@shared/chip8/state'
import type { Halt } from '@shared/chip8/types'

/**
 * What the CORE view shows of a machine (docs/architecture.md section 5.18): its
 * registers, the stack, and the code around the program counter as Octo writes it.
 * Pure: the view reads it ten times a second, and a test reads it directly.
 */

export interface CoreLine {
  address: number
  op: number
  text: string
  /** The instruction the machine runs next (or the one that stopped it). */
  current: boolean
}

export interface CoreReading {
  v: number[]
  i: number
  pc: number
  sp: number
  dt: number
  st: number
  /** The return addresses, innermost first. */
  stack: number[]
  lines: CoreLine[]
  cycles: number
}

/** Lines of code shown before and after the current one. */
export const CODE_BEFORE = 3
export const CODE_AFTER = 4

/**
 * The code round `pc`: instructions are two bytes on even addresses from 0x200, so the
 * lines step by two either side. A line before may be data; it is shown for what it would
 * be, as a disassembler does.
 */
export function codeAround(s: Readonly<Chip8State>, pc: number): CoreLine[] {
  const lines: CoreLine[] = []
  const last = s.memory.length - 2
  for (let k = -CODE_BEFORE; k <= CODE_AFTER; k++) {
    const address = pc + k * 2
    if (address < 0 || address > last) continue
    const op = word(s, address)
    const { text } = disassemble(op, word(s, address + 2))
    lines.push({ address, op, text, current: k === 0 })
  }
  return lines
}

export function readCore(s: Readonly<Chip8State>): CoreReading {
  // Stopped, the line to show is the one that stopped it, not the one after.
  const at = s.halt !== null ? s.halt.pc : s.pc
  return {
    v: [...s.v],
    i: s.i,
    pc: at,
    sp: s.sp,
    dt: s.dt,
    st: s.st,
    stack: Array.from({ length: s.sp }, (_, k) => s.stack[s.sp - 1 - k] ?? 0),
    lines: codeAround(s, at),
    cycles: s.cycles,
  }
}

/** Which registers differ between two readings, by index. */
export function changedRegisters(
  before: readonly number[] | null,
  now: readonly number[],
): Set<number> {
  const changed = new Set<number>()
  if (before === null) return changed
  now.forEach((value, k) => {
    if (before[k] !== value) changed.add(k)
  })
  return changed
}

export const hex = (value: number, digits: number): string =>
  value.toString(16).toUpperCase().padStart(digits, '0')

const HALT_WORDS: Readonly<Record<Halt['reason'], string>> = {
  exit: 'PROGRAM ENDED',
  illegal: 'ILLEGAL INSTRUCTION',
  'stack-overflow': 'STACK OVERFLOW',
  'stack-underflow': 'STACK UNDERFLOW',
}

/** The halt in the HALT card's words: what, and where. */
export function haltLines(halt: Halt): { title: string; detail: string; fault: boolean } {
  const fault = halt.reason !== 'exit'
  return {
    title: HALT_WORDS[halt.reason],
    detail: fault ? `${hex(halt.op, 4)} @ 0x${hex(halt.pc, 3)}` : `@ 0x${hex(halt.pc, 3)}`,
    fault,
  }
}
