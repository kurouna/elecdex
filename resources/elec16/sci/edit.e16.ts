// ELEC-16 SCI, ROM bank 4: editing a line with templates in it (docs/elec16-sci.md sections 5.1
// and 6.2). a/b takes the value just typed as its numerator; DEL at a template's mark goes into
// it, or takes the template away when it is empty; up and down go between a fraction's parts.
// Each works on the line's tokens in place and leaves the line's new length and cursor in
// editLength and editCursor for calc.e16.ts.
import { type bool, memcpy, peek, poke, type u16 } from '../../../src/shared/e16c/builtins'
import {
  isDigit,
  isFunction,
  isVariable,
  opensTemplate,
  T_ANS,
  T_BANG,
  T_CLOSE,
  T_CUBE,
  T_E,
  T_END,
  T_FRAC,
  T_INVERSE,
  T_OPEN,
  T_PI,
  T_POINT,
  T_POWT,
  T_SEP,
  T_SQUARE,
  T_TEN,
} from './tokens.e16'

export let editLength: u16 = 0
export let editCursor: u16 = 0

/** The template opener whose END is at `end`. */
function openerOf(buf: u16, end: u16): u16 {
  let depth: u16 = 0
  let j = end + 1
  while (j > 0) {
    j--
    const t = peek(buf + j)
    if (t === T_END) depth++
    else if (opensTemplate(t)) {
      depth--
      if (depth === 0) return j
    }
  }
  return 0
}

/** The ( or function whose ) is at `close`. */
function bracketOf(buf: u16, close: u16): u16 {
  let depth: u16 = 0
  let j = close + 1
  while (j > 0) {
    j--
    const t = peek(buf + j)
    if (t === T_CLOSE) depth++
    else if (t === T_OPEN || isFunction(t)) {
      depth--
      if (depth === 0) return j
    }
  }
  return close
}

/** Where the value just before `cur` starts: a number, a constant, a variable, a bracket or a
 * template, with its powers and postfixes; `cur` itself where there is none. */
function operandStart(buf: u16, cur: u16): u16 {
  let j = pastPostfixes(buf, cur)
  if (j === 0) return cur
  const t = peek(buf + j - 1)
  if (isDigit(t) || t === T_POINT) {
    while (j > 0 && (isDigit(peek(buf + j - 1)) || peek(buf + j - 1) === T_POINT)) j--
    return j
  }
  if (t === T_PI || t === T_E || t === T_ANS || t === T_TEN || isVariable(t)) return j - 1
  if (t === T_END) return openerOf(buf, j - 1)
  if (t === T_CLOSE) {
    const open = bracketOf(buf, j - 1)
    return open === j - 1 ? cur : open
  }
  return cur
}

/** Back from `cur` past the powers and postfixes, which belong to the value before them. */
function pastPostfixes(buf: u16, cur: u16): u16 {
  let j = cur
  while (j > 0) {
    const t = peek(buf + j - 1)
    if (t === T_SQUARE || t === T_CUBE || t === T_INVERSE || t === T_BANG) j--
    else if (t === T_END && peek(buf + openerOf(buf, j - 1)) === T_POWT) j = openerOf(buf, j - 1)
    else return j
  }
  return 0
}

/**
 * a/b at `cur`: the value before it made the numerator, the cursor in the denominator; with no
 * value before it, an empty fraction, the cursor in its numerator.
 */
export function fraction(buf: u16, length: u16, cur: u16): void {
  const start = operandStart(buf, cur)
  // FRAC before the numerator, SEP END after it.
  memcpy(buf + cur + 3, buf + cur, length - cur)
  memcpy(buf + start + 1, buf + start, cur - start)
  poke(buf + start, T_FRAC)
  poke(buf + cur + 1, T_SEP)
  poke(buf + cur + 2, T_END)
  editLength = length + 3
  editCursor = start === cur ? start + 1 : cur + 2
}

/** Whether the template opened at `open` has nothing in it. */
function empty(buf: u16, open: u16): bool {
  const next = peek(buf + open + 1)
  if (peek(buf + open) === T_FRAC) return next === T_SEP && peek(buf + open + 2) === T_END
  return next === T_END
}

/**
 * DEL before `cur`: a token goes; at a template's mark the cursor goes into the part before it,
 * or the template goes when it is empty.
 */
export function deleteAt(buf: u16, length: u16, cur: u16): void {
  editLength = length
  editCursor = cur
  if (cur === 0) return
  const t = peek(buf + cur - 1)
  let open: u16 = 0xffff
  if (opensTemplate(t)) open = cur - 1
  else if (t === T_SEP) open = fractionOf(buf, cur - 1)
  else if (t === T_END) {
    editCursor = cur - 1
    return
  }
  if (open === 0xffff) {
    memcpy(buf + cur - 1, buf + cur, length - cur)
    editLength = length - 1
    editCursor = cur - 1
    return
  }
  if (!empty(buf, open)) {
    editCursor = cur - 1
    return
  }
  const size: u16 = peek(buf + open) === T_FRAC ? 3 : 2
  memcpy(buf + open, buf + open + size, length - open - size)
  editLength = length - size
  editCursor = open
}

/** The FRAC whose SEP is at `sep`. */
function fractionOf(buf: u16, sep: u16): u16 {
  let depth: u16 = 0
  let j = sep
  while (j > 0) {
    j--
    const t = peek(buf + j)
    if (t === T_END) depth++
    else if (opensTemplate(t)) {
      if (depth === 0) return j
      depth--
    }
  }
  return 0
}

/** The SEP of the FRAC at `open`. */
function sepAfter(buf: u16, length: u16, open: u16): u16 {
  let depth: u16 = 0
  for (let j = open; j < length; j++) {
    const t = peek(buf + j)
    if (opensTemplate(t)) depth++
    else if (t === T_END) depth--
    else if (t === T_SEP && depth === 1) return j
  }
  return length
}

/** The END of the fraction whose SEP is at `sep`. */
function endAfter(buf: u16, length: u16, sep: u16): u16 {
  let depth: u16 = 0
  for (let j = sep + 1; j < length; j++) {
    const t = peek(buf + j)
    if (opensTemplate(t)) depth++
    else if (t === T_END) {
      if (depth === 0) return j
      depth--
    }
  }
  return length
}

/**
 * Up or down from `cur` between the parts of the fraction it is in (the nearest): to the end
 * of the other part, where typing goes on. 0xffff in editCursor when there is no fraction to
 * move in.
 */
export function vertical(buf: u16, length: u16, cur: u16, up: bool): void {
  editLength = length
  editCursor = 0xffff
  const j = partOf(buf, cur)
  if (j === 0xffff) return
  // In the numerator (j its FRAC), down goes to the denominator's end; in the denominator (j
  // its SEP), up goes to the numerator's end, before the SEP.
  if (peek(buf + j) === T_FRAC) {
    if (!up) editCursor = endAfter(buf, length, sepAfter(buf, length, j))
  } else if (up) editCursor = j
}

/** The FRAC or SEP that begins the part of the nearest fraction `cur` is in; 0xffff: none. */
function partOf(buf: u16, cur: u16): u16 {
  let depth: u16 = 0
  let j = cur
  while (j > 0) {
    j--
    const t = peek(buf + j)
    if (t === T_END) depth++
    else if (opensTemplate(t)) {
      if (depth > 0) depth--
      else if (t === T_FRAC) return j
    } else if (t === T_SEP && depth === 0) return j
  }
  return 0xffff
}
