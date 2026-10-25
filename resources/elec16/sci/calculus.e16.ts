// ELEC-16 SCI, ROM bank 8 beside BASE: Σ, Π, d/dx and ∫ of a line in X (docs/
// elec16-sci.md sections 14.5 and 15.2). Each reads its body - the tokens up to its first comma - again
// for every X it needs, through the evaluation's own reading (eval.e16.ts evalSum), and puts X
// back as it was when it is done. Σ adds exactly and Π multiplies exactly; d/dx and ∫ are decimals in ten digits.
import {
  addr,
  type bool,
  bytes,
  i16,
  peek,
  peek16,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { evalSum, evalToken } from './eval.e16'
import { exactBinary } from './exact.e16'
import {
  copy8,
  copyValue,
  E_MATH,
  E_SYNTAX,
  fail,
  holdX,
  INTEGRAL_WORK,
  inexact,
  isNegative,
  isZero,
  M_ABS,
  M_ADD,
  M_CMP,
  M_DIV,
  M_FRAC,
  M_MUL,
  M_PARSE,
  M_RNDTO,
  M_SUB,
  M_TOINT,
  MATH_ARG,
  MATH_RESULT,
  math,
  pop,
  push,
  pushInt,
  releaseX,
  top,
  VALUE_SIZE,
  varAt,
  wholeInto,
} from './numbers.e16'
import {
  isFunction,
  isSeparator,
  opensTemplate,
  T_CLOSE,
  T_COMMA,
  T_DERIV,
  T_END,
  T_INTEG,
  T_OPEN,
  T_POW,
  T_PROD,
} from './tokens.e16'

const X_LETTER = 0x58

/**
 * Whether the Σ starting is Π's, its terms multiplied: read once as it starts, since a Σ or Π
 * in its body sets it again (found in a review: Σ(Π(2,1,1),1,3) was 0).
 */
let multiplying: bool = false

/**
 * Σ(, Π(, d/dx( or ∫( (`t`), its arguments from `p` on: its answer on the stack in their place,
 * and where the reading goes on.
 */
export function calculus(t: u16, p: u16, at: u16): u16 {
  const body = p
  let q = nextArgument(bodyEnd(body))
  const a = top()
  if (t !== T_DERIV) q = nextArgument(q)
  if (evalToken(q) === T_CLOSE) q++
  const saved = push(at)
  copyValue(varAt(X_LETTER), saved)
  holdX()
  if (t === T_DERIV) derivative(body, a, at)
  else if (t === T_INTEG) integral(body, a, a + VALUE_SIZE, at)
  else {
    multiplying = t === T_PROD
    sigma(body, a, a + VALUE_SIZE, at)
  }
  copyValue(saved, varAt(X_LETTER))
  releaseX()
  pop()
  if (t !== T_DERIV) pop()
  return q
}

/** A comma at `q`, then an argument read onto the stack: where its reading stopped. */
function nextArgument(q: u16): u16 {
  if (evalToken(q) !== T_COMMA) fail(E_SYNTAX, q)
  return evalSum(q + 1)
}

/* ---------------- the body ---------------- */

/** What is open where the body is being read: a bracket or a function (1), a template (2). */
const opened = bytes(24)

/**
 * The body's end from `from`: its comma, not counting one inside a bracket (^( too), a function
 * or a template. A function a template's part ends without its ) closes there, as the evaluation
 * reads it.
 */
function bodyEnd(from: u16): u16 {
  let depth: u16 = 0
  let p = from
  for (;;) {
    const t = evalToken(p)
    if (t === 0 || (depth === 0 && (t === T_COMMA || t === T_CLOSE))) return p
    depth = depthAfter(t, depth, p)
    p++
  }
}

/** What is open after token `t` at `p`, `depth` things open before it. */
function depthAfter(t: u16, depth: u16, p: u16): u16 {
  if (t === T_OPEN || t === T_POW || isFunction(t)) return opening(depth, 1, p)
  if (opensTemplate(t)) return opening(depth, 2, p)
  if (t === T_CLOSE) return depth - 1
  if (!isSeparator(t) && t !== T_END) return depth
  // A template's part ends: what it left open closes with it, and END closes the template.
  let d = depth
  while (d > 0 && opened[d - 1] === 1) d--
  if (t === T_END && d > 0) d--
  return d
}

function opening(depth: u16, kind: u16, p: u16): u16 {
  if (depth >= 24) fail(E_SYNTAX, p)
  opened[depth] = kind
  return depth + 1
}

/** The body with X at the value `x` (its exact form too): its value on top of the stack. */
function bodyAt(body: u16, x: u16): void {
  copyValue(x, varAt(X_LETTER))
  evalSum(body)
}

/* ---------------- Σ ---------------- */

/** Σ: X from a to b (whole, at most 1000 terms), the terms added exactly into a; Π multiplies. */
function sigma(body: u16, a: u16, b: u16, at: u16): void {
  const terms = termCount(a, b, at)
  const times = multiplying
  const sum = pushInt(times ? 1 : 0, at)
  const x = push(at)
  copyValue(a, x)
  for (let i: u16 = 0; i < terms; i++) {
    bodyAt(body, x)
    if (times) {
      math(M_MUL, sum, top(), at)
      exactBinary(M_MUL, sum, top())
      pop()
    } else addTop(sum, at)
    pushInt(1, at)
    addTop(x, at)
  }
  copyValue(sum, a)
  pop()
  pop()
}

/** The value on top added to `into`, its exact form too, and taken off the stack. */
function addTop(into: u16, at: u16): void {
  math(M_ADD, into, top(), at)
  exactBinary(M_ADD, into, top())
  pop()
}

/** How many terms from a to b: both whole, a <= b, at most 1000; MATH otherwise. */
function termCount(a: u16, b: u16, at: u16): u16 {
  const d = push(at)
  copy8(b, d)
  math(M_SUB, d, a, at)
  if (!isWholeAt(a, at) || !isWholeAt(b, at) || isNegative(d)) fail(E_MATH, at)
  pushInt(999, at)
  math(M_CMP, d, top(), at)
  pop()
  if (i16(peek16(MATH_RESULT)) > 0) fail(E_MATH, at)
  math(M_TOINT, d, 0, at)
  pop()
  return peek16(MATH_ARG) + 1
}

function isWholeAt(v: u16, at: u16): bool {
  const f = push(at)
  copy8(v, f)
  math(M_FRAC, f, 0, at)
  const whole = isZero(f)
  pop()
  return whole
}

/* ---------------- d/dx ---------------- */

/**
 * d/dx at a, into a: central differences at h = |a|/100 (1/100 at 0), h/2 and h/4, their
 * errors taken out by Richardson's extrapolation twice. Rounded to ten digits, or to nine
 * when the last two extrapolations differ past the tenth: the twelve digits of each value
 * the body gives leave no more.
 */
function derivative(body: u16, a: u16, at: u16): void {
  const h = push(at)
  copy8(a, h)
  math(M_ABS, h, 0, at)
  if (isZero(h)) {
    pushInt(1, at)
    copy8(top(), h)
    pop()
  }
  pushInt(100, at)
  math(M_DIV, h, top(), at)
  pop()
  central(body, a, h, at)
  halveStep(h, at)
  central(body, a, h, at)
  halveStep(h, at)
  central(body, a, h, at)
  const d3 = top()
  const d2 = d3 - VALUE_SIZE
  const d1 = d2 - VALUE_SIZE
  // E1 = (4 d2 - d1)/3 into d1, E2 = (4 d3 - d2)/3 into d2; |E2 - E1| into d3.
  richardson(d1, d2, 4, at)
  richardson(d2, d3, 4, at)
  copy8(d2, d3)
  math(M_SUB, d3, d1, at)
  math(M_ABS, d3, 0, at)
  // The answer, (16 E2 - E1)/15, into d1.
  richardson(d1, d2, 16, at)
  // |E2 - E1| x 10^10 past |answer|: the tenth digit is not to be trusted.
  pushInt(100, at)
  for (let k: u16 = 0; k < 5; k++) math(M_MUL, d3, top(), at)
  pop()
  copy8(d1, d2)
  math(M_ABS, d2, 0, at)
  math(M_CMP, d3, d2, at)
  poke16(MATH_ARG, i16(peek16(MATH_RESULT)) > 0 ? 9 : 10)
  math(M_RNDTO, d1, 0, at)
  copy8(d1, a)
  inexact(a)
  pop()
  pop()
  pop()
  pop()
}

/** h halved. */
function halveStep(h: u16, at: u16): void {
  pushInt(2, at)
  math(M_DIV, h, top(), at)
  pop()
}

/** (k x fine - coarse) / (k - 1), into `coarse`. */
function richardson(coarse: u16, fine: u16, k: u16, at: u16): void {
  const t = push(at)
  copy8(fine, t)
  pushInt(k, at)
  math(M_MUL, t, top(), at)
  pop()
  math(M_SUB, t, coarse, at)
  pushInt(k - 1, at)
  math(M_DIV, t, top(), at)
  pop()
  copy8(t, coarse)
  pop()
}

/** (f(a + h) - f(a - h)) / 2h onto the stack. */
function central(body: u16, a: u16, h: u16, at: u16): void {
  const out = push(at)
  const x = push(at)
  copy8(a, x)
  math(M_ADD, x, h, at)
  bodyAt(body, x)
  copy8(a, x)
  math(M_SUB, x, h, at)
  bodyAt(body, x)
  const fm = top()
  const fp = fm - VALUE_SIZE
  math(M_SUB, fp, fm, at)
  copy8(h, fm)
  math(M_ADD, fm, h, at)
  math(M_DIV, fp, fm, at)
  copy8(fp, out)
  pop()
  pop()
  pop()
}

/** A decimal rounded to ten significant digits, as the display has them. */
function tenDigits(v: u16, at: u16): void {
  poke16(MATH_ARG, 10)
  math(M_RNDTO, v, 0, at)
}

/* ---------------- ∫ ---------------- */

/**
 * ∫'s room (numbers.e16.ts INTEGRAL_WORK): the intervals still to do, the Gauss-Kronrod nodes
 * and weights read out of their text, and its numbers. One ∫ at a time: ∫ in ∫ is MATH.
 */
const INTERVALS = INTEGRAL_WORK
const MAX_INTERVALS = 24
const NODES = INTEGRAL_WORK + 384
const I_SLOTS = INTEGRAL_WORK + 544
let integrating: bool = false

/** Ready for a new line: an ∫ an error stopped is not still going. */
export function integralReset(): void {
  integrating = false
}

function slot(k: u16): u16 {
  return I_SLOTS + k * 8
}

const I_LO = 0
const I_HI = 1
const I_CENTRE = 2
const I_HALF = 3
const I_KRONROD = 4
const I_GAUSS = 5
const I_ABS = 6
const I_F = 7
const I_SPARE = 8
const I_TOTAL = 9
const I_SCALE = 10
const I_WIDTH = 11
const I_LIMIT = 12
const I_EPS = 13
const I_TINY = 14
const I_A = 15
const I_SPAN = 16
const I_T = 17
const I_WEIGHT = 18

/**
 * QUADPACK's 15-point Kronrod nodes (x 0-7, 7 the centre) and weights, and the 7-point Gauss
 * weights on nodes 1, 3, 5 and the centre, in twelve digits; then the tolerance and the
 * narrowest interval, as parts of the whole.
 */
function nodeText(): u16 {
  return str(
    '0.991455371121|0.949107912343|0.864864423360|0.741531185599|0.586087235468|0.405845151377|0.207784955008|0|0.0229353220105|0.0630920926300|0.104790010322|0.140653259716|0.169004726639|0.190350578065|0.204432940075|0.209482141085|0.129484966169|0.279705391489|0.381830050505|0.417959183673|1E-10|1E-12',
  )
}

/** A number's text copied out of the ROM: PARSE reads RAM only. */
const nodeChars = bytes(16)

/** The 22 numbers of nodeText into NODES (the last two into EPS and TINY). */
function readNodes(at: u16): void {
  let p = nodeText()
  for (let k: u16 = 0; k < 22; k++) {
    let n: u16 = 0
    while (peek(p + n) !== 0x7c && peek(p + n) !== 0) {
      nodeChars[n] = peek(p + n)
      n++
    }
    poke16(MATH_ARG, n)
    math(M_PARSE, k < 20 ? NODES + k * 8 : slot(I_EPS + k - 20), addr(nodeChars), at)
    p += n + 1
  }
}

function xk(j: u16): u16 {
  return NODES + j * 8
}

function wk(j: u16): u16 {
  return NODES + 64 + j * 8
}

function wg(j: u16): u16 {
  return NODES + 128 + j * 8
}

/**
 * ∫ from a to b into a, as ∫ from 0 to 1 in t of f(x) dx/dt with x = a + (b - a)(3t² - 2t³):
 * dx/dt is 0 at both ends, so an end where f runs off like 1/√x is smooth in t, and a
 * polynomial stays one. An interval's 15-point Kronrod sum against its 7-point Gauss sum; one
 * whose difference passes its share of the tolerance (10⁻¹⁰ of ∫|f| over the whole) is halved,
 * until it is a 10⁻¹² part of the whole or the intervals run out. Ten digits.
 */
function integral(body: u16, a: u16, b: u16, at: u16): void {
  if (integrating) fail(E_MATH, at)
  integrating = true
  readNodes(at)
  const x = push(at)
  zeroAt(slot(I_TOTAL))
  copy8(a, slot(I_A))
  copy8(b, slot(I_SPAN))
  math(M_SUB, slot(I_SPAN), a, at)
  wholeInto(slot(I_WIDTH), 1)
  let count: u16 = 0
  if (!isZero(slot(I_SPAN))) {
    wholeInto(INTERVALS, 0)
    wholeInto(INTERVALS + 8, 1)
    count = 1
  }
  let first = true
  while (count > 0) {
    count--
    copy8(INTERVALS + count * 16, slot(I_LO))
    copy8(INTERVALS + count * 16 + 8, slot(I_HI))
    kronrod(body, x, at)
    if (first) copy8(slot(I_ABS), slot(I_SCALE))
    first = false
    if (good(at) || count + 2 > MAX_INTERVALS) math(M_ADD, slot(I_TOTAL), slot(I_KRONROD), at)
    else {
      // The upper half to do after the lower: the lower goes on top.
      copy8(slot(I_CENTRE), INTERVALS + count * 16)
      copy8(slot(I_HI), INTERVALS + count * 16 + 8)
      copy8(slot(I_LO), INTERVALS + count * 16 + 16)
      copy8(slot(I_CENTRE), INTERVALS + count * 16 + 24)
      count += 2
    }
  }
  pop()
  copy8(slot(I_TOTAL), a)
  tenDigits(a, at)
  inexact(a)
  integrating = false
}

function zeroAt(v: u16): void {
  for (let i: u16 = 0; i < 8; i += 2) poke16(v + i, 0)
}

/**
 * Whether the interval's Kronrod sum is good enough: |K - G| within EPS x SCALE x its width /
 * the whole's, or the interval a TINY part of the whole.
 */
function good(at: u16): bool {
  const width = slot(I_LIMIT)
  copy8(slot(I_HI), width)
  math(M_SUB, width, slot(I_LO), at)
  math(M_ABS, width, 0, at)
  math(M_DIV, width, slot(I_WIDTH), at)
  math(M_CMP, width, slot(I_TINY), at)
  if (i16(peek16(MATH_RESULT)) <= 0) return true
  math(M_MUL, width, slot(I_SCALE), at)
  math(M_MUL, width, slot(I_EPS), at)
  const diff = slot(I_SPARE)
  copy8(slot(I_KRONROD), diff)
  math(M_SUB, diff, slot(I_GAUSS), at)
  math(M_ABS, diff, 0, at)
  math(M_CMP, diff, width, at)
  return i16(peek16(MATH_RESULT)) <= 0
}

/** The 15-point Kronrod and 7-point Gauss sums over LO..HI, and the Kronrod sum of |f|. */
function kronrod(body: u16, x: u16, at: u16): void {
  copy8(slot(I_LO), slot(I_CENTRE))
  math(M_ADD, slot(I_CENTRE), slot(I_HI), at)
  pushInt(2, at)
  math(M_DIV, slot(I_CENTRE), top(), at)
  copy8(slot(I_HI), slot(I_HALF))
  math(M_SUB, slot(I_HALF), slot(I_CENTRE), at)
  pop()
  zeroAt(slot(I_KRONROD))
  zeroAt(slot(I_GAUSS))
  zeroAt(slot(I_ABS))
  copy8(slot(I_CENTRE), x)
  fOf(body, x, at)
  weigh(wk(7), wg(3), at)
  for (let j: u16 = 0; j < 7; j++) {
    for (let side: u16 = 0; side < 2; side++) {
      copy8(slot(I_HALF), x)
      math(M_MUL, x, xk(j), at)
      if (side === 0) math(M_ADD, x, slot(I_CENTRE), at)
      else {
        copy8(x, slot(I_SPARE))
        copy8(slot(I_CENTRE), x)
        math(M_SUB, x, slot(I_SPARE), at)
      }
      fOf(body, x, at)
      weigh(wk(j), (j & 1) !== 0 ? wg(j >> 1) : 0, at)
    }
  }
  for (let k: u16 = I_KRONROD; k <= I_ABS; k++) math(M_MUL, slot(k), slot(I_HALF), at)
  math(M_ABS, slot(I_ABS), 0, at)
}

/** f(x) dx/dt at t (8 bytes at `x`, made x) into F1: x = a + (b - a)(3 - 2t)t², dx/dt = 6t(1 - t)(b - a). */
function fOf(body: u16, x: u16, at: u16): void {
  const t = slot(I_T)
  const w = slot(I_WEIGHT)
  copy8(x, t)
  wholeInto(w, 2)
  math(M_MUL, w, t, at)
  wholeInto(x, 3)
  math(M_SUB, x, w, at)
  math(M_MUL, x, t, at)
  math(M_MUL, x, t, at)
  math(M_MUL, x, slot(I_SPAN), at)
  math(M_ADD, x, slot(I_A), at)
  wholeInto(w, 1)
  math(M_SUB, w, t, at)
  math(M_MUL, w, t, at)
  math(M_MUL, w, slot(I_SPAN), at)
  wholeInto(slot(I_F), 6)
  math(M_MUL, w, slot(I_F), at)
  inexact(x)
  bodyAt(body, x)
  copy8(top(), slot(I_F))
  pop()
  math(M_MUL, slot(I_F), w, at)
}

/** F1 weighed into the Kronrod sum, the Gauss sum (`gauss`, 0 for none) and the sum of |f|. */
function weigh(kronrodWeight: u16, gauss: u16, at: u16): void {
  const s = slot(I_SPARE)
  copy8(slot(I_F), s)
  math(M_MUL, s, kronrodWeight, at)
  math(M_ADD, slot(I_KRONROD), s, at)
  if (gauss !== 0) {
    copy8(slot(I_F), s)
    math(M_MUL, s, gauss, at)
    math(M_ADD, slot(I_GAUSS), s, at)
  }
  copy8(slot(I_F), s)
  math(M_ABS, s, 0, at)
  math(M_MUL, s, kronrodWeight, at)
  math(M_ADD, slot(I_ABS), s, at)
}
