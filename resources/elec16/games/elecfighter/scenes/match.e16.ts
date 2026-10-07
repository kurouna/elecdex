// ELECFIGHTER's match (docs/elec16-elecfighter-design.md 7.2): the fighters and the stage the
// opponent's row names, then rounds of 99 - each with its ROUND and FIGHT banners - until one
// side has two; a draw (TIME UP with the same life, a double KO) is played again, and a third in
// a row loses it for both. The frame itself is engine/main.e16.ts's. In bank 1: once a frame
// at most, and the frame's work is called from here into RAM.
import { type bool, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import { fighterLoad, O_SLOT, O_STAGE, opp, oppLoad, stageLoad } from '../engine/data.e16'
import { bandClear, bandShow, hudStatic } from '../engine/draw.e16'
import { fComboMax, fighterReset, fSlot } from '../engine/fighter.e16'
import { hitstopIs } from '../engine/hit.e16'
import { ringClear } from '../engine/input.e16'
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
  screenClear,
} from '../engine/main.e16'

/** The round (from 1), each side's rounds won, draws and double KOs in a row. */
export let round: u16 = 1
export const wins = words(2)
export let draws: u16 = 0
/** The match's end: 0 still on, 1 P1 won, 2 P2 won, 3 both lost (a third draw). */
export let outcome: u16 = 0
/**
 * What the match is: P1's slot and the opponent's row (the registries' numbers). Until the
 * select screen comes (P3), S1 BALANCE against the stand-in; tests choose others.
 */
export const choice = words(2)

const ROUND_F = 45
const FIGHT_BAND_F = 30
const OVER_F = 120
const END_F = 150
const WINS = 2
const DRAWS_LOST = 3

/** A match as `choice` says: rounds until one side has two, or a third draw. */
export function matchPlay(): void {
  oppLoad(choice[1])
  fSlot[0] = choice[0]
  fSlot[1] = opp[O_SLOT]
  fighterLoad(0, fSlot[0])
  fighterLoad(1, fSlot[1])
  screenClear()
  stageLoad(opp[O_STAGE])
  wins[0] = 0
  wins[1] = 0
  round = 1
  draws = 0
  outcome = 0
  fComboMax[0] = 0
  fComboMax[1] = 0
  while (outcome === 0) roundPlay()
  phaseIs(PH_END)
  if (outcome === 1) bandShow(str('P1 WINS'))
  else if (outcome === 2) bandShow(str('CPU WINS'))
  else bandShow(str('BOTH LOSE'))
  while (phaseT < END_F) {
    frameStep()
    phaseTick()
  }
}

/** A round: its banner, the fight, its end. */
function roundPlay(): void {
  fighterReset(0)
  fighterReset(1)
  ringClear()
  hitstopIs(0)
  clockReset()
  hudStatic(str('CPU'), wins[0], wins[1])
  bandShow(roundWord(round))
  phaseIs(PH_ROUND)
  for (;;) {
    frameStep()
    phaseTick()
    if (phaseStep()) return
  }
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
