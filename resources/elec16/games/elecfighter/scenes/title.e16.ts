// ELECFIGHTER's boot log, title and controls (docs/elec16-elecfighter-design.md 5.1, 5.4, 6.1).
// The boot log's lines come a few frames apart (START skips them). The title: the logo over the
// stage GRID (art/title.png, one map), the four slots standing on its floor in their wire alone,
// filled in one after another (their palettes only, design 2.4), PRESS START, then the menu -
// VERSUS CPU, CONTROLS, BEST. Left alone it shows HOW TO PLAY and the BEST records in turn, as
// ELECLANCE and ELECDRILL do. The controls screen is the PAD | PC KEY | ACTION table for the
// button set (SELECT switches TYPE A and TYPE B), the few things that are not one button, and
// the log line (A turns it on and off); both kept in save RAM. It shows by itself the first time
// VERSUS CPU is chosen, and from the menu and the pause after. In bank 5: rarely run.
import {
  addr,
  type bool,
  div,
  i16,
  peek16,
  str,
  type u16,
  words,
} from '../../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_DOWN,
  B_SELECT,
  B_START,
  B_UP,
  cellAt,
  FLIP_H,
  load,
  mapRow,
  number,
  palette,
  palKeep,
  palMix,
  pressed,
  S16,
  spr,
  sprBegin,
} from '../../lib/kit.e16'
import {
  FONT_TILE,
  PAL_P1,
  PAL_STAGE,
  S1_TILE,
  SHADOW_TILE,
  TITLE_H,
  TITLE_MAP_BANK,
  TITLE_TILE,
  TITLE_TILES_AT,
  TITLE_TILES_BANK,
  TITLE_TILES_BYTES,
} from '../assets.e16'
import { M_TITLE, music, sfx, X_MAT, X_MOVE, X_OK } from '../engine/audio.e16'
import { artPut, OPPONENTS, SLOTS } from '../engine/data.e16'
import {
  FRONT,
  hudClear,
  hudRows,
  hudTile,
  logOff,
  SL_DIM,
  SL_P1,
  say,
  T_RULE,
} from '../engine/draw.e16'
import { buttonSet, buttonSetIs } from '../engine/input.e16'
import { introStep, M_INTRO, palShow } from '../engine/look.e16'
import {
  frameBegin,
  pauseFrame,
  SC_BOOT,
  SC_CONTROLS,
  SC_TITLE,
  screenClear,
  screenIs,
} from '../engine/main.e16'
import { bestDraw, bestRun, controlsSeen, controlsSeenSet, saveKeep } from './result.e16'

/** Four art rows (34 words each) of figures a screen draws itself: the title's, the select's. */
export const fig = words(136)
/** Each title figure's first tile, and the step of its drawing-in it shows. */
const figTile = words(4)
const figStep = words(4)

const SL_FX = 10
/** The title's figures: where their feet are, which way they face, when each starts filling. */
const FEET_Y = 244
const FIG_FROM = 20
const FIG_EVERY = 24
/** A page of the title left alone (the figures, HOW TO PLAY, the figures, BEST), in frames. */
const PAGE = 360
const TITLE_ROW = 13
const LINE_F = 9

/* ---------------- the boot log ---------------- */

/** The machine's log as the cartridge starts, a line at a time; START or A goes on at once. */
export function bootLog(): void {
  screenIs(SC_BOOT)
  screenClear()
  say(2, 3, str('ELEC-16 PLAY  ELECFIGHTER'), SL_P1)
  say(2, 4, str('INDUSTRIAL COMBAT SIMULATOR'), SL_DIM)
  let t: u16 = 0
  while (t < 7 * LINE_F + 40) {
    frameBegin()
    if (pressed(B_START) || pressed(B_A)) return
    const k = div(t, LINE_F)
    if (t === k * LINE_F && k < 7) bootLine(k)
    t++
  }
}

function bootLine(k: u16): void {
  const y = 7 + k
  if (k === 0) say(2, y, str('> LOADING FIGHTER DATA ........ OK'), SL_P1)
  else if (k === 1) bootCount(y, str('> MESH CELLS,   SLOTS ......... OK'), 16, SLOTS)
  else if (k === 2) bootCount(y, str('> OPPONENT PROGRAMS,   ........ OK'), 22, OPPONENTS)
  else if (k === 3) say(2, y, str('> STAGE GRID .................. OK'), SL_P1)
  else if (k === 4) say(2, y, str('> SOUND ....................... OK'), SL_P1)
  else if (k === 5) say(2, y, str('> RECORDS ..................... OK'), SL_P1)
  else say(2, y + 1, str('> SIMULATOR READY'), SL_P1)
}

/** A boot line with a count from the registries (engine/data.e16.ts) written at column `x`. */
function bootCount(y: u16, s: u16, x: u16, n: u16): void {
  say(2, y, s, SL_P1)
  number(cellAt(1, x, y), n, 1, (FONT_TILE + 16) | (SL_P1 << 10) | FRONT)
}

/* ---------------- the title ---------------- */

/** The title and its menu until VERSUS CPU is chosen (the controls the first time). */
export function titleRun(): void {
  for (;;) {
    const pick = titleOnce()
    if (pick === 0) {
      if (!controlsSeen()) {
        controlsRun(false)
        controlsSeenSet()
      }
      return
    }
    if (pick === 1) controlsRun(false)
    else bestRun()
  }
}

/** The title drawn afresh and run until the menu's choice: 0 VERSUS CPU, 1 CONTROLS, 2 BEST. */
function titleOnce(): u16 {
  titleDraw()
  let t: u16 = 0
  let ft: u16 = 0
  let page: u16 = 0
  menuOn = false
  for (;;) {
    frameBegin()
    if (pressed(B_SELECT)) {
      typeSwitch()
      t = 0
    }
    const pick = menuKeys()
    if (pick !== NO_PICK) return pick
    if (menuOn) t = 0
    const p = div(t, PAGE) & 3
    if (p !== page) {
      page = p
      pageShow(p)
      if (menuOn) menuShow(menuAt)
    }
    figuresStep(ft, p === 0 || p === 2, menuOn)
    t++
    ft++
  }
}

/** The menu: up, its place; nothing chosen yet. */
let menuOn = false
let menuAt: u16 = 0
const NO_PICK = 0xffff

/** START or A brings the menu, B puts it away; in it, START or A chooses. */
function menuKeys(): u16 {
  const go = pressed(B_START) || pressed(B_A)
  if (!menuOn) {
    if (!go) return NO_PICK
    menuOn = true
    menuAt = 0
    sfx(X_OK)
    menuShow(0)
    return NO_PICK
  }
  if (pressed(B_B)) {
    menuOn = false
    hudRows(TITLE_ROW, 3)
    return NO_PICK
  }
  if (go) {
    sfx(X_OK)
    return menuAt
  }
  menuAt = titleMenuMove(menuAt)
  return NO_PICK
}

/** SELECT on the title: the other button set, kept. */
function typeSwitch(): void {
  buttonSetIs(1 - buttonSet)
  saveKeep()
  typeShow()
  sfx(X_MOVE)
}

/** The logo and the stage on BG0, the four figures in their wire, the words. */
function titleDraw(): void {
  screenIs(SC_TITLE)
  screenClear()
  music(M_TITLE)
  palette(PAL_STAGE, 0)
  palKeep(PAL_STAGE, 0)
  load(TITLE_TILES_BANK, TITLE_TILES_AT, TITLE_TILE * 32, TITLE_TILES_BYTES)
  let y: u16 = 0
  while (y < TITLE_H) {
    mapRow(TITLE_MAP_BANK, 0xc000 + y * 128, 0, y)
    y++
  }
  let tile = S1_TILE
  let s: u16 = 0
  while (s < 4) {
    artPut(s, 0, addr(fig) + s * 68, tile)
    figTile[s] = tile
    tile = tile + fig[s * 34 + 1] * 4
    palette(PAL_P1, 11 + s)
    palKeep(PAL_P1, 11 + s)
    palShow(11 + s, M_INTRO, 0)
    figStep[s] = 0
    s++
  }
  typeShow()
  say(10, 34, str('(C) ELECXZY PROJECT'), SL_DIM)
}

/** The button set on the title's foot: SELECT switches it here too. */
function typeShow(): void {
  say(
    8,
    33,
    buttonSet === 0 ? str('SELECT  TYPE A (PAD)    ') : str('SELECT  TYPE B (PC KEYS)'),
    SL_P1,
  )
}

/** Page `p` of the title left alone: the figures (0, 2), HOW TO PLAY (1), BEST (3). */
function pageShow(p: u16): void {
  hudRows(TITLE_ROW, 19)
  const shown = p === 0 || p === 2
  palMix(0, 0, shown ? 0 : 10)
  if (p === 1) howTo()
  else if (p === 3) bestDraw(TITLE_ROW)
}

/**
 * The figures: drawn in one after another from their wire, standing on the floor two and two
 * facing, while their page shows. PRESS START blinks above them until the menu comes.
 */
function figuresStep(t: u16, shown: bool, menu: bool): void {
  sprBegin()
  if (!shown) return
  if (!menu) {
    if ((t & 32) === 0) say(14, TITLE_ROW, str('PRESS START'), SL_P1)
    else hudRows(TITLE_ROW, 1)
  }
  let s: u16 = 0
  while (s < 4) {
    const from = FIG_FROM + s * FIG_EVERY
    const step = t < from ? 0 : introStep(t - from)
    if (t === from) sfx(X_MAT)
    if (step !== figStep[s]) {
      figStep[s] = step
      palShow(11 + s, M_INTRO, step)
    }
    const x = i16(52 + s * 72)
    figure(x, FEET_Y, addr(fig) + s * 68, figWord(figTile[s], 11 + s, s < 2))
    shadowAt(x, FEET_Y)
    s++
  }
}

/** The menu's three choices, the cursor at `at`. */
function menuShow(at: u16): void {
  hudRows(TITLE_ROW, 3)
  say(15, TITLE_ROW, str('VERSUS CPU'), SL_P1)
  say(15, TITLE_ROW + 1, str('CONTROLS'), SL_P1)
  say(15, TITLE_ROW + 2, str('BEST'), SL_P1)
  say(13, TITLE_ROW + at, str('>'), SL_P1)
}

function titleMenuMove(at: u16): u16 {
  let n = at
  if (pressed(B_UP)) n = n === 0 ? 2 : n - 1
  if (pressed(B_DOWN)) n = n === 2 ? 0 : n + 1
  if (n !== at) {
    sfx(X_MOVE)
    menuShow(n)
  }
  return n
}

/** HOW TO PLAY: the fight in a few lines. */
function howTo(): void {
  say(14, TITLE_ROW, str('HOW TO PLAY'), SL_P1)
  say(2, 15, str('BEAT FOUR PROGRAMS, TWO ROUNDS EACH.'), SL_P1)
  say(2, 17, str('HOLD BACK TO GUARD: CROUCH FOR LOWS,'), SL_P1)
  say(2, 18, str('STAND FOR JUMP-INS.'), SL_P1)
  say(2, 20, str('LIGHT BLOWS COME OUT FAST. HEAVY ONES'), SL_P1)
  say(2, 21, str('HURT, BUT THEY CAN BE SEEN COMING.'), SL_P1)
  say(2, 23, str('A LIGHT THAT LANDS CHAINS INTO THE'), SL_P1)
  say(2, 24, str('HEAVY OF ITS KIND.'), SL_P1)
  say(2, 26, str('CLOSE IN, < OR > + HEAVY PUNCH: THROW.'), SL_P1)
  say(2, 27, str('FORWARD TWICE: DASH.'), SL_P1)
  say(2, 29, str('READ THEM. DO NOT LET THEM READ YOU.'), SL_DIM)
}

/* ---------------- the figures the screens draw themselves ---------------- */

/** A cell's place from its packed word: across, and down (signed). */
function placeX(w: u16): i16 {
  const v = i16(w & 255)
  return v > 127 ? v - 256 : v
}

function placeY(w: u16): i16 {
  const v = i16(w >> 8)
  return v > 127 ? v - 256 : v
}

/**
 * A figure: the art row at RAM address `at` with its feet at (x, y), its cells from the sprite
 * word `t` (the first tile, the palette's field, FLIP_H to face left: `figWord`).
 */
export function figure(x: i16, y: i16, at: u16, t: u16): void {
  const n = peek16(at + 2)
  const right = (t & FLIP_H) === 0
  let c: u16 = 0
  while (c < n) {
    const w = peek16(at + 4 + c * 2)
    const dx = placeX(w)
    spr(right ? x + dx : x - dx - 16, y + placeY(w), t + c * 4, S16)
    c++
  }
}

/** The sprite word of a figure from tile `tile` in sprite palette slot `sl`, facing right or left. */
export function figWord(tile: u16, sl: u16, right: bool): u16 {
  return tile | ((sl - 8) << 10) | (right ? 0 : FLIP_H)
}

/** A figure's shadow on the floor under its feet. */
export function shadowAt(x: i16, y: i16): void {
  const t = SHADOW_TILE | ((SL_FX - 8) << 10)
  spr(x - 24, y - 4, t, S16)
  spr(x - 8, y - 4, t + 4, S16)
  spr(x + 8, y - 4, t | FLIP_H, S16)
}

/* ---------------- the controls (design 6.1) ---------------- */

/**
 * The controls until START or B: SELECT switches the button set, A the log line, both kept.
 * From the pause (`still`) nothing else goes on meanwhile.
 */
export function controlsRun(still: bool): void {
  screenIs(SC_CONTROLS)
  if (!still) screenClear()
  hudClear()
  if (!still) sprBegin()
  controlsDraw()
  for (;;) {
    if (still) pauseFrame()
    else frameBegin()
    if (pressed(B_SELECT)) {
      buttonSetIs(1 - buttonSet)
      saveKeep()
      setShow()
      sfx(X_MOVE)
    }
    if (pressed(B_A)) {
      logOff[0] = 1 - logOff[0]
      saveKeep()
      setShow()
      sfx(X_MOVE)
    }
    if (pressed(B_START) || pressed(B_B)) {
      sfx(X_OK)
      return
    }
  }
}

const COL_KEY = 13
const COL_ACT = 26

function row3(y: u16, pad: u16, key: u16, act: u16): void {
  say(2, y, pad, SL_P1)
  say(COL_KEY, y, key, SL_P1)
  say(COL_ACT, y, act, SL_P1)
}

function controlsDraw(): void {
  say(16, 2, str('CONTROLS'), SL_P1)
  row3(5, str('PAD'), str('PC KEY'), str('ACTION'))
  hudRule(6)
  row3(7, str('D-PAD < >'), str('ARROW < >'), str('WALK'))
  row3(8, str('HOLD BACK'), str('HOLD BACK'), str('GUARD'))
  row3(9, str('D-PAD DOWN'), str('ARROW DOWN'), str('CROUCH'))
  row3(10, str('D-PAD UP'), str('ARROW UP'), str('JUMP'))
  row3(12, str('Y'), str('A'), str('LIGHT PUNCH'))
  row3(13, str('X'), str('S'), str('HEAVY PUNCH'))
  row3(14, str('B'), str('X'), str(''))
  row3(15, str('A'), str('Z'), str(''))
  row3(17, str('START'), str('ENTER'), str('PAUSE'))
  row3(18, str('SELECT'), str('RIGHT SHIFT'), str('BUTTON TYPE'))
  row3(19, str('L  R'), str('Q  W'), str('NOT USED'))
  hudRule(21)
  say(2, 22, str('THROW     NEAR, < OR > + HEAVY PUNCH'), SL_P1)
  say(2, 23, str('ANTI-AIR  DOWN + HEAVY PUNCH'), SL_P1)
  say(2, 24, str('LOW GUARD HOLD BACK + DOWN'), SL_P1)
  say(2, 25, str('DASH      > > OR < <'), SL_P1)
  say(2, 26, str('CHAIN     A LIGHT THAT LANDS + HEAVY'), SL_P1)
  say(2, 29, str('SELECT: BUTTON TYPE'), SL_DIM)
  say(2, 30, str('A: LOG LINE'), SL_DIM)
  say(12, 33, str('START OR B: BACK'), SL_DIM)
  setShow()
}

/** A ruled line across BG1's row `y`, from column 2 to 37. */
function hudRule(y: u16): void {
  let x: u16 = 2
  while (x < 38) {
    hudTile(x, y, T_RULE, SL_DIM)
    x++
  }
}

/** The set's name and what B and A do in it (design 6.1: TYPE B swaps the kicks); the log's state. */
function setShow(): void {
  if (buttonSet === 0) {
    say(22, 29, str('TYPE A  PAD    '), SL_P1)
    say(COL_ACT, 14, str('LIGHT KICK'), SL_P1)
    say(COL_ACT, 15, str('HEAVY KICK'), SL_P1)
  } else {
    say(22, 29, str('TYPE B  PC KEYS'), SL_P1)
    say(COL_ACT, 14, str('HEAVY KICK'), SL_P1)
    say(COL_ACT, 15, str('LIGHT KICK'), SL_P1)
  }
  say(22, 30, logOff[0] !== 0 ? str('LOG OFF') : str('LOG ON '), SL_P1)
}
