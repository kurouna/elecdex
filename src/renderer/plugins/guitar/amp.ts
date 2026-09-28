import { Biquad } from '../instruments/biquad.js'

/**
 * The lead guitar's electronics (docs/plugins.md section 13.9), from the pickup's coil to the
 * amplifier's output; the cabinet is the page's convolution (cabinet.ts).
 *
 * - The pickup's coil and the cable's capacitance ring at a few kilohertz, then roll off: the
 *   bite of a humbucker, and why a guitar's top is not a synthesiser's.
 * - An overdrive in front, as lead players use one: the low end cut before the clipping, so it
 *   stays tight, and the middle raised (the "hump" of the classic green pedal).
 * - Two gain stages of soft clipping, each lopsided (a triode's grid conducts on one side
 *   first), so even harmonics as well as odd - the warmth a symmetric clipper lacks - with a
 *   coupling capacitor and a little treble loss between them.
 * - Distortion makes harmonics above the Nyquist frequency, which would fold back as a
 *   metallic fizz unrelated to the note, so the stages run at four times the sample rate,
 *   filtered before and after.
 * - A tone stack after: the bass and treble up a little, the middle a little down.
 *
 * Pure, and allocation-free per block.
 */

const OVERSAMPLE = 4
/** The two stages' gain, and how lopsided each is. */
const STAGES = [
  { gain: 14, bias: 0.3 },
  { gain: 9, bias: -0.18 },
] as const
/** The whole amplifier's gain after the stages, to a level the other voices sit at. */
const OUTPUT = 0.2

export class Amp {
  private readonly coil: Biquad
  private readonly tighten: Biquad
  private readonly hump: Biquad
  private readonly fizz: Biquad
  private readonly upA: Biquad
  private readonly upB: Biquad
  private readonly coupling: Biquad
  private readonly interstage: Biquad
  private readonly downA: Biquad
  private readonly downB: Biquad
  private readonly bass: Biquad
  private readonly middle: Biquad
  private readonly presence: Biquad
  /** The lopsided clipping leaves a little DC while a note sounds; the output stage's capacitor. */
  private readonly dc: Biquad
  private readonly offsets = STAGES.map((s) => Math.tanh(s.bias))

  constructor(sampleRate: number) {
    const os = sampleRate * OVERSAMPLE
    this.coil = new Biquad('lowpass', 4200, 2.2, sampleRate)
    this.tighten = new Biquad('highpass', 120, 0.7, sampleRate)
    this.hump = new Biquad('peaking', 720, 0.8, sampleRate, 9)
    this.fizz = new Biquad('lowpass', 6500, 0.7, sampleRate)
    // Both anti-imaging and anti-aliasing: a fourth-order low-pass at 0.42 of the base rate.
    this.upA = new Biquad('lowpass', sampleRate * 0.42, 0.54, os)
    this.upB = new Biquad('lowpass', sampleRate * 0.42, 1.31, os)
    this.coupling = new Biquad('highpass', 70, 0.7, os)
    this.interstage = new Biquad('lowpass', 7000, 0.7, os)
    this.downA = new Biquad('lowpass', sampleRate * 0.42, 0.54, os)
    this.downB = new Biquad('lowpass', sampleRate * 0.42, 1.31, os)
    this.bass = new Biquad('lowshelf', 140, 0.7, sampleRate, 3)
    this.middle = new Biquad('peaking', 480, 0.7, sampleRate, -4)
    this.presence = new Biquad('highshelf', 3200, 0.7, sampleRate, 2.5)
    this.dc = new Biquad('highpass', 25, 0.7, sampleRate)
  }

  /** Runs `frames` samples of the pickup's signal through, in place. */
  process(data: Float64Array, frames: number): void {
    for (let i = 0; i < frames; i++) {
      let x = this.coil.tick(data[i] as number)
      x = this.fizz.tick(this.hump.tick(this.tighten.tick(x)))
      let out = 0
      for (let k = 0; k < OVERSAMPLE; k++) {
        // Zero-stuffed, so the one real sample carries the gain of the four.
        const up = this.upB.tick(this.upA.tick(k === 0 ? x * OVERSAMPLE : 0))
        const first = this.stage(0, up)
        const second = this.stage(1, this.interstage.tick(this.coupling.tick(first)))
        out = this.downB.tick(this.downA.tick(second))
      }
      data[i] = this.dc.tick(this.presence.tick(this.middle.tick(this.bass.tick(out)))) * OUTPUT
    }
  }

  /** One lopsided soft clipper: tanh with the bias taken off again, so silence stays silent. */
  private stage(n: 0 | 1, x: number): number {
    const { gain, bias } = STAGES[n]
    return Math.tanh(x * gain + bias) - (this.offsets[n] as number)
  }
}
