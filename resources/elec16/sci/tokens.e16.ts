// The calculator's line (docs/elec16-sci.md section 6.2): a byte a token. A token at 0x20 or
// above is the machine's own character and is shown as itself - a digit, a sign, a bracket, a
// variable's letter, π, ×, ÷, ², ³, ⁻¹, ᴇ. One below 0x20 stands for more than a character
// (sin( and the other functions, Ans, the minus sign, the power) and is shown by its text here.
import { type bool, peek, str, type u16 } from '../../../src/shared/e16c/builtins'

/* ---------------- tokens that are characters ---------------- */

export const T_PLUS = 0x2b
export const T_MINUS = 0x2d
export const T_OPEN = 0x28
export const T_CLOSE = 0x29
export const T_POINT = 0x2e
export const T_BANG = 0x21
export const T_E = 0x65
export const T_PI = 0x80
export const T_TIMES = 0x81
export const T_DIVIDE = 0x82
export const T_SQUARE = 0x84
export const T_CUBE = 0x85
export const T_INVERSE = 0x86
export const T_EXP = 0x87

/* ---------------- tokens that stand for more ---------------- */

export const T_SIN = 0x01
export const T_COS = 0x02
export const T_TAN = 0x03
export const T_ASIN = 0x04
export const T_ACOS = 0x05
export const T_ATAN = 0x06
export const T_LOG = 0x07
export const T_LN = 0x08
export const T_SQRT = 0x09
export const T_CBRT = 0x0a
/** The sign: (−), shown as a minus. */
export const T_NEG = 0x10
/** A power: ^( with the exponent after it, closed by ) or the line's end. */
export const T_POW = 0x11
export const T_NCR = 0x12
export const T_NPR = 0x13
export const T_ANS = 0x14
/** 10 as one value, for 10ˣ: 2 10ˣ 3 is 2 x 10^3, not 210^3. */
export const T_TEN = 0x15

/*
 * The 2D display's templates (docs/elec16-sci.md section 6.2): a fraction is FRAC numerator SEP
 * denominator END, a root ROOT body END, a power POWT exponent END. The cursor is a place in the
 * tokens, so every place among the marks means something: before FRAC is before the fraction,
 * after it the numerator's start, before SEP its end, and so on.
 */
export const T_FRAC = 0x16
export const T_SEP = 0x17
export const T_END = 0x18
export const T_ROOT = 0x19
export const T_POWT = 0x1a
/** LINE's fraction: a / between two values, between the sign and nCr in strength (section 6.3). */
export const T_SLASH = 0x1b

/** Whether a token is a template's mark. */
export function isMark(t: u16): bool {
  return t >= T_FRAC && t <= T_POWT
}

/** Whether a token opens a template. */
export function opensTemplate(t: u16): bool {
  return t === T_FRAC || t === T_ROOT || t === T_POWT
}

/** Whether a token opens a function: its argument follows, closed by ) or the line's end. */
export function isFunction(t: u16): bool {
  return t >= T_SIN && t <= T_CBRT
}

/** Whether a token is a variable: A-F, X, Y, M. */
export function isVariable(t: u16): bool {
  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
}

export function isDigit(t: u16): bool {
  return t >= 0x30 && t <= 0x39
}

/** What a token below 0x20 shows (0 for a token that is its own character). */
export function tokenText(t: u16): u16 {
  switch (t) {
    case T_SIN:
      return str('sin(')
    case T_COS:
      return str('cos(')
    case T_TAN:
      return str('tan(')
    case T_ASIN:
      return str('sin\x86(')
    case T_ACOS:
      return str('cos\x86(')
    case T_ATAN:
      return str('tan\x86(')
    case T_LOG:
      return str('log(')
    case T_LN:
      return str('ln(')
    case T_SQRT:
      return str('\x83(')
    case T_CBRT:
      return str('\x85\x83(')
    case T_NEG:
      return str('-')
    case T_POW:
      return str('^(')
    case T_NCR:
      return str('C')
    case T_NPR:
      return str('P')
    case T_ANS:
      return str('Ans')
    case T_TEN:
      return str('10')
    // A template in LINE: brackets round its parts.
    case T_FRAC:
      return str('(')
    case T_SEP:
      return str(')/(')
    case T_END:
      return str(')')
    case T_ROOT:
      return str('\x83(')
    case T_POWT:
      return str('^(')
    case T_SLASH:
      return str('/')
  }
  return 0
}

/** How many characters a token shows as. */
export function tokenWidth(t: u16): u16 {
  if (t >= 0x20) return 1
  const text = tokenText(t)
  if (text === 0) return 1
  let n: u16 = 0
  while (peek(text + n) !== 0) n++
  return n
}
