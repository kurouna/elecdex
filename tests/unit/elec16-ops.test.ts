import { assemble, romImage } from '@shared/elec16/asm'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import { describe, expect, it } from 'vitest'

/**
 * Every E16 operation does what docs/elec16.md section 4 says, checked against answers worked
 * out here on their own - not from the core's tables - over values at the edges (0, 1, the
 * sign bit, all ones) and in between. One program an operation runs every case and keeps each
 * answer in RAM; the cycles each kind of instruction takes are the table in section 4.
 */

const w = (v: number): number => v & 0xffff
const s = (v: number): number => (w(v) << 16) >> 16
const amount = (b: number): number => b & 15

const VALUES = [0, 1, 2, 0x7fff, 0x8000, 0xffff, 0x1234, 0x00f0, 0xfe01, 15, 16]

/** Where the answers go: a word a case. */
const OUT = 0x1000

function machine(src: string): Elec16 {
  const out = assemble(`.org 0x8000\n${src}\nebreak`)
  expect(out.errors).toEqual([])
  const m = Elec16.boot(romImage(out))
  expect(m.run(5_000_000).halted?.cause).toBe('breakpoint')
  return m
}

const answer = (m: Elec16, k: number): number =>
  (m.state.ram[OUT + k * 2] ?? 0) | ((m.state.ram[OUT + k * 2 + 1] ?? 0) << 8)

const PAIRS = VALUES.flatMap((a) => VALUES.map((b) => [a, b] as const))

const REGISTER: Record<string, (a: number, b: number) => number> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  and: (a, b) => a & b,
  or: (a, b) => a | b,
  xor: (a, b) => a ^ b,
  sll: (a, b) => a << amount(b),
  srl: (a, b) => a >>> amount(b),
  sra: (a, b) => s(a) >> amount(b),
  slt: (a, b) => (s(a) < s(b) ? 1 : 0),
  sltu: (a, b) => (a < b ? 1 : 0),
  mul: (a, b) => Math.imul(a, b),
  mulh: (a, b) => Math.floor((s(a) * s(b)) / 65536),
  mulhu: (a, b) => Math.floor((a * b) / 65536),
  mulhsu: (a, b) => Math.floor((s(a) * b) / 65536),
  // Division never traps: by zero all ones and the dividend, -32768 / -1 itself and 0.
  div: (a, b) =>
    b === 0 ? 0xffff : s(a) === -32768 && s(b) === -1 ? 0x8000 : Math.trunc(s(a) / s(b)),
  divu: (a, b) => (b === 0 ? 0xffff : Math.floor(a / b)),
  rem: (a, b) => (b === 0 ? a : s(a) === -32768 && s(b) === -1 ? 0 : s(a) % s(b)),
  remu: (a, b) => (b === 0 ? a : a % b),
  andn: (a, b) => a & ~b,
  orn: (a, b) => a | ~b,
  xnor: (a, b) => ~(a ^ b),
  min: (a, b) => (s(a) < s(b) ? a : b),
  max: (a, b) => (s(a) > s(b) ? a : b),
  minu: (a, b) => Math.min(a, b),
  maxu: (a, b) => Math.max(a, b),
  rol: (a, b) => (a << amount(b)) | (a >>> (16 - amount(b))),
  ror: (a, b) => (a >>> amount(b)) | (a << (16 - amount(b))),
  bset: (a, b) => a | (1 << amount(b)),
  bclr: (a, b) => a & ~(1 << amount(b)),
  binv: (a, b) => a ^ (1 << amount(b)),
  bext: (a, b) => (a >>> amount(b)) & 1,
}

const bits = (a: number): number[] => Array.from({ length: 16 }, (_, k) => (a >> k) & 1)
const UNARY: Record<string, (a: number) => number> = {
  clz: (a) => (a === 0 ? 16 : 15 - Math.floor(Math.log2(a))),
  ctz: (a) => (a === 0 ? 16 : bits(a).indexOf(1)),
  cpop: (a) => bits(a).reduce((n, b) => n + b, 0),
  'sext.b': (a) => ((a & 0xff) << 24) >> 24,
  'zext.b': (a) => a & 0xff,
  rev8: (a) => ((a & 0xff) << 8) | (a >>> 8),
}

const IMMEDIATES = [0, 1, -1, 5, 0x7f, -0x2000, 0x1fff, 15]
const IMMEDIATE: Record<string, (a: number, k: number) => number> = {
  addi: (a, k) => a + k,
  andi: (a, k) => a & k,
  ori: (a, k) => a | k,
  xori: (a, k) => a ^ k,
  slti: (a, k) => (s(a) < k ? 1 : 0),
  sltiu: (a, k) => (a < w(k) ? 1 : 0),
}
const SHIFT: Record<string, (a: number, n: number) => number> = {
  slli: (a, n) => a << n,
  srli: (a, n) => a >>> n,
  srai: (a, n) => s(a) >> n,
  rori: (a, n) => (a >>> n) | (a << (16 - n)),
  bseti: (a, n) => a | (1 << n),
  bclri: (a, n) => a & ~(1 << n),
  binvi: (a, n) => a ^ (1 << n),
  bexti: (a, n) => (a >>> n) & 1,
}

const BRANCH: Record<string, (a: number, b: number) => boolean> = {
  beq: (a, b) => a === b,
  bne: (a, b) => a !== b,
  blt: (a, b) => s(a) < s(b),
  bge: (a, b) => s(a) >= s(b),
  bltu: (a, b) => a < b,
  bgeu: (a, b) => a >= b,
}

const keep = (k: number): string => `sw a2, ${OUT + k * 2}(zero)`

describe('every operation', () => {
  it.each(Object.keys(REGISTER))('%s on two registers', (op) => {
    const m = machine(
      PAIRS.map(([a, b], k) => `li a0, ${a}\nli a1, ${b}\n${op} a2, a0, a1\n${keep(k)}`).join('\n'),
    )
    PAIRS.forEach(([a, b], k) => {
      expect(answer(m, k), `${op} ${a}, ${b}`).toBe(w(REGISTER[op]?.(a, b) ?? -1))
    })
  })

  it.each(Object.keys(UNARY))('%s on one register', (op) => {
    const m = machine(VALUES.map((a, k) => `li a0, ${a}\n${op} a2, a0\n${keep(k)}`).join('\n'))
    VALUES.forEach((a, k) => {
      expect(answer(m, k), `${op} ${a}`).toBe(w(UNARY[op]?.(a) ?? -1))
    })
  })

  it.each(Object.keys(IMMEDIATE))('%s with a 14-bit immediate, sign-extended', (op) => {
    const cases = VALUES.flatMap((a) => IMMEDIATES.map((k) => [a, k] as const))
    const m = machine(
      cases.map(([a, k], n) => `li a0, ${a}\n${op} a2, a0, ${k}\n${keep(n)}`).join('\n'),
    )
    cases.forEach(([a, k], n) => {
      expect(answer(m, n), `${op} ${a}, ${k}`).toBe(w(IMMEDIATE[op]?.(a, k) ?? -1))
    })
  })

  it.each(Object.keys(SHIFT))('%s by every amount', (op) => {
    const cases = VALUES.flatMap((a) => Array.from({ length: 16 }, (_, n) => [a, n] as const))
    const m = machine(
      cases.map(([a, n], k) => `li a0, ${a}\n${op} a2, a0, ${n}\n${keep(k)}`).join('\n'),
    )
    cases.forEach(([a, n], k) => {
      expect(answer(m, k), `${op} ${a}, ${n}`).toBe(w(SHIFT[op]?.(a, n) ?? -1))
    })
  })

  it.each(Object.keys(BRANCH))('%s taken exactly when its comparison holds', (op) => {
    const m = machine(
      PAIRS.map(
        ([a, b], k) =>
          `li a0, ${a}\nli a1, ${b}\nli a2, 0\n${op} a0, a1, taken${k}\nj kept${k}\ntaken${k}:\nli a2, 1\nkept${k}:\n${keep(k)}`,
      ).join('\n'),
    )
    PAIRS.forEach(([a, b], k) => {
      expect(answer(m, k), `${op} ${a}, ${b}`).toBe(BRANCH[op]?.(a, b) ? 1 : 0)
    })
  })

  it('LI loads any 16 bits, AUIPC adds them to its own address, JAL and JALR link past themselves', () => {
    const m = machine(
      [
        'li a0, 0xbeef',
        'here:',
        'auipc a1, 0x0100',
        'jal ra, there',
        'back:',
        'j done',
        'there:',
        'mv a3, ra',
        'la t0, done',
        'jalr t1, 0(t0)',
        'done:',
      ].join('\n'),
    )
    const r = Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
    const out = assemble(
      `.org 0x8000\n${['li a0, 0xbeef', 'here:', 'auipc a1, 0x0100', 'jal ra, there', 'back:'].join('\n')}\nthere:`,
    )
    expect(r.a0).toBe(0xbeef)
    expect(r.a1).toBe(w((out.symbols.get('here') ?? 0) + 0x0100))
    expect(r.a3).toBe(out.symbols.get('back'))
  })

  it('reads and writes CSRs by register and by immediate, setting and clearing bits', () => {
    const m = machine(
      [
        'li a0, 0x00f0',
        'csrrw a1, mscratch, a0',
        'li a0, 0x0f00',
        'csrrs a2, mscratch, a0',
        'li a0, 0x00f0',
        'csrrc a3, mscratch, a0',
        'csrrwi t0, mscratch, 5',
        'csrrsi t1, mscratch, 8',
        'csrrci t2, mscratch, 1',
        'csrrs t3, mscratch, zero',
      ].join('\n'),
    )
    const r = Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
    expect([r.a1, r.a2, r.a3, r.t0, r.t1, r.t2, r.t3]).toEqual([0, 0xf0, 0xff0, 0xf00, 5, 13, 12])
  })

  it('counts cycles and instructions in CSRs, each a word with its high half', () => {
    const m = machine(
      [
        'csrrs a0, instret, zero',
        'nop',
        'nop',
        'csrrs a1, instret, zero',
        'csrrs a2, cycle, zero',
        'csrrs a3, instreth, zero',
        'csrrs t0, cycleh, zero',
      ].join('\n'),
    )
    const r = Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
    expect(w((r.a1 ?? 0) - (r.a0 ?? 0))).toBe(3)
    expect(r.a2).toBeGreaterThan(r.a1 ?? 0)
    expect([r.a3, r.t0]).toEqual([0, 0])
  })
})

describe('cycles, as section 4 has them', () => {
  /** The cycles one instruction takes, run on its own. */
  const cycles = (line: string): number => {
    const out = assemble(`.org 0x8000\n${line}\nnext:\nebreak`)
    expect(out.errors).toEqual([])
    return Elec16.boot(romImage(out)).step().cycles
  }

  it('ALU 1, load and store 2, MUL 4, DIV and REM 18, CSR 2; compressed forms the same', () => {
    expect(cycles('add a0, a1, a2')).toBe(1)
    expect(cycles('c.add a0, a1')).toBe(1)
    expect(cycles('slli a0, a1, 3')).toBe(1)
    expect(cycles('clz a0, a1')).toBe(1)
    expect(cycles('lw a0, 0x100(zero)')).toBe(2)
    expect(cycles('lbu a0, 0x100(zero)')).toBe(2)
    expect(cycles('sw a0, 0x100(zero)')).toBe(2)
    expect(cycles('c.lwsp a0, 0')).toBe(2)
    expect(cycles('mul a0, a1, a2')).toBe(4)
    expect(cycles('mulhu a0, a1, a2')).toBe(4)
    expect(cycles('div a0, a1, a2')).toBe(18)
    expect(cycles('remu a0, a1, a2')).toBe(18)
    expect(cycles('csrrs a0, mscratch, zero')).toBe(2)
  })

  it('a branch 2 when taken and 1 when not; a jump 2', () => {
    expect(cycles('beq zero, zero, next')).toBe(2)
    expect(cycles('bne zero, zero, next')).toBe(1)
    expect(cycles('c.beqz zero, next')).toBe(2)
    expect(cycles('jal zero, next')).toBe(2)
    expect(cycles('c.j next')).toBe(2)
  })
})

describe('block transfer', () => {
  /** RAM with a pattern no two neighbours share, so a byte copied wrong shows. */
  const patterned = (): Uint8Array =>
    Uint8Array.from({ length: 0x8000 }, (_, k) => (k * 37 + 11) & 0xff)

  /** memmove, worked out on a copy of the RAM. */
  const moved = (ram: Uint8Array, to: number, from: number, n: number): Uint8Array => {
    const out = ram.slice()
    const block = ram.slice(from, from + n)
    out.set(block, to)
    return out
  }

  /** Runs one block instruction after setting a0-a2, a step at a time: the steps and cycles. */
  function blockRun(line: string, a0: number, a1: number, a2: number) {
    const out = assemble(
      `.org 0x8000\nli a0, ${a0}\nli a1, ${a1}\nli a2, ${a2}\nblock:\n${line}\nebreak`,
    )
    expect(out.errors).toEqual([])
    const m = Elec16.boot(romImage(out), undefined, patterned())
    for (let k = 0; k < 3; k++) m.step()
    const at = out.symbols.get('block') ?? 0
    const cycles: number[] = []
    while (m.state.pc === at) cycles.push(m.step().cycles)
    return { m, cycles }
  }

  const regs = (m: Elec16) => [4, 5, 6].map((r) => m.state.regs[r])

  it('MCPY copies as memmove does, eight bytes a step, a read and a write a byte', () => {
    const cases: [number, number, number][] = [
      [0x3000, 0x2000, 0],
      [0x3000, 0x2000, 1],
      [0x3000, 0x2000, 7],
      [0x3000, 0x2000, 8],
      [0x3000, 0x2000, 9],
      [0x3000, 0x2000, 300],
      // Overlapping: the destination ahead of the source is copied from the end.
      [0x2003, 0x2000, 40],
      [0x2000, 0x2003, 40],
      [0x2007, 0x2000, 8],
      [0x2001, 0x2000, 1],
    ]
    for (const [to, from, n] of cases) {
      const { m, cycles } = blockRun('mcpy a0, a1, a2', to, from, n)
      const what = `mcpy ${to.toString(16)} <- ${from.toString(16)} x${n}`
      expect(Array.from(m.state.ram), what).toEqual(Array.from(moved(patterned(), to, from, n)))
      const steps = Math.max(1, Math.ceil(n / 8))
      expect(cycles, what).toEqual(
        Array.from({ length: steps }, (_, k) => 1 + 2 * Math.min(8, Math.max(0, n - 8 * k))),
      )
      const back = to > from && to < from + n
      expect(regs(m), what).toEqual(back ? [to, from, 0] : [w(to + n), w(from + n), 0])
    }
  })

  it('MCPY goes from the end only while its destination lies in what is left of the source', () => {
    // Ten bytes three ahead: eight from the end, then the first two, which no longer overlap
    // anything left, forwards - rd and rs1 moved on by those two.
    const { m, cycles } = blockRun('mcpy a0, a1, a2', 0x2003, 0x2000, 10)
    expect(Array.from(m.state.ram)).toEqual(Array.from(moved(patterned(), 0x2003, 0x2000, 10)))
    expect(cycles).toEqual([17, 5])
    expect(regs(m)).toEqual([0x2005, 0x2002, 0])
  })

  it('MSET fills with the low byte of its value, eight bytes a step, a write a byte', () => {
    for (const [value, n] of [
      [0, 20],
      [0x12ab, 9],
      [0xff, 8],
      [7, 0],
    ] as const) {
      const { m, cycles } = blockRun('mset a0, a1, a2', 0x2100, value, n)
      const want = patterned()
      want.fill(value & 0xff, 0x2100, 0x2100 + n)
      expect(Array.from(m.state.ram)).toEqual(Array.from(want))
      const steps = Math.max(1, Math.ceil(n / 8))
      expect(cycles).toEqual(
        Array.from({ length: steps }, (_, k) => 1 + Math.min(8, Math.max(0, n - 8 * k))),
      )
      expect(regs(m)).toEqual([0x2100 + n, value, 0])
    }
  })

  it('stays at its own address between steps, its registers moved on, so it can be taken from', () => {
    const out = assemble(
      '.org 0x8000\nli a0, 0x3000\nli a1, 0x2000\nli a2, 20\nblock:\nmcpy a0, a1, a2\nebreak',
    )
    const m = Elec16.boot(romImage(out), undefined, patterned())
    for (let k = 0; k < 4; k++) m.step()
    expect(m.state.pc).toBe(out.symbols.get('block'))
    expect(regs(m)).toEqual([0x3008, 0x2008, 12])
    expect(Array.from(m.state.ram.subarray(0x3000, 0x3009))).toEqual([
      ...patterned().subarray(0x2000, 0x2008),
      patterned()[0x3008],
    ])
    expect(m.run(1000).halted?.cause).toBe('breakpoint')
    expect(regs(m)).toEqual([0x3014, 0x2014, 0])
  })

  it('traps a write it cannot make, at that byte, with what was done kept in its registers', () => {
    const out = assemble(
      [
        '.org 0x8000',
        'la t0, handler',
        'csrw mtvec, t0',
        'li a0, 0x7ffc',
        'li a1, 0x2000',
        'li a2, 10',
        'block:',
        'mcpy a0, a1, a2',
        'ebreak',
        'handler:',
        'csrr t1, mcause',
        'csrr t2, mtval',
        'csrr t3, mepc',
        // With no handler, EBREAK stops the machine rather than trapping again.
        'csrw mtvec, zero',
        'ebreak',
      ].join('\n'),
    )
    expect(out.errors).toEqual([])
    const m = Elec16.boot(romImage(out), undefined, patterned())
    expect(m.run(1000).halted?.cause).toBe('breakpoint')
    // Four bytes into the last of RAM, then the ROM at 8000 refuses the fifth.
    expect(regs(m)).toEqual([0x8000, 0x2004, 6])
    expect([m.state.regs[9], m.state.regs[10], m.state.regs[11]]).toEqual([
      7,
      0x8000,
      out.symbols.get('block'),
    ])
    expect(Array.from(m.state.ram.subarray(0x7ffc))).toEqual(
      Array.from(patterned().subarray(0x2000, 0x2004)),
    )
  })
})
