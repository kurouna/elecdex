/**
 * One CHIP-8 instruction at a time (docs/architecture.md section 5.18): CHIP-8, the
 * SUPER-CHIP additions and XO-CHIP's, as Octo runs them.
 *
 * The instructions are split by their first nibble into small functions, one table
 * entry each. Like Octo, every platform runs every instruction - chip8Archive has
 * programs marked CHIP-8 that probe for SUPER-CHIP at run time - and the platform
 * decides only the memory and the quirks. What no platform has (0NNN, a 5XY or 9XY
 * with a stray last nibble, an unknown EX or FX) stops the machine with a fault that
 * says where, rather than drawing nonsense.
 */

import { clearPlanes, drawSprite, scroll, setResolution } from './display.js'
import { BIG_FONT_AT, BIG_GLYPH_BYTES, SMALL_FONT_AT, SMALL_GLYPH_BYTES } from './fonts.js'
import { type Chip8State, peek, poke, randomByte, STACK_DEPTH, word } from './state.js'
import type { HaltReason } from './types.js'

interface Op {
  /** The whole instruction. */
  op: number
  x: number
  y: number
  n: number
  nn: number
  nnn: number
  /** Where the instruction is (pc before it was stepped past). */
  at: number
}

const decode = (op: number, at: number): Op => ({
  op,
  x: (op >> 8) & 0xf,
  y: (op >> 4) & 0xf,
  n: op & 0xf,
  nn: op & 0xff,
  nnn: op & 0xfff,
  at,
})

function stop(s: Chip8State, reason: HaltReason, o: Op): void {
  s.halt = { reason, pc: o.at, op: o.op }
}

const illegal = (s: Chip8State, o: Op): void => stop(s, 'illegal', o)

/** Skips the next instruction - two words when it is XO-CHIP's F000 NNNN. */
function skip(s: Chip8State): void {
  s.pc = (s.pc + (word(s, s.pc) === 0xf000 ? 4 : 2)) & 0xffff
}

function sense(s: Chip8State, key: number): boolean {
  s.sensed |= 1 << (key & 0xf)
  return (s.keys & (1 << (key & 0xf))) !== 0
}

/* ---------------- 0: the machine's own calls ---------------- */

function call(s: Chip8State, o: Op, target: number): void {
  if (s.sp >= STACK_DEPTH) {
    stop(s, 'stack-overflow', o)
    return
  }
  s.stack[s.sp++] = s.pc
  s.pc = target
}

function ret(s: Chip8State, o: Op): void {
  if (s.sp <= 0) {
    stop(s, 'stack-underflow', o)
    return
  }
  s.pc = s.stack[--s.sp] ?? 0
}

/** The 00Cx, 00Dx and 00Fx family: SUPER-CHIP's screen calls and XO-CHIP's scroll up. */
function superCall(s: Chip8State, o: Op): boolean {
  const { op, n } = o
  if ((op & 0xfff0) === 0x00c0 && n > 0) scroll(s, 0, n)
  else if ((op & 0xfff0) === 0x00d0 && n > 0) scroll(s, 0, -n)
  else if (op === 0x00fb) scroll(s, 4, 0)
  else if (op === 0x00fc) scroll(s, -4, 0)
  else if (op === 0x00fd) stop(s, 'exit', o)
  else if (op === 0x00fe) setResolution(s, false)
  else if (op === 0x00ff) setResolution(s, true)
  else return false
  return true
}

function op0(s: Chip8State, o: Op): void {
  if (o.op === 0x00e0) clearPlanes(s)
  else if (o.op === 0x00ee) ret(s, o)
  // Running into empty memory ends the program, as in Octo.
  else if (o.op === 0x0000) stop(s, 'exit', o)
  // 0NNN called the host machine's own code, which no interpreter here has.
  else if (!superCall(s, o)) illegal(s, o)
}

/* ---------------- 1 to 7: jumps, skips and loads ---------------- */

const op1 = (s: Chip8State, o: Op): void => {
  s.pc = o.nnn
}
function op2(s: Chip8State, o: Op): void {
  call(s, o, o.nnn)
}
function op3(s: Chip8State, o: Op): void {
  if (s.v[o.x] === o.nn) skip(s)
}
function op4(s: Chip8State, o: Op): void {
  if (s.v[o.x] !== o.nn) skip(s)
}

/** 5XY0 skips on equal registers; XO-CHIP's 5XY2 and 5XY3 save and load VX..VY. */
function op5(s: Chip8State, o: Op): void {
  if (o.n === 0) {
    if (s.v[o.x] === s.v[o.y]) skip(s)
    return
  }
  if (o.n !== 2 && o.n !== 3) {
    illegal(s, o)
    return
  }
  const step = o.x <= o.y ? 1 : -1
  const count = Math.abs(o.x - o.y) + 1
  for (let k = 0; k < count; k++) {
    const reg = o.x + k * step
    if (o.n === 2) poke(s, s.i + k, s.v[reg] ?? 0)
    else s.v[reg] = peek(s, s.i + k)
  }
}

const op6 = (s: Chip8State, o: Op): void => {
  s.v[o.x] = o.nn
}
const op7 = (s: Chip8State, o: Op): void => {
  s.v[o.x] = ((s.v[o.x] ?? 0) + o.nn) & 0xff
}

/* ---------------- 8: arithmetic ---------------- */

/** Writes a result and its flag, in the order the `vfOrder` quirk says when X is F. */
function withFlag(s: Chip8State, x: number, value: number, flag: boolean): void {
  s.v[x] = value & 0xff
  s.v[0xf] = flag ? 1 : 0
  if (s.config.quirks.vfOrder) s.v[x] = value & 0xff
}

const LOGIC: Readonly<Record<number, (a: number, b: number) => number>> = {
  1: (a, b) => a | b,
  2: (a, b) => a & b,
  3: (a, b) => a ^ b,
}

function logic(s: Chip8State, o: Op): void {
  s.v[o.x] = LOGIC[o.n]?.(s.v[o.x] ?? 0, s.v[o.y] ?? 0) ?? 0
  if (s.config.quirks.vfReset) s.v[0xf] = 0
}

function shift(s: Chip8State, o: Op): void {
  const from = s.v[s.config.quirks.shiftVx ? o.x : o.y] ?? 0
  if (o.n === 6) withFlag(s, o.x, from >> 1, (from & 1) !== 0)
  else withFlag(s, o.x, from << 1, (from & 0x80) !== 0)
}

function op8(s: Chip8State, o: Op): void {
  const a = s.v[o.x] ?? 0
  const b = s.v[o.y] ?? 0
  switch (o.n) {
    case 0x0:
      s.v[o.x] = b
      break
    case 0x1:
    case 0x2:
    case 0x3:
      logic(s, o)
      break
    case 0x4:
      withFlag(s, o.x, a + b, a + b > 0xff)
      break
    case 0x5:
      withFlag(s, o.x, a - b, a >= b)
      break
    case 0x7:
      withFlag(s, o.x, b - a, b >= a)
      break
    case 0x6:
    case 0xe:
      shift(s, o)
      break
    default:
      illegal(s, o)
  }
}

/* ---------------- 9 to E: skips, I, jumps, random, sprites, keys ---------------- */

function op9(s: Chip8State, o: Op): void {
  if (o.n !== 0) illegal(s, o)
  else if (s.v[o.x] !== s.v[o.y]) skip(s)
}
const opA = (s: Chip8State, o: Op): void => {
  s.i = o.nnn
}
const opB = (s: Chip8State, o: Op): void => {
  s.pc = (o.nnn + (s.v[s.config.quirks.jumpVx ? o.x : 0] ?? 0)) & 0xffff
}
const opC = (s: Chip8State, o: Op): void => {
  s.v[o.x] = randomByte(s) & o.nn
}
function opD(s: Chip8State, o: Op): void {
  drawSprite(s, s.v[o.x] ?? 0, s.v[o.y] ?? 0, o.n)
}
function opE(s: Chip8State, o: Op): void {
  if (o.nn !== 0x9e && o.nn !== 0xa1) illegal(s, o)
  else if (sense(s, s.v[o.x] ?? 0) === (o.nn === 0x9e)) skip(s)
}

/* ---------------- F: timers, keys, memory and the rest ---------------- */

function saveLoad(s: Chip8State, o: Op, save: boolean): void {
  for (let k = 0; k <= o.x; k++) {
    if (save) poke(s, s.i + k, s.v[k] ?? 0)
    else s.v[k] = peek(s, s.i + k)
  }
  if (s.config.quirks.memIncrement) s.i = (s.i + o.x + 1) & 0xffff
}

function bcd(s: Chip8State, o: Op): void {
  const value = s.v[o.x] ?? 0
  poke(s, s.i, Math.floor(value / 100) % 10)
  poke(s, s.i + 1, Math.floor(value / 10) % 10)
  poke(s, s.i + 2, value % 10)
}

/** FX75 / FX85: SUPER-CHIP kept eight flags, XO-CHIP sixteen; Octo lets any program use sixteen. */
function flagsIo(s: Chip8State, o: Op, save: boolean): void {
  for (let k = 0; k <= o.x; k++) {
    if (save) s.flags[k] = s.v[k] ?? 0
    else s.v[k] = s.flags[k] ?? 0
  }
}

/** The FX instructions every platform has. Returns false for one it does not know. */
function opFCommon(s: Chip8State, o: Op): boolean {
  const vx = s.v[o.x] ?? 0
  switch (o.nn) {
    case 0x07:
      s.v[o.x] = s.dt
      return true
    case 0x0a:
      s.waitReg = o.x
      s.waitKey = -1
      return true
    case 0x15:
      s.dt = vx
      return true
    case 0x18:
      s.st = vx
      return true
    case 0x1e:
      s.i = (s.i + vx) & 0xffff
      return true
    case 0x29:
      s.i = SMALL_FONT_AT + (vx & 0xf) * SMALL_GLYPH_BYTES
      return true
    case 0x33:
      bcd(s, o)
      return true
    case 0x55:
    case 0x65:
      saveLoad(s, o, o.nn === 0x55)
      return true
    default:
      return false
  }
}

/** The FX instructions SUPER-CHIP and XO-CHIP added. */
function opFExtended(s: Chip8State, o: Op): boolean {
  switch (o.nn) {
    case 0x30:
      s.i = BIG_FONT_AT + ((s.v[o.x] ?? 0) & 0xf) * BIG_GLYPH_BYTES
      return true
    case 0x75:
    case 0x85:
      flagsIo(s, o, o.nn === 0x75)
      return true
    default:
      return false
  }
}

/** XO-CHIP's F000 NNNN, FN01, F002 and FX3A. */
function opFXo(s: Chip8State, o: Op): boolean {
  if (o.op === 0xf000) {
    s.i = word(s, s.pc)
    s.pc = (s.pc + 2) & 0xffff
  } else if (o.nn === 0x01) {
    s.plane = o.x & 3
  } else if (o.op === 0xf002) {
    for (let k = 0; k < 16; k++) s.pattern[k] = peek(s, s.i + k)
  } else if (o.nn === 0x3a) {
    s.pitch = s.v[o.x] ?? 0
  } else {
    return false
  }
  return true
}

function opF(s: Chip8State, o: Op): void {
  if (opFCommon(s, o) || opFExtended(s, o) || opFXo(s, o)) return
  illegal(s, o)
}

const TABLE: readonly ((s: Chip8State, o: Op) => void)[] = [
  op0,
  op1,
  op2,
  op3,
  op4,
  op5,
  op6,
  op7,
  op8,
  op9,
  opA,
  opB,
  opC,
  opD,
  opE,
  opF,
]

/** Runs the instruction at pc. Does nothing once the machine has stopped. */
export function execute(s: Chip8State): void {
  if (s.halt !== null) return
  const at = s.pc
  const op = word(s, at)
  s.pc = (at + 2) & 0xffff
  s.cycles++
  TABLE[op >> 12]?.(s, decode(op, at))
}
