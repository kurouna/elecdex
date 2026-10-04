// ELEC-16 BASIC 1.0 (docs/elec16.md section 6): the prompt and the program, the calculator,
// numbers through the maths unit, strings, and the core statements - the fixed ROM's part.
// The rest is in ROM banks: strings and data (bank0), the screen (bank1), the card (bank2)
// and the editing commands (bank3). Written in e16c's subset of TypeScript; the hand-written
// ROM gives it the LCD, the keys and the monitor (rom.e16.ts).
//
// Memory: the program from PROG, each line [number][length][tokens..0], words at even
// addresses; an end mark (a zero word); then the variables, each a record
// [name0][name1][kind][room][size: u16][value]. Expressions work on a stack of eight-byte
// entries: a number is the maths unit's eight bytes, a string [0xFF][length][address].
import {
  addr,
  type bool,
  bytes,
  i16,
  memcpy,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u8,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import { EDIT_DOWN, EDIT_MODE, EDIT_UP, editLine } from './edit.e16'
import { closeFiles, fileByte, fileStatement, printToFile } from './files.e16'
import { askStatement } from './link.e16'
import {
  ANN_BUSY,
  ANN_DEG,
  ANN_GRAD,
  ANN_PRO,
  ANN_RAD,
  ANN_RUN,
  ANNMODE,
  annunciate,
  BRKFLAG,
  basic_abort,
  CH_0,
  CH_9,
  CH_CARET,
  CH_COLON,
  CH_COMMA,
  CH_DOLLAR,
  CH_DOT,
  CH_EQ,
  CH_GT,
  CH_HASH,
  CH_LBRACKET,
  CH_LPAREN,
  CH_LT,
  CH_MINUS,
  CH_PLUS,
  CH_QUOTE,
  CH_RBRACKET,
  CH_RPAREN,
  CH_SEMI,
  CH_SLASH,
  CH_SPACE,
  CH_STAR,
  COLS,
  CURX,
  call_at,
  cls,
  fresh_line,
  INBASIC,
  IO_POWER,
  K_ENTER,
  LIMIT,
  LINK_CANCEL,
  LINK_CMD,
  MATH_A,
  MATH_ANGLE,
  MATH_ARG,
  MATH_B,
  MATH_OP,
  MATH_RESULT,
  MATH_STATUS,
  monitor,
  newline,
  PROG,
  putc,
  puts,
  stack_room,
} from './rom.e16'
import { pointFunction, screenStatement } from './screen.e16'
import {
  compareStrings,
  dataStatement,
  elementAt,
  inputStatement,
  join,
  moreFunctions,
} from './strings.e16'
import {
  expand,
  isLetter,
  printUnsigned,
  T_AND,
  T_ANS,
  T_ASK,
  T_AUTO,
  T_CALL,
  T_CIRCLE,
  T_CLOSE,
  T_CLS,
  T_CONT,
  T_DATA,
  T_DEG,
  T_ELSE,
  T_END,
  T_EXP,
  T_FILES,
  T_FOR,
  T_GOSUB,
  T_GOTO,
  T_GPRINT,
  T_GRAD,
  T_IF,
  T_INPUT,
  T_KILL,
  T_LCDH,
  T_LEN,
  T_LET,
  T_LIST,
  T_LOCATE,
  T_MON,
  T_NEW,
  T_NEXT,
  T_NOT,
  T_OFF,
  T_OPEN,
  T_OR,
  T_PEEK,
  T_PI,
  T_POINT,
  T_POKE,
  T_PRINT,
  T_RAD,
  T_REM,
  T_RETURN,
  T_RND,
  T_RUN,
  T_SIN,
  T_STEP,
  T_STOP,
  T_THEN,
  T_TO,
  T_TROFF,
  tokenize,
  unsignedText,
} from './text.e16'
import { toolStatement } from './tools.e16'

/* ---------------- the maths unit's operations (shared/elec16/math-unit.ts) ---------------- */

const M_ADD = 0x01
const M_SUB = 0x02
const M_MUL = 0x03
const M_DIV = 0x04
const M_POW = 0x05
const M_CMP = 0x06
export const M_NEG = 0x10
const M_INT = 0x12
const M_RND = 0x1f
const M_PI = 0x20
const M_FROMINT = 0x30
const M_TOINT = 0x31
const M_TOWORD = 0x32
export const M_PARSE = 0x38
const M_FORMAT = 0x39

/* ---------------- errors ---------------- */

export const E_SYNTAX = 1
export const E_OVERFLOW = 2
export const E_DIVIDE = 3
export const E_ARGUMENT = 4
export const E_LINE = 5
export const E_NEXT = 6
export const E_RETURN = 7
export const E_MEMORY = 8
export const E_COMPLEX = 9
/**
 * The stack an expression may leave: below it, TOO COMPLEX before the stack reaches the code
 * area (each nesting takes about 37 bytes; the deepest ROM service under one about 100).
 */
const EXPR_STACK = 256
const E_CONT = 10
export const E_TYPE = 11
export const E_NOFILE = 12
export const E_CARD = 13
export const E_DATA = 14
export const E_INDEX = 15
export const E_DIM = 16
export const E_FILE = 17
export const E_LINK = 18
export const E_LINK_OFF = 19
export const E_LINK_HELD = 20

/* ---------------- state ---------------- */

/** Where the interpreter reads tokenized text. */
export let txt: u16 = 0
/** The line running (its address), or 0 for a line typed at the prompt. */
export let curLine: u16 = 0
/** The program's end mark. */
export let progEnd: u16 = PROG
/** The variables run from progEnd + 2 up to here. */
export let varEnd: u16 = PROG + 2
/** The next free entry on the stack. */
export let nsp: u16 = 0
/** Whether the value an expression left on top is a string. */
export let strType = false
/** The room of the string variable varAt found (its most characters). */
export let varRoom: u16 = 0
/** PRINT's output: 0 the screen, else a file opened AS #n (files.e16.ts). */
export let outFile: u16 = 0
/** READ's place: the line of the DATA it reads (0: from the program's start) and the item. */
export let dataLine: u16 = 0
export let dataAt: u16 = 0
/** A file is open AS #n (files.e16.ts): stopping closes it. */
export let filesOpen = false
/** TRON: each line's number is shown as it runs. */
export let tracing = false
/** AUTO: the next line number offered, 0 when off; and the step. */
export let autoLine: u16 = 0
export let autoStep: u16 = 10
/** FOR and GOSUB entries in use. */
let fsp: u16 = 0
let gsp: u16 = 0
export let running = false
/** Where CONT goes on from (its line, its text), or 0 when it cannot. */
let contLine: u16 = 0
let contTxt: u16 = 0
/** A jump a statement asked for: GOTO, GOSUB, RETURN, NEXT. */
export let jumping = false
let jumpLine: u16 = 0
let jumpTxt: u16 = 0
let proMode = false
let angleMarks: u16 = ANN_DEG
/** PRO: the number of the line last called up or stored, where up and down go on from; 0 none. */
let recallNo: u16 = 0
/** The line recallNo names was just typed: up calls it back first, to put right. */
let justStored = false
/** RUN: the length of the last line typed (kept in lastLine), for up to call back. */
let lastLength: u16 = 0

/** The longest line typed at the prompt. */
const LINE_MAX = 78
export const lineBuf = bytes(80)
const lastLine = bytes(80)
export const tokens = bytes(96)
/** Twenty-four entries of eight bytes. */
const nums = bytes(192)
/** Strings an expression makes (joined, STR$, ...): taken afresh at every statement. */
const strTemp = bytes(512)
let strTop: u16 = 0
const ans = bytes(8)
export const textOut = bytes(24)
/** FOR entries: [value's address][limit 8][step 8][line][text] = 22 bytes, eight deep. */
const forStack = bytes(176)
/** GOSUB entries: [line][text], sixteen deep. */
const gosubStack = words(32)

export const STR_MARK = 0xff
/** A variable record's head: [name0][name1][kind][room][size: u16]; its value follows. */
export const VAR_HEAD = 6
/** Kinds: bit 0 a string, bit 1 an array, bit 2 an array of two dimensions. */
export const K_STRING = 1
export const K_ARRAY = 2
export const K_TWO = 4
/** The room of a string variable not given one by DIM. */
export const STRING_ROOM = 16

const FOR_SIZE = 22
const FOR_DEPTH = 8
const GOSUB_DEPTH = 16

/* ---------------- the state the banked files change ---------------- */

export function setTxt(p: u16): void {
  txt = p
}

/** The text one character on. */
export function step(): void {
  txt++
}

export function setNsp(p: u16): void {
  nsp = p
}

export function setStrType(s: bool): void {
  strType = s
}

export function setVarRoom(room: u16): void {
  varRoom = room
}

export function setOutFile(n: u16): void {
  outFile = n
}

export function setData(line: u16, at: u16): void {
  dataLine = line
  dataAt = at
}

export function setFilesOpen(open: bool): void {
  filesOpen = open
}

export function setTracing(on: bool): void {
  tracing = on
}

export function setAuto(line: u16, by: u16): void {
  autoLine = line
  autoStep = by
}

export function setVarEnd(at: u16): void {
  varEnd = at
}

/* ---------------- errors and the prompt's state ---------------- */

function errorWord(code: u16): u16 {
  switch (code) {
    case E_SYNTAX:
      return str('SYNTAX')
    case E_OVERFLOW:
      return str('OVERFLOW')
    case E_DIVIDE:
      return str('DIV BY 0')
    case E_ARGUMENT:
      return str('ARGUMENT')
    case E_LINE:
      return str('NO LINE')
    case E_NEXT:
      return str('NEXT')
    case E_RETURN:
      return str('RETURN')
    case E_MEMORY:
      return str('MEMORY')
    case E_COMPLEX:
      return str('TOO COMPLEX')
    case E_CONT:
      return str('CONT')
    default:
      return moreErrorWord(code)
  }
}

function moreErrorWord(code: u16): u16 {
  switch (code) {
    case E_TYPE:
      return str('TYPE')
    case E_NOFILE:
      return str('NO FILE')
    case E_CARD:
      return str('CARD')
    case E_DATA:
      return str('NO DATA')
    case E_INDEX:
      return str('INDEX')
    case E_DIM:
      return str('DIM')
    case E_LINK:
      return str('LINK')
    case E_LINK_OFF:
      return str('LINK OFF')
    case E_LINK_HELD:
      return str('LINK HELD')
    default:
      return str('FILE')
  }
}

/** Says where a running program was. */
function inLine(): void {
  if (curLine === 0) return
  puts(str(' IN '))
  printUnsigned(peek16(curLine))
}

/** An error: said, the program stopped, back to the prompt. Never returns. */
export function fail(code: u16): void {
  fresh_line()
  puts(str('ERR:'))
  puts(errorWord(code))
  if (running) inLine()
  newline()
  contLine = 0
  stopRunning()
  basic_abort()
}

/** BRK pressed while BASIC ran: stopped where it was, to go on with CONT. */
export function checkBreak(): void {
  if (peek16(BRKFLAG) === 0) return
  poke16(BRKFLAG, 0)
  fresh_line()
  puts(str('BREAK'))
  if (running) inLine()
  newline()
  contLine = curLine
  contTxt = txt
  stopRunning()
  basic_abort()
}

function marks(): void {
  let m: u16 = proMode ? ANN_PRO : ANN_RUN
  m |= angleMarks
  if (running) m |= ANN_BUSY
  poke16(ANNMODE, m)
  annunciate()
}

export function stopRunning(): void {
  running = false
  nsp = addr(nums)
  outFile = 0
  // Files a program left open are written out and closed; never an error from here.
  if (filesOpen) closeFiles()
  marks()
}

/* ---------------- reading text ---------------- */

/** The next character that is not a space (text is not moved past it). */
export function next(): u8 {
  while (peek(txt) === CH_SPACE) txt++
  return peek(txt)
}

export function expect(c: u16): void {
  if (next() !== c) fail(E_SYNTAX)
  txt++
}

export function isDigit(c: u16): bool {
  return c >= CH_0 && c <= CH_9
}

/** A whole number written in the text (a line number): its value; text moved past it. */
export function readUnsigned(): u16 {
  next()
  if (!isDigit(peek(txt))) fail(E_SYNTAX)
  let v: u16 = 0
  while (isDigit(peek(txt))) {
    v = moreDigit(v, peek(txt) - CH_0)
    txt++
  }
  return v
}

/** `v` with one more digit; NO LINE past 65535, never wrapped round to a small one. */
function moreDigit(v: u16, d: u16): u16 {
  if (v > 6553 || (v === 6553 && d > 5)) fail(E_LINE)
  return v * 10 + d
}

/* ---------------- numbers ---------------- */

/** Runs a maths operation on A and B; an error stops the program. */
export function math(op: u16, a: u16, b: u16): void {
  poke16(MATH_A, a)
  poke16(MATH_B, b)
  poke16(MATH_OP, op)
  const status = peek16(MATH_STATUS)
  if (status === 0) return
  if (status === 1) fail(E_OVERFLOW)
  if (status === 2) fail(E_DIVIDE)
  fail(E_ARGUMENT)
}

/** A new number on top of the stack: its address. */
export function push(): u16 {
  if (nsp >= addr(nums) + 192) fail(E_COMPLEX)
  const at = nsp
  nsp += 8
  return at
}

export function top(): u16 {
  return nsp - 8
}

export function copy8(from: u16, to: u16): void {
  poke16(to, peek16(from))
  poke16(to + 2, peek16(from + 2))
  poke16(to + 4, peek16(from + 4))
  poke16(to + 6, peek16(from + 6))
}

export function isZero(at: u16): bool {
  return peek(at + 2) === 0
}

export function setInt(at: u16, v: i16): void {
  poke16(MATH_ARG, u16(v))
  math(M_FROMINT, at, 0)
}

/** The top number as a signed word (its whole part); an error past one. */
export function toInt(at: u16): i16 {
  math(M_TOINT, at, 0)
  return i16(peek16(MATH_ARG))
}

/** The number at `at` as an address: -32768 to 65535, a negative one counted from the top. */
export function toWord(at: u16): u16 {
  math(M_TOWORD, at, 0)
  return peek16(MATH_ARG)
}

/** Applies a binary operation to the two top numbers, leaving one. */
export function binary(op: u16): void {
  const b = top()
  nsp -= 8
  math(op, top(), b)
}

/** A string onto the stack: its characters at `at`, `length` of them. */
export function pushString(at: u16, length: u16): void {
  const e = push()
  poke(e, STR_MARK)
  poke(e + 1, length)
  poke16(e + 2, at)
  strType = true
}

export function stringLength(e: u16): u16 {
  return peek(e + 1)
}

export function stringAt(e: u16): u16 {
  return peek16(e + 2)
}

/** Room for a string made in an expression: its address; TOO COMPLEX when there is none. */
export function tempString(length: u16): u16 {
  if (strTop + length > 512) fail(E_COMPLEX)
  const at = addr(strTemp) + strTop
  strTop += length
  return at
}

/** The value on top must be a number (an operator or a function that takes one). */
export function needNumber(): void {
  if (strType) fail(E_TYPE)
}

export function needString(): void {
  if (!strType) fail(E_TYPE)
}

/** The number written at the text, onto the stack. */
function literal(): void {
  strType = false
  const at = push()
  // As long as a number written in a line can be (the unit stops where the number does).
  poke16(MATH_ARG, 255)
  math(M_PARSE, at, txt)
  const n = peek16(MATH_ARG)
  if (n === 0) fail(E_SYNTAX)
  txt += n
}

/** The number on top as text in textOut, ended by a zero: its length. */
export function formatTop(): u16 {
  poke16(MATH_ARG, 0)
  math(M_FORMAT, top(), addr(textOut))
  const n = peek16(MATH_ARG)
  poke(addr(textOut) + n, 0)
  return n
}

/* ---------------- variables ---------------- */

let name0: u16 = 0
let name1: u16 = 0
/** The name read ended with $: a string. */
export let nameIsString = false

/** The name last read, as one word: kept over an expression that reads names of its own. */
export function nameKey(): u16 {
  return name0 | (name1 << 8) | (nameIsString ? 0x8000 : 0)
}

export function setNameKey(key: u16): void {
  name0 = key & 0xff
  name1 = (key >> 8) & 0x7f
  nameIsString = (key & 0x8000) !== 0
}

/** A variable's name at the text: a letter, an optional letter or digit, and $ for a string. */
export function readName(): void {
  next()
  name0 = peek(txt)
  if (!isLetter(name0)) fail(E_SYNTAX)
  txt++
  name1 = peek(txt)
  if (isLetter(name1) || isDigit(name1)) txt++
  else name1 = 0
  nameIsString = peek(txt) === CH_DOLLAR
  if (nameIsString) txt++
}

/** The record of the variable last named, of this kind (string or not, array or not); 0 when none. */
export function findRecord(kind: u16): u16 {
  let at = progEnd + 2
  while (at < varEnd) {
    if (peek(at) === name0 && peek(at + 1) === name1 && (peek(at + 2) & 3) === (kind & 3)) return at
    at += peek16(at + 4)
  }
  return 0
}

/** A record for the variable last named, `size` bytes in all, its value cleared: its address. */
export function newRecord(kind: u16, room: u16, size: u16): u16 {
  if (size > LIMIT - varEnd) fail(E_MEMORY)
  const at = varEnd
  poke(at, name0)
  poke(at + 1, name1)
  poke(at + 2, kind)
  poke(at + 3, room)
  poke16(at + 4, size)
  for (let k: u16 = VAR_HEAD; k < size; k += 2) poke16(at + k, 0)
  varEnd += size
  return at
}

/** A string variable's record size for its room: head, length and characters, even. */
export function stringSize(room: u16): u16 {
  return (VAR_HEAD + 1 + room + 1) & 0xfffe
}

/**
 * The variable at the text (a name, or an array's element): its value's address, strType
 * and (a string) varRoom set; 0 for a simple variable never given a value, unless `make`.
 */
export function varAt(make: bool): u16 {
  readName()
  strType = nameIsString
  if (next() === CH_LPAREN) return elementAt()
  const kind: u16 = nameIsString ? K_STRING : 0
  let at = findRecord(kind)
  if (at === 0) {
    if (!make) return 0
    at = nameIsString
      ? newRecord(kind, STRING_ROOM, stringSize(STRING_ROOM))
      : newRecord(kind, 0, VAR_HEAD + 8)
  }
  varRoom = peek(at + 3)
  return at + VAR_HEAD
}

/** A string onto a string variable's value at `at`, cut to its room. */
export function storeString(at: u16, room: u16): void {
  const e = top()
  let n = stringLength(e)
  if (n > room) n = room
  move(stringAt(e), at + 1, n)
  poke(at, n)
}

export function clearVariables(): void {
  // RUN, NEW and CLEAR: a LINK request out would write its answer over the variables after.
  poke16(LINK_CMD, LINK_CANCEL)
  varEnd = progEnd + 2
  fsp = 0
  gsp = 0
  dataLine = 0
  dataAt = 0
}

/* ---------------- expressions ---------------- */

/** An expression onto the stack: OR, AND, NOT, comparison, + -, * /, ^, then the rest. */
export function expr(): void {
  // Every nesting comes back here: deep enough, the stack would run into the code area.
  if (stack_room() < EXPR_STACK) fail(E_COMPLEX)
  andExpr()
  while (next() === T_OR) {
    needNumber()
    txt++
    andExpr()
    logical(false)
  }
}

function andExpr(): void {
  notExpr()
  while (next() === T_AND) {
    needNumber()
    txt++
    notExpr()
    logical(true)
  }
}

/** AND and OR on truth: 1 or 0. */
function logical(both: bool): void {
  needNumber()
  const b = !isZero(top())
  nsp -= 8
  const a = !isZero(top())
  setInt(top(), (both ? a && b : a || b) ? 1 : 0)
}

function notExpr(): void {
  if (next() === T_NOT) {
    txt++
    notExpr()
    needNumber()
    setInt(top(), isZero(top()) ? 1 : 0)
    return
  }
  compare()
}

/** A comparison: < <= <> = >= >, 1 when it holds, 0 when not; of two numbers or two strings. */
function compare(): void {
  addExpr()
  const want = relation()
  if (want === 0) return
  const strings = strType
  addExpr()
  if (strType !== strings) fail(E_TYPE)
  const r = strings ? compareStrings() : compareNumbers()
  const got: u16 = r === 0xffff ? 1 : r === 0 ? 2 : 4
  setInt(top(), (want & got) !== 0 ? 1 : 0)
  strType = false
}

/** The comparison at the text, read past: 1 less, 2 equal, 4 greater, as many as hold; 0 none. */
function relation(): u16 {
  const c = next()
  if (c !== CH_LT && c !== CH_EQ && c !== CH_GT) return 0
  txt++
  let want: u16 = c === CH_LT ? 1 : c === CH_EQ ? 2 : 4
  const d = peek(txt)
  if (c !== CH_EQ && (d === CH_EQ || (c === CH_LT && d === CH_GT))) {
    want |= d === CH_EQ ? 2 : 4
    txt++
  }
  return want
}

/** The two numbers on top compared: -1, 0 or 1; the first's place left. */
function compareNumbers(): u16 {
  const b = top()
  nsp -= 8
  math(M_CMP, top(), b)
  return peek16(MATH_RESULT)
}

function addExpr(): void {
  mulExpr()
  for (;;) {
    const c = next()
    if (c !== CH_PLUS && c !== CH_MINUS) return
    const strings = strType
    txt++
    mulExpr()
    if (strType !== strings || (strings && c === CH_MINUS)) fail(E_TYPE)
    if (strings) join()
    else binary(c === CH_PLUS ? M_ADD : M_SUB)
  }
}

function mulExpr(): void {
  unary()
  for (;;) {
    const c = next()
    if (c !== CH_STAR && c !== CH_SLASH) return
    needNumber()
    txt++
    unary()
    needNumber()
    binary(c === CH_STAR ? M_MUL : M_DIV)
  }
}

/**
 * A sign binds looser than ^: -2^2 is -4. It is also a function's argument without brackets,
 * so SIN -1 and ABS -X^2 read as they look, and SIN X+1 is (SIN X)+1.
 */
export function unary(): void {
  const c = next()
  if (c === CH_MINUS) {
    txt++
    unary()
    needNumber()
    math(M_NEG, top(), 0)
    return
  }
  if (c === CH_PLUS) txt++
  power()
}

function power(): void {
  primary()
  if (next() !== CH_CARET) return
  needNumber()
  txt++
  unary()
  needNumber()
  binary(M_POW)
}

function primary(): void {
  const c = next()
  if (isDigit(c) || c === CH_DOT) {
    literal()
    return
  }
  if (c === CH_QUOTE) {
    // A string written in the line: the stack points at it there.
    const at = txt + 1
    txt = quoted(at, false)
    pushString(at, txt - at - (peek(txt - 1) === CH_QUOTE ? 1 : 0))
    return
  }
  if (c === CH_LPAREN) {
    txt++
    expr()
    expect(CH_RPAREN)
    return
  }
  if (isLetter(c)) {
    variableValue()
    return
  }
  txt++
  functionCall(c)
}

/** A variable's value onto the stack: a number never set is 0, a string never set empty. */
function variableValue(): void {
  const at = varAt(false)
  if (strType) {
    if (at === 0) pushString(0, 0)
    else pushString(at + 1, peek(at))
    return
  }
  const to = push()
  if (at === 0) setInt(to, 0)
  else copy8(at, to)
}

/** SIN to EXP, SQR, ABS, INT, SGN: the maths unit's single operations, in token order. */
const FUNCTION_OPS = str(
  '\u0016\u0017\u0018\u0019\u001a\u001b\u0015\u0011\u0012\u0014\u001d\u001c\u001e',
)

function functionCall(token: u16): void {
  strType = false
  if (token >= T_LEN) {
    moreFunctions(token)
    return
  }
  if (token === T_POINT) {
    pointFunction()
    return
  }
  if (token >= T_SIN && token <= T_EXP) {
    unary()
    needNumber()
    math(peek(FUNCTION_OPS + (token - T_SIN)), top(), 0)
    return
  }
  if (token === T_PI) {
    math(M_PI, push(), 0)
    return
  }
  if (token === T_ANS) {
    copy8(addr(ans), push())
    return
  }
  if (token === T_RND) {
    random()
    return
  }
  if (token === T_PEEK) {
    unary()
    needNumber()
    setInt(top(), peek(toWord(top())))
    return
  }
  fail(E_SYNTAX)
}

/** RND n: a whole number from 1 to n; RND below 1: a fraction from 0 up to 1. */
function random(): void {
  unary()
  needNumber()
  const n = top()
  const r = push()
  math(M_RND, r, 0)
  const one = push()
  setInt(one, 1)
  math(M_CMP, n, one)
  nsp -= 8
  if (peek16(MATH_RESULT) === 0xffff) {
    copy8(r, n)
    nsp -= 8
    return
  }
  math(M_MUL, r, n)
  math(M_INT, r, 0)
  copy8(r, n)
  nsp -= 8
  const k = push()
  setInt(k, 1)
  binary(M_ADD)
}

/* ---------------- the program ---------------- */

/** The line numbered `n`, or the first after it when not exact; 0 past the end. */
export function findLine(n: u16, exact: bool): u16 {
  let at = PROG
  while (peek16(at) !== 0) {
    const here = peek16(at)
    if (here === n) return at
    if (here > n) return exact ? 0 : at
    at += peek16(at + 2)
  }
  return 0
}

/** Moves `count` bytes from `from` to `to`, overlapping either way (one MCPY). */
export function move(from: u16, to: u16, count: u16): void {
  memcpy(to, from, count)
}

/** Puts line `n` (tokens at `text`, `length` bytes with the zero) in the program, or takes it out. */
export function storeLine(n: u16, text: u16, length: u16): void {
  const old = findLine(n, true)
  if (old !== 0) {
    const size = peek16(old + 2)
    move(old + size, old, progEnd + 2 - (old + size))
    progEnd -= size
  }
  if (length > 1) {
    const size = (4 + length + 1) & 0xfffe
    if (progEnd + 2 + size > LIMIT) fail(E_MEMORY)
    let at = findLine(n, false)
    if (at === 0) at = progEnd
    move(at, at + size, progEnd + 2 - at)
    poke16(at, n)
    poke16(at + 2, size)
    move(text, at + 4, length)
    progEnd += size
  }
  poke16(progEnd, 0)
  clearVariables()
  contLine = 0
}

/** The program made to end at `end` (PROG: none), its variables cleared. */
export function keepProgramTo(end: u16): void {
  progEnd = end
  poke16(end, 0)
  clearVariables()
  contLine = 0
}

/**
 * Where the program the battery kept ends, walking it from PROG; PROG when any line of it is
 * not sound (numbers rising, an even size inside the room, its text ended by a zero), so
 * a RAM that never held one starts empty.
 */
function keptProgramEnd(): u16 {
  let at: u16 = PROG
  let last: u16 = 0
  while (peek16(at) !== 0) {
    const n = peek16(at)
    const size = peek16(at + 2)
    if (n <= last || size < 6 || (size & 1) !== 0 || size > LIMIT - 2 - at) return PROG
    if (peek(at + size - 1) !== 0 && peek(at + size - 2) !== 0) return PROG
    last = n
    at += size
  }
  return at
}

/* ---------------- statements ---------------- */

export function jump(line: u16, text: u16): void {
  jumping = true
  jumpLine = line
  jumpTxt = text
}

/** The statements from the text to the end of the line, or until one jumps. */
export function statements(): void {
  for (;;) {
    checkBreak()
    // The strings a statement made are done with when it is.
    strTop = 0
    statement()
    if (jumping || (!running && curLine !== 0)) return
    const c = next()
    if (c === CH_COLON) {
      txt++
      continue
    }
    // ELSE reached after the THEN part ran: the rest of the line is the other branch.
    if (c === 0 || c === T_ELSE) return
    fail(E_SYNTAX)
  }
}

function statement(): void {
  const c = next()
  if (c === 0 || c === CH_COLON) return
  if (isLetter(c)) {
    assignment()
    return
  }
  txt++
  switch (c) {
    case T_PRINT:
      printStatement()
      return
    case T_LET:
      assignment()
      return
    case T_IF:
      ifStatement()
      return
    case T_FOR:
      forStatement()
      return
    case T_NEXT:
      nextStatement()
      return
    case T_GOTO:
      gotoStatement()
      return
    case T_GOSUB:
      gosubStatement()
      return
    case T_RETURN:
      returnStatement()
      return
    case T_REM:
      toLineEnd()
      return
    case T_DATA:
      skipData()
      return
    default:
      commandStatement(c)
      return
  }
}

/** DATA, run past: to the end of its statement, a colon outside quotes (READ reads it). */
function skipData(): void {
  let inside = false
  while (peek(txt) !== 0 && (inside || peek(txt) !== CH_COLON)) {
    if (peek(txt) === CH_QUOTE) inside = !inside
    txt++
  }
}

function commandStatement(c: u16): void {
  switch (c) {
    case T_INPUT:
      inputStatement()
      return
    case T_OFF:
      offStatement()
      return
    case T_END:
      contLine = 0
      endProgram()
      return
    case T_STOP:
      contLine = curLine
      contTxt = txt
      fresh_line()
      puts(str('STOP'))
      inLine()
      newline()
      endProgram()
      return
    case T_RUN:
      runStatement()
      return
    case T_LIST:
      listStatement()
      return
    case T_NEW:
      keepProgramTo(PROG)
      recallNo = 0
      endProgram()
      return
    case T_CONT:
      contStatement()
      return
    case T_CLS:
      cls()
      return
    case T_POKE:
      pokeStatement()
      return
    case T_CALL:
      expr()
      // Machine code is not BASIC: BRK, which BASIC only notes between statements, takes it
      // to the monitor as G does - it may never look at a key. Back, BASIC has BRK again.
      poke16(INBASIC, 0)
      call_at(toWord(top()))
      // A LINK request the code left out is let go: its answer must not land in RAM later.
      poke16(LINK_CMD, LINK_CANCEL)
      poke16(INBASIC, 1)
      poke16(BRKFLAG, 0)
      nsp -= 8
      return
    case T_MON:
      poke16(INBASIC, 0)
      monitor()
      return
    default:
      angleStatement(c)
      return
  }
}

function angleStatement(c: u16): void {
  if (c === T_DEG || c === T_RAD || c === T_GRAD) {
    const unit: u16 = c - T_DEG
    poke16(MATH_ANGLE, unit)
    angleMarks = unit === 0 ? ANN_DEG : unit === 1 ? ANN_RAD : ANN_GRAD
    marks()
    return
  }
  // The rest are in the banks: the screen, the card, the editing commands, and the others.
  if ((c >= T_LOCATE && c <= T_GPRINT) || c === T_CIRCLE) screenStatement(c)
  else if ((c >= T_FILES && c <= T_KILL) || c === T_OPEN || c === T_CLOSE) fileStatement(c)
  else if (c >= T_AUTO && c <= T_TROFF) toolStatement(c)
  else if (c === T_ASK) askStatement()
  else dataStatement(c)
}

export function toLineEnd(): void {
  while (peek(txt) !== 0) txt++
}

export function endProgram(): void {
  running = false
  toLineEnd()
}

function assignment(): void {
  const at = varAt(true)
  const strings = strType
  const room = varRoom
  expect(CH_EQ)
  expr()
  if (strType !== strings) fail(E_TYPE)
  if (strings) storeString(at, room)
  else copy8(top(), at)
  nsp -= 8
}

/** PRINT, or PRINT #n to a file opened for it (files.e16.ts). */
function printStatement(): void {
  if (next() === CH_HASH) printToFile()
  else printItems()
}

/**
 * PRINT's items: numbers and strings, ; joining (a number with a space after it) and , to
 * the next column of ten (in a file, a comma); a line after unless one ends it.
 */
export function printItems(): void {
  let joined = false
  printed = false
  while (!statementEnds()) {
    printItem()
    joined = separator()
    if (!joined && !statementEnds()) fail(E_SYNTAX)
  }
  if (joined) return
  if (outFile !== 0) fileByte(K_ENTER)
  // What filled the row to its end has wrapped already: a newline would leave a blank row.
  else if (!printed || peek16(CURX) !== 0) newline()
}

/** One item of PRINT's: a string as it is, a number formatted (a space after it before ;). */
function printItem(): void {
  expr()
  if (strType) outString(top())
  else {
    formatTop()
    for (let p = addr(textOut); peek(p) !== 0; p++) out(peek(p))
    if (next() === CH_SEMI) out(CH_SPACE)
  }
  nsp -= 8
}

/** PRINT has put something on the screen since it began. */
let printed = false

/** A character of PRINT's: on the screen, or into the file it goes to. */
function out(c: u16): void {
  printed = true
  if (outFile === 0) putc(c)
  else fileByte(c)
}

/** A string on the stack, out as PRINT puts it. */
export function outString(e: u16): void {
  const at = stringAt(e)
  const n = stringLength(e)
  for (let k: u16 = 0; k < n; k++) out(peek(at + k))
}

/** Whether the statement ends here: the line's end, a colon or an ELSE. */
export function statementEnds(): bool {
  const c = next()
  return c === 0 || c === CH_COLON || c === T_ELSE
}

/** Text in quotes from `p`, printed if `show`: where it ends, past its closing quote. */
export function quoted(p: u16, show: bool): u16 {
  let q = p
  while (peek(q) !== CH_QUOTE && peek(q) !== 0) {
    if (show) putc(peek(q))
    q++
  }
  return peek(q) === CH_QUOTE ? q + 1 : q
}

/** ; or , after an item: true when there was one. */
function separator(): bool {
  const c = next()
  if (c === CH_SEMI) {
    txt++
    return true
  }
  if (c !== CH_COMMA) return false
  txt++
  if (outFile !== 0) {
    fileByte(CH_COMMA)
    return true
  }
  putc(CH_SPACE)
  while (peek16(CURX) % 10 !== 0 && peek16(CURX) !== 0) putc(CH_SPACE)
  return true
}

function ifStatement(): void {
  expr()
  needNumber()
  const holds = !isZero(top())
  nsp -= 8
  if (next() === T_THEN) txt++
  if (!holds && !skipToElse()) return
  // A number after THEN or ELSE is where to go; anything else is statements, up to the
  // line's end or an ELSE, which then belongs to this IF and is passed over.
  if (isDigit(next())) gotoStatement()
  else statements()
}

/** To just after this line's ELSE; false (at the line's end) when it has none. */
function skipToElse(): bool {
  let quoted = false
  while (peek(txt) !== 0) {
    const c = peek(txt)
    txt++
    if (c === CH_QUOTE) quoted = !quoted
    if (c === T_ELSE && !quoted) return true
  }
  return false
}

export function gotoStatement(): void {
  const line = findLine(readUnsigned(), true)
  if (line === 0) fail(E_LINE)
  jump(line, line + 4)
}

export function gosubStatement(): void {
  const line = findLine(readUnsigned(), true)
  if (line === 0) fail(E_LINE)
  gosubTo(line)
}

/** A GOSUB to the line at `line`, coming back to where the text is now. */
export function gosubTo(line: u16): void {
  if (gsp >= GOSUB_DEPTH) fail(E_COMPLEX)
  gosubStack[gsp * 2] = curLine
  gosubStack[gsp * 2 + 1] = txt
  gsp++
  jump(line, line + 4)
}

function returnStatement(): void {
  if (gsp === 0) fail(E_RETURN)
  gsp--
  jump(gosubStack[gsp * 2], gosubStack[gsp * 2 + 1])
}

/** FOR v = a TO b [STEP s]: the loop kept as where to come back to, the limit and the step. */
function forStatement(): void {
  const at = varAt(true)
  needNumber()
  expect(CH_EQ)
  expr()
  copy8(top(), at)
  nsp -= 8
  if (next() !== T_TO) fail(E_SYNTAX)
  txt++
  expr()
  needNumber()
  const limit = top()
  if (next() === T_STEP) {
    txt++
    expr()
    needNumber()
  } else setInt(push(), 1)
  const step = top()
  // A loop on the same variable already open is ended, with any inside it.
  let k: u16 = 0
  while (k < fsp && peek16(forEntry(k)) !== at) k++
  fsp = k
  if (fsp >= FOR_DEPTH) fail(E_COMPLEX)
  const e = forEntry(fsp)
  poke16(e, at)
  copy8(limit, e + 2)
  copy8(step, e + 10)
  poke16(e + 18, curLine)
  poke16(e + 20, txt)
  fsp++
  nsp -= 16
}

function forEntry(k: u16): u16 {
  return addr(forStack) + k * FOR_SIZE
}

/** NEXT [v]: the step added; back to the loop while the limit is not passed. */
function nextStatement(): void {
  if (fsp === 0) fail(E_NEXT)
  let k = fsp - 1
  if (isLetter(next())) {
    const at = varAt(false)
    while (peek16(forEntry(k)) !== at) {
      if (k === 0) fail(E_NEXT)
      k--
    }
  }
  const e = forEntry(k)
  const at = peek16(e)
  math(M_ADD, at, e + 10)
  math(M_CMP, at, e + 2)
  const r = peek16(MATH_RESULT)
  // Going up: on while not past the limit; going down: the other way.
  const up = (peek(e + 10) & 0x80) === 0
  const past = up ? r === 1 : r === 0xffff
  if (past) {
    fsp = k
    return
  }
  fsp = k + 1
  jump(peek16(e + 18), peek16(e + 20))
}

function pokeStatement(): void {
  expr()
  needNumber()
  const a = toWord(top())
  nsp -= 8
  expect(CH_COMMA)
  expr()
  needNumber()
  poke(a, u16(toInt(top())))
  nsp -= 8
}

/** OFF: the machine switched off, its RAM kept; BRK/ON switches it on, the program there. */
function offStatement(): void {
  poke16(IO_POWER, 0)
}

/* ---------------- commands ---------------- */

function runStatement(): void {
  let from = PROG
  if (isDigit(next())) {
    from = findLine(readUnsigned(), true)
    if (from === 0) fail(E_LINE)
  }
  clearVariables()
  // A new run: where an old one stopped is no place to go on from.
  contLine = 0
  if (peek16(from) === 0) {
    endProgram()
    return
  }
  startRun(from, from + 4)
}

function contStatement(): void {
  if (contLine === 0) fail(E_CONT)
  startRun(contLine, contTxt)
}

/** Runs the program from a line and a place in it. */
function startRun(line: u16, text: u16): void {
  running = true
  marks()
  jump(line, text)
}

/** LIST [a][-[b]]: the lines from a (or the first) to b (or the last), then on along the line. */
function listStatement(): void {
  let from: u16 = 0
  let to: u16 = 0xffff
  if (isDigit(next())) from = readUnsigned()
  if (next() === CH_MINUS) {
    step()
    if (isDigit(next())) to = readUnsigned()
  }
  if (to < from) fail(E_ARGUMENT)
  let at = findLine(from, false)
  while (at !== 0 && peek16(at) !== 0 && peek16(at) <= to) {
    checkBreak()
    fresh_line()
    printUnsigned(peek16(at))
    putc(CH_SPACE)
    expand(at + 4, 0, 0)
    // A line that filled the row has wrapped already.
    fresh_line()
    at += peek16(at + 2)
  }
}

/* ---------------- running ---------------- */

/** Runs from where a jump went, line after line, until the end, END, STOP or an error. */
function run(): void {
  while (running) {
    if (jumping) {
      jumping = false
      curLine = jumpLine
      txt = jumpTxt
    } else {
      const nextLine = curLine + peek16(curLine + 2)
      if (peek16(nextLine) === 0) {
        // Run to its end: nothing is left to CONT.
        contLine = 0
        running = false
        break
      }
      curLine = nextLine
      txt = curLine + 4
    }
    if (tracing && curLine !== 0) {
      putc(CH_LBRACKET)
      printUnsigned(peek16(curLine))
      putc(CH_RBRACKET)
    }
    // A jump back into a typed line (a FOR typed at the prompt) has no line to run on.
    if (curLine === 0) {
      statements()
      if (!jumping) running = false
      continue
    }
    statements()
  }
  stopRunning()
}

/** Whether the typed line is a calculation: it starts with no statement and no `name =`. */
function isCalculation(): bool {
  const c = next()
  if (c >= 0x80) return c >= T_SIN && c <= T_LCDH
  if (!isLetter(c)) return c !== 0
  const save = txt
  readName()
  // An array's element: its brackets passed over, to see the = after them.
  if (next() === CH_LPAREN) {
    let depth: u16 = 0
    do {
      const d = peek(txt)
      if (d === CH_LPAREN) depth++
      else if (d === CH_RPAREN) depth--
      else if (d === 0) break
      txt++
    } while (depth > 0)
  }
  const assigns = next() === CH_EQ
  txt = save
  return !assigns
}

/** A calculation: its answer kept in ANS and shown at the right. */
function calculate(): void {
  expr()
  if (next() !== 0) fail(E_SYNTAX)
  // A number is kept in ANS; a string is only shown.
  const n = strType ? stringLength(top()) : formatTop()
  if (!strType) copy8(top(), addr(ans))
  const cols = peek16(COLS)
  fresh_line()
  let pad: i16 = i16(cols - n - 1)
  while (pad > 0) {
    putc(CH_SPACE)
    pad--
  }
  if (strType) outString(top())
  else puts(addr(textOut))
  newline()
  nsp -= 8
}

/**
 * The text in lineBuf as a program line (LOAD's): tokenized and kept; false when it is not
 * one (no number, or nothing after it).
 */
export function storeTypedLine(): bool {
  const length = tokenize(addr(lineBuf), addr(tokens))
  txt = addr(tokens)
  if (!isDigit(next())) return false
  const n = readUnsigned()
  if (n === 0 || next() === 0) return false
  storeLine(n, txt, length - (txt - addr(tokens)))
  return true
}

/** A line typed at the prompt: a numbered line to keep (or take out), or one to run now. */
function enter(): void {
  const length = tokenize(addr(lineBuf), addr(tokens))
  txt = addr(tokens)
  curLine = 0
  if (isDigit(next())) {
    const save = txt
    const n = readUnsigned()
    const c = next()
    // AUTO stops at a line left with only its number on it.
    if (autoLine !== 0 && c === 0) {
      autoLine = 0
      return
    }
    // A number is a line of the program when a statement follows it (or nothing, in PRO).
    if (n !== 0 && (isLetter(c) || c >= 0x80 || (c === 0 && proMode))) {
      storeLine(n, txt, length - (txt - addr(tokens)))
      recallNo = n
      justStored = true
      if (autoLine !== 0) autoLine = n + autoStep
      return
    }
    txt = save
  }
  if (isCalculation()) {
    // The strings a calculation makes are done with when it is, as a statement's are.
    strTop = 0
    calculate()
    return
  }
  jumping = false
  running = false
  statements()
  if (jumping) {
    running = true
    marks()
    run()
  }
}

/** The prompt: a line read and done, for ever; an error comes back here afresh. */
export function basicLoop(): void {
  nsp = addr(nums)
  running = false
  marks()
  // The text up or down called into the line, to edit before ENTER, in the same place.
  let length: u16 = 0
  let prompt = true
  for (;;) {
    if (prompt) {
      fresh_line()
      putc(CH_GT)
    }
    prompt = true
    if (length === 0) length = autoPrefix()
    const n: i16 = editLine(addr(lineBuf), LINE_MAX, length)
    length = 0
    if (n === EDIT_UP || n === EDIT_DOWN) {
      length = recall(n === EDIT_UP)
      prompt = false
      continue
    }
    edited(n)
  }
}

/** AUTO offers the next line's number, to go on from: what it put in lineBuf (0 when off). */
function autoPrefix(): u16 {
  if (autoLine === 0) return 0
  const n = unsignedText(autoLine, addr(lineBuf))
  poke(addr(lineBuf) + n, CH_SPACE)
  return n + 1
}

/** What the line editor gave: MODE, CLS or BRK (a fresh prompt, AUTO off), or a line to enter. */
function edited(n: i16): void {
  if (n < 0) autoLine = 0
  if (n === EDIT_MODE) {
    proMode = !proMode
    marks()
    return
  }
  // CLS cleared the screen; BRK gave the line up: a fresh prompt.
  if (n < 0) return
  // A line that filled its last row has wrapped already.
  fresh_line()
  if (n === 0) return
  move(addr(lineBuf), addr(lastLine), u16(n))
  lastLength = u16(n)
  enter()
}

/**
 * Calls a line into lineBuf: in PRO the program line before or after the one last called up
 * (the last or the first when there is none, and the same one at either end), or the line
 * just typed, for up; in RUN the last line typed. Its length.
 */
function recall(up: bool): u16 {
  if (!proMode) {
    if (!up) return 0
    move(addr(lastLine), addr(lineBuf), lastLength)
    return lastLength
  }
  let at: u16 = 0
  if (up && justStored) at = findLine(recallNo, true)
  justStored = false
  if (at === 0) at = neighbour(up)
  if (at === 0) at = findLine(recallNo, true)
  if (at === 0) return 0
  recallNo = peek16(at)
  const digits = unsignedText(recallNo, addr(lineBuf))
  poke(addr(lineBuf) + digits, CH_SPACE)
  return digits + 1 + expand(at + 4, addr(lineBuf) + digits + 1, LINE_MAX - digits - 1)
}

/** The program line just before recallNo (up) or just after it; the last or first when it is 0. */
function neighbour(up: bool): u16 {
  let at = PROG
  let found: u16 = 0
  while (peek16(at) !== 0) {
    const n = peek16(at)
    if (!up && n > recallNo) return at
    if (up && (recallNo === 0 || n < recallNo)) found = at
    at += peek16(at + 2)
  }
  return found
}

function showBanner(): void {
  puts(str('ELEC-16 BASIC 1.0'))
  newline()
  printUnsigned(LIMIT - varEnd)
  puts(str(' BYTES FREE'))
  newline()
}

/** Switched on: the program kept, its variables cleared, degrees, RUN mode. */
export function basicCold(): void {
  poke16(INBASIC, 1)
  poke16(BRKFLAG, 0)
  // RAM is kept while the machine is off: so is the program, though not its variables.
  keepProgramTo(keptProgramEnd())
  poke16(MATH_ANGLE, 0)
  angleMarks = ANN_DEG
  proMode = false
  fresh_line()
  showBanner()
}

/** Back from the monitor (Q): the program and variables as they were. */
export function basicWarm(): void {
  poke16(INBASIC, 1)
  poke16(BRKFLAG, 0)
  fresh_line()
  showBanner()
}
