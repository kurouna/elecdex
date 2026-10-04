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
  const wide = (v: number) => (v << 3) | (v >> 2)
  return [wide(c & 31), wide((c >> 5) & 31), wide((c >> 10) & 31)]
}

/** Palette 0's colour `k`, as the video memory holds it. */
export function paletteColour(v: VideoState, k: number): Rgb {
  const at = PALETTE_AT + k * 2
  return rgbOf((v.mem[at] ?? 0) | ((v.mem[at + 1] ?? 0) << 8))
}

/** What the screen shows: the bitmap (mode 0), nothing but colour 0 (another mode), or dark. */
export function screenShows(v: VideoState | null, off: boolean): 'bitmap' | 'ground' | 'dark' {
  if (v === null || off || (v.ctrl & VCTRL_ON) === 0) return 'dark'
  return v.ctrl >> VCTRL_MODE_SHIFT === VIDEO_MODE.bitmap ? 'bitmap' : 'ground'
}

/** Every dot into `out` (RGBA, 320 x 288). */
export function paintPlay(v: VideoState | null, off: boolean, out: Uint8ClampedArray): void {
  const shows = screenShows(v, off)
  if (v === null || shows !== 'bitmap') {
    fill(out, shows === 'dark' || v === null ? DARK : paletteColour(v, 0))
    return
  }
  const colours = [0, 1, 2, 3].map((k) => paletteColour(v, k))
  const mem = v.mem
  let o = 0
  for (let at = 0; at < BITMAP_ROW * BITMAP_HEIGHT; at++) {
    const b = mem[at] ?? 0
    for (let shift = 6; shift >= 0; shift -= 2) {
      const [r, g, bl] = colours[(b >> shift) & 3] as Rgb
      out[o] = r
      out[o + 1] = g
      out[o + 2] = bl
      out[o + 3] = 255
      o += 4
    }
  }
}

function fill(out: Uint8ClampedArray, [r, g, b]: Rgb): void {
  for (let o = 0; o < out.length; o += 4) {
    out[o] = r
    out[o + 1] = g
    out[o + 2] = b
    out[o + 3] = 255
  }
}

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
