import { e16cMemory } from '@shared/e16c/builtins'
import { assemble, ramImage } from '@shared/elec16/asm'
import { textOf } from '@shared/elec16/disasm'
import { decode, ENCODINGS, encode32, type OpName } from '@shared/elec16/isa'
import type { Elec16 } from '@shared/elec16/machine'
import { describe, expect, it } from 'vitest'
import { disasmInto } from '../../resources/elec16/rom/basic/monitor.e16'
import { boot, screen, shown, type } from './elec16-helpers'

/**
 * The monitor's U and B (docs/elec16.md section 6). Its disassembler is e16c source, run here
 * as TypeScript on e16c's memory and held to disasm.ts for every 16-bit encoding and for
 * every 32-bit operation over its fields; then U and B on the ROM itself.
 */

const AT = 0x7000
const OUT = 0x6000

/** Every 32-bit operation the assembler can encode, its fields at their ends and in between. */
function everyOperation(): number[] {
  const out: number[] = []
  const operands = [
    [0, 0, 0],
    [15, 15, 15],
    [4, 9, 2],
  ]
  const imms = [0, 1, -1, 5, 0x7f, -0x2000, 0x1fff, 0x300, 0xc82, 0xfff, 0x7ffe]
  for (const name of Object.keys(ENCODINGS) as OpName[]) {
    for (const [rd = 0, rs1 = 0, rs2 = 0] of operands) {
      for (const imm of imms) {
        try {
          out.push(encode32(name, { rd, rs1, rs2, imm }) >>> 0)
        } catch {
          // Not an immediate this operation takes.
        }
      }
    }
  }
  return out
}

describe("the monitor's disassembler", () => {
  it('says what disasm.ts says for every 16-bit encoding', () => {
    let memory = e16cMemory()
    const wrong: string[] = []
    for (let h = 0; h < 0x10000; h++) {
      if ((h & 3) === 3) continue
      if (h % 64 === 0) memory = e16cMemory()
      memory[AT] = h & 0xff
      memory[AT + 1] = h >> 8
      const size = disasmInto(AT, OUT)
      const text = new TextDecoder().decode(memory.subarray(OUT, memory.indexOf(0, OUT)))
      const want = textOf(decode(h, 0), AT)
      if (text !== want || size !== 2) wrong.push(`${h.toString(16)}: ${text} / ${want}`)
    }
    expect(wrong.slice(0, 10)).toEqual([])
  })

  it('says what disasm.ts says for every 32-bit operation, over its fields and the reserved bits', () => {
    let memory = e16cMemory()
    const wrong: string[] = []
    let n = 0
    const check = (w: number): void => {
      if (n++ % 64 === 0) memory = e16cMemory()
      for (let k = 0; k < 4; k++) memory[AT + k] = (w >>> (8 * k)) & 0xff
      const size = disasmInto(AT, OUT)
      const text = new TextDecoder().decode(memory.subarray(OUT, memory.indexOf(0, OUT)))
      const want = textOf(decode(w & 0xffff, w >>> 16), AT)
      if (text !== want || size !== 4) wrong.push(`${(w >>> 0).toString(16)}: ${text} / ${want}`)
    }
    // Every operation with registers and immediates at their ends and in between.
    for (const w of everyOperation()) check(w)
    // Every major opcode and funct3 with fields set at random, legal or not.
    let seed = 0x1234567
    for (let k = 0; k < 40_000; k++) {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
      check((((seed << 2) | 3) >>> 0) ^ (k & 0x7c))
    }
    expect(wrong.slice(0, 10)).toEqual([])
    expect(n).toBeGreaterThan(40_000)
  })
})

/** E commands for code at 0x7000, eight bytes a line. */
function enter(m: Elec16, source: string): void {
  const out = assemble(`.org 0x7000\n${source}`)
  expect(out.errors).toEqual([])
  const hex = (b: number) => b.toString(16).toUpperCase().padStart(2, '0')
  const bytes = Array.from(ramImage(out, 0x7000), hex)
  for (let at = 0; at < bytes.length; at += 8) {
    type(m, `E ${(0x7000 + at).toString(16)} ${bytes.slice(at, at + 8).join(' ')}\n`)
  }
}

describe('U and B on the ROM', () => {
  it('U lists a screenful from an address, and goes on from there', () => {
    const m = boot()
    enter(m, 'addi t0, t0, 1\nli a0, 0x1234\nc.mv a1, a0\nbne t0, a0, 0x7000\nret\nc.ebreak')
    type(m, 'U 7000\n')
    // Five lines on six rows, and the prompt: the command's own line has gone up.
    expect(shown(m).slice(0, 5)).toEqual([
      '7000 c.addi t0, 1',
      '7002 li a0, 0x1234',
      '7006 c.mv a1, a0',
      '7008 bne t0, a0, 0x7000',
      '700C c.jr ra',
    ])
    type(m, 'U\n')
    expect(shown(m).at(-6)).toBe('700E c.ebreak')
  })

  it('B sets and clears breakpoints in RAM; G stops at one and puts the code back', () => {
    const m = boot()
    enter(m, 'li a0, 1\nli a1, 2\nadd a0, a0, a1\nret')
    type(m, 'B\n')
    expect(shown(m).at(-2)).toBe('NO BREAKPOINTS')
    type(m, 'B 7004\n')
    expect(shown(m).at(-2)).toBe('7004')
    type(m, 'B 8000\n')
    expect(shown(m).at(-2)).toBe('?')
    // An odd address is inside an instruction: C.EBREAK there would split it.
    type(m, 'B 7005\n')
    expect(shown(m).at(-2)).toBe('?')
    const before = Array.from(m.state.ram.subarray(0x7000, 0x7010))
    type(m, 'G 7000\n')
    expect(shown(m).at(-2)).toBe('BREAK AT 7004')
    // The code is as it was, and R shows a0 set and a1 not yet.
    expect(Array.from(m.state.ram.subarray(0x7000, 0x7010))).toEqual(before)
    type(m, 'B 7004\n')
    expect(shown(m).at(-2)).toBe('NO BREAKPOINTS')
    type(m, 'G 7000\n')
    expect(shown(m).at(-1)).toBe('*')
    expect(screen(m).join('\n')).not.toContain('FAULT')
  })
})
