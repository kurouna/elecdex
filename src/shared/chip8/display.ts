/**
 * The CHIP-8 screen: sprites drawn by XOR, clearing, scrolling and the two resolutions
 * (docs/architecture.md section 5.18). What Octo does, which is what the chip8Archive
 * programs were written against.
 *
 * Every operation acts only on the planes selected (`plane`, XO-CHIP's FN01), and bumps
 * `screenRevision` when it may have changed a dot.
 */

import { type Chip8State, peek } from './state.js'
import { HIRES, LORES } from './types.js'

export const screenWidth = (s: Chip8State): number => (s.hires ? HIRES.w : LORES.w)
export const screenHeight = (s: Chip8State): number => (s.hires ? HIRES.h : LORES.h)

/** 00FE / 00FF: a new resolution starts from a clear screen, as in Octo. */
export function setResolution(s: Chip8State, hires: boolean): void {
  s.hires = hires
  s.pixels.fill(0)
  s.screenRevision++
}

/** 00E0: the selected planes go dark. */
export function clearPlanes(s: Chip8State): void {
  const keep = ~s.plane & 3
  const size = screenWidth(s) * screenHeight(s)
  for (let k = 0; k < size; k++) s.pixels[k] = (s.pixels[k] ?? 0) & keep
  s.screenRevision++
}

/**
 * Moves the selected planes by (dx, dy) dots; what comes in from outside is dark.
 * The planes not selected stay where they are.
 */
export function scroll(s: Chip8State, dx: number, dy: number): void {
  const w = screenWidth(s)
  const h = screenHeight(s)
  const mask = s.plane & 3
  const px = s.pixels
  // In place, walking against the move so every dot is read before it is written over: a
  // copy of the screen per scroll cost an 8 KB allocation each time, and a program scrolling
  // in a loop spent seconds on it (a preview run in main, measured).
  for (let j = 0; j < h; j++) {
    const y = dy > 0 ? h - 1 - j : j
    const from = y - dy
    for (let i = 0; i < w; i++) {
      const x = dx > 0 ? w - 1 - i : i
      const fx = x - dx
      const inside = from >= 0 && from < h && fx >= 0 && fx < w
      const value = inside ? (px[from * w + fx] ?? 0) & mask : 0
      px[y * w + x] = ((px[y * w + x] ?? 0) & ~mask) | value
    }
  }
  s.screenRevision++
}

/** Where a sprite goes: its bytes, its top-left dot and its shape. */
interface Sprite {
  address: number
  x: number
  y: number
  rows: number
  /** SUPER-CHIP's 16 x 16, two bytes a row; otherwise 8 wide, one byte a row. */
  wide: boolean
}

/** One row of a sprite, as a bit pattern with its leftmost dot in the highest bit. */
function spriteRow(s: Chip8State, sprite: Sprite, row: number): number {
  const { address, wide } = sprite
  return wide
    ? (peek(s, address + row * 2) << 8) | peek(s, address + row * 2 + 1)
    : peek(s, address + row)
}

/** XORs one row into one plane at screen row `y`. Returns whether a lit dot went dark. */
function drawRow(
  s: Chip8State,
  bit: number,
  bits: number,
  x0: number,
  y: number,
  cols: number,
): boolean {
  const w = screenWidth(s)
  const at0 = (y % screenHeight(s)) * w
  let collided = false
  for (let col = 0; col < cols; col++) {
    if (!(bits & (1 << (cols - 1 - col)))) continue
    const x = x0 + col
    if (s.config.quirks.clip && x >= w) break
    const at = at0 + (x % w)
    const was = s.pixels[at] ?? 0
    if (was & bit) collided = true
    s.pixels[at] = was ^ bit
  }
  return collided
}

/** XORs one sprite into one plane. Returns whether a lit dot went dark. */
function drawPlane(s: Chip8State, bit: number, sprite: Sprite): boolean {
  const h = screenHeight(s)
  const cols = sprite.wide ? 16 : 8
  let collided = false
  for (let row = 0; row < sprite.rows; row++) {
    const y = sprite.y + row
    if (s.config.quirks.clip && y >= h) break
    if (drawRow(s, bit, spriteRow(s, sprite, row), sprite.x, y, cols)) collided = true
  }
  return collided
}

/**
 * DXYN: an 8 x N sprite from I, or with N = 0 a 16 x 16 one (SUPER-CHIP, in both
 * resolutions as Octo draws it). The start wraps onto the screen; the rest wraps or is
 * cut at the edge (`clip`). With both planes selected, the second plane's sprite follows
 * the first in memory. VF says whether any lit dot went dark.
 */
export function drawSprite(s: Chip8State, x: number, y: number, n: number): void {
  const wide = n === 0
  const bytes = wide ? 32 : n
  const sprite: Sprite = {
    address: s.i,
    x: x % screenWidth(s),
    y: y % screenHeight(s),
    rows: wide ? 16 : n,
    wide,
  }
  let collided = false
  for (const bit of [1, 2]) {
    if (!(s.plane & bit)) continue
    if (drawPlane(s, bit, sprite)) collided = true
    sprite.address += bytes
  }
  s.v[0xf] = collided ? 1 : 0
  s.screenRevision++
}
