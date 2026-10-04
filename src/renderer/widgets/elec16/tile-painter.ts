import {
  BG0_MAP,
  BG1_MAP,
  BITMAP_HEIGHT,
  BITMAP_WIDTH,
  LAYER,
  MAP_SIZE,
  MAX_TILES,
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
 *
 * How it is quick (measured in docs/decisions.md): the tiles' four-bit dots are unpacked once
 * into a cache of a byte a dot and unpacked again only when a tile's bytes change; each line is
 * built by drawing its layers from the back, each over the last, so no dot weighs every layer;
 * and a background cell all clear is passed over whole.
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
  /** The sprite's palette's first entry (0-255). */
  base: number
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

/* ---------------- the tiles, unpacked ---------------- */

/**
 * The tiles as a byte a dot (64 a tile, rows from the top), a copy of the bytes they were
 * unpacked from, and whether each is all clear. Kept between frames for one video memory.
 */
const dots = new Uint8Array(MAX_TILES * 64)
const packed = new Uint8Array(MAX_TILES * TILE_BYTES)
const clear = new Uint8Array(MAX_TILES)
let cachedFor: Uint8Array | null = null

/** Unpacks the tiles whose bytes changed since the last frame (all of them for a new memory). */
function refreshTiles(mem: Uint8Array): void {
  const fresh = cachedFor !== mem
  cachedFor = mem
  const now = new Uint32Array(mem.buffer, mem.byteOffset + TILES_AT, (MAX_TILES * TILE_BYTES) / 4)
  const was = new Uint32Array(packed.buffer)
  for (let t = 0; t < MAX_TILES; t++) {
    const w = t * 8
    if (!fresh && sameTile(now, was, w)) continue
    for (let k = 0; k < 8; k++) was[w + k] = now[w + k] as number
    unpack(mem, t)
  }
}

function sameTile(now: Uint32Array, was: Uint32Array, w: number): boolean {
  for (let k = 0; k < 8; k++) if (now[w + k] !== was[w + k]) return false
  return true
}

/** Tile t's 64 dots into the cache; noted when every one is clear. */
function unpack(mem: Uint8Array, t: number): void {
  let any = 0
  const from = TILES_AT + t * TILE_BYTES
  for (let k = 0; k < TILE_BYTES; k++) {
    const b = mem[from + k] as number
    dots[t * 64 + k * 2] = b >> 4
    dots[t * 64 + k * 2 + 1] = b & 15
    any |= b
  }
  clear[t] = any === 0 ? 1 : 0
}

/* ---------------- sprites ---------------- */

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
      base: (SPRITE_PALETTES + ((t >> 10) & 7)) * 16,
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

/**
 * One sprite's dots on line y into `spr` (palette entries), over what is there, with whether
 * it is behind. The highest number is drawn first, so the lowest ends in front.
 */
function drawSprite(s: Sprite, y: number): void {
  const dy = s.flipY ? s.size - 1 - (y - s.y) : y - s.y
  const rowTile = s.tile + (dy >> 3) * (s.size >> 3)
  const inTile = (dy & 7) * 8
  const behind = s.behind ? 1 : 0
  const to = Math.min(BITMAP_WIDTH, s.x + s.size)
  for (let x = Math.max(0, s.x); x < to; x++) {
    const dx = s.flipX ? s.size - 1 - (x - s.x) : x - s.x
    const index = dots[((rowTile + (dx >> 3)) & CELL_TILE) * 64 + inTile + (dx & 7)] as number
    if (index === 0) continue
    spr[x] = s.base + index
    sprBehind[x] = behind
  }
}

/* ---------------- a line, layer by layer ---------------- */

/** The line being built: a palette entry a dot. */
const line = new Int16Array(BITMAP_WIDTH)
/** The line's sprites alone, in number order (-1 none), and which dots are behind. */
const spr = new Int16Array(BITMAP_WIDTH)
const sprBehind = new Uint8Array(BITMAP_WIDTH)
/** Where on the line the sprites are, and whether any is behind. */
let sprFrom = 0
let sprTo = 0
let anyBehind = false

/**
 * The cells of each background in front of the sprites on this line, kept while drawing the
 * cells behind them so the front pass need not walk the line again: four numbers a cell
 * (where the tile's row starts in the cache with its flip, its palette, its columns, x).
 */
const fronts = [new Int32Array(42 * 4), new Int32Array(42 * 4)]
const frontCount = [0, 0]

/**
 * A background's cells on line y into `line`, those behind the sprites now; those in front are
 * kept in `fronts[layer]` for `frontLine`. A clear cell is passed over whole; a dot of colour 0
 * leaves what is under it.
 */
function bgLine(mem: Uint8Array, layer: number, sx: number, sy: number, y: number): void {
  const my = (y + sy) & 511
  const rowAt = (layer === 0 ? BG0_MAP : BG1_MAP) + (my >> 3) * MAP_SIZE * 2
  const kept = fronts[layer] as Int32Array
  let n = 0
  for (let x = 0; x < BITMAP_WIDTH; ) {
    const mx = (x + sx) & 511
    const cell = word(mem, rowAt + (mx >> 3) * 2)
    // The rest of this cell on the line: from mx's column to its right edge.
    const start = mx & 7
    const end = Math.min(8, start + BITMAP_WIDTH - x)
    const tile = cell & CELL_TILE
    if (clear[tile] === 0) {
      const py = (cell & CELL_FLIP_Y) !== 0 ? 7 - (my & 7) : my & 7
      const at = (tile * 64 + py * 8) * 2 + ((cell & CELL_FLIP_X) !== 0 ? 1 : 0)
      const base = ((cell >> 10) & 7) * 16
      if ((cell & CELL_FRONT) === 0) cellRow(at, base, start | (end << 4), x)
      else {
        const o = n * 4
        kept[o] = at
        kept[o + 1] = base
        kept[o + 2] = start | (end << 4)
        kept[o + 3] = x
        n++
      }
    }
    x += end - start
  }
  frontCount[layer] = n
}

/** The cells in front kept by `bgLine` for this layer, onto the line. */
function frontLine(layer: number): void {
  const kept = fronts[layer] as Int32Array
  for (let k = 0; k < (frontCount[layer] as number); k++) {
    const o = k * 4
    cellRow(kept[o] as number, kept[o + 1] as number, kept[o + 2] as number, kept[o + 3] as number)
  }
}

/**
 * Columns start..end-1 (`span`: start in the low four bits, end above) of a tile's row onto the
 * line from x: `at` is the row's place in the cache, twice over, plus 1 when it is flipped.
 */
function cellRow(at: number, base: number, span: number, x: number): void {
  const row = at >> 1
  const flip = (at & 1) === 1
  let o = x
  for (let c = span & 15; c < span >> 4; c++, o++) {
    const index = dots[row + (flip ? 7 - c : c)] as number
    if (index !== 0) line[o] = base + index
  }
}

/**
 * The line's sprites into `spr`, the lowest number in front of the rest whether or not it is
 * behind the backgrounds; where they lie, and whether any is behind, kept for laying them in.
 */
function spriteLine(on: readonly Sprite[], y: number): void {
  sprFrom = BITMAP_WIDTH
  sprTo = 0
  anyBehind = false
  if (on.length === 0) return
  for (let k = on.length - 1; k >= 0; k--) {
    const s = on[k] as Sprite
    sprFrom = Math.min(sprFrom, Math.max(0, s.x))
    sprTo = Math.max(sprTo, Math.min(BITMAP_WIDTH, s.x + s.size))
    if (s.behind) anyBehind = true
  }
  spr.fill(-1, sprFrom, sprTo)
  for (let k = on.length - 1; k >= 0; k--) drawSprite(on[k] as Sprite, y)
}

/** The sprites' dots that are (1) or are not (0) behind the backgrounds, onto the line. */
function layInSprites(behind: number): void {
  for (let x = sprFrom; x < sprTo; x++) {
    const v = spr[x] as number
    if (v >= 0 && sprBehind[x] === behind) line[x] = v
  }
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
  refreshTiles(mem)
  const byLine = spritesByLine(sprites(mem))
  const lines = rasterLines(frame)
  for (let y = 0; y < BITMAP_HEIGHT; y++) {
    paintLine(mem, lines[y] as Raster, byLine[y] as Sprite[], y)
    const at = y * BITMAP_WIDTH
    for (let x = 0; x < BITMAP_WIDTH; x++) pixels[at + x] = palette[line[x] as number] as number
  }
}

/** Line y from the back: the backdrop, behind sprites, BG0, BG1, sprites, the fronts. */
function paintLine(mem: Uint8Array, r: Raster, on: readonly Sprite[], y: number): void {
  line.fill(0)
  const bg0 = (r.layers & LAYER.bg0) !== 0
  const bg1 = (r.layers & LAYER.bg1) !== 0
  const sprites_ = (r.layers & LAYER.sprites) !== 0
  if (sprites_) spriteLine(on, y)
  else sprTo = 0
  if (anyBehind && sprTo > 0) layInSprites(1)
  frontCount[0] = 0
  frontCount[1] = 0
  if (bg0) bgLine(mem, 0, r.scroll[0], r.scroll[1], y)
  if (bg1) bgLine(mem, 1, r.scroll[2], r.scroll[3], y)
  if (sprTo > 0) layInSprites(0)
  frontLine(0)
  frontLine(1)
}
