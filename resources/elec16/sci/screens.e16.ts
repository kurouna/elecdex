// ELEC-16 SCI, ROM bank 1: the screens other than the calculator's own (docs/elec16-sci.md
// sections 4.5 and 6.6) - MENU, SETUP, FUNC and the error screen - each in the one rhythm: a title
// band over rows 0-8, then a line every nine rows from row 11. Its code runs with bank 1 in the
// window; calc.e16.ts calls it through far_call.
import {
  addr,
  type bool,
  bytes,
  peek,
  poke,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
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
  K_AC,
  K_DOWN,
  K_UP,
  refuse,
} from './calc.e16'
import { band, bandWith, cls, lineY, mark, textAt } from './lcd.e16'
import {
  E_FIND,
  E_MATH,
  E_RANGE,
  E_STACK,
  FORMAT_AUTO,
  FORMAT_EXP,
  FORMAT_FIX,
  KEEP_ANGLE,
  KEEP_ANSWER,
  KEEP_DIGITS,
  KEEP_DISPLAY,
  KEEP_FORMAT,
  KEEP_MIXED,
} from './numbers.e16'
import { T_GCD, T_INT, T_LCM, T_PERCENT, T_POL, T_RAN, T_REC, T_RND } from './tokens.e16'

/* ---------------- the error screen ---------------- */

/** ERR:MATH, ERR:SYNTAX or ERR:STACK, what it means, and what the keys do now. */
export function errorScreen(code: u16): void {
  if (code === E_MATH) {
    band(str('ERR:MATH'))
    textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
    textAt(str('RANGE, OR /0'), 1, lineY(1))
  } else if (code === E_FIND) {
    band(str('ERR:FIND'))
    textAt(str('NO X WAS FOUND FROM'), 1, lineY(0))
    textAt(str('THE X IT STARTED AT'), 1, lineY(1))
  } else if (code === E_RANGE) {
    band(str('ERR:RANGE'))
    textAt(str('1-30 ROWS FROM START'), 1, lineY(0))
    textAt(str('TO END BY STEP'), 1, lineY(1))
  } else if (code === E_STACK) {
    band(str('ERR:STACK'))
    textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
    textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  } else {
    band(str('ERR:SYNTAX'))
    textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
    textAt(str('AT THE CURSOR'), 1, lineY(1))
  }
  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  textAt(str('AC:CLEAR'), 1, lineY(5))
}

/* ---------------- MENU ---------------- */

/** The modes, the one it is in marked. */
export function menuScreen(mode: u16): void {
  cls()
  band(str('MENU'))
  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  textAt(str('5:EQUATION'), 1, lineY(2))
  textAt(str('AC:BACK'), 1, lineY(5))
  if (mode === 0) mark(0, 6, 0)
  else if (mode === 1) mark(10, 7, 0)
  else if (mode === 2) mark(0, 6, 1)
  else if (mode === 3) mark(10, 7, 1)
  else mark(0, 10, 2)
}

/** A key on MENU: 1-5 the mode chosen, AC (0xff) back to the one it was; 0 still choosing. */
export function menuKey(k: u16): u16 {
  if (k === K_AC) return 0xff
  const d = digitOf(k)
  if (d >= 1 && d <= 5) return d
  refuse()
  return 0
}

/* ---------------- SETUP ---------------- */

/** SETUP's page (0 or 1, ▼ and ▲), and FIX's or EXP's digits being asked for (0: not). */
let page: u16 = 0
let asking: u16 = 0

/** SETUP opened: its first page. */
export function setupScreen(): void {
  page = 0
  asking = 0
  drawSetup()
}

/**
 * Page 1: the display (1 2D, 2 LINE), the angle (3 DEG, 4 RAD, 5 GRAD), which form an answer
 * shows first (6 its exact form, 7 its decimal) and how a decimal is shown (8 FIX, 9 EXP and
 * then their digits, 0 AUTO). Page 2: a fraction over 1 as it is or as a mixed number. Each
 * choice marked.
 */
function drawSetup(): void {
  cls()
  bandWith(str('SETUP'), page === 0 ? str('1/2') : str('2/2'))
  textAt(str('AC:BACK'), 1, lineY(5))
  if (page === 1) {
    textAt(str('1:a/b  2:a b/c'), 1, lineY(0))
    if (peek(KEEP_MIXED) === 1) mark(7, 7, 0)
    else mark(0, 5, 0)
    return
  }
  textAt(str('1:2D  2:LINE'), 1, lineY(0))
  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(1))
  textAt(str('6:EXACT 7:DECIMAL'), 1, lineY(2))
  textAt(str('8:FIX 9:EXP 0:AUTO'), 1, lineY(3))
  marksOfPage1()
  drawDigits()
}

function marksOfPage1(): void {
  if (peek(KEEP_DISPLAY) === 1) mark(6, 6, 0)
  else mark(0, 4, 0)
  const angle = peek(KEEP_ANGLE)
  if (angle === 1) mark(6, 5, 1)
  else if (angle === 2) mark(12, 6, 1)
  else mark(0, 5, 1)
  if (peek(KEEP_ANSWER) === 1) mark(8, 9, 2)
  else mark(0, 7, 2)
  const shape = peek(KEEP_FORMAT)
  if (shape === FORMAT_FIX) mark(0, 5, 3)
  else if (shape === FORMAT_EXP) mark(6, 5, 3)
  else mark(12, 6, 3)
}

/** Line 5: the digits asked for, or FIX's or EXP's now. */
function drawDigits(): void {
  const shape = asking !== 0 ? asking : peek(KEEP_FORMAT)
  if (shape === FORMAT_AUTO) return
  textAt(shape === FORMAT_FIX ? str('FIX') : str('EXP'), 1, lineY(4))
  if (asking !== 0) textAt(str('0-9?'), 25, lineY(4))
  else {
    digitText[0] = 0x30 + peek(KEEP_DIGITS)
    digitText[1] = 0
    textAt(addr(digitText), 25, lineY(4))
  }
}

const digitText = bytes(2)

/** A key on SETUP: a choice is set and shown; AC leaves (non-zero). */
export function setupKey(k: u16): u16 {
  if (k === K_AC) return 1
  if (asking !== 0) {
    const d = digitOf(k)
    if (d === 0xffff) {
      refuse()
      return 0
    }
    poke(KEEP_FORMAT, asking)
    poke(KEEP_DIGITS, d)
    asking = 0
  } else if (k === K_DOWN || k === K_UP) page = k === K_DOWN ? 1 : 0
  else if (!setupChoice(k)) {
    refuse()
    return 0
  }
  drawSetup()
  return 0
}

/** The choice a key makes on SETUP's page, kept: false for a key that makes none. */
function setupChoice(k: u16): bool {
  if (page === 1) return mixedChoice(k)
  switch (k) {
    case K_1:
    case K_2:
      poke(KEEP_DISPLAY, k === K_1 ? 0 : 1)
      return true
    case K_3:
    case K_4:
    case K_5:
      poke(KEEP_ANGLE, k === K_3 ? 0 : k === K_4 ? 1 : 2)
      return true
    case K_6:
    case K_7:
      poke(KEEP_ANSWER, k === K_6 ? 0 : 1)
      return true
    case K_8:
    case K_9:
      asking = k === K_8 ? FORMAT_FIX : FORMAT_EXP
      return true
    case K_0:
      poke(KEEP_FORMAT, FORMAT_AUTO)
      return true
  }
  return false
}

/** Page 2's choice: a fraction over 1 as it is (1) or as a mixed number (2). */
function mixedChoice(k: u16): bool {
  if (k !== K_1 && k !== K_2) return false
  poke(KEEP_MIXED, k === K_1 ? 0 : 1)
  return true
}

/* ---------------- FUNC ---------------- */

/** The functions no key carries (section 5.1), by number. */
export function funcScreen(): void {
  cls()
  band(str('FUNC'))
  textAt(str('1:gcd   2:lcm'), 1, lineY(0))
  textAt(str('3:Int   4:Rnd'), 1, lineY(1))
  textAt(str('5:Ran#  6:%'), 1, lineY(2))
  textAt(str('7:Pol   8:Rec'), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
}

/** A key on FUNC: the token it types (the calculator types it), 1 to go back, 0 to stay. */
export function funcKey(k: u16): u16 {
  if (k === K_AC) return 1
  const t = funcToken(digitOf(k))
  if (t === 0) refuse()
  return t
}

/** The token of FUNC's item `d` (1-8); 0 for none. */
function funcToken(d: u16): u16 {
  switch (d) {
    case 1:
      return T_GCD
    case 2:
      return T_LCM
    case 3:
      return T_INT
    case 4:
      return T_RND
    case 5:
      return T_RAN
    case 6:
      return T_PERCENT
    case 7:
      return T_POL
    case 8:
      return T_REC
  }
  return 0
}

/** A digit key's digit; 0xffff for another key. */
function digitOf(k: u16): u16 {
  if (k === K_0) return 0
  if (k === K_1) return 1
  if (k === K_2) return 2
  if (k === K_3) return 3
  if (k >= K_4 && k <= K_6) return 4 + k - K_4
  if (k >= K_7 && k <= K_9) return 7 + k - K_7
  return 0xffff
}

/* ---------------- a fault ---------------- */

/** A break or a fault in a program (CODE's RUN): what stopped and where. */
export function faultScreen(cause: u16, pc: u16): void {
  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  else band(str('FAULT'))
  textAt(str('CAUSE'), 1, lineY(0))
  hexAt(cause, 43, lineY(0))
  textAt(str('AT'), 1, lineY(1))
  hexAt(pc, 43, lineY(1))
  textAt(str('AC:CLEAR'), 1, lineY(5))
}

const hexText = bytes(6)

function hexAt(v: u16, x: u16, y: u16): void {
  for (let s: u16 = 0; s < 4; s++) {
    const d = (v >> (12 - s * 4)) & 15
    hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
  }
  hexText[4] = 0
  textAt(addr(hexText), x, y)
}
