// ELEC-16 BASIC: keywords and the text of a line. A line is kept tokenized - each keyword one
// byte from 0x80 - and everything else as typed: numbers stay text (the maths unit reads
// them when they run), so LIST shows a line as it was written.
import {
  type bool,
  div,
  peek,
  poke,
  str,
  type u8,
  type u16,
} from '../../../../src/shared/e16c/builtins'
import { E_SYNTAX, fail } from './basic.e16'
import {
  CH_0,
  CH_A,
  CH_COLON,
  CH_LOWER_A,
  CH_LOWER_Z,
  CH_QUOTE,
  CH_SPACE,
  CH_Z,
  putc,
} from './rom.e16'

/**
 * Every keyword, its token 0x80 plus its place here. The order is fixed: a program keeps the
 * tokens, so a new keyword only ever goes at the end.
 */
export const KEYWORDS = str(
  'RUN LIST NEW CONT PRINT INPUT LET IF THEN ELSE FOR TO STEP NEXT GOTO GOSUB RETURN END STOP REM MON CLS DEG RAD GRAD POKE CALL WAIT BEEP DIM DATA READ RESTORE ON CLEAR AUTO RENUM DELETE TRON TROFF FILES LOAD SAVE KILL LOCATE CURSOR PSET PRESET LINE GPRINT OPEN CLOSE SIN COS TAN ASIN ACOS ATAN SQR ABS INT SGN LOG LN EXP RND PI ANS PEEK POINT NOT AND OR LEN LEFT$ MID$ RIGHT$ CHR$ ASC STR$ VAL INKEY$ TIME$ DATE$ EOF LCDW LCDH OFF AS OUTPUT APPEND CIRCLE',
)

export const T_RUN = 0x80
export const T_LIST = 0x81
export const T_NEW = 0x82
export const T_CONT = 0x83
export const T_PRINT = 0x84
export const T_INPUT = 0x85
export const T_LET = 0x86
export const T_IF = 0x87
export const T_THEN = 0x88
export const T_ELSE = 0x89
export const T_FOR = 0x8a
export const T_TO = 0x8b
export const T_STEP = 0x8c
export const T_NEXT = 0x8d
export const T_GOTO = 0x8e
export const T_GOSUB = 0x8f
export const T_RETURN = 0x90
export const T_END = 0x91
export const T_STOP = 0x92
export const T_REM = 0x93
export const T_MON = 0x94
export const T_CLS = 0x95
export const T_DEG = 0x96
export const T_RAD = 0x97
export const T_GRAD = 0x98
export const T_POKE = 0x99
export const T_CALL = 0x9a
export const T_SIN = 0xb4
export const T_COS = 0xb5
export const T_TAN = 0xb6
export const T_ASIN = 0xb7
export const T_ACOS = 0xb8
export const T_ATAN = 0xb9
export const T_SQR = 0xba
export const T_ABS = 0xbb
export const T_INT = 0xbc
export const T_SGN = 0xbd
export const T_LOG = 0xbe
export const T_LN = 0xbf
export const T_EXP = 0xc0
export const T_RND = 0xc1
export const T_PI = 0xc2
export const T_ANS = 0xc3
export const T_PEEK = 0xc4
export const T_POINT = 0xc5
export const T_NOT = 0xc6
export const T_AND = 0xc7
export const T_OR = 0xc8
export const T_LEN = 0xc9
export const T_LEFT = 0xca
export const T_MID = 0xcb
export const T_RIGHT = 0xcc
export const T_CHR = 0xcd
export const T_ASC = 0xce
export const T_STR = 0xcf
export const T_VAL = 0xd0
export const T_INKEY = 0xd1
export const T_TIME = 0xd2
export const T_DATE = 0xd3
export const T_EOF = 0xd4
export const T_LCDW = 0xd5
export const T_LCDH = 0xd6
export const T_OFF = 0xd7
export const T_AS = 0xd8
export const T_OUTPUT = 0xd9
export const T_APPEND = 0xda
export const T_CIRCLE = 0xdb
export const T_WAIT = 0x9b
export const T_BEEP = 0x9c
export const T_DIM = 0x9d
export const T_DATA = 0x9e
export const T_READ = 0x9f
export const T_RESTORE = 0xa0
export const T_ON = 0xa1
export const T_CLEAR = 0xa2
export const T_AUTO = 0xa3
export const T_RENUM = 0xa4
export const T_DELETE = 0xa5
export const T_TRON = 0xa6
export const T_TROFF = 0xa7
export const T_FILES = 0xa8
export const T_LOAD = 0xa9
export const T_SAVE = 0xaa
export const T_KILL = 0xab
export const T_LOCATE = 0xac
export const T_CURSOR = 0xad
export const T_PSET = 0xae
export const T_PRESET = 0xaf
export const T_LINE = 0xb0
export const T_GPRINT = 0xb1
export const T_OPEN = 0xb2
export const T_CLOSE = 0xb3

export function isLetter(c: u16): bool {
  return (c >= CH_A && c <= CH_Z) || (c >= CH_LOWER_A && c <= CH_LOWER_Z)
}

export function upper(c: u16): u16 {
  if (c >= CH_LOWER_A && c <= CH_LOWER_Z) return c - 0x20
  return c
}

/** The address of keyword `token`'s text in KEYWORDS (it ends at a space or the zero). */
export function keywordText(token: u16): u16 {
  let at = KEYWORDS
  let k: u16 = 0x80
  while (k < token) {
    while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
    if (peek(at) === 0) return 0
    at++
    k++
  }
  return at
}

/** How many characters of `text` a keyword starting at `word` matches (0: it does not). */
function matches(text: u16, word: u16): u16 {
  let n: u16 = 0
  while (peek(word + n) !== CH_SPACE && peek(word + n) !== 0) {
    if (upper(peek(text + n)) !== peek(word + n)) return 0
    n++
  }
  return n
}

let matchedLength: u16 = 0

/** The longest keyword at `text`: its token, or 0; its length in matchedLength. */
function keywordAt(text: u16): u16 {
  let best: u16 = 0
  let bestLength: u16 = 0
  let at = KEYWORDS
  let token: u16 = 0x80
  while (peek(at) !== 0) {
    const n = matches(text, at)
    if (n > bestLength) {
      best = token
      bestLength = n
    }
    while (peek(at) !== CH_SPACE && peek(at) !== 0) at++
    if (peek(at) === CH_SPACE) at++
    token++
  }
  matchedLength = bestLength
  return best
}

/* Text kept as typed: inside quotes, after REM to the line's end, and a DATA's items up to
   a colon (DATA ON,OFF reads two words, not two keywords). tokenize and expand share it. */
let inQuotes = false
const RAW_NONE = 0
const RAW_REM = 1
const RAW_DATA = 2
let rawMode: u16 = RAW_NONE

function rawFrom(): void {
  inQuotes = false
  rawMode = RAW_NONE
}

/** Whether the character here is kept as it is, not read as a keyword. */
function kept(): bool {
  return inQuotes || rawMode !== RAW_NONE
}

/** A keyword passed: REM and DATA keep what follows. */
function afterToken(token: u16): void {
  if (token === T_REM) rawMode = RAW_REM
  else if (token === T_DATA) rawMode = RAW_DATA
}

/** A character passed: a quote opens or closes text, a colon ends a DATA's items. */
function afterChar(c: u16): void {
  if (c === CH_QUOTE) inQuotes = !inQuotes
  else if (c === CH_COLON && rawMode === RAW_DATA && !inQuotes) rawMode = RAW_NONE
}

/**
 * The line typed (from `text`, ended by a zero) into tokens at `out`, ended by a zero: its
 * length with the zero. Keywords are found outside what is kept as typed; letters elsewhere
 * are made upper case (names are).
 */
export function tokenize(text: u16, out: u16): u16 {
  let i: u16 = 0
  let o: u16 = 0
  rawFrom()
  while (peek(text + i) !== 0) {
    const c: u8 = peek(text + i)
    // A quote is its own upper case, so the one opening or closing text may go either way.
    const keep: bool = kept()
    // A kana (any byte from 0x80) is a character only where text is kept as typed: elsewhere
    // it would be stored as a keyword's token and LIST as one.
    if (c >= 0x80 && !keep) fail(E_SYNTAX)
    const token: u16 = keep || !isLetter(c) ? 0 : keywordAt(text + i)
    if (token !== 0) {
      poke(out + o, token)
      i += matchedLength
      afterToken(token)
    } else {
      afterChar(c)
      poke(out + o, keep ? c : upper(c))
      i++
    }
    o++
  }
  poke(out + o, 0)
  return o + 1
}

/**
 * Tokenized text as it was typed: a keyword as its word, and everything inside quotes or after
 * REM as it is (a kana there is a character, not a token). Printed when `out` is 0, else
 * written at `out`, at most `max` bytes: the length.
 */
export function expand(at: u16, out: u16, max: u16): u16 {
  let p = at
  let n: u16 = 0
  rawFrom()
  while (peek(p) !== 0) {
    const c: u8 = peek(p)
    if (c >= 0x80 && !kept()) {
      let w = keywordText(c)
      while (w !== 0 && peek(w) !== CH_SPACE && peek(w) !== 0) {
        n = give(out, n, max, peek(w))
        w++
      }
      afterToken(c)
    } else {
      afterChar(c)
      n = give(out, n, max, c)
    }
    p++
  }
  return n
}

/** One character of expand's: printed, or written while there is room. The new length. */
function give(out: u16, n: u16, max: u16, c: u16): u16 {
  if (out === 0) {
    putc(c)
    return n + 1
  }
  if (n >= max) return n
  poke(out + n, c)
  return n + 1
}

/** A number's decimal digits written at `out`: how many. */
export function unsignedText(value: u16, out: u16): u16 {
  let n: u16 = 0
  if (value >= 10) n = unsignedText(div(value, 10), out)
  poke(out + n, CH_0 + (value % 10))
  return n + 1
}

/** Prints a number as decimal digits, no sign (a line number, a count). */
export function printUnsigned(value: u16): void {
  if (value >= 10) printUnsigned(div(value, 10))
  putc(CH_0 + (value % 10))
}
