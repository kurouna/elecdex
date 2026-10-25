// ELEC-16 SCI, ROM bank 1: the screens other than the calculator's own (docs/elec16-sci.md
// sections 4.5 and 6.6) - MENU, SETUP, FUNC and the error screen - each in the one rhythm: a title
// band over rows 0-8, then a line every nine rows from row 11. Its code runs with bank 1 in the
// window; calc.e16.ts calls it through far_call.

import {
  addr,
  type bool,
  bytes,
  csrw,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u16,
  wfi,
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
  K_EQ,
  K_LEFT,
  K_RIGHT,
  K_UP,
  MODE_CPLX,
  MODE_MATRIX,
  MODE_PROG,
  mode,
  refuse,
} from './calc.e16'
import { cplxFuncKey, cplxFuncScreen } from './cplx.e16'
import { exactWhole } from './exact.e16'
import { digitOf } from './keymap.e16'
import { band, bandWith, centre, cls, dot, lineY, mark, marks, noCursor, textAt } from './lcd.e16'
import { matFuncKey, matFuncScreen } from './matview.e16'
import {
  BASE_RADIX,
  CPLX_ANS,
  E_DIM,
  E_FIND,
  E_MATH,
  E_RANGE,
  E_STACK,
  FORMAT_AUTO,
  FORMAT_AUTO2,
  FORMAT_EXP,
  FORMAT_FIX,
  IO_CONTRAST,
  KEEP,
  KEEP_ANGLE,
  KEEP_ANS,
  KEEP_ANSWER,
  KEEP_CONTRAST,
  KEEP_DIGITS,
  KEEP_DISPLAY,
  KEEP_FORMAT,
  KEEP_MARK,
  KEEP_MIXED,
  KEEP_VARS,
  MATRICES,
  MATRIX_SIZE,
  MODES,
  MODES_END,
  MODES_MARK,
  STATS_COUNT,
  V2,
  V2_END,
  V2_MARK,
  VALUE_SIZE,
} from './numbers.e16'
import { PROG_PAGES, progFuncPage, progFuncToken } from './prog.e16'
import {
  FUNC_PRIME,
  T_COIN,
  T_DERIV,
  T_DICE,
  T_GCD,
  T_INT,
  T_INTEG,
  T_LCM,
  T_MILLI,
  T_MOD,
  T_NLOW,
  T_PERCENT,
  T_POL,
  T_PROD,
  T_RAN,
  T_REC,
  T_RINT,
  T_RND,
  T_SIGMA,
  T_STAT_C,
  T_STAT_N,
  T_TOZ,
  T_X2EST,
  T_XEST,
  T_YEST,
} from './tokens.e16'

/* ---------------- switched on ---------------- */

const IO_TCOUNT = 0xff30
const IO_TCMP = 0xff32
const IO_TCTRL = 0xff34
const CSR_MIE = 0x304

/**
 * Switched on (calc.e16.ts calcCold): the kept regions checked - each set out afresh when its
 * mark is not there - the LCD's contrast put back, the name shown for a moment or until a key.
 * Run once a power on, so it lives here rather than in the fixed ROM.
 */
export function powerOn(): void {
  keepReady()
  modesReady()
  v2Ready()
  contrastBack()
  cls()
  noCursor()
  centre(2, str('ELEC-16 SCI'), 11)
  centre(4, str('SCI-128'), 7)
  marks(0)
  pause(700)
}

/** The contrast SETUP keeps, put back on the LCD (at power on). */
function contrastBack(): void {
  const kept = peek(KEEP_CONTRAST)
  if (kept !== 0) poke16(IO_CONTRAST, kept - 1)
}

/** Whether v2's region is set out; when not, it is: empty lines, no matrices, no programs. */
function v2Ready(): void {
  if (peek16(V2) === V2_MARK) return
  for (let i: u16 = 0; i < V2_END - V2; i += 2) poke16(V2 + i, 0)
  poke16(V2, V2_MARK)
}

/** Whether the modes' region is set out; when not, it is: empty, 1-VAR, DEC, f(X) empty. */
function modesReady(): void {
  if (peek16(MODES) === MODES_MARK) return
  for (let i: u16 = 0; i < MODES_END - MODES; i += 2) poke16(MODES + i, 0)
  poke16(MODES, MODES_MARK)
  poke(BASE_RADIX, 1)
}

/**
 * Whether the kept region is a calculator's; when not, it is set out afresh: DEG, 2D, Ans and
 * the variables an exact 0 (a 0 with no form would take the form from what it is added to).
 */
function keepReady(): void {
  if (peek16(KEEP) === KEEP_MARK) return
  for (let i: u16 = 0; i < 0x182; i += 2) poke16(KEEP + i, 0)
  poke16(KEEP, KEEP_MARK)
  zeroValues()
}

/** Ans and the variables an exact 0 (SETUP's CLEAR MEMORY too). */
function zeroValues(): void {
  // Ans and the variables are apart: the mode and the contrast sit between them (0C2C).
  for (let i: u16 = 0; i < VALUE_SIZE; i++) poke(KEEP_ANS + i, 0)
  for (let i: u16 = 0; i < 9 * VALUE_SIZE; i++) poke(KEEP_VARS + i, 0)
  exactWhole(KEEP_ANS)
  for (let k: u16 = 0; k < 9; k++) exactWhole(KEEP_VARS + k * VALUE_SIZE)
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
  } else if (code === E_DIM) {
    band(str('ERR:DIM'))
    textAt(str('THE SIZES OF THE'), 1, lineY(0))
    textAt(str('MATRICES DO NOT FIT'), 1, lineY(1))
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
  textAt(str('5:EQUATION 6:CPLX'), 1, lineY(2))
  textAt(str('7:MATRIX  8:PROG'), 1, lineY(3))
  textAt(str('AC:BACK'), 1, lineY(5))
  // The mode marked: two a line, the left column's at 0, the right's at 10 (CPLX's at 11).
  const n = mode >> 1
  if (mode === 4) mark(0, 10, n)
  else if (mode === 6) mark(0, 8, n)
  else if (mode === 5) mark(11, 6, n)
  else if ((mode & 1) === 0) mark(0, 6, n)
  else mark(10, mode === 7 ? 6 : 7, n)
}

/** A key on MENU: 1-8 the mode chosen, AC (0xff) back to the one it was; 0 still choosing. */
export function menuKey(k: u16): u16 {
  if (k === K_AC) return 0xff
  const d = digitOf(k)
  if (d >= 1 && d <= 8) return d
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
    textAt(str('CONTRAST'), 1, lineY(2))
    contrastBar()
    textAt(clearing ? str('=:CLEAR ALL?') : str('3:CLEAR MEMORY'), 1, lineY(3))
    textAt(str('\x8c\x8b:CONTRAST'), 1, lineY(4))
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

/** The contrast as a bar of 16 steps after its name, the steps up to it filled. */
function contrastBar(): void {
  const now = peek16(IO_CONTRAST)
  const y = lineY(2)
  for (let k: u16 = 0; k < 16; k++) {
    const x = 56 + k * 4
    for (let row: u16 = k <= now ? 0 : 6; row < 7; row++) {
      dot(x, y + row)
      dot(x + 1, y + row)
    }
  }
}

/** ◀ ▶ on SETUP's page 2: the contrast one step down or up, on the LCD and kept. */
function contrastStep(up: bool): void {
  const now = peek16(IO_CONTRAST)
  if (up ? now >= 15 : now === 0) {
    refuse()
    return
  }
  const next = up ? now + 1 : now - 1
  poke16(IO_CONTRAST, next)
  poke(KEEP_CONTRAST, next + 1)
}

/** Line 5: the digits asked for, or FIX's or EXP's now. */
function drawDigits(): void {
  const shape = asking !== 0 ? asking : peek(KEEP_FORMAT)
  if (shape === FORMAT_AUTO) return
  if (shape === FORMAT_AUTO2) {
    textAt(str('AUTO2'), 1, lineY(4))
    return
  }
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
  if (clearing) {
    // CLEAR MEMORY asked: = clears, any other key keeps it all.
    clearing = false
    if (k === K_EQ) clearMemory()
    drawSetup()
    return 0
  }
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
  else if (page === 1 && (k === K_LEFT || k === K_RIGHT)) contrastStep(k === K_RIGHT)
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
      poke(KEEP_FORMAT, peek(KEEP_FORMAT) === FORMAT_AUTO ? FORMAT_AUTO2 : FORMAT_AUTO)
      return true
  }
  return false
}

/** Page 2's choice: a fraction over 1 as it is (1) or as a mixed number (2). */
function mixedChoice(k: u16): bool {
  if (k === K_3) {
    clearing = true
    return true
  }
  if (k !== K_1 && k !== K_2) return false
  poke(KEEP_MIXED, k === K_1 ? 0 : 1)
  return true
}

/** CLEAR MEMORY waits for = (after EL-509E's list). */
let clearing: bool = false

/** Every variable (A-F, X, Y, M) and Ans 0, STATS' table empty, CPLX's Ans and the matrices too. */
function clearMemory(): void {
  zeroValues()
  poke16(STATS_COUNT, 0)
  for (let i: u16 = 0; i < 16; i++) poke(CPLX_ANS + i, 0)
  for (let i: u16 = 0; i < 5 * MATRIX_SIZE; i++) poke(MATRICES + i, 0)
}

/* ---------------- FUNC ---------------- */

/**
 * FUNC's page (▼ and ▲): the functions, v3's MORE (section 15.7), random numbers, STATS' results,
 * its sums and estimates; in PROG its own pages come first (prog.e16.ts), and CPLX and MATRIX
 * have FUNC screens of their own (cplx.e16.ts, matrix.e16.ts).
 */
let funcPage: u16 = 0
const FUNC_PAGES = 7
const PAGE_ENG = 1
const PAGE_MORE = 2
const PAGE_RANDOM = 3
const PAGE_STATS = 4
const PAGE_DIST = 6

/** PROG's pages before the calculator's. */
function extraPages(): u16 {
  return mode === MODE_PROG ? PROG_PAGES : 0
}

/**
 * The functions no key carries (section 5.1), by number, as they go into the line (section
 * 4.4); then random numbers; then STATS' results, its sums and the estimates on its curve,
 * worked out from its table when the line is (after EL-509E's list).
 */
export function funcScreen(): void {
  funcPage = 0
  if (mode === MODE_CPLX) cplxFuncScreen()
  else if (mode === MODE_MATRIX) matFuncScreen()
  else drawFuncPage()
}

const funcPageText = bytes(6)

/** The page and how many: PROG's ten (its three and the calculator's seven) take two digits. */
function funcPageOf(): void {
  let i: u16 = 0
  const page = funcPage + 1
  const pages = FUNC_PAGES + extraPages()
  if (page >= 10) {
    funcPageText[i] = 0x31
    i++
  }
  funcPageText[i] = 0x30 + (page % 10)
  funcPageText[i + 1] = 0x2f
  i += 2
  if (pages >= 10) {
    funcPageText[i] = 0x31
    i++
  }
  funcPageText[i] = 0x30 + (pages % 10)
  funcPageText[i + 1] = 0
}

function drawFuncPage(): void {
  cls()
  funcPageOf()
  if (funcPage < extraPages()) {
    bandWith(str('FUNC PROG'), addr(funcPageText))
    progFuncPage(funcPage)
    textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
    return
  }
  const page = funcPage - extraPages()
  bandWith(funcTitle(page), addr(funcPageText))
  if (page === 0) {
    textAt(str('1:gcd(   2:lcm('), 1, lineY(0))
    textAt(str('3:%      4:int('), 1, lineY(1))
    textAt(str('5:round( 6:pol('), 1, lineY(2))
    textAt(str('7:rec(   8:d/dx('), 1, lineY(3))
    textAt(str('9:\x97(     0:\x90('), 1, lineY(4))
  } else if (page === PAGE_ENG) {
    textAt(str('1:k  2:M  3:G'), 1, lineY(0))
    textAt(str('4:T  5:m  6:\x9f'), 1, lineY(1))
    textAt(str('7:n  8:p  9:f'), 1, lineY(2))
  } else if (page === PAGE_MORE) {
    textAt(str('1:mod    2:\xe5('), 1, lineY(0))
    textAt(str('3:\x94PRIME'), 1, lineY(1))
  } else if (page === PAGE_RANDOM) {
    textAt(str('1:rand   2:dice'), 1, lineY(0))
    textAt(str('3:coin   4:rint'), 1, lineY(1))
  } else if (page === PAGE_DIST) {
    textAt(str('1:nlow(  2:nmid('), 1, lineY(0))
    textAt(str('3:nup(   4:\x94z'), 1, lineY(1))
  } else if (page === PAGE_STATS) {
    textAt(str('1:n    2:\x95    3:\x91x'), 1, lineY(0))
    textAt(str('4:sx   5:\x96    6:\x91y'), 1, lineY(1))
    textAt(str('7:sy   8:r    9:a'), 1, lineY(2))
    textAt(str('0:b'), 1, lineY(3))
  } else {
    textAt(str('1:\x90x   2:\x90x\x84'), 1, lineY(0))
    textAt(str('3:\x90y   4:\x90y\x84'), 1, lineY(1))
    textAt(str('5:\x90xy  6:x\x89(  7:y\x89('), 1, lineY(2))
    textAt(str('8:c    9:x\x93\x89('), 1, lineY(3))
  }
  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
}

function funcTitle(page: u16): u16 {
  if (page === 0) return str('FUNC')
  if (page === PAGE_ENG) return str('FUNC ENG')
  if (page === PAGE_MORE) return str('FUNC MORE')
  if (page === PAGE_DIST) return str('FUNC DIST')
  return page === PAGE_RANDOM ? str('FUNC RANDOM') : str('FUNC STATS')
}

/** A key on FUNC: the token it types (the calculator types it), 1 to go back, 0 to stay. */
export function funcKey(k: u16): u16 {
  if (mode === MODE_CPLX) return cplxFuncKey(k)
  if (mode === MODE_MATRIX) return matFuncKey(k)
  if (k === K_AC) return 1
  if (k === K_DOWN || k === K_UP) {
    if (k === K_DOWN && funcPage + 1 < FUNC_PAGES + extraPages()) funcPage++
    else if (k === K_UP && funcPage > 0) funcPage--
    else refuse()
    drawFuncPage()
    return 0
  }
  const t = pageToken(digitOf(k))
  if (t === 0) refuse()
  return t
}

function pageToken(d: u16): u16 {
  if (funcPage < extraPages()) return progFuncToken(funcPage, d)
  const page = funcPage - extraPages()
  if (page === 0) return funcToken(d)
  if (page === PAGE_ENG) return prefixToken(d)
  if (page === PAGE_MORE) return moreToken(d)
  if (page === PAGE_RANDOM) return randomToken(d)
  if (page === PAGE_DIST) return d >= 1 && d <= 3 ? T_NLOW + d - 1 : d === 4 ? T_TOZ : 0
  return page === PAGE_STATS ? statToken(d) : sumToken(d)
}

/** The token of FUNC's item `d` (1-9, 0); 0 for none. */
function funcToken(d: u16): u16 {
  switch (d) {
    case 8:
      return T_DERIV
    case 9:
      return T_INTEG
    case 0:
      return T_SIGMA
    case 1:
      return T_GCD
    case 2:
      return T_LCM
    case 3:
      return T_PERCENT
    case 4:
      return T_INT
    case 5:
      return T_RND
    case 6:
      return T_POL
    case 7:
      return T_REC
  }
  return 0
}

/**
 * v3's ENG page: k M G T by 1-4, then m μ n p f by 5-9 (section 15.3); the prefix tokens run
 * from f (D4) to T (DC), m at D8.
 */
function prefixToken(d: u16): u16 {
  if (d >= 1 && d <= 4) return T_MILLI + d
  return d >= 5 && d <= 9 ? T_MILLI + 5 - d : 0
}

/** v3's MORE page: mod and Π( (section 15.2), →PRIME (15.4: not a token, what calc does). */
function moreToken(d: u16): u16 {
  if (d === 1) return T_MOD
  if (d === 3) return FUNC_PRIME
  return d === 2 ? T_PROD : 0
}

/** The random page: rand, dice, coin, rint. */
function randomToken(d: u16): u16 {
  switch (d) {
    case 1:
      return T_RAN
    case 2:
      return T_DICE
    case 3:
      return T_COIN
    case 4:
      return T_RINT
  }
  return 0
}

/** Page 3: n x̄ σx sx ȳ σy sy r a b by 1-9 and 0 (STATS' results 0-6, then 12-14). */
function statToken(d: u16): u16 {
  if (d >= 1 && d <= 7) return statTokenOf(d - 1)
  if (d === 8 || d === 9) return statTokenOf(d + 4)
  return d === 0 ? statTokenOf(14) : 0
}

/** Page 4: Σx Σx² Σy Σy² Σxy by 1-5 (results 7-11), x'( y'( by 6 7, c by 8, x₂'( by 9. */
function sumToken(d: u16): u16 {
  if (d >= 1 && d <= 5) return statTokenOf(d + 6)
  if (d === 6) return T_XEST
  if (d === 7) return T_YEST
  if (d === 8) return T_STAT_C
  return d === 9 ? T_X2EST : 0
}

/** The token of STATS' result `k` (tokens.e16.ts: 97-9F, then F4-F9). */
function statTokenOf(k: u16): u16 {
  return k <= 8 ? T_STAT_N + k : 0xf4 + k - 9
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
