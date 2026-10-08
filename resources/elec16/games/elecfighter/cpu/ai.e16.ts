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
import { type bool, i16, type u16, words, wrap16 } from '../../../../../src/shared/e16c/builtins'
import { randBelow } from '../../lib/kit.e16'
import {
  F_CHAIN,
  H_LOW,
  H_MID,
  K_CROUCH,
  K_KICK,
  M_ACTIVE,
  M_FLAGS,
  M_HEIGHT,
  M_KIND,
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
  OF_TURTLE,
  OW,
  opp,
  P_LIFE,
  P_THROW,
  P_WALK_F,
  patternWord,
  prAt,
  reach,
  weightsLoad,
  wrow,
} from '../engine/data.e16'
import {
  DASH_GAP,
  fAirUsed,
  fHitDone,
  fLife,
  fMove,
  free,
  fState,
  fVY,
  half,
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
} from '../engine/fighter.e16'
import { I_BACK, I_DOWN, I_FWD, I_HK, I_HP, I_LK, I_LP, I_UP } from '../engine/input.e16'
import { liveN, seenF, seenL, seenN, seenS, seenX, seenY } from '../engine/main.e16'
import { habitStep, histRange, observe } from './habit.e16'
import { otherHalf, PUNISHERS, punD, thD } from './setup.e16'

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
export const A_NONE = 255
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
/** How far outside the other's longest reach it stands while it is wary. */
export const EDGE = 6
/**
 * The other's swinging, as it sees it: each attack seen starting adds SWING_ADD (at most 255),
 * and it falls by 1 every other frame. At WARY or more it respects the other's reach.
 */
const SWING_ADD = 48
export const WARY = 32
/**
 * Points more it keeps off when it would step in: the other's move may start as it comes, and reach
 * the farther.
 */
const COME = 10
/**
 * Points beyond the other's reach it already guards at while wary: about what the other walks in
 * the time it is seen late.
 */
const GUARD_PTS = 20
/**
 * The shortest stun of a strike (a light's hitstun, a guard's blockstun is near it): one seen
 * struck longer ago than this is free again. Seen late, a stun it walked into was over as it came
 * (PACKET after its jab struck walked into a waiting throw, the second balance pass).
 */
const STUN_F = 11
/** A recovery seen with at least this many frames still to run is an opening to step into. */
const OPEN_F = 6
/**
 * Frames its turn lasts once it is out of a guard or a hit with the other near on the ground: it
 * may strike inside the other's reach though wary (the other's next attack is no sooner than its
 * own; a spammer of one light that never shows an opening would otherwise never be answered).
 */
const TURN_F = 8
/** A whiff with more frames than this still to run is walked into, to punish it from nearer. */
const WALK_F = 10
/** About how far a dash goes: every slot's profile.txt has 14 frames at 41/16, about 36 points. */
const DASH_PTS = 36
/** A throw that takes hold within this many frames of its own waking is one it expected. */
const WOKE_F = 12
/** Its crouching jab (moves.txt's row): what it meets one walking in with while held off. */
const MV_CLP = 4
/** Its crouching light kick (moves.txt's row): the low its turn strikes with. */
const MV_CLK = 6
/** `punisher`'s answers when no normal fits now: one would land too soon, or none. */
const P_EARLY = 4
const P_NONE = 5
/** Points a punish keeps inside its reach, to be sure: the boxes of a recovery lean. */
const SURE = 2
/** Points ahead of its middle a recovering body surely still has (it leans back from its reach). */
const LEAN = 10

/* ---------------- each CPU fighter's mind ---------------- */

export const plan = words(2)
const planT = words(2)
const planStep = words(2)
const planB = words(2)
export const thinkT = words(2)
/** The buttons it gave last frame (a press is a button it did not hold then). */
export const outWas = words(2)
/** The attack it last judged a guard for (the frame it began), and what it holds for it. */
export const gId = words(2)
export const gHold = words(2)
/** The other's jump: 0 not seen in the air, 1 meets it with the anti-air, 2 guards, 3 done. */
export const aaArm = words(2)
/**
 * The other's attack it last weighed a punish for (the live frame it began), its move, and 1 while
 * it means to punish it.
 */
export const punId = words(2)
const punMove = words(2)
export const punArm = words(2)
/** The other's swinging (see SWING_ADD), the last attack counted. */
export const swing = words(2)
export const swingId = words(2)
/**
 * How near the other's last two attacks on the ground reached (`reaches`); before any, its longest.
 */
export const swA = words(2)
export const swB = words(2)
/** Frames since forward was last held; frames a dash's taps go on. */
export const fwdUp = words(2)
export const tapT = words(2)
/** For the tests: punishes pressed. */
export const punishes = words(2)
/**
 * Two clocks in a word (RAM's globals are full): frames since its own attack was guarded (low
 * byte, MINUS_F down) and frames left of its turn (high byte, TURN_F down).
 */
export const tempo = words(2)
/** The throw it was caught in: 0 not judged, 1 techs, 2 does not. */
export const techArm = words(2)
export const chainArm = words(2)
export const prevState = words(2)
/**
 * Two in a word (RAM's globals are full): the last of mid and low it chose (FEINT, low byte), and
 * the other's lows in a row as its record counts them (habit.e16.ts, high byte, at most LOWS) - two or more, and
 * even a TURTLE guards crouched: a person who sees one low again and again stops standing up to it.
 */
export const lastML = words(2)
export const LOWS = 2
/**
 * The other's throws in a row (habit.e16.ts counts them, bits 4-5 of `lastML`'s low byte, under
 * the FEINT's choice in bits 0-1): both bits set, two or more, and the next is expected.
 */
export const THROWS_MASK = 0x30
export const THROW_ONE = 0x10
/** A pattern running (patterns.txt's row, 0 none) and its step; the gap its habit drew. */
export const patNo = words(2)
const patStep = words(2)
export const patGap = words(2)
/** The habit is due: its pattern starts the next frame it is free. */
export const habitDue = words(2)
/** For the tests: whims taken, the least age it has read the other at. */
export const whims = words(2)
export const seenLate = words(2)

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
  if (out === 0xffff) out = lowsGuarded(i, j, planned(i, j))
  out = undashed(i, chainStep(i, out))
  outWas[i] = out
  prevState[i] = fState[i]
  return out
}

/**
 * A plan's walk back standing within the other's reach, the other's lows coming in a row: crouched
 * instead, a guard (a person swept twice does not walk back standing within the sweep's reach).
 */
function lowsGuarded(i: u16, j: u16, out: u16): u16 {
  if (out !== I_BACK || lastML[i] >> 8 < LOWS) return out
  return distTo(i, seenAt(i, j, row(i, O_R_GUARD))) > edge(i) + GUARD_PTS ? out : I_BACK | I_DOWN
}

/** Its clocks: since its attack was guarded; the other's swinging; a punish weighed. */
function counters(i: u16, j: u16): void {
  swingStep(i, j)
  punishArm(i, j)
  if ((tempo[i] & 255) > 0) tempo[i]--
  if (tempo[i] >= 256) tempo[i] = tempo[i] - 256
  // Before the reflexes: a punish it still means (too late to land) would hide the frame.
  if (((prevState[i] === ST_GUARD || prevState[i] === ST_HIT) && free(i)) || whiffed(i, j)) {
    turnTake(i, j)
  }
  // Its own last frame: what it knows of itself, not a sight of the other.
  const e = i * 32 + ((seenN - 1) & 31)
  if (seenF[e] >> 8 === 2) tempo[i] = (tempo[i] & 0xff00) | MINUS_F
}

/**
 * No dash in it did not mean (design 6.2: forward pressed twice within DASH_GAP frames is one): a
 * walk in taken up again soon after it stopped waits until the gap has gone by, unless it taps.
 * Back is never held up: a guard comes first, and a backdash it did not mean only takes it away.
 */
function undashed(i: u16, out: u16): u16 {
  const tapping = tapT[i] > 0
  if (tapping) tapT[i]--
  if ((outWas[i] & I_FWD) !== 0) fwdUp[i] = 0
  else if (fwdUp[i] < 255) fwdUp[i]++
  if (tapping || (out & I_FWD) === 0 || (outWas[i] & I_FWD) !== 0 || fwdUp[i] > DASH_GAP) return out
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
  // Its turn: the attacks it still sees are the ones it has just guarded or taken - a punish
  // still presses, but neither guards them.
  if (onTurn(i)) {
    const p = punish(i, j)
    return p === 0 || (p & I_BACK) !== 0 ? 0xffff : p
  }
  const g = guard(i, j)
  if (g !== 0xffff) return g
  return punish(i, j)
}

/**
 * Caught in a throw: once it sees the throw (R tech), by its guard's chance, the tech's buttons.
 * Caught as it stands up, or after two throws in a row (`lastML`), it needs no sight of it and
 * no chance (design 7.10.2: a throw expected is read, not seen): a walk in and a throw, again and again,
 * too quick for any eyes, otherwise threw it to the end of every round (measured 2026-10-09, the
 * second balance pass).
 */
function tech(i: u16, j: u16): u16 {
  if (techArm[i] === 2) return 0
  const e = seenAt(i, j, row(i, O_R_TECH))
  const was = seenS[i * 32 + ((seenN - WOKE_F) & 31)] & 255
  const expected = was === ST_WAKE || was === ST_DOWN || (lastML[i] & THROWS_MASK) === THROWS_MASK
  if ((seenS[e] & 255) !== ST_THROW && !expected) return 0
  if (techArm[i] === 0) techArm[i] = expected || randBelow(256) < row(i, O_GUARD) ? 1 : 2
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

/* ---------------- reaches (setup.e16.ts) ---------------- */

/**
 * How near fighter `j`'s move `m` must be to reach it, in points between the two: its reach and
 * its own body's half (its slot's, as it stands now), a little more; an attack in the air comes
 * on, so anything within THREAT.
 */
function reaches(j: u16, m: u16): u16 {
  if (m < 8) return thD[(1 - j) * 8 + m] + EDGE
  if (m === MV_THROW) return reach[j * MOVES + m] + half(1 - j) + EDGE
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

/**
 * Every attack it sees the other start (R guard) adds to the swinging, which ebbs; its reach is
 * kept.
 */
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

/**
 * Each attack of the other's on the ground it sees (R punish), once: whether to punish it, by its
 * chance.
 */
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

/**
 * Its turn (TURN_F): a strike or a throw already in reach, or a jump in, though wary - never a
 * walk in, which a poke waiting at its reach meets.
 */
function onTurn(i: u16): bool {
  return tempo[i] >= 256
}

/** Wary of the other: it has been swinging lately. */
function wary(i: u16): bool {
  return swing[i] >= WARY
}

/**
 * The other seen open: struck, guarding, down, waking, in a throw, dashing, or in a recovery with
 * frames to run.
 */
function opened(i: u16, j: u16): bool {
  const e = seenAt(i, j, row(i, O_R_GUARD))
  const st = seenS[e] & 255
  if (st === ST_ATTACK) {
    if (seenY[e] > 0) return false
    const m = seenS[e] >> 8
    const f = frameNow(moveBegan(e))
    return f >= mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE) && f + OPEN_F <= totalOf(j, m)
  }
  // Struck or guarding as seen R late: open only if still so now, by the shortest stun.
  if (st === ST_HIT || st === ST_GUARD) return framesOf(e) + row(i, O_R_GUARD) <= STUN_F
  if (st === ST_DOWN || st === ST_WAKE) return true
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

/**
 * Held off at `d`: within the other's reach and what it may walk while seen late (GUARD_PTS),
 * it guards crouched, holding its place (a TURTLE stands, late to lows); farther, it waits. It used to back away standing only
 * inside the reach as seen R frames late: a light low, faster than its eyes, from one who had
 * walked in meanwhile struck it every time (measured 2026-10-09: a crouching light kick pressed
 * whenever able won every round of the ladder, ROOT's too). One coming in is met (`metComing`).
 */
function heldOff(i: u16, d: u16): u16 {
  const met = metComing(i, d)
  if (met !== 0xffff) return met
  // A TURTLE's guard walks it back, so only inside the reach (it would leave its range).
  if (standsGuard(i)) return d > edge(i) ? 0 : I_BACK
  return d > edge(i) + GUARD_PTS ? 0 : I_BACK | I_DOWN
}

/**
 * The other coming into its throw's range (a guard is what a throw beats): the crouched jab,
 * quicker than a throw, which one walking in walks into; else 0xffff. A walk up and
 * a throw, again and again, otherwise threw it guarding or waiting (the second balance pass,
 * 2026-10-09).
 */
function metComing(i: u16, d: u16): u16 {
  const r = row(i, O_R_GUARD)
  // One coming is nearer now than seen, by its walk (its slot's, as a player knows it) in half
  // of R: it may have stopped (the whole of R had it jab at every step in, and the jab, of the
  // longest crouch, won CPU against CPU nearly alone).
  if (!coming(i, r)) return 0xffff
  const by = (prAt(1 - i, P_WALK_F) * r) >> 5
  const now = d > by ? d - by : 0
  return now <= reaches(1 - i, MV_THROW) && inReach(i, MV_CLP, now) ? jab(i) : 0xffff
}

/** Its crouched jab pressed (down held between the presses). */
function jab(i: u16): u16 {
  return (outWas[i] & I_LP) !== 0 ? I_DOWN : I_DOWN | I_LP
}

/** It guards standing: a TURTLE, unless the other has been striking low (`lastML`'s high byte). */
function standsGuard(i: u16): bool {
  return (row(i, O_FLAGS) & OF_TURTLE) !== 0 && lastML[i] >> 8 < LOWS
}

/** A step in, or held off. */
function stepIn(i: u16, j: u16, d: u16): u16 {
  return mayCome(i, j, d > 2 ? d - 2 : 0) ? I_FWD : heldOff(i, d)
}

/* ---------------- the chain (design 7.8) ---------------- */

/**
 * Its light struck (hit or guarded): once, by its chance, the heavy of its kind pressed - only a
 * heavy that reaches as far as the light (the crouching heavy punch, an anti-air going up, chained
 * from the crouching jab whiffed over the pushed-back other and was thrown in its long recovery).
 */
function chainStep(i: u16, out: u16): u16 {
  if (fState[i] !== ST_ATTACK) {
    chainArm[i] = 0
    return out
  }
  const m = fMove[i]
  if (fHitDone[i] === 0 || (mvAt(i, m, M_FLAGS) & F_CHAIN) === 0 || chainArm[i] !== 0) return out
  const far = reach[i * MOVES + m + 1] >= reach[i * MOVES + m]
  chainArm[i] = far && randBelow(256) < row(i, O_CHAIN) ? 1 : 2
  if (chainArm[i] === 2) return out
  const kind = mvAt(i, m, M_KIND)
  const b = (kind & K_KICK) !== 0 ? I_HK : I_HP
  if ((outWas[i] & b) !== 0) {
    chainArm[i] = 0
    return 0
  }
  return b | ((kind & K_CROUCH) !== 0 ? I_DOWN : 0)
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

/**
 * Out of a guard or a hit, or a whiff seen: with the other on the ground within the reach it
 * fears, its turn - it may strike inside the other's reach for TURN_F frames. Out of a guard or
 * after a whiff, by its punish chance:
 * its light low at once if it reaches (a light low guarded leaves its striker later than the
 * guard, design 7.7: the low comes first), or, the other's lows coming in a row from beyond it, a
 * jump in over the next; else it thinks again now.
 */
function turnTake(i: u16, j: u16): void {
  const e = seenAt(i, j, row(i, O_R_GUARD))
  if (seenY[e] > 0 || distTo(i, e) > edge(i) + GUARD_PTS) return
  tempo[i] = (tempo[i] & 255) | (TURN_F << 8)
  if (patNo[i] !== 0) return
  if (prevState[i] !== ST_HIT && randBelow(256) < row(i, O_PUNISH)) {
    if (inReach(i, MV_CLK, distTo(i, e))) {
      planSet(i, A_LOW, 0)
      planB[i] = 0
      thinkT[i] = row(i, O_THINK)
      return
    }
    // Lows again and again from beyond its own: over them, as a person jumps a sweep it expects.
    if (lastML[i] >> 8 >= LOWS) {
      planSet(i, A_JUMPIN, 0)
      thinkT[i] = row(i, O_THINK)
      return
    }
  }
  thinkT[i] = 1
}

/**
 * The other's attack on the ground seen (R guard) at its first frame of recovery, and it free and
 * within its light low's reach: the attack missed it (a high over its crouch, a poke short) - its
 * turn, as after a guard (farther, a turn only jumped in on a heavy that met it in the air). A light
 * pressed again and again over its crouch, too quick to be seen open, was never answered.
 */
function whiffed(i: u16, j: u16): bool {
  const e = seenAt(i, j, row(i, O_R_GUARD))
  const m = seenS[e] >> 8
  if (!free(i) || (seenS[e] & 255) !== ST_ATTACK || seenY[e] > 0 || m >= 8) return false
  return (
    framesOf(e) === mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE) && inReach(i, MV_CLK, distTo(i, e))
  )
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
    if (a === (lastML[i] & 15) && randBelow(256) < FEINT_CHANCE) a = a === A_MID ? A_LOW : A_MID
    lastML[i] = (lastML[i] & 0xff30) | a
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
  if ((tempo[i] & 255) > 0) return SIT_MINUS
  if (fLife[i] * 4 < prAt(i, P_LIFE) || cornered(i, e)) return SIT_PRESSED
  return SIT_NEUTRAL
}

/** Its back to a wall: the wall behind it within CORNER points, the other as seen in entry `e`. */
function cornered(i: u16, e: u16): bool {
  const x = pointX(i)
  if (seenX[e] > x) return x < RING_L + CORNER
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
  // Waiting, guarding, walking in or out: one coming in is met.
  const met = a === A_AA ? 0xffff : metComing(i, d)
  if (met !== 0xffff) return met
  if (a === A_APPROACH) return approach(i, j, d)
  if (a === A_GUARD) return standsGuard(i) ? I_BACK : I_BACK | I_DOWN
  if (a === A_WAIT) return keepRange(i, j, d)
  if (a === A_RETREAT) return retreat(i)
  if (a === A_AA) return aaPlan(i, j)
  if (a === A_WALK_IN) return stepIn(i, j, d)
  if (a === A_WALK_OUT) return I_BACK
  planEnd(i)
  return 0
}

/**
 * The move each striking action uses: light, heavy, low, mid; punch or kick by `planB`. The mid
 * is the slot's ground move the table marks mid (an overhead), or, for a slot with none, its
 * standing heavy punch.
 */
function strikeMove(i: u16, a: u16): u16 {
  const kick = planB[i]
  if (a === A_LIGHT) return kick * 2
  if (a === A_HEAVY) return 1 + kick * 2
  if (a === A_LOW) return 6 + kick
  let m: u16 = 0
  while (m < 8) {
    if (mvAt(i, m, M_HEIGHT) === H_MID) return m
    m++
  }
  return 1
}

/**
 * A strike: walk in until it reaches, then press it (a crouched one with down); wary, it neither
 * walks into the other's reach nor strikes inside it until the other is open.
 */
function strikeAct(i: u16, j: u16, a: u16, d: u16): u16 {
  if (planT[i] > ATTACK_F) planT[i] = ATTACK_F
  const m = strikeMove(i, a)
  if (!onTurn(i) && d > reach[i * MOVES + m] + SLACK) return stepIn(i, j, d)
  if (onTurn(i) && !inReach(i, m, d)) return heldOff(i, d)
  if (!onTurn(i) && !mayCome(i, j, d)) return heldOff(i, d)
  const col = m & 3
  const b = col === 0 ? I_LP : col === 1 ? I_HP : col === 2 ? I_LK : I_HK
  const down = m >= 4 ? I_DOWN : 0
  if ((outWas[i] & b) !== 0) return down
  planEnd(i)
  return b | down
}

/**
 * Its move `m` reaches the other standing `d` points away: its box's tip and the other's body's
 * half (measured as the match began). A strike it walks to keeps SLACK instead, nearer, to be sure.
 */
function inReach(i: u16, m: u16, d: u16): bool {
  return d <= reach[i * MOVES + m] + otherHalf[i]
}

/** A jump in: from the middle distance, forward; the attack comes in the air (`airStep`). */
function jumpIn(i: u16, j: u16, d: u16): u16 {
  if (d > 140) return I_FWD
  if (wary(i) && !onTurn(i)) return keepRange(i, j, d)
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

/**
 * The throw: walk in to its range (wary, as a strike), then forward and the heavy punch. The
 * range from where the other was seen (`d`, R frames late), as everything it does, to the edge
 * of its body as its slot stands (`otherHalf`): the engine judges the throw by the body posed now.
 */
function throwAct(i: u16, j: u16, d: u16): u16 {
  if (planT[i] > ATTACK_F) planT[i] = ATTACK_F
  const gap = d > otherHalf[i] ? d - otherHalf[i] : 0
  if (gap + 4 > prAt(i, P_THROW)) {
    // Already within the other's longer throw: a jab, not a step further into it (S3's throw,
    // the longest, took every walk in of PACKET's habit).
    if (d <= reaches(j, MV_THROW)) return jab(i)
    return stepIn(i, j, d)
  }
  if (!onTurn(i) && !mayCome(i, j, d)) return heldOff(i, d)
  if ((outWas[i] & I_HP) !== 0) return I_FWD
  planEnd(i)
  return I_FWD | I_HP
}

/**
 * In: a dash (two taps) when it dashes and is far, else a walk to its range; wary, never into the
 * other's reach.
 */
function approach(i: u16, j: u16, d: u16): u16 {
  const dash = row(i, O_APPROACH) !== 0
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
  if (wary(i) && d <= edge(i)) return heldOff(i, d)
  if (d + w < want) return I_BACK
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
