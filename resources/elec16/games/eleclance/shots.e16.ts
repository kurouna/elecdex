// ELECLANCE's bullets (docs/elec16-eleclance.md sections 3 and 4): the enemies' - aimed, fans,
// rings, spirals - which graze the ship for points and VOLT or hit it, and turn into stars
// when cancelled; and the ship's own shots, straight and leaning out.
import { type bool, div, i16, u16, words, wrap16 } from '../../../../src/shared/e16c/builtins'
import { aim, cos, FLIP_H, S8, S16, sin, spr } from '../lib/kit.e16'
import { BULLETS_TILE, ORBS_TILE, SHOT_TILE } from './assets.e16'
import { abs, FX_SPARK, fx, IT_STAR, item } from './fx.e16'
import { FIELD_X, SL_BULLET, SL_SHOT, shakeDX, shakeDY } from './view.e16'

/** Bullet kinds: small rounds in three colours, a pink needle, orbs in two colours. */
export const BK_PINK = 0
export const BK_BLUE = 1
export const BK_AMBER = 2
export const BK_NEEDLE = 3
export const BK_ORB = 4
export const BK_ORB_BLUE = 5

const B_N = 72
const buKind = words(72)
const buX = words(72)
const buY = words(72)
const buVX = words(72)
const buVY = words(72)
/** 1 + the bullet's direction (for a needle's picture), 0 while the slot is free. */
const buLive = words(72)
const buGrazed = words(72)
let buNext: u16 = 0
export let bulletCount: u16 = 0
/** How fast bullets go, in sixteenths: raised by rank, OVERDRIVE and the second round. */
export let bulletBoost: u16 = 0

export function boost(n: u16): void {
  bulletBoost = n
}

/** A bullet's speed (sixteenths a frame) and kind, packed for `bullet`. */
export function sk(speed: u16, kind: u16): u16 {
  return (kind << 8) | (speed & 255)
}

/** A bullet from (x, y) toward direction `a` (256 a turn), `speedKind` from `sk`. */
export function bullet(x: i16, y: i16, a: u16, speedKind: u16): void {
  const speed = speedKind & 255
  const kind = speedKind >> 8
  // A free slot: from where the last one went, at most a lap.
  let tries: u16 = B_N
  while (buLive[buNext] !== 0 && tries > 0) {
    buNext = buNext + 1 === B_N ? 0 : buNext + 1
    tries--
  }
  if (tries === 0) return
  const k = buNext
  const v = i16(speed + bulletBoost)
  buKind[k] = kind
  buX[k] = u16(x)
  buY[k] = u16(y)
  buVX[k] = u16((cos(a) * v) >> 8)
  buVY[k] = u16((sin(a) * v) >> 8)
  buLive[k] = 1 + (a & 255)
  buGrazed[k] = 0
}

/** The ship's place, for aiming (set by the ship each frame). */
export let targetX: i16 = 2560
export let targetY: i16 = 3800

export function target(x: i16, y: i16): void {
  targetX = x
  targetY = y
}

/** The direction from (x, y) to the ship. */
export function aimed(x: i16, y: i16): u16 {
  return aim(targetX - x, targetY - y)
}

/** `n` bullets spread `step` apart round direction `a`. */
export function fan(x: i16, y: i16, a: u16, nStepSpeedKind: u16): void {
  // Packed so a call keeps to four values: n (4 bits), step (4), speed (6, x2), kind (2).
  const n = nStepSpeedKind >> 12
  const step = (nStepSpeedKind >> 8) & 15
  const speed = ((nStepSpeedKind >> 2) & 63) * 2
  const kind = nStepSpeedKind & 3
  let d = wrap16(a + 256 - div((n - 1) * step, 2))
  let k: u16 = 0
  while (k < n) {
    bullet(x, y, d & 255, sk(speed, kind))
    d = d + step
    k++
  }
}

/** Packs a fan's count, spacing, speed (even, to 126) and kind (0-3). */
export function fanOf(n: u16, step: u16, speed: u16, kind: u16): u16 {
  return (n << 12) | (step << 8) | ((speed >> 1) << 2) | kind
}

/** `n` bullets all round, the first at direction `a`. */
export function ring(x: i16, y: i16, a: u16, nSpeedKind: u16): void {
  const n = nSpeedKind >> 10
  const speed = ((nSpeedKind >> 3) & 127) + 0
  const kind = nSpeedKind & 7
  const step = div(256, n)
  let d = a
  let k: u16 = 0
  while (k < n) {
    bullet(x, y, d & 255, sk(speed, kind))
    d = d + step
    k++
  }
}

/** Packs a ring's count (to 63), speed (to 127) and kind (0-7). */
export function ringOf(n: u16, speed: u16, kind: u16): u16 {
  return (n << 10) | (speed << 3) | kind
}

/** Results of a frame of bullets: grazes, and whether one hit the ship. */
export let grazes: u16 = 0
export let hitShip: bool = false

/**
 * Every bullet on by a frame and drawn; checked against the ship at (sx, sy) when it can be
 * hit (`vulnerable`): within 3 points it is hit, within 12 grazed (once a bullet).
 */
export function bulletsStep(sx: i16, sy: i16, vulnerable: bool): void {
  grazes = 0
  hitShip = false
  bulletCount = 0
  let k: u16 = 0
  while (k < B_N) {
    if (buLive[k] !== 0) bulletOne(k, sx, sy, vulnerable)
    k++
  }
}

function bulletOne(k: u16, sx: i16, sy: i16, vulnerable: bool): void {
  const x = i16(buX[k]) + i16(buVX[k])
  const y = i16(buY[k]) + i16(buVY[k])
  buX[k] = u16(x)
  buY[k] = u16(y)
  if (x < (FIELD_X - 16) * 16 || x > (FIELD_X + 240) * 16 || y < -256 || y > 4864) {
    buLive[k] = 0
    return
  }
  bulletCount++
  const dx = abs(x - sx)
  const dy = abs(y - sy)
  const big = buKind[k] >= BK_ORB
  const reach: i16 = big ? 80 : 40
  if (vulnerable && dx < reach && dy < reach) hitShip = true
  else if (vulnerable && buGrazed[k] === 0 && dx < 192 && dy < 192) {
    buGrazed[k] = 1
    grazes++
    fx(FX_SPARK, (x + sx) >> 1, (y + sy) >> 1, 0)
  }
  bulletDraw(k, x, y)
}

function bulletDraw(k: u16, x16: i16, y16: i16): void {
  const kind = buKind[k]
  const x = (x16 >> 4) + shakeDX()
  const y = (y16 >> 4) + shakeDY()
  const pal = (SL_BULLET - 8) << 10
  if (kind >= BK_ORB) {
    const pulse = (buLive[k] + u16(x16 >> 6)) & 1
    spr(x - 8, y - 8, (ORBS_TILE + (kind - BK_ORB) * 8 + pulse * 4) | pal, S16)
  } else if (kind === BK_NEEDLE) spr(x - 4, y - 4, needleTile(buLive[k] - 1) | pal, S8)
  else spr(x - 4, y - 4, (BULLETS_TILE + kind * 2 + (u16(y16 >> 7) & 1)) | pal, S8)
}

/** A needle's picture for direction `a`: sixteenths of a turn from +x, flipped for the rest. */
function needleTile(a: u16): u16 {
  // A needle looks the same both ways: half a turn is all there is.
  const q = ((a + 8) >> 4) & 7
  const base = BULLETS_TILE + 6
  if (q <= 4) return base + q
  return (base + 8 - q) | FLIP_H
}

/** Every bullet into a star (a bomb, a boss's end): answers how many. */
export function cancelAll(): u16 {
  let n: u16 = 0
  let k: u16 = 0
  while (k < B_N) {
    if (buLive[k] !== 0) {
      cancelOne(k)
      n++
    }
    k++
  }
  return n
}

/** The bullets within `r` sixteenths of (x, y) into stars (OVERDRIVE's kills). */
export function cancelNear(x: i16, y: i16, r: i16): void {
  let k: u16 = 0
  while (k < B_N) {
    if (buLive[k] !== 0 && abs(i16(buX[k]) - x) < r && abs(i16(buY[k]) - y) < r) cancelOne(k)
    k++
  }
}

function cancelOne(k: u16): void {
  buLive[k] = 0
  const x = i16(buX[k])
  const y = i16(buY[k])
  fx(FX_SPARK, x, y, 0)
  item(IT_STAR, x, y)
}

export function bulletsClear(): void {
  let k: u16 = 0
  while (k < B_N) {
    buLive[k] = 0
    k++
  }
}

/* ---------------- the ship's shots ---------------- */

const S_N = 18
const sX = words(18)
const sY = words(18)
const sVX = words(18)
const sLive = words(18)

/** A shot from (x, y): `lean` -1 left, 0 straight, 1 right. */
export function shot(x: i16, y: i16, lean: i16): void {
  let k: u16 = 0
  while (k < S_N && sLive[k] !== 0) k++
  if (k === S_N) return
  sX[k] = u16(x)
  sY[k] = u16(y)
  sVX[k] = u16(lean * 40)
  sLive[k] = u16(lean + 2)
}

/** The shots on by a frame: each that `hits` (the foes' check) is spent. Drawn. */
export function shotsStep(damage: u16): void {
  let k: u16 = 0
  while (k < S_N) {
    if (sLive[k] !== 0) shotOne(k, damage)
    k++
  }
}

function shotOne(k: u16, damage: u16): void {
  const x = i16(sX[k]) + i16(sVX[k])
  const y = i16(sY[k]) - 200
  sX[k] = u16(x)
  sY[k] = u16(y)
  if (y < -128) {
    sLive[k] = 0
    return
  }
  if (foeHit(x, y, damage, false)) {
    sLive[k] = 0
    fx(FX_SPARK, x, y + 64, 0)
    return
  }
  const lean = sLive[k]
  const tile = lean === 2 ? SHOT_TILE + (u16(y >> 6) & 1) : SHOT_TILE + 2
  const flip = lean === 1 ? FLIP_H : 0
  spr((x >> 4) - 4 + shakeDX(), (y >> 4) - 4 + shakeDY(), tile | ((SL_SHOT - 8) << 10) | flip, S8)
}

export function shotsClear(): void {
  let k: u16 = 0
  while (k < S_N) {
    sLive[k] = 0
    k++
  }
}

import { foeHit } from './foes.e16'
