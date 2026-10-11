import { readFileSync } from 'node:fs'
import { type DivideMagic, divideMagic, retargetLine, tidyJumps } from '@shared/e16c/back1'
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
  ['blockMoves', [5]],
  ['signedQuotient', [5, 0]],
  ['signedQuotient', [-7, 2]],
  ['signedQuotient', [-32768, -1]],
  ['numberPicks', [0]],
  ['numberPicks', [3]],
  ['numberPicks', [5]],
  ['numberPicks', [9]],
  ['signedQuotient', [100, -7]],
  ['fixedProducts', [16384, -16384]],
  ['fixedProducts', [-32768, -32768]],
  ['fixedProducts', [12345, -23456]],
  ['fixedProducts', [7, 3]],
  ['constantQuotients', [0, 0]],
  ['constantQuotients', [65535, 65535]],
  ['constantQuotients', [12345, 54321]],
  ['constantQuotients', [9, 40000]],
  ['constantQuotients', [65534, 39999]],
  ['inlinedArguments', [0]],
  ['inlinedArguments', [7]],
  ['inlinedArguments', [65000]],
  ['oneAfterAnother', [0]],
  ['oneAfterAnother', [9]],
  ['oneAfterAnother', [0xfff0]],
  ['manyAlive', [0]],
  ['manyAlive', [5]],
  ['manyAlive', [0xfffe]],
  ['argsInPlace', [0, 0]],
  ['argsInPlace', [3, 0xfff0]],
  ['argsInPlace', [0x8000, 77]],
]

/** n divided as the code divideMagic leads to does: MULHU, then the shifts and the add. */
function quotientBy({ pre, m, shift, add }: DivideMagic, n: number): number {
  const t = Math.floor(((add ? n : n >>> pre) * m) / 65536)
  return (add ? ((n - t) >>> 1) + t : t) >>> shift
}

/** One function of the sample at a level, as the listing has it: its header, slots and code. */
function sampleFunction(opt: 1 | 2, name: string): string {
  const out = compile([{ name: SAMPLE, text: readFileSync(SAMPLE, 'utf8') }], { ...OPTIONS, opt })
  expect(out.errors).toEqual([])
  const at = out.asm.search(new RegExp(`^; \\S+ ${name}\\(`, 'm'))
  expect(at, name).toBeGreaterThanOrEqual(0)
  return out.asm.slice(at).split(/\n\n/)[0] ?? ''
}

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
    // A program assembled and run for each of the sample's cases: -O0 takes about 1.5 s on
    // its own and passed 5 s with every file running beside it.
    20_000,
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

  it('at -O2 reads an inlined call’s plain arguments in place of the parameters it never writes', () => {
    const text = [
      'function scale(x: u16, k: u16): u16 { return wrap16(x * k) }',
      'function bump(x: u16, k: u16): u16 { x = wrap16(x + k); return x }',
      'export function f(a: u16): u16 { return wrap16(scale(a, 4) + bump(a, 3)) }',
    ].join(String.fromCharCode(10))
    const out = compile([{ name: 'args.ts', text }], { ...OPTIONS, opt: 2 })
    expect(out.errors).toEqual([])
    // scale's x and k are a and 4: no slot of their own, and a multiply by 4 is a shift.
    // bump writes x, which keeps its slot; its k is 3.
    expect(out.program.fns.find((fn) => fn.name === 'f')?.slots).toEqual(['a', 'bump.x'])
    expect(out.asm).toMatch(/^\s+slli \w+, \w+, 2$/m)
    expect(out.asm).not.toMatch(/^\s+mul /m)
  })

  it('shares places among locals whose lives never overlap, so -O1 keeps them without a frame', () => {
    for (const opt of [1, 2] as const) {
      const listing = sampleFunction(opt, 'oneAfterAnother')
      // Nine locals, never more than four alive at once: every one in a register.
      expect(listing, `-O${opt}`).not.toMatch(/ in -?\d+\((fp|sp)\)$/m)
      expect(listing, `-O${opt}`).toMatch(/;\s+a\/\S+ in s\d/)
    }
  })

  it('keeps a frame by sp, without fp, and s0 for a local', () => {
    for (const opt of [1, 2] as const) {
      const listing = sampleFunction(opt, 'manyAlive')
      expect(listing, `-O${opt}`).not.toMatch(/\bfp\b/)
      expect(listing, `-O${opt}`).toMatch(/ in \d+\(sp\)$/m)
      expect(listing, `-O${opt}`).toMatch(/ in s0$/m)
    }
  })

  it('divides by a constant that is no power of two with MULHU from -O1, by DIVU at -O0', () => {
    const text = [
      'export function q(x: u16): u16 { return div(x, 10) }',
      'export function r(x: u16): u16 { return x % 7 }',
      'export function p(x: u16): u16 { return div(x, 8) + x % 16 }',
    ].join(String.fromCharCode(10))
    for (const opt of [0, 1, 2] as const) {
      const out = compile([{ name: 'd.ts', text }], { ...OPTIONS, opt })
      expect(out.errors).toEqual([])
      const body = (fn: string) => out.asm.slice(out.asm.indexOf(`\n${fn}:`)).split(/\n\n/)[0] ?? ''
      if (opt === 0) {
        expect(body('q'), '-O0').toMatch(/^\s+divu /m)
        continue
      }
      expect(body('q'), `-O${opt}`).not.toMatch(/^\s+(divu|remu) /m)
      expect(body('q'), `-O${opt}`).toMatch(/^\s+li \w+, 52429$/m)
      expect(body('r'), `-O${opt}`).not.toMatch(/^\s+(divu|remu) /m)
      expect(body('r'), `-O${opt}`).toMatch(/^\s+mulhu /m)
      expect(body('p'), `-O${opt}`).not.toMatch(/^\s+mulhu /m)
    }
  })

  it('finds a MULHU way to divide that gives DIVU’s answer for every word', () => {
    // Every d and n was checked once (4.3 billion pairs, seconds); here every n for some d.
    const divisors = [...Array(65536).keys()].filter(
      (d) => d >= 3 && (d & (d - 1)) !== 0 && (d < 1024 || d % 61 === 0 || d > 65500),
    )
    for (const d of divisors) {
      const magic = divideMagic(d)
      expect(magic.m, `m for ${d}`).toBeLessThanOrEqual(0xffff)
      for (let n = 0; n < 65536; n++) {
        const q = quotientBy(magic, n)
        if (q !== Math.floor(n / d)) expect(q, `${n} / ${d}`).toBe(Math.floor(n / d))
      }
    }
    expect(divideMagic(10)).toEqual({ pre: 0, m: 52429, shift: 3, add: false })
    expect(divideMagic(100).pre).toBe(2)
    expect(divideMagic(7).add).toBe(true)
  })

  it('at -O1 finds where a moved temporary was computed, so that line can write the target', () => {
    const at = (lines: string[], from: string, to: string) => retargetLine(lines, from, to)
    // Past lines that touch neither register; comments and a slot's note do not count.
    expect(at(['  andi t0, s1, 31', '  andi t1, s2, 31'], 't0', 'a0')).toBe(0)
    expect(at(['  lw t0, 4(sp) ; x', '  ; FILE:3  f(x)', '  li a1, 2'], 't0', 'a0')).toBe(0)
    expect(at(['  mulq t0, s1, s2, 14', '  csrr t1, 3072'], 't0', 'a2')).toBe(0)
    // The line may read the target itself: it reads before it writes.
    expect(at(['  add t1, a1, t0'], 't1', 'a1')).toBe(0)
    expect(at(['  lw t0, 0(a0)'], 't0', 'a0')).toBe(0)
    // Not when a line between reads or writes the target, or reads the temporary.
    expect(at(['  add t0, s1, s2', '  addi t1, a0, 1'], 't0', 'a0')).toBe(-1)
    expect(at(['  add t0, s1, s2', '  li a0, 3'], 't0', 'a0')).toBe(-1)
    expect(at(['  add t0, s1, s2', '  addi t1, t0, 1'], 't0', 'a0')).toBe(-1)
    expect(at(['  lw t0, 0(s1)', '  sw a1, 0(a0)'], 't0', 'a0')).toBe(-1)
    expect(at(['  lw t0, 2(sp)', '  sw t0, 0(sp)'], 't0', 'a0')).toBe(-1)
    // Nor across a label, a jump, a branch, a call, an ECALL, a block move or assembly.
    for (const wall of [
      '.L1:',
      '  j .L2',
      '  bnez s1, .L2',
      '  call f',
      '  ecall',
      '  mcpy a0, a1, a2',
      '  ; end asm',
    ]) {
      expect(at(['  add t0, s1, s2', wall], 't0', 'a3'), wall).toBe(-1)
    }
    // A store, a branch or a call wrote nothing to retarget.
    expect(at(['  call g'], 'a0', 'a1')).toBe(-1)
    expect(at([], 't0', 'a0')).toBe(-1)
  })

  it('at -O1 computes an argument into its register, not a temporary moved there', () => {
    const text = [
      'declare function pair(a: u16, b: u16): u16',
      'export function two(x: u16, y: u16): u16 { return wrap16(pair(x & 31, y & 31) + x + y) }',
    ].join(String.fromCharCode(10))
    for (const opt of [1, 2] as const) {
      const out = compile([{ name: 'args.ts', text }], { ...OPTIONS, opt })
      expect(out.errors).toEqual([])
      expect(out.asm, `-O${opt}`).toMatch(/^\s+andi a0, s\d, 31$/m)
      expect(out.asm, `-O${opt}`).toMatch(/^\s+andi a1, s\d, 31$/m)
      expect(out.asm, `-O${opt}`).not.toMatch(/^\s+mv a[01], t\d$/m)
    }
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

  it('keeps an asm block whole: what follows a jump in it, its labels too', () => {
    // A jump over code in the block, and a loop back to a label after the jump.
    const text = [
      'export function f(_n: u16): u16 {',
      '  asm`',
      '    li a1, 0',
      '.top:',
      '    addi a1, a1, 3',
      '    addi a0, a0, -1',
      '    j .test',
      '    li a1, 999',
      '.test:',
      '    bnez a0, .top',
      '    mv a0, a1',
      '  `',
      '  return 0',
      '}',
    ].join(String.fromCharCode(10))
    for (const opt of [0, 1, 2] as const) {
      const out = compile([{ name: 'asm.ts', text }], { ...OPTIONS, opt })
      expect(out.errors).toEqual([])
      expect(out.asm, `-O${opt}`).toMatch(/^\s*\.test:$/m)
      const asm = assemble(
        ['.org 0x8000', 'li sp, 0x8000', 'li a0, 4', 'call f', 'mv a2, a1', 'ebreak', out.asm].join(
          String.fromCharCode(10),
        ),
      )
      expect(asm.errors, `-O${opt}`).toEqual([])
      const m = Elec16.boot(romImage(asm))
      expect(m.run(100_000).halted?.cause).toBe('breakpoint')
      // a1 counted 3 a pass, four passes; 999 never set.
      expect(m.state.regs[6], `-O${opt}`).toBe(12)
    }
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

  it('makes mulShift one MULQ at every level (MUL by 0), and works out constants', () => {
    const text = [
      'export function q(a: i16, b: i16): i16 { return mulShift(a, b, 14) }',
      'export function z(a: i16, b: i16): i16 { return mulShift(a, b, 0) }',
      'export function c(): i16 { return mulShift(-300, 200, 4) }',
    ].join(String.fromCharCode(10))
    for (const opt of [0, 1, 2] as const) {
      const out = compile([{ name: 'm.ts', text }], { ...OPTIONS, opt })
      expect(out.errors).toEqual([])
      const body = (fn: string) => out.asm.slice(out.asm.indexOf(`\n${fn}:`)).split(/\n\n/)[0] ?? ''
      expect(body('q').match(/^\s+mulq \w+, \w+, \w+, 14$/gm), `-O${opt}`).toHaveLength(1)
      expect(body('q'), `-O${opt}`).not.toMatch(/^\s+(mulh|srli|srai)/m)
      expect(body('z'), `-O${opt}`).toMatch(/^\s+mul \w+, \w+, \w+$/m)
      // -3750 worked out while compiling.
      expect(body('c'), `-O${opt}`).not.toMatch(/^\s+mul/m)
      expect(body('c'), `-O${opt}`).toMatch(/-3750|61786/)
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
      // A negative count or address is a huge one on the machine.
      ['export function bm(s: i16): void { memcpy(0x100, 0x200, s) }', /say which with u16/],
      ['const xs = bytes(4)\nexport function bn(): void { memset(xs, 0, 4) }', /is not a u16/],
      ['export function bo(): void { memset(0x100, 0) }', /takes 3 arguments/],
      // A runtime divisor read signed may be 0: idiv says what the machine gives, -1.
      ['export function dv(s: i16, t: i16): i16 { return div(s, t) }', /use idiv/],
      ['export function dw(w: u16, v: u16): i16 { return idiv(w, v) }', /idiv divides i16s/],
      // MULQ reads its registers signed: a u16 of 40000 is -25536 there.
      ['export function ms(w: u16, s: i16): i16 { return mulShift(w, s, 2) }', /multiplies i16s/],
      ['export function mt(s: i16): i16 { return mulShift(s, 40000, 2) }', /multiplies i16s/],
      ['export function mu(s: i16, k: u16): i16 { return mulShift(s, s, k) }', /0 to 15/],
      ['export function mv(s: i16): i16 { return mulShift(s, s, 16) }', /0 to 15/],
      ['export function mw(s: i16): i16 { return mulShift(s, s) }', /takes 3 arguments/],
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

  it('reads a ?: of the numbers 0 and 1 as a number, as TypeScript does, and of true and false as a truth', () => {
    const accepted = [
      // Once "3 does not fit a bool": the inner ?: was taken for a truth (BASIC's prompt hit it).
      'let f = false\nlet n: u16 = 0\nexport function a(): u16 { const r: u16 = f ? 1 | 2 : n > 0 ? 1 : 0; return r }',
      // A variable it starts is a number, which takes another number after.
      'export function b(x: u16): u16 { let k = x > 2 ? 1 : 0; k = 7; return k }',
      'export function c(x: u16): u16 { return (x > 2 ? 1 : 0) + 5 }',
      'export function d(x: u16): bool { const t = x > 2 ? true : false; return t }',
    ]
    for (const text of accepted) {
      for (const opt of [0, 1, 2] as const) {
        const out = compile([{ name: 'ok.ts', text }], { ...OPTIONS, opt })
        expect(out.errors, `-O${opt} ${text}`).toEqual([])
      }
    }
    // A truth is still not a number to compare with, as before.
    const truth = compile(
      [
        {
          name: 'bad.ts',
          text: 'export function e(x: u16): u16 { const t = x > 2 ? true : false; return t === 1 ? 3 : 4 }',
        },
      ],
      OPTIONS,
    )
    expect(truth.errors[0]?.message).toMatch(/never 1 or 0/)
  })

  it('writes assembly a person can read: names, slots and source lines', () => {
    const out = compile([{ name: SAMPLE, text: readFileSync(SAMPLE, 'utf8') }], OPTIONS)
    expect(out.asm).toMatch(/^gcd:$/m)
    expect(out.asm).toMatch(/;\s+a at 0\(fp\)/)
    expect(out.asm).toMatch(/sample\.e16\.ts:\d+ {2}while \(b !== 0\) \{/)
  })
})
