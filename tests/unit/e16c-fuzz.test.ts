import * as builtins from '@shared/e16c/builtins'
import { compile, type E16cOptions } from '@shared/e16c/compile'
import { Interp } from '@shared/e16c/interp'
import { assemble, romImage } from '@shared/elec16/asm'
import { Elec16 } from '@shared/elec16/machine'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * e16c's differential fuzz (docs/elec16.md section 6, e16c): seeded programs in the subset -
 * locals, globals, byte and word arrays, helpers of up to four parameters, nested ?:, && and
 * ||, for, while, switch, break and continue, mulShift, every overflow wrapped so TypeScript
 * agrees - each run five ways: as TypeScript, in the interpreter, and on the machine at -O0,
 * -O1 and -O2. All five must give the same answer. A review found three miscompiles this way; the
 * seeds are fixed, so a failure repeats, and a new bug it finds gets a function of its own in
 * the sample (tests/fixtures/e16c/sample.e16.ts).
 */

const OPTIONS: E16cOptions = { opt: 0, data: { start: 0x0100, end: 0x0400 } }

type Outcome = { ok: true; value: number } | { ok: false; error: string }

/** The source run as TypeScript: transpiled, the builtins given as globals. */
function runTs(text: string, fn: string, args: number[]): Outcome {
  const js = ts.transpileModule(text.replace(/^export /gm, ''), {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const names = Object.keys(builtins)
  const body = `const {${names.join(',')}} = __b;\n${js}\nreturn ${fn}(...__args);`
  try {
    builtins.e16cMemory()
    const f = new Function('__b', '__args', body)
    const v = f(builtins, args)
    return { ok: true, value: (typeof v === 'boolean' ? (v ? 1 : 0) : Number(v)) & 0xffff }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

function compileAt(text: string, opt: 0 | 1 | 2) {
  return compile([{ name: 'fuzz.ts', text }], { ...OPTIONS, opt })
}

function runMachine(asm: string, fn: string, args: number[], cycles = 5_000_000): Outcome {
  const harness = [
    '.org 0x8000',
    'li sp, 0x8000',
    'call e16c_init',
    ...args.map((a, k) => `li a${k}, ${a & 0xffff}`),
    `call ${fn}`,
    'ebreak',
    asm,
  ].join('\n')
  const out = assemble(harness)
  // A branch past 16 KB spans more than the harness's ROM holds: a program too big to test,
  // which the assembler says before romImage can (seed 641 at -O0, 2,000 seeds).
  if (out.errors.some((e) => /within 16 KB/.test(e.message))) return { ok: false, error: 'too big' }
  if (out.errors.length > 0)
    return { ok: false, error: `asm: ${out.errors.map((e) => e.message).join('; ')}` }
  let image: Uint8Array
  try {
    image = romImage(out)
  } catch {
    // Past the harness's ROM: a program too big to test, not a wrong answer.
    return { ok: false, error: 'too big' }
  }
  const m = Elec16.boot(image)
  const r = m.run(cycles)
  if (r.halted?.cause !== 'breakpoint')
    return {
      ok: false,
      error: `halted ${r.halted?.cause ?? 'timeout'} at ${r.halted?.pc.toString(16)}`,
    }
  return { ok: true, value: m.state.regs[4] ?? 0 }
}

function runInterp(text: string, fn: string, args: number[]): Outcome {
  const out = compileAt(text, 0)
  if (out.errors.length > 0)
    return { ok: false, error: out.errors.map((e) => e.message).join('; ') }
  try {
    const vm = new Interp(out.program, { budget: 5_000_000 })
    vm.init()
    return { ok: true, value: vm.call(fn, args) }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

interface AllResults {
  ts: Outcome
  interp: Outcome
  o0: Outcome
  o1: Outcome
  o2: Outcome
}

function runAll(text: string, fn: string, args: number[]): AllResults {
  const level = (opt: 0 | 1 | 2): Outcome => {
    const out = compileAt(text, opt)
    if (out.errors.length > 0)
      return {
        ok: false,
        error: `compile: ${out.errors.map((e) => `${e.line}:${e.message}`).join('; ')}`,
      }
    return runMachine(out.asm, fn, args)
  }
  return {
    ts: runTs(text, fn, args),
    interp: runInterp(text, fn, args),
    o0: level(0),
    o1: level(1),
    o2: level(2),
  }
}

/** A seeded xorshift32: the same seed, the same program. */
class Gen {
  #s: number
  constructor(seed: number) {
    this.#s = seed >>> 0 || 1
  }
  next(): number {
    let x = this.#s
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.#s = x >>> 0
    return this.#s
  }
  int(n: number): number {
    return this.next() % n
  }
  pick<T>(xs: readonly T[]): T {
    return xs[this.int(xs.length)] as T
  }
  chance(p: number): boolean {
    return this.next() / 0x100000000 < p
  }
}

interface Ctx {
  g: Gen
  signed: boolean
  locals: string[]
  params: string[]
  fns: { name: string; params: number }[]
  depth: number
  inLoop: boolean
  labels: number
  nest: number
  bools: string[]
}

type Make = (c: Ctx) => string
type Choice = [weight: number, make: Make, when?: (c: Ctx) => boolean]

/** One of the choices that apply, by weight. */
function choose(c: Ctx, choices: readonly Choice[]): string {
  const open = choices.filter(([, , when]) => when === undefined || when(c))
  const total = open.reduce((n, [w]) => n + w, 0)
  let at = c.g.int(total)
  for (const [w, make] of open) {
    if (at < w) return make(c)
    at -= w
  }
  return (open[0] as Choice)[1](c)
}

/** Deeper by one while `make` runs. */
const deeper =
  (make: Make): Make =>
  (c) => {
    c.depth++
    try {
      return make(c)
    } finally {
      c.depth--
    }
  }

/** A value held to its reading, so TypeScript and the machine agree on it. */
const W = (c: Ctx, e: string): string => (c.signed ? `i16(${e})` : `wrap16(${e})`)
const wexpr = (c: Ctx): string => W(c, expr(c))
const stored = (c: Ctx): string => (c.signed ? `u16(${wexpr(c)})` : wexpr(c))

const SIGNED = [0, 1, 2, 3, -1, -2, 7, 100, -100, 255, -255, 32767, -32768]
const UNSIGNED = [0, 1, 2, 3, 7, 8, 16, 100, 255, 256, 0xff00, 0x7fff, 0x8000, 0xffff]

function constant(c: Ctx): string {
  if (!c.signed) return String(c.g.chance(0.2) ? c.g.int(65536) : c.g.pick(UNSIGNED))
  const v = c.g.chance(0.2) ? c.g.int(65536) - 32768 : c.g.pick(SIGNED)
  return v < 0 ? `(${v})` : String(v)
}

const read = (c: Ctx, name: string): string => (c.signed ? `i16(${name})` : name)

const LEAVES: readonly Choice[] = [
  [3, (c) => c.g.pick(c.locals), (c) => c.locals.length > 0],
  [2, (c) => c.g.pick(c.params), (c) => c.params.length > 0],
  [1, (c) => read(c, 'G1')],
  [1, (c) => read(c, 'G2')],
  [2, constant],
  [1, deeper((c) => read(c, `buf[${wexpr(c)} & 15]`)), (c) => c.depth <= 4],
  [1, deeper((c) => read(c, `tab[${wexpr(c)} & 7]`)), (c) => c.depth <= 4],
]

const leaf = (c: Ctx): string => choose(c, LEAVES)

const call = (c: Ctx): string => {
  const f = c.g.pick(c.fns)
  return `${f.name}(${Array.from({ length: f.params }, () => wexpr(c)).join(', ')})`
}

const mulShift = (c: Ctx, a: string, b: string): string => `mulShift(${a}, ${b}, ${c.g.int(16)})`

const EXPRS: readonly Choice[] = [
  [6, leaf],
  [4, (c) => `(${expr(c)} ${c.g.pick(['+', '-', '*', '&', '|', '^'])} ${expr(c)})`],
  [1, (c) => `(${wexpr(c)} ${c.signed ? '>>' : c.g.pick(['>>', '>>>'])} ${c.g.int(16)})`],
  [1, (c) => `(${wexpr(c)} << ${c.g.int(16)})`],
  // A signed division by what may be 0 is idiv: the same -1 in both runs.
  [1, (c) => `${c.signed ? 'idiv' : 'div'}(${wexpr(c)}, (${wexpr(c)} | 1))`],
  [1, (c) => `(${wexpr(c)} % (${wexpr(c)} | 1))`],
  // MULQ: two i16s, their whole product shifted (an unsigned program says i16 and back).
  [
    1,
    (c) =>
      c.signed
        ? mulShift(c, wexpr(c), wexpr(c))
        : `u16(${mulShift(c, `i16(${wexpr(c)})`, `i16(${wexpr(c)})`)})`,
  ],
  [2, (c) => `(${cond(c)} ? ${wexpr(c)} : ${wexpr(c)})`],
  [1, (c) => `(${c.g.pick(c.bools)} ? ${wexpr(c)} : ${wexpr(c)})`, (c) => c.bools.length > 0],
  [1, (c) => W(c, `(${cond(c)} ? 1 : 0)`)],
  [1, call, (c) => c.fns.length > 0],
  [1, (c) => (c.signed ? `(-${wexpr(c)})` : `(0 - ${wexpr(c)})`)],
  [1, (c) => `(~${wexpr(c)})`],
]

/** An expression whose value TypeScript and the machine agree on once wrapped. */
function expr(c: Ctx): string {
  return c.depth > 4 ? leaf(c) : deeper((d) => choose(d, EXPRS))(c)
}

const COMPARE = ['<', '>', '<=', '>=', '===', '!=='] as const
const compare = (c: Ctx): string => `(${wexpr(c)} ${c.g.pick(COMPARE)} ${wexpr(c)})`

const CONDS: readonly Choice[] = [
  [5, compare],
  [2, (c) => `(${cond(c)} ${c.g.pick(['&&', '||'])} ${cond(c)})`],
  [1, (c) => c.g.pick(c.bools), (c) => c.bools.length > 0],
  [1, (c) => `(!${cond(c)})`],
  [1, (c) => `(${wexpr(c)} !== 0)`],
  [1, (c) => `(${cond(c)} ? ${cond(c)} : ${cond(c)})`],
]

function cond(c: Ctx): string {
  return c.depth > 4 ? compare(c) : deeper((d) => choose(d, CONDS))(c)
}

/** The variables a statement may assign: locals that are not loop counters. */
const assignable = (c: Ctx): string[] => c.locals.filter((n) => !n.startsWith('i'))

function target(c: Ctx): string {
  const vars = assignable(c)
  if (vars.length > 0 && c.g.chance(0.7)) return c.g.pick(vars)
  return c.params.length > 0 ? c.g.pick(c.params) : 'G1'
}

function forLoop(c: Ctx, ind: string): string {
  const i = `i${c.labels++}`
  c.inLoop = true
  const body = block(c, `${ind}  `, [i])
  c.inLoop = false
  const t = c.signed ? 'i16' : 'u16'
  return `${ind}for (let ${i}: ${t} = 0; ${i} < ${c.g.int(6) + 1}; ${i}++) {\n${body}${ind}}`
}

function whileLoop(c: Ctx, ind: string): string {
  const w = `w${c.labels++}`
  c.inLoop = true
  const body = block(c, `${ind}  `)
  c.inLoop = false
  const head = `${ind}let ${w}: u16 = 0\n${ind}while (${w} < ${c.g.int(5) + 1}) {\n${ind}  ${w}++\n`
  return `${head}${body}${ind}}`
}

function switchOf(c: Ctx, ind: string): string {
  const v = wexpr(c)
  const cases = [0, 1, 2, 3].map((k) => {
    const value = c.signed && c.g.chance(0.3) ? -k : k
    const out = c.g.chance(0.6) ? `${ind}    break\n` : ''
    return `${ind}  case ${value}:\n${block(c, `${ind}    `)}${out}`
  })
  return `${ind}switch (${v}) {\n${cases.join('')}${ind}  default:\n${block(c, `${ind}    `)}${ind}}`
}

function ifElse(c: Ctx, ind: string): string {
  const then = `${ind}if ${cond(c)} {\n${block(c, `${ind}  `)}${ind}}`
  return c.g.chance(0.5) ? `${then} else {\n${block(c, `${ind}  `)}${ind}}` : then
}

type Stmt = [weight: number, make: (c: Ctx, ind: string) => string, when?: (c: Ctx) => boolean]

const STMTS: readonly Stmt[] = [
  [7, (c, ind) => `${ind}${target(c)} = ${wexpr(c)}`],
  [1, (c, ind) => `${ind}G1 = ${stored(c)}`],
  [1, (c, ind) => `${ind}G2 = u8(${wexpr(c)})`],
  [1, (c, ind) => `${ind}buf[${wexpr(c)} & 15] = ${stored(c)}`],
  [1, (c, ind) => `${ind}tab[${wexpr(c)} & 7] ${c.g.pick(['=', '+=', '-=', '^='])} ${stored(c)}`],
  [1, (c, ind) => `${ind}buf[${wexpr(c)} & 15]${c.g.pick(['++', '--'])}`],
  [
    1,
    (c, ind) =>
      `${ind}${c.g.pick(assignable(c))} ${c.g.pick(['+=', '-=', '*=', '&=', '|=', '^='])} ${wexpr(c)}`,
    (c) => assignable(c).length > 0,
  ],
  [2, ifElse, (c) => c.nest <= 2],
  [2, forLoop, (c) => !c.inLoop && c.nest <= 2],
  [1, (c, ind) => `${ind}if ${cond(c)} ${c.g.pick(['break', 'continue'])}`, (c) => c.inLoop],
  [1, whileLoop, (c) => !c.inLoop && c.nest <= 2],
  [1, switchOf, (c) => c.nest <= 2],
  [1, (c, ind) => `${ind}if ${cond(c)} return ${wexpr(c)}`],
]

function stmt(c: Ctx, ind: string): string {
  const open = STMTS.filter(([, , when]) => when === undefined || when(c))
  return choose(
    c,
    open.map(([w, make]): Choice => [w, (d) => make(d, ind)]),
  )
}

function block(c: Ctx, ind: string, extra: string[] = []): string {
  c.nest++
  const saved = { locals: c.locals, bools: c.bools }
  c.locals = [...c.locals, ...extra]
  const lines: string[] = []
  if (c.nest === 1 && c.g.chance(0.6)) {
    const name = `b${c.labels++}`
    lines.push(`${ind}const ${name}: bool = ${cond(c)}`)
    c.bools = [...c.bools, name]
  }
  if (c.g.chance(0.5)) {
    const name = `v${c.labels++}`
    lines.push(`${ind}let ${name}: ${c.signed ? 'i16' : 'u16'} = ${wexpr(c)}`)
    c.locals = [...c.locals, name]
  }
  const n = c.g.int(3) + 1
  for (let k = 0; k < n; k++) lines.push(stmt(c, ind))
  c.locals = saved.locals
  c.bools = saved.bools
  c.nest--
  return `${lines.join('\n')}\n`
}

function fn(c: Ctx, name: string, params: number, exported: boolean): string {
  const t = c.signed ? 'i16' : 'u16'
  c.params = Array.from({ length: params }, (_, k) => `p${k}`)
  c.locals = []
  c.bools = []
  c.labels = 0
  c.depth = 0
  const body = block(c, '  ')
  const head = `${exported ? 'export ' : ''}function ${name}(${c.params.map((p) => `${p}: ${t}`).join(', ')}): ${t}`
  return `${head} {\n${body}  return ${wexpr(c)}\n}`
}

/** A program of a few helpers and an exported f(p0, p1, p2), all reading words one way. */
function program(seed: number, signed: boolean): string {
  const g = new Gen(seed)
  const c: Ctx = {
    g,
    signed,
    locals: [],
    params: [],
    fns: [],
    depth: 0,
    inLoop: false,
    labels: 0,
    nest: 0,
    bools: [],
  }
  const helpers: string[] = []
  for (let k = 0; k < g.int(3); k++) {
    const params = g.int(5)
    helpers.push(fn(c, `h${k}`, params, false))
    c.fns.push({ name: `h${k}`, params })
  }
  const main = fn(c, 'f', 3, true)
  return [
    'let G1: u16 = 5',
    'let G2: u8 = 9',
    'const buf = bytes(16)',
    'const tab = words(8)',
    ...helpers,
    main,
  ].join('\n')
}

/** -O1's one limit, which -O0 does not have: refused, never a wrong answer. */
const KNOWN_LIMIT = /keeps more than 7 values across a branch/

const ARGS = {
  u16: [
    [1, 2, 3],
    [0xffff, 0x8000, 0],
  ],
  i16: [
    [1, -2, 3],
    [-32768, 32767, -1],
  ],
}

/** One program, run on each set of arguments: what disagreed, and how many runs there were. */
function check(seed: number, signed: boolean): { wrong: string[]; ran: number } {
  const text = program(seed, signed)
  const wrong: string[] = []
  let ran = 0
  for (const args of signed ? ARGS.i16 : ARGS.u16) {
    const r = runAll(text, 'f', args)
    // A program the subset refuses (the generator is not perfect), or too big, is no test.
    if (!r.o0.ok && /^(compile:|too big)/.test(r.o0.error)) break
    ran++
    const answers = Object.entries(r).filter(([, o]) => o.ok || !KNOWN_LIMIT.test(o.error))
    const values = new Set(answers.map(([, o]) => (o.ok ? String(o.value) : o.error)))
    if (values.size === 1) continue
    const said = answers.map(([k, o]) => `${k}=${o.ok ? o.value : o.error}`).join(' ')
    wrong.push(`seed ${seed} ${signed ? 'i16' : 'u16'} (${args.join(',')}): ${said}`)
  }
  return { wrong, ran }
}

/**
 * Seeds run: 40 (about 8 s) on every test run. Changing the compiler, run many more:
 * E16C_FUZZ_SEEDS=2000 npx vitest run tests/unit/e16c-fuzz.test.ts
 */
const SEEDS = Number(process.env.E16C_FUZZ_SEEDS ?? 40)

describe('e16c, fuzzed', () => {
  it('gives one answer five ways for every program it makes', { timeout: SEEDS * 1000 }, () => {
    const wrong: string[] = []
    let ran = 0
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const signed of [false, true]) {
        const one = check(seed, signed)
        wrong.push(...one.wrong)
        ran += one.ran
      }
    }
    expect(wrong).toEqual([])
    // Most programs are runnable: a generator that drifted from the subset would test nothing.
    expect(ran).toBeGreaterThan(SEEDS * 4 * 0.85)
  })
})
