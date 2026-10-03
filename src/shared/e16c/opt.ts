import { binary, Interp, NeedsMachine, OutOfBudget } from './interp.js'
import type { BinOp, Fn, Op, Program } from './ir.js'
import { word } from './types.js'

/**
 * e16c's -O2 (docs/elec16.md section 6, e16c): passes over the stack code before the -O1
 * back end. Each keeps what the program does, and each is small:
 *
 * - a pure function called with constants is run here, in the interpreter, and the call
 *   becomes its answer (a budget stops one that would not end; it is then left a call);
 * - a function that calls nothing is inlined where it is called, when it is tiny or is
 *   called only once;
 * - constants are folded and the identities dropped (x + 0, x * 1, a jump on a constant);
 * - a jump to a jump goes straight on, a jump to the next operation goes, and what no jump
 *   reaches after a jump or a return goes;
 * - a function nothing calls and nothing outside can (not exported) goes.
 */

/**
 * Operations a function may have and still be inlined where it is called only once (the
 * function then goes, so the program shrinks).
 */
const INLINE_LIMIT = 24
/**
 * Operations a function may have and still be inlined wherever it is called: about what the
 * call itself takes. Larger ones stay calls, cheap now that a leaf keeps its arguments where
 * they arrive. Inlining BASIC's `next` (17 operations) at its 35 calls once made the ROM
 * 1.3 KB larger for 10% of its speed; 8 operations, 166 bytes for 1%. The ROM is the scarcer
 * (docs/decisions.md).
 */
const INLINE_TINY = 4
/** Operations a compile-time call may take. */
const EVAL_BUDGET = 100_000

export function optimise(program: Program): Program {
  let fns = program.fns
  const pure = purity(fns)
  fns = fns.map((fn) => ({ ...fn, body: evaluateCalls(fn.body, program, pure) }))
  const sites = callSites(fns)
  const inlinable = new Map(fns.filter((fn) => canInline(fn, sites)).map((fn) => [fn.name, fn]))
  fns = fns.map((fn) => inlineCalls(fn, inlinable))
  for (let pass = 0; pass < 4; pass++)
    fns = fns.map((fn) => ({ ...fn, body: tidy(simplify(fn.body)) }))
  return { ...program, fns: reachable(fns) }
}

/* ---------------- purity ---------------- */

/**
 * What a function worked out at compile time may not do: touch memory, the machine, or name a
 * label - the interpreter lays strings and arrays out where it likes, so an address it gives
 * is not the one the linked ROM has.
 */
const IMPURE = new Set<Op['k']>([
  'addr',
  'ldg',
  'stg',
  'load',
  'store',
  'ecall',
  'csrr',
  'csrw',
  'wfi',
  'asm',
])

/** The functions whose answer depends only on their arguments and that change nothing else. */
function purity(fns: Fn[]): Set<string> {
  const byName = new Map(fns.map((fn) => [fn.name, fn]))
  const pure = new Set(
    fns.filter((fn) => fn.returns && !fn.body.some((op) => IMPURE.has(op.k))).map((f) => f.name),
  )
  // A function calling one not known to be pure (an extern, an impure one) is not pure either.
  for (let changed = true; changed; ) {
    changed = false
    for (const name of [...pure]) {
      const calls = byName.get(name)?.body.filter((op) => op.k === 'call') ?? []
      if (calls.every((op) => op.k === 'call' && pure.has(op.fn))) continue
      pure.delete(name)
      changed = true
    }
  }
  return pure
}

/** `push c1 .. push cn; call f` with f pure: its answer, worked out now. */
function evaluateCalls(body: Op[], program: Program, pure: Set<string>): Op[] {
  const out: Op[] = []
  for (const op of body) {
    if (op.k === 'call' && op.ret && pure.has(op.fn)) {
      const args = out.slice(out.length - op.argc)
      if (args.length === op.argc && args.every((a) => a.k === 'push')) {
        const answer = runNow(
          program,
          op.fn,
          args.map((a) => (a.k === 'push' ? a.v : 0)),
        )
        if (answer !== null) {
          out.length -= op.argc
          out.push({ k: 'push', v: answer })
          continue
        }
      }
    }
    out.push(op)
  }
  return out
}

function runNow(program: Program, fn: string, args: number[]): number | null {
  try {
    return new Interp(program, { budget: EVAL_BUDGET }).call(fn, args)
  } catch (e) {
    if (e instanceof OutOfBudget || e instanceof NeedsMachine) return null
    throw e
  }
}

/* ---------------- inlining ---------------- */

function canInline(fn: Fn, sites: Map<string, number>): boolean {
  if (fn.body.some((op) => op.k === 'call' || op.k === 'asm')) return false
  const size = fn.body.filter((op) => op.k !== 'line').length
  const once = sites.get(fn.name) === 1 && !fn.exported
  return size <= INLINE_TINY || (once && size <= INLINE_LIMIT)
}

/** How many calls each function has in the program. */
function callSites(fns: Fn[]): Map<string, number> {
  const sites = new Map<string, number>()
  for (const fn of fns) {
    for (const op of fn.body) if (op.k === 'call') sites.set(op.fn, (sites.get(op.fn) ?? 0) + 1)
  }
  return sites
}

/** Every call to a small leaf function replaced by its body, its slots and labels its own. */
function inlineCalls(fn: Fn, inlinable: Map<string, Fn>): Fn {
  const slots = [...fn.slots]
  const body: Op[] = []
  let copies = 0
  for (const op of fn.body) {
    const callee = op.k === 'call' ? inlinable.get(op.fn) : undefined
    // Code is copied only within its bank: a banked body may read its bank's strings.
    if (
      callee === undefined ||
      callee.name === fn.name ||
      callee.bank !== fn.bank ||
      op.k !== 'call'
    ) {
      body.push(op)
      continue
    }
    const base = slots.length
    slots.push(...callee.slots.map((s) => `${callee.name}.${s}`))
    const tag = `.I${++copies}`
    // The arguments are on the stack, the last on top: into the callee's parameter slots.
    for (let k = callee.params - 1; k >= 0; k--) body.push({ k: 'st', slot: base + k })
    const end = `${tag}_end`
    for (const inner of callee.body) body.push(...relocated(inner, base, tag, end, op.ret))
    body.push({ k: 'label', name: end })
  }
  return { ...fn, slots, body }
}

/** An operation of an inlined body: slots moved up, labels renamed, a return a jump to the end. */
function relocated(op: Op, base: number, tag: string, end: string, keepValue: boolean): Op[] {
  switch (op.k) {
    case 'ld':
    case 'st':
      return [{ ...op, slot: op.slot + base }]
    case 'label':
      return [{ ...op, name: `${tag}${op.name}` }]
    case 'jmp':
    case 'jz':
    case 'jnz':
      return [{ ...op, to: `${tag}${op.to}` }]
    case 'ret':
      // A value nobody wants is dropped; a value-less return where one is wanted cannot be.
      if (op.value && !keepValue) return [{ k: 'drop' }, { k: 'jmp', to: end }]
      return [{ k: 'jmp', to: end }]
    default:
      return [op]
  }
}

/* ---------------- folding ---------------- */

/** Folds a window of operations: a constant operation, an identity, a jump on a constant. */
function simplify(body: Op[]): Op[] {
  const out: Op[] = []
  for (const op of body) {
    out.push(op)
    while (rewrite(out)) {
      // rewrite changed the tail of `out`: look at it again.
    }
  }
  return out
}

/** The tail of the code: the last three operations, last first. */
type Tail = [Op | undefined, Op | undefined, Op | undefined]

/** One rule: rewrites the tail of `out` and says so, or leaves it. */
type Rule = (out: Op[], tail: Tail) => boolean

const RULES: Rule[] = [
  // A constant operation on constants.
  (out, [c, b, a]) => {
    if (c?.k !== 'bin' || b?.k !== 'push' || a?.k !== 'push') return false
    out.splice(out.length - 3, 3, { k: 'push', v: binary(c.op, a.v, b.v) })
    return true
  },
  (out, [c, b]) => {
    if (c?.k !== 'un' || b?.k !== 'push') return false
    const v = c.op === 'neg' ? -b.v : c.op === 'not' ? ~b.v : b.v === 0 ? 1 : 0
    out.splice(out.length - 2, 2, { k: 'push', v: word(v) })
    return true
  },
  // An identity: x + 0, x * 1.
  (out, [c, b]) => {
    if (c?.k !== 'bin' || b?.k !== 'push' || !isIdentity(c.op, b.v)) return false
    out.splice(out.length - 2, 2)
    return true
  },
  // A jump on a constant: always, or never.
  (out, [c, b]) => {
    if ((c?.k !== 'jz' && c?.k !== 'jnz') || b?.k !== 'push') return false
    const taken = (b.v === 0) === (c.k === 'jz')
    out.splice(out.length - 2, 2, ...(taken ? [{ k: 'jmp', to: c.to } as Op] : []))
    return true
  },
  // A value made only to be dropped.
  (out, [c, b]) => {
    if (c?.k !== 'drop' || (b?.k !== 'push' && b?.k !== 'ld' && b?.k !== 'addr')) return false
    out.splice(out.length - 2, 2)
    return true
  },
]

/** One rewrite of the tail of `out`; true when it changed it. */
function rewrite(out: Op[]): boolean {
  const n = out.length
  const tail: Tail = [out[n - 1], out[n - 2], out[n - 3]]
  return RULES.some((rule) => rule(out, tail))
}

/** `x op k` that is x: + - | ^ << >> by 0, * and / by 1. */
function isIdentity(op: BinOp, k: number): boolean {
  if (k === 0) return ['add', 'sub', 'or', 'xor', 'shl', 'shr', 'sar'].includes(op)
  if (k === 1) return ['mul', 'div', 'divu'].includes(op)
  return op === 'and' && k === 0xffff
}

/* ---------------- jumps and dead code ---------------- */

/** Jumps threaded, jumps to the next operation dropped, the unreachable cut, unused labels gone. */
function tidy(body: Op[]): Op[] {
  const target = threadTargets(body)
  let ops = body.map((op) =>
    op.k === 'jmp' || op.k === 'jz' || op.k === 'jnz' ? { ...op, to: target(op.to) } : op,
  )
  ops = unreachableCut(ops)
  ops = ops.filter((op, k) => !(op.k === 'jmp' && nextLabels(ops, k).includes(op.to)))
  const used = new Set(
    ops.flatMap((op) => (op.k === 'jmp' || op.k === 'jz' || op.k === 'jnz' ? [op.to] : [])),
  )
  return ops.filter((op) => op.k !== 'label' || used.has(op.name))
}

/** Where a jump to `label` really lands: past labels that are only a jump onwards. */
function threadTargets(body: Op[]): (label: string) => string {
  const onward = new Map<string, string>()
  body.forEach((op, k) => {
    if (op.k !== 'label') return
    const next = body.slice(k + 1).find((o) => o.k !== 'label' && o.k !== 'line')
    if (next?.k === 'jmp') onward.set(op.name, next.to)
  })
  return (label) => {
    let at = label
    for (let hops = 0; hops < 16 && onward.has(at); hops++) at = onward.get(at) ?? at
    return at
  }
}

/** The labels right after operation k (with nothing but source lines between). */
function nextLabels(body: Op[], k: number): string[] {
  const labels: string[] = []
  for (let j = k + 1; j < body.length; j++) {
    const op = body[j] as Op
    if (op.k === 'label') labels.push(op.name)
    else if (op.k !== 'line') break
  }
  return labels
}

/** After a jump or a return, nothing runs until a label. */
function unreachableCut(body: Op[]): Op[] {
  const out: Op[] = []
  let live = true
  for (const op of body) {
    if (op.k === 'label') live = true
    if (live || op.k === 'line') out.push(op)
    if (op.k === 'jmp' || op.k === 'ret') live = false
  }
  return out
}

/** Exported functions and what they reach; the rest go. */
function reachable(fns: Fn[]): Fn[] {
  const byName = new Map(fns.map((fn) => [fn.name, fn]))
  const keep = new Set<string>()
  const visit = (name: string) => {
    if (keep.has(name)) return
    const fn = byName.get(name)
    if (fn === undefined) return
    keep.add(name)
    for (const op of fn.body) if (op.k === 'call') visit(op.fn)
  }
  for (const fn of fns) if (fn.exported) visit(fn.name)
  return fns.filter((fn) => keep.has(fn.name))
}
