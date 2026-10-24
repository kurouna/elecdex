// ELEC-16 SCI, ROM bank 3: the 2D display (docs/elec16-sci.md section 4.4). The tokens laid out
// as a textbook sets them: a fraction's parts over and under a bar four dots above the line's
// foot, a root's body under a bar with a tick, a power's exponent raised four dots (a run of
// powers stepping up, read from the right). Every part is a box - its width, how far it reaches
// above its foot and below - measured first, then drawn. The same code sets the line being
// typed (its cursor found on the way) and an exact answer (p + r√s)/q.
import { type bool, peek, type u16 } from '../../../src/shared/e16c/builtins'
import { dot, glyphAt } from './lcd.e16'
import { opensTemplate, T_END, T_FRAC, T_POWT, T_ROOT, T_SEP, tokenText } from './tokens.e16'

/** The bar's height above a line's foot: the + and - strokes' row. */
const MID = 4

/** The tokens being set: where they are and how many. */
let buf: u16 = 0
let bufLength: u16 = 0
/** Sideways slide, in dots: what is left of it is not drawn. */
let slide: u16 = 0
/** Drawing or only measuring (to find the cursor first). */
let ink: bool = false
/** The cursor's place in the tokens (0xffff: none), and where it was found. */
let cursorIndex: u16 = 0xffff
export let cursorX: u16 = 0
export let cursorTop: u16 = 0
/** What the last box measured reached above and below its foot. */
let boxUp: u16 = 0
let boxDown: u16 = 0

function tokenAt(i: u16): u16 {
  return peek(buf + i)
}

/* ---------------- a template's parts ---------------- */

/** The END of the template opened at `i`. */
function closeOf(i: u16): u16 {
  let depth: u16 = 0
  for (let j = i; j < bufLength; j++) {
    const t = tokenAt(j)
    if (opensTemplate(t)) depth++
    else if (t === T_END) {
      depth--
      if (depth === 0) return j
    }
  }
  return bufLength
}

/** The SEP of the fraction opened at `i`. */
function sepFrom(i: u16): u16 {
  let depth: u16 = 0
  for (let j = i; j < bufLength; j++) {
    const t = tokenAt(j)
    if (opensTemplate(t)) depth++
    else if (t === T_END) depth--
    else if (t === T_SEP && depth === 1) return j
  }
  return bufLength
}

/* ---------------- measuring ---------------- */

/** The width of tokens `from` to `to`, its reach in boxUp and boxDown. An empty part is a box. */
function measureSeq(from: u16, to: u16): u16 {
  if (from >= to) {
    boxUp = 7
    boxDown = 0
    return 6
  }
  let width: u16 = 0
  let up: u16 = 7
  let down: u16 = 0
  let lift: u16 = 0
  let i = from
  while (i < to) {
    const t = tokenAt(i)
    lift = t === T_POWT ? lift + 4 : 0
    width += measureItem(i)
    if (boxUp + lift > up) up = boxUp + lift
    if (boxDown > down) down = boxDown
    i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
  }
  boxUp = up
  boxDown = down
  return width
}

/** The width of the item at `i` (a token or a whole template), its reach in boxUp and boxDown. */
function measureItem(i: u16): u16 {
  const t = tokenAt(i)
  if (t === T_FRAC) {
    const sep = sepFrom(i)
    const wa = measureSeq(i + 1, sep)
    const ua = boxUp
    const da = boxDown
    const wb = measureSeq(sep + 1, closeOf(i))
    const reach = boxUp + boxDown
    boxUp = MID + 2 + da + ua
    boxDown = reach > 0 ? reach - 1 : 0
    return wider(wa, wb) + 6
  }
  if (t === T_ROOT) {
    const wa = measureSeq(i + 1, closeOf(i))
    boxUp += 2
    return wa + 6
  }
  if (t === T_POWT) {
    const wa = measureSeq(i + 1, closeOf(i))
    boxUp += 4
    boxDown = 0
    return wa + 1
  }
  boxUp = 7
  boxDown = 0
  return charsOf(t) * 6
}

/** The wider of two widths (e16c has no Math). */
function wider(a: u16, b: u16): u16 {
  if (a > b) return a
  return b
}

/** How many characters a token shows as. */
function charsOf(t: u16): u16 {
  const text = t < 0x20 ? tokenText(t) : 0
  if (text === 0) return 1
  let n: u16 = 0
  while (peek(text + n) !== 0) n++
  return n
}

/* ---------------- drawing ---------------- */

/** A dot at (x, y) of the layout: off the left (scrolled away) or the right, not drawn. */
function plot(x: u16, y: u16): void {
  if (!ink || x < slide || x - slide >= 128 || y >= 64) return
  dot(x - slide, y)
}

function hline(x0: u16, x1: u16, y: u16): void {
  for (let x = x0; x <= x1; x++) plot(x, y)
}

/** Character `c` with its top-left dot at (x, y). */
function char(c: u16, x: u16, y: u16): void {
  if (!ink || x < slide || x - slide > 122) return
  glyphAt(c, x - slide, y)
}

/** The cursor is at `i` of the tokens here: a bar left of `x`, the height of the line. */
function cursorAt(i: u16, x: u16, foot: u16): void {
  if (i !== cursorIndex) return
  cursorX = x > 0 ? x - 1 : 0
  cursorTop = foot - 8
}

/** Tokens `from` to `to` from `x` on the line whose foot is `foot`: where they end. */
function drawSeq(from: u16, to: u16, x: u16, foot: u16): u16 {
  cursorAt(from, x, foot)
  if (from >= to) {
    // An empty part: a dotted box the cursor goes into, unless it is there.
    if (cursorIndex !== from) {
      for (let k: u16 = 0; k < 5; k += 2) {
        plot(x + k, foot - 7)
        plot(x + k, foot - 1)
      }
      for (let k: u16 = 2; k < 6; k += 2) {
        plot(x, foot - 7 + k)
        plot(x + 4, foot - 7 + k)
      }
    }
    return x + 6
  }
  let at = x
  let lift: u16 = 0
  let i = from
  while (i < to) {
    const t = tokenAt(i)
    lift = t === T_POWT ? lift + 4 : 0
    at = drawItem(i, at, foot - lift)
    i = opensTemplate(t) ? closeOf(i) + 1 : i + 1
    cursorAt(i, at, foot)
  }
  return at
}

function drawItem(i: u16, x: u16, foot: u16): u16 {
  const t = tokenAt(i)
  if (t === T_FRAC) return drawFraction(i, x, foot)
  if (t === T_ROOT) return drawRoot(i, x, foot)
  if (t === T_POWT) return drawSeq(i + 1, closeOf(i), x, foot - 4) + 1
  const text = t < 0x20 ? tokenText(t) : 0
  if (text === 0) {
    char(t, x, foot - 7)
    return x + 6
  }
  let at = x
  let p = text
  while (peek(p) !== 0) {
    char(peek(p), at, foot - 7)
    at += 6
    p++
  }
  return at
}

/** A fraction: the bar a dot in from each side, the parts centred over and under it. */
function drawFraction(i: u16, x: u16, foot: u16): u16 {
  const sep = sepFrom(i)
  const end = closeOf(i)
  const wa = measureSeq(i + 1, sep)
  const da = boxDown
  const wb = measureSeq(sep + 1, end)
  const ub = boxUp
  const w = wider(wa, wb) + 6
  const bar = foot - MID
  hline(x + 1, x + w - 3, bar)
  drawSeq(i + 1, sep, x + ((w - wa) >> 1), bar - 2 - da)
  drawSeq(sep + 1, end, x + ((w - wb) >> 1), bar + 2 + ub)
  return x + w
}

/** A root: a tick, a stroke down and up, and a bar over the body two dots above it. */
function drawRoot(i: u16, x: u16, foot: u16): u16 {
  const end = closeOf(i)
  const wa = measureSeq(i + 1, end)
  const top = foot - boxUp - 2
  plot(x, foot - 4)
  plot(x + 1, foot - 3)
  plot(x + 1, foot - 2)
  plot(x + 2, foot - 1)
  const half = (foot - top) >> 1
  for (let y = top; y < foot; y++) plot(foot - y > half ? x + 3 : x + 4, y)
  hline(x + 4, x + 4 + wa, top)
  drawSeq(i + 1, end, x + 5, foot)
  return x + wa + 6
}

/* ---------------- what the calculator asks for ---------------- */

/** The height a line of tokens takes (above its foot and below). */
export function heightOf(at: u16, length: u16): u16 {
  buf = at
  bufLength = length
  measureSeq(0, length)
  return boxUp + boxDown
}

/**
 * The line typed, set in rows 0-38 with its foot below its highest reach, scrolled sideways so
 * the cursor (before token `cursor`) is on screen: where the cursor is in cursorX, cursorTop.
 */
export function setLine(at: u16, length: u16, cursor: u16): void {
  buf = at
  bufLength = length
  measureSeq(0, length)
  const foot = 2 + (boxUp > 7 ? boxUp : 7)
  cursorIndex = cursor
  slide = 0
  ink = false
  drawSeq(0, length, 1, foot)
  if (cursorX > 124) slide = cursorX - 124
  ink = true
  drawSeq(0, length, 1, foot)
  if (cursorX >= slide) cursorX -= slide
}

/** An answer's tokens set right on the answer rows, their lowest dot on row 62. */
export function setAnswer(at: u16, length: u16): void {
  buf = at
  bufLength = length
  const w = measureSeq(0, length)
  const foot = 62 - boxDown
  cursorIndex = 0xffff
  slide = 0
  ink = true
  drawSeq(0, length, 128 - w, foot)
}
