import type { Instrument } from '../instruments/host.js'
import { blowSpeed, damperDecay, HIGH_KEY, type KeyModel, keyModel, LOW_KEY } from './model.js'
import { Sympathy } from './sympathy.js'

/**
 * The piano's strings sounding (docs/plugins.md section 13.8): one engine per pane, an
 * instrument of the audio thread's host (instruments/host.ts) or of a script. Each key is a
 * set of decaying phasors, one per mode of its unison (model.ts); a strike runs the hammer against them sample by sample, four
 * steps to a sample while the felt touches the strings, and after that each mode only turns.
 *
 * A key is its strings, not a note: striking a key that still rings strikes the same strings
 * again, and the hammer meets them where they are. Letting go lowers the damper, which only
 * adds decay; the top keys have none and ring on. Modes that have fallen 90 dB below the
 * note's loudest are dropped, so a held chord's cost falls as its upper partials die.
 *
 * What the strings put on the bridge also stretches them (the longitudinal push, model.ts)
 * and rings the strings nobody struck (sympathy.ts), while the pedal is down.
 *
 * Plain JS on typed arrays, loops innermost over samples, and nothing allocated per block.
 */

/**
 * Steps of the hammer's contact across a mezzo-forte blow, at the least: one step a sample
 * in the bass, whose felt touches for milliseconds, up to four in the treble, whose barely does.
 */
const CONTACT_RESOLUTION = 64
const MAX_CONTACT_STEPS = 4

/** Steps a sample for a key's contact at a sample rate. */
export function contactSteps(model: KeyModel, sampleRate: number): number {
  const samples = model.hammer.contact * sampleRate
  return Math.min(MAX_CONTACT_STEPS, Math.max(1, Math.ceil(CONTACT_RESOLUTION / samples)))
}
/** How long the hammer stays by the strings after a strike, in seconds; it may touch twice. */
const HAMMER_WINDOW = 0.012
/** Modes fallen this far below the note's loudest are dropped (-90 dB). */
const CULL_BELOW = 3e-5
/** Every pane's piano together keeps at most this many modes turning. */
export const MODE_BUDGET = 7000
/** Newtons on the bridge to full scale, set so a mezzo-forte C4 sits near the other voices. */
const OUTPUT_GAIN = 0.019
/** Across the keyboard, the bass to the left and the treble to the right, as the player hears. */
const KEY_SPREAD = 0.28
/** The share of the hammer's force that reaches the soundboard other than by the strings. */
const KNOCK = 0.25
/** Decay per second that cuts a note short, as the synthesiser's stop does. */
const CUT_DECAY = 250
/** The longitudinal push is heard above this, Hz: its slow part is the note's own swell. */
const STRETCH_ABOVE = 30
/** Seconds a longitudinal mode rings, and how far it stands above the push that rings it. */
const STRETCH_RING = 0.25
const STRETCH_PEAK = 1.5

/**
 * The keys in the order their models are made ahead of time: out from middle C, where most
 * music is. A key's model takes a fraction of a millisecond to a couple (the long bass), which
 * the audio thread can spare in a quiet block but not in one that strikes a chord of new keys.
 */
const WARM_ORDER = Array.from({ length: HIGH_KEY - LOW_KEY + 1 }, (_, i) => i + LOW_KEY).sort(
  (a, b) => Math.abs(a - 60.5) - Math.abs(b - 60.5),
)

/** Where a key sits between the speakers, as left and right gains, before a note's own pan. */
export function keyPan(pitch: number, pan = 0): [number, number] {
  const key = Math.min(HIGH_KEY, Math.max(LOW_KEY, pitch))
  const p = Math.min(1, Math.max(-1, pan + ((key - 64.5) / 43.5) * KEY_SPREAD))
  return [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)]
}

interface Hammer {
  on: boolean
  /** Whether the felt has touched the strings in this blow. */
  struck: boolean
  x: number
  v: number
  force: number
  squeeze: number
  time: number
}

/** A voice's longitudinal push: a high-pass on its square, and the modes it rings. */
interface Stretch {
  force: number
  lastIn: number
  lastOut: number
  re: Float64Array
  im: Float64Array
  rotRe: Float64Array
  rotIm: Float64Array
  gain: number
}

interface Voice {
  model: KeyModel
  stretch: Stretch
  id: number
  /** Which of the model's modes each slot holds. */
  index: Int32Array
  count: number
  yRe: Float64Array
  yIm: Float64Array
  rotRe: Float64Array
  rotIm: Float64Array
  subRe: Float64Array
  subIm: Float64Array
  /** Contact steps a sample for this key. */
  steps: number
  gainRe: Float64Array
  gainIm: Float64Array
  hammerWeight: Float64Array
  bridgeWeight: Float64Array
  hammer: Hammer
  damped: boolean
  cut: boolean
  left: number
  right: number
  peak: number
  struck: number
}

type EventKind = 'strike' | 'release' | 'stop' | 'pedal'

interface PianoEvent {
  kind: EventKind
  at: number
  id: number
  pitch: number
  level: number
  pan: number
}

export class PianoEngine implements Instrument {
  readonly sampleRate: number
  private readonly dt: number
  private readonly voices = new Map<number, Voice>()
  private readonly byId = new Map<number, number>()
  private events: PianoEvent[] = []
  private mix = new Float64Array(128)
  /** A restruck key's modes, by the model's order, while they are put back in place. */
  private scratchRe = new Float64Array(0)
  private scratchIm = new Float64Array(0)
  /** The force every sounding string puts on the bridge, which rings the free ones. */
  private drive = new Float64Array(128)
  private readonly sympathy: Sympathy
  private readonly highPass: number
  /** Keys whose models have been made ahead of time (warm), in WARM_ORDER. */
  private warmed = 0

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate
    this.dt = 1 / sampleRate
    this.sympathy = new Sympathy(sampleRate, (key) => keyPan(key))
    this.highPass = Math.exp((-2 * Math.PI * STRETCH_ABOVE) / sampleRate)
  }

  /** Strikes a key at a frame (the audio clock's), a level 0-1 standing for the blow. */
  strike(id: number, pitch: number, level: number, pan: number, at: number): void {
    this.queue({ kind: 'strike', at, id, pitch: Math.round(pitch), level, pan })
  }

  /** Lets go of the key a strike pressed: its damper falls, if it has one. */
  release(id: number, at: number): void {
    this.queue({ kind: 'release', at, id, pitch: 0, level: 0, pan: 0 })
  }

  /** Cuts a strike's key short. */
  stop(id: number, at: number): void {
    this.queue({ kind: 'stop', at, id, pitch: 0, level: 0, pan: 0 })
  }

  /** The sustain pedal: every damper up while it is down (the free strings ring along). */
  pedal(on: boolean, at: number): void {
    this.queue({ kind: 'pedal', at, id: 0, pitch: 0, level: on ? 1 : 0, pan: 0 })
  }

  /** Cuts everything short and forgets what waits. */
  stopAll(): void {
    this.events = []
    for (const voice of this.voices.values()) this.cutVoice(voice)
    this.sympathy.hushAll()
  }

  /** Whether anything sounds or waits to. */
  get busy(): boolean {
    return this.voices.size > 0 || this.events.length > 0 || this.sympathy.ringing
  }

  /** Hammers still at the strings, for the tests. */
  get hammers(): number {
    let sum = 0
    for (const voice of this.voices.values()) if (voice.hammer.on) sum++
    return sum
  }

  /** Modes turning now, for the budget and the tests. */
  get modes(): number {
    let sum = 0
    for (const voice of this.voices.values()) sum += voice.count
    return sum
  }

  /** Adds the next `frames` samples, from frame `from`, into left and right. */
  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    let done = 0
    while (done < frames) {
      const now = from + done
      while (this.events.length > 0 && (this.events[0] as PianoEvent).at <= now) {
        this.apply(this.events.shift() as PianoEvent, now)
      }
      const next = this.events[0]?.at ?? Number.POSITIVE_INFINITY
      const run = Math.min(frames - done, Math.max(1, next - now))
      this.renderSpan(left, right, done, run)
      done += run
    }
    this.cull()
    this.warm()
  }

  /** Makes one more key's model while no hammer is at work, until every key has one. */
  private warm(): void {
    if (this.warmed >= WARM_ORDER.length) return
    for (const voice of this.voices.values()) if (voice.hammer.on) return
    keyModel(WARM_ORDER[this.warmed] as number, this.sampleRate)
    this.warmed++
  }

  private queue(event: PianoEvent): void {
    // Kept in order of time, and in order of arrival at one time: a release then a strike of
    // the same key at one moment re-strikes it.
    let i = this.events.length
    while (i > 0 && (this.events[i - 1] as PianoEvent).at > event.at) i--
    this.events.splice(i, 0, event)
  }

  private apply(event: PianoEvent, now: number): void {
    if (event.kind === 'strike') {
      this.strikeNow(event, now)
      return
    }
    if (event.kind === 'pedal') {
      this.sympathy.setPedal(event.level > 0)
      return
    }
    const pitch = this.byId.get(event.id)
    const voice = pitch === undefined ? undefined : this.voices.get(pitch)
    if (voice === undefined || voice.id !== event.id) return
    if (event.kind === 'stop') this.cutVoice(voice)
    else if (voice.model.dampered && !voice.damped) {
      voice.damped = true
      this.setRotation(voice)
    }
  }

  private strikeNow(event: PianoEvent, now: number): void {
    const pitch = Math.min(127, Math.max(0, event.pitch))
    const model = keyModel(pitch, this.sampleRate)
    const before = this.voices.get(pitch)
    const voice = this.freshVoice(model, before)
    if (before) this.byId.delete(before.id)
    voice.id = event.id
    voice.struck = now
    this.byId.set(event.id, pitch)
    const [left, right] = keyPan(pitch, event.pan)
    voice.left = left
    voice.right = right
    // The hammer arrives at the strings where they are, at the speed of the blow.
    const speed = blowSpeed(event.level)
    const h = voice.hammer
    h.on = true
    h.v = speed
    h.x = this.stringUnderHammer(voice) - speed * this.dt * 0.25
    h.force = 0
    h.squeeze = 0
    h.time = 0
    h.struck = false
    this.voices.set(pitch, voice)
    this.setRotation(voice)
  }

  /** A voice with every mode of the key, carrying over what still rings of the strings. */
  private freshVoice(model: KeyModel, before: Voice | undefined): Voice {
    if (before) return this.restring(before)
    const n = model.count
    const voice: Voice = {
      model,
      stretch: this.stretchOf(model, before),
      id: 0,
      index: new Int32Array(n),
      count: n,
      yRe: new Float64Array(n),
      yIm: new Float64Array(n),
      rotRe: new Float64Array(n),
      rotIm: new Float64Array(n),
      subRe: new Float64Array(n),
      subIm: new Float64Array(n),
      steps: contactSteps(model, this.sampleRate),
      gainRe: model.gainRe.slice(),
      gainIm: model.gainIm.slice(),
      hammerWeight: model.hammerWeight.slice(),
      bridgeWeight: model.bridgeWeight.slice(),
      hammer: { on: false, struck: false, x: 0, v: 0, force: 0, squeeze: 0, time: 0 },
      damped: false,
      cut: false,
      left: 0,
      right: 0,
      peak: 0,
      struck: 0,
    }
    for (let i = 0; i < n; i++) voice.index[i] = i
    return voice
  }

  /**
   * A ringing key struck again: the same voice, every mode of the key back in its slot, each
   * where the strings left it (nothing, if they were cut). Nothing is allocated: a fast
   * repeated note must not make garbage on the audio thread.
   */
  private restring(voice: Voice): Voice {
    const { model } = voice
    const n = model.count
    if (this.scratchRe.length < n) {
      this.scratchRe = new Float64Array(n)
      this.scratchIm = new Float64Array(n)
    }
    const { scratchRe, scratchIm } = this
    scratchRe.fill(0, 0, n)
    scratchIm.fill(0, 0, n)
    if (!voice.cut) {
      for (let s = 0; s < voice.count; s++) {
        const i = voice.index[s] as number
        scratchRe[i] = voice.yRe[s] as number
        scratchIm[i] = voice.yIm[s] as number
      }
    }
    voice.yRe.set(scratchRe.subarray(0, n))
    voice.yIm.set(scratchIm.subarray(0, n))
    voice.gainRe.set(model.gainRe)
    voice.gainIm.set(model.gainIm)
    voice.hammerWeight.set(model.hammerWeight)
    voice.bridgeWeight.set(model.bridgeWeight)
    for (let i = 0; i < n; i++) voice.index[i] = i
    voice.count = n
    if (voice.cut) voice.stretch = this.stretchOf(model, undefined)
    voice.cut = false
    voice.damped = false
    return voice
  }

  /** The longitudinal modes of a key, carried over from its strings if they still ring. */
  private stretchOf(model: KeyModel, before: Voice | undefined): Stretch {
    if (before && !before.cut) return before.stretch
    const decay = 6.9078 / STRETCH_RING
    const r = Math.exp(-decay * this.dt)
    const rotRe = new Float64Array(2)
    const rotIm = new Float64Array(2)
    for (let m = 0; m < 2; m++) {
      const freq = model.longitudinal.freq * (m + 1)
      const w = 2 * Math.PI * freq * this.dt
      // Above the ear, or aliasing: the push is still heard, its mode is not.
      const keep = freq < this.sampleRate * 0.45 ? 1 : 0
      rotRe[m] = keep * r * Math.cos(w)
      rotIm[m] = keep * r * Math.sin(w)
    }
    return {
      force: model.longitudinal.force,
      lastIn: 0,
      lastOut: 0,
      re: new Float64Array(2),
      im: new Float64Array(2),
      rotRe,
      rotIm,
      gain: decay * this.dt * STRETCH_PEAK,
    }
  }

  private stringUnderHammer(voice: Voice): number {
    let y = 0
    for (let s = 0; s < voice.count; s++)
      y += (voice.hammerWeight[s] as number) * (voice.yIm[s] as number)
    return y
  }

  private cutVoice(voice: Voice): void {
    voice.cut = true
    voice.hammer.on = false
    this.setRotation(voice)
  }

  /** Each mode's turn per sample (and per contact step): its pole, plus the damper's grip. */
  private setRotation(voice: Voice): void {
    const { model } = voice
    for (let s = 0; s < voice.count; s++) {
      const i = voice.index[s] as number
      const omega = model.omega[i] as number
      let decay = model.decay[i] as number
      if (voice.cut) decay -= CUT_DECAY
      else if (voice.damped) decay -= damperDecay(model.pitch, omega)
      const r = Math.exp(decay * this.dt)
      voice.rotRe[s] = r * Math.cos(omega * this.dt)
      voice.rotIm[s] = r * Math.sin(omega * this.dt)
      const step = this.dt / voice.steps
      const rs = Math.exp(decay * step)
      voice.subRe[s] = rs * Math.cos(omega * step)
      voice.subIm[s] = rs * Math.sin(omega * step)
    }
  }

  private renderSpan(
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
  ): void {
    if (this.mix.length < frames) {
      this.mix = new Float64Array(frames)
      this.drive = new Float64Array(frames)
    }
    const { mix, drive } = this
    drive.fill(0, 0, frames)
    for (const voice of this.voices.values()) {
      mix.fill(0, 0, frames)
      let i = 0
      while (i < frames && voice.hammer.on) {
        mix[i] = this.contactSample(voice)
        i++
      }
      if (i < frames) this.turn(voice, mix, i, frames)
      this.stretch(voice.stretch, mix, frames)
      const l = voice.left * OUTPUT_GAIN
      const r = voice.right * OUTPUT_GAIN
      // A note cut short is being silenced, not played: it sets no other string ringing.
      const drives = voice.cut ? 0 : 1
      for (let k = 0; k < frames; k++) {
        const x = mix[k] as number
        drive[k] = (drive[k] as number) + x * drives
        left[offset + k] = (left[offset + k] as number) + x * l
        right[offset + k] = (right[offset + k] as number) + x * r
      }
    }
    this.sympathy.render(
      drive,
      left,
      right,
      offset,
      frames,
      (key) => this.voices.has(key),
      OUTPUT_GAIN,
    )
  }

  /** Adds the longitudinal push of a voice's bridge force, and the modes it rings, to it. */
  private stretch(s: Stretch, mix: Float64Array, frames: number): void {
    const a = this.highPass
    const r0 = s.rotRe[0] as number
    const r1 = s.rotRe[1] as number
    const i0 = s.rotIm[0] as number
    const i1 = s.rotIm[1] as number
    let re0 = s.re[0] as number
    let re1 = s.re[1] as number
    let im0 = s.im[0] as number
    let im1 = s.im[1] as number
    for (let k = 0; k < frames; k++) {
      const x = mix[k] as number
      const push = s.force * x * x
      const heard = a * (s.lastOut + push - s.lastIn)
      s.lastIn = push
      s.lastOut = heard
      const g = s.gain * heard
      const n0 = (re0 + g) * r0 - im0 * i0
      im0 = (re0 + g) * i0 + im0 * r0
      re0 = n0
      const n1 = (re1 + g) * r1 - im1 * i1
      im1 = (re1 + g) * i1 + im1 * r1
      re1 = n1
      mix[k] = x + heard + im0 + im1
    }
    s.re[0] = re0
    s.re[1] = re1
    s.im[0] = im0
    s.im[1] = im1
  }

  /** One sample of the hammer against the strings, in contact steps; answers the bridge force. */
  private contactSample(voice: Voice): number {
    const h = voice.hammer
    const { mass, stiffness, exponent, loss } = voice.model.hammer
    const step = this.dt / voice.steps
    const { yRe, yIm, subRe, subIm, gainRe, gainIm, hammerWeight, count } = voice
    for (let k = 0; k < voice.steps; k++) {
      const push = h.force * step
      let under = 0
      for (let s = 0; s < count; s++) {
        const re = (yRe[s] as number) + (gainRe[s] as number) * push
        const im = (yIm[s] as number) + (gainIm[s] as number) * push
        const cr = subRe[s] as number
        const ci = subIm[s] as number
        const nextIm = re * ci + im * cr
        yRe[s] = re * cr - im * ci
        yIm[s] = nextIm
        under += (hammerWeight[s] as number) * nextIm
      }
      h.v -= (h.force / mass) * step
      h.x += h.v * step
      const squeeze = h.x - under
      if (squeeze > 0) {
        h.struck = true
        const rate = (squeeze - h.squeeze) / step
        h.force = Math.max(0, stiffness * squeeze ** exponent * (1 + loss * rate))
      } else h.force = 0
      h.squeeze = squeeze
    }
    h.time += this.dt
    // Once it has struck and is on its way back it has escaped: the strings are left alone
    // (and the costly steps end, two or three milliseconds in rather than the whole window).
    if (h.force === 0 && ((h.struck && h.v < 0) || h.time > HAMMER_WINDOW)) h.on = false
    // The blow's reaction reaches the board through the action and the frame: the knock.
    let out = h.force * KNOCK
    for (let s = 0; s < count; s++) out += (voice.bridgeWeight[s] as number) * (yIm[s] as number)
    return out
  }

  /** The strings left to themselves: every mode turns, and the bridge sums them. */
  private turn(voice: Voice, mix: Float64Array, from: number, to: number): void {
    const { yRe, yIm, rotRe, rotIm, bridgeWeight, count } = voice
    for (let s = 0; s < count; s++) {
      let re = yRe[s] as number
      let im = yIm[s] as number
      const cr = rotRe[s] as number
      const ci = rotIm[s] as number
      const w = bridgeWeight[s] as number
      for (let k = from; k < to; k++) {
        const nextRe = re * cr - im * ci
        im = re * ci + im * cr
        re = nextRe
        mix[k] = (mix[k] as number) + w * im
      }
      yRe[s] = re
      yIm[s] = im
    }
  }

  /** Drops the modes that have died away, the voices with none left, and keeps the budget. */
  private cull(): void {
    for (const [pitch, voice] of this.voices) {
      if (voice.hammer.on) continue
      let loud = 0
      for (let s = 0; s < voice.count; s++) {
        loud +=
          (voice.bridgeWeight[s] as number) *
          Math.hypot(voice.yRe[s] as number, voice.yIm[s] as number)
      }
      voice.peak = Math.max(voice.peak, loud)
      const floor = voice.peak * CULL_BELOW
      let s = 0
      while (s < voice.count) {
        const a =
          (voice.bridgeWeight[s] as number) *
          Math.hypot(voice.yRe[s] as number, voice.yIm[s] as number)
        if (a < floor) this.dropMode(voice, s)
        else s++
      }
      if (voice.count === 0) {
        this.voices.delete(pitch)
        this.byId.delete(voice.id)
      }
    }
    this.keepBudget()
  }

  private dropMode(voice: Voice, s: number): void {
    const last = --voice.count
    for (const a of [
      voice.yRe,
      voice.yIm,
      voice.rotRe,
      voice.rotIm,
      voice.subRe,
      voice.subIm,
      voice.gainRe,
      voice.gainIm,
      voice.hammerWeight,
      voice.bridgeWeight,
    ]) {
      a[s] = a[last] as number
    }
    voice.index[s] = voice.index[last] as number
  }

  /** Over budget, the oldest strike goes first, as a synthesiser steals its oldest voice. */
  private keepBudget(): void {
    let total = this.modes
    if (total <= MODE_BUDGET) return
    const oldest = [...this.voices.values()]
      .filter((v) => !v.cut)
      .sort((a, b) => a.struck - b.struck)
    for (const voice of oldest) {
      if (total <= MODE_BUDGET) break
      this.cutVoice(voice)
      total -= voice.count
    }
  }
}
