// ELEC-16 BASIC, ROM bank 3: the commands for writing a program - AUTO, RENUM, DELETE, TRON
// and TROFF (docs/elec16.md section 6).
import {
  addr,
  type bool,
  div,
  peek,
  peek16,
  poke,
  poke16,
  type u16,
} from '../../../../src/shared/e16c/builtins'
import {
  E_ARGUMENT,
  E_LONG,
  E_MEMORY,
  E_SYNTAX,
  fail,
  failIn,
  findLine,
  isDigit,
  keepProgramTo,
  LINE_MAX,
  lineBuf,
  M_PARSE,
  M_TOWORD,
  next,
  nsp,
  progEnd,
  push,
  readUnsigned,
  setAuto,
  setNsp,
  setTracing,
  statementEnds,
  step,
  storeLine,
  strTemp,
  textOut,
} from './basic.e16'
import {
  CH_BACKSLASH,
  CH_CARET,
  CH_COLON,
  CH_COMMA,
  CH_EQ,
  CH_GT,
  CH_LT,
  CH_MINUS,
  CH_PLUS,
  CH_QUOTE,
  CH_SLASH,
  CH_SPACE,
  CH_STAR,
  LIMIT,
  MATH_A,
  MATH_ARG,
  MATH_B,
  MATH_OP,
  MATH_STATUS,
  PROG,
} from './rom.e16'
import {
  expand,
  T_AND,
  T_AUTO,
  T_DELETE,
  T_ELSE,
  T_GOSUB,
  T_GOTO,
  T_MOD,
  T_OR,
  T_REM,
  T_RENUM,
  T_RESTORE,
  T_THEN,
  T_TRON,
  unsignedText,
} from './text.e16'

/** AUTO [start][, step]: the prompt offers each next line's number (after the program's last). */
function autoStatement(): void {
  let start: u16 = 10
  let by: u16 = 10
  // From the program's last line on, unless told.
  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) start = peek16(at) + 10
  if (isDigit(next())) start = readUnsigned()
  if (next() === CH_COMMA) {
    step()
    by = readUnsigned()
  }
  if (start === 0 || by === 0) fail(E_ARGUMENT)
  setAuto(start, by)
}

/** DELETE a, DELETE a-b, DELETE -b, DELETE a-: the lines in that range taken out. */
function deleteStatement(): void {
  // DELETE alone would take the whole program: NEW says so, DELETE says which lines.
  if (statementEnds()) fail(E_SYNTAX)
  let from: u16 = 0
  let to: u16 = 0xffff
  if (isDigit(next())) {
    from = readUnsigned()
    to = from
  }
  if (next() === CH_MINUS) {
    step()
    to = isDigit(next()) ? readUnsigned() : 0xffff
  }
  if (to < from) fail(E_ARGUMENT)
  let at = findLine(from, false)
  while (at !== 0 && peek16(at) <= to) {
    storeLine(peek16(at), 0, 1)
    at = findLine(from, false)
  }
}

/* ---------------- how long a line lists ---------------- */

/** How many characters line `n`, its tokens at `text`, lists in: its number, a space, its text. */
export function listedLength(n: u16, text: u16): u16 {
  // Written into strTemp only to be counted: no expression is open while a line comes in.
  return unsignedText(n, addr(strTemp)) + 1 + expand(text, addr(strTemp), 255)
}

/**
 * Line `n` must list in LINE_MAX characters, or SAVE and calling it up would cut it: TOO
 * LONG, naming it, when it would not (typed with no space after its number, say). Checked
 * where a line comes in - typed, LOADed, RENUMbered - before anything changes.
 */
export function checkLength(n: u16, text: u16): void {
  if (listedLength(n, text) > LINE_MAX) failIn(E_LONG, n)
}

/* ---------------- RENUM ---------------- */

let newStart: u16 = 10
let renumFrom: u16 = 0
let renumStep: u16 = 10

/** The number line `old` will have: renumbered from renumFrom on; any other as it is. */
function renumbered(old: u16): u16 {
  if (old < renumFrom) return old
  let k: u16 = 0
  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
    const n = peek16(at)
    if (n === old) return newStart + k * renumStep
    if (n >= renumFrom) k++
  }
  // A line that is not there: a reference to it stays as written.
  return old
}

/**
 * RENUM [new][, from][, step]: the lines from `from` on numbered `new`, `new + step`, ...,
 * and every GOTO, GOSUB, THEN, ELSE and RESTORE (and ON's lists) changed to match - where the
 * number stands alone: one an operator follows (GOTO 100+I*10) is an expression's, left as it is.
 */
function renumStatement(): void {
  newStart = 10
  renumFrom = 0
  renumStep = 10
  if (isDigit(next())) newStart = readUnsigned()
  if (next() === CH_COMMA) {
    step()
    if (isDigit(next())) renumFrom = readUnsigned()
  }
  if (next() === CH_COMMA) {
    step()
    renumStep = readUnsigned()
  }
  checkRoom()
  checkRewrites()
  // References first, while every line still has its old number to be found by.
  let at = PROG
  while (peek16(at) !== 0) {
    const n = peek16(at)
    const length = rewrite(at + 4)
    if (length !== 0) {
      storeLine(n, addr(lineBuf), length)
      at = findLine(n, true)
    }
    at += peek16(at + 2)
  }
  let k: u16 = 0
  for (at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
    if (peek16(at) < renumFrom) continue
    poke16(at, newStart + k * renumStep)
    k++
  }
  keepProgramTo(progEnd)
}

/** The new numbers must fit a word and come after the lines left as they are. */
function checkRoom(): void {
  if (renumStep === 0 || newStart === 0 || newStart > 65529) fail(E_ARGUMENT)
  let count: u16 = 0
  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
    const n = peek16(at)
    if (n < renumFrom && n >= newStart) fail(E_ARGUMENT)
    if (n >= renumFrom) count++
  }
  if (count > 0 && count - 1 > div(65529 - newStart, renumStep)) fail(E_ARGUMENT)
}

/**
 * Every line's references rewritten once without keeping them: a line that would list past
 * LINE_MAX with its new numbers (TOO LONG, naming it), or a program grown past memory, stops
 * RENUM before anything has changed.
 */
function checkRewrites(): void {
  let grows: u16 = 0
  let k: u16 = 0
  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
    const n = peek16(at)
    const length = rewrite(at + 4)
    const was = peek16(at + 2) - 4
    if (length > was) grows += length - was
    // The number it will have: renumbered in order from renumFrom, as renumStatement does.
    let now = n
    if (n >= renumFrom) {
      now = newStart + k * renumStep
      k++
    }
    const text = length === 0 ? at + 4 : addr(lineBuf)
    if (length > LINE_MAX + 1 || listedLength(now, text) > LINE_MAX) failIn(E_LONG, n)
  }
  if (progEnd + 2 + grows > LIMIT) fail(E_MEMORY)
}

/** A token after which a line number may come. */
function takesLine(c: u16): bool {
  return c === T_GOTO || c === T_GOSUB || c === T_THEN || c === T_ELSE || c === T_RESTORE
}

/**
 * A line's text from `p` into lineBuf, its line numbers renumbered: the length with the zero
 * when anything changed, 0 when nothing did. Not the tokens buffer: the line RENUM was typed
 * in is still read from there.
 */
/** rewrite's place: in the text read, in lineBuf written, and whether a number changed. */
let rp: u16 = 0
let ro: u16 = 0
let rChanged = false

function rewrite(from: u16): u16 {
  rp = from
  ro = 0
  rChanged = false
  rWanting = false
  rInside = false
  while (peek(rp) !== 0) {
    if (!rInside && rWanting && isDigit(peek(rp))) {
      renumberHere()
      continue
    }
    if (!rInside && peek(rp) === T_REM) {
      // The rest is a remark: as it is.
      while (peek(rp) !== 0) copyOne()
      break
    }
    note(peek(rp))
    copyOne()
  }
  if (ro <= LINE_MAX) poke(addr(lineBuf) + ro, 0)
  return rChanged ? ro + 1 : 0
}

/** Inside quotes, and whether a line number may come next (after GOTO, or in ON's list). */
let rInside = false
let rWanting = false

/** A character passed: quotes, and what may come after it. */
function note(c: u16): void {
  if (c === CH_QUOTE) rInside = !rInside
  // A list of lines (ON ... GOTO a, b) goes on past a comma; anything else ends it.
  if (!rInside && c !== CH_SPACE) rWanting = takesLine(c) || (rWanting && c === CH_COMMA)
}

/**
 * One character copied as it is. Past LINE_MAX it is only counted: the length says the line
 * is too long (checkRewrites), and lineBuf is never written beyond.
 */
function copyOne(): void {
  if (ro < LINE_MAX) poke(addr(lineBuf) + ro, peek(rp))
  ro++
  rp++
}

/**
 * The line number at the text, written renumbered; as it is when an operator follows it. The
 * number is read as a run reads it (the maths unit's PARSE, then TOWORD): 1E2 and 100.5 are
 * line 100 there, so here too. One whose line does not change keeps how it was written,
 * unless it is plain digits (0100 is written 100, as before).
 */
function renumberHere(): void {
  const start = rp
  const length = lineLiteral()
  rp = start + length
  if (!rLineOk || !standsAlone(rp)) {
    copyFrom(start)
    return
  }
  const old = rLine
  const now = renumbered(old)
  if (now === old && !plainDigits(start, length)) {
    copyFrom(start)
    return
  }
  // Where the line is already too long, the digits are only counted (in textOut).
  const written = unsignedText(now, ro + 5 <= LINE_MAX ? addr(lineBuf) + ro : addr(textOut))
  if (written !== length || now !== old) rChanged = true
  ro += written
}

/** The line a number at the text names, when it names one (rLineOk): read by lineLiteral. */
let rLine: u16 = 0
let rLineOk = false

/**
 * The number written at rp, read by the maths unit as a run reads it: its length in the text,
 * and the line it names in rLine (rLineOk false when it names none: too large, or not read).
 */
function lineLiteral(): u16 {
  const at = push()
  poke16(MATH_ARG, 255)
  poke16(MATH_A, at)
  poke16(MATH_B, rp)
  poke16(MATH_OP, M_PARSE)
  let length = peek16(MATH_ARG)
  rLineOk = false
  if (peek16(MATH_STATUS) !== 0 || length === 0) {
    // Not a number the unit reads: only its digits are passed over.
    length = 0
    while (isDigit(peek(rp + length))) length++
  } else {
    poke16(MATH_A, at)
    poke16(MATH_OP, M_TOWORD)
    // TOWORD takes -32768 to 65535: a sign or its refusal is no line's number (computedLine).
    rLineOk = peek16(MATH_STATUS) === 0 && (peek(at) & 0x80) === 0
    rLine = peek16(MATH_ARG)
  }
  setNsp(nsp - 8)
  return length
}

/** Whether the `length` characters at `at` are all digits. */
function plainDigits(at: u16, length: u16): bool {
  for (let k: u16 = 0; k < length; k++) if (!isDigit(peek(at + k))) return false
  return true
}

/** The text from `start` to rp copied as it is. */
function copyFrom(start: u16): void {
  const end = rp
  rp = start
  while (rp < end) copyOne()
}

/**
 * Whether a number ending at `p` is a line number by itself: no operator follows it. Only an
 * operator (GOTO 100+I*10) makes it part of an expression, whose line RENUM cannot follow;
 * anything else - the end, a colon, a comma, ELSE, REM - leaves it the line a run goes to.
 */
function standsAlone(p: u16): bool {
  let q = p
  while (peek(q) === CH_SPACE) q++
  return !isOperator(peek(q))
}

/** The arithmetic, comparison and logical operators an expression goes on with. */
function isOperator(c: u16): bool {
  if (c === T_MOD || c === T_AND || c === T_OR) return true
  return (
    c === CH_PLUS ||
    c === CH_MINUS ||
    c === CH_STAR ||
    c === CH_SLASH ||
    c === CH_BACKSLASH ||
    c === CH_CARET ||
    c === CH_LT ||
    c === CH_EQ ||
    c === CH_GT
  )
}

/** The statements of this bank. */
export function toolStatement(c: u16): void {
  if (c === T_AUTO) autoStatement()
  else if (c === T_RENUM) renumStatement()
  else if (c === T_DELETE) deleteStatement()
  else setTracing(c === T_TRON)
}
