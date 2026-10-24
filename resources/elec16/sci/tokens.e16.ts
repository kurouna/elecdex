// The calculator's line (docs/elec16-sci.md section 6.2): a byte a token. A token from 0x20
// to 0xDF is the machine's own character and is shown as itself - a digit, a sign, a bracket,
// a variable's letter, π, ×, ÷, ², ³, ⁻¹, ᴇ, ° ′ ″, %, the comma. One below 0x20 or from 0xE0
// (where the font has no characters) stands for more than a character - sin( and the other
// functions, Ans, the minus sign, the power, a template's marks - and is shown by its text.
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
/** Degrees, minutes and seconds: 12°30′15″. */
export const T_DEG = 0x88
export const T_MIN = 0x89
export const T_SEC = 0x8a
/** A percentage: x% is x / 100. */
export const T_PERCENT = 0x25
/** Between a function's two arguments: gcd(12,18), pol(3,4). */
export const T_COMMA = 0x2c

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

/**
 * A mixed number, a b/c: MIXED whole MSEP numerator MDIV denominator END (S5). Its marks are
 * its own, not a fraction's, so the line reads (a b/c) in LINE.
 */
export const T_MIXED = 0x1c
export const T_MSEP = 0x1d
export const T_MDIV = 0x1f
/** A root of any index, ʸ√x: XROOT index XSEP body END, ( index )√( body ) in LINE. */
export const T_XROOT = 0x1e
export const T_XSEP = 0x0b

/* Functions where the font has no characters (S5). */
export const T_SINH = 0xe0
export const T_COSH = 0xe1
export const T_TANH = 0xe2
export const T_ASINH = 0xe3
export const T_ACOSH = 0xe4
export const T_ATANH = 0xe5
export const T_ABS = 0xe6
export const T_GCD = 0xe7
export const T_LCM = 0xe8
export const T_INT = 0xe9
/** round(: rounded as the display shows a number (FIX, EXP or ten digits). */
export const T_RND = 0xea
export const T_POL = 0xeb
export const T_REC = 0xec
/** rand: a random number from 0 up to 1 - a value, not a function. */
export const T_RAN = 0xed
/* BASE's logic (S6): AND is stronger than OR, XOR and XNOR; not( and neg( are functions. */
export const T_AND = 0xee
export const T_OR = 0xef
export const T_XOR = 0xf0
export const T_XNOR = 0xf1
export const T_NOT = 0xf2
export const T_BNEG = 0xf3

/*
 * STATS' results as values in any line (S7, after EL-509E's list): n, the means, both standard
 * deviations, the sums, r, a and b, worked out from STATS' table when the line is; and the
 * estimates x'( and y'( from the line y = a + bx. They take the font's free codes 97-9F and
 * the rest of E0-FF.
 */
export const T_STAT_N = 0x97
export const T_STAT_LAST = 0xf9
export const T_XEST = 0xfa
export const T_YEST = 0xfb
/** The quadratic's c, and its other x estimate x₂′(. */
export const T_STAT_C = 0xfc
export const T_X2EST = 0xfd
/* The random page's values (after EL-509E's list): dice 1-6, coin 0 or 1, rint 0-99. */
export const T_DICE = 0x0c
export const T_COIN = 0x0d
export const T_RINT = 0x0e

/** Whether a token is one of STATS' results (n ... b). */
export function isStatValue(t: u16): bool {
  return (t >= T_STAT_N && t <= 0x9f) || (t >= 0xf4 && t <= T_STAT_LAST) || t === T_STAT_C
}

/** A result's place in STATS' list: n x̄ σx sx ȳ σy sy Σx Σx² Σy Σy² Σxy r a b (0-14). */
export function statIndex(t: u16): u16 {
  if (t === T_STAT_C) return 15
  return t <= 0x9f ? t - T_STAT_N : t - 0xf4 + 9
}

/** Whether a token opens a template. */
export function opensTemplate(t: u16): bool {
  return t === T_FRAC || t === T_ROOT || t === T_POWT || t === T_MIXED || t === T_XROOT
}

/** Whether a token ends one part of a template and begins the next. */
export function isSeparator(t: u16): bool {
  return t === T_SEP || t === T_MSEP || t === T_MDIV || t === T_XSEP
}

/** Whether a token opens a function: its argument follows, closed by ) or the line's end. */
export function isFunction(t: u16): bool {
  return (
    (t >= T_SIN && t <= T_CBRT) ||
    (t >= T_SINH && t <= T_REC) ||
    t === T_XEST ||
    t === T_YEST ||
    t === T_X2EST
  )
}

/** Whether a function takes two arguments, a comma between them. */
export function takesTwo(t: u16): bool {
  return t === T_GCD || t === T_LCM || t === T_POL || t === T_REC
}

/** Whether a token is a variable: A-F, X, Y, M. */
export function isVariable(t: u16): bool {
  return (t >= 0x41 && t <= 0x46) || t === 0x58 || t === 0x59 || t === 0x4d
}

export function isDigit(t: u16): bool {
  return t >= 0x30 && t <= 0x39
}

/** What a token shows when it is not its own character (0 when it is). */
export function tokenText(t: u16): u16 {
  if (t >= T_SINH) return namedText(t)
  if (isStatValue(t)) return statText(t)
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
    case T_DICE:
      return str('dice')
    case T_COIN:
      return str('coin')
    case T_RINT:
      return str('rint')
    case T_MIXED:
      return str('(')
    case T_MSEP:
      return str(' ')
    case T_MDIV:
      return str('/')
    case T_XROOT:
      return str('(')
    case T_XSEP:
      return str(')\x83(')
  }
  return 0
}

/** The text of a token from 0xE0: the functions S5 added, and rand. Function names are small letters, as
 * sin( is (docs/elec16-sci.md section 4.4); Ans alone has a capital. */
function namedText(t: u16): u16 {
  switch (t) {
    case T_SINH:
      return str('sinh(')
    case T_COSH:
      return str('cosh(')
    case T_TANH:
      return str('tanh(')
    case T_ASINH:
      return str('sinh\x86(')
    case T_ACOSH:
      return str('cosh\x86(')
    case T_ATANH:
      return str('tanh\x86(')
    case T_ABS:
      return str('abs(')
    case T_GCD:
      return str('gcd(')
    case T_LCM:
      return str('lcm(')
    case T_INT:
      return str('int(')
    case T_RND:
      return str('round(')
    case T_POL:
      return str('pol(')
    case T_REC:
      return str('rec(')
    case T_RAN:
      return str('rand')
  }
  return logicText(t)
}

/** The text of BASE's logic. */
function logicText(t: u16): u16 {
  switch (t) {
    case T_AND:
      return str(' AND ')
    case T_OR:
      return str(' OR ')
    case T_XOR:
      return str(' XOR ')
    case T_XNOR:
      return str(' XNOR ')
    case T_NOT:
      return str('not(')
    case T_BNEG:
      return str('neg(')
    case T_XEST:
      return str('x\x89(')
    case T_YEST:
      return str('y\x89(')
    case T_X2EST:
      return str('x\x93\x89(')
  }
  return isStatValue(t) ? statText(t) : 0
}

/** A STATS result's name: x̄ is 95, ȳ 96, σ 91, Σ 90, ² 84. */
function statText(t: u16): u16 {
  switch (statIndex(t)) {
    case 0:
      return str('n')
    case 1:
      return str('\x95')
    case 2:
      return str('\x91x')
    case 3:
      return str('sx')
    case 4:
      return str('\x96')
    case 5:
      return str('\x91y')
    case 6:
      return str('sy')
    case 7:
      return str('\x90x')
    case 8:
      return str('\x90x\x84')
    case 9:
      return str('\x90y')
    case 10:
      return str('\x90y\x84')
    case 11:
      return str('\x90xy')
    case 12:
      return str('r')
    case 13:
      return str('a')
    case 15:
      return str('c')
  }
  return str('b')
}

/** How many characters a token shows as. */
export function tokenWidth(t: u16): u16 {
  const text = tokenText(t)
  if (text === 0) return 1
  let n: u16 = 0
  while (peek(text + n) !== 0) n++
  return n
}
