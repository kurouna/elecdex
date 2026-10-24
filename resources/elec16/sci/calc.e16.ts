// The ELEC-16 SCI ROM's calculator (docs/elec16-sci.md section 6), in e16c's TypeScript: the
// keys made into tokens, the line edited, evaluated (eval.e16.ts, ROM bank 0) and answered,
// the variables, Ans and the history. S3 shows the line as one row of characters (LINE); the
// line set out as a textbook would (2D) comes in S4.
import {
  addr,
  type bool,
  bytes,
  csrw,
  div,
  memcpy,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u16,
  wfi,
} from '../../../src/shared/e16c/builtins'
import { deleteAt, editCursor, editLength, fraction, vertical } from './edit.e16'
import { evaluate } from './eval.e16'
import { exactBinary } from './exact.e16'
import { cursorTop, cursorX, heightOf, setAnswer, setLine } from './layout.e16'
import {
  barAt,
  barDots,
  bigNumber,
  COLS,
  centre,
  clearBand,
  cls,
  drawChar,
  marks,
  noCursor,
  textAt,
} from './lcd.e16'
import {
  clearStack,
  copyValue,
  errAt,
  errCode,
  HISTORY_ENTRIES,
  HISTORY_SIZE,
  isExact,
  isNegative,
  isZero,
  KEEP_ANGLE,
  KEEP_ANS,
  KEEP_ANSWER,
  KEEP_DISPLAY,
  KEEP_HISTORY,
  KEEP_HISTORY_COUNT,
  keepReady,
  LINE_MAX,
  M_ADD,
  M_FORMAT,
  M_SUB,
  MATH_ARG,
  math,
  top,
  V_P,
  V_Q,
  V_R,
  V_S,
  varAt,
} from './numbers.e16'
import { errorScreen, faultScreen, menuKey, menuScreen, setupKey, setupScreen } from './screens.e16'
import {
  T_ACOS,
  T_ANS,
  T_ASIN,
  T_ATAN,
  T_BANG,
  T_CBRT,
  T_CLOSE,
  T_COS,
  T_CUBE,
  T_DIVIDE,
  T_E,
  T_END,
  T_EXP,
  T_FRAC,
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
  T_POWT,
  T_ROOT,
  T_SEP,
  T_SIN,
  T_SLASH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TEN,
  T_TIMES,
  tokenText,
  tokenWidth,
} from './tokens.e16'

/* ---------------- the hand-written ROM (main.s) ---------------- */

/** Waits for a key (asleep): its code in the matrix. */
export declare function getkey(): u16

/* ---------------- the keys (shared/elec16/sci-keys.ts; a test holds them alike) ---------------- */

export const K_UP = 0
export const K_DOWN = 1
export const K_LEFT = 2
export const K_RIGHT = 3
export const K_EQ = 4
export const K_AC = 5
export const K_SHIFT = 6
export const K_ALPHA = 7
export const K_MENU = 8
export const K_SETUP = 9
export const K_FUNC = 11
export const K_STO = 12
export const K_FD = 13
export const K_DEL = 14
export const K_ANS = 15
export const K_FRAC = 16
export const K_SQ = 17
export const K_CUBE = 18
export const K_POW = 19
export const K_LOG = 20
export const K_LN = 21
export const K_EXP = 22
export const K_NEG = 24
export const K_DMS = 25
export const K_HYP = 26
export const K_SIN = 27
export const K_COS = 28
export const K_TAN = 29
export const K_FX = 32
export const K_INV = 33
export const K_NCR = 34
export const K_LP = 35
export const K_RP = 36
export const K_MPLUS = 37
export const K_7 = 40
export const K_8 = 41
export const K_9 = 42
export const K_MUL = 43
export const K_DIV = 44
export const K_4 = 48
export const K_5 = 49
export const K_6 = 50
export const K_ADD = 51
export const K_SUB = 52
export const K_1 = 56
export const K_2 = 57
export const K_3 = 58
export const K_0 = 59
export const K_DOT = 60

/* ---------------- the marks (shared/elec16/state.ts SCI_ANNUNCIATORS; a test holds them) ---------------- */

export const ANN_S = 0x2
export const ANN_A = 0x4
export const ANN_M = 0x8
export const ANN_STO = 0x10
export const ANN_D = 0x80
export const ANN_R = 0x100
export const ANN_G = 0x200
export const ANN_2D = 0x1000
export const ANN_UP = 0x2000
export const ANN_DOWN = 0x4000

/* ---------------- the timer and the buzzer ---------------- */

const IO_TCOUNT = 0xff30
const IO_TCMP = 0xff32
const IO_TCTRL = 0xff34
const IO_FREQ = 0xff40
const IO_DUR = 0xff42
const CSR_MIE = 0x304

/* ---------------- state ---------------- */

/** What the screen is: the line and its answer, an error, MENU, SETUP. */
export const S_CALC = 0
export const S_ERROR = 1
export const S_MENU = 2
export const S_SETUP = 3
let screen: u16 = S_CALC

/** The line: its tokens, how many, and where the cursor is (before token `cursor`). */
const line = bytes(200)
let length: u16 = 0
let cursor: u16 = 0
/** The line has been answered: its answer is on screen, and a key decides what comes next. */
let answered: bool = false
/** SHIFT and ALPHA wait for the next key; STO and RCL for a variable's key. */
let shifted: bool = false
let alphaOn: bool = false
let storing: bool = false
let recalling: bool = false
/** Which line of the history is on screen (0 the newest), or none. */
let historyAt: u16 = 0xffff
/** The first character of the line on screen, when it is longer than the rows hold. */
let scrollFrom: u16 = 0
/** The answer's text, as the maths unit's FORMAT writes it. */
const answerText = bytes(24)
/** The answer shown in its exact form (2D), or as a decimal. */
let exactShown: bool = false
/** An exact answer's tokens, set by the 2D layout: (p + r√s)/q, 40 tokens at most. */
const answerTokens = bytes(48)
let answerLength: u16 = 0

/** The 2D display (0 in SETUP's KEEP_DISPLAY) or LINE. */
function twoD(): bool {
  return peek(KEEP_DISPLAY) === 0
}

/** The line's height in 2D: above this many rows a template is not put in. */
const LINE_HEIGHT_MAX = 36

/** The line's rows on screen: four of 21 characters. */
const LINE_ROWS = 4
const LINE_CHARS = 84

/* ---------------- start ---------------- */

/** Switched on: the kept RAM checked, the name shown for a moment (or until a key), then CALC. */
export function calcCold(): void {
  keepReady()
  cls()
  noCursor()
  centre(2, str('ELEC-16 SCI'), 11)
  centre(4, str('SCI-128'), 7)
  marks(0)
  pause(700)
  screen = S_CALC
  length = 0
  cursor = 0
  answered = false
  drawCalc()
}

/** About `ms` milliseconds asleep on the timer (1,024 counts a second), or until a key. */
function pause(ms: u16): void {
  poke16(IO_TCMP, peek16(IO_TCOUNT) + ms)
  poke16(IO_TCTRL, 1)
  csrw(CSR_MIE, 3)
  wfi()
  poke16(IO_TCTRL, 0)
  csrw(CSR_MIE, 0)
}

/** The key loop: never comes back (main.s comes back into it after an error or ON). */
export function calcLoop(): void {
  for (;;) key(getkey())
}

/** A short beep: the key does nothing here (yet). */
export function refuse(): void {
  poke16(IO_FREQ, 1800)
  poke16(IO_DUR, 40)
}

/* ---------------- errors and ON ---------------- */

/** After calc_abort: the error screen, the line kept for ◀ ▶ to go back to. */
export function calcError(): void {
  screen = S_ERROR
  noCursor()
  errorScreen(errCode)
  drawMarks()
}

/** After a break or a fault in a program CODE ran: what stopped, until AC. */
export function calcFault(cause: u16, pc: u16): void {
  screen = S_ERROR
  length = 0
  cursor = 0
  noCursor()
  faultScreen(cause, pc)
  drawMarks()
}

/**
 * ON (BRK). With SHIFT waiting it is OFF: the power goes (the RAM stays). Otherwise it is AC,
 * from anywhere: the line cleared, CALC on screen - a long evaluation stopped too.
 */
export function calcOn(): void {
  if (shifted) {
    shifted = false
    noCursor()
    poke16(0xff06, 0)
    return
  }
  clearLine()
}

function clearLine(): void {
  screen = S_CALC
  length = 0
  cursor = 0
  answered = false
  historyAt = 0xffff
  shifted = false
  alphaOn = false
  storing = false
  recalling = false
  drawCalc()
}

/* ---------------- keys ---------------- */

function key(k: u16): void {
  if (k === K_SHIFT) {
    shifted = !shifted
    alphaOn = false
    drawMarks()
    return
  }
  if (k === K_ALPHA) {
    alphaOn = !alphaOn
    shifted = false
    drawMarks()
    return
  }
  const shift = shifted
  const alpha = alphaOn
  shifted = false
  alphaOn = false
  if (screen === S_ERROR) errorKey(k)
  else if (screen === S_MENU) {
    if (menuKey(k) !== 0) clearLine()
  } else if (screen === S_SETUP) {
    if (setupKey(k) !== 0) clearLine()
  } else calcKey(k, shift, alpha)
  drawMarks()
}

/** On the error screen: AC drops the line, an arrow goes back into it at the error. */
function errorKey(k: u16): void {
  if (k === K_AC) {
    clearLine()
    return
  }
  if (k === K_LEFT || k === K_RIGHT) {
    screen = S_CALC
    answered = false
    cursor = errAt < length ? errAt : length
    drawCalc()
  }
}

function calcKey(k: u16, shift: bool, alpha: bool): void {
  if (storing || recalling) {
    variableKey(k)
    return
  }
  if (commandKey(k, shift, alpha)) return
  if (!alpha && templateKey(k, shift)) return
  const t = alpha ? letterOf(k) : tokenOf(k, shift)
  if (t === 0) {
    refuse()
    return
  }
  type(t)
  // In LINE, 10ˣ and eˣ are the value and ^( with the exponent typed next.
  if (shift && (k === K_LOG || k === K_LN)) {
    insert(T_POW)
    drawCalc()
  }
}

/**
 * a/b, x^, √ and 10ˣ, eˣ in 2D: a template (LINE types / ^( √( as S3 did). After an answer, the
 * fraction and the power go on from Ans. Done, true; else false.
 */
function templateKey(k: u16, shift: bool): bool {
  const fractionKey = k === K_FRAC && !shift
  if (!twoD()) {
    if (fractionKey) type(T_SLASH)
    return fractionKey
  }
  if (!fractionKey && !makesTemplate(k, shift)) return false
  const root = k === K_SQ && shift
  if (answered) afresh(fractionKey || k === K_POW)
  if (fractionKey) {
    fraction(addr(line), length, cursor)
    edited()
  } else insertTemplate(k, root)
  if (heightOf(addr(line), length) > LINE_HEIGHT_MAX) {
    refuse()
    // Too tall to show: taken back out (the last template put in).
    deleteAt(addr(line), length, cursor)
    edited()
  }
  drawCalc()
  return true
}

/** x^, SHIFT x² (√), SHIFT log (10ˣ) and SHIFT ln (eˣ): the keys that put in √ or a power. */
function makesTemplate(k: u16, shift: bool): bool {
  if (shift) return k === K_SQ || k === K_LOG || k === K_LN
  return k === K_POW
}

/** The line and cursor as edit.e16.ts left them. */
function edited(): void {
  length = editLength
  cursor = editCursor
}

/** A new line after an answer: from Ans for a/b and x^ (`fromAns`), empty for the others. */
function afresh(fromAns: bool): void {
  answered = false
  historyAt = 0xffff
  length = 0
  cursor = 0
  if (fromAns) insert(T_ANS)
}

/** √ or a power at the cursor, the cursor in it; 10ˣ and eˣ with their 10 or e before it. */
function insertTemplate(k: u16, root: bool): void {
  if (k === K_LOG) insert(T_TEN)
  if (k === K_LN) insert(T_E)
  insert(root ? T_ROOT : T_POWT)
  insert(T_END)
  cursor--
}

/** A key that does something other than type a token: done, true; else false. */
function commandKey(k: u16, shift: bool, alpha: bool): bool {
  switch (k) {
    case K_MENU:
      screen = S_MENU
      noCursor()
      menuScreen()
      return true
    case K_SETUP:
      screen = S_SETUP
      noCursor()
      setupScreen()
      return true
    case K_AC:
      clearLine()
      return true
    case K_EQ:
      equals(shift)
      return true
    case K_FD:
      exactOrDecimal(shift)
      return true
    case K_STO:
      recalling = shift
      storing = !shift
      return true
    case K_LEFT:
    case K_RIGHT:
      arrow(k === K_LEFT)
      return true
    case K_UP:
    case K_DOWN:
      history(k === K_UP)
      return true
    case K_DEL:
      deleteBefore()
      return true
  }
  if (k !== K_MPLUS || alpha) return false
  memoryPlus(shift)
  return true
}

/** The token a key types, after SHIFT or not; 0 for a key that types none (yet). */
function tokenOf(k: u16, shift: bool): u16 {
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
    case K_LP:
      return T_OPEN
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
    case K_NEG:
      return T_NEG
    case K_EXP:
      return T_EXP
    case K_SQ:
      return T_SQUARE
    case K_CUBE:
      return T_CUBE
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
    case K_EXP:
      return T_PI
    case K_SQ:
      return T_SQRT
    case K_CUBE:
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

/** The letter a key gives after ALPHA (A-F, X, Y, M), or e on EXP; 0 for none. */
function letterOf(k: u16): u16 {
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

/** Whether a token goes on from Ans after an answer: an operator, a power or a postfix. */
function fromAns(t: u16): bool {
  return (
    t === T_PLUS ||
    t === T_MINUS ||
    t === T_TIMES ||
    t === T_DIVIDE ||
    t === T_POW ||
    t === T_SQUARE ||
    t === T_CUBE ||
    t === T_INVERSE ||
    t === T_BANG ||
    t === T_NCR ||
    t === T_NPR
  )
}

/** A token typed at the cursor; after an answer, a new line (from Ans for an operator). */
function type(t: u16): void {
  if (answered) {
    answered = false
    historyAt = 0xffff
    length = 0
    cursor = 0
    if (fromAns(t)) insert(T_ANS)
  }
  insert(t)
  drawCalc()
}

function insert(t: u16): void {
  if (length >= LINE_MAX) {
    refuse()
    return
  }
  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  line[cursor] = t
  length++
  cursor++
}

function deleteBefore(): void {
  if (answered) {
    answered = false
    cursor = length
  }
  deleteAt(addr(line), length, cursor)
  length = editLength
  cursor = editCursor
  drawCalc()
}

/** ◀ ▶: through the line; from an answer, back into the line at its end (◀) or start (▶). */
function arrow(left: bool): void {
  if (answered) {
    answered = false
    cursor = left ? length : 0
  } else if (left) {
    cursor = cursor > 0 ? cursor - 1 : length
  } else {
    cursor = cursor < length ? cursor + 1 : 0
  }
  drawCalc()
}

/* ---------------- answers ---------------- */

/**
 * =: the line evaluated, its value Ans, the line kept in the history, the answer shown - in its
 * exact form in 2D, unless SETUP asks for decimals first, the line has a decimal typed in it, or
 * it was ≈ (SHIFT =).
 */
function equals(approx: bool): void {
  if (length === 0) return
  clearStack()
  evaluate(addr(line), length)
  copyValue(top(), KEEP_ANS)
  remember()
  answered = true
  historyAt = 0xffff
  exactShown = twoD() && !approx && peek(KEEP_ANSWER) === 0 && !decimalTyped()
  drawCalc()
}

/** Whether the line has a decimal point in it: such a line is answered in decimals first. */
function decimalTyped(): bool {
  for (let i: u16 = 0; i < length; i++) {
    if (line[i] === T_POINT) return true
  }
  return false
}

/** F⇄D: the answer between its exact form and its decimal (ENG, after SHIFT, comes in S5). */
function exactOrDecimal(shift: bool): void {
  if (shift || !answered || !twoD() || !hasForm()) {
    refuse()
    return
  }
  exactShown = !exactShown
  drawCalc()
}

/** Whether Ans has an exact form other than a whole number (which its decimal shows as well). */
function hasForm(): bool {
  if (!isExact(KEEP_ANS)) return false
  return !isZero(KEEP_ANS + V_R) || !isOne(KEEP_ANS + V_Q)
}

function isOne(n: u16): bool {
  return (
    peek(n) === 0 &&
    peek(n + 1) === 0 &&
    peek(n + 2) === 0x10 &&
    peek16(n + 4) === 0 &&
    peek16(n + 6) === 0
  )
}

/** STO's or RCL's variable: STO keeps the answer (or the line's value) in it, RCL shows it. */
function variableKey(k: u16): void {
  const store = storing
  storing = false
  recalling = false
  const letter = letterOf(k)
  if (letter === 0 || letter === T_E) {
    refuse()
    return
  }
  if (store) {
    if (!answered && length > 0) {
      clearStack()
      evaluate(addr(line), length)
      copyValue(top(), KEEP_ANS)
      remember()
    }
    copyValue(KEEP_ANS, varAt(letter))
  } else {
    copyValue(varAt(letter), KEEP_ANS)
  }
  exactShown = twoD() && peek(KEEP_ANSWER) === 0
  length = 0
  cursor = 0
  insert(T_ANS)
  answered = true
  drawCalc()
}

/** M+ and M−: the answer (or the line's value) added to M or taken from it. */
function memoryPlus(minus: bool): void {
  if (!answered) {
    if (length === 0) {
      length = 0
      insert(T_ANS)
    }
    clearStack()
    evaluate(addr(line), length)
    copyValue(top(), KEEP_ANS)
    remember()
  }
  const m = varAt(0x4d)
  const op = minus ? M_SUB : M_ADD
  math(op, m, KEEP_ANS, 0)
  exactBinary(op, m, KEEP_ANS)
  answered = true
  exactShown = twoD() && peek(KEEP_ANSWER) === 0
  drawCalc()
}

/* ---------------- the history ---------------- */

/** The line kept, newest first; the oldest goes when all ten are taken. */
function remember(): void {
  const count = peek16(KEEP_HISTORY_COUNT)
  const kept = count < HISTORY_ENTRIES ? count : HISTORY_ENTRIES - 1
  memcpy(KEEP_HISTORY + HISTORY_SIZE, KEEP_HISTORY, kept * HISTORY_SIZE)
  poke(KEEP_HISTORY, length)
  memcpy(KEEP_HISTORY + 1, addr(line), length)
  poke16(KEEP_HISTORY_COUNT, kept + 1)
}

/**
 * ▲ ▼: an earlier line (▲) or a later one (▼), only from an answer, an empty line or the
 * history already on screen - never over a line being typed.
 */
function history(older: bool): void {
  if (!answered && twoD()) {
    vertical(addr(line), length, cursor, older)
    if (editCursor !== 0xffff) {
      cursor = editCursor
      drawCalc()
      return
    }
  }
  const count = peek16(KEEP_HISTORY_COUNT)
  const browsing = historyAt !== 0xffff
  if (!answered && length > 0 && !browsing) return
  let next = historyAt
  if (older) next = browsing ? historyAt + 1 : 0
  else if (browsing && historyAt > 0) next = historyAt - 1
  else return
  if (next >= count) return
  historyAt = next
  const entry = KEEP_HISTORY + next * HISTORY_SIZE
  length = peek(entry)
  memcpy(addr(line), entry + 1, length)
  cursor = length
  answered = false
  drawCalc()
}

/* ---------------- drawing ---------------- */

/** The marks: S, A, STO, M while it is not 0, the angle, ▲ ▼ where the history goes. */
function drawMarks(): void {
  let bits: u16 = 0
  if (shifted) bits |= ANN_S
  if (alphaOn || storing || recalling) bits |= ANN_A
  if (storing) bits |= ANN_STO
  if (peek(varAt(0x4d) + 2) !== 0) bits |= ANN_M
  const angle = peek(KEEP_ANGLE)
  bits |= angle === 1 ? ANN_R : angle === 2 ? ANN_G : ANN_D
  if (twoD()) bits |= ANN_2D
  if (screen === S_CALC) bits |= historyMarks()
  marks(bits)
}

/** ▲ while ▲ brings an earlier line, ▼ while ▼ brings a later one. */
function historyMarks(): u16 {
  const count = peek16(KEEP_HISTORY_COUNT)
  const browsing = historyAt !== 0xffff
  let bits: u16 = 0
  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  if (browsing && historyAt > 0) bits |= ANN_DOWN
  return bits
}

/** The line on its rows, and the answer below it when there is one. */
function drawCalc(): void {
  cls()
  if (twoD()) drawLine2D()
  else drawLine()
  if (answered) {
    if (exactShown && hasForm()) drawExact()
    else drawAnswer()
  }
  drawMarks()
}

/** The line set in 2D (layout.e16.ts), the bar cursor where the layout found it. */
function drawLine2D(): void {
  setLine(addr(line), length, answered ? 0xffff : cursor)
  if (answered) noCursor()
  else barDots(cursorX, cursorTop)
}

/** Ans's exact form (p + r√s)/q as tokens, set on the answer rows by the 2D layout. */
function drawExact(): void {
  answerLength = 0
  const p = KEEP_ANS + V_P
  const r = KEEP_ANS + V_R
  const q = KEEP_ANS + V_Q
  const fractionOf = !isOne(q)
  const oneTerm = isZero(p) || isZero(r)
  // A single negative term's sign goes before its fraction: -√2/2, not (-√2)/2.
  const signOut = oneTerm && fractionOf && (isZero(r) ? isNegative(p) : isNegative(r))
  if (signOut) answerToken(T_MINUS)
  if (fractionOf) answerToken(T_FRAC)
  if (!isZero(p) || isZero(r)) answerNumber(p, signOut)
  if (!isZero(r)) answerRoot(p, r, signOut)
  if (fractionOf) {
    answerToken(T_SEP)
    answerNumber(q, false)
    answerToken(T_END)
  }
  setAnswer(addr(answerTokens), answerLength)
}

/** The r√s term after p: its sign (unless it went before the fraction), r unless ±1, √s. */
function answerRoot(p: u16, r: u16, signOut: bool): void {
  if (!isZero(p)) answerToken(isNegative(r) ? T_MINUS : T_PLUS)
  else if (isNegative(r) && !signOut) answerToken(T_MINUS)
  if (!isOne(r) && !isMinusOne(r)) answerNumber(r, true)
  answerToken(T_ROOT)
  answerDigits(peek16(KEEP_ANS + V_S))
  answerToken(T_END)
}

function answerToken(t: u16): void {
  if (answerLength < 48) {
    answerTokens[answerLength] = t
    answerLength++
  }
}

/** A whole number's digits as tokens; its sign too, unless `bare`. */
function answerNumber(n: u16, bare: bool): void {
  poke16(MATH_ARG, 12)
  math(M_FORMAT, n, addr(answerText), 0)
  const count = peek16(MATH_ARG)
  for (let i: u16 = 0; i < count; i++) {
    const c = answerText[i]
    if (c === 0x2d) {
      if (!bare) answerToken(T_MINUS)
    } else answerToken(c)
  }
}

/** A small whole number (s) as digit tokens. */
function answerDigits(v: u16): void {
  if (v >= 10) answerToken(0x30 + div(v, 10))
  answerToken(0x30 + (v % 10))
}

function isMinusOne(n: u16): bool {
  return (
    peek(n) !== 0 &&
    peek(n + 1) === 0 &&
    peek(n + 2) === 0x10 &&
    peek16(n + 4) === 0 &&
    peek16(n + 6) === 0
  )
}

/** Where token `n` starts, in characters from the line's start. */
function charsTo(n: u16): u16 {
  let c: u16 = 0
  for (let i: u16 = 0; i < n; i++) c += tokenWidth(line[i])
  return c
}

/**
 * The line in characters on rows 0-3, scrolled by whole rows so the cursor is on them; the
 * bar cursor before the token it is at, unless the line is answered.
 */
function drawLine(): void {
  const at = charsTo(cursor)
  if (at < scrollFrom) scrollFrom = at - (at % COLS)
  if (at >= scrollFrom + LINE_CHARS) scrollFrom = at - (at % COLS) - (LINE_ROWS - 1) * COLS
  let c: u16 = 0
  for (let i: u16 = 0; i < length; i++) {
    const t = line[i]
    const text = tokenText(t)
    if (text === 0) {
      showChar(t, c)
      c++
    } else {
      let p = text
      while (peek(p) !== 0) {
        showChar(peek(p), c)
        c++
        p++
      }
    }
  }
  if (answered) {
    noCursor()
    return
  }
  const shown = at - scrollFrom
  barAt(shown % COLS, div(shown, COLS))
}

/** Character `ch` at the line's place `c`, if that is on the rows shown. */
function showChar(ch: u16, c: u16): void {
  if (c < scrollFrom || c >= scrollFrom + LINE_CHARS) return
  const shown = c - scrollFrom
  drawChar(ch, shown % COLS, div(shown, COLS))
}

/**
 * Ans as ten digits, right on bands 6 and 7 in the big digits; an exponent (FORMAT's E) as
 * x10 in the font with the exponent raised beside it.
 */
function drawAnswer(): void {
  clearBand(5)
  clearBand(6)
  clearBand(7)
  poke16(MATH_ARG, 10)
  math(M_FORMAT, KEEP_ANS, addr(answerText), 0)
  const n = peek16(MATH_ARG)
  poke(addr(answerText) + n, 0)
  let mantissa = n
  for (let i: u16 = 0; i < n; i++) {
    if (answerText[i] === 0x45) mantissa = i
  }
  let right: u16 = 127
  if (mantissa < n) {
    // The exponent ends at the right edge, raised; x10 before it on the digits' foot.
    const exponent = addr(answerText) + mantissa + 1
    let digits: u16 = 0
    while (peek(exponent + digits) !== 0) digits++
    const x = 128 - digits * 6
    textAt(exponent, x, 48)
    textAt(str('\x8110'), x - 18, 55)
    right = x - 19
  }
  bigNumber(addr(answerText), mantissa, right)
}
