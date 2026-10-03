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

const halves = (word: number): [number, number] => [word & 0xffff, word >>> 16]

const memory = (bytes: number[]) => (a: number) => bytes[a - AT] ?? 0

/** Operands a format can take, drawn from a seeded sequence so a failure repeats. */
function operandsFor(name: OpName, next: () => number): Omit<Inst, 'op' | 'size' | 'c'> {
  const reg = () => next() & 15
  const format = ENCODINGS[name]?.format
  const pick = (lo: number, hi: number) => lo + (next() % (hi - lo + 1))
  if (name === 'mcpy' || name === 'mset') {
    // Three different registers, none zero (blockRegisters): drawn from 1 to 15 in turn.
    const rd = pick(1, 15)
    const rs1 = ((rd + pick(0, 6)) % 15) + 1
    let rs2 = ((rs1 + pick(0, 6)) % 15) + 1
    while (rs2 === rd || rs2 === rs1) rs2 = (rs2 % 15) + 1
    return { rd, rs1, rs2, imm: 0 }
  }
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
  it('has one for every operation, and 103 operations', () => {
    expect(NAMES).toHaveLength(78)
    for (const name of NAMES) expect(ENCODINGS[name], name).toBeDefined()
    // 78 operations in 32 bits and 25 compressed forms: the 103 of docs/elec16.md.
    expect(NAMES.length + C_OPS.length).toBe(103)
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

  it('a word that decodes is the one encoding of what it decodes to (no aliases)', () => {
    // Every other word is illegal, so nothing can come to mean something by accident.
    let state = seedOf(32)
    const next = () => (state = xorshift32(state))
    const check = (word: number) => {
      const inst = decode(word & 0xffff, word >>> 16)
      if (inst.op === 0) return 0
      const name = OPS[inst.op] as OpName
      expect(encode32(name, inst), `${word.toString(16)} ${name}`).toBe(word >>> 0)
      return 1
    }
    let legal = 0
    for (let k = 0; k < 400_000; k++) legal += check((next() | 3) >>> 0)
    expect(legal).toBeGreaterThan(10_000)
    // Every kind field of ECALL and its kin (once, 0x80 read as ECALL).
    for (let kind = 0; kind < 0x4000; kind++) check(((kind << 18) | (9 << 2) | 3) >>> 0)
  })

  it('refuses operands that do not fit their field', () => {
    expect(() => encode32('addi', { rd: 1, rs1: 1, rs2: 0, imm: 8192 })).toThrow(/immediate/)
    expect(() => encode32('beq', { rd: 0, rs1: 1, rs2: 1, imm: 3 })).toThrow(/even/)
    expect(() => encode32('slli', { rd: 1, rs1: 1, rs2: 0, imm: 16 })).toThrow(/shift/)
    expect(() => encode32('jal', { rd: 1, rs1: 0, rs2: 0, imm: 0x10000 })).toThrow(/64 KB/)
  })

  it('gives MCPY and MSET three different registers, none zero but the value of MSET', () => {
    const regs = (rd: number, rs1: number, rs2: number) => ({ rd, rs1, rs2, imm: 0 })
    for (const [name, f] of [
      ['mcpy', regs(0, 5, 6)],
      ['mcpy', regs(4, 0, 6)],
      ['mcpy', regs(4, 5, 0)],
      ['mcpy', regs(4, 4, 6)],
      ['mcpy', regs(4, 5, 4)],
      ['mcpy', regs(4, 5, 5)],
      ['mset', regs(0, 5, 6)],
      ['mset', regs(4, 5, 0)],
      ['mset', regs(4, 4, 6)],
      ['mset', regs(4, 6, 6)],
    ] as const) {
      expect(() => encode32(name, f), `${name} ${JSON.stringify(f)}`).toThrow(/three different/)
      // The same word, put together by hand, is illegal.
      const word =
        (encode32(name, regs(4, 5, 6)) & ~((15 << 7) | (15 << 14) | (15 << 18))) |
        (f.rd << 7) |
        (f.rs1 << 14) |
        (f.rs2 << 18)
      expect(decode(word & 0xffff, word >>> 16).op, `${name} ${JSON.stringify(f)}`).toBe(0)
    }
    expect(decode(...halves(encode32('mset', regs(4, 0, 6)))).op).toBe(OP.mset)
    expect(bytesOf('mset a0, zero, a2')).toHaveLength(4)
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

  it('has no form that leaves everything as it was, but c.nop', () => {
    const q1 = (sel: number, r: number, imm: number) =>
      ((sel >> 1) << 13) | (r << 9) | ((imm & 63) << 3) | ((sel & 1) << 2) | 1
    const q2 = (f4: number, rd: number, rs2: number, f2: number) =>
      (f4 << 12) | (rd << 8) | (rs2 << 4) | (f2 << 2) | 2
    const a0 = 4
    const idle = {
      'c.addi a0, 0': q1(0, a0, 0),
      'c.slli a0, 0': q1(2, a0, 0),
      'c.srli a0, 0': q1(3, a0, 0),
      'c.srai a0, 0': q1(4, a0, 0),
      'c.andi a0, -1': q1(5, a0, -1),
      'c.mv a0, a0': q2(0, a0, a0, 0),
      'c.add a0, zero': q2(0, a0, 0, 1),
      'c.sub a0, zero': q2(0, a0, 0, 2),
      'c.xor a0, zero': q2(0, a0, 0, 3),
      'c.or a0, zero': q2(1, a0, 0, 1),
    }
    for (const [text, half] of Object.entries(idle)) expect(decode(half, 0).op, text).toBe(0)
    // What they would write is assembled long, or not shortened at all.
    expect(bytesOf('slli a0, a0, 0', true)).toHaveLength(4)
    expect(bytesOf('add a0, a0, zero', true)).toHaveLength(4)
    expect(bytesOf('mv a0, a0', true)).toHaveLength(4)
    expect(bytesOf('andi a0, a0, -1', true)).toHaveLength(4)
    // Clearing with AND, or moving zero in, still changes the register.
    expect(decode(q2(1, a0, 0, 0), 0).op).toBe(OP.and)
    expect(decode(q2(0, a0, 0, 0), 0).op).toBe(OP.add)
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
