// ELECLANCE, ELEC-16 PLAY's vertical shooter (docs/elec16-eleclance.md): the title, the game -
// a stage, a half-way boss, a battleship - the clear and its tally, the second round, the
// game's end and the best five. Everything else is in the files beside this one.
import { type bool, i16, peek16, poke16, str, type u16 } from '../../../../src/shared/e16c/builtins'
import {
  B_START,
  bank,
  cellAt,
  frame_wait,
  IO_BANK,
  kitInit,
  load,
  padRead,
  palette,
  palKeep,
  pressed,
  sprBegin,
  sprShow,
  vpoke,
} from '../lib/kit.e16'
import { soundInit, soundTick } from '../lib/sound.e16'
import {
  BASTION_AT,
  BASTION_BANK,
  BASTION_BYTES,
  BASTION_TILE,
  BITS_AT,
  BITS_BANK,
  BITS_BYTES,
  BITS_TILE,
  BLAST_BIG_AT,
  BLAST_BIG_BANK,
  BLAST_BIG_BYTES,
  BLAST_BIG_TILE,
  BLAST_SMALL_AT,
  BLAST_SMALL_BANK,
  BLAST_SMALL_BYTES,
  BLAST_SMALL_TILE,
  BULLETS_AT,
  BULLETS_BANK,
  BULLETS_BYTES,
  BULLETS_TILE,
  DART_AT,
  DART_BANK,
  DART_BYTES,
  DART_TILE,
  FAR_STARS_AT,
  FAR_STARS_BANK,
  FAR_STARS_BYTES,
  FAR_STARS_TILE,
  FLAME_AT,
  FLAME_BANK,
  FLAME_BYTES,
  FLAME_TILE,
  FONT_AT,
  FONT_BANK,
  FONT_BYTES,
  FONT_TILE,
  HALBERD_AT,
  HALBERD_BANK,
  HALBERD_BYTES,
  HALBERD_TILE,
  LANCE_AT,
  LANCE_BANK,
  LANCE_BYTES,
  LANCE_ENDS_AT,
  LANCE_ENDS_BANK,
  LANCE_ENDS_BYTES,
  LANCE_ENDS_TILE,
  LANCE_TILE,
  LOGO_H,
  LOGO_MAP_BANK,
  LOGO_TILE,
  LOGO_TILES_AT,
  LOGO_TILES_BANK,
  LOGO_TILES_BYTES,
  LOGO_W,
  MOTE_AT,
  MOTE_BANK,
  MOTE_BYTES,
  MOTE_TILE,
  ORBS_AT,
  ORBS_BANK,
  ORBS_BYTES,
  ORBS_TILE,
  PAL_LOGO,
  PICKUPS_AT,
  PICKUPS_BANK,
  PICKUPS_BYTES,
  PICKUPS_TILE,
  PIKE_AT,
  PIKE_BANK,
  PIKE_BYTES,
  PIKE_TILE,
  RING_AT,
  RING_BANK,
  RING_BYTES,
  RING_TILE,
  ROCK_BIG_AT,
  ROCK_BIG_BANK,
  ROCK_BIG_BYTES,
  ROCK_BIG_TILE,
  ROCK_SMALL_AT,
  ROCK_SMALL_BANK,
  ROCK_SMALL_BYTES,
  ROCK_SMALL_TILE,
  SHIP_AT,
  SHIP_BANK,
  SHIP_BYTES,
  SHIP_TILE,
  SHOT_AT,
  SHOT_BANK,
  SHOT_BYTES,
  SHOT_TILE,
  STAGE_H,
  STARS_AT,
  STARS_BANK,
  STARS_BYTES,
  STARS_TILE,
  WARDEN_AT,
  WARDEN_BANK,
  WARDEN_BYTES,
  WARDEN_TILE,
  ZENITH_AT,
  ZENITH_BANK,
  ZENITH_BYTES,
  ZENITH_TILE,
} from './assets.e16'
import { M_BOSS, M_STAGE, music, sfxPick, sfxSkim } from './audio.e16'
import {
  B_BASTION,
  B_NONE,
  B_ZENITH,
  bastionStart,
  bossPhase,
  bossStep,
  zenithStart,
} from './boss.e16'
import {
  CMD_BOSS,
  CMD_MIDBOSS,
  CMD_SPEED,
  foesClear,
  foesInit,
  foesStep,
  killed,
  killsReset,
  killWorth,
  killX,
  killY,
  rankUp,
  roundIs,
  scriptArg,
  scriptStart,
  scriptStep,
} from './foes.e16'
import {
  caught,
  farStarsInit,
  farStarsStep,
  fxStep,
  IT_BOMB,
  IT_LIFE,
  IT_STAR,
  itemsClear,
  itemsStep,
} from './fx.e16'
import {
  chainStep,
  extendDue,
  hudLabels,
  hudStep,
  scoreKills,
  scoreNew,
  scoreSkims,
  scoreStars,
} from './score.e16'
import {
  bombs,
  bombsAdd,
  lanceStep,
  lives,
  livesAdd,
  overdrive,
  SH_GONE,
  shipDraw,
  shipHit,
  shipNew,
  shipState,
  shipStep,
  shipVulnerable,
  shipX,
  shipY,
  volt,
  voltAdd,
} from './ship.e16'
import {
  boost,
  bulletsClear,
  bulletsStep,
  grazes,
  hitShip,
  shotsClear,
  shotsStep,
} from './shots.e16'
import {
  bgTilesIn,
  fieldClear,
  flashStep,
  mapsClear,
  palettesIn,
  panelsIn,
  SL_GOLD,
  SL_RED,
  SL_TEXT,
  say,
  screenOn,
  scrollSpeed,
  shakeStep,
  stageHold,
  stageRelease,
  stageScroll,
  stageSpeed,
  stageStart,
  stageStep,
  stageSway,
  waveStep,
} from './view.e16'

/** The frame count the runtime keeps, as `frame_wait` last answered it. */
export let seen: u16 = 0
export let frame: u16 = 0

/** The scenes' own waits set the frame count they saw. */
export function seenIs(v: u16): void {
  seen = v
}

export function main(): void {
  kitInit()
  soundInit()
  screenOn()
  palettesIn()
  spritesIn()
  bgTilesIn()
  foesInit()
  tableLoad()
  farStarsInit()
  for (;;) {
    title()
    game()
  }
}

/** Every sprite sheet into video memory (the boss's shares its tiles with the title's word). */
function spritesIn(): void {
  load(SHIP_BANK, SHIP_AT, SHIP_TILE * 32, SHIP_BYTES)
  load(FLAME_BANK, FLAME_AT, FLAME_TILE * 32, FLAME_BYTES)
  load(SHOT_BANK, SHOT_AT, SHOT_TILE * 32, SHOT_BYTES)
  load(LANCE_BANK, LANCE_AT, LANCE_TILE * 32, LANCE_BYTES)
  load(LANCE_ENDS_BANK, LANCE_ENDS_AT, LANCE_ENDS_TILE * 32, LANCE_ENDS_BYTES)
  load(MOTE_BANK, MOTE_AT, MOTE_TILE * 32, MOTE_BYTES)
  load(DART_BANK, DART_AT, DART_TILE * 32, DART_BYTES)
  load(PIKE_BANK, PIKE_AT, PIKE_TILE * 32, PIKE_BYTES)
  load(ROCK_BIG_BANK, ROCK_BIG_AT, ROCK_BIG_TILE * 32, ROCK_BIG_BYTES)
  load(ROCK_SMALL_BANK, ROCK_SMALL_AT, ROCK_SMALL_TILE * 32, ROCK_SMALL_BYTES)
  load(HALBERD_BANK, HALBERD_AT, HALBERD_TILE * 32, HALBERD_BYTES)
  load(WARDEN_BANK, WARDEN_AT, WARDEN_TILE * 32, WARDEN_BYTES)
  load(BASTION_BANK, BASTION_AT, BASTION_TILE * 32, BASTION_BYTES)
  load(BULLETS_BANK, BULLETS_AT, BULLETS_TILE * 32, BULLETS_BYTES)
  load(ORBS_BANK, ORBS_AT, ORBS_TILE * 32, ORBS_BYTES)
  load(BLAST_SMALL_BANK, BLAST_SMALL_AT, BLAST_SMALL_TILE * 32, BLAST_SMALL_BYTES)
  load(BLAST_BIG_BANK, BLAST_BIG_AT, BLAST_BIG_TILE * 32, BLAST_BIG_BYTES)
  load(BITS_BANK, BITS_AT, BITS_TILE * 32, BITS_BYTES)
  load(STARS_BANK, STARS_AT, STARS_TILE * 32, STARS_BYTES)
  load(RING_BANK, RING_AT, RING_TILE * 32, RING_BYTES)
  load(FAR_STARS_BANK, FAR_STARS_AT, FAR_STARS_TILE * 32, FAR_STARS_BYTES)
  load(PICKUPS_BANK, PICKUPS_AT, PICKUPS_TILE * 32, PICKUPS_BYTES)
  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
}

/** The battleship's tiles, over the title's word. */
function zenithIn(): void {
  load(ZENITH_BANK, ZENITH_AT, ZENITH_TILE * 32, ZENITH_BYTES)
}

/** A frame's start: the sprites made last frame shown, the scroll set, the pad and sound. */
export function frameBegin(): void {
  seen = frame_wait(seen)
  sprShow()
  stageScroll()
  waveStep()
  flashStep()
  padRead()
  soundTick()
  sprBegin()
  frame++
}

/** `n` frames with only the far stars and the effects going. */
export function idle(n: u16): void {
  while (n > 0) {
    frameBegin()
    shakeStep()
    stageStep()
    fxStep()
    farStarsStep(1, frame)
    n--
  }
}

/** The title's word on BG1 at (7, 6), centred, its tiles over the battleship's, slot 7 its palette. */
/** In RAM, not with the title in bank 2: it moves the window to read the word's map. */
export function logoIn(): void {
  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
  palette(PAL_LOGO, SL_RED)
  palKeep(PAL_LOGO, SL_RED)
  const old = bank(LOGO_MAP_BANK)
  let y: u16 = 0
  while (y < LOGO_H) {
    let x: u16 = 0
    while (x < LOGO_W) {
      vpoke(cellAt(1, 7 + x, 6 + y), peek16(0xc000 + y * 128 + x * 2) | 0x8000)
      x++
    }
    y++
  }
  poke16(IO_BANK, old)
}

/* ---------------- the game ---------------- */

function game(): void {
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
  zenithIn()
  panelsIn()
  hudLabels()
  stageStart()
  scriptStart()
  foesClear()
  bulletsClear()
  shotsClear()
  itemsClear()
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
  bastionStart()
  bossOnWas = B_BASTION
  music(M_BOSS)
}

function boss(): void {
  fieldClear()
  palettesIn()
  stageHold(0)
  zenithStart()
  bossOnWas = B_ZENITH
  music(M_BOSS)
}

/** A frame of play: everything moves, collides, scores and is drawn. */
function play_(): void {
  shakeStep()
  stageStep()
  stageSway(i16(shipX >> 4))
  killsReset()
  shipStep()
  // OVERDRIVE, and ZENITH's burning core, bring the music's extra layer in.
  musicLayer(overdrive > 0 || bossPhase === 3 ? 1 : 0)
  const damage: u16 = overdrive > 0 ? 2 : 1
  lanceStep(damage)
  // Drawn front to back: bullets over everything, then the ship, effects, the bosses, foes,
  // shots, stars; the far stars last, behind the backgrounds.
  bulletsStep(shipXNow(), shipYNow(), shipVulnerable())
  shipDraw()
  fxStep()
  bossStep()
  foesStep(scrollSpeed)
  shotsStep(damage)
  itemsStep(shipXNow(), shipYNow(), overdrive > 0 ? 1 : 0)
  farStarsStep(scrollSpeed, frame)
  if (hitShip) shipHit()
  scorePlay()
  if ((frame & 1023) === 0) rankUp()
  hudStep(lives, bombs, voltNow(), overdrive)
}

function scorePlay(): void {
  scoreKills(killed, killWorth, killX, killY)
  chainStep()
  if (grazes > 0) {
    scoreSkims(grazes)
    voltAdd(grazes * 24)
    sfxSkim()
  }
  if (caught[IT_STAR] > 0) {
    scoreStars(caught[IT_STAR], overdrive > 0)
    voltAdd(caught[IT_STAR] * 4)
    sfxPick()
  }
  if (caught[IT_BOMB] > 0) bombsAdd()
  if (caught[IT_LIFE] > 0 || extendDue()) livesAdd()
}

/* ---------------- small things ---------------- */

function shipXNow(): i16 {
  return shipX
}

function shipYNow(): i16 {
  return shipY
}

export function voltNow(): u16 {
  return volt
}

export function overdriveOn(): bool {
  return overdrive > 0
}

import { musicLayer } from './audio.e16'
import { tableLoad } from './best.e16'
import { bossReset } from './boss.e16'
import { gameOver, pause, tally, title, warningStep } from './scenes.e16'
import { points } from './score.e16'
