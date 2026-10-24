// ELEC-16 SCI, ROM bank 2: a value's exact form (docs/elec16-sci.md section 6.4). Beside its
// decimal, a value keeps (p + r√s)/q while it can: p, r and q whole (each under 10^10, q above
// 0, the three with no common factor) and s 1-99 with no square factor. The four operations,
// whole powers, square roots and the special angles keep it; where the form cannot hold the
// answer (two different roots, a number too long), the value is left with its decimal alone.
// Nothing here fails: the decimal is the value, the exact form only how it may be shown.
import {
  addr,
  type bool,
  bytes,
  i16,
  memcpy,
  peek,
  peek16,
  poke16,
  u16,
} from '../../../src/shared/e16c/builtins'
import {
  copy8,
  inexact,
  isExact,
  isNegative,
  isZero,
  KEEP_ANGLE,
  M_ADD,
  M_CMP,
  M_DIV,
  M_FRAC,
  M_FROMINT,
  M_IDIV,
  M_INT,
  M_MOD,
  M_MUL,
  M_NEG,
  M_PI,
  M_POW,
  M_SQR,
  M_SUB,
  M_TOINT,
  MATH_A,
  MATH_ARG,
  MATH_B,
  MATH_OP,
  MATH_RESULT,
  MATH_STATUS,
  V_EXACT,
  V_P,
  V_Q,
  V_R,
  V_S,
  VALUE_SIZE,
} from './numbers.e16'

/* ---------------- decimals, never failing ---------------- */

/** Eight decimal numbers to work in. */
const work = bytes(64)
const W0 = 0
const W1 = 8
const W2 = 16
const W3 = 24
const W4 = 32
const W5 = 40
const W6 = 48
const W7 = 56

function w(k: u16): u16 {
  return addr(work) + k
}

/** A = A op B on the unit; whether it took it (no overflow, no division by 0). */
function run(op: u16, a: u16, b: u16): bool {
  poke16(MATH_A, a)
  poke16(MATH_B, b)
  poke16(MATH_OP, op)
  return peek16(MATH_STATUS) === 0
}

/** `dst` = `a` op `b`. */
function op3(op: u16, dst: u16, a: u16, b: u16): bool {
  if (dst !== a) copy8(a, dst)
  return run(op, dst, b)
}

function setInt(dst: u16, v: i16): void {
  poke16(MATH_ARG, u16(v))
  run(M_FROMINT, dst, 0)
}

/** Whether a whole number is under 10^10 in size: its exponent (byte 1) under 10. */
function short(n: u16): bool {
  if (isZero(n)) return true
  const e = peek(n + 1)
  return e < 10 || e >= 128
}

function isWholeDec(n: u16): bool {
  copy8(n, w(W7))
  run(M_FRAC, w(W7), 0)
  return isZero(w(W7))
}

function compare(a: u16, b: u16): i16 {
  copy8(a, w(W7))
  run(M_CMP, w(W7), b)
  return i16(peek16(MATH_RESULT))
}

/** |a|, into `dst`. */
function absInto(dst: u16, a: u16): void {
  copy8(a, dst)
  if (isNegative(dst)) run(M_NEG, dst, 0)
}

/** gcd(|a|, |b|) into `dst`, by remainders (exact). */
function gcd(dst: u16, a: u16, b: u16): void {
  absInto(w(W5), a)
  absInto(w(W6), b)
  while (!isZero(w(W6))) {
    copy8(w(W5), w(W7))
    run(M_MOD, w(W7), w(W6))
    copy8(w(W6), w(W5))
    copy8(w(W7), w(W6))
  }
  copy8(w(W5), dst)
}

/* ---------------- a value's exact form ---------------- */

/**
 * The form at `v`: p, r, q at `v` + V_P, V_R, V_Q; s, a word at V_S, is 1 here and set after
 * where there is a root (e16c takes four arguments).
 */
function setForm(v: u16, p: u16, r: u16, q: u16): void {
  copy8(p, v + V_P)
  copy8(r, v + V_R)
  copy8(q, v + V_Q)
  poke16(v + V_S, 1)
  poke16(v + V_EXACT, 1)
}

/**
 * The form made whole again: q above 0, no common factor, s 1 when there is no root. A part
 * longer than ten digits leaves the value with its decimal alone.
 */
function normalize(v: u16): void {
  const p = v + V_P
  const r = v + V_R
  const q = v + V_Q
  if (isZero(q)) {
    inexact(v)
    return
  }
  if (isNegative(q)) {
    run(M_NEG, p, 0)
    run(M_NEG, r, 0)
    run(M_NEG, q, 0)
  }
  if (isZero(r)) poke16(v + V_S, 1)
  if (isZero(p) && isZero(r)) {
    setInt(q, 1)
  } else {
    gcd(w(W0), p, r)
    gcd(w(W0), w(W0), q)
    run(M_IDIV, p, w(W0))
    run(M_IDIV, r, w(W0))
    run(M_IDIV, q, w(W0))
  }
  if (!short(p) || !short(r) || !short(q)) inexact(v)
}

/** A whole decimal under 10^10 is its own form; anything else has none. */
export function exactWhole(v: u16): void {
  if (!isWholeDec(v) || !short(v)) {
    inexact(v)
    return
  }
  setInt(w(W1), 0)
  setInt(w(W2), 1)
  setForm(v, v, w(W1), w(W2))
}

/** A number as typed: a decimal with up to ten places is a fraction over a power of ten. */
export function exactLiteral(v: u16): void {
  setInt(w(W3), 1)
  setInt(w(W4), 10)
  copy8(v, w(W2))
  for (let k: u16 = 0; k <= 10; k++) {
    if (isWholeDec(w(W2))) {
      if (!short(w(W2))) break
      setInt(w(W1), 0)
      setForm(v, w(W2), w(W1), w(W3))
      normalize(v)
      return
    }
    run(M_MUL, w(W2), w(W4))
    run(M_MUL, w(W3), w(W4))
  }
  inexact(v)
}

export function exactNeg(v: u16): void {
  if (!isExact(v)) return
  run(M_NEG, v + V_P, 0)
  run(M_NEG, v + V_R, 0)
}

/* ---------------- the arithmetic ---------------- */

const tmpA = bytes(36)
const tmpB = bytes(36)

/** `a` op `b` into `a`'s form (the decimal is already done): +, -, x, / or a whole power. */
export function exactBinary(op: u16, a: u16, b: u16): void {
  if (!isExact(a) || !isExact(b)) {
    inexact(a)
    return
  }
  if (op === M_ADD || op === M_SUB) addSub(a, b, op === M_SUB)
  else if (op === M_MUL) mulInto(a, b)
  else if (op === M_DIV) divInto(a, b)
  else if (op === M_POW) powInto(a, b)
  else inexact(a)
}

/** Whether two forms can be added: one is rational, or both have the same root. */
function sameRoot(a: u16, b: u16): bool {
  return isZero(a + V_R) || isZero(b + V_R) || peek16(a + V_S) === peek16(b + V_S)
}

function rootOf(a: u16, b: u16): u16 {
  return isZero(a + V_R) ? peek16(b + V_S) : peek16(a + V_S)
}

/** a ± b: (pa qb ± pb qa + (ra qb ± rb qa)√s) / qa qb. */
function addSub(a: u16, b: u16, minus: bool): void {
  if (!sameRoot(a, b)) {
    inexact(a)
    return
  }
  const s = rootOf(a, b)
  const sum = minus ? M_SUB : M_ADD
  const ok =
    op3(M_MUL, w(W1), a + V_P, b + V_Q) &&
    op3(M_MUL, w(W2), b + V_P, a + V_Q) &&
    run(sum, w(W1), w(W2)) &&
    op3(M_MUL, w(W2), a + V_R, b + V_Q) &&
    op3(M_MUL, w(W3), b + V_R, a + V_Q) &&
    run(sum, w(W2), w(W3)) &&
    op3(M_MUL, w(W3), a + V_Q, b + V_Q)
  if (!ok) {
    inexact(a)
    return
  }
  setForm(a, w(W1), w(W2), w(W3))
  poke16(a + V_S, s)
  normalize(a)
}

/** a x b: (pa pb + ra rb s + (pa rb + pb ra)√s) / qa qb, when the roots agree. */
function mulInto(a: u16, b: u16): void {
  if (!sameRoot(a, b)) {
    inexact(a)
    return
  }
  const s = rootOf(a, b)
  setInt(w(W4), i16(s))
  const ok =
    op3(M_MUL, w(W1), a + V_P, b + V_P) &&
    op3(M_MUL, w(W2), a + V_R, b + V_R) &&
    run(M_MUL, w(W2), w(W4)) &&
    run(M_ADD, w(W1), w(W2)) &&
    op3(M_MUL, w(W2), a + V_P, b + V_R) &&
    op3(M_MUL, w(W3), b + V_P, a + V_R) &&
    run(M_ADD, w(W2), w(W3)) &&
    op3(M_MUL, w(W3), a + V_Q, b + V_Q)
  if (!ok) {
    inexact(a)
    return
  }
  setForm(a, w(W1), w(W2), w(W3))
  poke16(a + V_S, s)
  normalize(a)
}

/** 1 / b into `dst`: the root moved up, q (p - r√s) / (p² - r² s). */
function inverseInto(dst: u16, b: u16): bool {
  const s = peek16(b + V_S)
  setInt(w(W4), i16(s))
  const ok =
    op3(M_MUL, w(W1), b + V_Q, b + V_P) &&
    op3(M_MUL, w(W2), b + V_Q, b + V_R) &&
    run(M_NEG, w(W2), 0) &&
    op3(M_MUL, w(W3), b + V_P, b + V_P) &&
    op3(M_MUL, w(W0), b + V_R, b + V_R) &&
    run(M_MUL, w(W0), w(W4)) &&
    run(M_SUB, w(W3), w(W0))
  if (!ok || isZero(w(W3))) return false
  setForm(dst, w(W1), w(W2), w(W3))
  poke16(dst + V_S, s)
  normalize(dst)
  return isExact(dst)
}

function divInto(a: u16, b: u16): void {
  if (!inverseInto(addr(tmpB), b)) {
    inexact(a)
    return
  }
  mulInto(a, addr(tmpB))
}

/** a ^ n for a whole n from -64 to 64: a multiplied by itself, or by its inverse. */
function powInto(a: u16, b: u16): void {
  if (!isZero(b + V_R) || !isWholeDec(b + V_Q) || compare(b + V_Q, oneAt()) !== 0) {
    inexact(a)
    return
  }
  copy8(b + V_P, w(W7))
  run(M_TOINT, w(W7), 0)
  let n = i16(peek16(MATH_ARG))
  if (n > 64 || n < -64) {
    inexact(a)
    return
  }
  memcpy(addr(tmpA), a, VALUE_SIZE)
  if (n < 0) {
    if (!inverseInto(addr(tmpA), a)) {
      inexact(a)
      return
    }
    n = -n
  }
  setInt(w(W1), 1)
  setInt(w(W2), 0)
  setForm(a, w(W1), w(W2), w(W1))
  for (let k: i16 = 0; k < n && isExact(a); k++) mulInto(a, addr(tmpA))
}

const one = bytes(8)
function oneAt(): u16 {
  setInt(addr(one), 1)
  return addr(one)
}

/* ---------------- square roots ---------------- */

/** Whether `s` (1-99) has no square factor. */
function squarefree(s: u16): bool {
  for (let d: u16 = 2; d * d <= s; d++) {
    if (s % (d * d) === 0) return false
  }
  return true
}

/** Whether pq (in W1) is k² s, k then in W4. */
function squareTimes(s: u16): bool {
  setInt(w(W2), i16(s))
  copy8(w(W1), w(W3))
  run(M_MOD, w(W3), w(W2))
  if (!isZero(w(W3))) return false
  copy8(w(W1), w(W3))
  run(M_IDIV, w(W3), w(W2))
  copy8(w(W3), w(W4))
  run(M_SQR, w(W4), 0)
  if (!isWholeDec(w(W4))) return false
  copy8(w(W4), w(W0))
  run(M_MUL, w(W0), w(W4))
  return compare(w(W0), w(W3)) === 0
}

/**
 * √(p/q) = √(pq)/q, pq = k² s with s as small as can be (99 at most): a fraction, a root, or
 * neither (pq too long, or no s under 100).
 */
export function exactSqrt(v: u16): void {
  if (!isExact(v) || !isZero(v + V_R) || isNegative(v + V_P)) {
    inexact(v)
    return
  }
  if (isZero(v + V_P)) return
  if (!op3(M_MUL, w(W1), v + V_P, v + V_Q) || peek(w(W1) + 1) >= 12) {
    inexact(v)
    return
  }
  for (let s: u16 = 1; s < 100; s++) {
    if (!squarefree(s) || !squareTimes(s)) continue
    setInt(w(W2), 0)
    copy8(v + V_Q, w(W3))
    if (s === 1) setForm(v, w(W4), w(W2), w(W3))
    else {
      setForm(v, w(W2), w(W4), w(W3))
      poke16(v + V_S, s)
    }
    normalize(v)
    return
  }
  inexact(v)
}

/* ---------------- the special angles ---------------- */

/** SIN, COS, TAN as the trig functions are numbered here. */
export const TRIG_SIN = 0
export const TRIG_COS = 1
export const TRIG_TAN = 2

/**
 * The angle at `arg` as a multiple of 15 degrees, 0-23; 0xffff when it is none. In DEG the
 * exact form must be a whole multiple; in RAD and GRAD the decimal is taken when it is within
 * a billionth of one (π is no fraction).
 */
function angleIndex(arg: u16): u16 {
  const angle = peek(KEEP_ANGLE)
  if (angle === 0) {
    if (!isExact(arg) || !isZero(arg + V_R)) return 0xffff
    setInt(w(W2), 15)
    if (!op3(M_MUL, w(W1), arg + V_Q, w(W2))) return 0xffff
    copy8(arg + V_P, w(W3))
    run(M_MOD, w(W3), w(W1))
    if (!isZero(w(W3))) return 0xffff
    copy8(arg + V_P, w(W3))
    run(M_IDIV, w(W3), w(W1))
  } else if (!nearWhole(arg, angle)) return 0xffff
  setInt(w(W2), 24)
  run(M_MOD, w(W3), w(W2))
  run(M_TOINT, w(W3), 0)
  const k = i16(peek16(MATH_ARG))
  return u16(k < 0 ? k + 24 : k)
}

/**
 * RAD and GRAD: t = arg x 12 / π (RAD) or arg x 3 / 50 (GRAD) into W3, made the whole number it
 * is within 10⁻⁹ of; false when it is near none.
 */
function nearWhole(arg: u16, angle: u16): bool {
  copy8(arg, w(W3))
  if (angle === 1) {
    setInt(w(W2), 12)
    run(M_MUL, w(W3), w(W2))
    run(M_PI, w(W2), 0)
    run(M_DIV, w(W3), w(W2))
  } else {
    setInt(w(W2), 3)
    run(M_MUL, w(W3), w(W2))
    setInt(w(W2), 50)
    run(M_DIV, w(W3), w(W2))
  }
  // Rounded: INT(t + 1/2), then how far t was from it.
  setInt(w(W2), 1)
  setInt(w(W4), 2)
  run(M_DIV, w(W2), w(W4))
  copy8(w(W3), w(W1))
  run(M_ADD, w(W1), w(W2))
  run(M_INT, w(W1), 0)
  copy8(w(W3), w(W4))
  run(M_SUB, w(W4), w(W1))
  absInto(w(W4), w(W4))
  // 0 itself only: a tiny angle is near 0 by far less than 10⁻⁹ and is no special one.
  if (isZero(w(W1)) && !isZero(w(W4))) return false
  setInt(w(W2), 1)
  setInt(w(W0), 1000)
  run(M_DIV, w(W2), w(W0))
  run(M_DIV, w(W2), w(W0))
  run(M_DIV, w(W2), w(W0))
  if (compare(w(W4), w(W2)) > 0) return false
  copy8(w(W1), w(W3))
  return true
}

/** Where setSmall puts its form: the trig function's answer. */
let smallAt: u16 = 0

/** The form p + r√s over q from small whole numbers, at smallAt. */
function setSmall(p: i16, r: i16, s: u16, q: u16): void {
  setInt(w(W1), p)
  setInt(w(W2), r)
  setInt(w(W3), i16(q))
  setForm(smallAt, w(W1), w(W2), w(W3))
  poke16(smallAt + V_S, s)
}

/** sin(k x 15°) at smallAt; false where it has no form (15° and its odd multiples). */
function sinSpecial(k: u16): bool {
  const half = k % 12
  const sign: i16 = k >= 12 ? -1 : 1
  switch (half) {
    case 0:
      setSmall(0, 0, 1, 1)
      return true
    case 2:
    case 10:
      setSmall(sign, 0, 1, 2)
      return true
    case 3:
    case 9:
      setSmall(0, sign, 2, 2)
      return true
    case 4:
    case 8:
      setSmall(0, sign, 3, 2)
      return true
    case 6:
      setSmall(sign, 0, 1, 1)
      return true
  }
  return false
}

/** tan(k x 15°) at smallAt, a period of 12; false at 90° (the decimal has failed already). */
function tanSpecial(k: u16): bool {
  switch (k % 12) {
    case 0:
      setSmall(0, 0, 1, 1)
      return true
    case 1:
      setSmall(2, -1, 3, 1)
      return true
    case 2:
      setSmall(0, 1, 3, 3)
      return true
    case 3:
      setSmall(1, 0, 1, 1)
      return true
    case 4:
      setSmall(0, 1, 3, 1)
      return true
    case 5:
      setSmall(2, 1, 3, 1)
      return true
    case 7:
      setSmall(-2, -1, 3, 1)
      return true
    case 8:
      setSmall(0, -1, 3, 1)
      return true
    case 9:
      setSmall(-1, 0, 1, 1)
      return true
    case 10:
      setSmall(0, -1, 3, 3)
      return true
    case 11:
      setSmall(-2, 1, 3, 1)
      return true
  }
  return false
}

/**
 * A trig function's answer at `v` (its decimal done), from the argument as it was (`arg`): the
 * exact form at a special angle, or a whole answer as itself, or none.
 */
export function exactTrig(f: u16, v: u16, arg: u16): void {
  const k = angleIndex(arg)
  smallAt = v
  let found = false
  if (k !== 0xffff) {
    if (f === TRIG_SIN) found = sinSpecial(k)
    else if (f === TRIG_COS) found = sinSpecial((k + 6) % 24)
    else found = tanSpecial(k)
  }
  if (!found) exactWhole(v)
}
