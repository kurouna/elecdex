// The calculator's numbers (docs/elec16-sci.md sections 6.3, 6.4 and 7): values on a stack in
// RAM, the maths unit run on them, and what stays when the power goes - Ans, the variables and
// SETUP - kept apart from e16c's own globals, which start afresh at every reset. An error stops
// the evaluation where it was (fail), as BASIC's does.
//
// A value is a record of VALUE_SIZE bytes: the maths unit's 8-byte decimal number first (so
// the unit runs on a value's address as it is), then its exact form (p + r√s)/q while it has
// one (exact.e16.ts keeps it through the arithmetic).
import {
  addr,
  type bool,
  bytes,
  i16,
  memcpy,
  peek,
  peek16,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { exactBinary, exactWhole } from './exact.e16'

/* ---------------- the hand-written ROM (main.s) ---------------- */

/** Back to the key loop with the stack as it was there; calcError says why (errCode). */
export declare function calc_abort(): void

/* ---------------- the maths unit (shared/elec16/math-unit.ts; a test holds them alike) ---------------- */

export const MATH_OP = 0xff50
export const MATH_A = 0xff52
export const MATH_B = 0xff54
export const MATH_ARG = 0xff56
export const MATH_STATUS = 0xff58
export const MATH_RESULT = 0xff5a
export const MATH_ANGLE = 0xff5c

export const M_ADD = 0x01
export const M_SUB = 0x02
export const M_MUL = 0x03
export const M_DIV = 0x04
export const M_POW = 0x05
export const M_CMP = 0x06
export const M_MOVE = 0x07
export const M_IDIV = 0x08
export const M_MOD = 0x09
export const M_NEG = 0x10
export const M_ABS = 0x11
export const M_INT = 0x12
export const M_FRAC = 0x13
export const M_SQR = 0x15
export const M_SIN = 0x16
export const M_COS = 0x17
export const M_TAN = 0x18
export const M_ASN = 0x19
export const M_ACS = 0x1a
export const M_ATN = 0x1b
export const M_LN = 0x1c
export const M_LOG = 0x1d
export const M_EXP = 0x1e
export const M_PI = 0x20
export const M_FROMINT = 0x30
export const M_TOINT = 0x31
export const M_PARSE = 0x38
export const M_FORMAT = 0x39

/* ---------------- errors ---------------- */

export const E_MATH = 1
export const E_SYNTAX = 2
export const E_STACK = 3

/** The last error, and where in the line it was found (a token's index). */
export let errCode: u16 = 0
export let errAt: u16 = 0

/** Stops the evaluation: back to the key loop, which shows the error. */
export function fail(code: u16, at: u16): void {
  errCode = code
  errAt = at
  calc_abort()
}

/* ---------------- a value ---------------- */

/** A value's bytes: the decimal, then whether it is exact, s, p, r and q (exact.e16.ts). */
export const VALUE_SIZE = 36
export const V_EXACT = 8
export const V_S = 10
export const V_P = 12
export const V_R = 20
export const V_Q = 28

export function copyValue(from: u16, to: u16): void {
  memcpy(to, from, VALUE_SIZE)
}

/** The decimal alone (an 8-byte number of the maths unit). */
export function copy8(from: u16, to: u16): void {
  memcpy(to, from, 8)
}

/** The value has no exact form (a function's answer, π, a number too long for one). */
export function inexact(v: u16): void {
  poke16(v + V_EXACT, 0)
}

export function isExact(v: u16): bool {
  return peek16(v + V_EXACT) !== 0
}

/* ---------------- what the power does not clear ---------------- */

/** A RAM region the calculator keeps, outside e16c's globals (0100-0BFF). */
export const KEEP = 0x0c00
/** Its mark: a calculator's RAM of this layout, not another ROM's or a new machine's. */
export const KEEP_MARK = 0x5c24
export const KEEP_ANGLE = 0x0c02
/** SETUP: 2D (0) or LINE (1); an answer's exact form first (0) or its decimal (1). */
export const KEEP_DISPLAY = 0x0c03
export const KEEP_ANSWER = 0x0c04
/** Ans: a value. */
export const KEEP_ANS = 0x0c08
/** A, B, C, D, E, F, X, Y, M: a value each. */
export const KEEP_VARS = 0x0c30
export const KEEP_HISTORY_COUNT = 0x0d80
export const KEEP_HISTORY = 0x0d82
export const HISTORY_ENTRIES = 10
/** An entry: its length, then the line. */
export const HISTORY_SIZE = 200
export const LINE_MAX = 199

/** Whether the kept region is a calculator's; when not, it is set out afresh: zero, DEG, 2D. */
export function keepReady(): void {
  if (peek16(KEEP) === KEEP_MARK) return
  for (let i: u16 = 0; i < 0x182; i += 2) poke16(KEEP + i, 0)
  poke16(KEEP, KEEP_MARK)
}

/** A variable's value, by its letter: A-F, X, Y, M. */
export function varAt(letter: u16): u16 {
  let k: u16 = 0
  if (letter >= 0x41 && letter <= 0x46) k = letter - 0x41
  else if (letter === 0x58) k = 6
  else if (letter === 0x59) k = 7
  else k = 8
  return KEEP_VARS + k * VALUE_SIZE
}

/* ---------------- the value stack ---------------- */

/** 24 values: deep enough for brackets and functions nested as far as a line goes. */
const nums = bytes(864)
let nsp: u16 = 0

export function clearStack(): void {
  nsp = addr(nums)
}

/** A new value on top: its address; STACK when the line is too deep. */
export function push(at: u16): u16 {
  if (nsp >= addr(nums) + 864) fail(E_STACK, at)
  const n = nsp
  nsp += VALUE_SIZE
  inexact(n)
  return n
}

export function top(): u16 {
  return nsp - VALUE_SIZE
}

export function pop(): void {
  nsp -= VALUE_SIZE
}

export function isZero(n: u16): bool {
  return peek(n + 2) === 0
}

export function isNegative(n: u16): bool {
  return peek(n) !== 0
}

/** Runs a maths operation on A and B; anything the unit refuses is a MATH error at `at`. */
export function math(op: u16, a: u16, b: u16, at: u16): void {
  poke16(MATH_A, a)
  poke16(MATH_B, b)
  poke16(MATH_OP, op)
  if (peek16(MATH_STATUS) !== 0) fail(E_MATH, at)
}

/** A whole number (0-32767) onto the stack, exact. */
export function pushInt(v: u16, at: u16): u16 {
  const n = push(at)
  poke16(MATH_ARG, v)
  math(M_FROMINT, n, 0, at)
  exactWhole(n)
  return n
}

/** The two top values made one by `op`: the decimal by the unit, the exact form alongside. */
export function binary(op: u16, at: u16): void {
  const b = top()
  pop()
  const a = top()
  math(op, a, b, at)
  exactBinary(op, a, b)
}

/** Whether the number at `n` is whole. */
export function isWhole(n: u16, at: u16): bool {
  const t = push(at)
  copy8(n, t)
  math(M_FRAC, t, 0, at)
  const whole = isZero(t)
  pop()
  return whole
}

/** The number at `n` as a small whole number (0-999 is all a factorial or nCr takes); MATH past that. */
export function smallWhole(n: u16, at: u16): u16 {
  if (!isWhole(n, at) || isNegative(n)) fail(E_MATH, at)
  const t = push(at)
  copy8(n, t)
  math(M_TOINT, t, 0, at)
  pop()
  const v = peek16(MATH_ARG)
  if (i16(v) < 0 || v > 999) fail(E_MATH, at)
  return v
}
