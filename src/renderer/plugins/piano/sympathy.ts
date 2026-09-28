import {
  afterDecay,
  damperDecay,
  fundamental,
  HIGH_KEY,
  hasDamper,
  inharmonicity,
  LOW_KEY,
  partialLoss,
} from './model.js'

/**
 * The strings nobody struck (docs/plugins.md section 13.8). Every string of the piano whose
 * damper is up rings along with the bridge: all of them while the sustain pedal is down, and
 * always the top keys, which have no dampers - the halo a pedalled chord has and a dry one
 * lacks. Each is its lowest few partials, driven by the force the sounding strings put on the
 * bridge; a partial of a struck note that lands on one of theirs builds it up over seconds,
 * and the blow itself sets every free string ringing faintly at its own pitch.
 *
 * A key that sounds is its own strings (engine.ts) and is left out here; a key whose damper
 * has fallen goes quiet at the damper's pace and then sleeps.
 */

const PARTIALS = 4
const KEYS = HIGH_KEY - LOW_KEY + 1
/** How strongly the bridge drives a free string, relative to the force that drives it. */
export const SYMPATHY = 0.035
/** Below this a resting string sleeps, in newtons on the bridge. */
const ASLEEP = 1e-6
/** Where on the bridge a partial is taken up and given back: its share rises with its order. */
const weightOf = (k: number) => Math.sqrt(k)

export class Sympathy {
  private readonly dt: number
  private readonly re = new Float64Array(KEYS * PARTIALS)
  private readonly im = new Float64Array(KEYS * PARTIALS)
  private readonly freeRe = new Float64Array(KEYS * PARTIALS)
  private readonly freeIm = new Float64Array(KEYS * PARTIALS)
  private readonly heldRe = new Float64Array(KEYS * PARTIALS)
  private readonly heldIm = new Float64Array(KEYS * PARTIALS)
  private readonly gain = new Float64Array(KEYS * PARTIALS)
  private readonly partials = new Int32Array(KEYS)
  private readonly awake = new Uint8Array(KEYS)
  private readonly left = new Float64Array(KEYS)
  private readonly right = new Float64Array(KEYS)
  private pedal = false

  constructor(sampleRate: number, spread: (key: number) => [number, number]) {
    this.dt = 1 / sampleRate
    for (let key = LOW_KEY; key <= HIGH_KEY; key++) this.tune(key, sampleRate, spread(key))
  }

  private tune(key: number, sampleRate: number, [left, right]: [number, number]): void {
    const i = key - LOW_KEY
    const f0 = fundamental(key)
    const b = inharmonicity(key)
    this.left[i] = left
    this.right[i] = right
    let n = 0
    for (let k = 1; k <= PARTIALS; k++) {
      const f = f0 * k * Math.sqrt((1 + b * k * k) / (1 + b))
      if (f > sampleRate * 0.45) break
      const omega = 2 * Math.PI * f
      const free = 6.9078 / afterDecay(key) + partialLoss(f) - partialLoss(f0)
      const held = free + (hasDamper(key) ? damperDecay(key, omega) : 0)
      const at = i * PARTIALS + n
      this.freeRe[at] = Math.exp(-free * this.dt) * Math.cos(omega * this.dt)
      this.freeIm[at] = Math.exp(-free * this.dt) * Math.sin(omega * this.dt)
      this.heldRe[at] = Math.exp(-held * this.dt) * Math.cos(omega * this.dt)
      this.heldIm[at] = Math.exp(-held * this.dt) * Math.sin(omega * this.dt)
      // Normalised by the string's own decay: at resonance it answers the bridge one for one.
      this.gain[at] = free * weightOf(k)
      n++
    }
    this.partials[i] = n
  }

  setPedal(on: boolean): void {
    this.pedal = on
  }

  /** Whether any free string still rings. */
  get ringing(): boolean {
    return this.awake.some((a) => a === 1)
  }

  /**
   * Rings the free strings with the bridge force `drive` for `frames` samples and adds what
   * they give back into left and right at `offset`. `sounding` holds the keys with strings of
   * their own now.
   */
  render(
    drive: Float64Array,
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
    sounding: (key: number) => boolean,
    scale: number,
  ): void {
    const driven = drive.subarray(0, frames).some((x) => x !== 0)
    for (let i = 0; i < KEYS; i++) {
      const key = i + LOW_KEY
      // A free string listens while its damper is up and the bridge moves.
      const up = this.pedal || !hasDamper(key)
      const listening = driven && up
      if (sounding(key)) this.hush(i)
      else if (this.awake[i] || listening) {
        const loud = this.ring(i, up, drive, left, right, offset, frames, scale)
        if (loud > ASLEEP || listening) this.awake[i] = 1
        else this.hush(i)
      }
    }
  }

  private ring(
    i: number,
    up: boolean,
    drive: Float64Array,
    left: Float32Array,
    right: Float32Array,
    offset: number,
    frames: number,
    scale: number,
  ): number {
    const rotRe = up ? this.freeRe : this.heldRe
    const rotIm = up ? this.freeIm : this.heldIm
    const l = (this.left[i] as number) * scale * SYMPATHY
    const r = (this.right[i] as number) * scale * SYMPATHY
    let loud = 0
    for (let p = 0; p < (this.partials[i] as number); p++) {
      const at = i * PARTIALS + p
      let re = this.re[at] as number
      let im = this.im[at] as number
      const cr = rotRe[at] as number
      const ci = rotIm[at] as number
      const g = (this.gain[at] as number) * this.dt
      const w = weightOf(p + 1)
      for (let k = 0; k < frames; k++) {
        const push = g * (drive[k] as number)
        const next = (re + push) * cr - im * ci
        im = (re + push) * ci + im * cr
        re = next
        const out = w * im
        left[offset + k] = (left[offset + k] as number) + out * l
        right[offset + k] = (right[offset + k] as number) + out * r
      }
      this.re[at] = re
      this.im[at] = im
      loud += w * Math.hypot(re, im)
    }
    return loud
  }

  /** Stills every free string: the pane's sound is stopped whole. */
  hushAll(): void {
    for (let i = 0; i < KEYS; i++) this.hush(i)
  }

  private hush(i: number): void {
    this.awake[i] = 0
    this.re.fill(0, i * PARTIALS, (i + 1) * PARTIALS)
    this.im.fill(0, i * PARTIALS, (i + 1) * PARTIALS)
  }
}
