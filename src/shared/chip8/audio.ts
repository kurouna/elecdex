/**
 * The CHIP-8 buzzer and XO-CHIP's audio (docs/architecture.md section 5.18), as samples.
 *
 * XO-CHIP plays a 128-bit pattern (F002) round and round at 4000 * 2^((pitch - 64) / 48)
 * bits a second (FX3A), for as long as the sound timer runs. A program that never loads a
 * pattern - every CHIP-8 and SUPER-CHIP one - gets a square wave, the buzzer.
 *
 * `PatternVoice` is what the audio thread runs: it carries its place in the pattern from
 * one block to the next, so a pitch or pattern change mid-note never clicks, and it steps
 * through the pattern several times per output sample through a small low-pass filter, as
 * Octo does, so the edges of a 1-bit wave alias into nothing harsh. Pure: the worklet,
 * the tests and a WAV script run the same code.
 */

export const PATTERN_BYTES = 16
export const PATTERN_BITS = PATTERN_BYTES * 8
/** The pattern's rate at the pitch everything starts with. */
export const BASE_RATE = 4000
export const PITCH_BIAS = 64

/** Bits a second at an FX3A pitch. */
export const patternRate = (pitch: number): number => BASE_RATE * 2 ** ((pitch - PITCH_BIAS) / 48)

/**
 * The buzzer: four bits on, four off, round the pattern - 500 Hz at the base rate, a
 * plain beep in the range the COSMAC VIP's speaker sat in.
 */
export const BUZZER_PATTERN: Readonly<Uint8Array> = new Uint8Array(PATTERN_BYTES).fill(0xf0)

/** What the audio thread is told once a frame. */
export interface Tone {
  /** How long it sounds from now, in seconds: the sound timer's frames left, or 0. */
  seconds: number
  pattern: Uint8Array
  /** Bits a second. */
  rate: number
}

/** What a machine sounds like now, from its sound timer, pattern and pitch. */
export function toneOf(st: number, pattern: Uint8Array, pitch: number, patternSet: boolean): Tone {
  return {
    seconds: Math.max(0, st) / 60,
    pattern: patternSet ? pattern.slice() : BUZZER_PATTERN.slice(),
    rate: patternRate(pitch),
  }
}

/** Octo's cut-off, well below where a 44.1 kHz output folds back. */
const CUTOFF_HZ = 18000
/** Filters in a row: one RC stage is too gentle near the stop band. */
const STAGES = 4
/** Loudness of a lit bit; the pane's own gain comes after. */
const LEVEL = 0.5
/** How long a note takes to open and close, so starts and stops do not click (seconds). */
const EDGE_SECONDS = 0.004

const alphaFor = (samplingHz: number): number => {
  const c = Math.cos((2 * Math.PI * CUTOFF_HZ) / samplingHz)
  return c - 1 + Math.sqrt(c * c - 4 * c + 3)
}

export class PatternVoice {
  readonly #sampleRate: number
  readonly #quality: number
  readonly #alpha: number
  readonly #filter = new Float64Array(STAGES + 1)
  #pattern: Uint8Array = BUZZER_PATTERN.slice()
  #rate = BASE_RATE
  /** Where in the pattern it is, in bits. */
  #pos = 0
  /** Samples left to sound. */
  #left = 0
  /** The envelope, 0 to 1, moving towards open or shut by `#edge` a sample. */
  #level = 0
  readonly #edge: number

  constructor(sampleRate: number) {
    this.#sampleRate = sampleRate
    // As many steps per output sample as keep the inner rate near 384 kHz.
    this.#quality = Math.max(1, Math.ceil(384000 / sampleRate))
    this.#alpha = alphaFor(sampleRate * this.#quality)
    this.#edge = 1 / Math.max(1, Math.round(EDGE_SECONDS * sampleRate))
  }

  /** Takes a frame's tone: sounds for `seconds` from now with this pattern and rate. */
  set(tone: Tone): void {
    // A note starting from silence starts at the pattern's beginning, as Octo resets it.
    if (this.#left <= 0 && this.#level === 0) this.#pos = 0
    if (tone.pattern.length === PATTERN_BYTES) this.#pattern = tone.pattern
    if (Number.isFinite(tone.rate) && tone.rate > 0) this.#rate = tone.rate
    this.#left = Math.max(0, Math.round(tone.seconds * this.#sampleRate))
  }

  /** Stops at once (with its short fade). */
  stop(): void {
    this.#left = 0
  }

  /** Whether it has anything left to play, fade included. */
  get busy(): boolean {
    return this.#left > 0 || this.#level > 0
  }

  #bit(): number {
    const cell = this.#pos >> 3
    return ((this.#pattern[cell] ?? 0) >> (7 - (this.#pos & 7))) & 1
  }

  #filtered(input: number): number {
    const f = this.#filter
    f[0] = input
    for (let k = 1; k <= STAGES; k++)
      f[k] = (f[k] ?? 0) + ((f[k - 1] ?? 0) - (f[k] ?? 0)) * this.#alpha
    return f[STAGES] ?? 0
  }

  /** Fills `out` with the next samples (it writes, it does not add). */
  render(out: Float32Array): void {
    if (!this.busy) {
      out.fill(0)
      return
    }
    const step = this.#rate / this.#sampleRate / this.#quality
    for (let i = 0; i < out.length; i++) {
      const open = this.#left > 0
      this.#level = open
        ? Math.min(1, this.#level + this.#edge)
        : Math.max(0, this.#level - this.#edge)
      if (open) this.#left--
      let value = 0
      for (let q = 0; q < this.#quality; q++) {
        // Centred on zero, so a held note has no offset to thump in and out with.
        value = this.#filtered(this.#bit() * 2 - 1)
        this.#pos = (this.#pos + step) % PATTERN_BITS
      }
      out[i] = value * LEVEL * this.#level
    }
  }
}
