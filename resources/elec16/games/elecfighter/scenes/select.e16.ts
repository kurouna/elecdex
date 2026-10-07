// ELECFIGHTER's fighter select and versus (docs/elec16-elecfighter-design.md 5.4, 5.5, 7.10.5,
// 7.11). The select: the four slots' busts across the top (the same model drawn nearer, 64 x 64
// background tiles, each in a background palette of its own so the one chosen is lit and the
// others dim), the one under the cursor standing below in full, drawn in from its wire, its
// role in a few words and four bars of five - POWER, SPEED, REACH, DEFENSE - worked out from its
// tables, never written per slot. A confirms (its win pose; chance seeded from the clock and the
// cycle counter as the match begins), B goes back. The versus: both fighters "downloaded" -
// RENDER to 100%, then their fill - and the opponent's program with three lines on its style,
// never its habit. In bank 6: rarely run.
import {
  addr,
  type bool,
  csrr,
  div,
  peek,
  str,
  type u16,
  words,
  wrap16,
} from '../../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_LEFT,
  B_RIGHT,
  B_START,
  cellAt,
  load,
  number,
  palette,
  palKeep,
  palMix,
  pressed,
  randSeed,
  sprBegin,
  vpoke,
} from '../../lib/kit.e16'
import {
  BUST_CELLS_AT,
  BUST_CELLS_BANK,
  BUSTS_AT,
  BUSTS_BANK,
  BUSTS_BYTES,
  BUSTS_TILE,
  FONT_TILE,
  HUD_TILE,
  PAL_P1,
  S1_TILE,
} from '../assets.e16'
import { M_SELECT, music, sfx, X_MAT, X_MOVE, X_OK } from '../engine/audio.e16'
import {
  artPut,
  fighterLoad,
  M_DAMAGE,
  mvAt,
  oppName,
  P_LIFE,
  P_WALK_F,
  P_WEIGHT,
  prAt,
  reach,
  SLOTS,
  slName,
  tableWord,
} from '../engine/data.e16'
import {
  bigSay,
  FRONT,
  hudRows,
  hudTile,
  SL_BIG,
  SL_DIM,
  SL_P1,
  say,
  T_BAR,
  T_RULE,
} from '../engine/draw.e16'
import { fSlot } from '../engine/fighter.e16'
import { introStep, M_INTRO, palShow } from '../engine/look.e16'
import {
  frameBegin,
  palettesIn,
  SC_SELECT,
  SC_VERSUS,
  screenClear,
  screenIs,
} from '../engine/main.e16'
import { choice } from './match.e16'
import { fig, figure, figWord, shadowAt } from './title.e16'

/** The bars of the slot under the cursor, 1-5: POWER, SPEED, REACH, DEFENSE (tests read them). */
export const bars = words(4)
/** The busts' table (art/busts.txt): 64 words a slot. */
const BUST_CELLS = 64
const BUST_ROW = 4
const NAME_ROW = 12
const PANEL_X = 19
const BAR_X = 29
const SEL_FEET = 244
const BODY_X = 72
const WIN_F = 48
/** The busts' background slots, 4 to 7; a bust not chosen is mixed this far to black. */
const BUST_SL = 4
const BUST_DIM = 9

/* ---------------- the select (design 5.5) ---------------- */

/** The select until A (true: the match goes on with `choice[0]`) or B (false: the title). */
export function selectRun(): bool {
  screenIs(SC_SELECT)
  screenClear()
  music(M_SELECT)
  load(BUSTS_BANK, BUSTS_AT, BUSTS_TILE * 32, BUSTS_BYTES)
  say(1, 1, str('SELECT FIGHTER'), SL_P1)
  say(33, 1, str('VS CPU'), SL_DIM)
  let s: u16 = 0
  while (s < SLOTS) {
    bustDraw(s)
    s++
  }
  say(4, 34, str('< > CHOOSE     A OK     B BACK'), SL_DIM)
  let at = choice[0] & 3
  hover(at)
  let t: u16 = 0
  for (;;) {
    frameBegin()
    if (pressed(B_B)) {
      palettesIn()
      return false
    }
    if (pressed(B_A) || pressed(B_START)) {
      confirm(at)
      return true
    }
    const n = cursorMove(at)
    if (n !== at) {
      at = n
      t = 0
    }
    bodyStep(t)
    t++
  }
}

/** Left and right move the cursor round the slots; the new one hovered. */
function cursorMove(at: u16): u16 {
  let n = at
  if (pressed(B_LEFT)) n = at === 0 ? SLOTS - 1 : at - 1
  if (pressed(B_RIGHT)) n = at === SLOTS - 1 ? 0 : at + 1
  if (n !== at) {
    hover(n)
    sfx(X_MOVE)
  }
  return n
}

/** Bust `s` on BG0 from its table, in its own background slot. */
function bustDraw(s: u16): void {
  const sl = BUST_SL + s
  palette(PAL_P1, sl)
  palKeep(PAL_P1, sl)
  const x0 = 1 + s * 10
  let k: u16 = 0
  while (k < BUST_CELLS) {
    const t = tableWord(BUST_CELLS_BANK, BUST_CELLS_AT, s * BUST_CELLS + k)
    vpoke(cellAt(0, x0 + (k & 7), BUST_ROW + (k >> 3)), (BUSTS_TILE + t) | (sl << 10))
    k++
  }
}

/**
 * Slot `s` under the cursor: its bust lit and the others dim, a rule over it, its name bright;
 * the panel's words and bars; its body loaded to be drawn in.
 */
function hover(s: u16): void {
  hudRows(3, 1)
  hudRows(NAME_ROW, 2)
  let k: u16 = 0
  while (k < SLOTS) {
    const x0 = 1 + k * 10
    palMix(BUST_SL + k, 0, k === s ? 0 : BUST_DIM)
    nameAt(x0, slName[k], k === s ? SL_P1 : SL_DIM)
    k++
  }
  let x: u16 = 1 + s * 10
  while (x < 9 + s * 10) {
    hudTile(x, 3, T_RULE, SL_P1)
    x++
  }
  say(7 + s * 10, 3, str('P1'), SL_P1)
  panel(s)
  artPut(s, 0, addr(fig), S1_TILE)
  palShow(8, M_INTRO, 0)
  sfx(X_MAT)
}

/** A slot's name under its bust: its number, and its role on the row below. */
function nameAt(x: u16, s: u16, sl: u16): void {
  let y = NAME_ROW
  let at = cellAt(1, x, y)
  let k: u16 = 0
  let c = peek(s)
  while (c !== 0) {
    if (c === 32) {
      y++
      at = cellAt(1, x, y)
    } else {
      vpoke(at, (FONT_TILE + c - 32) | (sl << 10) | FRONT)
      at = wrap16(at + 2)
    }
    k++
    c = peek(s + k)
  }
}

/** The panel: the slot's name, its words, its four bars. */
function panel(s: u16): void {
  hudRows(16, 15)
  let x: u16 = PANEL_X - 1
  while (x < 39) {
    hudTile(x, 16, T_RULE, SL_DIM)
    x++
  }
  say(PANEL_X, 17, slName[s], SL_P1)
  say(36, 17, str('P1'), SL_DIM)
  slotWords(s)
  barsOf(s)
  barRow(22, str('POWER'), bars[0])
  barRow(24, str('SPEED'), bars[1])
  barRow(26, str('REACH'), bars[2])
  barRow(28, str('DEFENSE'), bars[3])
}

/** Each slot's words: a line each, by the registry's order (engine/data.e16.ts). */
function slotWords(s: u16): void {
  if (s === 0) {
    say(PANEL_X, 19, str('EVEN IN EVERYTHING.'), SL_P1)
    say(PANEL_X, 20, str('THE STANDARD BODY.'), SL_P1)
  } else if (s === 1) {
    say(PANEL_X, 19, str('SMALL AND QUICK,'), SL_P1)
    say(PANEL_X, 20, str('SHORT IN REACH.'), SL_P1)
  } else if (s === 2) {
    say(PANEL_X, 19, str('BROAD AND HEAVY,'), SL_P1)
    say(PANEL_X, 20, str('HARD TO MOVE.'), SL_P1)
  } else {
    say(PANEL_X, 19, str('TALL, LONG LIMBS,'), SL_P1)
    say(PANEL_X, 20, str('A KICK FROM AFAR.'), SL_P1)
  }
}

/** A level of 1 to 5: 1 up to `lo`, then one more for every `step`. */
function level(v: u16, lo: u16, step: u16): u16 {
  if (v <= lo) return 1
  const n = 1 + div(v - lo, step)
  return n > 5 ? 5 : n
}

/**
 * The four bars from the slot's tables (design 3.1): POWER the heavies' damage together, SPEED
 * the walk forward, REACH how far the standing heavy kick strikes, DEFENSE life and weight.
 */
function barsOf(s: u16): void {
  fighterLoad(0, s)
  const heavy =
    mvAt(0, 1, M_DAMAGE) + mvAt(0, 3, M_DAMAGE) + mvAt(0, 5, M_DAMAGE) + mvAt(0, 7, M_DAMAGE)
  bars[0] = level(heavy, 44, 6)
  bars[1] = level(prAt(0, P_WALK_F), 15, 2)
  bars[2] = level(reach[3], 36, 2)
  bars[3] = level(prAt(0, P_LIFE) + prAt(0, P_WEIGHT), 200, 10)
}

/** A bar: its word, then five segments, `n` of them lit. */
function barRow(y: u16, s: u16, n: u16): void {
  say(PANEL_X, y, s, SL_DIM)
  let k: u16 = 0
  while (k < 5) {
    const lit = k < n
    hudTile(BAR_X + k * 2, y, T_BAR + (lit ? 80 : 0), lit ? SL_P1 : SL_DIM)
    k++
  }
}

/** The body under the cursor: drawn in from its wire, standing on its shadow. */
function bodyStep(t: u16): void {
  palShow(8, M_INTRO, introStep(t))
  sprBegin()
  figure(BODY_X, SEL_FEET, addr(fig), figWord(S1_TILE, 8, true))
  shadowAt(BODY_X, SEL_FEET)
}

/** A slot chosen: its win pose a moment, chance seeded as the match begins. */
function confirm(s: u16): void {
  sfx(X_OK)
  choice[0] = s
  seedFromClock()
  artPut(s, WIN_ROW, addr(fig), S1_TILE)
  palShow(8, M_INTRO, 6)
  let t: u16 = 0
  while (t < WIN_F) {
    frameBegin()
    sprBegin()
    figure(BODY_X, SEL_FEET, addr(fig), figWord(S1_TILE, 8, true))
    shadowAt(BODY_X, SEL_FEET)
    t++
  }
  palettesIn()
}

/** The win pose's row in a slot's art (poses.txt row 59, engine/fighter.e16.ts PO_WIN). */
const WIN_ROW = 59
/** The machine's clock (seconds, minutes, hours, day, month, year, weekday): FF38-FF3E. */
const CLOCK = 0xff38
const CSR_CYCLE = 0xc00

/**
 * Chance seeded as the match begins (design 7.11): the clock the page gives, which reads to
 * the second, mixed with the cycle counter at the moment the choice was pressed.
 */
function seedFromClock(): void {
  let h: u16 = 0x2b1d
  let k: u16 = 0
  while (k < 7) {
    h = wrap16((h ^ peek(CLOCK + k)) * 31 + 7)
    k++
  }
  randSeed(h ^ csrr(CSR_CYCLE))
}

/* ---------------- the versus (design 5.4) ---------------- */

const VERSUS_F = 60
/** The stage behind the versus's words, this far to black. */
const VERSUS_DIM = 7
const RENDER_ROW = 31
const P1_X = 88
const P2_X = 232

/**
 * Who comes: the two fighters downloaded and drawn in, the program's name and three lines on
 * its style, about 60 frames once rendered (START or A goes on).
 */
export function versusRun(k: u16): void {
  screenIs(SC_VERSUS)
  artPut(fSlot[0], 0, addr(fig), S1_TILE)
  artPut(fSlot[1], 0, addr(fig) + 68, S1_TILE + 128)
  say(2, 2, str('P1'), SL_DIM)
  say(5, 2, slName[fSlot[0]], SL_P1)
  say(24, 2, str('CPU'), SL_DIM)
  say(28, 2, slName[fSlot[1]], SL_P1)
  bigSay(18, 5, str('VS'), SL_BIG)
  say(11, 10, str('PROGRAM'), SL_DIM)
  say(19, 10, oppName[k], SL_P1)
  programLines(k)
  palMix(0, 0, VERSUS_DIM)
  say(4, RENDER_ROW, str('RENDER'), SL_DIM)
  say(24, RENDER_ROW, str('RENDER'), SL_DIM)
  sfx(X_MAT)
  let t: u16 = 0
  while (t < VERSUS_F + 34) {
    frameBegin()
    if (pressed(B_START) || pressed(B_A)) break
    const step = introStep(t)
    palShow(8, M_INTRO, step)
    palShow(9, M_INTRO, step)
    const pct = t * 3 > 100 ? 100 : t * 3
    renderShow(4, pct)
    renderShow(24, pct)
    sprBegin()
    figure(P1_X, SEL_FEET, addr(fig), figWord(S1_TILE, 8, true))
    figure(P2_X, SEL_FEET, addr(fig) + 68, figWord(S1_TILE + 128, 9, false))
    shadowAt(P1_X, SEL_FEET)
    shadowAt(P2_X, SEL_FEET)
    t++
  }
  hudRows(0, 36)
  palMix(0, 0, 0)
}

/** RENDER's per cent and its bar of ten cells, from column `x`. */
function renderShow(x: u16, pct: u16): void {
  number(cellAt(1, x + 7, RENDER_ROW), pct, 3, (FONT_TILE + 16) | (SL_P1 << 10) | FRONT)
  say(x + 10, RENDER_ROW, str('%'), SL_P1)
  const fill = div(pct * 8, 10)
  let c: u16 = 0
  while (c < 10) {
    const from = c * 8
    const part = fill <= from ? 0 : fill - from >= 8 ? 8 : fill - from
    vpoke(
      cellAt(1, x + c, RENDER_ROW + 1),
      (HUD_TILE + T_BAR + part * 9 + part) | (SL_P1 << 10) | FRONT,
    )
    c++
  }
}

/**
 * Each program's style in three lines, by the table's row (cpu/opponents.txt): how it fights,
 * never what it tends to do (design 7.10.5: the habits are found, not told).
 */
function programLines(k: u16): void {
  if (k === 0) {
    say(6, 12, str('IMPATIENT. IT COMES TO YOU,'), SL_P1)
    say(6, 13, str('QUICK HANDS AND LIGHT BLOWS,'), SL_P1)
    say(6, 14, str('ONE AFTER ANOTHER.'), SL_P1)
  } else if (k === 1) {
    say(6, 12, str('IT WAITS FOR YOU TO COME.'), SL_P1)
    say(6, 13, str('SLOW TO MOVE, HARD TO BREAK,'), SL_P1)
    say(6, 14, str('AND ONE BLOW IS ENOUGH.'), SL_P1)
  } else if (k === 2) {
    say(6, 12, str('A TRAP AT THE EDGE OF REACH.'), SL_P1)
    say(6, 13, str('LONG LIMBS GOING IN AND OUT,'), SL_P1)
    say(6, 14, str('PUNISHING WHAT MISSES.'), SL_P1)
  } else if (k === 3) {
    say(6, 12, str('THE TEXTBOOK.'), SL_P1)
    say(6, 13, str('THE RIGHT GUARD, THE RIGHT'), SL_P1)
    say(6, 14, str('ANSWER TO EVERY MISTAKE.'), SL_P1)
  } else {
    say(6, 12, str('YOUR OWN BODY, ANOTHER MIND.'), SL_P1)
    say(6, 13, str('IT HAS WATCHED YOU FIGHT'), SL_P1)
    say(6, 14, str('ALL THE WAY HERE.'), SL_P1)
  }
}
