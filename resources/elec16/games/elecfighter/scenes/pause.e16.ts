// ELECFIGHTER's pause, log words and the ladder's screens (docs/elec16-elecfighter-design.md
// 5.3, 5.4, 5.6). The pause darkens the stage, the fighters and the effects (their palettes
// mixed 60% to black; the HUD as it was) under a band, PAUSED, and RESUME / CONTROLS / QUIT
// FIGHT; nothing goes on meanwhile - no frame counted, no chance drawn, TIME still. The log
// line's words are written here. CONTINUE?, GAME OVER and SYSTEM CLEAR are a band each until
// P3 draws them. In bank 3: rarely run.
import { type bool, peek, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import { B_A, B_DOWN, B_START, B_UP, cellAt, palMix, pressed, vpoke } from '../../lib/kit.e16'
import { FONT_TILE } from '../assets.e16'
import {
  bandClear,
  bandShow,
  hudRows,
  LOG_AA,
  LOG_COUNTER,
  LOG_ROW,
  LOG_TECH,
  LOG_THROW,
  SL_LOG,
  say,
} from '../engine/draw.e16'
import { palKey } from '../engine/look.e16'
import { pauseFrame } from '../engine/main.e16'
import { matchHud } from './match.e16'
import { controlsRun } from './scenes.e16'

/** Paused (1) or not: the tests read it. */
export const paused = words(1)
/** The pause's choices' rows, and how dark it goes (sixteenths: 10 is about 60%). */
const MENU_ROW = 19
const DIM = 10
const PZ_TEXT = 1
const PZ_DIM = 3
const COUNT_F = 60

/** The pause until RESUME (or START again); 1 when QUIT FIGHT was chosen. */
export function pauseRun(): u16 {
  paused[0] = 1
  dim(DIM)
  pauseShow()
  let at: u16 = 0
  cursor(at)
  let quit: u16 = 0
  for (;;) {
    pauseFrame()
    at = menuMove(at)
    if (pressed(B_START)) break
    if (!pressed(B_A)) continue
    if (at === 0) break
    if (at === 2) {
      quit = 1
      break
    }
    controlsRun()
    matchHud()
    pauseShow()
    cursor(at)
  }
  hudRows(MENU_ROW, 3)
  bandClear()
  dim(0)
  // The fighters' palettes as their effects want them, not as kept: written afresh next frame.
  palKey[0] = 0xffff
  palKey[1] = 0xffff
  paused[0] = 0
  return quit
}

/** Up and down move the cursor round the three choices. */
function menuMove(at: u16): u16 {
  let n = at
  if (pressed(B_UP)) n = n === 0 ? 2 : n - 1
  if (pressed(B_DOWN)) n = n === 2 ? 0 : n + 1
  if (n !== at) cursor(n)
  return n
}

/** The stage (slot 0), both fighters and the shadows (8-10) mixed `t` sixteenths to black. */
function dim(t: u16): void {
  palMix(0, 0, t)
  palMix(8, 0, t)
  palMix(9, 0, t)
  palMix(10, 0, t)
}

function pauseShow(): void {
  bandShow(str('PAUSED'))
  say(16, MENU_ROW, str('RESUME'), PZ_TEXT)
  say(16, MENU_ROW + 1, str('CONTROLS'), PZ_TEXT)
  say(16, MENU_ROW + 2, str('QUIT FIGHT'), PZ_TEXT)
}

function cursor(at: u16): void {
  let k: u16 = 0
  while (k < 3) {
    say(14, MENU_ROW + k, k === at ? str('>') : str(' '), PZ_TEXT)
    k++
  }
}

/* ---------------- the log line's words (design 5.3) ---------------- */

/** `> P1 COUNTER  HEAVY PUNCH`, `> CPU ANTI-AIR`, `> P1 THROW`, `> THROW TECH`, `> READ`. */
export function logDraw(kind: u16, side: u16, move: u16): void {
  say(1, LOG_ROW, str('>'), SL_LOG)
  let x: u16 = 3
  if (kind === LOG_TECH) {
    say(x, LOG_ROW, str('THROW TECH'), SL_LOG)
    return
  }
  if (kind !== LOG_COUNTER && kind !== LOG_AA && kind !== LOG_THROW) {
    say(x, LOG_ROW, str('READ'), SL_LOG)
    return
  }
  x = put(x, side === 0 ? str('P1') : str('CPU')) + 1
  if (kind === LOG_AA) put(x, str('ANTI-AIR'))
  else if (kind === LOG_THROW) put(x, str('THROW'))
  else moveName(put(x, str('COUNTER')) + 2, move)
}

/** Words at column `x` of the log's row; the column after them. */
function put(x: u16, s: u16): u16 {
  say(x, LOG_ROW, s, SL_LOG)
  let n: u16 = 0
  while (peek(s + n) !== 0) n++
  return x + n
}

/** A move's name: its posture (crouching, in the air), then which button. */
function moveName(x: u16, m: u16): void {
  let at = x
  const posture = m >> 2
  if (posture === 1) at = put(at, str('CROUCH '))
  else if (posture === 2) at = put(at, str('JUMP '))
  const col = m & 3
  if (col === 0) put(at, str('LIGHT PUNCH'))
  else if (col === 1) put(at, str('HEAVY PUNCH'))
  else if (col === 2) put(at, str('LIGHT KICK'))
  else put(at, str('HEAVY KICK'))
}

/* ---------------- the ladder's screens (design 5.4) ---------------- */

/** CONTINUE? and a count from 9 to 0, a second each: START or A plays the opponent again. */
export function continueAsk(): bool {
  bandShow(str('CONTINUE?'))
  let n: u16 = 9
  let t: u16 = 0
  countShow(n)
  for (;;) {
    pauseFrame()
    if (pressed(B_START) || pressed(B_A)) {
      hudRows(MENU_ROW, 1)
      bandClear()
      return true
    }
    t++
    if (t < COUNT_F) continue
    t = 0
    if (n === 0) {
      hudRows(MENU_ROW, 1)
      bandClear()
      return false
    }
    n--
    countShow(n)
  }
}

function countShow(n: u16): void {
  vpoke(cellAt(1, 20, MENU_ROW), (FONT_TILE + 16 + n) | (PZ_TEXT << 10) | 0x8000)
}

/** GAME OVER on its band for two seconds (START goes on). */
export function gameOver(): void {
  bandWait(str('GAME OVER'), 120)
}

/** SYSTEM CLEAR on its band for three seconds (START goes on). */
export function systemClear(): void {
  bandWait(str('SYSTEM CLEAR'), 180)
}

function bandWait(s: u16, f: u16): void {
  bandShow(s)
  say(13, MENU_ROW, str('PRESS START'), PZ_DIM)
  let t: u16 = 0
  while (t < f) {
    pauseFrame()
    if (pressed(B_START)) break
    t++
  }
  hudRows(MENU_ROW, 1)
  bandClear()
}
