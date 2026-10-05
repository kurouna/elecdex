// ELECAIRCOMBAT's flying (docs/elec16-elecaircombat.md section 2): the player's fighter as three
// axes turned by the pad - roll on left and right, pitch on up and down, a bank turning it as
// a coordinated turn would - its speed (the burner on R, the brake on L), its height, and the
// world moving past: the enemy's place is kept relative to the player.
import { type bool, i16, mulShift, u16, words } from '../../../../src/shared/e16c/builtins'
import { aim, B_DOWN, B_L, B_LEFT, B_R, B_RIGHT, B_UP, held } from '../lib/kit.e16'
import {
  approach,
  clamp16,
  muldiv,
  ONE,
  orthonormal,
  pitchBy,
  rollBy,
  turnWorld,
  V_PF,
  V_PR,
  V_PU,
  V_REL,
  vec,
  vget,
  vset,
} from './math.e16'

/** Speeds in sixteenths of a unit a frame. */
export const SPEED_CRUISE: i16 = 320
export const SPEED_BURNER: i16 = 464
export const SPEED_BRAKE: i16 = 200

export let pSpeed: i16 = SPEED_CRUISE
export let pAlt: i16 = 6000
let pAltFrac: i16 = 0
let rollRate: i16 = 0
let pitchRate: i16 = 0
/** 1 while the burner is lit, 2 while braking. */
export let throttle: u16 = 0
/** Up on the pad pulls the nose up when set (the stick reversed). */
export let stickReversed: bool = false
let pSquare: u16 = 0
/** Kept fractions of the enemy's place (sixteenths). */
const relFrac = words(3)

export function stickIs(r: bool): void {
  stickReversed = r
}

/** Level flight heading north at `alt`, cruising. */
export function playerNew(alt: i16): void {
  vset(V_PF, 0, ONE, 0)
  vset(V_PR, ONE, 0, 0)
  vset(V_PU, 0, 0, ONE)
  pSpeed = SPEED_CRUISE
  pAlt = alt
  pAltFrac = 0
  rollRate = 0
  pitchRate = 0
  throttle = 0
  relFrac[0] = 0
  relFrac[1] = 0
  relFrac[2] = 0
  velocityKept()
}

/** Roll and pitch rates the pad asks for (Q14 radians a frame). */
function wantedRoll(): i16 {
  if (held(B_LEFT)) return -1060
  if (held(B_RIGHT)) return 1060
  return 0
}

function wantedPitch(): i16 {
  let pull = held(B_DOWN)
  let push = held(B_UP)
  if (stickReversed) {
    const t = pull
    pull = push
    push = t
  }
  let p: i16 = 0
  if (pull) p = 500
  if (push) p = -300
  // The brake tightens the turn, the burner widens it.
  if (throttle === 2) p = p + (p >> 2)
  if (throttle === 1) p = p - (p >> 3)
  return p
}

/** A frame of the player's flying: the pad, the turns, the speed. `alive` false lets go. */
export function playerStep(alive: bool): void {
  throttle = alive && held(B_R) ? 1 : alive && held(B_L) ? 2 : 0
  const wr = alive ? wantedRoll() : 400
  const wp = alive ? wantedPitch() : -120
  rollRate = approach(rollRate, wr, 160)
  pitchRate = approach(pitchRate, wp, 60)
  if (rollRate !== 0) rollBy(V_PR, V_PU, rollRate)
  if (pitchRate !== 0) pitchBy(V_PF, V_PU, pitchRate)
  // A bank turns the fighter about the world's up, as lift would.
  const bankTurn = mulShift(-vget(V_PR + 2), 330, 14)
  if (bankTurn !== 0) {
    turnWorld(V_PF, bankTurn)
    turnWorld(V_PR, bankTurn)
    turnWorld(V_PU, bankTurn)
  }
  // Squared up every other frame (the enemy on the others): a frame's turns are small, and
  // the drift one leaves is far below a point on the screen.
  pSquare = pSquare ^ 1
  if (pSquare === 0) orthonormal(V_PF, V_PR, V_PU)
  let target = SPEED_CRUISE
  if (throttle === 1) target = SPEED_BURNER
  if (throttle === 2) target = SPEED_BRAKE
  // Climbing slows the fighter, diving speeds it.
  target = target - (vget(V_PF + 2) >> 7)
  pSpeed = approach(pSpeed, target, 3)
  velocityKept()
}

/** The player's velocity part `k` (0 x, 1 y, 2 z) in sixteenths of a unit a frame. */
export function pVel(k: u16): i16 {
  return i16(pv[k])
}

/** The player's velocity as `playerStep` last left it (sixteenths a frame). */
const pv = words(3)

function velocityKept(): void {
  pv[0] = u16(mulShift(vget(V_PF), pSpeed, 14))
  pv[1] = u16(mulShift(vget(V_PF + 1), pSpeed, 14))
  pv[2] = u16(mulShift(vget(V_PF + 2), pSpeed, 14))
}

/**
 * The world moves on a frame: the enemy's place from the player by the two velocities
 * (sixteenths, `ex` `ey` `ez` the enemy's), and the player's height.
 */
export function worldStep(ex: i16, ey: i16, ez: i16): void {
  relMove(0, ex - pVel(0))
  relMove(1, ey - pVel(1))
  relMove(2, ez - pVel(2))
  const h = pAltFrac + pVel(2)
  pAlt = clamp16(pAlt + (h >> 4), -100, 30000)
  pAltFrac = h & 15
}

function relMove(k: u16, d: i16): void {
  const t = i16(relFrac[k]) + d
  vec[V_REL + k] = u16(clamp16(vget(V_REL + k) + (t >> 4), -24000, 24000))
  relFrac[k] = u16(t & 15)
}

/** The player's heading, 0-359 degrees (north 0, east 90). */
export function headingDegrees(): u16 {
  const fx = vget(V_PF)
  const fy = vget(V_PF + 1)
  const a = aim(fx >> 6, fy >> 6)
  const h = (64 - a) & 255
  return u16(mulShift(i16(h), 45, 5))
}

/** The nose's pitch in degrees, -90 to 90. */
export function pitchDegrees(): i16 {
  const fz = vget(V_PF + 2)
  // asin by the kit's table: the angle whose sine is fz.
  const flat = mulShift(vget(V_PF), vget(V_PF), 14) + mulShift(vget(V_PF + 1), vget(V_PF + 1), 14)
  const a = aim(isqrt(u16(flat)) >> 6, fz >> 6)
  const s = i16(a > 128 ? a - 256 : a)
  return mulShift(s, 45, 5)
}

/** The square root of a Q14 number (at most one), in Q14: Newton's steps from one. */
export function isqrt(v: u16): i16 {
  if (v === 0) return 0
  let x: u16 = 16384
  let k: u16 = 0
  while (k < 6) {
    x = (x + muldiv(v, 16384, x)) >> 1
    k++
  }
  return i16(x)
}
