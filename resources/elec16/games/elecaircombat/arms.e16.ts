// ELECAIRCOMBAT's weapons (docs/elec16-elecaircombat.md section 6): both fighters' guns (rounds
// flown as points in the world, the player's eased onto the enemy's lead when it is close to
// the cross), missiles that steer at what they chase, flares that pull them away, and the
// seeker's lock. Places are units from the player, in the world's axes.
import { type bool, div, i16, mulShift, u16, words } from '../../../../src/shared/e16c/builtins'
import { B_A, B_B, B_X, held, pressed, rand, randBelow, S8, spr } from '../lib/kit.e16'
import { HUD8_TILE, SHOTS_TILE } from './assets.e16'
import {
  banditFired,
  banditHit,
  eAlive,
  eBX,
  eBY,
  eBZ,
  eDist,
  eOn,
  eSpeed,
  eVel,
} from './bandit.e16'
import { pSpeed, pVel } from './flight.e16'
import {
  abs16,
  scaleq,
  V_EF,
  V_EU,
  V_PF,
  V_PR,
  V_PU,
  V_REL,
  V_T0,
  V_T1,
  va,
  vec,
  vget,
  vlen,
  vmax,
  vset,
  vunit,
} from './math.e16'
import { abovePanel, bodyZ, SL_HUD_RED, SL_SHOT, scrX, scrY, see } from './sky.e16'

/* ---------------- rounds ---------------- */

const BN = 24
const bX = words(24)
const bY = words(24)
const bZ = words(24)
const bVX = words(24)
const bVY = words(24)
const bVZ = words(24)
/** Frames left; 0 a free slot. */
const bLife = words(24)
/** 1 the player's, 2 the enemy's. */
const bOwner = words(24)
let bNext: u16 = 0
let gunCool: u16 = 0
/** The side the last round left from (0 right, 1 left). */
export let muzzle: u16 = 0
/** Rounds that struck this frame: the enemy, the player. */
export let hitsOnEnemy: u16 = 0
export let hitsOnPlayer: u16 = 0
/** Rounds fired and struck this sortie, for the tally. */
export let roundsFired: u16 = 0
export let roundsHit: u16 = 0
/** Set while the player's gun is firing this frame (the sound, the muzzle's flash). */
export let gunFiring: bool = false

/** A round from (x, y, z) at velocity (vx, vy, vz) units a frame (the world's), for `owner`. */
function fireRound(x: i16, y: i16, z: i16, owner: u16): void {
  const k = bNext
  bNext = bNext + 1 === BN ? 0 : bNext + 1
  bX[k] = u16(x)
  bY[k] = u16(y)
  bZ[k] = u16(z)
  bVX[k] = vec[V_T0]
  bVY[k] = vec[V_T0 + 1]
  bVZ[k] = vec[V_T0 + 2]
  bLife[k] = owner === 1 ? 32 : 40
  bOwner[k] = owner
}

/** The direction of the gun in V_T0 as a velocity: `speed` units a frame plus the shooter's. */
function gunVelocity(speed: i16, vx: i16, vy: i16, vz: i16): void {
  vec[V_T0] = u16(mulShift(vget(V_T0), speed, 14) + (vx >> 4))
  vec[V_T0 + 1] = u16(mulShift(vget(V_T0 + 1), speed, 14) + (vy >> 4))
  vec[V_T0 + 2] = u16(mulShift(vget(V_T0 + 2), speed, 14) + (vz >> 4))
}

/**
 * The player's gun while A is held: a round every four frames from either side of the nose,
 * straight ahead - or at the enemy's lead when it sits close to the cross and in range.
 */
export function playerGun(): void {
  gunFiring = false
  if (gunCool > 0) gunCool--
  if (!held(B_A) || gunCool > 0) return
  gunCool = 4
  gunFiring = true
  muzzle = muzzle ^ 1
  if (!assistAim()) {
    vec[V_T0] = vec[V_PF]
    vec[V_T0 + 1] = vec[V_PF + 1]
    vec[V_T0 + 2] = vec[V_PF + 2]
  }
  gunVelocity(72, pVel(0), pVel(1), pVel(2))
  const side: i16 = muzzle === 0 ? 7 : -7
  const x = mulShift(vget(V_PR), side, 14) - mulShift(vget(V_PU), 5, 14)
  const y = mulShift(vget(V_PR + 1), side, 14) - mulShift(vget(V_PU + 1), 5, 14)
  const z = mulShift(vget(V_PR + 2), side, 14) - mulShift(vget(V_PU + 2), 5, 14)
  fireRound(x, y, z, 1)
  roundsFired++
}

/** The lead on the enemy into V_T0 (a unit direction) when it is near the cross. */
function assistAim(): bool {
  if (!eAlive || !eOn || eBZ <= 0 || eBZ > 2200) return false
  const cone = eBZ >> 3
  if (abs16(eBX) > cone || abs16(eBY) > cone) return false
  // Where it will be when the rounds arrive: its place on by its speed for the flight.
  let t = i16(div(eDist, 70))
  if (t > 31) t = 31
  vset(
    V_T0,
    vget(V_REL) + mulShift(eVel(0) - pVel(0), t * 1024, 14),
    vget(V_REL + 1) + mulShift(eVel(1) - pVel(1), t * 1024, 14),
    vget(V_REL + 2) + mulShift(eVel(2) - pVel(2), t * 1024, 14),
  )
  unitOf(V_T0)
  return true
}

/**
 * Vector `k` (any size up to a word) made a unit vector, Q14: brought by halves and doubles to
 * a rough length of 8192-16383, scaled by one reciprocal of it (one division, not three long
 * ones: the direction is exact, the length within a few parts in a hundred), then made a unit
 * by two of Newton's steps.
 */
export function unitOf(k: u16): void {
  let x = vget(k)
  let y = vget(k + 1)
  let z = vget(k + 2)
  while (vmax(x, y, z) >= 8192) {
    x = x >> 2
    y = y >> 2
    z = z >> 2
  }
  let len = vlen(x, y, z)
  if (len === 0) return
  while (len < 8192) {
    x = x << 1
    y = y << 1
    z = z << 1
    len = len << 1
  }
  vset(k, x, y, z)
  scaleq(va(k), i16(div(65535, len >> 6) << 6))
  vunit(k)
  vunit(k)
}

function scatter(spread: u16): i16 {
  return mulShift(i16(rand() & 255) - 128, i16(spread), 5)
}

/**
 * The enemy fires a round from its nose toward the player, thrown off its line by up to
 * `spread` * 4 (Q14) either way: the later aces aim tighter.
 */
export function enemyRound(spread: u16): void {
  vec[V_T0] = u16(vget(V_EF) + scatter(spread))
  vec[V_T0 + 1] = vec[V_EF + 1]
  vec[V_T0 + 2] = u16(vget(V_EF + 2) + scatter(spread))
  gunVelocity(66, eVel(0), eVel(1), eVel(2))
  fireRound(
    vget(V_REL) + (vget(V_EF) >> 9),
    vget(V_REL + 1) + (vget(V_EF + 1) >> 9),
    vget(V_REL + 2),
    2,
  )
  // The muzzle's flash on its nose, drawn with the fighter (no effect of its own to project).
  banditFired()
}

/** Every round on a frame: moved, struck, drawn. */
export function roundsStep(): void {
  hitsOnEnemy = 0
  hitsOnPlayer = 0
  const px = pVel(0) >> 4
  const py = pVel(1) >> 4
  const pz = pVel(2) >> 4
  let k: u16 = 0
  while (k < BN) {
    if (bLife[k] !== 0) roundStep(k, px, py, pz)
    k++
  }
}

function roundStep(k: u16, px: i16, py: i16, pz: i16): void {
  bLife[k] = bLife[k] - 1
  const x = i16(bX[k]) + i16(bVX[k]) - px
  const y = i16(bY[k]) + i16(bVY[k]) - py
  const z = i16(bZ[k]) + i16(bVZ[k]) - pz
  bX[k] = u16(x)
  bY[k] = u16(y)
  bZ[k] = u16(z)
  // Only a round within a box round its target is weighed (a few compares, no calls).
  const tx = bOwner[k] === 1 ? x - vget(V_REL) : x
  const ty = bOwner[k] === 1 ? y - vget(V_REL + 1) : y
  if (tx < 160 && tx > -160 && ty < 160 && ty > -160) {
    if (bOwner[k] === 1 ? strikesEnemy(k, x, y, z) : strikesPlayer(x, y, z)) {
      bLife[k] = 0
      return
    }
  }
  // Every other round is a tracer: only those are seen.
  if ((k & 1) === 0) roundDraw(x, y, z)
}

/** Whether a player's round at (x, y, z), or half a step back, is within the enemy. */
function strikesEnemy(k: u16, x: i16, y: i16, z: i16): bool {
  if (!eAlive) return false
  const ex = vget(V_REL)
  const ey = vget(V_REL + 1)
  const ez = vget(V_REL + 2)
  if (abs16(ex - x) > 160 || abs16(ey - y) > 160 || abs16(ez - z) > 160) return false
  const near =
    within(ex - x, ey - y, ez - z, 64) ||
    within(
      ex - x + (i16(bVX[k]) >> 1),
      ey - y + (i16(bVY[k]) >> 1),
      ez - z + (i16(bVZ[k]) >> 1),
      64,
    )
  if (!near) return false
  hitsOnEnemy++
  roundsHit++
  // Its sparks are drawn on the fighter while it shows the hit (bandit.e16.ts).
  banditHit(3)
  return true
}

function strikesPlayer(x: i16, y: i16, z: i16): bool {
  if (!within(x, y, z, 40)) return false
  hitsOnPlayer++
  return true
}

function within(x: i16, y: i16, z: i16, r: i16): bool {
  if (abs16(x) > r || abs16(y) > r || abs16(z) > r) return false
  return vlen(x, y, z) < u16(r)
}

/** A round as a tracer: brighter and larger the nearer it is. */
function roundDraw(x: i16, y: i16, z: i16): void {
  vset(V_T0, x, y, z)
  if (!see(V_T0) || !abovePanel(scrY(), 4)) return
  const d = bodyZ()
  const f: u16 = d < 260 ? 0 : d < 700 ? 1 : d < 1500 ? 2 : 3
  spr(scrX() - 4, scrY() - 4, (SHOTS_TILE + f) | ((SL_SHOT - 8) << 10), S8)
}

/* ---------------- missiles and flares ---------------- */

const MN = 6
/** The player's missiles fly in slots 0-3, the enemy's in 4-5: one side's never keep the other's off the rail. */
const M_ENEMY = 4
const mX = words(6)
const mY = words(6)
const mZ = words(6)
const mDX = words(6)
const mDY = words(6)
const mDZ = words(6)
/** Speed and top speed, sixteenths of a unit a frame, and what it gains a frame. */
const mSpeed = words(6)
const mTop = words(6)
const mGain = words(6)
const mLife = words(6)
/** 1 the player's (at the enemy), 2 the enemy's (at the player), 0 free. */
const mOwner = words(6)
/** Chasing: 0 its quarry, 1 a flare (it has been fooled), 2 nothing (fired blind, or lost it). */
const mChase = words(6)
const mFlare = words(6)
/**
 * Whether it was within 400 of its quarry when it last turned (every other frame): only then
 * can it arrive before it turns again (it closes by at most about 80 a frame).
 */
const mNear = words(6)
/** What the player carries into a sortie: missiles, and flares (a pair each). */
export const PLAYER_MISSILES = 64
export const PLAYER_FLARES = 48
/** A tenth of a missile's top speed, sixteenths (the top is 50 units a frame), and of what it gains a frame. */
const M_TOP_TENTH: u16 = 80
const M_GAIN_TENTH: u16 = 2
export let missilesLeft: u16 = PLAYER_MISSILES
export let flaresLeft: u16 = PLAYER_FLARES
let missileCool: u16 = 0
/** An enemy missile is after the player; the nearest one's distance. */
export let warned: bool = false
export let warnDist: u16 = 0
/** What the player's missiles did this frame. */
export let missileStruck: u16 = 0
export let missileFired: bool = false
/** An enemy missile burst close by without striking (the cockpit shakes). */
export let nearMiss: bool = false
/** The frame's count, for the missiles' turns on alternate frames; their smoke's beat. */
let armsTick: u16 = 0
let trailT: u16 = 0
let trailNow: bool = false

export function armsNew(): void {
  let k: u16 = 0
  while (k < BN) {
    bLife[k] = 0
    k++
  }
  k = 0
  while (k < MN) {
    mOwner[k] = 0
    k++
  }
  k = 0
  while (k < FN) {
    fLife[k] = 0
    k++
  }
  missilesLeft = PLAYER_MISSILES
  flaresLeft = PLAYER_FLARES
  lockT = 0
  locked = false
  roundsFired = 0
  roundsHit = 0
  missileCool = 0
  flareCool = 0
}

/** A free slot of `owner`'s, or MN. */
function missileSlot(owner: u16): u16 {
  let k: u16 = owner === 1 ? 0 : M_ENEMY
  const end: u16 = owner === 1 ? M_ENEMY : MN
  while (k < end) {
    if (mOwner[k] === 0) return k
    k++
  }
  return MN
}

/**
 * A missile from the place in V_T1 along vector `dir` (a unit), for `owner`, chasing or not,
 * `tenths` tenths as fast as the standard one: off the rail (the shooter's speed and a bit),
 * in what it gains a frame, and at the top. Answers whether a slot took it (none is spent
 * when none does).
 */
function launch(owner: u16, dir: u16, chase: u16, tenths: u16): bool {
  const k = missileSlot(owner)
  if (k === MN) return false
  mOwner[k] = owner
  mChase[k] = chase
  mX[k] = vec[V_T1]
  mY[k] = vec[V_T1 + 1]
  mZ[k] = vec[V_T1 + 2]
  mDX[k] = vec[dir]
  mDY[k] = vec[dir + 1]
  mDZ[k] = vec[dir + 2]
  const shooter = owner === 1 ? pSpeed : eSpeed
  mSpeed[k] = div((u16(shooter) + 64) * tenths, 10)
  mTop[k] = M_TOP_TENTH * tenths
  mGain[k] = M_GAIN_TENTH * tenths
  mNear[k] = 1
  // Fired blind it goes on only a little way: it chases nothing.
  mLife[k] = chase === 2 ? 120 : 300
  return true
}

/** The side of the rail the last missile left (the launch's flash is drawn there). */
export let railSide: i16 = 14

/** B: a missile from under the wing, locked or fired blind. */
export function playerMissile(): void {
  missileFired = false
  if (missileCool > 0) missileCool--
  if (!pressed(B_B) || missileCool > 0 || missilesLeft === 0) return
  const side: i16 = (missilesLeft & 1) === 0 ? 14 : -14
  vset(
    V_T1,
    mulShift(vget(V_PR), side, 14) - mulShift(vget(V_PU), 8, 14),
    mulShift(vget(V_PR + 1), side, 14) - mulShift(vget(V_PU + 1), 8, 14),
    mulShift(vget(V_PR + 2), side, 14) - mulShift(vget(V_PU + 2), 8, 14),
  )
  if (!launch(1, V_PF, locked ? 0 : 2, 10)) return
  missileCool = 24
  missilesLeft--
  missileFired = true
  railSide = side
}

/**
 * The enemy fires a missile at the player, `tenths` tenths as fast as the player's (off the
 * rail, gaining, and at the top): answers whether it went.
 */
export function enemyMissile(tenths: u16): bool {
  vset(
    V_T1,
    vget(V_REL) - (vget(V_EU) >> 10),
    vget(V_REL + 1) - (vget(V_EU + 1) >> 10),
    vget(V_REL + 2) - (vget(V_EU + 2) >> 10),
  )
  if (!launch(2, V_EF, 0, tenths)) return false
  launchAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2))
  sfxLaunch()
  return true
}

/** The nearest of the player's missiles still chasing the enemy, units (0xffff for none). */
export let threatDist: u16 = 0xffff

/** Every missile on a frame. */
export function missilesStep(): void {
  missileStruck = 0
  missileDodged = 0
  nearMiss = false
  warned = false
  warnDist = 0xffff
  threatDist = 0xffff
  armsTick++
  trailT = trailT === 0 ? 2 : trailT - 1
  trailNow = trailT === 0
  let k: u16 = 0
  while (k < MN) {
    if (mOwner[k] !== 0) missileStep(k)
    k++
  }
}

function missileStep(k: u16): void {
  mLife[k] = mLife[k] - 1
  if (mLife[k] === 0) {
    mOwner[k] = 0
    puffAt(i16(mX[k]), i16(mY[k]), i16(mZ[k]), 1)
    return
  }
  const gained = mSpeed[k] + mGain[k]
  mSpeed[k] = gained > mTop[k] ? mTop[k] : gained
  // Each turns on alternate frames, twice as far: half the cost, much the same path.
  if (mChase[k] !== 2 && ((k ^ armsTick) & 1) === 0) missileSteer(k)
  if (mOwner[k] === 0) return
  const s = i16(mSpeed[k])
  const x = i16(mX[k]) + ((mulShift(i16(mDX[k]), s, 14) + 8) >> 4) - (pVel(0) >> 4)
  const y = i16(mY[k]) + ((mulShift(i16(mDY[k]), s, 14) + 8) >> 4) - (pVel(1) >> 4)
  const z = i16(mZ[k]) + ((mulShift(i16(mDZ[k]), s, 14) + 8) >> 4) - (pVel(2) >> 4)
  mX[k] = u16(x)
  mY[k] = u16(y)
  mZ[k] = u16(z)
  // Its smoke: a puff every third frame, left where it was made.
  if (trailNow) puffAt(x, y, z, 0)
  if (missileArrives(k, x, y, z)) return
  if (mOwner[k] === 2 && mChase[k] === 0) {
    warned = true
    const d = vlen(x, y, z)
    if (d < warnDist) warnDist = d
  } else if (mOwner[k] === 1 && mChase[k] === 0) {
    const d = vlen(vget(V_REL) - x, vget(V_REL + 1) - y, vget(V_REL + 2) - z)
    if (d < threatDist) threatDist = d
  }
  missileDraw(k, x, y, z)
}

/** Where missile `k`'s quarry is, into V_T0 (from the missile). */
function quarry(k: u16): void {
  let tx: i16 = 0
  let ty: i16 = 0
  let tz: i16 = 0
  if (mChase[k] === 1) {
    const f = mFlare[k]
    tx = i16(fX[f])
    ty = i16(fY[f])
    tz = i16(fZ[f])
  } else if (mOwner[k] === 1) {
    tx = vget(V_REL)
    ty = vget(V_REL + 1)
    tz = vget(V_REL + 2)
  }
  vset(V_T0, tx - i16(mX[k]), ty - i16(mY[k]), tz - i16(mZ[k]))
}

/**
 * Turns the missile toward its quarry, by at most its turn (two frames' worth). A quarry gone
 * behind it is lost: close by, the proximity fuse bursts it; else it flies on blind, a short
 * way. A flare that has burnt out is lost too.
 */
function missileSteer(k: u16): void {
  if (mChase[k] === 1 && fLife[mFlare[k]] === 0) {
    goBlind(k)
    return
  }
  quarry(k)
  const d = vlen(vget(V_T0), vget(V_T0 + 1), vget(V_T0 + 2))
  mNear[k] = d < 400 ? 1 : 0
  unitOf(V_T0)
  const ahead =
    mulShift(vget(V_T0), i16(mDX[k]), 14) +
    mulShift(vget(V_T0 + 1), i16(mDY[k]), 14) +
    mulShift(vget(V_T0 + 2), i16(mDZ[k]), 14)
  if (ahead < 4000) {
    if (d < 300) proximity(k)
    else goBlind(k)
    return
  }
  const turn = i16(mOwner[k] === 1 ? 1520 : 1240)
  mDX[k] = u16(i16(mDX[k]) + mulShift(vget(V_T0) - i16(mDX[k]), turn, 14))
  mDY[k] = u16(i16(mDY[k]) + mulShift(vget(V_T0 + 1) - i16(mDY[k]), turn, 14))
  mDZ[k] = u16(i16(mDZ[k]) + mulShift(vget(V_T0 + 2) - i16(mDZ[k]), turn, 14))
  vset(V_T0, i16(mDX[k]), i16(mDY[k]), i16(mDZ[k]))
  vunit(V_T0)
  mDX[k] = vec[V_T0]
  mDY[k] = vec[V_T0 + 1]
  mDZ[k] = vec[V_T0 + 2]
}

function goBlind(k: u16): void {
  mChase[k] = 2
  if (mLife[k] > 60) mLife[k] = 60
}

/**
 * The proximity fuse: a missile that passes its quarry close bursts there. Against the enemy
 * it scorches (as a missile it turned inside of); against the player it shakes the cockpit.
 */
function proximity(k: u16): void {
  boomAt(i16(mX[k]), i16(mY[k]), i16(mZ[k]))
  if (mChase[k] === 0 && mOwner[k] === 1 && eAlive) {
    missileDodged = 1
    banditHit(4)
  }
  if (mChase[k] === 0 && mOwner[k] === 2) nearMiss = true
  mOwner[k] = 0
}

/** Whether the missile reached its quarry (and burst on it). */
function missileArrives(k: u16, x: i16, y: i16, z: i16): bool {
  if (mChase[k] === 2 || mNear[k] === 0) return false
  quarry(k)
  if (!within(vget(V_T0), vget(V_T0 + 1), vget(V_T0 + 2), 80)) return false
  // Met head on, the fuse bursts it too early or late: less of a blow.
  metHeadOn =
    mulShift(i16(mDX[k]), vget(V_EF), 14) +
      mulShift(i16(mDY[k]), vget(V_EF + 1), 14) +
      mulShift(i16(mDZ[k]), vget(V_EF + 2), 14) <
    -8000
  mOwner[k] =
    mOwner[k] === 1 ? hitByMissile(x, y, z, mChase[k]) : hitPlayerMissile(x, y, z, mChase[k])
  return true
}

/** What became of the player's missiles this frame that reached the enemy but were dodged. */
export let missileDodged: u16 = 0

function hitByMissile(x: i16, y: i16, z: i16, chase: u16): u16 {
  boomAt(x, y, z)
  if (chase !== 0 || !eAlive) return 0
  // An ace breaking hard may turn inside the missile: it bursts close, and only scorches.
  if (aiEvading && randBelow(100) < aiDodge) {
    missileDodged = 1
    banditHit(4)
    return 0
  }
  missileStruck = 1
  banditHit(metHeadOn ? 18 : 30)
  return 0
}

/** The missile arriving met its quarry head on. */
let metHeadOn: bool = false

/** Set when an enemy missile strikes: the player takes it. */
export let missileOnPlayer: bool = false

export function missileOnClear(): void {
  missileOnPlayer = false
}

function hitPlayerMissile(x: i16, y: i16, z: i16, chase: u16): u16 {
  boomAt(x, y, z)
  if (chase === 0) missileOnPlayer = true
  return 0
}

/** A missile: its burner from behind; the enemy's marked in red while it comes for the player. */
function missileDraw(k: u16, x: i16, y: i16, z: i16): void {
  vset(V_T0, x, y, z)
  if (!see(V_T0) || !abovePanel(scrY(), 4)) return
  const sx = scrX()
  const sy = scrY()
  if (mOwner[k] === 2 && mChase[k] === 0) {
    spr(sx - 4, sy - 4, (HUD8_TILE + 20) | ((SL_HUD_RED - 8) << 10), S8)
  }
  spr(sx - 4, sy - 4, (SHOTS_TILE + 4 + (rand() & 1)) | ((SL_SHOT - 8) << 10), S8)
}

/** Each missile in flight as a radar blip: called with each one's place, owner. */
export function missileAt(k: u16): u16 {
  return mOwner[k]
}

export function missileX(k: u16): i16 {
  return i16(mX[k])
}

export function missileY(k: u16): i16 {
  return i16(mY[k])
}

/** A missile's speed, sixteenths of a unit a frame, and its quarry (for the tests). */
export function missileSpeed(k: u16): u16 {
  return mSpeed[k]
}

export function missileChase(k: u16): u16 {
  return mChase[k]
}

export const MISSILES = MN

/* ---------------- flares ---------------- */

const FN = 8
const fX = words(8)
const fY = words(8)
const fZ = words(8)
const fLife = words(8)
let fNext: u16 = 0
let flareCool: u16 = 0

/** X: two flares, which an enemy missile may chase instead (three in four do, whoever fired it). */
export function playerFlares(): bool {
  if (flareCool > 0) flareCool--
  if (!pressed(B_X) || flareCool > 0 || flaresLeft === 0) return false
  flareCool = 20
  flaresLeft--
  flarePair(0, 0, 0)
  let k: u16 = M_ENEMY
  while (k < MN) {
    if (mOwner[k] === 2 && mChase[k] === 0 && randBelow(4) !== 0) fooled(k)
    k++
  }
  return true
}

/** The enemy's flares, behind it: a player's missile may be fooled (`odds` in 256). */
export function enemyFlares(odds: u16): void {
  flarePair(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2))
  let k: u16 = 0
  while (k < M_ENEMY) {
    if (mOwner[k] === 1 && mChase[k] === 0 && randBelow(256) < odds) fooled(k)
    k++
  }
}

/** Missile `k` turns to the pair's second flare, the one just lit. */
function fooled(k: u16): void {
  mChase[k] = 1
  mFlare[k] = (fNext + FN - 1) % FN
  mNear[k] = 1
}

function flarePair(x: i16, y: i16, z: i16): void {
  flareAt(x - 20, y, z - 10)
  flareAt(x + 20, y, z - 10)
}

function flareAt(x: i16, y: i16, z: i16): void {
  fX[fNext] = u16(x)
  fY[fNext] = u16(y)
  fZ[fNext] = u16(z)
  fLife[fNext] = 80
  fNext = (fNext + 1) % FN
}

/** Flares fall behind (they keep none of the fighter's speed) and sink. */
export function flaresStep(): void {
  let k: u16 = 0
  while (k < FN) {
    if (fLife[k] !== 0) flareStep(k)
    k++
  }
}

function flareStep(k: u16): void {
  fLife[k] = fLife[k] - 1
  fX[k] = u16(i16(fX[k]) - (pVel(0) >> 5))
  fY[k] = u16(i16(fY[k]) - (pVel(1) >> 5))
  fZ[k] = u16(i16(fZ[k]) - (pVel(2) >> 5) - 1)
  vset(V_T0, i16(fX[k]), i16(fY[k]), i16(fZ[k]))
  if (!see(V_T0) || !abovePanel(scrY(), 4)) return
  spr(scrX() - 4, scrY() - 4, (SHOTS_TILE + 6 + ((fLife[k] >> 1) & 1)) | ((SL_SHOT - 8) << 10), S8)
}

/** Whether flare `k` burns, and which flare missile `k` chases (for the tests). */
export function flareLit(k: u16): bool {
  return fLife[k] !== 0
}

export function missileFlare(k: u16): u16 {
  return mFlare[k]
}

/* ---------------- the seeker ---------------- */

/** Frames the seeker has held the enemy; locked once it has held it long enough. */
export let lockT: u16 = 0
export let locked: bool = false
export const LOCK_FRAMES = 50

/** Whether the enemy is where the seeker can see it: ahead, within its cone, in range. */
export function inSeeker(): bool {
  if (!eAlive || eBZ <= 0 || eDist > 5600) return false
  const cone = (eBZ >> 2) + (eBZ >> 4)
  return abs16(eBX) < cone && abs16(eBY) < cone
}

/** A frame of the seeker: answers 1 the frame it locks, 2 while tracking, 0 otherwise. */
export function seekerStep(): u16 {
  if (!inSeeker()) {
    lockT = 0
    locked = false
    return 0
  }
  if (locked) return 3
  lockT++
  if (lockT >= LOCK_FRAMES) {
    locked = true
    return 1
  }
  return 2
}

/* ---------------- what the effects module draws ---------------- */

import { aiDodge, aiEvading } from './ai.e16'
import { sfxLaunch } from './audio.e16'
import { boomAt, launchAt, puffAt } from './fx.e16'
