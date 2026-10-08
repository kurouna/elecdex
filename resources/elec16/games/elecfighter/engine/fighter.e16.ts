// ELECFIGHTER's fighters (docs/elec16-elecfighter-design.md 7.1, 7.3, 7.4): the state machine,
// gravity, motion, the walls (and the push they give back, 7.4), the most two may stand apart,
// the push of their bodies, the dashes (6.2) and a throw's start (7.9). A
// fighter is index 0 (P1) or 1 (P2) into arrays of two; everything it does is its slot's
// tables' (data.e16.ts), never a branch on the slot. Positions and speeds are 1/16 points;
// `fZ` and `fVZ` are kept and never written (the game is X-Y, design 7.1).
import { type bool, div, i16, u16, words, wrap16 } from '../../../../../src/shared/e16c/builtins'
import {
  artHold,
  boxPose,
  bx,
  F_ANTIAIR,
  F_CHAIN,
  K_HEAVY,
  K_KICK,
  M_ACTIVE,
  M_FLAGS,
  M_INVUL,
  M_KIND,
  M_POSE,
  M_RECOVERY,
  M_STARTUP,
  MOVES,
  MV_THROW,
  mvAt,
  P_BACK_F,
  P_BACK_V,
  P_DASH_F,
  P_DASH_V,
  P_GRAVITY,
  P_JUMP,
  P_JUMP_B,
  P_JUMP_F,
  P_LIFE,
  P_THROW,
  P_WALK_B,
  P_WALK_F,
  POSE_W,
  poseLoad,
  prAt,
} from './data.e16'
import {
  buffered,
  consume,
  heldNow,
  I_ATTACKS,
  I_BACK,
  I_DOWN,
  I_FWD,
  I_HK,
  I_HP,
  I_LP,
  I_UP,
  pressedBefore,
  pressNow,
} from './input.e16'

/** The states (design 7.3). */
export const ST_STAND = 0
export const ST_CROUCH = 1
export const ST_PREJUMP = 2
export const ST_JUMP = 3
export const ST_LAND = 4
export const ST_ATTACK = 5
export const ST_HIT = 6
export const ST_GUARD = 7
export const ST_DOWN = 8
export const ST_WAKE = 9
export const ST_DEAD = 10
export const ST_THROW = 11
export const ST_THROWN = 12
export const ST_DASH = 13
export const ST_BACKDASH = 14

/** The common poses (poses.txt rows 0-11); a move's are its row's `pose` and the two after. */
const PO_STAND = 0
const PO_CROUCH = 1
const PO_PREJUMP = 2
const PO_JUMP = 3
const PO_LAND = 4
const PO_HIT = 5
const PO_GUARD = 7
const PO_DOWN = 9
const PO_WAKE = 10
const PO_FALLING = 11
/** The throw's active pose: the thrower holding. */
const PO_THROWING = 49
/**
 * Rows that change only the picture (and its boxes): the walk's four steps, the jump coming down,
 * the dashes, held by a throw, the round won, a breath.
 */
const PO_WALK = 51
const PO_JUMP_FALL = 55
const PO_DASH = 56
const PO_BACKDASH = 57
const PO_THROWN = 58
const PO_WIN = 59
const PO_IDLE = 60

const PREJUMP_F = 3
const LAND_F = 3
const DOWN_F = 36
const WAKE_F = 12
/** Frames past Wake a fighter cannot be thrown (design 7.3); a backdash's first, the same. */
const WAKE_THROW_INVUL = 2
const BACKDASH_THROW_INVUL = 6
/** Two presses of a direction this many frames apart at most make a dash (design 6.2). */
export const DASH_GAP = 10
/** The line, in points above the feet, an anti-air's upper body is out of reach above. */
const UPPER = 28
/** The chain's window past the light's active frames (design 7.8). */
const CHAIN_LATE = 4
/** A push's slowing, 1/16 points a frame each frame. */
const FRICTION = 4

/** The world (design 4.2), in points. */
export const RING_L = 32
export const RING_R = 480
export const MAX_APART = 256
const START_APART = 100
const START_HALF = START_APART >> 1

/* ---------------- each fighter ---------------- */

export const fX = words(2)
export const fY = words(2)
export const fZ = words(2)
export const fVX = words(2)
export const fVY = words(2)
export const fVZ = words(2)
/** 1 facing right (towards larger x), 0 facing left. */
export const fFace = words(2)
export const fState = words(2)
export const fStateT = words(2)
export const fLife = words(2)
export const fMove = words(2)
export const fMoveF = words(2)
/** The move now out has struck (hit or been guarded): it strikes once (design 7.8). */
export const fHitDone = words(2)
export const fCombo = words(2)
export const fComboMax = words(2)
export const fStun = words(2)
/** Crouching while struck or guarding; in the air; the one jump attack spent; knocked down. */
export const fCrouch = words(2)
export const fAir = words(2)
export const fAirUsed = words(2)
export const fKnock = words(2)
/** Which way the jump goes: 0 up, 1 forward, 2 back. */
const fJump = words(2)
/** Frames still safe from throws after waking; a throw's direction (1 back). */
export const fThrowInv = words(2)
export const fThrowBack = words(2)
/** A push (a hit's or a guard's), 1/16 points a frame, signed; it slows by friction. */
export const fPush = words(2)
export const fSlot = words(2)
export const fPose = words(2)
/**
 * The round won (the picture's side: set by the look as a round ends), and a frame count for the
 * breath.
 */
export const fWin = words(2)
const fBreath = words(2)
/** Where each stood as the frame began: the other's state machine reads it (design 8). */
export const was = words(2)
/** Where each stood before this frame's motion, to tell who moved apart. */
const before = words(2)

/** Fighter `i` new for a round: at its side of the middle, its life whole. */
export function fighterReset(i: u16): void {
  const left = i === 0
  fX[i] = (left ? 256 - START_HALF : 256 + START_HALF) * 16
  fY[i] = 0
  fVX[i] = 0
  fVY[i] = 0
  fFace[i] = left ? 1 : 0
  fState[i] = ST_STAND
  fStateT[i] = 0
  fLife[i] = prAt(i, P_LIFE)
  fMove[i] = 0
  fMoveF[i] = 0
  fHitDone[i] = 0
  fCombo[i] = 0
  fStun[i] = 0
  fCrouch[i] = 0
  fAir[i] = 0
  fAirUsed[i] = 0
  fKnock[i] = 0
  fPush[i] = 0
  fThrowInv[i] = 0
  fWin[i] = 0
  fBreath[i] = 0
  fPose[i] = PO_STAND
  boxPose[i] = 0xffff
  artHold[i] = 0
  poseLoad(i, fSlot[i], PO_STAND)
}

/** -1 or 1 as fighter `i` faces. */
export function faceSign(i: u16): i16 {
  return fFace[i] !== 0 ? 1 : -1
}

/**
 * Fighter `i`'s place in whole points, rounded back from the way it faces (down facing right, up
 * facing left), so a mirrored scene has mirrored points: rounded down on both sides, the one on
 * the right stood up to a point nearer than its mirror image, and a reach could land on one side
 * and not the other (design 7.8). Boxes, the picture and the CPU's eyes all read it.
 */
export function pointX(i: u16): u16 {
  return fFace[i] !== 0 ? fX[i] >> 4 : (fX[i] + 15) >> 4
}

export function enter(i: u16, st: u16): void {
  fState[i] = st
  fStateT[i] = 0
}

/** The frame begins: where each stands, for the other's state machine. */
export function fightersSeen(): void {
  was[0] = fX[0]
  was[1] = fX[1]
}

/* ---------------- the state machine (design 7.3) ---------------- */

/**
 * Fighter `i`'s frame: its stun and its move's frame on, then (if it may act) its buttons,
 * then gravity. It reads the other only as the frame began (`was`).
 */
export function fighterStep(i: u16): void {
  if (fThrowInv[i] > 0) fThrowInv[i]--
  const st = fState[i]
  if (st === ST_THROW || st === ST_THROWN) {
    poseSet(i)
    return
  }
  if (st === ST_ATTACK) attackStep(i)
  else if (st === ST_DASH || st === ST_BACKDASH) dashStep(i, st)
  else if (st === ST_HIT || st === ST_GUARD) stunStep(i)
  else if (st === ST_PREJUMP) prejumpStep(i)
  else if (st === ST_JUMP) jumpStep(i)
  else timedStep(i, st)
  const now = fState[i]
  if (now === ST_STAND || now === ST_CROUCH) freeStep(i)
  if (fAir[i] !== 0) fVY[i] = wrap16(fVY[i] - prAt(i, P_GRAVITY))
  poseSet(i)
}

/** Land, Down and Wake: a count of frames, then the next. */
function timedStep(i: u16, st: u16): void {
  if (st !== ST_LAND && st !== ST_DOWN && st !== ST_WAKE) return
  fStateT[i]++
  const t = fStateT[i]
  if (st === ST_LAND && t >= LAND_F) enter(i, ST_STAND)
  if (st === ST_DOWN && t >= DOWN_F) enter(i, fLife[i] === 0 ? ST_DEAD : ST_WAKE)
  if (st === ST_WAKE && t >= WAKE_F) {
    enter(i, ST_STAND)
    fThrowInv[i] = WAKE_THROW_INVUL
  }
}

/** Standing or crouching, free: face the other, then strike, jump, crouch or walk. */
function freeStep(i: u16): void {
  faceOther(i)
  fVX[i] = 0
  fCombo[i] = 0
  const held = heldNow(i)
  const crouch = (held & I_DOWN) !== 0
  if (attackTry(i, crouch ? 1 : 0)) return
  if (!crouch && dashTry(i)) return
  if ((held & I_UP) !== 0) {
    enter(i, ST_PREJUMP)
    fJump[i] = (held & I_FWD) !== 0 ? 1 : (held & I_BACK) !== 0 ? 2 : 0
    return
  }
  if (crouch) {
    if (fState[i] !== ST_CROUCH) enter(i, ST_CROUCH)
    return
  }
  if (fState[i] !== ST_STAND) enter(i, ST_STAND)
  walk(i, held)
}

/** The facing rule (design 7.3): on the ground and free, towards the other as the frame began. */
function faceOther(i: u16): void {
  if (was[1 - i] > fX[i]) fFace[i] = 1
  else if (was[1 - i] < fX[i]) fFace[i] = 0
}

/** Walking forward or back at the slot's speeds. */
function walk(i: u16, held: u16): void {
  const s = faceSign(i)
  if ((held & I_FWD) !== 0) fVX[i] = u16(s * i16(prAt(i, P_WALK_F)))
  else if ((held & I_BACK) !== 0) fVX[i] = u16(-s * i16(prAt(i, P_WALK_B)))
}

/**
 * A press waiting in the buffer starts a move of posture `posture` (0 standing, 1 crouching,
 * 2 in the air): the heavy before the light, the punch before the kick (design 6.2).
 */
function attackTry(i: u16, posture: u16): bool {
  const b = buffered(i, I_ATTACKS)
  if (b === 0) return false
  if (posture === 0 && (b & I_HP) !== 0 && throwTry(i)) return true
  let col: u16 = 0
  if ((b & I_HP) !== 0) col = 1
  else if ((b & I_HK) !== 0) col = 3
  else if ((b & I_LP) !== 0) col = 0
  else col = 2
  consume(i, I_ATTACKS)
  moveStart(i, posture * 4 + col)
  return true
}

/**
 * The throw (design 7.9): the heavy punch with forward or back held, near the other and both on
 * the ground. Whether it takes hold is judged in its active frames (hit.e16.ts); out of range
 * the press is the heavy punch.
 */
function throwTry(i: u16): bool {
  const held = heldNow(i)
  if ((held & (I_FWD | I_BACK)) === 0) return false
  const d = 1 - i
  if (fY[d] !== 0 || fY[i] !== 0) return false
  if (throwGap(i, was[i], was[d]) > prAt(i, P_THROW)) return false
  consume(i, I_ATTACKS)
  fThrowBack[i] = (held & I_FWD) !== 0 ? 0 : 1
  moveStart(i, MV_THROW)
  return true
}

/** From thrower `a` at `xa` to the near edge of the other at `xd` (1/16 points), in points. */
export function throwGap(a: u16, xa: u16, xd: u16): u16 {
  const dx = (xa > xd ? xa - xd : xd - xa) >> 4
  const h = half(1 - a)
  return dx > h ? dx - h : 0
}

/**
 * A dash (design 6.2): forward pressed now and once more within 10 frames before, or back so;
 * only the directions are read, so a light pressed again is never one.
 */
function dashTry(i: u16): bool {
  const now = pressNow(i)
  const s = faceSign(i)
  if ((now & I_FWD) !== 0 && pressedBefore(i, I_FWD, DASH_GAP)) {
    consume(i, I_FWD | I_BACK)
    enter(i, ST_DASH)
    fVX[i] = u16(s * i16(prAt(i, P_DASH_V)))
    return true
  }
  if ((now & I_BACK) !== 0 && pressedBefore(i, I_BACK, DASH_GAP)) {
    consume(i, I_FWD | I_BACK)
    enter(i, ST_BACKDASH)
    fVX[i] = u16(-s * i16(prAt(i, P_BACK_V)))
    return true
  }
  return false
}

/** A dash's frames at its speed (no guard, no move), then standing. */
function dashStep(i: u16, st: u16): void {
  fStateT[i]++
  const fwd = st === ST_DASH
  if (fStateT[i] >= prAt(i, fwd ? P_DASH_F : P_BACK_F)) {
    fVX[i] = 0
    enter(i, ST_STAND)
    return
  }
  const s = faceSign(i)
  fVX[i] = fwd ? u16(s * i16(prAt(i, P_DASH_V))) : u16(-s * i16(prAt(i, P_BACK_V)))
}

/** Fighter `d` cannot be thrown: waking, just woken, or in a backdash's first frames. */
export function throwInvul(d: u16): bool {
  const st = fState[d]
  if (st === ST_WAKE || fThrowInv[d] > 0) return true
  return st === ST_BACKDASH && fStateT[d] < BACKDASH_THROW_INVUL
}

/**
 * Fighter `d` cannot be struck at all: down or waking (design 7.3), or falling from a hit in the
 * air - knocked down already, it takes no follow-up until it has lain and stood (7.8).
 */
export function strikeInvul(d: u16): bool {
  const st = fState[d]
  if (fKnock[d] !== 0) return true
  return st === ST_DOWN || st === ST_WAKE || st === ST_DEAD
}

/**
 * Whether a hurt box of fighter `d` whose bottom is at `bottom` (world points) is out of reach:
 * an anti-air's upper body, in the frames of the table's invul column (from | to << 8), above
 * the UPPER line (design 7.7).
 */
export function upperSafe(d: u16, bottom: i16): bool {
  if (fState[d] !== ST_ATTACK) return false
  const m = fMove[d]
  if ((mvAt(d, m, M_FLAGS) & F_ANTIAIR) === 0) return false
  const v = mvAt(d, m, M_INVUL)
  const f = fMoveF[d]
  if (f < (v & 255) || f > v >> 8) return false
  return bottom - i16(fY[d] >> 4) >= UPPER
}

/** Fighter `i` begins move `m`: its first frame is this one. */
export function moveStart(i: u16, m: u16): void {
  enter(i, ST_ATTACK)
  fMove[i] = m
  fMoveF[i] = 1
  fHitDone[i] = 0
  if (fAir[i] === 0) fVX[i] = 0
  else fAirUsed[i] = 1
}

/** A move's frames: startup, active from `startup`, recovery; then free again. */
function attackStep(i: u16): void {
  fMoveF[i]++
  const m = fMove[i]
  const total = mvAt(i, m, M_STARTUP) + mvAt(i, m, M_ACTIVE) + mvAt(i, m, M_RECOVERY) - 1
  if (fMoveF[i] > total) {
    if (fAir[i] !== 0) enter(i, ST_JUMP)
    else enter(i, (heldNow(i) & I_DOWN) !== 0 ? ST_CROUCH : ST_STAND)
    return
  }
  chainTry(i, m)
}

/**
 * The chain (design 7.8): a light that has struck, hit or guarded, in its active frames or the
 * first four of its recovery, gives way to the heavy of its kind and posture if it is pressed.
 */
function chainTry(i: u16, m: u16): void {
  if (fHitDone[i] === 0 || (mvAt(i, m, M_FLAGS) & F_CHAIN) === 0) return
  const s = mvAt(i, m, M_STARTUP)
  const f = fMoveF[i]
  if (f < s || f >= s + mvAt(i, m, M_ACTIVE) + CHAIN_LATE) return
  const kind = mvAt(i, m, M_KIND)
  const button = (kind & K_KICK) !== 0 ? I_HK : I_HP
  if (buffered(i, button) === 0) return
  let h: u16 = 0
  while (h < MOVES - 1) {
    if (mvAt(i, h, M_KIND) === (kind | K_HEAVY)) {
      consume(i, I_ATTACKS)
      moveStart(i, h)
      return
    }
    h++
  }
}

/** Struck or guarding: the stun runs down; then free, or still falling if knocked down. */
function stunStep(i: u16): void {
  if (fStun[i] > 0) {
    fStun[i]--
    if (fState[i] === ST_GUARD) fCrouch[i] = (heldNow(i) & I_DOWN) !== 0 ? 1 : 0
    return
  }
  if (fKnock[i] !== 0) return
  enter(i, fCrouch[i] !== 0 ? ST_CROUCH : ST_STAND)
}

/** Three frames crouched, then into the air. */
function prejumpStep(i: u16): void {
  fStateT[i]++
  if (fStateT[i] < PREJUMP_F) return
  const s = faceSign(i)
  fAir[i] = 1
  fAirUsed[i] = 0
  fVY[i] = prAt(i, P_JUMP)
  fVX[i] = 0
  if (fJump[i] === 1) fVX[i] = u16(s * i16(prAt(i, P_JUMP_F)))
  if (fJump[i] === 2) fVX[i] = u16(-s * i16(prAt(i, P_JUMP_B)))
  enter(i, ST_JUMP)
}

/** In the air: one attack a jump. */
function jumpStep(i: u16): void {
  if (fAirUsed[i] === 0) attackTry(i, 2)
}

/** The pose for the state, its boxes and picture read when it changes. */
function poseSet(i: u16): void {
  const st = fState[i]
  let p: u16 = PO_STAND
  if (st === ST_ATTACK) p = attackPose(i)
  else if (st === ST_STAND) p = standPose(i)
  else if (st === ST_JUMP) p = i16(fVY[i]) > 0 ? PO_JUMP : PO_JUMP_FALL
  else if (st === ST_HIT) p = fKnock[i] !== 0 ? PO_FALLING : PO_HIT + fCrouch[i]
  else if (st === ST_GUARD) p = PO_GUARD + fCrouch[i]
  else p = statePose(st)
  fPose[i] = p
  poseLoad(i, fSlot[i], p)
}

/** The pose of a state that has only one. */
function statePose(st: u16): u16 {
  if (st === ST_CROUCH) return PO_CROUCH
  if (st === ST_PREJUMP) return PO_PREJUMP
  if (st === ST_LAND) return PO_LAND
  if (st === ST_DOWN || st === ST_DEAD) return PO_DOWN
  if (st === ST_WAKE) return PO_WAKE
  if (st === ST_THROW) return PO_THROWING
  if (st === ST_THROWN) return PO_THROWN
  if (st === ST_DASH) return PO_DASH
  if (st === ST_BACKDASH) return PO_BACKDASH
  return PO_STAND
}

/**
 * Standing: the round won, a walk's step by how far it has gone (8 points a step, counted the
 * way it faces, so walking back plays the steps backwards), or a breath every 32 frames.
 */
function standPose(i: u16): u16 {
  if (fWin[i] !== 0) return PO_WIN
  if (fVX[i] !== 0) {
    // Counted from the way it faces, rounded back as `pointX` is, so a mirrored walk steps alike.
    const s = fFace[i] !== 0 ? fX[i] >> 7 : wrap16(0 - ((fX[i] + 127) >> 7))
    return PO_WALK + (s & 3)
  }
  fBreath[i]++
  return (fBreath[i] & 32) !== 0 ? PO_IDLE : PO_STAND
}

function attackPose(i: u16): u16 {
  const m = fMove[i]
  const s = mvAt(i, m, M_STARTUP)
  const f = fMoveF[i]
  const base = mvAt(i, m, M_POSE)
  if (f < s) return base
  if (f < s + mvAt(i, m, M_ACTIVE)) return base + 1
  return base + 2
}

/** Whether fighter `i`'s move is in its startup (a hit there is a counter hit, design 7.8). */
export function inStartup(i: u16): bool {
  return fState[i] === ST_ATTACK && fMoveF[i] < mvAt(i, fMove[i], M_STARTUP)
}

/** Whether fighter `i`'s move is in its active frames. */
export function inActive(i: u16): bool {
  if (fState[i] !== ST_ATTACK) return false
  const s = mvAt(i, fMove[i], M_STARTUP)
  const f = fMoveF[i]
  return f >= s && f < s + mvAt(i, fMove[i], M_ACTIVE)
}

/* ---------------- motion (design 7.4) ---------------- */

/** Fighter `i` moves: its walk or jump, its push slowing, its fall; it lands. */
export function motion(i: u16): void {
  before[i] = fX[i]
  const p = i16(fPush[i])
  fX[i] = u16(i16(fX[i]) + i16(fVX[i]) + p)
  if (p > FRICTION) fPush[i] = u16(p - FRICTION)
  else if (p < -FRICTION) fPush[i] = u16(p + FRICTION)
  else fPush[i] = 0
  if (fAir[i] === 0) return
  const y = i16(fY[i]) + i16(fVY[i])
  if (y > 0) {
    fY[i] = u16(y)
    return
  }
  land(i)
}

function land(i: u16): void {
  fY[i] = 0
  fVY[i] = 0
  fVX[i] = 0
  fAir[i] = 0
  fAirUsed[i] = 0
  const st = fState[i]
  if (st === ST_HIT && fKnock[i] !== 0) {
    fKnock[i] = 0
    enter(i, ST_DOWN)
  } else if (st === ST_JUMP || st === ST_ATTACK) enter(i, ST_LAND)
}

/** Half fighter `i`'s body, in points (its pose's body box). */
export function half(i: u16): u16 {
  return bx[i * POSE_W + 2] >> 1
}

/**
 * Fighter `i` kept inside the walls (design 4.2): its body never past 32 or 480. A struck or
 * guarding fighter the wall stops gives the rest of its push to the other, the striker (7.4):
 * at the wall, a blow pushes back whoever struck it.
 */
export function wall(i: u16): void {
  const h = half(i)
  const lo = (RING_L + h) * 16
  const hi = (RING_R - h) * 16
  const p = i16(fPush[i])
  let into = false
  if (fX[i] < lo) {
    fX[i] = lo
    into = p < 0
  }
  if (fX[i] > hi) {
    fX[i] = hi
    into = p > 0
  }
  if (!into || (fState[i] !== ST_HIT && fState[i] !== ST_GUARD)) return
  fPush[1 - i] = u16(-p)
  fPush[i] = 0
}

/**
 * The two never more than 256 points apart (design 4.2): whoever moved away gives the excess
 * back, both alike when both did (their halves rounded up, so it is the same either side).
 */
export function apart(): void {
  const l = fX[0] <= fX[1] ? 0 : 1
  const r = 1 - l
  const gap = fX[r] - fX[l]
  if (gap <= MAX_APART * 16) return
  const excess = gap - MAX_APART * 16
  const outL = before[l] > fX[l] ? before[l] - fX[l] : 0
  const outR = fX[r] > before[r] ? fX[r] - before[r] : 0
  let cutL: u16 = 0
  let cutR: u16 = 0
  if (outL > 0 && outR > 0) {
    cutL = (excess + 1) >> 1
    cutR = cutL
  } else if (outL > 0) cutL = excess
  else cutR = excess
  fX[l] = fX[l] + cutL
  fX[r] = fX[r] - cutR
}

/**
 * Bodies that overlap on the ground part (design 7.4), half each (rounded up, alike either
 * side); at a wall the other takes the rest. In the air they pass: they meet when they land.
 */
export function bodies(): void {
  if (fAir[0] !== 0 || fAir[1] !== 0) return
  const l = leftOne()
  const r = 1 - l
  const reach = (half(l) + half(r)) * 16
  const gap = fX[r] - fX[l]
  if (gap >= reach) return
  const each = (reach - gap + 1) >> 1
  fX[l] = wrap16(fX[l] - each)
  fX[r] = fX[r] + each
  wall(l)
  wall(r)
  const still = fX[r] - fX[l]
  if (still >= reach) return
  const left = reach - still
  if (fX[l] <= (RING_L + half(l)) * 16) fX[r] = fX[r] + left
  else fX[l] = fX[l] - left
}

/** Which is on the left: by place, then (one on the other) by which way each faces. */
function leftOne(): u16 {
  if (fX[0] < fX[1]) return 0
  if (fX[1] < fX[0]) return 1
  return fFace[1] !== 0 && fFace[0] === 0 ? 1 : 0
}

/** The most combo each has suffered, kept for the record. */
export function comboNote(d: u16): void {
  if (fCombo[d] > fComboMax[d]) fComboMax[d] = fCombo[d]
}

/** A push of `push` (the table's) on fighter `d` of weight w, away from the striker's face. */
export function pushOf(push: u16, weight: u16, towardsRight: bool): u16 {
  const v = div(push * 100, weight)
  return towardsRight ? v : wrap16(0 - v)
}

/** Fighter `i` free to act (standing or crouching). */
export function free(i: u16): bool {
  return fState[i] === ST_STAND || fState[i] === ST_CROUCH
}

/** Fighter `i` holds back (a guard, if it is free). */
export function holdsBack(i: u16): bool {
  return (heldNow(i) & I_BACK) !== 0
}
