import { Biquad } from '../instruments/biquad.js'
import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The organ (docs/plugins.md section 13.14): a tonewheel organ into a rotating loudspeaker,
 * as their published descriptions have them, and nothing recorded.
 *
 * - Each key sounds nine sine waves, one per drawbar, at the organ's footages: 16', 5 1/3',
 *   8', 4', 2 2/3', 2', 1 3/5', 1 1/3', 1' (0.5, 1.5, 1, 2, 3, 4, 5, 6 and 8 times the note).
 *   The registration is the classic "888000000" with the third-harmonic percussion. A wheel
 *   above the top of the generator folds back an octave, as the real one's do.
 * - There is no envelope: the key closes nine contacts, which bounce - the key click - and
 *   the note is simply there until the key opens them again.
 * - The percussion (a decaying third harmonic) sounds only on a key struck when none is held:
 *   single-trigger, so a legato line is struck once.
 * - The rotating speaker splits the sound at 800 Hz: a horn above and a drum below, each
 *   turning, so their sound comes nearer and further (a Doppler shift) and louder and softer.
 *   Its preamplifier's valves overdrive a little. The sustain pedal is its speed switch: held,
 *   the rotors run up to tremolo; let go, they coast down to chorale - each at its own pace,
 *   the heavy drum slower than the horn.
 */

/** The drawbars' footages as multiples of the note, and the registration (0-8). */
const FOOTAGES = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8] as const
const DRAWBARS = [8, 8, 8, 0, 0, 0, 0, 0, 0] as const
/** Above this the generator has no wheels: a harmonic folds back an octave. */
const TOP_WHEEL = 5900
/** The percussion: the third harmonic, its level, and its decay (seconds). */
const PERCUSSION = { harmonic: 3, level: 0.55, decay: 0.22 }
const CLICK = { level: 0.3, decay: 0.004 }
const VOICES = 16
/** The rotors' speeds (turns a second), slow and fast, and their pace of change (seconds). */
const HORN = { slow: 0.83, fast: 6.75, pace: 0.9 }
const DRUM = { slow: 0.7, fast: 5.9, pace: 3.2 }
/** How far each rotor's sound travels towards and away (seconds of delay), and its swell. */
const HORN_SWING = 0.00028
const DRUM_SWING = 0.00012
const HORN_SWELL = 0.35
const DRUM_SWELL = 0.18
const DRIVE = 1.6
const TURN = 2 * Math.PI
const OUTPUT = 0.64

interface Key {
  on: boolean
  id: number
  pitch: number
  phases: Float64Array
  steps: Float64Array
  gains: Float64Array
  level: number
  /** The percussion's and the click's envelopes, falling a step a sample. */
  percussionNow: number
  clickNow: number
  held: boolean
  /** The contacts' ramp (on) and fade (off). */
  gate: number
  started: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'release' | 'stop'; id: number }
  | { at: number; kind: 'pedal'; on: boolean }

class Noise {
  private seed = 99
  next(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0
    return this.seed / 2147483648 - 1
  }
}

export class OrganEngine implements Instrument {
  private readonly rate: number
  private readonly dt: number
  private readonly keys: Key[]
  private readonly timeline = new Timeline<Event>()
  private readonly noise = new Noise()
  private readonly click: Biquad
  private readonly lowSplit: [Biquad, Biquad]
  private readonly highSplit: [Biquad, Biquad]
  private readonly lines = { horn: new Float32Array(1024), drum: new Float32Array(1024) }
  private at = 0
  private hornAngle = 0
  private drumAngle = 0
  private hornSpeed = HORN.slow
  private drumSpeed = DRUM.slow
  private fast = false
  private quiet = Number.POSITIVE_INFINITY
  private readonly percussionFall: number
  private readonly clickFall: number

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
    this.keys = Array.from({ length: VOICES }, () => ({
      on: false,
      id: 0,
      pitch: 0,
      phases: new Float64Array(FOOTAGES.length + 1),
      steps: new Float64Array(FOOTAGES.length + 1),
      gains: new Float64Array(FOOTAGES.length + 1),
      level: 0,
      percussionNow: 0,
      clickNow: 0,
      held: false,
      gate: 0,
      started: 0,
    }))
    this.percussionFall = Math.exp(-this.dt / PERCUSSION.decay)
    this.clickFall = Math.exp(-this.dt / CLICK.decay)
    this.click = new Biquad('bandpass', 2500, 0.8, sampleRate)
    // The crossover: fourth-order (two second-order stages) each side.
    this.lowSplit = [
      new Biquad('lowpass', 800, Math.SQRT1_2, sampleRate),
      new Biquad('lowpass', 800, Math.SQRT1_2, sampleRate),
    ]
    this.highSplit = [
      new Biquad('highpass', 800, Math.SQRT1_2, sampleRate),
      new Biquad('highpass', 800, Math.SQRT1_2, sampleRate),
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

  /** The sustain pedal is the rotating speaker's speed switch. */
  pedal(on: boolean, at: number): void {
    this.timeline.add({ at, kind: 'pedal', on })
  }

  stopAll(): void {
    this.timeline.clear()
    for (const key of this.keys) key.on = false
  }

  /** The rotors' speeds now, turns a second: for the tests. */
  get rotors(): { horn: number; drum: number } {
    return { horn: this.hornSpeed, drum: this.drumSpeed }
  }

  get busy(): boolean {
    return this.timeline.size > 0 || this.keys.some((k) => k.on) || this.quiet < this.rate * 0.1
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
    if (event.kind === 'pedal') {
      this.fast = event.on
      return
    }
    if (event.kind === 'strike') {
      this.press(event, now)
      return
    }
    const key = this.keys.find((k) => k.on && k.id === event.id)
    if (key === undefined) return
    key.held = false
    if (event.kind === 'stop') key.gate = 0
  }

  private press(event: Extract<Event, { kind: 'strike' }>, now: number): void {
    const f0 = 440 * 2 ** ((event.pitch - 69) / 12)
    // Single-trigger: the percussion only for a key struck with none held.
    const alone = !this.keys.some((k) => k.on && k.held)
    const key =
      this.keys.find((k) => k.on && k.pitch === event.pitch) ??
      this.keys.find((k) => !k.on) ??
      this.keys.reduce((a, b) => (a.started <= b.started ? a : b))
    key.on = true
    key.id = event.id
    key.pitch = event.pitch
    key.level = 0.45 + 0.55 * Math.min(1, Math.max(0, event.level))
    key.percussionNow = alone ? PERCUSSION.level : 0
    key.clickNow = key.level
    key.held = true
    key.started = now
    FOOTAGES.forEach((footage, i) => {
      let f = f0 * footage
      while (f > TOP_WHEEL) f /= 2
      key.steps[i] = (2 * Math.PI * f) / this.rate
      key.gains[i] = (DRAWBARS[i] as number) / 8
    })
    const p = FOOTAGES.length
    key.steps[p] = (2 * Math.PI * Math.min(TOP_WHEEL, f0 * PERCUSSION.harmonic)) / this.rate
    key.gains[p] = alone ? PERCUSSION.level : 0
  }

  private span(left: Float32Array, right: Float32Array, offset: number, frames: number): void {
    if (!this.keys.some((k) => k.on) && this.quiet > this.rate * 0.1) return
    const ramp = this.dt / 0.002
    for (let k = 0; k < frames; k++) {
      let organ = 0
      let click = 0
      for (const key of this.keys) {
        if (!key.on) continue
        organ += this.wheels(key, ramp)
        click += key.clickNow
      }
      organ = organ * 0.25 + this.click.tick(this.noise.next()) * click * CLICK.level
      this.rotate(organ, left, right, offset + k)
    }
  }

  /** One key's wheels for a sample, through its contacts; a key let go closes and stops. */
  private wheels(key: Key, ramp: number): number {
    key.gate = key.held ? Math.min(1, key.gate + ramp) : Math.max(0, key.gate - ramp)
    if (!key.held && key.gate <= 0) {
      key.on = false
      return 0
    }
    key.percussionNow *= this.percussionFall
    key.clickNow *= this.clickFall
    key.gains[FOOTAGES.length] = key.percussionNow
    let sum = 0
    for (let i = 0; i < FOOTAGES.length + 1; i++) {
      const phase = (key.phases[i] as number) + (key.steps[i] as number)
      key.phases[i] = phase > TURN ? phase - TURN : phase
      const gain = key.gains[i] as number
      if (gain > 1e-4) sum += gain * Math.sin(phase)
    }
    return sum * key.gate * key.level
  }

  /** The preamp's valves, the crossover, and the two rotors heard by a microphone each side. */
  private rotate(x: number, left: Float32Array, right: Float32Array, i: number): void {
    const driven = Math.tanh(x * DRIVE) / DRIVE
    const low = this.lowSplit[1].tick(this.lowSplit[0].tick(driven))
    const high = this.highSplit[1].tick(this.highSplit[0].tick(driven))
    // The rotors speed towards the switch's speed at their own pace.
    this.hornSpeed += ((this.fast ? HORN.fast : HORN.slow) - this.hornSpeed) * (this.dt / HORN.pace)
    this.drumSpeed += ((this.fast ? DRUM.fast : DRUM.slow) - this.drumSpeed) * (this.dt / DRUM.pace)
    this.hornAngle = (this.hornAngle + 2 * Math.PI * this.hornSpeed * this.dt) % (2 * Math.PI)
    this.drumAngle = (this.drumAngle + 2 * Math.PI * this.drumSpeed * this.dt) % (2 * Math.PI)
    const n = this.lines.horn.length
    this.lines.horn[this.at] = high
    this.lines.drum[this.at] = low
    // Two microphones a quarter turn apart: each hears the rotors' own swing.
    const l = this.mic(Math.cos(this.hornAngle), Math.cos(this.drumAngle))
    const r = this.mic(Math.sin(this.hornAngle), Math.sin(this.drumAngle))
    this.at = (this.at + 1) % n
    left[i] = (left[i] as number) + l * OUTPUT
    right[i] = (right[i] as number) + r * OUTPUT
    this.quiet = Math.abs(l) + Math.abs(r) > 1e-6 ? 0 : this.quiet + 1
  }

  /** What one microphone hears: each rotor nearer and louder, then further and softer. */
  private mic(h: number, d: number): number {
    const horn = this.tap(this.lines.horn, HORN_SWING * (1 + h)) * (1 + HORN_SWELL * h)
    const drum = this.tap(this.lines.drum, DRUM_SWING * (1 + d)) * (1 + DRUM_SWELL * d)
    return horn + drum
  }

  private tap(line: Float32Array, delay: number): number {
    const n = line.length
    const pos = (this.at - delay * this.rate + n) % n
    const i = Math.floor(pos)
    const f = pos - i
    return (line[i % n] as number) * (1 - f) + (line[(i + 1) % n] as number) * f
  }
}
