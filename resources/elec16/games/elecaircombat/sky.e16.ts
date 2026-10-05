// ELECAIRCOMBAT's screen (docs/elec16-elecaircombat.md sections 3 and 4): the palettes in their
// slots, the cockpit on BG1 in front of everything, the displays' glass on BG0 under the
// panel, words on BG1, the shake - and the sky and sea, BG0 rewritten every frame from where
// the horizon lies: each cell's tile chosen by its centre's distance from the horizon
// (horizon.txt), a row at a time, rows that did not change left alone.
import {
  addr,
  asm,
  type bool,
  csrr,
  div,
  i16,
  peek16,
  poke16,
  u16,
  words,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import {
  BG0X,
  BG0Y,
  BG1X,
  BG1Y,
  bank,
  cellAt,
  dma,
  IO_BANK,
  LAYERS,
  load,
  mapRow,
  mix,
  PALS,
  palCopy,
  palette,
  palKeep,
  palMix,
  text,
  VCTRL,
  vfill,
  vpoke,
} from '../lib/kit.e16'
import {
  COCKPIT_H,
  COCKPIT_MAP_BANK,
  COCKPIT_TILE,
  COCKPIT_TILES_AT,
  COCKPIT_TILES_BANK,
  COCKPIT_TILES_BYTES,
  FONT_TILE,
  HORIZON_TABLE_AT,
  HORIZON_TABLE_BANK,
  HORIZON_TILE,
  LOGO_H,
  LOGO_MAP_BANK,
  LOGO_TILE,
  LOGO_TILES_AT,
  LOGO_TILES_BANK,
  LOGO_TILES_BYTES,
  PAL_AMBER_TEXT,
  PAL_CLOUD,
  PAL_FIRE,
  PAL_FLASH,
  PAL_FRAME,
  PAL_HUD,
  PAL_HUD_RED,
  PAL_HUD_TEXT,
  PAL_LOGO,
  PAL_RED_TEXT,
  PAL_SCREEN,
  PAL_SHOT,
  PAL_SKY_DAY,
  PAL_SUN,
  PAL_WHITE_TEXT,
  SCREENS_H,
  SCREENS_MAP_BANK,
  SCREENS_TILE,
  SCREENS_TILES_AT,
  SCREENS_TILES_BANK,
  SCREENS_TILES_BYTES,
} from './assets.e16'
import { bodyV, mOut, toBodyOf, vec } from './math.e16'

/** Palette slots: backgrounds 0-7, sprites 8-15. */
export const SL_SKY = 0
export const SL_FRAME = 1
export const SL_SCREEN = 2
export const SL_HUD_TEXT = 3
export const SL_AMBER = 4
export const SL_RED = 5
export const SL_LOGO = 6
export const SL_WHITE = 7
export const SL_HUD = 8
export const SL_ENEMY = 9
export const SL_FIRE = 10
export const SL_CLOUD = 11
export const SL_SHOT = 12
export const SL_HUD_RED = 13
export const SL_FLASH = 14
export const SL_SUN = 15

/** The boresight: where the nose points on the screen, and the focal length in points. */
export const CX = 160
export const CY = 112
export const FOCAL = 192
/** Rows of BG0 the sky covers; below them the panel's displays. */
export const SKY_ROWS = 27

/** Every palette into its slot (the sky by the sortie's time of day), and kept for fades. */
export function palettesIn(skyRow: u16): void {
  slot(PAL_SKY_DAY + skyRow, SL_SKY)
  slot(PAL_FRAME, SL_FRAME)
  slot(PAL_SCREEN, SL_SCREEN)
  slot(PAL_HUD_TEXT, SL_HUD_TEXT)
  slot(PAL_AMBER_TEXT, SL_AMBER)
  slot(PAL_RED_TEXT, SL_RED)
  slot(PAL_WHITE_TEXT, SL_WHITE)
  slot(PAL_LOGO, SL_LOGO)
  slot(PAL_HUD, SL_HUD)
  slot(PAL_FIRE, SL_FIRE)
  slot(PAL_CLOUD, SL_CLOUD)
  slot(PAL_SHOT, SL_SHOT)
  slot(PAL_HUD_RED, SL_HUD_RED)
  slot(PAL_FLASH, SL_FLASH)
  slot(PAL_SUN, SL_SUN)
}

/**
 * A slot's kept colours tinted `t` sixteenths toward `rgb` and shown: clouds and smoke take
 * the light of the sortie's hour (and a flash fades back to the tint, not past it).
 */
export function tintSlot(s: u16, rgb: u16, t: u16): void {
  let k: u16 = 1
  while (k < 16) {
    palCopy[s * 16 + k] = mix(palCopy[s * 16 + k], rgb, t)
    k++
  }
  palMix(s, 0, 0)
}

export function slot(row: u16, s: u16): void {
  palette(row, s)
  palKeep(row, s)
}

/** Mode 1, both backgrounds and the sprites, nothing scrolled. */
export function screenOn(): void {
  poke16(VCTRL, 3)
  poke16(LAYERS, 7)
  scrollAll(0, 0)
}

export function scrollAll(x: i16, y: i16): void {
  poke16(BG0X, u16(x) & 511)
  poke16(BG0Y, u16(y) & 511)
  poke16(BG1X, u16(x) & 511)
  poke16(BG1Y, u16(y) & 511)
}

/** The background tiles: the displays' glass and the cockpit (over the title's word). */
export function cockpitTilesIn(): void {
  load(SCREENS_TILES_BANK, SCREENS_TILES_AT, SCREENS_TILE * 32, SCREENS_TILES_BYTES)
  load(COCKPIT_TILES_BANK, COCKPIT_TILES_AT, COCKPIT_TILE * 32, COCKPIT_TILES_BYTES)
}

/** BG1 clear (the cockpit map's clear tile), BG0 the deep sky. */
export function mapsClear(): void {
  vfill(cellAt(1, 0, 0), COCKPIT_TILE, 4096)
  vfill(cellAt(0, 0, 0), hBand[2 * RANGE], 4096)
  cockpitOn = false
  skyForget()
}

/** The cockpit on BG1 and the displays' glass on BG0's rows under the panel. */
export function cockpitIn(): void {
  cockpitOn = true
  let y: u16 = 0
  while (y < COCKPIT_H) {
    mapRow(COCKPIT_MAP_BANK, 0xc000 + y * 128, 1, y)
    y++
  }
  y = 0
  while (y < SCREENS_H) {
    mapRow(SCREENS_MAP_BANK, 0xc000 + y * 128, 0, SKY_ROWS + y)
    y++
  }
}

/* ---------------- words ---------------- */

/** Words at cell (x, y) of BG1, in slot `sl`, in front of the sprites. */
export function say(x: u16, y: u16, s: u16, sl: u16): void {
  text(cellAt(1, x, y), s, FONT_TILE | (sl << 10) | 0x8000)
}

/** Whether the cockpit is on BG1 (words cleared put its cells back), or nothing is. */
export let cockpitOn: bool = false

/** A cell of BG1 cleared: the cockpit's own cell put back, or the clear cell. */
export function unsay(x: u16, y: u16, n: u16): void {
  if (!cockpitOn) {
    vfill(cellAt(1, x, y), COCKPIT_TILE, n)
    return
  }
  const old = bank(COCKPIT_MAP_BANK)
  let k: u16 = 0
  while (k < n) {
    const w = peek16(0xc000 + ((y & 63) << 7) + ((x + k) << 1))
    vpoke(cellAt(1, x + k, y), w)
    k++
  }
  poke16(IO_BANK, old)
}

/** A character at a cell of BG1 in slot `sl` (in front). */
export function sayChar(x: u16, y: u16, c: u16, sl: u16): void {
  vpoke(cellAt(1, x, y), (FONT_TILE + c - 32) | (sl << 10) | 0x8000)
}

/** A number of `digits` digits (leading zeros blank) at a cell of BG1 (`cellXY`). */
/** A cell of BG1 as one number, for `sayNumber`. */
export function cellXY(x: u16, y: u16): u16 {
  return (y << 6) | x
}

export function sayNumber(cell: u16, n: u16, digits: u16, sl: u16): void {
  const x = cell & 63
  const y = cell >> 6
  let k = digits
  let v = n
  while (k > 0) {
    k--
    const blank = v === 0 && k < digits - 1
    sayChar(x + k, y, blank ? 32 : 48 + (v % 10), sl)
    v = divTen(v)
  }
}

export function divTen(n: u16): u16 {
  return div(n, 10)
}

/** Clears BG1 to the cockpit's clear cell in rows y0..y1 (whole rows). */
export function rowsClear(y0: u16, y1: u16): void {
  let y = y0
  while (y <= y1) {
    vfill(cellAt(1, 0, y), COCKPIT_TILE, 40)
    y++
  }
}

/* ---------------- the frame's time ---------------- */

/** The machine's cycle counter (the low word): a frame is 66,667 cycles at 4 MHz. */
export const CSR_CYCLE = 0xc00
/** When this frame began (fx.e16.ts weighs its effects by it without a call). */
export let frameT0: u16 = 0

/** The frame begins: called as the wait for it ends. */
export function frameStarts(): void {
  frameT0 = csrr(CSR_CYCLE)
}

/** The cycles this frame has used so far: what may be left out of a crowded one is weighed by it. */
export function busy(): u16 {
  return wrap16(csrr(CSR_CYCLE) - frameT0)
}

/* ---------------- the shake and the flash ---------------- */

let shakeLeft: u16 = 0
/** This frame's shake, x and y: every layer and sprite moved by it (an array: `see` reads it). */
export const shakeV = words(2)

export function shakeX(): i16 {
  return i16(shakeV[0])
}

export function shakeY(): i16 {
  return i16(shakeV[1])
}

export function shake(frames: u16): void {
  if (frames > shakeLeft) shakeLeft = frames
}

/** Whether the layers are at rest, the shake over and its zero written: nothing to write. */
let shakeRest: bool = false

/** This frame's shake: every layer and sprite moved together. */
export function shakeStep(): void {
  if (shakeLeft === 0) {
    if (shakeRest) return
    shakeRest = true
  } else shakeRest = false
  let x: i16 = 0
  let y: i16 = 0
  if (shakeLeft > 0) {
    shakeLeft--
    const r = shakeLeft & 3
    const size = shakeSize()
    if (r === 0) x = size
    else if (r === 2) x = -size
    else if (r === 1) y = size
    else y = -size
  }
  shakeV[0] = u16(x)
  shakeV[1] = u16(y)
  scrollAll(x, y)
}

function shakeSize(): i16 {
  if (shakeLeft > 10) return 3
  return shakeLeft > 4 ? 2 : 1
}

/** Frames of the flash left: game.e16.ts calls flashStep only while some are. */
export let flashLeft: u16 = 0
let flashRgb: u16 = 0x7fff

/** The sky and the sprites tinted toward `rgb`, fading over `frames` (at most 16). */
export function flashScreen(frames: u16, rgb: u16): void {
  flashLeft = frames > 16 ? 16 : frames
  flashRgb = rgb
}

/** A frame of the flash, fading: called only while `flashLeft` has frames. */
export function flashStep(): void {
  flashLeft--
  flashSlot(SL_SKY)
  flashSlot(SL_CLOUD)
  flashSlot(SL_ENEMY)
}

function flashSlot(sl: u16): void {
  flashMix(sl, flashRgb, flashLeft)
  dma(addr(flashBuf), PALS + sl * 32 + 2, 30)
}

/** The flash's weights (16 - t, then each channel of its colour times t), and a slot's colours. */
export const flashK = words(4)
const flashBuf = words(15)

/**
 * As the kit's `palMix`, in assembly, into `flashBuf` (for DMA): slot `sl`'s kept colours 1-15
 * mixed `t` sixteenths toward `rgb` (a flash of three slots once cost a tenth of a frame).
 */
function flashMix(_sl: u16, _rgb: u16, _t: u16): void {
  asm`
    li t0, flashK
    li t1, 16
    sub t1, t1, a2
    sw t1, 0(t0)
    andi t1, a1, 31
    mul t1, t1, a2
    sw t1, 2(t0)
    srli t1, a1, 5
    andi t1, t1, 31
    mul t1, t1, a2
    sw t1, 4(t0)
    srli t1, a1, 10
    andi t1, t1, 31
    mul t1, t1, a2
    sw t1, 6(t0)
    slli a0, a0, 5
    li t0, palCopy + 2
    add a0, a0, t0
    li a1, flashBuf
    li a2, 15
.fm_next:
    lw t3, 0(a0)
    li t2, flashK
    lw a3, 0(t2)
    andi t0, t3, 31
    mul t0, t0, a3
    lw t1, 2(t2)
    add t0, t0, t1
    srli t0, t0, 4
    sw t0, 0(a1)
    srli t0, t3, 5
    andi t0, t0, 31
    mul t0, t0, a3
    lw t1, 4(t2)
    add t0, t0, t1
    srli t0, t0, 4
    slli t0, t0, 5
    lw t1, 0(a1)
    or t1, t1, t0
    srli t0, t3, 10
    andi t0, t0, 31
    mul t0, t0, a3
    lw t3, 6(t2)
    add t0, t0, t3
    srli t0, t0, 4
    slli t0, t0, 10
    or t1, t1, t0
    sw t1, 0(a1)
    addi a0, a0, 2
    addi a1, a1, 2
    addi a2, a2, -1
    bnez a2, .fm_next
  `
}

/* ---------------- the sky and the sea ---------------- */

/** The band table (tile words by distance, -RANGE to RANGE points) and the horizon's tiles. */
export const RANGE = 400
export const hBand = words(801)
export const hPart = words(221)
/** A row of tile words for BG0, and what each sky row last held when it was all one tile. */
export const hRow = words(40)
export const hRowWas = words(36)

/** The table into RAM, its band entries made tile words. */
export function skyInit(): void {
  const old = bank(HORIZON_TABLE_BANK)
  // The table's 321 entries in the middle; beyond them, its ends again (the deep sky, the
  // deep sea), so a row far from the horizon needs no clamping.
  let k: u16 = 0
  while (k < 801) {
    const t = k < 240 ? 0 : k > 560 ? 320 : k - 240
    hBand[k] = HORIZON_TILE + peek16(HORIZON_TABLE_AT + t * 2)
    k++
  }
  k = 0
  while (k < 221) {
    hPart[k] = peek16(HORIZON_TABLE_AT + 642 + k * 2)
    k++
  }
  poke16(IO_BANK, old)
  skyForget()
}

/** Every sky row drawn afresh next frame. */
export function skyForget(): void {
  let r: u16 = 0
  while (r < 36) {
    hRowWas[r] = 0xffff
    r++
  }
}

/* ---------------- the player's view ---------------- */

/**
 * What `toBody` and `see` found, in `bodyV`: the place in the player's axes (units: right, up,
 * ahead), then where `see` put it on the screen. Read through these (each a load, inlined).
 */
export function bodyX(): i16 {
  return i16(bodyV[0])
}

export function bodyY(): i16 {
  return i16(bodyV[1])
}

export function bodyZ(): i16 {
  return i16(bodyV[2])
}

export function scrX(): i16 {
  return i16(bodyV[3])
}

export function scrY(): i16 {
  return i16(bodyV[4])
}

/** The place in vector `p` (world, units, from the player) in the player's axes. */
export function toBody(p: u16): void {
  toBodyOf(addr(vec) + p * 2)
}

/**
 * The place in vector `p` seen from the cockpit, in one piece of assembly (it runs some sixty
 * times a frame): how far ahead first, and nothing more for what is behind; then across and
 * up, and onto the screen (x * FOCAL / z, shaken) when it is within the screen's reach: one
 * reciprocal of z (two divisions, to fifteen bits) and a product for each of x and y.
 * Answers whether it is; `bodyZ` is set either way.
 */
export function see(_p: u16): bool {
  asm`
    slli a0, a0, 1
    li t0, vec
    add a0, a0, t0
    li a1, vec
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .se_z
    addi t1, t1, 1
    beqz t1, .se_z
    li t0, 32767
    bge t3, zero, .se_z
    li t0, -32767
.se_z:
    li t2, bodyV
    sw t0, 4(t2)
    li t1, 8
    blt t0, t1, .se_no
    li a1, vec + 6
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .se_x
    addi t1, t1, 1
    beqz t1, .se_x
    li t0, 32767
    bge t3, zero, .se_x
    li t0, -32767
.se_x:
    li t2, bodyV
    sw t0, 0(t2)
    li a1, vec + 12
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .se_y
    addi t1, t1, 1
    beqz t1, .se_y
    li t0, 32767
    bge t3, zero, .se_y
    li t0, -32767
.se_y:
    li t2, bodyV
    sw t0, 2(t2)
    lw a1, 4(t2)
    srai t3, t0, 15
    xor t1, t0, t3
    sub t1, t1, t3
    blt a1, t1, .se_no
    lw a0, 0(t2)
    srai t3, a0, 15
    xor t1, a0, t3
    sub t1, t1, t3
    blt a1, t1, .se_no
    clz t1, a1
    sll a1, a1, t1
    srli a1, a1, 7
    li a2, -1
    divu a3, a2, a1
    remu a2, a2, a1
    slli a2, a2, 7
    divu a2, a2, a1
    slli a3, a3, 7
    add a3, a3, a2
    srai t3, t0, 15
    xor t0, t0, t3
    sub t0, t0, t3
    sll t0, t0, t1
    mulhu t0, t0, a3
    srli t0, t0, 1
    slli t2, t0, 1
    add t0, t0, t2
    srli t0, t0, 7
    xor t0, t0, t3
    sub t0, t0, t3
    li t2, 112
    sub t0, t2, t0
    li t2, shakeV
    lw a2, 2(t2)
    add t0, t0, a2
    li t2, bodyV
    sw t0, 8(t2)
    lw t0, 0(t2)
    srai t3, t0, 15
    xor t0, t0, t3
    sub t0, t0, t3
    sll t0, t0, t1
    mulhu t0, t0, a3
    srli t0, t0, 1
    slli t2, t0, 1
    add t0, t0, t2
    srli t0, t0, 7
    xor t0, t0, t3
    sub t0, t0, t3
    addi t0, t0, 160
    li t2, shakeV
    lw a2, 0(t2)
    add t0, t0, a2
    li t2, bodyV
    sw t0, 6(t2)
    li t0, 1
    j .se_out
.se_no:
    li t0, 0
.se_out:
    li t2, mOut
    sw t0, 0(t2)
  `
  return mOut[0] !== 0
}

/**
 * Whether a sprite reaching `h` points below `y` stays clear of the panel's displays: the
 * world is never seen through their glass (only the radar's blips are drawn there).
 */
export function abovePanel(y: i16, h: i16): bool {
  return !cockpitOn || y + h < PANEL_TOP
}

export const PANEL_TOP: i16 = 224

/* ---------------- the title's word ---------------- */

/** The title's word on BG1 from row `y`, its tiles over the cockpit's (in RAM: it moves the window). */
export function logoIn(y: u16): void {
  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
  let r: u16 = 0
  while (r < LOGO_H) {
    mapRow(LOGO_MAP_BANK, 0xc000 + r * 128, 1, y + r)
    r++
  }
}
