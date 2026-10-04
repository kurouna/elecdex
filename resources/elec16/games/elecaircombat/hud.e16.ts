// ELECAIRCOMBAT's HUD and panel (docs/elec16-elecaircombat.md section 3): the gun cross, the
// pitch ladder laid along the horizon however it leans, the heading tape, speed and height,
// the target's box (or an arrow to it), the seeker's circle and the lock, the warnings, and on
// the panel the radar, the damage, the score, the time and the target's strength.
import {
  type bool,
  div,
  i16,
  idiv,
  peek,
  str,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import { aim, colour, cos, FLIP_H, FLIP_V, S8, S16, S32, sin, spr } from '../lib/kit.e16'
import {
  inSeeker,
  LOCK_FRAMES,
  locked,
  lockT,
  MISSILES,
  missileAt,
  missileX,
  missileY,
  warned,
} from './arms.e16'
import { FONT_TILE, HUD8_TILE, HUD16_TILE, SEEKER_TILE } from './assets.e16'
import {
  ace,
  aceName,
  eAlive,
  eBX,
  eBY,
  eBZ,
  eDist,
  eHP,
  eHPMax,
  eOn,
  eSize,
  eSX,
  eSY,
} from './bandit.e16'
import { headingDegrees, pAlt, pSpeed, throttle } from './flight.e16'
import { abs16, muldiv, mulq, V_PF, V_T0, vget, vset } from './math.e16'
import {
  abovePanel,
  bodyX,
  bodyZ,
  CX,
  CY,
  cellXY,
  hL,
  hNX,
  hNY,
  SL_AMBER,
  SL_FRAME,
  SL_HUD,
  SL_HUD_RED,
  SL_HUD_TEXT,
  SL_RED,
  SL_SCREEN,
  say,
  sayChar,
  sayNumber,
  shakeX,
  shakeY,
  toBody,
  unsay,
} from './sky.e16'

const GREEN = (SL_HUD - 8) << 10
const RED = (SL_HUD_RED - 8) << 10
/** The HUD's glass: marks outside it are not drawn. */
const BOX_L: i16 = 52
const BOX_R: i16 = 268
const BOX_T: i16 = 18
const BOX_B: i16 = 200

/** A HUD mark (8x8) if it is on the glass. */
function mark(x: i16, y: i16, word: u16): void {
  if (x < BOX_L || x > BOX_R || y < BOX_T || y > BOX_B) return
  spr(x - 4 + shakeX, y - 4 + shakeY, word, S8)
}

/* ---------------- the words that stay ---------------- */

/** The panel's and the HUD's labels, and every number shown afresh. */
export function hudLabels(): void {
  say(7, 12, str('SPD'), SL_HUD_TEXT)
  say(30, 12, str('ALT'), SL_HUD_TEXT)
  say(3, 28, str('RDR'), SL_AMBER)
  say(28, 28, str('DMG'), SL_AMBER)
  say(15, 29, str('SCORE'), SL_AMBER)
  say(15, 31, str('TIME'), SL_AMBER)
  say(15, 32, str('TGT'), SL_AMBER)
  say(15, 33, aceName(ace), SL_AMBER)
  say(28, 34, str('M'), SL_AMBER)
  say(33, 34, str('F'), SL_AMBER)
  say(35, 28, str('%'), SL_AMBER)
  let k: u16 = 0
  while (k < 12) {
    shown[k] = 0xffff
    k++
  }
}

let numTick: u16 = 0

/** What each number on BG1 shows now, so it is written only when it changes. */
const shown = words(12)

/** Number `k` of the shown ones at `cell`, `form` its digits and slot (digits | slot << 8). */
function showNumber(k: u16, v: u16, cell: u16, form: u16): void {
  if (shown[k] === v) return
  shown[k] = v
  sayNumber(cell, v, form & 255, form >> 8)
}

/** The numbers: speed, height, heading, damage, missiles, flares, score, time, the target. */
export function hudNumbers(damage: u16, missiles: u16, flares: u16, seconds: u16): void {
  // Speed and height every fourth frame: they change by little, and each digit costs.
  numTick++
  if ((numTick & 3) === 0) {
    showNumber(0, u16(pSpeed) * 2 - (u16(pSpeed) >> 2), cellXY(6, 13), 4 | (SL_HUD_TEXT << 8))
    showNumber(1, pAlt < 0 ? 0 : u16(pAlt) * 2, cellXY(29, 13), 5 | (SL_HUD_TEXT << 8))
  }
  headingSay()
  showNumber(3, damage, cellXY(32, 28), 3 | (SL_AMBER << 8))
  showNumber(4, missiles, cellXY(29, 34), 2 | (SL_AMBER << 8))
  showNumber(5, flares, cellXY(34, 34), 2 | (SL_AMBER << 8))
  showNumber(6, seconds, cellXY(20, 31), 3 | (SL_AMBER << 8))
  targetBar()
  throttleSay()
  damageColour(damage)
}

/** The heading as three digits, zeros shown (a compass reads 045, not 45). */
function headingSay(): void {
  if (shown[2] === heading) return
  shown[2] = heading
  sayChar(19, 3, 48 + div(heading, 100), SL_HUD_TEXT)
  sayChar(20, 3, 48 + (div(heading, 10) % 10), SL_HUD_TEXT)
  sayChar(21, 3, 48 + (heading % 10), SL_HUD_TEXT)
}

/** The target's strength as a bar of eight on the centre display. */
function targetBar(): void {
  const n = eHPMax > 0 ? u16(div(u16(eHP) * 8 + u16(eHPMax) - 1, u16(eHPMax))) : 0
  if (shown[7] === n) return
  shown[7] = n
  let k: u16 = 0
  while (k < 8) {
    sayChar(19 + k, 32, k < n ? 35 : 45, k < n && n <= 2 ? SL_RED : SL_AMBER)
    k++
  }
}

/** The score, eight digits (kept in tens: a last 0), its leading zeros blank. */
export function hudScore(hi: u16, lo: u16): void {
  if (shown[8] === lo && shown[9] === hi) return
  shown[8] = lo
  shown[9] = hi
  if (hi > 0) {
    sayNumber(cellXY(15, 30), hi, 4, SL_AMBER)
    zeros(19, 30, lo)
  } else {
    sayChar(15, 30, 32, SL_AMBER)
    sayChar(16, 30, 32, SL_AMBER)
    sayChar(17, 30, 32, SL_AMBER)
    sayChar(18, 30, 32, SL_AMBER)
    sayNumber(cellXY(19, 30), lo, 4, SL_AMBER)
  }
  sayChar(23, 30, 48, SL_AMBER)
}

/** Under a high word, the low word with its zeros shown. */
function zeros(x: u16, y: u16, lo: u16): void {
  sayChar(x, y, 48 + div(lo, 1000), SL_AMBER)
  sayChar(x + 1, y, 48 + (div(lo, 100) % 10), SL_AMBER)
  sayChar(x + 2, y, 48 + (div(lo, 10) % 10), SL_AMBER)
  sayChar(x + 3, y, 48 + (lo % 10), SL_AMBER)
}

function throttleSay(): void {
  if (shown[10] === throttle) return
  shown[10] = throttle
  if (throttle === 1) say(7, 14, str('AB '), SL_RED)
  else if (throttle === 2) say(7, 14, str('BRK'), SL_HUD_TEXT)
  else unsay(7, 14, 3)
}

/** Our fighter on the right display: green, then yellow, then red as damage mounts. */
function damageColour(damage: u16): void {
  const k = damage < 35 ? 0 : damage < 70 ? 1 : 2
  if (shown[11] === k) return
  shown[11] = k
  colour(SL_SCREEN, 15, k === 0 ? 0x3308 : k === 1 ? 0x1b7f : 0x18df)
}

/* ---------------- the lamps ---------------- */

/** The panel's lamps: MSL (an enemy missile), ALT (too low), LCK (locked). */
export function lamps(frame: u16, low: bool): void {
  const blink = (frame & 8) !== 0
  colour(SL_FRAME, 13, warned && blink ? 0x18df : 0x0848)
  colour(SL_FRAME, 14, low && blink ? 0x1adf : 0x08c8)
  colour(SL_FRAME, 15, locked ? 0x3bc8 : 0x0cc2)
}

/* ---------------- the HUD's marks ---------------- */

/** Every HUD sprite of a frame. */
export function hudDraw(frame: u16, low: bool): void {
  heading = headingDegrees()
  spr(CX - 8 + shakeX, CY - 8 + shakeY, HUD16_TILE | GREEN, S16)
  warnings(frame, low)
  lockDraw(frame)
  targetDraw()
  headingTape()
  ladder()
  radar()
}

/** The heading tape: a tick every five degrees, ten points apart, the caret in the middle. */
/** The heading this frame, read once. */
let heading: u16 = 0

function headingTape(): void {
  const h = heading
  const off = i16(h % 5) * 2
  let k: i16 = -4
  while (k <= 4) {
    mark(i16(CX) + k * 10 - off, 30, (HUD8_TILE + 17) | GREEN)
    k++
  }
  mark(i16(CX), 38, (HUD8_TILE + 18) | GREEN)
}

/** The sines of 0 to 90 degrees by tens, Q14. */
const rungSin = words(10)

export function hudInit(): void {
  rungSin[0] = 0
  rungSin[1] = 2845
  rungSin[2] = 5604
  rungSin[3] = 8192
  rungSin[4] = 10531
  rungSin[5] = 12551
  rungSin[6] = 14189
  rungSin[7] = 15396
  rungSin[8] = 16135
  rungSin[9] = 16384
  stepMinor[0] = 0
  stepMinor[1] = 1
  stepMinor[2] = 2
  stepMinor[3] = 2
  stepMinor[4] = 3
  stepMinor[5] = 4
  stepMinor[6] = 5
  stepMinor[7] = 7
  stepMinor[8] = 8
}

/** The ladder's step along a rung (8 points on its longer axis), and its segment's tile. */
let stepX: i16 = 8
let stepY: i16 = 0
let segWord: u16 = 0

/** The pitch ladder: a rung every ten degrees where it lies, the horizon's rung long. */
function ladder(): void {
  if (hL < 1024) return
  const tx = -hNY
  const ty = hNX
  ladderStep(tx, ty)
  const k = muldiv(192, 16384, u16(hL))
  const fz = vget(V_PF + 2)
  // Only the rungs near the nose's pitch are on the glass: the nearest, one either side.
  let near: i16 = -9
  while (near < 9 && fz > (rungSinOf(near) + rungSinOf(near + 1)) >> 1) near++
  let e: i16 = near < -8 ? -9 : near - 1
  const last: i16 = near > 8 ? 9 : near + 1
  while (e <= last) {
    let d = fz - rungSinOf(e)
    if (d > 16000) d = 16000
    if (d < -16000) d = -16000
    const c = mulq(d, i16(k))
    if (abs16(c) < 100) rung(e, c)
    e++
  }
}

function rungSinOf(e: i16): i16 {
  return e < 0 ? -i16(rungSin[u16(-e)]) : i16(rungSin[u16(e)])
}

/** The minor axis's step for each of the segments' angles from the major (8 points). */
const stepMinor = words(9)

function ladderStep(tx: i16, ty: i16): void {
  const a = (256 - aim(tx, ty)) & 127
  const k = (a + 2) >> 2
  segWord = (k <= 16 ? HUD8_TILE + k : (HUD8_TILE + 32 - k) | FLIP_H) | GREEN
  // The step follows the segment's own angle, so the pieces of a rung join.
  const sx: i16 = tx < 0 ? -1 : 1
  const sy: i16 = ty < 0 ? -1 : 1
  if (k <= 8 || k >= 24) {
    stepX = sx * 8
    stepY = sy * i16(stepMinor[k <= 8 ? k : 32 - k])
  } else {
    stepY = sy * 8
    stepX = sx * i16(stepMinor[k <= 16 ? 16 - k : k - 16])
  }
}

/** Rung `e` (tens of degrees) whose line is `c` points from the boresight along the normal. */
function rung(e: i16, c: i16): void {
  const x0 = i16(CX) - ((hNX * c) >> 8)
  const y0 = i16(CY) - ((hNY * c) >> 8)
  const last: i16 = e === 0 ? 8 : 4
  let j: i16 = 2
  while (j <= last) {
    if (e >= 0 || (j & 1) === 0) {
      mark(x0 + stepX * j, y0 + stepY * j, segWord)
      mark(x0 - stepX * j, y0 - stepY * j, segWord)
    }
    j++
  }
  if (e === 0) return
  // Its degrees at the right-hand end, upright.
  const n = u16(abs16(e))
  const lx = x0 + stepX * 6
  const ly = y0 + stepY * 6
  mark(lx, ly, (FONT_TILE + 16 + n) | GREEN)
  mark(lx + 8, ly, (FONT_TILE + 16) | GREEN)
}

/** The box round the enemy (red when locked), with its name; or an arrow toward it. */
function targetDraw(): void {
  if (!eAlive) return
  if (!eOn) {
    arrowDraw()
    return
  }
  let half = i16(eSize >> 1) + 4
  if (half < 10) half = 10
  if (half > 36) half = 36
  if (!abovePanel(eSY, half + 10)) return
  const pal = locked ? RED : GREEN
  const corner = HUD8_TILE + 19
  const x = eSX
  const y = eSY
  spr(x - half, y - half, corner | pal, S8)
  spr(x + half - 8, y - half, corner | pal | FLIP_H, S8)
  spr(x - half, y + half - 8, corner | pal | FLIP_V, S8)
  spr(x + half - 8, y + half - 8, corner | pal | FLIP_H | FLIP_V, S8)
  if (eDist > 2000) return
  nameDraw(x - half, y + half + 2, pal)
}

/** The ace's callsign in small sprites under the box. */
function nameDraw(x: i16, y: i16, pal: u16): void {
  const s = aceName(ace)
  let k: u16 = 0
  let c = peek(s)
  while (c !== 0) {
    spr(x + i16(k) * 8, y, (FONT_TILE + c - 32) | pal, S8)
    k++
    c = peek(s + k)
  }
}

/** An arrow at the edge of the HUD pointing the way to turn toward the enemy. */
function arrowDraw(): void {
  let x = eBX
  let y = -eBY
  while (abs16(x) >= 200 || abs16(y) >= 200) {
    x = x >> 1
    y = y >> 1
  }
  if (x === 0 && y === 0) y = 1
  const a = aim(x, y)
  const px = i16(CX) + ((cos(a) * 70) >> 8)
  const py = i16(CY) + ((sin(a) * 70) >> 8)
  const d = ((a + 8) >> 4) & 15
  let t = d
  let flips: u16 = 0
  if (d > 12) {
    t = 16 - d
    flips = FLIP_V
  } else if (d > 8) {
    t = d - 8
    flips = FLIP_H | FLIP_V
  } else if (d > 4) {
    t = 8 - d
    flips = FLIP_H
  }
  spr(px - 8 + shakeX, py - 8 + shakeY, (HUD16_TILE + 12 + t * 4) | flips | RED, S16)
}

/** The seeker's circle while the enemy is within its reach; the diamond closing; the lock. */
function lockDraw(frame: u16): void {
  if (!eAlive || !inSeeker()) return
  const q = SEEKER_TILE | GREEN
  spr(CX - 32 + shakeX, CY - 32 + shakeY, q, S32)
  spr(CX + shakeX, CY - 32 + shakeY, q | FLIP_H, S32)
  spr(CX - 32 + shakeX, CY + shakeY, q | FLIP_V, S32)
  spr(CX + shakeX, CY + shakeY, q | FLIP_H | FLIP_V, S32)
  if (locked) {
    const f = (frame >> 2) & 1
    spr(eSX - 8, eSY - 8, (HUD16_TILE + 4 + f * 4) | RED, S16)
    return
  }
  const t = i16(lockT)
  const x = i16(CX) + idiv((eSX - i16(CX)) * t, i16(LOCK_FRAMES))
  const y = i16(CY) + idiv((eSY - i16(CY)) * t, i16(LOCK_FRAMES))
  spr(x - 8, y - 8, (HUD16_TILE + 4) | GREEN, S16)
}

/** MISSILE when one is after the player, PULL UP when too low: red words that blink. */
function warnings(frame: u16, low: bool): void {
  if ((frame & 8) === 0) return
  if (warned) words8(132, 170, str('MISSILE'))
  if (low) words8(132, 182, str('PULL UP'))
}

function words8(x: i16, y: i16, s: u16): void {
  let k: u16 = 0
  let c = peek(s)
  while (c !== 0) {
    if (c !== 32) spr(x + i16(k) * 8 + shakeX, y + shakeY, (FONT_TILE + c - 32) | RED, S8)
    k++
    c = peek(s + k)
  }
}

/** The radar on the left display: the enemy and its missiles from above, 8,000 units round. */
function radar(): void {
  if (eAlive) blip(eBX, eBZ, HUD8_TILE + 20, RED)
  let k: u16 = 0
  while (k < MISSILES) {
    if (missileAt(k) === 2) {
      vset(V_T0, missileX(k), missileY(k), 0)
      toBody(V_T0)
      blip(bodyX, bodyZ, HUD8_TILE + 21, RED)
    }
    k++
  }
}

function blip(bx: i16, bz: i16, tile: u16, pal: u16): void {
  const x = 60 + idiv(bx, 166)
  const y = 273 - idiv(bz, 166)
  if (x < 26 || x > 92 || y < 226 || y > 278) return
  spr(x - 4, y - 4, tile | pal, S8)
}
