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

import { resetApu, wavesAt } from './apu.js'
import { Bus, pressKey, releaseKey } from './bus.js'
import {
  answerCard,
  type CardAnswer,
  type CardRequest,
  createCardState,
  takeCardRequest,
} from './card.js'
import { cartBankTaken, SAVE_BANK, sameDigest, slotOf } from './cartridge.js'
import { type Core, EXEC } from './exec.js'
import { cyclesOf, decode, type Inst, OP, OPS } from './isa.js'
import {
  answerLink,
  type LinkAnswer,
  type LinkRequest,
  linkLetGo,
  takeLinkDrop,
  takeLinkRequest,
  vouchLink,
} from './link.js'
import { LINK_STATUS } from './link-services.js'
import {
  BANK_SIZE,
  BANK_WINDOW,
  DEFAULT_HZ,
  DEFAULT_MODEL,
  MAX_HZ,
  MIN_HZ,
  MODELS,
  type Model,
  type ModelId,
  RAM_SIZE,
  RESET_VECTOR,
  ROM_MAX,
  VRAM,
} from './map.js'
import { PAD_ALL, setPad } from './pad.js'
import { decodeSnapshot, encodeSnapshot } from './snapshot.js'
import {
  CAUSE,
  CSR_NAMES,
  createState,
  type Elec16State,
  type Halt,
  INTERRUPT,
  IRQ,
  MIE,
  MIE_LINES,
  MIE_LINES_VIDEO,
  MISA,
  MPIE,
} from './state.js'
import {
  advanceVideo,
  cyclesToLine,
  DMA_CHUNK,
  DMA_CYCLES,
  FRAME_HZ,
  FRAME_LINES,
  lineStep,
  msToFrame,
  resetVideo,
} from './video.js'

/** What woke a sleeping machine may be waiting for: a key, the pad, or the timer in so many ms. */
export interface Wake {
  key: boolean
  /** PLAY-320's buttons wake it (PAD enabled). */
  pad: boolean
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
  /**
   * CORE's breakpoints: a run stops before the instruction at one of them, and goes on from
   * it only by `goOn` or a step. The page's, not the machine's: no snapshot keeps them.
   */
  readonly breakpoints = new Set<number>()
  /** Where a run stopped at a breakpoint; null while it may run. */
  breakAt: number | null = null
  /** Cycles a frame (60 a second) runs at this clock. */
  #hz = DEFAULT_HZ
  /** The breakpoint `goOn` passes, once. */
  #passing = -1
  /** Host time given past a VBLANK or LINE that woke the machine, still to pass (`advance`). */
  #owedMs = 0
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

  /**
   * A machine switched on with `rom` in it, the CPU at the reset vector: RAM clear, or the
   * RAM given (another LCD fitted to the same unit keeps what it held; its VRAM starts empty),
   * and `xram` bytes of extended RAM, clear, on a model that can have them.
   */
  static boot(rom: Uint8Array, model: ModelId = DEFAULT_MODEL, ram?: Uint8Array, xram = 0): Elec16 {
    const s = createState(model, xram)
    if (ram !== undefined) s.ram.set(ram.subarray(0, s.ram.length))
    return new Elec16(rom, s)
  }

  /** A machine from its snapshot (snapshot.ts), as it was; null when the bytes are not one. */
  static restore(rom: Uint8Array, bytes: Uint8Array): Elec16 | null {
    const s = decodeSnapshot(bytes)
    return s === null ? null : new Elec16(rom, s)
  }

  /** The machine as bytes: a unit's battery backup. */
  snapshot(): Uint8Array {
    return encodeSnapshot(this.s)
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
    // A line of PLAY-320's screen is a 312th of a sixtieth of a second at this clock.
    const v = this.s.video
    if (v !== null) v.tiles.cyclesPerLine = this.#hz / FRAME_HZ / FRAME_LINES
  }

  /** Runs up to `cycles` cycles; stops early when the machine sleeps, halts or goes off. */
  run(cycles: number): RunResult {
    let used = 0
    if (this.breakAt !== null) return this.#result(0)
    const stops = this.breakpoints
    while (used < cycles) {
      if (stops.size !== 0 && this.#stopsHere()) break
      const spent = this.#step()
      if (spent === 0) {
        if (this.#catchUp()) continue
        break
      }
      used += spent
    }
    return this.#result(used)
  }

  /** One instruction (CORE's STEP), or the interrupt taken before it; past a breakpoint. */
  step(): RunResult {
    this.breakAt = null
    this.#passing = -1
    return this.#result(this.#step())
  }

  /**
   * Machine code put into RAM (CODE's RUN and LOAD), through the bus so any code decoded
   * there goes stale. False, writing nothing, when any of it would leave RAM.
   */
  loadCode(at: number, bytes: Uint8Array): boolean {
    if (at < 0 || at + bytes.length > RAM_SIZE) return false
    bytes.forEach((b, k) => {
      this.bus.write8(at + k, b)
    })
    return true
  }

  /**
   * A call to `pc` that comes back to `ra`, from where the machine is: woken, out of any trap,
   * past any breakpoint stop (CODE's measuring runs a program this way).
   */
  callAt(pc: number, ra: number): void {
    const s = this.s
    s.regs[1] = ra & 0xffff
    s.pc = pc & 0xffff
    s.sleeping = false
    s.inTrap = false
    this.breakAt = null
    this.#passing = -1
  }

  /** Stopped at a breakpoint: runs on from it, the instruction there first. */
  goOn(): void {
    if (this.breakAt === null) return
    this.#passing = this.breakAt
    this.breakAt = null
  }

  /**
   * Whether the run stops before the instruction at the PC. Asleep it does not: the machine
   * is not about to run anything (an instruction just after a WFI runs on waking, unstopped).
   */
  #stopsHere(): boolean {
    // DMA has the bus: the instruction at the PC is not about to run, so it neither stops
    // there nor uses up the GO that passes it - one GO goes through the whole copy.
    if (this.s.video?.tiles.dma.active === true && !this.s.inTrap) return false
    const pc = this.s.pc
    if (pc === this.#passing) {
      this.#passing = -1
      return false
    }
    this.#passing = -1
    if (this.s.sleeping || !this.breakpoints.has(pc)) return false
    this.breakAt = pc
    return true
  }

  /**
   * Host time passes: the timer counts, and may raise its interrupt; so does VBLANK. A sleeper
   * that VBLANK or LINE wakes within the step has the time up to it now and the rest once it
   * has answered and sleeps again (in `run`): the beam is where it was when the interrupt came,
   * and the next one does not overtake it, however coarse the steps the page gives.
   */
  advance(ms: number): void {
    if (!(ms > 0)) return
    // Time still held back goes first: it came before this.
    const given = ms + this.#owedMs
    this.#owedMs = 0
    const wake = this.#msToVideoWake()
    if (wake !== null && wake < given) {
      this.#pass(wake)
      this.#owedMs = given - wake
      return
    }
    this.#pass(given)
  }

  /** Milliseconds until VBLANK or LINE wakes a sleeper waiting for it; null for neither. */
  #msToVideoWake(): number | null {
    const s = this.s
    const v = s.video
    if (v === null || !s.sleeping) return null
    const mie = s.csr.mie
    const frame = msToFrame(v)
    let ms: number | null = null
    // Just past the frame's end, so the step surely brings it.
    if ((mie & (1 << IRQ.vblank)) !== 0 && !v.pending) ms = frame + 1e-6
    if ((mie & (1 << IRQ.line)) !== 0 && !v.tiles.linePending) {
      const cycles = cyclesToLine(v.tiles, s.cycles)
      // One cycle into the line, as the beam is credited.
      const line = cycles === null ? null : ((cycles + 1) * 1000) / this.#hz
      if (line !== null && line < frame) ms = ms === null ? line : Math.min(ms, line)
    }
    return ms
  }

  /** Time held back for a sleeper that was woken, passed once it sleeps again: true if any. */
  #catchUp(): boolean {
    const s = this.s
    if (this.#owedMs <= 0 || !s.sleeping || s.halt !== null || s.off) return false
    const owed = this.#owedMs
    this.#owedMs = 0
    this.advance(owed)
    return true
  }

  #pass(ms: number): void {
    const s = this.s
    const t = s.timer
    s.time += ms
    const v = s.video
    if (v !== null) {
      // Asleep, the beam goes on: the time given is cycles for the line it is on - up to
      // LINECMP at most when LINE is enabled, where LINE wakes the machine on its line, not
      // some lines after. A sleeper LINE does not wake has the time whole.
      if (s.sleeping) {
        const wakes = (s.csr.mie & (1 << IRQ.line)) !== 0
        const toLine = wakes ? cyclesToLine(v.tiles, s.cycles) : null
        const given = (ms * this.#hz) / 1000
        // One cycle into the line: stopping exactly at its start can fall a hair short of it.
        v.tiles.slept += toLine === null ? given : Math.min(given, toLine + 1)
      }
      // LINE before VBLANK: a step of time that crosses both does not lose this frame's LINE.
      lineStep(v.tiles, s.cycles)
      advanceVideo(v, ms, s.cycles)
    }
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

  /**
   * A key goes down (its code is row * 8 + column of the key matrix). `byPerson` is false for
   * a key PASTE types: only a person's key lets LINK send again.
   */
  press(code: number, byPerson = true): void {
    pressKey(this.s, code)
    if (byPerson) vouchLink(this.s)
  }

  /** A person did something to the machine (RUN or LOAD in the pane): LINK may send again. */
  vouch(): void {
    vouchLink(this.s)
  }

  release(code: number): void {
    releaseKey(this.s, code)
  }

  /** The pane lost the keyboard: every key goes up. */
  releaseAll(): void {
    this.s.keys.held.fill(0)
    if (this.s.pad !== null) setPad(this.s.pad, 0)
  }

  /**
   * A cartridge put in PLAY-320's slot (cartridge.ts): its image checked, its ROM shown from
   * bank 0x100 and its save RAM - as main kept it - from 0x80. False, and nothing changed, for
   * an image that is not one or a model without a slot. What ran in the window is stale.
   */
  insertCart(image: Uint8Array, digest: Uint8Array, save?: Uint8Array): boolean {
    const slot = this.model.cart ? slotOf(image, digest, save) : null
    if (slot === null) return false
    // The same game again (START once more, or another build of it): its save RAM here is
    // newer than what main kept, which is written only when the machine is put away.
    const was = this.s.cart
    if (was !== null && was.id === slot.id && was.save.length === slot.save.length) {
      slot.save = was.save
    }
    this.s.cart = slot
    this.#bankGone()
    this.#windowStale()
    return true
  }

  /**
   * After a restore, the slot's ROM put back - only an image of the same hash and id as the
   * slot says it held. False when it is not that cartridge, or the slot needs none.
   */
  attachCartRom(image: Uint8Array, digest: Uint8Array): boolean {
    const slot = this.s.cart
    if (slot === null || slot.rom !== null || !sameDigest(slot.digest, digest)) return false
    const fresh = slotOf(image, digest)
    if (fresh === null || fresh.id !== slot.id || fresh.banks !== slot.banks) return false
    slot.rom = fresh.rom
    this.#windowStale()
    return true
  }

  /** The cartridge taken out of the slot; its save RAM goes with it. */
  ejectCart(): void {
    if (this.s.cart === null) return
    this.s.cart = null
    this.#bankGone()
    this.#windowStale()
  }

  /**
   * The window back to bank 0 when the bank it showed is no longer the machine's (a cartridge
   * taken out, or a smaller one put in): BANK never names a bank it has not, and a snapshot
   * that did would not read back.
   */
  #bankGone(): void {
    const s = this.s
    if (s.bank >= SAVE_BANK && !cartBankTaken(s.cart, s.bank)) s.bank = 0
  }

  /** What was decoded in the bank window (and the two bytes before it) is stale. */
  #windowStale(): void {
    this.#code.fill(undefined, BANK_WINDOW - 2, BANK_WINDOW + BANK_SIZE)
  }

  /**
   * PLAY-320's buttons held now (pad.ts bits): each that went down or up is marked for the
   * program. A button pressed is a person's action, which lets LINK send again. Nothing on a
   * model without a pad.
   */
  pad(held: number): void {
    const p = this.s.pad
    if (p === null) return
    if ((held & ~p.held & PAD_ALL) !== 0) vouchLink(this.s)
    setPad(p, held)
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
    s.brk = false
    s.bank = 0
    s.keys.fifo.length = 0
    s.timer.pending = false
    s.timer.enabled = false
    s.math.pending = false
    if (s.video !== null) resetVideo(s.video)
    if (s.pad !== null) s.pad.hit = 0
    if (s.apu !== null) resetApu(s.apu)
    s.stall = 0
    // A command out belonged to the program that is gone: its answer is not waited for.
    Object.assign(s.card, createCardState())
    linkLetGo(s)
    // RESET is a person's press (or BRK/ON's): the program it starts may use LINK once.
    vouchLink(s)
    this.#code.fill(undefined)
    this.breakAt = null
    this.#passing = -1
    this.#owedMs = 0
  }

  /**
   * BRK/ON. A machine off, or stopped by a fault, starts again (reset, its RAM kept); one
   * running or asleep has its BRK line raised, which the ROM takes even with interrupts off.
   */
  brk(): void {
    this.breakAt = null
    vouchLink(this.s)
    if (this.s.off || this.s.halt !== null) this.reset()
    else this.s.brk = true
  }

  /** The card command out for the page to take (card.ts), once; null when there is none. */
  takeCardRequest(): CardRequest | null {
    return takeCardRequest(this.s)
  }

  /**
   * main's answer to a card command: what was read goes to RAM and the CARD line goes up,
   * waking a machine asleep for it.
   */
  answerCard(request: CardRequest, answer: CardAnswer): void {
    const busy = this.s.card.busy
    answerCard(this.s, request, answer)
    // What a READ or DIR wrote went straight into RAM: code decoded there is stale.
    if (busy) this.#ramWritten(request.address, request.length)
  }

  /** RAM a device wrote without the bus: what was decoded there is stale. */
  #ramWritten(at: number, length: number): void {
    this.bus.ramWritten(at, length)
  }

  /** LINK's request out for the page to take (link.ts), once; null when there is none. */
  takeLinkRequest(): LinkRequest | null {
    return takeLinkRequest(this.s)
  }

  /** A LINK request main should drop (cancelled, or the machine reset), once. */
  takeLinkDrop(): number | null {
    return takeLinkDrop(this.s)
  }

  /** main's answer to a LINK request: written at REPLY, the LINK line up, a sleeper woken. */
  answerLink(serial: number, answer: LinkAnswer): void {
    // CART's LOAD brings the cartridge itself: in the slot before the program hears the answer.
    // One the slot refuses is no LOAD: the program hears FAILED, never READY with no game.
    const request = this.s.link
    let heard = answer
    if (
      answer.cart !== undefined &&
      answer.status === LINK_STATUS.ready &&
      request.busy &&
      request.serial === serial &&
      !this.insertCart(answer.cart.image, answer.cart.digest, answer.cart.save)
    ) {
      heard = { status: LINK_STATUS.failed }
    }
    answerLink(this.s, serial, heard)
    if (heard.status === LINK_STATUS.ready) this.#ramWritten(request.outReply, request.length + 1)
  }

  /** The power switch: off as a program's POWER write leaves it, RAM kept; BRK/ON is on. */
  powerOff(): void {
    this.s.off = true
    this.s.sleeping = false
    linkLetGo(this.s)
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
    else if (csr === CSR_NAMES.mie) c.mie = v & (this.model.video ? MIE_LINES_VIDEO : MIE_LINES)
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
    return (
      (s.timer.pending ? 1 << IRQ.timer : 0) |
      (s.keys.fifo.length > 0 ? 1 << IRQ.key : 0) |
      (s.math.pending ? 1 << IRQ.math : 0) |
      (s.card.pending ? 1 << IRQ.card : 0) |
      (s.link.pending ? 1 << IRQ.link : 0) |
      (s.video?.pending === true ? 1 << IRQ.vblank : 0) |
      (s.video?.tiles.linePending === true ? 1 << IRQ.line : 0) |
      ((s.pad?.hit ?? 0) !== 0 ? 1 << IRQ.pad : 0)
    )
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
    // Awake, with no BRK, a line can only be taken with interrupts on and one enabled; the
    // ROM leaves KEY enabled with interrupts off (it wakes WFI), so that is the common case.
    const c = s.csr
    if (s.sleeping || s.brk || ((c.mstatus & MIE) !== 0 && c.mie !== 0 && !s.inTrap)) {
      const taken = this.#interrupt()
      if (taken >= 0) return taken
    }
    // DMA has the bus: it moves a chunk in place of an instruction, interrupts taken between -
    // and while their handler runs it waits, going on after MRET.
    const dma = s.video?.tiles.dma
    if (dma?.active === true && !s.inTrap) return this.#dmaStep(dma)
    const pc = s.pc
    const inst = (pc < VRAM ? this.#code[pc] : undefined) ?? this.#fetch(pc)
    this.next = (pc + inst.size) & 0xffff
    this.taken = false
    ;(EXEC[inst.op] as Handler)(this, inst, pc)
    if (s.halt !== null) return 0
    s.pc = this.next
    let cycles = (this.taken ? TAKEN_CYCLES[inst.op] : CYCLES[inst.op]) as number
    // A device's work (the maths unit) is the instruction's that started it.
    if (s.stall !== 0) {
      cycles += s.stall
      s.stall = 0
    }
    s.cycles += cycles
    s.instret++
    if (s.video !== null) lineStep(s.video.tiles, s.cycles)
    return cycles
  }

  /**
   * One step of DMA: up to DMA_CHUNK bytes from the CPU's address space (read as it reads,
   * without side effects) into video memory, the registers moved on, DMA_CYCLES spent.
   */
  #dmaStep(dma: { src: number; dst: number; len: number; active: boolean }): number {
    const s = this.s
    const mem = (s.video as NonNullable<Elec16State['video']>).mem
    const n = Math.min(DMA_CHUNK, dma.len)
    for (let k = 0; k < n; k++) {
      mem[(dma.dst + k) & 0xffff] = this.bus.peek((dma.src + k) & 0xffff)
    }
    if (s.apu !== null && wavesAt(dma.dst, n)) s.apu.revision++
    dma.src = (dma.src + n) & 0xffff
    dma.dst = (dma.dst + n) & 0xffff
    dma.len -= n
    if (dma.len === 0) dma.active = false
    s.screenRevision++
    s.cycles += DMA_CYCLES
    lineStep((s.video as NonNullable<Elec16State['video']>).tiles, s.cycles)
    return DMA_CYCLES
  }

  /**
   * Before an instruction: wakes a sleeping machine when an enabled line is up, and takes the
   * lowest such line when interrupts are on. The cycles the interrupt took, 0 when the
   * machine sleeps on, or -1 to run the instruction.
   */
  #interrupt(): number {
    const s = this.s
    if (s.brk && !s.inTrap) return this.#takeBrk()
    const ready = this.#pending() & s.csr.mie
    if (s.sleeping) {
      if (ready === 0) return 0
      s.sleeping = false
    }
    if (ready === 0 || (s.csr.mstatus & MIE) === 0 || s.inTrap) return -1
    if (s.csr.mtvec === 0) {
      // Interrupts let in with nowhere to go: stopped, as an exception would be.
      s.halt = { cause: 'interrupt with no handler', pc: s.pc }
      return 0
    }
    const line = 31 - Math.clz32(ready & -ready)
    this.#enterTrap(INTERRUPT | line, 0, s.pc)
    s.pc = this.next
    s.cycles += TRAP_CYCLES
    return TRAP_CYCLES
  }

  /** The BRK line, taken whatever mstatus and mie say; with no handler it stops the machine. */
  #takeBrk(): number {
    const s = this.s
    s.brk = false
    s.sleeping = false
    if (s.csr.mtvec === 0) {
      s.halt = { cause: 'break', pc: s.pc }
      return 0
    }
    this.#enterTrap(INTERRUPT | IRQ.brk, 0, s.pc)
    s.pc = this.next
    s.cycles += TRAP_CYCLES
    return TRAP_CYCLES
  }

  /** How long until VBLANK or LINE wakes a sleeping machine, of the ones it enabled; or null. */
  #videoWakeMs(v: NonNullable<Elec16State['video']>): number | null {
    const mie = this.s.csr.mie
    const times: number[] = []
    if ((mie & (1 << IRQ.vblank)) !== 0 && !v.pending) times.push(msToFrame(v))
    if ((mie & (1 << IRQ.line)) !== 0 && !v.tiles.linePending) {
      // This frame's LINE still to come, or - come and gone - the next frame's, after VBLANK:
      // never nothing, or a program waiting for it would be taken for idle and left asleep.
      const toLine = cyclesToLine(v.tiles, this.s.cycles)
      times.push(toLine === null ? msToFrame(v) : (toLine * 1000) / this.#hz)
    }
    return times.length === 0 ? null : Math.min(...times)
  }

  /** Decodes the instruction at `pc` and keeps it, where code is kept. */
  #fetch(pc: number): Inst {
    const lo = this.bus.peek(pc) | (this.bus.peek(pc + 1) << 8)
    const hi = (lo & 3) === 3 ? this.bus.peek(pc + 2) | (this.bus.peek(pc + 3) << 8) : 0
    const inst = decode(lo, hi)
    // Kept only when every byte of it is below video memory, whose writes do not unkeep it.
    if (pc + inst.size <= VRAM) this.#code[pc] = inst
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
    // Off, only BRK/ON wakes it, and that is the page's call (brk), not a key in the FIFO.
    if (s.off) return { key: false, pad: false, timerMs: null }
    const t = s.timer
    const timerOn = (s.csr.mie & (1 << IRQ.timer)) !== 0 && t.enabled && !t.pending
    const ticks = ((t.compare - t.count) & 0xffff || 0x10000) - t.fraction
    const timerMs = timerOn ? (ticks * 1000) / TIMER_HZ : null
    // VBLANK and LINE wake it like the timer does: the page need only know how long it may sleep.
    const v = s.video
    const frameMs = v !== null ? this.#videoWakeMs(v) : null
    return {
      key: (s.csr.mie & (1 << IRQ.key)) !== 0,
      pad: s.pad !== null && (s.csr.mie & (1 << IRQ.pad)) !== 0,
      timerMs: timerMs === null ? frameMs : frameMs === null ? timerMs : Math.min(timerMs, frameMs),
    }
  }
}

/** An operation's number by name, for a test or a debugger. */
export { OP }
