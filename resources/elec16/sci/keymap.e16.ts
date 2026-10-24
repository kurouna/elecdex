// The token each key types: its cap, its SHIFT face, after HYP, or its letter after ALPHA. Pure
// tables, in a bank (the fixed ROM keeps its room); shared/elec16/sci-keys.ts names the keys.
import type { bool, u16 } from '../../../src/shared/e16c/builtins'
import {
  K_0,
  K_1,
  K_2,
  K_3,
  K_4,
  K_5,
  K_6,
  K_7,
  K_8,
  K_9,
  K_ADD,
  K_ANS,
  K_COS,
  K_DIV,
  K_DMS,
  K_DOT,
  K_EXP,
  K_HYP,
  K_INV,
  K_LN,
  K_LOG,
  K_LP,
  K_MPLUS,
  K_MUL,
  K_NCR,
  K_NEG,
  K_POW,
  K_ROOT,
  K_RP,
  K_SIN,
  K_SQ,
  K_SUB,
  K_TAN,
} from './calc.e16'
import {
  T_ABS,
  T_ACOS,
  T_ACOSH,
  T_ANS,
  T_ASIN,
  T_ASINH,
  T_ATAN,
  T_ATANH,
  T_BANG,
  T_CBRT,
  T_CLOSE,
  T_COMMA,
  T_COS,
  T_COSH,
  T_CUBE,
  T_DIVIDE,
  T_E,
  T_EXP,
  T_INVERSE,
  T_LN,
  T_LOG,
  T_MINUS,
  T_NCR,
  T_NEG,
  T_NPR,
  T_OPEN,
  T_PI,
  T_PLUS,
  T_POINT,
  T_POW,
  T_SIN,
  T_SINH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TANH,
  T_TEN,
  T_TIMES,
} from './tokens.e16'

/** The token a key types, after SHIFT or not; 0 for a key that types none (yet). */
export function tokenOf(k: u16, shift: bool): u16 {
  const plain = plainToken(k)
  return plain !== 0 ? plain : faceToken(k, shift)
}

/** A key that types the same token whether SHIFT waits or not: a digit, a sign, a bracket. */
function plainToken(k: u16): u16 {
  switch (k) {
    case K_0:
      return 0x30
    case K_1:
      return 0x31
    case K_2:
      return 0x32
    case K_3:
      return 0x33
    case K_4:
      return 0x34
    case K_5:
      return 0x35
    case K_6:
      return 0x36
    case K_7:
      return 0x37
    case K_8:
      return 0x38
    case K_9:
      return 0x39
    case K_DOT:
      return T_POINT
    case K_ADD:
      return T_PLUS
    case K_SUB:
      return T_MINUS
    case K_MUL:
      return T_TIMES
    case K_DIV:
      return T_DIVIDE
    case K_RP:
      return T_CLOSE
    case K_ANS:
      return T_ANS
  }
  return 0
}

/** A key with a SHIFT face: the token of its face or of its cap. */
function faceToken(k: u16, shift: bool): u16 {
  return shift ? shiftFace(k) : capToken(k)
}

/** The token of a key's cap. */
function capToken(k: u16): u16 {
  switch (k) {
    case K_LP:
      return T_OPEN
    case K_NEG:
      return T_NEG
    case K_EXP:
      return T_EXP
    case K_SQ:
      return T_SQUARE
    case K_ROOT:
      return T_SQRT
    case K_POW:
      return T_POW
    case K_LOG:
      return T_LOG
    case K_LN:
      return T_LN
    case K_SIN:
      return T_SIN
    case K_COS:
      return T_COS
    case K_TAN:
      return T_TAN
    case K_INV:
      return T_INVERSE
    case K_NCR:
      return T_NCR
  }
  return 0
}

/** The token of a key's SHIFT face; 0 where it has none, or one that comes later. */
function shiftFace(k: u16): u16 {
  switch (k) {
    case K_NEG:
      return T_ABS
    case K_LP:
      return T_COMMA
    case K_EXP:
      return T_PI
    case K_SQ:
      return T_CUBE
    case K_ROOT:
      return T_CBRT
    case K_LOG:
      return T_TEN
    case K_LN:
      return T_E
    case K_SIN:
      return T_ASIN
    case K_COS:
      return T_ACOS
    case K_TAN:
      return T_ATAN
    case K_INV:
      return T_BANG
    case K_NCR:
      return T_NPR
  }
  return 0
}

/** After HYP: sinh(, cosh(, tanh( and their inverses after SHIFT; 0 for another key. */
export function hypToken(k: u16, shift: bool): u16 {
  if (k === K_SIN) return shift ? T_ASINH : T_SINH
  if (k === K_COS) return shift ? T_ACOSH : T_COSH
  if (k === K_TAN) return shift ? T_ATANH : T_TANH
  return 0
}

/** The letter a key gives after ALPHA (A-F, X, Y, M), or e on EXP; 0 for none. */
export function letterOf(k: u16): u16 {
  switch (k) {
    case K_NEG:
      return 0x41
    case K_DMS:
      return 0x42
    case K_HYP:
      return 0x43
    case K_SIN:
      return 0x44
    case K_COS:
      return 0x45
    case K_TAN:
      return 0x46
    case K_LP:
      return 0x58
    case K_RP:
      return 0x59
    case K_MPLUS:
      return 0x4d
    case K_EXP:
      return T_E
  }
  return 0
}

/** A digit key's digit; 0xffff for another key. */
export function digitOf(k: u16): u16 {
  if (k === K_0) return 0
  if (k === K_1) return 1
  if (k === K_2) return 2
  if (k === K_3) return 3
  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  return 0xffff
}
