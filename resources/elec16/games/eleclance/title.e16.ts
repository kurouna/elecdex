// ELECLANCE's title (docs/elec16-eleclance.md sections 3 and 6): the word dropping in, the
// difficulty chosen with left and right, how to play, and the chosen difficulty's best five.
// In cartridge bank 4 with the sprites' loading, which run once: everything they call is in
// RAM or another bank (the kit's `load` puts the window back), and they never move it.
import { type bool, div, peek16, poke16, str, type u16 } from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_LEFT,
  B_RIGHT,
  B_START,
  BG1Y,
  load,
  palMix,
  pressed,
  randSeed,
} from '../lib/kit.e16'
import {
  BITS_AT,
  BITS_BANK,
  BITS_BYTES,
  BITS_TILE,
  BLAST_BIG_AT,
  BLAST_BIG_BANK,
  BLAST_BIG_BYTES,
  BLAST_BIG_TILE,
  BLAST_SMALL_AT,
  BLAST_SMALL_BANK,
  BLAST_SMALL_BYTES,
  BLAST_SMALL_TILE,
  BULLETS_AT,
  BULLETS_BANK,
  BULLETS_BYTES,
  BULLETS_TILE,
  DART_AT,
  DART_BANK,
  DART_BYTES,
  DART_TILE,
  FAR_STARS_AT,
  FAR_STARS_BANK,
  FAR_STARS_BYTES,
  FAR_STARS_TILE,
  FLAME_AT,
  FLAME_BANK,
  FLAME_BYTES,
  FLAME_TILE,
  FONT_AT,
  FONT_BANK,
  FONT_BYTES,
  FONT_TILE,
  HALBERD_AT,
  HALBERD_BANK,
  HALBERD_BYTES,
  HALBERD_TILE,
  LANCE_AT,
  LANCE_BANK,
  LANCE_BYTES,
  LANCE_ENDS_AT,
  LANCE_ENDS_BANK,
  LANCE_ENDS_BYTES,
  LANCE_ENDS_TILE,
  LANCE_TILE,
  MOTE_AT,
  MOTE_BANK,
  MOTE_BYTES,
  MOTE_TILE,
  ORBS_AT,
  ORBS_BANK,
  ORBS_BYTES,
  ORBS_TILE,
  PICKUPS_AT,
  PICKUPS_BANK,
  PICKUPS_BYTES,
  PICKUPS_TILE,
  PIKE_AT,
  PIKE_BANK,
  PIKE_BYTES,
  PIKE_TILE,
  RING_AT,
  RING_BANK,
  RING_BYTES,
  RING_TILE,
  ROCK_BIG_AT,
  ROCK_BIG_BANK,
  ROCK_BIG_BYTES,
  ROCK_BIG_TILE,
  ROCK_SMALL_AT,
  ROCK_SMALL_BANK,
  ROCK_SMALL_BYTES,
  ROCK_SMALL_TILE,
  SHIP_AT,
  SHIP_BANK,
  SHIP_BYTES,
  SHIP_TILE,
  SHOT_AT,
  SHOT_BANK,
  SHOT_BYTES,
  SHOT_TILE,
  STARS_AT,
  STARS_BANK,
  STARS_BYTES,
  STARS_TILE,
  WARDEN_AT,
  WARDEN_BANK,
  WARDEN_BYTES,
  WARDEN_TILE,
} from './assets.e16'
import { M_TITLE, music, sfxSelect } from './audio.e16'
import { levelKeep, tableRead, tableShow } from './best.e16'
import { frame, frameBegin, logoIn } from './eleclance.e16'
import { farStarsStep } from './fx.e16'
import { LV_EASY, LV_HARD, level, levelSet } from './level.e16'
import {
  mapsClear,
  palettesIn,
  RT_FRAME,
  SL_GOLD,
  SL_RED,
  SL_TEXT,
  say,
  shake,
  shakeStep,
  stageSpeed,
  stageStart,
  stageStep,
  unsay,
  wave,
} from './view.e16'

/** Every sprite sheet into video memory (the bosses' share their tiles with the title's word). */
export function spritesIn(): void {
  load(SHIP_BANK, SHIP_AT, SHIP_TILE * 32, SHIP_BYTES)
  load(FLAME_BANK, FLAME_AT, FLAME_TILE * 32, FLAME_BYTES)
  load(SHOT_BANK, SHOT_AT, SHOT_TILE * 32, SHOT_BYTES)
  load(LANCE_BANK, LANCE_AT, LANCE_TILE * 32, LANCE_BYTES)
  load(LANCE_ENDS_BANK, LANCE_ENDS_AT, LANCE_ENDS_TILE * 32, LANCE_ENDS_BYTES)
  load(MOTE_BANK, MOTE_AT, MOTE_TILE * 32, MOTE_BYTES)
  load(DART_BANK, DART_AT, DART_TILE * 32, DART_BYTES)
  load(PIKE_BANK, PIKE_AT, PIKE_TILE * 32, PIKE_BYTES)
  load(ROCK_BIG_BANK, ROCK_BIG_AT, ROCK_BIG_TILE * 32, ROCK_BIG_BYTES)
  load(ROCK_SMALL_BANK, ROCK_SMALL_AT, ROCK_SMALL_TILE * 32, ROCK_SMALL_BYTES)
  load(HALBERD_BANK, HALBERD_AT, HALBERD_TILE * 32, HALBERD_BYTES)
  load(WARDEN_BANK, WARDEN_AT, WARDEN_TILE * 32, WARDEN_BYTES)
  load(BULLETS_BANK, BULLETS_AT, BULLETS_TILE * 32, BULLETS_BYTES)
  load(ORBS_BANK, ORBS_AT, ORBS_TILE * 32, ORBS_BYTES)
  load(BLAST_SMALL_BANK, BLAST_SMALL_AT, BLAST_SMALL_TILE * 32, BLAST_SMALL_BYTES)
  load(BLAST_BIG_BANK, BLAST_BIG_AT, BLAST_BIG_TILE * 32, BLAST_BIG_BYTES)
  load(BITS_BANK, BITS_AT, BITS_TILE * 32, BITS_BYTES)
  load(STARS_BANK, STARS_AT, STARS_TILE * 32, STARS_BYTES)
  load(RING_BANK, RING_AT, RING_TILE * 32, RING_BYTES)
  load(FAR_STARS_BANK, FAR_STARS_AT, FAR_STARS_TILE * 32, FAR_STARS_BYTES)
  load(PICKUPS_BANK, PICKUPS_AT, PICKUPS_TILE * 32, PICKUPS_BYTES)
  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
}

/** The title until START (or A): left and right choose the difficulty, kept in save RAM. */
export function title(): void {
  mapsClear()
  stageStart()
  stageSpeed(4)
  logoIn()
  music(M_TITLE)
  levelShow()
  say(10, 34, str('(C) ELECXZY PROJECT'), SL_TEXT)
  let t: u16 = 0
  let shown: u16 = 0
  for (;;) {
    frameBegin()
    shakeStep()
    stageStep()
    farStarsStep(1, frame)
    logoStep(t)
    if ((t & 32) === 0) say(14, 17, str('PRESS START'), SL_GOLD)
    else unsay(14, 17, 11)
    // The best five and how to play take turns below, five seconds each; a new choice of
    // difficulty brings its best five.
    if (t === shown) {
      pageShow((div(t, PAGE) & 1) !== 0)
      shown = shown + PAGE
    }
    if (pressed(B_LEFT) && level > LV_EASY) levelPick(level - 1)
    if (pressed(B_RIGHT) && level < LV_HARD) levelPick(level + 1)
    if (t > 40 && pressed(B_START | B_A)) break
    t++
  }
  levelKeep()
  randSeed(frame ^ peek16(RT_FRAME))
  sfxSelect()
  palettesIn()
}

/** Frames a page of the title stays. */
const PAGE = 300

/** Rows 20-31 cleared for the best five, or how to play (`help`). */
function pageShow(help: bool): void {
  let y: u16 = 20
  while (y < 32) {
    unsay(0, y, 40)
    y++
  }
  if (help) helpShow()
  else tableShow(22)
}

/** The word comes down from above and flashes white as it lands. */
function logoStep(t: u16): void {
  if (t < 48) {
    poke16(BG1Y, (48 - t) * 2)
    palMix(SL_RED, 0x7fff, 16)
  } else if (t < 64) {
    poke16(BG1Y, 0)
    palMix(SL_RED, 0x7fff, 64 - t)
    if (t === 48) {
      shake(12)
      wave(40, 6)
    }
  }
}

/** Difficulty `l` chosen on the title: its row and its best five read, the choice drawn again. */
function levelPick(l: u16): void {
  levelSet(l)
  tableRead()
  levelShow()
  pageShow(false)
  sfxSelect()
}

/**
 * The three difficulties on row 13, the chosen one in gold between arrows, the others plain;
 * below, a line on what it means.
 */
function levelShow(): void {
  unsay(0, 13, 40)
  unsay(0, 15, 40)
  levelWord(LV_EASY, 10, 4, str('EASY'))
  levelWord(1, 17, 6, str('NORMAL'))
  levelWord(LV_HARD, 26, 4, str('HARD'))
  if (level === LV_EASY) say(4, 15, str('MORE SHIPS AND BOMBS, LESS FIRE'), SL_TEXT)
  else if (level === LV_HARD) say(8, 15, str('FULL FIRE FROM THE START'), SL_TEXT)
  else say(7, 15, str('THE FIRE BUILDS AS YOU GO'), SL_TEXT)
}

/** One difficulty's word of `n` letters at column x, between arrows when it is the chosen one. */
function levelWord(l: u16, x: u16, n: u16, s: u16): void {
  if (l !== level) {
    say(x, 13, s, SL_TEXT)
    return
  }
  say(x - 1, 13, str('>'), SL_GOLD)
  say(x, 13, s, SL_GOLD)
  say(x + n, 13, str('<'), SL_GOLD)
}

/** How to play: the buttons in gold, what they do beside them. */
function helpShow(): void {
  say(14, 20, str('HOW TO PLAY'), SL_TEXT)
  say(6, 22, str('D-PAD'), SL_GOLD)
  say(14, 22, str('MOVE'), SL_TEXT)
  say(6, 24, str('A'), SL_GOLD)
  say(14, 24, str('SHOT, HOLD FOR LANCE'), SL_TEXT)
  say(6, 26, str('B'), SL_GOLD)
  say(14, 26, str('BOMB'), SL_TEXT)
  say(6, 28, str('X OR R'), SL_GOLD)
  say(14, 28, str('OVERDRIVE WHEN READY'), SL_TEXT)
  say(6, 30, str('START'), SL_GOLD)
  say(14, 30, str('PAUSE'), SL_TEXT)
}
