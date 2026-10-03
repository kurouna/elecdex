/**
 * One ELEC-16 (docs/elec16.md): the E16 CPU on its bus, the timer, the keys and the screen,
 * run a number of cycles at a time by whoever holds it. It keeps no time of its own: the page
 * says how much host time has passed (`advance`) and what the clock reads (`setClock`), so
 * the same machine runs the same way in the page, in main and in a test.
 *
 * Decoded instructions are kept per address below the LCD's memory and dropped when the RAM
 * under them is written or the bank window changes, so the CPU decodes each instruction once
 * however many times it runs. The step checks for interrupts only when some are enabled, and
 * looks its cycles up in a table built once (docs/elec16.md section 4 has what was measured).
 */

import { Bus, pressKey, releaseKey } from './bus.js'
import { type Core, EXEC } from './exec.js'
import { cyclesOf, decode, type Inst, OP, OPS } from './isa.js'
import {
  DEFAULT_HZ,
  DEFAULT_MODEL,
  MAX_HZ,
  MIN_HZ,
  MODELS,
  type Model,
  type ModelId,
  RESET_VECTOR,
  ROM_MAX,
  VRAM,
} from './map.js'
import {
  CAUSE,
  CSR_NAMES,
  createState,
  type Elec16State,
  type Halt,
  INTERRUPT,
  IRQ,
  KEY_ROWS,
  MIE,
  MISA,
  MPIE,
} from './state.js'

/** What woke a sleeping machine may be waiting for: a key, or the timer in so many ms. */
export interface Wake {
  key: boolean
  timerMs: number | null
}

export interface RunResult {
  /** Cycles run. */
  cycles: number
  /** Asleep in WFI (or switched off): what it waits for. Null while it runs. */
  sleeping: Wake | null
  halted: Halt | null
}

/** The clock as the page reads it. */
export interface ClockFields {
  second: number
  minute: number
  hour: number
  day: number
  month: number
  year: number
  /** 0 Sunday to 6 Saturday. */
  weekday: number
}

const TIMER_HZ = 1024
/** What taking an interrupt costs, in cycles. */
const TRAP_CYCLES = 2

/** Each operation's cycles, not taken and taken (only branches differ). */
const CYCLES = Uint8Array.from(OPS, (_, op) => cyclesOf(op, false))
const TAKEN_CYCLES = Uint8Array.from(OPS, (_, op) => cyclesOf(op, true))
type Handler = (typeof EXEC)[number]

const HALT_NAMES: Record<number, string> = {
  [CAUSE.illegal]: 'illegal instruction',
  [CAUSE.breakpoint]: 'breakpoint',
  [CAUSE.loadMisaligned]: 'misaligned load',
  [CAUSE.storeMisaligned]: 'misaligned store',
  [CAUSE.storeFault]: 'write to ROM',
  [CAUSE.ecall]: 'ecall with no handler',
}

export class Elec16 implements Core {
  readonly s: Elec16State
  readonly r: Uint16Array
  readonly bus: Bus
  readonly model: Model
  next = 0
  taken = false
  /** Cycles a frame (60 a second) runs at this clock. */
  #hz = DEFAULT_HZ
  // Filled, not sized: reading a hole in a sparse array goes up the prototype chain.
  readonly #code: (Inst | undefined)[] = Array.from({ length: VRAM }, () => undefined)

  private constructor(rom: Uint8Array, s: Elec16State) {
    if (rom.length > ROM_MAX) throw new RangeError(`a ROM of ${rom.length} bytes is too long`)
    this.s = s
    this.r = s.regs
    this.model = MODELS[s.model]
    // The bus drops decoded code when RAM under it is written or the bank window changes.
    this.bus = new Bus(s, rom, this.model, this.#code)
  }

  /** A machine switched on with `rom` in it: RAM clear, the CPU at the reset vector. */
  static boot(rom: Uint8Array, model: ModelId = DEFAULT_MODEL): Elec16 {
    return new Elec16(rom, createState(model))
  }

  get state(): Readonly<Elec16State> {
    return this.s
  }

  /** Neither stopped by a fault nor switched off. */
  get running(): boolean {
    return this.s.halt === null && !this.s.off
  }

  get screenRevision(): number {
    return this.s.screenRevision
  }

  /** The clock in Hz (the unit's setting, 1 to 32 MHz). */
  get hz(): number {
    return this.#hz
  }

  set hz(hz: number) {
    this.#hz = Math.min(MAX_HZ, Math.max(MIN_HZ, Math.round(hz)))
  }

  /** Runs up to `cycles` cycles; stops early when the machine sleeps, halts or goes off. */
  run(cycles: number): RunResult {
    let used = 0
    while (used < cycles) {
      const spent = this.#step()
      if (spent === 0) break
      used += spent
    }
    return this.#result(used)
  }

  /** One instruction (CORE's STEP), or the interrupt taken before it. */
  step(): RunResult {
    return this.#result(this.#step())
  }

  /** A sixtieth of a second at the machine's clock: what an emulator's loop runs a frame. */
  frame(): void {
    this.run(Math.round(this.#hz / 60))
  }

  /** Host time passes: the timer counts, and may raise its interrupt. */
  advance(ms: number): void {
    if (!(ms > 0)) return
    const s = this.s
    const t = s.timer
    s.time += ms
    t.fraction += (ms * TIMER_HZ) / 1000
    const ticks = Math.floor(t.fraction)
    t.fraction -= ticks
    if (ticks === 0) return
    const distance = (t.compare - t.count) & 0xffff || 0x10000
    if (t.enabled && !t.pending && distance <= ticks) t.pending = true
    t.count = (t.count + ticks) & 0xffff
  }

  /** What the clock reads, as the page has it. */
  setClock(c: ClockFields): void {
    this.s.clock.set([c.second, c.minute, c.hour, c.day, c.month, c.year - 2000, c.weekday])
  }

  /** A key goes down (its code is row * 8 + column of the key matrix). */
  press(code: number): void {
    pressKey(this.s, code)
  }

  release(code: number): void {
    releaseKey(this.s, code)
  }

  /** The pane lost the keyboard: every key goes up. */
  releaseAll(): void {
    this.s.keys.held.fill(0)
  }

  /**
   * BRK/ON, or a restart after a fault: the CPU starts again at the reset vector with its
   * CSRs cleared, and the RAM - battery-backed - as it was.
   */
  reset(): void {
    const s = this.s
    s.regs.fill(0)
    s.pc = RESET_VECTOR
    s.csr = { mstatus: 0, mie: 0, mtvec: 0, mscratch: 0, mepc: 0, mcause: 0, mtval: 0 }
    s.inTrap = false
    s.sleeping = false
    s.halt = null
    s.off = false
    s.bank = 0
    s.keys.fifo.length = 0
    s.timer.pending = false
    s.timer.enabled = false
    this.#code.fill(undefined)
  }

  /** The screen as one value a dot (0..3), row by row, for whoever draws it. */
  pixels(out = new Uint8Array(this.model.width * this.model.height)): Uint8Array {
    const { width, height, depth } = this.model
    const plane = (width * height) / 8
    const vram = this.s.vram
    for (let y = 0; y < height; y++) {
      const row = (y >> 3) * width
      const bit = 1 << (y & 7)
      for (let x = 0; x < width; x++) {
        const low = (vram[row + x] ?? 0) & bit ? 1 : 0
        const high = depth === 2 && (vram[plane + row + x] ?? 0) & bit ? 2 : 0
        out[y * width + x] = low | high
      }
    }
    return out
  }

  /* ---------------- the Core a handler sees ---------------- */

  trap(cause: number, value: number): void {
    const s = this.s
    // No handler yet, or a fault inside one: nothing can go on sensibly.
    if (s.csr.mtvec === 0 || s.inTrap) {
      s.halt = {
        cause: s.inTrap && s.csr.mtvec !== 0 ? 'double fault' : (HALT_NAMES[cause] ?? 'fault'),
        pc: s.pc,
      }
      this.next = s.pc
      return
    }
    this.#enterTrap(cause, value, s.pc)
  }

  csrRead(csr: number): number | null {
    const s = this.s
    switch (csr) {
      case CSR_NAMES.mstatus:
        return s.csr.mstatus
      case CSR_NAMES.misa:
        return MISA
      case CSR_NAMES.mie:
        return s.csr.mie
      case CSR_NAMES.mip:
        return this.#pending()
      case CSR_NAMES.cycle:
        return s.cycles % 0x10000
      case CSR_NAMES.cycleh:
        return Math.floor(s.cycles / 0x10000) % 0x10000
      case CSR_NAMES.instret:
        return s.instret % 0x10000
      case CSR_NAMES.instreth:
        return Math.floor(s.instret / 0x10000) % 0x10000
      default:
        return this.#trapCsrRead(csr)
    }
  }

  #trapCsrRead(csr: number): number | null {
    const c = this.s.csr
    const values: Record<number, number> = {
      [CSR_NAMES.mtvec]: c.mtvec,
      [CSR_NAMES.mscratch]: c.mscratch,
      [CSR_NAMES.mepc]: c.mepc,
      [CSR_NAMES.mcause]: c.mcause,
      [CSR_NAMES.mtval]: c.mtval,
    }
    return values[csr] ?? null
  }

  csrWrite(csr: number, value: number): void {
    const c = this.s.csr
    const v = value & 0xffff
    if (csr === CSR_NAMES.mstatus) c.mstatus = v & (MIE | MPIE)
    else if (csr === CSR_NAMES.mie) c.mie = v & 15
    else if (csr === CSR_NAMES.mtvec) c.mtvec = v & 0xfffe
    else if (csr === CSR_NAMES.mscratch) c.mscratch = v
    else if (csr === CSR_NAMES.mepc) c.mepc = v & 0xfffe
    else if (csr === CSR_NAMES.mcause) c.mcause = v
    else if (csr === CSR_NAMES.mtval) c.mtval = v
  }

  waitForInterrupt(): void {
    if ((this.#pending() & this.s.csr.mie) === 0) this.s.sleeping = true
  }

  trapReturn(): void {
    const c = this.s.csr
    this.next = c.mepc
    c.mstatus = (c.mstatus & MPIE ? MIE : 0) | MPIE
    this.s.inTrap = false
  }

  /* ---------------- inside ---------------- */

  /** The interrupt lines raised now: the timer's compare, and a key waiting in the FIFO. */
  #pending(): number {
    const s = this.s
    return (s.timer.pending ? 1 << IRQ.timer : 0) | (s.keys.fifo.length > 0 ? 1 << IRQ.key : 0)
  }

  #enterTrap(cause: number, value: number, epc: number): void {
    const c = this.s.csr
    c.mepc = epc
    c.mcause = cause
    c.mtval = value & 0xffff
    c.mstatus = c.mstatus & MIE ? MPIE : 0
    this.s.inTrap = true
    this.next = c.mtvec
  }

  /** Runs one instruction; the cycles it took, or 0 when the machine cannot go on. */
  #step(): number {
    const s = this.s
    if (s.halt !== null || s.off) return 0
    // Most of the time nothing is enabled and nothing sleeps: no lines to look at.
    if (s.csr.mie !== 0 || s.sleeping) {
      const taken = this.#interrupt()
      if (taken >= 0) return taken
    }
    const pc = s.pc
    const inst = (pc < VRAM ? this.#code[pc] : undefined) ?? this.#fetch(pc)
    this.next = (pc + inst.size) & 0xffff
    this.taken = false
    ;(EXEC[inst.op] as Handler)(this, inst, pc)
    if (s.halt !== null) return 0
    s.pc = this.next
    const cycles = (this.taken ? TAKEN_CYCLES[inst.op] : CYCLES[inst.op]) as number
    s.cycles += cycles
    s.instret++
    return cycles
  }

  /**
   * Before an instruction: wakes a sleeping machine when an enabled line is up, and takes the
   * lowest such line when interrupts are on. The cycles the interrupt took, 0 when the
   * machine sleeps on, or -1 to run the instruction.
   */
  #interrupt(): number {
    const s = this.s
    const ready = this.#pending() & s.csr.mie
    if (s.sleeping) {
      if (ready === 0) return 0
      s.sleeping = false
    }
    if (ready === 0 || (s.csr.mstatus & MIE) === 0 || s.inTrap) return -1
    const line = 31 - Math.clz32(ready & -ready)
    this.#enterTrap(INTERRUPT | line, 0, s.pc)
    s.pc = this.next
    s.cycles += TRAP_CYCLES
    return TRAP_CYCLES
  }

  /** Decodes the instruction at `pc` and keeps it, where code is kept. */
  #fetch(pc: number): Inst {
    const lo = this.bus.peek(pc) | (this.bus.peek(pc + 1) << 8)
    const hi = (lo & 3) === 3 ? this.bus.peek(pc + 2) | (this.bus.peek(pc + 3) << 8) : 0
    const inst = decode(lo, hi)
    if (pc < VRAM) this.#code[pc] = inst
    return inst
  }

  #result(cycles: number): RunResult {
    const s = this.s
    const asleep = s.sleeping || s.off
    return { cycles, sleeping: asleep ? this.#wake() : null, halted: s.halt }
  }

  /** What a sleeping machine waits for: only lines it has enabled. */
  #wake(): Wake {
    const s = this.s
    if (s.off) return { key: true, timerMs: null }
    const t = s.timer
    const timerOn = (s.csr.mie & (1 << IRQ.timer)) !== 0 && t.enabled && !t.pending
    const ticks = ((t.compare - t.count) & 0xffff || 0x10000) - t.fraction
    return {
      key: (s.csr.mie & (1 << IRQ.key)) !== 0,
      timerMs: timerOn ? (ticks * 1000) / TIMER_HZ : null,
    }
  }
}

/** The key matrix's size, for a page that maps its keys onto it. */
export const KEY_COUNT = KEY_ROWS * 8

/** An operation's number by name, for a test or a debugger. */
export { OP }
