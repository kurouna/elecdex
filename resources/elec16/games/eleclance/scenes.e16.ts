// ELECLANCE's scenes round the play (docs/elec16-eleclance.md): the title, the warning, the
// pause, the tally, the game's end and the name for the best five. Kept in cartridge bank 2,
// out of RAM's room: they run seldom, and reach everything in RAM through far_call's return.
import { div, peek16, poke16, str, type u16 } from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_DOWN,
  B_START,
  B_UP,
  BG1Y,
  cellAt,
  frame_wait,
  padRead,
  palMix,
  pressed,
  randSeed,
  vpoke,
} from '../lib/kit.e16'
import { soundMaster } from '../lib/sound.e16'
import { M_CLEAR, M_ENTRY, M_OVER, M_TITLE, music, sfxSelect, sfxSiren } from './audio.e16'
import { farStarsStep, fxStep } from './fx.e16'
import { font, hudStep, maxChain, points, skims } from './score.e16'
import { bombs, lives } from './ship.e16'
import {
  fieldClear,
  mapsClear,
  palettesIn,
  SL_GOLD,
  SL_RED,
  SL_TEXT,
  say,
  shake,
  shakeStep,
  stageSpeed,
  stageStart,
  stageStep,
  unsay,
  wave,
} from './view.e16'

/* ---------------- the title ---------------- */

export function title(): void {
  mapsClear()
  stageStart()
  stageSpeed(4)
  logoIn()
  music(M_TITLE)
  tableShow(22)
  say(10, 34, str('(C) ELECXZY PROJECT'), SL_TEXT)
  let t: u16 = 0
  for (;;) {
    frameBegin()
    shakeStep()
    stageStep()
    farStarsStep(1, frame)
    logoStep(t)
    if ((t & 32) === 0) say(14, 17, str('PRESS START'), SL_GOLD)
    else unsay(14, 17, 11)
    if (t > 40 && pressed(B_START | B_A)) break
    t++
  }
  randSeed(frame ^ peek16(0x0202))
  sfxSelect()
  palettesIn()
}

/** The word comes down from above and flashes white as it lands. */
function logoStep(t: u16): void {
  if (t < 48) {
    poke16(BG1Y, (48 - t) * 2)
    palMix(SL_RED, 0x7fff, 16)
  } else if (t < 64) {
    poke16(BG1Y, 0)
    palMix(SL_RED, 0x7fff, 64 - t)
    if (t === 48) {
      shake(12)
      wave(40, 6)
    }
  }
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

/** START: everything stops until START again. */
export function pause(): void {
  say(16, 15, str('PAUSE'), SL_GOLD)
  soundMaster(4)
  for (;;) {
    seenIs(frame_wait(seen))
    padRead()
    if (pressed(B_START)) break
  }
  soundMaster(15)
  unsay(16, 15, 5)
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
  points(maxChain * 100 + bombs * 1000)
  say(9, 19, str('BONUS'), SL_GOLD)
  number_(22, 19, maxChain * 100 + bombs * 1000)
  hudStep(lives, bombs, voltNow(), 0)
  idle(180)
  fieldClear()
}

function number_(x: u16, y: u16, n: u16): void {
  numberAt(cellAt(1, x, y), n)
}

/** A number of up to five digits, its last a 0 (points are kept in tens), or as it is. */
function numberAt(at: u16, n: u16): void {
  let k: u16 = n >= 10000 ? 5 : n >= 1000 ? 4 : n >= 100 ? 3 : n >= 10 ? 2 : 1
  let v = n
  while (k > 0) {
    k--
    vpoke(at + k * 2, font(SL_GOLD) + 16 + (v % 10))
    v = div(v, 10)
  }
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

import { words } from '../../../../src/shared/e16c/builtins'
import { tableEnter, tablePlace, tableShow } from './best.e16'
import { frame, frameBegin, idle, logoIn, seen, seenIs, voltNow } from './eleclance.e16'
