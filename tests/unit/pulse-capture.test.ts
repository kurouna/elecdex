import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import {
  binEdge,
  SPECTRUM_BINS,
  SPECTRUM_FPS,
  SPECTRUM_TAIL_MS,
  type SpectrumUpdate,
} from '@shared/audio'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PcmSpectrum } from '../../src/main/audio/pcm-spectrum.js'
import {
  MONITOR_POLL_MS,
  openPulseCapture,
  PAREC_ARGS,
  PAREC_RATE,
  type ReadMonitor,
} from '../../src/main/audio/pulse-capture.js'
import type { MonitorLevel } from '../../src/main/audio/pulse-monitor.js'

/** `seconds` of a sine at `hz` and `amplitude` as float32le bytes. */
function sine(hz: number, amplitude: number, seconds = 0.2): Buffer {
  const count = Math.round(PAREC_RATE * seconds)
  const bytes = Buffer.alloc(count * 4)
  for (let i = 0; i < count; i++) {
    bytes.writeFloatLE(amplitude * Math.sin((2 * Math.PI * hz * i) / PAREC_RATE), i * 4)
  }
  return bytes
}

/** A monitor at 8% as pactl reported it on a machine where the spectrum stayed dark. */
const EIGHT_PERCENT = (5140 / 65536) ** 3

/** Reads the bins after smoothing has settled, as the analyser's does after a few reads. */
function settled(spectrum: PcmSpectrum): number[] {
  let bins: number[] = []
  for (let i = 0; i < 20; i++) bins = spectrum.bins()
  return bins
}

const binOf = (hz: number): number =>
  Array.from({ length: SPECTRUM_BINS }, (_, i) => i).find(
    (i) => binEdge(i) <= hz && hz < binEdge(i + 1),
  ) as number

describe('PcmSpectrum', () => {
  it('shows nothing for silence', () => {
    const spectrum = new PcmSpectrum(PAREC_RATE)
    spectrum.push(Buffer.alloc(8192))
    expect(spectrum.bins().every((v) => v === 0)).toBe(true)
  })

  it('lights the bin of a tone at the level the analyser would show, and little else', () => {
    const spectrum = new PcmSpectrum(PAREC_RATE)
    spectrum.push(sine(1000, 0.5))
    const bins = settled(spectrum)
    // A Blackman-windowed sine of amplitude 0.5 reads about -19.6 dBFS in an AnalyserNode.
    expect(bins[binOf(1000)]).toBeCloseTo((-19.6 + 84) / 66, 1)
    expect(bins[binOf(100)]).toBeLessThan(0.1)
    expect(bins[binOf(10_000)]).toBeLessThan(0.1)
  })

  it('reads the same however the stream is split, even mid-sample', () => {
    const bytes = sine(440, 0.3)
    const whole = new PcmSpectrum(PAREC_RATE)
    whole.push(bytes)
    const split = new PcmSpectrum(PAREC_RATE)
    for (let at = 0; at < bytes.length; at += 333) split.push(bytes.subarray(at, at + 333))
    expect(split.bins()).toEqual(whole.bins())
  })

  it('decodes negative samples', () => {
    const spectrum = new PcmSpectrum(PAREC_RATE)
    // A square wave of -1 and +1 has strong odd harmonics; misread signs would not.
    const bytes = Buffer.alloc(16_384)
    for (let i = 0; i < 4096; i++) bytes.writeFloatLE(Math.floor(i / 24) % 2 ? -1 : 1, i * 4)
    spectrum.push(bytes)
    expect(spectrum.bins()[binOf(1000)]).toBeGreaterThan(0.8)
  })

  // At 8% the monitor records music about 66 dB down: 16-bit samples rounded it to
  // 0 and -1, and the pane said "no sound" while the speakers played.
  it('undoes a turned-down monitor with its gain, as if it were at 100%', () => {
    const full = new PcmSpectrum(PAREC_RATE)
    full.push(sine(1000, 0.5))
    const quiet = new PcmSpectrum(PAREC_RATE)
    quiet.gain = 1 / EIGHT_PERCENT
    quiet.push(sine(1000, 0.5 * EIGHT_PERCENT))
    const expected = settled(full)
    const bins = settled(quiet)
    expect(bins[binOf(1000)]).toBeGreaterThan(0.8)
    expect(bins[binOf(1000)]).toBeCloseTo(expected[binOf(1000)] as number, 2)

    const uncorrected = new PcmSpectrum(PAREC_RATE)
    uncorrected.push(sine(1000, 0.5 * EIGHT_PERCENT))
    expect(settled(uncorrected)[binOf(1000)]).toBeLessThan(0.1)
  })

  it('keeps samples within full scale and reads broken ones as silence', () => {
    const spectrum = new PcmSpectrum(PAREC_RATE)
    spectrum.gain = 1000
    const bytes = Buffer.alloc(16_384)
    for (let i = 0; i < 4096; i++)
      bytes.writeFloatLE(i % 7 === 0 ? Number.NaN : Math.floor(i / 24) % 2 ? -0.5 : 0.5, i * 4)
    spectrum.push(bytes)
    const bins = spectrum.bins()
    expect(bins.every((v) => Number.isFinite(v) && v <= 1)).toBe(true)
  })
})

/** A stand-in for the parec process. */
function fakeRecorder() {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(() => true),
  })
  const spawn = vi.fn((_file: string, _args: string[]) => child as unknown as ChildProcess)
  return { child, spawn }
}

describe('openPulseCapture', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('records the monitor of the default output, never the default input', () => {
    const { spawn } = fakeRecorder()
    openPulseCapture(() => {}, { spawn }).close()
    expect(spawn).toHaveBeenCalledWith('parec', PAREC_ARGS)
    expect(PAREC_ARGS).toContain('--device=@DEFAULT_MONITOR@')
    // Floats keep a quiet monitor's signal for the gain to undo.
    expect(PAREC_ARGS).toContain('--format=float32le')
    expect(PAREC_ARGS).toContain('--channels=1')
  })

  it('reports running once sound flows, sends frames, and stops them after the silence tail', () => {
    const { child, spawn } = fakeRecorder()
    const updates: SpectrumUpdate[] = []
    const capture = openPulseCapture((u) => updates.push(u), { spawn })
    expect(updates).toEqual([])

    child.stdout.emit('data', sine(1000, 0.5))
    expect(updates[0]).toEqual({ t: 'status', status: 'running', message: null })
    vi.advanceTimersByTime(1000)
    const frames = updates.filter((u) => u.t === 'frame')
    expect(frames.length).toBeGreaterThanOrEqual(SPECTRUM_FPS - 1)

    child.stdout.emit('data', Buffer.alloc(16_384))
    updates.length = 0
    vi.advanceTimersByTime(SPECTRUM_TAIL_MS + 1000)
    const tail = updates.length
    vi.advanceTimersByTime(2000)
    expect(updates.length).toBe(tail)

    capture.close()
    expect(child.kill).toHaveBeenCalledOnce()
  })

  it('stops sending and kills parec on close', () => {
    const { child, spawn } = fakeRecorder()
    const updates: SpectrumUpdate[] = []
    const capture = openPulseCapture((u) => updates.push(u), { spawn })
    child.stdout.emit('data', sine(1000, 0.5))
    capture.close()
    capture.close()
    const count = updates.length
    vi.advanceTimersByTime(1000)
    child.emit('exit', null, 'SIGTERM')
    expect(updates.length).toBe(count)
    expect(child.kill).toHaveBeenCalledOnce()
  })

  it('says parec is missing', () => {
    const { child, spawn } = fakeRecorder()
    const updates: SpectrumUpdate[] = []
    openPulseCapture((u) => updates.push(u), { spawn })
    child.emit('error', Object.assign(new Error('spawn parec ENOENT'), { code: 'ENOENT' }))
    expect(updates).toEqual([
      { t: 'status', status: 'failed', message: 'parec (pulseaudio-utils) was not found' },
    ])
    vi.advanceTimersByTime(1000)
    expect(updates).toHaveLength(1)
  })

  it('reports why parec stopped', () => {
    const { child, spawn } = fakeRecorder()
    const updates: SpectrumUpdate[] = []
    openPulseCapture((u) => updates.push(u), { spawn })
    child.stderr.emit('data', Buffer.from('Stream error: No such entity\n'))
    child.emit('exit', 1, null)
    expect(updates).toEqual([
      { t: 'status', status: 'failed', message: 'parec stopped: Stream error: No such entity' },
    ])
  })
})

describe('openPulseCapture with the monitor volume', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  /** A reader whose answer the test changes. */
  function monitor(initial: MonitorLevel | null) {
    let level = initial
    const read = vi.fn<ReadMonitor>(async () => level)
    return { read, set: (next: MonitorLevel | null) => (level = next) }
  }

  const litAt1k = (updates: SpectrumUpdate[]): number => {
    const frame = updates.filter((u) => u.t === 'frame').at(-1)
    return frame?.t === 'frame' ? (frame.bins[binOf(1000)] as number) : 0
  }

  it('shows a turned-down monitor at the level it plays', async () => {
    const { child, spawn } = fakeRecorder()
    const { read } = monitor({ muted: false, volume: EIGHT_PERCENT })
    const updates: SpectrumUpdate[] = []
    const capture = openPulseCapture((u) => updates.push(u), { spawn, readMonitor: read })
    await vi.advanceTimersByTimeAsync(0)
    child.stdout.emit('data', sine(1000, 0.5 * EIGHT_PERCENT))
    await vi.advanceTimersByTimeAsync(1000)
    expect(litAt1k(updates)).toBeGreaterThan(0.8)
    capture.close()
  })

  it('follows a volume changed while it runs, and stops reading on close', async () => {
    const { child, spawn } = fakeRecorder()
    const { read, set } = monitor({ muted: false, volume: 1 })
    const updates: SpectrumUpdate[] = []
    const capture = openPulseCapture((u) => updates.push(u), { spawn, readMonitor: read })
    await vi.advanceTimersByTimeAsync(0)
    set({ muted: false, volume: EIGHT_PERCENT })
    await vi.advanceTimersByTimeAsync(MONITOR_POLL_MS)
    child.stdout.emit('data', sine(1000, 0.5 * EIGHT_PERCENT))
    await vi.advanceTimersByTimeAsync(1000)
    expect(litAt1k(updates)).toBeGreaterThan(0.8)

    capture.close()
    const reads = read.mock.calls.length
    await vi.advanceTimersByTimeAsync(MONITOR_POLL_MS * 3)
    expect(read).toHaveBeenCalledTimes(reads)
  })

  it('takes an unreadable volume as 100%', async () => {
    const { child, spawn } = fakeRecorder()
    const read = vi.fn<ReadMonitor>(async () => {
      throw new Error('pactl: not found')
    })
    const updates: SpectrumUpdate[] = []
    const capture = openPulseCapture((u) => updates.push(u), { spawn, readMonitor: read })
    await vi.advanceTimersByTimeAsync(0)
    child.stdout.emit('data', sine(1000, 0.5))
    await vi.advanceTimersByTimeAsync(1000)
    expect(updates[0]).toEqual({ t: 'status', status: 'running', message: null })
    expect(litAt1k(updates)).toBeGreaterThan(0.8)
    capture.close()
  })

  it.each([
    ['muted', { muted: true, volume: 1 }],
    ['at 0%', { muted: false, volume: 0 }],
  ])(
    'says a monitor %s is muted, sends no frames, and runs again once restored',
    async (_, level) => {
      const { child, spawn } = fakeRecorder()
      const { read, set } = monitor(level)
      const updates: SpectrumUpdate[] = []
      const capture = openPulseCapture((u) => updates.push(u), { spawn, readMonitor: read })
      await vi.advanceTimersByTimeAsync(0)
      // Nothing is said before sound flows, muted or not.
      expect(updates).toEqual([])
      child.stdout.emit('data', Buffer.alloc(16_384))
      expect(updates).toEqual([{ t: 'status', status: 'muted', message: null }])
      await vi.advanceTimersByTimeAsync(MONITOR_POLL_MS * 2)
      expect(updates.filter((u) => u.t === 'frame')).toEqual([])
      expect(updates).toHaveLength(1)

      set({ muted: false, volume: 1 })
      await vi.advanceTimersByTimeAsync(MONITOR_POLL_MS)
      expect(updates[1]).toEqual({ t: 'status', status: 'running', message: null })
      child.stdout.emit('data', sine(1000, 0.5))
      await vi.advanceTimersByTimeAsync(500)
      expect(litAt1k(updates)).toBeGreaterThan(0.5)
      capture.close()
    },
  )
})
