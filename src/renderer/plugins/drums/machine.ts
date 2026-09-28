import type { Voice } from '@shared/plugin-api'
import { Biquad } from '../instruments/biquad.js'
import type { Instrument } from '../instruments/host.js'
import { Timeline } from '../instruments/timeline.js'

/**
 * The drums (docs/plugins.md section 13.10). The music a plugin's band plays - house, EDM,
 * trance, synthwave, chiptune - is played on drum machines, and the real instruments there are
 * the classic analogue ones, so each drum follows how those circuits make their sound, from
 * what is published of them, and nothing is recorded:
 *
 * - kick: a sine oscillator swept down fast and then slowly to its note, a little overdriven,
 *   with the click of its trigger;
 * - snare: two tuned bodies swept a little, and a "snappy" of high-passed noise;
 * - clap: noise through a band-pass, retriggered four times ten milliseconds apart, then a tail;
 * - hi-hats and the cymbal: six square-wave oscillators tuned to no chord, running freely,
 *   through two band-passes - the metallic clang of the famous machine - the closed hat
 *   choking the open one, as it does there;
 * - tom: a sine swept down to the note it is given.
 *
 * Each drum is one instrument of the host, playing its hits in its own timeline. A filter and
 * an oscillator bank serve every hit of a drum (the envelopes are summed before them, which
 * for noise and free-running oscillators is the same sound), so a hit allocates nothing.
 */

/** Hits a drum keeps at once; a new one takes the oldest's place. */
const HITS = 12
/** A stop fades a hit out over this, seconds. */
const STOP = 0.004

interface Hit {
  on: boolean
  start: number
  id: number
  level: number
  freq: number
  phase: number
  phase2: number
  /** When a stop or a choke began fading it, or -1. */
  fading: number
}

type Event =
  | { at: number; kind: 'strike'; id: number; pitch: number; level: number; pan: number }
  | { at: number; kind: 'stop'; id: number }
  | { at: number; kind: 'choke' }

/** Things the drums of one host share: the closed hat chokes the open one. */
export interface DrumShared {
  choke?: (at: number) => void
}

export abstract class Drum implements Instrument {
  protected readonly rate: number
  protected readonly dt: number
  protected readonly hits: Hit[] = Array.from({ length: HITS }, () => ({
    on: false,
    start: 0,
    id: 0,
    level: 0,
    freq: 0,
    phase: 0,
    phase2: 0,
    fading: -1,
  }))
  private readonly timeline = new Timeline<Event>()
  private left = Math.SQRT1_2
  private right = Math.SQRT1_2
  /** Samples of silence a drum still writes after its last hit, for its filters' tails. */
  private tail = 0

  constructor(sampleRate: number) {
    this.rate = sampleRate
    this.dt = 1 / sampleRate
  }

  strike(id: number, pitch: number, level: number, pan: number, at: number): void {
    this.timeline.add({ at, kind: 'strike', id, pitch, level, pan })
  }

  release(): void {}

  stop(id: number, at: number): void {
    this.timeline.add({ at, kind: 'stop', id })
  }

  /** Fades every hit from `at` (the open hat, choked by the closed one). */
  choke(at: number): void {
    this.timeline.add({ at, kind: 'choke' })
  }

  pedal(): void {}

  stopAll(): void {
    this.timeline.clear()
    for (const hit of this.hits) hit.on = false
    this.tail = 0
  }

  get busy(): boolean {
    return this.timeline.size > 0 || this.tail > 0 || this.hits.some((h) => h.on)
  }

  render(left: Float32Array, right: Float32Array, frames: number, from: number): void {
    this.timeline.run(
      frames,
      from,
      (event, now) => this.apply(event, now),
      (offset, count) => {
        if (!this.hits.some((h) => h.on) && this.tail <= 0) return
        for (let k = 0; k < count; k++) {
          const x = this.sample(from + offset + k) * this.gain
          left[offset + k] = (left[offset + k] as number) + x * this.left
          right[offset + k] = (right[offset + k] as number) + x * this.right
        }
        this.tail -= count
        this.retire(from + offset + count)
      },
    )
  }

  private apply(event: Event, now: number): void {
    if (event.kind === 'choke') {
      for (const hit of this.hits) if (hit.on && hit.fading < 0) hit.fading = now
      return
    }
    if (event.kind === 'stop') {
      for (const hit of this.hits)
        if (hit.on && hit.id === event.id && hit.fading < 0) hit.fading = now
      return
    }
    const hit =
      this.hits.find((h) => !h.on) ?? this.hits.reduce((a, b) => (a.start <= b.start ? a : b))
    hit.on = true
    hit.start = now
    hit.id = event.id
    hit.level = Math.min(1, Math.max(0, event.level))
    hit.freq = 440 * 2 ** ((event.pitch - 69) / 12)
    hit.phase = 0
    hit.phase2 = 0
    hit.fading = -1
    const p = Math.min(1, Math.max(-1, event.pan))
    this.left = Math.cos(((p + 1) * Math.PI) / 4)
    this.right = Math.sin(((p + 1) * Math.PI) / 4)
    this.tail = Math.round(this.rate * 0.05)
    this.struck(now)
  }

  /** Lets a hit go once its envelope has died. */
  private retire(now: number): void {
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      const faded = hit.fading >= 0 && (now - hit.fading) * this.dt > STOP * 8
      if (faded || t > this.length) {
        hit.on = false
        this.tail = Math.max(this.tail, Math.round(this.rate * 0.05))
      }
    }
  }

  /** A hit's envelope scale for a stop or a choke. */
  protected fade(hit: Hit, now: number): number {
    return hit.fading < 0 ? 1 : Math.exp(-((now - hit.fading) * this.dt) / STOP)
  }

  /** Called as a hit starts, for a drum that must do something then (the closed hat's choke). */
  protected struck(_now: number): void {}

  /** How long a hit can be heard, seconds. */
  protected abstract readonly length: number

  /**
   * The drum's level, set so each sits in a band where the recipes it replaced sat (their
   * loudness matched, measured): the balance of the songs written for them stays.
   */
  protected abstract readonly gain: number

  /** One sample of every hit at frame `now`. */
  protected abstract sample(now: number): number
}

/** A band-limited square wave's step, smoothed over the samples around it (PolyBLEP). */
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

/**
 * Six square waves tuned to no chord, running freely whether or not a hit sounds - so every
 * hit catches them in a different place, as on the machine.
 */
class Clang {
  private static readonly FREQS = [205.3, 304.4, 369.6, 522.7, 540, 800]
  private readonly phases = Clang.FREQS.map((_, i) => (i * 0.137) % 1)
  private readonly steps: number[]

  constructor(sampleRate: number) {
    this.steps = Clang.FREQS.map((f) => f / sampleRate)
  }

  next(): number {
    let sum = 0
    for (let i = 0; i < this.phases.length; i++) {
      const dt = this.steps[i] as number
      let p = (this.phases[i] as number) + dt
      if (p >= 1) p -= 1
      this.phases[i] = p
      let square = p < 0.5 ? 1 : -1
      square += blep(p, dt)
      square -= blep((p + 0.5) % 1, dt)
      sum += square
    }
    return sum / 6
  }
}

/** White noise from a small generator of its own: the same on every run. */
class Noise {
  private seed: number
  constructor(seed: number) {
    this.seed = seed >>> 0
  }
  next(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0
    return this.seed / 2147483648 - 1
  }
}

const TWO_PI = 2 * Math.PI

class Kick extends Drum {
  protected readonly length = 0.9
  protected readonly gain = 0.26
  private readonly noise = new Noise(11)
  private readonly clickFilter: Biquad

  constructor(rate: number) {
    super(rate)
    this.clickFilter = new Biquad('highpass', 1200, 0.7, rate)
  }

  protected sample(now: number): number {
    let out = 0
    let click = 0
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      // Swept from about five times its note down to it: fast, then slowly.
      const f = 52 * (1 + 3.4 * Math.exp(-t / 0.011) + 0.5 * Math.exp(-t / 0.08))
      hit.phase += TWO_PI * f * this.dt
      const body = Math.tanh(1.7 * Math.sin(hit.phase)) / Math.tanh(1.7)
      const env = Math.exp(-t / 0.3) * Math.min(1, t / 0.0015)
      const scale = hit.level * this.fade(hit, now)
      out += body * env * scale
      click += Math.exp(-t / 0.0022) * scale
    }
    return out * 0.9 + this.clickFilter.tick(this.noise.next() * click) * 0.35
  }
}

class Snare extends Drum {
  protected readonly length = 0.5
  protected readonly gain = 0.27
  private readonly noise = new Noise(23)
  private readonly low: Biquad
  private readonly high: Biquad

  constructor(rate: number) {
    super(rate)
    this.low = new Biquad('highpass', 1300, 0.7, rate)
    this.high = new Biquad('lowpass', 9500, 0.7, rate)
  }

  protected sample(now: number): number {
    let body = 0
    let snappy = 0
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      const sweep = 1 + 0.45 * Math.exp(-t / 0.012)
      hit.phase += TWO_PI * 185 * sweep * this.dt
      hit.phase2 += TWO_PI * 332 * sweep * this.dt
      const scale = hit.level * this.fade(hit, now)
      const attack = Math.min(1, t / 0.0008)
      body +=
        (0.62 * Math.sin(hit.phase) * Math.exp(-t / 0.1) +
          0.38 * Math.sin(hit.phase2) * Math.exp(-t / 0.065)) *
        scale *
        attack
      snappy += Math.exp(-t / 0.15) * scale * attack
    }
    return body * 0.75 + this.high.tick(this.low.tick(this.noise.next())) * snappy * 0.8
  }
}

class Clap extends Drum {
  protected readonly length = 0.6
  protected readonly gain = 0.13
  private readonly noise = new Noise(37)
  private readonly band: Biquad
  private readonly air: Biquad

  constructor(rate: number) {
    super(rate)
    this.band = new Biquad('bandpass', 1150, 1.3, rate)
    this.air = new Biquad('highpass', 450, 0.7, rate)
  }

  protected sample(now: number): number {
    let env = 0
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      // Four hands ten milliseconds apart, each a sharp rise and a quick fall, then the room.
      let e = 0
      for (let k = 0; k < 3; k++) {
        const u = t - k * 0.0105
        if (u >= 0) e = Math.max(e, (1 - 0.12 * k) * Math.exp(-u / 0.0032))
      }
      const u = t - 0.0315
      if (u >= 0) e = Math.max(e, 0.85 * Math.exp(-u / 0.11))
      env += e * hit.level * this.fade(hit, now)
    }
    return this.air.tick(this.band.tick(this.noise.next())) * env * 2.4
  }
}

/** The six squares through the machine's high band: its hi-hats, closed and open. */
class Hat extends Drum {
  protected readonly length: number
  protected readonly gain: number
  private readonly clang: Clang
  private readonly band: Biquad
  private readonly air: Biquad
  private readonly decay: number
  private readonly shared: DrumShared
  private readonly open: boolean

  constructor(rate: number, open: boolean, shared: DrumShared) {
    super(rate)
    this.open = open
    this.shared = shared
    this.decay = open ? 0.16 : 0.016
    this.length = this.decay * 7
    this.gain = open ? 0.48 : 0.69
    this.clang = new Clang(rate)
    this.band = new Biquad('bandpass', 7100, 1.1, rate)
    this.air = new Biquad('highpass', 6500, 0.9, rate)
    if (open) shared.choke = (at) => this.choke(at)
  }

  protected override struck(now: number): void {
    if (!this.open) this.shared.choke?.(now)
  }

  protected sample(now: number): number {
    let env = 0
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      env += Math.exp(-t / this.decay) * Math.min(1, t / 0.0004) * hit.level * this.fade(hit, now)
    }
    return this.air.tick(this.band.tick(this.clang.next()) * env) * 3.2
  }
}

/** The squares' low band dying first and their high band ringing on, with a wash of noise. */
class Crash extends Drum {
  protected readonly length = 2.6
  protected readonly gain = 0.29
  private readonly clang: Clang
  private readonly noise = new Noise(53)
  private readonly lowBand: Biquad
  private readonly highBand: Biquad
  private readonly air: Biquad

  constructor(rate: number) {
    super(rate)
    this.clang = new Clang(rate)
    this.lowBand = new Biquad('bandpass', 3440, 1, rate)
    this.highBand = new Biquad('bandpass', 7100, 0.9, rate)
    this.air = new Biquad('highpass', 4200, 0.7, rate)
  }

  protected sample(now: number): number {
    let low = 0
    let high = 0
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      const scale = hit.level * this.fade(hit, now) * Math.min(1, t / 0.001)
      low += Math.exp(-t / 0.18) * scale
      high += Math.exp(-t / 0.55) * scale
    }
    const metal = this.clang.next()
    const wash = this.noise.next()
    return (
      (this.lowBand.tick(metal) * low * 0.9 +
        this.air.tick(this.highBand.tick(metal) * 0.6 + wash * 0.35) * high) *
      1.6
    )
  }
}

class Tom extends Drum {
  protected readonly length = 0.9
  protected readonly gain = 0.27
  private readonly noise = new Noise(71)
  private readonly skin: Biquad

  constructor(rate: number) {
    super(rate)
    this.skin = new Biquad('bandpass', 900, 1.5, rate)
  }

  protected sample(now: number): number {
    let out = 0
    let stick = 0
    for (const hit of this.hits) {
      if (!hit.on) continue
      const t = (now - hit.start) * this.dt
      hit.phase += TWO_PI * hit.freq * (1 + 0.55 * Math.exp(-t / 0.035)) * this.dt
      const scale = hit.level * this.fade(hit, now)
      out += Math.sin(hit.phase) * Math.exp(-t / 0.24) * Math.min(1, t / 0.001) * scale
      stick += Math.exp(-t / 0.006) * scale
    }
    return out * 0.85 + this.skin.tick(this.noise.next()) * stick * 0.5
  }
}

/** The drums of one host, made as each is first asked for; the hats share their choke. */
export function drumMakers(): Partial<Record<Voice, (rate: number) => Instrument>> {
  const shared: DrumShared = {}
  return {
    kick: (rate) => new Kick(rate),
    snare: (rate) => new Snare(rate),
    clap: (rate) => new Clap(rate),
    hat: (rate) => new Hat(rate, false, shared),
    openhat: (rate) => new Hat(rate, true, shared),
    crash: (rate) => new Crash(rate),
    tom: (rate) => new Tom(rate),
  }
}
