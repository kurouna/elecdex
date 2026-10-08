// ELECFIGHTER's CPU (docs/elec16-elecfighter-design.md 7.10): one program, its character all in
// its opponent's row (cpu/opponents.txt), its weights (weights.txt) and its patterns
// (patterns.txt) - numbers and flags, never which opponent it is. It sees the other only as the
// other stood R frames ago (the ring `sS`..`sY` the engine keeps, read through `seen`), R its
// reaction for the situation: guard, anti-air, punish, throw tech, guard switch. Where seeing is
// too slow it reads the person's record (habit.e16.ts). Otherwise it thinks every T frames (and
// 0-7 more): a habit due, a whim, or an action drawn by weight for the distance and situation,
// kept to its liked range. It plays through the fighters' one entry as a person does: buttons
// held, a press their first frame; it never reads this frame's buttons of the other. In bank 2:
// once a frame for each fighter it plays.
import { type bool, i16, u16, words, wrap16 } from '../../../../../src/shared/e16c/builtins'
import { randBelow } from '../../lib/kit.e16'
import {
  F_CHAIN,
  H_LOW,
  H_MID,
  M_ACTIVE,
  M_FLAGS,
  M_HEIGHT,
  M_KIND,
  M_POSE,
  M_RECOVERY,
  M_STARTUP,
  MOVES,
  MV_THROW,
  mvAt,
  O_AA,
  O_APPROACH,
  O_CHAIN,
  O_FLAGS,
  O_GUARD,
  O_PATTERN,
  O_PUNISH,
  O_R_AA,
  O_R_GUARD,
  O_R_PUNISH,
  O_R_SWITCH,
  O_R_TECH,
  O_RANGE,
  O_RETREAT,
  O_THINK,
  O_WAKE,
  O_WHIM,
  O_WIDTH,
  OF_FEINT,
  OF_RUSH,
  OF_TURTLE,
  OW,
  opp,
  P_LIFE,
  P_THROW,
  patternWord,
  poseWord,
  prAt,
  reach,
  weightsLoad,
  wrow,
} from '../engine/data.e16'
import {
  fAirUsed,
  fHitDone,
  fLife,
  fMove,
  free,
  fSlot,
  fState,
  fVY,
  fX,
  pointX,
  RING_L,
  RING_R,
  ST_ATTACK,
  ST_BACKDASH,
  ST_DASH,
  ST_DOWN,
  ST_GUARD,
  ST_HIT,
  ST_JUMP,
  ST_PREJUMP,
  ST_THROW,
  ST_THROWN,
  ST_WAKE,
  throwGap,
} from '../engine/fighter.e16'
import { I_BACK, I_DOWN, I_FWD, I_HK, I_HP, I_LK, I_LP, I_UP } from '../engine/input.e16'
import { liveN, seenF, seenL, seenN, seenS, seenX, seenY } from '../engine/main.e16'
import { habitMatch, habitStep, histRange, observe, watchReset } from './habit.e16'

/** The actions (weights.txt's order), and the patterns' own. */
export const A_LIGHT = 0
export const A_HEAVY = 1
export const A_LOW = 2
export const A_MID = 3
export const A_JUMPIN = 4
export const A_THROW = 5
export const A_APPROACH = 6
export const A_GUARD = 7
export const A_WAIT = 8
export const A_RETREAT = 9
export const A_AA = 10
const A_WALK_IN = 11
const A_WALK_OUT = 12
const A_NONE = 255
const ACTIONS = 10

/** The situations of the weights (weights.txt). */
const SIT_NEUTRAL = 0
const SIT_PLUS = 1
const SIT_MINUS = 2
const SIT_AIR = 3
const SIT_WAKE = 4
const SIT_PRESSED = 5

/** Distance bands, in points between the two. */
const NEAR = 50
const MIDDLE = 110
/** How much farther than a move's reach the other may stand and still be in it. */
const SLACK = 10
/** Frames an attack's plan may take to come in reach before it is given up. */
const ATTACK_F = 40
/** A guard or a punish is judged only for an attack within this many points. */
const THREAT = 110
/** Frames after its own attack is guarded the CPU counts itself at a disadvantage. */
const MINUS_F = 30
/** Within this of a wall behind it, its back is to the wall. */
const CORNER = 40
/** Its choice when it stands up: kept 70% of the time. */
const WAKE_CHANCE = 179
/** A FEINT's mid and low taken in turn this often. */
const FEINT_CHANCE = 160
/** Points ahead of a fighter's middle its body's hurt box reaches (boxes.txt: 36 wide). */
const HALF = 18
/** How far outside the other's longest reach it stands while it is wary. */
const EDGE = 6
/**
 * The other's swinging, as it sees it: each attack seen starting adds SWING_ADD (at most 255),
 * and it falls by 1 every other frame. At WARY or more it respects the other's reach.
 */
const SWING_ADD = 48
const WARY = 32
/** Points more it keeps off when it would step in: the other's move may start as it comes, and reach the farther. */
const COME = 10
/** A recovery seen with at least this many frames still to run is an opening to step into. */
const OPEN_F = 6
/** A whiff with more frames than this still to run is walked into, to punish it from nearer. */
const WALK_F = 10
/** About how far a dash goes (profile.txt: 14 frames, about 36 points). */
const DASH_PTS = 36
/** The moves a punish is chosen from, the heaviest first: sHK, sHP, sLK, sLP. */
const PUNISHERS = 4
/** `punisher`'s answers when no normal fits now: one would land too soon, or none. */
const P_EARLY = 4
const P_NONE = 5
/** Points a punish keeps inside its reach, to be sure: the boxes of a recovery lean. */
const SURE = 2
/** Points ahead of its middle a recovering body surely still has (it leans back from its reach). */
const LEAN = 10
/** Two presses of a direction this many frames apart make a dash (fighter.e16.ts). */
const TAP_GAP = 10

/* ---------------- each CPU fighter's mind ---------------- */

const plan = words(2)
const planT = words(2)
const planStep = words(2)
const planB = words(2)
const thinkT = words(2)
/** The buttons it gave last frame (a press is a button it did not hold then). */
export const outWas = words(2)
/** The attack it last judged a guard for (the frame it began), and what it holds for it. */
const gId = words(2)
const gHold = words(2)
/** The other's jump: 0 not seen in the air, 1 meets it with the anti-air, 2 guards, 3 done. */
const aaArm = words(2)
/** The other's attack it last weighed a punish for (the live frame it began), its move, and 1 while it means to punish it. */
const punId = words(2)
const punMove = words(2)
const punArm = words(2)
/** The other's swinging (see SWING_ADD), the last attack counted. */
export const swing = words(2)
const swingId = words(2)
/** How near the other's last two attacks on the ground reached (`reaches`); before any, its longest. */
const swA = words(2)
const swB = words(2)
/** Frames since forward was last held; frames a dash's taps go on. */
const fwdUp = words(2)
const tapT = words(2)
/** For the tests: punishes pressed. */
export const punishes = words(2)
/** Frames since its own attack was guarded. */
const minusT = words(2)
/** The throw it was caught in: 0 not judged, 1 techs, 2 does not. */
const techArm = words(2)
const chainArm = words(2)
const prevState = words(2)
/** The last of mid and low it chose (FEINT). */
const lastML = words(2)
/** A pattern running (patterns.txt's row, 0 none) and its step; the gap its habit drew. */
export const patNo = words(2)
const patStep = words(2)
export const patGap = words(2)
/** The habit is due: its pattern starts the next frame it is free. */
export const habitDue = words(2)
/** For the tests: whims taken, the least age it has read the other at. */
export const whims = words(2)
export const seenLate = words(2)

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
  minusT[i] = 0
  techArm[i] = 0
  chainArm[i] = 0
  prevState[i] = 0
  patNo[i] = 0
  habitDue[i] = 0
  watchReset(i)
}

/** Fighter `i`'s CPU, new for a match. */
export function cpuMatchSet(i: u16): void {
  measure(i)
  whims[i] = 0
  punishes[i] = 0
  seenLate[i] = 0xffff
  habitMatch(i)
  cpuRoundReset(i)
}

/** Column `c` of fighter `i`'s row. */
export function row(i: u16, c: u16): u16 {
  return opp[i * OW + c]
}

/**
 * The index of fighter `j`'s entry in the ring as it stood `age` frames ago (1 the last frame's
 * end: never this frame). The least age read is kept for the tests.
 */
export function seenAt(i: u16, j: u16, age: u16): u16 {
  if (age < seenLate[i]) seenLate[i] = age
  return j * 32 + ((seenN - age) & 31)
}

/** Points between the two as they stood `age` frames ago. */
function apartAt(i: u16, age: u16): u16 {
  const a = seenX[seenAt(i, i, age)]
  const b = seenX[seenAt(i, 1 - i, age)]
  return a > b ? a - b : b - a
}

/** Points from fighter `i` now to the other as seen in entry `e`. */
function distTo(i: u16, e: u16): u16 {
  const a = pointX(i)
  const b = seenX[e]
  return a > b ? a - b : b - a
}

/**
 * Fighter `i`'s buttons this frame. `think` is false in a hitstop: it watches (the record, its
 * habit's triggers) but holds what it held.
 */
export function cpuThink(i: u16, think: bool): u16 {
  const j = 1 - i
  observe(i, j)
  habitStep(i, j)
  if (!think) return outWas[i]
  counters(i, j)
  let out = reflex(i, j)
  if (out === 0xffff) out = planned(i, j)
  out = undashed(i, chainStep(i, out))
  outWas[i] = out
  prevState[i] = fState[i]
  return out
}

/** Its clocks: since its attack was guarded; the other's swinging; a punish weighed. */
function counters(i: u16, j: u16): void {
  swingStep(i, j)
  punishArm(i, j)
  if (minusT[i] > 0) minusT[i]--
  // Its own last frame: what it knows of itself, not a sight of the other.
  const e = i * 32 + ((seenN - 1) & 31)
  if (seenF[e] >> 8 === 2) minusT[i] = MINUS_F
}

/**
 * No dash in it did not mean (design 6.2: forward pressed twice within TAP_GAP frames is one): a
 * walk in taken up again soon after it stopped waits until the gap has gone by, unless it taps.
 * Back is never held up: a guard comes first, and a backdash it did not mean only takes it away.
 */
function undashed(i: u16, out: u16): u16 {
  const tapping = tapT[i] > 0
  if (tapping) tapT[i]--
  if ((outWas[i] & I_FWD) !== 0) fwdUp[i] = 0
  else if (fwdUp[i] < 255) fwdUp[i]++
  if (tapping || (out & I_FWD) === 0 || (outWas[i] & I_FWD) !== 0 || fwdUp[i] > TAP_GAP) return out
  return out & ~I_FWD
}

/* ---------------- reflexes: what it sees, R frames late ---------------- */

/** A reflex's buttons, or 0xffff when none fires. */
function reflex(i: u16, j: u16): u16 {
  const st = fState[i]
  if (st === ST_THROWN) return tech(i, j)
  techArm[i] = 0
  if (!free(i) && st !== ST_GUARD) return 0xffff
  const aa = antiAir(i, j)
  if (aa !== 0xffff) return aa
  const g = guard(i, j)
  if (g !== 0xffff) return g
  return punish(i, j)
}

/** Caught in a throw: once it sees the throw (R tech), by its guard's chance, the tech's buttons. */
function tech(i: u16, j: u16): u16 {
  if (techArm[i] === 2) return 0
  const e = seenAt(i, j, row(i, O_R_TECH))
  if ((seenS[e] & 255) !== ST_THROW) return 0
  if (techArm[i] === 0) techArm[i] = randBelow(256) < row(i, O_GUARD) ? 1 : 2
  if (techArm[i] === 2) return 0
  if ((outWas[i] & I_HP) !== 0) return I_BACK
  techArm[i] = 2
  return I_BACK | I_HP
}

/**
 * An attack seen coming (R guard; R switch while already guarding): once for each attack, by
 * its chance, the right height - a low crouched, a mid or a jump attack standing, a high either
 * way (crouched) - or else the wrong one; held while the attack is out.
 */
function guard(i: u16, j: u16): u16 {
  const guarding = fState[i] === ST_GUARD
  const e = seenAt(i, j, row(i, guarding ? O_R_SWITCH : O_R_GUARD))
  const st = seenS[e] & 255
  const m = seenS[e] >> 8
  if (st !== ST_ATTACK || m === MV_THROW || distTo(i, e) > reaches(j, m)) {
    return guarding ? gHold[i] : 0xffff
  }
  const f = framesOf(e)
  if (f >= mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE)) return guarding ? gHold[i] : 0xffff
  const id = (seenN - f) & 0x7fff
  if (gId[i] !== id) {
    gId[i] = id
    let crouch = mvAt(j, m, M_HEIGHT) !== H_MID && seenY[e] === 0
    if (randBelow(256) >= row(i, O_GUARD)) crouch = !crouch
    gHold[i] = I_BACK | (crouch ? I_DOWN : 0)
  }
  return gHold[i]
}

/** Frames into the move (or the state) of entry `e`. */
function framesOf(e: u16): u16 {
  return seenF[e] & 255
}

/**
 * A jump seen (R anti-air): once a jump, by its chance, the anti-air (the crouching heavy
 * punch) pressed as the jumper comes in reach, the seen distance less how far it comes while
 * the CPU sees it late and the move starts; otherwise a standing guard as it comes.
 */
function antiAir(i: u16, j: u16): u16 {
  const r = row(i, O_R_AA)
  const e = seenAt(i, j, r)
  if (seenY[e] === 0 && (seenS[e] & 255) !== ST_PREJUMP) {
    aaArm[i] = 0
    return 0xffff
  }
  if (aaArm[i] === 0) aaArm[i] = randBelow(256) < row(i, O_AA) ? 1 : 2
  if (aaArm[i] === 2) return distTo(i, e) < THREAT ? I_BACK : 0xffff
  if (aaArm[i] === 3) return I_DOWN
  return aaPress(i, e, r)
}

/** Armed for a jump seen in entry `e`: crouched, then the anti-air as it comes in reach. */
function aaPress(i: u16, e: u16, r: u16): u16 {
  if (!coming(i, r)) return 0xffff
  if (distTo(i, e) > aaReach(r) || (outWas[i] & I_HP) !== 0) return I_DOWN
  aaArm[i] = 3
  return I_DOWN | I_HP
}

/** How far a jumper seen `r` frames late may be when the anti-air is pressed. */
function aaReach(r: u16): u16 {
  return 20 + (((r + 7) * 9) >> 2)
}

/** The other was coming closer as seen `r` frames late. */
function coming(i: u16, r: u16): bool {
  return apartAt(i, r) < apartAt(i, r + 2)
}

/* ---------------- reaches, measured on the boxes as a match begins ---------------- */

/**
 * For each CPU fighter `i`, in points apart, the most at which: `thD[i * 8 + m]` the other's
 * ground move m strikes it standing; `punD[i * 32 + k * 8 + m]` its standing normal k (0-3)
 * strikes the other in m's recovery (a heavy's stretched limb, design 7.5, or the body as it
 * leans) - 0 never. Knowledge of the frame data, as a player has it; never a sight of now.
 */
const thD = words(16)
const punD = words(64)
/** A pose's hurt boxes (1-3) and hit boxes (4-5) as read, four words each: x, top, w, h. */
const hurtW = words(12)
const hitW = words(8)

/** Pose `p` of slot `s`: its hurt boxes into hurtW (`hurt`), else its hit boxes into hitW. */
function boxesRead(s: u16, p: u16, hurt: bool): void {
  let k: u16 = 0
  while (k < (hurt ? 12 : 8)) {
    const v = poseWord(s, p, (hurt ? 4 : 16) + k)
    if (hurt) hurtW[k] = v
    else hitW[k] = v
    k++
  }
}

/** The most points apart a hit box of hitW meets a hurt box of hurtW, two facing on the ground (0 never). */
function boxesMeet(): u16 {
  let most: u16 = 0
  let h: u16 = 0
  while (h < 8) {
    const hw = i16(hitW[h + 2])
    let b: u16 = 0
    while (hw !== 0 && b < 12) {
      const bw = i16(hurtW[b + 2])
      const ht = i16(hitW[h + 1])
      const bt = i16(hurtW[b + 1])
      const apart = i16(hitW[h]) + hw + i16(hurtW[b]) + bw - 1
      if (
        bw !== 0 &&
        ht - i16(hitW[h + 3]) < bt &&
        bt - i16(hurtW[b + 3]) < ht &&
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

/** Fighter `i`'s tables, for the slots of this match. */
function measure(i: u16): void {
  const j = 1 - i
  let m: u16 = 0
  while (m < 8) {
    boxesRead(fSlot[i], 0, true)
    boxesRead(fSlot[j], mvAt(j, m, M_POSE) + 1, false)
    thD[i * 8 + m] = boxesMeet()
    boxesRead(fSlot[j], mvAt(j, m, M_POSE) + 2, true)
    let k: u16 = 0
    while (k < PUNISHERS) {
      boxesRead(fSlot[i], mvAt(i, k, M_POSE) + 1, false)
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

/**
 * How near fighter `j`'s move `m` must be to reach it, in points between the two: its reach and
 * the body's half, a little more; an attack in the air comes on, so anything within THREAT.
 */
function reaches(j: u16, m: u16): u16 {
  if (m < 8) return thD[(1 - j) * 8 + m] + EDGE
  if (m === MV_THROW) return reach[j * MOVES + m] + HALF + EDGE
  return THREAT
}

/** The live frame (main.e16.ts's `liveN`) the move of entry `e` began on: its first frame. */
function moveBegan(e: u16): u16 {
  return wrap16(seenL[e & 31] - framesOf(e) + 1)
}

/** The frame the move that began on live frame `began` is on now, by its frames counted on. */
function frameNow(began: u16): u16 {
  return wrap16(liveN - began) + 1
}

/** Every attack it sees the other start (R guard) adds to the swinging, which ebbs; its reach is kept. */
function swingStep(i: u16, j: u16): void {
  if (swing[i] > 0 && (liveN & 1) === 0) swing[i]--
  const e = seenAt(i, j, row(i, O_R_GUARD))
  if ((seenS[e] & 255) !== ST_ATTACK) return
  const began = moveBegan(e)
  if (began === swingId[i]) return
  swingId[i] = began
  swing[i] = swing[i] > 255 - SWING_ADD ? 255 : swing[i] + SWING_ADD
  if (seenY[e] > 0) return
  swB[i] = swA[i]
  swA[i] = reaches(j, seenS[e] >> 8)
}

/**
 * The nearest it lets the other be while wary: outside the reach of what the other has swung
 * lately (its last two attacks on the ground), so a reach it has not seen used is not feared.
 */
function edge(i: u16): u16 {
  return swA[i] > swB[i] ? swA[i] : swB[i]
}

/** Each attack of the other's on the ground it sees (R punish), once: whether to punish it, by its chance. */
function punishArm(i: u16, j: u16): void {
  const e = seenAt(i, j, row(i, O_R_PUNISH))
  if ((seenS[e] & 255) !== ST_ATTACK || seenY[e] > 0) return
  const began = moveBegan(e)
  if (began === punId[i]) return
  punId[i] = began
  punMove[i] = seenS[e] >> 8
  punArm[i] = randBelow(256) < row(i, O_PUNISH) ? 1 : 0
}

/** Frames of move `m` of fighter `j`, from its first to its recovery's last. */
function totalOf(j: u16, m: u16): u16 {
  return mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE) + mvAt(j, m, M_RECOVERY) - 1
}

/**
 * The punish (design 7.7, 7.10.1): an attack of the other's it means to punish, whiffed or
 * guarded, counted on by the move's frames from where it was seen R punish late. Free, it guards
 * a strike still to come that reaches it; else it presses the heaviest normal that lands in the
 * recovery and reaches - a heavy's stretched limb (design 7.5) or the body; too soon, it waits;
 * too far with the recovery long, it walks in.
 */
function punish(i: u16, j: u16): u16 {
  if (punArm[i] !== 1 || !free(i)) return 0xffff
  const m = punMove[i]
  const f = frameNow(punId[i])
  const total = totalOf(j, m)
  const recA = mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE)
  const d = distTo(i, seenAt(i, j, row(i, O_R_PUNISH)))
  if (f > total) return punishDone(i)
  if (f < recA && d <= reaches(j, m))
    return mvAt(j, m, M_HEIGHT) === H_LOW ? I_BACK | I_DOWN : I_BACK
  const k = punisher(i, j, f, d)
  if (k < PUNISHERS) return punishPress(i, k)
  if (k === P_EARLY) return 0
  if (f >= recA && total - f > WALK_F) return I_FWD
  return punishDone(i)
}

/** No punish after all. */
function punishDone(i: u16): u16 {
  punArm[i] = 0
  return 0xffff
}

/**
 * The heaviest standing normal (0-3) that, pressed now at `d` points, lands while the other's
 * move, on its frame `f`, recovers and reaches it there; else P_EARLY if one would land before
 * the recovery, or P_NONE.
 */
function punisher(i: u16, j: u16, f: u16, d: u16): u16 {
  const m = punMove[i]
  const total = totalOf(j, m)
  const recA = mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE)
  let early = false
  let k: u16 = PUNISHERS
  while (k > 0) {
    k--
    const lands = f + mvAt(i, k, M_STARTUP) - 1
    if (d + SURE <= punReach(i, k, m) && lands <= total) {
      if (lands + mvAt(i, k, M_ACTIVE) - 1 >= recA) return k
      early = true
    }
  }
  return early ? P_EARLY : P_NONE
}

/** The most points apart its standing normal `k` strikes the other in move `m`'s recovery. */
function punReach(i: u16, k: u16, m: u16): u16 {
  if (m < 8) return punD[i * 32 + k * 8 + m]
  return reach[i * MOVES + k] + LEAN
}

/** The punish's normal `k` pressed, once its button is up (it stays meant until then). */
function punishPress(i: u16, k: u16): u16 {
  const b = k === 0 ? I_LP : k === 1 ? I_HP : k === 2 ? I_LK : I_HK
  if ((outWas[i] & b) !== 0) return 0
  punArm[i] = 0
  punishes[i]++
  return b
}

/** Wary of the other: it has been swinging lately. */
function wary(i: u16): bool {
  return swing[i] >= WARY
}

/** The other seen open: struck, guarding, down, waking, in a throw, dashing, or in a recovery with frames to run. */
function opened(i: u16, j: u16): bool {
  const e = seenAt(i, j, row(i, O_R_GUARD))
  const st = seenS[e] & 255
  if (st === ST_ATTACK) {
    if (seenY[e] > 0) return false
    const m = seenS[e] >> 8
    const f = frameNow(moveBegan(e))
    return f >= mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE) && f + OPEN_F <= totalOf(j, m)
  }
  if (st === ST_HIT || st === ST_GUARD || st === ST_DOWN || st === ST_WAKE) return true
  return st === ST_THROW || st === ST_THROWN || st === ST_DASH || st === ST_BACKDASH
}

/**
 * Whether it may come to `d` points from the other (design 7.10.4): outside the other's longest
 * reach, or the other not swinging lately, or open.
 */
function mayCome(i: u16, j: u16, d: u16): bool {
  if (d > edge(i) + COME) return true
  return !wary(i) || opened(i, j)
}

/** Held off at `d`: inside the other's reach it backs away guarding, else it waits. */
function heldOff(i: u16, d: u16): u16 {
  return d <= edge(i) ? I_BACK : 0
}

/** A step in, or held off. */
function stepIn(i: u16, j: u16, d: u16): u16 {
  return mayCome(i, j, d > 2 ? d - 2 : 0) ? I_FWD : heldOff(i, d)
}

/* ---------------- the chain (design 7.8) ---------------- */

/** Its light struck (hit or guarded): once, by its chance, the heavy of its kind pressed. */
function chainStep(i: u16, out: u16): u16 {
  if (fState[i] !== ST_ATTACK) {
    chainArm[i] = 0
    return out
  }
  const m = fMove[i]
  if (fHitDone[i] === 0 || (mvAt(i, m, M_FLAGS) & F_CHAIN) === 0 || chainArm[i] !== 0) return out
  chainArm[i] = randBelow(256) < row(i, O_CHAIN) ? 1 : 2
  if (chainArm[i] === 2) return out
  const kind = mvAt(i, m, M_KIND)
  const b = (kind & 1) !== 0 ? I_HK : I_HP
  if ((outWas[i] & b) !== 0) {
    chainArm[i] = 0
    return 0
  }
  return b | (((kind >> 2) & 1) !== 0 ? I_DOWN : 0)
}

/* ---------------- plans: what it chooses ---------------- */

function planned(i: u16, j: u16): u16 {
  const st = fState[i]
  if (st === ST_PREJUMP || st === ST_JUMP || (st === ST_ATTACK && fAirUsed[i] !== 0)) {
    return airStep(i, j)
  }
  if (!free(i)) return 0
  if (prevState[i] === ST_WAKE && randBelow(256) < WAKE_CHANCE) planSet(i, row(i, O_WAKE), 0)
  if (habitDue[i] !== 0) {
    habitDue[i] = 0
    patternStart(i, row(i, O_PATTERN))
  }
  if (thinkT[i] > 0) thinkT[i]--
  if (plan[i] === A_NONE || (thinkT[i] === 0 && patNo[i] === 0)) think(i, j)
  return act(i, j)
}

/** The plan is `a` for `f` frames (0: the think interval, and a little more). */
export function planSet(i: u16, a: u16, f: u16): void {
  plan[i] = a
  planT[i] = f !== 0 ? f : row(i, O_THINK) + 8
  planStep[i] = 0
  planB[i] = randBelow(2)
}

/** The plan done: the pattern's next step, or nothing (it thinks again). */
function planEnd(i: u16): void {
  plan[i] = A_NONE
  if (patNo[i] === 0) return
  patStep[i]++
  patternStep(i)
}

/** Pattern `p` from its first step. */
export function patternStart(i: u16, p: u16): void {
  patNo[i] = p
  patStep[i] = 0
  patternStep(i)
}

function patternStep(i: u16): void {
  const k = patStep[i]
  const a = k < 4 ? patternWord(patNo[i], k * 2) : 255
  if (a === 255) {
    patNo[i] = 0
    return
  }
  const f = patternWord(patNo[i], k * 2 + 1)
  planSet(i, a, f !== 0 ? f : (patGap[i] >> 1) + 1)
}

/**
 * Thinking (design 7.10.3): every T frames and 0-7 more, the distance's band and the
 * situation; a whim drawn from every action alike by its chance, else an action by weight.
 */
function think(i: u16, j: u16): void {
  thinkT[i] = row(i, O_THINK) + randBelow(8)
  if (randBelow(256) < row(i, O_WHIM)) {
    whims[i]++
    planSet(i, randBelow(ACTIONS), 0)
    return
  }
  const e = seenAt(i, j, row(i, O_R_GUARD))
  const d = distTo(i, e)
  const band = d < NEAR ? 0 : d < MIDDLE ? 1 : 2
  weightsLoad(i, band, situation(i, e))
  let a = drawn()
  if ((row(i, O_FLAGS) & OF_FEINT) !== 0 && (a === A_MID || a === A_LOW)) {
    if (a === lastML[i] && randBelow(256) < FEINT_CHANCE) a = a === A_MID ? A_LOW : A_MID
    lastML[i] = a
  }
  planSet(i, a, 0)
}

/** An action drawn in proportion to the weights loaded. */
function drawn(): u16 {
  let sum: u16 = 0
  let k: u16 = 0
  while (k < ACTIONS) {
    sum = sum + wrow[k]
    k++
  }
  if (sum === 0) return A_WAIT
  let r = randBelow(sum)
  k = 0
  while (k < ACTIONS - 1) {
    if (r < wrow[k]) return k
    r = r - wrow[k]
    k++
  }
  return ACTIONS - 1
}

/** The situation as it sees it (design 7.10.3). */
function situation(i: u16, e: u16): u16 {
  const st = seenS[e] & 255
  if (st === ST_DOWN || st === ST_WAKE) return SIT_WAKE
  if (seenY[e] > 0 || st === ST_PREJUMP) return SIT_AIR
  if (st === ST_HIT || st === ST_GUARD) return SIT_PLUS
  if (minusT[i] > 0) return SIT_MINUS
  if (fLife[i] * 4 < prAt(i, P_LIFE) || cornered(i)) return SIT_PRESSED
  return SIT_NEUTRAL
}

/** Its back to a wall: the wall behind it within CORNER points. */
function cornered(i: u16): bool {
  const x = pointX(i)
  const j = 1 - i
  if (fX[j] > fX[i]) return x < RING_L + CORNER
  return x > RING_R - CORNER
}

/** The plan carried out this frame. */
function act(i: u16, j: u16): u16 {
  const a = plan[i]
  if (planT[i] === 0) {
    planEnd(i)
    return 0
  }
  planT[i]--
  const e = seenAt(i, j, row(i, O_R_GUARD))
  const d = distTo(i, e)
  if (a <= A_MID) return strikeAct(i, j, a, d)
  if (a === A_JUMPIN) return jumpIn(i, j, d)
  if (a === A_THROW) return throwAct(i, j, d)
  if (a === A_APPROACH) return approach(i, j, d)
  if (a === A_GUARD) return (row(i, O_FLAGS) & OF_TURTLE) !== 0 ? I_BACK : I_BACK | I_DOWN
  if (a === A_WAIT) return keepRange(i, j, d)
  if (a === A_RETREAT) return retreat(i)
  if (a === A_AA) return aaPlan(i, j)
  if (a === A_WALK_IN) return stepIn(i, j, d)
  if (a === A_WALK_OUT) return I_BACK
  planEnd(i)
  return 0
}

/** The move each striking action uses: light, heavy, low, mid; punch or kick by `planB`. */
function strikeMove(i: u16, a: u16): u16 {
  const kick = planB[i]
  if (a === A_LIGHT) return kick * 2
  if (a === A_HEAVY) return 1 + kick * 2
  if (a === A_LOW) return 6 + kick
  return 1
}

/**
 * A strike: walk in until it reaches, then press it (a crouched one with down); wary, it neither
 * walks into the other's reach nor strikes inside it until the other is open.
 */
function strikeAct(i: u16, j: u16, a: u16, d: u16): u16 {
  if (planT[i] > ATTACK_F) planT[i] = ATTACK_F
  const m = strikeMove(i, a)
  if (d > reach[i * MOVES + m] + SLACK) return stepIn(i, j, d)
  if (!mayCome(i, j, d)) return heldOff(i, d)
  const col = m & 3
  const b = col === 0 ? I_LP : col === 1 ? I_HP : col === 2 ? I_LK : I_HK
  const down = m >= 4 ? I_DOWN : 0
  if ((outWas[i] & b) !== 0) return down
  planEnd(i)
  return b | down
}

/** A jump in: from the middle distance, forward; the attack comes in the air (`airStep`). */
function jumpIn(i: u16, j: u16, d: u16): u16 {
  if (d > 140) return I_FWD
  if (wary(i)) return keepRange(i, j, d)
  if ((outWas[i] & I_UP) !== 0) return 0
  planStep[i] = 1
  return I_UP | I_FWD
}

/** In the air: falling and near, the jump's one attack (a heavy kick or punch). */
function airStep(i: u16, j: u16): u16 {
  if (fAirUsed[i] !== 0 || fState[i] !== ST_JUMP) return 0
  if (i16(fVY[i]) > 0) return 0
  const e = seenAt(i, j, row(i, O_R_GUARD))
  if (distTo(i, e) > 56) return 0
  const b = planB[i] !== 0 ? I_HK : I_HP
  if ((outWas[i] & b) !== 0) return 0
  if (plan[i] === A_JUMPIN) planEnd(i)
  return b
}

/** The throw: walk in to its range (wary, as a strike), then forward and the heavy punch. */
function throwAct(i: u16, j: u16, d: u16): u16 {
  if (planT[i] > ATTACK_F) planT[i] = ATTACK_F
  if (throwGap(i, fX[i], fX[j]) + 4 > prAt(i, P_THROW)) return stepIn(i, j, d)
  if (!mayCome(i, j, d)) return heldOff(i, d)
  if ((outWas[i] & I_HP) !== 0) return I_FWD
  planEnd(i)
  return I_FWD | I_HP
}

/** In: a dash (two taps) when it dashes and is far, else a walk to its range; wary, never into the other's reach. */
function approach(i: u16, j: u16, d: u16): u16 {
  const dash = row(i, O_APPROACH) !== 0 || (row(i, O_FLAGS) & OF_RUSH) !== 0
  if (dash && d > 70 && (planStep[i] > 0 || mayCome(i, j, d - DASH_PTS))) return taps(i, I_FWD)
  if (d <= liked(i)) {
    planEnd(i)
    return 0
  }
  return stepIn(i, j, d)
}

/** Two taps of `dir` for a dash, over four frames. */
function taps(i: u16, dir: u16): u16 {
  tapT[i] = 2
  const k = planStep[i]
  planStep[i]++
  if (k >= 3) planEnd(i)
  return (k & 1) !== 0 ? dir : 0
}

/** Away, as its row says: walking, a backdash, or a jump back. */
function retreat(i: u16): u16 {
  const how = row(i, O_RETREAT)
  if (how === 1) return taps(i, I_BACK)
  if (how === 2) {
    planEnd(i)
    return (outWas[i] & I_UP) !== 0 ? I_BACK : I_UP | I_BACK
  }
  return I_BACK
}

/** The distance it likes: its row's, or (0) where the two have stood the longest. */
function liked(i: u16): u16 {
  const r = row(i, O_RANGE)
  return r !== 0 ? r : histRange()
}

/**
 * Waiting at its range: in or out to it, still within its width; a TURTLE never walks in. Wary,
 * its range is outside the other's reach at the nearest.
 */
function keepRange(i: u16, j: u16, d: u16): u16 {
  let want = liked(i)
  if (wary(i) && want < edge(i) + COME) want = edge(i) + COME
  const w = row(i, O_WIDTH)
  const turtle = (row(i, O_FLAGS) & OF_TURTLE) !== 0
  if (d > want + (turtle ? w * 3 : w)) return stepIn(i, j, d)
  if (d + w < want || (wary(i) && d <= edge(i))) return I_BACK
  return 0
}

/** A read jump: crouched and waiting, the anti-air as the jumper comes. */
function aaPlan(i: u16, j: u16): u16 {
  const r = row(i, O_R_AA)
  const e = seenAt(i, j, r)
  if (seenY[e] === 0 || distTo(i, e) > aaReach(r)) return I_DOWN
  if ((outWas[i] & I_HP) !== 0) return I_DOWN
  planEnd(i)
  return I_DOWN | I_HP
}
