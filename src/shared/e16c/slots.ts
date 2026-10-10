import { labelDepths } from './back1.js'
import { type Fn, type Op, stackEffect } from './ir.js'

/**
 * e16c's shared places (docs/elec16.md section 6, e16c): before the -O1 back end gives each
 * slot a home, locals whose lives never overlap are made one slot. Only three or four saved
 * registers hold the locals of a function that calls, the rest live in a frame; a function's
 * locals are seldom all alive at once, so most of a frame goes (BASIC's frame slots 169 to 97).
 *
 * A life is worked out on the stack code: where a slot is read to where it is written again,
 * along every jump. It runs to where the back end really reads it - `ld` only notes the local
 * in the stack's picture, and the value is taken when an operation needs it (or a sum on its
 * register, `x + 1`, is used): a place shared with a slot written meanwhile would be read
 * after it was overwritten. Parameters keep their places, apart; a copy (`b = a`, a done with)
 * takes its source's place, so it costs no move.
 */
export function shareSlots(fn: Fn): Fn {
  if (fn.slots.length <= 1) return fn
  const reads = readsTo(fn.body)
  const live = liveness(fn.body, reads)
  const clash = clashes(fn, live, reads)
  const colour = colours(fn, clash)
  const count = Math.max(...colour) + 1
  if (count === fn.slots.length) return fn
  const names: string[] = Array.from({ length: count }, () => '')
  fn.slots.forEach((name, s) => {
    const c = colour[s] as number
    names[c] = names[c] === '' ? name : `${names[c]}/${name}`
  })
  const body = fn.body.map((op) =>
    op.k === 'ld' || op.k === 'st' ? { ...op, slot: colour[op.slot] as number } : op,
  )
  return { ...fn, slots: names, body }
}

/** How many entries an operation takes off the stack (it may put one back). */
function pops(op: Op): number {
  switch (op.k) {
    case 'st':
    case 'stg':
    case 'jz':
    case 'jnz':
    case 'drop':
    case 'csrw':
    case 'un':
    case 'load':
      return 1
    case 'bin':
    case 'mulq':
    case 'store':
      return 2
    case 'block':
      return 3
    case 'call':
      return op.argc
    case 'ecall':
      // The service number below its arguments.
      return op.argc + 1
    case 'ret':
      return op.value ? 1 : 0
    default:
      return 0
  }
}

/** The stack's depth before each operation (what dead code would leave does not count). */
function depthsBefore(body: Op[]): number[] {
  const atLabel = labelDepths(body)
  const depths: number[] = []
  let depth = 0
  let dead = false
  for (const op of body) {
    if (op.k === 'label') {
      if (dead) depth = atLabel.get(op.name) ?? 0
      dead = false
    }
    depths.push(depth)
    if (op.k === 'label' || dead) continue
    depth += stackEffect(op)
    dead = op.k === 'jmp' || op.k === 'ret'
  }
  return depths
}

/**
 * For each `ld`, the operation where the back end reads the local: the one that takes its
 * entry off the stack - past an add or a subtract, whose answer may still be a sum on the
 * local's register - or, at the latest, the next label or jump, where every entry goes into a
 * register. A call leaves a local's entry as it is.
 */
function readsTo(body: Op[]): Map<number, number> {
  const depths = depthsBefore(body)
  const reads = new Map<number, number>()
  body.forEach((op, k) => {
    if (op.k === 'ld') reads.set(k, readAt(body, depths, k))
  })
  return reads
}

function readAt(body: Op[], depths: number[], k: number): number {
  let at = depths[k] as number
  for (let j = k + 1; j < body.length; j++) {
    const op = body[j] as Op
    if (['label', 'jmp', 'jz', 'jnz', 'ret'].includes(op.k)) return j
    const depth = depths[j] as number
    if (depth - pops(op) > at) continue
    if (op.k !== 'bin' || (op.op !== 'add' && op.op !== 'sub')) return j
    at = depth - 2
  }
  return body.length - 1
}

interface Live {
  /** The slots alive after each operation. */
  after: Set<number>[]
  /** The slots alive as the function starts. */
  entry: Set<number>
}

/** Which slots are alive after each operation: backwards along every way the code goes. */
function liveness(body: Op[], reads: Map<number, number>): Live {
  const next = successors(body)
  const used = usedAt(body, reads)
  const before: Set<number>[] = body.map(() => new Set())
  const after: Set<number>[] = body.map(() => new Set())
  // One operation looked at again: true when what is alive before it grew.
  const step = (k: number): boolean => {
    const out = new Set<number>()
    for (const n of next[k] ?? []) for (const s of before[n] ?? []) out.add(s)
    const op = body[k] as Op
    const into = new Set(out)
    if (op.k === 'st') into.delete(op.slot)
    for (const s of used[k] ?? []) into.add(s)
    const grew = into.size !== before[k]?.size
    before[k] = into
    after[k] = out
    return grew
  }
  for (let changed = true; changed; ) {
    changed = false
    for (let k = body.length - 1; k >= 0; k--) changed = step(k) || changed
  }
  return { after, entry: before[0] ?? new Set() }
}

/** Where each operation may go on to: the next, a jump's label, or nowhere after a return. */
function successors(body: Op[]): number[][] {
  const at = new Map<string, number>()
  body.forEach((op, k) => {
    if (op.k === 'label') at.set(op.name, k)
  })
  return body.map((op, k) => {
    if (op.k === 'ret') return []
    const target = op.k === 'jmp' || op.k === 'jz' || op.k === 'jnz' ? at.get(op.to) : undefined
    if (op.k === 'jmp') return target === undefined ? [] : [target]
    return target === undefined ? [k + 1] : [k + 1, target]
  })
}

/** The slots each operation reads: a local where the back end takes it, and where `ld` notes it. */
function usedAt(body: Op[], reads: Map<number, number>): number[][] {
  const used: number[][] = body.map(() => [])
  reads.forEach((end, k) => {
    const op = body[k] as Op
    if (op.k !== 'ld') return
    used[k]?.push(op.slot)
    used[end]?.push(op.slot)
  })
  return used
}

/** Which slots may not share: one written while the other is alive, or both there at the start. */
function clashes(fn: Fn, live: Live, reads: Map<number, number>): Set<number>[] {
  const clash = fn.slots.map(() => new Set<number>())
  const link = (a: number, b: number) => {
    if (a === b) return
    clash[a]?.add(b)
    clash[b]?.add(a)
  }
  const entry = [...live.entry, ...fn.slots.slice(0, fn.params).map((_, p) => p)]
  for (const a of entry) for (const b of entry) link(a, b)
  fn.body.forEach((op, k) => {
    if (op.k === 'st') for (const s of live.after[k] ?? []) link(op.slot, s)
  })
  // A local still waiting to be read clashes with every slot written before it is - even when
  // the local is written meanwhile too, which ends its life as liveness sees it.
  reads.forEach((end, k) => {
    const op = fn.body[k] as Op
    if (op.k !== 'ld') return
    for (let j = k + 1; j < end; j++) {
      const w = fn.body[j] as Op
      if (w.k === 'st') link(op.slot, w.slot)
    }
  })
  return clash
}

/**
 * A place for each slot: parameters their own, in order; every other slot the first place
 * none of its clashes holds, its copy's (`ld a; st b`) where that is free.
 */
function colours(fn: Fn, clash: Set<number>[]): number[] {
  const copies = fn.slots.map(() => new Set<number>())
  fn.body.forEach((op, k) => {
    const before = fn.body[k - 1]
    if (op.k !== 'st' || before?.k !== 'ld' || before.slot === op.slot) return
    copies[op.slot]?.add(before.slot)
    copies[before.slot]?.add(op.slot)
  })
  const colour = fn.slots.map((_, s) => (s < fn.params ? s : -1))
  for (let s = fn.params; s < fn.slots.length; s++) {
    const taken = new Set([...(clash[s] ?? [])].map((t) => colour[t]))
    const copy = [...(copies[s] ?? [])]
      .map((t) => colour[t] as number)
      .find((c) => c >= 0 && !taken.has(c))
    let c = copy ?? 0
    while (copy === undefined && taken.has(c)) c++
    colour[s] = c
  }
  return colour
}
