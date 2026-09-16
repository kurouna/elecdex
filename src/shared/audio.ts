import { z } from 'zod'

/**
 * The audio panes' shared logic: the spectrum of what the computer is playing, and
 * the mixer's channels. Pure, so both the capture page and the panes use it, and
 * every rule here is unit-tested.
 *
 * The capture page (renderer/audio-capture) reduces each FFT to SPECTRUM_BINS
 * levels on a log scale; a pane groups those into the bands it shows. Only these
 * numbers ever leave the capture page - no sound, and no picture of the screen.
 */

/** Log-spaced bins from 20 Hz to 20 kHz: a sixth of an octave or so each. */
export const SPECTRUM_BINS = 60
export const SPECTRUM_MIN_HZ = 20
export const SPECTRUM_MAX_HZ = 20_000

/** FFT size: at 48 kHz, bins 12 Hz apart, fine enough for the lowest bands. */
export const SPECTRUM_FFT_SIZE = 4096

/** The analyser's smoothing: quick to follow, as a car display was; the panes add their own fall. */
export const SPECTRUM_SMOOTHING = 0.35

/** The quietest and loudest a bin shows, in dBFS: the range a car-audio display spans. */
export const SPECTRUM_FLOOR_DB = -84
export const SPECTRUM_CEILING_DB = -18

/**
 * The frames a second the capture page sends while there is sound. Each frame redraws
 * the pane, and the cost follows the rate, not the canvas size (measured in
 * docs/architecture.md §16); at 20 the falling bars and held peaks still look smooth.
 */
export const SPECTRUM_FPS = 20

/**
 * After the sound stops, frames keep coming this long, so bars fall and peaks drop
 * on screen; then nothing is sent until there is sound again.
 */
export const SPECTRUM_TAIL_MS = 2500

/** Below this level in every bin, the output is silent. */
export const SILENCE_LEVEL = 0.02

/** The low edge of bin `i`, in Hz; bin i spans [edge(i), edge(i + 1)). */
export function binEdge(i: number): number {
  return SPECTRUM_MIN_HZ * (SPECTRUM_MAX_HZ / SPECTRUM_MIN_HZ) ** (i / SPECTRUM_BINS)
}

/**
 * The analyser's decibel magnitudes (AnalyserNode.getFloatFrequencyData) as
 * SPECTRUM_BINS levels from 0 to 1: the loudest FFT bin inside each log bin, or
 * the nearest one where a low bin is narrower than the FFT's resolution.
 */
export function binsFromFft(fftDb: ArrayLike<number>, sampleRate: number): number[] {
  const hzPerBin = sampleRate / 2 / fftDb.length
  const levels: number[] = []
  for (let i = 0; i < SPECTRUM_BINS; i++) {
    const from = Math.floor(binEdge(i) / hzPerBin)
    const to = Math.max(from, Math.ceil(binEdge(i + 1) / hzPerBin) - 1)
    let loudest = Number.NEGATIVE_INFINITY
    for (let k = from; k <= to && k < fftDb.length; k++)
      loudest = Math.max(loudest, fftDb[k] ?? loudest)
    levels.push(levelFromDb(loudest))
  }
  return levels
}

/** A decibel value on the display's scale, 0 at the floor and 1 at the ceiling. */
export function levelFromDb(db: number): number {
  if (!Number.isFinite(db)) return 0
  const level = (db - SPECTRUM_FLOOR_DB) / (SPECTRUM_CEILING_DB - SPECTRUM_FLOOR_DB)
  return Math.max(0, Math.min(1, level))
}

export const isSilent = (bins: readonly number[]): boolean => bins.every((v) => v < SILENCE_LEVEL)

/** How often the spectrum is read once the sound has stopped: enough to notice it start again. */
export const SPECTRUM_QUIET_FPS = 10

/**
 * Reads the spectrum and sends frames while there is sound, and for a tail after
 * it stops so the bars can fall on screen; then nothing, and it reads less often,
 * until the sound returns. Both capture routes (the capture page, and parec on
 * Linux) pace themselves with it. Returns a function that stops it.
 */
export function pumpSpectrum(read: () => number[], send: (bins: number[]) => void): () => void {
  let quietSince: number | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = false
  const tick = (): void => {
    const bins = read()
    const now = performance.now()
    let quiet = false
    if (isSilent(bins)) {
      quietSince ??= now
      quiet = now - quietSince > SPECTRUM_TAIL_MS
    } else {
      quietSince = null
    }
    if (!quiet) send(bins)
    if (!stopped) timer = setTimeout(tick, 1000 / (quiet ? SPECTRUM_QUIET_FPS : SPECTRUM_FPS))
  }
  tick()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
  }
}

/**
 * What the capture window can play instead of the system's sound: `tone`, a steady
 * 1 kHz tone for the tests, or `demo`, music-like movement for screenshots. Neither
 * captures anything.
 */
export type AudioStub = 'tone' | 'demo'

/** `ELECDEX_AUDIO_STUB`: `1` for the tests' tone, `demo` for screenshots, else none. */
export const audioStubFrom = (value: string | undefined): AudioStub | null =>
  value === '1' ? 'tone' : value === 'demo' ? 'demo' : null

/** The demo's tempo: a beat every half second. */
const DEMO_BEAT_MS = 500

/**
 * The demo's bins at `ms`: a spectrum falling toward the highs as music's does, a
 * kick on every beat in the lows, a snare between beats in the mids, and each bin
 * drifting at its own pace so no two frames look alike. Pure, so it is tested.
 */
export function demoBins(ms: number): number[] {
  const sinceBeat = ms % DEMO_BEAT_MS
  const kick = Math.exp(-sinceBeat / 110)
  const snare = Math.exp(-(((ms + DEMO_BEAT_MS / 2) % DEMO_BEAT_MS) / 90))
  return Array.from({ length: SPECTRUM_BINS }, (_, i) => {
    const x = i / (SPECTRUM_BINS - 1)
    const base = 0.72 - 0.4 * x
    const drift = 0.14 * Math.sin(ms / (170 + i * 23) + i * 1.7) + 0.06 * Math.sin(ms / 61 + i)
    const low = x < 0.22 ? 0.28 * kick : 0
    const mid = x > 0.35 && x < 0.8 ? 0.16 * snare : 0
    return Math.max(0, Math.min(1, base + drift + low + mid))
  })
}

/** The bands a spectrum pane can show, by their ISO centre frequencies. */
export const BAND_SETS = {
  7: [63, 160, 400, 1000, 2500, 6300, 16000],
  10: [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
  16: [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 12500, 16000],
} as const satisfies Record<number, readonly number[]>

export type BandCount = keyof typeof BAND_SETS

export const bandLabel = (hz: number): string =>
  hz >= 1000 ? `${Number.isInteger(hz / 1000) ? hz / 1000 : (hz / 1000).toFixed(1)}k` : `${hz}`

/**
 * The bins grouped into bands: each band takes the loudest bin between the
 * geometric midpoints to its neighbours, so every bin belongs to exactly one band
 * and a tone lights one bar, whatever the band count.
 */
export function bandsFromBins(bins: readonly number[], count: BandCount): number[] {
  const centres = BAND_SETS[count]
  const levels = new Array<number>(centres.length).fill(0)
  bins.forEach((level, i) => {
    const hz = Math.sqrt(binEdge(i) * binEdge(i + 1))
    let band = 0
    while (
      band < centres.length - 1 &&
      hz >= Math.sqrt((centres[band] as number) * (centres[band + 1] as number))
    )
      band++
    levels[band] = Math.max(levels[band] as number, level)
  })
  return levels
}

/** How fast bars fall and how peaks hold, as the hardware looked. */
export const BALLISTICS = {
  /** Levels per second a bar falls (a full bar in ~0.6 s); it rises at once. */
  fall: 1.6,
  /** Seconds a peak mark stays at the top before it drops. */
  hold: 0.7,
  /** Levels per second a peak mark drops. */
  peakFall: 0.9,
} as const

export interface Meters {
  level: number[]
  peak: number[]
  hold: number[]
}

export const emptyMeters = (count: number): Meters => ({
  level: new Array(count).fill(0),
  peak: new Array(count).fill(0),
  hold: new Array(count).fill(0),
})

/** Moves displayed levels toward `targets` over `dt` seconds: instant rise, slow fall, held peaks. */
export function stepMeters(meters: Meters, targets: readonly number[], dt: number): Meters {
  const step = Math.max(0, dt)
  const next = emptyMeters(targets.length)
  targets.forEach((raw, i) => {
    const target = Math.max(0, Math.min(1, raw))
    const level = Math.max(target, (meters.level[i] ?? 0) - BALLISTICS.fall * step)
    let peak = meters.peak[i] ?? 0
    let hold = meters.hold[i] ?? 0
    if (level >= peak) {
      peak = level
      hold = BALLISTICS.hold
    } else if (hold > 0) {
      hold = Math.max(0, hold - step)
    } else {
      peak = Math.max(0, peak - BALLISTICS.peakFall * step)
    }
    next.level[i] = level
    next.peak[i] = peak
    next.hold[i] = hold
  })
  return next
}

/** Lit segments for a level: a segment lights once the level reaches its middle. */
export const litSegments = (level: number, segments: number): number =>
  Math.max(0, Math.min(segments, Math.round(level * segments)))

export const SPECTRUM_STYLES = ['vfd-cyan', 'vfd-amber', 'led', 'accent'] as const
export type SpectrumStyle = (typeof SPECTRUM_STYLES)[number]

export const SPECTRUM_PATTERNS = ['bar', 'mirror', 'peak'] as const
export type SpectrumPattern = (typeof SPECTRUM_PATTERNS)[number]

export interface SpectrumPrefs {
  style: SpectrumStyle
  bands: BandCount
  pattern: SpectrumPattern
  peakHold: boolean
}

export const DEFAULT_SPECTRUM_PREFS: SpectrumPrefs = {
  style: 'vfd-cyan',
  bands: 10,
  pattern: 'bar',
  peakHold: true,
}

/** A pane's saved choices, each falling back to the default when missing or unknown. */
export function spectrumPrefs(state: Record<string, unknown> | undefined): SpectrumPrefs {
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback
  return {
    style: pick(state?.style, SPECTRUM_STYLES, DEFAULT_SPECTRUM_PREFS.style),
    bands: pick(state?.bands, [7, 10, 16] as const, DEFAULT_SPECTRUM_PREFS.bands),
    pattern: pick(state?.pattern, SPECTRUM_PATTERNS, DEFAULT_SPECTRUM_PREFS.pattern),
    peakHold:
      typeof state?.peakHold === 'boolean' ? state.peakHold : DEFAULT_SPECTRUM_PREFS.peakHold,
  }
}

/** What a spectrum pane is sent: levels, or why there are none. */
export type SpectrumUpdate =
  | { t: 'frame'; bins: number[] }
  | {
      t: 'status'
      status: 'starting' | 'running' | 'unsupported' | 'failed'
      message: string | null
    }

/* ---------------------------------------------------------------- mixer */

export interface MixerChannel {
  /** 'master', or the platform's own id for an app's audio session. */
  id: string
  name: string
  /** 0 to 1. */
  volume: number
  muted: boolean
}

export interface MixerState {
  /** What the platform can do here. */
  support: 'full' | 'master' | 'none'
  /** The output device's name, when known. */
  device: string | null
  master: MixerChannel | null
  apps: MixerChannel[]
  /** Why the mixer could not be read. */
  error: string | null
}

/** Peak levels (0 to 1) by channel id, several times a second where the platform has them. */
export type MixerPeaks = Record<string, number>

export type MixerUpdate = { t: 'state'; state: MixerState } | { t: 'peaks'; peaks: MixerPeaks }

export const EMPTY_MIXER: MixerState = {
  support: 'none',
  device: null,
  master: null,
  apps: [],
  error: null,
}

/** Ids travel to the Windows mixer as one line of tab-separated fields: no tabs or line breaks. */
const channelId = z
  .string()
  .min(1)
  .max(1024)
  .refine((id) => !/[\t\r\n]/.test(id))

/** A change a mixer pane asks for, as main accepts it. */
export const MixerCommandSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('volume'), id: channelId, volume: z.number().min(0).max(1) }),
  z.object({ t: z.literal('mute'), id: channelId, muted: z.boolean() }),
])
export type MixerCommand = z.infer<typeof MixerCommandSchema>

/** A command, if it names a channel in the current state; null otherwise. */
export function validMixerCommand(raw: unknown, state: MixerState): MixerCommand | null {
  const parsed = MixerCommandSchema.safeParse(raw)
  if (!parsed.success) return null
  const { id } = parsed.data
  const known = state.master?.id === id || state.apps.some((app) => app.id === id)
  return known ? parsed.data : null
}

/** The state with a command applied, shown at once while the platform catches up. */
export function applyMixerCommand(state: MixerState, command: MixerCommand): MixerState {
  const change = (channel: MixerChannel): MixerChannel =>
    channel.id !== command.id
      ? channel
      : command.t === 'volume'
        ? { ...channel, volume: command.volume }
        : { ...channel, muted: command.muted }
  return {
    ...state,
    master: state.master ? change(state.master) : null,
    apps: state.apps.map(change),
  }
}
