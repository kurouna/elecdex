// ELECDRILL's title and controls (docs/elec16-elecdrill.md sections 3 and 6): the word falling
// in over the heap, the difficulty chosen with left and right, how to play taking turns with
// the chosen difficulty's best five, and after START a screen of the pad's buttons beside the
// PC's keys. In cartridge bank 3: everything it calls is in RAM or another bank (the kit's
// calls put the window back), and it never moves the window.
import {
  type bool,
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
  B_LEFT,
  B_RIGHT,
  B_START,
  BG1Y,
  cellAt,
  FLIP_H,
  pressed,
  rand,
  randSeed,
  S8,
  S16,
  spr,
  vfill,
  vpoke,
} from '../lib/kit.e16'
import { DRILLER_TILE, FX_TILE, GROUND_TILE, PANELS_TILE, QUARTERS_TILE } from './assets.e16'
import { M_TITLE, music, sfxSelect } from './audio.e16'
import { levelKeep, tableRead, tableShow } from './best.e16'
import { frame, frameBegin, logoIn, scrollIs } from './drill.e16'
import { fieldNew } from './field.e16'
import { say, unsay, W_GOLD, W_WHITE } from './hud.e16'
import { LV_EASY, LV_HARD, LV_NORMAL, level, levelSet } from './level.e16'

/** Frames a page of the title (the best five, how to play) stays. */
const PAGE = 300

/** Whether the title shows how to play (else the best five). */
let helpOn = false

/** The warning sign RIVET sees over its head, at cell (x, y) of the words, blinking. */
function signAt(x: u16, y: u16): void {
  spr(i16(x * 8), i16(y * 8), (FX_TILE + 10 + ((frame >> 3) & 1)) | (6 << 10), S8)
}

/** The title until START (or A): left and right choose the difficulty, kept in save RAM. */
export function title(): void {
  music(M_TITLE)
  fieldNew()
  vfill(cellAt(1, 0, 0), PANELS_TILE, 4096)
  groundFill()
  heapDraw()
  logoIn(4, 3)
  scrollIs(0)
  levelShow()
  say(10, 29, str('(C) ELECXZY PROJECT'), W_WHITE)
  let t: u16 = 0
  let shown: u16 = 0
  walkX = 40
  walkFace = 0
  for (;;) {
    frameBegin()
    logoDrop(t)
    if ((t & 32) === 0) say(14, 10, str('PRESS START'), W_GOLD)
    else unsay(14, 10, 11)
    // The best five and how to play take turns, five seconds each; a new choice of
    // difficulty brings its best five.
    if (t === shown) {
      helpOn = (div(t, PAGE) & 1) !== 0
      pageShow(helpOn)
      shown = shown + PAGE
    }
    if (helpOn) signAt(3, 23)
    if (pressed(B_LEFT) && level > LV_EASY) levelPick(level - 1)
    if (pressed(B_RIGHT) && level < LV_HARD) levelPick(level + 1)
    walker(t)
    if (t > 40 && pressed(B_START | B_A)) break
    t++
  }
  levelKeep()
  randSeed(frame ^ peek16(0x0202))
  sfxSelect()
  poke16(BG1Y, 0)
}

/** Rows 15-27 cleared for the best five, or how to play (`help`). */
function pageShow(help: bool): void {
  rowsClear(15, 28)
  if (help) helpShow()
  else tableShow(17)
}

/** BG1's rows `from` to `to` (not included) cleared. */
function rowsClear(from: u16, to: u16): void {
  let y = from
  while (y < to) {
    unsay(0, y, 40)
    y++
  }
}

/** Difficulty `l` chosen: its row and its best five read, the choice drawn again. */
function levelPick(l: u16): void {
  helpOn = false
  levelSet(l)
  tableRead()
  levelShow()
  pageShow(false)
  sfxSelect()
}

/**
 * The three difficulties on row 12, the chosen one in gold between arrows, the others plain;
 * below, a line on what it means.
 */
function levelShow(): void {
  unsay(0, 12, 40)
  unsay(0, 13, 40)
  levelWord(LV_EASY, 10, 4, str('EASY'))
  levelWord(LV_NORMAL, 17, 6, str('NORMAL'))
  levelWord(LV_HARD, 26, 4, str('HARD'))
  if (level === LV_EASY) say(3, 13, str('MORE AIR, SLOWER FALLS, LESS ALLOY'), W_WHITE)
  else if (level === LV_HARD) say(4, 13, str('LESS AIR, QUICK FALLS, MORE ALLOY'), W_WHITE)
  else say(5, 13, str('BALANCED AIR, FALLS AND ALLOY'), W_WHITE)
}

/** One difficulty's word of `n` letters at column x, between arrows when it is the chosen one. */
function levelWord(l: u16, x: u16, n: u16, s: u16): void {
  if (l !== level) {
    say(x, 12, s, W_WHITE)
    return
  }
  say(x - 1, 12, str('>'), W_GOLD)
  say(x, 12, s, W_GOLD)
  say(x + n, 12, str('<'), W_GOLD)
}

/** How to play: the rules in a few lines. */
function helpShow(): void {
  say(14, 15, str('HOW TO PLAY'), W_GOLD)
  say(3, 17, str('DIG A BLOCK: ITS WHOLE GROUP GOES'), W_WHITE)
  say(3, 19, str('WHAT HANGS SHAKES, THEN FALLS'), W_WHITE)
  say(3, 21, str('4 OF A COLOUR AFTER A FALL: CHAIN'), W_WHITE)
  say(5, 23, str('OVER RIVET: STEP OUT FROM UNDER'), W_WHITE)
  say(3, 25, str('CAPSULES GIVE AIR, ALLOY COSTS IT'), W_WHITE)
  say(9, 27, str('REACH THE CORE AT 500 M'), W_GOLD)
}

/* ---------------- the controls ---------------- */

/**
 * After the title: the console's buttons and the PC's keys side by side (their names differ),
 * with what each does, over the title's ground. A or START goes on.
 */
export function controls(): void {
  rowsClear(0, 30)
  say(16, 2, str('CONTROLS'), W_GOLD)
  say(2, 5, str('PAD'), W_GOLD)
  say(12, 5, str('PC KEY'), W_GOLD)
  say(22, 5, str('ACTION'), W_GOLD)
  rule(6)
  control(8, str('D-PAD < >'), str('ARROW < >'), str('WALK'))
  control(10, str('A'), str('Z'), str('DIG FACING'))
  control(12, str('UP/DOWN+A'), str('UP/DOWN+Z'), str('DIG UP/DOWN'))
  control(14, str('B'), str('X'), str('DIG DOWN'))
  control(16, str('START'), str('ENTER'), str('PAUSE'))
  rule(17)
  say(2, 19, str('HOLD < OR > ON A STEP TO CLIMB IT.'), W_WHITE)
  say(2, 21, str('HOLD A OR B TO KEEP DIGGING.'), W_WHITE)
  say(2, 23, str('WHEN'), W_WHITE)
  say(9, 23, str('SHOWS, STEP OUT FROM UNDER.'), W_WHITE)
  controlsUp = 1
  let t: u16 = 0
  for (;;) {
    frameBegin()
    if ((t & 32) === 0) say(12, 27, str('PRESS A OR START'), W_GOLD)
    else unsay(12, 27, 16)
    signAt(7, 23)
    walker(t + 100)
    if (t > 10 && pressed(B_A | B_START)) break
    t++
  }
  controlsUp = 0
  sfxSelect()
  rowsClear(0, 30)
}

/** Whether the controls are on the screen (the tests read it). */
export let controlsUp: u16 = 0

/** One line: the pad's button, the PC's key, what it does. */
function control(y: u16, pad: u16, key: u16, does: u16): void {
  say(2, y, pad, W_WHITE)
  say(12, y, key, W_GOLD)
  say(22, y, does, W_WHITE)
}

/** A rule across the table. */
function rule(y: u16): void {
  let x: u16 = 2
  while (x < 38) {
    say(x, y, str('-'), W_GOLD)
    x++
  }
}

/* ---------------- the title's ground, heap and driller ---------------- */

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

/** The heap at the title's foot: 20 columns of blocks, two rows, by chance. */
const heap = bytes(40)

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
