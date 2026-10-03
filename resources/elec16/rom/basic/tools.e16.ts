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
  E_COMPLEX,
  fail,
  findLine,
  isDigit,
  keepProgramTo,
  lineBuf,
  next,
  progEnd,
  readUnsigned,
  setAuto,
  setTracing,
  step,
  storeLine,
} from './basic.e16'
import { CH_COMMA, CH_MINUS, CH_QUOTE, CH_SPACE, PROG } from './rom.e16'
import {
  T_AUTO,
  T_DELETE,
  T_ELSE,
  T_GOSUB,
  T_GOTO,
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
 * and every GOTO, GOSUB, THEN, ELSE and RESTORE (and ON's lists) changed to match.
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
  if (renumStep === 0 || newStart === 0) fail(E_ARGUMENT)
  let count: u16 = 0
  for (let at = PROG; peek16(at) !== 0; at += peek16(at + 2)) {
    const n = peek16(at)
    if (n < renumFrom && n >= newStart) fail(E_ARGUMENT)
    if (n >= renumFrom) count++
  }
  if (count > 0 && count - 1 > div(65529 - newStart, renumStep)) fail(E_ARGUMENT)
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
  poke(addr(lineBuf) + ro, 0)
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

/** One character copied as it is. */
function copyOne(): void {
  if (ro >= 78) fail(E_COMPLEX)
  poke(addr(lineBuf) + ro, peek(rp))
  ro++
  rp++
}

/** The line number at the text, written renumbered. */
function renumberHere(): void {
  let old: u16 = 0
  const start = rp
  while (isDigit(peek(rp))) {
    old = old * 10 + (peek(rp) - 0x30)
    rp++
  }
  if (ro + 6 > 78) fail(E_COMPLEX)
  const now = renumbered(old)
  const written = unsignedText(now, addr(lineBuf) + ro)
  if (written !== rp - start || now !== old) rChanged = true
  ro += written
}

/** The statements of this bank. */
export function toolStatement(c: u16): void {
  if (c === T_AUTO) autoStatement()
  else if (c === T_RENUM) renumStatement()
  else if (c === T_DELETE) deleteStatement()
  else setTracing(c === T_TRON)
}
