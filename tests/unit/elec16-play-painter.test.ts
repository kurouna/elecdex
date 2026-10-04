import { MODEL_IDS, MODELS } from '@shared/elec16/map'
import {
  BITMAP_HEIGHT,
  BITMAP_WIDTH,
  createVideoState,
  PALETTE_AT,
  VCTRL_MODE_SHIFT,
  VCTRL_ON,
  VIDEO_MODE,
} from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import {
  DARK,
  paintPlay,
  playText,
  rgbOf,
  screenShows,
} from '../../src/renderer/widgets/elec16/play-painter'

/**
 * PLAY-320's screen as the page draws it (docs/elec16-play.md section 4): mode 0's bitmap in
 * palette 0's colours, dark when switched off, colour 0 alone in a mode not yet made - and
 * drawn sixty times a second where every other model keeps its thirty.
 */

const pixel = (out: Uint8ClampedArray, x: number, y: number) =>
  Array.from(out.subarray((y * BITMAP_WIDTH + x) * 4, (y * BITMAP_WIDTH + x) * 4 + 4))

function withPalette() {
  const v = createVideoState()
  const colours = [0x0000, 0x001f, 0x03e0, 0x7c00]
  colours.forEach((c, k) => {
    v.mem[PALETTE_AT + k * 2] = c & 0xff
    v.mem[PALETTE_AT + k * 2 + 1] = c >> 8
  })
  return v
}

describe("PLAY-320's screen", () => {
  it('widens RGB555 to eight bits a channel, red in the low bits, white to 255', () => {
    expect(rgbOf(0x7fff)).toEqual([255, 255, 255])
    expect(rgbOf(0x001f)).toEqual([255, 0, 0])
    expect(rgbOf(0x03e0)).toEqual([0, 255, 0])
    expect(rgbOf(0x7c00)).toEqual([0, 0, 255])
    expect(rgbOf(0x8000)).toEqual([0, 0, 0])
  })

  it('colours four dots a byte, the leftmost from the top two bits', () => {
    const v = withPalette()
    v.mem[0] = 0b00_01_10_11
    v.mem[(BITMAP_HEIGHT - 1) * 80 + 79] = 0b11
    const out = new Uint8ClampedArray(BITMAP_WIDTH * BITMAP_HEIGHT * 4)
    paintPlay(v, false, out)
    expect([0, 1, 2, 3].map((x) => pixel(out, x, 0))).toEqual([
      [0, 0, 0, 255],
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
    ])
    expect(pixel(out, BITMAP_WIDTH - 1, BITMAP_HEIGHT - 1)).toEqual([0, 0, 255, 255])
  })

  it('is dark switched off or with the display off, and colour 0 alone in another mode', () => {
    const v = withPalette()
    v.mem[0] = 0xff
    v.mem[PALETTE_AT] = 0x1f
    const out = new Uint8ClampedArray(BITMAP_WIDTH * BITMAP_HEIGHT * 4)
    expect(screenShows(v, true)).toBe('dark')
    paintPlay(v, true, out)
    expect(pixel(out, 0, 0)).toEqual([...DARK, 255])
    v.ctrl = 0
    expect(screenShows(v, false)).toBe('dark')
    v.ctrl = VCTRL_ON | (VIDEO_MODE.tiles << VCTRL_MODE_SHIFT)
    expect(screenShows(v, false)).toBe('ground')
    paintPlay(v, false, out)
    expect(pixel(out, 0, 0)).toEqual([255, 0, 0, 255])
    expect(screenShows(null, false)).toBe('dark')
  })

  it('reads back nothing from a clear bitmap', () => {
    expect(playText(new Uint8Array(0x10000)).every((row) => row === '')).toBe(true)
  })

  it('is drawn sixty times a second, every other model thirty as before', () => {
    for (const id of MODEL_IDS) expect(MODELS[id].drawHz, id).toBe(MODELS[id].video ? 60 : 30)
  })
})
