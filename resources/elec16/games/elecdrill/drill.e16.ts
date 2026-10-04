// ELECDRILL, ELEC-16 PLAY's block-digging puzzle (docs/elec16-elecdrill.md): the title, the
// dig down through five strata to the core at 500 m, the driller's lives and AIR, the score,
// the game's end and the best five. The well, its falls, the driller, the effects and the
// panels are in the files beside this one; the scenes round the play are in bank 1.
import {
  addr,
  csrr,
  i16,
  peek16,
  poke16,
  str,
  type u16,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import {
  B_START,
  BG0X,
  BG0Y,
  BG1X,
  BG1Y,
  bank,
  cellAt,
  colour,
  frame_wait,
  IO_BANK,
  kitInit,
  LAYERS,
  load,
  mapRow,
  mix,
  padRead,
  palCopy,
  palette,
  palKeep,
  pressed,
  S16,
  scoreAdd,
  scoreMore,
  spr,
  sprBegin,
  sprShow,
  VCTRL,
  vpoke,
} from '../lib/kit.e16'
import { soundInit, soundTick } from '../lib/sound.e16'
import {
  ALLOY_AT,
  ALLOY_BANK,
  ALLOY_BYTES,
  ALLOY_TILE,
  BAND_AT,
  BAND_BANK,
  BAND_BYTES,
  BAND_TILE,
  BIT_AT,
  BIT_BANK,
  BIT_BYTES,
  BIT_TILE,
  CAPSULE_AT,
  CAPSULE_BANK,
  CAPSULE_BYTES,
  CAPSULE_TILE,
  CORE_AT,
  CORE_BANK,
  CORE_BYTES,
  CORE_TILE,
  DIGITS_AT,
  DIGITS_BANK,
  DIGITS_BYTES,
  DIGITS_TILE,
  DRILLER_AT,
  DRILLER_BANK,
  DRILLER_BYTES,
  DRILLER_TILE,
  FONT_AT,
  FONT_BANK,
  FONT_BYTES,
  FONT_TILE,
  FX_AT,
  FX_BANK,
  FX_BYTES,
  FX_TILE,
  GROUND_AT,
  GROUND_BANK,
  GROUND_BYTES,
  GROUND_TILE,
  ICONS_AT,
  ICONS_BANK,
  ICONS_BYTES,
  ICONS_TILE,
  LOGO_H,
  LOGO_MAP_BANK,
  LOGO_TILE,
  LOGO_TILES_AT,
  LOGO_TILES_BANK,
  LOGO_TILES_BYTES,
  LOGO_W,
  LOOSE_AT,
  LOOSE_BANK,
  LOOSE_BYTES,
  LOOSE_TILE,
  PAL_BLUE,
  PAL_DRILLER,
  PAL_FLASH,
  PAL_FX,
  PAL_GREEN,
  PAL_LOGO,
  PAL_PANEL,
  PAL_RED,
  PAL_YELLOW,
  PANELS_H,
  PANELS_MAP_BANK,
  PANELS_TILE,
  PANELS_TILES_AT,
  PANELS_TILES_BANK,
  PANELS_TILES_BYTES,
  POP_AT,
  POP_BANK,
  POP_BYTES,
  POP_TILE,
  QUARTERS_AT,
  QUARTERS_BANK,
  QUARTERS_BYTES,
  QUARTERS_TILE,
  TANK_AT,
  TANK_BANK,
  TANK_BYTES,
  TANK_TILE,
} from './assets.e16'
import {
  M_DEEP,
  M_LOWAIR,
  M_MAIN,
  M_STRATUM,
  music,
  sfxAlarm,
  sfxCapsule,
  sfxChain,
  sfxCrush,
  sfxGasp,
  sfxPop,
  sfxRumble,
  song,
} from './audio.e16'
import {
  chainsStep,
  fallClear,
  fallForget,
  fallPace,
  goneCell,
  goneN,
  goneType,
  lbCell,
  lbN,
  lbTile,
  lbUnit,
  loosened,
  newsClear,
  pendForget,
  pendStep,
  struck,
  struckClear,
  suspectsStep,
  U_FALL,
  U_WOBBLE,
  unitsStep,
  uOff,
  uState,
  uTime,
  vanishedAt,
  vanishedBlocks,
  vanishedChain,
} from './fall.e16'
import {
  CORE_ROW,
  FIELD_X,
  fieldAdvance,
  fieldDraw,
  fieldNew,
  markAll,
  rowOf,
  SL_FLASH,
  SL_PANEL,
  T_BLUE,
  top,
} from './field.e16'
import { bubbles, chainShow, fxClear, fxStep, plusShow, pop } from './fx.e16'
import { band, bandDraw, best, say, score, W_GOLD, wellClear } from './hud.e16'
import { hudCounts, hudLabels, hudStep, stratumShow } from './panel.e16'
import {
  air,
  airAdd,
  airPace,
  alive,
  alloyBroken,
  capsuleN,
  capsules,
  caughtFalling,
  comeBack,
  crushed,
  deathDone,
  dugN,
  P_GASP,
  P_LAND,
  P_STAND,
  playerDraw,
  playerNew,
  playerStep,
  pRow,
  pSafe,
  pState,
  pX,
  pY,
} from './player.e16'

/** The frame count the runtime keeps, as `frame_wait` last answered it, and frames played. */
export let seen: u16 = 0
export let frame: u16 = 0
/** The camera: the screen's top, in points from row 0, and with this frame's shake. */
export let camY: u16 = 0
export let view: u16 = 0
let shakeT: u16 = 0
/** BG0's scroll for the next frame, set with the sprites made against it. */
let scrollNext: u16 = 0

export let lives: u16 = 3
export let stratum: u16 = 0
export let maxDepth: u16 = 0
export let maxChain: u16 = 0
export let continues: u16 = 0
/** 0 while playing; then 1 the game is over, 2 the core is reached. */
export let outcome: u16 = 0
let alarmT: u16 = 0
let bannerT: u16 = 0
let jingleT: u16 = 0
let wasAlive = true

export const O_OVER = 1
export const O_GOAL = 2

export function main(): void {
  kitInit()
  soundInit()
  screenOn()
  palettesIn()
  tilesIn()
  tableLoad()
  for (;;) {
    title()
    game()
  }
}

/** Mode 1, both backgrounds and the sprites, nothing scrolled. */
export function screenOn(): void {
  poke16(VCTRL, 3)
  poke16(LAYERS, 7)
  poke16(BG0X, 0)
  poke16(BG0Y, 0)
  poke16(BG1X, 0)
  poke16(BG1Y, 0)
}

/** The blocks' colours (backgrounds 1-4, sprites 9-12), the flash, the panel, the driller. */
export function palettesIn(): void {
  slot(PAL_RED, 1)
  slot(PAL_YELLOW, 2)
  slot(PAL_GREEN, 3)
  slot(PAL_BLUE, 4)
  slot(PAL_FLASH, SL_FLASH)
  slot(PAL_PANEL, SL_PANEL)
  slot(PAL_DRILLER, 8)
  slot(PAL_RED, 9)
  slot(PAL_YELLOW, 10)
  slot(PAL_GREEN, 11)
  slot(PAL_BLUE, 12)
  slot(PAL_PANEL, 13)
  slot(PAL_FX, 14)
  slot(PAL_FLASH, 15)
}

function slot(row: u16, s: u16): void {
  palette(row, s)
  palKeep(row, s)
}

/** Every sheet and the panels' tiles into video memory. */
function tilesIn(): void {
  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  load(DIGITS_BANK, DIGITS_AT, DIGITS_TILE * 32, DIGITS_BYTES)
  load(TANK_BANK, TANK_AT, TANK_TILE * 32, TANK_BYTES)
  load(ICONS_BANK, ICONS_AT, ICONS_TILE * 32, ICONS_BYTES)
  load(BAND_BANK, BAND_AT, BAND_TILE * 32, BAND_BYTES)
  load(QUARTERS_BANK, QUARTERS_AT, QUARTERS_TILE * 32, QUARTERS_BYTES)
  load(GROUND_BANK, GROUND_AT, GROUND_TILE * 32, GROUND_BYTES)
  load(LOOSE_BANK, LOOSE_AT, LOOSE_TILE * 32, LOOSE_BYTES)
  load(POP_BANK, POP_AT, POP_TILE * 32, POP_BYTES)
  load(ALLOY_BANK, ALLOY_AT, ALLOY_TILE * 32, ALLOY_BYTES)
  load(CAPSULE_BANK, CAPSULE_AT, CAPSULE_TILE * 32, CAPSULE_BYTES)
  load(CORE_BANK, CORE_AT, CORE_TILE * 32, CORE_BYTES)
  load(DRILLER_BANK, DRILLER_AT, DRILLER_TILE * 32, DRILLER_BYTES)
  load(BIT_BANK, BIT_AT, BIT_TILE * 32, BIT_BYTES)
  load(FX_BANK, FX_AT, FX_TILE * 32, FX_BYTES)
  load(PANELS_TILES_BANK, PANELS_TILES_AT, PANELS_TILE * 32, PANELS_TILES_BYTES)
  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
}

/** The panels into BG1's rows 0-35. */
export function panelsIn(): void {
  let y: u16 = 0
  while (y < PANELS_H) {
    mapRow(PANELS_MAP_BANK, 0xc000 + y * 128, 1, y)
    y++
  }
}

/**
 * The title's word on BG1 from cell (x, y), in slot 5 with its own palette. In RAM, not with
 * the title in bank 1: it moves the window to read the word's map.
 */
export function logoIn(x: u16, y: u16): void {
  palette(PAL_LOGO, 5)
  palKeep(PAL_LOGO, 5)
  const old = bank(LOGO_MAP_BANK)
  let r: u16 = 0
  while (r < LOGO_H) {
    let c: u16 = 0
    while (c < LOGO_W) {
      vpoke(cellAt(1, x + c, y + r), peek16(0xc000 + r * 128 + c * 2) | 0x8000)
      c++
    }
    r++
  }
  poke16(IO_BANK, old)
}

/** A frame's start: the sprites made last frame shown with their scroll, the pad and sound. */
export function frameBegin(): void {
  seen = frame_wait(seen)
  frameStart = csrr(0xc00)
  sprShow()
  poke16(BG0Y, scrollNext & 511)
  pulse()
  padRead()
  soundTick()
  sprBegin()
  frame++
}

/** The cycle counter (low word) when this frame began. */
let frameStart: u16 = 0

/** Cycles spent so far this frame (4 MHz: 66,667 a frame). */
function spent(): u16 {
  return wrap16(csrr(0xc00) - frameStart)
}

/** The scenes' own waits set the frame count they saw. */
export function seenIs(v: u16): void {
  seen = v
}

/** BG0's scroll for the next frame (the scenes set their own). */
export function scrollIs(y: u16): void {
  scrollNext = y
}

/**
 * The flash slot's blocks breathe towards white (a vanishing group), and the core's glow
 * turns. Only its colours 1-11: 12-15 are the gold lettering.
 */
function pulse(): void {
  // Every other frame: half the work, and the breath is as smooth to the eye.
  if ((frame & 1) !== 0) return
  const p = frame & 15
  const t: u16 = p < 8 ? p + 4 : 20 - p
  let k: u16 = 2
  while (k < 8) {
    colour(SL_FLASH, k, mix(palCopy[SL_FLASH * 16 + k], 0x3b9f, t))
    k++
  }
  if ((frame & 7) !== 0) return
  const turn = (frame >> 3) % 3
  colour(SL_FLASH, 9, palCopy[SL_FLASH * 16 + 9 + turn])
  colour(SL_FLASH, 10, palCopy[SL_FLASH * 16 + 9 + ((turn + 1) % 3)])
  colour(SL_FLASH, 11, palCopy[SL_FLASH * 16 + 9 + ((turn + 2) % 3)])
}

/* ---------------- the game ---------------- */

/** Points (any number, a piece at a time); the best follows. */
export function points(n: u16): void {
  let left = n
  while (left > 0) {
    const k = left > 9000 ? 9000 : left
    scoreAdd(addr(score), k)
    left = left - k
  }
  if (scoreMore(addr(score), addr(best))) {
    best[0] = score[0]
    best[1] = score[1]
  }
}

/** Each stratum's pace: AIR a unit every 60 frames down to 36, wobbles shorter, falls faster. */
function pace(s: u16): void {
  airPace(60 - s * 6)
  fallPace(64 - s * 7, 8 + s)
}

function gameNew(): void {
  frame = 0
  fieldNew()
  fallClear()
  fxClear()
  playerNew()
  camY = 0
  view = 0
  scrollNext = 0
  lives = 3
  stratum = 0
  maxDepth = 0
  maxChain = 0
  continues = 0
  outcome = 0
  alarmT = 0
  bannerT = 90
  jingleT = 0
  wasAlive = true
  score[0] = 0
  score[1] = 0
  pace(0)
  panelsIn()
  hudLabels()
  stratumShow(0)
  markAll()
  fieldDraw(0, 31, 300)
  music(M_MAIN)
  band(100, 1)
  say(17, 13, str('READY'), W_GOLD)
}

/** One game: played until it is over or the core is reached, then the tally. */
function game(): void {
  gameNew()
  for (;;) {
    frameBegin()
    if (pressed(B_START)) pause()
    playFrame()
    if (outcome !== 0) break
  }
  if (outcome === O_GOAL) goal()
  results()
}

/** A frame of play: the driller, the falls, the camera, the screen, the score. */
export function playFrame(): void {
  const dying = !alive()
  playerStep(frame, dying)
  if (!dying) fieldStep()
  else if (deathDone()) afterDeath()
  if (wasAlive && !alive()) {
    shakeT = 12
    if (pState === P_GASP) sfxGasp()
  }
  wasAlive = alive()
  cameraStep()
  ringStep()
  drawStep()
  events()
}

/** The well's frame: blocks vanish, footing is looked at, units fall and settle, chains. */
function fieldStep(): void {
  newsClear()
  pendStep(frame, 24)
  pops()
  suspectsStep(spent() < 20000 ? 100 : 24)
  unitsStep()
  chainsStep(frame, spent() < 24000 ? 60 : 12)
  if (struck === 1 && pSafe === 0) {
    crushed()
    sfxCrush()
  } else if (struck === 2) {
    caughtFalling()
    sfxCapsule()
    bubbles(i16(FIELD_X + pX) + 8, i16(pY))
  }
  struckClear()
  scoreFrame()
}

/** What vanished this frame: a pop and a star for each block. */
function pops(): void {
  let k: u16 = 0
  while (k < goneN) {
    const c = goneCell[k]
    const y = rowOf(c >> 4) * 16
    const t = goneType[k]
    pop(i16(FIELD_X + (c & 15) * 16), i16(y), t, (k & 1) + (t <= T_BLUE ? 0 : 1))
    k++
  }
  if (goneN > 0 && (frame & 3) === 0) sfxPop()
}

/** This frame's points: blocks dug, chains, capsules, ALLOY, and every new metre. */
function scoreFrame(): void {
  if (dugN > 0) points(dugN * 10)
  if (vanishedBlocks > 0) {
    const worth = vanishedBlocks * 20 * vanishedChain
    points(worth)
    if (vanishedChain > maxChain) maxChain = vanishedChain
    const c = vanishedAt
    const x = i16(FIELD_X + (c & 15) * 16) + 8
    const y = i16(rowOf(c >> 4) * 16) - 10
    if (vanishedChain >= 2) chainShow(x, y, vanishedChain)
    else plusShow(x, y, worth)
    sfxChain(vanishedChain)
  }
  if (capsuleN > 0) {
    points(capsuleN * 100)
    sfxCapsule()
    bubbles(i16(FIELD_X + pX) + 8, i16(pY))
  }
  if (alloyBroken !== 0) {
    points(50)
    shakeT = 6
  }
  if (loosened > 0) sfxRumble()
  if (pRow > 5 && pRow - 5 > maxDepth) {
    points((pRow - 5 - maxDepth) * 10)
    maxDepth = pRow - 5
  }
}

/** After the driller's last moment: back again, or the question of going on, or the end. */
function afterDeath(): void {
  if (lives > 0) lives--
  if (lives > 0) {
    comeBack()
    return
  }
  if (continueAsk()) {
    lives = 3
    continues++
    comeBack()
    return
  }
  outcome = O_OVER
}

/** The camera eases after the driller, keeping it a third of the way down. */
function cameraStep(): void {
  let want: u16 = pY > 96 ? pY - 96 : 0
  if (want < top * 16) want = top * 16
  const most = (CORE_ROW + 3) * 16 - 288
  if (want > most) want = most
  if (want > camY) camY = camY + ((want - camY + 7) >> 3)
  else if (want < camY) camY = camY - ((camY - want + 7) >> 3)
  let shake: u16 = 0
  if (shakeT > 0) {
    shakeT--
    shake = (shakeT & 2) !== 0 ? 2 : 0
  }
  view = camY + shake
  scrollNext = view
}

/** The ring follows the camera: a row a frame, six above the screen kept. */
function ringStep(): void {
  if (camY >> 4 <= top + 6) return
  const ring = top & 31
  fallForget(ring)
  pendForget(ring)
  fieldAdvance()
}

/** The screen: the cells that changed, the driller, the effects, the loose blocks. */
function drawStep(): void {
  // The cells waiting to be redrawn yield to a busy frame: they are drawn a frame or two late.
  const busy = spent()
  fieldDraw(camY >> 4, 19, busy < 16000 ? 24 : busy < 26000 ? 10 : 3)
  // A banner's band first: in front of the well, behind the banner's words.
  bandDraw()
  fxStep(view)
  looseDraw()
  playerDraw(view, frame)
  hudStep(maxDepth, air, lives, frame)
  hudCounts(maxChain, capsules)
}

/** The loose blocks as sprites: a wobble side to side, then down with their unit. */
function looseDraw(): void {
  let k: u16 = 0
  while (k < lbN) {
    const c = lbCell[k]
    const u = lbUnit[k]
    const st = uState[u]
    let y = i16(wrap16(rowOf(c >> 4) * 16 - view))
    if (st === U_FALL) y = y + i16(uOff[u] >> 2)
    let x = i16(FIELD_X + (c & 15) * 16)
    if (st === U_WOBBLE) {
      const fast = uTime[u] < 24 ? 1 : 2
      x = x + ((frame >> fast) & 1 ? 1 : -1)
    }
    if (y > -16 && y < 288) spr(x, y, lbTile[k], S16)
    k++
  }
}

/** The stratum passed, the core reached, the alarm, the banner and the music's turns. */
function events(): void {
  if (bannerT > 0) {
    bannerT--
    if (bannerT === 0) wellClear()
  }
  if (stratum < 4 && maxDepth >= (stratum + 1) * 100) {
    stratum++
    pace(stratum)
    stratumShow(stratum)
    points(stratum * 1000)
    airAdd(20)
    stratumBanner(stratum)
    bannerT = 150
    jingleT = 110
    music(M_STRATUM)
  }
  if (jingleT > 0) {
    jingleT--
    if (jingleT === 0) music(baseSong())
  }
  if (maxDepth >= 500 && (pState === P_STAND || pState === P_LAND)) {
    outcome = O_GOAL
    return
  }
  airMood()
}

function baseSong(): u16 {
  return stratum >= 3 ? M_DEEP : M_MAIN
}

/** AIR low: the alarm every 45 frames and the tense music; back again with air to spare. */
function airMood(): void {
  if (jingleT > 0 || !alive()) return
  if (air <= 25) {
    if (song !== M_LOWAIR) music(M_LOWAIR)
    alarmT++
    if (alarmT >= 45) {
      alarmT = 0
      sfxAlarm()
    }
  } else {
    alarmT = 40
    if (song === M_LOWAIR) music(baseSong())
  }
}

/** Frames with nothing played: the screen kept up (a scene over the well). */
export function idle(n: u16): void {
  while (n > 0) {
    frameBegin()
    fieldDraw(camY >> 4, 19, 40)
    bandDraw()
    fxStep(view)
    looseDraw()
    playerDraw(view, frame)
    n--
  }
}

import { tableLoad } from './best.e16'
import { continueAsk, goal, pause, results, stratumBanner, title } from './scenes.e16'
