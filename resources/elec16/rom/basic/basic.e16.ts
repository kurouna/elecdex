// ELEC-16 BASIC 1.0, the first half (docs/elec16.md section 6): the prompt and the program,
// the calculator, numbers through the maths unit, and the core statements. Written in e16c's
// subset of TypeScript and compiled into the ROM; the hand-written ROM gives it the LCD, the
// keys and the monitor (rom.e16.ts).
//
// Memory: the program from PROG, each line [number][length][tokens..0], words at even
// addresses; an end mark (a zero word); then the variables, ten bytes each [name0 name1]
// [value: 8]. Numbers are the maths unit's eight bytes; expressions work on a stack of them.
import {
  addr,
  type bool,
  bytes,
  i16,
  peek,
  peek16,
  poke,
  poke16,
  str,
  type u8,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
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
  CH_LPAREN,
  CH_LT,
  CH_MINUS,
  CH_PLUS,
  CH_QUESTION,
  CH_QUOTE,
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
  LIMIT,
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
  readline,
} from './rom.e16'
import {
  isLetter,
  printTokens,
  printUnsigned,
  T_AND,
  T_ANS,
  T_CALL,
  T_CLS,
  T_CONT,
  T_DEG,
  T_ELSE,
  T_END,
  T_EXP,
  T_FOR,
  T_GOSUB,
  T_GOTO,
  T_GRAD,
  T_IF,
  T_INPUT,
  T_LET,
  T_LIST,
  T_MON,
  T_NEW,
  T_NEXT,
  T_NOT,
  T_OR,
  T_PEEK,
  T_PI,
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
  tokenize,
} from './text.e16'

/* ---------------- the maths unit's operations (shared/elec16/math-unit.ts) ---------------- */

const M_ADD = 0x01
const M_SUB = 0x02
const M_MUL = 0x03
const M_DIV = 0x04
const M_POW = 0x05
const M_CMP = 0x06
const M_NEG = 0x10
const M_INT = 0x12
const M_RND = 0x1f
const M_PI = 0x20
const M_FROMINT = 0x30
const M_TOINT = 0x31
const M_PARSE = 0x38
const M_FORMAT = 0x39

/* ---------------- errors ---------------- */

const E_SYNTAX = 1
const E_OVERFLOW = 2
const E_DIVIDE = 3
const E_ARGUMENT = 4
const E_LINE = 5
const E_NEXT = 6
const E_RETURN = 7
const E_MEMORY = 8
const E_COMPLEX = 9
const E_CONT = 10

/* ---------------- state ---------------- */

/** Where the interpreter reads tokenized text. */
let txt: u16 = 0
/** The line running (its address), or 0 for a line typed at the prompt. */
let curLine: u16 = 0
/** The program's end mark. */
let progEnd: u16 = PROG
/** The variables run from progEnd + 2 up to here. */
let varEnd: u16 = PROG + 2
/** The next free number on the stack. */
let nsp: u16 = 0
/** FOR and GOSUB entries in use. */
let fsp: u16 = 0
let gsp: u16 = 0
let running = false
/** Where CONT goes on from (its line, its text), or 0 when it cannot. */
let contLine: u16 = 0
let contTxt: u16 = 0
/** A jump a statement asked for: GOTO, GOSUB, RETURN, NEXT. */
let jumping = false
let jumpLine: u16 = 0
let jumpTxt: u16 = 0
let proMode = false
let angleMarks: u16 = ANN_DEG

const lineBuf = bytes(80)
const tokens = bytes(96)
/** Twenty-four numbers of eight bytes. */
const nums = bytes(192)
const ans = bytes(8)
const textOut = bytes(24)
/** FOR entries: [value's address][limit 8][step 8][line][text] = 22 bytes, eight deep. */
const forStack = bytes(176)
/** GOSUB entries: [line][text], sixteen deep. */
const gosubStack = words(32)

const FOR_SIZE = 22
const FOR_DEPTH = 8
const GOSUB_DEPTH = 16

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
    default:
      return str('CONT')
  }
}

/** Says where a running program was. */
function inLine(): void {
  if (curLine === 0) return
  puts(str(' IN '))
  printUnsigned(peek16(curLine))
}

/** An error: said, the program stopped, back to the prompt. Never returns. */
function fail(code: u16): void {
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
function checkBreak(): void {
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

function stopRunning(): void {
  running = false
  nsp = addr(nums)
  marks()
}

/* ---------------- reading text ---------------- */

/** The next character that is not a space (text is not moved past it). */
function next(): u8 {
  while (peek(txt) === CH_SPACE) txt++
  return peek(txt)
}

function expect(c: u16): void {
  if (next() !== c) fail(E_SYNTAX)
  txt++
}

function isDigit(c: u16): bool {
  return c >= CH_0 && c <= CH_9
}

/** A whole number written in the text (a line number): its value; text moved past it. */
function readUnsigned(): u16 {
  next()
  if (!isDigit(peek(txt))) fail(E_SYNTAX)
  let v: u16 = 0
  while (isDigit(peek(txt))) {
    v = wrapMul10(v) + (peek(txt) - CH_0)
    txt++
  }
  return v
}

function wrapMul10(v: u16): u16 {
  if (v > 6553) fail(E_LINE)
  return v * 10
}

/* ---------------- numbers ---------------- */

/** Runs a maths operation on A and B; an error stops the program. */
function math(op: u16, a: u16, b: u16): void {
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
function push(): u16 {
  if (nsp >= addr(nums) + 192) fail(E_COMPLEX)
  const at = nsp
  nsp += 8
  return at
}

function top(): u16 {
  return nsp - 8
}

function copy8(from: u16, to: u16): void {
  poke16(to, peek16(from))
  poke16(to + 2, peek16(from + 2))
  poke16(to + 4, peek16(from + 4))
  poke16(to + 6, peek16(from + 6))
}

function isZero(at: u16): bool {
  return peek(at + 2) === 0
}

function setInt(at: u16, v: i16): void {
  poke16(MATH_ARG, u16(v))
  math(M_FROMINT, at, 0)
}

/** The top number as a signed word (its whole part); an error past one. */
function toInt(at: u16): i16 {
  math(M_TOINT, at, 0)
  return i16(peek16(MATH_ARG))
}

/** Applies a binary operation to the two top numbers, leaving one. */
function binary(op: u16): void {
  const b = top()
  nsp -= 8
  math(op, top(), b)
}

/** The number written at the text, onto the stack. */
function literal(): void {
  const at = push()
  poke16(MATH_ARG, 40)
  math(M_PARSE, at, txt)
  const n = peek16(MATH_ARG)
  if (n === 0) fail(E_SYNTAX)
  txt += n
}

/** The number on top as text in textOut, ended by a zero: its length. */
function formatTop(): u16 {
  poke16(MATH_ARG, 0)
  math(M_FORMAT, top(), addr(textOut))
  const n = peek16(MATH_ARG)
  poke(addr(textOut) + n, 0)
  return n
}

/* ---------------- variables ---------------- */

let name0: u16 = 0
let name1: u16 = 0

/** A variable's name at the text: a letter and an optional letter or digit. */
function readName(): void {
  next()
  name0 = peek(txt)
  if (!isLetter(name0)) fail(E_SYNTAX)
  txt++
  name1 = peek(txt)
  if (isLetter(name1) || isDigit(name1)) txt++
  else name1 = 0
  if (peek(txt) === CH_DOLLAR) fail(E_SYNTAX)
}

/** The value's address of the variable named, made (0) when asked; 0 when not found. */
function findVar(make: bool): u16 {
  let at = progEnd + 2
  while (at < varEnd) {
    if (peek(at) === name0 && peek(at + 1) === name1) return at + 2
    at += 10
  }
  if (!make) return 0
  if (varEnd + 10 > LIMIT) fail(E_MEMORY)
  poke(at, name0)
  poke(at + 1, name1)
  for (let k: u16 = 2; k < 10; k += 2) poke16(at + k, 0)
  varEnd += 10
  return at + 2
}

function clearVariables(): void {
  varEnd = progEnd + 2
  fsp = 0
  gsp = 0
}

/* ---------------- expressions ---------------- */

/** An expression onto the stack: OR, AND, NOT, comparison, + -, * /, ^, then the rest. */
function expr(): void {
  andExpr()
  while (next() === T_OR) {
    txt++
    andExpr()
    logical(false)
  }
}

function andExpr(): void {
  notExpr()
  while (next() === T_AND) {
    txt++
    notExpr()
    logical(true)
  }
}

/** AND and OR on truth: 1 or 0. */
function logical(both: bool): void {
  const b = !isZero(top())
  nsp -= 8
  const a = !isZero(top())
  setInt(top(), (both ? a && b : a || b) ? 1 : 0)
}

function notExpr(): void {
  if (next() === T_NOT) {
    txt++
    notExpr()
    setInt(top(), isZero(top()) ? 1 : 0)
    return
  }
  compare()
}

/** A comparison: < <= <> = >= >, 1 when it holds, 0 when not. */
function compare(): void {
  addExpr()
  const c = next()
  if (c !== CH_LT && c !== CH_EQ && c !== CH_GT) return
  txt++
  let want: u16 = c === CH_LT ? 1 : c === CH_EQ ? 2 : 4
  const d = peek(txt)
  if (c !== CH_EQ && (d === CH_EQ || (c === CH_LT && d === CH_GT))) {
    want |= d === CH_EQ ? 2 : 4
    txt++
  }
  addExpr()
  const b = top()
  nsp -= 8
  math(M_CMP, top(), b)
  const r = peek16(MATH_RESULT)
  const got: u16 = r === 0xffff ? 1 : r === 0 ? 2 : 4
  setInt(top(), (want & got) !== 0 ? 1 : 0)
}

function addExpr(): void {
  mulExpr()
  for (;;) {
    const c = next()
    if (c !== CH_PLUS && c !== CH_MINUS) return
    txt++
    mulExpr()
    binary(c === CH_PLUS ? M_ADD : M_SUB)
  }
}

function mulExpr(): void {
  unary()
  for (;;) {
    const c = next()
    if (c !== CH_STAR && c !== CH_SLASH) return
    txt++
    unary()
    binary(c === CH_STAR ? M_MUL : M_DIV)
  }
}

/**
 * A sign binds looser than ^: -2^2 is -4. It is also a function's argument without brackets,
 * so SIN -1 and ABS -X^2 read as they look, and SIN X+1 is (SIN X)+1.
 */
function unary(): void {
  const c = next()
  if (c === CH_MINUS) {
    txt++
    unary()
    math(M_NEG, top(), 0)
    return
  }
  if (c === CH_PLUS) txt++
  power()
}

function power(): void {
  primary()
  if (next() !== CH_CARET) return
  txt++
  unary()
  binary(M_POW)
}

function primary(): void {
  const c = next()
  if (isDigit(c) || c === CH_DOT) {
    literal()
    return
  }
  if (c === CH_LPAREN) {
    txt++
    expr()
    expect(CH_RPAREN)
    return
  }
  if (isLetter(c)) {
    readName()
    const at = findVar(false)
    const to = push()
    if (at === 0) setInt(to, 0)
    else copy8(at, to)
    return
  }
  txt++
  functionCall(c)
}

/** SIN to EXP, SQR, ABS, INT, SGN: the maths unit's single operations, in token order. */
const FUNCTION_OPS = str(
  '\u0016\u0017\u0018\u0019\u001a\u001b\u0015\u0011\u0012\u0014\u001d\u001c\u001e',
)

function functionCall(token: u16): void {
  if (token >= T_SIN && token <= T_EXP) {
    unary()
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
    setInt(top(), peek(u16(toInt(top()))))
    return
  }
  fail(E_SYNTAX)
}

/** RND n: a whole number from 1 to n; RND below 1: a fraction from 0 up to 1. */
function random(): void {
  unary()
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
function findLine(n: u16, exact: bool): u16 {
  let at = PROG
  while (peek16(at) !== 0) {
    const here = peek16(at)
    if (here === n) return at
    if (here > n) return exact ? 0 : at
    at += peek16(at + 2)
  }
  return 0
}

/** Moves `count` bytes from `from` to `to`, overlapping either way. */
function move(from: u16, to: u16, count: u16): void {
  if (to < from) {
    for (let k: u16 = 0; k < count; k++) poke(to + k, peek(from + k))
    return
  }
  let k = count
  while (k > 0) {
    k--
    poke(to + k, peek(from + k))
  }
}

/** Puts line `n` (tokens at `text`, `length` bytes with the zero) in the program, or takes it out. */
function storeLine(n: u16, text: u16, length: u16): void {
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
function keepProgramTo(end: u16): void {
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

function jump(line: u16, text: u16): void {
  jumping = true
  jumpLine = line
  jumpTxt = text
}

/** The statements from the text to the end of the line, or until one jumps. */
function statements(): void {
  for (;;) {
    checkBreak()
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
    default:
      commandStatement(c)
      return
  }
}

function commandStatement(c: u16): void {
  switch (c) {
    case T_INPUT:
      inputStatement()
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
      call_at(u16(toInt(top())))
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
  fail(E_SYNTAX)
}

function toLineEnd(): void {
  while (peek(txt) !== 0) txt++
}

function endProgram(): void {
  running = false
  toLineEnd()
}

function assignment(): void {
  readName()
  const at = findVar(true)
  expect(CH_EQ)
  expr()
  copy8(top(), at)
  nsp -= 8
}

/**
 * PRINT: numbers and "text", ; joining (a number with a space after it) and , to the next
 * column of ten; a line after unless one ends it.
 */
function printStatement(): void {
  let joined = false
  while (!statementEnds()) {
    if (next() === CH_QUOTE) {
      txt = quoted(txt + 1, true)
    } else {
      expr()
      formatTop()
      puts(addr(textOut))
      nsp -= 8
      if (next() === CH_SEMI) putc(CH_SPACE)
    }
    joined = separator()
    if (!joined && !statementEnds()) fail(E_SYNTAX)
  }
  if (!joined) newline()
}

/** Whether the statement ends here: the line's end, a colon or an ELSE. */
function statementEnds(): bool {
  const c = next()
  return c === 0 || c === CH_COLON || c === T_ELSE
}

/** Text in quotes from `p`, printed if `show`: where it ends, past its closing quote. */
function quoted(p: u16, show: bool): u16 {
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
  putc(CH_SPACE)
  while (peek16(CURX) % 10 !== 0 && peek16(CURX) !== 0) putc(CH_SPACE)
  return true
}

/** INPUT ["prompt";] v: asks until it gets a number. */
function inputStatement(): void {
  let prompt: u16 = 0
  if (next() === CH_QUOTE) {
    prompt = txt + 1
    txt = quoted(prompt, false)
    if (next() === CH_SEMI || next() === CH_COMMA) txt++
  }
  readName()
  const at = findVar(true)
  for (;;) {
    fresh_line()
    if (prompt !== 0) quoted(prompt, true)
    putc(CH_QUESTION)
    const n: i16 = readline(addr(lineBuf), 40)
    if (n === -2) {
      poke16(BRKFLAG, 1)
      checkBreak()
    }
    newline()
    if (n >= 0 && readInput(at)) return
  }
}

/** The number typed for INPUT into the variable at `at`: false when it is not one. */
function readInput(at: u16): bool {
  let p = addr(lineBuf)
  while (peek(p) === CH_SPACE) p++
  const minus = peek(p) === CH_MINUS
  if (minus) p++
  poke16(MATH_A, at)
  poke16(MATH_B, p)
  poke16(MATH_ARG, 40)
  poke16(MATH_OP, M_PARSE)
  const n = peek16(MATH_ARG)
  if (peek16(MATH_STATUS) !== 0 || n === 0) return false
  if (minus) math(M_NEG, at, 0)
  return true
}

function ifStatement(): void {
  expr()
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

function gotoStatement(): void {
  const line = findLine(readUnsigned(), true)
  if (line === 0) fail(E_LINE)
  jump(line, line + 4)
}

function gosubStatement(): void {
  const line = findLine(readUnsigned(), true)
  if (line === 0) fail(E_LINE)
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
  readName()
  const at = findVar(true)
  expect(CH_EQ)
  expr()
  copy8(top(), at)
  nsp -= 8
  if (next() !== T_TO) fail(E_SYNTAX)
  txt++
  expr()
  const limit = top()
  if (next() === T_STEP) {
    txt++
    expr()
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
    readName()
    const at = findVar(false)
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
  const a = u16(toInt(top()))
  nsp -= 8
  expect(CH_COMMA)
  expr()
  poke(a, u16(toInt(top())))
  nsp -= 8
}

/* ---------------- commands ---------------- */

function runStatement(): void {
  let from = PROG
  if (isDigit(next())) {
    from = findLine(readUnsigned(), true)
    if (from === 0) fail(E_LINE)
  }
  clearVariables()
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

function listStatement(): void {
  let at = PROG
  if (isDigit(next())) at = findLine(readUnsigned(), false)
  while (at !== 0 && peek16(at) !== 0) {
    checkBreak()
    fresh_line()
    printUnsigned(peek16(at))
    putc(CH_SPACE)
    printTokens(at + 4)
    newline()
    at += peek16(at + 2)
  }
  toLineEnd()
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
        running = false
        break
      }
      curLine = nextLine
      txt = curLine + 4
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
  if (c >= 0x80) return c >= T_SIN
  if (!isLetter(c)) return c !== 0
  const save = txt
  readName()
  const assigns = next() === CH_EQ
  txt = save
  return !assigns
}

/** A calculation: its answer kept in ANS and shown at the right. */
function calculate(): void {
  expr()
  if (next() !== 0) fail(E_SYNTAX)
  copy8(top(), addr(ans))
  const n = formatTop()
  const cols = peek16(COLS)
  fresh_line()
  let pad: i16 = i16(cols - n - 1)
  while (pad > 0) {
    putc(CH_SPACE)
    pad--
  }
  puts(addr(textOut))
  newline()
  nsp -= 8
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
    // A number is a line of the program when a statement follows it (or nothing, in PRO).
    if (n !== 0 && (isLetter(c) || c >= 0x80 || (c === 0 && proMode))) {
      storeLine(n, txt, length - (txt - addr(tokens)))
      return
    }
    txt = save
  }
  if (isCalculation()) {
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
  for (;;) {
    fresh_line()
    putc(CH_GT)
    const n: i16 = readline(addr(lineBuf), 78)
    if (n === -3) {
      proMode = !proMode
      marks()
      continue
    }
    // CLS cleared the screen; BRK gave the line up: a fresh prompt.
    if (n < 0) continue
    newline()
    if (n > 0) enter()
  }
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
