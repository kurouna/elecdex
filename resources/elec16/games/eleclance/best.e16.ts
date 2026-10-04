// ELECLANCE's best five (docs/elec16-eleclance.md section 4), in the cartridge's save RAM:
// read at the start, written when a name is entered, shown on the title. In cartridge bank 2
// with the scenes; save RAM is reached through the kit, which puts the window back.
import { addr, type u16, words } from '../../../../src/shared/e16c/builtins'
import { cellAt, saveRead, saveWrite, scoreMore, scoreShow, vpoke } from '../lib/kit.e16'
import { best, font, score } from './score.e16'
import { SL_GOLD, SL_TEXT } from './view.e16'

/** Save RAM: "AR", then five of (score low, score high, three letters in two words). */
const MAGIC = 0x5241
const ENTRY = 8

export const bestScore = words(10)
export const bestName = words(15)

/** The table read from save RAM, or a fresh one. */
export function tableLoad(): void {
  if (saveRead(0) !== MAGIC) tableFresh()
  let k: u16 = 0
  while (k < 5) {
    const at = 2 + k * ENTRY
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

function tableFresh(): void {
  saveWrite(0, MAGIC)
  let k: u16 = 0
  while (k < 5) {
    const at = 2 + k * ENTRY
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
  k = 0
  while (k < 5) {
    const at = 2 + k * ENTRY
    saveWrite(at, bestScore[k * 2])
    saveWrite(at + 2, bestScore[k * 2 + 1])
    saveWrite(at + 4, bestName[k * 3] | (bestName[k * 3 + 1] << 8))
    saveWrite(at + 6, bestName[k * 3 + 2])
    k++
  }
}

/** The table drawn from row `y`: place, name and score. */
export function tableShow(y: u16): void {
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

import { DIGITS } from './score.e16'
