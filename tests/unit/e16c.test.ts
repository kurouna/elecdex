import { readFileSync } from 'node:fs'
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
      'function cube(x: u16): u16 { return square(x) * x }',
      'function unused(): u16 { return 7 }',
      'export function table(): u16 { return cube(3) + square(4) }',
      'export function twice(n: u16): u16 { return square(n) + 1 }',
    ].join(String.fromCharCode(10))
    const out = compile([{ name: 'o2.ts', text }], { ...OPTIONS, opt: 2 })
    expect(out.errors).toEqual([])
    const table = out.program.fns.find((f) => f.name === 'table')
    // cube(3) + square(4), all known: one constant.
    expect(table?.body.filter((op) => op.k !== 'line')).toEqual([
      { k: 'push', v: 43 },
      { k: 'ret', value: true },
    ])
    // square is inlined into twice; unused, square and cube are gone.
    expect(out.program.fns.map((f) => f.name).sort()).toEqual(['table', 'twice'])
    expect(out.asm).not.toMatch(/call square/)
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

  it('says what is outside the subset, where', () => {
    const bad = [
      'export function f(a: u16): u16 { return a / 2 }',
      'export function g(a: i16, b: u16): bool { return a < b }',
      'const xs = bytes(4)\nexport function h(): u16 { return xs + 1 }',
      'export function k(): u16 { const o = { a: 1 }; return 0 }',
      'export function m(a: u16): u16 { let s = a; s = a = 2; return s }',
      'class C {}',
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
