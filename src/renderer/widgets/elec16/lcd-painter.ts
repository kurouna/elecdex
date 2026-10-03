/**
 * Paints the ELEC-16's LCD (docs/elec16.md section 7, and section 9 on its cost): one pixel
 * a dot, at the machine's own resolution, which the page scales up crisp by CSS to a whole
 * number of device pixels a dot. Two images: the dots, transparent where a dot is out, and
 * their shadow, drawn under them a little down and right, as an LCD's segments throw one
 * onto the reflector behind them. The gaps between dots are a grid drawn once for the size
 * (widgets/emu/screen.ts). Drawn at device pixels instead, a frame had a texture of 0.7 MB
 * to upload where it now has two of 46 kB: measured, a program writing the screen every
 * frame cost about a third of a core more that way.
 *
 * A dot comes on at once and goes out over a few frames, as an LCD's crystals do; `paint`
 * says while any dot is still fading, so the loop asks for one more frame. The cursor is
 * the page's: drawn over the cell the machine names, blinking on the page's own beat.
 *
 * Pure but for the ImageData it fills, which a test can give it.
 */

import type { Rgb } from '../emu/painter.ts'

export type { Rgb }

export interface LcdColours {
  ground: Rgb
  dot: Rgb
  shadow: Rgb
}

/** The levels a dot passes through: 0 out, FULL fully on. A fade drops one a frame. */
export const FULL = 6

export interface Cursor {
  column: number
  row: number
  /** 1 an underline, 2 a block (CURMODE's low bits). */
  shape: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A colour and an opacity as one little-endian RGBA word, as a Uint32Array over ImageData holds it. */
const word = ([r, g, b]: Rgb, alpha: number): number =>
  ((Math.round(alpha * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0

/** How strongly a dot shows at a contrast of 0 to 15 (8 is the machine's own). */
export function strength(contrast: number): number {
  return Math.min(1, 0.4 + Math.max(0, Math.min(15, contrast)) * 0.075)
}

export class LcdPainter {
  width = 0
  height = 0
  #levels = new Uint8Array(0)
  /** Per level, the dot's word and its shadow's. */
  #dot = new Uint32Array(FULL + 1)
  #shadow = new Uint32Array(FULL + 1)
  #dots: Uint32Array<ArrayBufferLike> = new Uint32Array(0)
  #lastCursor: Cursor | null = null
  #shadows: Uint32Array<ArrayBufferLike> = new Uint32Array(0)

  /**
   * Sets the size and colours, and draws every dot again on the next paint. The images are
   * the caller's, `width` by `height` each.
   */
  configure(
    dots: ImageData,
    shadows: ImageData,
    width: number,
    height: number,
    colours: LcdColours,
    contrast: number,
  ): void {
    this.width = width
    this.height = height
    this.#dots = words(dots)
    this.#shadows = words(shadows)
    const shown = strength(contrast)
    // Above the machine's own contrast, a dot that is out shows faintly, as on a real panel.
    const offTint = Math.max(0, contrast - 8) * 0.025
    for (let level = 0; level <= FULL; level++) {
      this.#dot[level] = word(colours.dot, Math.max(offTint, (level / FULL) * shown))
      this.#shadow[level] = word(colours.shadow, level / FULL)
    }
    // Unknown levels: every dot is drawn on the next paint.
    this.#levels = new Uint8Array(width * height).fill(255)
    this.#lastCursor = null
  }

  /**
   * Brings the images up to `pixels` (a shade 0..3 a dot; a 1-bit screen uses 0 and 1), the
   * cursor drawn over its cell. The rectangle that changed, in dots, or null; and whether a
   * dot is still fading (another paint is wanted).
   */
  paint(
    pixels: Uint8Array,
    depth: number,
    ghost: boolean,
    cursor: Cursor | null,
  ): { dirty: Rect | null; fading: boolean } {
    const { width, height } = this
    const shadeStep = depth === 2 ? FULL / 3 : FULL
    const box = new Box(width, height)
    // The cursor is the page's mark, not the crystals': its cell, where it is now and where
    // it was, changes at once, or a blink would only dim it.
    const marked = [cursor, this.#lastCursor]
    this.#lastCursor = cursor
    let fading = false
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const shade = Math.round((pixels[y * width + x] ?? 0) * shadeStep)
        const target = cursor === null ? shade : cursorLevel(shade, x, y, cursor)
        const fade = ghost && !marked.some((c) => c !== null && inCell(x, y, c))
        const moved = this.#move(x, y, target, fade)
        if (moved === null) continue
        if (moved) fading = true
        box.take(x, y)
      }
    }
    return { dirty: box.rect(), fading }
  }

  /**
   * Moves a dot a step towards `target`: null when it is there already, else whether it is
   * still on its way (fading). On at once; out a level a frame while the fade is wanted
   * (255: never drawn yet).
   */
  #move(x: number, y: number, target: number, ghost: boolean): boolean | null {
    const k = y * this.width + x
    const now = this.#levels[k] ?? 0
    if (now === target) return null
    const next = ghost && now !== 255 && now > target ? now - 1 : target
    this.#levels[k] = next
    this.#dots[k] = this.#dot[next] ?? 0
    this.#shadows[k] = this.#shadow[next] ?? 0
    return next !== target
  }
}

const words = (image: ImageData): Uint32Array<ArrayBufferLike> =>
  new Uint32Array(image.data.buffer, image.data.byteOffset, image.data.length / 4)

/** Whether a dot is in the cursor's cell (its five columns and eight rows). */
function inCell(x: number, y: number, cursor: Cursor): boolean {
  const cx = x - cursor.column * 6
  const cy = y - cursor.row * 8
  return cx >= 0 && cx <= 4 && cy >= 0 && cy <= 7
}

/** The level a dot shows with the cursor over its cell: a block turns it over, a line lights it. */
function cursorLevel(level: number, x: number, y: number, cursor: Cursor): number {
  if (!inCell(x, y, cursor)) return level
  const cy = y - cursor.row * 8
  if (cursor.shape === 2) return cy < 7 ? FULL - level : level
  return cursor.shape === 1 && cy === 7 ? FULL : level
}

/** The smallest box round the dots a paint changed. */
class Box {
  #x0: number
  #y0: number
  #x1 = -1
  #y1 = -1

  constructor(width: number, height: number) {
    this.#x0 = width
    this.#y0 = height
  }

  take(x: number, y: number): void {
    this.#x0 = Math.min(this.#x0, x)
    this.#x1 = Math.max(this.#x1, x)
    this.#y0 = Math.min(this.#y0, y)
    this.#y1 = Math.max(this.#y1, y)
  }

  /** In dots, or null when nothing changed. */
  rect(): Rect | null {
    if (this.#x1 < 0) return null
    return { x: this.#x0, y: this.#y0, w: this.#x1 - this.#x0 + 1, h: this.#y1 - this.#y0 + 1 }
  }
}
