// ELECFIGHTER's strikes (docs/elec16-elecfighter-design.md 7.5, 7.6, 7.8): the poses' boxes in
// the world, who strikes whom, and the outcome - guarded by height, hit, counter hit, the combo's
// damage, the stun, the push and the hitstop. Both strikes of a frame are judged first, from the
// state both fighters are in, and only then dealt (a trade is both hit, the same either side).
import { type bool, i16, u16, words } from '../../../../../src/shared/e16c/builtins'
import {
  BOXES,
  bx,
  F_KNOCKDOWN,
  H_HIGH,
  H_LOW,
  M_BLOCKSTUN,
  M_DAMAGE,
  M_FLAGS,
  M_HEIGHT,
  M_HITSTOP,
  M_HITSTUN,
  M_KIND,
  M_PUSH_GUARD,
  M_PUSH_HIT,
  mvAt,
  P_WEIGHT,
  POSE_W,
  prAt,
} from './data.e16'
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
  fStun,
  fVX,
  fVY,
  fX,
  fY,
  holdsBack,
  inActive,
  inStartup,
  pushOf,
  ST_ATTACK,
  ST_CROUCH,
  ST_DOWN,
  ST_GUARD,
  ST_HIT,
} from './fighter.e16'

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

/** Fighter `a`'s move strikes the other this frame: active, not yet struck, a box on a box. */
function strikes(a: u16): bool {
  if (!inActive(a) || fHitDone[a] !== 0) return false
  const d = 1 - a
  let h: u16 = 4
  while (h < 6) {
    let k: u16 = 1
    while (k < 4) {
      if (overlap(a, h, d, k)) return true
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
}

/** Both strikes judged, then dealt together. */
export function hitsResolve(): void {
  const s0 = strikes(0)
  const s1 = strikes(1)
  if (s0) judge(0)
  if (s1) judge(1)
  if (s0) deal(0)
  if (s1) deal(1)
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
