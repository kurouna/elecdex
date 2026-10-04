// ELEC-16 BASIC: the line editor at the prompt. The line is a buffer shown from where the
// cursor stood when it began, wrapping at the screen's edge; typing writes over the cell under
// the cursor, INS opens a space there, DEL takes the character out, BS the one before it, and
// the arrows move along it. Up and down hand the line back for BASIC to put another in its
// place (PRO calls up program lines; RUN the last line typed).
import {
  type bool,
  div,
  i16,
  memcpy,
  memset,
  peek,
  peek16,
  poke,
  poke16,
  type u16,
} from '../../../../src/shared/e16c/builtins'
import {
  CH_SPACE,
  COLS,
  CURX,
  CURY,
  cls,
  DEPTH,
  getkey,
  IO_CURMODE,
  K_ANS,
  K_BRK,
  K_BS,
  K_CLS,
  K_DEL,
  K_DOWN,
  K_ENTER,
  K_INS,
  K_LEFT,
  K_MODE,
  K_RIGHT,
  K_UP,
  locate,
  PLANE,
  putc,
  ROWS,
  VRAM,
  WIDTH,
} from './rom.e16'

/** What editLine gives instead of a length. */
export const EDIT_CLS = -1
export const EDIT_BRK = -2
export const EDIT_MODE = -3
export const EDIT_UP = -4
export const EDIT_DOWN = -5
/** editLine's `recalls`: up, and down, call a line up (otherwise they do nothing). */
export const EDIT_RECALLS_UP = 1
export const EDIT_RECALLS_DOWN = 2

/** The cell (column, then rows below) where the line began. */
let startX: u16 = 0
let startY: u16 = 0

/** Puts the cursor on the cell of the line's character `at`. */
function place(at: u16): void {
  const cols = peek16(COLS)
  const cell = startX + at
  locate(cell % cols, startY + div(cell, cols))
}

/**
 * Shows the line from `from` to its end, and one blank cell after it (a character taken out
 * leaves one), then puts the cursor back at `at`. Where showing it scrolled the screen up,
 * the line's first row moved up with it.
 */
function redraw(buf: u16, length: u16, from: u16, at: u16): void {
  place(from)
  for (let k = from; k < length; k++) putc(peek(buf + k))
  putc(CH_SPACE)
  const cols = peek16(COLS)
  const cell = startX + length + 1
  const expected = startY + div(cell, cols)
  // putc wraps after the last column, so the cursor stands on the cell after the blank.
  const now = peek16(CURY)
  if (now < expected) startY -= expected - now
  // Past the blank, the rest of the line's last row: what a program left there would read as
  // part of the line.
  clearRest(cell % cols, startY + div(cell, cols))
  place(at)
}

/**
 * The cells of `row` from column `col` to its end, cleared in every plane, straight in the
 * LCD's memory - putc would wrap, and on the last row scroll, at the row's end.
 */
function clearRest(col: u16, row: u16): void {
  if (col === 0 || col >= peek16(COLS) || row >= peek16(ROWS)) return
  const width = peek16(WIDTH)
  const at = VRAM + row * width + col * 6
  for (let p: u16 = 0; p < peek16(DEPTH); p++) memset(at + p * peek16(PLANE), 0, width - col * 6)
}

/**
 * Edits the line at `buf`, of which `length` characters are already there (shown here), at
 * most `max`. Its length when ENTER is pressed (the text ended by a zero), or EDIT_CLS (the
 * screen was cleared), EDIT_BRK, EDIT_MODE, EDIT_UP or EDIT_DOWN, the line given up. Up, down,
 * MODE and BRK rub the line out and leave the cursor where it began, for the next one to take
 * its place - MODE's and BRK's at the same prompt, not a new one down the screen at every press. Up and
 * down end the editing only where `recalls` says there is a line to call up (EDIT_RECALLS_UP,
 * EDIT_RECALLS_DOWN); where there is none they do nothing, and the line typed stays.
 */
export function editLine(buf: u16, max: u16, length: u16, recalls: u16): i16 {
  startX = peek16(CURX)
  startY = peek16(CURY)
  n = length
  at = length
  redraw(buf, n, 0, at)
  poke16(IO_CURMODE, 6)
  for (;;) {
    const k = getkey()
    const control = controlKey(k, recalls)
    if (control === 0) {
      editKey(buf, max, k)
      continue
    }
    poke16(IO_CURMODE, 0)
    // Whatever comes next starts below the line, never inside it.
    place(n)
    if (control === EDIT_CLS) cls()
    if (control !== 1 && control !== EDIT_CLS) rubOut(n)
    if (control !== 1) return control
    poke(buf + n, 0)
    return i16(n)
  }
}

/** The line's length and the cursor's place in it, while editLine runs. */
let n: u16 = 0
let at: u16 = 0

/** A key that edits: a move, a deletion, a space opened, or a character written. */
function editKey(buf: u16, max: u16, k: u16): void {
  if (k === K_LEFT || k === K_RIGHT) stepCursor(k === K_RIGHT)
  else if (k === K_BS || k === K_DEL) erase(buf, k === K_BS)
  else if (k === K_INS && n < max) n = openSpace(buf, n, at)
  else if (k === K_ANS) typeAns(buf, max)
  else if (k >= CH_SPACE && (at < n || n < max)) write(buf, k)
}

/** The ANS key: the word ANS typed, all three letters or none (a cut word is another name). */
function typeAns(buf: u16, max: u16): void {
  if (at + 3 > max) return
  write(buf, 0x41)
  write(buf, 0x4e)
  write(buf, 0x53)
}

/** The cursor a character along the line, never past either end. */
function stepCursor(right: bool): void {
  if (right && at < n) at++
  if (!right && at > 0) at--
  place(at)
}

/** BS: the character before the cursor taken out; DEL: the one under it. */
function erase(buf: u16, before: bool): void {
  if (before) {
    if (at === 0) return
    at--
  } else if (at === n) return
  n = takeOut(buf, n, at)
}

/** A character written over the one under the cursor, or added at the line's end. */
function write(buf: u16, k: u16): void {
  poke(buf + at, k)
  if (at === n) n++
  at++
  redraw(buf, n, at - 1, at)
}

/** Keys that end the editing: 1 for ENTER, the EDIT_ answer for the others, 0 for the rest. */
function controlKey(k: u16, recalls: u16): i16 {
  if (k === K_ENTER) return 1
  if (k === K_CLS) return EDIT_CLS
  if (k === K_BRK) return EDIT_BRK
  if (k === K_MODE) return EDIT_MODE
  // With nothing to call up, an arrow is a key that edits nothing (editKey passes it by).
  if (k === K_UP) return (recalls & EDIT_RECALLS_UP) !== 0 ? EDIT_UP : 0
  if (k === K_DOWN) return (recalls & EDIT_RECALLS_DOWN) !== 0 ? EDIT_DOWN : 0
  return 0
}

/** The line's `n` characters blanked, the cursor back where it began. */
function rubOut(n: u16): void {
  place(0)
  for (let k: u16 = 0; k < n; k++) putc(CH_SPACE)
  place(0)
}

/** The character at `at` taken out, the rest moved down and shown: the new length. */
function takeOut(buf: u16, n: u16, at: u16): u16 {
  if (at + 1 < n) memcpy(buf + at, buf + at + 1, n - at - 1)
  redraw(buf, n - 1, at, at)
  return n - 1
}

/** A space opened at `at`, the rest moved up and shown: the new length. */
function openSpace(buf: u16, n: u16, at: u16): u16 {
  if (n > at) memcpy(buf + at + 1, buf + at, n - at)
  poke(buf + at, CH_SPACE)
  redraw(buf, n + 1, at, at)
  return n + 1
}
