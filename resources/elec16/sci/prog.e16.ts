// ELEC-16 SCI, ROM bank 5 beside the answer's ways of showing: PROG, programs (docs/elec16-sci.md
// section 14.8). Four programs kept in v2's region, each a line of statements between colons,
// edited as the calculator's own line (LINE) and run by =: an expression, one stored (→V),
// shown (▶), a value asked for (?→V), a condition (⇒), lbl and goto. A statement is evaluated
// where it is in the line, so an error's place is the program's own. ON (BRK) stops a run at
// any time; AC too while ? or ▶ waits for a key.
import { addr, type bool, bytes, div, peek, str, type u16 } from '../../../src/shared/e16c/builtins'
import { getkey, K_AC, K_ALPHA, K_DEL, K_EQ, K_SHIFT, refuse } from './calc.e16'
import { drawAnswerAs, SHOW_DECIMAL } from './display.e16'
import { evaluate } from './eval.e16'
import { digitOf, letterOf, tokenOf } from './keymap.e16'
import { bandWith, cls, lineY, noCursor, textAt } from './lcd.e16'
import {
  clearStack,
  copyValue,
  E_SYNTAX,
  ERR_PINNED,
  errFrom,
  fail,
  isZero,
  KEEP_ANS,
  PROG_CHOSEN,
  PROGRAM_SIZE,
  PROGRAMS,
  push,
  top,
  varAt,
} from './numbers.e16'
import {
  isVariable,
  T_ASK,
  T_COLON,
  T_GOTO,
  T_LBL,
  T_SHOW,
  T_STORE,
  T_THEN,
  tokenText,
} from './tokens.e16'

/** ON's way back into the key loop (main.s): the stack reset, the list on screen. */
declare function calc_on(): void

export const PROG_LIST = 0
const PROG_EDIT = 1
let progNow: u16 = PROG_LIST

export function progPhase(): u16 {
  return progNow
}

/** PROG's list on screen (entering PROG, AC, ON). */
export function progList(): void {
  progNow = PROG_LIST
}

/** The program chosen is the line being edited. */
export function progEdit(): void {
  progNow = PROG_EDIT
}

/* ---------------- the list ---------------- */

/** A key on the list: 1-4 a program, 0xff AC (back to CALC), 0 nothing. */
export function progListKey(k: u16): u16 {
  if (k === K_AC) return 0xff
  const d = digitOf(k)
  if (d >= 1 && d <= 4) return d
  refuse()
  return 0
}

const listText = bytes(24)

/** The four programs, each its size in steps (tokens) or EMPTY. */
export function progDrawList(): void {
  noCursor()
  bandWith(str('PROG'), 0)
  for (let p: u16 = 0; p < 4; p++) {
    const n = peek(PROGRAMS + p * PROGRAM_SIZE)
    listText[0] = 0x31 + p
    listText[1] = 0x3a
    listText[2] = 0x50
    listText[3] = 0x31 + p
    listText[4] = 0x20
    listText[5] = 0x20
    let i: u16 = 6
    if (n === 0) i = copyInto(str('EMPTY'), i)
    else {
      if (n >= 100) {
        listText[i] = 0x30 + div(n, 100)
        i++
      }
      if (n >= 10) {
        listText[i] = 0x30 + (div(n, 10) % 10)
        i++
      }
      listText[i] = 0x30 + (n % 10)
      i = copyInto(str(' STEPS'), i + 1)
    }
    textAt(addr(listText), 1, lineY(p))
  }
  textAt(str('1-4:EDIT AC:BACK'), 1, lineY(5))
}

function copyInto(s: u16, from: u16): u16 {
  let i = from
  let p = s
  while (peek(p) !== 0) {
    listText[i] = peek(p)
    i++
    p++
  }
  listText[i] = 0
  return i
}

/** Under a program being edited, on one row (OVR has the last): its name and what = and AC do. */
export function progDrawFoot(): void {
  listText[0] = 0x50
  listText[1] = 0x31 + peek(PROG_CHOSEN)
  listText[2] = 0
  textAt(addr(listText), 1, lineY(4))
  textAt(str('=:RUN AC:LIST'), 19, lineY(4))
}

/* ---------------- FUNC ---------------- */

/** PROG's own pages of FUNC, before the calculator's (screens.e16.ts). */
export const PROG_PAGES = 3

export function progFuncPage(page: u16): void {
  if (page === 0) {
    textAt(str('1:?      2:\x94'), 1, lineY(0))
    textAt(str('3:\x8b      4::'), 1, lineY(1))
    textAt(str('5:\xe1'), 1, lineY(2))
  } else if (page === 1) {
    textAt(str('1:=      2:\xe2'), 1, lineY(0))
    textAt(str('3:<      4:>'), 1, lineY(1))
    textAt(str('5:\xe3      6:\xe4'), 1, lineY(2))
  } else {
    textAt(str('1:lbl    2:goto'), 1, lineY(0))
    textAt(str('0:CLEAR'), 1, lineY(1))
  }
}

/**
 * The token of item `d` on PROG's page `page`; 0xfe CLEAR, 0 none. Pages 1 and 2 are tables of
 * tokens: ? → ▶ : ⇒, then = ≠ < > ≤ ≥ (tokens.e16.ts T_ASK ... T_GE).
 */
export function progFuncToken(page: u16, d: u16): u16 {
  if (page === 2) {
    if (d === 1) return T_LBL
    if (d === 2) return T_GOTO
    return d === 0 ? 0xfe : 0
  }
  const n = page === 0 ? 5 : 6
  if (d < 1 || d > n) return 0
  return peek((page === 0 ? str('?\x94\x8b:\xb8') : str('=\xb9<>\xba\xbb')) + d - 1)
}

/* ---------------- a run ---------------- */

/** The program being run, and its length. */
let runFrom: u16 = 0
let runLength: u16 = 0

function ptok(i: u16): u16 {
  return i < runLength ? peek(runFrom + i) : 0
}

/**
 * The program at `from`, `length` tokens, run from its start: Ans is the last value worked out,
 * left on the value stack for = to keep.
 */
export function progRun(from: u16, length: u16): void {
  runFrom = from
  runLength = length
  let s: u16 = 0
  while (s < runLength) s = statement(s, statementEnd(s))
  clearStack()
  copyValue(KEEP_ANS, push(0))
}

/** Where the statement from `s` ends: its colon, or the program's end. */
function statementEnd(s: u16): u16 {
  let e = s
  while (e < runLength && ptok(e) !== T_COLON) e++
  return e
}

/** The statement from `s` to `e` (its colon) done: where the run goes on. */
function statement(s: u16, e: u16): u16 {
  const t = ptok(s)
  if (s === e || t === T_LBL) return e + 1
  if (t === T_GOTO) return labelAt(ptok(s + 1), s)
  if (t === T_ASK) {
    if (ptok(s + 1) !== T_STORE || !isVariable(ptok(s + 2)) || e !== s + 3) fail(E_SYNTAX, s)
    ask(ptok(s + 2), s)
    return e + 1
  }
  const then = find(T_THEN, s, e)
  if (then === 0xffff) valueStatement(s, e)
  else {
    runPart(s, then)
    if (!isZero(top())) return statement(then + 1, e)
  }
  return e + 1
}

/** An expression into Ans, then into a variable after →, then shown after ▶. */
function valueStatement(s: u16, e: u16): void {
  const store = find(T_STORE, s, e)
  const show = ptok(e - 1) === T_SHOW
  let end = store !== 0xffff ? store : e
  if (store === 0xffff && show) end = e - 1
  runPart(s, end)
  copyValue(top(), KEEP_ANS)
  if (store !== 0xffff) {
    const v = ptok(store + 1)
    if (!isVariable(v) || e !== store + (show ? 3 : 2)) fail(E_SYNTAX, store)
    copyValue(KEEP_ANS, varAt(v))
  }
  if (show) showStep()
}

/** The first `t` from `s` to `e`; 0xffff for none. */
function find(t: u16, s: u16, e: u16): u16 {
  for (let i = s; i < e; i++) {
    if (ptok(i) === t) return i
  }
  return 0xffff
}

/** Tokens `s` to `e` evaluated where they are: the value on top of the stack. */
function runPart(s: u16, e: u16): void {
  clearStack()
  errFrom(s)
  evaluate(runFrom + s, e - s)
  errFrom(0)
}

/** Where `lbl d` is (a statement's start); SYNTAX at the goto when there is none. */
function labelAt(d: u16, at: u16): u16 {
  let s: u16 = 0
  while (s < runLength) {
    if (ptok(s) === T_LBL && ptok(s + 1) === d) return s
    s = statementEnd(s) + 1
  }
  fail(E_SYNTAX, at)
  return 0
}

/* ---------------- ? and ▶ ---------------- */

/** What is typed for ?. */
const promptLine = bytes(40)
let promptLength: u16 = 0
const promptText = bytes(24)

/** SHIFT and ALPHA waiting while ? is answered. */
let promptShift: bool = false
let promptAlpha: bool = false

/** ?→V: V? asked, a line typed and evaluated into V with =; AC stops the run, as ON does. */
function ask(v: u16, s: u16): void {
  promptLength = 0
  promptShift = false
  promptAlpha = false
  for (;;) {
    drawPrompt(v)
    const k = getkey()
    if (k === K_EQ && promptLength > 0) {
      clearStack()
      // An error in what was typed goes back to the ? statement.
      errFrom(ERR_PINNED | s)
      evaluate(addr(promptLine), promptLength)
      errFrom(0)
      copyValue(top(), varAt(v))
      return
    }
    promptKey(k)
  }
}

/** A key while ? waits, other than the = that answers it. */
function promptKey(k: u16): void {
  if (k === K_SHIFT) {
    promptShift = !promptShift
    promptAlpha = false
  } else if (k === K_ALPHA) {
    promptAlpha = !promptAlpha
    promptShift = false
  } else if (k === K_AC) calc_on()
  else if (k === K_DEL && promptLength > 0) promptLength--
  else
    promptToken(k === K_EQ || k === K_DEL ? 0 : promptAlpha ? letterOf(k) : tokenOf(k, promptShift))
}

/** The token a key typed for ?, put at the end (0: none, a beep). */
function promptToken(t: u16): void {
  promptShift = false
  promptAlpha = false
  if (t === 0 || promptLength >= 40) refuse()
  else {
    promptLine[promptLength] = t
    promptLength++
  }
}

function drawPrompt(v: u16): void {
  noCursor()
  cls()
  bandWith(programName(), 0)
  promptText[0] = v
  promptText[1] = 0x3f
  promptText[2] = 0
  textAt(addr(promptText), 1, lineY(0))
  // What is typed, its last 21 characters.
  let n: u16 = 0
  for (let i: u16 = 0; i < promptLength; i++) {
    const s = tokenText(promptLine[i])
    if (s === 0) n = put(promptLine[i], n)
    else {
      let p = s
      while (peek(p) !== 0) {
        n = put(peek(p), n)
        p++
      }
    }
  }
  promptText[n] = 0
  textAt(addr(promptText), 1, lineY(1))
  textAt(str('=:OK AC:STOP'), 1, lineY(5))
}

/** A character put at `n` of the entry's text, scrolled to keep the last 21. */
function put(c: u16, n: u16): u16 {
  if (n < 21) {
    promptText[n] = c
    return n + 1
  }
  for (let i: u16 = 0; i < 20; i++) promptText[i] = promptText[i + 1]
  promptText[20] = c
  return 21
}

/** ▶: Ans shown in big digits until =; AC stops the run. */
function showStep(): void {
  noCursor()
  cls()
  bandWith(programName(), 0)
  textAt(str('=:GO ON AC:STOP'), 1, lineY(0))
  drawAnswerAs(SHOW_DECIMAL)
  for (;;) {
    const k = getkey()
    if (k === K_EQ) return
    if (k === K_AC) calc_on()
    refuse()
  }
}

const nameText = bytes(4)

function programName(): u16 {
  nameText[0] = 0x50
  nameText[1] = 0x31 + peek(PROG_CHOSEN)
  nameText[2] = 0
  return addr(nameText)
}
