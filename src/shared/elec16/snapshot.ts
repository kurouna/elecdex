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
 * Version 3 added extended RAM (PLAY-320, docs/elec16-play.md section 3): the bank became 16
 * bits, the count of extended RAM banks follows LINK, and their bytes follow VRAM. An older
 * snapshot is read with none, as every machine then had.
 * Version 4 added PLAY-320's video (video.ts): after the count of banks, whether there is
 * video and, if so, its registers; after the banks, its 64 KB. Older ones are read without,
 * which only a model without video can be.
 * Version 5 added PLAY-320's cartridge slot (cartridge.ts): after video's registers, whether
 * a cartridge is in it and, if so, its id, hash and bank counts; after the video memory, its
 * save RAM. Never its ROM: main has that on the shelf, and the page puts it back.
 * Version 6 added mode 1's registers after video's (video.ts, TileState): the scrolls, LAYERS,
 * LINECMP, LINE's flags and DMA's. Not what was written line by line: a restored machine's
 * next frame is drawn afresh.
 */

import { ByteReader, ByteWriter } from '../emu/bytes.js'
import { CARD_STATUS } from './card.js'
import {
  CART_ID,
  CART_ID_LENGTH,
  CART_MAX_BANKS,
  CART_MAX_SAVE_BANKS,
  type CartSlot,
  cartBankTaken,
  DIGEST_LENGTH,
} from './cartridge.js'
import type { Angle } from './decimal.js'
import { linkInterrupted } from './link.js'
import { LINK_STATUS } from './link-services.js'
import {
  BANK_SIZE,
  bankTaken,
  MODEL_IDS,
  MODELS,
  type ModelId,
  RAM_SIZE,
  VRAM_WINDOW,
  XRAM_MAX,
} from './map.js'
import { createState, type Elec16State, MIE_LINES, MIE_LINES_VIDEO } from './state.js'
import { LAYERS_ALL, type TileState, VCTRL_MASK, VIDEO_PAGES, VIDEO_SIZE } from './video.js'

const MAGIC = [0x45, 0x31, 0x36, 0x53] // "E16S"
export const SNAPSHOT_VERSION = 6

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
  2 + // cycles, instret, bank
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
  LINK_SIZE +
  1 + // extended RAM banks
  1 + // video or not
  1 // a cartridge or not

/** The longest snapshot there is, for whoever stores them to check against. */
/** Video's registers: control, page, VBLANK, frame, fraction. */
/** Mode 1's registers: four scrolls, LAYERS, LINECMP, LINE's flags, DMA's three and its flag. */
const TILES_HEAD = 4 * 2 + 1 + 2 + 1 + 3 * 2 + 1

const VIDEO_HEAD = 1 + 1 + 1 + 2 + 8 + TILES_HEAD

/** The longest snapshot there is, for whoever stores them to check against. */
/** The slot: id, hash, ROM banks, save RAM banks. */
const CART_SLOT_HEAD = CART_ID_LENGTH + DIGEST_LENGTH + 1 + 1

export const SNAPSHOT_MAX_SIZE =
  HEAD +
  CAUSE_MAX +
  RAM_SIZE +
  VRAM_WINDOW +
  XRAM_MAX +
  VIDEO_HEAD +
  VIDEO_SIZE +
  CART_SLOT_HEAD +
  CART_MAX_SAVE_BANKS * BANK_SIZE

const FLAG = { inTrap: 1, sleeping: 2, off: 4, brk: 8, halted: 16 } as const

export function encodeSnapshot(s: Elec16State): Uint8Array {
  const cause = (s.halt?.cause ?? '').slice(0, CAUSE_MAX)
  const video = s.video === null ? 0 : VIDEO_HEAD + VIDEO_SIZE
  const cart = s.cart === null ? 0 : CART_SLOT_HEAD + s.cart.save.length
  const w = new ByteWriter(
    HEAD + cause.length + RAM_SIZE + VRAM_WINDOW + s.xram.length + video + cart,
  )
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
  w.u16(s.bank)
  writeDevices(w, s)
  w.u8(s.xram.length / BANK_SIZE)
  const v = s.video
  writeVideo(w, v)
  writeSlot(w, s.cart)
  w.raw(Array.from(cause, (ch) => ch.charCodeAt(0) & 0x7f))
  w.raw(s.ram)
  w.raw(s.vram)
  w.raw(s.xram)
  if (v !== null) w.raw(v.mem)
  if (s.cart !== null) w.raw(s.cart.save)
  return w.bytes
}

/** Video's registers: whether there is video, and if so its control, page, VBLANK and frame. */
function writeVideo(w: ByteWriter, v: Elec16State['video']): void {
  w.u8(v === null ? 0 : 1)
  if (v === null) return
  w.u8(v.ctrl)
  w.u8(v.page)
  w.u8(v.pending ? 1 : 0)
  w.u16(v.frame)
  w.f64(v.fraction)
  const t = v.tiles
  for (const scroll of t.scroll) w.u16(scroll)
  w.u8(t.layers)
  w.u16(t.lineCmp)
  w.u8((t.linePending ? 1 : 0) | (t.lineDone ? 2 : 0))
  w.u16(t.dma.src)
  w.u16(t.dma.dst)
  w.u16(t.dma.len)
  w.u8(t.dma.active ? 1 : 0)
}

/** Mode 1's registers, checked; its lines start from the cycles the machine has run. */
function readTiles(r: ByteReader, s: Elec16State, t: TileState): boolean {
  t.scroll = [r.u16(), r.u16(), r.u16(), r.u16()]
  t.layers = r.u8()
  t.lineCmp = r.u16()
  const flags = r.u8()
  t.linePending = (flags & 1) !== 0
  t.lineDone = (flags & 2) !== 0
  t.dma = { src: r.u16(), dst: r.u16(), len: r.u16(), active: r.u8() === 1 }
  t.slept = 0
  t.frameCycles = s.cycles
  t.start = { scroll: [...t.scroll], layers: t.layers }
  return (
    t.scroll.every((v) => v < 512) &&
    t.layers <= LAYERS_ALL &&
    flags < 4 &&
    (!t.dma.active || t.dma.len > 0)
  )
}

/** The slot's head: whether a cartridge is in it, and its id (padded), hash and bank counts. */
function writeSlot(w: ByteWriter, slot: CartSlot | null): void {
  w.u8(slot === null ? 0 : 1)
  if (slot === null) return
  const id = new Array(CART_ID_LENGTH).fill(0)
  Array.from(slot.id).forEach((c, k) => {
    id[k] = c.charCodeAt(0)
  })
  w.raw(id)
  w.raw(slot.digest)
  w.u8(slot.banks)
  w.u8(slot.save.length / BANK_SIZE)
}

/** A game's id from its padded bytes: null when it is not one, or what follows it is not zero. */
function idOf(bytes: Uint8Array): string | null {
  const end = bytes.indexOf(0)
  const id = String.fromCharCode(...bytes.slice(0, end < 0 ? bytes.length : end))
  const padded = end < 0 || bytes.slice(end).every((b) => b === 0)
  return padded && CART_ID.test(id) ? id : null
}

/**
 * The slot, checked: a cartridge only on a model with a slot, with an id as a header has one
 * and bank counts in range. Its ROM is not here: null until the page puts it back.
 */
function readSlot(r: ByteReader, s: Elec16State, version: number): boolean {
  if (version < 5 || r.u8() === 0) return true
  const idBytes = r.raw(CART_ID_LENGTH)
  const digest = Uint8Array.from(r.raw(DIGEST_LENGTH))
  const banks = r.u8()
  const saveBanks = r.u8()
  const id = idOf(idBytes)
  if (!MODELS[s.model].cart || id === null) return false
  if (banks < 1 || banks > CART_MAX_BANKS || saveBanks > CART_MAX_SAVE_BANKS) return false
  s.cart = { id, digest, banks, save: new Uint8Array(saveBanks * BANK_SIZE), rom: null }
  return true
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

/**
 * The model a snapshot says it was made on, from its head alone; null when it is not one of
 * ours. Which ROM to restore it with follows from it (the pocket ROM or the PLAY ROM).
 */
export function snapshotModel(bytes: Uint8Array): ModelId | null {
  if (bytes.length < 6 || MAGIC.some((b, k) => bytes[k] !== b)) return null
  return MODEL_IDS[bytes[5] ?? 0xff] ?? null
}

/** The memories, in the order they were written: RAM, VRAM, extended RAM, video, save RAM. */
function readMemories(r: ByteReader, s: Elec16State): void {
  s.ram.set(r.raw(RAM_SIZE))
  s.vram.set(r.raw(VRAM_WINDOW))
  s.xram.set(r.raw(s.xram.length))
  s.video?.mem.set(r.raw(VIDEO_SIZE))
  s.cart?.save.set(r.raw(s.cart.save.length))
}

/** The counts finite, and the bank one the machine has. */
const sane = (s: Elec16State): boolean =>
  finite(s.cycles) &&
  finite(s.instret) &&
  (bankTaken(s.bank, s.xram.length) || cartBankTaken(s.cart, s.bank))

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
  const head = readCpu(r, s, version)
  if (!readDevices(r, s) || (version >= 2 && !readLink(r, s))) return null
  if (!readExtras(r, s, version)) return null
  const cause = String.fromCharCode(...r.raw(head.causeLength))
  readMemories(r, s)
  if (r.overrun || r.at !== bytes.length) return null
  if (head.causeLength > CAUSE_MAX || !/^[ -~]*$/.test(cause) || !sane(s)) return null
  const flags = head.flags
  s.inTrap = (flags & FLAG.inTrap) !== 0
  s.sleeping = (flags & FLAG.sleeping) !== 0
  s.off = (flags & FLAG.off) !== 0
  s.brk = (flags & FLAG.brk) !== 0
  s.halt = (flags & FLAG.halted) !== 0 ? { cause, pc: head.haltPc } : null
  // Whatever it showed is drawn afresh.
  s.screenRevision = 1
  return s
}

/** What PLAY-320 added: extended RAM, made only as large as the model can have, and video. */
function readExtras(r: ByteReader, s: Elec16State, version: number): boolean {
  const banks = version >= 3 ? r.u8() : 0
  if (banks * BANK_SIZE > MODELS[s.model].xramMax) return false
  s.xram = new Uint8Array(banks * BANK_SIZE)
  return readVideo(r, s, version) && readSlot(r, s, version)
}

/**
 * Video's registers, checked: there must be video exactly when the model has it (the state
 * made for the model already has it or not), and a snapshot older than video has none.
 */
function readVideo(r: ByteReader, s: Elec16State, version: number): boolean {
  const has = version >= 4 ? r.u8() : 0
  const v = s.video
  if (has !== (v === null ? 0 : 1)) return false
  if (v === null) return true
  v.ctrl = r.u8()
  v.page = r.u8()
  v.pending = r.u8() === 1
  v.frame = r.u16()
  v.fraction = r.f64()
  if (version >= 6 && !readTiles(r, s, v.tiles)) return false
  return v.ctrl <= VCTRL_MASK && v.page < VIDEO_PAGES && finite(v.fraction) && v.fraction < 1
}

/** The CPU's part, into `s`; the flags and the halt are given back, to be checked last. */
function readCpu(
  r: ByteReader,
  s: Elec16State,
  version: number,
): { flags: number; haltPc: number; causeLength: number } {
  for (let k = 0; k < 16; k++) s.regs[k] = r.u16()
  s.regs[0] = 0
  s.pc = r.u16() & 0xfffe
  const [mstatus = 0, mie = 0, mtvec = 0, mscratch = 0, mepc = 0, mcause = 0, mtval = 0] =
    Array.from({ length: 7 }, () => r.u16())
  s.csr = {
    mstatus,
    mie: mie & (version === 1 ? 15 : s.video !== null ? MIE_LINES_VIDEO : MIE_LINES),
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
  s.bank = version >= 3 ? r.u16() : r.u8()
  return { flags, haltPc, causeLength }
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
