// ELECLANCE's points (docs/elec16-eleclance.md section 4): the score (kept in tens, shown with a
// last 0), CHAIN and its multiplier, SKIM, stars, extra ships, the panels' readings and the
// best five scores in the cartridge's save RAM.
import {
  addr,
  type bool,
  div,
  type i16,
  str,
  type u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import { cellAt, number, scoreAdd, scoreMore, scoreShow, vpoke } from '../lib/kit.e16'
import { FONT_TILE } from './assets.e16'
import { floatNumber } from './fx.e16'
import { SL_GOLD, SL_RED, SL_TEXT, say, unsay } from './view.e16'

/** The score and the best, two words each (tens). */
export const score = words(2)
export const best = words(2)
export let chain: u16 = 0
let chainLeft: u16 = 0
export let maxChain: u16 = 0
export let skims: u16 = 0
let nextExtend: u16 = 5000

/** The multiplier CHAIN gives: 1, then one more for every eight in the chain, to 8. */
export function multiplier(): u16 {
  const m = 1 + (chain >> 3)
  return m > 8 ? 8 : m
}

export function scoreNew(): void {
  score[0] = 0
  score[1] = 0
  chain = 0
  chainLeft = 0
  maxChain = 0
  skims = 0
  nextExtend = 5000
  shown = 0xffff
}

/** `tens` points (any number: added a piece at a time). */
export function points(tens: u16): void {
  let left = tens
  while (left > 0) {
    const n = left > 9000 ? 9000 : left
    scoreAdd(addr(score), n)
    left = left - n
  }
  if (scoreMore(addr(score), addr(best))) {
    best[0] = score[0]
    best[1] = score[1]
  }
}

/** Answers whether the score has just passed an extra ship's mark (50,000, then 150,000). */
export function extendDue(): bool {
  if (nextExtend === 0) return false
  // In tens: 5,000 (hi 0) and 15,000 (hi 1, lo 5,000) - both at a low word of 5,000.
  const hi: u16 = nextExtend === 5000 ? 0 : 1
  if (score[1] < hi || (score[1] === hi && score[0] < 5000)) return false
  nextExtend = nextExtend === 5000 ? 15000 : 0
  return true
}

/** Kills this frame: the chain goes on and the points are multiplied. */
export function scoreKills(n: u16, worth: u16, x: i16, y: i16): void {
  if (n === 0) return
  chain = chain + n
  chainLeft = 60
  if (chain > maxChain) maxChain = chain
  points(worth * multiplier())
  if (chain >= 4) floatNumber(x, y - 192, chain)
}

/** A frame passes: the chain's gauge drains; empty, the chain is gone. */
export function chainStep(): void {
  if (chainLeft === 0) return
  chainLeft--
  if (chainLeft === 0) chain = 0
}

export function scoreSkims(n: u16): void {
  skims = skims + n
  points(n)
}

export function scoreStars(n: u16, double: bool): void {
  points(n * (double ? 20 : 10))
}

/* ---------------- the panels' readings ---------------- */

let shown: u16 = 0xffff
let shownChain: u16 = 0xffff
let shownSkims: u16 = 0xffff
let shownLives: u16 = 0xffff
let shownBombs: u16 = 0xffff
let shownVolt: u16 = 0xffff

export const DIGITS = 48 - 32

/** The labels, once a game. */
export function hudLabels(): void {
  say(6, 0, str('1UP'), SL_RED)
  say(21, 0, str('HI'), SL_GOLD)
  say(1, 2, str('CHAIN'), SL_TEXT)
  say(1, 6, str('MULT'), SL_TEXT)
  say(1, 11, str('SKIM'), SL_TEXT)
  say(35, 2, str('SHIP'), SL_TEXT)
  say(35, 7, str('BOMB'), SL_TEXT)
  say(35, 12, str('VOLT'), SL_TEXT)
  shownChain = 0xffff
  shownSkims = 0xffff
  shownLives = 0xffff
  shownBombs = 0xffff
  shownVolt = 0xffff
}

/** The readings that changed since they were last drawn. */
export function hudStep(lives: u16, bombs: u16, volt: u16, over: u16): void {
  scoreLine()
  chainShow()
  if (lives !== shownLives) {
    shownLives = lives
    icons(35, 3, lives, 10)
  }
  if (bombs !== shownBombs) {
    shownBombs = bombs
    icons(35, 8, bombs, 34)
  }
  voltShow(volt, over)
}

/** The score and the best along the top, each with its last 0. */
function scoreLine(): void {
  const key = score[0] ^ (score[1] << 3)
  if (key === shown) return
  shown = key
  const gold = font(SL_GOLD)
  scoreShow(cellAt(1, 10, 0), addr(score), gold + DIGITS)
  vpoke(cellAt(1, 18, 0), gold + DIGITS)
  scoreShow(cellAt(1, 24, 0), addr(best), font(SL_TEXT) + DIGITS)
  vpoke(cellAt(1, 32, 0), font(SL_TEXT) + DIGITS)
}

/** CHAIN, its multiplier, and SKIM on the left panel. */
function chainShow(): void {
  const gold = font(SL_GOLD)
  if (chain !== shownChain) {
    shownChain = chain
    number(cellAt(1, 1, 3), chain, 4, gold + DIGITS)
    vpoke(cellAt(1, 1, 7), gold + 88 - 32)
    number(cellAt(1, 2, 7), multiplier(), 1, gold + DIGITS)
  }
  if (skims !== shownSkims) {
    shownSkims = skims
    number(cellAt(1, 1, 12), skims, 4, font(SL_TEXT) + DIGITS)
  }
}

/** Up to five icons (a font character) at (x, y), the rest blank. */
function icons(x: u16, y: u16, n: u16, ch: u16): void {
  let k: u16 = 0
  while (k < 5) {
    if (k < n) vpoke(cellAt(1, x + k, y), font(SL_GOLD) + ch)
    else unsay(x + k, y, 1)
    k++
  }
}

/** VOLT as five cells filling; full, READY; in OVERDRIVE, the time left draining, DRIVE. */
function voltShow(volt: u16, over: u16): void {
  const v = over > 0 ? div(over, 96) * 205 : volt
  const full = volt >= 1024 && over === 0
  // Drawn when it changes; the word only as it comes or goes.
  if (v === shownVolt) return
  shownVolt = v
  voltCells(v, full ? SL_GOLD : over > 0 ? SL_RED : SL_TEXT)
  if (over > 0) say(35, 14, str('DRIVE'), SL_RED)
  else if (full) say(35, 14, str('READY'), SL_GOLD)
  else unsay(35, 14, 5)
}

/** Five cells: full (#), half (:) or empty (.), in slot `s`. */
function voltCells(v: u16, s: u16): void {
  let k: u16 = 0
  while (k < 5) {
    const fill = v > (k + 1) * 205 ? 3 : v > k * 205 + 100 ? 26 : 14
    vpoke(cellAt(1, 35 + k, 13), font(s) + fill)
    k++
  }
}

/** The font's first tile in slot `s`, in front of the sprites. */
export function font(s: u16): u16 {
  return FONT_TILE | (s << 10) | 0x8000
}
