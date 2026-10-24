// The ELEC-16 SCI ROM's calculator (docs/elec16-sci.md section 6), in e16c's TypeScript: the
// keys made into tokens, the line edited, evaluated (eval.e16.ts, ROM bank 0) and answered,
// the variables, Ans and the history. The line is set as a textbook would (2D, layout.e16.ts)
// or as one row of characters (LINE); the answer is drawn by display.e16.ts, FUNC's menu by
// screens.e16.ts, f(x) and FIND X by solve.e16.ts.
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
import {
  baseCommand,
  baseDraw,
  baseEvaluate,
  baseFuncKey,
  baseFuncScreen,
  baseToken,
} from './base.e16'
import {
  drawAnswerAs,
  firstShown,
  hasForm,
  nextShown,
  SHOW_DECIMAL,
  SHOW_DMS,
  SHOW_ENG,
  SHOW_FOUND,
  SHOW_PAIR,
} from './display.e16'
import { deleteAt, editCursor, editLength, vertical, wrap } from './edit.e16'
import { eqnDraw, eqnKey, eqnReset, eqnStart } from './equation.e16'
import { evaluate } from './eval.e16'
import { exactBinary } from './exact.e16'
import { constantKept, dropConstant, nextAngle, noteConstant, withConstant } from './extras.e16'
import { cursorTop, cursorX, heightOf, setLine } from './layout.e16'
import { barAt, barDots, COLS, centre, cls, drawChar, marks, noCursor, textAt } from './lcd.e16'
import {
  BASE_HISTORY,
  BASE_HISTORY_COUNT,
  BASE_LINE,
  CALC_LINE,
  clearStack,
  contrastBack,
  copyValue,
  errAt,
  errCode,
  FORMAT_EXP,
  FORMAT_FIX,
  HISTORY_ENTRIES,
  HISTORY_SIZE,
  KEEP_ANGLE,
  KEEP_ANS,
  KEEP_ANSWER,
  KEEP_DISPLAY,
  KEEP_FORMAT,
  KEEP_HISTORY,
  KEEP_HISTORY_COUNT,
  KEEP_MODE,
  keepReady,
  LINE_MAX,
  M_ADD,
  M_SUB,
  math,
  modesReady,
  TABLE_LINE,
  top,
  varAt,
} from './numbers.e16'
import {
  errorScreen,
  faultScreen,
  funcKey,
  funcScreen,
  menuKey,
  menuScreen,
  setupKey,
  setupScreen,
} from './screens.e16'
import { ASK_BACK, ASK_DONE, ASK_STAY, askKey, askRange, askStart } from './solve.e16'
import { statsDraw, statsKey, statsReset, statsStart } from './stats.e16'
import {
  rangeAt,
  TABLE_VIEW,
  tableAskFrom,
  tableAsking,
  tableDraw,
  tableKey,
  tableNext,
  tablePhase,
  tableReset,
} from './table.e16'
import {
  isDigit,
  isSeparator,
  opensTemplate,
  T_ABS,
  T_ACOS,
  T_ACOSH,
  T_AND,
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
  T_DEG,
  T_DIVIDE,
  T_E,
  T_END,
  T_EXP,
  T_FRAC,
  T_INVERSE,
  T_LN,
  T_LOG,
  T_MIN,
  T_MINUS,
  T_MIXED,
  T_NCR,
  T_NEG,
  T_NPR,
  T_OPEN,
  T_PI,
  T_PLUS,
  T_POINT,
  T_POL,
  T_POW,
  T_POWT,
  T_REC,
  T_ROOT,
  T_SEC,
  T_SIN,
  T_SINH,
  T_SLASH,
  T_SQRT,
  T_SQUARE,
  T_TAN,
  T_TANH,
  T_TEN,
  T_TIMES,
  T_XNOR,
  T_XROOT,
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
export const K_ROOT = 18
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
export const ANN_HYP = 0x20
export const ANN_STAT = 0x40
export const ANN_D = 0x80
export const ANN_R = 0x100
export const ANN_G = 0x200
export const ANN_FIX = 0x400
export const ANN_EXP = 0x800
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
export const S_FUNC = 4
/** f(x) or FIND X asking for X. */
export const S_ASK = 5
let screen: u16 = S_CALC

/** The mode (MENU): CALC, then the four others in MENU's order; kept in KEEP_MODE. */
export const MODE_CALC = 0
export const MODE_STATS = 1
export const MODE_BASE = 2
export const MODE_TABLE = 3
export const MODE_EQN = 4
let mode: u16 = MODE_CALC

/** The line: its tokens, how many, and where the cursor is (before token `cursor`). */
export const line = bytes(200)
export let length: u16 = 0
export let cursor: u16 = 0
/** The line has been answered: its answer is on screen, and a key decides what comes next. */
export let answered: bool = false
/** SHIFT and ALPHA wait for the next key; STO and RCL for a variable's key. */
let shifted: bool = false
let alphaOn: bool = false
let storing: bool = false
let recalling: bool = false
/** Keys type over the token at the cursor (SHIFT DEL) rather than put one in before it. */
let overwrite: bool = false
/** HYP waits for SIN, COS or TAN. */
let hyp: bool = false
/** The answer came from FIND X (shown with its DIFF). */
let found: bool = false
/** Which line of the history is on screen (0 the newest), or none. */
let historyAt: u16 = 0xffff
/** The first character of the line on screen, when it is longer than the rows hold. */
let scrollFrom: u16 = 0
/** How the answer is shown (display.e16.ts SHOW_*). */
let shown: u16 = 0

/** The 2D display (0 in SETUP's KEEP_DISPLAY) or LINE. */
function twoD(): bool {
  return peek(KEEP_DISPLAY) === 0 && mode !== MODE_BASE
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
  modesReady()
  contrastBack()
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
  mode = peek(KEEP_MODE)
  if (mode > MODE_EQN) mode = MODE_CALC
  loadLine()
  startMode()
  drawCalc()
}

/* ---------------- modes ---------------- */

/** MENU's choice: the line of the mode left kept, the new mode's brought back. */
function enterMode(m: u16): void {
  saveLine()
  mode = m
  poke(KEEP_MODE, m)
  loadLine()
  answered = false
  historyAt = 0xffff
  screen = S_CALC
  startMode()
  drawCalc()
}

/** Where a mode keeps its line while another is on screen: length, cursor, tokens. */
function lineSlot(): u16 {
  if (mode === MODE_BASE) return BASE_LINE
  if (mode === MODE_TABLE) return TABLE_LINE
  return CALC_LINE
}

/** The longest line a mode takes: BASE's history keeps lines of 99. */
function lineMax(): u16 {
  if (mode === MODE_BASE) return 99
  if (mode === MODE_TABLE) return 197
  return LINE_MAX
}

function saveLine(): void {
  const slot = lineSlot()
  poke(slot, length)
  poke(slot + 1, cursor)
  memcpy(slot + 2, addr(line), length)
}

function loadLine(): void {
  const slot = lineSlot()
  length = peek(slot)
  cursor = peek(slot + 1)
  if (length > lineMax() || cursor > length) {
    length = 0
    cursor = 0
  }
  memcpy(addr(line), slot + 2, length)
}

/** A mode's own first screen. */
function startMode(): void {
  if (mode === MODE_EQN) eqnStart()
  else if (mode === MODE_STATS) statsStart()
  else if (mode === MODE_TABLE) tableReset()
}

/** Whether the mode's screen is its own (not the line CALC, BASE and TABLE edit). */
function ownScreen(): bool {
  return mode === MODE_STATS || mode === MODE_EQN
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

export function clearLine(): void {
  if (ownScreen()) {
    screen = S_CALC
    shifted = false
    alphaOn = false
    if (mode === MODE_STATS) statsReset()
    else eqnReset()
    drawCalc()
    return
  }
  if (mode === MODE_TABLE) tableReset()
  // AC forgets the constant too, as it forgets the line.
  dropConstant()
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
  dispatch(k, shift, alpha)
  drawMarks()
}

/** A key after SHIFT and ALPHA are taken: to the screen or the mode it is for. */
function dispatch(k: u16, shift: bool, alpha: bool): void {
  if (screen === S_ERROR) errorKey(k)
  else if (screen === S_MENU) chosenMode(menuKey(k))
  else if (screen === S_SETUP) {
    if (setupKey(k) !== 0) clearLine()
  } else if (screen === S_FUNC) funcChosen(mode === MODE_BASE ? baseFuncKey(k) : funcKey(k))
  else if (screen === S_ASK) asked(k, shift)
  else if (k === K_SETUP && shift) angleKey()
  else if (k === K_MENU || k === K_SETUP) openScreen(k)
  else modeKey(k, shift, alpha)
}

/** A key on the mode's own screen: STATS, EQUATION, TABLE's table, or a line. */
function modeKey(k: u16, shift: bool, alpha: bool): void {
  if (mode === MODE_STATS) statsKey(k, shift)
  else if (mode === MODE_EQN) {
    if (eqnKey(k, shift)) {
      enterMode(MODE_CALC)
      return
    }
  } else if (mode === MODE_TABLE && tablePhase() === TABLE_VIEW) tableKey(k)
  else {
    calcKey(k, shift, alpha)
    return
  }
  drawCalc()
}

/**
 * SHIFT SETUP (ANGLE): the answer - the line's, answered first, or Ans - in the next angle
 * unit, SETUP's unit with it (after EL-509E's list). CALC only.
 */
function angleKey(): void {
  if (mode !== MODE_CALC) {
    refuse()
    return
  }
  if (!answered && length > 0) equals(false)
  nextAngle()
  answered = true
  shown = SHOW_DECIMAL
  drawCalc()
}

/** MENU or SETUP over any mode. */
function openScreen(k: u16): void {
  noCursor()
  if (k === K_MENU) {
    screen = S_MENU
    menuScreen(mode)
  } else {
    screen = S_SETUP
    setupScreen()
  }
}

/** MENU's answer: 0 still choosing, AC (0xff) back as it was, 1-5 a mode. */
function chosenMode(m: u16): void {
  if (m === 0) return
  if (m === 0xff) {
    screen = S_CALC
    drawCalc()
  } else enterMode(m - 1)
}

/** On the error screen: AC drops the line, an arrow goes back into it at the error. */
function errorKey(k: u16): void {
  if (k === K_AC) {
    clearLine()
    return
  }
  if ((k === K_LEFT || k === K_RIGHT) && ownScreen()) {
    screen = S_CALC
    drawCalc()
    return
  }
  if (k === K_LEFT || k === K_RIGHT) {
    if (mode === MODE_TABLE) tableReset()
    screen = S_CALC
    answered = false
    cursor = errAt < length ? errAt : length
    drawCalc()
  }
}

/**
 * A key in BASE: its own (F⇄D, ▲ ▼ on an answer, FUNC), the line's editing, or a token of the
 * base; the rest beep.
 */
function baseKey(k: u16, shift: bool, alpha: bool): void {
  if (baseCommand(k)) {
    drawCalc()
    return
  }
  if (k === K_FUNC) {
    screen = S_FUNC
    noCursor()
    baseFuncScreen()
    return
  }
  if (editKey(k) && commandKey(k, shift, alpha)) return
  const t = baseToken(k)
  if (t === 0) refuse()
  else type(t)
}

/** The keys that edit or answer a line, the same in every mode that has one. */
function editKey(k: u16): bool {
  return (
    k === K_EQ ||
    k === K_AC ||
    k === K_DEL ||
    k === K_LEFT ||
    k === K_RIGHT ||
    k === K_UP ||
    k === K_DOWN
  )
}

/** TABLE's START, END or STEP given (the next asked for, or the table) or AC (f(X) again). */
function tableAsked(r: u16): void {
  if (r === ASK_DONE && tableNext()) {
    askRange(tableAsking(), rangeAt(tableAsking()))
    return
  }
  if (r === ASK_BACK) tableReset()
  if (r !== ASK_STAY) {
    screen = S_CALC
    drawCalc()
  }
}

/** FUNC's choice: a token typed, 1 back to the line, 0 still choosing. */
function funcChosen(t: u16): void {
  if (t === 0) return
  screen = S_CALC
  if (t === 1) drawCalc()
  else type(t)
}

/** A key while f(x) or FIND X asks for X. */
function asked(k: u16, shift: bool): void {
  const t = k === K_DEL || k === K_EQ || k === K_AC ? 0 : tokenOf(k, shift)
  const r = askKey(k === K_EQ, k === K_DEL, k === K_AC, t)
  if (mode === MODE_TABLE) {
    tableAsked(r)
    return
  }
  if (r === ASK_BACK) {
    screen = S_CALC
    drawCalc()
  } else if (r === ASK_DONE) {
    screen = S_CALC
    answered = true
    historyAt = 0xffff
    shown = found ? SHOW_FOUND : firstShown(formFirst(false))
    drawCalc()
  }
}

function calcKey(k: u16, shift: bool, alpha: bool): void {
  if (storing || recalling) {
    variableKey(k)
    return
  }
  if (mode === MODE_BASE) {
    baseKey(k, shift, alpha)
    return
  }
  const wasHyp = hyp
  hyp = false
  if (commandKey(k, shift, alpha)) return
  if (!alpha && templateKey(k, shift)) return
  if (!alpha && !shift && k === K_DMS) {
    dmsMark()
    return
  }
  const t = alpha ? letterOf(k) : wasHyp ? hypToken(k, shift) : tokenOf(k, shift)
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
  if (shift && (k === K_FRAC || k === K_POW)) {
    wrapped(k === K_FRAC ? T_MIXED : T_XROOT)
    return true
  }
  return plainTemplate(k, shift)
}

/** a/b, x^, √, 10ˣ and eˣ: in 2D a template, in LINE a / (the others type tokens). */
function plainTemplate(k: u16, shift: bool): bool {
  const fractionKey = k === K_FRAC && !shift
  if (!twoD()) {
    if (fractionKey) type(T_SLASH)
    return fractionKey
  }
  if (!fractionKey && !makesTemplate(k, shift)) return false
  const root = k === K_ROOT && !shift
  if (answered) afresh(fractionKey || k === K_POW)
  if (fractionKey) {
    wrap(addr(line), length, cursor, T_FRAC)
    edited()
  } else insertTemplate(k, root)
  tallEnough()
  drawCalc()
  return true
}

/** A mixed number or a root of any index, the value before the cursor its first part. */
function wrapped(opener: u16): void {
  if (answered) afresh(false)
  if (length + 4 > lineMax()) {
    refuse()
    return
  }
  wrap(addr(line), length, cursor, opener)
  edited()
  tallEnough()
  drawCalc()
}

/** A template too tall to show is taken back out (the last one put in), with a beep. */
function tallEnough(): void {
  if (!twoD() || heightOf(addr(line), length) <= LINE_HEIGHT_MAX) return
  refuse()
  deleteAt(addr(line), length, cursor)
  edited()
}

/**
 * °′″ after a number: its degrees, then its minutes, then its seconds; after an answer it
 * shows the answer in degrees-minutes-seconds and back.
 */
function dmsMark(): void {
  if (answered) {
    shown = shown === SHOW_DMS ? firstShown(formFirst(false)) : SHOW_DMS
    drawCalc()
    return
  }
  let marks: u16 = 0
  let j = cursor
  while (j > 0) {
    const t = line[j - 1]
    if (t === T_DEG || t === T_MIN || t === T_SEC) marks++
    else if (!isDigit(t) && t !== T_POINT) break
    j--
  }
  if (marks > 2 || j === cursor) {
    refuse()
    return
  }
  type(marks === 0 ? T_DEG : marks === 1 ? T_MIN : T_SEC)
}

/**
 * x^, √, SHIFT log (10ˣ) and SHIFT ln (eˣ): the keys that put in √ or a power. √ is a key of
 * its own, as often used as x² (its SHIFT face x³ and √'s ∛ are the same family's, not the
 * inverse: section 5.1's one exception).
 */
function makesTemplate(k: u16, shift: bool): bool {
  if (shift) return k === K_LOG || k === K_LN
  return k === K_POW || k === K_ROOT
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
    case K_AC:
      clearLine()
      return true
    case K_EQ:
      if (mode === MODE_TABLE) tableRange()
      else equals(shift)
      return true
    case K_FD:
      exactOrDecimal(shift)
      return true
    case K_FUNC:
      screen = S_FUNC
      noCursor()
      funcScreen()
      return true
    case K_FX:
      solveKey(shift)
      return true
    case K_HYP:
      hyp = !shift
      if (shift) refuse()
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
      // SHIFT DEL: typing over the token at the cursor, or put in before it again.
      if (shift) {
        overwrite = !overwrite
        drawCalc()
      } else deleteBefore()
      return true
    case K_DMS:
      if (!shift) return false
      if (answered) dmsMark()
      else refuse()
      return true
  }
  if (k !== K_MPLUS || alpha) return false
  memoryPlus(shift)
  return true
}

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
function hypToken(k: u16, shift: bool): u16 {
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
    t === T_NPR ||
    (t >= T_AND && t <= T_XNOR)
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
  // Typed over: only a token for a token - a template's marks are always put in.
  if (overwrite && cursor < length && overwritable(t) && overwritable(line[cursor])) {
    line[cursor] = t
    cursor++
    return
  }
  if (length >= lineMax()) {
    refuse()
    return
  }
  memcpy(addr(line) + cursor + 1, addr(line) + cursor, length - cursor)
  line[cursor] = t
  length++
  cursor++
}

/** Whether a token is no template's mark (and so may be typed over). */
function overwritable(t: u16): bool {
  return !opensTemplate(t) && !isSeparator(t) && t !== T_END
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
  // A number alone after 34+57 is 45+57: the constant made part of the line, which shows it.
  if (mode === MODE_CALC) {
    const made = withConstant(addr(line), length)
    if (made !== 0xffff) {
      length = made
      cursor = made
    }
  }
  clearStack()
  if (mode === MODE_BASE) baseEvaluate(addr(line), length)
  else evaluate(addr(line), length)
  if (mode === MODE_CALC) noteConstant(addr(line), length)
  copyValue(top(), KEEP_ANS)
  remember()
  answered = true
  historyAt = 0xffff
  found = false
  const first = line[0]
  if (first === T_POL || first === T_REC) shown = SHOW_PAIR
  else shown = firstShown(formFirst(approx))
  drawCalc()
}

/** Whether an answer shows its exact form first: in 2D, as SETUP says, unless ≈ or a decimal. */
function formFirst(approx: bool): bool {
  return twoD() && !approx && peek(KEEP_ANSWER) === 0 && !decimalTyped()
}

/** = on TABLE's f(X): START, END and STEP asked for, then the table. */
function tableRange(): void {
  if (length === 0) {
    refuse()
    return
  }
  tableAskFrom()
  screen = S_ASK
  askRange(0, rangeAt(0))
}

/** f(x) (FIND X after SHIFT): X asked for, then the line evaluated or solved for it. */
function solveKey(find: bool): void {
  if (answered) {
    answered = false
    cursor = length
  }
  if (length === 0) {
    refuse()
    return
  }
  found = find
  screen = S_ASK
  askStart(addr(line), length, find)
}

/** Whether the line has a decimal point in it: such a line is answered in decimals first. */
function decimalTyped(): bool {
  for (let i: u16 = 0; i < length; i++) {
    if (line[i] === T_POINT) return true
  }
  return false
}

/**
 * F⇄D: the answer's exact form, its mixed number, its decimal, and round again. SHIFT F⇄D (ENG):
 * its decimal with an exponent a multiple of 3.
 */
function exactOrDecimal(shift: bool): void {
  if (!answered || shown === SHOW_PAIR) {
    refuse()
    return
  }
  if (shift) shown = SHOW_ENG
  else if (twoD() && hasForm()) shown = nextShown(shown)
  else if (shown !== SHOW_DECIMAL && shown !== SHOW_FOUND) shown = SHOW_DECIMAL
  else {
    refuse()
    return
  }
  drawCalc()
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
  shown = firstShown(formFirst(false))
  found = false
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
  shown = firstShown(formFirst(false))
  found = false
  drawCalc()
}

/* ---------------- the history ---------------- */

/** The line kept, newest first; the oldest goes when all ten are taken. */
function remember(): void {
  const entries = historyEntries()
  if (entries === 0) return
  const at = historyAt_()
  const size = historySize()
  const count = peek16(historyCount())
  const kept = count < entries ? count : entries - 1
  memcpy(at + size, at, kept * size)
  poke(at, length)
  memcpy(at + 1, addr(line), length)
  poke16(historyCount(), kept + 1)
}

/* Each mode's history: CALC's ten lines, BASE's five; TABLE and the others keep none. */

function historyEntries(): u16 {
  if (mode === MODE_CALC) return HISTORY_ENTRIES
  return mode === MODE_BASE ? 5 : 0
}

function historyAt_(): u16 {
  return mode === MODE_BASE ? BASE_HISTORY : KEEP_HISTORY
}

function historySize(): u16 {
  return mode === MODE_BASE ? 100 : HISTORY_SIZE
}

function historyCount(): u16 {
  return mode === MODE_BASE ? BASE_HISTORY_COUNT : KEEP_HISTORY_COUNT
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
  const count = historyEntries() === 0 ? 0 : peek16(historyCount())
  const browsing = historyAt !== 0xffff
  if (!answered && length > 0 && !browsing) return
  let next = historyAt
  if (older) next = browsing ? historyAt + 1 : 0
  else if (browsing && historyAt > 0) next = historyAt - 1
  else return
  if (next >= count) return
  historyAt = next
  const entry = historyAt_() + next * historySize()
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
  if (mode === MODE_STATS) bits |= ANN_STAT
  if (hyp) bits |= ANN_HYP
  const format = peek(KEEP_FORMAT)
  if (format === FORMAT_FIX) bits |= ANN_FIX
  else if (format === FORMAT_EXP) bits |= ANN_EXP
  if (screen === S_CALC) bits |= historyMarks()
  marks(bits)
}

/** ▲ while ▲ brings an earlier line, ▼ while ▼ brings a later one. */
function historyMarks(): u16 {
  const count = historyEntries() === 0 ? 0 : peek16(historyCount())
  const browsing = historyAt !== 0xffff
  let bits: u16 = 0
  if (browsing ? historyAt + 1 < count : count > 0 && (answered || length === 0)) bits |= ANN_UP
  if (browsing && historyAt > 0) bits |= ANN_DOWN
  return bits
}

/** K: a constant kept for a number alone; OVR: typing over. */
function footMarks(): void {
  if (answered && mode === MODE_CALC && constantKept()) textAt(str('K'), 1, 56)
  if (!answered && overwrite) textAt(str('OVR'), 1, 56)
}

/** The line on its rows, and the answer below it when there is one. */
function drawCalc(): void {
  if (mode === MODE_BASE) {
    baseDraw()
    drawMarks()
    return
  }
  if (ownScreen() || (mode === MODE_TABLE && tablePhase() === TABLE_VIEW)) {
    noCursor()
    if (mode === MODE_STATS) statsDraw()
    else if (mode === MODE_EQN) eqnDraw()
    else tableDraw()
    drawMarks()
    return
  }
  cls()
  if (twoD()) drawLine2D()
  else drawLine()
  if (answered) drawAnswerAs(shown)
  footMarks()
  if (mode === MODE_TABLE) {
    textAt(str('TABLE f(X)'), 1, 47)
    textAt(str('=:START,END,STEP'), 1, 56)
  }
  drawMarks()
}

/** The line set in 2D (layout.e16.ts), the bar cursor where the layout found it. */
function drawLine2D(): void {
  setLine(addr(line), length, answered ? 0xffff : cursor)
  if (answered) noCursor()
  else barDots(cursorX, cursorTop)
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
