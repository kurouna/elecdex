/**
 * Turns a CHIP-8 screen into pixels (docs/architecture.md section 5.18), one per dot at
 * the machine's own resolution: the canvas is scaled up by CSS, crisp, at a whole number
 * of device pixels a dot.
 *
 * The phosphor's afterglow: a dot that goes dark fades over a few frames instead of
 * vanishing, as on a CRT. CHIP-8 draws by XOR, so a moving sprite is erased and drawn
 * again and flickers; the glow carries it across the gap. A lit dot lights at once. Once
 * everything has settled nothing is drawn again until the machine changes the screen.
 *
 * Pure but for the ImageData it fills: a test gives it a plain object of the same shape.
 */

import type { Palette, Rgb } from './palette.ts'

/** How much of the way to its new colour a fading dot goes each frame: a tail of two or three. */
export const FADE = 0.58
/** Close enough to count as there, in 0 to 255 channel units. */
const SETTLED = 0.75

export interface Pixels {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

export interface Frame {
  width: number
  height: number
  /** A byte a dot, bit 0 for plane 1 and bit 1 for plane 2, row by row. */
  pixels: Uint8Array
}

export class Painter {
  #colour = new Float32Array(0)
  #width = 0
  #height = 0
  #fresh = true

  /** Whether a fading dot is still on its way: another frame is wanted even if nothing moved. */
  fading = false

  /** Starts again from the frame as it is, with no afterglow (a new program, a new palette). */
  reset(): void {
    this.#fresh = true
  }

  /**
   * Writes the frame into `out` (width x height RGBA). With `glow` off, or on the first
   * frame, each dot is its colour at once.
   */
  paint(frame: Frame, palette: Palette, out: Pixels, glow: boolean): void {
    const size = frame.width * frame.height
    if (frame.width !== this.#width || frame.height !== this.#height) {
      this.#width = frame.width
      this.#height = frame.height
      this.#colour = new Float32Array(size * 3)
      this.#fresh = true
    }
    const snap = this.#fresh || !glow
    const ground = palette[0]
    let fading = false
    for (let k = 0; k < size; k++) {
      const target: Rgb = palette[(frame.pixels[k] ?? 0) & 3] ?? ground
      const at = k * 3
      if (snap || this.#brighter(at, target, ground)) {
        this.#set(at, target)
      } else if (this.#fade(at, target)) {
        fading = true
      }
      const o = k * 4
      out.data[o] = this.#colour[at] ?? 0
      out.data[o + 1] = this.#colour[at + 1] ?? 0
      out.data[o + 2] = this.#colour[at + 2] ?? 0
      out.data[o + 3] = 255
    }
    this.#fresh = false
    this.fading = fading
  }

  /** A dot lighting up, or turning to a colour further from the ground: no glow, at once. */
  #brighter(at: number, target: Rgb, ground: Rgb): boolean {
    const distance = (r: number, g: number, b: number) =>
      Math.abs(r - ground[0]) + Math.abs(g - ground[1]) + Math.abs(b - ground[2])
    const c = this.#colour
    return (
      distance(target[0], target[1], target[2]) >=
      distance(c[at] ?? 0, c[at + 1] ?? 0, c[at + 2] ?? 0)
    )
  }

  #set(at: number, target: Rgb): void {
    this.#colour[at] = target[0]
    this.#colour[at + 1] = target[1]
    this.#colour[at + 2] = target[2]
  }

  /** One step of the fade; true while it is not there yet. */
  #fade(at: number, target: Rgb): boolean {
    let moving = false
    for (let ch = 0; ch < 3; ch++) {
      const now = this.#colour[at + ch] ?? 0
      const want = target[ch] ?? 0
      const next = now + (want - now) * FADE
      if (Math.abs(want - next) < SETTLED) this.#colour[at + ch] = want
      else {
        this.#colour[at + ch] = next
        moving = true
      }
    }
    return moving
  }
}
