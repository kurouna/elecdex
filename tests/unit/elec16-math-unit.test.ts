import { assemble, romImage } from '@shared/elec16/asm'
import { decode, encode, format, parse } from '@shared/elec16/decimal'
import { Elec16 } from '@shared/elec16/machine'
import { MATH_ERR, MATH_OP, MATH_REG } from '@shared/elec16/math-unit'
import { describe, expect, it } from 'vitest'

/**
 * The maths unit at FF50 (docs/elec16.md section 5) as a program uses it: operands in RAM by
 * address, an operation written to OP, the result back in RAM, its cycles charged to the
 * instruction that started it, and the MATH line up until STATUS is read.
 */

const A = 0x100
const B = 0x108

/** A machine whose program sets A and B, runs the operations and stops. */
function run(ops: number[], setUp: (m: Elec16) => void = () => {}, angle = 0): Elec16 {
  const lines = [
    '.org 0x8000',
    `li t0, ${MATH_REG.a}`,
    `li t1, ${A}`,
    'sw t1, 0(t0)',
    `li t0, ${MATH_REG.b}`,
    `li t1, ${B}`,
    'sw t1, 0(t0)',
    `li t0, ${MATH_REG.angle}`,
    `li t1, ${angle}`,
    'sw t1, 0(t0)',
    `li t2, ${MATH_REG.op}`,
    ...ops.flatMap((op) => [`li t1, ${op}`, 'sw t1, 0(t2)']),
    `li t0, ${MATH_REG.status}`,
    'lw a0, 0(t0)',
    'ebreak',
  ]
  const out = assemble(lines.join('\n'))
  expect(out.errors).toEqual([])
  const m = Elec16.boot(romImage(out))
  setUp(m)
  const r = m.run(100_000)
  expect(r.halted?.cause).toBe('breakpoint')
  return m
}

const put = (m: Elec16, address: number, text: string) => {
  const p = parse(text)
  if (p === null) throw new Error(text)
  m.state.ram.set(encode(p.value), address)
}
const at = (m: Elec16, address: number) => {
  const d = decode(m.state.ram.subarray(address, address + 8))
  return d === null ? null : format(d)
}

describe('the maths unit', () => {
  it('works a binary operation on A and B into A, and a unary one on A', () => {
    const m = run([MATH_OP.div], (mm) => {
      put(mm, A, '1')
      put(mm, B, '3')
    })
    expect(at(m, A)).toBe('0.3333333333')
    expect(m.state.regs[4]).toBe(0)
    const s = run([MATH_OP.sin], (mm) => put(mm, A, '30'))
    expect(at(s, A)).toBe('0.5')
    const r = run([MATH_OP.sin], (mm) => put(mm, A, '100'), 2)
    expect(at(r, A)).toBe('1')
  })

  it('charges its cycles to the instruction that starts it, and raises the MATH line', () => {
    const quick = run([MATH_OP.neg], (mm) => put(mm, A, '2'))
    const slow = run([MATH_OP.sin], (mm) => put(mm, A, '2'))
    expect(slow.state.cycles - quick.state.cycles).toBe(2000 - 16)
    const raised = run([MATH_OP.neg], (mm) => put(mm, A, '2'))
    // STATUS was read last: the line is down again.
    expect(raised.state.math.pending).toBe(false)
  })

  it('says what went wrong, and writes nothing then', () => {
    const m = run([MATH_OP.div], (mm) => {
      put(mm, A, '5')
      put(mm, B, '0')
    })
    expect(m.state.regs[4]).toBe(MATH_ERR.divideByZero)
    expect(at(m, A)).toBe('5')
    const bad = run([MATH_OP.add], (mm) => mm.state.ram.set([1, 0, 0x10, 0, 0, 0, 0, 0], A))
    expect(bad.state.regs[4]).toBe(MATH_ERR.badNumber)
    const unknown = run([0x7f])
    expect(unknown.state.regs[4]).toBe(MATH_ERR.badOperation)
  })

  it('refuses an operand outside RAM', () => {
    const out = assemble(
      [
        '.org 0x8000',
        `li t0, ${MATH_REG.a}`,
        'li t1, 0x7ffc',
        'sw t1, 0(t0)',
        `li t0, ${MATH_REG.op}`,
        `li t1, ${MATH_OP.neg}`,
        'sw t1, 0(t0)',
        `li t0, ${MATH_REG.status}`,
        'lw a0, 0(t0)',
        'ebreak',
      ].join('\n'),
    )
    const m = Elec16.boot(romImage(out))
    m.run(10_000)
    expect(m.state.regs[4]).toBe(MATH_ERR.badAddress)
  })

  it('turns text into a number and back, and integers into numbers and back', () => {
    const m = run([MATH_OP.parse], (mm) => {
      mm.state.ram.set(
        [...'12.5*2'].map((c) => c.charCodeAt(0)),
        B,
      )
      mm.state.math.arg = 6
    })
    expect(at(m, A)).toBe('12.5')
    expect(m.state.math.arg).toBe(4)
    const f = run([MATH_OP.format], (mm) => put(mm, A, '1E15'))
    expect(f.state.math.arg).toBe(4)
    expect(String.fromCharCode(...f.state.ram.subarray(B, B + 4))).toBe('1E15')
    const i = run([MATH_OP.fromInt, MATH_OP.toInt], (mm) => {
      mm.state.math.arg = 0xfff6
    })
    expect(at(i, A)).toBe('-10')
    expect(i.state.math.arg).toBe(0xfff6)
    const big = run([MATH_OP.toInt], (mm) => put(mm, A, '40000'))
    expect(big.state.regs[4]).toBe(MATH_ERR.overflow)
  })

  it('gives the same random numbers from the same start, all below 1', () => {
    const a = run([MATH_OP.rnd, MATH_OP.rnd])
    const b = run([MATH_OP.rnd, MATH_OP.rnd])
    expect(at(a, A)).toBe(at(b, A))
    expect(at(a, A)?.startsWith('0.')).toBe(true)
  })

  it('compares into RESULT, and gives pi', () => {
    const m = run([MATH_OP.cmp], (mm) => {
      put(mm, A, '2')
      put(mm, B, '10')
    })
    expect(m.state.math.result).toBe(0xffff)
    const p = run([MATH_OP.pi])
    expect(at(p, A)).toBe('3.141592654')
  })
})
