// ELECDRILL's scenes round the play (docs/elec16-elecdrill.md section 4): the title, the pause,
// a stratum passed, the question of going on, the core reached and the tally. Kept in
// cartridge bank 1, out of RAM's room: they run seldom, and reach everything in RAM through
// far_call's return. Nothing here moves the bank window (the kit's calls put it back).
import {
  bytes,
  div,
  i16,
  peek16,
  poke16,
  str,
  type u16,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_START,
  BG1Y,
  cellAt,
  FLIP_H,
  frame_wait,
  padRead,
  pressed,
  rand,
  randSeed,
  S16,
  spr,
  vfill,
  vpoke,
} from '../lib/kit.e16'
import { soundMaster } from '../lib/sound.e16'
import { DRILLER_TILE, GROUND_TILE, PANELS_TILE, QUARTERS_TILE } from './assets.e16'
import { M_DEEP, M_GOAL, M_MAIN, M_OVER, M_RESULT, M_TITLE, music, sfxSelect } from './audio.e16'
import { fieldNew } from './field.e16'
import {
  band,
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
import { stratumShow } from './panel.e16'
import { air, capsules, cheer } from './player.e16'

/* ---------------- the title ---------------- */

/** The heap at the title's foot: 20 columns of blocks, two rows, by chance. */
const heap = bytes(40)

export function title(): void {
  music(M_TITLE)
  fieldNew()
  vfill(cellAt(1, 0, 0), PANELS_TILE, 4096)
  groundFill()
  heapDraw()
  logoIn(4, 3)
  scrollIs(0)
  tableShow(15)
  say(10, 28, str('(C) ELECXZY PROJECT'), W_WHITE)
  let t: u16 = 0
  walkX = 40
  walkFace = 0
  for (;;) {
    frameBegin()
    logoDrop(t)
    if ((t & 32) === 0) say(14, 10, str('PRESS START'), W_GOLD)
    else unsay(14, 10, 11)
    walker(t)
    if (t > 40 && pressed(B_START | B_A)) break
    t++
  }
  randSeed(frame ^ peek16(0x0202))
  sfxSelect()
  poke16(BG1Y, 0)
}

/** BG0 all ground, its two textures in a loose check. */
function groundFill(): void {
  let y: u16 = 0
  while (y < 36) {
    let x: u16 = 0
    while (x < 40) {
      vpoke(cellAt(0, x, y), GROUND_TILE + 8 + (((x >> 1) + (y >> 1)) & 1) * 9)
      x++
    }
    y++
  }
}

let walkX: u16 = 40
let walkFace: u16 = 0

/** RIVET walks the heap, stops, and drills a moment, then hops for joy before going on. */
function walker(t: u16): void {
  const phase = t % 240
  let f: u16 = 0
  if (phase < 160) {
    if ((t & 1) === 0) walkX = walkFace === 0 ? walkX + 1 : walkX - 1
    if (walkX > 280) walkFace = 1
    if (walkX < 24) walkFace = 0
    f = 2 + ((t >> 2) & 3)
  } else if (phase < 200) f = 8 + ((t >> 1) & 1)
  else if (phase < 230) f = 21 + ((t >> 4) & 1)
  spr(i16(walkX), 240, (DRILLER_TILE + f * 4) | (walkFace !== 0 ? FLIP_H : 0), S16)
}

/** The word falls in from above, and bounces as it lands. */
function logoDrop(t: u16): void {
  if (t < 30) poke16(BG1Y, (30 - t) * 3)
  else if (t < 36) poke16(BG1Y, 512 - (t - 30))
  else if (t < 42) poke16(BG1Y, 512 - (42 - t))
  else if (t === 42) poke16(BG1Y, 0)
}

/** The heap: blocks in rows 32-35 joined as in the well. */
function heapDraw(): void {
  let k: u16 = 0
  while (k < 40) {
    heap[k] = 1 + (rand() & 3)
    if (k >= 20 && (rand() & 3) !== 0) heap[k] = heap[k - 20]
    else if (k > 0 && (rand() & 1) !== 0 && k !== 20) heap[k] = heap[k - 1]
    k++
  }
  k = 0
  while (k < 40) {
    heapCell(k % 20, div(k, 20))
    k++
  }
}

function heapAt(x: u16, y: u16, c: u16): u16 {
  if (x >= 20 || y >= 2) return 0
  return heap[y * 20 + x] === c ? 1 : 0
}

function heapCell(x: u16, y: u16): void {
  const c = heap[y * 20 + x]
  const up = wrap16(y - 1)
  const left = wrap16(x - 1)
  const n = heapAt(x, up, c)
  const s = heapAt(x, y + 1, c)
  const w = heapAt(left, y, c)
  const e = heapAt(x + 1, y, c)
  const base = QUARTERS_TILE | (c << 10)
  const at = cellAt(0, x * 2, 32 + y * 2)
  vpoke(at, base + quarterOf(n, w, heapAt(left, up, c)))
  vpoke(at + 2, base + 5 + quarterOf(n, e, heapAt(x + 1, up, c)))
  vpoke(at + 128, base + 10 + quarterOf(s, w, heapAt(left, y + 1, c)))
  vpoke(at + 130, base + 15 + quarterOf(s, e, heapAt(x + 1, y + 1, c)))
}

function quarterOf(v: u16, h: u16, d: u16): u16 {
  if (v !== 0) {
    if (h !== 0) return d !== 0 ? 4 : 3
    return 1
  }
  return h !== 0 ? 2 : 0
}

/* ---------------- in play ---------------- */

/** START: everything stops until START again. */
export function pause(): void {
  band(108, 1)
  say(17, 14, str('PAUSE'), W_GOLD)
  soundMaster(4)
  // Two frames drawn, so the band is up; then nothing moves.
  idle(2)
  for (;;) {
    seenIs(frame_wait(seen))
    padRead()
    if (pressed(B_START)) break
  }
  soundMaster(15)
  unsay(17, 14, 5)
  band(0, 0)
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
import { nameEntry, tablePlace, tableShow } from './best.e16'
import {
  continues,
  frame,
  frameBegin,
  idle,
  lives,
  logoIn,
  maxChain,
  maxDepth,
  points,
  scrollIs,
  seen,
  seenIs,
  stratum,
} from './drill.e16'
