import { type BinOp, type Fn, type Op, stackEffect } from './ir.js'
import { hex, NEAR, signed } from './types.js'

/**
 * e16c's -O1 code for one function (docs/elec16.md section 6, e16c). The stack code is run
 * in the compiler against a picture of the stack whose entries are not yet in registers -
 * a constant, a local, an address - until an instruction needs them, so `x + 1` is one
 * `addi` and `if (a < b)` one branch. Locals live in s0-s3 where they fit (the busiest
 * first), the rest in a frame under fp. Values that cross a label sit in fixed registers by
 * their depth; a call keeps what lies below its arguments on the machine's stack. A sum of a
 * register and a constant or a RAM array waits too, so `buffer[i + 1]` is `lbu t0, buffer+1(s1)`.
 */

type Value =
  | { kind: 'const'; v: number }
  | { kind: 'addr'; label: string }
  | { kind: 'local'; slot: number }
  | { kind: 'reg'; r: string }
  /**
   * `r + label + k`, not yet added: a load or store takes it as its base and offset. A
   * temporary `r` is the sum's own; a local's home is only read (a write to it adds first).
   */
  | { kind: 'sum'; r: string; k: number; label?: string }
  /** On the machine's stack: always below every other entry. */
  | { kind: 'spilled' }

type Sum = Extract<Value, { kind: 'sum' }>

/** Registers for the stack's values, in the order a depth takes them at a label. */
const TEMPS = ['t0', 't1', 't2', 't3', 'a1', 'a2', 'a3']
const ARGS = ['a0', 'a1', 'a2', 'a3']
const SAVED = ['s1', 's2', 's3', 's0']

/** Immediate forms by operation, for a constant second operand that fits 14 bits. */
const IMMEDIATE: Partial<Record<BinOp, string>> = {
  add: 'addi',
  and: 'andi',
  or: 'ori',
  xor: 'xori',
  lt: 'slti',
  ltu: 'sltiu',
}
const SHIFT_IMMEDIATE: Partial<Record<BinOp, string>> = { shl: 'slli', shr: 'srli', sar: 'srai' }

export const REGISTER: Record<BinOp, string[]> = {
  add: ['add $d, $a, $b'],
  sub: ['sub $d, $a, $b'],
  mul: ['mul $d, $a, $b'],
  div: ['div $d, $a, $b'],
  divu: ['divu $d, $a, $b'],
  rem: ['rem $d, $a, $b'],
  remu: ['remu $d, $a, $b'],
  and: ['and $d, $a, $b'],
  or: ['or $d, $a, $b'],
  xor: ['xor $d, $a, $b'],
  shl: ['sll $d, $a, $b'],
  shr: ['srl $d, $a, $b'],
  sar: ['sra $d, $a, $b'],
  eq: ['sub $d, $a, $b', 'seqz $d, $d'],
  ne: ['sub $d, $a, $b', 'snez $d, $d'],
  lt: ['slt $d, $a, $b'],
  ltu: ['sltu $d, $a, $b'],
  gt: ['slt $d, $b, $a'],
  gtu: ['sltu $d, $b, $a'],
  le: ['slt $d, $b, $a', 'xori $d, $d, 1'],
  leu: ['sltu $d, $b, $a', 'xori $d, $d, 1'],
  ge: ['slt $d, $a, $b', 'xori $d, $d, 1'],
  geu: ['sltu $d, $a, $b', 'xori $d, $d, 1'],
}

/** A comparison as the branch taken when it is true: the mnemonic, and whether to swap a and b. */
const BRANCH: Partial<Record<BinOp, [string, boolean]>> = {
  eq: ['beq', false],
  ne: ['bne', false],
  lt: ['blt', false],
  ltu: ['bltu', false],
  gt: ['blt', true],
  gtu: ['bltu', true],
  ge: ['bge', false],
  geu: ['bgeu', false],
  le: ['bge', true],
  leu: ['bgeu', true],
}
const NEGATE: Partial<Record<BinOp, BinOp>> = {
  eq: 'ne',
  ne: 'eq',
  lt: 'ge',
  ge: 'lt',
  ltu: 'geu',
  geu: 'ltu',
  gt: 'le',
  le: 'gt',
  gtu: 'leu',
  leu: 'gtu',
}

const fits14 = (v: number): boolean => v >= -8192 && v <= 8191

export class O1 {
  readonly lines: string[] = []
  readonly #fn: Fn
  #stack: Value[] = []
  /** Each slot's home: a saved register, or an offset from fp. */
  readonly #home: (string | number)[]
  readonly #saved: string[]
  readonly #frame: number
  readonly #calls: boolean
  /** Each label's stack depth, from the jumps to it. */
  readonly #depths: Map<string, number>
  /** After a jump or a return: what follows runs only from a label. */
  #dead = false
  /** The RAM arrays whose addresses fit an offset, by label. */
  readonly #near: Map<string, number>
  /** The registers for the stack's values: TEMPS less any a leaf keeps its locals in. */
  readonly #temps: string[]

  /** Each function's bank, for calls across banks (callLines). */
  readonly #banks: Map<string, number | null>

  constructor(
    fn: Fn,
    near: Map<string, number> = new Map(),
    banks: Map<string, number | null> = new Map(),
  ) {
    this.#fn = fn
    this.#near = near
    this.#banks = banks
    this.#calls = fn.body.some(
      (op) => op.k === 'call' || op.k === 'ecall' || op.k === 'block' || op.k === 'asm',
    )
    this.#depths = labelDepths(fn.body)
    // A fused compare-and-branch holds its two operands above the depth at its label.
    const deepest = Math.max(0, ...this.#depths.values()) + 2
    const plan = homes(fn, !this.#calls, deepest)
    this.#home = plan.home
    this.#saved = plan.saved
    this.#frame = plan.frame
    this.#temps = plan.temps
  }

  /* ---------------- output ---------------- */

  #line(text: string): void {
    this.lines.push(`  ${text}`)
  }

  #comment(text: string): void {
    this.lines.push(`  ; ${text}`)
  }

  emit(): string[] {
    const fn = this.#fn
    this.lines.push(
      `; ${fn.file}:${fn.line} ${fn.name}(${fn.slots.slice(0, fn.params).join(', ')}) at -O1`,
    )
    fn.slots.forEach((name, k) => {
      const home = this.#home[k]
      this.lines.push(`;   ${name} in ${typeof home === 'number' ? `${home}(fp)` : home}`)
    })
    this.lines.push(`${fn.name}:`)
    this.#prologue()
    const body = fn.body
    for (let k = 0; k < body.length; k++) {
      const op = body[k] as Op
      const next = body[k + 1]
      if (
        op.k === 'bin' &&
        (next?.k === 'jz' || next?.k === 'jnz') &&
        BRANCH[op.op] !== undefined
      ) {
        this.#compareAndBranch(op.op, next.k === 'jnz', next.to)
        k++
        continue
      }
      this.#op(op)
    }
    this.lines.push('.return:')
    this.#epilogue()
    this.lines.push('')
    return tidyJumps(this.lines)
  }

  #saveArea(): string[] {
    return [
      ...(this.#calls ? ['ra'] : []),
      ...this.#saved,
      ...(this.#frame > 0 ? ['s0'] : []),
    ].filter((r, k, all) => all.indexOf(r) === k)
  }

  #prologue(): void {
    const save = this.#saveArea()
    const size = save.length * 2 + this.#frame
    if (size > 0) this.#line(`addi sp, sp, -${size}`)
    save.forEach((r, k) => {
      this.#line(`sw ${r}, ${this.#frame + k * 2}(sp)`)
    })
    if (this.#frame > 0) this.#line('mv fp, sp')
    for (let k = 0; k < this.#fn.params; k++) this.#toHome(k, ARGS[k] as string)
  }

  #epilogue(): void {
    const save = this.#saveArea()
    const size = save.length * 2 + this.#frame
    if (this.#frame > 0) this.#line('mv sp, fp')
    save.forEach((r, k) => {
      this.#line(`lw ${r}, ${this.#frame + k * 2}(sp)`)
    })
    if (size > 0) this.#line(`addi sp, sp, ${size}`)
    this.#line('ret')
  }

  /* ---------------- the stack picture ---------------- */

  #used(): Set<string> {
    const used = new Set<string>()
    for (const v of this.#stack) if (v.kind === 'reg' || v.kind === 'sum') used.add(v.r)
    return used
  }

  /** A free temporary; when none is, the deepest value in a register goes to the machine's stack. */
  #temp(also: Set<string> = new Set()): string {
    const used = this.#used()
    const free = this.#temps.find((r) => !used.has(r) && !also.has(r))
    if (free !== undefined) return free
    // The deepest value in a temporary (a call's answer in a0 goes along with it).
    const deepest = this.#stack.findIndex((v) => this.#owns(v) && this.#temps.includes(v.r))
    const v = this.#stack[deepest] as { r: string }
    this.#spillAt(deepest)
    return v.r
  }

  /**
   * Puts every value held in a temporary at `index` or below on the machine's stack, deepest
   * first, so the spilled ones lie there in the picture's order. Constants, addresses and
   * locals stay as they are: nothing a call or a branch does changes them.
   */
  #spillAt(index: number): void {
    for (let k = 0; k <= index; k++) {
      const v = this.#stack[k] as Value
      if (!this.#owns(v)) continue
      // A sum in its own temporary is added up there first.
      if (v.kind === 'sum') this.#add(v.r, v)
      this.#line('addi sp, sp, -2')
      this.#line(`sw ${v.r}, 0(sp)`)
      this.#stack[k] = { kind: 'spilled' }
    }
  }

  /** The registers the picture's values hold. */
  #held(values: Value[] = this.#stack): Set<string> {
    return new Set(values.flatMap((v) => [...held(v)]))
  }

  /** A sum added up into `to`. */
  #add(to: string, v: Sum): void {
    if (v.r === 'zero') this.#line(`li ${to}, ${offsetText(v)}`)
    else this.#line(`addi ${to}, ${v.r}, ${offsetText(v)}`)
  }

  /** Spilled values back into temporaries, the topmost first, as the machine's stack has them. */
  #unspill(values: Value[]): void {
    for (let k = values.length - 1; k >= 0; k--) {
      if (values[k]?.kind !== 'spilled') continue
      const r = this.#temp(this.#held(values))
      this.#line(`lw ${r}, 0(sp)`)
      this.#line('addi sp, sp, 2')
      values[k] = { kind: 'reg', r }
    }
  }

  /** A value in some register (its own, a home, or a temporary it is loaded into). */
  #inReg(v: Value, avoid: Set<string>): string {
    switch (v.kind) {
      case 'reg':
        return v.r
      case 'const': {
        if (v.v === 0) return 'zero'
        const r = this.#temp(avoid)
        this.#line(`li ${r}, ${v.v & 0xffff}`)
        return r
      }
      case 'addr': {
        const r = this.#temp(avoid)
        this.#line(`la ${r}, ${v.label}`)
        return r
      }
      case 'local': {
        const home = this.#home[v.slot]
        if (typeof home === 'string') return home
        const r = this.#temp(avoid)
        this.#line(`lw ${r}, ${home}(fp) ; ${this.#fn.slots[v.slot]}`)
        return r
      }
      case 'spilled': {
        const r = this.#temp(avoid)
        this.#line(`lw ${r}, 0(sp)`)
        this.#line('addi sp, sp, 2')
        return r
      }
      case 'sum': {
        const r = this.#temps.includes(v.r) ? v.r : this.#temp(avoid)
        this.#add(r, v)
        return r
      }
    }
  }

  #pop(): Value {
    const v = this.#stack.pop()
    if (v === undefined) throw new Error(`e16c: the stack ran out in ${this.#fn.name}`)
    return v
  }

  /** Every entry in the register its depth takes at a label (deeper than the temporaries: spilled). */
  #canonical(): void {
    const temps = this.#temps
    if (this.#stack.length > temps.length) {
      throw new Error(
        `e16c: an expression in ${this.#fn.name} keeps more than ${temps.length} values across a branch`,
      )
    }
    this.#unspill(this.#stack)
    this.#parallelMove(this.#stack, temps.slice(0, this.#stack.length))
  }

  /**
   * Every value into its target register at once, with no register to spare: a value whose
   * target no other still holds (or reads, as a sum not yet added does) goes first; when every
   * target left is held, the holders form a cycle of registers, and one is swapped into place
   * without a third register (with the picture full there is none, and asking for one would
   * spill a value under the picture). `values` ends as the registers.
   */
  #parallelMove(values: Value[], targets: string[]): void {
    const placed = values.map(() => false)
    const holder = (reg: string, except: number): number =>
      values.findIndex((w, j) => j !== except && !placed[j] && held(w).has(reg))
    for (let left = values.length; left > 0; left--) {
      let k = values.findIndex((_, j) => !placed[j] && holder(targets[j] as string, j) < 0)
      if (k < 0) {
        k = values.findIndex((w, j) => !placed[j] && this.#owns(w))
        const v = values[k] as Extract<Value, { r: string }>
        const want = targets[k] as string
        const other = holder(want, k)
        this.#line(`xor ${want}, ${want}, ${v.r}`)
        this.#line(`xor ${v.r}, ${v.r}, ${want}`)
        this.#line(`xor ${want}, ${want}, ${v.r}`)
        values[other] = movedTo(values[other] as Value, v.r)
        values[k] = movedTo(v, want)
      }
      const v = values[k] as Value
      const want = targets[k] as string
      if (!(v.kind === 'reg' && v.r === want)) this.#move(want, v, new Set(targets))
      placed[k] = true
      values[k] = { kind: 'reg', r: want }
    }
  }

  /** The picture after a label: every entry in its depth's register. */
  #atLabel(depth: number): void {
    this.#stack = Array.from({ length: depth }, (_, k) => ({
      kind: 'reg',
      r: this.#temps[k] as string,
    }))
  }

  /** A local about to be written: any entry still reading it takes a copy first. */
  #protect(slot: number, avoid: Set<string>): void {
    const home = this.#home[slot]
    this.#stack.forEach((v, k) => {
      const reads = v.kind === 'local' ? v.slot === slot : v.kind === 'sum' && v.r === home
      if (!reads) return
      // Statements store with nothing spilled above; a copy below a spilled value would break
      // the machine stack's order.
      if (this.#stack.slice(k + 1).some((w) => w.kind === 'spilled')) {
        throw new Error(`e16c: a local is written under a spilled value in ${this.#fn.name}`)
      }
      const r = this.#temp(avoid)
      if (v.kind === 'sum') this.#add(r, v)
      else if (typeof home === 'string') this.#line(`mv ${r}, ${home}`)
      else this.#line(`lw ${r}, ${home}(fp)`)
      this.#stack[k] = { kind: 'reg', r }
    })
  }

  #toHome(slot: number, from: string): void {
    const home = this.#home[slot]
    const name = this.#fn.slots[slot]
    if (typeof home === 'string' && this.#retarget(from, home)) return
    if (typeof home === 'string') {
      if (home !== from)
        this.#line(from === 'zero' ? `li ${home}, 0 ; ${name}` : `mv ${home}, ${from} ; ${name}`)
    } else this.#line(`sw ${from}, ${home}(fp) ; ${name}`)
  }

  /**
   * A temporary just computed and now stored in a register home: the instruction that
   * computed it writes the home instead (`addi t0, s1, 1` then `mv s1, t0` is `addi s1, s1, 1`).
   */
  #retarget(from: string, home: string): boolean {
    if (!this.#temps.includes(from)) return false
    const last = this.lines[this.lines.length - 1] ?? ''
    const m = /^ {2}([a-z.]+) ([a-z0-9]+), (.*)$/.exec(last)
    if (m === null || m[2] !== from || /^(s[bw]|b|j|call)/.test(m[1] ?? '')) return false
    // Reading the temporary in the same instruction is fine: it is dead once stored.
    this.lines[this.lines.length - 1] = `  ${m[1]} ${home}, ${m[3]}`
    return true
  }

  /* ---------------- operations ---------------- */

  #op(op: Op): void {
    if (op.k !== 'line' && op.k !== 'ldg' && op.k !== 'stg') this.#forward = null
    switch (op.k) {
      case 'line':
        this.#comment(`${op.file}:${op.line}  ${op.text}`)
        return
      case 'push':
        this.#stack.push({ kind: 'const', v: signed(op.v) })
        return
      case 'addr':
        this.#stack.push({ kind: 'addr', label: op.label })
        return
      case 'ld':
        this.#stack.push({ kind: 'local', slot: op.slot })
        return
      case 'st':
        this.#store(op.slot)
        return
      case 'ldg':
        this.#loadGlobal(op.at, op.byte)
        return
      case 'stg':
        this.#storeGlobal(op.at, op.byte)
        return
      default:
        this.#memoryOrMath(op)
        return
    }
  }

  #store(slot: number): void {
    const v = this.#pop()
    this.#protect(slot, held(v))
    const home = this.#home[slot]
    // A constant straight into a register home.
    if (v.kind === 'const' && typeof home === 'string') {
      this.#line(`li ${home}, ${v.v & 0xffff} ; ${this.#fn.slots[slot]}`)
      return
    }
    this.#toHome(slot, this.#inReg(v, new Set()))
  }

  /** A word global just stored, and what was stored: read right back, it needs no load. */
  #forward: { at: number; v: Value } | null = null

  #loadGlobal(at: number, byte: boolean): void {
    const forward = this.#forward
    this.#forward = null
    if (forward !== null && forward.at === at && !byte) {
      this.#stack.push(forward.v)
      return
    }
    const r = this.#temp()
    this.#absolute(byte ? 'lbu' : 'lw', r, at)
    this.#stack.push({ kind: 'reg', r })
  }

  #storeGlobal(at: number, byte: boolean): void {
    const v = this.#pop()
    const r = this.#inReg(v, new Set())
    this.#absolute(byte ? 'sb' : 'sw', r, at, new Set([r]))
    // A constant, an address or a local is read again as it was; anything else is in the
    // register just stored from, free now that the value is gone from the picture.
    const kept: Value =
      v.kind === 'const' || v.kind === 'addr' || v.kind === 'local' ? v : { kind: 'reg', r }
    if (!byte) this.#forward = { at, v: kept }
  }

  #absolute(op: string, r: string, at: number, avoid: Set<string> = new Set()): void {
    if (at < NEAR) {
      this.#line(`${op} ${r}, ${hex(at)}(zero)`)
      return
    }
    const base = this.#temp(new Set([...avoid, r]))
    this.#line(`li ${base}, ${hex(at)}`)
    this.#line(`${op} ${r}, 0(${base})`)
  }

  #memoryOrMath(op: Op): void {
    switch (op.k) {
      case 'load':
        this.#load(op.byte)
        return
      case 'store':
        this.#storeAt(op.byte)
        return
      case 'bin':
        this.#binary(op.op)
        return
      case 'un':
        this.#unary(op.op)
        return
      default:
        this.#flow(op)
        return
    }
  }

  /** An address's base and offset: a near constant needs no register, nor a sum's offset. */
  #address(v: Value, avoid: Set<string>): [string, string | number] {
    if (v.kind === 'const' && (v.v & 0xffff) < NEAR) return ['zero', v.v & 0xffff]
    if (v.kind === 'addr' && this.#near.has(v.label)) return ['zero', v.label]
    if (v.kind === 'sum') return [v.r, offsetText(v)]
    return [this.#inReg(v, avoid), 0]
  }

  #load(byte: boolean): void {
    const [base, offset] = this.#address(this.#pop(), new Set())
    const r = this.#result([base])
    this.#line(`${byte ? 'lbu' : 'lw'} ${r}, ${offset}(${base})`)
    this.#stack.push({ kind: 'reg', r })
  }

  #storeAt(byte: boolean): void {
    const value = this.#pop()
    const address = this.#pop()
    const r = this.#inReg(value, held(address))
    const [base, offset] = this.#address(address, new Set([r]))
    this.#line(`${byte ? 'sb' : 'sw'} ${r}, ${offset}(${base})`)
  }

  #binary(op: BinOp): void {
    const b = this.#pop()
    const a = this.#pop()
    const sum = op === 'add' || op === 'sub' ? this.#sum(op, a, b) : null
    if (sum !== null) {
      this.#stack.push(sum)
      return
    }
    if (b.kind === 'const' && this.#immediate(op, a, b.v)) return
    const rb = this.#inReg(b, held(a))
    const ra = this.#inReg(a, new Set([rb]))
    const d = this.#result([ra, rb])
    for (const line of REGISTER[op])
      this.#line(line.replace(/\$d/g, d).replace(/\$a/g, ra).replace(/\$b/g, rb))
    this.#stack.push({ kind: 'reg', r: d })
  }

  /** A constant or a near array as a sum's offset (`- k` for the right of a subtraction). */
  #known(v: Value, negate: boolean): { k: number; label?: string } | null {
    if (v.kind === 'const') return { k: negate ? -v.v : v.v }
    if (v.kind === 'addr' && !negate && this.#near.has(v.label)) return { k: 0, label: v.label }
    return null
  }

  /** A value as the register side of a sum; null for what has no register to offset from. */
  #based(v: Value): Sum | null {
    if (v.kind === 'sum') return v
    const known = this.#known(v, false)
    if (known !== null) return { kind: 'sum', r: 'zero', ...known }
    if (v.kind === 'spilled' || v.kind === 'addr') return null
    return { kind: 'sum', r: this.#inReg(v, new Set()), k: 0 }
  }

  /**
   * `a + b` or `a - k` left as a sum where one side is a constant or a near array and the
   * whole offset fits an instruction: null where it does not.
   */
  #sum(op: 'add' | 'sub', a: Value, b: Value): Sum | null {
    const right = this.#known(b, op === 'sub')
    const left = op === 'add' && right === null ? this.#known(a, false) : null
    const part = right ?? left
    if (part === null) return null
    const base = this.#based(right !== null ? a : b)
    if (base === null || (base.label !== undefined && part.label !== undefined)) return null
    const label = base.label ?? part.label
    const sum: Sum = { kind: 'sum', r: base.r, k: signed(base.k + part.k) }
    if (label !== undefined) sum.label = label
    const value = (label === undefined ? 0 : (this.#near.get(label) ?? 0)) + sum.k
    return fits14(value) ? sum : null
  }

  /**
   * `a * k` as shifts where k has one or two bits set, or is one less than a power of two
   * (MUL is 4 cycles and needs k in a register; a shift is 1): false for any other k.
   */
  #multiply(a: Value, k: number): boolean {
    const u = k & 0xffff
    const bits = [...Array(16).keys()].filter((b) => (u >> b) & 1)
    const [low, high] = bits
    const below = Math.log2(u + 1)
    // 0xFFFF would be a shift by 16, which the machine has not (MUL takes it).
    if (u === 0 || (bits.length > 2 && (!Number.isInteger(below) || below > 15))) return false
    const ra = this.#inReg(a, new Set())
    if (bits.length === 1) {
      const d = this.#result([ra])
      this.#line(`slli ${d}, ${ra}, ${low}`)
      this.#stack.push({ kind: 'reg', r: d })
      return true
    }
    const d = this.#result([ra])
    const t = this.#temp(new Set([ra, d]))
    if (bits.length > 2) {
      this.#line(`slli ${t}, ${ra}, ${below}`)
      this.#line(`sub ${d}, ${t}, ${ra}`)
    } else {
      this.#line(`slli ${t}, ${ra}, ${high}`)
      if (low === 0) this.#line(`add ${d}, ${t}, ${ra}`)
      else {
        this.#line(`slli ${d}, ${ra}, ${low}`)
        this.#line(`add ${d}, ${d}, ${t}`)
      }
    }
    this.#stack.push({ kind: 'reg', r: d })
    return true
  }

  /** `a op k` in one instruction where the machine has a form for it; false where it has none. */
  #immediate(op: BinOp, a: Value, k: number): boolean {
    if (op === 'mul') return this.#multiply(a, k)
    let mnemonic = IMMEDIATE[op]
    let imm = k
    // Unsigned division and remainder by a power of two are a shift and a mask.
    const u = k & 0xffff
    const power = u !== 0 && (u & (u - 1)) === 0
    if (power && op === 'divu') {
      mnemonic = 'srli'
      imm = Math.log2(u)
    }
    if (power && op === 'remu') {
      mnemonic = 'andi'
      imm = u - 1
    }
    if (op === 'sub' && fits14(-k)) {
      mnemonic = 'addi'
      imm = -k
    }
    const shift = SHIFT_IMMEDIATE[op]
    if (shift !== undefined) {
      mnemonic = shift
      imm = k & 15
    }
    if (mnemonic === undefined || !fits14(imm)) return false
    const ra = this.#inReg(a, new Set())
    const d = this.#result([ra])
    this.#line(`${mnemonic} ${d}, ${ra}, ${imm}`)
    this.#stack.push({ kind: 'reg', r: d })
    return true
  }

  /** Where a result goes: an operand's temporary when it has one (it is used up), else a fresh one. */
  #result(operands: string[]): string {
    const temp = operands.find((r) => this.#temps.includes(r) && !this.#used().has(r))
    return temp ?? this.#temp(new Set(operands))
  }

  #unary(op: 'neg' | 'not' | 'lnot'): void {
    const ra = this.#inReg(this.#pop(), new Set())
    const d = this.#result([ra])
    this.#line(
      op === 'neg' ? `neg ${d}, ${ra}` : op === 'not' ? `not ${d}, ${ra}` : `seqz ${d}, ${ra}`,
    )
    this.#stack.push({ kind: 'reg', r: d })
  }

  /**
   * A comparison and the jump on it as one branch. Anything below the two operands goes to
   * its label registers first, with the operands still on the stack so nothing moves them.
   */
  #compareAndBranch(op: BinOp, onTrue: boolean, to: string): void {
    this.#forward = null
    if (this.#stack.length > 2) this.#canonical()
    const b = this.#pop()
    const a = this.#pop()
    const taken = onTrue ? op : (NEGATE[op] as BinOp)
    const [mnemonic, swap] = BRANCH[taken] as [string, boolean]
    const rb = this.#inReg(b, held(a))
    const ra = this.#inReg(a, new Set([rb]))
    const [x, y] = swap ? [rb, ra] : [ra, rb]
    this.#line(`${mnemonic} ${x}, ${y}, ${to}`)
  }

  #flow(op: Op): void {
    switch (op.k) {
      case 'label': {
        // Reached by falling through: the picture is put in its label registers. After a
        // jump or a return nothing falls through, and the depth is the jumps' to it.
        if (!this.#dead) this.#canonical()
        const depth = this.#dead ? (this.#depths.get(op.name) ?? 0) : this.#stack.length
        this.lines.push(`${op.name}:`)
        this.#atLabel(depth)
        this.#dead = false
        return
      }
      case 'jmp':
        this.#canonical()
        this.#line(`j ${op.to}`)
        this.#dead = true
        return
      case 'jz':
      case 'jnz': {
        if (this.#stack.length > 1) this.#canonical()
        const r = this.#inReg(this.#pop(), new Set())
        this.#line(`${op.k === 'jz' ? 'beqz' : 'bnez'} ${r}, ${op.to}`)
        return
      }
      default:
        this.#callsAndRest(op)
        return
    }
  }

  /**
   * The top values into `targets` (a0-a3 for a call; t0 then a0-a3 for an ECALL), everything
   * below them onto the machine's stack. A register filled is never taken again for the rest.
   */
  #arguments(targets: string[]): void {
    const below = this.#stack.length - targets.length
    if (below > 0) this.#spillAt(below - 1)
    const values = this.#stack.splice(below)
    // Arguments a call inside them put on the machine's stack come back first, topmost first.
    this.#unspill(values)
    this.#parallelMove(values, targets)
  }

  #move(to: string, v: Value, avoid: Set<string>): void {
    const home = v.kind === 'local' ? this.#home[v.slot] : undefined
    if (v.kind === 'const') this.#line(`li ${to}, ${v.v & 0xffff}`)
    else if (v.kind === 'addr') this.#line(`la ${to}, ${v.label}`)
    else if (v.kind === 'sum') this.#add(to, v)
    else if (typeof home === 'number') this.#line(`lw ${to}, ${home}(fp)`)
    else if (v.kind === 'reg' && this.#retarget(v.r, to)) return
    else {
      const r = this.#inReg(v, new Set([...avoid, to]))
      if (r !== to) this.#line(r === 'zero' ? `li ${to}, 0` : `mv ${to}, ${r}`)
    }
  }

  #callsAndRest(op: Op): void {
    switch (op.k) {
      case 'call':
        this.#arguments(ARGS.slice(0, op.argc))
        // Through far_call into another bank: t0 and t1 are free, the arguments in place.
        for (const line of callLines(op.fn, this.#fn.bank, this.#banks)) this.#line(line)
        if (op.ret) this.#result0()
        return
      case 'block':
        // The three into a0-a2, which it moves on as it goes: nothing kept in them is read again.
        this.#arguments(ARGS.slice(0, 3))
        this.#line(`${op.fill ? 'mset' : 'mcpy'} a0, a1, a2`)
        return
      case 'ecall':
        this.#arguments(['t0', ...ARGS.slice(0, op.argc)])
        this.#line('ecall')
        this.#result0()
        return
      case 'ret':
        if (op.value) this.#move('a0', this.#pop(), new Set())
        // With nothing to restore, the epilogue is `ret` itself: no jump to it.
        this.#line(this.#saveArea().length === 0 && this.#frame === 0 ? 'ret' : 'j .return')
        this.#dead = true
        return
      default:
        this.#rest(op)
        return
    }
  }

  /**
   * The answer, left in a0: no temporary hands it out, the next call's arguments move it out
   * of the way or put it below them, and a store or return takes it from there.
   */
  #result0(): void {
    this.#stack.push({ kind: 'reg', r: 'a0' })
  }

  /**
   * Whether a value sits in a register of its own: one it holds, or a sum in a temporary or
   * in a0 (a call's answer) - not a sum on a local's home, which only reads it.
   */
  #owns(v: Value): v is Extract<Value, { r: string }> {
    return v.kind === 'reg' || (v.kind === 'sum' && (this.#temps.includes(v.r) || v.r === 'a0'))
  }

  #rest(op: Op): void {
    switch (op.k) {
      case 'csrr': {
        const r = this.#temp()
        this.#line(`csrr ${r}, ${op.csr}`)
        this.#stack.push({ kind: 'reg', r })
        return
      }
      case 'csrw':
        this.#line(`csrw ${op.csr}, ${this.#inReg(this.#pop(), new Set())}`)
        return
      case 'wfi':
        this.#line('wfi')
        return
      case 'asm':
        // Assembly may use any register: nothing is left in one across it. It is the author's,
        // kept whole between its marks: tidyJumps cuts nothing in it.
        this.#spillAt(this.#stack.length - 1)
        this.#line(ASM_START)
        for (const line of op.text.split('\n')) if (line.trim() !== '') this.#line(line.trim())
        this.#line(ASM_END)
        return
      case 'drop':
        this.#drop()
        return
      case 'dup':
        this.#dup()
        return
      default:
        return
    }
  }

  #drop(): void {
    const v = this.#pop()
    if (v.kind === 'spilled') this.#line('addi sp, sp, 2')
  }

  #dup(): void {
    const v = this.#stack[this.#stack.length - 1] as Value
    // A sum on a local's home only reads it; one in its own temporary is added up to copy.
    const shared = v.kind === 'sum' && !this.#owns(v)
    if (v.kind === 'const' || v.kind === 'addr' || v.kind === 'local' || shared) {
      this.#stack.push({ ...v })
      return
    }
    const r = this.#inReg(this.#pop(), new Set())
    const copy = this.#temp(new Set([r]))
    this.#line(`mv ${copy}, ${r}`)
    this.#stack.push({ kind: 'reg', r }, { kind: 'reg', r: copy })
  }
}

/** The routine in the ROM that calls a function in another bank: t0 its address, t1 its bank. */
export const FAR_CALL = 'far_call'

/**
 * Each function's bank, and what a bank's number is to the machine: the ROM's banks are the
 * window's own numbers, a cartridge's start at 0x100 (docs/elec16-play.md section 7).
 */
export type BankMap = Map<string, number | null> & { base?: number }

/**
 * How a function in bank `from` calls `name`: directly within a bank or into the fixed ROM,
 * else through far_call, which maps the callee's bank and puts the caller's back.
 */
export function callLines(name: string, from: number | null, banks: BankMap): string[] {
  const bank = banks.get(name) ?? null
  if (bank === null || bank === from) return [`call ${name}`]
  return [`la t0, ${name}`, `li t1, ${(banks.base ?? 0) + bank}`, `call ${FAR_CALL}`]
}

/**
 * The stack's depth at each label: what the jumps to it leave (a conditional jump after
 * taking its value). After a jump or a return the code is dead until a label, whose depth
 * is then the jumps' - never what dead code before it would have left.
 */
export function labelDepths(body: Op[]): Map<string, number> {
  const depths = new Map<string, number>()
  const first = (label: string, depth: number) => {
    if (!depths.has(label)) depths.set(label, depth)
  }
  let depth = 0
  let dead = false
  for (const op of body) {
    if (op.k === 'label') {
      if (dead) depth = depths.get(op.name) ?? 0
      else first(op.name, depth)
      dead = false
    } else if (!dead) {
      depth += stackEffect(op)
      if (op.k === 'jmp' || op.k === 'jz' || op.k === 'jnz') first(op.to, depth)
      dead = op.k === 'jmp' || op.k === 'ret'
    }
  }
  return depths
}

/** The register a value already holds, which loading another beside it must not take. */
const held = (v: Value): Set<string> =>
  new Set(v.kind === 'reg' || (v.kind === 'sum' && v.r !== 'zero') ? [v.r] : [])

/** A value whose register was copied to `r`: a sum keeps its offset. */
const movedTo = (v: Value, r: string): Value =>
  v.kind === 'sum' ? { ...v, r } : { kind: 'reg', r }

/** A sum's offset as the assembler reads it: `buffer+1`, `-2`. */
function offsetText(v: Sum): string {
  if (v.label === undefined) return String(v.k)
  return v.k === 0 ? v.label : `${v.label}${v.k > 0 ? '+' : ''}${v.k}`
}

interface Homes {
  home: (string | number)[]
  saved: string[]
  frame: number
  temps: string[]
}

/**
 * Where each slot lives. A leaf (it calls nothing) keeps its parameters in the registers they
 * came in and other locals in the argument registers left over, as long as `deepest` values
 * (at least four) still have temporaries: nothing to save or move. The rest go to saved
 * registers, the busiest first, then to a frame.
 */
function homes(fn: Fn, leaf: boolean, deepest: number): Homes {
  const uses = fn.slots.map(() => 0)
  for (const op of fn.body)
    if (op.k === 'ld' || op.k === 'st') uses[op.slot] = (uses[op.slot] ?? 0) + 1
  for (let k = 0; k < fn.params; k++) uses[k] = (uses[k] ?? 0) + 1
  const home: (string | number)[] = []
  const temps = [...TEMPS]
  if (leaf) leafHomes(fn, byUse(fn, uses), Math.max(4, deepest), home, temps)
  const rest = byUse(fn, uses).filter((slot) => home[slot] === undefined)
  // With a frame, s0 is fp; without one, all four saved registers hold locals.
  const registers = rest.length <= 4 ? SAVED : SAVED.slice(0, 3)
  let frame = 0
  rest.forEach((slot, rank) => {
    const r = registers[rank]
    if (r !== undefined) home[slot] = r
    else {
      home[slot] = frame
      frame += 2
    }
  })
  const saved = [
    ...new Set(home.filter((h): h is string => typeof h === 'string' && SAVED.includes(h))),
  ]
  return { home, saved, frame, temps }
}

/**
 * A leaf's parameters in the registers they came in, then its busiest other locals in the
 * argument registers left over, each only while `keep` temporaries remain (a0 is none).
 */
function leafHomes(
  fn: Fn,
  order: number[],
  keep: number,
  home: (string | number)[],
  temps: string[],
): void {
  const take = (slot: number, r: string): boolean => {
    if (temps.includes(r)) {
      if (temps.length <= keep) return false
      temps.splice(temps.indexOf(r), 1)
    }
    home[slot] = r
    return true
  }
  for (let slot = 0; slot < Math.min(fn.params, ARGS.length); slot++)
    take(slot, ARGS[slot] as string)
  const spare = ARGS.slice(fn.params)
  for (const slot of order) {
    const r = spare[0]
    if (slot < fn.params || r === undefined) continue
    if (take(slot, r)) spare.shift()
  }
}

/** The slots, the busiest first. */
function byUse(fn: Fn, uses: number[]): number[] {
  return fn.slots.map((_, k) => k).sort((x, y) => (uses[y] ?? 0) - (uses[x] ?? 0))
}

/** The marks around an asm block, which tidyJumps leaves whole. */
const ASM_START = '; asm'
const ASM_END = '; end asm'

/**
 * Jumps tidied in the finished lines: what follows a jump up to the next label is never run,
 * and a jump to a label that comes next (labels and comments between) goes. An asm block is
 * left whole - its jumps, what follows them and its labels are the author's - and what comes
 * after one is taken to run.
 */
export function tidyJumps(lines: string[]): string[] {
  const out: string[] = []
  const authored: boolean[] = []
  let dead = false
  let inAsm = false
  for (const line of lines) {
    if (line === `  ${ASM_START}`) inAsm = true
    if (inAsm) {
      out.push(line)
      authored.push(true)
      if (line === `  ${ASM_END}`) {
        inAsm = false
        dead = false
      }
      continue
    }
    const isLabel = /^[.\w]+:/.test(line)
    if (isLabel) dead = false
    if (dead && !line.startsWith('  ;') && line !== '') continue
    out.push(line)
    authored.push(false)
    if (/^ {2}(j|jr|ret)\b/.test(line)) dead = true
  }
  return out.filter((line, k) => {
    if (authored[k] === true) return true
    const jump = /^ {2}j ([.\w]+)$/.exec(line)
    // A jump to the label that comes next, or a `ret` with the epilogue's `ret` next, goes.
    if (jump !== null) return !comesNext(out, k, `${jump[1]}:`)
    return line !== '  ret' || !comesNext(out, k, '  ret')
  })
}

/** Whether `wanted` is the next line after `k`, past labels and comments. */
function comesNext(lines: string[], k: number, wanted: string): boolean {
  for (let n = k + 1; n < lines.length; n++) {
    const next = lines[n] as string
    if (next === wanted) return true
    if (!/^[.\w]+:/.test(next) && !next.startsWith('  ;')) return false
  }
  return false
}
