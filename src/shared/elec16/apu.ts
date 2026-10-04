/**
 * PLAY-320's sound (docs/elec16-play.md section 5): sixteen channels, each a wave (four
 * squares, a triangle, a saw, noise or one of eight wave tables), a pitch, a volume, a place
 * left to right, an envelope and a slide and vibrato, keyed on and off - and the synth that
 * turns them into samples.
 *
 * The core keeps only the settings and how many times each channel was keyed on and off: no
 * clock, no samples. The page sends what changed once a frame to its AudioWorklet, which runs
 * `ApuSynth` - pure, so the worklet, the tests and a WAV script run the same code. Only a model
 * with `apu` has any of it; on every other the registers read 0 and ignore writes.
 */

export const APU_REG = {
  sel: 0xf840,
  wave: 0xf842,
  freq: 0xf844,
  vol: 0xf846,
  pan: 0xf848,
  env: 0xf84a,
  mod: 0xf84c,
  key: 0xf84e,
  master: 0xf850,
} as const

export const APU_IO = 0xf840
export const APU_IO_END = 0xf860

export const CHANNELS = 16
/** WAVE: the four squares by duty, then the rest. */
export const WAVE = {
  square12: 0,
  square25: 1,
  square50: 2,
  square75: 3,
  triangle: 4,
  saw: 5,
  noise: 6,
  table: 8,
} as const
/** Where the eight wave tables are in video memory: 32 four-bit points each, 16 bytes. */
export const WAVE_TABLES_AT = 0xc600
export const WAVE_TABLE_BYTES = 16
export const WAVE_TABLES = 8
/** An envelope stage's time by its four-bit number, in milliseconds. */
export const ENV_MS = [
  0, 2, 5, 10, 20, 40, 80, 120, 160, 250, 400, 600, 800, 1200, 2000, 3000,
] as const

export interface ApuChannel {
  wave: number
  /** In quarters of a hertz. */
  freq: number
  vol: number
  pan: number
  env: number
  mod: number
  /** Held down (KEY 1 since the last 0). */
  gate: boolean
  /** How many times it was keyed on, and off: the synth starts or releases a note on a change. */
  ons: number
  offs: number
}

export interface ApuState {
  sel: number
  master: number
  ch: ApuChannel[]
  /** Counts every write, so the page sends only a frame that changed. */
  revision: number
}

const channel = (): ApuChannel => ({
  wave: WAVE.square50,
  freq: 440 * 4,
  vol: 15,
  pan: 8,
  env: 0x0f00,
  mod: 0,
  gate: false,
  ons: 0,
  offs: 0,
})

export function createApuState(): ApuState {
  return { sel: 0, master: 15, ch: Array.from({ length: CHANNELS }, channel), revision: 0 }
}

/** A reset: every channel let go, the master full. The settings stay. */
export function resetApu(a: ApuState): void {
  for (const c of a.ch) {
    if (c.gate) c.offs = (c.offs + 1) & 0xffff
    c.gate = false
  }
  a.master = 15
  a.revision++
}

export function apuRead(a: ApuState, at: number): number {
  if (at === APU_REG.sel) return a.sel
  if (at === APU_REG.master) return a.master
  const c = a.ch[a.sel] as ApuChannel
  switch (at) {
    case APU_REG.wave:
      return c.wave
    case APU_REG.freq:
      return c.freq
    case APU_REG.vol:
      return c.vol
    case APU_REG.pan:
      return c.pan
    case APU_REG.env:
      return c.env
    case APU_REG.mod:
      return c.mod
    case APU_REG.key:
      return c.gate ? 1 : 0
    default:
      return 0
  }
}

export function apuWrite(a: ApuState, at: number, value: number): void {
  const c = a.ch[a.sel] as ApuChannel
  a.revision++
  switch (at) {
    case APU_REG.sel:
      a.sel = value & (CHANNELS - 1)
      return
    case APU_REG.master:
      a.master = value & 15
      return
    case APU_REG.wave:
      c.wave = value & 15
      return
    case APU_REG.freq:
      c.freq = value & 0xffff
      return
    case APU_REG.vol:
      c.vol = value & 15
      return
    case APU_REG.pan:
      c.pan = value & 15
      return
    case APU_REG.env:
      c.env = value & 0xffff
      return
    case APU_REG.mod:
      c.mod = value & 0xffff
      return
    case APU_REG.key:
      keyChannel(c, (value & 1) !== 0)
      return
    default:
  }
}

/** KEY: 1 starts a note (again, from the envelope's start), 0 lets it go. */
function keyChannel(c: ApuChannel, on: boolean): void {
  if (on) {
    c.ons = (c.ons + 1) & 0xffff
    c.gate = true
  } else if (c.gate) {
    c.offs = (c.offs + 1) & 0xffff
    c.gate = false
  }
}

/** What the page sends the synth once a frame that changed. */
export interface ApuFrame {
  master: number
  ch: ApuChannel[]
  /** The eight wave tables, 128 bytes, from video memory. */
  tables: Uint8Array
}

export const apuFrame = (a: ApuState, mem: Uint8Array): ApuFrame => ({
  master: a.master,
  ch: a.ch.map((c) => ({ ...c })),
  tables: mem.slice(WAVE_TABLES_AT, WAVE_TABLES_AT + WAVE_TABLES * WAVE_TABLE_BYTES),
})

/* ---------------- the synth ---------------- */

/** One channel's loudness at full volume: sixteen together stay under 1. */
export const CHANNEL_LEVEL = 0.06
/** The shortest ramp an edge takes, so a note never clicks on or off (seconds). */
const EDGE = 0.002

type Stage = 'off' | 'attack' | 'decay' | 'sustain' | 'release'

interface Voice {
  c: ApuChannel
  phase: number
  stage: Stage
  level: number
  /** Seconds since the note started, for the slide and vibrato. */
  age: number
  ons: number
  offs: number
  lfsr: number
  noise: number
}

const secondsOf = (index: number): number => Math.max(EDGE, (ENV_MS[index & 15] ?? 0) / 1000)

/**
 * Sixteen voices made from the frames the page sends: each carries its phase, envelope and
 * noise from one block to the next, starting a note when its channel was keyed on since the
 * last frame and releasing it when it was keyed off.
 */
export class ApuSynth {
  readonly #rate: number
  #master = 15
  #tables: Uint8Array = new Uint8Array(WAVE_TABLES * WAVE_TABLE_BYTES)
  readonly #voices: Voice[]

  constructor(sampleRate: number) {
    this.#rate = sampleRate
    this.#voices = Array.from({ length: CHANNELS }, () => ({
      c: channel(),
      phase: 0,
      stage: 'off' as Stage,
      level: 0,
      age: 0,
      ons: 0,
      offs: 0,
      lfsr: 0x4000,
      noise: 1,
    }))
  }

  /** The machine as it is now: notes keyed on or off since the last frame start or end. */
  set(frame: ApuFrame): void {
    this.#master = frame.master & 15
    this.#tables = frame.tables
    frame.ch.forEach((c, k) => {
      const v = this.#voices[k]
      if (v === undefined) return
      if (c.ons !== v.ons) {
        // From the envelope's start, as the spec has it: keyed on again, a note starts over.
        v.stage = 'attack'
        v.level = 0
        v.age = 0
        v.phase = 0
      }
      if (c.offs !== v.offs && !c.gate && v.stage !== 'off') v.stage = 'release'
      v.ons = c.ons
      v.offs = c.offs
      v.c = { ...c }
    })
  }

  /** Whether anything still sounds (a page may let the audio thread sleep when not). */
  get sounding(): boolean {
    return this.#voices.some((v) => v.stage !== 'off')
  }

  /** The next samples into `left` and `right`, added to what is there (they start at 0). */
  render(left: Float32Array, right: Float32Array): void {
    const master = this.#master / 15
    for (const v of this.#voices) {
      if (v.stage === 'off' || v.c.vol === 0) {
        if (v.stage !== 'off') this.#skip(v, left.length)
        continue
      }
      const gain = (v.c.vol / 15) * master * CHANNEL_LEVEL
      const toRight = panRight(v.c.pan)
      for (let i = 0; i < left.length; i++) {
        const s = this.#sample(v) * this.#envelope(v) * gain
        left[i] = (left[i] ?? 0) + s * (1 - toRight)
        right[i] = (right[i] ?? 0) + s * toRight
      }
    }
  }

  /** A silent voice's envelope moved on as if it had played. */
  #skip(v: Voice, n: number): void {
    for (let i = 0; i < n; i++) this.#envelope(v)
  }

  /** The envelope's level for the next sample (0-1), its stage moved on as time passes. */
  #envelope(v: Voice): number {
    const step = 1 / this.#rate
    const env = v.c.env
    const sustain = ((env >> 8) & 15) / 15
    switch (v.stage) {
      case 'attack':
        v.level += step / secondsOf(env & 15)
        if (v.level >= 1) {
          v.level = 1
          v.stage = 'decay'
        }
        break
      case 'decay':
        v.level -= (step / secondsOf((env >> 4) & 15)) * (1 - sustain)
        if (v.level <= sustain) {
          v.level = sustain
          v.stage = 'sustain'
        }
        break
      case 'release':
        v.level -= step / secondsOf((env >> 12) & 15)
        if (v.level <= 0) {
          v.level = 0
          v.stage = 'off'
        }
        break
      default:
    }
    return v.level
  }

  /** The wave's next sample (-1 to 1) at the pitch now, slide and vibrato in. */
  #sample(v: Voice): number {
    const c = v.c
    v.age += 1 / this.#rate
    const slide = ((c.mod << 24) >> 24) / 4 / 12
    const depth = ((c.mod >> 8) & 15) / 16 / 12
    const rate = (c.mod >> 12) & 15
    const semis = slide * v.age + depth * Math.sin(2 * Math.PI * rate * v.age)
    const hz = (c.freq / 4) * 2 ** semis
    v.phase += hz / this.#rate
    if (c.wave === WAVE.noise) return this.#noise(v)
    v.phase -= Math.floor(v.phase)
    return waveAt(c.wave, v.phase, this.#tables)
  }

  /** Noise: a 15-bit LFSR clocked at the pitch, a step each time the phase passes 1. */
  #noise(v: Voice): number {
    while (v.phase >= 1) {
      v.phase -= 1
      const bit = (v.lfsr ^ (v.lfsr >> 1)) & 1
      v.lfsr = (v.lfsr >> 1) | (bit << 14)
      v.noise = (v.lfsr & 1) === 0 ? 1 : -1
    }
    return v.noise
  }
}

/** How much of a channel goes right: 0 all left, 8 half each, 15 all right. */
export const panRight = (pan: number): number => (pan <= 8 ? pan / 16 : 0.5 + (pan - 8) / 14)

const DUTY = [0.125, 0.25, 0.5, 0.75] as const

/** A wave's value (-1 to 1) at a phase (0 to 1); a WAVE that is none is silent. */
export function waveAt(wave: number, phase: number, tables: Uint8Array): number {
  if (wave <= WAVE.square75) return phase < (DUTY[wave] ?? 0.5) ? 1 : -1
  if (wave === WAVE.triangle) return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
  if (wave === WAVE.saw) return 2 * phase - 1
  if (wave < WAVE.table) return 0
  const point = Math.floor(phase * 32)
  const b = tables[(wave - WAVE.table) * WAVE_TABLE_BYTES + (point >> 1)] ?? 0
  const n = (point & 1) === 0 ? b >> 4 : b & 15
  return n / 7.5 - 1
}
