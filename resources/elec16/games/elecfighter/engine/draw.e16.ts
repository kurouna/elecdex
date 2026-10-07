// ELECFIGHTER's picture (docs/elec16-elecfighter-design.md 4.2, 5.2): the camera and the HUD on
// BG1 - names, life bars, TIME, the rounds' lamps, the banners' bands and the log line - redrawn
// only where it changed. The fighters, their shadows and the effects are engine/look.e16.ts's.
import {
  type bool,
  div,
  i16,
  peek,
  str,
  u16,
  words,
  wrap16,
} from '../../../../../src/shared/e16c/builtins'
import { cellAt, colour, palCopy, palMix, vfill, vpoke } from '../../lib/kit.e16'
import { DIGITS_TILE, FONT_TILE, FONTB_TILE, HUD_TILE } from '../assets.e16'
import { logDraw } from '../scenes/pause.e16'
import { P_LIFE, prAt, slName } from './data.e16'
import { fLife, fSlot, fX } from './fighter.e16'

/** The feet's line on the screen, and the camera's reach (design 4.2). */
export const GROUND_Y = 244
const CAM_MAX = 192

/** The camera: the screen's left edge in the world, in points. */
export let camX: u16 = 0

/** The camera follows the middle of the two, sideways only, inside the world. */
export function cameraStep(): void {
  const mid = i16((fX[0] + fX[1]) >> 5)
  let c = mid - 160
  if (c < 0) c = 0
  if (c > CAM_MAX) c = CAM_MAX
  camX = u16(c)
}

/* ---------------- the HUD (BG1, in front; its row r is drawn from y 8r - 4) ---------------- */

const FRONT = 0x8000
const FLIP = 0x2000
/** BG1's palette slots: P1's side, P2's side, the dim words, TIME. */
const SL_P1 = 1
const SL_DIM = 3
const SL_TIME = 4
const BAR_ROW = 2
const BAR_CELLS = 15
const BAND_ROW = 15
const T_CLEAR = 0
const T_RULE = 1
const T_TICK = 2
const T_LAMP = 3
const T_BAND = 5
const T_BAND_TOP = 6
const T_BAND_BOTTOM = 7
const T_BAR = 8
/** The life bar's colour (5 in each side's slot), and the low life's two reds. */
const C_LIFE = 5
const RED = 0x1c3d
const RED_DIM = 0x0c14
const TRAIL_WAIT = 20

/** The trail behind each life bar (life units), and frames it has waited. */
export const trail = words(2)
const trailT = words(2)
const shownLife = words(2)
const shownTrail = words(2)
const lowShown = words(2)
let timeShown: u16 = 0xffff

/** Words at BG1's cell (x, y) in slot `sl`. */
export function say(x: u16, y: u16, s: u16, sl: u16): void {
  let at = cellAt(1, x, y)
  let c = peek(s)
  while (c !== 0) {
    vpoke(at, (FONT_TILE + c - 32) | (sl << 10) | FRONT)
    at = wrap16(at + 2)
    s++
    c = peek(s)
  }
}

function hudTile(x: u16, y: u16, t: u16, sl: u16): void {
  vpoke(cellAt(1, x, y), (HUD_TILE + t) | (sl << 10) | FRONT)
}

/** BG1 all clear. */
export function hudClear(): void {
  vfill(cellAt(1, 0, 0), HUD_TILE + T_CLEAR, 64 * 64)
}

/**
 * The HUD as a round begins: each side's heading (a ruled title like a pane's, the slot and
 * role bright, who plays it dim), TIME's word, the lamps, and the bars and time drawn anew.
 */
export function hudStatic(p2: u16, wins0: u16, wins1: u16): void {
  heading(0, 0)
  heading(22, 0)
  say(2, 1, slName[fSlot[0]], SL_P1)
  say(13, 1, str('P1'), SL_DIM)
  say(24, 1, p2, SL_P1)
  say(28, 1, slName[fSlot[1]], SL_DIM)
  say(18, 3, str('TIME'), SL_DIM)
  lamps(15, wins0, false)
  lamps(23, wins1, true)
  shownLife[0] = 0xffff
  shownLife[1] = 0xffff
  timeShown = 0xffff
  trail[0] = fLife[0]
  trail[1] = fLife[1]
  lowShown[0] = 2
  lowShown[1] = 2
}

function heading(x: u16, y: u16): void {
  hudTile(x, y + 1, T_RULE, SL_P1)
  hudTile(x + 1, y + 1, T_TICK, SL_P1)
  vpoke(cellAt(1, x + 16, y + 1), (HUD_TILE + T_TICK) | (SL_P1 << 10) | FRONT | FLIP)
  hudTile(x + 17, y + 1, T_RULE, SL_P1)
}

/** Two lamps from column `x`, `n` of them lit (from the middle outwards). */
function lamps(x: u16, n: u16, right: bool): void {
  let k: u16 = 0
  while (k < 2) {
    const lit = right ? k < n : 1 - k < n
    hudTile(x + k, 3, T_LAMP + (lit ? 1 : 0), SL_P1)
    k++
  }
}

/** The bars, their trails and TIME, each drawn only when it changed. */
export function hudStep(time: u16, frame: u16): void {
  barStep(0, frame)
  barStep(1, frame)
  if (time !== timeShown) timeShow(time)
}

function barStep(i: u16, frame: u16): void {
  const life = fLife[i]
  if (life < shownLife[i] && shownLife[i] !== 0xffff) trailT[i] = 0
  if (trail[i] > life) {
    if (trailT[i] < TRAIL_WAIT) trailT[i]++
    else trail[i]--
  } else trail[i] = life
  lowStep(i, life, frame)
  if (life === shownLife[i] && trail[i] === shownTrail[i]) return
  shownLife[i] = life
  shownTrail[i] = trail[i]
  barDraw(i)
}

/** Under a quarter of its life, a side's bar turns red and blinks every 16 frames. */
function lowStep(i: u16, life: u16, frame: u16): void {
  const max = prAt(i, P_LIFE)
  let state: u16 = 0
  if (life * 4 < max) state = (frame & 16) !== 0 ? 1 : 3
  if (state === lowShown[i]) return
  lowShown[i] = state
  const sl = SL_P1 + i
  if (state === 0) colour(sl, C_LIFE, palCopy[sl * 16 + C_LIFE])
  else colour(sl, C_LIFE, state === 1 ? RED : RED_DIM)
}

/** Points of a life bar for `v` of fighter `i`'s life: 120 for all of it. */
function barPoints(i: u16, v: u16): u16 {
  return div(v * 120, prAt(i, P_LIFE))
}

/** A side's bar: P1's from column 2 shrinking from the right, P2's to column 37 from the left. */
function barDraw(i: u16): void {
  const l = barPoints(i, fLife[i])
  const t = barPoints(i, trail[i])
  const sl = (SL_P1 + i) << 10
  let c: u16 = 0
  while (c < BAR_CELLS) {
    const lc = cellPart(l, c)
    const tc = cellPart(t, c)
    const tile = (HUD_TILE + T_BAR + lc * 9 + tc) | sl | FRONT
    if (i === 0) vpoke(cellAt(1, 2 + c, BAR_ROW), tile)
    else vpoke(cellAt(1, 37 - c, BAR_ROW), tile | FLIP)
    c++
  }
}

/** How many of cell `c`'s 8 points a bar of `p` points fills. */
function cellPart(p: u16, c: u16): u16 {
  const from = c * 8
  if (p <= from) return 0
  return p - from >= 8 ? 8 : p - from
}

/** TIME in big figures at columns 18-21, rows 1-2; its colour changes at 10 and under. */
function timeShow(t: u16): void {
  if (timeShown === 0xffff || t <= 10 !== timeShown <= 10) {
    colour(SL_TIME, 1, t <= 10 ? RED : palCopy[SL_TIME * 16 + 1])
  }
  timeShown = t
  const tens = div(t, 10)
  bigDigit(18, tens)
  bigDigit(20, t - tens * 10)
}

function bigDigit(x: u16, d: u16): void {
  const tile = (DIGITS_TILE + d * 4) | (SL_TIME << 10) | FRONT
  vpoke(cellAt(1, x, 1), tile)
  vpoke(cellAt(1, x + 1, 1), tile + 1)
  vpoke(cellAt(1, x, 2), tile + 2)
  vpoke(cellAt(1, x + 1, 2), tile + 3)
}

/* ---------------- the bands (design 5.2): a banner across the middle ---------------- */

/** The band across rows 15-17 with the words `s` in its middle. */
export function bandShow(s: u16): void {
  vfill(cellAt(1, 0, BAND_ROW), (HUD_TILE + T_BAND_TOP) | (SL_P1 << 10) | FRONT, 40)
  vfill(cellAt(1, 0, BAND_ROW + 1), (HUD_TILE + T_BAND) | (SL_P1 << 10) | FRONT, 40)
  vfill(cellAt(1, 0, BAND_ROW + 2), (HUD_TILE + T_BAND_BOTTOM) | (SL_P1 << 10) | FRONT, 40)
  let n: u16 = 0
  while (peek(s + n) !== 0) n++
  let at = cellAt(1, 20 - (n >> 1), BAND_ROW + 1)
  let k: u16 = 0
  while (k < n) {
    vpoke(at, (FONTB_TILE + peek(s + k) - 32) | (SL_P1 << 10) | FRONT)
    at = wrap16(at + 2)
    k++
  }
}

/** The band gone. */
export function bandClear(): void {
  vfill(cellAt(1, 0, BAND_ROW), HUD_TILE + T_CLEAR, 64 * 3)
}

/* ---------------- the log line (design 5.3) ---------------- */

/** What the log tells: a counter hit, an anti-air, a throw, a throw tech, a read. */
export const LOG_COUNTER = 1
export const LOG_AA = 2
export const LOG_THROW = 3
export const LOG_TECH = 4
export const LOG_READ = 5
/** The log off (1) or on (0): the controls' LOG, kept in save RAM. */
export const logOff = words(1)
/** What waits to be written this frame: kind (0 nothing), side, move. */
export const logWait = words(3)
/** Frames since the line was written (0xffff: none shown). */
export let logT: u16 = 0xffff
/** BG1's slot for the line (the HUD's colours, faded on their own) and its row: y 268-275. */
export const SL_LOG = 5
export const LOG_ROW = 34
const LOG_SHOW = 60
const LOG_FADE = 16

/** Something for the log line, written with the frame's picture (the last of a frame wins). */
export function logPost(kind: u16, side: u16, move: u16): void {
  if (logOff[0] !== 0) return
  logWait[0] = kind
  logWait[1] = side
  logWait[2] = move
}

/** The line written when there is something, faded by its palette after 60 frames, then gone. */
export function logStep(): void {
  if (logWait[0] !== 0) {
    logClear()
    palMix(SL_LOG, 0, 0)
    logDraw(logWait[0], logWait[1], logWait[2])
    logWait[0] = 0
    logT = 0
    return
  }
  if (logT === 0xffff) return
  logT++
  if (logT <= LOG_SHOW) return
  const f = logT - LOG_SHOW
  if (f < LOG_FADE) {
    palMix(SL_LOG, 0, f)
    return
  }
  logGone()
}

/** The line cleared and its colours back. */
export function logGone(): void {
  logClear()
  palMix(SL_LOG, 0, 0)
  logT = 0xffff
}

function logClear(): void {
  vfill(cellAt(1, 0, LOG_ROW), HUD_TILE + T_CLEAR, 40)
}

/** BG1's rows from `y`, `n` of them, cleared. */
export function hudRows(y: u16, n: u16): void {
  vfill(cellAt(1, 0, y), HUD_TILE + T_CLEAR, 64 * n)
}
