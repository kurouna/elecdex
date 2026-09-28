import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The electric piano (docs/plugins.md section 13.11): a tine piano's action, worked out as
 * the published analyses of it describe, and nothing recorded.
 *
 * - A neoprene-tipped hammer strikes a tine: a thin rod clamped at one end, whose modes are a
 *   cantilever's - 1 : 6.27 : 17.55 : 34.39 - not a string's harmonics. The upper ones die in
 *   a few hundredths of a second: the bell of the attack. A harder blow is a shorter contact,
 *   which reaches further up them.
 * - The tine is screwed to a tonebar tuned to its fundamental, which holds that fundamental
 *   on long after the rest has gone (and, a hair apart from it, beats with it faintly).
 * - An electromagnetic pickup sits just off the tine's tip. Its voltage is the rate of change
 *   of the magnetic flux, and the flux falls off with the tip's distance, not in proportion to
 *   it; with the tine set a little off the pickup's axis (the voicing) the swing towards it
 *   counts more than the swing away. So a soft note is round, and a hard one grows a second
 *   harmonic and more - the bark - from the pickup alone, as on the instrument.
 * - A felt damper stops a key let go, unless the sustain pedal holds it off.
 *
 * A key is its tine: struck again, it is struck where it is.
 */

/** The cantilever's mode ratios, and the tonebar's hair of a difference. */
const TINE = [1, 6.267, 17.55, 34.39] as const
const TONEBAR = 1.0006
/** The voicing: the tine's rest, off the pickup's axis, in pickup distances; and the swing's scale. */
const VOICING = 0.32
const SWING = 0.85
/** The damper's decay per second, and a stop's. */
const DAMPER = 6.9078 / 0.14
const CUT = 250
const OUTPUT = 42.7
/** The pickup coil's inductance and the cable roll the top off above this, Hz. */
const COIL = 5500
/** Below this, a quiet key is let go, as a share of its loudest. */
const SILENT = 1e-4
const MODES = TINE.length + 1

interface Key {
  on: boolean
  pitch: number
  id: number
  re: Float64Array
  im: Float64Array
  rotRe: Float64Array
  rotIm: Float64Array
  omega: Float64Array
  decay: Float64Array
  /** Held by its key (or, let go, by the pedal). */
  held: boolean
  letGo: boolean
  cut: boolean
  peak: number
  /** The pickup coil's own low-pass, per key. */
  coil: number
  left: number
  right: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'release' | 'stop'; id: number }
  | { at: number; kind: 'pedal'; on: boolean }

/**
 * The voicing: a technician sets each tine's pickup nearer or further until the keyboard is
 * even, since the long bass tines barely move the air past a pickup set like the middle's, and
 * the stiff treble tines hardly swing. A gain per key, measured so a mezzo-forte scale is even
 * within a couple of decibels, a little softer at the ends.
 */
const EVEN = [
  [28, 3.39],
  [36, 2.63],
  [48, 1.365],
  [60, 1],
  [72, 1],
  [84, 1.05],
  [96, 1.9],
  [100, 2.6],
] as const

export function voicingOf(pitch: number): number {
  const key = Math.min(100, Math.max(28, pitch))
  for (let i = 1; i < EVEN.length; i++) {
    const [k1, g1] = EVEN[i] as readonly [number, number]
    const [k0, g0] = EVEN[i - 1] as readonly [number, number]
    if (key <= k1) return g0 * (g1 / g0) ** ((key - k0) / (k1 - k0))
  }
  return EVEN[EVEN.length - 1]?.[1] ?? 1
}

/** Seconds the fundamental rings: long in the bass, short in the treble. */
export function ringOf(pitch: number): number {
  return Math.min(14, Math.max(1.6, 7 * 2 ** (-(pitch - 60) / 18)))
}

export class EPianoEngine implements Instrument {
  private readonly rate: number
  private readonly dt: number
  private readonly keys = new Map<number, Key>()
  private readonly timeline = new Timeline<Event>()
  private pedalDown = false

  private readonly coil: number

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
    this.coil = 1 - Math.exp((-2 * Math.PI * COIL) / sampleRate)
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

  pedal(on: boolean, at: number): void {
    this.timeline.add({ at, kind: 'pedal', on })
  }

  stopAll(): void {
    this.timeline.clear()
    for (const key of this.keys.values()) this.damp(key, true)
  }

  get busy(): boolean {
    if (this.timeline.size > 0) return true
    for (const key of this.keys.values()) if (key.on) return true
    return false
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    this.timeline.run(
      frames,
      from,
      (event) => this.apply(event),
      (offset, count) => {
        for (const key of this.keys.values())
          if (key.on) this.sound(key, left, right, offset, count)
      },
    )
    for (const key of this.keys.values()) this.settle(key)
  }

  private apply(event: Event): void {
    if (event.kind === 'strike') this.hit(event)
    else if (event.kind === 'pedal') this.setPedal(event.on)
    else {
      const key = [...this.keys.values()].find((k) => k.on && k.id === event.id)
      if (key === undefined) return
      if (event.kind === 'stop') this.damp(key, true)
      else {
        key.letGo = true
        if (!this.pedalDown) this.damp(key, false)
      }
    }
  }

  private setPedal(on: boolean): void {
    this.pedalDown = on
    if (on) return
    for (const key of this.keys.values()) if (key.on && key.letGo) this.damp(key, false)
  }

  private hit(event: Extract<Event, { kind: 'strike' }>): void {
    let key = this.keys.get(event.pitch)
    if (key === undefined) {
      key = newKey()
      this.keys.set(event.pitch, key)
    }
    const f0 = 440 * 2 ** ((event.pitch - 69) / 12)
    const level = Math.min(1, Math.max(0, event.level))
    // The hammer's contact: about 1.6 ms soft, 0.5 ms hard, shorter up the keyboard.
    const contact = (1.6e-3 - 1.1e-3 * level) * 2 ** (-(event.pitch - 60) / 36)
    const ring = ringOf(event.pitch)
    const freqs = [...TINE.map((r) => f0 * r), f0 * TONEBAR]
    const decays = [
      6.9078 / (ring * 0.85),
      6.9078 / 0.25,
      6.9078 / 0.06,
      6.9078 / 0.02,
      6.9078 / ring,
    ]
    const shares = [0.8, 0.3 * level + 0.05, 0.12 * level * level, 0.04 * level * level, 0.2]
    if (!key.on || key.cut) {
      key.re.fill(0)
      key.im.fill(0)
      key.peak = 0
    }
    // The short, stiff tines of the treble barely move; the bass tines swing, and bark the most.
    const push = SWING * level ** 0.85 * Math.min(1.3, (261.6 / f0) ** 0.7)
    for (let m = 0; m < MODES; m++) {
      const f = freqs[m] as number
      const omega = 2 * Math.PI * f
      key.omega[m] = omega
      key.decay[m] = decays[m] as number
      // A half-sine blow's spectrum at the mode: the shorter the contact, the further up it reaches.
      const x = 2 * f * contact
      const blow =
        Math.abs(x - 1) < 1e-6 ? Math.PI / 4 : Math.abs(Math.cos((Math.PI * x) / 2) / (1 - x * x))
      // Struck from where it is: an impulse of velocity, so a real phasor (displacement 0, moving).
      key.re[m] =
        (key.re[m] as number) +
        push * (shares[m] as number) * blow * (omega < Math.PI * this.rate * 0.9 ? 1 : 0)
    }
    key.on = true
    key.pitch = event.pitch
    key.id = event.id
    key.held = true
    key.letGo = false
    key.cut = false
    const p = Math.min(1, Math.max(-1, event.pan + ((event.pitch - 64) / 36) * 0.25))
    key.left = Math.cos(((p + 1) * Math.PI) / 4) * voicingOf(event.pitch)
    key.right = Math.sin(((p + 1) * Math.PI) / 4) * voicingOf(event.pitch)
    this.retune(key, 0)
  }

  private damp(key: Key, cut: boolean): void {
    key.held = false
    key.cut = key.cut || cut
    this.retune(key, cut ? CUT : DAMPER)
  }

  private retune(key: Key, extra: number): void {
    for (let m = 0; m < MODES; m++) {
      const r = Math.exp(-((key.decay[m] as number) + extra) * this.dt)
      const w = (key.omega[m] as number) * this.dt
      key.rotRe[m] = r * Math.cos(w)
      key.rotIm[m] = r * Math.sin(w)
    }
  }

  /**
   * The tine turning, and the pickup's voltage: the rate of change of the flux through it,
   * phi(x) = 1 / (1 + (x - voicing)^2) for the tip's displacement x, which is phi'(x) * x'.
   */
  private sound(
    key: Key,
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
  ): void {
    const { re, im, rotRe, rotIm, omega } = key
    let loud = 0
    for (let k = 0; k < frames; k++) {
      let x = 0
      let v = 0
      for (let m = 0; m < MODES; m++) {
        const r = re[m] as number
        const i = im[m] as number
        const cr = rotRe[m] as number
        const ci = rotIm[m] as number
        const nr = r * cr - i * ci
        const ni = r * ci + i * cr
        re[m] = nr
        im[m] = ni
        x += ni
        v += nr * (omega[m] as number)
      }
      const d = x - VOICING
      const q = 1 + d * d
      key.coil += this.coil * (((-2 * d) / (q * q)) * v * this.dt * OUTPUT - key.coil)
      const out = key.coil
      loud = Math.max(loud, Math.abs(out))
      left[offset + k] = (left[offset + k] as number) + out * key.left
      right[offset + k] = (right[offset + k] as number) + out * key.right
    }
    key.peak = Math.max(key.peak, loud)
  }

  /** Lets a key go once it is silent. */
  private settle(key: Key): void {
    if (!key.on) return
    let size = 0
    for (let m = 0; m < MODES; m++)
      size += Math.abs(key.re[m] as number) + Math.abs(key.im[m] as number)
    if (size < SILENT * 1e-2 || (key.peak > 0 && size < SILENT)) key.on = false
  }
}

function newKey(): Key {
  const a = () => new Float64Array(MODES)
  return {
    on: false,
    pitch: 0,
    id: 0,
    re: a(),
    im: a(),
    rotRe: a(),
    rotIm: a(),
    omega: a(),
    decay: a(),
    held: false,
    letGo: false,
    cut: false,
    peak: 0,
    coil: 0,
    left: Math.SQRT1_2,
    right: Math.SQRT1_2,
  }
}
