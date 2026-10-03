/**
 * Turns an emulated screen into pixels (docs/emu.md), one per dot at the machine's own
 * resolution: the canvas is scaled up by CSS, crisp, at a whole number of device pixels a
 * dot.
 *
 * The afterglow: a dot that goes dark fades over a few frames instead of vanishing, as a
 * CRT's phosphor does (CHIP-8 draws by XOR, so a moving sprite is erased and drawn again and
 * flickers; the glow carries it across the gap). How fast it fades is the machine's: an LCD
 * is slower than a phosphor. A lit dot lights at once. Once everything has settled nothing
 * is drawn again until the machine changes the screen.
 *
 * Pure but for the ImageData it fills: a test gives it a plain object of the same shape.
 */

export type Rgb = readonly [number, number, number]

/** A screen's colours by dot value: the ground first, then each value a dot can hold. */
export type Colours = readonly Rgb[]

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
  /** A byte a dot, the index of its colour, row by row. */
  pixels: Uint8Array
}

/** How far a colour is from the ground, in summed channel units. */
const fromGround = (r: number, g: number, b: number, ground: Rgb): number =>
  Math.abs(r - ground[0]) + Math.abs(g - ground[1]) + Math.abs(b - ground[2])

const colourOf = (colours: Colours, value: number): Rgb => colours[value] ?? colours[0] ?? [0, 0, 0]

/** A still frame at once, with no glow: a preview in a list. */
export function paintStill(frame: Frame, colours: Colours, out: Pixels): void {
  const size = frame.width * frame.height
  for (let k = 0; k < size; k++) {
    const c = colourOf(colours, frame.pixels[k] ?? 0)
    const o = k * 4
    out.data[o] = c[0]
    out.data[o + 1] = c[1]
    out.data[o + 2] = c[2]
    out.data[o + 3] = 255
  }
}

export class Painter {
  readonly #fade: number
  #colour = new Float32Array(0)
  #width = 0
  #height = 0
  #fresh = true

  /** Whether a fading dot is still on its way: another frame is wanted even if nothing moved. */
  fading = false

  /** `fade`: the share of the way a fading dot goes each frame (CHIP-8's phosphor by default). */
  constructor({ fade = FADE }: { fade?: number } = {}) {
    this.#fade = fade
  }

  /** Starts again from the frame as it is, with no afterglow (a new program, new colours). */
  reset(): void {
    this.#fresh = true
  }

  /**
   * Writes the frame into `out` (width x height RGBA). With `glow` off, or on the first
   * frame, each dot is its colour at once.
   */
  paint(frame: Frame, colours: Colours, out: Pixels, glow: boolean): void {
    const size = frame.width * frame.height
    if (frame.width !== this.#width || frame.height !== this.#height) {
      this.#width = frame.width
      this.#height = frame.height
      this.#colour = new Float32Array(size * 3)
      this.#fresh = true
    }
    const snap = this.#fresh || !glow
    const ground = colourOf(colours, 0)
    let fading = false
    for (let k = 0; k < size; k++) {
      const target = colourOf(colours, frame.pixels[k] ?? 0)
      const at = k * 3
      if (snap || this.#brighter(at, target, ground)) {
        this.#set(at, target)
      } else if (this.#step(at, target)) {
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
    const c = this.#colour
    return (
      fromGround(target[0], target[1], target[2], ground) >=
      fromGround(c[at] ?? 0, c[at + 1] ?? 0, c[at + 2] ?? 0, ground)
    )
  }

  #set(at: number, target: Rgb): void {
    this.#colour[at] = target[0]
    this.#colour[at + 1] = target[1]
    this.#colour[at + 2] = target[2]
  }

  /** One step of the fade; true while it is not there yet. */
  #step(at: number, target: Rgb): boolean {
    let moving = false
    for (let ch = 0; ch < 3; ch++) {
      const now = this.#colour[at + ch] ?? 0
      const want = target[ch] ?? 0
      const next = now + (want - now) * this.#fade
      if (Math.abs(want - next) < SETTLED) this.#colour[at + ch] = want
      else {
        this.#colour[at + ch] = next
        moving = true
      }
    }
    return moving
  }
}
