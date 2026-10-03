import { assemble } from '@shared/elec16/asm'
import { disassemble, textOf } from '@shared/elec16/disasm'
import {
  C_OPS,
  compress,
  decode,
  ENCODINGS,
  encode32,
  type Inst,
  OP,
  OPS,
  type OpName,
} from '@shared/elec16/isa'
import { seedOf, xorshift32 } from '@shared/emu/random'
import { describe, expect, it } from 'vitest'

/**
 * The E16 encoding (docs/elec16.md section 4) is one table that the assembler, disassembler
 * and CPU all read. These hold the three to each other: every instruction decodes to what was
 * encoded, prints as text the assembler turns back into the same bytes, and every 16-bit
 * form means what its 32-bit one means.
 */

const AT = 0x8000

/** Assembles one line at AT, without shortening, to its bytes. */
function bytesOf(line: string, compressOn = false): number[] {
  const out = assemble(`.org ${AT}\n${compressOn ? '' : '.option nocompress\n'}${line}`)
  expect(out.errors, line).toEqual([])
  return Array.from(out.chunks[0]?.bytes ?? [])
}

const memory = (bytes: number[]) => (a: number) => bytes[a - AT] ?? 0

/** Operands a format can take, drawn from a seeded sequence so a failure repeats. */
function operandsFor(name: OpName, next: () => number): Omit<Inst, 'op' | 'size' | 'c'> {
  const reg = () => next() & 15
  const format = ENCODINGS[name]?.format
  const pick = (lo: number, hi: number) => lo + (next() % (hi - lo + 1))
  switch (format) {
    case 'I':
    case 'S':
      return { rd: reg(), rs1: reg(), rs2: reg(), imm: pick(-8192, 8191) }
    case 'B':
      return { rd: 0, rs1: reg(), rs2: reg(), imm: pick(-8192, 8191) * 2 }
    case 'J':
      // A target is an address in 64 KB: the assembler writes the distance within +-32 KB.
      return { rd: reg(), rs1: 0, rs2: 0, imm: pick(-16384, 16383) * 2 }
    case 'U':
      return { rd: reg(), rs1: 0, rs2: 0, imm: pick(0, 0xffff) }
    case 'Ish':
      return { rd: reg(), rs1: reg(), rs2: 0, imm: pick(0, 15) }
    case 'Icsr':
    case 'Icsri':
      return {
        rd: reg(),
        rs1: reg(),
        rs2: 0,
        imm: [0x300, 0x304, 0x305, 0x341, 0xc00][pick(0, 4)] ?? 0,
      }
    default:
      return { rd: reg(), rs1: reg(), rs2: reg(), imm: 0 }
  }
}

/** The fields an encoding keeps: what decode gives back. */
function kept(name: OpName, f: Omit<Inst, 'op' | 'size' | 'c'>): Omit<Inst, 'size' | 'c'> {
  const format = ENCODINGS[name]?.format
  const zero = { rd: 0, rs1: 0, rs2: 0, imm: 0 }
  switch (format) {
    case 'R':
      return { op: OP[name], ...f, imm: 0 }
    case 'I':
    case 'Ish':
      return { op: OP[name], ...f, rs2: 0 }
    case 'Iun':
      return { op: OP[name], ...f, rs2: 0, imm: 0 }
    case 'S':
    case 'B':
      return { op: OP[name], ...f, rd: 0 }
    case 'J':
    case 'U':
      return { op: OP[name], ...zero, rd: f.rd, imm: f.imm }
    case 'Isys':
      return { op: OP[name], ...zero }
    default:
      return { op: OP[name], ...f, rs2: 0 }
  }
}

const NAMES = OPS.filter((name) => name !== 'illegal')

describe('the 32-bit encodings', () => {
  it('has one for every operation, and 101 operations', () => {
    expect(NAMES).toHaveLength(76)
    for (const name of NAMES) expect(ENCODINGS[name], name).toBeDefined()
    // 76 operations in 32 bits and 25 compressed forms: the 101 of docs/elec16.md.
    expect(NAMES.length + C_OPS.length).toBe(101)
  })

  it.each(NAMES)('%s decodes to what was encoded, and reads back as text', (name) => {
    let state = seedOf(OP[name] + 1)
    const next = () => (state = xorshift32(state))
    for (let k = 0; k < 200; k++) {
      const f = operandsFor(name, next)
      const word = encode32(name, f)
      expect(word & 3).toBe(3)
      const inst = decode(word & 0xffff, word >>> 16)
      expect({ op: inst.op, rd: inst.rd, rs1: inst.rs1, rs2: inst.rs2, imm: inst.imm }).toEqual(
        kept(name, f),
      )
      expect(inst.size).toBe(4)
      const bytes = [word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, word >>> 24]
      const text = textOf(inst, AT)
      expect(bytesOf(text), text).toEqual(bytes)
    }
  })

  it('refuses operands that do not fit their field', () => {
    expect(() => encode32('addi', { rd: 1, rs1: 1, rs2: 0, imm: 8192 })).toThrow(/immediate/)
    expect(() => encode32('beq', { rd: 0, rs1: 1, rs2: 1, imm: 3 })).toThrow(/even/)
    expect(() => encode32('slli', { rd: 1, rs1: 1, rs2: 0, imm: 16 })).toThrow(/shift/)
  })
})

describe('the 16-bit forms', () => {
  it('every encoding is illegal, or one of the 25, and assembles back to itself', () => {
    const seen = new Set<string>()
    let legal = 0
    for (let h = 0; h < 0x10000; h++) {
      if ((h & 3) === 3) continue
      const inst = decode(h, 0)
      expect(inst.size).toBe(2)
      if (inst.op === 0) continue
      legal++
      seen.add(C_OPS[inst.c] ?? '')
      const text = textOf(inst, AT)
      expect(bytesOf(text), `${h.toString(16)} ${text}`).toEqual([h & 0xff, h >>> 8])
    }
    expect([...seen].sort()).toEqual([...C_OPS].sort())
    expect(legal).toBeGreaterThan(20000)
  })

  it('all zeros is illegal, so running into cleared memory stops at once', () => {
    expect(decode(0, 0).op).toBe(0)
  })

  it('means what the 32-bit form it shortens means', () => {
    let state = seedOf(16)
    const next = () => (state = xorshift32(state))
    let shortened = 0
    for (const name of NAMES) {
      for (let k = 0; k < 400; k++) {
        const f = operandsFor(name, next)
        // Small values, so many fit.
        const small = { ...f, imm: ENCODINGS[name]?.format === 'Ish' ? f.imm : (f.imm % 64) & ~1 }
        const half = compress(name, small)
        if (half === null) continue
        shortened++
        const long = decode(encode32(name, small) & 0xffff, encode32(name, small) >>> 16)
        const short = decode(half, 0)
        expect({ ...short, size: 4, c: -1 }, `${name} ${JSON.stringify(small)}`).toEqual(long)
      }
    }
    expect(shortened).toBeGreaterThan(500)
  })

  it('an instruction that fits is assembled short when compression is on', () => {
    expect(bytesOf('addi a0, a0, 1', true)).toHaveLength(2)
    expect(bytesOf('addi a0, a1, 1', true)).toHaveLength(4)
    expect(bytesOf('li a0, 5', true)).toHaveLength(2)
    expect(bytesOf('li a0, 500', true)).toHaveLength(4)
    expect(bytesOf('lw a0, 4(sp)', true)).toHaveLength(2)
    expect(bytesOf('ret', true)).toHaveLength(2)
  })
})

describe('the disassembler', () => {
  it('reads an instruction through a byte reader, its length from its first half-word', () => {
    const bytes = bytesOf('beq a0, a1, 0x8010')
    expect(disassemble(memory(bytes), AT)).toMatchObject({ size: 4, text: 'beq a0, a1, 0x8010' })
    const short = bytesOf('c.j 0x7ffe')
    expect(disassemble(memory(short), AT)).toMatchObject({ size: 2, text: 'c.j 0x7FFE' })
  })
})
