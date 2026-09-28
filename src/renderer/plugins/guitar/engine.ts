import { Biquad } from '../instruments/biquad.js'
import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'
import { Amp } from './amp.js'
import { frettingsFor, type GuitarModes, modesOf, STRINGS } from './model.js'

/**
 * The lead guitar (docs/plugins.md section 13.9): six strings played as a guitarist plays them,
 * through a pickup and an overdriven amplifier; the cabinet, the delay and the room are the
 * page's.
 *
 * - A note is played on the string and fret a lead player would use (model.ts), and a string
 *   plays one note at a time: a second note on a ringing string stops the first, as it does.
 * - A new note while one is still held, and not struck with it as a chord, is played legato:
 *   within two frets a hammer-on or a pull-off (the pitch moves at once, the finger adds a
 *   little energy), further a slide (the pitch glides, nothing is picked). Only while the
 *   string still rings, though: one that has died down is picked again, as a player would -
 *   a melody whose keys each ring into the next (a rhythm game's) otherwise slid on and on
 *   along one fading string, and fell silent. Letting a key go mutes the string with the
 *   fretting hand.
 * - A held note gets a bend vibrato after a moment - up from the note and back, never below
 *   it, as a bent string can only rise - and then the amplifier's feedback: its sound reaches
 *   the strings a few milliseconds later and keeps them going, so a held note sustains and
 *   blooms instead of dying.
 * - The strings are modal (decaying phasors, as the piano's), their frequencies retuned every
 *   block for the vibrato and the glides. Nothing is allocated per note: each string is one
 *   voice, kept.
 */

/** How close to a held note's start a new one is part of the same chord, not a legato, seconds. */
const CHORD_WINDOW = 0.035
/** Legato only within an octave; further, the new note is picked. */
const LEGATO_WITHIN = 12
/**
 * Legato only while the held string is still this loud against its pick (-8 dB); below, the
 * new note is picked. A hammer-on adds a third of a pick and a slide nothing, so a run of them
 * on a fading string would reach the amplifier ever quieter.
 */
const LEGATO_WHILE = 0.4
/** Seconds the pitch takes to move: a hammer-on or pull-off, and a slide per fret. */
const HAMMER_TIME = 0.006
const SLIDE_TIME = 0.03
const SLIDE_PER_FRET = 0.009
/** The bend vibrato: when it starts, how long it takes to reach its depth, its rate and depth. */
const VIBRATO_AFTER = 0.32
const VIBRATO_RISE = 0.5
const VIBRATO_RATE = 5.4
const VIBRATO_CENTS = 32
/** The amplifier's feedback: when a held note starts to feed back, how fast it builds, how much. */
const FEEDBACK_AFTER = 0.6
const FEEDBACK_RISE = 1.6
const FEEDBACK = 2
/** Samples from the speaker back to the strings (about a metre of air), at least one block. */
const FEEDBACK_DELAY = 150
const RING = 1024
/** Decay per second the fretting hand adds when it lets go, and a stop's. */
const MUTE = 6.9078 / 0.12
const CUT = 250
/** The pick: how hard it pushes the string, and how bright a soft and a hard stroke are (Hz). */
const PICK = 2.2e-3
const SOFT_EDGE = 1800
const HARD_EDGE = 7000
/** What a hammered or pulled finger adds, as a share of a pick. */
const FINGER = 0.3
/** Modes fallen this far below the note's loudest are dropped (-90 dB). */
const CULL_BELOW = 3e-5
/** The pickup's signal into the amplifier. */
const INPUT = 55
const MAX_MODES = 200

interface StringVoice {
  modes: GuitarModes | null
  id: number
  pitch: number
  count: number
  yRe: Float64Array
  yIm: Float64Array
  rotRe: Float64Array
  rotIm: Float64Array
  omega: Float64Array
  decay: Float64Array
  pickup: Float64Array
  feed: Float64Array
  factor: number
  glideFrom: number
  glideTo: number
  glideStart: number
  glideLength: number
  /** Frame the note began (or arrived by legato): its vibrato and feedback count from here. */
  since: number
  struck: number
  held: boolean
  cut: boolean
  /** How loud the string is (as the cull measures it), and the most since it was picked. */
  loud: number
  peak: number
  pan: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'release' | 'stop'; id: number }

export class GuitarEngine implements Instrument {
  private readonly rate: number
  private readonly dt: number
  private readonly strings: StringVoice[]
  private readonly timeline = new Timeline<Event>()
  private readonly amp: Amp
  private mix = new Float64Array(128)
  private drive = new Float64Array(128)
  /** The amplifier's output, kept for the feedback that reaches the strings later. */
  private readonly ring = new Float64Array(RING)
  private ringAt = 0
  private readonly feedbackBand: [Biquad, Biquad]
  /** Samples since the amplifier last gave anything: it rests once its tail has gone. */
  private quiet = Number.POSITIVE_INFINITY
  private pan = 0

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
    this.amp = new Amp(sampleRate)
    this.strings = STRINGS.map(() => stringVoice())
    // The air and the body pass the middle of the amplifier's sound back, not its fizz or its thump.
    this.feedbackBand = [
      new Biquad('highpass', 150, 0.7, sampleRate),
      new Biquad('lowpass', 1600, 0.7, sampleRate),
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
    for (const s of this.strings) if (s.modes !== null) this.mute(s, true)
  }

  get busy(): boolean {
    return (
      this.timeline.size > 0 ||
      this.strings.some((s) => s.modes !== null) ||
      this.quiet < this.rate * 0.2
    )
  }

  /** Strings sounding now, for the tests. */
  get sounding(): number {
    return this.strings.filter((s) => s.modes !== null).length
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    if (this.mix.length < frames) {
      this.mix = new Float64Array(frames)
      this.drive = new Float64Array(frames)
    }
    this.timeline.run(
      frames,
      from,
      (event, now) => this.apply(event, now),
      (offset, count) => this.span(left, right, offset, count, from + offset),
    )
    this.cull()
  }

  private apply(event: Event, now: number): void {
    if (event.kind === 'strike') {
      this.play(event, now)
      return
    }
    const s = this.strings.find((v) => v.modes !== null && v.id === event.id)
    if (s === undefined) return
    if (event.kind === 'stop') this.mute(s, true)
    else if (s.held) {
      s.held = false
      this.retune(s, now, true)
    }
  }

  /** A note: legato on the one held string if it can be, picked otherwise. */
  private play(event: Extract<Event, { kind: 'strike' }>, now: number): void {
    this.pan = event.pan
    const held = this.strings.filter((s) => s.modes !== null && s.held && !s.cut)
    const lone = held.length === 1 ? held[0] : undefined
    if (
      lone !== undefined &&
      now - lone.since > CHORD_WINDOW * this.rate &&
      lone.loud >= lone.peak * LEGATO_WHILE &&
      event.pitch !== lone.pitch &&
      Math.abs(event.pitch - lone.pitch) <= LEGATO_WITHIN
    ) {
      this.legato(lone, event, now)
      return
    }
    this.pick(event, now)
  }

  private pick(event: Extract<Event, { kind: 'strike' }>, now: number): void {
    // A chord's notes take a string each: one struck with this note is not taken again.
    const window = CHORD_WINDOW * this.rate
    const places = frettingsFor(event.pitch)
    const free = places.find((f) => {
      const s = this.strings[f.string] as StringVoice
      return s.modes === null || s.cut || now - s.struck > window
    })
    const modes = modesOf(event.pitch, this.rate, free ?? places[0])
    const s = this.strings[modes.string] as StringVoice
    const count = Math.min(MAX_MODES, modes.count)
    const again = s.modes !== null && !s.cut
    s.modes = modes
    s.id = event.id
    s.pitch = event.pitch
    s.count = count
    s.factor = 1
    s.glideFrom = 1
    s.glideTo = 1
    s.glideLength = 0
    s.since = now
    s.struck = now
    s.held = true
    s.cut = false
    s.pan = event.pan
    const level = Math.min(1, Math.max(0, event.level))
    const edge = SOFT_EDGE + (HARD_EDGE - SOFT_EDGE) * level
    const push = PICK * level ** 0.7
    for (let k = 0; k < count; k++) {
      s.omega[k] = modes.omega[k] as number
      s.decay[k] = modes.decay[k] as number
      s.pickup[k] = modes.pickup[k] as number
      s.feed[k] = 1 / (k + 1)
      const f = (modes.omega[k] as number) / (2 * Math.PI)
      // Released from rest, so displacement and no velocity: a pick on a ringing string stops
      // most of what it held.
      const a = push * (modes.pluck[k] as number) * Math.exp(-f / edge)
      s.yRe[k] = again ? 0.15 * (s.yRe[k] as number) : 0
      s.yIm[k] = a + (again ? 0.15 * (s.yIm[k] as number) : 0)
    }
    s.loud = 0
    s.peak = 0
    this.retune(s, now, true)
  }

  private legato(s: StringVoice, event: Extract<Event, { kind: 'strike' }>, now: number): void {
    const base = s.modes as GuitarModes
    const interval = Math.abs(event.pitch - s.pitch)
    const target = 2 ** ((event.pitch - s.pitch) / 12) * s.glideTo
    s.glideFrom = s.factor
    s.glideTo = target
    s.glideStart = now
    s.glideLength = Math.round(
      (interval <= 2 ? HAMMER_TIME : SLIDE_TIME + SLIDE_PER_FRET * interval) * this.rate,
    )
    s.id = event.id
    s.pitch = event.pitch
    s.since = now
    // A hammered or pulled finger sets the string going a little; a slide adds nothing.
    if (interval <= 2) {
      const push = PICK * FINGER * Math.min(1, Math.max(0, event.level)) ** 0.7
      for (let k = 0; k < s.count; k++)
        s.yIm[k] = (s.yIm[k] as number) + push * (base.pluck[k] as number)
    }
    this.retune(s, now, true)
  }

  private mute(s: StringVoice, cut: boolean): void {
    s.held = false
    s.cut = s.cut || cut
    this.retune(s, 0, true)
  }

  /** The string's pitch now: its glide, then the vibrato of a held note. */
  private factorAt(s: StringVoice, now: number): number {
    let glide = s.glideTo
    if (s.glideLength > 0 && now < s.glideStart + s.glideLength) {
      const x = (now - s.glideStart) / s.glideLength
      // Eased: a finger slides off slowly and arrives firmly.
      glide = s.glideFrom * (s.glideTo / s.glideFrom) ** (x * x * (3 - 2 * x))
    }
    if (!s.held) return glide
    const t = (now - s.since) / this.rate - VIBRATO_AFTER
    if (t <= 0) return glide
    const depth = Math.min(1, t / VIBRATO_RISE)
    const swing = 0.5 - 0.5 * Math.cos(2 * Math.PI * VIBRATO_RATE * t)
    return glide * 2 ** ((VIBRATO_CENTS * depth * swing) / 1200)
  }

  /** Retunes a string's modes when its pitch or its damping has moved. */
  private retune(s: StringVoice, now: number, force: boolean): void {
    const factor = force ? s.factor : this.factorAt(s, now)
    if (!force && Math.abs(factor - s.factor) < 1e-7) return
    s.factor = factor
    const extra = s.cut ? CUT : s.held ? 0 : MUTE
    const limit = Math.PI * 0.9
    for (let k = 0; k < s.count; k++) {
      const w = (s.omega[k] as number) * factor * this.dt
      const r = w < limit ? Math.exp(-((s.decay[k] as number) + extra) * this.dt) : 0
      s.rotRe[k] = r * Math.cos(w)
      s.rotIm[k] = r * Math.sin(w)
    }
  }

  private feedbackGain(s: StringVoice, now: number): number {
    if (!s.held || s.cut) return 0
    const t = (now - s.since) / this.rate - FEEDBACK_AFTER
    return t <= 0 ? 0 : FEEDBACK * Math.min(1, t / FEEDBACK_RISE)
  }

  private span(
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
    now: number,
  ): void {
    const { mix } = this
    mix.fill(0, 0, frames)
    this.feedbackDrive(frames)
    let any = false
    for (const s of this.strings) {
      if (s.modes === null) continue
      any = true
      this.retune(s, now, false)
      this.sound(s, frames, this.feedbackGain(s, now))
    }
    if (!any && this.quiet > this.rate * 0.2) {
      this.remember(frames)
      return
    }
    for (let k = 0; k < frames; k++) mix[k] = (mix[k] as number) * INPUT
    this.amp.process(mix, frames)
    const l = Math.cos(((this.pan + 1) * Math.PI) / 4)
    const r = Math.sin(((this.pan + 1) * Math.PI) / 4)
    let loud = 0
    for (let k = 0; k < frames; k++) {
      const x = mix[k] as number
      loud = Math.max(loud, Math.abs(x))
      left[offset + k] = (left[offset + k] as number) + x * l
      right[offset + k] = (right[offset + k] as number) + x * r
    }
    this.quiet = loud > 1e-5 ? 0 : this.quiet + frames
    this.remember(frames)
  }

  /** The amplifier's sound of FEEDBACK_DELAY samples ago, through the air's band, into `drive`. */
  private feedbackDrive(frames: number): void {
    const [low, high] = this.feedbackBand
    for (let k = 0; k < frames; k++) {
      const x = this.ring[(this.ringAt + k - FEEDBACK_DELAY + RING * 2) % RING] as number
      this.drive[k] = high.tick(low.tick(x))
    }
  }

  /** Keeps this span's output for the feedback; nothing (silence) when the amplifier rests. */
  private remember(frames: number): void {
    for (let k = 0; k < frames; k++) {
      this.ring[(this.ringAt + k) % RING] =
        this.quiet > this.rate * 0.2 ? 0 : (this.mix[k] as number)
    }
    this.ringAt = (this.ringAt + frames) % RING
  }

  /** The string's modes turning, fed back if held long enough, heard by the pickup into `mix`. */
  private sound(s: StringVoice, frames: number, feedback: number): void {
    const { mix, drive } = this
    const g = feedback * this.dt
    for (let m = 0; m < s.count; m++) {
      let re = s.yRe[m] as number
      let im = s.yIm[m] as number
      const cr = s.rotRe[m] as number
      const ci = s.rotIm[m] as number
      const w = s.pickup[m] as number
      const feed = g * (s.feed[m] as number)
      for (let k = 0; k < frames; k++) {
        const pushed = im + feed * (drive[k] as number)
        const next = re * cr - pushed * ci
        im = re * ci + pushed * cr
        re = next
        // The pickup hears the string's velocity: the real part, for a displacement in the imaginary.
        mix[k] = (mix[k] as number) + w * re
      }
      s.yRe[m] = re
      s.yIm[m] = im
    }
  }

  /** Drops the modes that have died, and frees a string with none left. */
  private cull(): void {
    for (const s of this.strings) {
      if (s.modes === null) continue
      let loud = 0
      for (let k = 0; k < s.count; k++)
        loud += Math.abs(s.pickup[k] as number) * Math.hypot(s.yRe[k] as number, s.yIm[k] as number)
      s.loud = loud
      s.peak = Math.max(s.peak, loud)
      if (loud < s.peak * CULL_BELOW || loud === 0) s.modes = null
    }
  }
}

function stringVoice(): StringVoice {
  const a = () => new Float64Array(MAX_MODES)
  return {
    modes: null,
    id: 0,
    pitch: 0,
    count: 0,
    yRe: a(),
    yIm: a(),
    rotRe: a(),
    rotIm: a(),
    omega: a(),
    decay: a(),
    pickup: a(),
    feed: a(),
    factor: 1,
    glideFrom: 1,
    glideTo: 1,
    glideStart: 0,
    glideLength: 0,
    since: 0,
    struck: 0,
    held: false,
    cut: false,
    loud: 0,
    peak: 0,
    pan: 0,
  }
}
