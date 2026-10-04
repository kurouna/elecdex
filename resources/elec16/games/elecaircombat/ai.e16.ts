// ELECAIRCOMBAT's aces (docs/elec16-elecaircombat.md section 5): how the enemy flies and fights,
// in cartridge bank 1 (it runs once a frame, through far_call). It steers as a pilot does -
// rolls until what it wants is above its canopy, then pulls - toward a goal its aiState picks:
// the player and a lead, a break turn and its reversal, a zoom climb, running out to turn back
// head on, or away from the sea. It fires its gun with the player in its sights, and a
// missile after holding a lock; the later aces react sooner, turn harder, and drop flares.
import { type bool, i16, idiv, type u16 } from '../../../../src/shared/e16c/builtins'
import { aim, rand, randBelow } from '../lib/kit.e16'
import { enemyFlares, enemyMissile, enemyRound, threatDist } from './arms.e16'
import {
  ace,
  aiWants,
  eAlive,
  eBX,
  eBY,
  eBZ,
  eCruise,
  eDist,
  eHP,
  eHPMax,
  ePullMax,
  eRollMax,
} from './bandit.e16'
import { pAlt, pVel } from './flight.e16'
import { abs16, dotq, ONE, V_EF, V_ER, V_EU, V_REL, V_T2, va, vget, vmax, vset } from './math.e16'

const PURSUE = 0
const BREAK = 1
const ZOOM = 2
const EXTEND = 3
const FLOOR = 4

let aiState: u16 = PURSUE
let aiStateT: u16 = 0
let aiSide: i16 = 1
let aiThinkT: u16 = 0
let aiGunT: u16 = 0
let aiLockT: u16 = 0
let aiMslCool: u16 = 0
export let aiMissiles: u16 = 0
let aiFlareCool: u16 = 0
/** While it breaks hard against a missile, and its chance (in 100) to turn inside one. */
export let aiEvading: bool = false
export let aiDodge: u16 = 25

/** A sortie's start: calm, with its missiles. */
export function aiNew(): void {
  aiState = PURSUE
  aiStateT = 0
  aiThinkT = 30
  aiGunT = 0
  aiLockT = 0
  aiMslCool = 400
  aiMissiles = 2 + ace
  aiFlareCool = 0
  aiEvading = false
  aiDodge = 25 + ace * 10
}

/** A frame of the ace: think now and then, steer, fire. */
export function aiStep(): void {
  if (!eAlive) return
  if (aiStateT > 0) aiStateT--
  lookAtPlayer()
  if (aiThinkT > 0) aiThinkT--
  else think()
  aiEvading = aiState === BREAK
  goalOf()
  steer()
  weapons()
}

/* ---------------- what it wants ---------------- */

/** The player seen from the enemy, in its axes: right, up, ahead (units). */
let aiTX: i16 = 0
let aiTY: i16 = 0
let aiTZ: i16 = 0

function lookAtPlayer(): void {
  aiTX = -dotq(va(V_REL), va(V_ER))
  aiTY = -dotq(va(V_REL), va(V_EU))
  aiTZ = -dotq(va(V_REL), va(V_EF))
}

/** Whether the player sits on its tail: behind it, and the enemy in the player's sights. */
function onItsTail(): bool {
  if (aiTZ > 0 || eBZ <= 0 || eDist > 3200) return false
  const cone = eBZ >> 2
  return abs16(eBX) < cone && abs16(eBY) < cone
}

function enemyAlt(): i16 {
  return pAlt + vget(V_REL + 2)
}

/** Picks a aiState, then waits as long as this ace takes to react again. */
function think(): void {
  aiThinkT = 34 - ace * 6 + randBelow(16)
  if (enemyAlt() < 1400 && vget(V_EF + 2) < 4000) {
    to(FLOOR, 90)
    return
  }
  if (threatDist < 2600 && (ace >= 1 || randBelow(2) === 0) && aiState !== BREAK) {
    breakTurn()
    return
  }
  if (aiStateT > 0) return
  if (onItsTail()) {
    tailChoice()
    return
  }
  if (eDist < 700 && aiTZ < 0) to(EXTEND, 100 + randBelow(60))
  else to(PURSUE, 60)
}

/** Shaken off its tail: a break turn, a climb, or (the later aces) a run out to come back. */
function tailChoice(): void {
  const r = randBelow(8)
  if (r < 5 || ace === 0) breakTurn()
  else if (r < 7) to(ZOOM, 70 + randBelow(40))
  else to(EXTEND, 120)
}

function breakTurn(): void {
  // The later aces reverse their break (a scissors); the first keeps turning one way.
  aiSide = ace >= 2 && aiState === BREAK ? -aiSide : (rand() & 1) === 0 ? -1 : 1
  to(BREAK, 50 + randBelow(50) - ace * 4)
}

function to(s: u16, frames: u16): void {
  aiState = s
  aiStateT = frames
}

/** The aiState's goal into V_T2: a direction in the world, any length up to a word. */
function goalOf(): void {
  if (aiState === PURSUE) leadGoal()
  else if (aiState === BREAK) axisGoal(V_ER, aiSide, ONE >> 2)
  else if (aiState === ZOOM) vset(V_T2, vget(V_EF) >> 2, vget(V_EF + 1) >> 2, 12000)
  else if (aiState === EXTEND) extendGoal()
  else vset(V_T2, vget(V_EF) >> 1, vget(V_EF + 1) >> 1, 16000)
}

/** The player, led by its velocity for the time a round would take. */
function leadGoal(): void {
  let t = i16(eDist >> 6)
  if (t > 30) t = 30
  vset(
    V_T2,
    -vget(V_REL) + ((pVel(0) * t) >> 4),
    -vget(V_REL + 1) + ((pVel(1) * t) >> 4),
    -vget(V_REL + 2) + ((pVel(2) * t) >> 4),
  )
}

/** Along one of its own axes (`sign` either way), and up a little. */
function axisGoal(axis: u16, sign: i16, up: i16): void {
  vset(
    V_T2,
    sign * (vget(axis) >> 1) + (vget(V_EF) >> 2),
    sign * (vget(axis + 1) >> 1) + (vget(V_EF + 1) >> 2),
    sign * (vget(axis + 2) >> 1) + up,
  )
}

/** Away from the player while it runs out; turning back once the time is nearly up. */
function extendGoal(): void {
  if (aiStateT < 40) {
    leadGoal()
    return
  }
  vset(V_T2, vget(V_REL) >> 1, vget(V_REL + 1) >> 1, 2000)
}

/* ---------------- flying to it ---------------- */

/** Roll the goal over the canopy, then pull toward it. */
function steer(): void {
  let gx = dotq(va(V_T2), va(V_ER))
  let gy = dotq(va(V_T2), va(V_EU))
  let gz = dotq(va(V_T2), va(V_EF))
  while (vmax(gx, gy, gz) >= 200) {
    gx = gx >> 1
    gy = gy >> 1
    gz = gz >> 1
  }
  let roll: i16 = 0
  let pull: i16 = 0
  const off = abs16(gx) + abs16(gy)
  if (gz > 0 && off * 24 < gz) {
    // Nearly dead ahead: hold the wings, nudge the nose.
    pull = gy * 16
  } else {
    const a = aim(gy, gx)
    const s = i16(a > 127 ? a - 256 : a)
    roll = s * 28
    pull = abs16(s) < 36 ? pullFor(gy, gz) : ePullMax >> 2
  }
  aiWants(clampTo(roll, eRollMax), clampTo(pull, ePullMax), speedFor())
}

function pullFor(gy: i16, gz: i16): i16 {
  if (gz <= gy * 2) return ePullMax
  const q = idiv(gy * 64, gz)
  return clampTo((ePullMax * q) >> 4, ePullMax)
}

function clampTo(v: i16, m: i16): i16 {
  if (v > m) return m
  if (v < -m) return -m
  return v
}

/** Faster when far, or running; slower close behind the player so as not to overshoot. */
function speedFor(): i16 {
  if (aiState === EXTEND || eDist > 4500) return eCruise + 120
  if (aiTZ > 0 && eDist < 900) return eCruise - 80
  return eCruise
}

/* ---------------- firing ---------------- */

function weapons(): void {
  if (aiGunT > 0) aiGunT--
  if (aiMslCool > 0) aiMslCool--
  if (aiFlareCool > 0) aiFlareCool--
  if (aiTZ > 0) aimAndFire()
  else aiLockT = 0
  if (threatDist < 1800 && aiFlareCool === 0 && ace >= 1) {
    aiFlareCool = 150 - ace * 15
    enemyFlares(40 + ace * 30)
  }
  // A crippled ace runs.
  if (eHP * 4 < eHPMax && aiState === PURSUE && randBelow(64) === 0) to(EXTEND, 90)
}

/** The gun with the player in its sights and near; a missile after holding a lock. */
function aimAndFire(): void {
  const off = abs16(aiTX) + abs16(aiTY)
  if (off * 10 < aiTZ && eDist < 1700 && aiGunT === 0) {
    aiGunT = 5 - (ace >> 1)
    enemyRound(225 - ace * 35)
  }
  if (off * 3 < aiTZ && eDist > 1000 && eDist < 5200) aiLockT++
  else aiLockT = 0
  if (aiLockT > 130 - ace * 15 && aiMslCool === 0 && aiMissiles > 0) {
    enemyMissile()
    aiMissiles--
    aiMslCool = 420 - ace * 40
    aiLockT = 0
  }
}
