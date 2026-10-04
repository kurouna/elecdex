// ELECAIRCOMBAT's screen (docs/elec16-elecaircombat.md sections 3 and 4): the palettes in their
// slots, the cockpit on BG1 in front of everything, the displays' glass on BG0 under the
// panel, words on BG1, the shake - and the sky and sea, BG0 rewritten every frame from where
// the horizon lies: each cell's tile chosen by its centre's distance from the horizon
// (horizon.txt), a row at a time, rows that did not change left alone.
import {
  addr,
  asm,
  type bool,
  div,
  i16,
  peek16,
  poke16,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import {
  aim,
  BG0X,
  BG0Y,
  BG1X,
  BG1Y,
  bank,
  cellAt,
  cos,
  dma,
  IO_BANK,
  LAYERS,
  load,
  mapRow,
  mix,
  palCopy,
  palette,
  palKeep,
  palMix,
  sin,
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
import {
  abs16,
  bodyV,
  muldiv,
  mulq,
  persp,
  toBodyOf,
  V_PF,
  V_PR,
  V_PU,
  vec,
  vget,
} from './math.e16'

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
let cockpitOn: bool = false

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

/* ---------------- the shake and the flash ---------------- */

let shakeLeft: u16 = 0
export let shakeX: i16 = 0
export let shakeY: i16 = 0

export function shake(frames: u16): void {
  if (frames > shakeLeft) shakeLeft = frames
}

/** This frame's shake: every layer and sprite moved together. */
export function shakeStep(): void {
  shakeX = 0
  shakeY = 0
  if (shakeLeft > 0) {
    shakeLeft--
    const r = shakeLeft & 3
    const size = shakeSize()
    if (r === 0) shakeX = size
    else if (r === 2) shakeX = -size
    else if (r === 1) shakeY = size
    else shakeY = -size
  }
  scrollAll(shakeX, shakeY)
}

function shakeSize(): i16 {
  if (shakeLeft > 10) return 3
  return shakeLeft > 4 ? 2 : 1
}

let flashLeft: u16 = 0
let flashRgb: u16 = 0x7fff

/** The sky and the sprites tinted toward `rgb`, fading over `frames` (at most 16). */
export function flashScreen(frames: u16, rgb: u16): void {
  flashLeft = frames > 16 ? 16 : frames
  flashRgb = rgb
}

export function flashStep(): void {
  if (flashLeft === 0) return
  flashLeft--
  palMix(SL_SKY, flashRgb, flashLeft)
  palMix(SL_CLOUD, flashRgb, flashLeft)
  palMix(SL_ENEMY, flashRgb, flashLeft)
}

/* ---------------- the sky and the sea ---------------- */

/** The band table (tile words by distance, -RANGE to RANGE points) and the horizon's tiles. */
const RANGE = 400
export const hBand = words(801)
const hPart = words(221)
/** A row of tile words for BG0, and what each sky row last held when it was all one tile. */
const hRow = words(40)
const hRowWas = words(36)

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

/** The horizon on the screen, as the HUD reads it too: its normal (x 256) and distance. */
export let hNX: i16 = 0
export let hNY: i16 = -256
/** The horizon's distance from the boresight in 32nds of a point (the sky positive). */
export let hC: i16 = 0
/** The length of the up axes' part across the screen (Q14): small looking straight up or down. */
export let hL: i16 = 16384

/**
 * Where the horizon lies, from the player's axes: the sky is where a point's direction has the
 * world's up in it, (x - CX) R.z + (CY - y) U.z + FOCAL F.z > 0, a line on the screen.
 */
export function horizonFind(): void {
  const rz = vget(V_PR + 2)
  const uz = vget(V_PU + 2)
  const fz = vget(V_PF + 2)
  const a = aim(rz >> 6, -uz >> 6)
  hNX = cos(a)
  hNY = sin(a)
  hL = mulq(rz, hNX * 64) + mulq(-uz, hNY * 64)
  const far: i16 = 19200
  if (hL < 64 || u16(abs16(fz)) > u16(hL) * 3) hC = fz > 0 ? far : -far
  else {
    const c = i16(muldiv(u16(abs16(fz)), 6144, u16(hL)))
    hC = fz < 0 ? -c : c
  }
  partialIn((a + 64) & 255)
}

/** The horizon's tiles for the normal at angle `b` (0: the sky straight up) into the table. */
function partialIn(b: u16): void {
  let flips: u16 = 0
  let bc = b
  if (b > 192) {
    bc = 256 - b
    flips = 0x2000
  } else if (b > 128) {
    bc = b - 128
    flips = 0x6000
  } else if (b > 64) {
    bc = 128 - b
    flips = 0x4000
  }
  const row = ((bc + 2) >> 2) * 13
  let o: u16 = 0
  while (o < 13) {
    hBand[RANGE - 6 + o] = (HORIZON_TILE + hPart[row + o]) | flips
    o++
  }
}

/** BG0's sky rows for this frame. */
export function skyDraw(): void {
  horizonFind()
  const nx = hNX
  const ny = hNY
  // Row 0 is under the canopy's bow wherever the cockpit is shown.
  let r: u16 = cockpitOn ? 1 : 0
  const rows: u16 = cockpitOn ? SKY_ROWS : 36
  while (r < rows) {
    const s0 = (((i16(r * 2) - 27) * ny - 39 * nx) >> 1) + hC
    skyRow(r, s0, nx)
    r++
  }
}

/** One row: all one tile (a quick fill, or nothing when it already is), or cell by cell. */
function skyRow(r: u16, s0: i16, ds: i16): void {
  const w0 = hBand[bandAt(s0)]
  const w1 = hBand[bandAt(s0 + 39 * ds)]
  if (w0 === w1) {
    if (hRowWas[r] === w0) return
    hRowWas[r] = w0
    rowFill(w0)
  } else {
    hRowWas[r] = 0xffff
    const s1 = s0 + 39 * ds
    const lim: i16 = 12760
    if (s0 < lim && s0 > -lim && s1 < lim && s1 > -lim) rowCellsNear(s0, ds)
    else rowCells(s0, ds)
  }
  dma(addr(hRow), cellAt(0, 0, r), 80)
}

function bandAt(s: i16): u16 {
  let p = s >> 5
  if (p > RANGE) p = RANGE
  if (p < -RANGE) p = -RANGE
  return u16(p + RANGE)
}

/** The row buffer all one tile word. */
function rowFill(_w: u16): void {
  asm`
    li t0, hRow
    li t1, 40
.rf_next:
    sw a0, 0(t0)
    addi t0, t0, 2
    addi t1, t1, -1
    bnez t1, .rf_next
  `
}

/**
 * As `rowCells`, for a row that stays within the table (no clamping), eight cells at a time:
 * where the tiles at both ends of the eight are one (the table runs in order, so all eight
 * are), they are written at once; else cell by cell.
 */
function rowCellsNear(_s: i16, _ds: i16): void {
  asm`
    li a2, hRow
    li a3, 5
    li t1, hBand + 800
.rn_seg:
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t2, 0(t0)
    slli t3, a1, 3
    sub t3, t3, a1
    add t3, t3, a0
    srai t3, t3, 5
    slli t3, t3, 1
    add t3, t3, t1
    lw t3, 0(t3)
    bne t2, t3, .rn_cells
    sw t2, 0(a2)
    sw t2, 2(a2)
    sw t2, 4(a2)
    sw t2, 6(a2)
    sw t2, 8(a2)
    sw t2, 10(a2)
    sw t2, 12(a2)
    sw t2, 14(a2)
    slli t0, a1, 3
    add a0, a0, t0
    beq t2, t2, .rn_next
.rn_cells:
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 0(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 2(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 4(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 6(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 8(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 10(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 12(a2)
    add a0, a0, a1
    srai t0, a0, 5
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 14(a2)
    add a0, a0, a1
.rn_next:
    addi a2, a2, 16
    addi a3, a3, -1
    bnez a3, .rn_seg
  `
}

/** As `rowCellsNear`, each distance held to the table's ends (a row reaching past them). */
function rowCells(_s: i16, _ds: i16): void {
  asm`
    li a2, hRow
    li a3, 5
    li t1, hBand + 800
.rc_seg:
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t2, 0(t0)
    slli t3, a1, 3
    sub t3, t3, a1
    add t3, t3, a0
    srai t3, t3, 5
    li t0, 400
    min t3, t3, t0
    li t0, -400
    max t3, t3, t0
    slli t3, t3, 1
    add t3, t3, t1
    lw t3, 0(t3)
    bne t2, t3, .rc_cells
    sw t2, 0(a2)
    sw t2, 2(a2)
    sw t2, 4(a2)
    sw t2, 6(a2)
    sw t2, 8(a2)
    sw t2, 10(a2)
    sw t2, 12(a2)
    sw t2, 14(a2)
    slli t0, a1, 3
    add a0, a0, t0
    beq t2, t2, .rc_next
.rc_cells:
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 0(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 2(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 4(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 6(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 8(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 10(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 12(a2)
    add a0, a0, a1
    srai t0, a0, 5
    li t2, 400
    min t0, t0, t2
    li t2, -400
    max t0, t0, t2
    slli t0, t0, 1
    add t0, t0, t1
    lw t0, 0(t0)
    sw t0, 14(a2)
    add a0, a0, a1
.rc_next:
    addi a2, a2, 16
    addi a3, a3, -1
    bnez a3, .rc_seg
  `
}

/* ---------------- the player's view ---------------- */

/** A place in the player's axes (units): right, up, ahead. */
export let bodyX: i16 = 0
export let bodyY: i16 = 0
export let bodyZ: i16 = 0
/** Where `project` put it on the screen. */
export let scrX: i16 = 0
export let scrY: i16 = 0

/** The place in vector `p` (world, units, from the player) in the player's axes. */
export function toBody(p: u16): void {
  toBodyOf(addr(vec) + p * 2)
  bodyX = i16(bodyV[0])
  bodyY = i16(bodyV[1])
  bodyZ = i16(bodyV[2])
}

/** The body place onto the screen: whether it is ahead and within the screen's reach. */
export function project(): bool {
  if (bodyZ < 8) return false
  if (abs16(bodyX) > bodyZ || abs16(bodyY) > bodyZ) return false
  scrX = CX + persp(bodyX, bodyZ) + shakeX
  scrY = CY - persp(bodyY, bodyZ) + shakeY
  return true
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
