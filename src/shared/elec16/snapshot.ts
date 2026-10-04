/**
 * An ELEC-16 as bytes, and back: a unit's battery backup (docs/elec16.md section 8).
 *
 * The format opens with a magic word and a version; anything of another shape - an older
 * version, a cut file, somebody else's bytes - decodes to null, and the pane switches the
 * unit on afresh rather than run a machine that was never ours. Every field is checked on the
 * way in: main keeps these files and checks them with this decoder too.
 *
 * Not kept: keys held or waiting (a machine comes back with every key up), and the card
 * command or LINK request out - a machine put away while main was doing one comes back with
 * it ended, INTERRUPTED, so a program waiting for its answer is not left waiting.
 *
 * Version 2 added LINK; a version 1 snapshot is still read, its LINK as a new machine's.
 */

import { ByteReader, ByteWriter } from '../emu/bytes.js'
import { CARD_STATUS } from './card.js'
import type { Angle } from './decimal.js'
import { linkInterrupted } from './link.js'
import { LINK_STATUS } from './link-services.js'
import { BANK_COUNT, MODEL_IDS, RAM_SIZE, VRAM_WINDOW } from './map.js'
import { createState, type Elec16State } from './state.js'

const MAGIC = [0x45, 0x31, 0x36, 0x53] // "E16S"
export const SNAPSHOT_VERSION = 2

/** A halt's cause is kept as text, at most this long. */
const CAUSE_MAX = 64

/** LINK: service, type, query, reply, max, status, length, serial, flags. */
const LINK_SIZE = 1 + 1 + 2 + 2 + 2 + 1 + 2 + 2 + 1

const LINK_FLAG = { pending: 1, busy: 2, vouched: 4, fresh: 8 } as const

/** Everything but the halt's cause, RAM and VRAM. */
const HEAD =
  4 +
  1 +
  1 + // magic, version, model
  16 * 2 +
  2 +
  7 * 2 + // registers, pc, CSRs
  1 +
  2 +
  1 + // flags, the halt's pc, its cause's length
  8 +
  8 +
  1 + // cycles, instret, bank
  1 +
  1 +
  2 +
  1 +
  2 + // LCD
  2 +
  2 +
  1 +
  8 + // timer
  7 + // clock
  2 +
  2 +
  1 +
  8 +
  8 + // buzzer, time
  2 +
  2 +
  2 +
  1 +
  2 +
  1 +
  4 +
  1 + // maths unit
  2 +
  1 +
  4 +
  1 +
  1 + // card
  LINK_SIZE

/** The longest snapshot there is, for whoever stores them to check against. */
export const SNAPSHOT_MAX_SIZE = HEAD + CAUSE_MAX + RAM_SIZE + VRAM_WINDOW

const FLAG = { inTrap: 1, sleeping: 2, off: 4, brk: 8, halted: 16 } as const

export function encodeSnapshot(s: Elec16State): Uint8Array {
  const cause = (s.halt?.cause ?? '').slice(0, CAUSE_MAX)
  const w = new ByteWriter(HEAD + cause.length + RAM_SIZE + VRAM_WINDOW)
  w.raw(MAGIC)
  w.u8(SNAPSHOT_VERSION)
  w.u8(MODEL_IDS.indexOf(s.model))
  for (const r of s.regs) w.u16(r)
  w.u16(s.pc)
  const c = s.csr
  for (const v of [c.mstatus, c.mie, c.mtvec, c.mscratch, c.mepc, c.mcause, c.mtval]) w.u16(v)
  w.u8(
    (s.inTrap ? FLAG.inTrap : 0) |
      (s.sleeping ? FLAG.sleeping : 0) |
      (s.off ? FLAG.off : 0) |
      (s.brk ? FLAG.brk : 0) |
      (s.halt !== null ? FLAG.halted : 0),
  )
  w.u16(s.halt?.pc ?? 0)
  w.u8(cause.length)
  w.f64(s.cycles)
  w.f64(s.instret)
  w.u8(s.bank)
  writeDevices(w, s)
  w.raw(Array.from(cause, (ch) => ch.charCodeAt(0) & 0x7f))
  w.raw(s.ram)
  w.raw(s.vram)
  return w.bytes
}

function writeDevices(w: ByteWriter, s: Elec16State): void {
  const { lcd, timer, buzzer, math, card } = s
  w.u8(lcd.on ? 1 : 0)
  w.u8(lcd.contrast)
  w.u16(lcd.cursor)
  w.u8(lcd.cursorMode)
  w.u16(lcd.annunciators)
  w.u16(timer.count)
  w.u16(timer.compare)
  w.u8((timer.enabled ? 1 : 0) | (timer.pending ? 2 : 0))
  w.f64(timer.fraction)
  w.raw(s.clock)
  w.u16(buzzer.freq)
  w.u16(buzzer.duration)
  w.u8(buzzer.gate ? 1 : 0)
  w.f64(buzzer.started)
  w.f64(s.time)
  w.u16(math.a)
  w.u16(math.b)
  w.u16(math.arg)
  w.u8(math.status)
  w.u16(math.result & 0xffff)
  w.u8(math.angle)
  w.u32(math.seed)
  w.u8(math.pending ? 1 : 0)
  w.u16(card.block)
  w.u8(card.status)
  w.u32(card.result)
  w.u8(card.pending ? 1 : 0)
  w.u8(card.busy ? 1 : 0)
  const link = s.link
  w.u8(link.service)
  w.u8(link.type)
  w.u16(link.query)
  w.u16(link.reply)
  w.u16(link.max)
  w.u8(link.status)
  w.u16(link.length)
  w.u16(link.serial)
  w.u8(
    (link.pending ? LINK_FLAG.pending : 0) |
      (link.busy ? LINK_FLAG.busy : 0) |
      (link.vouched ? LINK_FLAG.vouched : 0) |
      (link.fresh ? LINK_FLAG.fresh : 0),
  )
}

const finite = (v: number): boolean => Number.isFinite(v) && v >= 0

/** LINK, checked; a request that was out comes back ended, INTERRUPTED. */
function readLink(r: ByteReader, s: Elec16State): boolean {
  const link = s.link
  link.service = r.u8()
  link.type = r.u8()
  link.query = r.u16()
  link.reply = r.u16()
  link.max = r.u16()
  link.status = r.u8()
  link.length = r.u16()
  link.serial = r.u16()
  const flags = r.u8()
  link.pending = (flags & LINK_FLAG.pending) !== 0
  link.vouched = (flags & LINK_FLAG.vouched) !== 0
  link.fresh = (flags & LINK_FLAG.fresh) !== 0
  if ((flags & LINK_FLAG.busy) !== 0) linkInterrupted(s)
  return link.status <= LINK_STATUS.noService && flags < 16
}

/** A snapshot read back into a state; null when it is not one of ours, whole and in range. */
export function decodeSnapshot(bytes: Uint8Array): Elec16State | null {
  const r = new ByteReader(bytes)
  const magic = r.raw(4)
  const version = r.u8()
  if (MAGIC.some((b, k) => magic[k] !== b) || version < 1 || version > SNAPSHOT_VERSION) {
    return null
  }
  const model = MODEL_IDS[r.u8()]
  if (model === undefined) return null
  const s = createState(model)
  for (let k = 0; k < 16; k++) s.regs[k] = r.u16()
  s.regs[0] = 0
  s.pc = r.u16() & 0xfffe
  const [mstatus = 0, mie = 0, mtvec = 0, mscratch = 0, mepc = 0, mcause = 0, mtval = 0] =
    Array.from({ length: 7 }, () => r.u16())
  s.csr = {
    mstatus,
    mie: mie & (version === 1 ? 15 : 31),
    mtvec: mtvec & 0xfffe,
    mscratch,
    mepc: mepc & 0xfffe,
    mcause,
    mtval,
  }
  const flags = r.u8()
  const haltPc = r.u16()
  const causeLength = r.u8()
  s.cycles = r.f64()
  s.instret = r.f64()
  s.bank = r.u8()
  if (!readDevices(r, s) || (version >= 2 && !readLink(r, s))) return null
  const cause = String.fromCharCode(...r.raw(causeLength))
  s.ram.set(r.raw(RAM_SIZE))
  s.vram.set(r.raw(VRAM_WINDOW))
  if (r.overrun || r.at !== bytes.length) return null
  if (causeLength > CAUSE_MAX || !/^[\x20-\x7e]*$/.test(cause)) return null
  if (!finite(s.cycles) || !finite(s.instret) || s.bank >= BANK_COUNT) return null
  s.inTrap = (flags & FLAG.inTrap) !== 0
  s.sleeping = (flags & FLAG.sleeping) !== 0
  s.off = (flags & FLAG.off) !== 0
  s.brk = (flags & FLAG.brk) !== 0
  s.halt = (flags & FLAG.halted) !== 0 ? { cause, pc: haltPc } : null
  // Whatever it showed is drawn afresh.
  s.screenRevision = 1
  return s
}

/** The devices, checked; false when any is out of its range. */
function readDevices(r: ByteReader, s: Elec16State): boolean {
  const { lcd, timer, buzzer, math, card } = s
  lcd.on = r.u8() === 1
  lcd.contrast = r.u8()
  lcd.cursor = r.u16()
  lcd.cursorMode = r.u8()
  lcd.annunciators = r.u16()
  timer.count = r.u16()
  timer.compare = r.u16()
  const timerFlags = r.u8()
  timer.enabled = (timerFlags & 1) !== 0
  timer.pending = (timerFlags & 2) !== 0
  timer.fraction = r.f64()
  s.clock.set(r.raw(7))
  buzzer.freq = r.u16()
  buzzer.duration = r.u16()
  buzzer.gate = r.u8() === 1
  buzzer.started = r.f64()
  s.time = r.f64()
  math.a = r.u16()
  math.b = r.u16()
  math.arg = r.u16()
  math.status = r.u8()
  math.result = (r.u16() << 16) >> 16
  const angle = r.u8()
  math.angle = angle as Angle
  math.seed = r.u32()
  math.pending = r.u8() === 1
  card.block = r.u16()
  card.status = r.u8()
  card.result = r.u32()
  card.pending = r.u8() === 1
  if (r.u8() === 1) {
    // Main was doing a command when this was taken: it is over, undone, and said so.
    card.status = CARD_STATUS.interrupted
    card.pending = true
  }
  return (
    lcd.contrast <= 15 &&
    lcd.cursorMode <= 7 &&
    angle <= 2 &&
    math.seed !== 0 &&
    finite(timer.fraction) &&
    timer.fraction < 1 &&
    finite(buzzer.started) &&
    finite(s.time) &&
    card.status <= CARD_STATUS.noCard
  )
}
