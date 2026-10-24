// What CALC, BASE and TABLE's line show, and the marks over every screen: the line in 2D or as
// rows of characters, the answer under it, a mode's own screen. Kept apart from the keys
// (calc.e16.ts) in a bank of its own beside the layout it calls, so the fixed ROM keeps its room;
// it reads calc's state and writes only its own scroll.
import { addr, div, peek, peek16, str, type u16 } from '../../../src/shared/e16c/builtins'
import { baseDraw } from './base.e16'
import {
  ANN_2D,
  ANN_A,
  ANN_D,
  ANN_DOWN,
  ANN_EXP,
  ANN_FIX,
  ANN_G,
  ANN_HYP,
  ANN_M,
  ANN_R,
  ANN_S,
  ANN_STAT,
  ANN_STO,
  ANN_UP,
  alphaOn,
  answered,
  cursor,
  historyAt,
  historyCount,
  historyEntries,
  hyp,
  length,
  line,
  MODE_BASE,
  MODE_CALC,
  MODE_EQN,
  MODE_STATS,
  MODE_TABLE,
  mode,
  overwrite,
  ownScreen,
  recalling,
  S_CALC,
  screen,
  shifted,
  shown,
  storing,
  twoD,
} from './calc.e16'
import { drawAnswerAs } from './display.e16'
import { eqnDraw } from './equation.e16'
import { constantKept } from './extras.e16'
import { cursorTop, cursorX, setLine } from './layout.e16'
import { barAt, barDots, COLS, cls, drawChar, marks, noCursor, textAt } from './lcd.e16'
import { FORMAT_EXP, FORMAT_FIX, KEEP_ANGLE, KEEP_FORMAT, varAt } from './numbers.e16'
import { statsDraw } from './stats.e16'
import { TABLE_VIEW, tableDraw, tablePhase } from './table.e16'
import { tokenText, tokenWidth } from './tokens.e16'

/** The line's rows on screen: four of 21 characters. */
const LINE_ROWS = 4
const LINE_CHARS = 84

/** The first character of the line on screen, when it is longer than the rows hold. */
let scrollFrom: u16 = 0

/** The marks: S, A, STO, M while it is not 0, the angle, ▲ ▼ where the history goes. */
export function drawAnnunciators(): void {
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
export function drawScreen(): void {
  if (mode === MODE_BASE) {
    baseDraw()
    drawAnnunciators()
    return
  }
  if (ownScreen() || (mode === MODE_TABLE && tablePhase() === TABLE_VIEW)) {
    noCursor()
    if (mode === MODE_STATS) statsDraw()
    else if (mode === MODE_EQN) eqnDraw()
    else tableDraw()
    drawAnnunciators()
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
  drawAnnunciators()
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
