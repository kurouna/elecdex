import { Biquad } from '../instruments/biquad.js'
import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The electric bass (docs/plugins.md section 13.16): four roundwound strings on a 34-inch
 * neck, plucked with the fingers, heard by a split-coil pickup, through its tone control and
 * a valve DI - from the physics of a plucked string, and nothing recorded.
 *
 * - A note goes where a bass player plays it, low on the neck: the highest string that
 *   reaches it within the first seven frets. A string plays one note at a time.
 * - A finger is wider and softer than a pick: the string leaves it rounder, and a harder
 *   pluck is brighter, not only louder.
 * - The pickup sits about a sixth of the way up the string from the bridge, which shapes
 *   which partials it hears, and the tone control and the cable take the top off.
 * - Letting a key go mutes the string with the fretting hand, as a bassist does.
 */

const SCALE = 0.864
const STRINGS = [
  { open: 28, core: 0.021 * 0.0254, tension: 190 },
  { open: 33, core: 0.019 * 0.0254, tension: 195 },
  { open: 38, core: 0.017 * 0.0254, tension: 190 },
  { open: 43, core: 0.015 * 0.0254, tension: 175 },
] as const
const LOW_FRETS = 7
const TOP_FRET = 20
const PLUCK_AT = 0.13
const PICKUP_AT = 0.15
const PICKUP_WIDTH = 0.02
const MUTE = 6.9078 / 0.09
const CUT = 250
const MAX_MODES = 120
const INPUT = 900
const OUTPUT = 0.35

interface StringVoice {
  on: boolean
  id: number
  count: number
  re: Float64Array
  im: Float64Array
  rotRe: Float64Array
  rotIm: Float64Array
  decay: Float64Array
  omega: Float64Array
  pickup: Float64Array
  peak: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'release' | 'stop'; id: number }

/** The string and fret a bass player would use for a key. */
export function bassFret(pitch: number): { string: number; fret: number } {
  const p = Math.round(pitch)
  let low = -1
  let any = -1
  STRINGS.forEach((s, i) => {
    const fret = p - s.open
    if (fret >= 0 && fret <= LOW_FRETS) low = i
    if (fret >= 0 && fret <= TOP_FRET) any = i
  })
  const string = low >= 0 ? low : any >= 0 ? any : p < 28 ? 0 : STRINGS.length - 1
  const fret = Math.min(TOP_FRET, Math.max(0, p - (STRINGS[string]?.open ?? 28)))
  return { string, fret }
}

export class BassEngine implements Instrument {
  private readonly rate: number
  private readonly dt: number
  private readonly strings: StringVoice[]
  private readonly timeline = new Timeline<Event>()
  private readonly tone: Biquad
  private readonly body: Biquad
  private mix = new Float64Array(128)
  private quiet = Number.POSITIVE_INFINITY

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
    const a = () => new Float64Array(MAX_MODES)
    this.strings = STRINGS.map(() => ({
      on: false,
      id: 0,
      count: 0,
      re: a(),
      im: a(),
      rotRe: a(),
      rotIm: a(),
      decay: a(),
      omega: a(),
      pickup: a(),
      peak: 0,
    }))
    // The tone control half rolled off with the cable, and the DI's low end.
    this.tone = new Biquad('lowpass', 2600, 0.8, sampleRate)
    this.body = new Biquad('lowshelf', 90, 0.7, sampleRate, 2.5)
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
    for (const s of this.strings) s.on = false
  }

  get busy(): boolean {
    return this.timeline.size > 0 || this.strings.some((s) => s.on) || this.quiet < this.rate * 0.1
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    if (this.mix.length < frames) this.mix = new Float64Array(frames)
    this.timeline.run(
      frames,
      from,
      (event) => this.apply(event),
      (offset, count) => this.span(left, right, offset, count),
    )
  }

  private apply(event: Event): void {
    if (event.kind === 'strike') {
      this.pluck(event)
      return
    }
    const s = this.strings.find((x) => x.on && x.id === event.id)
    if (s !== undefined) this.damp(s, event.kind === 'stop' ? CUT : MUTE)
  }

  private pluck(event: Extract<Event, { kind: 'strike' }>): void {
    const { string, fret } = bassFret(event.pitch)
    const spec = STRINGS[string] as (typeof STRINGS)[number]
    const s = this.strings[string] as StringVoice
    const length = SCALE * 2 ** (-fret / 12)
    const f0 = 440 * 2 ** ((event.pitch - 69) / 12)
    // The winding stiffens a bass string beyond its core: twice the core's own.
    const b = (2 * Math.PI ** 3 * 2e11 * spec.core ** 4) / (64 * spec.tension * length ** 2)
    const level = Math.min(1, Math.max(0, event.level))
    const edge = 900 + 2600 * level
    const own = 6.9078 / (9 * 0.94 ** fret)
    const top = Math.min(9000, this.rate * 0.45)
    const pluck = PLUCK_AT / length
    const place = PICKUP_AT / length
    const width = PICKUP_WIDTH / length
    let count = 0
    for (let k = 1; k <= MAX_MODES; k++) {
      const f = f0 * k * Math.sqrt((1 + b * k * k) / (1 + b))
      if (f > top) break
      const i = count++
      const aperture = Math.abs(Math.sin(k * Math.PI * width)) / (k * Math.PI * width)
      s.omega[i] = 2 * Math.PI * f
      s.decay[i] = own + 3.5e-6 * (f * f - f0 * f0) + 1.2e-3 * (f - f0)
      s.pickup[i] = Math.sin(k * Math.PI * place) * aperture * k
      const a = level ** 0.8 * (Math.sin(k * Math.PI * pluck) / (k * k)) * Math.exp(-f / edge)
      // Released from rest; a ringing string is mostly stopped by the finger first.
      s.re[i] = s.on ? 0.1 * (s.re[i] as number) : 0
      s.im[i] = a + (s.on ? 0.1 * (s.im[i] as number) : 0)
    }
    s.count = count
    s.on = true
    s.id = event.id
    s.peak = 0
    this.damp(s, 0)
  }

  private damp(s: StringVoice, extra: number): void {
    for (let i = 0; i < s.count; i++) {
      const r = Math.exp(-((s.decay[i] as number) + extra) * this.dt)
      const w = (s.omega[i] as number) * this.dt
      s.rotRe[i] = r * Math.cos(w)
      s.rotIm[i] = r * Math.sin(w)
    }
  }

  private span(left: Float32Array, right: Float32Array, offset: number, frames: number): void {
    if (!this.strings.some((s) => s.on) && this.quiet > this.rate * 0.1) return
    const mix = this.mix
    mix.fill(0, 0, frames)
    for (const s of this.strings) {
      if (!s.on) continue
      let loud = 0
      for (let m = 0; m < s.count; m++) {
        let re = s.re[m] as number
        let im = s.im[m] as number
        const cr = s.rotRe[m] as number
        const ci = s.rotIm[m] as number
        const w = s.pickup[m] as number
        for (let k = 0; k < frames; k++) {
          const next = re * cr - im * ci
          im = re * ci + im * cr
          re = next
          // The pickup hears velocity: the real part, for a displacement in the imaginary.
          mix[k] = (mix[k] as number) + w * re
        }
        s.re[m] = re
        s.im[m] = im
        loud += Math.abs(w) * Math.hypot(re, im)
      }
      s.peak = Math.max(s.peak, loud)
      if (loud < s.peak * 1e-4) s.on = false
    }
    for (let k = 0; k < frames; k++) {
      // The valve DI's gentle rounding of the peaks.
      const x = this.body.tick(this.tone.tick((mix[k] as number) * INPUT))
      const out = (Math.tanh(x * 1.3) / 1.3) * OUTPUT
      left[offset + k] = (left[offset + k] as number) + out * Math.SQRT1_2
      right[offset + k] = (right[offset + k] as number) + out * Math.SQRT1_2
      this.quiet = Math.abs(out) > 1e-6 ? 0 : this.quiet + 1
    }
  }
}
