// ELECLANCE, ELEC-16 PLAY's vertical shooter (docs/elec16-eleclance.md): the title, the game -
// a stage, a half-way boss, a battleship - the clear and its tally, the second round, the
// game's end and the best five. Everything else is in the files beside this one.
import { type bool, i16, peek16, poke16, type u16 } from '../../../../src/shared/e16c/builtins'
import {
  bank,
  cellAt,
  frame_wait,
  IO_BANK,
  kitInit,
  load,
  padRead,
  palette,
  palKeep,
  sprBegin,
  sprShow,
  vpoke,
  WINDOW,
} from '../lib/kit.e16'
import { soundInit, soundTick } from '../lib/sound.e16'
import {
  LOGO_H,
  LOGO_MAP_BANK,
  LOGO_TILE,
  LOGO_TILES_AT,
  LOGO_TILES_BANK,
  LOGO_TILES_BYTES,
  LOGO_W,
  PAL_LOGO,
} from './assets.e16'
import { sfxPick, sfxSkim } from './audio.e16'
import { bossPhase, bossStep } from './boss.e16'
import { foesInit, foesStep, killed, killsReset, killWorth, killX, killY, rankUp } from './foes.e16'
import {
  caught,
  farStarsInit,
  farStarsStep,
  fxStep,
  IT_BOMB,
  IT_LIFE,
  IT_STAR,
  itemsStep,
} from './fx.e16'
import { chainStep, extendDue, hudStep, scoreKills, scoreSkims, scoreStars } from './score.e16'
import {
  bombs,
  bombsAdd,
  lanceStep,
  lives,
  livesAdd,
  overdrive,
  shipDraw,
  shipHit,
  shipStep,
  shipVulnerable,
  shipX,
  shipY,
  volt,
  voltAdd,
} from './ship.e16'
import { bulletsStep, grazes, hitShip, shotsStep } from './shots.e16'
import {
  bgTilesIn,
  flashStep,
  palettesIn,
  SL_RED,
  screenOn,
  scrollSpeed,
  shakeStep,
  stageScroll,
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

/**
 * The title's word on BG1 at (7, 6), centred, its tiles over the bosses', slot 7 its palette.
 * In RAM, not with the title in bank 4: it moves the window to read the word's map.
 */
export function logoIn(): void {
  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
  palette(PAL_LOGO, SL_RED)
  palKeep(PAL_LOGO, SL_RED)
  const old = bank(LOGO_MAP_BANK)
  let y: u16 = 0
  while (y < LOGO_H) {
    let x: u16 = 0
    while (x < LOGO_W) {
      vpoke(cellAt(1, 7 + x, 6 + y), peek16(WINDOW + y * MAP_ROW + x * 2) | 0x8000)
      x++
    }
    y++
  }
  poke16(IO_BANK, old)
}

/** A frame of play: everything moves, collides, scores and is drawn. */
export function play_(): void {
  shakeStep()
  stageStep()
  stageSway(i16(shipX >> 4))
  killsReset()
  shipStep()
  // OVERDRIVE, and ZENITH's burning core, bring the music's extra layer in.
  musicLayer(overdrive > 0 || bossPhase === 3 ? 1 : 0)
  // A shot hits for 2, the lance for 1 every other frame; OVERDRIVE adds 1 to both.
  const od: u16 = overdrive > 0 ? 1 : 0
  lanceStep(1 + od)
  // Drawn front to back: bullets over everything, then the ship, effects, the bosses, foes,
  // shots, stars; the far stars last, behind the backgrounds.
  bulletsStep(shipX, shipY, shipVulnerable())
  shipDraw()
  chainDraw(frame)
  fxStep()
  bossStep()
  foesStep(scrollSpeed)
  shotsStep(2 + od)
  missilesStep(3 + od)
  itemsStep(shipX, shipY, overdrive > 0 ? 1 : 0)
  farStarsStep(scrollSpeed, frame)
  if (hitShip) shipHit()
  scorePlay()
  if ((frame & 1023) === 0) rankUp()
  hudStep(lives, bombs, voltNow(), overdrive)
  powerShow(power)
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
  // The pickups, each named as it is taken.
  if (caught[IT_BOMB] > 0) {
    bombsAdd()
    gained(IT_BOMB)
  }
  // P: a level of power, or 10,000 points once at the top.
  if (caught[IT_POWER] > 0) {
    if (!powerAdd()) points(1000)
    gained(IT_POWER)
  }
  if (caught[IT_LIFE] > 0 || extendDue()) {
    livesAdd()
    gained(IT_LIFE)
  }
}

/** A pickup's word over the ship. */
function gained(kind: u16): void {
  floatWord(shipX, shipY - 320, kind)
}

/* ---------------- small things ---------------- */

export function voltNow(): u16 {
  return volt
}

export function overdriveOn(): bool {
  return overdrive > 0
}

import { musicLayer } from './audio.e16'
import { tableLoad } from './best.e16'
import { floatWord, IT_POWER } from './fx.e16'
import { game } from './round.e16'
import { points, powerShow } from './score.e16'
import { power, powerAdd } from './ship.e16'
import { spritesIn, title } from './title.e16'
import { MAP_ROW } from './view.e16'
import { chainDraw, missilesStep } from './weapons.e16'
