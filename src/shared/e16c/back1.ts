import { type BinOp, type Fn, type Op, stackEffect } from './ir.js'

/**
 * e16c's -O1 code for one function (docs/elec16.md section 6, e16c). The stack code is run
 * in the compiler against a picture of the stack whose entries are not yet in registers -
 * a constant, a local, an address - until an instruction needs them, so `x + 1` is one
 * `addi` and `if (a < b)` one branch. Locals live in s0-s3 where they fit (the busiest
 * first), the rest in a frame under fp. Values that cross a label sit in fixed registers by
 * their depth; a call keeps what lies below its arguments on the machine's stack.
 */

type Value =
  | { kind: 'const'; v: number }
  | { kind: 'addr'; label: string }
  | { kind: 'local'; slot: number }
  | { kind: 'reg'; r: string }
  /** On the machine's stack: always below every other entry. */
  | { kind: 'spilled' }

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

const REGISTER: Record<BinOp, string[]> = {
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
const signed16 = (v: number): number => ((v & 0xffff) << 16) >> 16
const NEAR = 0x2000
const hex = (n: number): string => `0x${(n & 0xffff).toString(16).padStart(4, '0')}`

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

  constructor(fn: Fn) {
    this.#fn = fn
    this.#calls = fn.body.some((op) => op.k === 'call' || op.k === 'ecall' || op.k === 'asm')
    this.#depths = labelDepths(fn.body)
    const plan = homes(fn)
    this.#home = plan.home
    this.#saved = plan.saved
    this.#frame = plan.frame
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
    return this.lines
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
    for (const v of this.#stack) if (v.kind === 'reg') used.add(v.r)
    return used
  }

  /** A free temporary; when none is, the deepest value in a register goes to the machine's stack. */
  #temp(also: Set<string> = new Set()): string {
    const used = this.#used()
    const free = TEMPS.find((r) => !used.has(r) && !also.has(r))
    if (free !== undefined) return free
    const deepest = this.#stack.findIndex((v) => v.kind === 'reg')
    const v = this.#stack[deepest] as { kind: 'reg'; r: string }
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
      if (v.kind !== 'reg') continue
      this.#line('addi sp, sp, -2')
      this.#line(`sw ${v.r}, 0(sp)`)
      this.#stack[k] = { kind: 'spilled' }
    }
  }

  /** The registers the picture's values hold. */
  #held(values: Value[] = this.#stack): Set<string> {
    return new Set(values.flatMap((v) => (v.kind === 'reg' ? [v.r] : [])))
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
    }
  }

  #pop(): Value {
    const v = this.#stack.pop()
    if (v === undefined) throw new Error(`e16c: the stack ran out in ${this.#fn.name}`)
    return v
  }

  /** Every entry in the register its depth takes at a label (deeper than the temporaries: spilled). */
  #canonical(): void {
    if (this.#stack.length > TEMPS.length) {
      throw new Error(
        `e16c: an expression in ${this.#fn.name} keeps more than ${TEMPS.length} values across a branch`,
      )
    }
    this.#unspill(this.#stack)
    for (let k = 0; k < this.#stack.length; k++) {
      const v = this.#stack[k] as Value
      const want = TEMPS[k] as string
      if (v.kind === 'reg' && v.r === want) continue
      // Whoever holds the wanted register moves out of the way first.
      const holder = this.#stack.findIndex((w) => w.kind === 'reg' && w.r === want)
      if (holder >= 0) {
        const away = this.#temp(new Set(TEMPS.slice(0, this.#stack.length)))
        this.#line(`mv ${away}, ${want}`)
        this.#stack[holder] = { kind: 'reg', r: away }
      }
      this.#move(want, v, new Set([want]))
      this.#stack[k] = { kind: 'reg', r: want }
    }
  }

  /** The picture after a label: every entry in its depth's register. */
  #atLabel(depth: number): void {
    this.#stack = Array.from({ length: depth }, (_, k) => ({ kind: 'reg', r: TEMPS[k] as string }))
  }

  /** A local about to be written: any entry still reading it takes a copy first. */
  #protect(slot: number, avoid: Set<string>): void {
    this.#stack.forEach((v, k) => {
      if (v.kind !== 'local' || v.slot !== slot) return
      // Statements store with nothing spilled above; a copy below a spilled value would break
      // the machine stack's order.
      if (this.#stack.slice(k + 1).some((w) => w.kind === 'spilled')) {
        throw new Error(`e16c: a local is written under a spilled value in ${this.#fn.name}`)
      }
      const r = this.#temp(avoid)
      const home = this.#home[slot]
      if (typeof home === 'string') this.#line(`mv ${r}, ${home}`)
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
    if (!TEMPS.includes(from)) return false
    const last = this.lines[this.lines.length - 1] ?? ''
    const m = /^ {2}([a-z.]+) ([a-z0-9]+), (.*)$/.exec(last)
    if (m === null || m[2] !== from || /^(s[bw]|b|j|call)/.test(m[1] ?? '')) return false
    // Reading the temporary in the same instruction is fine: it is dead once stored.
    this.lines[this.lines.length - 1] = `  ${m[1]} ${home}, ${m[3]}`
    return true
  }

  /* ---------------- operations ---------------- */

  #op(op: Op): void {
    switch (op.k) {
      case 'line':
        this.#comment(`${op.file}:${op.line}  ${op.text}`)
        return
      case 'push':
        this.#stack.push({ kind: 'const', v: signed16(op.v) })
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

  #loadGlobal(at: number, byte: boolean): void {
    const r = this.#temp()
    this.#absolute(byte ? 'lbu' : 'lw', r, at)
    this.#stack.push({ kind: 'reg', r })
  }

  #storeGlobal(at: number, byte: boolean): void {
    const r = this.#inReg(this.#pop(), new Set())
    this.#absolute(byte ? 'sb' : 'sw', r, at, new Set([r]))
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

  /** An address's base and offset: a near constant needs no register. */
  #address(v: Value, avoid: Set<string>): [string, number] {
    if (v.kind === 'const' && (v.v & 0xffff) < NEAR) return ['zero', v.v & 0xffff]
    return [this.#inReg(v, avoid), 0]
  }

  #load(byte: boolean): void {
    const [base, offset] = this.#address(this.#pop(), new Set())
    const r = this.#temp(new Set([base]))
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
    if (b.kind === 'const' && this.#immediate(op, a, b.v)) return
    const rb = this.#inReg(b, held(a))
    const ra = this.#inReg(a, new Set([rb]))
    const d = this.#result([ra, rb])
    for (const line of REGISTER[op])
      this.#line(line.replace(/\$d/g, d).replace(/\$a/g, ra).replace(/\$b/g, rb))
    this.#stack.push({ kind: 'reg', r: d })
  }

  /** `a op k` in one instruction where the machine has a form for it; false where it has none. */
  #immediate(op: BinOp, a: Value, k: number): boolean {
    let mnemonic = IMMEDIATE[op]
    let imm = k
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
    const temp = operands.find((r) => TEMPS.includes(r) && !this.#used().has(r))
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
    const filled = new Set<string>()
    values.forEach((v, k) => {
      // Registers the values not yet moved still hold: loading this one must not take them.
      const holding = values.slice(k + 1).flatMap((w) => (w.kind === 'reg' ? [w.r] : []))
      const want = targets[k] as string
      // A register a later value still sits in is moved out of the way first.
      const later = values.findIndex((w, j) => j > k && w.kind === 'reg' && w.r === want)
      if (later >= 0) {
        const away = this.#temp(new Set([...targets, ...filled]))
        this.#line(`mv ${away}, ${want}`)
        values[later] = { kind: 'reg', r: away }
      }
      filled.add(want)
      this.#move(want, v, new Set([...filled, ...holding]))
    })
  }

  #move(to: string, v: Value, avoid: Set<string>): void {
    const home = v.kind === 'local' ? this.#home[v.slot] : undefined
    if (v.kind === 'const') this.#line(`li ${to}, ${v.v & 0xffff}`)
    else if (v.kind === 'addr') this.#line(`la ${to}, ${v.label}`)
    else if (typeof home === 'number') this.#line(`lw ${to}, ${home}(fp)`)
    else {
      const r = this.#inReg(v, new Set([...avoid, to]))
      if (r !== to) this.#line(r === 'zero' ? `li ${to}, 0` : `mv ${to}, ${r}`)
    }
  }

  #callsAndRest(op: Op): void {
    switch (op.k) {
      case 'call':
        this.#arguments(ARGS.slice(0, op.argc))
        this.#line(`call ${op.fn}`)
        if (op.ret) this.#result0()
        return
      case 'ecall':
        this.#arguments(['t0', ...ARGS.slice(0, op.argc)])
        this.#line('ecall')
        this.#result0()
        return
      case 'ret':
        if (op.value) this.#move('a0', this.#pop(), new Set())
        this.#line('j .return')
        this.#dead = true
        return
      default:
        this.#rest(op)
        return
    }
  }

  /** The answer in a0, moved to a temporary before anything else can use a0. */
  #result0(): void {
    const r = this.#temp(new Set(ARGS))
    this.#line(`mv ${r}, a0`)
    this.#stack.push({ kind: 'reg', r })
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
        // Assembly may use any register: nothing is left in one across it.
        this.#spillAt(this.#stack.length - 1)
        for (const line of op.text.split('\n')) if (line.trim() !== '') this.#line(line.trim())
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
    if (v.kind === 'const' || v.kind === 'addr' || v.kind === 'local') {
      this.#stack.push({ ...v })
      return
    }
    const r = this.#inReg(this.#pop(), new Set())
    const copy = this.#temp(new Set([r]))
    this.#line(`mv ${copy}, ${r}`)
    this.#stack.push({ kind: 'reg', r }, { kind: 'reg', r: copy })
  }
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
const held = (v: Value): Set<string> => new Set(v.kind === 'reg' ? [v.r] : [])

/** Where each slot lives: the busiest in saved registers, the rest in a frame. */
function homes(fn: Fn): { home: (string | number)[]; saved: string[]; frame: number } {
  const uses = fn.slots.map(() => 0)
  for (const op of fn.body)
    if (op.k === 'ld' || op.k === 'st') uses[op.slot] = (uses[op.slot] ?? 0) + 1
  for (let k = 0; k < fn.params; k++) uses[k] = (uses[k] ?? 0) + 1
  const order = fn.slots.map((_, k) => k).sort((x, y) => (uses[y] ?? 0) - (uses[x] ?? 0))
  // With a frame, s0 is fp; without one, all four saved registers hold locals.
  const registers = fn.slots.length <= 4 ? SAVED : SAVED.slice(0, 3)
  const home: (string | number)[] = []
  let frame = 0
  order.forEach((slot, rank) => {
    const r = registers[rank]
    if (r !== undefined) home[slot] = r
    else {
      home[slot] = frame
      frame += 2
    }
  })
  const saved = [...new Set(home.filter((h): h is string => typeof h === 'string'))]
  return { home, saved, frame }
}
