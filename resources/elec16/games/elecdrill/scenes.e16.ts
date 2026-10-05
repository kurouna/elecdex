// ELECDRILL's scenes round the play (docs/elec16-elecdrill.md section 4): the pause, a stratum
// passed, the question of going on, the core reached and the tally. Kept in
// cartridge bank 1, out of RAM's room: they run seldom, and reach everything in RAM through
// far_call's return. Nothing here moves the bank window (the kit's calls put it back).
import { div, str, type u16 } from '../../../../src/shared/e16c/builtins'
import { B_A, B_START, cellAt, frame_wait, padRead, palMix, pressed, vpoke } from '../lib/kit.e16'
import { soundMaster } from '../lib/sound.e16'
import { M_DEEP, M_GOAL, M_MAIN, M_OVER, M_RESULT, music, sfxSelect } from './audio.e16'
import {
  band,
  bandH,
  bandY,
  figure,
  glyph,
  say,
  score,
  unsay,
  W_GOLD,
  W_GREEN,
  W_RED,
  W_WHITE,
  wellClear,
} from './hud.e16'
import { LV_EASY, LV_HARD, level } from './level.e16'
import { stratumShow } from './panel.e16'
import { air, capsules, cheer } from './player.e16'

/* ---------------- in play ---------------- */

/**
 * START: everything stops, the well dimmed, until START again; the words say so. A banner up
 * (READY, a stratum) keeps its band when play goes on.
 */
export function pause(): void {
  const oldY = bandY
  const oldH = bandH
  band(116, 3)
  say(17, 16, str('PAUSED'), W_GOLD)
  say(12, 18, str('START TO RESUME'), W_WHITE)
  soundMaster(4)
  dim(8)
  // Two frames drawn, so the band is up; then nothing moves.
  idle(2)
  for (;;) {
    seenIs(frame_wait(seen))
    padRead()
    if (pressed(B_START)) break
  }
  soundMaster(15)
  dim(0)
  unsay(17, 16, 6)
  unsay(12, 18, 15)
  band(oldY, oldH)
}

/** The well's colours, backgrounds and sprites, `t` sixteenths of the way to black (0 as kept). */
function dim(t: u16): void {
  let s: u16 = 0
  while (s < 16) {
    // Not the gold words and the flash (6), the panels (7, and 13 the band's), the gold (15).
    if (s !== 6 && s !== 7 && s !== 13 && s !== 15) palMix(s, 0, t)
    s++
  }
}

/** A stratum passed: its number and name across the well, the bonus. */
export function stratumBanner(s: u16): void {
  wellClear()
  band(146, 5)
  say(14, 19, str('= = = = = ='), W_GOLD)
  say(14, 20, str('STRATUM'), W_WHITE)
  vpoke(cellAt(1, 22, 20), glyph(49 + s, W_GOLD))
  let name = str('CLAY')
  if (s === 2) name = str('SLATE')
  else if (s === 3) name = str('MAGMA')
  else if (s === 4) name = str('GEODE')
  say(17, 22, name, W_GOLD)
  say(14, 24, str('= = = = = ='), W_GOLD)
  say(13, 26, str('BONUS'), W_WHITE)
  figure(cellAt(1, 19, 26), s * 1000, 5, W_GOLD)
  say(13, 27, str('AIR +20'), W_GREEN)
}

/** No drillers left: GAME OVER, and ten seconds to press START and go on. */
export function continueAsk(): bool {
  music(M_OVER)
  wellClear()
  band(90, 4)
  say(15, 12, str('GAME OVER'), W_RED)
  idle(120)
  say(14, 15, str('CONTINUE?'), W_WHITE)
  say(12, 18, str('PRESS START'), W_GOLD)
  let n: u16 = 10
  while (n > 0) {
    n--
    vpoke(cellAt(1, 24, 15), glyph(48 + n, W_GOLD))
    let t: u16 = 0
    while (t < 60) {
      idle(1)
      if (pressed(B_START)) {
        wellClear()
        sfxSelect()
        music(stratum >= 3 ? M_DEEP : M_MAIN)
        return true
      }
      t++
    }
  }
  return false
}

/** The core: RIVET cheers, the bonus for AIR left and drillers spared. */
export function goal(): void {
  cheer()
  music(M_GOAL)
  wellClear()
  stratumShow(5)
  band(138, 6)
  say(13, 18, str('CORE REACHED!'), W_GOLD)
  idle(90)
  say(12, 21, str('AIR'), W_WHITE)
  figure(cellAt(1, 23, 21), air * 100, 5, W_GOLD)
  idle(30)
  say(12, 23, str('DRILLERS'), W_WHITE)
  figure(cellAt(1, 23, 23), lives * 5000, 5, W_GOLD)
  idle(30)
  points(air * 100 + 10000)
  points(lives * 5000)
  say(12, 25, str('CLEAR'), W_WHITE)
  figure(cellAt(1, 23, 25), 10000, 5, W_GOLD)
  idle(240)
}

/** The tally: how deep, the score, the best chain, the capsules; then a name for the best five. */
export function results(): void {
  music(M_RESULT)
  wellClear()
  band(42, 9)
  say(16, 6, str('RESULT'), W_GOLD)
  say(
    17,
    7,
    level === LV_EASY ? str(' EASY') : level === LV_HARD ? str(' HARD') : str('NORMAL'),
    W_WHITE,
  )
  say(12, 9, str('DEPTH'), W_WHITE)
  figure(cellAt(1, 24, 9), maxDepth, 3, W_GOLD)
  vpoke(cellAt(1, 27, 9), glyph(77, W_GOLD))
  idle(20)
  say(12, 11, str('SCORE'), W_WHITE)
  scoreAt(cellAt(1, 20, 11))
  idle(20)
  say(12, 13, str('CHAIN'), W_WHITE)
  figure(cellAt(1, 24, 13), maxChain, 4, W_GOLD)
  idle(20)
  say(12, 15, str('CAPSULES'), W_WHITE)
  figure(cellAt(1, 24, 15), capsules, 4, W_GOLD)
  if (continues > 0) {
    say(12, 17, str('CONTINUES'), W_WHITE)
    figure(cellAt(1, 26, 17), continues, 2, W_RED)
  }
  idle(90)
  const place = tablePlace()
  if (place < 5) nameEntry(place)
  else {
    say(13, 21, str('PRESS START'), W_GOLD)
    let t: u16 = 0
    while (t < 600) {
      idle(1)
      if (pressed(B_START | B_A)) break
      t++
    }
  }
  wellClear()
}

/** The score's eight digits at `at`. */
function scoreAt(at: u16): void {
  let v = score[0]
  let k: u16 = 0
  while (k < 4) {
    vpoke(at + 14 - k * 2, glyph(48 + (v % 10), W_GOLD))
    v = div(v, 10)
    k++
  }
  v = score[1]
  k = 0
  while (k < 4) {
    vpoke(at + 6 - k * 2, glyph(48 + (v % 10), W_GOLD))
    v = div(v, 10)
    k++
  }
}

import type { bool } from '../../../../src/shared/e16c/builtins'
import { nameEntry, tablePlace } from './best.e16'
import {
  continues,
  idle,
  lives,
  maxChain,
  maxDepth,
  points,
  seen,
  seenIs,
  stratum,
} from './drill.e16'
