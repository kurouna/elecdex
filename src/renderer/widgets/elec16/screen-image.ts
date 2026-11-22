import type { Model } from '@shared/elec16/map'
import type { Elec16State } from '@shared/elec16/state'
import { BITMAP_HEIGHT, BITMAP_WIDTH, type VideoState } from '@shared/elec16/video'
import { dotAlpha, type LcdColours, shadeLevel } from './lcd-painter.js'
import { paintPlay } from './play-painter.js'

/**
 * The screen as a picture, for COPY IMAGE and SAVE PNG (docs/elec16.md section 7): only what
 * the screen holds, never the body, the annunciators or the cursor. Pure, made when a button
 * is pressed, never on a frame.
 *
 * An LCD is its dots in the pane's LCD colours, mixed opaque over the ground as LcdPainter
 * draws them (`dotAlpha`: the contrast, and the faint dots that are out above the machine's
 * own), LCD_SCALE pixels a dot with a pixel of ground between dots where the LCD draws a gap
 * - not on a flat screen (PLAIN). With the gaps, every dot also sits on the skin's faint unlit
 * dot, as Lcd.svelte lays it under them. The dots are as the machine holds them now, without
 * the afterglow still fading on the page or their shadows. PLAY-320's picture is what
 * paintPlay draws, PLAY_SCALE pixels a dot.
 */
export interface ScreenImage {
  width: number
  height: number
  /** RGBA, row by row. */
  data: Uint8ClampedArray<ArrayBuffer>
}

export const LCD_SCALE = 4
export const PLAY_SCALE = 2

/** How the LCD is drawn: `gap` between its dots, and its unlit dots' strength (0 for none). */
export interface LcdLook {
  gap: boolean
  unlit: number
}

/** `pixels`: a shade a dot (machine.pixels). */
export function lcdImage(
  pixels: Uint8Array,
  model: Pick<Model, 'width' | 'height' | 'depth'>,
  colours: LcdColours,
  contrast: number,
  look: LcdLook,
): ScreenImage {
  const { width, height, depth } = model
  const out = new Uint8ClampedArray(width * LCD_SCALE * height * LCD_SCALE * 4)
  const row = width * LCD_SCALE * 4
  const ground = colours.ground
  const lit = Math.max(0, LCD_SCALE - (look.gap ? 1 : 0))
  // The unlit dot under each dot shows only between the gaps, as on the page.
  const under = look.gap ? look.unlit : 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const over = dotAlpha(shadeLevel(pixels[y * width + x] ?? 0, depth), contrast)
      const alpha = 1 - (1 - under) * (1 - over)
      const rgb = colours.dot.map((d, i) => (ground[i] ?? 0) + (d - (ground[i] ?? 0)) * alpha)
      for (let dy = 0; dy < LCD_SCALE; dy++) {
        for (let dx = 0; dx < LCD_SCALE; dx++) {
          const shown = dx < lit && dy < lit ? rgb : ground
          const k = (y * LCD_SCALE + dy) * row + (x * LCD_SCALE + dx) * 4
          out[k] = Math.round(shown[0] ?? 0)
          out[k + 1] = Math.round(shown[1] ?? 0)
          out[k + 2] = Math.round(shown[2] ?? 0)
          out[k + 3] = 255
        }
      }
    }
  }
  return { width: width * LCD_SCALE, height: height * LCD_SCALE, data: out }
}

/** PLAY-320's screen as paintPlay draws it, each dot PLAY_SCALE pixels each way. */
export function playImage(video: VideoState | null, off: boolean): ScreenImage {
  const drawn = new Uint8ClampedArray(BITMAP_WIDTH * BITMAP_HEIGHT * 4)
  paintPlay(video, off, drawn)
  const source = new Uint32Array(drawn.buffer)
  const width = BITMAP_WIDTH * PLAY_SCALE
  const height = BITMAP_HEIGHT * PLAY_SCALE
  const data = new Uint8ClampedArray(width * height * 4)
  const words = new Uint32Array(data.buffer)
  for (let y = 0; y < height; y++) {
    const from = Math.floor(y / PLAY_SCALE) * BITMAP_WIDTH
    for (let x = 0; x < width; x++)
      words[y * width + x] = source[from + Math.floor(x / PLAY_SCALE)] ?? 0
  }
  return { width, height, data }
}

/**
 * The picture of the screen `s` shows on `model`: PLAY-320's as it is drawn, an LCD's at the
 * contrast the page draws it at (the machine's own plus the pane's), blank while the LCD is
 * out or the machine off. `pixels` reads the dots (machine.pixels), only when they are shown.
 */
export function screenImage(
  model: Model,
  s: Elec16State,
  pixels: () => Uint8Array,
  colours: LcdColours,
  paneContrast: number,
  look: LcdLook,
): ScreenImage {
  if (model.video) return playImage(s.video, s.off)
  const shown = s.lcd.on && !s.off
  const dots = shown ? pixels() : new Uint8Array(model.width * model.height)
  return lcdImage(dots, model, colours, s.lcd.contrast + paneContrast, look)
}
