// ELECFIGHTER's CPU, set up for a match and a round (docs/elec16-elecfighter-design.md 7.10.1):
// its mind cleared, and its measure of reaches - from the boxes of the two slots' poses, how far
// apart each of the other's ground moves strikes it and each of its standing normals strikes the
// other's recovery: knowledge of the frame data, as a player has it, never a sight of now. In
// bank 8 beside habit.e16.ts (bank 2, ai.e16.ts's, has no room for it): run as a match and a
// round begin, its tables read from RAM by the CPU.
import { addr, type bool, i16, u16, words } from '../../../../../src/shared/e16c/builtins'
import { M_POSE, mvAt, POSE_W, poseWords } from '../engine/data.e16'
import { fSlot } from '../engine/fighter.e16'
import { C_CPU, ctl } from '../engine/input.e16'
import {
  A_NONE,
  aaArm,
  chainArm,
  EDGE,
  fwdUp,
  gHold,
  gId,
  habitDue,
  lastML,
  outWas,
  patNo,
  plan,
  prevState,
  punArm,
  punId,
  punishes,
  seenLate,
  swA,
  swB,
  swing,
  swingId,
  tapT,
  techArm,
  tempo,
  thinkT,
  WARY,
  whims,
} from './ai.e16'
import { habitMatch, watchReset } from './habit.e16'

/** The moves a punish is chosen from, the heaviest first: sHK, sHP, sLK, sLP. */
export const PUNISHERS = 4

/**
 * For each CPU fighter `i`, in points apart, the most at which: `thD[i * 8 + m]` the other's
 * ground move m strikes it standing; `punD[i * 32 + k * 8 + m]` its standing normal k (0-3)
 * strikes the other in m's recovery (a heavy's stretched limb, design 7.5, or the body as it
 * leans) - 0 never. Knowledge of the frame data, as a player has it; never a sight of now.
 */
export const thD = words(16)
export const punD = words(64)
/**
 * The boxes measured, as a pose holds them (x, top, w, h each): hurt boxes (1-3), then hit boxes
 * (4-5).
 */
const bw = words(20)
const BW_HURT = 0
const BW_HIT = 12
/**
 * Half the other's body as its slot stands (its stand pose's body box), for the throw's range:
 * the body box now is the other's pose this frame, which the CPU never sees (design 7.10.1).
 */
export const otherHalf = words(2)

/** The most points apart the hit boxes meet the hurt boxes, two facing on the ground (0 never). */
function boxesMeet(): u16 {
  let most: u16 = 0
  let h: u16 = BW_HIT
  while (h < BW_HIT + 8) {
    const hw = i16(bw[h + 2])
    let b: u16 = BW_HURT
    while (hw !== 0 && b < BW_HURT + 12) {
      const hurtW = i16(bw[b + 2])
      const ht = i16(bw[h + 1])
      const bt = i16(bw[b + 1])
      const apart = i16(bw[h]) + hw + i16(bw[b]) + hurtW - 1
      if (
        hurtW !== 0 &&
        ht - i16(bw[h + 3]) < bt &&
        bt - i16(bw[b + 3]) < ht &&
        apart > i16(most)
      ) {
        most = u16(apart)
      }
      b = b + 4
    }
    h = h + 4
  }
  return most
}

/** Pose `p` of fighter `f`'s slot: its hit boxes (`hit`) or its hurt boxes into `bw`. */
function measured(f: u16, p: u16, hit: bool): void {
  if (hit) poseWords(fSlot[f], p * POSE_W + 16, 8, addr(bw) + BW_HIT * 2)
  else poseWords(fSlot[f], p * POSE_W + 4, 12, addr(bw) + BW_HURT * 2)
}

/**
 * Fighter `i`'s tables, for the slots of this match: a pose's boxes copied as a block under one
 * bank (the match begins inside a frame, design 10.4), into one small room (RAM's globals are
 * nearly all taken), so its standing pose is read again for each of the other's moves.
 */
function measure(i: u16): void {
  const j = 1 - i
  poseWords(fSlot[j], 0, 4, addr(bw))
  otherHalf[i] = bw[2] >> 1
  let m: u16 = 0
  while (m < 8) {
    measured(i, 0, false)
    measured(j, mvAt(j, m, M_POSE) + 1, true)
    thD[i * 8 + m] = boxesMeet()
    measured(j, mvAt(j, m, M_POSE) + 2, false)
    let k: u16 = 0
    while (k < PUNISHERS) {
      measured(i, mvAt(i, k, M_POSE) + 1, true)
      punD[i * 32 + k * 8 + m] = boxesMeet()
      k++
    }
    m++
  }
}

/** The most points apart any of the other's ground moves strikes fighter `i` standing. */
function longest(i: u16): u16 {
  let most: u16 = 0
  let m: u16 = 0
  while (m < 8) {
    if (thD[i * 8 + m] > most) most = thD[i * 8 + m]
    m++
  }
  return most
}

/** Fighter `i`'s CPU, new for a round. */
export function cpuRoundReset(i: u16): void {
  plan[i] = A_NONE
  thinkT[i] = 0
  outWas[i] = 0
  gId[i] = 0xffff
  gHold[i] = 0
  aaArm[i] = 0
  punId[i] = 0xffff
  punArm[i] = 0
  fwdUp[i] = 255
  tapT[i] = 0
  swing[i] = WARY + 16
  swingId[i] = 0xffff
  swA[i] = longest(i) + EDGE
  swB[i] = swA[i]
  tempo[i] = 0
  techArm[i] = 0
  chainArm[i] = 0
  prevState[i] = 0
  lastML[i] = lastML[i] & 255
  patNo[i] = 0
  habitDue[i] = 0
  watchReset(i)
}

/**
 * Fighter `i`'s CPU, new for a match (its reaches are measured as the versus shows: `cpuMeasure`).
 * The round's part is left to the first round's `cpuRoundReset`: here the reaches it sets the
 * swinging by are still the last match's, and nothing reads them before that round.
 */
export function cpuMatchSet(i: u16): void {
  // The other's lows and throws in a row, and the FEINT's last choice, are this match's: a new
  // opponent (or the same after a continue) expects no throw from the last match's two.
  lastML[i] = 0
  whims[i] = 0
  punishes[i] = 0
  seenLate[i] = 0xffff
  habitMatch(i)
}

/**
 * Fighter `i`'s reaches, if the CPU plays it, measured on the boxes of the match's slots: in the
 * versus's first frames, a side a frame - not in the one the match is set up in - so no frame
 * passes its cycles (design 10.4); a side no one reads is not measured. The first round's
 * `cpuRoundReset` comes after it.
 */
export function cpuMeasure(i: u16): void {
  if (ctl[i] === C_CPU) measure(i)
}
