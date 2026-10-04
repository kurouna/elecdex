// ELECAIRCOMBAT's records (docs/elec16-elecaircombat.md section 9), in the cartridge's save RAM:
// the best five scores with three letters, each sortie's fastest win, and how the stick is
// set. In cartridge bank 2 with the scenes; save RAM is reached through the kit, which puts
// the window back.
import { addr, type bool, div, type u16, words } from '../../../../src/shared/e16c/builtins'
import { saveRead, saveWrite, scoreMore } from '../lib/kit.e16'
import { stickIs, stickReversed } from './flight.e16'
import { best, score } from './game.e16'
import { cellXY, SL_AMBER, SL_WHITE, sayChar, sayNumber } from './sky.e16'

/** Save RAM: "AC", five of (score low, score high, three letters in two words), times, stick. */
const MAGIC = 0x4341
const ENTRY = 8
const TIMES = 42
const STICK = 52

export const bestScore = words(10)
export const bestName = words(15)
/** Each sortie's fastest win in frames (0xffff: none yet). */
export const bestTime = words(5)

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
    bestTime[k] = saveRead(TIMES + k * 2)
    k++
  }
  best[0] = bestScore[0]
  best[1] = bestScore[1]
  stickIs(saveRead(STICK) !== 0)
}

/** A fresh table: the five aces' own scores. */
function tableFresh(): void {
  saveWrite(0, MAGIC)
  let k: u16 = 0
  while (k < 5) {
    const at = 2 + k * ENTRY
    saveWrite(at, (5 - k) * 400)
    saveWrite(at + 2, 0)
    saveWrite(at + 4, 0x4c45)
    saveWrite(at + 6, 0x43)
    saveWrite(TIMES + k * 2, 0xffff)
    k++
  }
  saveWrite(STICK, 0)
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
  best[0] = bestScore[0]
  best[1] = bestScore[1]
}

/** A sortie won in `frames`: kept if it is the fastest. Answers whether it was. */
export function timeEnter(k: u16, frames: u16): bool {
  if (frames >= bestTime[k]) return false
  bestTime[k] = frames
  saveWrite(TIMES + k * 2, frames)
  return true
}

/** The stick turned the other way, and kept. */
export function stickToggle(): void {
  stickIs(!stickReversed)
  saveWrite(STICK, stickReversed ? 1 : 0)
}

/** The table drawn from row `y`: place, name and score. */
export function tableShow(y: u16): void {
  let k: u16 = 0
  while (k < 5) {
    const row = y + k * 2
    const s = k === 0 ? SL_AMBER : SL_WHITE
    sayChar(11, row, 49 + k, s)
    sayChar(14, row, bestName[k * 3], s)
    sayChar(15, row, bestName[k * 3 + 1], s)
    sayChar(16, row, bestName[k * 3 + 2], s)
    scoreAt(19, row, k, s)
    k++
  }
}

/** A score of the table: eight digits, its last a 0 (points are kept in tens). */
function scoreAt(x: u16, y: u16, k: u16, s: u16): void {
  const hi = bestScore[k * 2 + 1]
  const lo = bestScore[k * 2]
  if (hi > 0) {
    sayNumber(cellXY(x, y), hi, 4, s)
    zero4(x + 4, y, lo, s)
  } else sayNumber(cellXY(x + 4, y), lo, 4, s)
  sayChar(x + 8, y, 48, s)
}

function zero4(x: u16, y: u16, v: u16, s: u16): void {
  sayChar(x, y, 48 + div(v, 1000), s)
  sayChar(x + 1, y, 48 + (div(v, 100) % 10), s)
  sayChar(x + 2, y, 48 + (div(v, 10) % 10), s)
  sayChar(x + 3, y, 48 + (v % 10), s)
}
