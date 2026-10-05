import type { BinOp, Fn, Op, Program } from './ir.js'
import { mulShiftWord, signed, word } from './types.js'

/**
 * Runs e16c's stack code directly (docs/elec16.md section 6, e16c), with the machine's
 * arithmetic: 16-bit words, division as E16 divides (by zero: all ones and the dividend;
 * -32768 / -1 overflows to itself). Two uses: the tests run a program three ways - as
 * TypeScript, here, and compiled on the machine - and -O2 runs a pure function called with
 * constants here at compile time. A budget of operations stops anything that does not end.
 */

export interface InterpOptions {
  /** 64 KB the program reads and writes; one of its own when not given. */
  memory?: Uint8Array
  /** An ECALL: the service and its arguments, the answer a word. */
  ecall?: (service: number, args: number[]) => number
  /** A function written in assembly, called by name. */
  extern?: (name: string, args: number[]) => number
  /** The most operations a run may take; past it, `OutOfBudget`. */
  budget?: number
}

export class OutOfBudget extends Error {}

/** The deepest calls a run may make: the machine's 1 KB stack holds far fewer. */
const MAX_DEPTH = 500

/** What the interpreter cannot do: a run that needs the machine (assembly, a CSR, WFI). */
export class NeedsMachine extends Error {}

function divide(a: number, b: number, isSigned: boolean, remainder: boolean): number {
  if (b === 0) return remainder ? a : 0xffff
  if (!isSigned) return remainder ? a % b : Math.trunc(a / b)
  const n = signed(a)
  const d = signed(b)
  if (n === -32768 && d === -1) return remainder ? 0 : n
  return remainder ? n % d : Math.trunc(n / d)
}

const BIN: Record<BinOp, (a: number, b: number) => number> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => Math.imul(a, b),
  div: (a, b) => divide(a, b, true, false),
  divu: (a, b) => divide(a, b, false, false),
  rem: (a, b) => divide(a, b, true, true),
  remu: (a, b) => divide(a, b, false, true),
  and: (a, b) => a & b,
  or: (a, b) => a | b,
  xor: (a, b) => a ^ b,
  shl: (a, b) => a << (b & 15),
  shr: (a, b) => a >>> (b & 15),
  sar: (a, b) => signed(a) >> (b & 15),
  eq: (a, b) => (a === b ? 1 : 0),
  ne: (a, b) => (a !== b ? 1 : 0),
  lt: (a, b) => (signed(a) < signed(b) ? 1 : 0),
  ltu: (a, b) => (a < b ? 1 : 0),
  le: (a, b) => (signed(a) <= signed(b) ? 1 : 0),
  leu: (a, b) => (a <= b ? 1 : 0),
  gt: (a, b) => (signed(a) > signed(b) ? 1 : 0),
  gtu: (a, b) => (a > b ? 1 : 0),
  ge: (a, b) => (signed(a) >= signed(b) ? 1 : 0),
  geu: (a, b) => (a >= b ? 1 : 0),
}

/** A binary operation on two words, as the machine does it: a word. */
export const binary = (op: BinOp, a: number, b: number): number => word(BIN[op](word(a), word(b)))

/** Where a string goes when the interpreter lays the ROM out itself. */
const ROM_STRINGS = 0x8000

interface Compiled {
  fn: Fn
  labels: Map<string, number>
}

export class Interp {
  readonly memory: Uint8Array
  readonly #fns = new Map<string, Compiled>()
  readonly #addresses = new Map<string, number>()
  readonly #program: Program
  readonly #options: InterpOptions
  #left: number

  constructor(program: Program, options: InterpOptions = {}) {
    this.#program = program
    this.#options = options
    this.memory = options.memory ?? new Uint8Array(0x10000)
    this.#left = options.budget ?? Number.POSITIVE_INFINITY
    for (const fn of program.fns) this.#fns.set(fn.name, { fn, labels: labelsOf(fn.body) })
    for (const a of program.arrays) this.#addresses.set(a.name, a.at)
    let at = ROM_STRINGS
    for (const s of program.strings) {
      this.#addresses.set(s.label, at)
      this.memory.set([...s.bytes, 0], at)
      at += s.bytes.length + 1
    }
  }

  /** What e16c_init does: the globals' first values, the arrays cleared. */
  init(): void {
    for (const g of this.#program.globals) this.#write(g.at, g.init, g.byte)
    for (const a of this.#program.arrays) this.memory.fill(0, a.at, a.at + a.bytes + (a.bytes & 1))
  }

  /** How deep the calls go now: past MAX_DEPTH a run is out of budget, not out of JS stack. */
  #depth = 0

  /** Calls a function; its answer (0 for one that gives none). */
  call(name: string, args: number[] = []): number {
    if (this.#depth >= MAX_DEPTH) throw new OutOfBudget(`${name} calls itself too deep`)
    this.#depth++
    try {
      return this.#callNow(name, args)
    } finally {
      this.#depth--
    }
  }

  #callNow(name: string, args: number[]): number {
    const found = this.#fns.get(name)
    if (found === undefined) {
      const extern = this.#options.extern
      if (extern === undefined || !this.#program.externs.has(name))
        throw new Error(`no function ${name}`)
      return word(extern(name, args))
    }
    return this.#run(found, args.map(word))
  }

  #read(at: number, byte: boolean): number {
    const a = at & 0xffff
    return byte
      ? (this.memory[a] ?? 0)
      : (this.memory[a] ?? 0) | ((this.memory[(a + 1) & 0xffff] ?? 0) << 8)
  }

  #write(at: number, value: number, byte: boolean): void {
    const a = at & 0xffff
    this.memory[a] = value & 0xff
    if (!byte) this.memory[(a + 1) & 0xffff] = (value >> 8) & 0xff
  }

  #run({ fn, labels }: Compiled, args: number[]): number {
    const slots = new Array<number>(fn.slots.length).fill(0)
    args.forEach((a, k) => {
      slots[k] = a
    })
    const stack: number[] = []
    let pc = 0
    while (pc < fn.body.length) {
      if (--this.#left < 0) throw new OutOfBudget(`${fn.name} ran past its budget`)
      const op = fn.body[pc++] as Op
      const jump = this.#step(op, stack, slots, labels)
      if (jump === 'return') return op.k === 'ret' && op.value ? (stack.pop() ?? 0) : 0
      if (jump !== null) pc = jump
    }
    return 0
  }

  /** One operation: where to jump, 'return', or null to go on. */
  #step(
    op: Op,
    stack: number[],
    slots: number[],
    labels: Map<string, number>,
  ): number | 'return' | null {
    const pop = () => stack.pop() ?? 0
    switch (op.k) {
      case 'push':
        stack.push(word(op.v))
        return null
      case 'addr':
        stack.push(this.#addresses.get(op.label) ?? 0)
        return null
      case 'ld':
        stack.push(slots[op.slot] ?? 0)
        return null
      case 'st':
        slots[op.slot] = pop()
        return null
      case 'ldg':
        stack.push(this.#read(op.at, op.byte))
        return null
      case 'stg':
        this.#write(op.at, pop(), op.byte)
        return null
      default:
        return this.#memoryOrFlow(op, stack, labels)
    }
  }

  #memoryOrFlow(op: Op, stack: number[], labels: Map<string, number>): number | 'return' | null {
    const pop = () => stack.pop() ?? 0
    switch (op.k) {
      case 'load':
        stack.push(this.#read(pop(), op.byte))
        return null
      case 'store': {
        const value = pop()
        this.#write(pop(), value, op.byte)
        return null
      }
      case 'bin': {
        const b = pop()
        stack.push(word(BIN[op.op](pop(), b)))
        return null
      }
      case 'mulq': {
        const b = pop()
        stack.push(mulShiftWord(pop(), b, op.shift))
        return null
      }
      case 'un': {
        const a = pop()
        stack.push(word(op.op === 'neg' ? -a : op.op === 'not' ? ~a : a === 0 ? 1 : 0))
        return null
      }
      case 'jmp':
        return labels.get(op.to) ?? null
      case 'jz':
      case 'jnz':
        return (pop() === 0) === (op.k === 'jz') ? (labels.get(op.to) ?? null) : null
      case 'ret':
        return 'return'
      default:
        return this.#rest(op, stack)
    }
  }

  #rest(op: Op, stack: number[]): null {
    const pop = () => stack.pop() ?? 0
    switch (op.k) {
      case 'call': {
        const args = stack.splice(stack.length - op.argc)
        const answer = this.call(op.fn, args)
        if (op.ret) stack.push(answer)
        return null
      }
      case 'block': {
        const n = pop()
        const from = pop()
        const to = pop()
        // As MCPY: every byte read before any is written, so an overlap is copied whole.
        const bytes = Array.from({ length: n }, (_, k) =>
          op.fill ? from & 0xff : (this.memory[(from + k) & 0xffff] ?? 0),
        )
        bytes.forEach((b, k) => {
          this.memory[(to + k) & 0xffff] = b
        })
        return null
      }
      case 'ecall': {
        const args = stack.splice(stack.length - op.argc)
        const service = pop()
        stack.push(word(this.#options.ecall?.(service, args) ?? 0))
        return null
      }
      case 'drop':
        pop()
        return null
      case 'dup':
        stack.push(stack[stack.length - 1] ?? 0)
        return null
      case 'csrr':
      case 'csrw':
      case 'wfi':
      case 'asm':
        throw new NeedsMachine(`${op.k} runs only on the machine`)
      default:
        return null
    }
  }
}

function labelsOf(body: Op[]): Map<string, number> {
  const labels = new Map<string, number>()
  body.forEach((op, k) => {
    if (op.k === 'label') labels.set(op.name, k + 1)
  })
  return labels
}
