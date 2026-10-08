// ELECFIGHTER's results and records (docs/elec16-elecfighter-design.md 5.4): a match's result
// (WIN or LOSE, the hits, the longest combo, the time left, the rounds), CONTINUE? and its count,
// GAME OVER, SYSTEM CLEAR with the ladder's time and each slot's record, the BEST screen - and
// save RAM, where the button set, the log line and the records are kept.
//
// Save RAM (one bank, `saveRead`/`saveWrite` words at even offsets):
//    0  'EF' (0x4645), the mark
//    2  the button set: 0 TYPE A, 1 TYPE B
//    4  the log line: 1 off
//    6  the layout's version: 1 (a save without it, P2's, keeps its words 2 and 4, the rest new)
//    8  flags: 1 the controls have been shown once (VERSUS CPU shows them by itself until then)
//   10  the best streak: matches won in a row, continues breaking it
//   12, 14  kept for later
//   16 + 8 s  slot s (0-7): its clears, its best clear time in seconds (0 none), 2 words kept
// In bank 7: rarely run.
import { type bool, div, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_START,
  cellAt,
  number,
  palMix,
  pressed,
  saveRead,
  saveWrite,
  vpoke,
} from '../../lib/kit.e16'
import { DIGITS_TILE, FONT_TILE } from '../assets.e16'
import { M_CLEAR, music } from '../engine/audio.e16'
import { oppName, SLOTS, slName } from '../engine/data.e16'
import {
  bandClear,
  bandShow,
  bigCentred,
  FRONT,
  hudClear,
  hudRows,
  logOff,
  SL_DIM,
  SL_P1,
  say,
} from '../engine/draw.e16'
import { fComboMax } from '../engine/fighter.e16'
import { buttonSet, buttonSetIs } from '../engine/input.e16'
import { hitsN } from '../engine/look.e16'
import {
  frameBegin,
  SC_BEST,
  SC_CLEAR,
  SC_CONTINUE,
  SC_OVER,
  SC_RESULT,
  screenClear,
  screenIs,
  timeLeft,
} from '../engine/main.e16'
import { choice, clearSec, continues, outcome, wins } from './match.e16'

const MAGIC = 0x4645
const VERSION = 1
const SV_MAGIC = 0
const SV_TYPE = 2
const SV_LOG = 4
const SV_VERSION = 6
const SV_FLAGS = 8
const SV_STREAK = 10
const SV_SLOTS = 16
const SV_SLOT_W = 8
const SAVED_SLOTS = 8
const F_CONTROLS = 1

/** Matches won in a row since the last loss (this power-on), and whether a record fell. */
export let streak: u16 = 0
export const newRecord = words(1)
/** CONTINUE?'s count as shown (the tests read it). */
export let contN: u16 = 0

/* ---------------- save RAM ---------------- */

/**
 * Save RAM read as the cartridge starts: made new without the mark, brought up from P2's layout.
 */
export function saveLoad(): void {
  if (saveRead(SV_MAGIC) !== MAGIC) {
    saveWrite(SV_MAGIC, MAGIC)
    saveWrite(SV_TYPE, 0)
    saveWrite(SV_LOG, 0)
    recordsNew()
  } else if (saveRead(SV_VERSION) !== VERSION) recordsNew()
  buttonSetIs(saveRead(SV_TYPE))
  logOff[0] = saveRead(SV_LOG) & 1
}

/** The words after the button set and the log: this version's, empty. */
function recordsNew(): void {
  saveWrite(SV_VERSION, VERSION)
  saveWrite(SV_FLAGS, 0)
  saveWrite(SV_STREAK, 0)
  let k: u16 = 0
  while (k < SAVED_SLOTS * SV_SLOT_W) {
    saveWrite(SV_SLOTS + k, 0)
    k = k + 2
  }
}

/** The button set and the log line kept. */
export function saveKeep(): void {
  saveWrite(SV_TYPE, buttonSet)
  saveWrite(SV_LOG, logOff[0])
}

/** Whether the controls have been shown once; and that they have. */
export function controlsSeen(): bool {
  return (saveRead(SV_FLAGS) & F_CONTROLS) !== 0
}

export function controlsSeenSet(): void {
  saveWrite(SV_FLAGS, saveRead(SV_FLAGS) | F_CONTROLS)
}

function slotAt(s: u16): u16 {
  return SV_SLOTS + s * SV_SLOT_W
}

/* ---------------- a match's result ---------------- */

/**
 * The match's result over the darkened fight until START or A (or 6 seconds); the streak counted.
 */
export function resultShow(k: u16): void {
  screenIs(SC_RESULT)
  const won = outcome === 1
  if (won) {
    streak++
    if (streak > saveRead(SV_STREAK)) saveWrite(SV_STREAK, streak)
  } else streak = 0
  resultDim(10)
  hudClear()
  // All above the skyline's tallest tower (y 104), on the dimmed sky's clear ground.
  say(14, 1, str('MATCH RESULT'), SL_DIM)
  bigCentred(2, won ? str('WIN') : str('LOSE'))
  say(13, 6, str('VS'), SL_DIM)
  say(16, 6, oppName[k], SL_P1)
  statRow(8, str('HITS'), hitsN[0])
  statRow(9, str('MAX COMBO'), fComboMax[1])
  statRow(10, str('TIME LEFT'), timeLeft)
  say(10, 11, str('ROUNDS'), SL_DIM)
  number(cellAt(1, 26, 11), wins[0], 1, digit())
  say(27, 11, str('-'), SL_P1)
  number(cellAt(1, 28, 11), wins[1], 1, digit())
  statRow(12, str('STREAK'), streak)
  say(14, 30, str('PRESS START'), SL_P1)
  waitPress(360, 20)
  hudClear()
  resultDim(0)
}

/** A row of the result: its word, its number right-aligned at column 29. */
function statRow(y: u16, s: u16, n: u16): void {
  say(10, y, s, SL_DIM)
  count3(26, y, n)
}

/** A count of up to three figures at BG1's cell (x, y), right-aligned, no zeros in front. */
function count3(x: u16, y: u16, n: u16): void {
  number(cellAt(1, x, y), n > 999 ? 999 : n, 3, digit())
  const blank = FONT_TILE | (SL_P1 << 10) | FRONT
  if (n < 100) vpoke(cellAt(1, x, y), blank)
  if (n < 10) vpoke(cellAt(1, x + 1, y), blank)
}

function digit(): u16 {
  return (FONT_TILE + 16) | (SL_P1 << 10) | FRONT
}

/** The stage, the fighters and the effects mixed `t` sixteenths to black (the HUD as it is). */
function resultDim(t: u16): void {
  palMix(0, 0, t)
  palMix(8, 0, t)
  palMix(9, 0, t)
  palMix(10, 0, t)
}

/** Frames until START or A (not before `least`), at most `most`. */
function waitPress(most: u16, least: u16): void {
  let t: u16 = 0
  while (t < most) {
    frameBegin()
    if (t >= least && (pressed(B_START) || pressed(B_A))) return
    t++
  }
}

/* ---------------- CONTINUE?, GAME OVER, SYSTEM CLEAR ---------------- */

const COUNT_F = 60
const COUNT_ROW = 20

/** CONTINUE? and a count from 9 to 0, a second each: START or A plays the opponent again. */
export function continueAsk(): bool {
  screenIs(SC_CONTINUE)
  bandShow(str('CONTINUE?'))
  let n: u16 = 9
  let t: u16 = 0
  countShow(n)
  for (;;) {
    frameBegin()
    if (pressed(B_START) || pressed(B_A)) {
      continueGone()
      return true
    }
    t++
    if (t < COUNT_F) continue
    t = 0
    if (n === 0) {
      continueGone()
      return false
    }
    n--
    countShow(n)
  }
}

function continueGone(): void {
  hudRows(COUNT_ROW, 2)
  bandClear()
}

/** The count in TIME's large figures under the band. */
function countShow(n: u16): void {
  contN = n
  const tile = (DIGITS_TILE + n * 4) | (4 << 10) | FRONT
  vpoke(cellAt(1, 19, COUNT_ROW), tile)
  vpoke(cellAt(1, 20, COUNT_ROW), tile + 1)
  vpoke(cellAt(1, 19, COUNT_ROW + 1), tile + 2)
  vpoke(cellAt(1, 20, COUNT_ROW + 1), tile + 3)
}

/** GAME OVER on its band for two and a half seconds (START goes on), the music gone. */
export function gameOver(): void {
  screenIs(SC_OVER)
  bandShow(str('GAME OVER'))
  waitPress(150, 20)
  music(0)
  bandClear()
}

/**
 * SYSTEM CLEAR: the ladder's time and continues, the slot's record kept (its clears, its best
 * time), the records of every slot under them, until START (or 12 seconds).
 */
export function systemClear(): void {
  screenIs(SC_CLEAR)
  music(M_CLEAR)
  recordClear(choice[0], clearSec)
  resultDim(10)
  hudClear()
  bigCentred(3, str('SYSTEM CLEAR'))
  say(15, 8, slName[choice[0]], SL_P1)
  say(10, 10, str('CLEAR TIME'), SL_DIM)
  timeAt(24, 10, clearSec)
  say(10, 11, str('CONTINUES'), SL_DIM)
  count3(26, 11, continues)
  if (newRecord[0] !== 0) say(15, 13, str('NEW RECORD'), SL_P1)
  bestDraw(16)
  say(14, 32, str('PRESS START'), SL_P1)
  waitPress(720, 60)
  hudClear()
  resultDim(0)
  music(0)
}

/** A clear of slot `s` in `sec` seconds: one more clear, and its best time if it is quicker. */
function recordClear(s: u16, sec: u16): void {
  const at = slotAt(s)
  saveWrite(at, saveRead(at) + 1)
  const best = saveRead(at + 2)
  const t = sec === 0 ? 1 : sec
  newRecord[0] = 0
  if (best === 0 || t < best) {
    saveWrite(at + 2, t)
    newRecord[0] = 1
  }
}

/** Seconds as mm:ss at BG1's cell (x, y); none (0) as --:--. */
function timeAt(x: u16, y: u16, sec: u16): void {
  if (sec === 0) {
    say(x, y, str('--:--'), SL_DIM)
    return
  }
  const m = div(sec, 60)
  number(cellAt(1, x, y), m > 99 ? 99 : m, 2, digit())
  say(x + 2, y, str(':'), SL_P1)
  number(cellAt(1, x + 3, y), sec - m * 60, 2, digit())
}

/* ---------------- BEST ---------------- */

/** The records from row `y`: each slot's clears and best clear time, then the best streak. */
export function bestDraw(y: u16): void {
  say(14, y, str('BEST RECORDS'), SL_P1)
  say(4, y + 2, str('SLOT'), SL_DIM)
  say(18, y + 2, str('CLEARS'), SL_DIM)
  say(27, y + 2, str('BEST TIME'), SL_DIM)
  let s: u16 = 0
  while (s < SLOTS) {
    const at = slotAt(s)
    say(4, y + 4 + s, slName[s], SL_P1)
    count3(20, y + 4 + s, saveRead(at))
    timeAt(29, y + 4 + s, saveRead(at + 2))
    s++
  }
  say(4, y + 10, str('BEST STREAK'), SL_DIM)
  count3(20, y + 10, saveRead(SV_STREAK))
}

/** BEST from the menu, until START, A or B. */
export function bestRun(): void {
  screenIs(SC_BEST)
  screenClear()
  bestDraw(6)
  say(12, 30, str('START OR B: BACK'), SL_DIM)
  for (;;) {
    frameBegin()
    if (pressed(B_START) || pressed(B_A) || pressed(B_B)) return
  }
}
