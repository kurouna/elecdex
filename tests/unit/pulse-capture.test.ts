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
import { openPulseCapture, PAREC_ARGS, PAREC_RATE } from '../../src/main/audio/pulse-capture.js'

/** `seconds` of a sine at `hz` and `amplitude` as s16le bytes. */
function sine(hz: number, amplitude: number, seconds = 0.2): Buffer {
  const count = Math.round(PAREC_RATE * seconds)
  const bytes = Buffer.alloc(count * 2)
  for (let i = 0; i < count; i++) {
    const value = Math.round(amplitude * 32767 * Math.sin((2 * Math.PI * hz * i) / PAREC_RATE))
    bytes.writeInt16LE(value, i * 2)
  }
  return bytes
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
    let bins: number[] = []
    // Smoothing takes a few reads to settle, as the analyser's does.
    for (let i = 0; i < 20; i++) bins = spectrum.bins()
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
    const bytes = Buffer.alloc(8192)
    for (let i = 0; i < 4096; i++)
      bytes.writeInt16LE(Math.floor(i / 24) % 2 ? -32768 : 32767, i * 2)
    spectrum.push(bytes)
    expect(spectrum.bins()[binOf(1000)]).toBeGreaterThan(0.8)
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
    openPulseCapture(() => {}, spawn).close()
    expect(spawn).toHaveBeenCalledWith('parec', PAREC_ARGS)
    expect(PAREC_ARGS).toContain('--device=@DEFAULT_MONITOR@')
    expect(PAREC_ARGS).toContain('--format=s16le')
    expect(PAREC_ARGS).toContain('--channels=1')
  })

  it('reports running once sound flows, sends frames, and stops them after the silence tail', () => {
    const { child, spawn } = fakeRecorder()
    const updates: SpectrumUpdate[] = []
    const capture = openPulseCapture((u) => updates.push(u), spawn)
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
    const capture = openPulseCapture((u) => updates.push(u), spawn)
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
    openPulseCapture((u) => updates.push(u), spawn)
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
    openPulseCapture((u) => updates.push(u), spawn)
    child.stderr.emit('data', Buffer.from('Stream error: No such entity\n'))
    child.emit('exit', 1, null)
    expect(updates).toEqual([
      { t: 'status', status: 'failed', message: 'parec stopped: Stream error: No such entity' },
    ])
  })
})
