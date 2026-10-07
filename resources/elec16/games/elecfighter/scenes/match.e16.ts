// ELECFIGHTER's ladder and match (docs/elec16-elecfighter-design.md 5.4, 7.2, 7.10.5): the four
// opponents in turn - the ones whose slot is not the person's in the table's order, then the
// MIRROR (ROOT) - a CONTINUE? count after a loss, SYSTEM CLEAR after the last; each match the
// fighters and the stage the opponent's row names, then rounds of 99, each with its ROUND and
// FIGHT banners, until one side has two; a draw (TIME UP with the same life, a double KO) is
// played again, and a third in a row loses it for both. START pauses the fight. The frame
// itself is engine/main.e16.ts's. In bank 1: once a frame at most, and the frame's work is
// called from here into RAM. The screens are plain words until P3 draws them.
import { type bool, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import { B_A, B_START, pressed } from '../../lib/kit.e16'
import { cpuMatchSet, cpuRoundReset } from '../cpu/ai.e16'
import { habitLadder } from '../cpu/habit.e16'
import {
  fighterLoad,
  O_FLAGS,
  O_SLOT,
  O_STAGE,
  OF_MIRROR,
  OPPONENTS,
  OW,
  opp,
  oppLoad,
  oppName,
  oppWord,
  stageLoad,
} from '../engine/data.e16'
import { bandClear, bandShow, hudClear, hudStatic } from '../engine/draw.e16'
import { fComboMax, fighterReset, fSlot } from '../engine/fighter.e16'
import { hitstopIs } from '../engine/hit.e16'
import { ringClear } from '../engine/input.e16'
import {
  clockReset,
  frameBegin,
  frameStep,
  PH_END,
  PH_FIGHT,
  PH_OVER,
  PH_ROUND,
  phase,
  phaseIs,
  phaseT,
  phaseTick,
  roundWon,
  screenClear,
} from '../engine/main.e16'
import { continueAsk, gameOver, pauseRun, systemClear } from './pause.e16'

/** The round (from 1), each side's rounds won, draws and double KOs in a row. */
export let round: u16 = 1
export const wins = words(2)
export let draws: u16 = 0
/** The match's end: 0 still on, 1 P1 won, 2 P2 won, 3 both lost (a third draw), 4 quit. */
export let outcome: u16 = 0
/**
 * What is played: P1's slot, the ladder's first place (0; tests start further on), and the row
 * a CPU playing P1 plays by (tests). Until the select screen comes (P3), S1 BALANCE.
 */
export const choice = words(3)
/** The ladder's four opponents (rows of cpu/opponents.txt), the place in it, and how it ended. */
export const ladder = words(4)
export let ladderAt: u16 = 0
/** 0 still on, 1 SYSTEM CLEAR, 2 GAME OVER, 3 quit from the pause. */
export let ladderEnd: u16 = 0
export let continues: u16 = 0

const ROUND_F = 45
const FIGHT_BAND_F = 30
const OVER_F = 120
const END_F = 150
const VERSUS_F = 60
const WINS = 2
const DRAWS_LOST = 3
const LADDER = 4
const QUIT = 4

/** The ladder from its first place to SYSTEM CLEAR, GAME OVER or a quit. */
export function ladderPlay(): void {
  ladderBuild()
  habitLadder()
  ladderEnd = 0
  continues = 0
  let k = choice[1]
  while (k < LADDER) {
    ladderAt = k
    matchPlay(ladder[k], k)
    if (outcome === QUIT) {
      ladderEnd = 3
      return
    }
    if (outcome === 1) k++
    else if (continueAsk()) continues++
    else {
      ladderEnd = 2
      gameOver()
      return
    }
  }
  ladderEnd = 1
  systemClear()
}

/**
 * The ladder's order (design 7.10.5): the rows that are not a MIRROR and whose slot is not P1's,
 * in the table's order of strength, then the MIRROR - by the table's numbers, never its names.
 */
function ladderBuild(): void {
  let n: u16 = 0
  let k: u16 = 0
  while (k < OPPONENTS && n < LADDER - 1) {
    const mirror = (oppWord(k, O_FLAGS) & OF_MIRROR) !== 0
    if (!mirror && oppWord(k, O_SLOT) !== choice[0]) {
      ladder[n] = k
      n++
    }
    k++
  }
  k = 0
  while (k < OPPONENTS && n < LADDER) {
    if ((oppWord(k, O_FLAGS) & OF_MIRROR) !== 0) {
      ladder[n] = k
      n++
    }
    k++
  }
}

/** A match against row `k`, the ladder's `pos`th: rounds until one side has two, or a third draw. */
function matchPlay(k: u16, pos: u16): void {
  oppLoad(1, k, pos)
  oppLoad(0, choice[2], 0)
  fSlot[0] = choice[0]
  fSlot[1] = (opp[OW + O_FLAGS] & OF_MIRROR) !== 0 ? choice[0] : opp[OW + O_SLOT]
  fighterLoad(0, fSlot[0])
  fighterLoad(1, fSlot[1])
  screenClear()
  stageLoad(opp[OW + O_STAGE])
  cpuMatchSet(0)
  cpuMatchSet(1)
  wins[0] = 0
  wins[1] = 0
  round = 1
  draws = 0
  outcome = 0
  fComboMax[0] = 0
  fComboMax[1] = 0
  versus(k)
  while (outcome === 0) roundPlay()
  if (outcome === QUIT) return
  phaseIs(PH_END)
  if (outcome === 1) bandShow(str('P1 WINS'))
  else if (outcome === 2) bandShow(str('CPU WINS'))
  else bandShow(str('BOTH LOSE'))
  while (phaseT < END_F) {
    frameStep()
    phaseTick()
  }
}

/** Who comes: the program's name on the band for a second (START or A goes on). */
function versus(k: u16): void {
  bandShow(oppName[k])
  let t: u16 = 0
  while (t < VERSUS_F) {
    frameBegin()
    if (pressed(B_START) || pressed(B_A)) break
    t++
  }
  bandClear()
}

/** A round: its banner, the fight, its end. */
function roundPlay(): void {
  fighterReset(0)
  fighterReset(1)
  ringClear()
  hitstopIs(0)
  clockReset()
  cpuRoundReset(0)
  cpuRoundReset(1)
  hudStatic(str('CPU'), wins[0], wins[1])
  bandShow(roundWord(round))
  phaseIs(PH_ROUND)
  for (;;) {
    frameStep()
    phaseTick()
    if (phase === PH_FIGHT && pressed(B_START) && pauseRun() !== 0) {
      outcome = QUIT
      return
    }
    if (phaseStep()) return
  }
}

/** The HUD drawn afresh on a cleared BG1, after the pause's controls. */
export function matchHud(): void {
  hudClear()
  hudStatic(str('CPU'), wins[0], wins[1])
}

function roundWord(n: u16): u16 {
  if (n === 1) return str('ROUND 1')
  if (n === 2) return str('ROUND 2')
  if (n === 3) return str('ROUND 3')
  if (n === 4) return str('ROUND 4')
  return str('FINAL ROUND')
}

/** The phase on: the banner gives way to the fight; a round over is scored. True when done. */
function phaseStep(): bool {
  if (phase === PH_ROUND && phaseT >= ROUND_F) {
    phaseIs(PH_FIGHT)
    bandShow(str('FIGHT'))
  } else if (phase === PH_FIGHT && phaseT === FIGHT_BAND_F) bandClear()
  else if (phase === PH_OVER && phaseT >= OVER_F) {
    roundScore()
    return true
  }
  return false
}

/** The round's end counted (design 7.2): a win, or a draw played again until the third. */
function roundScore(): void {
  bandClear()
  if (roundWon === 2) {
    draws++
    if (draws >= DRAWS_LOST) outcome = 3
    return
  }
  draws = 0
  wins[roundWon]++
  round++
  if (wins[roundWon] >= WINS) outcome = roundWon + 1
}
