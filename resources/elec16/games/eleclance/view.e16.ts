// ELECLANCE's screen (docs/elec16-eleclance.md section 2): palettes into their slots, the stage
// streamed into BG0 a row at a time as it scrolls, the panels and the score line on BG1, the
// raster wave and the shake.
import { type bool, i16, poke16, u16, wrap16 } from '../../../../src/shared/e16c/builtins'
import {
  BG0X,
  BG0Y,
  BG1X,
  BG1Y,
  cellAt,
  colour,
  LAYERS,
  load,
  mapRow,
  palette,
  palKeep,
  palMix,
  RASTER,
  RASTER_BANDS,
  raster,
  sin,
  text,
  VCTRL,
  vfill,
} from '../lib/kit.e16'
import {
  FONT_TILE,
  PAL_BULLET,
  PAL_ENEMY,
  PAL_FIRE,
  PAL_FLASH,
  PAL_HEAVY,
  PAL_HULL,
  PAL_ITEM,
  PAL_NEBULA,
  PAL_PANEL,
  PAL_SHIP,
  PAL_SHOT,
  PAL_SPACE,
  PAL_STATION,
  PAL_TEXT,
  PAL_TEXT_GOLD,
  PAL_TEXT_RED,
  PANELS_H,
  PANELS_MAP_BANK,
  PANELS_TILE,
  PANELS_TILES_AT,
  PANELS_TILES_BANK,
  PANELS_TILES_BYTES,
  STAGE_H,
  STAGE_MAP_BANK,
  STAGE_TILE,
  STAGE_TILES_AT,
  STAGE_TILES_BANK,
  STAGE_TILES_BYTES,
} from './assets.e16'

/** Palette slots: backgrounds 0-7, sprites 8-15. */
export const SL_SPACE = 0
export const SL_NEBULA = 1
export const SL_STATION = 2
export const SL_HULL = 3
export const SL_PANEL = 4
export const SL_TEXT = 5
export const SL_GOLD = 6
export const SL_RED = 7
export const SL_SHIP = 8
export const SL_SHOT = 9
export const SL_ENEMY = 10
export const SL_HEAVY = 11
export const SL_BULLET = 12
export const SL_FIRE = 13
export const SL_ITEM = 14
export const SL_FLASH = 15

/** The field: 224 points from x 48, the panels either side. */
export const FIELD_X = 48
export const FIELD_W = 224
export const FIELD_H = 288

/** Every palette into its slot, and kept for flashes and fades. */
export function palettesIn(): void {
  slot(PAL_SPACE, SL_SPACE)
  slot(PAL_NEBULA, SL_NEBULA)
  slot(PAL_STATION, SL_STATION)
  slot(PAL_HULL, SL_HULL)
  slot(PAL_PANEL, SL_PANEL)
  slot(PAL_TEXT, SL_TEXT)
  slot(PAL_TEXT_GOLD, SL_GOLD)
  slot(PAL_TEXT_RED, SL_RED)
  slot(PAL_SHIP, SL_SHIP)
  slot(PAL_SHOT, SL_SHOT)
  slot(PAL_ENEMY, SL_ENEMY)
  slot(PAL_HEAVY, SL_HEAVY)
  slot(PAL_BULLET, SL_BULLET)
  slot(PAL_FIRE, SL_FIRE)
  slot(PAL_ITEM, SL_ITEM)
  slot(PAL_FLASH, SL_FLASH)
}

function slot(row: u16, s: u16): void {
  palette(row, s)
  palKeep(row, s)
}

/** Mode 1, both backgrounds and the sprites shown, nothing scrolled. */
export function screenOn(): void {
  poke16(VCTRL, 3)
  poke16(LAYERS, 7)
  poke16(BG0X, 0)
  poke16(BG0Y, 0)
  poke16(BG1X, 0)
  poke16(BG1Y, 0)
}

/** Both maps cleared to their clear tiles. */
export function mapsClear(): void {
  vfill(cellAt(0, 0, 0), STAGE_TILE, 4096)
  vfill(cellAt(1, 0, 0), PANELS_TILE, 4096)
}

/** The stage's and the panels' tiles into video memory. */
export function bgTilesIn(): void {
  load(STAGE_TILES_BANK, STAGE_TILES_AT, STAGE_TILE * 32, STAGE_TILES_BYTES)
  load(PANELS_TILES_BANK, PANELS_TILES_AT, PANELS_TILE * 32, PANELS_TILES_BYTES)
}

/** The panels into BG1's rows 0-35. */
export function panelsIn(): void {
  let y: u16 = 0
  while (y < PANELS_H) {
    mapRow(PANELS_MAP_BANK, 0xc000 + y * 128, 1, y)
    y++
  }
}

/* ---------------- the stage, streamed ---------------- */

/** Points scrolled since the start: the stage moves up the screen by this. */
export let scrolled: u16 = 0
/** Sixteenths of a point the scroll goes on by each frame. */
export let scrollSpeed: u16 = 8
let scrollFrac: u16 = 0
/** The highest stage row (picture row, from its top) loaded into BG0. */
let loadedTop: u16 = 0
/** While a boss holds the stage: rows from `holdTop` for `holdRows` repeat. */
let holdTop: u16 = 0
let holdRows: u16 = 0
/** The logical top row of the screen, before any hold folds it. */
let logicalTop: u16 = 0

/**
 * The stage's picture row that logical row `r` shows. Logical rows count on upward past the
 * picture's top (wrapping as words do); while a hold is on, those above `holdTop` fold back
 * into its rows, so the arena repeats.
 */
function sourceRow(r: u16): u16 {
  const d = wrap16(holdTop - r)
  if (holdRows === 0 || d === 0 || d > 0x8000) return r
  return holdTop + holdRows - 1 - ((d - 1) % holdRows)
}

/** One stage row into BG0 at its place for logical row `r`. */
function stageRow(r: u16): void {
  const src = sourceRow(r)
  const b = STAGE_MAP_BANK + (src >> 6)
  mapRow(b, 0xc000 + (src & 63) * 128, 0, r & 63)
}

/** The stage from its start: BG0 filled with the first screen and the rows just above it. */
export function stageStart(): void {
  scrolled = 0
  scrollFrac = 0
  holdRows = 0
  scrollSpeed = 8
  const top = STAGE_H - 36
  logicalTop = top
  let r = top - 2
  while (r < STAGE_H) {
    stageRow(r)
    r++
  }
  loadedTop = top - 2
  stageScroll()
}

/** Holds the stage on the 64 rows from picture row `top` (a boss's arena). */
export function stageHold(top: u16): void {
  holdTop = top
  holdRows = 64
}

/**
 * Lets the hold go: the scroll is taken back by whole laps of the arena (512 points, all of
 * BG0), so what is on the screen stays where it is, and the stage goes on above the arena.
 */
export function stageRelease(): void {
  const laps = u16(i16(wrap16(holdTop - logicalTop)) >> 6)
  scrolled = wrap16(scrolled - laps * 512)
  loadedTop = wrap16(loadedTop + laps * 64)
  logicalTop = wrap16(logicalTop + laps * 64)
  holdRows = 0
}

/** The stage on by this frame's speed: BG0's scroll, and rows loaded ahead as they come. */
export function stageStep(): void {
  scrollFrac = scrollFrac + scrollSpeed
  scrolled = scrolled + (scrollFrac >> 4)
  scrollFrac = scrollFrac & 15
  // The logical top row: the picture's rows from its top, on past it (negative) in a hold.
  const pixelTop = wrap16(STAGE_H * 8 - 288 - scrolled)
  logicalTop = u16(i16(pixelTop) >> 3)
  // Two rows ahead of the screen's top are always loaded.
  while (i16(wrap16(loadedTop - logicalTop)) > -2) {
    loadedTop = wrap16(loadedTop - 1)
    stageRow(loadedTop)
  }
}

/** Sets the speed, in sixteenths of a point a frame. */
export function stageSpeed(s: u16): void {
  scrollSpeed = s
}

/** BG0's place on the screen: the stage's scroll, the field's sway with the ship, the shake. */
let sway: i16 = 0
let shakeLeft: u16 = 0
let shakeX: i16 = 0
let shakeY: i16 = 0

export function stageScroll(): void {
  const y = wrap16(STAGE_H * 8 - 288 - scrolled)
  poke16(BG0Y, (y + u16(shakeY)) & 511)
  poke16(BG0X, u16(sway + shakeX) & 511)
}

/** The background leans with the ship: `shipX` its x on the screen. */
export function stageSway(shipX: i16): void {
  sway = (shipX - 160) >> 3
}

/** Shakes the screen for `frames` frames. */
export function shake(frames: u16): void {
  if (frames > shakeLeft) shakeLeft = frames
}

/** This frame's shake: an offset for the backgrounds and every sprite. */
export function shakeStep(): void {
  if (shakeLeft === 0) {
    shakeX = 0
    shakeY = 0
    return
  }
  shakeLeft--
  const r = shakeLeft & 3
  const size: i16 = shakeLeft > 8 ? 3 : shakeLeft > 3 ? 2 : 1
  shakeX = r === 0 ? size : r === 2 ? -size : 0
  shakeY = r === 1 ? size : r === 3 ? -size : 0
}

export function shakeDX(): i16 {
  return shakeX
}

export function shakeDY(): i16 {
  return shakeY
}

/* ---------------- the flash ---------------- */

let flashLeft: u16 = 0

/** The whole screen white, fading back over `frames` frames (at most 16). */
export function flashScreen(frames: u16): void {
  flashLeft = frames > 16 ? 16 : frames
}

/** This frame of the flash: the backgrounds' and the sprites' colours mixed toward white. */
export function flashStep(): void {
  if (flashLeft === 0) return
  flashLeft--
  let s: u16 = 0
  while (s < 16) {
    // The panels and the words stay as they are: they are read through it.
    if (s < 4 || s >= 8) palMix(s, 0x7fff, flashLeft)
    s++
  }
}

/* ---------------- the raster wave ---------------- */

let waveLeft: u16 = 0
let wavePhase: u16 = 0
let waveSize: u16 = 0

/** Heat in the air for `frames` frames: BG0 waves side to side by up to `size` points. */
export function wave(frames: u16, size: u16): void {
  waveLeft = frames
  waveSize = size
  raster(1)
}

/** Fills the raster table for the next frame, or stops it when the wave is spent. */
export function waveStep(): void {
  const base = u16(sway + shakeX) & 511
  if (waveLeft === 0) return
  waveLeft--
  wavePhase = wavePhase + 5
  const fade = waveLeft < 16 ? waveLeft : 16
  let k: u16 = 0
  while (k < RASTER_BANDS) {
    const s = sin(wavePhase + k * 14)
    const off = (s * i16(waveSize * fade)) >> 12
    poke16(RASTER + k * 2, (base + u16(off)) & 511)
    k++
  }
  if (waveLeft === 0) raster(0)
}

/* ---------------- words on BG1 ---------------- */

/** Words at cell (x, y) of BG1, in slot `s`, in front of the sprites. */
export function say(x: u16, y: u16, s: u16, sl: u16): void {
  text(cellAt(1, x, y), s, FONT_TILE | (sl << 10) | 0x8000)
}

/** Clears `n` cells of BG1 from (x, y). */
export function unsay(x: u16, y: u16, n: u16): void {
  vfill(cellAt(1, x, y), PANELS_TILE, n)
}

/** Clears the field's part of BG1 below the score line (the panels and the score stay). */
export function fieldClear(): void {
  let y: u16 = 1
  while (y < 36) {
    unsay(6, y, 28)
    y++
  }
}

/** A colour of a slot set straight (a lamp, a flash). */
export function tint(s: u16, k: u16, rgb: u16): void {
  colour(s, k, rgb)
}

/** Whether the stage's logical top has reached picture row `row` (an event's place). */
export function reached(row: u16): bool {
  return i16(wrap16(logicalTop - row)) <= 0
}

/** The logical top row now. */
export function topRow(): u16 {
  return logicalTop
}
