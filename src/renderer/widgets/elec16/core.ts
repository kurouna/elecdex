import { disassemble } from '@shared/elec16/disasm'
import { REG_NAMES } from '@shared/elec16/isa'
import type { Elec16 } from '@shared/elec16/machine'
import {
  BANK_WINDOW,
  CODE_AREA,
  CODE_AREA_END,
  IO,
  RAM_SIZE,
  VRAM,
  VRAM_WINDOW,
} from '@shared/elec16/map'

/**
 * What CORE and MEM show of an ELEC-16 (docs/elec16.md section 7), read from the machine
 * without side effects (memory through the bus's peek, which never pops a key). Pure.
 */

export const hex = (n: number, digits = 4): string =>
  (n & 0xffff).toString(16).toUpperCase().padStart(digits, '0')

export interface CodeLine {
  address: number
  /** The instruction's bytes, as hex. */
  bytes: string
  text: string
  /** A ROM label that starts here. */
  label: string | null
  current: boolean
}

export interface CoreReading {
  /** x0 to x15, then pc. */
  regs: number[]
  pc: number
  csr: { name: string; value: number }[]
  instret: number
  cycles: number
  lines: CodeLine[]
}

/** Lines of code from the program counter on. */
export const CODE_LINES = 8

/** Labels by address, from the ROM's symbols, for code to be named by. */
export function labelsOf(symbols: Record<string, number>): Map<number, string> {
  const out = new Map<number, string>()
  for (const [name, address] of Object.entries(symbols))
    if (!out.has(address)) out.set(address, name)
  return out
}

export function readCore(machine: Elec16, labels: ReadonlyMap<number, string>): CoreReading {
  const s = machine.state
  const read = (address: number) => machine.bus.peek(address & 0xffff)
  const lines: CodeLine[] = []
  let address = s.pc
  for (let k = 0; k < CODE_LINES; k++) {
    const d = disassemble(read, address)
    const bytes = Array.from({ length: d.size }, (_, j) => hex(read(address + j), 2)).join('')
    lines.push({
      address,
      bytes,
      text: d.text,
      label: labels.get(address) ?? null,
      current: k === 0,
    })
    address = (address + d.size) & 0xffff
  }
  const c = s.csr
  return {
    regs: Array.from(s.regs),
    pc: s.pc,
    csr: [
      { name: 'mstatus', value: c.mstatus },
      { name: 'mie', value: c.mie },
      { name: 'mtvec', value: c.mtvec },
      { name: 'mepc', value: c.mepc },
      { name: 'mcause', value: c.mcause },
      { name: 'mtval', value: c.mtval },
    ],
    instret: s.instret,
    cycles: s.cycles,
    lines,
  }
}

/** The registers' ABI names, x0 to x15. */
export const REGISTER_NAMES: readonly string[] = REG_NAMES

/** The registers that differ from the last look, by index. */
export function changedRegisters(
  before: readonly number[] | null,
  now: readonly number[],
): Set<number> {
  const out = new Set<number>()
  if (before === null) return out
  now.forEach((value, k) => {
    if (before[k] !== value) out.add(k)
  })
  return out
}

/** What a byte of the address space is, for MEM's colours. */
export type ByteKind = 'ram' | 'code' | 'rom' | 'bank' | 'vram' | 'none' | 'io'

export function byteKind(address: number): ByteKind {
  if (address < CODE_AREA) return 'ram'
  if (address < CODE_AREA_END) return 'code'
  if (address < RAM_SIZE) return 'ram'
  if (address < BANK_WINDOW) return 'rom'
  if (address < VRAM) return 'bank'
  if (address < VRAM + VRAM_WINDOW) return 'vram'
  return address < IO ? 'none' : 'io'
}
