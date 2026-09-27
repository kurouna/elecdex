import type { Voice } from '@shared/plugin-api'
import { PLUGIN_VOICES, type SoundNote } from '@shared/plugin-sound'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Synth } from '../../src/renderer/plugins/synth.ts'
import { VOICES } from '../../src/renderer/plugins/voices.ts'

/**
 * The plugins' synthesiser (renderer/plugins/synth.ts, voices.ts), on a stand-in
 * AudioContext that records what is built and when it starts and stops: nothing is heard,
 * and the tests read the graph instead.
 */

class Param {
  value = 0
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  setTargetAtTime() {}
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
}

class Node {
  connect<T>(next: T): T {
    return next
  }
  disconnect() {}
}

class Source extends Node {
  frequency = new Param()
  detune = new Param()
  type = ''
  buffer: unknown = null
  loop = false
  started = Number.NaN
  stopped = Number.NaN
  onended: (() => void) | null = null
  start(at: number) {
    this.started = at
  }
  stop(at: number) {
    this.stopped = at
  }
  setPeriodicWave() {}
}

function fakeContext() {
  const sources: Source[] = []
  const ac = {
    currentTime: 10,
    state: 'running' as AudioContextState,
    sampleRate: 8000,
    baseLatency: 0.01,
    outputLatency: 0.02,
    destination: new Node(),
    stamp: { contextTime: 10, performanceTime: performance.now() },
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    getOutputTimestamp() {
      return this.stamp
    },
    createGain: () => Object.assign(new Node(), { gain: new Param() }),
    createOscillator: () => {
      const source = new Source()
      sources.push(source)
      return source
    },
    createBufferSource: () => {
      const source = new Source()
      sources.push(source)
      return source
    },
    createBiquadFilter: () =>
      Object.assign(new Node(), { type: '', frequency: new Param(), Q: new Param() }),
    createStereoPanner: () => Object.assign(new Node(), { pan: new Param() }),
    createDynamicsCompressor: () =>
      Object.assign(new Node(), {
        threshold: new Param(),
        knee: new Param(),
        ratio: new Param(),
        attack: new Param(),
        release: new Param(),
      }),
    createPeriodicWave: () => ({}),
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
  }
  return { ac, sources }
}

const note = (voice: Voice, change: Partial<SoundNote> = {}): SoundNote => ({
  voice,
  pitch: 60,
  at: null,
  length: null,
  level: 0.8,
  pan: 0,
  ...change,
})

beforeEach(() => {
  // performance too: the budget refills by it, and a test must not depend on how fast it ran.
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
  })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('the voices', () => {
  it('let a note go only when the source that stops last has ended, never an earlier one', () => {
    for (const voice of PLUGIN_VOICES) {
      const { ac, sources } = fakeContext()
      const kit = {
        ac: ac as unknown as BaseAudioContext,
        out: new Node() as unknown as AudioNode,
        noise: {} as AudioBuffer,
        piano: {} as PeriodicWave,
      }
      VOICES[voice](kit, { freq: 261.6, pitch: 60, start: 10, end: 11, level: 0.8 })
      const last = Math.max(...sources.map((s) => s.stopped))
      const watched = sources.filter((s) => s.onended !== null)
      expect(watched, voice).toHaveLength(1)
      expect(watched[0]?.stopped, voice).toBe(last)
      // The note itself is not cut before it is let go.
      expect(last, voice).toBeGreaterThanOrEqual(voice === 'hat' || voice === 'clap' ? 10.05 : 10.2)
    }
  })
})

describe('the synthesiser', () => {
  it('starts no more voices at once than there are, and holds a pane to its budget', () => {
    const { ac } = fakeContext()
    const synth = new Synth(() => ac as unknown as AudioContext)
    expect(
      synth.play(
        'p1',
        Array.from({ length: 4096 }, () => note('hat')),
      ),
    ).toBe(64)
    expect(
      synth.play(
        'p1',
        Array.from({ length: 64 }, () => note('hat')),
      ),
    ).toBe(64)
    expect(
      synth.play(
        'p1',
        Array.from({ length: 64 }, () => note('hat')),
      ),
    ).toBe(64)
    // The burst is spent: nothing more until time passes.
    expect(synth.play('p1', [note('hat')])).toBe(0)
    // Another pane has a budget of its own, and notes far ahead only wait.
    expect(synth.play('p2', [note('hat')])).toBe(1)
    expect(synth.play('p1', [note('hat', { at: performance.now() + 5000 })])).toBe(1)
    vi.advanceTimersByTime(100_000)
    expect(synth.play('p1', [note('hat')])).toBe(1)
  })

  it('schedules by the output clock, but not by a reading taken before it slept', () => {
    const { ac, sources } = fakeContext()
    const synth = new Synth(() => ac as unknown as AudioContext)
    vi.advanceTimersByTime(100_000)
    const now = performance.now()
    ac.stamp = { contextTime: 10, performanceTime: now }
    synth.play('p1', [note('kick', { at: now + 100 })])
    // Running: the stamp says the output is at 10 s now, so 100 ms on is 10.1 s.
    expect(sources.at(-1)?.started).toBeCloseTo(10.1, 3)
    // Asleep, with a stamp from long ago: the current time and latency stand in instead.
    ac.state = 'suspended'
    ac.stamp = { contextTime: 2, performanceTime: now - 60_000 }
    synth.play('p1', [note('kick', { at: now + 100 })])
    expect(sources.at(-1)?.started).toBeCloseTo(10 + 0.1 - 0.02, 3)
  })

  it('sleeps once nothing sounds, and wakes for the next note even before the sleep lands', () => {
    const { ac } = fakeContext()
    const synth = new Synth(() => ac as unknown as AudioContext)
    synth.play('p1', [note('hat')])
    expect(ac.resume).toHaveBeenCalledTimes(1)
    ac.currentTime = 100
    vi.advanceTimersByTime(4100)
    expect(ac.suspend).toHaveBeenCalledTimes(1)
    // The context has not said it is suspended yet; the next note must still wake it.
    expect(ac.state).toBe('running')
    synth.play('p1', [note('hat')])
    expect(ac.resume).toHaveBeenCalledTimes(2)
  })
})
