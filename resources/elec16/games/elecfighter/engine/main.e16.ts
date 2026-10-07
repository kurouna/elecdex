// ELECFIGHTER, ELEC-16 PLAY's one-on-one fighter (docs/elec16-elecfighter-design.md): the
// match - rounds of 99, two to win, KO, time up, draws - and the frame, in the order the design
// fixes (section 8), and the ring of what each fighter was that the CPU sees by (7.10.1). The
// fighters, the strikes, the throws and the picture are in the files beside this one; the
// match, the ladder, the title and the controls in bank 1 (scenes/), the pause and the log's
// words in bank 3, the CPU in bank 2 (cpu/), the fighters' picture in bank 4 (look.e16.ts).
import {
  type bool,
  poke16,
  str,
  type u16,
  words,
  wrap16,
} from '../../../../../src/shared/e16c/builtins'
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
  raster,
  sprShow,
  VCTRL,
  vfill,
} from '../../lib/kit.e16'
import {
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
  HUD_AT,
  HUD_BANK,
  HUD_BYTES,
  HUD_TILE,
  PAL_CPU,
  PAL_FX,
  PAL_HUD,
  PAL_HUDDIM,
  PAL_P1,
  SHADOW_AT,
  SHADOW_BANK,
  SHADOW_BYTES,
  SHADOW_TILE,
  SPARK_AT,
  SPARK_BANK,
  SPARK_BYTES,
  SPARK_TILE,
} from '../assets.e16'
import { cpuThink } from '../cpu/ai.e16'
import { ladderPlay } from '../scenes/match.e16'
import { controlsLoad, title } from '../scenes/scenes.e16'
import {
  artStream,
  oppNamesIn,
  slotsIn,
  stageClearTile,
  stageScroll,
  stageShow,
  stagesIn,
} from './data.e16'
import { bandShow, cameraStep, camX, hudClear, hudStep, logStep } from './draw.e16'
import {
  apart,
  bodies,
  fAir,
  fFace,
  fighterStep,
  fightersSeen,
  fLife,
  fMove,
  fMoveF,
  fState,
  fStateT,
  fX,
  fY,
  motion,
  ST_ATTACK,
  wall,
} from './fighter.e16'
import {
  boxesWorld,
  hitsResolve,
  hitstop,
  hitstopIs,
  struck,
  struckClear,
  throwsStep,
} from './hit.e16'
import { C_CPU, C_PAD, ctl, inputExt, inputHeld, inputNone, inputPad, ringStep } from './input.e16'
import { lookStep } from './look.e16'

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
  oppNamesIn()
  controlsLoad()
  ctl[0] = C_PAD
  ctl[1] = C_CPU
  for (;;) {
    title()
    ladderPlay()
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
  slot(PAL_HUD, 5)
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
  load(SPARK_BANK, SPARK_AT, SPARK_TILE * 32, SPARK_BYTES)
  load(SHADOW_BANK, SHADOW_AT, SHADOW_TILE * 32, SHADOW_BYTES)
}

/** Both backgrounds clear (the title's screen), BG0 still: no raster until a stage is loaded. */
export function screenClear(): void {
  raster(0)
  vfill(MAP0, stageClearTile(), 64 * 64)
  hudClear()
  scrollNext = 0
}

/** A frame's start: the sprites made last frame shown with their scroll and raster, then the pad. */
export function frameBegin(): void {
  seen = frame_wait(seen)
  sprShow()
  artStream()
  poke16(BG0X, scrollNext)
  stageShow()
  padRead()
  frame++
}

/** A paused frame: shown and the pad read, nothing counted (design 5.6: nothing goes on). */
export function pauseFrame(): void {
  seen = frame_wait(seen)
  sprShow()
  padRead()
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
 *   frame_wait, sprShow (and the scroll), the poses' cells into the rooms, padRead, the input ring;
 *   in a hitstop, stop here (the CPU watches; the ring of what was, draw and sound only);
 *   the CPU (P2's buttons, from the ring of what was: never this frame's);
 *   the throws' frames, then the state machines, P1 then P2, each reading the other as the
 *   frame began;
 *   motion (X and Y; z stays 0), the walls (and their push back), the most apart, the bodies;
 *   the boxes in the world, the throws and strikes judged both ways from that state, dealt
 *   together;
 *   life, KO and the round; the ring of what was (the CPU's eyes) gets this frame's end;
 *   the camera, the raster's tables (the stage's bands and floor lines), the look (palettes,
 *   fighters, effects, KO pieces, shadows: look.e16.ts), the HUD and the log line
 *   where they changed, [sound: later].
 */
export function frameStep(): void {
  frameBegin()
  struckClear()
  ringStep()
  inputsGather()
  if (hitstop > 0) {
    hitstopIs(hitstop - 1)
    cpuInputs(false)
    seenRecord()
    pictureStep()
    return
  }
  cpuInputs(true)
  fightersSeen()
  throwsStep()
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
  seenRecord()
  cameraStep()
  pictureStep()
}

function pictureStep(): void {
  scrollNext = stageScroll(camX)
  lookStep()
  hudStep(timeLeft, frame)
  logStep()
}

/* ---------------- what the CPU sees (design 7.10.1) ---------------- */

/**
 * 32 frames of each fighter as each frame ended, `j * 32 + (n & 31)`: its state and move
 * (`state | move << 8`), frames into the move or the state with that frame's strike
 * (`frames | struck << 8`), and where it stood in points. `seenN` counts the frames written;
 * the CPU reads `seenN - R`, R frames back, never the frame being played.
 */
export const seenS = words(64)
export const seenF = words(64)
export const seenX = words(64)
export const seenY = words(64)
export let seenN: u16 = 0

function seenRecord(): void {
  const k = seenN & 31
  let i: u16 = 0
  while (i < 2) {
    const e = i * 32 + k
    const st = fState[i]
    seenS[e] = st | (fMove[i] << 8)
    seenF[e] = ((st === ST_ATTACK ? fMoveF[i] : fStateT[i]) & 255) | (struck[i] << 8)
    seenX[e] = fX[i] >> 4
    seenY[e] = fAir[i] !== 0 && fY[i] < 16 ? 1 : fY[i] >> 4
    i++
  }
  seenN = wrap16(seenN + 1)
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
      else cpuHeld[i] = cpuThink(i, think)
      inputHeld(i, cpuHeld[i])
    }
    i++
  }
}
