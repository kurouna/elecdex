import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The marimba (docs/plugins.md section 13.15): rosewood bars struck with yarn mallets over
 * tuned tubes, from the physics of a tuned bar, and nothing recorded.
 *
 * - A bar's own overtones are far from harmonic; a marimba maker carves an arch under the
 *   bar until its first overtone sits two octaves above the note and its second about three
 *   octaves and a third (1 : 4 : 9.9) - the marimba's warm, hollow sound.
 * - Under each bar a tube closed at the far end is tuned to the note: it takes up the
 *   fundamental and gives it back louder and a little longer; the overtones it does not reach.
 * - A yarn mallet is soft: struck gently it touches for a few milliseconds and reaches only
 *   the fundamental, struck hard it touches briefly and wakes the overtones.
 * - There are no dampers: a note rings its own length, let go or not, as on the instrument.
 * - The keyboard lies left (low) to right (high), as the player stands.
 */

const RATIOS = [1, 3.98, 9.87] as const
/** Each partial's share of the ring, and the tube's lift of the fundamental. */
const TUBE = 1.6
const VOICES = 24
const OUTPUT = 1.05

interface Bar {
  on: boolean
  id: number
  pitch: number
  re: Float64Array
  im: Float64Array
  rotRe: Float64Array
  rotIm: Float64Array
  left: number
  right: number
  started: number
  peak: number
}

type Event = { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }

/** Seconds a bar's fundamental rings: long low down, short up high. */
export function barRing(pitch: number): number {
  return Math.min(3.2, Math.max(0.35, 1.3 * 2 ** (-(pitch - 60) / 16)))
}

export class MarimbaEngine implements Instrument {
  private readonly rate: number
  private readonly dt: number
  private readonly bars: Bar[]
  private readonly timeline = new Timeline<Event>()

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
    this.bars = Array.from({ length: VOICES }, () => ({
      on: false,
      id: 0,
      pitch: 0,
      re: new Float64Array(RATIOS.length),
      im: new Float64Array(RATIOS.length),
      rotRe: new Float64Array(RATIOS.length),
      rotIm: new Float64Array(RATIOS.length),
      left: Math.SQRT1_2,
      right: Math.SQRT1_2,
      started: 0,
      peak: 0,
    }))
  }

  strike(id: number, pitch: number, level: number, pan: number, at: number): void {
    this.timeline.add({ at, kind: 'strike', id, pitch: Math.round(pitch), level, pan })
  }

  /** A marimba has no dampers: letting go changes nothing. */
  release(): void {}

  stop(id: number): void {
    for (const bar of this.bars) if (bar.on && bar.id === id) bar.on = false
  }

  pedal(): void {}

  stopAll(): void {
    this.timeline.clear()
    for (const bar of this.bars) bar.on = false
  }

  get busy(): boolean {
    return this.timeline.size > 0 || this.bars.some((b) => b.on)
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    this.timeline.run(
      frames,
      from,
      (event, now) => this.hit(event, now),
      (offset, count) => {
        for (const bar of this.bars) if (bar.on) this.ring(bar, left, right, offset, count)
      },
    )
  }

  private hit(event: Event, now: number): void {
    const bar =
      this.bars.find((b) => b.on && b.pitch === event.pitch) ??
      this.bars.find((b) => !b.on) ??
      this.bars.reduce((a, b) => (a.started <= b.started ? a : b))
    const f0 = 440 * 2 ** ((event.pitch - 69) / 12)
    const level = Math.min(1, Math.max(0, event.level))
    // The mallet's touch: about 4 ms soft, 1 ms hard, shorter on the small high bars.
    const contact = (4e-3 - 3e-3 * level) * 2 ** (-(event.pitch - 60) / 30)
    const ring = barRing(event.pitch)
    const decays = [6.9078 / ring, 6.9078 / (ring * 0.28), 6.9078 / (ring * 0.1)]
    const shares = [TUBE, 0.7, 0.35]
    for (let m = 0; m < RATIOS.length; m++) {
      const f = f0 * (RATIOS[m] as number)
      const x = 2 * f * contact
      // A half-sine touch's spectrum: the softer and longer, the less of the overtones.
      const touch =
        Math.abs(x - 1) < 1e-6 ? Math.PI / 4 : Math.abs(Math.cos((Math.PI * x) / 2) / (1 - x * x))
      const audible = f < this.rate * 0.45 ? 1 : 0
      bar.re[m] =
        (bar.on ? (bar.re[m] as number) : 0) + level * (shares[m] as number) * touch * audible
      bar.im[m] = bar.on ? (bar.im[m] as number) : 0
      const r = Math.exp(-(decays[m] as number) * this.dt)
      const w = (2 * Math.PI * f) / this.rate
      bar.rotRe[m] = r * Math.cos(w)
      bar.rotIm[m] = r * Math.sin(w)
    }
    bar.on = true
    bar.id = event.id
    bar.pitch = event.pitch
    bar.started = now
    bar.peak = 0
    const p = Math.min(1, Math.max(-1, event.pan + ((event.pitch - 66) / 30) * 0.6))
    bar.left = Math.cos(((p + 1) * Math.PI) / 4)
    bar.right = Math.sin(((p + 1) * Math.PI) / 4)
  }

  private ring(
    bar: Bar,
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
  ): void {
    let loud = 0
    for (let k = 0; k < frames; k++) {
      let x = 0
      for (let m = 0; m < RATIOS.length; m++) {
        const r = bar.re[m] as number
        const i = bar.im[m] as number
        const cr = bar.rotRe[m] as number
        const ci = bar.rotIm[m] as number
        bar.re[m] = r * cr - i * ci
        bar.im[m] = r * ci + i * cr
        x += bar.im[m] as number
      }
      const out = x * OUTPUT
      loud = Math.max(loud, Math.abs(out))
      left[offset + k] = (left[offset + k] as number) + out * bar.left
      right[offset + k] = (right[offset + k] as number) + out * bar.right
    }
    bar.peak = Math.max(bar.peak, loud)
    if (loud < bar.peak * 1e-4) bar.on = false
  }
}
