/**
 * The maths unit at FF50-FF5F (docs/elec16.md section 5): decimal floating point on numbers
 * of eight bytes in RAM (decimal.ts). The program names the operands by address and writes
 * an operation; the unit works at once, charges the cycles it would take to the instruction
 * that started it, writes the result back, and raises the MATH line until its status is read.
 *
 * A binary operation is A = A op B; a unary one works on A in place. Text goes in and out at
 * B, its length in ARG. Everything is checked: an operand outside RAM, or eight bytes that
 * are no number, is an error, and nothing is written.
 */

import { seedOf, xorshift32 } from '../emu/random.js'
import * as D from './decimal.js'
import { RAM_SIZE } from './map.js'
import type { Elec16State } from './state.js'

/** The unit's registers, from FF50. */
export const MATH_REG = {
  op: 0xff50,
  a: 0xff52,
  b: 0xff54,
  arg: 0xff56,
  status: 0xff58,
  result: 0xff5a,
  angle: 0xff5c,
} as const

/** Operations, as written to OP. */
export const MATH_OP = {
  add: 0x01,
  sub: 0x02,
  mul: 0x03,
  div: 0x04,
  pow: 0x05,
  cmp: 0x06,
  move: 0x07,
  neg: 0x10,
  abs: 0x11,
  int: 0x12,
  frac: 0x13,
  sgn: 0x14,
  sqr: 0x15,
  sin: 0x16,
  cos: 0x17,
  tan: 0x18,
  asn: 0x19,
  acs: 0x1a,
  atn: 0x1b,
  ln: 0x1c,
  log: 0x1d,
  exp: 0x1e,
  rnd: 0x1f,
  pi: 0x20,
  fromInt: 0x30,
  toInt: 0x31,
  parse: 0x38,
  format: 0x39,
} as const

/** STATUS's error codes (beside decimal.ts's own). */
export const MATH_ERR = { ...D.ERR, badAddress: 5, badOperation: 6 } as const

/** The unit's state, kept with the machine's. */
export interface MathState {
  a: number
  b: number
  arg: number
  /** The last operation's error, 0 for none. */
  status: number
  /** CMP's answer and SGN's, as a signed word. */
  result: number
  angle: D.Angle
  /** RND's generator: the same seed gives the same numbers, so a run is repeatable. */
  seed: number
  /** The MATH line: up from an operation's end until STATUS is read or another starts. */
  pending: boolean
}

export const createMathState = (): MathState => ({
  a: 0,
  b: 0,
  arg: 0,
  status: 0,
  result: 0,
  angle: 0,
  seed: seedOf(0xe016),
  pending: false,
})

type Op = (typeof MATH_OP)[keyof typeof MATH_OP]

/** Cycles each operation takes: a few for a sign, thousands for a sine. */
const CYCLES: Record<Op, number> = {
  [MATH_OP.add]: 60,
  [MATH_OP.sub]: 60,
  [MATH_OP.mul]: 120,
  [MATH_OP.div]: 250,
  [MATH_OP.pow]: 3000,
  [MATH_OP.cmp]: 30,
  [MATH_OP.move]: 16,
  [MATH_OP.neg]: 16,
  [MATH_OP.abs]: 16,
  [MATH_OP.int]: 30,
  [MATH_OP.frac]: 40,
  [MATH_OP.sgn]: 16,
  [MATH_OP.sqr]: 400,
  [MATH_OP.sin]: 2000,
  [MATH_OP.cos]: 2000,
  [MATH_OP.tan]: 2400,
  [MATH_OP.asn]: 2200,
  [MATH_OP.acs]: 2200,
  [MATH_OP.atn]: 2200,
  [MATH_OP.ln]: 1800,
  [MATH_OP.log]: 1800,
  [MATH_OP.exp]: 1800,
  [MATH_OP.rnd]: 100,
  [MATH_OP.pi]: 16,
  [MATH_OP.fromInt]: 30,
  [MATH_OP.toInt]: 30,
  [MATH_OP.parse]: 40,
  [MATH_OP.format]: 200,
}

const UNARY: Partial<Record<Op, (a: D.Dec, angle: D.Angle) => D.Dec>> = {
  [MATH_OP.neg]: D.neg,
  [MATH_OP.abs]: D.abs,
  [MATH_OP.int]: D.floor,
  [MATH_OP.frac]: D.frac,
  [MATH_OP.sgn]: D.sign,
  [MATH_OP.sqr]: D.sqrt,
  [MATH_OP.sin]: D.sin,
  [MATH_OP.cos]: D.cos,
  [MATH_OP.tan]: D.tan,
  [MATH_OP.asn]: D.asin,
  [MATH_OP.acs]: D.acos,
  [MATH_OP.atn]: D.atan,
  [MATH_OP.ln]: D.ln,
  [MATH_OP.log]: D.log,
  [MATH_OP.exp]: D.exp,
}

const BINARY: Partial<Record<Op, (a: D.Dec, b: D.Dec) => D.Dec>> = {
  [MATH_OP.add]: D.add,
  [MATH_OP.sub]: D.sub,
  [MATH_OP.mul]: D.mul,
  [MATH_OP.div]: D.div,
  [MATH_OP.pow]: D.pow,
  [MATH_OP.move]: (_a, b) => b,
}

/** pi to twelve digits. */
const PI = D.make(false, 314159265359n, -11)

class Refused extends Error {
  readonly code: number

  constructor(code: number) {
    super(`maths unit error ${code}`)
    this.code = code
  }
}

/** Runs the operation written to OP; the cycles it took. */
export function runMath(s: Elec16State, op: number): number {
  const m = s.math
  m.status = 0
  m.pending = false
  const cycles = CYCLES[op as Op]
  if (cycles === undefined) {
    m.status = MATH_ERR.badOperation
    m.pending = true
    return 4
  }
  try {
    perform(s, op as Op)
  } catch (e) {
    if (e instanceof D.DecError || e instanceof Refused) m.status = e.code
    else throw e
  }
  m.pending = true
  return cycles
}

function perform(s: Elec16State, op: Op): void {
  const m = s.math
  const unary = UNARY[op]
  const binary = BINARY[op]
  if (unary !== undefined) store(s, m.a, unary(load(s, m.a), m.angle))
  else if (binary !== undefined) store(s, m.a, binary(load(s, m.a), load(s, m.b)))
  else performOther(s, op)
}

function performOther(s: Elec16State, op: Op): void {
  const m = s.math
  switch (op) {
    case MATH_OP.cmp:
      m.result = D.compare(load(s, m.a), load(s, m.b)) & 0xffff
      break
    case MATH_OP.rnd:
      store(s, m.a, random(m))
      break
    case MATH_OP.pi:
      store(s, m.a, PI)
      break
    case MATH_OP.fromInt:
      store(s, m.a, D.fromInt((m.arg << 16) >> 16))
      break
    case MATH_OP.toInt:
      toInt(s)
      break
    case MATH_OP.parse:
      parseText(s)
      break
    case MATH_OP.format:
      formatText(s)
      break
  }
}

function inRam(address: number, length: number): void {
  if (address + length > RAM_SIZE) throw new Refused(MATH_ERR.badAddress)
}

function load(s: Elec16State, address: number): D.Dec {
  inRam(address, 8)
  const d = D.decode(s.ram.subarray(address, address + 8))
  if (d === null) throw new Refused(MATH_ERR.badNumber)
  return d
}

function store(s: Elec16State, address: number, d: D.Dec): void {
  inRam(address, 8)
  s.ram.set(D.encode(d), address)
}

/** The whole part towards zero, into ARG as a signed word. */
function toInt(s: Elec16State): void {
  const whole = D.toBigInt(load(s, s.math.a))
  if (whole < -32768n || whole > 32767n) throw new Refused(MATH_ERR.overflow)
  s.math.arg = Number(whole) & 0xffff
}

/** The number at B (at most ARG characters) into A; ARG says how many it took, 0 for none. */
function parseText(s: Elec16State): void {
  const m = s.math
  // A line of BASIC is at most 78 characters, so a number in one is shorter than this.
  const length = Math.min(m.arg, 255)
  inRam(m.b, length)
  const text = String.fromCharCode(...s.ram.subarray(m.b, m.b + length))
  const found = D.parse(text)
  if (found === null) {
    m.arg = 0
    return
  }
  store(s, m.a, found.value)
  m.arg = found.length
}

/** A as text at B, in ARG significant digits (0: the display's ten); ARG says its length. */
function formatText(s: Elec16State): void {
  const m = s.math
  const digits = m.arg === 0 ? 10 : Math.min(D.DIGITS, Math.max(1, m.arg))
  const text = D.format(load(s, m.a), digits)
  inRam(m.b, text.length)
  for (let k = 0; k < text.length; k++) s.ram[m.b + k] = text.charCodeAt(k)
  m.arg = text.length
}

/** A number from 0 up to 1, twelve digits from the unit's own generator. */
function random(m: MathState): D.Dec {
  m.seed = xorshift32(m.seed)
  const high = BigInt(m.seed % 1_000_000)
  m.seed = xorshift32(m.seed)
  const low = BigInt(m.seed % 1_000_000)
  return D.make(false, high * 1_000_000n + low, -12)
}

/** A register's value as read. Reading STATUS lowers the MATH line. */
export function mathRead(s: Elec16State, address: number, peek: boolean): number {
  const m = s.math
  switch (address) {
    case MATH_REG.a:
      return m.a
    case MATH_REG.b:
      return m.b
    case MATH_REG.arg:
      return m.arg
    case MATH_REG.status:
      if (!peek) m.pending = false
      return m.status
    case MATH_REG.result:
      return m.result
    case MATH_REG.angle:
      return m.angle
    default:
      return 0
  }
}

/** A register written; OP runs an operation, and the cycles it took are the answer. */
export function mathWrite(s: Elec16State, address: number, value: number): number {
  const m = s.math
  switch (address) {
    case MATH_REG.op:
      return runMath(s, value & 0xff)
    case MATH_REG.a:
      m.a = value
      return 0
    case MATH_REG.b:
      m.b = value
      return 0
    case MATH_REG.arg:
      m.arg = value
      return 0
    case MATH_REG.angle:
      if (value <= 2) m.angle = value as D.Angle
      return 0
    default:
      return 0
  }
}
