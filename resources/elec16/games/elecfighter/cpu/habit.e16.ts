// ELECFIGHTER's CPU, its memory (docs/elec16-elecfighter-design.md 7.10.2, 7.10.3): the other's
// record - in 5 situations (after its attack was guarded, waking, at the middle distance, landing
// from a jump attack, low on life), what it did (struck, threw, jumped, went back, waited) -
// counted as 8-bit tallies, the old halved every 16 of a situation; the reads it makes from it;
// its own habit's triggers, a count drawn from a range each time; and where the two stand the
// longest. It watches only the ring of what was (1 frame old at the least), never this frame's
// buttons. One record lasts a match; a second the whole ladder, for an opponent that KEEPS it
// (ROOT). In bank 8, on its own (bank 2, ai.e16.ts's, has no room for it): the CPU calls it twice a
// frame for each fighter it plays, and it reads its row from RAM rather than call back.
import { type bool, bytes, type u16, words } from '../../../../../src/shared/e16c/builtins'
import { randBelow } from '../../lib/kit.e16'
import {
  H_LOW,
  K_HEAVY,
  M_HEIGHT,
  M_KIND,
  MV_THROW,
  mvAt,
  O_EVENT,
  O_FLAGS,
  O_HABIT,
  O_PATTERN,
  O_READ,
  O_TRIG_MAX,
  O_TRIG_MIN,
  OF_KEEP,
  OW,
  opp,
  P_LIFE,
  prAt,
} from '../engine/data.e16'
import { LOG_READ, logPost } from '../engine/draw.e16'
import {
  fLife,
  ST_ATTACK,
  ST_BACKDASH,
  ST_CROUCH,
  ST_DOWN,
  ST_LAND,
  ST_PREJUMP,
  ST_STAND,
  ST_WAKE,
} from '../engine/fighter.e16'
import { seenF, seenN, seenS, seenX, seenY } from '../engine/main.e16'
import {
  A_AA,
  A_APPROACH,
  A_GUARD,
  A_LIGHT,
  A_THROW,
  habitDue,
  LOWS,
  lastML,
  patGap,
  patNo,
  planSet,
  THROW_ONE,
  THROWS_MASK,
} from './ai.e16'

/**
 * Column `c` of fighter `i`'s row, read from RAM here: ai.e16.ts's `row` is in another bank, a
 * far call each time, and the habit reads its row every frame.
 */
function oppAt(i: u16, c: u16): u16 {
  return opp[i * OW + c]
}

/** The record's situations and actions. */
const HS_GUARDED = 0
const HS_WAKE = 1
const HS_MIDDLE = 2
const HS_LANDED = 3
const HS_LOW = 4
const DID_STRIKE = 0
const DID_THROW = 1
const DID_JUMP = 2
const DID_BACK = 3
const DID_WAIT = 4
const NONE = 255
/** Frames watched for what follows a situation's start before it counts as waiting. */
const WATCH_F = 40
/** Frames between watchings of the middle distance, once one ends. */
const REST_F = 40
/** A tally's step, its most, and a read's least: two of a situation seen. */
const STEP = 16
const MOST = 255
const KNOWN = 32
/** Frames going back, in a row, that count as going back. */
const BACK_F = 6

/**
 * The records: [record (0 the match's, 1 the ladder's)][fighter watched][situation][action],
 * tallies; and how many of each situation each has seen, to halve the old every 16.
 */
export const hab = bytes(100)
const habSeen = bytes(20)
/** A watching under way: the situation (NONE none), its frames, frames until the next may start. */
const watchSit = words(2)
const watchT = words(2)
const rest = words(2)
const backT = words(2)
/** The other's attack was guarded (a watching starts once it is free); it struck in the air. */
const wasGuarded = words(2)
const airStruck = words(2)
/** A read acted on: the action foreseen, and the tests' counts. */
const readOn = words(2)
const readPred = words(2)
export const reads = words(2)
export const readHits = words(2)
export const readMiss = words(2)
/** The habit's count of triggers, the count it is due at, the last such count. */
const habCount = words(2)
const habTarget = words(2)
const habLast = words(2)
/** For the tests: times a habit was due, times it came out, and the last 16 counts drawn. */
export const habDue = words(2)
export const habFired = words(2)
export const habDrawn = words(32)
export const habDrawnN = words(2)
/** Where the two have stood, in 16-point steps, a count each eight frames (the ladder through). */
export const hist = words(16)

/** Fighter `i`'s watching, new for a round. */
export function watchReset(i: u16): void {
  watchSit[i] = NONE
  watchT[i] = 0
  rest[i] = 0
  backT[i] = 0
  wasGuarded[i] = 0
  airStruck[i] = 0
  readOn[i] = 0
  habCount[i] = 0
  if (habTarget[i] === 0) drawTarget(i)
}

/** The match's record cleared, and fighter `i`'s counts for the tests. */
export function habitMatch(i: u16): void {
  let k: u16 = 0
  while (k < 50) {
    hab[k] = 0
    k++
  }
  k = 0
  while (k < 10) {
    habSeen[k] = 0
    k++
  }
  reads[i] = 0
  readHits[i] = 0
  readMiss[i] = 0
  habDue[i] = 0
  habFired[i] = 0
  habDrawnN[i] = 0
  habTarget[i] = 0
  habLast[i] = 0
}

/** The ladder's record and where the two stood, cleared as a ladder begins. */
export function habitLadder(): void {
  let k: u16 = 50
  while (k < 100) {
    hab[k] = 0
    k++
  }
  k = 10
  while (k < 20) {
    habSeen[k] = 0
    k++
  }
  k = 0
  while (k < 16) {
    hist[k] = 0
    k++
  }
}

/** The distance the two have stood at the longest, in points (the middle of its step). */
export function histRange(): u16 {
  let best: u16 = 4
  let k: u16 = 0
  while (k < 16) {
    if (hist[k] > hist[best]) best = k
    k++
  }
  return best * 16 + 8
}

/* ---------------- watching the other ---------------- */

/**
 * Fighter `j`'s entry in the ring `age` frames ago, for the record: what has been done, watched
 * a frame late at the least (a reaction reads through ai.e16.ts's `seenAt`, R frames late).
 */
function pastAt(j: u16, age: u16): u16 {
  return j * 32 + ((seenN - age) & 31)
}

function stateAt(j: u16, age: u16): u16 {
  return seenS[pastAt(j, age)] & 255
}

/** Points between the two `age` frames ago. */
function apartPast(age: u16): u16 {
  const a = seenX[pastAt(0, age)]
  const b = seenX[pastAt(1, age)]
  return a > b ? a - b : b - a
}

/**
 * Fighter `i` watches the other (`j`): a situation's start, then what `j` does next, into the
 * record; a read acted on is checked against it.
 */
export function observe(i: u16, j: u16): void {
  const e = pastAt(j, 1)
  const s1 = seenS[e] & 255
  const s2 = stateAt(j, 2)
  marks(i, e, s1)
  where()
  if (watchSit[i] === NONE && !watchStart(i, j, s1, s2)) return
  watchT[i]++
  let did = didOf(i, j, s1, s2)
  if (did === NONE && watchT[i] >= WATCH_F) did = DID_WAIT
  if (did === NONE) return
  tally(j, watchSit[i], did)
  readCheck(i, did)
  if (watchSit[i] === HS_MIDDLE || watchSit[i] === HS_LOW) rest[i] = REST_F
  watchSit[i] = NONE
}

/**
 * What the last frame showed of `j`: its attack guarded, a strike in the air; and a knockdown
 * ends what was being watched (what follows it is another situation).
 */
function marks(i: u16, e: u16, s1: u16): void {
  if (seenF[e] >> 8 === 2) wasGuarded[i] = 1
  if (s1 === ST_ATTACK && seenY[e] === 0 && (seenF[e] & 255) === 1) lowsCount(i, e)
  if (s1 === ST_ATTACK && seenY[e] > 0) airStruck[i] = 1
  if (s1 !== ST_ATTACK && s1 !== ST_LAND && seenY[e] === 0) airStruck[i] = 0
  if (s1 === ST_DOWN && watchSit[i] !== NONE && watchSit[i] !== HS_WAKE) {
    watchSit[i] = NONE
    readOn[i] = 0
  }
}

/**
 * The other's lows in a row on the ground (ai.e16.ts's `lastML`, high byte: a high or mid ends
 * them) and its throws in a row (bits 4-5: any strike ends them).
 */
function lowsCount(i: u16, e: u16): void {
  const m = seenS[e] >> 8
  if (m === MV_THROW) {
    if ((lastML[i] & THROWS_MASK) !== THROWS_MASK) lastML[i] = lastML[i] + THROW_ONE
    return
  }
  lastML[i] = lastML[i] & ~THROWS_MASK
  if (m >= 8 || mvAt(1 - i, m, M_HEIGHT) !== H_LOW) lastML[i] = lastML[i] & 255
  else if (lastML[i] >> 8 < LOWS) lastML[i] = lastML[i] + 256
}

/** A watching begins if a situation does (and a read is tried on it): whether one did. */
function watchStart(i: u16, j: u16, s1: u16, s2: u16): bool {
  if (rest[i] > 0) rest[i]--
  const sit = startOf(i, j, s1, s2)
  if (sit === NONE) return false
  watchSit[i] = sit
  watchT[i] = 0
  backT[i] = 0
  readTry(i, j, sit)
  return true
}

/** Each eight frames, where the two stand. */
function where(): void {
  if ((seenN & 7) !== 0) return
  const d = apartPast(1) >> 4
  if (d < 16 && hist[d] < 0xfff0) hist[d]++
}

/**
 * A situation of `j` begins: waking, freed after its attack was guarded, landed, or at the middle.
 */
function startOf(i: u16, j: u16, s1: u16, s2: u16): u16 {
  if (s1 === ST_WAKE && s2 === ST_DOWN) return HS_WAKE
  const freed = s1 === ST_STAND || s1 === ST_CROUCH
  if (wasGuarded[i] !== 0 && freed) {
    wasGuarded[i] = 0
    return HS_GUARDED
  }
  if (s1 === ST_LAND && s2 !== ST_LAND && airStruck[i] !== 0) {
    airStruck[i] = 0
    return HS_LANDED
  }
  if (!freed || rest[i] > 0) return NONE
  const d = apartPast(1)
  if (d < 50 || d > 150) return NONE
  return fLife[j] * 4 < prAt(j, P_LIFE) ? HS_LOW : HS_MIDDLE
}

/** What `j` did, if it did anything yet: a move begun, a jump, a backdash, a walk back. */
function didOf(i: u16, j: u16, s1: u16, s2: u16): u16 {
  if (s1 === ST_WAKE || s1 === ST_DOWN) return NONE
  if (s1 === ST_ATTACK && s2 !== ST_ATTACK) {
    return seenS[pastAt(j, 1)] >> 8 === MV_THROW ? DID_THROW : DID_STRIKE
  }
  if (s1 === ST_PREJUMP) return DID_JUMP
  if (s1 === ST_BACKDASH) return DID_BACK
  if (s1 === ST_STAND && apartPast(1) > apartPast(2)) backT[i]++
  else backT[i] = 0
  return backT[i] >= BACK_F ? DID_BACK : NONE
}

/** One more of `did` in situation `sit` of fighter `j`, in both records. */
function tally(j: u16, sit: u16, did: u16): void {
  let r: u16 = 0
  while (r < 2) {
    const base = r * 50 + j * 25 + sit * 5
    const v = hab[base + did] + STEP
    hab[base + did] = v > MOST ? MOST : v
    const n = r * 10 + j * 5 + sit
    habSeen[n] = habSeen[n] + 1
    if ((habSeen[n] & 15) === 0) halve(base)
    r++
  }
}

function halve(base: u16): void {
  let k: u16 = 0
  while (k < 5) {
    hab[base + k] = hab[base + k] >> 1
    k++
  }
}

/* ---------------- reading (design 7.10.2) ---------------- */

/**
 * At a situation's start, by its chance, the CPU acts on what the other has done most there -
 * if it has been seen twice and is more than half of it - before it can see what comes.
 */
function readTry(i: u16, j: u16, sit: u16): void {
  if (randBelow(256) >= oppAt(i, O_READ)) return
  const base = ((oppAt(i, O_FLAGS) & OF_KEEP) !== 0 ? 50 : 0) + j * 25 + sit * 5
  let best: u16 = 0
  let sum: u16 = 0
  let k: u16 = 0
  while (k < 5) {
    sum = sum + hab[base + k]
    if (hab[base + k] > hab[base + best]) best = k
    k++
  }
  if (sum < KNOWN || hab[base + best] * 2 <= sum) return
  reads[i]++
  readOn[i] = 1
  readPred[i] = best
  answer(i, best)
}

/**
 * What beats each: a guard for a strike, a light for a throw's start, the anti-air, a dash in, the
 * throw.
 */
function answer(i: u16, did: u16): void {
  patNo[i] = 0
  if (did === DID_STRIKE) planSet(i, A_GUARD, 30)
  else if (did === DID_THROW) planSet(i, A_LIGHT, 30)
  else if (did === DID_JUMP) planSet(i, A_AA, 40)
  else if (did === DID_BACK) planSet(i, A_APPROACH, 30)
  else planSet(i, A_THROW, 30)
}

/** A read checked against what was done: READ on the log when it was right. */
function readCheck(i: u16, did: u16): void {
  if (readOn[i] === 0) return
  readOn[i] = 0
  if (did === readPred[i]) {
    readHits[i]++
    logPost(LOG_READ, i, 0)
  } else readMiss[i]++
}

/* ---------------- its own habit (design 7.10.3) ---------------- */

/**
 * The habit's triggers counted (its row's event); at the count drawn it is due, by its chance -
 * never always - and a new count is drawn, never the last one again.
 */
export function habitStep(i: u16, j: u16): void {
  if (oppAt(i, O_PATTERN) === 0) return
  if (!triggered(i, j, oppAt(i, O_EVENT))) return
  habCount[i]++
  if (habCount[i] < habTarget[i]) return
  habCount[i] = 0
  habDue[i]++
  patGap[i] = habTarget[i]
  drawTarget(i)
  if (randBelow(256) >= oppAt(i, O_HABIT)) return
  habFired[i]++
  habitDue[i] = 1
}

/**
 * One trigger of event `ev` this frame: its light or heavy guarded, the other walking back, a
 * frame.
 */
function triggered(i: u16, j: u16, ev: u16): bool {
  if (ev === 4) return true
  if (ev === 3) return stateAt(j, 1) === ST_STAND && apartPast(1) > apartPast(2)
  if (ev !== 1 && ev !== 2) return false
  const e = pastAt(i, 1)
  if (seenF[e] >> 8 !== 2) return false
  const heavy = (mvAt(i, seenS[e] >> 8, M_KIND) & K_HEAVY) !== 0
  return heavy === (ev === 2)
}

/** A new count of triggers, drawn from the row's range, never the same twice running. */
function drawTarget(i: u16): void {
  const lo = oppAt(i, O_TRIG_MIN)
  const hi = oppAt(i, O_TRIG_MAX)
  let n = lo + randBelow(hi - lo + 1)
  if (n === habLast[i] && hi > lo) n = n === hi ? lo : n + 1
  habLast[i] = n
  habTarget[i] = n
  habDrawn[i * 16 + (habDrawnN[i] & 15)] = n
  habDrawnN[i]++
}
