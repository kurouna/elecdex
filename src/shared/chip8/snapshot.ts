/**
 * A CHIP-8 machine as bytes, and back (docs/architecture.md section 5.18).
 *
 * The format opens with a magic word and a version; a snapshot of any other shape - an
 * older version, a cut file, somebody else's bytes - decodes to null, and the pane then
 * starts the program afresh instead of running a machine that was never ours. Every
 * field is checked on the way in: main keeps these files, but it only checks their size.
 *
 * Keys held when it was taken are not kept: a machine comes back with every key up.
 */

import { ByteReader, ByteWriter } from '../emu/bytes.js'
import { quirksFor } from './quirks.js'
import { type Chip8State, createState, STACK_DEPTH } from './state.js'
import {
  FONT_STYLES,
  type FontStyle,
  type HaltReason,
  HIRES,
  IPF_MAX,
  IPF_MIN,
  KEY_COUNT,
  memorySize,
  PLATFORMS,
  type Platform,
  QUIRK_NAMES,
  type Quirks,
} from './types.js'

const MAGIC = [0x43, 0x38, 0x53, 0x4e] // "C8SN"
export const SNAPSHOT_VERSION = 1
const HALTS: readonly (HaltReason | null)[] = [
  null,
  'exit',
  'illegal',
  'stack-overflow',
  'stack-underflow',
]

/** The fixed part: everything but the screen and memory. */
const HEAD = 4 + 1 + 1 + 1 + 1 + 2 + (2 + 2 + 1 + 1 + 1 + 1 + 1 + 1) + (1 + 2 + 4 + 8) + (1 + 2 + 2)
const ARRAYS = 16 + STACK_DEPTH * 2 + 16 + 16 + HIRES.w * HIRES.h

/** How long a snapshot of a platform's machine is. */
export const snapshotSize = (platform: Platform): number => HEAD + ARRAYS + memorySize(platform)

/** The longest snapshot there is, for whoever stores them to check against. */
export const SNAPSHOT_MAX_SIZE = snapshotSize('xochip')

const quirkBits = (quirks: Quirks): number =>
  QUIRK_NAMES.reduce((bits, name, k) => (quirks[name] ? bits | (1 << k) : bits), 0)

function quirksOf(bits: number): Quirks {
  const quirks = quirksFor('chip8')
  QUIRK_NAMES.forEach((name, k) => {
    quirks[name] = (bits & (1 << k)) !== 0
  })
  return quirks
}

export function encodeSnapshot(s: Chip8State): Uint8Array {
  const w = new ByteWriter(snapshotSize(s.config.platform))
  w.raw(MAGIC)
  w.u8(SNAPSHOT_VERSION)
  w.u8(PLATFORMS.indexOf(s.config.platform))
  w.u8(FONT_STYLES.indexOf(s.config.font))
  w.u8(quirkBits(s.config.quirks))
  w.u16(s.config.ipf)
  w.u16(s.pc)
  w.u16(s.i)
  w.u8(s.sp)
  w.u8(s.dt)
  w.u8(s.st)
  w.u8((s.hires ? 1 : 0) | (s.patternSet ? 2 : 0))
  w.u8(s.plane)
  w.u8(s.pitch)
  w.i8(s.waitReg)
  w.u16(s.sensed)
  w.u32(s.rng)
  w.f64(s.cycles)
  w.u8(HALTS.indexOf(s.halt?.reason ?? null))
  w.u16(s.halt?.pc ?? 0)
  w.u16(s.halt?.op ?? 0)
  w.raw(s.v)
  for (const address of s.stack) w.u16(address)
  w.raw(s.pattern)
  w.raw(s.flags)
  w.raw(s.pixels)
  w.raw(s.memory)
  return w.bytes
}

interface Head {
  platform: Platform
  font: FontStyle
  quirks: Quirks
  ipf: number
}

/** The magic, version and machine; null when any of it is not ours. */
function readHead(r: ByteReader, length: number): Head | null {
  const magic = r.raw(4)
  if (MAGIC.some((b, k) => magic[k] !== b) || r.u8() !== SNAPSHOT_VERSION) return null
  const platform = PLATFORMS[r.u8()]
  const font = FONT_STYLES[r.u8()]
  const quirks = quirksOf(r.u8())
  const ipf = r.u16()
  if (platform === undefined || font === undefined) return null
  if (length !== snapshotSize(platform) || ipf < IPF_MIN || ipf > IPF_MAX) return null
  return { platform, font, quirks, ipf }
}

/** The registers and flags, checked; false when any is out of its range. */
function readRegisters(r: ByteReader, s: Chip8State): boolean {
  s.pc = r.u16()
  s.i = r.u16()
  s.sp = r.u8()
  s.dt = r.u8()
  s.st = r.u8()
  const bits = r.u8()
  s.hires = (bits & 1) !== 0
  s.patternSet = (bits & 2) !== 0
  s.plane = r.u8()
  s.pitch = r.u8()
  s.waitReg = r.i8()
  s.sensed = r.u16()
  s.rng = r.u32() || 1
  s.cycles = r.f64()
  const halt = HALTS[r.u8()]
  const haltPc = r.u16()
  const haltOp = r.u16()
  s.halt = halt ? { reason: halt, pc: haltPc, op: haltOp } : null
  return (
    halt !== undefined &&
    s.sp <= STACK_DEPTH &&
    s.plane <= 3 &&
    s.waitReg >= -1 &&
    s.waitReg < KEY_COUNT &&
    // Any address: the program counter runs on past the end of memory and wraps when read.
    s.pc <= 0xffff &&
    Number.isFinite(s.cycles) &&
    s.cycles >= 0
  )
}

export function decodeSnapshot(bytes: Uint8Array): Chip8State | null {
  if (!(bytes instanceof Uint8Array) || bytes.length < HEAD) return null
  const r = new ByteReader(bytes)
  const head = readHead(r, bytes.length)
  if (head === null) return null
  const s = createState(new Uint8Array(0), { ...head }, 1)
  if (!readRegisters(r, s)) return null
  s.v.set(r.raw(16))
  for (let k = 0; k < STACK_DEPTH; k++) s.stack[k] = r.u16()
  s.pattern.set(r.raw(16))
  s.flags.set(r.raw(16))
  s.pixels.set(r.raw(HIRES.w * HIRES.h))
  s.memory.set(r.raw(s.memory.length))
  s.keys = 0
  s.waitKey = -1
  s.screenRevision = 1
  return s
}
