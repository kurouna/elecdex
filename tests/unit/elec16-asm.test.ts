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

  it('refuses two things at one address, in the same bank but not in two', () => {
    const out = assemble('.org 0x8000\nnop\n.org 0x8000\nnop')
    expect(out.errors[0]?.message).toMatch(/overlaps/)
    bytes('.bank 0\n.org 0xc000\n.byte 1\n.bank 1\n.org 0xc000\n.byte 2')
    const twice = assemble('.bank 1\n.org 0xc000\n.byte 1\n.org 0xc000\n.byte 2')
    expect(twice.errors[0]?.message).toMatch(/overlaps/)
  })

  it('never decides a size while a placement is still unknown', () => {
    // In the first pass `.org base` is unknown, so the branch looks two bytes from its target.
    const out = bytes(`
      .org 0x8000
    target:
      nop
      .org base
      beqz a0, target
      ebreak
    base = 0x9000`)
    const branch = out.listing.find((l) => l.text.startsWith('beqz'))
    expect([branch?.address, branch?.bytes.length]).toEqual([0x9000, 4])
  })

  it('settles when a shorter instruction moves a target out of reach of another', () => {
    // The jump fits 16 bits until the branch before it shrinks, which moves it away from a
    // target held in place by .org: it has to grow back.
    const out = bytes(`
      .org 0x8000
      beqz a1, done
      .space 120
      j far
    done:
      ebreak
      .org 0x887a
    far:
      ebreak`)
    const size = (text: string) => out.listing.find((l) => l.text === text)?.bytes.length
    expect([size('beqz a1, done'), size('j far')]).toEqual([2, 4])
  })

  it('takes li and la values from -32768 to 65535 only', () => {
    bytes('.org 0x8000\nli a0, -32768\nli a0, 0xffff\nla a0, 0x8000')
    for (const v of ['-32769', '0x10000', '100000']) {
      expect(assemble(`.org 0x8000\nli a0, ${v}`).errors[0]?.message, v).toMatch(/li takes/)
    }
  })

  it('refuses a label or a name defined twice', () => {
    expect(assemble('.org 0x8000\na: nop\na: nop').errors[0]?.message).toMatch(/a is defined twice/)
    expect(assemble('x = 1\nx = 2').errors[0]?.message).toMatch(/x is defined twice/)
    expect(assemble('.org 0x8000\nf:\n.x: nop\ng:\n.x: nop').errors).toEqual([])
  })

  it('refuses data that does not fit its width, and a bank the ROM cannot have', () => {
    bytes('.org 0x8000\n.byte 255, -128\n.word 0xffff, -32768')
    expect(assemble('.org 0x8000\n.byte 300').errors[0]?.message).toMatch(/\.byte takes/)
    expect(assemble('.org 0x8000\n.word 0x10000').errors[0]?.message).toMatch(/\.word takes/)
    for (const b of ['-1', '12']) {
      expect(assemble(`.bank ${b}\n.org 0xc000\nnop`).errors[0]?.message, b).toMatch(
        /\.bank takes 0 to 11/,
      )
    }
  })

  it('takes a symbol as the value a csr…i instruction writes', () => {
    const out = bytes('IE = 8\n.org 0x8000\ncsrsi mstatus, IE\ncsrrwi a0, mie, IE / 4')
    const plain = bytes('.org 0x8000\ncsrsi mstatus, 8\ncsrrwi a0, mie, 2')
    expect(out.chunks).toEqual(plain.chunks)
  })

  it('jumps to itself with $', () => {
    const out = bytes('.org 0x8000\n.option nocompress\nj $')
    const self = bytes('.org 0x8000\n.option nocompress\nhere: j here')
    expect(out.chunks).toEqual(self.chunks)
  })
})

describe('macros and includes', () => {
  it('tells a label named like a macro from a call, and keeps every label before a call', () => {
    const out = bytes(`
      .macro push reg
      addi sp, sp, -2
      sw \\reg, 0(sp)
      .endm
      .org 0x8000
    push:
      nop
    a: b: push a0
      j push`)
    expect(out.symbols.get('push')).toBe(0x8000)
    expect(out.symbols.get('a')).toBe(0x8002)
    expect(out.symbols.get('b')).toBe(0x8002)
    expect(out.listing.map((l) => l.text)).toEqual([
      'nop',
      'addi sp, sp, -2',
      'sw a0, 0(sp)',
      'j push',
    ])
  })

  it('says when a macro calls itself without end, or a file includes itself', () => {
    const loop = assemble('.macro again\nagain\n.endm\n.org 0x8000\nagain')
    expect(loop.errors.map((e) => e.message)).toEqual(['macros nest deeper than 32'])
    const self = assemble('.include "self.s"', { include: () => '.include "self.s"' })
    expect(self.errors.map((e) => e.message)).toEqual(['includes nest deeper than 16'])
  })

  it('refuses a macro parameter that is not a name', () => {
    const out = assemble('.macro m a+b\nnop\n.endm')
    expect(out.errors[0]?.message).toMatch(/"a\+b" is not a name/)
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

describe('the assembler on a crafted source', () => {
  /** Assembled, with how long it took. */
  const timed = (source: string) => {
    const at = performance.now()
    const out = assemble(source)
    return { out, ms: performance.now() - at }
  }

  it('refuses more space than memory, and says an overlap once', () => {
    expect(timed('.org 0x7000\n.space 100000').out.errors[0]?.message).toMatch(/more space/)
    expect(timed('.org 0x7000\n.align 0x20000').out.errors[0]?.message).toMatch(/alignment/)
    const { out, ms } = timed(`.org 0x7000\n${'nop\n'.repeat(100_000)}`)
    expect(out.errors.filter((e) => /overlaps/.test(e.message))).toHaveLength(1)
    expect(ms).toBeLessThan(3000)
  })

  it('stops macros that expand without end, and sources that make too many lines', () => {
    const self = timed('.macro m\n m\n m\n.endm\nm')
    expect(self.out.errors[0]?.message).toMatch(/nest deeper|expand more/)
    const chain = ['.macro m0\n nop\n.endm']
    for (let k = 1; k <= 20; k++) chain.push(`.macro m${k}\n m${k - 1}\n m${k - 1}\n.endm`)
    const wide = timed(`.org 0x7000\n${chain.join('\n')}\nm20`)
    expect(wide.out.errors.map((e) => e.message).join()).toMatch(/expand more|more than/)
    expect(wide.ms).toBeLessThan(3000)
  })
})
