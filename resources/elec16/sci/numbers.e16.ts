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
  memcpy,
  peek,
  peek16,
  poke16,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { exactWhole } from './exact.e16'

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
export const M_RND = 0x1f
export const M_PI = 0x20
export const M_SINH = 0x21
export const M_COSH = 0x22
export const M_TANH = 0x23
export const M_ASNH = 0x24
export const M_ACSH = 0x25
export const M_ATNH = 0x26
export const M_ATN2 = 0x27
export const M_RNDTO = 0x28
export const M_ROOT = 0x2b
export const M_FROMINT = 0x30
export const M_TOINT = 0x31
export const M_PARSE = 0x38
export const M_FORMAT = 0x39

/* ---------------- errors ---------------- */

export const E_MATH = 1
export const E_SYNTAX = 2
export const E_STACK = 3
/** FIND X found no X from where it started. */
export const E_FIND = 4
/** TABLE's START, END and STEP make no table of 1-30 rows. */
export const E_RANGE = 5
/** MATRIX: the sizes of two matrices do not fit the operation (section 14.7). */
export const E_DIM = 6

/** The last error, and where in the line it was found (a token's index). */
export let errCode: u16 = 0
export let errAt: u16 = 0
/**
 * Where the tokens being evaluated start in the line: a program's statement is evaluated where
 * it is (prog.e16.ts), so an error's place is counted from the line's start. With ERR_PINNED,
 * the place itself: an error in what X? or ? was given is put at its statement (or the line's
 * end), not at a place in other tokens. Used once.
 */
let errBase: u16 = 0
export const ERR_PINNED = 0x8000

export function errFrom(base: u16): void {
  errBase = base
}

/** Stops the evaluation: back to the key loop, which shows the error. */
export function fail(code: u16, at: u16): void {
  errCode = code
  errAt = (errBase & ERR_PINNED) !== 0 ? errBase & 0x7fff : at + errBase
  errBase = 0
  calc_abort()
}

/*
 * X lent to a TABLE row or a Σ, d/dx or ∫: kept by the first to take it, given back by the
 * last - or by the error or ON that stopped them.
 */
const xKept = bytes(36)
let xTaken: u16 = 0

export function holdX(): void {
  if (xTaken === 0) copyValue(varAt(0x58), addr(xKept))
  xTaken++
}

export function releaseX(): void {
  xTaken--
  if (xTaken === 0) copyValue(addr(xKept), varAt(0x58))
}

/** After an error or ON: X back, if anything had it. */
export function xBack(): void {
  if (xTaken === 0) return
  xTaken = 0
  copyValue(addr(xKept), varAt(0x58))
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
/** SETUP: how a decimal is shown - AUTO (0), FIX (1) or EXP (2) - and FIX's or EXP's digits. */
export const KEEP_FORMAT = 0x0c05
export const KEEP_DIGITS = 0x0c06
/** SETUP: a fraction greater than 1 shown as a mixed number (1) or not (0). */
export const KEEP_MIXED = 0x0c07
export const FORMAT_AUTO = 0
export const FORMAT_FIX = 1
export const FORMAT_EXP = 2
/** AUTO with an exponent below 0.01 as well (after EL-509E's list). */
export const FORMAT_AUTO2 = 3
/** Ans: a value. */
export const KEEP_ANS = 0x0c08
/** The mode the calculator is in (calc.e16.ts MODE_*), kept when the power goes. */
export const KEEP_MODE = 0x0c2c
/** SETUP's LCD contrast plus 1 (0: never set, the machine's 8), kept when the power goes. */
export const KEEP_CONTRAST = 0x0c2d
/** The LCD's contrast register (shared/elec16/bus.ts REG.contrast), 0-15. */
export const IO_CONTRAST = 0xff28

/** A, B, C, D, E, F, X, Y, M: a value each. */
export const KEEP_VARS = 0x0c30
export const KEEP_HISTORY_COUNT = 0x0d80
export const KEEP_HISTORY = 0x0d82
export const HISTORY_ENTRIES = 10
/** An entry: its length, then the line. */
export const HISTORY_SIZE = 200
export const LINE_MAX = 199

/*
 * The modes' region (S6), checked by a mark of its own so S5's RAM stays as it was:
 * STATS' table, BASE's history, TABLE's f(X) and range, EQUATION's coefficients, and the
 * lines CALC and BASE had when the mode changed.
 */
export const MODES = 0x1600
export const MODES_MARK = 0x5c36
/** STATS: rows, 1-VAR (0) or 2-VAR (1), a FREQ column (1) or not; then X, Y, FREQ a row. */
export const STATS_COUNT = 0x1602
export const STATS_TYPE = 0x1604
export const STATS_FREQ = 0x1605
export const STATS_DATA = 0x1610
export const STATS_ROWS = 40
/** EQUATION's kind (1-4, 0 none chosen yet) and its coefficients, a value each. */
export const EQN_TYPE = 0x1606
export const EQN_COEFFS = 0x1d40
/** BASE: its base (0 HEX, 1 DEC, 2 OCT, 3 BIN), its history: a count, then 5 lines of 100. */
export const BASE_RADIX = 0x1607
export const BASE_HISTORY_COUNT = 0x1a00
export const BASE_HISTORY = 0x1a02
/** TABLE's f(X) as a line (length, cursor, tokens), then START, END and STEP, a value each. */
export const TABLE_LINE = 0x1c00
export const TABLE_RANGE = 0x1cc8
/** CALC's and BASE's lines while another mode is on screen: length, cursor, tokens. */
export const CALC_LINE = 0x1f00
export const BASE_LINE = 0x2000
export const MODES_END = 0x2100
/** EQUATION's working values (24 values), not kept: e16c's own RAM is full. */
export const EQN_WORK = 0x2100
/** STATS' working numbers (44 of 8 bytes, then a byte each: has it a value), not kept. */
export const STATS_WORK = 0x2500
/** A little working room for the banks with no RAM of their own (extras.e16.ts, base.e16.ts), not kept. */
export const WORK = 0x2700

/*
 * v2's region (docs/elec16-sci.md section 14.1), kept and checked by a mark of its own so the
 * RAM of a machine from before v2 stays as it was: CPLX's line and Ans, MATRIX's line and
 * matrices, PROG's programs. Then its working room, not kept.
 */
export const V2 = 0x2800
export const V2_MARK = 0x5c48
export const V2_END = 0x3000
export const CPLX_LINE = 0x2802
export const CPLX_ANS = 0x2870
export const MATRIX_LINE = 0x2880
/**
 * Whether Ans is MatAns (1) or the number (0), kept with MatAns: a global, it went back to the
 * number on every OFF and ON. In the room after MATRIX's line, which v2's region zeroed.
 */
export const MAT_ANSWERED = 0x28f0
/** MatA-MatD and MatAns: rows, columns, then 3 x 3 numbers of 8 bytes, row by row. */
export const MATRICES = 0x2900
export const MATRIX_SIZE = 80
/** The program PROG is on (0-3), then the four: length, cursor, 200 tokens each. */
export const PROG_CHOSEN = 0x2c00
export const PROGRAMS = 0x2c02
export const PROGRAM_SIZE = 202
export const CPLX_STACK = 0x3000
export const MATRIX_STACK = 0x3200
export const INTEGRAL_WORK = 0x3500

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

/** What the line came to at FIND X's answer (solve.e16.ts), for the screen to show. */
export const diffValue = bytes(36)

/** A whole number (0-32767) into the 8-byte number at `dst`. */
export function wholeInto(dst: u16, v: u16): void {
  poke16(MATH_ARG, v)
  math(M_FROMINT, dst, 0, 0)
}

/** A whole number (0-32767) onto the stack, exact. */
export function pushInt(v: u16, at: u16): u16 {
  const n = push(at)
  poke16(MATH_ARG, v)
  math(M_FROMINT, n, 0, at)
  exactWhole(n)
  return n
}
