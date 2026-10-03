import { readFileSync } from 'node:fs'
import { tidyJumps } from '@shared/e16c/back1'
import { e16cMemory } from '@shared/e16c/builtins'
import { compile, type E16cOptions } from '@shared/e16c/compile'
import { Interp, OutOfBudget } from '@shared/e16c/interp'
import { assemble, romImage } from '@shared/elec16/asm'
import { Elec16 } from '@shared/elec16/machine'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * e16c (docs/elec16.md section 6): the sample program run two ways - as TypeScript, and
 * compiled to E16 and run on the machine - must give the same answers, at every level.
 */

const SAMPLE = 'tests/fixtures/e16c/sample.e16.ts'
const OPTIONS: E16cOptions = { opt: 0, data: { start: 0x0100, end: 0x0400 } }

/** The sample's functions run as TypeScript (typechecked on their own: tsconfig.e16c.json). */
let js: Record<string, (...args: number[]) => number>

beforeAll(async () => {
  e16cMemory()
  const path: string = '../fixtures/e16c/sample.e16'
  js = await import(path)
})

/** Compiles the sample and gives a function that runs one of its functions on a machine. */
function onMachine(options: E16cOptions) {
  const out = compile([{ name: SAMPLE, text: readFileSync(SAMPLE, 'utf8') }], options)
  expect(out.errors).toEqual([])
  return (fn: string, args: number[] = []): number => {
    const harness = [
      '.org 0x8000',
      'li sp, 0x8000',
      'call e16c_init',
      ...args.map((a, k) => `li a${k}, ${a & 0xffff}`),
      `call ${fn}`,
      'ebreak',
      out.asm,
    ].join('\n')
    const asm = assemble(harness)
    expect(asm.errors).toEqual([])
    const m = Elec16.boot(romImage(asm))
    const r = m.run(20_000_000)
    expect(r.halted?.cause, `${fn} stopped at ${r.halted?.pc.toString(16)}`).toBe('breakpoint')
    return m.state.regs[4] ?? 0
  }
}

const CASES: [string, number[]][] = [
  ['fib', [15]],
  ['gcd', [1071, 462]],
  ['greetingLength', []],
  ['sortBytes', [20]],
  ['squares', []],
  ['signedMix', [-20, 3]],
  ['signedMix', [7, -2]],
  ['classify', [0]],
  ['classify', [2]],
  ['classify', [20]],
  ['classify', [30]],
  ['classify', [60]],
  ['logic', [5, 5]],
  ['logic', [0, 9]],
  ['bufferAt', []],
  ['breaks', []],
  ['choiceThenCall', [0]],
  ['choiceThenCall', [5]],
  ['nestedArguments', [7]],
  ['pick', [1, 7, 9]],
  ['pick', [9, 7, 9]],
  ['nestedCalls', []],
  ['deepExpression', [3, 4]],
  ['readings', [0x8123]],
  ['readings', [0x0456]],
  ['conditions', [0, 5, 0]],
  ['conditions', [2, 2, 3]],
  ['conditions', [2, 0, 0]],
  ['conditions', [5, 1, 9]],
  ['offsets', [3]],
  ['leafMany', [1, 2, 3, 4]],
  ['leafMany', [40, 2, 300, 7]],
  ['constants', [1234, -1234]],
  ['constants', [0xfedc, 777]],
  ['switchLoop', [12]],
  ['misc', [6]],
  ['callsInArguments', [4]],
  ['pendingSums', [4]],
  ['stepByIndex', []],
  ['stringByCall', []],
  ['fullPicture', [0]],
  ['fullPicture', [1]],
  ['deadArm', [4]],
  ['elementsCut', [-5]],
  ['negativeLocal', [1]],
]

describe('e16c', () => {
  it.each([0, 1, 2] as const)(
    'gives the same answers compiled at -O%i as the source run as TypeScript',
    (opt) => {
      const run = onMachine({ ...OPTIONS, opt })
      for (const [fn, args] of CASES) {
        const f = js[fn] as (...a: number[]) => number
        expect(run(fn, args), `${fn}(${args})`).toBe(f(...args) & 0xffff)
      }
    },
  )

  it('gives the same answers run as stack code in the interpreter', () => {
    const { program } = compile([{ name: SAMPLE, text: readFileSync(SAMPLE, 'utf8') }], OPTIONS)
    for (const [fn, args] of CASES) {
      const vm = new Interp(program)
      vm.init()
      const f = js[fn] as (...a: number[]) => number
      expect(vm.call(fn, args), `${fn}(${args})`).toBe(f(...args) & 0xffff)
    }
  })

  it('at -O2 works out pure calls, inlines small leaves and drops what nothing reaches', () => {
    const text = [
      'function square(x: u16): u16 { return x * x }',
      'function cube(x: u16): u16 { return x * x * x }',
      'function unused(): u16 { return 7 }',
      'export function table(): u16 { return cube(3) + square(4) }',
      'export function twice(n: u16): u16 { return square(n) + 1 }',
    ].join(String.fromCharCode(10))
    const out = compile([{ name: 'o2.ts', text }], { ...OPTIONS, opt: 2 })
    expect(out.errors).toEqual([])
    const table = out.program.fns.find((f) => f.name === 'table')
    // cube(3) + square(4), all known: one constant (27 + 16).
    expect(table?.body.filter((op) => op.k !== 'line')).toEqual([
      { k: 'push', v: 43 },
      { k: 'ret', value: true },
    ])
    // square, called once that is left, is inlined into twice; unused, square and cube go.
    expect(out.program.fns.map((f) => f.name).sort()).toEqual(['table', 'twice'])
    expect(out.asm).not.toMatch(/call square/)
  })

  it('at -O2 inlines a larger leaf only where it is the one call, so the program shrinks', () => {
    const body = 'let s: u16 = a; s = s * 3 + b; s = s ^ (s >> 2); s = s + 9; return s & 255'
    const text = [
      `function mix(a: u16, b: u16): u16 { ${body} }`,
      `function once(a: u16, b: u16): u16 { ${body} }`,
      'export function f(x: u16): u16 { return mix(x, 1) + mix(x, 2) + once(x, 3) }',
    ].join(String.fromCharCode(10))
    const out = compile([{ name: 'size.ts', text }], { ...OPTIONS, opt: 2 })
    expect(out.errors).toEqual([])
    expect(out.asm.match(/call mix/g)).toHaveLength(2)
    expect(out.asm).not.toMatch(/call once|^once:/m)
    expect(out.program.fns.map((f) => f.name).sort()).toEqual(['f', 'mix'])
  })

  it('at -O1 drops what follows a jump up to a label, and a jump to the label that comes next', () => {
    const lines = [
      'f:',
      '  j .L1',
      '  li a0, 0',
      '  ; a comment',
      '.L1:',
      '  j .return',
      '.L2:',
      '.return:',
      '  ret',
      '  j f',
    ]
    expect(tidyJumps(lines)).toEqual(['f:', '  ; a comment', '.L1:', '.L2:', '.return:', '  ret'])
    // A return with nothing to restore is `ret` itself; one just before the epilogue's goes.
    expect(tidyJumps(['g:', '  beqz a0, .L1', '  ret', '.L1:', '.return:', '  ret'])).toEqual([
      'g:',
      '  beqz a0, .L1',
      '.L1:',
      '.return:',
      '  ret',
    ])
  })

  it('at -O2 leaves a pure call it cannot finish within its budget as a call', () => {
    const text = [
      'function spin(n: u16): u16 { let i: u16 = 0; while (i !== n) i++; return i }',
      'export function f(): u16 { return spin(65000) }',
    ].join(String.fromCharCode(10))
    const out = compile([{ name: 'spin.ts', text }], { ...OPTIONS, opt: 2 })
    expect(out.asm).toMatch(/call spin|\.I1/)
  })

  it('stops a run past its budget in the interpreter', () => {
    const { program } = compile(
      [{ name: 'loop.ts', text: 'export function forever(): u16 { while (true) {} return 0 }' }],
      OPTIONS,
    )
    const vm = new Interp(program, { budget: 1000 })
    expect(() => vm.call('forever')).toThrow(OutOfBudget)
  })

  it('keeps globals in RAM, set by e16c_init', () => {
    const run = onMachine(OPTIONS)
    // fib(10) calls itself 177 times; the count starts at 0 on each run.
    expect(run('fib', [10])).toBe(55)
  })

  it.each([0, 1, 2] as const)(
    'at -O%i puts a file in a ROM bank and calls across banks through far_call',
    (opt) => {
      const nl = String.fromCharCode(10)
      const files = [
        {
          name: 'fixed.ts',
          text: [
            'export function top(x: u16): u16 { return mid(x) + 1 }',
            'export function back(x: u16): u16 { return x + 10 }',
          ].join(nl),
        },
        {
          name: 'one.ts',
          bank: 1,
          text: [
            "const HELLO = str('HI')",
            'export function mid(x: u16): u16 { return low(x) * 2 + peek(HELLO) + near(x) }',
            'function near(x: u16): u16 { return x }',
          ].join(nl),
        },
        {
          name: 'two.ts',
          bank: 2,
          text: 'export function low(x: u16): u16 { return back(x) + 3 }',
        },
      ]
      const out = compile(files, { ...OPTIONS, opt })
      expect(out.errors).toEqual([])
      // The same routine as the ROM's (main.s): t0 the address, t1 the bank.
      const farCall = [
        'far_call:',
        '  addi sp, sp, -4',
        '  sw ra, 2(sp)',
        '  lw t2, -0xfc(zero)',
        '  sw t2, 0(sp)',
        '  sw t1, -0xfc(zero)',
        '  jalr ra, 0(t0)',
        '  lw t2, 0(sp)',
        '  sw t2, -0xfc(zero)',
        '  lw ra, 2(sp)',
        '  addi sp, sp, 4',
        '  ret',
      ]
      const harness = [
        '.org 0x8000',
        'li sp, 0x8000',
        'call e16c_init',
        'li a0, 5',
        'call top',
        'lw a1, -0xfc(zero)',
        'ebreak',
        ...farCall,
        out.asm,
      ].join(nl)
      const asm = assemble(harness)
      expect(asm.errors).toEqual([])
      const m = Elec16.boot(romImage(asm))
      expect(m.run(100_000).halted?.cause).toBe('breakpoint')
      // back 15, low 18, mid 36 + 'H' + 5, top + 1; and the window shows bank 0 again.
      expect([m.state.regs[4], m.state.regs[5]]).toEqual([36 + 72 + 5 + 1, 0])
      expect(out.asm).toMatch(/\.bank 1\s+\.org 0xc000/)
      if (opt === 2) expect(out.asm).not.toMatch(/call near/)
    },
  )

  it('refuses a string of a ROM bank read from outside that bank', () => {
    const files = [
      { name: 'one.ts', bank: 1, text: "export const HELLO = str('HI')" },
      { name: 'fixed.ts', text: 'export function f(): u16 { return peek(HELLO) }' },
    ]
    const out = compile(files, OPTIONS)
    expect(out.errors.map((e) => e.message)).toEqual([
      "HELLO is in ROM bank 1: only that bank's functions can read it",
    ])
  })

  it('says once that the data area is full, at the first that does not fit, and nothing at its uses', () => {
    const text = [
      'const big = bytes(700)',
      'let a: u16 = 0',
      'const more = bytes(100)',
      'let b: u16 = 0',
      'export function f(): u16 { a = 1; b = a; more[0] = 1; return b }',
    ].join(String.fromCharCode(10))
    const out = compile([{ name: 'full.ts', text }], {
      ...OPTIONS,
      data: { start: 0x100, end: 0x400 },
    })
    expect(out.errors).toEqual([
      { file: 'full.ts', line: 3, column: 14, message: 'the data area (0x0100-0x0400) is full' },
    ])
  })

  it('answers with an error, never an exception, for what it cannot do', () => {
    const deep = [
      'function down(n: u16): u16 { if (n === 0) return 0; return down(n - 1) + 1 }',
      'export function f(): u16 { return down(5000) }',
    ].join('\n')
    // -O2 tries the pure call and gives up on its depth: the call stays.
    const o2 = compile([{ name: 'deep.ts', text: deep }], { ...OPTIONS, opt: 2 })
    expect(o2.errors).toEqual([])
    expect(o2.asm).toMatch(/call down/)
    const parens = `export function g(): u16 { return ${'('.repeat(20_000)}1${')'.repeat(20_000)} }`
    const nested = compile([{ name: 'parens.ts', text: parens }], OPTIONS)
    expect(nested.errors[0]?.message).toMatch(/nests too deeply|too deep/)
    const wide = `export function h(a: u16, f: bool): u16 { return a + (a + (a + (a + (a + (a + (a + (a + (f ? 1 : 2)))))))) }`
    const many = compile([{ name: 'wide.ts', text: wide }], { ...OPTIONS, opt: 1 })
    if (many.errors.length > 0) expect(many.errors[0]).toMatchObject({ file: 'wide.ts' })
    // Every ECALL register filled by a call's answer, none free to shuffle through: -O1 once
    // threw from under its own picture.
    const ecalls = [
      'function id(x: u16): u16 { return x }',
      'export function f(x: u16): u16 { return ecall(id(9), id(1), id(2), id(3), id(x)) }',
    ].join('\n')
    for (const opt of [0, 1, 2] as const) {
      expect(compile([{ name: 'ecall.ts', text: ecalls }], { ...OPTIONS, opt }).errors).toEqual([])
    }
  })

  it('multiplies by 0xFFFF with MUL: there is no shift by 16', () => {
    const text = 'export function m(x: u16): u16 { return wrap16(x * 0xffff) }'
    for (const opt of [1, 2] as const) {
      const out = compile([{ name: 'm.ts', text }], { ...OPTIONS, opt })
      expect(out.errors).toEqual([])
      const asm = assemble(
        ['.org 0x8000', 'li sp, 0x8000', 'li a0, 3', 'call m', 'ebreak', out.asm].join('\n'),
      )
      expect(asm.errors).toEqual([])
      const m = Elec16.boot(romImage(asm))
      m.run(10_000)
      expect(m.state.regs[4]).toBe((3 * 0xffff) & 0xffff)
    }
  })

  it('says what is outside the subset, where', () => {
    const bad = [
      'export function f(a: u16): u16 { return a / 2 }',
      'export function g(a: i16, b: u16): bool { return a < b }',
      'const xs = bytes(4)\nexport function h(): u16 { return xs + 1 }',
      'export function k(): u16 { const o = { a: 1 }; return 0 }',
      'export function m(a: u16): u16 { let s = a; s = a = 2; return s }',
      'class C {}',
      'export function n(x: u16): bool { return x < -1 }',
      'export function p(s: i16): bool { return s < 40000 }',
      'export function q(x: u16): u16 { const b: u8 = x; return b }',
      'export function r(x: u16): i16 { return x as i16 }',
    ]
    const messages = bad.map(
      (text) => compile([{ name: 'bad.ts', text }], OPTIONS).errors[0]?.message ?? '',
    )
    expect(messages[0]).toMatch(/use div/)
    expect(messages[1]).toMatch(/mixes i16/)
    expect(messages[2]).toMatch(/use addr/)
    expect(messages[3]).toMatch(/not in the subset/)
    expect(messages[4]).toMatch(/statement here/)
    expect(messages[5]).toMatch(/not in the subset at the top level/)
    expect(messages[6]).toMatch(/-1 is not a u16/)
    expect(messages[7]).toMatch(/40000 is not a i16/)
    expect(messages[8]).toMatch(/is not a u8: take its low byte with u8/)
    expect(messages[9]).toMatch(/differs in TypeScript/)
    // What TypeScript and the machine would read differently: refused, not compiled.
    const differs: [string, RegExp][] = [
      ['export function a(): u16 { let x: u16 = -1; return x }', /-1 does not fit a u16/],
      ['let g: u8 = 300\nexport function b(): u16 { return g }', /300 does not fit a u8/],
      ['let h: bool = 2\nexport function b2(): u16 { return 0 }', /2 does not fit a bool/],
      [
        'export function c(f: bool, s: i16, w: u16): u16 { return u16(f ? s : w) }',
        /one answer is signed/,
      ],
      ['export function d(f: bool, w: u16): u8 { const b: u8 = f ? w : 1; return b }', /not a u8/],
      ['export function e(w: u16): u16 { return w << 16 }', /a shift by 16/],
      ['export function f(w: u16): u16 { return div(w, 0) }', /division by zero/],
      ['export function g(w: u16): u16 { return w % 0 }', /division by zero/],
      ['export function h(w: u16): u16 { return div(w, -1) }', /-1 is not a u16/],
      [
        'export function k(w: u16): u16 { switch (w) { case -1: return 1 } return 0 }',
        /-1 is not a u16/,
      ],
      [
        'export function m(f: bool): u16 { return f ? 1 : -1 }',
        /an i16 is not a u16|i16 is not a u16/,
      ],
      [
        'export function z(s: i16): u16 { const w: u16 = s; return w }',
        /i16 is not a u16: say which with u16/,
      ],
      ['export function y(w: u16): i16 { return w }', /u16 is not a i16: say which with i16/],
      // -1 >>> 1 is 2147483647 in TypeScript, 0x7FFF on the machine.
      ['export function sh(s: i16): u16 { return u16(s >>> 1) }', />>> on an i16/],
      // true === 1 is false in TypeScript; the machine's bool is 1.
      [
        'export function eq(x: u16): u16 { const b: bool = x > 2; return b === 1 ? 10 : 20 }',
        /never 1 or 0/,
      ],
      [
        'export function sw(b: bool): u16 { switch (b) { case 1: return 1 } return 0 }',
        /1 is not a bool/,
      ],
    ]
    for (const [text, said] of differs) {
      expect(compile([{ name: 'bad.ts', text }], OPTIONS).errors[0]?.message, text).toMatch(said)
    }
    // A negative constant with no type said is an i16, and a byte beside a word is a word.
    const fine = compile(
      [
        {
          name: 'fine.ts',
          text: 'const LOW = -1\nexport function n(x: i16, f: bool, b: u8, w: u16): u16 { return u16(x === LOW ? 1 : 0) + (f ? b : w) }',
        },
      ],
      OPTIONS,
    )
    expect(fine.errors).toEqual([])
    const placed = compile(
      [{ name: 'bad.ts', text: '\n\nexport function f(a: u16): u16 { return a / 2 }' }],
      OPTIONS,
    )
    expect(placed.errors[0]).toMatchObject({ file: 'bad.ts', line: 3 })
  })

  it('writes assembly a person can read: names, slots and source lines', () => {
    const out = compile([{ name: SAMPLE, text: readFileSync(SAMPLE, 'utf8') }], OPTIONS)
    expect(out.asm).toMatch(/^gcd:$/m)
    expect(out.asm).toMatch(/;\s+a at 0\(fp\)/)
    expect(out.asm).toMatch(/sample\.e16\.ts:\d+ {2}while \(b !== 0\) \{/)
  })
})
