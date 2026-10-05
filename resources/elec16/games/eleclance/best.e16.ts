// ELECLANCE's best five (docs/elec16-eleclance.md section 4), one for each difficulty, in the
// cartridge's save RAM with the difficulty last chosen: read at the start, written when a name
// is entered, shown on the title. In cartridge bank 2 with the scenes; save RAM is reached
// through the kit, which puts the window back.
import { addr, str, type u16, words } from '../../../../src/shared/e16c/builtins'
import { cellAt, saveRead, saveWrite, scoreMore, scoreShow, vpoke } from '../lib/kit.e16'
import { LV_EASY, LV_HARD, LV_NORMAL, level, levelSet } from './level.e16'
import { best, DIGITS, font, score } from './score.e16'
import { SL_GOLD, SL_TEXT, say, unsay } from './view.e16'

/**
 * Save RAM: "AR" at 0, then NORMAL's five at 2 - each a score (low, high) and three letters in
 * two words - where the one table of the first saves was, so an old save's names stay NORMAL's.
 * "LV" at 42 marks the rest: the difficulty last chosen at 44, EASY's five at 64, HARD's at 128.
 */
const MAGIC = 0x5241
const LEVEL_MAGIC = 0x564c
const LEVEL_MARK = 42
const LEVEL_AT = 44
const ENTRY = 8

export const bestScore = words(10)
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

/** The chosen difficulty's five from save RAM; the best of them is HI. */
export function tableRead(): void {
  const from = tableAt(level)
  let k: u16 = 0
  while (k < 5) {
    const at = from + k * ENTRY
    bestScore[k * 2] = saveRead(at)
    bestScore[k * 2 + 1] = saveRead(at + 2)
    const ab = saveRead(at + 4)
    bestName[k * 3] = ab & 255
    bestName[k * 3 + 1] = ab >> 8
    bestName[k * 3 + 2] = saveRead(at + 6) & 255
    k++
  }
  best[0] = bestScore[0]
  best[1] = bestScore[1]
}

/** A fresh five at `from`: ELC, 50,000 down to 10,000. */
function tableFresh(from: u16): void {
  let k: u16 = 0
  while (k < 5) {
    const at = from + k * ENTRY
    saveWrite(at, (5 - k) * 1000)
    saveWrite(at + 2, 0)
    saveWrite(at + 4, 0x4c45)
    saveWrite(at + 6, 0x43)
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

/** The score into the table at `place` with three letters, the rest moved down, saved. */
export function tableEnter(place: u16, a: u16, b: u16, c: u16): void {
  let k: u16 = 4
  while (k > place) {
    bestScore[k * 2] = bestScore[k * 2 - 2]
    bestScore[k * 2 + 1] = bestScore[k * 2 - 1]
    bestName[k * 3] = bestName[k * 3 - 3]
    bestName[k * 3 + 1] = bestName[k * 3 - 2]
    bestName[k * 3 + 2] = bestName[k * 3 - 1]
    k--
  }
  bestScore[place * 2] = score[0]
  bestScore[place * 2 + 1] = score[1]
  bestName[place * 3] = a
  bestName[place * 3 + 1] = b
  bestName[place * 3 + 2] = c
  const from = tableAt(level)
  k = 0
  while (k < 5) {
    const at = from + k * ENTRY
    saveWrite(at, bestScore[k * 2])
    saveWrite(at + 2, bestScore[k * 2 + 1])
    saveWrite(at + 4, bestName[k * 3] | (bestName[k * 3 + 1] << 8))
    saveWrite(at + 6, bestName[k * 3 + 2])
    k++
  }
}

/** The table drawn from row `y`, its difficulty named above it: place, name and score. */
export function tableShow(y: u16): void {
  unsay(13, y - 2, 14)
  say(13, y - 2, str('BEST 5'), SL_TEXT)
  say(
    20,
    y - 2,
    level === LV_EASY ? str('EASY') : level === LV_HARD ? str('HARD') : str('NORMAL'),
    SL_GOLD,
  )
  let k: u16 = 0
  while (k < 5) {
    const row = y + k * 2
    const s = k === 0 ? SL_GOLD : SL_TEXT
    vpoke(cellAt(1, 10, row), font(s) + DIGITS + 1 + k)
    vpoke(cellAt(1, 13, row), font(s) + bestName[k * 3] - 32)
    vpoke(cellAt(1, 14, row), font(s) + bestName[k * 3 + 1] - 32)
    vpoke(cellAt(1, 15, row), font(s) + bestName[k * 3 + 2] - 32)
    scoreShow(cellAt(1, 18, row), addr(bestScore) + k * 4, font(s) + DIGITS)
    vpoke(cellAt(1, 26, row), font(s) + DIGITS)
    k++
  }
}
