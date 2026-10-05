// ELECDRILL's best five (docs/elec16-elecdrill.md section 4), one for each difficulty, in the
// cartridge's save RAM with the difficulty last chosen: read at the start, written when a name
// is entered, shown on the title. In cartridge bank 1 with the scenes; save RAM is reached
// through the kit, which puts the window back.
import { addr, type u16, words } from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_DOWN,
  B_UP,
  cellAt,
  pressed,
  saveRead,
  saveWrite,
  scoreMore,
  vpoke,
} from '../lib/kit.e16'
import { sfxSelect } from './audio.e16'
import { band, best, figure, glyph, say, score, W_GOLD, W_WHITE, wellClear } from './hud.e16'
import { LV_EASY, LV_HARD, LV_NORMAL, level, levelSet } from './level.e16'

/**
 * Save RAM: "ED" at 0, then NORMAL's five at 2 - each a score (low, high), the depth and three
 * letters in two words - where the one table of the first saves was, so an old save's names
 * stay NORMAL's. "LV" at 52 marks the rest: the difficulty last chosen at 54, EASY's five at
 * 64, HARD's at 128.
 */
const MAGIC = 0x4445
const LEVEL_MAGIC = 0x564c
const LEVEL_MARK = 52
const LEVEL_AT = 54
const ENTRY = 10

export const bestScore = words(10)
export const bestDepth = words(5)
export const bestName = words(15)

/** Where difficulty `l`'s five are kept. */
function tableAt(l: u16): u16 {
  return l === LV_EASY ? 64 : l === LV_HARD ? 128 : 2
}

/**
 * Save RAM read at the start: made fresh if it is not this game's; an old save (before the
 * difficulties) keeps its five as NORMAL's and is given the rest. The difficulty last chosen
 * is chosen again, and its five read.
 */
export function tableLoad(): void {
  if (saveRead(0) !== MAGIC) {
    saveWrite(0, MAGIC)
    tableFresh(tableAt(LV_NORMAL))
    saveWrite(LEVEL_MARK, 0)
  }
  if (saveRead(LEVEL_MARK) !== LEVEL_MAGIC) {
    tableFresh(tableAt(LV_EASY))
    tableFresh(tableAt(LV_HARD))
    saveWrite(LEVEL_AT, LV_NORMAL)
    saveWrite(LEVEL_MARK, LEVEL_MAGIC)
  }
  levelSet(saveRead(LEVEL_AT))
  tableRead()
}

/** The difficulty now chosen kept in save RAM, if it is not already. */
export function levelKeep(): void {
  if (saveRead(LEVEL_AT) !== level) saveWrite(LEVEL_AT, level)
}

/** The chosen difficulty's five from save RAM; the best of them is BEST. */
export function tableRead(): void {
  const from = tableAt(level)
  let k: u16 = 0
  while (k < 5) {
    const at = from + k * ENTRY
    bestScore[k * 2] = saveRead(at)
    bestScore[k * 2 + 1] = saveRead(at + 2)
    bestDepth[k] = saveRead(at + 4)
    const ab = saveRead(at + 6)
    bestName[k * 3] = ab & 255
    bestName[k * 3 + 1] = ab >> 8
    bestName[k * 3 + 2] = saveRead(at + 8) & 255
    k++
  }
  best[0] = bestScore[0]
  best[1] = bestScore[1]
}

/** A fresh five at `from`: RIV, 5,000 down to 1,000, modest depths. */
function tableFresh(from: u16): void {
  let k: u16 = 0
  while (k < 5) {
    const at = from + k * ENTRY
    saveWrite(at, (5 - k) * 1000)
    saveWrite(at + 2, 0)
    saveWrite(at + 4, (5 - k) * 20)
    saveWrite(at + 6, 0x4952)
    saveWrite(at + 8, 0x56)
    k++
  }
}

/** Where the score would go in the table (0-4), or 5. */
export function tablePlace(): u16 {
  let k: u16 = 0
  while (k < 5) {
    if (scoreMore(addr(score), addr(bestScore) + k * 4)) return k
    k++
  }
  return 5
}

/** The score into the table at `place` with three letters and the depth, the rest moved down, saved. */
export function tableEnter(place: u16, a: u16, b: u16, c: u16): void {
  let k: u16 = 4
  while (k > place) {
    bestScore[k * 2] = bestScore[k * 2 - 2]
    bestScore[k * 2 + 1] = bestScore[k * 2 - 1]
    bestDepth[k] = bestDepth[k - 1]
    bestName[k * 3] = bestName[k * 3 - 3]
    bestName[k * 3 + 1] = bestName[k * 3 - 2]
    bestName[k * 3 + 2] = bestName[k * 3 - 1]
    k--
  }
  bestScore[place * 2] = score[0]
  bestScore[place * 2 + 1] = score[1]
  bestDepth[place] = maxDepth
  bestName[place * 3] = a
  bestName[place * 3 + 1] = b
  bestName[place * 3 + 2] = c
  const from = tableAt(level)
  k = 0
  while (k < 5) {
    const at = from + k * ENTRY
    saveWrite(at, bestScore[k * 2])
    saveWrite(at + 2, bestScore[k * 2 + 1])
    saveWrite(at + 4, bestDepth[k])
    saveWrite(at + 6, bestName[k * 3] | (bestName[k * 3 + 1] << 8))
    saveWrite(at + 8, bestName[k * 3 + 2])
    k++
  }
}

/** The table drawn from row `y`: place, name, score and depth. */
export function tableShow(y: u16): void {
  say(13, y - 2, str('BEST DRILLERS'), W_GOLD)
  let k: u16 = 0
  while (k < 5) {
    const row = y + k * 2
    const s = k === 0 ? W_GOLD : W_WHITE
    vpoke(cellAt(1, 7, row), glyph(49 + k, s))
    vpoke(cellAt(1, 10, row), glyph(bestName[k * 3], s))
    vpoke(cellAt(1, 11, row), glyph(bestName[k * 3 + 1], s))
    vpoke(cellAt(1, 12, row), glyph(bestName[k * 3 + 2], s))
    scoreDigits(cellAt(1, 15, row), k, s)
    figure(cellAt(1, 25, row), bestDepth[k], 3, s)
    vpoke(cellAt(1, 28, row), glyph(77, s))
    k++
  }
}

/** Entry k's score as eight digits from `at`. */
function scoreDigits(at: u16, k: u16, s: u16): void {
  let hi = bestScore[k * 2 + 1]
  let lo = bestScore[k * 2]
  let d: u16 = 0
  while (d < 4) {
    vpoke(at + 14 - d * 2, glyph(48 + (lo % 10), s))
    vpoke(at + 6 - d * 2, glyph(48 + (hi % 10), s))
    lo = div(lo, 10)
    hi = div(hi, 10)
    d++
  }
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
    vpoke(cellAt(1, 18 + j, 14), glyph(letters[j], blink ? W_WHITE : W_GOLD))
    j++
  }
}

/** Three letters with up and down and A; thirty seconds at most. */
export function nameEntry(place: u16): void {
  wellClear()
  band(58, 6)
  say(14, 9, str('NEW RECORD'), W_GOLD)
  say(13, 11, str('ENTER A NAME'), W_WHITE)
  say(13, 17, str('UP DOWN, A: OK'), W_WHITE)
  letters[0] = 65
  letters[1] = 65
  letters[2] = 65
  let k: u16 = 0
  let t: u16 = 0
  while (k < 3 && t < 1800) {
    idle(1)
    t++
    letterStep(k, t)
    if (pressed(B_A)) {
      sfxSelect()
      k++
    }
  }
  tableEnter(place, letters[0], letters[1], letters[2])
  idle(60)
}

import { div, str } from '../../../../src/shared/e16c/builtins'
import { idle, maxDepth } from './drill.e16'
