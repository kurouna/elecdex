/**
 * The ELEC-16's address space (docs/elec16.md sections 3 and 5): RAM, the fixed ROM and its
 * bank window, the LCD's memory, and the I/O registers. Every read and write of the CPU goes
 * through here; `peek` reads without side effects, for a debugger and for fetching code (a
 * view of the key FIFO must not take a key out of it).
 *
 * I/O registers are 16 bits at even addresses. A byte read gives the half it addresses; a
 * byte write to an even address writes the register with the high byte zero, and one to an
 * odd address is ignored. The key matrix is the exception: it is ten bytes, read as bytes.
 *
 * RAM is what programs touch most, so every access tries it first, directly, before the
 * other regions; a write to it drops the decoded instructions it may have changed from the
 * machine's code cache, which the bus is given (measured: about twice the speed of going
 * through the general path for loads, stores and calls).
 */

import type { Inst } from './isa.js'
import {
  BANK_COUNT,
  BANK_SIZE,
  BANK_WINDOW,
  IO,
  MACHINE_ID,
  MODEL_IDS,
  type Model,
  RAM_SIZE,
  ROM_FIXED,
  ROM_FIXED_SIZE,
  VRAM,
  VRAM_WINDOW,
  vramSize,
} from './map.js'
import { MATH_REG, mathRead, mathWrite } from './math-unit.js'
import { type Elec16State, KEY_FIFO_SIZE, KEY_ROWS } from './state.js'

/** The I/O registers, by address. */
export const REG = {
  id: 0xff00,
  model: 0xff02,
  bank: 0xff04,
  power: 0xff06,
  keyData: 0xff10,
  keyCount: 0xff12,
  keyMatrix: 0xff14,
  width: 0xff20,
  height: 0xff22,
  depth: 0xff24,
  lcdCtrl: 0xff26,
  contrast: 0xff28,
  cursor: 0xff2a,
  cursorMode: 0xff2c,
  annunciators: 0xff2e,
  timerCount: 0xff30,
  timerCompare: 0xff32,
  timerCtrl: 0xff34,
  clock: 0xff38,
  buzzerFreq: 0xff40,
  buzzerDuration: 0xff42,
  buzzerGate: 0xff44,
} as const

/** The machine's decoded instructions by address: what a write to RAM must make stale. */
export type CodeCache = (Inst | undefined)[]

export class Bus {
  readonly #s: Elec16State
  readonly #ram: Uint8Array
  readonly #rom: Uint8Array
  readonly #model: Model
  readonly #code: CodeCache
  readonly #vramUsed: number

  constructor(s: Elec16State, rom: Uint8Array, model: Model, code: CodeCache) {
    this.#s = s
    this.#ram = s.ram
    this.#rom = rom
    this.#model = model
    this.#code = code
    this.#vramUsed = vramSize(model)
  }

  /** A byte, as the CPU reads it: an I/O read may have an effect (the key FIFO). */
  read8(address: number): number {
    const a = address & 0xffff
    if (a < RAM_SIZE) return this.#ram[a] as number
    if (a >= IO) return this.#ioByte(a, false)
    return this.peek(a)
  }

  /** A 16-bit word at an even address, little-endian. */
  read16(address: number): number {
    const a = address & 0xfffe
    if (a < RAM_SIZE) return (this.#ram[a] as number) | ((this.#ram[a + 1] as number) << 8)
    if (a >= IO) return this.#io(a, false)
    return this.peek(a) | (this.peek(a + 1) << 8)
  }

  /** A byte without side effects: memory as it is, and I/O registers as they read. */
  peek(address: number): number {
    const a = address & 0xffff
    if (a < RAM_SIZE) return this.#s.ram[a] ?? 0
    if (a < BANK_WINDOW) return this.#rom[a - ROM_FIXED] ?? 0xff
    if (a < VRAM) {
      return this.#rom[ROM_FIXED_SIZE + this.#s.bank * BANK_SIZE + (a - BANK_WINDOW)] ?? 0xff
    }
    if (a < VRAM + VRAM_WINDOW) return a - VRAM < this.#vramUsed ? (this.#s.vram[a - VRAM] ?? 0) : 0
    if (a < IO) return 0
    return this.#ioByte(a, true)
  }

  /** Writes a byte; false where nothing can be written (the ROM). */
  write8(address: number, value: number): boolean {
    const a = address & 0xffff
    if (a < RAM_SIZE) {
      this.#ram[a] = value
      this.#stale(a & 0xfffe)
      return true
    }
    if (a >= IO) {
      if ((a & 1) === 0) this.#ioWrite(a, value & 0xff)
      return true
    }
    return this.#memWrite(a, value & 0xff)
  }

  /** Writes a 16-bit word at an even address; false for the ROM. */
  write16(address: number, value: number): boolean {
    const a = address & 0xfffe
    if (a < RAM_SIZE) {
      this.#ram[a] = value
      this.#ram[a + 1] = value >>> 8
      this.#stale(a)
      return true
    }
    if (a >= IO) {
      this.#ioWrite(a, value & 0xffff)
      return true
    }
    return this.#memWrite(a, value & 0xff) && this.#memWrite(a + 1, (value >>> 8) & 0xff)
  }

  /**
   * The half-word at `even` changed: an instruction decoded there, or a 32-bit one decoded
   * two bytes before it, is stale. Most writes are to data, where nothing was decoded.
   */
  #stale(even: number): void {
    const code = this.#code
    if (code[even] !== undefined) code[even] = undefined
    if (even >= 2 && code[even - 2] !== undefined) code[even - 2] = undefined
  }

  /** A write above RAM: the ROM refuses it, the LCD takes what its screen shows. */
  #memWrite(a: number, value: number): boolean {
    const s = this.#s
    if (a < VRAM) return false
    if (a < VRAM + VRAM_WINDOW && a - VRAM < this.#vramUsed) {
      if (s.vram[a - VRAM] !== value) {
        s.vram[a - VRAM] = value
        s.screenRevision++
      }
    }
    // The rest of the window and the reserved block ignore what is written.
    return true
  }

  #ioByte(a: number, peek: boolean): number {
    if (a >= REG.keyMatrix && a < REG.keyMatrix + KEY_ROWS) {
      return this.#s.keys.held[a - REG.keyMatrix] ?? 0
    }
    // Only the low byte of a register is its read: the high one never takes a key.
    const word = this.#io(a & 0xfffe, peek || (a & 1) === 1)
    return (a & 1) === 0 ? word & 0xff : word >>> 8
  }

  /** A register's value; `peek` reads it without taking a key from the FIFO. */
  #io(a: number, peek: boolean): number {
    const s = this.#s
    if (a >= MATH_REG.op && a < MATH_REG.op + 16) return mathRead(s, a, peek)
    switch (a) {
      case REG.id:
        return MACHINE_ID
      case REG.model:
        return MODEL_IDS.indexOf(this.#model.id)
      case REG.bank:
        return s.bank
      case REG.keyData:
        return peek ? (s.keys.fifo[0] ?? 0xffff) : (s.keys.fifo.shift() ?? 0xffff)
      case REG.keyCount:
        return s.keys.fifo.length
      default:
        return this.#ioRest(a)
    }
  }

  #ioRest(a: number): number {
    const s = this.#s
    if (a >= REG.keyMatrix && a < REG.keyMatrix + KEY_ROWS) {
      return (
        (s.keys.held[a - REG.keyMatrix] ?? 0) | ((s.keys.held[a - REG.keyMatrix + 1] ?? 0) << 8)
      )
    }
    if (a >= REG.clock && a < REG.clock + 8) {
      return (s.clock[a - REG.clock] ?? 0) | ((s.clock[a - REG.clock + 1] ?? 0) << 8)
    }
    const values: Record<number, number> = {
      [REG.width]: this.#model.width,
      [REG.height]: this.#model.height,
      [REG.depth]: this.#model.depth,
      [REG.lcdCtrl]: s.lcd.on ? 1 : 0,
      [REG.contrast]: s.lcd.contrast,
      [REG.cursor]: s.lcd.cursor,
      [REG.cursorMode]: s.lcd.cursorMode,
      [REG.annunciators]: s.lcd.annunciators,
      [REG.timerCount]: s.timer.count,
      [REG.timerCompare]: s.timer.compare,
      [REG.timerCtrl]: (s.timer.enabled ? 1 : 0) | (s.timer.pending ? 2 : 0),
      [REG.buzzerFreq]: s.buzzer.freq,
      [REG.buzzerDuration]: s.buzzer.duration,
      [REG.buzzerGate]: s.buzzer.gate ? 1 : 0,
    }
    return values[a] ?? 0
  }

  #ioWrite(a: number, value: number): void {
    const s = this.#s
    if (a >= MATH_REG.op && a < MATH_REG.op + 16) {
      s.stall += mathWrite(s, a, value)
      return
    }
    switch (a) {
      case REG.bank:
        // A bank the ROM cannot have is not taken: the window stays as it was.
        if (s.bank !== value && value < BANK_COUNT) {
          s.bank = value
          // From two bytes before the window: a 32-bit instruction there reaches into it.
          this.#code.fill(undefined, BANK_WINDOW - 2, BANK_WINDOW + BANK_SIZE)
        }
        return
      case REG.power:
        if (value === 0) s.off = true
        return
      case REG.timerCompare:
        s.timer.compare = value
        s.timer.pending = false
        return
      case REG.timerCtrl:
        s.timer.enabled = (value & 1) !== 0
        s.timer.pending = false
        return
      case REG.buzzerDuration:
        s.buzzer.duration = value
        s.buzzer.started = s.time
        return
      default:
        this.#lcdWrite(a, value)
    }
  }

  /** The LCD's registers and the buzzer's others: anything shown changes the screen's count. */
  #lcdWrite(a: number, value: number): void {
    const s = this.#s
    const lcd = s.lcd
    const before = `${lcd.on}${lcd.contrast}${lcd.cursor}${lcd.cursorMode}${lcd.annunciators}`
    if (a === REG.lcdCtrl) lcd.on = (value & 1) !== 0
    else if (a === REG.contrast) lcd.contrast = value & 15
    else if (a === REG.cursor) lcd.cursor = value
    else if (a === REG.cursorMode) lcd.cursorMode = value & 7
    else if (a === REG.annunciators) lcd.annunciators = value
    else if (a === REG.buzzerFreq) s.buzzer.freq = value
    else if (a === REG.buzzerGate) s.buzzer.gate = (value & 1) !== 0
    const after = `${lcd.on}${lcd.contrast}${lcd.cursor}${lcd.cursorMode}${lcd.annunciators}`
    if (before !== after) s.screenRevision++
  }
}

/** Takes a key into the FIFO (dropped when it is full) and marks it held. */
export function pressKey(s: Elec16State, code: number): void {
  if (code < 0 || code >= KEY_ROWS * 8) return
  if (s.keys.fifo.length < KEY_FIFO_SIZE) s.keys.fifo.push(code)
  s.keys.held[code >> 3] = (s.keys.held[code >> 3] ?? 0) | (1 << (code & 7))
}

export function releaseKey(s: Elec16State, code: number): void {
  if (code < 0 || code >= KEY_ROWS * 8) return
  s.keys.held[code >> 3] = (s.keys.held[code >> 3] ?? 0) & ~(1 << (code & 7))
}
