// ELECLANCE's great machines (docs/elec16-eleclance.md section 5): BASTION, the gun platform
// half way, with two arms to shoot away; ZENITH, the battleship at the end - two cannons, then
// its wings spread and its core opens, then the core burns. Each part takes hits apart, and
// the machine goes down in a chain of explosions.
import { type bool, div, i16, u16, words } from '../../../../src/shared/e16c/builtins'
import { FLIP_H, S32, sin, spr } from '../lib/kit.e16'
import { BASTION_TILE, ZENITH_TILE } from './assets.e16'
import { abs, burst, IT_STAR, item, itemsAll } from './fx.e16'
import { points } from './score.e16'
import {
  aimed,
  BK_AMBER,
  BK_BLUE,
  BK_NEEDLE,
  BK_ORB,
  BK_ORB_BLUE,
  BK_PINK,
  bullet,
  cancelAll,
  fan,
  fanOf,
  ring,
  ringOf,
  sk,
} from './shots.e16'
import { flashScreen, SL_FLASH, SL_HEAVY, shake, shakeDX, shakeDY, wave } from './view.e16'

export const B_NONE = 0
export const B_BASTION = 1
export const B_ZENITH = 2

export let bossOn: u16 = B_NONE
/** 0 coming in, 1-3 its phases, 9 going down, 10 gone (beaten), 11 fled. */
export let bossPhase: u16 = 0
let bX: i16 = 0
let bY: i16 = 0
let bT: u16 = 0
let spin: u16 = 0

/** Parts: 0 the core, 1 the left arm or cannon, 2 the right. */
const life = words(3)
const flash = words(3)
const PX = words(3)
const PY = words(3)
const PHALF = words(3)

/** No boss, and none beaten: a round's start. */
export function bossReset(): void {
  bossOn = B_NONE
  bossPhase = 0
}

/** BASTION from above. */
export function bastionStart(): void {
  bossBegin(B_BASTION)
  life[0] = 320
  life[1] = 110
  life[2] = 110
  partAt(0, 0, 0, 26)
  partAt(1, -48, 0, 14)
  partAt(2, 48, 0, 14)
}

/** ZENITH from above. */
export function zenithStart(): void {
  bossBegin(B_ZENITH)
  life[0] = 560
  life[1] = 180
  life[2] = 180
  partAt(0, 0, 16, 14)
  partAt(1, -48, 32, 14)
  partAt(2, 48, 32, 14)
}

function bossBegin(which: u16): void {
  bossOn = which
  bossPhase = 0
  bX = (48 + 112) * 16
  bY = -1024
  bT = 0
  flash[0] = 0
  flash[1] = 0
  flash[2] = 0
}

function partAt(k: u16, dx: i16, dy: i16, half: u16): void {
  PX[k] = u16(dx)
  PY[k] = u16(dy)
  PHALF[k] = half
}

/** Whether part `k` can be hurt now. */
function open(k: u16): bool {
  if (life[k] === 0 || bossPhase === 0 || bossPhase >= 9) return false
  // ZENITH's core is shut until both cannons are down.
  if (bossOn === B_ZENITH && k === 0) return life[1] === 0 && life[2] === 0
  return true
}

/** One frame of the boss. */
export function bossStep(): void {
  if (bossOn === B_NONE || bossPhase >= 10) return
  bT++
  if (bossPhase === 0) {
    bY = bY + 24
    if (bY >= 72 * 16) {
      bossPhase = 1
      bT = 0
    }
  } else if (bossPhase >= 9) dying()
  else if (bossOn === B_BASTION) bastionStep()
  else zenithStep()
  bossDraw()
}

function bossSway(size: i16): void {
  bX = (48 + 112) * 16 + ((sin(bT) * size) >> 8)
}

function bastionStep(): void {
  bossSway(40 * 16)
  if (bT > 3600) flee()
  if (life[1] !== 0 || life[2] !== 0) bastionArms()
  else bastionSpiral()
  if (life[0] === 0) die()
}

/** With an arm left: the arms' aimed fans in turn, a ring of orbs from the core. */
function bastionArms(): void {
  if (bT % 40 === 0) armFire(1)
  if (bT % 40 === 20) armFire(2)
  if (bT % 120 === 60) ring(bX, bY, bT & 255, ringOf(16, 28, BK_ORB))
}

/** Arms gone: the core spins out a spiral, thicker as it weakens. */
function bastionSpiral(): void {
  spin = spin + 7
  if (bT % 6 === 0) ring(bX, bY + 128, spin, ringOf(life[0] < 120 ? 6 : 4, 36, BK_PINK))
}

function armFire(k: u16): void {
  if (life[k] === 0) return
  const x = bX + i16(PX[k]) * 16
  const y = bY + 160
  fan(x, y, aimed(x, y), fanOf(3, 8, 48, BK_AMBER))
}

function zenithStep(): void {
  bossSway(56 * 16)
  if (bT > 7200) flee()
  const cannons = life[1] !== 0 || life[2] !== 0
  if (cannons) zenithCannons()
  else if (life[0] > 200) zenithSpiral()
  else zenithBurning()
  if (life[0] === 0) die()
}

/** Phase 1: the cannons' needles and fans. */
function zenithCannons(): void {
  bossPhase = 1
  let k: u16 = 1
  while (k < 3) {
    if (life[k] !== 0) {
      const x = bX + i16(PX[k]) * 16
      const y = bY + i16(PY[k]) * 16 + 256
      if ((bT + k * 25) % 50 === 0) fan(x, y, aimed(x, y), fanOf(5, 6, 52, BK_NEEDLE))
      if ((bT + k * 25) % 100 === 70) fan(x, y, 64, fanOf(9, 14, 28, BK_BLUE))
    }
    k++
  }
}

/** Phase 2: wings spread, the core open, a double spiral and slow orbs. */
function zenithSpiral(): void {
  if (bossPhase === 1) {
    bossPhase = 2
    shake(20)
    wave(60, 6)
    sfxBossPhase()
  }
  spin = spin + 5
  const y = bY + 16 * 16
  if (bT % 5 === 0) {
    bullet(bX, y, spin & 255, sk(34, BK_PINK))
    bullet(bX, y, (spin + 128) & 255, sk(34, BK_BLUE))
  }
  if (bT % 90 === 0) ring(bX, y, bT & 255, ringOf(10, 20, BK_ORB_BLUE))
}

/** Phase 3: the core burns: rings every few frames, aimed lines between. */
function zenithBurning(): void {
  if (bossPhase === 2) {
    bossPhase = 3
    shake(30)
    wave(90, 10)
    sfxBossPhase()
  }
  spin = spin + 11
  const y = bY + 16 * 16
  if (bT % 14 === 0) ring(bX, y, spin, ringOf(14, 30, BK_PINK))
  if (bT % 40 < 12 && bT % 3 === 0) bullet(bX, y, aimed(bX, y), sk(64, BK_NEEDLE))
}

/** Out of time: it climbs away and leaves its bullets. */
function flee(): void {
  bossPhase = 11
  bossOn = B_NONE
}

function die(): void {
  bossPhase = 9
  bT = 0
  cancelAll()
  flashScreen(6)
  sfxBossDown()
}

/** The death: bursts round the hull for two seconds, then the whole thing goes. */
function dying(): void {
  bY = bY + 2
  if (bT % 6 === 0) {
    const dx = i16((bT * 37) % 96) - 48
    const dy = i16((bT * 23) % 64) - 32
    burst(bX + dx * 16, bY + dy * 16, (bT & 8) !== 0 ? 1 : 0)
    shake(8)
  }
  if (bT === 100) {
    let k: u16 = 0
    while (k < 6) {
      burst(bX + i16(k * 20) * 16 - 800, bY + i16(k & 1) * 320, 1)
      k++
    }
    let s: u16 = 0
    while (s < 24) {
      item(IT_STAR, bX + i16((s * 13) % 96) * 16 - 768, bY + i16((s * 7) % 48) * 16)
      s++
    }
    itemsAll()
    shake(40)
    wave(120, 14)
    flashScreen(16)
    bossPhase = 10
    bossOn = B_NONE
  }
}

/* ---------------- hits ---------------- */

/** A hit at (x, y) on an open part: answers whether it hit any part (closed ones stop shots). */
export function bossHit(x: i16, y: i16, damage: u16, byLance: bool): bool {
  if (bossOn === B_NONE || bossPhase === 0 || bossPhase >= 9) return false
  let k: u16 = 0
  while (k < 3) {
    const r = i16(PHALF[k]) * 16
    const px = bX + i16(PX[k]) * 16
    const py = bY + i16(PY[k]) * 16
    if (life[k] !== 0 && abs(px - x) < r && abs(py - y) < r) {
      if (open(k)) hurtPart(k, damage, byLance)
      return true
    }
    k++
  }
  // The hull itself stops shots.
  return abs(bX - x) < 40 * 16 && abs(bY - y) < 28 * 16
}

/** Where the lance meets the boss in its column below `y`: the lowest point, or 0. */
export function bossLance(x: i16, y: i16): i16 {
  if (bossOn === B_NONE || bossPhase === 0 || bossPhase >= 9) return 0
  let best: i16 = 0
  let k: u16 = 0
  while (k < 3) {
    const r = i16(PHALF[k]) * 16
    const bottom = bY + i16(PY[k]) * 16 + r
    if (life[k] !== 0 && abs(bX + i16(PX[k]) * 16 - x) < r + 64 && bottom < y && bottom > best)
      best = bottom
    k++
  }
  if (best === 0 && abs(bX - x) < 40 * 16) best = bY + 28 * 16
  return best
}

export function bossBomb(): void {
  let k: u16 = 0
  while (k < 3) {
    if (open(k)) hurtPart(k, 30, false)
    k++
  }
}

function hurtPart(k: u16, damage: u16, byLance: bool): void {
  flash[k] = 2
  if (life[k] > damage) {
    life[k] = life[k] - damage
    if (byLance && (life[k] & 15) === 0) item(IT_STAR, bX + i16(PX[k]) * 16, bY + i16(PY[k]) * 16)
    return
  }
  life[k] = 0
  if (k !== 0) {
    burst(bX + i16(PX[k]) * 16, bY + i16(PY[k]) * 16, 1)
    shake(16)
    bossPartDown()
    // An arm or a cannon: 10,000 points.
    points(1000)
  }
}

/* ---------------- drawing ---------------- */

function bossDraw(): void {
  const x = (bX >> 4) + shakeDX()
  const y = (bY >> 4) + shakeDY()
  // Going down, it flickers white.
  const dying_ = bossPhase === 9 && (bT & 2) !== 0
  if (bossOn === B_BASTION) bastionDraw(x, y, dying_)
  else zenithDraw(x, y, dying_)
}

function pal(k: u16, dying_: bool): u16 {
  let f = false
  if (flash[k] > 0) {
    flash[k] = flash[k] - 1
    f = true
  }
  return ((f || dying_ ? SL_FLASH : SL_HEAVY) - 8) << 10
}

function bastionDraw(x: i16, y: i16, dying_: bool): void {
  const p = pal(0, dying_)
  spr(x - 32, y - 32, BASTION_TILE | p, S32)
  spr(x, y - 32, (BASTION_TILE + 16) | p, S32)
  spr(x - 32, y, (BASTION_TILE + 32) | p, S32)
  spr(x, y, (BASTION_TILE + 48) | p, S32)
  if (life[1] !== 0) spr(x - 64, y - 16, (BASTION_TILE + 64) | pal(1, dying_), S32)
  if (life[2] !== 0) spr(x + 32, y - 16, (BASTION_TILE + 64) | pal(2, dying_) | FLIP_H, S32)
}

function zenithDraw(x: i16, y: i16, dying_: bool): void {
  const hull = ((dying_ ? SL_FLASH : SL_HEAVY) - 8) << 10
  // The hull: six frames, three across, two down, centred on (x, y).
  let k: u16 = 0
  while (k < 6) {
    spr(x - 48 + i16(k % 3) * 32, y - 32 + i16(div(k, 3)) * 32, (ZENITH_TILE + k * 16) | hull, S32)
    k++
  }
  const spread = bossPhase >= 2 ? 16 : 0
  spr(x - 80, y - 32, (ZENITH_TILE + 176 + spread) | hull, S32)
  spr(x + 48, y - 32, (ZENITH_TILE + 176 + spread) | hull | FLIP_H, S32)
  const core = bossPhase >= 3 ? 2 : life[1] === 0 && life[2] === 0 ? 1 : 0
  spr(x - 16, y, (ZENITH_TILE + 96 + core * 16) | pal(0, dying_), S32)
  const left = life[1] === 0 ? 16 : 0
  const right = life[2] === 0 ? 16 : 0
  spr(x - 64, y + 16, (ZENITH_TILE + 144 + left) | pal(1, dying_), S32)
  spr(x + 32, y + 16, (ZENITH_TILE + 144 + right) | pal(2, dying_) | FLIP_H, S32)
}

/** The boss's life for the gauge: 0-64, the core's share. */
export function bossGauge(): u16 {
  if (bossOn === B_NONE) return 0
  const full: u16 = bossOn === B_BASTION ? 320 : 560
  return div(life[0] * 64, full)
}

import { bossPartDown, sfxBossDown, sfxBossPhase } from './audio.e16'
