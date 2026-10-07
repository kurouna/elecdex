// ELECFIGHTER's strikes (docs/elec16-elecfighter-design.md 7.5, 7.6, 7.8): the poses' boxes in
// the world, who strikes whom, and the outcome - guarded by height, hit, counter hit, the combo's
// damage, the stun, the push and the hitstop - and the throws (7.9): their hold, the tech and the
// slam. Both strikes and both throws of a frame are judged first, from the state both fighters
// are in, and only then dealt (a trade is both hit, the same either side; a strike beats a throw
// on the same frame; two throws both break).
import { type bool, i16, u16, words } from '../../../../../src/shared/e16c/builtins'
import {
  BOXES,
  bx,
  F_ANTIAIR,
  F_KNOCKDOWN,
  H_HIGH,
  H_LOW,
  H_THROW,
  M_BLOCKSTUN,
  M_DAMAGE,
  M_FLAGS,
  M_HEIGHT,
  M_HITSTOP,
  M_HITSTUN,
  M_KIND,
  M_PUSH_GUARD,
  M_PUSH_HIT,
  MV_THROW,
  mvAt,
  P_THROW,
  P_WEIGHT,
  POSE_W,
  prAt,
} from './data.e16'
import { LOG_AA, LOG_COUNTER, LOG_TECH, LOG_THROW, logPost } from './draw.e16'
import {
  comboNote,
  enter,
  fAir,
  fCombo,
  fCrouch,
  fFace,
  fHitDone,
  fKnock,
  fLife,
  fMove,
  fPush,
  free,
  fState,
  fStateT,
  fStun,
  fThrowBack,
  fVX,
  fVY,
  fX,
  fY,
  holdsBack,
  inActive,
  inStartup,
  pushOf,
  ST_ATTACK,
  ST_BACKDASH,
  ST_CROUCH,
  ST_DASH,
  ST_DOWN,
  ST_GUARD,
  ST_HIT,
  ST_LAND,
  ST_STAND,
  ST_THROW,
  ST_THROWN,
  strikeInvul,
  throwGap,
  throwInvul,
  upperSafe,
} from './fighter.e16'
import { buffered, consume, heldNow, I_ATTACKS, I_BACK, I_FWD, I_HP } from './input.e16'

/** Each fighter's six boxes in the world, in points: left, right, top, bottom (up is +). */
export const wb = words(48)

/** The boxes of both fighters' poses placed where they stand and as they face. */
export function boxesWorld(): void {
  boxesOf(0)
  boxesOf(1)
}

function boxesOf(i: u16): void {
  const x = i16(fX[i] >> 4)
  const y = i16(fY[i] >> 4)
  const right = fFace[i] !== 0
  let k: u16 = 0
  while (k < BOXES) {
    const at = i * POSE_W + k * 4
    const w = i16(bx[at + 2])
    const o = i * 24 + k * 4
    if (w === 0) {
      wb[o] = 0
      wb[o + 1] = 0
    } else {
      const bx0 = i16(bx[at])
      const left = right ? x + bx0 : x - bx0 - w
      const top = y + i16(bx[at + 1])
      wb[o] = u16(left)
      wb[o + 1] = u16(left + w)
      wb[o + 2] = u16(top)
      wb[o + 3] = u16(top - i16(bx[at + 3]))
    }
    k++
  }
}

/** Box `ka` of fighter `a` overlaps box `kb` of fighter `b` (an empty box overlaps nothing). */
function overlap(a: u16, ka: u16, b: u16, kb: u16): bool {
  const p = a * 24 + ka * 4
  const q = b * 24 + kb * 4
  return (
    i16(wb[p]) < i16(wb[q + 1]) &&
    i16(wb[q]) < i16(wb[p + 1]) &&
    i16(wb[p + 3]) < i16(wb[q + 2]) &&
    i16(wb[q + 3]) < i16(wb[p + 2])
  )
}

/**
 * Fighter `a`'s move strikes the other this frame: active, not yet struck, a box on a box - not
 * a throw, nor on one down or waking, nor on an anti-air's upper body in its frames.
 */
function strikes(a: u16): bool {
  if (!inActive(a) || fHitDone[a] !== 0) return false
  if (mvAt(a, fMove[a], M_HEIGHT) === H_THROW) return false
  const d = 1 - a
  if (strikeInvul(d)) return false
  let h: u16 = 4
  while (h < 6) {
    let k: u16 = 1
    while (k < 4) {
      if (overlap(a, h, d, k) && !upperSafe(d, i16(wb[d * 24 + k * 4 + 3]))) return true
      k++
    }
    h++
  }
  return false
}

/** How a strike lands: guarded, a counter hit, on one already struck, on one crouching. */
const W_GUARDED = 1
const W_COUNTER = 2
const W_AGAIN = 4
const W_CROUCH = 8
const how = words(2)
const moveOf = words(2)

/** This frame's strikes, for the record and the tests: 0 none, 1 hit, 2 guarded, 3 counter. */
export const struck = words(2)
/** The damage each fighter's strike dealt this frame. */
export const dealt = words(2)
/** The frames both stand still (design 7.8); the input ring goes on. */
export let hitstop: u16 = 0
export function hitstopIs(n: u16): void {
  hitstop = n
}

/** The combo's damage scale (design 7.8): 100% less 10% a hit, to 40%; 256 is 100%. */
const SCALE_LAST = 6
function scaleOf(n: u16): u16 {
  const k = n > SCALE_LAST ? SCALE_LAST : n
  if (k === 0) return 256
  if (k === 1) return 230
  if (k === 2) return 205
  if (k === 3) return 179
  if (k === 4) return 154
  if (k === 5) return 128
  return 102
}

/** The damage of the `n`th hit (from 1) of a combo, a counter hit 20% more; at least 1. */
export function damageOf(base: u16, n: u16, counter: bool): u16 {
  let f = scaleOf(n - 1)
  if (counter) f = f + ((f * 13) >> 6)
  const d = (base * f + 128) >> 8
  return d === 0 ? 1 : d
}

/** A new frame: no strike yet. */
export function struckClear(): void {
  struck[0] = 0
  struck[1] = 0
  dealt[0] = 0
  dealt[1] = 0
  threw[0] = 0
  threw[1] = 0
}

/**
 * Both throws and both strikes judged, then dealt together (design 7.8): two throws that take
 * hold at once both break; a strike on a thrower in the same frame beats its throw.
 */
export function hitsResolve(): void {
  const t0 = throwHolds(0)
  const t1 = throwHolds(1)
  if (t0 && t1) {
    fHitDone[0] = 1
    fHitDone[1] = 1
    techBoth()
    return
  }
  const s0 = strikes(0)
  const s1 = strikes(1)
  if (s0) judge(0)
  if (s1) judge(1)
  if (s0) deal(0)
  if (s1) deal(1)
  if (t0 && !s1) hold(0)
  if (t1 && !s0) hold(1)
}

/* ---------------- throws (design 7.9) ---------------- */

/** Frames the thrown may tech in; the frame the throw lands; the thrower's frames in all. */
const TECH_F = 7
const SLAM_F = 16
const THROW_F = 26
/** A tech: both stagger back this long, pushed apart this hard (1/16 points a frame). */
const TECH_STUN = 12
const TECH_PUSH = 56
const THROW_PUSH = 40
/** This frame's throw that took hold: who threw (the tests read it). */
export const threw = words(2)

/**
 * Fighter `a`'s throw takes hold this frame: in its active frames, both on the ground, the other
 * within the slot's range and not in a stun, waking, about to jump or safe from throws.
 */
function throwHolds(a: u16): bool {
  if (fState[a] !== ST_ATTACK || fMove[a] !== MV_THROW) return false
  if (!inActive(a) || fHitDone[a] !== 0) return false
  const d = 1 - a
  if (fAir[a] !== 0 || fAir[d] !== 0 || fY[d] !== 0) return false
  if (!throwable(fState[d]) || throwInvul(d)) return false
  return throwGap(a, fX[a], fX[d]) <= prAt(a, P_THROW)
}

/** The states a throw takes: on the ground and not stunned, waking or crouched to jump. */
function throwable(st: u16): bool {
  if (st === ST_STAND || st === ST_CROUCH || st === ST_ATTACK || st === ST_LAND) return true
  return st === ST_DASH || st === ST_BACKDASH
}

/** Fighter `a` has hold of the other: both still, the thrown's tech window open. */
function hold(a: u16): void {
  const d = 1 - a
  fHitDone[a] = 1
  enter(a, ST_THROW)
  enter(d, ST_THROWN)
  fVX[a] = 0
  fVX[d] = 0
  fPush[a] = 0
  fPush[d] = 0
  fStun[d] = 0
  fCombo[d] = 0
  threw[a] = 1
}

/**
 * The throws' frames, before the state machines and alike for both: the thrown may tech in its
 * first 7 frames by the same buttons (the heavy punch with forward or back); at its 16th it is
 * slammed down; the thrower stands at its 26th.
 */
export function throwsStep(): void {
  let d: u16 = 0
  while (d < 2) {
    if (fState[d] === ST_THROWN) thrownStep(d)
    d++
  }
  let a: u16 = 0
  while (a < 2) {
    if (fState[a] === ST_THROW) {
      fStateT[a]++
      if (fStateT[a] >= THROW_F) enter(a, ST_STAND)
    }
    a++
  }
}

function thrownStep(d: u16): void {
  fStateT[d]++
  const t = fStateT[d]
  if (t <= TECH_F && techPressed(d)) {
    consume(d, I_ATTACKS)
    techBoth()
    return
  }
  if (t >= SLAM_F) slam(1 - d, d)
}

/** The tech's buttons: the heavy punch pressed (in the buffer) with forward or back held. */
function techPressed(d: u16): bool {
  if ((heldNow(d) & (I_FWD | I_BACK)) === 0) return false
  return buffered(d, I_HP) !== 0
}

/** A throw broken (THROW TECH): both stagger back from each other. */
function techBoth(): void {
  const l = fX[0] <= fX[1] ? 0 : 1
  const r = 1 - l
  let i: u16 = 0
  while (i < 2) {
    enter(i, ST_GUARD)
    fStun[i] = TECH_STUN
    fCrouch[i] = 0
    fKnock[i] = 0
    i++
  }
  fPush[l] = u16(-TECH_PUSH)
  fPush[r] = TECH_PUSH
  logPost(LOG_TECH, 0, 0)
}

/**
 * The throw lands: the thrown takes the table's damage and is down, pushed away from the thrower
 * - behind it, for a throw with back held - and both stop for the throw's hitstop.
 */
function slam(a: u16, d: u16): void {
  if (fThrowBack[a] !== 0) fX[d] = u16(i16(fX[a]) * 2 - i16(fX[d]))
  const toRight = fX[d] > fX[a]
  const dmg = damageOf(mvAt(a, MV_THROW, M_DAMAGE), 1, false)
  fLife[d] = dmg >= fLife[d] ? 0 : fLife[d] - dmg
  dealt[a] = dmg
  struck[a] = 4
  enter(d, ST_DOWN)
  fPush[d] = pushOf(THROW_PUSH, prAt(d, P_WEIGHT), toRight)
  const stop = mvAt(a, MV_THROW, M_HITSTOP)
  if (stop > hitstop) hitstop = stop
  logPost(LOG_THROW, a, MV_THROW)
}

/** Whether fighter `d` stands crouched: crouching, guarding or struck low, a low move. */
function crouched(d: u16): bool {
  const st = fState[d]
  if (st === ST_CROUCH) return true
  if (st === ST_GUARD || st === ST_HIT) return fCrouch[d] !== 0
  if (st === ST_ATTACK) return ((mvAt(d, fMove[d], M_KIND) >> 2) & 3) === 1
  return false
}

/** Fighter `d` guards a strike of `height` (design 7.6): high either way, low crouched, mid standing. */
export function guards(d: u16, height: u16): bool {
  if (fAir[d] !== 0) return false
  const guarding = fState[d] === ST_GUARD || (free(d) && holdsBack(d))
  if (!guarding) return false
  if (height === H_HIGH) return true
  if (height === H_LOW) return crouched(d)
  return !crouched(d)
}

/** How fighter `a`'s strike lands, from the state before either is dealt. */
function judge(a: u16): void {
  const d = 1 - a
  const m = fMove[a]
  moveOf[a] = m
  let w: u16 = 0
  if (guards(d, mvAt(a, m, M_HEIGHT))) w |= W_GUARDED
  else if (inStartup(d)) w |= W_COUNTER
  if (fState[d] === ST_HIT) w |= W_AGAIN
  if (crouched(d)) w |= W_CROUCH
  how[a] = w
}

/** Fighter `a`'s strike dealt to the other as judged. */
function deal(a: u16): void {
  const d = 1 - a
  const m = moveOf[a]
  const w = how[a]
  const toRight = fFace[a] !== 0
  const weight = prAt(d, P_WEIGHT)
  fHitDone[a] = 1
  fCrouch[d] = (w & W_CROUCH) !== 0 ? 1 : 0
  const stop = mvAt(a, m, M_HITSTOP)
  if (stop > hitstop) hitstop = stop
  if ((w & W_GUARDED) !== 0) {
    enter(d, ST_GUARD)
    fStun[d] = mvAt(a, m, M_BLOCKSTUN)
    fPush[d] = pushOf(mvAt(a, m, M_PUSH_GUARD), weight, toRight)
    struck[a] = 2
    return
  }
  const counter = (w & W_COUNTER) !== 0
  const n = (w & W_AGAIN) !== 0 ? fCombo[d] + 1 : 1
  const dmg = damageOf(mvAt(a, m, M_DAMAGE), n, counter)
  fLife[d] = dmg >= fLife[d] ? 0 : fLife[d] - dmg
  fCombo[d] = n
  comboNote(d)
  dealt[a] = dmg
  struck[a] = counter ? 3 : 1
  if (counter) logPost(LOG_COUNTER, a, m)
  else if ((mvAt(a, m, M_FLAGS) & F_ANTIAIR) !== 0 && fAir[d] !== 0) logPost(LOG_AA, a, m)
  const push = pushOf(mvAt(a, m, M_PUSH_HIT), weight, toRight)
  const down = (mvAt(a, m, M_FLAGS) & F_KNOCKDOWN) !== 0
  if (down || fAir[d] !== 0 || fLife[d] === 0) {
    knock(d, push)
    return
  }
  enter(d, ST_HIT)
  fStun[d] = mvAt(a, m, M_HITSTUN) + (counter ? 4 : 0)
  fPush[d] = push
}

/**
 * Fighter `d` knocked down (design 7.8: a hit in the air always is): from the air it falls,
 * lifted a little and pushed away, and lies down when it lands; on the ground it lies down.
 */
function knock(d: u16, push: u16): void {
  fStun[d] = 0
  if (fAir[d] !== 0) {
    enter(d, ST_HIT)
    fKnock[d] = 1
    fVY[d] = 32
    fVX[d] = push
    return
  }
  enter(d, ST_DOWN)
  fPush[d] = push
}
