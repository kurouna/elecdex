import { screenText } from '@shared/elec16/font'
import {
  BITMAP_HEIGHT,
  BITMAP_ROW,
  BITMAP_WIDTH,
  PALETTE_AT,
  VCTRL_MODE_SHIFT,
  VCTRL_ON,
  VIDEO_MODE,
  type VideoState,
} from '@shared/elec16/video'
import { paintTiles, pixelWords, rgba555 } from './tile-painter.js'

/**
 * PLAY-320's screen as pixels (docs/elec16-play.md section 4): mode 0's bitmap coloured by
 * palette 0, at the machine's own 320 x 288, for a canvas scaled up crisp - and the same dots
 * read back through the font, for a screen reader and the tests. Pure: the page draws what
 * this gives.
 */

export type Rgb = readonly [number, number, number]

/** What a screen switched off shows: the glass, dark. */
export const DARK: Rgb = [0, 0, 0]

/** An RGB555 colour (red in the low bits) in eight bits a channel, white as 255. */
export function rgbOf(c: number): Rgb {
  const w = rgba555(c)
  return [w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff]
}

/** Palette 0's colour `k` in `mem` as an RGBA word. */
const paletteWord = (mem: Uint8Array, k: number): number => {
  const at = PALETTE_AT + k * 2
  return rgba555((mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8))
}

/** Palette 0's colour `k`, as the video memory holds it. */
export function paletteColour(v: VideoState, k: number): Rgb {
  const at = PALETTE_AT + k * 2
  return rgbOf((v.mem[at] ?? 0) | ((v.mem[at + 1] ?? 0) << 8))
}

/**
 * What the screen shows: the bitmap (mode 0), the tile engine (mode 1), nothing but colour 0
 * (a mode there is not), or dark.
 */
export function screenShows(
  v: VideoState | null,
  off: boolean,
): 'bitmap' | 'tiles' | 'ground' | 'dark' {
  if (v === null || off || (v.ctrl & VCTRL_ON) === 0) return 'dark'
  const mode = v.ctrl >> VCTRL_MODE_SHIFT
  if (mode === VIDEO_MODE.bitmap) return 'bitmap'
  return mode === VIDEO_MODE.tiles ? 'tiles' : 'ground'
}

/**
 * What `paintPlay` would draw, as one number: the frame last finished in mode 1 (drawn whole
 * frames at a time), else the screen's count of changes. A page paints when it moves.
 */
export function paintKey(v: VideoState | null, off: boolean, revision: number): number {
  return v !== null && screenShows(v, off) === 'tiles' && v.tiles.last.latched
    ? -1 - v.tiles.last.serial
    : revision
}

/** Mode 0's four colours as RGBA words, kept from one frame to the next. */
const four = new Uint32Array(4)

/** Every dot into `out` (RGBA, 320 x 288). */
export function paintPlay(v: VideoState | null, off: boolean, out: Uint8ClampedArray): void {
  const shows = screenShows(v, off)
  if (v !== null && shows === 'tiles') {
    // The frame last finished, its memory as it ended when it was latched (video.ts).
    const last = v.tiles.last
    paintTiles(last.latched ? last.mem : v.mem, last, out)
    return
  }
  const words = pixelWords(out)
  if (v === null || shows !== 'bitmap') {
    words.fill(shows === 'dark' || v === null ? DARK_WORD : paletteWord(v.mem, 0))
    return
  }
  const mem = v.mem
  for (let k = 0; k < 4; k++) four[k] = paletteWord(mem, k)
  let o = 0
  for (let at = 0; at < BITMAP_ROW * BITMAP_HEIGHT; at++) {
    const b = mem[at] as number
    words[o] = four[b >> 6] as number
    words[o + 1] = four[(b >> 4) & 3] as number
    words[o + 2] = four[(b >> 2) & 3] as number
    words[o + 3] = four[b & 3] as number
    o += 4
  }
}

/** DARK as an RGBA word. */
const DARK_WORD = (0xff << 24) >>> 0

/** The text on the bitmap, row by row, read through the font: a dot is any colour but 0. */
export function playText(mem: ArrayLike<number>): string[] {
  const columns = new Uint8Array(BITMAP_WIDTH * (BITMAP_HEIGHT / 8))
  for (let y = 0; y < BITMAP_HEIGHT; y++) {
    for (let x = 0; x < BITMAP_WIDTH; x++) {
      const dot = ((mem[y * BITMAP_ROW + (x >> 2)] ?? 0) >> (6 - (x & 3) * 2)) & 3
      const at = (y >> 3) * BITMAP_WIDTH + x
      if (dot !== 0) columns[at] = (columns[at] ?? 0) | (1 << (y & 7))
    }
  }
  return screenText(columns, BITMAP_WIDTH, BITMAP_HEIGHT).map((row) => row.trimEnd())
}
