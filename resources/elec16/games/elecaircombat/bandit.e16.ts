// ELECAIRCOMBAT's enemy (docs/elec16-elecaircombat.md section 5): one ace's ARCWING as three
// axes and a speed, flown by the rates the AI asks for (ai.e16.ts, in bank 1), and drawn: the
// frame picked by its size on the screen, the side it shows the player and the turn of its
// wings, loaded into its tiles from the cartridge when it changes.
import {
  type bool,
  div,
  i16,
  peek16,
  poke16,
  str,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import {
  aim,
  bank,
  FLIP_H,
  FLIP_V,
  IO_BANK,
  load,
  rand,
  randBelow,
  S8,
  S16,
  S32,
  spr,
} from '../lib/kit.e16'
import {
  BANDIT8_AT,
  BANDIT8_BANK,
  BANDIT12_AT,
  BANDIT12_BANK,
  BANDIT16_AT,
  BANDIT16_BANK,
  BANDIT24_AT,
  BANDIT24_BANK,
  BANDIT32_AT,
  BANDIT32_BANK,
  BANDIT48_AT,
  BANDIT48_BANK,
  BANDIT64_AT,
  BANDIT64_BANK,
  BANDIT64_TILE,
  BITS_TILE,
  VIEW_TABLE_AT,
  VIEW_TABLE_BANK,
} from './assets.e16'
import {
  abs16,
  approach,
  dotq,
  mulq,
  ONE,
  orthonormal,
  pitchBy,
  rollBy,
  V_EF,
  V_ER,
  V_EU,
  V_PR,
  V_PU,
  V_REL,
  va,
  vget,
  vmax,
  vset,
} from './math.e16'
import {
  abovePanel,
  bodyX,
  bodyY,
  bodyZ,
  SL_ENEMY,
  SL_FIRE,
  SL_FLASH,
  scrX,
  scrY,
  see,
  toBody,
} from './sky.e16'

/* ---------------- the aces ---------------- */

export const ACES = 5
/** Each ace's toughness, speeds (sixteenths), roll and pull (Q14 radians a frame). */
const aceHP = words(5)
const aceCruise = words(5)
const aceRoll = words(5)
const acePull = words(5)

export function acesInit(): void {
  aceHP[0] = 90
  aceHP[1] = 100
  aceHP[2] = 120
  aceHP[3] = 140
  aceHP[4] = 200
  aceCruise[0] = 300
  aceCruise[1] = 320
  aceCruise[2] = 336
  aceCruise[3] = 352
  aceCruise[4] = 372
  aceRoll[0] = 640
  aceRoll[1] = 760
  aceRoll[2] = 860
  aceRoll[3] = 940
  aceRoll[4] = 1040
  acePull[0] = 300
  acePull[1] = 340
  acePull[2] = 380
  acePull[3] = 420
  acePull[4] = 470
}

/** An ace's callsign. */
export function aceName(k: u16): u16 {
  if (k === 0) return str('GANNET')
  if (k === 1) return str('MISTRAL')
  if (k === 2) return str('CINDER')
  if (k === 3) return str('ORACLE')
  return str('NOCTURNE')
}

/* ---------------- the enemy's state ---------------- */

export let ace: u16 = 0
export let eHP: i16 = 60
export let eHPMax: i16 = 60
export let eSpeed: i16 = 300
export let eCruise: i16 = 300
export let eRollMax: i16 = 640
export let ePullMax: i16 = 300
/** 1 flying, 0 gone (shot down). */
export let eAlive: bool = true
/** Frames it shows white after a hit, and its gun's flash shows. */
export let eFlash: u16 = 0
export let eMuzzle: u16 = 0
let eRollRate: i16 = 0
let eSquare: u16 = 1
let ePitchRate: i16 = 0
/** What the AI asks for this frame. */
export let eWantRoll: i16 = 0
export let eWantPitch: i16 = 0
export let eWantSpeed: i16 = 300

/** Ace `k` ahead of the player at `dist`, heading the same way, a little higher. */
export function banditNew(k: u16, dist: i16): void {
  ace = k
  eHPMax = i16(aceHP[k])
  eHP = eHPMax
  eCruise = i16(aceCruise[k])
  eSpeed = eCruise
  eWantSpeed = eCruise
  eRollMax = i16(aceRoll[k])
  ePullMax = i16(acePull[k])
  eAlive = true
  eFlash = 0
  eMuzzle = 0
  eRollRate = 0
  ePitchRate = 0
  eWantRoll = 0
  eWantPitch = 0
  // Head on: coming the other way, a little aside and above - the merge opens the fight.
  vset(V_EF, 0, -ONE, 0)
  vset(V_ER, -ONE, 0, 0)
  vset(V_EU, 0, 0, ONE)
  vset(V_REL, 260, dist, 180)
  frameShown = 0xffff
}

export function aiWants(roll: i16, pitch: i16, speed: i16): void {
  eWantRoll = roll
  eWantPitch = pitch
  eWantSpeed = speed
}

/** A frame of the enemy's flying: its rates toward what the AI wants, within the ace's limits. */
export function banditStep(): void {
  if (eFlash > 0) eFlash--
  if (eMuzzle > 0) eMuzzle--
  if (!eAlive) return
  const wr = eWantRoll > eRollMax ? eRollMax : eWantRoll < -eRollMax ? -eRollMax : eWantRoll
  const wp = eWantPitch > ePullMax ? ePullMax : eWantPitch < -ePullMax ? -ePullMax : eWantPitch
  eRollRate = approach(eRollRate, wr, 140)
  ePitchRate = approach(ePitchRate, wp, 50)
  if (eRollRate !== 0) rollBy(V_ER, V_EU, eRollRate)
  if (ePitchRate !== 0) pitchBy(V_EF, V_EU, ePitchRate)
  // Squared up on the frames the player's axes are not (flight.e16.ts).
  eSquare = eSquare ^ 1
  if (eSquare === 0) orthonormal(V_EF, V_ER, V_EU)
  eSpeed = approach(eSpeed, eWantSpeed - (vget(V_EF + 2) >> 7), 3)
}

/** The enemy's velocity part `k`, sixteenths of a unit a frame (its wreck keeps it). */
export function eVel(k: u16): i16 {
  return mulq(vget(V_EF + k), eSpeed)
}

/** Its gun fired: the flash on its nose for a few frames. */
export function banditFired(): void {
  eMuzzle = 3
}

/** Damage: answers whether it was the last. */
export function banditHit(n: i16): bool {
  if (!eAlive) return false
  eHP = eHP - n
  eFlash = 3
  if (eHP > 0) return false
  eHP = 0
  eAlive = false
  return true
}

/* ---------------- seen from the cockpit ---------------- */

/** Where it is: in the player's axes, on the screen, how far ahead and how large. */
export let eBX: i16 = 0
export let eBY: i16 = 0
export let eBZ: i16 = 0
export let eSX: i16 = 0
export let eSY: i16 = 0
export let eOn: bool = false
/** Its length on the screen, points. */
export let eSize: u16 = 0
/** Its distance (rough), units. */
export let eDist: u16 = 0

export function banditView(): void {
  toBody(V_REL)
  eBX = bodyX()
  eBY = bodyY()
  eBZ = bodyZ()
  eOn = see(V_REL)
  eSX = scrX()
  eSY = scrY()
  eDist = vlenRel()
  eSize = eBZ > 0 ? (eBZ < 260 ? 62 : div(16000, u16(eBZ))) : 0
}

function vlenRel(): u16 {
  const x = abs16(vget(V_REL))
  const y = abs16(vget(V_REL + 1))
  const z = abs16(vget(V_REL + 2))
  let m = x > y ? x : y
  if (z > m) m = z
  return u16(m) + u16((x + y + z - m) >> 2) + u16((x + y + z - m) >> 4)
}

/** The views' directions (64ths) and the nearest of the first nine, from views.txt. */
const viewDir = words(51)
const viewNear = words(17)

export function viewsInit(): void {
  const old = bank(VIEW_TABLE_BANK)
  let k: u16 = 0
  while (k < 51) {
    viewDir[k] = peek16(VIEW_TABLE_AT + k * 2)
    k++
  }
  k = 0
  while (k < 17) {
    viewNear[k] = peek16(VIEW_TABLE_AT + 102 + k * 2)
    k++
  }
  poke16(IO_BANK, old)
}

let frameShown: u16 = 0xffff

/** The size class for a length on the screen: 0 the largest. */
function sizeClass(px: u16): u16 {
  if (px >= 54) return 0
  if (px >= 38) return 1
  if (px >= 26) return 2
  if (px >= 18) return 3
  if (px >= 13) return 4
  if (px >= 9) return 5
  return 6
}

/** The camera's direction from the enemy, in its own axes: which view, which side. */
let viewMirror: bool = false

function viewOf(big: bool): u16 {
  let cx = -dotq(va(V_REL), va(V_ER))
  let cy = -dotq(va(V_REL), va(V_EU))
  let cz = -dotq(va(V_REL), va(V_EF))
  viewMirror = cx < 0
  if (viewMirror) cx = -cx
  while (vmax(cx, cy, cz) >= 128) {
    cx = cx >> 1
    cy = cy >> 1
    cz = cz >> 1
  }
  let best: u16 = 0
  let most: i16 = -32000
  let k: u16 = 0
  while (k < 17) {
    const d = cx * i16(viewDir[k * 3]) + cy * i16(viewDir[k * 3 + 1]) + cz * i16(viewDir[k * 3 + 2])
    if (d > most) {
      most = d
      best = k
    }
    k++
  }
  return big ? viewNear[best] : best
}

/** The turn (0-7) and flips the frame is drawn with, from the reference's angle on the screen. */
let frameFlips: u16 = 0

function turnOf(view: u16): u16 {
  const ref = view === 7 || view === 8 ? V_EF : V_EU
  const rx = dotq(va(ref), va(V_PR))
  const ry = -dotq(va(ref), va(V_PU))
  const gamma = (aim(rx >> 6, ry >> 6) - 192) & 255
  let g = ((gamma + 8) >> 4) & 15
  frameFlips = 0
  if (viewMirror) {
    g = (16 - g) & 15
    frameFlips = FLIP_H
  }
  if (g >= 8) {
    g = g - 8
    frameFlips = frameFlips ^ (FLIP_H | FLIP_V)
  }
  return g
}

/** Frame `k` of size class `c` loaded into the enemy's tiles. */
function frameLoad(c: u16, k: u16): void {
  const key = (c << 12) | k
  if (key === frameShown) return
  frameShown = key
  const t = tilesOf(c)
  const base = sheetAt(c)
  const off = ((base - 0xc000) >> 5) + k * t
  load(sheetBank(c) + (off >> 8), 0xc000 + ((off & 255) << 5), BANDIT64_TILE * 32, t * 32)
}

function tilesOf(c: u16): u16 {
  if (c === 0) return 64
  if (c === 1) return 36
  if (c <= 3) return 16
  if (c <= 5) return 4
  return 1
}

function sheetBank(c: u16): u16 {
  if (c === 0) return BANDIT64_BANK
  if (c === 1) return BANDIT48_BANK
  if (c === 2) return BANDIT32_BANK
  if (c === 3) return BANDIT24_BANK
  if (c === 4) return BANDIT16_BANK
  if (c === 5) return BANDIT12_BANK
  return BANDIT8_BANK
}

function sheetAt(c: u16): u16 {
  if (c === 0) return BANDIT64_AT
  if (c === 1) return BANDIT48_AT
  if (c === 2) return BANDIT32_AT
  if (c === 3) return BANDIT24_AT
  if (c === 4) return BANDIT16_AT
  if (c === 5) return BANDIT12_AT
  return BANDIT8_AT
}

let viewTick: u16 = 0
let classWas: u16 = 0xffff
let frameNow: u16 = 0
let flipsNow: u16 = 0
let viewNow: u16 = 0
let viewMirrorNow: bool = false

/** The size class shown, for the box round it. */
export let eClass: u16 = 6

/** The enemy drawn (white for a few frames after a hit). Call after `banditView`. */
export function banditDraw(): void {
  if (!eAlive || !eOn) return
  eClass = sizeClass(eSize)
  if (!abovePanel(eSY, eClass === 0 ? 32 : eClass === 1 ? 24 : 16)) return
  // Which frame: the side it shows every fourth frame, the turn of its wings every other (at
  // fifteen and thirty a second they are smooth enough; its place moves every frame), or both
  // at once when the size changes.
  viewTick = (viewTick + 1) & 3
  if (viewTick === 0 || eClass !== classWas) {
    viewNow = viewOf(eClass <= 1)
    viewMirrorNow = viewMirror
  }
  if ((viewTick & 1) === 0 || eClass !== classWas) {
    viewMirror = viewMirrorNow
    frameNow = viewNow * 8 + turnOf(viewNow)
    flipsNow = frameFlips
    classWas = eClass
  }
  frameLoad(eClass, frameNow)
  sparks()
  const pal = (eFlash > 0 ? SL_FLASH - 8 : SL_ENEMY - 8) << 10
  drawFrame(eSX, eSY, BANDIT64_TILE | pal | flipsNow, eClass)
}

/**
 * In front of the fighter: its gun's flash while it fires, and the sparks of the player's
 * rounds striking it while it shows the hit - drawn where it is, with nothing more to project.
 */
function sparks(): void {
  const fire = (SL_FIRE - 8) << 10
  if (eMuzzle > 0) spr(eSX - 4, eSY - 4, (BITS_TILE + 4 + (eMuzzle & 1)) | fire, S8)
  if (eFlash === 0) return
  const r = (eSize >> 1) + 2
  let n: u16 = 0
  while (n < 2) {
    const x = eSX + i16(randBelow(r * 2)) - i16(r)
    const y = eSY + i16(randBelow(r)) - i16(r >> 1)
    spr(x - 4, y - 4, (BITS_TILE + 4 + (rand() & 1)) | fire, S8)
    n++
  }
}

/**
 * A frame centred at (x, y): 2 x 2 sprites of 32, 3 x 3 of 16, or one; the cells moved to
 * their mirrored places when flipped.
 */
export function drawFrame(x: i16, y: i16, word: u16, c: u16): void {
  if (c === 0) cells(x - 32, y - 32, word, 2)
  else if (c === 1) cells(x - 24, y - 24, word, 3)
  else if (c <= 3) spr(x - 16, y - 16, word, S32)
  else if (c <= 5) spr(x - 8, y - 8, word, S16)
  else spr(x - 4, y - 4, word, S8)
}

function cells(x0: i16, y0: i16, word: u16, n: u16): void {
  const size: i16 = n === 2 ? 32 : 16
  const step: u16 = n === 2 ? 16 : 4
  const sz: u16 = n === 2 ? S32 : S16
  const fh = (word & FLIP_H) !== 0
  const fv = (word & FLIP_V) !== 0
  let w = word
  let cy: u16 = 0
  while (cy < n) {
    const py = fv ? n - 1 - cy : cy
    let cx: u16 = 0
    while (cx < n) {
      const px = fh ? n - 1 - cx : cx
      spr(x0 + i16(px) * size, y0 + i16(py) * size, w, sz)
      w = w + step
      cx++
    }
    cy++
  }
}

/** The fighter shown large at (x, y) from view `view`, level, mirrored when `mirror`: the briefing's turntable. */
export function banditShow(x: i16, y: i16, view: u16, mirror: bool): void {
  frameLoad(0, view * 8)
  drawFrame(x, y, BANDIT64_TILE | ((SL_ENEMY - 8) << 10) | (mirror ? FLIP_H : 0), 0)
}
