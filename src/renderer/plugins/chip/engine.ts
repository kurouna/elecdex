import { Biquad } from '../instruments/biquad.js'
import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The chip voice (docs/plugins.md section 13.12): an old home console's sound chip, as its
 * documentation describes it, and nothing recorded.
 *
 * - A pulse channel is an eight-step duty sequencer clocked by an 11-bit timer from the CPU's
 *   clock, so a note's pitch is the nearest the timer can make - a few cents out up high, as
 *   the console always was. The duty is a quarter: the thin, nasal square of its melodies.
 * - Its volume has sixteen steps, and a game changed it once a video frame: the envelope is
 *   a staircase at sixty steps a second, never a smooth curve.
 * - Low notes go to the triangle channel, as the console's composers put their bass there: a
 *   32-step staircase of a triangle, with no volume of its own - on or off.
 * - The channels are mixed by the chip's nonlinear DAC (two pulses at once are less than twice
 *   one), and the console's output stage filters the result: high-passes at 90 and 440 Hz,
 *   a low-pass at 14 kHz.
 *
 * The steps of a pulse are band-limited (PolyBLEP), so its edges do not fold back as noise.
 */

const CPU = 1_789_773
const FRAME_HZ = 60.0988
/** A quarter duty: high for two steps of the eight. */
const DUTY = 0.25
/** Notes below this go to the triangle, as the bass did. */
const TRIANGLE_BELOW = 48
/** The envelope: from the note's volume down a step every two frames to this share, and held. */
const SUSTAIN = 0.6
const VOICES = 8
const OUTPUT = 5.5

interface Channel {
  on: boolean
  id: number
  triangle: boolean
  /** Where in its period, 0 to 1. */
  phase: number
  step: number
  /** The note's top volume, 0-15, and where the staircase is now. */
  top: number
  volume: number
  frames: number
  held: boolean
  left: number
  right: number
  started: number
}

interface Sums {
  pulses: number
  triangle: number
  l: number
  r: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'release' | 'stop'; id: number }

/** The frequency the pulse timer makes nearest a key's. */
export function pulseHz(pitch: number): number {
  const f = 440 * 2 ** ((pitch - 69) / 12)
  const t = Math.min(2047, Math.max(8, Math.round(CPU / (16 * f) - 1)))
  return CPU / (16 * (t + 1))
}

/** The frequency the triangle timer makes nearest a key's (its sequence is 32 steps). */
export function triangleHz(pitch: number): number {
  const f = 440 * 2 ** ((pitch - 69) / 12)
  const t = Math.min(2047, Math.max(2, Math.round(CPU / (32 * f) - 1)))
  return CPU / (32 * (t + 1))
}

/** The triangle's 32 steps: 15 down to 0 and back up. */
const TRIANGLE = Array.from({ length: 32 }, (_, i) => (i < 16 ? 15 - i : i - 16))

function blep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt
    return x + x - x * x - 1
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt
    return x * x + x + x + 1
  }
  return 0
}

export class ChipEngine implements Instrument {
  private readonly rate: number
  private readonly frame: number
  private readonly channels: Channel[] = Array.from({ length: VOICES }, () => ({
    on: false,
    id: 0,
    triangle: false,
    phase: 0,
    step: 0,
    top: 0,
    volume: 0,
    frames: 0,
    held: false,
    left: Math.SQRT1_2,
    right: Math.SQRT1_2,
    started: 0,
  }))
  private readonly timeline = new Timeline<Event>()
  private readonly output: Biquad[]
  /** Samples to the next video frame, when every envelope takes its step. */
  private toFrame = 0
  private quiet = Number.POSITIVE_INFINITY
  private readonly sums: Sums = { pulses: 0, triangle: 0, l: 0, r: 0 }

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.frame = sampleRate / FRAME_HZ
    this.output = [
      new Biquad('highpass', 90, 0.5, sampleRate),
      new Biquad('highpass', 440, 0.5, sampleRate),
      new Biquad('lowpass', 14000, 0.5, sampleRate),
    ]
  }

  strike(id: number, pitch: number, level: number, pan: number, at: number): void {
    this.timeline.add({ at, kind: 'strike', id, pitch: Math.round(pitch), level, pan })
  }

  release(id: number, at: number): void {
    this.timeline.add({ at, kind: 'release', id })
  }

  stop(id: number, at: number): void {
    this.timeline.add({ at, kind: 'stop', id })
  }

  pedal(): void {}

  stopAll(): void {
    this.timeline.clear()
    for (const c of this.channels) c.on = false
  }

  get busy(): boolean {
    return this.timeline.size > 0 || this.channels.some((c) => c.on) || this.quiet < this.rate * 0.1
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    this.timeline.run(
      frames,
      from,
      (event, now) => this.apply(event, now),
      (offset, count) => this.span(left, right, offset, count),
    )
  }

  private apply(event: Event, now: number): void {
    if (event.kind === 'strike') {
      const c =
        this.channels.find((x) => !x.on) ??
        this.channels.reduce((a, b) => (a.started <= b.started ? a : b))
      const triangle = event.pitch < TRIANGLE_BELOW
      const hz = triangle ? triangleHz(event.pitch) : pulseHz(event.pitch)
      c.on = true
      c.id = event.id
      c.triangle = triangle
      c.step = hz / this.rate
      // The triangle starts from the middle of its staircase, where it left off least abruptly.
      c.phase = triangle ? 0.25 : 0
      c.top = Math.max(1, Math.round(15 * Math.min(1, Math.max(0, event.level))))
      c.volume = c.top
      c.frames = 0
      c.held = true
      c.started = now
      const p = Math.min(1, Math.max(-1, event.pan))
      c.left = Math.cos(((p + 1) * Math.PI) / 4)
      c.right = Math.sin(((p + 1) * Math.PI) / 4)
      return
    }
    const c = this.channels.find((x) => x.on && x.id === event.id)
    if (c === undefined) return
    if (event.kind === 'stop') c.on = false
    else c.held = false
  }

  /** Each channel's envelope takes its frame's step. */
  private step(): void {
    for (const c of this.channels) if (c.on) this.stepChannel(c)
  }

  private stepChannel(c: Channel): void {
    c.frames++
    if (c.triangle) {
      // The triangle has no volume: it sounds until let go, then stops at once.
      if (!c.held) c.on = false
      return
    }
    const floor = c.held ? Math.round(c.top * SUSTAIN) : 0
    const every = c.held ? 2 : 1
    if (c.volume > floor && c.frames % every === 0) c.volume--
    if (c.volume <= 0) c.on = false
  }

  /** A channel's next sample, 0-15: the triangle's step, or the pulse's level, smoothed at its edges. */
  private channelSample(c: Channel): number {
    c.phase += c.step
    if (c.phase >= 1) c.phase -= 1
    if (c.triangle) return TRIANGLE[Math.floor(c.phase * 32) % 32] as number
    // High for the first quarter of the period, with its two edges smoothed.
    const high = c.phase < DUTY ? 1 : 0
    const smooth = high + blep(c.phase, c.step) * 0.5 - blep((c.phase - DUTY + 1) % 1, c.step) * 0.5
    return smooth * c.volume
  }

  private span(left: Float32Array, right: Float32Array, offset: number, frames: number): void {
    if (!this.channels.some((c) => c.on) && this.quiet > this.rate * 0.1) return
    for (let k = 0; k < frames; k++) {
      if (--this.toFrame <= 0) {
        this.toFrame += this.frame
        this.step()
      }
      const { pulses, triangle, l, r } = this.sampleAll(this.sums)
      const out = this.stage(pulses, triangle)
      const total = pulses + triangle
      const gainL = total > 0 ? (l / total) * Math.SQRT2 : Math.SQRT1_2
      const gainR = total > 0 ? (r / total) * Math.SQRT2 : Math.SQRT1_2
      left[offset + k] = (left[offset + k] as number) + out * gainL
      right[offset + k] = (right[offset + k] as number) + out * gainR
    }
  }

  /** Every channel's sample, summed by kind and placed, into `sums` (kept, not made anew). */
  private sampleAll(sums: Sums): Sums {
    sums.pulses = 0
    sums.triangle = 0
    sums.l = 0
    sums.r = 0
    for (const c of this.channels) {
      if (!c.on) continue
      const v = this.channelSample(c)
      if (c.triangle) sums.triangle += v
      else sums.pulses += v
      sums.l += v * c.left
      sums.r += v * c.right
    }
    return sums
  }

  /** The DAC's curve on the whole, then the console's output stage, at the voice's level. */
  private stage(pulses: number, triangle: number): number {
    let out = this.mix(pulses, triangle)
    for (const f of this.output) out = f.tick(out)
    this.quiet = Math.abs(out) > 1e-5 ? 0 : this.quiet + 1
    return out * OUTPUT
  }

  /** The chip's DAC: the pulses and the triangle, each through its own nonlinear mix. */
  private mix(pulses: number, triangle: number): number {
    const p = pulses > 0 ? 95.88 / (8128 / pulses + 100) : 0
    const t = triangle > 0 ? 159.79 / (1 / (triangle / 8227) + 100) : 0
    return p + t
  }
}
