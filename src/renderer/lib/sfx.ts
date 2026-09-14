/**
 * Interface sounds, synthesised with WebAudio.
 *
 * eDEX-UI played recorded samples through howler.js. Synthesising them instead
 * ships no audio files - nothing to license, nothing to load - and every sound is
 * a short, readable recipe below. Sounds are rate-limited per name, so a boot log
 * printing sixty lines a second ticks rather than buzzes.
 */

export type SoundName =
  | 'stdout'
  | 'granted'
  | 'title'
  | 'glitch'
  | 'panel'
  | 'expand'
  | 'collapse'
  | 'folder'
  | 'theme'
  | 'alarm'
  | 'quake'

interface Tone {
  kind: 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise'
  /** Hz; for noise, the centre of its band-pass filter. */
  freq: number
  /** Glide to this frequency over the tone. */
  freqEnd?: number
  /** Seconds after the sound starts. */
  at: number
  /** Seconds. */
  duration: number
  /** Peak level, 0 to 1, before the master volume. */
  gain: number
}

export interface SoundRecipe {
  tones: Tone[]
  /** Minimum milliseconds between two plays of this sound. */
  minIntervalMs: number
}

export const SOUNDS: Readonly<Record<SoundName, SoundRecipe>> = {
  // A dry tick per boot log line.
  stdout: {
    tones: [{ kind: 'square', freq: 2100, at: 0, duration: 0.012, gain: 0.05 }],
    minIntervalMs: 28,
  },
  // Boot complete: two rising notes.
  granted: {
    tones: [
      { kind: 'sine', freq: 660, at: 0, duration: 0.09, gain: 0.22 },
      { kind: 'sine', freq: 990, at: 0.09, duration: 0.16, gain: 0.22 },
    ],
    minIntervalMs: 200,
  },
  // The title card: a low swell that opens up.
  title: {
    tones: [
      { kind: 'sawtooth', freq: 55, freqEnd: 110, at: 0, duration: 1.1, gain: 0.12 },
      { kind: 'sine', freq: 220, freqEnd: 440, at: 0.1, duration: 1.0, gain: 0.08 },
    ],
    minIntervalMs: 1000,
  },
  // The derezz: a burst of filtered noise.
  glitch: {
    tones: [{ kind: 'noise', freq: 3000, at: 0, duration: 0.18, gain: 0.25 }],
    minIntervalMs: 150,
  },
  // A module powering on.
  panel: {
    tones: [{ kind: 'triangle', freq: 520, freqEnd: 820, at: 0, duration: 0.07, gain: 0.14 }],
    minIntervalMs: 60,
  },
  // A pane opening: noise sweeping upward, like a tube warming.
  expand: {
    tones: [
      { kind: 'noise', freq: 400, freqEnd: 4000, at: 0, duration: 0.28, gain: 0.2 },
      { kind: 'sine', freq: 180, freqEnd: 360, at: 0, duration: 0.28, gain: 0.1 },
    ],
    minIntervalMs: 120,
  },
  collapse: {
    tones: [
      { kind: 'noise', freq: 3000, freqEnd: 300, at: 0, duration: 0.2, gain: 0.18 },
      { kind: 'sine', freq: 360, freqEnd: 120, at: 0, duration: 0.2, gain: 0.1 },
    ],
    minIntervalMs: 120,
  },
  // A click in the file browser, a new tab.
  folder: {
    tones: [{ kind: 'sine', freq: 1300, freqEnd: 900, at: 0, duration: 0.035, gain: 0.18 }],
    minIntervalMs: 40,
  },
  theme: {
    tones: [
      { kind: 'triangle', freq: 440, at: 0, duration: 0.08, gain: 0.15 },
      { kind: 'triangle', freq: 554, at: 0.07, duration: 0.08, gain: 0.15 },
      { kind: 'triangle', freq: 659, at: 0.14, duration: 0.14, gain: 0.15 },
    ],
    minIntervalMs: 250,
  },
  // Exit armed: two warning beeps.
  alarm: {
    tones: [
      { kind: 'square', freq: 440, at: 0, duration: 0.1, gain: 0.1 },
      { kind: 'square', freq: 330, at: 0.14, duration: 0.14, gain: 0.1 },
    ],
    minIntervalMs: 400,
  },
  // An earthquake alert: a falling three-note pattern, twice, unlike anything the UI does.
  quake: {
    tones: [0, 0.5].flatMap((start) => [
      { kind: 'square' as const, freq: 988, at: start, duration: 0.1, gain: 0.12 },
      { kind: 'square' as const, freq: 784, at: start + 0.13, duration: 0.1, gain: 0.12 },
      { kind: 'square' as const, freq: 587, at: start + 0.26, duration: 0.16, gain: 0.12 },
    ]),
    minIntervalMs: 2000,
  },
}

/** Total length of a recipe in seconds. */
export function recipeLength(recipe: SoundRecipe): number {
  return Math.max(0, ...recipe.tones.map((t) => t.at + t.duration))
}

/** Decides whether a sound may play now, given when it last did. */
export function allowPlay(last: number | undefined, now: number, minIntervalMs: number): boolean {
  return last === undefined || now - last >= minIntervalMs
}

export interface SfxOptions {
  enabled: () => boolean
  /** 0 to 1. */
  volume: () => number
}

export class Sfx {
  private context: AudioContext | null = null
  private noise: AudioBuffer | null = null
  private readonly lastPlayed = new Map<SoundName, number>()
  private readonly options: SfxOptions

  constructor(options: SfxOptions) {
    this.options = options
  }

  play(name: SoundName): void {
    if (!this.options.enabled()) return
    const volume = this.options.volume()
    if (volume <= 0) return

    const recipe = SOUNDS[name]
    const now = performance.now()
    if (!allowPlay(this.lastPlayed.get(name), now, recipe.minIntervalMs)) return
    this.lastPlayed.set(name, now)

    const ctx = this.audio()
    if (ctx === null) return
    const start = ctx.currentTime + 0.005
    for (const tone of recipe.tones) this.schedule(ctx, tone, start, volume)
  }

  private audio(): AudioContext | null {
    if (this.context === null) {
      try {
        this.context = new AudioContext({ latencyHint: 'interactive' })
      } catch {
        return null // no audio device
      }
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  private schedule(ctx: AudioContext, tone: Tone, start: number, volume: number): void {
    const t0 = start + tone.at
    const t1 = t0 + tone.duration

    const amp = ctx.createGain()
    // A fast attack and an exponential tail: no clicks at either end.
    amp.gain.setValueAtTime(0.0001, t0)
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, tone.gain * volume), t0 + 0.004)
    amp.gain.exponentialRampToValueAtTime(0.0001, t1)
    amp.connect(ctx.destination)

    if (tone.kind === 'noise') {
      const source = ctx.createBufferSource()
      source.buffer = this.noiseBuffer(ctx)
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 1.2
      filter.frequency.setValueAtTime(tone.freq, t0)
      if (tone.freqEnd !== undefined)
        filter.frequency.exponentialRampToValueAtTime(tone.freqEnd, t1)
      source.connect(filter).connect(amp)
      source.start(t0)
      source.stop(t1 + 0.01)
      return
    }

    const osc = ctx.createOscillator()
    osc.type = tone.kind
    osc.frequency.setValueAtTime(tone.freq, t0)
    if (tone.freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(tone.freqEnd, t1)
    osc.connect(amp)
    osc.start(t0)
    osc.stop(t1 + 0.01)
  }

  /** One second of white noise, made once and reused. */
  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise === null) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      this.noise = buffer
    }
    return this.noise
  }
}
