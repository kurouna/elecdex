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

import { APU_IO, APU_IO_END, apuRead, apuWrite, wavesAt } from './apu.js'
import { CARD_REG, cardRead, cardWrite } from './card.js'
import { CART_BANK, cartBankTaken, SAVE_BANK } from './cartridge.js'
import type { Inst } from './isa.js'
import { linkLetGo, linkRead, linkWrite } from './link.js'
import { LINK_REG } from './link-services.js'
import {
  BANK_SIZE,
  BANK_WINDOW,
  bankTaken,
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
  XRAM_BANK,
} from './map.js'
import { MATH_OP, MATH_REG, mathRead, mathWrite } from './math-unit.js'
import { PAD_REG, padRead, padWrite } from './pad.js'
import { type Elec16State, KEY_FIFO_SIZE, KEY_ROWS } from './state.js'
import { VIDEO_IO, VIDEO_IO_END, VIDEO_PAGE_SIZE, videoRead, videoWrite } from './video.js'

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
type CodeCache = (Inst | undefined)[]

export class Bus {
  readonly #s: Elec16State
  readonly #ram: Uint8Array
  readonly #rom: Uint8Array
  readonly #model: Model
  readonly #code: CodeCache
  readonly #vramUsed: number
  /** The MODEL register's number. */
  readonly #modelNumber: number
  /**
   * Code in the bank window (or a 32-bit instruction reaching into it) was decoded since the
   * window was last made stale: the machine sets it as it decodes there. Without it, a bank
   * switch - which programs make all the time for data - has nothing to drop.
   */
  windowDecoded = false

  constructor(s: Elec16State, rom: Uint8Array, model: Model, code: CodeCache) {
    this.#s = s
    this.#ram = s.ram
    this.#rom = rom
    this.#model = model
    this.#code = code
    this.#vramUsed = vramSize(model)
    this.#modelNumber = MODEL_IDS.indexOf(model.id)
  }

  /** What was decoded in the bank window (and the two bytes before it) is stale. */
  windowStale(): void {
    if (!this.windowDecoded) return
    this.windowDecoded = false
    this.#code.fill(undefined, BANK_WINDOW - 2, BANK_WINDOW + BANK_SIZE)
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
    // PLAY-320's registers are read whole, once (LINE's division is not done twice).
    if (this.#s.video !== null && a >= VIDEO_IO && a < VIDEO_IO_END) return this.#gameIoRead(a)
    return this.peek(a) | (this.peek(a + 1) << 8)
  }

  /** A byte without side effects: memory as it is, and I/O registers as they read. */
  peek(address: number): number {
    const a = address & 0xffff
    if (a < RAM_SIZE) return this.#s.ram[a] ?? 0
    if (a < BANK_WINDOW) return this.#rom[a - ROM_FIXED] ?? 0xff
    if (a < VRAM) return this.#bankByte(a)
    if (this.#s.video !== null && a < IO) return this.#videoByte(a)
    if (a < VRAM + VRAM_WINDOW) return a - VRAM < this.#vramUsed ? (this.#s.vram[a - VRAM] ?? 0) : 0
    if (a < IO) return 0
    return this.#ioByte(a, true)
  }

  /**
   * The bank window: a bank of the ROM, of extended RAM, or of the cartridge's save RAM or
   * ROM (0xFF while no ROM is in the slot, as an empty one reads).
   */
  #bankByte(a: number): number {
    const s = this.#s
    const bank = s.bank
    const at = a - BANK_WINDOW
    if (bank >= CART_BANK) return s.cart?.rom?.[(bank - CART_BANK) * BANK_SIZE + at] ?? 0xff
    if (bank >= SAVE_BANK) return s.cart?.save[(bank - SAVE_BANK) * BANK_SIZE + at] ?? 0xff
    if (bank >= XRAM_BANK) return s.xram[(bank - XRAM_BANK) * BANK_SIZE + at] ?? 0
    return this.#rom[ROM_FIXED_SIZE + bank * BANK_SIZE + at] ?? 0xff
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
    // PLAY-320's registers take a word whole, as the I/O block's do (PADHIT has 12 bits).
    if (this.#s.video !== null && a >= VIDEO_IO && a < VIDEO_IO_END) {
      this.#gameIoWrite(a, value & 0xffff)
      return true
    }
    return this.#memWrite(a, value & 0xff) && this.#memWrite(a + 1, (value >>> 8) & 0xff)
  }

  /**
   * `length` bytes of RAM from `at` written by a device rather than the CPU (the card, LINK,
   * the maths unit): what was decoded there, from the 32-bit instruction that may reach in two
   * bytes before, is stale.
   */
  ramWritten(at: number, length: number): void {
    const from = Math.max(0, (at & 0xfffe) - 2)
    const to = Math.min(RAM_SIZE, at + length)
    if (to > from) this.#code.fill(undefined, from, to)
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

  /**
   * A write above RAM: the ROM refuses it, extended RAM in the window takes it (code may run
   * there, so what was decoded under it goes stale), the LCD takes what its screen shows.
   */
  #memWrite(a: number, value: number): boolean {
    const s = this.#s
    if (a < VRAM) return this.#windowWrite(a, value)
    if (s.video !== null) {
      this.#videoWrite(a, value)
      return true
    }
    if (a < VRAM + VRAM_WINDOW && a - VRAM < this.#vramUsed) {
      if (s.vram[a - VRAM] !== value) {
        s.vram[a - VRAM] = value
        s.screenRevision++
      }
    }
    // The rest of the window and the reserved block ignore what is written.
    return true
  }

  /**
   * PLAY-320's E000-FEFF: the page of video memory VPAGE shows, then nothing up to the video
   * registers at F800, then nothing up to the I/O block. A register byte is its half.
   */
  #videoByte(a: number): number {
    const v = this.#s.video as NonNullable<Elec16State['video']>
    if (a < VRAM + VIDEO_PAGE_SIZE) return v.mem[v.page * VIDEO_PAGE_SIZE + (a - VRAM)] ?? 0
    if (a < VIDEO_IO || a >= VIDEO_IO_END) return 0
    const word = this.#gameIoRead(a & 0xfffe)
    return (a & 1) === 0 ? word & 0xff : word >>> 8
  }

  /** PLAY-320's registers at F800: video's, then the pad's at F810; the rest read 0. */
  #gameIoRead(a: number): number {
    const apu = this.#s.apu
    if (a >= APU_IO && a < APU_IO_END) return apu === null ? 0 : apuRead(apu, a)
    const pad = this.#s.pad
    if (a >= PAD_REG.held && a < PAD_REG.held + 16) return pad === null ? 0 : padRead(pad, a)
    return videoRead(this.#s.video as NonNullable<Elec16State['video']>, a, this.#s.cycles)
  }

  /** A word (or a byte, its high half zero) to one of PLAY-320's registers. */
  #gameIoWrite(a: number, value: number): void {
    const s = this.#s
    if (a >= APU_IO && a < APU_IO_END) {
      if (s.apu !== null) apuWrite(s.apu, a, value)
      return
    }
    const pad = s.pad
    if (a >= PAD_REG.held && a < PAD_REG.held + 16) {
      if (pad !== null) padWrite(pad, a, value)
      return
    }
    if (videoWrite(s.video as NonNullable<Elec16State['video']>, a, value, s.cycles)) {
      s.screenRevision++
    }
  }

  /**
   * A write to PLAY-320's video: memory through the window, or a register - as for the other
   * registers, a byte at an even address with the high byte zero, at an odd one ignored (none
   * of them takes more than a byte). What is shown moved: the screen's count goes up.
   */
  #videoWrite(a: number, value: number): void {
    const s = this.#s
    const v = s.video as NonNullable<Elec16State['video']>
    if (a < VRAM + VIDEO_PAGE_SIZE) {
      const at = v.page * VIDEO_PAGE_SIZE + (a - VRAM)
      if (v.mem[at] !== value) {
        v.mem[at] = value
        s.screenRevision++
        // The wave tables are the sound's: the page sends them when the sound's count moves.
        if (s.apu !== null && wavesAt(at, 1)) s.apu.revision++
      }
    } else if (a >= VIDEO_IO && a < VIDEO_IO_END && (a & 1) === 0) {
      this.#gameIoWrite(a, value)
    }
  }

  /**
   * A write in the bank window: extended RAM and the cartridge's save RAM take it (code may
   * run there, so what was decoded under it goes stale); the ROMs refuse it.
   */
  #windowWrite(a: number, value: number): boolean {
    const s = this.#s
    const bank = s.bank
    if (a < BANK_WINDOW || bank < XRAM_BANK || bank >= CART_BANK) return false
    const at = a - BANK_WINDOW
    if (bank >= SAVE_BANK) {
      const save = s.cart?.save
      if (save === undefined) return false
      save[(bank - SAVE_BANK) * BANK_SIZE + at] = value
    } else {
      s.xram[(bank - XRAM_BANK) * BANK_SIZE + at] = value
    }
    this.#stale(a & 0xfffe)
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
    if (a >= CARD_REG.cmd && a < CARD_REG.cmd + 16) return cardRead(s, a, peek)
    if (a >= LINK_REG.cmd && a < LINK_REG.cmd + 16) return linkRead(s, a, peek)
    switch (a) {
      case REG.id:
        return MACHINE_ID
      case REG.model:
        return this.#modelNumber
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
    return this.#deviceRead(a)
  }

  /** The screen's, the timer's and the buzzer's registers: read in loops, so a switch. */
  #deviceRead(a: number): number {
    const s = this.#s
    switch (a) {
      case REG.width:
        return this.#model.width
      case REG.height:
        return this.#model.height
      case REG.depth:
        return this.#model.depth
      case REG.lcdCtrl:
        return s.lcd.on ? 1 : 0
      case REG.contrast:
        return s.lcd.contrast
      case REG.cursor:
        return s.lcd.cursor
      case REG.cursorMode:
        return s.lcd.cursorMode
      case REG.annunciators:
        return s.lcd.annunciators
      case REG.timerCount:
        return s.timer.count
      case REG.timerCompare:
        return s.timer.compare
      case REG.timerCtrl:
        return (s.timer.enabled ? 1 : 0) | (s.timer.pending ? 2 : 0)
      case REG.buzzerFreq:
        return s.buzzer.freq
      case REG.buzzerDuration:
        return s.buzzer.duration
      case REG.buzzerGate:
        return s.buzzer.gate ? 1 : 0
      default:
        return 0
    }
  }

  /** The maths unit's registers: an operation writes RAM itself, past the code cache. */
  #mathWrite(a: number, value: number): void {
    const s = this.#s
    s.stall += mathWrite(s, a, value)
    // An operation writes its number at A, and FORMAT its text at B (ARG long).
    if (a !== MATH_REG.op) return
    this.ramWritten(s.math.a, 8)
    if ((value & 0xff) === MATH_OP.format) this.ramWritten(s.math.b, s.math.arg)
  }

  #ioWrite(a: number, value: number): void {
    const s = this.#s
    if (a >= MATH_REG.op && a < MATH_REG.op + 16) {
      this.#mathWrite(a, value)
      return
    }
    if (a >= CARD_REG.cmd && a < CARD_REG.cmd + 16) {
      cardWrite(s, a, value)
      return
    }
    if (a >= LINK_REG.cmd && a < LINK_REG.cmd + 16) {
      linkWrite(s, a, value)
      return
    }
    switch (a) {
      case REG.bank:
        // A bank the machine does not have is not taken: the window stays as it was.
        if (s.bank !== value && (bankTaken(value, s.xram.length) || cartBankTaken(s.cart, value))) {
          s.bank = value
          this.windowStale()
        }
        return
      case REG.power:
        if (value === 0) {
          s.off = true
          linkLetGo(s)
        }
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

  /**
   * The LCD's registers and the buzzer's others: a change to what is shown moves the screen's
   * count. Each write changes one field, so that field alone is compared (putc writes the
   * cursor a character).
   */
  #lcdWrite(a: number, value: number): void {
    const s = this.#s
    const lcd = s.lcd
    let shown: boolean
    switch (a) {
      case REG.lcdCtrl: {
        const on = (value & 1) !== 0
        shown = lcd.on !== on
        lcd.on = on
        break
      }
      case REG.contrast:
        shown = lcd.contrast !== (value & 15)
        lcd.contrast = value & 15
        break
      case REG.cursor:
        shown = lcd.cursor !== value
        lcd.cursor = value
        break
      case REG.cursorMode:
        shown = lcd.cursorMode !== (value & 7)
        lcd.cursorMode = value & 7
        break
      case REG.annunciators:
        shown = lcd.annunciators !== value
        lcd.annunciators = value
        break
      case REG.buzzerFreq:
        s.buzzer.freq = value
        return
      case REG.buzzerGate:
        s.buzzer.gate = (value & 1) !== 0
        return
      default:
        return
    }
    if (shown) s.screenRevision++
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
