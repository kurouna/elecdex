// ELECLANCE's powered weapons (docs/elec16-eleclance.md section 3): homing missiles, the lance's
// chain of sparks to the next foe, and the bomb's ring, which grows outward and takes bullets
// and foes as it passes them - farther with more power. In cartridge bank 3: it reaches the
// foes, the bullets and the sprites in RAM, and never moves the window itself.
import { type bool, div, i16, mulShift, u16, words } from '../../../../src/shared/e16c/builtins'
import { aim, cos, FLIP_H, FLIP_V, S8, S16, sin, spr } from '../lib/kit.e16'
import { ARC_TILE, MISSILE_TILE, RING_TILE } from './assets.e16'
import { abs, clamp, FX_SPARK, fx } from './fx.e16'
import { FIELD_X, SL_ITEM, SL_SHOT, shakeDX, shakeDY } from './view.e16'

/* ---------------- missiles ---------------- */

const M_N = 6
const mX = words(6)
const mY = words(6)
const mVX = words(6)
const mVY = words(6)
const mT = words(6)

/** Two missiles from the ship's sides, climbing before they turn. */
export function missilesFire(x: i16, y: i16): void {
  missileOne(x - 96, y, -24)
  missileOne(x + 96, y, 24)
}

function missileOne(x: i16, y: i16, vx: i16): void {
  let k: u16 = 0
  while (k < M_N && mT[k] !== 0) k++
  if (k === M_N) return
  mX[k] = u16(x)
  mY[k] = u16(y)
  mVX[k] = u16(vx)
  mVY[k] = u16(-40)
  mT[k] = 1
}

/** Every missile a frame: toward the nearest foe, hitting for `damage`; drawn. */
export function missilesStep(damage: u16): void {
  let k: u16 = 0
  while (k < M_N) {
    if (mT[k] !== 0) missileMove(k, damage)
    k++
  }
}

function missileMove(k: u16, damage: u16): void {
  const t = mT[k] + 1
  mT[k] = t
  let x = i16(mX[k])
  let y = i16(mY[k])
  // After a short climb it steers: a little each frame toward what is nearest.
  if (t > 8) steer(k, x, y)
  x = x + i16(mVX[k])
  y = y + i16(mVY[k])
  mX[k] = u16(x)
  mY[k] = u16(y)
  // Gone by the bounds the bullets keep (shots.e16.ts), or spent.
  if (t > 150 || y < -256 || y > 4864 || x < (FIELD_X - 16) * 16 || x > (FIELD_X + 240) * 16) {
    mT[k] = 0
    return
  }
  if (foeHit(x, y, damage, false)) {
    mT[k] = 0
    fx(FX_SPARK, x, y, 0)
    return
  }
  const a = aim(i16(mVX[k]), i16(mVY[k]))
  spr(
    (x >> 4) - 4 + shakeDX(),
    (y >> 4) - 4 + shakeDY(),
    pointing(MISSILE_TILE, a) | ((SL_SHOT - 8) << 10),
    S8,
  )
}

function steer(k: u16, x: i16, y: i16): void {
  const target = foeNearest(x, y, 0xffff)
  if (target === 0xffff) {
    mVY[k] = u16(clamp(i16(mVY[k]) - 4, 72))
    return
  }
  const dx = foeX(target) - x
  const dy = foeY(target) - y
  mVX[k] = u16(clamp(i16(mVX[k]) + (dx > 0 ? 8 : -8), 72))
  mVY[k] = u16(clamp(i16(mVY[k]) + (dy > 0 ? 8 : -8), 72))
}

/**
 * A picture for direction `a` from five drawn along a quarter turn (from +x to straight down):
 * flipped across for the other three quarters.
 */
export function pointing(base: u16, a: u16): u16 {
  const quarter = (a >> 6) & 3
  const within = a & 63
  const k = (within + 8) >> 4
  if (quarter === 0) return base + k
  if (quarter === 1) return (base + 4 - k) | FLIP_H
  if (quarter === 2) return (base + k) | FLIP_H | FLIP_V
  return (base + 4 - k) | FLIP_V
}

export function missilesClear(): void {
  let k: u16 = 0
  while (k < M_N) {
    mT[k] = 0
    k++
  }
}

/* ---------------- the lance's chain ---------------- */

/** Where the sparks of this frame's chain go: up to three links, from and to. */
const linkFrom = words(6)
const linkTo = words(6)
let links: u16 = 0

/**
 * From the foe the lance struck, the spark jumps to the nearest other foe within 96 points,
 * and from that one on, `count` times, each taking `damage`.
 */
export function chainFrom(first: u16, count: u16, damage: u16): void {
  links = 0
  let at = first
  let left = count
  while (left > 0 && at !== 0xffff) {
    const next = foeNearest(foeX(at), foeY(at), at)
    if (next === 0xffff || !near(at, next)) return
    linkFrom[links * 2] = u16(foeX(at))
    linkFrom[links * 2 + 1] = u16(foeY(at))
    linkTo[links * 2] = u16(foeX(next))
    linkTo[links * 2 + 1] = u16(foeY(next))
    links++
    if (damage > 0) foeHurt(next, damage)
    at = next
    left--
  }
}

function near(a: u16, b: u16): bool {
  return abs(foeX(a) - foeX(b)) < 96 * 16 && abs(foeY(a) - foeY(b)) < 96 * 16
}

/** The chain's sparks: a few along each link, flickering. */
export function chainDraw(tick: u16): void {
  let k: u16 = 0
  while (k < links) {
    linkDraw(k, tick)
    k++
  }
  links = 0
}

function linkDraw(k: u16, tick: u16): void {
  const x0 = i16(linkFrom[k * 2]) >> 4
  const y0 = i16(linkFrom[k * 2 + 1]) >> 4
  const dx = (i16(linkTo[k * 2]) >> 4) - x0
  const dy = (i16(linkTo[k * 2 + 1]) >> 4) - y0
  let s: i16 = 1
  while (s < 6) {
    const x = x0 + div(dx * s, 6) - 4
    const y = y0 + div(dy * s, 6) - 4
    spr(
      x + shakeDX(),
      y + shakeDY(),
      (ARC_TILE + ((tick + u16(s)) & 3)) | ((SL_SHOT - 8) << 10),
      S8,
    )
    s++
  }
}

/* ---------------- the bomb's ring ---------------- */

let ringX: i16 = 0
let ringY: i16 = 0
let ringMax: i16 = 0
let ringT: u16 = 0

/** A bomb at (x, y): its ring grows to `reach` points over half a second. */
export function ringStart(x: i16, y: i16, reach: u16): void {
  ringX = x
  ringY = y
  ringMax = i16(reach)
  ringT = 1
  foesBombReset()
}

/** The ring's radius now (points). */
function radius(): i16 {
  const r = i16(ringT) * 8
  return r > ringMax ? ringMax : r
}

/** A frame of the ring: what is inside it now is taken - bullets become stars, foes are hurt once. */
export function ringStep(): void {
  if (ringT === 0) return
  ringT++
  const r = radius()
  cancelWithin(ringX, ringY, r * 16)
  foesBombWithin(ringX, ringY, r * 16)
  if (ringT > 120) ringT = 0
}

/** The ring: four quarters at the start, then sparks round its edge, fading after it stops. */
export function ringDraw(): void {
  if (ringT === 0) return
  const x = (ringX >> 4) + shakeDX()
  const y = (ringY >> 4) + shakeDY()
  const pal = (SL_ITEM - 8) << 10
  if (ringT < 8) {
    const tile = (RING_TILE + (ringT >> 1) * 4) | pal
    spr(x - 16, y - 16, tile, S16)
    spr(x, y - 16, tile | FLIP_H, S16)
    spr(x - 16, y, tile | FLIP_V, S16)
    spr(x, y, tile | FLIP_H | FLIP_V, S16)
    return
  }
  // Grown, the edge flickers away.
  if (i16(ringT) * 8 > ringMax + 160 && (ringT & 1) !== 0) return
  // Half the radius times a sine (to 256), the whole product (MULQ), as it always was.
  const half = radius() >> 1
  let a: u16 = ringT * 3
  let k: u16 = 0
  while (k < 16) {
    spr(
      x + mulShift(cos(a), half, 7) - 8,
      y + mulShift(sin(a), half, 7) - 8,
      (RING_TILE + 12) | pal,
      S16,
    )
    a = a + 16
    k++
  }
}

import { foeHit, foeHurt, foeNearest, foesBombReset, foesBombWithin, foeX, foeY } from './foes.e16'
import { cancelWithin } from './shots.e16'
