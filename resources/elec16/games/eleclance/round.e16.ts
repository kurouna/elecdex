// ELECLANCE's rounds (docs/elec16-eleclance.md section 5): a game of rounds, a round's start,
// the script's commands, the two bosses' coming and going, the clear. In cartridge bank 4 with
// the title: a round's frame calls the play in RAM; the bosses' tiles come in through the kit's
// `load`, which puts the window back.
import { type bool, str, type u16 } from '../../../../src/shared/e16c/builtins'
import { B_START, load, pressed } from '../lib/kit.e16'
import {
  BASTION_AT,
  BASTION_BANK,
  BASTION_BYTES,
  BASTION_TILE,
  STAGE_H,
  ZENITH_AT,
  ZENITH_BANK,
  ZENITH_BYTES,
  ZENITH_TILE,
} from './assets.e16'
import { M_BOSS, M_STAGE, music } from './audio.e16'
import {
  B_BASTION,
  B_NONE,
  B_ZENITH,
  bastionStart,
  bossPhase,
  bossReset,
  zenithStart,
} from './boss.e16'
import { frameBegin, play_ } from './eleclance.e16'
import {
  CMD_BOSS,
  CMD_MIDBOSS,
  CMD_SPEED,
  foesClear,
  rankReset,
  roundIs,
  scriptArg,
  scriptStart,
  scriptStep,
} from './foes.e16'
import { itemsClear } from './fx.e16'
import { gameOver, hudLabels, pause, tally, warningStep } from './scenes.e16'
import { points, scoreNew } from './score.e16'
import { SH_GONE, shipNew, shipState } from './ship.e16'
import { boost, bulletsClear, shotsClear } from './shots.e16'
import {
  fieldClear,
  mapsClear,
  palettesIn,
  panelsIn,
  SL_GOLD,
  SL_TEXT,
  say,
  stageHold,
  stageRelease,
  stageSpeed,
  stageStart,
} from './view.e16'
import { missilesClear } from './weapons.e16'

/** A game: rounds of the stage until the last ship is lost, then GAME OVER and the best five. */
export function game(): void {
  rankReset()
  scoreNew()
  shipNew()
  roundIs(1)
  boost(0)
  let r: u16 = 1
  for (;;) {
    const cleared = stage(r)
    if (!cleared) break
    r = r + 1
    roundIs(r)
    boost(8)
  }
  gameOver()
}

/** One round of the stage: answers whether it was cleared. */
function stage(round: u16): bool {
  stageBegin(round)
  for (;;) {
    frameBegin()
    if (pressed(B_START)) pause()
    stageEvents()
    play_()
    if (shipState === SH_GONE) return false
    if (bossOutcome()) break
  }
  tally()
  return true
}

/** A round's start: the screen, the stage from its bottom, nothing left of the last round. */
function stageBegin(round: u16): void {
  mapsClear()
  panelsIn()
  hudLabels()
  stageStart()
  scriptStart()
  foesClear()
  bulletsClear()
  shotsClear()
  itemsClear()
  missilesClear()
  bossReset()
  bossOnWas = B_NONE
  banner = 150
  warning = 0
  clearT = 0
  music(M_STAGE)
  say(16, 15, round === 1 ? str('STAGE 1') : str('ROUND 2'), SL_GOLD)
  say(15, 17, str('READY'), SL_TEXT)
}

let banner: u16 = 0
let warning: u16 = 0
let clearT: u16 = 0

/** The banner's time, the script's commands and the warning before ZENITH. */
function stageEvents(): void {
  if (banner > 0) {
    banner--
    if (banner === 0) fieldClear()
  }
  const cmd = scriptStep()
  if (cmd === CMD_SPEED) stageSpeed(scriptArg)
  else if (cmd === CMD_MIDBOSS) midboss()
  else if (cmd === CMD_BOSS) warning = 300
  if (warning === 0) return
  warningStep(warning)
  warning--
  if (warning === 0) boss()
}

/**
 * What became of a boss: BASTION beaten or fled lets the stage go on; ZENITH beaten or fled
 * ends the round after a while. Answers whether the round is over. A beaten boss is worth
 * its points; a fled one nothing.
 */
function bossOutcome(): bool {
  if (bossOnWas !== B_NONE && (bossPhase === 10 || bossPhase === 11)) {
    if (bossPhase === 10) points(bossOnWas === B_BASTION ? 3000 : 10000)
    if (bossOnWas === B_BASTION) {
      stageRelease()
      music(M_STAGE)
    } else clearT = 1
    bossOnWas = B_NONE
  }
  if (clearT === 0) return false
  clearT++
  return clearT > 150
}

let bossOnWas: u16 = B_NONE

function midboss(): void {
  stageHold(STAGE_H - 64 - 128 - 96 - 64)
  bastionIn()
  bastionStart()
  bossOnWas = B_BASTION
  music(M_BOSS)
}

function boss(): void {
  fieldClear()
  palettesIn()
  stageHold(0)
  zenithIn()
  zenithStart()
  bossOnWas = B_ZENITH
  music(M_BOSS)
}

/** BASTION's tiles, over the title's word and the battleship's: never on the screen together. */
function bastionIn(): void {
  load(BASTION_BANK, BASTION_AT, BASTION_TILE * 32, BASTION_BYTES)
}

function zenithIn(): void {
  load(ZENITH_BANK, ZENITH_AT, ZENITH_TILE * 32, ZENITH_BYTES)
}
