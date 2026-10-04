import {
  BG0_MAP,
  BG1_MAP,
  BITMAP_HEIGHT,
  BITMAP_WIDTH,
  LAYER,
  MAP_SIZE,
  PALETTE_AT,
  type Raster,
  type RasterWrite,
  rasterLines,
  SPRITE_BYTES,
  SPRITE_PALETTES,
  SPRITES,
  SPRITES_A_LINE,
  SPRITES_AT,
  TILE_BYTES,
  TILES_AT,
} from '@shared/elec16/video'

/**
 * PLAY-320's mode 1 as pixels (docs/elec16-play.md section 4): two backgrounds of 4-bit tiles
 * scrolled over a 512 x 512 field, 128 sprites of 8, 16 or 32 dots, sixteen palettes - each
 * line drawn with the scrolls and layers in force on it (what the program wrote, line by line,
 * in the frame last finished). Pure: the page puts what this gives on a canvas.
 *
 * From the back: the backdrop (palette 0's colour 0), sprites marked behind, BG0, BG1, the
 * sprites, BG0's tiles marked in front, BG1's. Colour 0 is clear on every layer; of two
 * sprites, the lower number is in front; a line shows its first 32 sprites by number.
 */

const CELL_TILE = 0x3ff
const CELL_FLIP_X = 1 << 13
const CELL_FLIP_Y = 1 << 14
/** A background cell in front of the sprites; a sprite behind the backgrounds. */
const CELL_FRONT = 1 << 15

/** A sprite as its table entry says, while it is shown. */
interface Sprite {
  x: number
  y: number
  size: number
  tile: number
  palette: number
  flipX: boolean
  flipY: boolean
  behind: boolean
}

const signed = (v: number): number => (v << 16) >> 16
const word = (mem: Uint8Array, at: number): number => (mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)

/** Every colour of the sixteen palettes as RGBA in one 32-bit word (little-endian bytes). */
function colours(mem: Uint8Array): Uint32Array {
  const out = new Uint32Array(256)
  const wide = (v: number) => (v << 3) | (v >> 2)
  for (let k = 0; k < 256; k++) {
    const c = word(mem, PALETTE_AT + k * 2)
    out[k] = (0xff << 24) | (wide((c >> 10) & 31) << 16) | (wide((c >> 5) & 31) << 8) | wide(c & 31)
  }
  return out
}

/** The sprites shown (size 0-2), by number. */
function sprites(mem: Uint8Array): (Sprite | null)[] {
  const list: (Sprite | null)[] = []
  for (let k = 0; k < SPRITES; k++) {
    const at = SPRITES_AT + k * SPRITE_BYTES
    const size = word(mem, at + 6)
    if (size > 2) {
      list.push(null)
      continue
    }
    const t = word(mem, at + 4)
    list.push({
      x: signed(word(mem, at)),
      y: signed(word(mem, at + 2)),
      size: 8 << size,
      tile: t & CELL_TILE,
      palette: SPRITE_PALETTES + ((t >> 10) & 7),
      flipX: (t & CELL_FLIP_X) !== 0,
      flipY: (t & CELL_FLIP_Y) !== 0,
      behind: (t & CELL_FRONT) !== 0,
    })
  }
  return list
}

/**
 * The sprites on each line: the first 32 by number. Each sprite goes on the lines it covers,
 * in number order, once a frame - not every sprite looked at on every line.
 */
function spritesByLine(list: readonly (Sprite | null)[]): Sprite[][] {
  const lines: Sprite[][] = Array.from({ length: BITMAP_HEIGHT }, () => [])
  for (const s of list) {
    if (s === null) continue
    const from = Math.max(0, s.y)
    const to = Math.min(BITMAP_HEIGHT, s.y + s.size)
    for (let y = from; y < to; y++) {
      const line = lines[y] as Sprite[]
      if (line.length < SPRITES_A_LINE) line.push(s)
    }
  }
  return lines
}

/** Line buffers, reused: a dot's palette entry (0-255), -1 clear; the front or behind flags. */
const bg0 = new Int16Array(BITMAP_WIDTH)
const bg1 = new Int16Array(BITMAP_WIDTH)
const spr = new Int16Array(BITMAP_WIDTH)
const bg0Front = new Uint8Array(BITMAP_WIDTH)
const bg1Front = new Uint8Array(BITMAP_WIDTH)
const sprBehind = new Uint8Array(BITMAP_WIDTH)

/** A background's line y into `dots` and `front`, a tile's eight dots at a time. */
function bgLine(
  mem: Uint8Array,
  map: number,
  sx: number,
  sy: number,
  y: number,
  dots: Int16Array,
  front: Uint8Array,
): void {
  const my = (y + sy) & 511
  const rowAt = map + (my >> 3) * MAP_SIZE * 2
  for (let x = 0; x < BITMAP_WIDTH; ) {
    const mx = (x + sx) & 511
    const at = rowAt + (mx >> 3) * 2
    const cell = (mem[at] as number) | ((mem[at + 1] as number) << 8)
    const py = (cell & CELL_FLIP_Y) !== 0 ? 7 - (my & 7) : my & 7
    tileRow(mem, TILES_AT + (cell & CELL_TILE) * TILE_BYTES + py * 4, (cell & CELL_FLIP_X) !== 0)
    const palette = ((cell >> 10) & 7) * 16
    const isFront = (cell & CELL_FRONT) !== 0 ? 1 : 0
    // The rest of this tile on the line: from mx's column to its right edge.
    for (let c = mx & 7; c < 8 && x < BITMAP_WIDTH; c++, x++) {
      const index = row[c] as number
      dots[x] = index === 0 ? -1 : palette + index
      front[x] = isFront
    }
  }
}

/** A tile's row of eight colours, from its four bytes, into `row` (turned over when flipped). */
const row = new Uint8Array(8)
function tileRow(mem: Uint8Array, at: number, flipX: boolean): void {
  for (let k = 0; k < 4; k++) {
    const b = mem[at + k] as number
    if (flipX) {
      row[7 - k * 2] = b >> 4
      row[6 - k * 2] = b & 15
    } else {
      row[k * 2] = b >> 4
      row[k * 2 + 1] = b & 15
    }
  }
}

/** The sprites on line y into `spr` and `sprBehind`: the lower number drawn last, so in front. */
function spriteLine(mem: Uint8Array, on: readonly Sprite[], y: number): void {
  spr.fill(-1)
  for (let k = on.length - 1; k >= 0; k--) drawSprite(mem, on[k] as Sprite, y)
}

/** One sprite's dots on line y, over what is in `spr`. */
function drawSprite(mem: Uint8Array, s: Sprite, y: number): void {
  const dy = s.flipY ? s.size - 1 - (y - s.y) : y - s.y
  const rowTile = s.tile + (dy >> 3) * (s.size >> 3)
  const behind = s.behind ? 1 : 0
  const to = Math.min(BITMAP_WIDTH, s.x + s.size)
  for (let x = Math.max(0, s.x); x < to; x++) {
    const dx = s.flipX ? s.size - 1 - (x - s.x) : x - s.x
    const tile = (rowTile + (dx >> 3)) & CELL_TILE
    const b = mem[TILES_AT + tile * TILE_BYTES + (dy & 7) * 4 + ((dx & 7) >> 1)] as number
    const index = (dx & 1) === 0 ? b >> 4 : b & 15
    if (index === 0) continue
    spr[x] = s.palette * 16 + index
    sprBehind[x] = behind
  }
}

/** The palette entry a dot shows, the layers in their order (see the top of the file). */
function pick(x: number): number {
  const a = bg0[x] as number
  const b = bg1[x] as number
  const s = spr[x] as number
  if (b >= 0 && bg1Front[x] === 1) return b
  if (a >= 0 && bg0Front[x] === 1) return a
  if (s >= 0 && sprBehind[x] === 0) return s
  if (b >= 0) return b
  if (a >= 0) return a
  return s >= 0 ? s : 0
}

/**
 * Every dot of mode 1 into `out` (RGBA, 320 x 288), each line with the registers in force on it
 * in `frame`, the frame last finished.
 */
export function paintTiles(
  mem: Uint8Array,
  frame: { start: Raster; log: readonly RasterWrite[] },
  out: Uint8ClampedArray,
): void {
  const pixels = new Uint32Array(out.buffer, out.byteOffset, BITMAP_WIDTH * BITMAP_HEIGHT)
  const palette = colours(mem)
  const byLine = spritesByLine(sprites(mem))
  const lines = rasterLines(frame)
  for (let y = 0; y < BITMAP_HEIGHT; y++) {
    const r = lines[y] as Raster
    // A layer turned off is clear on this line.
    if ((r.layers & LAYER.bg0) !== 0)
      bgLine(mem, BG0_MAP, r.scroll[0], r.scroll[1], y, bg0, bg0Front)
    else bg0.fill(-1)
    if ((r.layers & LAYER.bg1) !== 0)
      bgLine(mem, BG1_MAP, r.scroll[2], r.scroll[3], y, bg1, bg1Front)
    else bg1.fill(-1)
    if ((r.layers & LAYER.sprites) !== 0) spriteLine(mem, byLine[y] as Sprite[], y)
    else spr.fill(-1)
    const at = y * BITMAP_WIDTH
    for (let x = 0; x < BITMAP_WIDTH; x++) pixels[at + x] = palette[pick(x)] as number
  }
}
