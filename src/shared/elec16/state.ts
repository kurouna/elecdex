/**
 * Everything an ELEC-16 is, as plain data (docs/elec16.md): what a snapshot keeps and what a
 * debugger reads. The ROM is not here - it is the same for every unit, and given at boot.
 */

import { type ApuState, createApuState } from './apu.js'
import { type CardState, createCardState } from './card.js'
import type { CartSlot } from './cartridge.js'
import { createLinkState, type LinkState } from './link.js'
import {
  BANK_SIZE,
  MODELS,
  type Model,
  type ModelId,
  RAM_SIZE,
  RESET_VECTOR,
  VRAM_WINDOW,
} from './map.js'
import { createMathState, type MathState } from './math-unit.js'
import { createPadState, type PadState } from './pad.js'
import { createVideoState, type VideoState } from './video.js'

/** The CSRs a program can read and write (section 4). */
export interface Csrs {
  mstatus: number
  mie: number
  mtvec: number
  mscratch: number
  mepc: number
  mcause: number
  mtval: number
}

/** Why the machine stopped by itself; it goes on only after a reset. */
export interface Halt {
  cause: string
  pc: number
}

export const KEY_FIFO_SIZE = 16
/** The key matrix: 10 rows of 8, a key's code being row * 8 + column. */
export const KEY_ROWS = 10

export interface Elec16State {
  model: ModelId
  regs: Uint16Array
  pc: number
  csr: Csrs
  /** Inside a trap handler: an exception here is a double fault and halts the machine. */
  inTrap: boolean
  /** Asleep in WFI until an enabled interrupt is pending. */
  sleeping: boolean
  halt: Halt | null
  /** Switched off by a program (POWER): it sleeps until BRK/ON, with its RAM kept. */
  off: boolean
  /** BRK was pressed and its line not yet taken (it waits only while a handler runs). */
  brk: boolean
  /** Cycles and instructions since the machine started; doubles, so they never wrap. */
  cycles: number
  instret: number
  ram: Uint8Array
  vram: Uint8Array
  /** Extended RAM (PLAY-320 only), whole 8 KB banks: empty on every other model. */
  xram: Uint8Array
  bank: number
  keys: { fifo: number[]; held: Uint8Array }
  lcd: { on: boolean; contrast: number; cursor: number; cursorMode: number; annunciators: number }
  /** The 1,024 Hz timer: its count, the compare value, whether it interrupts, and what is owed. */
  timer: { count: number; compare: number; enabled: boolean; pending: boolean; fraction: number }
  /** The clock the page gives: second, minute, hour, day, month, year since 2000, weekday. */
  clock: Uint8Array
  buzzer: { freq: number; duration: number; gate: boolean; started: number }
  /** Milliseconds of host time the machine has been given (advance), for the buzzer's length. */
  time: number
  /** Counts every change to what the screen shows, so a page draws only when it moved. */
  screenRevision: number
  /** The maths unit's registers and generator (math-unit.ts). */
  math: MathState
  /** Cycles a device took on top of the instruction that started it (the maths unit). */
  stall: number
  /** The memory card's registers and the command out (card.ts). */
  card: CardState
  /** LINK's registers and the request out (link.ts). */
  link: LinkState
  /** PLAY-320's video (video.ts); null on a model without it. */
  video: VideoState | null
  /** PLAY-320's pad (pad.ts); null on a model without it. Never in a snapshot. */
  pad: PadState | null
  /** The cartridge in PLAY-320's slot (cartridge.ts); null when none, and on other models. */
  cart: CartSlot | null
  /** PLAY-320's sixteen-channel sound (apu.ts); null on a model without it. */
  apu: ApuState | null
}

export const CSR_NAMES = {
  mstatus: 0x300,
  misa: 0x301,
  mie: 0x304,
  mtvec: 0x305,
  mscratch: 0x340,
  mepc: 0x341,
  mcause: 0x342,
  mtval: 0x343,
  mip: 0x344,
  cycle: 0xc00,
  instret: 0xc02,
  cycleh: 0xc80,
  instreth: 0xc82,
} as const

/** mstatus: interrupts on, and what they were before a trap. */
export const MIE = 1 << 3
export const MPIE = 1 << 7

/**
 * Interrupt lines, as bits of mie and mip. BRK is wired apart: it is taken even with
 * interrupts off or not enabled in mie (only a handler already running holds it back), so
 * the key always gets the machine back, as on the pocket computers it follows.
 */
export const IRQ = {
  timer: 0,
  key: 1,
  card: 2,
  math: 3,
  link: 4,
  vblank: 5,
  pad: 6,
  line: 7,
  brk: 15,
} as const

/** The lines mie takes on every model: TIMER, KEY, CARD, MATH and LINK (BRK is never masked). */
export const MIE_LINES = 0x1f

/**
 * The lines mie takes on `model`: the five, and each line of a device it has - VBLANK and LINE
 * with video, PAD with the pad (PLAY-320's); no other model's mie changes.
 */
export const mieLines = (model: Model): number =>
  MIE_LINES |
  (model.video ? (1 << IRQ.vblank) | (1 << IRQ.line) : 0) |
  (model.pad ? 1 << IRQ.pad : 0)

/** The LCD's annunciators, as bits of ANNUN: the marks above the dots. */
export const ANNUNCIATORS = [
  'BUSY',
  'SHIFT',
  'CAPS',
  'KANA',
  'RUN',
  'PRO',
  'MON',
  'DEG',
  'RAD',
  'GRAD',
  'SOUND',
] as const

/** mcause for exceptions (interrupts set the top bit and give their line). */
export const CAUSE = {
  illegal: 2,
  breakpoint: 3,
  loadMisaligned: 4,
  storeMisaligned: 6,
  storeFault: 7,
  ecall: 11,
} as const
export const INTERRUPT = 0x8000

/** misa: the extensions this machine has - M (bit 12), B (bit 1) and C (bit 2). */
export const MISA = (1 << 12) | (1 << 1) | (1 << 2)

/** A new machine of `model`, with `xram` bytes of extended RAM (whole banks, as it can have). */
export function createState(model: ModelId, xram = 0): Elec16State {
  if (!(model in MODELS)) throw new RangeError(`no model ${model}`)
  if (!Number.isInteger(xram / BANK_SIZE) || xram < 0 || xram > MODELS[model].xramMax) {
    throw new RangeError(`${model} cannot have ${xram} bytes of extended RAM`)
  }
  return {
    model,
    regs: new Uint16Array(16),
    pc: RESET_VECTOR,
    csr: { mstatus: 0, mie: 0, mtvec: 0, mscratch: 0, mepc: 0, mcause: 0, mtval: 0 },
    inTrap: false,
    sleeping: false,
    halt: null,
    off: false,
    brk: false,
    cycles: 0,
    instret: 0,
    ram: new Uint8Array(RAM_SIZE),
    vram: new Uint8Array(VRAM_WINDOW),
    xram: new Uint8Array(xram),
    bank: 0,
    keys: { fifo: [], held: new Uint8Array(KEY_ROWS) },
    lcd: { on: true, contrast: 8, cursor: 0, cursorMode: 0, annunciators: 0 },
    timer: { count: 0, compare: 0, enabled: false, pending: false, fraction: 0 },
    clock: new Uint8Array(7),
    buzzer: { freq: 0, duration: 0, gate: false, started: 0 },
    time: 0,
    screenRevision: 0,
    math: createMathState(),
    stall: 0,
    card: createCardState(),
    link: createLinkState(),
    video: MODELS[model].video ? createVideoState() : null,
    pad: MODELS[model].pad ? createPadState() : null,
    cart: null,
    apu: MODELS[model].apu ? createApuState() : null,
  }
}
