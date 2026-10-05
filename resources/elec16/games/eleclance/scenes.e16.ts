// ELECLANCE's scenes round the play (docs/elec16-eleclance.md): the panels' labels, the warning,
// the pause, the tally, the game's end and the name for the best five. Kept in cartridge bank 2,
// out of RAM's room: they run seldom, and reach everything in RAM through far_call's return.
import { div, str, type u16, words } from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_DOWN,
  B_START,
  B_UP,
  cellAt,
  frame_wait,
  number,
  padRead,
  palMix,
  pressed,
  vpoke,
} from '../lib/kit.e16'
import { soundMaster } from '../lib/sound.e16'
import { M_CLEAR, M_ENTRY, M_OVER, music, sfxSelect, sfxSiren } from './audio.e16'
import { fxStep } from './fx.e16'
import { LV_EASY, LV_HARD, level } from './level.e16'
import { DIGITS, font, hudReset, hudStep, maxChain, points, skims } from './score.e16'
import { bombs, lives } from './ship.e16'
import { fieldClear, palettesIn, SL_GOLD, SL_RED, SL_TEXT, say, unsay } from './view.e16'

/* ---------------- the panels ---------------- */

/** The panels' labels and the difficulty, once a round; every reading drawn again after. */
export function hudLabels(): void {
  say(6, 0, str('1UP'), SL_RED)
  say(21, 0, str('HI'), SL_GOLD)
  say(1, 2, str('CHAIN'), SL_TEXT)
  say(1, 6, str('MULT'), SL_TEXT)
  say(1, 11, str('SKIM'), SL_TEXT)
  say(1, 15, str('LEVEL'), SL_TEXT)
  // Four letters under the label, as the other readings: NORMAL would touch the panel's edge.
  say(
    1,
    16,
    level === LV_EASY ? str('EASY') : level === LV_HARD ? str('HARD') : str('NORM'),
    SL_GOLD,
  )
  say(35, 2, str('SHIP'), SL_TEXT)
  say(35, 7, str('BOMB'), SL_TEXT)
  say(35, 12, str('VOLT'), SL_TEXT)
  say(35, 17, str('POWER'), SL_TEXT)
  hudReset()
}

/** WARNING: a red band across the field, the ground pulsing red, the siren. */
export function warningStep(t: u16): void {
  if (t === 300) {
    music(0)
    say(10, 14, str('= = = = = = = = ='), SL_RED)
    say(14, 15, str('WARNING'), SL_RED)
    say(8, 16, str('A HUGE ENEMY APPROACHES'), SL_TEXT)
    say(10, 17, str('= = = = = = = = ='), SL_RED)
  }
  if (t % 60 === 0) sfxSiren()
  const pulse = t % 60
  palMix(0, 0x001c, pulse < 30 ? pulse >> 2 : (60 - pulse) >> 2)
  if (t === 1) {
    fieldClear()
    palettesIn()
  }
}

/** START: everything stops, dimmed, until START again; the words say so, below the banners. */
export function pause(): void {
  dim(8)
  say(17, 20, str('PAUSED'), SL_GOLD)
  say(12, 22, str('START TO RESUME'), SL_TEXT)
  soundMaster(4)
  for (;;) {
    seenIs(frame_wait(seen))
    padRead()
    if (pressed(B_START)) break
  }
  soundMaster(15)
  unsay(17, 20, 6)
  unsay(12, 22, 15)
  dim(0)
}

/** The field's colours, backgrounds and sprites, `t` sixteenths of the way to black (0 as kept). */
function dim(t: u16): void {
  let s: u16 = 0
  while (s < 16) {
    if (s < 4 || s >= 8) palMix(s, 0, t)
    s++
  }
}

/** The stage cleared: the tally of the round, points for each line. */
export function tally(): void {
  music(M_CLEAR)
  fieldClear()
  say(13, 8, str('STAGE CLEAR'), SL_GOLD)
  idle(60)
  say(9, 12, str('MAX CHAIN'), SL_TEXT)
  number_(24, 12, maxChain)
  idle(30)
  say(9, 14, str('SKIM'), SL_TEXT)
  number_(24, 14, skims)
  idle(30)
  say(9, 16, str('BOMBS LEFT'), SL_TEXT)
  number_(24, 16, bombs)
  idle(30)
  bonus()
  hudStep(lives, bombs, voltNow(), 0)
  idle(180)
  fieldClear()
}

/**
 * The tally's bonus: 1,000 points for each of MAX CHAIN and 10,000 for each bomb left. Kept in
 * tens as the score is, in two words (a long chain alone runs past one), added and shown in
 * points with the score's last 0.
 */
function bonus(): void {
  let hi = div(maxChain, 100)
  let lo = (maxChain % 100) * 100 + bombs * 1000
  if (lo >= 10000) {
    lo = lo - 10000
    hi++
  }
  let k = hi
  while (k > 0) {
    points(10000)
    k--
  }
  points(lo)
  say(9, 19, str('BONUS'), SL_GOLD)
  let at = cellAt(1, 22, 19)
  if (hi > 0) {
    at = numberAt(at, hi)
    number(at, lo, 4, font(SL_GOLD) + DIGITS)
    at = at + 8
  } else at = numberAt(at, lo)
  if (hi + lo > 0) vpoke(at, font(SL_GOLD) + DIGITS)
}

function number_(x: u16, y: u16, n: u16): void {
  numberAt(cellAt(1, x, y), n)
}

/** A number as it is, without leading zeros, at a cell: answers the cell after it. */
function numberAt(at: u16, n: u16): u16 {
  const digits: u16 = n >= 10000 ? 5 : n >= 1000 ? 4 : n >= 100 ? 3 : n >= 10 ? 2 : 1
  number(at, n, digits, font(SL_GOLD) + DIGITS)
  return at + digits * 2
}

/** The game's end: GAME OVER, then the name if the score made the best five. */
export function gameOver(): void {
  music(M_OVER)
  fieldClear()
  say(15, 15, str('GAME OVER'), SL_RED)
  idle(200)
  const place = tablePlace()
  if (place < 5) nameEntry(place)
  fieldClear()
}

/** The name being entered: three letters, A to Z. */
const letters = words(3)

/** Letter `k` turned by up and down; the three drawn, the one being chosen blinking. */
function letterStep(k: u16, t: u16): void {
  let c = letters[k]
  if (pressed(B_UP)) c = c === 90 ? 65 : c + 1
  if (pressed(B_DOWN)) c = c === 65 ? 90 : c - 1
  letters[k] = c
  let j: u16 = 0
  while (j < 3) {
    const blink = j === k && (t & 16) !== 0
    vpoke(cellAt(1, 18 + j, 15), font(blink ? SL_TEXT : SL_GOLD) + letters[j] - 32)
    j++
  }
}

/** Three letters with the d-pad (up and down) and A; thirty seconds at most. */
function nameEntry(place: u16): void {
  music(M_ENTRY)
  fieldClear()
  say(10, 10, str('A NEW BEST SCORE'), SL_GOLD)
  say(12, 12, str('ENTER YOUR NAME'), SL_TEXT)
  letters[0] = 65
  letters[1] = 65
  letters[2] = 65
  let k: u16 = 0
  let t: u16 = 0
  while (k < 3 && t < 1800) {
    frameBegin()
    fxStep()
    t++
    letterStep(k, t)
    if (pressed(B_A)) {
      sfxSelect()
      k++
    }
  }
  tableEnter(place, letters[0], letters[1], letters[2])
  fieldClear()
  tableShow(12)
  idle(240)
}

import { tableEnter, tablePlace, tableShow } from './best.e16'
import { frameBegin, idle, seen, seenIs, voltNow } from './eleclance.e16'
