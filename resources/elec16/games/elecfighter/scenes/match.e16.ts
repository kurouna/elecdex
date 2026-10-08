// ELECFIGHTER's ladder and match (docs/elec16-elecfighter-design.md 5.4, 7.2, 7.10.5): the four
// opponents in turn - the ones whose slot is not the person's in the table's order, then the
// MIRROR (ROOT) - each match's result, a CONTINUE? count after a loss, SYSTEM CLEAR after the
// last; each match the fighters and the stage the opponent's row names, the versus screen, the
// stage's song, then rounds of 99, each with its ROUND and FIGHT banners, until one side has two;
// a draw (TIME UP with the same life, a double KO) is played again, and a third in a row loses
// it for both. START pauses the fight. The frame itself is engine/main.e16.ts's. In bank 1: once
// a frame at most, and the frame's work is called from here into RAM.
import { type bool, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import { B_START, cellAt, palette, palKeep, pressed, vpoke } from '../../lib/kit.e16'
import { HUD_TILE, PAL_CPU, PAL_MIRROR } from '../assets.e16'
import { cpuMatchSet, cpuRoundReset } from '../cpu/ai.e16'
import { habitLadder } from '../cpu/habit.e16'
import { M_LOSE, M_WIN, music } from '../engine/audio.e16'
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
  oppWord,
  slName,
  stageLoad,
  stageMusic,
} from '../engine/data.e16'
import {
  bandClear,
  bandHigh,
  bandShow,
  bandSub,
  FLIP,
  FRONT,
  hudClear,
  hudFresh,
  hudTile,
  SL_DIM,
  SL_P1,
  say,
  T_LAMP,
  T_RULE,
  T_TICK,
} from '../engine/draw.e16'
import { fComboMax, fighterReset, fSlot } from '../engine/fighter.e16'
import { hitstopIs } from '../engine/hit.e16'
import { ringClear } from '../engine/input.e16'
import { hitsN, palKey } from '../engine/look.e16'
import {
  clockReset,
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
  SC_FIGHT,
  screenClear,
  screenIs,
} from '../engine/main.e16'
import { pauseRun } from './pause.e16'
import { continueAsk, gameOver, resultShow, systemClear } from './result.e16'
import { versusRun } from './select.e16'

/** The round (from 1), each side's rounds won, draws and double KOs in a row. */
export let round: u16 = 1
export const wins = words(2)
export let draws: u16 = 0
/** The match's end: 0 still on, 1 P1 won, 2 P2 won, 3 both lost (a third draw), 4 quit. */
export let outcome: u16 = 0
/**
 * What is played: P1's slot (the select screen's choice), the ladder's first place (0; tests
 * start further on), and the row a CPU playing P1 plays by (tests).
 */
export const choice = words(3)
/** The ladder's four opponents (rows of cpu/opponents.txt), the place in it, and how it ended. */
export const ladder = words(4)
export let ladderAt: u16 = 0
/** 0 still on, 1 SYSTEM CLEAR, 2 GAME OVER, 3 quit from the pause. */
export let ladderEnd: u16 = 0
export let continues: u16 = 0
/** The ladder's time so far, in seconds and frames into the next (the rounds, banners and all). */
export let clearSec: u16 = 0
let clearT: u16 = 0

const ROUND_F = 45
const FIGHT_BAND_F = 30
const SUB_AT = 20
const OVER_F = 120
const END_F = 150
const WINS = 2
const DRAWS_LOST = 3
const LADDER = 4
const QUIT = 4
const CLOCK_SECOND = 60

/** The ladder from its first place to SYSTEM CLEAR, GAME OVER or a quit. */
export function ladderPlay(): void {
  ladderBuild()
  habitLadder()
  ladderEnd = 0
  continues = 0
  clearSec = 0
  clearT = 0
  let k = choice[1]
  while (k < LADDER) {
    ladderAt = k
    matchPlay(ladder[k], k)
    if (outcome === QUIT) {
      ladderEnd = 3
      return
    }
    const won = outcome === 1
    resultShow(ladder[k])
    if (won) k++
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
  sidePalette()
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
  hitsN[0] = 0
  hitsN[1] = 0
  versusRun(k)
  music(stageMusic())
  while (outcome === 0) roundPlay()
  if (outcome === QUIT) return
  phaseIs(PH_END)
  bandHigh()
  if (outcome === 1) {
    bandShow(str('YOU WIN'))
    music(M_WIN)
  } else {
    bandShow(outcome === 2 ? str('YOU LOSE') : str('BOTH LOSE'))
    music(M_LOSE)
  }
  while (phaseT < END_F) {
    frameStep()
    phaseTick()
  }
  bandClear()
}

/**
 * P2's palette for the match (slot 9): the CPU's, or the mirror's - the wire another hue, design
 * 2.4 - when both sides show the same body (ROOT, or the same slot).
 */
function sidePalette(): void {
  const row = fSlot[0] === fSlot[1] ? PAL_MIRROR : PAL_CPU
  palette(row, 9)
  palKeep(row, 9)
}

/** A round: its banner, the fight, its end. */
function roundPlay(): void {
  screenIs(SC_FIGHT)
  fighterReset(0)
  fighterReset(1)
  ringClear()
  hitstopIs(0)
  clockReset()
  cpuRoundReset(0)
  cpuRoundReset(1)
  palKey[0] = 0xffff
  palKey[1] = 0xffff
  hudDraw()
  bandShow(roundWord(round))
  phaseIs(PH_ROUND)
  for (;;) {
    frameStep()
    phaseTick()
    clockOn()
    if (phase === PH_FIGHT && pressed(B_START) && pauseRun() !== 0) {
      outcome = QUIT
      return
    }
    if (phaseStep()) return
  }
}

/** The ladder's clock: a second every 60 frames of its rounds. */
function clockOn(): void {
  clearT++
  if (clearT < CLOCK_SECOND) return
  clearT = 0
  clearSec++
}

/** The HUD drawn afresh on a cleared BG1, after the pause's controls. */
export function matchHud(): void {
  hudClear()
  hudDraw()
}

/**
 * The HUD as a round begins (BG1 clear but for the band): each side's heading - a ruled title
 * like a pane's, the slot and role bright, who plays it dim - TIME's word, the lamps of the
 * rounds won, and the bars and time drawn anew.
 */
function hudDraw(): void {
  heading(0)
  heading(22)
  say(2, 1, slName[fSlot[0]], SL_P1)
  say(13, 1, str('P1'), SL_DIM)
  say(24, 1, str('CPU'), SL_P1)
  say(28, 1, slName[fSlot[1]], SL_DIM)
  say(18, 3, str('TIME'), SL_DIM)
  lamps(15, wins[0], false)
  lamps(23, wins[1], true)
  hudFresh()
}

function heading(x: u16): void {
  hudTile(x, 1, T_RULE, SL_P1)
  hudTile(x + 1, 1, T_TICK, SL_P1)
  vpoke(cellAt(1, x + 16, 1), (HUD_TILE + T_TICK) | (SL_P1 << 10) | FRONT | FLIP)
  hudTile(x + 17, 1, T_RULE, SL_P1)
}

/** Two lamps from column `x`, `n` of them lit (from the middle outwards). */
function lamps(x: u16, n: u16, right: bool): void {
  let k: u16 = 0
  while (k < 2) {
    const lit = right ? k < n : 1 - k < n
    hudTile(x + k, 3, T_LAMP + (lit ? 1 : 0), SL_P1)
    k++
  }
}

function roundWord(n: u16): u16 {
  if (n === 1) return str('ROUND 1')
  if (n === 2) return str('ROUND 2')
  return str('ROUND 3')
}

/**
 * The phase on: the banner gives way to the fight; a round over says who took it under its
 * banner, and is scored. True when done.
 */
function phaseStep(): bool {
  if (phase === PH_ROUND && phaseT >= ROUND_F) {
    phaseIs(PH_FIGHT)
    bandShow(str('FIGHT'))
  } else if (phase === PH_FIGHT && phaseT === FIGHT_BAND_F) bandClear()
  else if (phase === PH_OVER && phaseT === SUB_AT) {
    if (roundWon === 0) bandSub(str('P1 TAKES THE ROUND'))
    else if (roundWon === 1) bandSub(str('CPU TAKES THE ROUND'))
    else bandSub(str('DRAW'))
  } else if (phase === PH_OVER && phaseT >= OVER_F) {
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
