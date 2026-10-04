/**
 * The game kit's pictures (docs/elec16-play.md section 10): PNG images, already decoded to
 * RGBA, turned into what PLAY-320's tile engine reads - palettes of sixteen RGB555 colours,
 * 8x8 tiles of four-bit points and background maps of cell words. A colour is matched exactly
 * (at RGB555) to its palette, and a point that matches none is an error that says where:
 * a picture is drawn for its palette, never quantised behind the artist's back. Pure.
 */

export interface Picture {
  width: number
  height: number
  /** RGBA, four bytes a point, rows from the top. */
  data: Uint8Array
}

export class PictureError extends Error {}

export const rgb555 = (r: number, g: number, b: number): number =>
  (r >> 3) | ((g >> 3) << 5) | ((b >> 3) << 10)

/** A palette: its sixteen colours as RGB555 (colour 0 is the clear one). */
export type Palette = number[]

/** Each row of a palette picture (16 points wide) is a palette, from the top. */
export function readPalettes(p: Picture): Palette[] {
  if (p.width !== 16) throw new PictureError('a palette picture is 16 points wide')
  const out: Palette[] = []
  for (let y = 0; y < p.height; y++) {
    const row: number[] = []
    for (let x = 0; x < 16; x++) {
      const at = (y * p.width + x) * 4
      row.push(rgb555(p.data[at] ?? 0, p.data[at + 1] ?? 0, p.data[at + 2] ?? 0))
    }
    out.push(row)
  }
  return out
}

/** A point's colour index in a palette: clear (alpha under half) is 0; null when none matches. */
function indexIn(p: Picture, x: number, y: number, palette: Palette): number | null {
  const at = (y * p.width + x) * 4
  if ((p.data[at + 3] ?? 0) < 128) return 0
  const c = rgb555(p.data[at] ?? 0, p.data[at + 1] ?? 0, p.data[at + 2] ?? 0)
  for (let k = 1; k < 16; k++) if (palette[k] === c) return k
  return null
}

/** One 8x8 tile's 64 indices from (x, y), or null when a point is in none of the palette. */
function tileIndices(p: Picture, x0: number, y0: number, palette: Palette): number[] | null {
  const out: number[] = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const k = indexIn(p, x0 + x, y0 + y, palette)
      if (k === null) return null
      out.push(k)
    }
  }
  return out
}

/** 64 indices as the engine's 32 bytes: four a row, the left point in the high half. */
export function tileBytes(indices: number[]): number[] {
  const out: number[] = []
  for (let k = 0; k < 64; k += 2) out.push(((indices[k] ?? 0) << 4) | (indices[k + 1] ?? 0))
  return out
}

function where(p: Picture, x: number, y: number, palette: Palette): string {
  for (let yy = y; yy < y + 8; yy++) {
    for (let xx = x; xx < x + 8; xx++) {
      if (indexIn(p, xx, yy, palette) === null) {
        const at = (yy * p.width + xx) * 4
        const rgb = [0, 1, 2].map((c) => (p.data[at + c] ?? 0).toString(16).padStart(2, '0'))
        return `(${xx}, ${yy}) is #${rgb.join('')}, not in its palette`
      }
    }
  }
  return `(${x}, ${y})`
}

export interface Sheet {
  /** Every frame's tiles, frame after frame: a 16x16 frame is four tiles, row by row. */
  bytes: Uint8Array
  frames: number
  tilesPerFrame: number
}

/**
 * A sprite sheet: frames of `cell` x `cell` points (8, 16 or 32) read left to right, top to
 * bottom, in one palette; `count` frames, or every one the picture holds.
 */
export function readSheet(p: Picture, cell: 8 | 16 | 32, palette: Palette, count?: number): Sheet {
  if (p.width % cell !== 0 || p.height % cell !== 0) {
    throw new PictureError(`a sheet of ${cell}-point frames is a whole number of them`)
  }
  const across = p.width / cell
  const total = across * (p.height / cell)
  const frames = count ?? total
  if (frames > total) throw new PictureError(`${frames} frames, but the picture holds ${total}`)
  const out: number[] = []
  for (let f = 0; f < frames; f++) {
    const fx = (f % across) * cell
    const fy = Math.floor(f / across) * cell
    for (let ty = 0; ty < cell; ty += 8) {
      for (let tx = 0; tx < cell; tx += 8) {
        const t = tileIndices(p, fx + tx, fy + ty, palette)
        if (t === null) throw new PictureError(where(p, fx + tx, fy + ty, palette))
        out.push(...tileBytes(t))
      }
    }
  }
  return { bytes: Uint8Array.from(out), frames, tilesPerFrame: (cell / 8) ** 2 }
}

export interface TileMap {
  /** The distinct tiles, 32 bytes each. */
  tiles: Uint8Array
  /** Cell words, row by row from the top: tile (from `firstTile`), palette, flips. */
  cells: Uint16Array
  width: number
  height: number
}

const flipH = (t: number[]) => {
  const out: number[] = []
  for (let y = 0; y < 8; y++) for (let x = 7; x >= 0; x--) out.push(t[y * 8 + x] ?? 0)
  return out
}
const flipV = (t: number[]) => {
  const out: number[] = []
  for (let y = 7; y >= 0; y--) for (let x = 0; x < 8; x++) out.push(t[y * 8 + x] ?? 0)
  return out
}

/**
 * A background: each 8x8 cell in the first of `palettes` (by slot, 0-7) that has all its
 * colours, its tile shared with any cell alike - flipped too - and numbered from `firstTile`.
 * A cell all clear is tile `firstTile`, kept first, so a map can be cleared with it.
 */
export function readMap(
  p: Picture,
  palettes: { slot: number; palette: Palette }[],
  firstTile: number,
): TileMap {
  if (p.width % 8 !== 0 || p.height % 8 !== 0) throw new PictureError('a map is whole cells')
  const width = p.width / 8
  const height = p.height / 8
  const clear = new Array<number>(64).fill(0)
  const tiles: number[][] = [clear]
  const known = new Map<string, number>([[clear.join(','), 0]])
  const cells = new Uint16Array(width * height)
  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) {
      const placed = palettes.find(
        ({ palette }) => tileIndices(p, cx * 8, cy * 8, palette) !== null,
      )
      if (placed === undefined) {
        const why = where(p, cx * 8, cy * 8, palettes[0]?.palette ?? [])
        throw new PictureError(`cell (${cx}, ${cy}) fits none of its palettes: ${why}`)
      }
      const t = tileIndices(p, cx * 8, cy * 8, placed.palette) ?? clear
      cells[cy * width + cx] = cellOf(t, tiles, known, firstTile) | (placed.slot << 10)
    }
  }
  return { tiles: Uint8Array.from(tiles.flatMap(tileBytes)), cells, width, height }
}

/** A cell's word for tile `t`: a tile already known, maybe flipped, or a new one. */
function cellOf(t: number[], tiles: number[][], known: Map<string, number>, first: number): number {
  const h = flipH(t)
  const v = flipV(t)
  const hv = flipV(h)
  for (const [shape, flips] of [
    [t, 0],
    [h, 1],
    [v, 2],
    [hv, 3],
  ] as const) {
    const k = known.get(shape.join(','))
    if (k !== undefined) return (first + k) | (flips << 13)
  }
  known.set(t.join(','), tiles.length)
  tiles.push(t)
  return first + tiles.length - 1
}
