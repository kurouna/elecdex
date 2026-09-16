import { readFileSync } from 'node:fs'
import {
  applyMixerCommand,
  audioStubFrom,
  BALLISTICS,
  BAND_COUNTS,
  BAND_SETS,
  bandLabel,
  bandsFromBins,
  binEdge,
  binsFromFft,
  demoBins,
  emptyMeters,
  isSilent,
  levelFromDb,
  litSegments,
  type MixerState,
  SPECTRUM_BINS,
  SPECTRUM_CEILING_DB,
  SPECTRUM_FLOOR_DB,
  spectrumPrefs,
  stepMeters,
  validMixerCommand,
} from '@shared/audio'
import { CH } from '@shared/channels'
import { describe, expect, it } from 'vitest'

/** Bins with one tone at `hz`, as the capture page would send them. */
const toneBins = (hz: number, level = 0.9) =>
  Array.from({ length: SPECTRUM_BINS }, (_, i) =>
    binEdge(i) <= hz && hz < binEdge(i + 1) ? level : 0,
  )

describe('spectrum bins', () => {
  it('spans 20 Hz to 20 kHz on a log scale', () => {
    expect(binEdge(0)).toBeCloseTo(20)
    expect(binEdge(SPECTRUM_BINS)).toBeCloseTo(20_000)
    expect(binEdge(SPECTRUM_BINS / 2)).toBeCloseTo(Math.sqrt(20 * 20_000))
  })

  it('maps decibels onto the display range, silence and overload included', () => {
    expect(levelFromDb(SPECTRUM_FLOOR_DB)).toBe(0)
    expect(levelFromDb(SPECTRUM_CEILING_DB)).toBe(1)
    expect(levelFromDb(0)).toBe(1)
    expect(levelFromDb(-200)).toBe(0)
    // The analyser reports -Infinity for a silent bin.
    expect(levelFromDb(Number.NEGATIVE_INFINITY)).toBe(0)
  })

  it('puts a tone in the bin holding its frequency, low bins included', () => {
    const sampleRate = 48_000
    const fft = new Float32Array(2048).fill(-120)
    const hzPerBin = sampleRate / 2 / fft.length
    for (const hz of [40, 1000, 12_000]) {
      fft.fill(-120)
      fft[Math.round(hz / hzPerBin)] = SPECTRUM_CEILING_DB
      const bins = binsFromFft(fft, sampleRate)
      expect(bins).toHaveLength(SPECTRUM_BINS)
      const loudest = bins.indexOf(Math.max(...bins))
      // Low log bins are narrower than an FFT bin: the tone's FFT bin is within one
      // FFT bin of the log bin that shows it.
      const fftHz = Math.round(hz / hzPerBin) * hzPerBin
      expect(binEdge(loudest) - hzPerBin).toBeLessThanOrEqual(fftHz)
      expect(binEdge(loudest + 1) + hzPerBin).toBeGreaterThan(fftHz)
      // However it spreads over narrow log bins, a tone lights at most two neighbouring bands.
      const lit = bandsFromBins(bins, 10).flatMap((v, i) => (v > 0 ? [i] : []))
      expect(lit.length).toBeGreaterThan(0)
      expect((lit.at(-1) ?? 0) - (lit[0] ?? 0)).toBeLessThanOrEqual(1)
    }
  })

  it('tells silence from sound', () => {
    expect(isSilent(new Array(SPECTRUM_BINS).fill(0.01))).toBe(true)
    expect(isSilent(toneBins(1000, 0.05))).toBe(false)
  })
})

describe('stand-in sound', () => {
  it('is chosen only by the values the tests and screenshots set', () => {
    expect(audioStubFrom('1')).toBe('tone')
    expect(audioStubFrom('demo')).toBe('demo')
    for (const value of [undefined, '', '0', 'true', 'DEMO'])
      expect(audioStubFrom(value)).toBeNull()
  })

  it('moves like music: valid levels, never silent, lows pulsing on the beat', () => {
    const lows = (bins: number[]) => bandsFromBins(bins, 7)[0] ?? 0
    for (let ms = 0; ms < 4000; ms += 50) {
      const bins = demoBins(ms)
      expect(bins).toHaveLength(SPECTRUM_BINS)
      expect(bins.every((v) => v >= 0 && v <= 1)).toBe(true)
      expect(isSilent(bins)).toBe(false)
    }
    // On the beat the lows are louder than just before the next one.
    expect(lows(demoBins(1000))).toBeGreaterThan(lows(demoBins(1450)))
    expect(demoBins(1000)).not.toEqual(demoBins(1050))
  })
})

describe('bands', () => {
  it('lights the one band a tone falls in, for every band count', () => {
    for (const count of BAND_COUNTS) {
      const bands = bandsFromBins(toneBins(1000), count)
      expect(bands).toHaveLength(BAND_SETS[count].length)
      const lit = bands.flatMap((v, i) => (v > 0 ? [i] : []))
      expect(lit).toEqual([BAND_SETS[count].indexOf(1000 as never)])
    }
  })

  it('offers the ISO third-octave bands from 20 Hz to 20 kHz, two bins each, one at the ends', () => {
    const centres = BAND_SETS[31]
    expect(centres).toHaveLength(31)
    // A tenth of a decade apart, to the rounding of the ISO nominal values.
    centres.forEach((hz, i) => {
      expect(Math.abs(Math.log10(hz / (20 * 10 ** (i / 10))))).toBeLessThan(0.005)
    })
    const binsPerBand = new Array(31).fill(0)
    for (let i = 0; i < SPECTRUM_BINS; i++) {
      const bins = new Array(SPECTRUM_BINS).fill(0)
      bins[i] = 1
      binsPerBand[bandsFromBins(bins, 31).indexOf(1)]++
    }
    expect(binsPerBand).toEqual([1, ...new Array(29).fill(2), 1])
  })

  it('offers every band set in the settings', () => {
    expect([...BAND_COUNTS].sort((a, b) => a - b)).toEqual(Object.keys(BAND_SETS).map(Number))
    for (const count of BAND_COUNTS) expect(BAND_SETS[count]).toHaveLength(count)
  })

  it('assigns every bin to a band, the extremes to the end bands', () => {
    const all = new Array(SPECTRUM_BINS).fill(0.5)
    for (const count of BAND_COUNTS) {
      expect(bandsFromBins(all, count).every((v) => v === 0.5)).toBe(true)
      expect(bandsFromBins(toneBins(21), count)[0]).toBe(0.9)
      expect(bandsFromBins(toneBins(19_000), count).at(-1)).toBe(0.9)
    }
  })

  it('labels bands as a car display does', () => {
    expect(BAND_SETS[16].map(bandLabel)).toContain('12.5k')
    expect(BAND_SETS[31].map(bandLabel)).toEqual(
      expect.arrayContaining(['20', '31.5', '1k', '1.25k', '3.15k', '6.3k', '12.5k', '20k']),
    )
    expect(BAND_SETS[10].map(bandLabel)).toEqual([
      '31',
      '63',
      '125',
      '250',
      '500',
      '1k',
      '2k',
      '4k',
      '8k',
      '16k',
    ])
  })
})

describe('meters', () => {
  it('rise at once, fall at the set rate, and hold their peak before it drops', () => {
    let m = stepMeters(emptyMeters(1), [0.8], 1 / 30)
    expect(m.level[0]).toBe(0.8)
    expect(m.peak[0]).toBe(0.8)
    m = stepMeters(m, [0], 0.25)
    expect(m.level[0]).toBeCloseTo(0.8 - BALLISTICS.fall * 0.25)
    // Held.
    expect(m.peak[0]).toBe(0.8)
    m = stepMeters(m, [0], BALLISTICS.hold)
    expect(m.peak[0]).toBe(0.8)
    m = stepMeters(m, [0], 0.5)
    expect(m.peak[0]).toBeCloseTo(0.8 - BALLISTICS.peakFall * 0.5)
    expect(m.level[0]).toBe(0)
  })

  it('never goes below zero or above one, and ignores a negative step', () => {
    const m = stepMeters(emptyMeters(2), [1.7, -0.3], -1)
    expect(m.level).toEqual([1, 0])
    expect(stepMeters(m, [0, 0], 10).level).toEqual([0, 0])
  })

  it('takes the band count of the targets, so a change of bands needs no reset', () => {
    expect(stepMeters(emptyMeters(10), new Array(16).fill(0.5), 0.1).level).toHaveLength(16)
  })

  it('lights segments by rounding, within the column', () => {
    expect(litSegments(0, 20)).toBe(0)
    expect(litSegments(0.024, 20)).toBe(0)
    expect(litSegments(0.5, 20)).toBe(10)
    expect(litSegments(1.2, 20)).toBe(20)
  })
})

describe('spectrum prefs', () => {
  it('defaults to a cyan VFD with ten bands, bars and peak hold', () => {
    expect(spectrumPrefs(undefined)).toEqual({
      style: 'vfd-cyan',
      bands: 10,
      pattern: 'bar',
      peakHold: true,
    })
  })

  it('keeps valid choices and falls back for each unknown one', () => {
    expect(spectrumPrefs({ style: 'led', bands: 16, pattern: 'mirror', peakHold: false })).toEqual({
      style: 'led',
      bands: 16,
      pattern: 'mirror',
      peakHold: false,
    })
    expect(spectrumPrefs({ bands: 31 }).bands).toBe(31)
    expect(spectrumPrefs({ bands: 32 }).bands).toBe(10)
    expect(spectrumPrefs({ style: 'plasma', bands: 12, pattern: 1, peakHold: 'yes' })).toEqual(
      spectrumPrefs(undefined),
    )
  })
})

describe('mixer commands', () => {
  const state: MixerState = {
    support: 'full',
    device: 'Speakers',
    master: { id: 'master', name: 'Master', volume: 0.5, muted: false },
    apps: [{ id: 'app:chrome', name: 'Google Chrome', volume: 1, muted: false }],
    error: null,
  }

  it('accepts a volume or mute for a channel the mixer has', () => {
    expect(validMixerCommand({ t: 'volume', id: 'master', volume: 0.3 }, state)).toEqual({
      t: 'volume',
      id: 'master',
      volume: 0.3,
    })
    expect(validMixerCommand({ t: 'mute', id: 'app:chrome', muted: true }, state)).not.toBeNull()
  })

  it('refuses unknown channels, out-of-range values and malformed commands', () => {
    expect(validMixerCommand({ t: 'volume', id: 'app:ghost', volume: 0.3 }, state)).toBeNull()
    expect(validMixerCommand({ t: 'volume', id: 'master', volume: 1.5 }, state)).toBeNull()
    expect(validMixerCommand({ t: 'volume', id: 'master', volume: '0.5' }, state)).toBeNull()
    expect(validMixerCommand({ t: 'mute', id: 'master' }, state)).toBeNull()
    expect(validMixerCommand({ t: 'launch', id: 'master' }, state)).toBeNull()
    expect(validMixerCommand(null, state)).toBeNull()
  })

  it("refuses an id that would break the Windows loop's one-line commands", () => {
    const tabbed = {
      ...state,
      apps: [{ ...state.apps[0], id: 'app:a\tvolume' } as MixerState['apps'][0]],
    }
    expect(validMixerCommand({ t: 'mute', id: 'app:a\tvolume', muted: true }, tabbed)).toBeNull()
    expect(
      validMixerCommand({ t: 'mute', id: 'master\nvolume\tmaster\t1', muted: true }, state),
    ).toBeNull()
  })

  it('applies a command to its channel only', () => {
    const next = applyMixerCommand(state, { t: 'mute', id: 'app:chrome', muted: true })
    expect(next.apps[0]?.muted).toBe(true)
    expect(next.master).toEqual(state.master)
    expect(
      applyMixerCommand(state, { t: 'volume', id: 'master', volume: 0.2 }).master?.volume,
    ).toBe(0.2)
  })
})

describe('the capture preload', () => {
  it('writes out the same channel names main listens on', () => {
    const source = readFileSync(
      new URL('../../src/preload/audio-capture.ts', import.meta.url),
      'utf8',
    )
    expect(source).toContain(`frame: '${CH.audioCapture.frame}'`)
    expect(source).toContain(`status: '${CH.audioCapture.status}'`)
    // It must stay a single file: no import but electron.
    expect(source.match(/^import .* from '(.*)'$/gm)).toEqual([
      "import { contextBridge, ipcRenderer } from 'electron'",
    ])
  })
})
