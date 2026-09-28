import type { Voice } from '@shared/plugin-api'

/**
 * The voices of the plugins' synthesiser (docs/plugins.md section 13), each a short recipe of
 * WebAudio nodes - like the interface sounds (lib/sfx.ts), nothing is recorded, so nothing is
 * licensed or loaded. A voice starts at `start` and is let go at `end` (its own length when
 * null); it answers with when it falls silent and a way to cut it short.
 */

export interface VoiceNote {
  freq: number
  pitch: number
  /** AudioContext seconds. */
  start: number
  end: number | null
  level: number
}

export interface Played {
  /** When it is silent, in AudioContext seconds; sooner once it is let go or cut. */
  end: number
  /** Cuts it off quickly from `at`. */
  stop(at: number): void
  /** Lets it go from `at` as a released key does, over the voice's own release. */
  release(at: number): void
}

export interface Kit {
  ac: BaseAudioContext
  /** Where the voice goes: the owner's panner. */
  out: AudioNode
  /** Its share of the room (instruments/catalog.ts). */
  room: AudioNode
  noise: AudioBuffer
  piano: PeriodicWave
}

export type VoiceFn = (kit: Kit, note: VoiceNote) => Played

/** One sounding voice: its sources, and the gain everything passes through last. */
class Build {
  readonly kit: Kit
  readonly amp: GainNode
  /** The voice's peak, its own balance against the others applied. */
  readonly level: number
  private readonly sources: AudioScheduledSourceNode[] = []
  /** The source that stops last, and when: the graph is let go when it ends. */
  private last: { source: AudioScheduledSourceNode; stop: number } | null = null

  constructor(kit: Kit, level: number) {
    this.kit = kit
    this.level = level
    this.amp = kit.ac.createGain()
    this.amp.gain.value = 0
    this.amp.connect(kit.out)
    this.amp.connect(kit.room)
  }

  osc(
    wave: OscillatorType | PeriodicWave,
    freq: number,
    start: number,
    stop: number,
    detune = 0,
  ): OscillatorNode {
    const osc = this.kit.ac.createOscillator()
    if (typeof wave === 'string') osc.type = wave as OscillatorType
    else osc.setPeriodicWave(wave)
    osc.frequency.value = freq
    osc.detune.value = detune
    osc.start(start)
    osc.stop(stop)
    this.add(osc, stop)
    return osc
  }

  noise(start: number, stop: number): AudioBufferSourceNode {
    const source = this.kit.ac.createBufferSource()
    source.buffer = this.kit.noise
    source.loop = true
    source.start(start, Math.random() * 0.5)
    source.stop(stop)
    this.add(source, stop)
    return source
  }

  private add(source: AudioScheduledSourceNode, stop: number): void {
    this.sources.push(source)
    if (this.last === null || stop >= this.last.stop) this.last = { source, stop }
  }

  filter(type: BiquadFilterType, freq: number, q: number): BiquadFilterNode {
    const node = this.kit.ac.createBiquadFilter()
    node.type = type
    node.frequency.value = freq
    node.Q.value = q
    return node
  }

  gain(value = 0): GainNode {
    const node = this.kit.ac.createGain()
    node.gain.value = value
    return node
  }

  /**
   * The handle: silent at `end`. The graph is let go when the source that stops last ends -
   * never an earlier one (a hammer's tick, a tine), which would cut the note off with it.
   */
  done(end: number, tau = 0.03): Played {
    const last = this.last?.source
    if (last) last.onended = () => this.amp.disconnect()
    const played: Played = {
      end,
      stop: (at) => {
        this.amp.gain.cancelScheduledValues(at)
        this.amp.gain.setTargetAtTime(0, at, 0.008)
        this.stopAll(at + 0.06)
        played.end = Math.min(played.end, at + 0.06)
      },
      release: (at) => {
        release(this.amp.gain, at, tau)
        this.stopAll(at + tau * 8)
        played.end = Math.min(played.end, at + tau * 8)
      },
    }
    return played
  }

  private stopAll(at: number): void {
    for (const source of this.sources) {
      try {
        source.stop(at)
      } catch {
        // Already stopped: nothing more to cut.
      }
    }
  }
}

/** Lets go of a held level: from `at`, towards silence. */
function release(param: AudioParam, at: number, tau: number): void {
  param.cancelAndHoldAtTime(at)
  param.setTargetAtTime(0, at, tau)
}

/** A struck string: two slightly apart, bright at first, ringing longer in the bass. */
const piano: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.55)
  const t = n.start
  const end = n.end ?? t + 1.4
  const ring = 1.5 * 2 ** (-(n.pitch - 60) / 18)
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.004)
  g.setTargetAtTime(b.level * 0.45, t + 0.004, 0.08)
  g.setTargetAtTime(0, t + 0.12, ring)
  release(g, end, 0.07)
  const tone = b.filter('lowpass', Math.min(16000, n.freq * 9), 0.6)
  tone.frequency.setTargetAtTime(n.freq * 2.4 + 500, t, 0.3)
  tone.connect(b.amp)
  for (const detune of [-2.5, 2.5]) b.osc(kit.piano, n.freq, t, end + 0.5, detune).connect(tone)
  // The hammer: a tick of noise in the upper middle.
  const hit = b.gain(0)
  hit.gain.setValueAtTime(b.level * 0.25, t)
  hit.gain.setTargetAtTime(0, t, 0.006)
  b.noise(t, t + 0.06)
    .connect(b.filter('bandpass', 2800, 1.2))
    .connect(hit)
    .connect(b.amp)
  return b.done(end + 0.5, 0.07)
}

/** A tine and a bar: two-operator FM, the bell of the attack fading into a round tone. */
const epiano: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.5)
  const t = n.start
  const end = n.end ?? t + 1.4
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.003)
  g.setTargetAtTime(0, t + 0.003, 1.3 * 2 ** (-(n.pitch - 60) / 24))
  release(g, end, 0.09)
  const carrier = b.osc('sine', n.freq, t, end + 0.5)
  carrier.connect(b.amp)
  const bar = b.gain(n.freq * 2.6)
  bar.gain.setTargetAtTime(n.freq * 0.5, t, 0.35)
  b.osc('sine', n.freq, t, end + 0.5)
    .connect(bar)
    .connect(carrier.frequency)
  const tine = b.gain(n.freq * 1.4)
  tine.gain.setTargetAtTime(0, t, 0.025)
  b.osc('sine', n.freq * 14, t, t + 0.3)
    .connect(tine)
    .connect(carrier.frequency)
  return b.done(end + 0.5, 0.09)
}

/** A synth lead: two saws apart, a resonant filter closing, vibrato once it is held. */
const lead: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.32)
  const t = n.start
  const end = n.end ?? t + 0.5
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.006)
  g.setTargetAtTime(b.level * 0.75, t + 0.006, 0.12)
  release(g, end, 0.05)
  const tone = b.filter('lowpass', 5200, 4)
  tone.frequency.setTargetAtTime(1800 + n.freq, t, 0.12)
  tone.connect(b.amp)
  const vibrato = b.gain(0)
  vibrato.gain.setValueAtTime(0, t + 0.22)
  vibrato.gain.linearRampToValueAtTime(9, t + 0.5)
  b.osc('sine', 5.6, t, end + 0.3).connect(vibrato)
  for (const detune of [-8, 8]) {
    const osc = b.osc('sawtooth', n.freq, t, end + 0.3, detune)
    vibrato.connect(osc.detune)
    osc.connect(tone)
  }
  return b.done(end + 0.3, 0.05)
}

/** A soft clipper's curve, made once: the recipe guitar's distortion. */
const CLIP = Float32Array.from({ length: 1025 }, (_, i) => Math.tanh(((i - 512) / 512) * 3))

/**
 * The guitar until its strings have loaded (guitar/, section 13.9): two saws a little apart
 * into a clipper, through a speaker's top.
 */
const guitar: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.22)
  const t = n.start
  const end = n.end ?? t + 1
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.004)
  g.setTargetAtTime(b.level * 0.6, t + 0.004, 0.4)
  release(g, end, 0.06)
  const shaper = kit.ac.createWaveShaper()
  shaper.curve = CLIP
  shaper.oversample = '4x'
  const drive = b.gain(2.5)
  drive
    .connect(shaper)
    .connect(b.filter('lowpass', 4500, 1.2))
    .connect(b.amp)
  for (const detune of [-6, 6]) b.osc('sawtooth', n.freq, t, end + 0.3, detune).connect(drive)
  return b.done(end + 0.3, 0.06)
}

/** A square wave, as an old console's sound chip made it. */
const chip: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.2)
  const t = n.start
  const end = n.end ?? t + 0.3
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.002)
  g.setTargetAtTime(b.level * 0.7, t + 0.002, 0.2)
  release(g, end, 0.02)
  b.osc('square', n.freq, t, end + 0.15).connect(b.amp)
  return b.done(end + 0.15, 0.02)
}

/** A bass: a saw over a sine an octave down, the filter snapping shut. */
const bass: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.5)
  const t = n.start
  const end = n.end ?? t + 0.25
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.004)
  g.setTargetAtTime(b.level * 0.6, t + 0.004, 0.15)
  release(g, end, 0.04)
  const tone = b.filter('lowpass', n.freq * 7 + 300, 6)
  tone.frequency.setTargetAtTime(n.freq * 2 + 80, t, 0.07)
  tone.connect(b.amp)
  b.osc('sawtooth', n.freq, t, end + 0.25).connect(tone)
  const sub = b.gain(0.7)
  b.osc('sine', n.freq / 2, t, end + 0.25)
    .connect(sub)
    .connect(b.amp)
  return b.done(end + 0.25, 0.04)
}

/** A pluck for arpeggios: bright, then gone. */
const pluck: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.3)
  const t = n.start
  const end = n.end ?? t + 0.4
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.002)
  g.setTargetAtTime(0, t + 0.002, 0.16)
  release(g, end, 0.04)
  const tone = b.filter('lowpass', 7000, 2)
  tone.frequency.setTargetAtTime(n.freq * 1.3 + 200, t, 0.06)
  tone.connect(b.amp)
  b.osc('sawtooth', n.freq, t, end + 0.2).connect(tone)
  return b.done(end + 0.2, 0.04)
}

/** A pad: three saws spread apart, slow to rise and slow to leave. */
const pad: VoiceFn = (kit, n) => {
  const b = new Build(kit, n.level * 0.14)
  const t = n.start
  const end = n.end ?? t + 2
  const g = b.amp.gain
  g.setValueAtTime(0, t)
  g.linearRampToValueAtTime(b.level, t + 0.35)
  release(g, end, 0.35)
  const tone = b.filter('lowpass', 1500, 0.7)
  tone.connect(b.amp)
  for (const detune of [-13, 0, 13]) b.osc('sawtooth', n.freq, t, end + 1.6, detune).connect(tone)
  return b.done(end + 1.6, 0.35)
}

/** A struck drum: a tone falling in pitch, with a click of noise on top. */
function drum(
  kit: Kit,
  n: VoiceNote,
  shape: { from: number; to: number; drop: number; decay: number; level: number; click: number },
): Played {
  const b = new Build(kit, n.level * shape.level)
  const t = n.start
  const g = b.amp.gain
  g.setValueAtTime(b.level, t)
  g.exponentialRampToValueAtTime(0.0001, t + shape.decay)
  const osc = b.osc('sine', shape.from, t, t + shape.decay + 0.02)
  osc.frequency.setValueAtTime(shape.from, t)
  osc.frequency.exponentialRampToValueAtTime(shape.to, t + shape.drop)
  osc.connect(b.amp)
  const click = b.gain(0)
  click.gain.setValueAtTime(b.level * shape.click, t)
  click.gain.setTargetAtTime(0, t, 0.003)
  b.noise(t, t + 0.03)
    .connect(b.filter('highpass', 2500, 0.7))
    .connect(click)
    .connect(b.amp)
  return b.done(t + shape.decay + 0.02)
}

/** Noise shaped by a filter: snares, hats, cymbals, claps. */
function hiss(
  kit: Kit,
  n: VoiceNote,
  shape: { type: BiquadFilterType; freq: number; q: number; tau: number; level: number },
): { b: Build; end: number } {
  const b = new Build(kit, n.level * shape.level)
  const t = n.start
  const end = t + shape.tau * 7
  b.amp.gain.setValueAtTime(b.level, t)
  b.amp.gain.setTargetAtTime(0, t, shape.tau)
  b.noise(t, end)
    .connect(b.filter(shape.type, shape.freq, shape.q))
    .connect(b.amp)
  return { b, end }
}

const kick: VoiceFn = (kit, n) =>
  drum(kit, n, { from: 150, to: 42, drop: 0.12, decay: 0.42, level: 0.95, click: 0.3 })

const tom: VoiceFn = (kit, n) =>
  drum(kit, n, {
    from: n.freq * 1.6,
    to: n.freq,
    drop: 0.14,
    decay: 0.45,
    level: 0.7,
    click: 0.15,
  })

const snare: VoiceFn = (kit, n) => {
  const { b, end } = hiss(kit, n, { type: 'bandpass', freq: 1900, q: 0.8, tau: 0.05, level: 0.55 })
  const body = b.gain(b.level * 0.9)
  body.gain.setTargetAtTime(0, n.start, 0.035)
  const osc = b.osc('triangle', 200, n.start, n.start + 0.2)
  osc.frequency.exponentialRampToValueAtTime(150, n.start + 0.08)
  osc.connect(body).connect(b.kit.out)
  return b.done(end)
}

const clap: VoiceFn = (kit, n) => {
  const { b, end } = hiss(kit, n, { type: 'bandpass', freq: 1300, q: 1.3, tau: 0.07, level: 0.5 })
  // Several hands a few milliseconds apart, then the room.
  const g = b.amp.gain
  g.cancelScheduledValues(n.start)
  for (const [i, offset] of [0, 0.011, 0.022].entries()) {
    g.setValueAtTime(b.level * (1 - i * 0.15), n.start + offset)
    g.setTargetAtTime(0, n.start + offset, 0.004)
  }
  g.setValueAtTime(b.level * 0.8, n.start + 0.033)
  g.setTargetAtTime(0, n.start + 0.033, 0.07)
  return b.done(end)
}

const hat: VoiceFn = (kit, n) =>
  hiss(kit, n, { type: 'highpass', freq: 7600, q: 0.7, tau: 0.012, level: 0.3 }).b.done(
    n.start + 0.1,
  )

const openhat: VoiceFn = (kit, n) => {
  const { b, end } = hiss(kit, n, {
    type: 'highpass',
    freq: 6800,
    q: 0.7,
    tau: 0.09,
    level: 0.25,
  })
  if (n.end !== null) release(b.amp.gain, n.end, 0.02)
  return b.done(end)
}

const crash: VoiceFn = (kit, n) => {
  const { b, end } = hiss(kit, n, { type: 'highpass', freq: 4200, q: 0.5, tau: 0.45, level: 0.3 })
  return b.done(end)
}

export const VOICES: Readonly<Record<Voice, VoiceFn>> = {
  piano,
  epiano,
  lead,
  guitar,
  chip,
  bass,
  pluck,
  pad,
  kick,
  snare,
  clap,
  hat,
  openhat,
  crash,
  tom,
}

/** The spectrum of the piano's strings: a strong fundamental, the upper partials thinning. */
export function pianoWave(ac: BaseAudioContext): PeriodicWave {
  const partials = [0, 1, 0.52, 0.3, 0.2, 0.12, 0.09, 0.05, 0.035, 0.025, 0.018]
  return ac.createPeriodicWave(new Float32Array(partials.length), new Float32Array(partials))
}

/** A second of white noise, looped by every noisy voice. */
export function noiseBuffer(ac: BaseAudioContext): AudioBuffer {
  const buffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}
