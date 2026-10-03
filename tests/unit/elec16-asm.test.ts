import { assemble, ramImage, romImage } from '@shared/elec16/asm'
import { evaluate, Unresolved } from '@shared/elec16/asm-expr'
import { describe, expect, it } from 'vitest'

/** The E16 assembler (docs/elec16.md section 6): symbols, directives, macros, and its errors. */

const bytes = (src: string, options = {}) => {
  const out = assemble(src, options)
  expect(out.errors).toEqual([])
  return out
}

describe('expressions', () => {
  const none = () => undefined
  it('take C precedence, hex, binary, characters, lo and hi, and $', () => {
    expect(evaluate('1 + 2 * 3', none, 0)).toBe(7)
    expect(evaluate('(1 + 2) * 3', none, 0)).toBe(9)
    expect(evaluate('0x10 | 0b11 << 2', none, 0)).toBe(0x1c)
    expect(evaluate("'A' + 1", none, 0)).toBe(66)
    expect(evaluate('hi(0x1234) + lo(0x1234)', none, 0)).toBe(0x12 + 0x34)
    expect(evaluate('$ + 2', none, 0x8000)).toBe(0x8002)
    expect(evaluate('-~0', none, 0)).toBe(1)
  })

  it('say a symbol not defined yet is unresolved, and other mistakes are errors', () => {
    expect(() => evaluate('later + 1', none, 0)).toThrow(Unresolved)
    expect(() => evaluate('1 +', none, 0)).toThrow(/expected a value/)
    expect(() => evaluate('4 / 0', none, 0)).toThrow(/division by zero/)
  })
})

describe('the assembler', () => {
  it('lays out data, strings, space and alignment', () => {
    const out = bytes(`
      .org 0x7000
      .byte 1, 2, "AB"
      .word 0x1234
      .asciz "hi\\n"
      .align 4
      .space 2, 0xee`)
    expect(Array.from(ramImage(out, 0x7000))).toEqual([
      1, 2, 65, 66, 0x34, 0x12, 104, 105, 10, 0, 0, 0, 0xee, 0xee,
    ])
  })

  it('knows labels before they are defined, and local labels per global one', () => {
    const out = bytes(`
      .org 0x8000
    first:
      j .end
    .end:
      j second
    second:
      j .end
    .end:
      ebreak`)
    expect(out.symbols.get('first.end')).toBe(0x8002)
    expect(out.symbols.get('second.end')).toBe(0x8006)
  })

  it('takes .equ and name = value, and uses them before their line', () => {
    const out = bytes(`
      .org 0x8000
      li a0, SIZE * 2
      SIZE = 0x40
      .equ OTHER, SIZE + 1`)
    expect(out.symbols.get('OTHER')).toBe(0x41)
    expect(out.listing[0]?.bytes).toHaveLength(4)
  })

  it('expands macros with their arguments and a unique number per use', () => {
    const out = bytes(`
      .macro twice reg
      addi \\reg, \\reg, 1
    .x\\@:
      addi \\reg, \\reg, 1
      .endm
      .org 0x8000
    start:
      twice a0
      twice a1`)
    expect(out.listing.map((l) => l.text)).toEqual([
      'addi a0, a0, 1',
      'addi a0, a0, 1',
      'addi a1, a1, 1',
      'addi a1, a1, 1',
    ])
    expect(out.symbols.has('start.x0')).toBe(true)
    expect(out.symbols.has('start.x1')).toBe(true)
  })

  it('includes other files through the function it is given', () => {
    const files: Record<string, string> = { 'lib.s': 'helper:\n  ret' }
    const out = bytes('.org 0x8000\ncall helper\n.include "lib.s"', {
      include: (name: string) => files[name] ?? null,
    })
    expect(out.symbols.get('helper')).toBe(0x8002)
    const missing = assemble('.include "nope.s"', { include: () => null })
    expect(missing.errors[0]?.message).toMatch(/cannot include nope.s/)
  })

  it('shortens a branch only once its target is near enough, and settles', () => {
    const near = bytes(`
      .org 0x8000
      beqz a0, done
      .space 100
    done:
      ebreak`)
    expect(near.listing[0]?.bytes).toHaveLength(2)
    const far = bytes(`
      .org 0x8000
      beqz a0, done
      .space 200
    done:
      ebreak`)
    expect(far.listing[0]?.bytes).toHaveLength(4)
  })

  it('writes 32-bit forms only with .option nocompress', () => {
    const out = bytes(
      '.org 0x8000\n.option nocompress\naddi a0, a0, 1\n.option compress\naddi a0, a0, 1',
    )
    expect(out.listing.map((l) => l.bytes.length)).toEqual([4, 2])
  })

  it('says what is wrong, and where', () => {
    const out = assemble(
      [
        '.org 0x8000',
        'frob a0',
        'addi a0, a0, 9000',
        'c.addi a0, a1',
        'li q9, 1',
        'beq a0, a1, nowhere',
        '.byte 1',
        'nop',
      ].join('\n'),
      { file: 'test.s' },
    )
    const messages = out.errors.map((e) => `${e.line}: ${e.message}`)
    expect(messages).toHaveLength(6)
    expect(messages).toEqual(
      expect.arrayContaining([
        '2: unknown instruction frob',
        expect.stringMatching(/^3: addi takes an immediate/),
        '4: a1 is a register where a value was wanted',
        '5: "q9" is not a register',
        '6: undefined symbol nowhere',
        expect.stringMatching(/^8: an instruction at an odd address/),
      ]),
    )
  })

  it('says when a c. form does not fit 16 bits', () => {
    const out = assemble('.org 0x8000\nc.addi a0, 100')
    expect(out.errors[0]?.message).toMatch(/c.addi does not fit 16 bits/)
  })

  it('refuses two things at one address', () => {
    const out = assemble('.org 0x8000\nnop\n.org 0x8000\nnop')
    expect(out.errors[0]?.message).toMatch(/overlaps/)
  })
})

describe('images', () => {
  it('puts the fixed ROM first and each bank after it, erased bytes as 0xFF', () => {
    const out = bytes(`
      .org 0x8000
      .byte 1
      .bank 2
      .org 0xc000
      .byte 2`)
    const rom = romImage(out)
    expect(rom.length).toBe(0x4000 + 3 * 0x2000)
    expect(rom[0]).toBe(1)
    expect(rom[1]).toBe(0xff)
    expect(rom[0x4000 + 2 * 0x2000]).toBe(2)
  })

  it('refuses RAM bytes in a ROM image, and ROM bytes in a RAM one', () => {
    expect(() => romImage(bytes('.org 0x7000\n.byte 1'))).toThrow(/not in the ROM/)
    expect(() => ramImage(bytes('.org 0x8000\n.byte 1'), 0x7000)).toThrow(/not in RAM/)
  })
})
