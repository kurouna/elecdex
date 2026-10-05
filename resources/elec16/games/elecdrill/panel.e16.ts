// ELECDRILL's panels (docs/elec16-elecdrill.md section 2): the depth in big digits, the
// stratum, the score and the best on the left with the depth gauge; AIR's tank and its figure,
// the drillers left, the chain, the capsules and the difficulty on the right. Each reading is drawn only when
// it changes. In cartridge bank 2: it moves no window, and its words are its own.
import { addr, div, str, type u16 } from '../../../../src/shared/e16c/builtins'
import { cellAt, scoreShow, vpoke } from '../lib/kit.e16'
import { DIGITS_TILE, FONT_TILE, ICONS_TILE, TANK_TILE } from './assets.e16'
import { SL_PANEL } from './field.e16'
import { best, figure, glyph, say, score, unsay, W_GOLD, W_RED, W_WHITE } from './hud.e16'
import { LV_EASY, LV_HARD, level } from './level.e16'

let shownDepth: u16 = 0xffff
let shownAir: u16 = 0xffff
let shownLives: u16 = 0xffff
let shownChain: u16 = 0xffff
let shownCaps: u16 = 0xffff
let shownScore: u16 = 0xffff
let shownBest: u16 = 0xffff
let shownStratum: u16 = 0xffff
let shownLow: u16 = 0xffff

/** The labels, once a game, and every reading drawn afresh. */
export function hudLabels(): void {
  say(1, 1, str('DEPTH'), W_GOLD)
  say(1, 6, str('STRATUM'), W_GOLD)
  say(1, 9, str('SCORE'), W_GOLD)
  say(1, 12, str('BEST'), W_GOLD)
  say(6, 16, str('0'), W_WHITE)
  say(6, 19, str('100'), W_WHITE)
  say(6, 22, str('200'), W_WHITE)
  say(6, 25, str('300'), W_WHITE)
  say(6, 28, str('400'), W_WHITE)
  say(6, 31, str('500'), W_GOLD)
  say(30, 1, str('AIR'), W_GOLD)
  say(31, 20, str('DRILLERS'), W_GOLD)
  say(31, 23, str('CHAIN'), W_GOLD)
  say(31, 26, str('CAPSULES'), W_GOLD)
  say(31, 29, str('LEVEL'), W_GOLD)
  say(
    31,
    30,
    level === LV_EASY ? str('EASY') : level === LV_HARD ? str('HARD') : str('NORMAL'),
    W_WHITE,
  )
  shownDepth = 0xffff
  shownAir = 0xffff
  shownLives = 0xffff
  shownChain = 0xffff
  shownCaps = 0xffff
  shownScore = 0xffff
  shownBest = 0xffff
  shownStratum = 0xffff
  shownLow = 0xffff
}

/** The readings that changed. */
export function hudStep(depth: u16, air: u16, lives: u16, frame: u16): void {
  if (depth !== shownDepth) {
    shownDepth = depth
    bigDepth(depth)
    gauge(depth)
  }
  airShow(air, frame)
  if (lives !== shownLives) {
    shownLives = lives
    let k: u16 = 0
    while (k < 8) {
      vpoke(cellAt(1, 31 + k, 21), (ICONS_TILE + (k < lives ? 0 : 1)) | (SL_PANEL << 10) | 0x8000)
      k++
    }
  }
  scoreLine()
}

/** AIR's tank and figure; at 25 and under the figure blinks red and white. */
function airShow(air: u16, frame: u16): void {
  const low: u16 = air <= 25 && (frame & 16) !== 0 ? 1 : 0
  if (air === shownAir && low === shownLow) return
  shownAir = air
  shownLow = low
  tank(air)
  const warn = air <= 25
  figure(cellAt(1, 32, 18), air, 3, warn && low === 0 ? W_RED : W_WHITE)
  vpoke(cellAt(1, 36, 18), glyph(37, warn ? W_RED : W_WHITE))
}

/** The best chain and the capsules caught, when they change. */
export function hudCounts(chain: u16, caps: u16): void {
  if (chain !== shownChain) {
    shownChain = chain
    figure(cellAt(1, 31, 24), chain, 4, W_GOLD)
  }
  if (caps !== shownCaps) {
    shownCaps = caps
    figure(cellAt(1, 31, 27), caps, 4, W_WHITE)
  }
}

/** The score and the best (eight digits each). */
function scoreLine(): void {
  const key = score[0] ^ (score[1] << 3)
  if (key !== shownScore) {
    shownScore = key
    scoreShow(cellAt(1, 1, 10), addr(score), (FONT_TILE + 16) | (W_WHITE << 10) | 0x8000)
  }
  const bkey = best[0] ^ (best[1] << 3)
  if (bkey !== shownBest) {
    shownBest = bkey
    scoreShow(cellAt(1, 1, 13), addr(best), (FONT_TILE + 16) | (W_GOLD << 10) | 0x8000)
  }
}

/** The stratum's name in its well. */
export function stratumShow(s: u16): void {
  if (s === shownStratum) return
  shownStratum = s
  unsay(1, 7, 8)
  if (s < 5) vpoke(cellAt(1, 1, 7), glyph(49 + s, W_GOLD))
  let name = str('LOAM')
  if (s === 1) name = str('CLAY')
  else if (s === 2) name = str('SLATE')
  else if (s === 3) name = str('MAGMA')
  else if (s === 4) name = str('GEODE')
  else if (s >= 5) name = str('CORE')
  say(3, 7, name, W_WHITE)
}

/** The depth in metres: three big digits (two cells by three) and an M. */
function bigDepth(depth: u16): void {
  let v = depth
  let k: u16 = 0
  while (k < 3) {
    bigDigit(5 - k * 2, v % 10)
    v = div(v, 10)
    k++
  }
  vpoke(cellAt(1, 7, 4), glyph(77, W_WHITE))
}

function bigDigit(x: u16, d: u16): void {
  const t = DIGITS_TILE + d * 6
  let k: u16 = 0
  while (k < 6) {
    vpoke(cellAt(1, x + (k & 1), 2 + (k >> 1)), (t + k) | (SL_PANEL << 10) | 0x8000)
    k++
  }
}

/** The depth gauge: lit above the marker, the marker, dark glass below. */
function gauge(depth: u16): void {
  let at = div(depth * 3, 100)
  if (at > 14) at = 14
  let k: u16 = 0
  while (k < 15) {
    const t: u16 = k < at ? 4 : k === at ? 2 : 3
    vpoke(cellAt(1, 4, 16 + k), (ICONS_TILE + t) | (SL_PANEL << 10) | 0x8000)
    k++
  }
}

/** AIR's tank: 14 cells of glass, 112 points of air at 100. */
function tank(air: u16): void {
  const level = div(air * 112, 100)
  let k: u16 = 0
  while (k < 14) {
    const bottom = k * 8
    let f: u16 = 0
    if (level >= bottom + 8) f = 8
    else if (level > bottom) f = level - bottom
    const y = 16 - k
    vpoke(cellAt(1, 34, y), (TANK_TILE + f * 2) | (SL_PANEL << 10) | 0x8000)
    vpoke(cellAt(1, 35, y), (TANK_TILE + f * 2 + 1) | (SL_PANEL << 10) | 0x8000)
    k++
  }
}
