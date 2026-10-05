// ELECAIRCOMBAT's aces (docs/elec16-elecaircombat.md section 7): how the enemy flies and fights,
// in cartridge bank 1 (it runs once a frame, through far_call). It steers as a pilot does -
// rolls until what it wants is above its canopy, then pulls - toward a goal its aiState picks:
// the player and a lead, a break turn, a zoom climb and the hammerhead out of it, running out
// to turn back head on, or away from the sea. Every ace shares that; what each one does with
// it is in its row of the tables below (`aceFlags` and its numbers), not in the code's
// branches: GANNET careful, MISTRAL vertical, CINDER slow and scissoring, ORACLE long-range
// and head on, NOCTURNE feinting and punishing an overshoot.
import { type bool, i16, idiv, type u16, words } from '../../../../src/shared/e16c/builtins'
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
  eSpeed,
} from './bandit.e16'
import { pAlt, pVel } from './flight.e16'
import { abs16, dotq, ONE, V_EF, V_ER, V_EU, V_REL, V_T2, va, vget, vmax, vset } from './math.e16'

const PURSUE = 0
const BREAK = 1
const ZOOM = 2
const EXTEND = 3
const FLOOR = 4
/** Out of the top of a zoom: over and down onto the player (a hammerhead or a wingover). */
const HAMMER = 5

/* ---------------- each ace's way of fighting ---------------- */

/** Its breaks always go one way, never reversed (GANNET). */
const F_ONEWAY = 1
/** It answers the player's missile only half the time (GANNET). */
const F_HALFMSL = 2
/** It answers a threat with a zoom climb, then a hammerhead down; climbs for height when far (MISTRAL). */
const F_ZOOM = 4
/** It brakes to turn inside, and scissors - breaks reversed on a beat - with the player behind (CINDER). */
const F_BRAKE = 8
/** It runs out to come back head on, and fights the gun duel of a head-on pass from further (ORACLE). */
const F_HEADON = 16
/** Each break starts the wrong way: a feint, then the real one (NOCTURNE). */
const F_FEINT = 32
/** The moment the player overshoots, it rolls in behind - not at its next thought (NOCTURNE). */
const F_PUNISH = 64

const aceFlags = words(5)
/** Missiles and flare pairs carried, its missiles' lock range (units), its brake (sixteenths). */
export const aceMissiles = words(5)
export const aceFlares = words(5)
const aceLockRange = words(5)
const aceBrake = words(5)
/** Its missiles' speed, tenths of the player's (off the rail, gaining, at the top). */
const aceMslTenths = words(5)

/** The aces' rows: called once, at the game's start. */
export function aiInit(): void {
  aceFlags[0] = F_ONEWAY | F_HALFMSL
  aceFlags[1] = F_ZOOM
  aceFlags[2] = F_BRAKE
  aceFlags[3] = F_HEADON
  aceFlags[4] = F_FEINT | F_PUNISH
  aceMissiles[0] = 8
  aceMissiles[1] = 12
  aceMissiles[2] = 16
  aceMissiles[3] = 20
  aceMissiles[4] = 24
  aceFlares[0] = 4
  aceFlares[1] = 8
  aceFlares[2] = 10
  aceFlares[3] = 12
  aceFlares[4] = 14
  aceLockRange[0] = 5200
  aceLockRange[1] = 5200
  aceLockRange[2] = 5200
  aceLockRange[3] = 8000
  aceLockRange[4] = 6000
  aceBrake[0] = 80
  aceBrake[1] = 80
  aceBrake[2] = 150
  aceBrake[3] = 80
  aceBrake[4] = 110
  aceMslTenths[0] = 10
  aceMslTenths[1] = 10
  aceMslTenths[2] = 10
  aceMslTenths[3] = 11
  aceMslTenths[4] = 11
}

function has(f: u16): bool {
  return (aceFlags[ace] & f) !== 0
}

/* ---------------- its state ---------------- */

export let aiState: u16 = PURSUE
export let aiStateT: u16 = 0
export let aiSide: i16 = 1
export let aiThinkT: u16 = 0
let aiGunT: u16 = 0
export let aiLockT: u16 = 0
export let aiMslCool: u16 = 0
export let aiMissiles: u16 = 0
export let aiFlares: u16 = 0
let aiFlareCool: u16 = 0
/** Frames until a feinted break turns the real way (0: no feint pending). */
let aiFeintT: u16 = 0
/** Frames until a scissors reverses again. */
let aiScissorT: u16 = 0
/** While it breaks or zooms against a missile, and its chance (in 100) to turn inside one. */
export let aiEvading: bool = false
export let aiDodge: u16 = 25

/** A sortie's start: calm, with its missiles and flares. */
export function aiNew(): void {
  aiState = PURSUE
  aiStateT = 0
  aiThinkT = 30
  aiGunT = 0
  aiLockT = 0
  aiMslCool = 400
  aiMissiles = aceMissiles[ace]
  aiFlares = aceFlares[ace]
  aiFlareCool = 0
  aiFeintT = 0
  aiScissorT = 0
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
  every()
  aiEvading = aiState === BREAK || aiState === ZOOM
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

/** Whether the player is in front of it, within its forward cone, and close. */
function playerAhead(range: u16): bool {
  return aiTZ > 0 && eDist < range && abs16(aiTX) + abs16(aiTY) < aiTZ
}

/** Nose to nose: the player ahead of it, and it ahead of the player, in each other's sights. */
function headOn(): bool {
  if (aiTZ <= 0 || eBZ <= 0) return false
  const cone = eBZ >> 2
  return abs16(eBX) < cone && abs16(eBY) < cone && abs16(aiTX) + abs16(aiTY) < aiTZ >> 1
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
  if (threatDist < 2600 && aiState !== BREAK && aiState !== ZOOM && missileSeen()) {
    evade()
    return
  }
  if (aiStateT > 0) return
  if (onItsTail()) {
    tailChoice()
    return
  }
  if (eDist < 900 && aiTZ < 0) to(EXTEND, extendTime())
  else if (has(F_ZOOM) && eDist > 3400 && enemyAlt() < pAlt + 900) to(ZOOM, 90)
  else to(PURSUE, 60)
}

/** Whether it reacts to the missile this time: the careful one only half the time. */
function missileSeen(): bool {
  return !has(F_HALFMSL) || randBelow(2) === 0
}

/** Against a missile: up for the climber (with height to spare), a break for the rest. */
function evade(): void {
  if (has(F_ZOOM) && eSpeed > eCruise - 40) to(ZOOM, 80)
  else breakTurn()
}

/** Shaken off its tail: each ace's answer. */
function tailChoice(): void {
  if (has(F_ZOOM)) {
    to(ZOOM, 90)
    return
  }
  if (has(F_HEADON) && eDist > 1800) {
    // Too far to be shot: run out and come back nose on.
    to(EXTEND, 150)
    return
  }
  const r = randBelow(8)
  if (r < 6 || has(F_ONEWAY) || has(F_BRAKE)) breakTurn()
  else to(EXTEND, 120)
}

/** How long it runs out after a merge: the head-on fighter goes far enough to turn and meet you. */
function extendTime(): u16 {
  return has(F_HEADON) ? 170 : 100 + randBelow(60)
}

function breakTurn(): void {
  // The one-way pilot keeps its side; the others reverse a break they are already in.
  if (aiState === BREAK) aiSide = has(F_ONEWAY) ? aiSide : -aiSide
  else aiSide = (rand() & 1) === 0 ? -1 : 1
  to(BREAK, 50 + randBelow(50) - ace * 4)
  // A feint: the first frames go the wrong way.
  aiFeintT = has(F_FEINT) ? 14 + randBelow(8) : 0
  aiScissorT = 36 + randBelow(10)
}

function to(s: u16, frames: u16): void {
  aiState = s
  aiStateT = frames
}

/** What is weighed every frame, not only when it thinks: the feint, the scissors, the climb's top, an overshoot. */
function every(): void {
  if (aiState === BREAK) breakBeat()
  if (aiState === ZOOM && zoomTop()) to(HAMMER, 80)
  if (aiState === HAMMER && aiStateT === 0) to(PURSUE, 60)
  // The player has shot past: the punisher is on it at once.
  if (has(F_PUNISH) && aiState !== PURSUE && aiState !== FLOOR && playerAhead(1600)) {
    to(PURSUE, 60)
    aiThinkT = 20
  }
}

/** A break's beat: the feint's turn the right way, the scissors' reversals while still chased. */
function breakBeat(): void {
  if (aiFeintT > 0) {
    aiFeintT--
    if (aiFeintT === 0) aiSide = -aiSide
  }
  if (!has(F_BRAKE)) return
  if (aiScissorT > 0) aiScissorT--
  else if (onItsTail()) {
    aiSide = -aiSide
    aiScissorT = 36 + randBelow(10)
    if (aiStateT < 40) aiStateT = 40
  }
}

/** The top of a zoom: nearly upright, or slow, or out of time. */
function zoomTop(): bool {
  return vget(V_EF + 2) > 14000 || eSpeed < eCruise - 110 || aiStateT === 0
}

/** The aiState's goal into V_T2: a direction in the world, any length up to a word. */
function goalOf(): void {
  if (aiState === PURSUE || aiState === HAMMER) leadGoal()
  else if (aiState === BREAK) axisGoal(V_ER, aiSide, ONE >> 2)
  else if (aiState === ZOOM) vset(V_T2, vget(V_EF) >> 3, vget(V_EF + 1) >> 3, 16000)
  else if (aiState === EXTEND) extendGoal()
  else vset(V_T2, vget(V_EF) >> 1, vget(V_EF + 1) >> 1, 16000)
}

/** The player, led by its velocity for the time a round would take (straight at it head on). */
function leadGoal(): void {
  let t = i16(eDist >> 6)
  if (t > 30) t = 30
  if (has(F_HEADON) && headOn()) t = 0
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

/**
 * Away from the player while it runs out; turning back once the time is nearly up - or, for
 * the head-on fighter, once it is far enough to turn and meet the player nose to nose.
 */
function extendGoal(): void {
  if (aiStateT < 40 || (has(F_HEADON) && eDist > 3600)) {
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

/**
 * Faster when far, running or diving out of a hammerhead; slower close behind the player so
 * as not to overshoot - and the braking ace slower still with the player behind it, to make
 * it overshoot.
 */
function speedFor(): i16 {
  const brake = i16(aceBrake[ace])
  if (aiState === EXTEND || aiState === HAMMER || eDist > 4500) return eCruise + 120
  if (aiTZ > 0 && eDist < 900) return eCruise - brake
  if (has(F_BRAKE) && aiTZ < 0 && eDist < 1800) return eCruise - brake
  return eCruise
}

/* ---------------- firing ---------------- */

function weapons(): void {
  if (aiGunT > 0) aiGunT--
  if (aiMslCool > 0) aiMslCool--
  if (aiFlareCool > 0) aiFlareCool--
  if (aiTZ > 0) aimAndFire()
  else aiLockT = 0
  if (threatDist < 1800 && aiFlareCool === 0 && aiFlares > 0) {
    aiFlareCool = 150 - ace * 15
    aiFlares--
    enemyFlares(40 + ace * 30)
  }
  // A crippled ace runs.
  if (eHP * 4 < eHPMax && aiState === PURSUE && randBelow(64) === 0) to(EXTEND, 90)
}

/** The gun with the player in its sights and near; a missile after holding a lock. */
function aimAndFire(): void {
  const off = abs16(aiTX) + abs16(aiTY)
  // The head-on fighter opens fire from further, and tighter, on a head-on pass.
  const duel = has(F_HEADON) && headOn()
  const range: u16 = duel ? 2400 : 1700
  if (off * 10 < aiTZ && eDist < range && aiGunT === 0) {
    aiGunT = 5 - (ace >> 1)
    const spread: u16 = 225 - ace * 35
    enemyRound(duel ? spread >> 1 : spread)
  }
  if (off * 3 < aiTZ && eDist > 1000 && eDist < aceLockRange[ace]) aiLockT++
  else aiLockT = 0
  if (
    aiLockT > 130 - ace * 15 &&
    aiMslCool === 0 &&
    aiMissiles > 0 &&
    enemyMissile(aceMslTenths[ace])
  ) {
    aiMissiles--
    aiMslCool = 420 - ace * 40
    aiLockT = 0
  }
}
