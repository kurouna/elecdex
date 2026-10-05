// ELEC-16 BASIC, ROM bank 0: arrays and DIM, the string operators and functions, INPUT,
// READ and DATA, ON, CLEAR, WAIT and BEEP (docs/elec16.md section 6). Its code runs with
// bank 0 in the window; the interpreter's core (basic.e16.ts) calls it through far_call.
import {
  addr,
  type bool,
  csrr,
  csrw,
  div,
  i16,
  memset,
  peek,
  peek16,
  poke,
  poke16,
  u16,
  wfi,
} from '../../../../src/shared/e16c/builtins'
import {
  checkBreak,
  clearVariables,
  copy8,
  dataAt,
  dataLine,
  E_ARGUMENT,
  E_DATA,
  E_DIM,
  E_INDEX,
  E_LINE,
  E_MEMORY,
  E_SYNTAX,
  E_TYPE,
  expect,
  expr,
  fail,
  findLine,
  findRecord,
  formatTop,
  gosubTo,
  isDigit,
  jump,
  K_ARRAY,
  K_STRING,
  K_TWO,
  lineBuf,
  M_NEG,
  M_PARSE,
  M_TOWORD,
  move,
  nameIsString,
  nameKey,
  needNumber,
  needString,
  newRecord,
  next,
  nsp,
  push,
  pushString,
  quoted,
  readName,
  readUnsigned,
  STRING_ROOM,
  setData,
  setInt,
  setNameKey,
  setNsp,
  setStrType,
  setTxt,
  setVarRoom,
  step,
  storeString,
  stringAt,
  stringLength,
  stringSize,
  strType,
  tempString,
  textOut,
  toInt,
  top,
  txt,
  unary,
  VAR_HEAD,
  varAt,
  varRoom,
} from './basic.e16'
import { eofFunction, inputFromFile } from './files.e16'
import {
  ANN_SOUND,
  ANNMODE,
  annunciate,
  BRKFLAG,
  CH_0,
  CH_COLON,
  CH_COMMA,
  CH_HASH,
  CH_LPAREN,
  CH_MINUS,
  CH_QUESTION,
  CH_QUOTE,
  CH_RPAREN,
  CH_SEMI,
  CH_SPACE,
  CH_STAR,
  CSR_MIE,
  fresh_line,
  IO_CLOCK,
  IO_DUR,
  IO_FREQ,
  IO_HEIGHT,
  IO_TCMP,
  IO_TCOUNT,
  IO_TCTRL,
  IO_WIDTH,
  MATH_A,
  MATH_ARG,
  MATH_B,
  MATH_OP,
  MATH_STATUS,
  MIE_TIMER,
  PROG,
  pollkey,
  putc,
  readline,
} from './rom.e16'
import {
  T_ASC,
  T_BEEP,
  T_CHR,
  T_CLEAR,
  T_DATA,
  T_DATE,
  T_DIM,
  T_EOF,
  T_GOSUB,
  T_GOTO,
  T_INKEY,
  T_LCDH,
  T_LCDW,
  T_LEFT,
  T_LEN,
  T_MID,
  T_ON,
  T_READ,
  T_REM,
  T_RESTORE,
  T_RIGHT,
  T_SPACES,
  T_STR,
  T_STRING,
  T_TIME,
  T_VAL,
  T_WAIT,
} from './text.e16'

/* ---------------- arrays ---------------- */

/** An index from the stack: a whole number from 0; INDEX below it. */
function index(): u16 {
  needNumber()
  const i = toInt(top())
  setNsp(nsp - 8)
  if (i < 0) fail(E_INDEX)
  return u16(i)
}

/**
 * A new array for the name last read, of `kind` (K_ARRAY, with K_STRING and K_TWO as it is):
 * d1 and d2 the highest indices (d2 0 for one dimension), `room` a string element's; its
 * record's address. MEMORY when it does not fit.
 */
function dimension(kind: u16, d1: u16, d2: u16, room: u16): u16 {
  const each: u16 = (kind & K_STRING) !== 0 ? room + 1 : 8
  const count = (d1 + 1) * (d2 + 1)
  // The sizes are checked by division, so a product that wraps a word is never taken.
  if (d1 >= 0x7fff || d2 >= 0x7fff || d2 + 1 > div(0x7fff, d1 + 1) || count > div(0x7ff0, each))
    fail(E_MEMORY)
  const rec = newRecord(kind, room, (VAR_HEAD + 4 + count * each + 1) & 0xfffe)
  poke16(rec + VAR_HEAD, d1)
  poke16(rec + VAR_HEAD + 2, d2)
  return rec
}

/** An array's kind: a string's or a number's, of one dimension or two. */
function kindOf(strings: bool, two: bool): u16 {
  return K_ARRAY | (strings ? K_STRING : 0) | (two ? K_TWO : 0)
}

/**
 * The element of the array last named, the text at its '(': its value's address, strType
 * and varRoom set. An array not yet DIMmed is made with indices 0 to 10 (each way).
 */
export function elementAt(): u16 {
  const key = nameKey()
  const strings = nameIsString
  step()
  expr()
  const i = index()
  let j: u16 = 0
  let two = false
  if (next() === CH_COMMA) {
    step()
    expr()
    j = index()
    two = true
  }
  expect(CH_RPAREN)
  setNameKey(key)
  let rec = findRecord(K_ARRAY | (strings ? K_STRING : 0))
  if (rec === 0) rec = dimension(kindOf(strings, two), 10, two ? 10 : 0, strings ? STRING_ROOM : 0)
  const d1 = peek16(rec + VAR_HEAD)
  const d2 = peek16(rec + VAR_HEAD + 2)
  const hasTwo = (peek(rec + 2) & K_TWO) !== 0
  if (hasTwo !== two || i > d1 || j > d2) fail(E_INDEX)
  const room = peek(rec + 3)
  setVarRoom(room)
  setStrType(strings)
  const each: u16 = strings ? room + 1 : 8
  return rec + VAR_HEAD + 4 + (i * (d2 + 1) + j) * each
}

/** A string's room after *, or the default: 1 to 255. */
function roomOf(): u16 {
  if (next() !== CH_STAR) return STRING_ROOM
  step()
  const room = readUnsigned()
  if (room < 1 || room > 255) fail(E_ARGUMENT)
  return room
}

/** DIM A(9), B(3,4), C$(5)*20, D$*80: arrays, and string variables with more room. */
function dimStatement(): void {
  for (;;) {
    readName()
    if (next() === CH_LPAREN) dimArray(nameKey())
    else dimString(nameKey())
    if (next() !== CH_COMMA) return
    step()
  }
}

/** DIM of an array (the name read, the text at its '('): made, unless it is already. */
function dimArray(key: u16): void {
  const strings = nameIsString
  step()
  expr()
  const d1 = index()
  let d2: u16 = 0
  const two = next() === CH_COMMA
  if (two) {
    step()
    expr()
    d2 = index()
  }
  expect(CH_RPAREN)
  const room = strings ? roomOf() : 0
  setNameKey(key)
  if (findRecord(K_ARRAY | (strings ? K_STRING : 0)) !== 0) fail(E_DIM)
  dimension(kindOf(strings, two), d1, d2, room)
}

/** DIM of a string variable with its room: made, unless it is already. */
function dimString(key: u16): void {
  if (!nameIsString) fail(E_SYNTAX)
  const room = roomOf()
  setNameKey(key)
  if (findRecord(K_STRING) !== 0) fail(E_DIM)
  newRecord(K_STRING, room, stringSize(room))
}

/* ---------------- strings in expressions ---------------- */

/** The two strings on top joined, in their place: at most 255 characters. */
export function join(): void {
  const b = top()
  const a = b - 8
  const na = stringLength(a)
  const nb = stringLength(b)
  if (na + nb > 255) fail(E_ARGUMENT)
  const at = tempString(na + nb)
  move(stringAt(a), at, na)
  move(stringAt(b), at + na, nb)
  setNsp(nsp - 16)
  pushString(at, na + nb)
}

/** The two strings on top compared, character by character: -1, 0 or 1; the first's place left. */
export function compareStrings(): u16 {
  const b = top()
  const a = b - 8
  const na = stringLength(a)
  const nb = stringLength(b)
  const pa = stringAt(a)
  const pb = stringAt(b)
  setNsp(nsp - 8)
  for (let k: u16 = 0; k < na && k < nb; k++) {
    const ca = peek(pa + k)
    const cb = peek(pb + k)
    if (ca !== cb) return ca < cb ? 0xffff : 1
  }
  if (na === nb) return 0
  return na < nb ? 0xffff : 1
}

/** A function of the second set: strings, LEN to DATE$, EOF and the screen's size. */
export function moreFunctions(token: u16): void {
  if (token === T_LEFT || token === T_MID || token === T_RIGHT) {
    part(token)
    return
  }
  if (token === T_INKEY || token === T_TIME || token === T_DATE) {
    noArgument(token)
    return
  }
  if (token === T_LCDW || token === T_LCDH) {
    setInt(push(), i16(peek16(token === T_LCDW ? IO_WIDTH : IO_HEIGHT)))
    setStrType(false)
    return
  }
  if (token === T_EOF) {
    eofFunction()
    return
  }
  if (token === T_STRING) {
    stringOf()
    return
  }
  unary()
  if (token === T_SPACES) repeated(CH_SPACE, repeatCount())
  else oneArgument(token)
}

/** STRING$(n, c): n of the character c, a code (0 to 255) or a string's first character. */
function stringOf(): void {
  expect(CH_LPAREN)
  expr()
  const n = repeatCount()
  expect(CH_COMMA)
  expr()
  let c: u16 = 0
  if (strType) {
    // A string gives its first character: an empty one has none to repeat.
    if (stringLength(top()) === 0) fail(E_ARGUMENT)
    c = peek(stringAt(top()))
  } else c = charCode(top())
  setNsp(nsp - 8)
  expect(CH_RPAREN)
  repeated(c, n)
}

/** A character code from the number at `e`: 0 to 255, ARGUMENT outside. */
function charCode(e: u16): u16 {
  const c = toInt(e)
  if (c < 0 || c > 255) fail(E_ARGUMENT)
  return u16(c)
}

/** SPACE$'s and STRING$'s count from the number on top, taken off: 0 to 255, ARGUMENT outside. */
function repeatCount(): u16 {
  needNumber()
  const n = charCode(top())
  setNsp(nsp - 8)
  return n
}

/** `n` of the character `c`, a new string onto the stack (SPACE$, STRING$). */
function repeated(c: u16, n: u16): void {
  const at = tempString(n)
  memset(at, c, n)
  pushString(at, n)
}

/** LEN, ASC and VAL of a string; CHR$ and STR$ of a number. */
function oneArgument(token: u16): void {
  if (token === T_LEN || token === T_ASC || token === T_VAL) ofString(token)
  else ofNumber(token)
}

/** LEN, ASC or VAL: a number from the string on top, in its place. */
function ofString(token: u16): void {
  const e = top()
  needString()
  const n = stringLength(e)
  const at = stringAt(e)
  setStrType(false)
  if (token === T_VAL) {
    if (readNumber(e, at, n) === 0) setInt(e, 0)
    return
  }
  setInt(e, token === T_LEN ? i16(n) : n === 0 ? 0 : i16(peek(at)))
}

/** CHR$ or STR$: a string from the number on top, in its place. */
function ofNumber(token: u16): void {
  const e = top()
  needNumber()
  if (token === T_CHR) {
    const c = toInt(e)
    if (c < 0 || c > 255) fail(E_ARGUMENT)
    const at = tempString(1)
    poke(at, u16(c))
    setNsp(nsp - 8)
    pushString(at, 1)
    return
  }
  if (token !== T_STR) fail(E_SYNTAX)
  const n = formatTop()
  const at = tempString(n)
  move(addr(textOut), at, n)
  setNsp(nsp - 8)
  pushString(at, n)
}

/** LEFT$(s, n), RIGHT$(s, n), MID$(s, m[, n]): a part of the string, in place (no copy). */
function part(token: u16): void {
  expect(CH_LPAREN)
  expr()
  needString()
  expect(CH_COMMA)
  expr()
  const a = count()
  let b: u16 = 255
  if (token === T_MID && next() === CH_COMMA) {
    step()
    expr()
    b = count()
  }
  expect(CH_RPAREN)
  const e = top()
  const n = stringLength(e)
  let from: u16 = 0
  let length = a
  if (token === T_RIGHT) from = a < n ? n - a : 0
  if (token === T_MID) {
    // MID$ counts from 1; past the end is the empty string.
    from = a === 0 ? 0 : a - 1
    length = b
  }
  if (from > n) from = n
  if (length > n - from) length = n - from
  const at = stringAt(e)
  setNsp(nsp - 8)
  pushString(at + from, length)
}

/** A count from the stack, for LEFT$ and its kind: 0 to 255. */
function count(): u16 {
  needNumber()
  const v = toInt(top())
  setNsp(nsp - 8)
  if (v < 0) fail(E_ARGUMENT)
  return v > 255 ? 255 : u16(v)
}

/** INKEY$ (a key waiting, or the empty string), TIME$ and DATE$ from the clock. */
function noArgument(token: u16): void {
  if (token === T_INKEY) {
    // Never waits: SHIFT, CAPS or KANA alone in the FIFO is no key yet (pollkey takes them).
    const c = pollkey()
    if (c === 0) {
      pushString(0, 0)
      return
    }
    const at = tempString(1)
    poke(at, c)
    pushString(at, 1)
    return
  }
  const at = tempString(10)
  if (token === T_TIME) {
    twoDigits(at, peek(IO_CLOCK + 2), 0x3a)
    twoDigits(at + 3, peek(IO_CLOCK + 1), 0x3a)
    twoDigits(at + 6, peek(IO_CLOCK), 0)
    pushString(at, 8)
    return
  }
  twoDigits(at, 20, 0)
  twoDigits(at + 2, peek(IO_CLOCK + 5), CH_MINUS)
  twoDigits(at + 5, peek(IO_CLOCK + 4), CH_MINUS)
  twoDigits(at + 8, peek(IO_CLOCK + 3), 0)
  pushString(at, 10)
}

/** Two digits at `at` and, when `after` is not 0, that character. */
function twoDigits(at: u16, v: u16, after: u16): void {
  poke(at, CH_0 + div(v, 10))
  poke(at + 1, CH_0 + (v % 10))
  if (after !== 0) poke(at + 2, after)
}

/**
 * A number written at `at` (at most `max` characters: spaces, a sign, the digits) into the
 * stack's entry `e`: the characters it took, 0 when none were a number.
 */
export function readNumber(e: u16, at: u16, max: u16): u16 {
  let p = at
  let left = max
  while (left > 0 && peek(p) === CH_SPACE) {
    p++
    left--
  }
  const minus = left > 0 && peek(p) === CH_MINUS
  if (minus) {
    p++
    left--
  }
  poke16(MATH_A, e)
  poke16(MATH_B, p)
  poke16(MATH_ARG, left)
  poke16(MATH_OP, M_PARSE)
  const n = peek16(MATH_ARG)
  if (peek16(MATH_STATUS) !== 0 || n === 0) return 0
  if (minus) {
    poke16(MATH_A, e)
    poke16(MATH_OP, M_NEG)
  }
  return p + n - at
}

/* ---------------- INPUT ---------------- */

/** INPUT ["prompt";] v[, v...]: asks until every variable gets a value of its kind. */
export function inputStatement(): void {
  // The INPUT itself, just before the text: BRK while it asks makes CONT ask again.
  const again = txt - 1
  if (next() === CH_HASH) {
    inputFromFile()
    return
  }
  let prompt: u16 = 0
  if (next() === CH_QUOTE) {
    prompt = txt + 1
    setTxt(quoted(prompt, false))
    if (next() === CH_SEMI || next() === CH_COMMA) step()
  }
  const list = txt
  for (;;) {
    fresh_line()
    if (prompt !== 0) quoted(prompt, true)
    putc(CH_QUESTION)
    const n: i16 = readline(addr(lineBuf), 78)
    if (n === -2) {
      setTxt(again)
      poke16(BRKFLAG, 1)
      checkBreak()
    }
    fresh_line()
    setTxt(list)
    if (n >= 0 && takeItems(addr(lineBuf))) return
  }
}

/** The items typed at `p`, one for each variable of the list at the text; false when short or wrong. */
function takeItems(from: u16): bool {
  let p = from
  for (;;) {
    const at = varAt(true)
    const room = varRoom
    const taken = takeItem(at, room, p, false)
    if (taken === 0xffff) return false
    p += taken
    if (next() !== CH_COMMA) return true
    step()
    if (peek(p) !== CH_COMMA) return false
    p++
  }
}

/**
 * One item at `p` (ended by a comma or the text's end, and for DATA by a colon too) into the
 * variable at `at`: the characters taken, 0xFFFF when it is not one of the variable's kind. A
 * string may be quoted.
 */
export function takeItem(at: u16, room: u16, p: u16, data: bool): u16 {
  let q = p
  while (peek(q) === CH_SPACE) q++
  if (nameIsString) return takeString(at, room, q, data) - p
  const e = push()
  const n = readNumber(e, q, 255)
  setNsp(nsp - 8)
  if (n === 0) return 0xffff
  copy8(e, at)
  q += n
  while (peek(q) === CH_SPACE) q++
  return q - p
}

/** A string item at `q` into the variable at `at`: where the item ends. */
function takeString(at: u16, room: u16, q: u16, data: bool): u16 {
  let start = q
  let end = q
  let after = q
  if (peek(q) === CH_QUOTE) {
    start = q + 1
    end = start
    while (peek(end) !== CH_QUOTE && peek(end) !== 0) end++
    after = peek(end) === CH_QUOTE ? end + 1 : end
    // Spaces before the comma after it, as an unquoted item's are.
    while (peek(after) === CH_SPACE) after++
  } else {
    while (!itemEnds(peek(end), data)) end++
    after = end
    while (end > start && peek(end - 1) === CH_SPACE) end--
  }
  pushString(start, end - start)
  storeString(at, room)
  setNsp(nsp - 8)
  return after
}

/** Whether an unquoted item ends at `c`: a comma, the end, a CR, and in DATA a colon. */
function itemEnds(c: u16, data: bool): bool {
  return c === CH_COMMA || c === 0 || c === 0x0d || (data && c === CH_COLON)
}

/* ---------------- DATA and READ ---------------- */

/** READ v[, v...]: each the next item of the program's DATA, in order. */
function readStatement(): void {
  for (;;) {
    const at = varAt(true)
    const room = varRoom
    const item = nextItem()
    const taken = takeItem(at, room, item, true)
    if (taken === 0xffff) fail(E_TYPE)
    // Past the item: a comma for the next, or the DATA's end, to look further next time.
    const after = item + taken
    setData(dataLine, peek(after) === CH_COMMA ? after + 1 : after)
    if (next() !== CH_COMMA) return
    step()
  }
}

/** Where the next DATA item is: in the DATA read from, or the next one in the program. */
function nextItem(): u16 {
  let at = dataAt
  if (at !== 0 && peek(at) !== 0 && peek(at) !== CH_COLON) return at
  let line = dataLine === 0 ? PROG : dataLine
  // The DATA after this place in its line, then in the lines after.
  let from = at === 0 ? line + 4 : at
  for (;;) {
    if (peek16(line) === 0) fail(E_DATA)
    at = findData(from)
    if (at !== 0) {
      setData(line, at)
      return at
    }
    line += peek16(line + 2)
    from = line + 4
  }
}

/** The text just after a DATA in a line's tokens from `p` (quotes and REM passed over); 0 when none. */
function findData(from: u16): u16 {
  let p = from
  let inside = false
  while (peek(p) !== 0) {
    const c = peek(p)
    p++
    if (c === CH_QUOTE) inside = !inside
    if (inside) continue
    if (c === T_REM) return 0
    if (c === T_DATA) return p
  }
  return 0
}

/** RESTORE [line]: READ starts again from the program's start, or from that line. */
function restoreStatement(): void {
  if (!isDigit(next())) {
    setData(0, 0)
    return
  }
  const line = findLine(readUnsigned(), true)
  if (line === 0) fail(E_LINE)
  setData(line, 0)
}

/* ---------------- ON, WAIT, BEEP ---------------- */

/**
 * The line an expression after GOTO or GOSUB names (GOTO 100+I*10): its address; NO LINE when
 * no line has that number, as below 0 or past 65535 none can.
 */
export function computedLine(): u16 {
  expr()
  needNumber()
  const e = top()
  setNsp(nsp - 8)
  poke16(MATH_A, e)
  poke16(MATH_OP, M_TOWORD)
  // TOWORD takes -32768 to 65535: a sign or its refusal is no line's number.
  if (peek16(MATH_STATUS) !== 0 || (peek(e) & 0x80) !== 0) fail(E_LINE)
  const at = findLine(peek16(MATH_ARG), true)
  if (at === 0) fail(E_LINE)
  return at
}

/** ON n GOTO a, b, c (or GOSUB): the n-th line; past the list's end, on to the next statement. */
function onStatement(): void {
  expr()
  needNumber()
  const n = toInt(top())
  setNsp(nsp - 8)
  const how = next()
  if (how !== T_GOTO && how !== T_GOSUB) fail(E_SYNTAX)
  step()
  let chosen: u16 = 0
  let k: i16 = 1
  for (;;) {
    const line = readUnsigned()
    if (k === n) chosen = line
    if (next() !== CH_COMMA) break
    step()
    k++
  }
  if (chosen === 0) return
  const at = findLine(chosen, true)
  if (at === 0) fail(E_LINE)
  // A GOSUB comes back after the whole list.
  if (how === T_GOSUB) gosubTo(at)
  else jump(at, at + 4)
}

/**
 * Waits `ticks` of the 1,024 Hz timer, asleep (WFI with the timer's line alone), BRK
 * stopping it; the timer is left as it was found, even when BRK stops the program.
 */
function waitTicks(ticks: u16): void {
  const start = peek16(IO_TCOUNT)
  const lines = csrr(CSR_MIE)
  while (u16(peek16(IO_TCOUNT) - start) < ticks) {
    poke16(IO_TCMP, start + ticks)
    poke16(IO_TCTRL, 1)
    // The timer's line alone: a key waiting in the FIFO (for INKEY$ after) would wake WFI
    // at once, and the wait would spin through every cycle of it. BRK wakes it whatever.
    csrw(CSR_MIE, MIE_TIMER)
    // A tick of the page's loop between reading the count and turning the compare on may
    // have passed it unseen: then there is nothing to wait for (else WFI till it wraps).
    if (u16(peek16(IO_TCOUNT) - start) < ticks) wfi()
    poke16(IO_TCTRL, 0)
    csrw(CSR_MIE, lines)
    checkBreak()
  }
}

/** WAIT n: n sixty-fourths of a second. */
function waitStatement(): void {
  let n = wholeArgument(0x7fff)
  while (n > 0) {
    waitTicks(16)
    n--
  }
}

/** BEEP f[, ms]: a tone of f Hz for ms milliseconds (100 when not said), waited for. */
function beepStatement(): void {
  const f = wholeArgument(20000)
  let ms: u16 = 100
  if (next() === CH_COMMA) {
    step()
    ms = wholeArgument(10000)
  }
  poke16(IO_FREQ, f)
  poke16(IO_DUR, ms)
  // The note's mark while it sounds. BRK in the wait goes back to the prompt, whose marks
  // are put up afresh, without it.
  soundMark(true)
  // The timer's 1,024 ticks a second are a little more than the milliseconds: rounded up.
  waitTicks(ms + div(ms * 3 + 124, 125))
  soundMark(false)
}

function soundMark(on: bool): void {
  const marks = peek16(ANNMODE)
  poke16(ANNMODE, on ? marks | ANN_SOUND : marks & (0xffff ^ ANN_SOUND))
  annunciate()
}

/** A whole number from 0 to `max`, from an expression; ARGUMENT outside it. */
function wholeArgument(max: u16): u16 {
  expr()
  needNumber()
  const v = toInt(top())
  setNsp(nsp - 8)
  if (v < 0 || u16(v) > max) fail(E_ARGUMENT)
  return u16(v)
}

/** The statements of this bank: DIM, READ, RESTORE, ON, CLEAR, WAIT, BEEP. */
export function dataStatement(c: u16): void {
  if (c === T_DIM) dimStatement()
  else if (c === T_READ) readStatement()
  else if (c === T_RESTORE) restoreStatement()
  else if (c === T_ON) onStatement()
  else if (c === T_CLEAR) clearVariables()
  else if (c === T_WAIT) waitStatement()
  else if (c === T_BEEP) beepStatement()
  else fail(E_SYNTAX)
}
