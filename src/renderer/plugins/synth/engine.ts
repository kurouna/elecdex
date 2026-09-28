import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The synthesiser voices (docs/plugins.md section 13.13): lead, bass, pad and pluck, each a
 * patch on one analogue signal path, as the classic instruments were built.
 *
 * - Oscillators: sawtooth and pulse, band-limited (PolyBLEP) so their edges do not fold back.
 *   The pad's pulse has its width swept by a slow LFO (pulse-width modulation).
 * - A four-pole transistor-ladder low-pass, each pole saturating (tanh) and the resonance fed
 *   back round the four, run at twice the sample rate: the filter that gives these their sound
 *   more than the oscillators do, and why a synthesiser's resonance growls instead of whistling.
 * - Envelopes (attack, decay, sustain, release) for the filter and the amplifier, and LFOs.
 * - The lead is monophonic: a note held into the next glides to it without starting again,
 *   and a held note gets a vibrato after a moment. The pad goes through a bucket-brigade
 *   style chorus: a short delay swept by a slow LFO, inverted between left and right.
 */

export type Patch = 'lead' | 'bass' | 'pad' | 'pluck'

interface PatchSpec {
  /** Oscillators: the wave, its level, its detune in cents and octave shift. */
  oscillators: readonly { wave: 'saw' | 'pulse'; level: number; cents: number; octave: number }[]
  /** Envelopes, seconds, and sustain as a share. */
  amp: { attack: number; decay: number; sustain: number; release: number }
  filter: { attack: number; decay: number; sustain: number; release: number }
  /** Cut-off at rest and the envelope's reach, Hz; resonance 0-1; key tracking share. */
  cutoff: number
  reach: number
  resonance: number
  tracking: number
  /** How much the note's level opens the filter as well as raising the volume. */
  velocity: number
  mono: boolean
  glide: number
  vibrato: { after: number; rate: number; cents: number } | null
  /** A slow sweep of the cut-off, Hz and reach. */
  sweep: { rate: number; reach: number } | null
  pwm: { rate: number; depth: number } | null
  chorus: boolean
  output: number
}

export const PATCHES: Readonly<Record<Patch, PatchSpec>> = {
  lead: {
    oscillators: [
      { wave: 'saw', level: 0.5, cents: -7, octave: 0 },
      { wave: 'saw', level: 0.5, cents: 7, octave: 0 },
      { wave: 'pulse', level: 0.3, cents: 0, octave: -1 },
    ],
    amp: { attack: 0.005, decay: 0.3, sustain: 0.8, release: 0.09 },
    filter: { attack: 0.004, decay: 0.28, sustain: 0.35, release: 0.12 },
    cutoff: 900,
    reach: 3600,
    resonance: 0.4,
    tracking: 0.5,
    velocity: 0.5,
    mono: true,
    glide: 0.06,
    vibrato: { after: 0.35, rate: 5.3, cents: 18 },
    sweep: null,
    pwm: null,
    chorus: false,
    output: 0.83,
  },
  bass: {
    oscillators: [
      { wave: 'saw', level: 0.7, cents: 0, octave: 0 },
      { wave: 'pulse', level: 0.6, cents: 0, octave: -1 },
    ],
    amp: { attack: 0.003, decay: 0.25, sustain: 0.65, release: 0.05 },
    filter: { attack: 0.002, decay: 0.13, sustain: 0.12, release: 0.06 },
    cutoff: 160,
    reach: 2200,
    resonance: 0.5,
    tracking: 0.3,
    velocity: 0.7,
    mono: false,
    glide: 0,
    vibrato: null,
    sweep: null,
    pwm: null,
    chorus: false,
    output: 1.05,
  },
  pad: {
    oscillators: [
      { wave: 'saw', level: 0.45, cents: -11, octave: 0 },
      { wave: 'saw', level: 0.45, cents: 11, octave: 0 },
      { wave: 'pulse', level: 0.4, cents: 0, octave: 0 },
    ],
    amp: { attack: 0.35, decay: 0.6, sustain: 0.85, release: 0.9 },
    filter: { attack: 0.6, decay: 1.6, sustain: 0.55, release: 1 },
    cutoff: 700,
    reach: 1400,
    resonance: 0.18,
    tracking: 0.4,
    velocity: 0.2,
    mono: false,
    glide: 0,
    vibrato: null,
    sweep: { rate: 0.13, reach: 0.35 },
    pwm: { rate: 0.4, depth: 0.35 },
    chorus: true,
    output: 0.57,
  },
  pluck: {
    oscillators: [
      { wave: 'saw', level: 0.6, cents: -4, octave: 0 },
      { wave: 'pulse', level: 0.4, cents: 4, octave: 0 },
    ],
    amp: { attack: 0.001, decay: 0.38, sustain: 0, release: 0.12 },
    filter: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
    cutoff: 280,
    reach: 5200,
    resonance: 0.3,
    tracking: 0.5,
    velocity: 0.5,
    mono: false,
    glide: 0,
    vibrato: null,
    sweep: null,
    pwm: null,
    chorus: false,
    output: 0.79,
  },
}

const VOICES = 10
const OSCILLATORS = 3
/** The ladder runs at twice the sample rate. */
const LADDER_STEPS = 2
/** The chorus: its delay's middle and swing, seconds, and its LFO. */
const CHORUS = { delay: 0.0035, swing: 0.0017, rate: 0.52, mix: 0.5 }

interface Voice {
  on: boolean
  id: number
  pitch: number
  level: number
  /** Frequency now and where it glides to, Hz. */
  freq: number
  target: number
  phases: Float64Array
  /** The envelopes: stage 0 attack .. 3 release, their value, and when the note began. */
  ampStage: number
  amp: number
  filterStage: number
  filter: number
  since: number
  started: number
  /** The ladder's four poles. */
  poles: Float64Array
  left: number
  right: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'release' | 'stop'; id: number }

/**
 * tanh by a rational approximation (a Pade form, clipped): within a fraction of a percent
 * where the ladder works, and several times cheaper than Math.tanh, which it runs ten of a
 * sample a voice.
 */
function softclip(x: number): number {
  if (x > 3) return 1
  if (x < -3) return -1
  const x2 = x * x
  return (x * (27 + x2)) / (27 + 9 * x2)
}

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

export class AnalogEngine implements Instrument {
  private readonly rate: number
  private readonly dt: number
  private readonly spec: PatchSpec
  private readonly voices: Voice[]
  private readonly timeline = new Timeline<Event>()
  private lfo = 0
  /** Each envelope's fall a sample, in decay and in release: worked out once. */
  private readonly ampFall: [number, number]
  private readonly filterFall: [number, number]
  /** The LFOs' values this sample, shared by every voice. */
  private pwmNow = 0.5
  private sweepNow = 1
  /** Each oscillator's frequency against the note's. */
  private readonly ratios: Float64Array
  /** The chorus's last output, left and right (kept here rather than returned in an array). */
  private wetL = 0
  private wetR = 0
  private readonly chorusL: Float32Array
  private readonly chorusR: Float32Array
  private chorusAt = 0
  private quiet = Number.POSITIVE_INFINITY

  constructor(sampleRate: number, patch: Patch) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
    this.spec = PATCHES[patch]
    this.voices = Array.from({ length: this.spec.mono ? 1 : VOICES }, () => ({
      on: false,
      id: 0,
      pitch: 0,
      level: 0,
      freq: 440,
      target: 440,
      phases: new Float64Array(OSCILLATORS),
      ampStage: 3,
      amp: 0,
      filterStage: 3,
      filter: 0,
      since: 0,
      started: 0,
      poles: new Float64Array(4),
      left: Math.SQRT1_2,
      right: Math.SQRT1_2,
    }))
    const fall = (seconds: number) => Math.exp(-this.dt / Math.max(1e-4, seconds / 4))
    this.ampFall = [fall(this.spec.amp.decay), fall(this.spec.amp.release)]
    this.filterFall = [fall(this.spec.filter.decay), fall(this.spec.filter.release)]
    this.ratios = Float64Array.from(this.spec.oscillators, (o) => 2 ** (o.octave + o.cents / 1200))
    const length = Math.ceil(sampleRate * 0.02)
    this.chorusL = new Float32Array(length)
    this.chorusR = new Float32Array(length)
  }

  strike(id: number, pitch: number, level: number, pan: number, at: number): void {
    this.timeline.add({ at, kind: 'strike', id, pitch, level, pan })
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
    for (const v of this.voices) v.on = false
  }

  get busy(): boolean {
    return this.timeline.size > 0 || this.voices.some((v) => v.on) || this.quiet < this.rate * 0.05
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    this.timeline.run(
      frames,
      from,
      (event, now) => this.apply(event, now),
      (offset, count) => this.span(left, right, offset, count, from + offset),
    )
  }

  private apply(event: Event, now: number): void {
    if (event.kind !== 'strike') {
      const v = this.voices.find((x) => x.on && x.id === event.id)
      if (v === undefined) return
      if (event.kind === 'stop') v.on = false
      else {
        v.ampStage = 3
        v.filterStage = 3
      }
      return
    }
    const freq = 440 * 2 ** ((event.pitch - 69) / 12)
    const mono = this.voices[0] as Voice
    if (this.spec.mono && mono.on && mono.ampStage < 3) {
      // Held into the next: glide there, and the envelopes carry on.
      mono.id = event.id
      mono.pitch = event.pitch
      mono.target = freq
      mono.since = now
      return
    }
    const v = this.spec.mono
      ? mono
      : (this.voices.find((x) => !x.on) ??
        this.voices.reduce((a, b) => (a.started <= b.started ? a : b)))
    v.on = true
    v.id = event.id
    v.pitch = event.pitch
    v.level = Math.min(1, Math.max(0, event.level))
    v.freq = freq
    v.target = freq
    v.ampStage = 0
    v.filterStage = 0
    // A new note starts its envelopes from where they are, as the circuits do.
    v.since = now
    v.started = now
    const p = Math.min(1, Math.max(-1, event.pan))
    v.left = Math.cos(((p + 1) * Math.PI) / 4)
    v.right = Math.sin(((p + 1) * Math.PI) / 4)
  }

  /**
   * The envelopes' next values, in place (nothing is allocated per sample): stages 0 attack,
   * 1 decay towards the sustain, 3 release. Attack is a straight rise, the rest exponential.
   */
  private envelopes(v: Voice): void {
    const { amp, filter } = this.spec
    v.amp = this.envelope(v, 'ampStage', v.amp, amp)
    v.filter = this.envelope(v, 'filterStage', v.filter, filter)
  }

  private envelope(
    v: Voice,
    stage: 'ampStage' | 'filterStage',
    value: number,
    shape: { attack: number; decay: number; sustain: number; release: number },
  ): number {
    if (v[stage] === 0) {
      const next = value + this.dt / Math.max(1e-4, shape.attack)
      if (next < 1) return next
      v[stage] = 1
      return 1
    }
    const [decay, release] = stage === 'ampStage' ? this.ampFall : this.filterFall
    if (v[stage] === 1) return shape.sustain + (value - shape.sustain) * decay
    return value * release
  }

  private span(
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
    from: number,
  ): void {
    const spec = this.spec
    if (!this.voices.some((v) => v.on) && this.quiet > this.rate * 0.05) return
    const glide = spec.glide > 0 ? 1 - Math.exp(-this.dt / (spec.glide / 3)) : 1
    for (let k = 0; k < frames; k++) {
      this.lfo += this.dt
      this.lfos()
      this.voicesAt(from + k, glide)
      let l = this.wetL
      let r = this.wetR
      if (spec.chorus) {
        this.chorus(l, r)
        l = this.wetL
        r = this.wetR
      }
      left[offset + k] = (left[offset + k] as number) + l * spec.output
      right[offset + k] = (right[offset + k] as number) + r * spec.output
      this.quiet = Math.abs(l) + Math.abs(r) > 1e-6 ? 0 : this.quiet + 1
    }
  }

  /** Every sounding voice's sample, placed: left in wetL and right in wetR. */
  private voicesAt(now: number, glide: number): void {
    let l = 0
    let r = 0
    for (const v of this.voices) {
      if (!v.on) continue
      const x = this.voiceSample(v, now, glide)
      l += x * v.left
      r += x * v.right
      if (v.ampStage === 3 && v.amp < 1e-5) v.on = false
    }
    this.wetL = l
    this.wetR = r
  }

  private voiceSample(v: Voice, now: number, glide: number): number {
    const spec = this.spec
    v.freq += (v.target - v.freq) * glide
    this.envelopes(v)
    let freq = v.freq
    if (spec.vibrato && v.ampStage < 3) {
      const t = (now - v.since) * this.dt - spec.vibrato.after
      if (t > 0) {
        const depth = Math.min(1, t / 0.4) * spec.vibrato.cents
        freq *= 2 ** ((depth * Math.sin(2 * Math.PI * spec.vibrato.rate * t)) / 1200)
      }
    }
    const width = this.pwmNow
    let osc = 0
    for (let i = 0; i < spec.oscillators.length; i++) {
      const o = spec.oscillators[i] as PatchSpec['oscillators'][number]
      const dt = Math.min(0.49, freq * (this.ratios[i] as number) * this.dt)
      let p = (v.phases[i] as number) + dt
      if (p >= 1) p -= 1
      v.phases[i] = p
      if (o.wave === 'saw') osc += o.level * (2 * p - 1 - blep(p, dt))
      else osc += o.level * ((p < width ? 1 : -1) + blep(p, dt) - blep((p - width + 1) % 1, dt))
    }
    const sweep = this.sweepNow
    const tracked = (v.freq / 261.6) ** spec.tracking
    const opened = 1 - spec.velocity + spec.velocity * v.level
    const cutoff = (spec.cutoff * tracked + spec.reach * v.filter * opened) * sweep
    return this.ladder(v, osc, cutoff) * v.amp * (0.25 + 0.75 * v.level)
  }

  /** The pulse width's and the cut-off's slow LFOs, once a sample for every voice. */
  private lfos(): void {
    const { pwm, sweep } = this.spec
    if (pwm) this.pwmNow = 0.5 + pwm.depth * 0.5 * Math.sin(2 * Math.PI * pwm.rate * this.lfo)
    if (sweep) this.sweepNow = 1 + sweep.reach * Math.sin(2 * Math.PI * sweep.rate * this.lfo)
  }

  /** The transistor ladder: four saturating poles, the resonance fed back round them. */
  private ladder(v: Voice, input: number, cutoff: number): number {
    const fc = Math.min(cutoff, this.rate * 0.45)
    // 1 - exp(-w), by its series: w stays below about 0.7 here.
    const w = (2 * Math.PI * fc) / (this.rate * LADDER_STEPS)
    const g = w * (1 - w * (0.5 - w * (1 / 6 - w / 24)))
    const k = 4 * this.spec.resonance
    const p = v.poles
    for (let s = 0; s < LADDER_STEPS; s++) {
      const x = softclip(input - k * (p[3] as number))
      const t0 = softclip(p[0] as number)
      const t1 = softclip(p[1] as number)
      const t2 = softclip(p[2] as number)
      p[0] = (p[0] as number) + g * (x - t0)
      p[1] = (p[1] as number) + g * (t0 - t1)
      p[2] = (p[2] as number) + g * (t1 - t2)
      p[3] = (p[3] as number) + g * (t2 - softclip(p[3] as number))
    }
    // The resonance takes some of the low end; a real ladder's output stage gives some back.
    return (p[3] as number) * (1 + k * 0.5)
  }

  /** A bucket-brigade chorus: a short delay swept slowly, the other side swept against it. */
  private chorus(l: number, r: number): void {
    const n = this.chorusL.length
    this.chorusL[this.chorusAt] = l
    this.chorusR[this.chorusAt] = r
    const swing = Math.sin(2 * Math.PI * CHORUS.rate * this.lfo)
    const wl = this.tap(this.chorusL, CHORUS.delay + CHORUS.swing * swing)
    const wr = this.tap(this.chorusR, CHORUS.delay - CHORUS.swing * swing)
    this.chorusAt = (this.chorusAt + 1) % n
    this.wetL = l * (1 - CHORUS.mix) + wl * CHORUS.mix
    this.wetR = r * (1 - CHORUS.mix) + wr * CHORUS.mix
  }

  /** A delay line read between samples. */
  private tap(line: Float32Array, delay: number): number {
    const n = line.length
    const pos = (this.chorusAt - delay * this.rate + n * 2) % n
    const i = Math.floor(pos)
    const f = pos - i
    return (line[i % n] as number) * (1 - f) + (line[(i + 1) % n] as number) * f
  }
}
