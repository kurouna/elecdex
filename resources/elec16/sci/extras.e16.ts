// ELEC-16 SCI, ROM bank 10 beside TABLE: what EL-509E's list asked for that fits nowhere else (docs/
// elec16-sci.md): the answer turned into the next angle unit, and the constant a line like
// 34+57 leaves for the next one that is only a number (34+57= then 45= is 45+57).
import { type bool, peek, poke, type u16 } from '../../../src/shared/e16c/builtins'
import {
  inexact,
  KEEP_ANGLE,
  KEEP_ANS,
  M_DIV,
  M_MUL,
  M_PI,
  math,
  WORK,
  wholeInto,
} from './numbers.e16'
import { T_DIVIDE, T_MINUS, T_PLUS, T_POINT, T_TIMES } from './tokens.e16'

/* ---------------- the angle unit ---------------- */

/**
 * Ans from the angle unit SETUP has to the next (DEG, RAD, GRAD, DEG ...), and SETUP's unit
 * with it: x π/180, x 200/π, x 9/10.
 */
export function nextAngle(): void {
  const unit = peek(KEEP_ANGLE)
  const k = WORK
  if (unit === 0) {
    math(M_PI, k, 0, 0)
    math(M_MUL, KEEP_ANS, k, 0)
    wholeInto(k, 180)
    math(M_DIV, KEEP_ANS, k, 0)
  } else if (unit === 1) {
    wholeInto(k, 200)
    math(M_MUL, KEEP_ANS, k, 0)
    math(M_PI, k, 0, 0)
    math(M_DIV, KEEP_ANS, k, 0)
  } else {
    wholeInto(k, 9)
    math(M_MUL, KEEP_ANS, k, 0)
    wholeInto(k, 10)
    math(M_DIV, KEEP_ANS, k, 0)
  }
  inexact(KEEP_ANS)
  poke(KEEP_ANGLE, unit >= 2 ? 0 : unit + 1)
}

/* ---------------- the constant ---------------- */

/*
 * The constant: its operator (0: none) and its number's tokens - the number after + - and /,
 * the one before x - kept in WORK + 16 (a length, then the tokens).
 */
const CONST = WORK + 16
let constOp: u16 = 0

/** Whether a constant is kept (K on the answer). */
export function constantKept(): bool {
  return constOp !== 0
}

function numberChar(t: u16): bool {
  return (t >= 0x30 && t <= 0x39) || t === T_POINT
}

function operator(t: u16): bool {
  return t === T_PLUS || t === T_MINUS || t === T_TIMES || t === T_DIVIDE
}

/** How many tokens from `from` are a number's (digits and a point). */
function numberLength(at: u16, from: u16, length: u16): u16 {
  let n: u16 = 0
  while (from + n < length && numberChar(peek(at + from + n))) n++
  return n
}

/**
 * The line just answered: a number, an operator, a number (34+57, 68x25) keeps its constant;
 * a line of another shape lets it go, unless it is a number alone, which used it.
 */
export function noteConstant(at: u16, length: u16): void {
  const first = numberLength(at, 0, length)
  if (first === length && length > 0 && constOp !== 0) return
  constOp = 0
  if (first === 0 || first >= length) return
  const op = peek(at + first)
  const second = numberLength(at, first + 1, length)
  if (!operator(op) || second === 0 || first + 1 + second !== length) return
  constOp = op
  // x keeps the number before it; + - / the one after.
  const from: u16 = op === T_TIMES ? 0 : first + 1
  const size: u16 = op === T_TIMES ? first : second
  if (size > 24) {
    constOp = 0
    return
  }
  poke(CONST, size)
  for (let i: u16 = 0; i < size; i++) poke(CONST + 1 + i, peek(at + from + i))
}

/**
 * A line that is a number alone, with a constant kept: made the line the constant asks for
 * (45 is 45+57; 40 is 68x40), its new length; 0xffff when it is not.
 */
export function withConstant(at: u16, length: u16): u16 {
  if (constOp === 0 || length === 0 || numberLength(at, 0, length) !== length) return 0xffff
  const size = peek(CONST)
  if (length + 1 + size > 190) return 0xffff
  if (constOp === T_TIMES) {
    // The constant first: the number moved along to make room.
    for (let i = length; i > 0; i--) poke(at + i + size, peek(at + i - 1))
    for (let i: u16 = 0; i < size; i++) poke(at + i, peek(CONST + 1 + i))
    poke(at + size, T_TIMES)
  } else {
    poke(at + length, constOp)
    for (let i: u16 = 0; i < size; i++) poke(at + length + 1 + i, peek(CONST + 1 + i))
  }
  return length + 1 + size
}

/** Forgets the constant (AC, a new mode, the power). */
export function dropConstant(): void {
  constOp = 0
}
