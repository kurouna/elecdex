// ELECAIRCOMBAT's flying (docs/elec16-elecaircombat.md sections 2 and 6): the player's fighter
// as three axes turned by the pad - roll on left and right, pitch on up and down, a bank
// turning it as a coordinated turn would - its speed (the burner on R, the brake on L), a
// gentle stall when it is slow and pulled, its height, and the world moving past: the enemy's
// place is kept relative to the player.
import { type bool, i16, mulShift, u16, words } from '../../../../src/shared/e16c/builtins'
import { aim, B_DOWN, B_L, B_LEFT, B_R, B_RIGHT, B_UP, held } from '../lib/kit.e16'
import {
  abs16,
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
  vmax,
  vset,
  yawBy,
} from './math.e16'

/** Speeds in sixteenths of a unit a frame. */
export const SPEED_CRUISE: i16 = 320
export const SPEED_BURNER: i16 = 464
export const SPEED_BRAKE: i16 = 200
/** The most the engine and drag change the speed a frame, sixteenths of a point (3 points). */
const THRUST: i16 = 48
/** What a climb straight up takes off the speed a frame, sixteenths of a point. */
const CLIMB: i16 = 84
/** How far over the throttle's speed a dive still gains. */
const SPEED_DIVE: i16 = 128
/** The slowest the fighter flies: a climb held into the stall hangs on the nose here. */
const SPEED_MIN: i16 = 48

/**
 * The stall, the player's only (the aces fly their own way): no airflow model, a speed below
 * which the wing no longer holds the nose. It is STALL_BASE, well under the brake's speed,
 * raised by the pull (the wing's load) and by height above STALL_HIGH, a little lowered on
 * the burner - never by where the nose points: a climb straight up at speed is no stall, the
 * speed it bleeds is (speedStep). Within STALL_MARGIN above it the fighter buffets (the screen
 * shakes, a horn, STALL on the HUD) and the pull is dulled; below it the pull hardly answers,
 * the roll is halved, the wing drags (STALL_DRAG) and the nose falls toward the ground by
 * itself, STALL_DROP a frame, until the speed is back half the margin above the stall speed -
 * lowering the nose is the way out. A stall alone never brings the fighter down; only the sea
 * does. A loop pulled from cruise comes over the top near 220, clear of it; one begun from
 * the brake's speed, or a zoom held straight up, stalls.
 */
export const STALL_BASE: i16 = 157
export const STALL_MARGIN: i16 = 24
export const STALL_HIGH: i16 = 20000
/** The nose's fall a frame while stalled, Q14 radians (about half a degree). */
export const STALL_DROP: i16 = 140
/** What a stalled wing takes off the speed the fighter tends to. */
export const STALL_DRAG: i16 = 32
/**
 * The stall's base as flown: STALL_BASE, which a test lowers out of reach to measure a fight's
 * frames along the flight they were first measured on.
 */
export let stallBase: i16 = STALL_BASE
/** 0 flying, 1 buffeting near the stall, 2 stalled. */
export let stallState: u16 = 0
/** The stall speed as this frame's flying set it. */
export let stallSpeed: i16 = STALL_BASE

export let pSpeed: i16 = SPEED_CRUISE
export let pAlt: i16 = 6000
let pAltFrac: i16 = 0
let pSpeedFrac: i16 = 0
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
  pSpeedFrac = 0
  rollRate = 0
  pitchRate = 0
  throttle = 0
  stallBase = STALL_BASE
  stallState = 0
  stallSpeed = stallBase
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

/** The stall speed now: the base, raised by the pull and the height; the burner's lower. */
function stallSpeedNow(): i16 {
  let s = stallBase
  // Up to 15 more for the hardest pull (19 on the brake).
  if (pitchRate > 0) s = s + (pitchRate >> 5)
  // Thin air: a point more for every 256 of height above STALL_HIGH (39 at the ceiling).
  if (pAlt > STALL_HIGH) s = s + ((pAlt - STALL_HIGH) >> 8)
  if (throttle === 1) s = s - 16
  return s
}

/**
 * Where the speed stands to the stall: 0 clear of it, 1 buffeting, 2 stalled. A stall holds
 * until the speed is half the margin above the stall speed, so it does not flicker at the edge.
 */
function stallNow(alive: bool): u16 {
  stallSpeed = stallSpeedNow()
  if (!alive) return 0
  if (pSpeed < stallSpeed) return 2
  if (stallState === 2 && pSpeed < stallSpeed + (STALL_MARGIN >> 1)) return 2
  return pSpeed < stallSpeed + STALL_MARGIN ? 1 : 0
}

/**
 * A stalled nose falls toward the ground, STALL_DROP a frame however the fighter is turned:
 * the way down across the nose is the up axis's height (a pitch) and the wing's (a yaw), taken
 * in the share of the larger. Straight up, it falls over the top of the canopy's side.
 */
function noseFalls(): void {
  const uz = vget(V_PU + 2)
  const rz = vget(V_PR + 2)
  const h = vmax(uz, rz, 0)
  if (h < 2048) {
    if (vget(V_PF + 2) > 0) pitchBy(V_PF, V_PU, -STALL_DROP)
    return
  }
  const p = -i16(muldiv(u16(abs16(uz)), u16(STALL_DROP), u16(h)))
  if (p !== 0) pitchBy(V_PF, V_PU, uz < 0 ? -p : p)
  const y = -i16(muldiv(u16(abs16(rz)), u16(STALL_DROP), u16(h)))
  if (y !== 0) yawBy(V_PF, V_PR, rz < 0 ? -y : y)
}

/** A frame of the player's flying: the pad, the turns, the speed. `alive` false lets go. */
export function playerStep(alive: bool): void {
  throttle = alive && held(B_R) ? 1 : alive && held(B_L) ? 2 : 0
  stallState = stallNow(alive)
  let wr = alive ? wantedRoll() : 400
  let wp = alive ? wantedPitch() : -120
  if (stallState !== 0) {
    wr = rollAsked(wr)
    wp = pullAsked(wp)
  }
  rollRate = approach(rollRate, wr, 160)
  pitchRate = approach(pitchRate, wp, 60)
  if (rollRate !== 0) rollBy(V_PR, V_PU, rollRate)
  if (pitchRate !== 0) pitchBy(V_PF, V_PU, pitchRate)
  if (stallState === 2) noseFalls()
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
  speedStep()
  velocityKept()
}

/** The roll as the stall lets it: halved while stalled. */
function rollAsked(wr: i16): i16 {
  return stallState === 2 ? wr >> 1 : wr
}

/** The pull as the stall lets it: dulled near it, hardly answering in it; a push is kept. */
function pullAsked(wp: i16): i16 {
  if (wp <= 0) return wp
  return stallState === 2 ? wp >> 4 : wp - (wp >> 2)
}

/** The speed the throttle holds in level flight, less the stalled wing's drag. */
function speedAsked(): i16 {
  let target = SPEED_CRUISE
  if (throttle === 1) target = SPEED_BURNER
  if (throttle === 2) target = SPEED_BRAKE
  return stallState === 2 ? target - STALL_DRAG : target
}

/**
 * A frame's change of speed, in sixteenths of a speed point (the fraction kept): the engine
 * and drag pull it toward the throttle's speed, at most THRUST a frame, and the climb takes
 * CLIMB at the vertical (a dive gives it), so the speed is energy: a loop entered fast comes
 * over the top with speed to spare, one entered slow does not, and a climb steeper than the
 * engine can hold bleeds the speed away however long it lasts (at cruise one steeper than
 * about 35 degrees). Above STALL_HIGH the air is thin and the engine weaker, a sixteenth less
 * for every 512 of height, so a gentler climb bleeds there. A dive gains no more once it is
 * SPEED_DIVE over the throttle's speed, and nothing slows below SPEED_MIN.
 */
function speedStep(): void {
  const target = speedAsked()
  let most = THRUST
  if (pAlt > STALL_HIGH) most = most - ((pAlt - STALL_HIGH) >> 9)
  const d = clamp16((target - pSpeed) << 2, -most, most)
  let g = mulShift(vget(V_PF + 2), CLIMB, 14)
  if (g < 0 && pSpeed >= target + SPEED_DIVE) g = 0
  const q = pSpeedFrac + d - g
  pSpeed = pSpeed + (q >> 4)
  pSpeedFrac = q & 15
  if (pSpeed < SPEED_MIN) {
    pSpeed = SPEED_MIN
    pSpeedFrac = 0
  }
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
