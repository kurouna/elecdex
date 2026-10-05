/**
 * E16 machine code back to text (docs/elec16.md section 4), in the syntax the assembler reads,
 * so what CORE and the monitor show can be assembled again to the same bytes (a unit test
 * round-trips every instruction). Branch and jump targets are written as addresses.
 */

import { C_OPS, decode, ENCODINGS, type Inst, OPS, type OpName, REG_NAMES } from './isa.js'
import { CSR_NAMES } from './state.js'

export interface Disassembled {
  address: number
  size: 2 | 4
  text: string
  inst: Inst
}

const r = (n: number): string => REG_NAMES[n] ?? `x${n}`
const hex = (n: number): string => `0x${(n & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`

const CSR_BY_NUMBER = new Map<number, string>(
  Object.entries(CSR_NAMES).map(([name, n]) => [n as number, name]),
)
const csrName = (n: number): string => CSR_BY_NUMBER.get(n) ?? String(n)

/** The instruction at `address`, read through `read` (one byte at a time, no side effects). */
export function disassemble(read: (address: number) => number, address: number): Disassembled {
  const lo = read(address) | (read(address + 1) << 8)
  const hi = (lo & 3) === 3 ? read(address + 2) | (read(address + 3) << 8) : 0
  const inst = decode(lo, hi)
  return { address, size: inst.size, text: textOf(inst, address), inst }
}

/** One decoded instruction as text, at `address` (for its targets). */
export function textOf(i: Inst, address: number): string {
  if (i.op === 0) return i.size === 2 ? '.word ?' : '.word ?, ?'
  if (i.c >= 0) return compressedText(i, address)
  const name = OPS[i.op] as OpName
  const target = hex(address + i.imm)
  switch (ENCODINGS[name]?.format) {
    case 'R':
      return `${name} ${r(i.rd)}, ${r(i.rs1)}, ${r(i.rs2)}`
    case 'Rsh':
      return `${name} ${r(i.rd)}, ${r(i.rs1)}, ${r(i.rs2)}, ${i.imm}`
    case 'I':
      return immediateText(name, i)
    case 'Ish':
      return `${name} ${r(i.rd)}, ${r(i.rs1)}, ${i.imm}`
    case 'Iun':
      return `${name} ${r(i.rd)}, ${r(i.rs1)}`
    case 'S':
      return `${name} ${r(i.rs2)}, ${i.imm}(${r(i.rs1)})`
    case 'B':
      return `${name} ${r(i.rs1)}, ${r(i.rs2)}, ${target}`
    case 'J':
      return `jal ${r(i.rd)}, ${target}`
    case 'U':
      return `${name} ${r(i.rd)}, ${hex(i.imm)}`
    case 'Icsr':
      return `${name} ${r(i.rd)}, ${csrName(i.imm)}, ${r(i.rs1)}`
    case 'Icsri':
      return `${name} ${r(i.rd)}, ${csrName(i.imm)}, ${i.rs1}`
    default:
      return name
  }
}

function immediateText(name: OpName, i: Inst): string {
  if (name === 'lb' || name === 'lbu' || name === 'lw' || name === 'jalr') {
    return `${name} ${r(i.rd)}, ${i.imm}(${r(i.rs1)})`
  }
  return `${name} ${r(i.rd)}, ${r(i.rs1)}, ${i.imm}`
}

function compressedText(i: Inst, address: number): string {
  const name = C_OPS[i.c] ?? 'c.?'
  const target = hex(address + i.imm)
  switch (name) {
    case 'c.nop':
    case 'c.ebreak':
      return name
    case 'c.li':
    case 'c.addi':
    case 'c.andi':
    case 'c.slli':
    case 'c.srli':
    case 'c.srai':
    case 'c.addi2spn':
      return `${name} ${r(i.rd)}, ${i.imm}`
    case 'c.mv':
    case 'c.add':
    case 'c.sub':
    case 'c.xor':
    case 'c.and':
    case 'c.or':
      return `${name} ${r(i.rd)}, ${r(i.rs2)}`
    case 'c.lw':
      return `c.lw ${r(i.rd)}, ${i.imm}(${r(i.rs1)})`
    case 'c.sw':
      return `c.sw ${r(i.rs2)}, ${i.imm}(${r(i.rs1)})`
    case 'c.lwsp':
      return `c.lwsp ${r(i.rd)}, ${i.imm}`
    case 'c.swsp':
      return `c.swsp ${r(i.rs2)}, ${i.imm}`
    case 'c.beqz':
    case 'c.bnez':
      return `${name} ${r(i.rs1)}, ${target}`
    case 'c.j':
    case 'c.jal':
      return `${name} ${target}`
    default:
      return `${name} ${r(i.rs1)}`
  }
}
