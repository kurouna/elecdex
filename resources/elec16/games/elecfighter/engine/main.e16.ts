// ELECFIGHTER, ELEC-16 PLAY's one-on-one fighter (docs/elec16-elecfighter-design.md): the
// match - rounds of 99, two to win, KO, time up, draws - and the frame, in the order the design
// fixes (section 8). The fighters, the strikes and the picture are in the files beside this one;
// the match's rounds, the title and the controls in bank 1 (scenes/), the stand-in CPU in bank 2
// (cpu/). Phases P0 and P1: coloured boxes for fighters, a stand-in opponent.
import { type bool, poke16, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import {
  BG0X,
  BG0Y,
  BG1X,
  BG1Y,
  frame_wait,
  kitInit,
  LAYERS,
  load,
  MAP0,
  padRead,
  palette,
  palKeep,
  sprShow,
  VCTRL,
  vfill,
} from '../../lib/kit.e16'
import {
  BOX_AT,
  BOX_BANK,
  BOX_BYTES,
  BOX_TILE,
  DIGITS_AT,
  DIGITS_BANK,
  DIGITS_BYTES,
  DIGITS_TILE,
  FONT_AT,
  FONT_BANK,
  FONT_BYTES,
  FONT_TILE,
  FONTB_AT,
  FONTB_BANK,
  FONTB_BYTES,
  FONTB_TILE,
  FX_AT,
  FX_BANK,
  FX_BYTES,
  FX_TILE,
  HUD_AT,
  HUD_BANK,
  HUD_BYTES,
  HUD_TILE,
  PAL_CPU,
  PAL_FX,
  PAL_HUD,
  PAL_HUDDIM,
  PAL_P1,
} from '../assets.e16'
import { cpuThink } from '../cpu/standin.e16'
import { matchPlay } from '../scenes/match.e16'
import { controlsLoad, title } from '../scenes/scenes.e16'
import { slotsIn, stageClearTile, stagesIn } from './data.e16'
import { bandShow, cameraStep, camX, hudClear, hudStep, spritesBuild } from './draw.e16'
import { apart, bodies, fFace, fighterStep, fightersSeen, fLife, motion, wall } from './fighter.e16'
import { boxesWorld, hitsResolve, hitstop, hitstopIs, struckClear } from './hit.e16'
import { C_CPU, C_PAD, ctl, inputExt, inputHeld, inputNone, inputPad, ringStep } from './input.e16'

/** The frame count the runtime keeps, as `frame_wait` last answered it, and frames played. */
let seen: u16 = 0
export let frame: u16 = 0
/** BG0's scroll for the next frame, set with the sprites made against it. */
let scrollNext: u16 = 0

/** The match's phases. */
export const PH_ROUND = 0
export const PH_FIGHT = 1
export const PH_OVER = 2
export const PH_END = 3
export let phase: u16 = PH_ROUND
export let phaseT: u16 = 0
/** TIME's count, and frames into its second. */
export let timeLeft: u16 = 99
let timeT: u16 = 0
/** How the round ended: 0 P1 took it, 1 P2, 2 a draw. */
export let roundWon: u16 = 0
/** What the CPU holds for each fighter it plays. */
const cpuHeld = words(2)

const KO_STOP = 24
const SECOND = 60

export function main(): void {
  kitInit()
  screenOn()
  palettesIn()
  tilesIn()
  slotsIn()
  stagesIn()
  controlsLoad()
  ctl[0] = C_PAD
  ctl[1] = C_CPU
  for (;;) {
    title()
    matchPlay()
  }
}

/** Mode 1, both backgrounds and the sprites; BG1 (the HUD) 4 points up. */
export function screenOn(): void {
  poke16(VCTRL, 3)
  poke16(LAYERS, 7)
  poke16(BG0X, 0)
  poke16(BG0Y, 0)
  poke16(BG1X, 0)
  poke16(BG1Y, 508)
}

/** The HUD's slots (1 and 2 a side each, 3 dim, 4 TIME), P1, the CPU, the shadows. */
function palettesIn(): void {
  slot(PAL_HUD, 1)
  slot(PAL_HUD, 2)
  slot(PAL_HUDDIM, 3)
  slot(PAL_HUD, 4)
  slot(PAL_P1, 8)
  slot(PAL_CPU, 9)
  slot(PAL_FX, 10)
}

function slot(row: u16, s: u16): void {
  palette(row, s)
  palKeep(row, s)
}

function tilesIn(): void {
  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  load(FONTB_BANK, FONTB_AT, FONTB_TILE * 32, FONTB_BYTES)
  load(DIGITS_BANK, DIGITS_AT, DIGITS_TILE * 32, DIGITS_BYTES)
  load(HUD_BANK, HUD_AT, HUD_TILE * 32, HUD_BYTES)
  load(BOX_BANK, BOX_AT, BOX_TILE * 32, BOX_BYTES)
  load(FX_BANK, FX_AT, FX_TILE * 32, FX_BYTES)
}

/** Both backgrounds clear (the title's screen). */
export function screenClear(): void {
  vfill(MAP0, stageClearTile(), 64 * 64)
  hudClear()
  scrollNext = 0
}

/** A frame's start: the sprites made last frame shown with their scroll, then the pad. */
export function frameBegin(): void {
  seen = frame_wait(seen)
  sprShow()
  poke16(BG0X, scrollNext)
  padRead()
  frame++
}

/* ---------------- the round's end and its clock (design 7.2) ---------------- */

/** The phase changes: its frames counted from 0. */
export function phaseIs(p: u16): void {
  phase = p
  phaseT = 0
}

export function phaseTick(): void {
  phaseT++
}

/** TIME at 99 for a new round. */
export function clockReset(): void {
  timeLeft = 99
  timeT = 0
}

/**
 * KO and TIME (design 7.2): a life at 0 ends the round (both at once, a double KO, is a draw);
 * at TIME 0 the more life wins, the same is a draw.
 */
function judgeRound(): void {
  if (phase !== PH_FIGHT) return
  if (fLife[0] === 0 || fLife[1] === 0) knockedOut()
  else clockStep()
}

function knockedOut(): void {
  const both = fLife[0] === 0 && fLife[1] === 0
  roundWon = both ? 2 : fLife[1] === 0 ? 0 : 1
  hitstopIs(KO_STOP)
  roundOver(both ? str('DOUBLE K.O.') : str('K.O.'))
}

/** TIME: a count every 60 frames of the fight; at 0, the more life takes the round. */
function clockStep(): void {
  timeT++
  if (timeT < SECOND) return
  timeT = 0
  timeLeft--
  if (timeLeft > 0) return
  roundWon = fLife[0] === fLife[1] ? 2 : fLife[0] > fLife[1] ? 0 : 1
  roundOver(roundWon === 2 ? str('TIME UP  DRAW') : str('TIME UP'))
}

function roundOver(s: u16): void {
  phaseIs(PH_OVER)
  bandShow(s)
}

/* ---------------- the frame (design 8) ---------------- */

/**
 * One frame, in the design's order:
 *   frame_wait, sprShow (and the scroll), [the pose's cells: P3], padRead, the input ring;
 *   in a hitstop, stop here (draw and sound only);
 *   the CPU (P2's buttons);
 *   the state machines, P1 then P2, each reading the other as the frame began;
 *   motion (X and Y; z stays 0), the walls, the most apart, the bodies' push;
 *   the boxes in the world, the strikes judged both ways from that state, dealt together;
 *   life, KO and the round;
 *   the camera, [the raster: later], the sprites (fighters, shadows), the HUD where it changed,
 *   [sound: later].
 */
export function frameStep(): void {
  frameBegin()
  struckClear()
  ringStep()
  inputsGather()
  if (hitstop > 0) {
    hitstopIs(hitstop - 1)
    cpuInputs(false)
    pictureStep()
    return
  }
  cpuInputs(true)
  fightersSeen()
  fighterStep(0)
  fighterStep(1)
  motion(0)
  motion(1)
  wall(0)
  wall(1)
  apart()
  bodies()
  boxesWorld()
  hitsResolve()
  judgeRound()
  cameraStep()
  pictureStep()
}

function pictureStep(): void {
  scrollNext = camX
  spritesBuild()
  hudStep(timeLeft, frame)
}

/** Whether the fighters take buttons: only while they fight. */
function live(): bool {
  return phase === PH_FIGHT
}

/** The pad's and a test's buttons into the ring; the CPU's come after the hitstop's check. */
function inputsGather(): void {
  let i: u16 = 0
  while (i < 2) {
    if (!live()) inputNone(i)
    else if (ctl[i] === C_PAD) inputPad(i, fFace[i] !== 0)
    else if (ctl[i] !== C_CPU) inputExt(i)
    i++
  }
}

/** The CPU's buttons: chosen anew (`think`), or held as they were through a hitstop. */
function cpuInputs(think: bool): void {
  let i: u16 = 0
  while (i < 2) {
    if (ctl[i] === C_CPU) {
      if (!live()) cpuHeld[i] = 0
      else if (think) cpuHeld[i] = cpuThink(i)
      inputHeld(i, cpuHeld[i])
    }
    i++
  }
}
