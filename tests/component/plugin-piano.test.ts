import type { Voice } from '@shared/plugin-api'
import type { SoundNote } from '@shared/plugin-sound'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Synth } from '../../src/renderer/plugins/synth.ts'

/**
 * The physical piano's page side (renderer/plugins/piano/strings.ts, synth.ts): which notes go
 * to the strings on the audio thread and what is posted to them, on a stand-in AudioContext
 * with a stand-in worklet. The strings themselves are tested in tests/unit/piano.test.ts.
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
  disconnected = false
  connect<T>(next: T): T {
    return next
  }
  disconnect() {
    this.disconnected = true
  }
}

class Source extends Node {
  frequency = new Param()
  detune = new Param()
  type = ''
  buffer: unknown = null
  loop = false
  onended: (() => void) | null = null
  start() {}
  stop() {}
  setPeriodicWave() {}
}

type Message = Record<string, unknown>

class FakeWorklet extends Node {
  static made: FakeWorklet[] = []
  readonly posted: Message[] = []
  readonly port = { postMessage: (m: Message) => this.posted.push(structuredClone(m)) }
  constructor() {
    super()
    FakeWorklet.made.push(this)
  }
}

function fakeContext(load: Promise<void>) {
  const sources: Source[] = []
  const source = () => {
    const s = new Source()
    sources.push(s)
    return s
  }
  const ac = {
    currentTime: 10,
    state: 'running' as AudioContextState,
    sampleRate: 8000,
    baseLatency: 0.01,
    outputLatency: 0.02,
    destination: new Node(),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    getOutputTimestamp: () => ({ contextTime: 10, performanceTime: performance.now() }),
    audioWorklet: { addModule: vi.fn(() => load) },
    createGain: () => Object.assign(new Node(), { gain: new Param() }),
    createOscillator: source,
    createBufferSource: source,
    createBiquadFilter: () =>
      Object.assign(new Node(), { type: '', frequency: new Param(), Q: new Param() }),
    createStereoPanner: () => Object.assign(new Node(), { pan: new Param() }),
    createConvolver: () => Object.assign(new Node(), { normalize: true, buffer: null }),
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
      length,
      getChannelData: () => new Float32Array(length),
      copyToChannel: () => {},
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

/** Lets the module's load, and what waits on it, settle. */
async function loaded(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

beforeEach(() => {
  FakeWorklet.made = []
  vi.stubGlobal('AudioWorkletNode', FakeWorklet)
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the piano', () => {
  it('is the recipe until the strings have loaded, and the strings after', async () => {
    const { ac, sources } = fakeContext(Promise.resolve())
    const synth = new Synth(() => ac as unknown as AudioContext, 'piano.js')
    synth.play('p1', [note('piano')])
    expect(ac.audioWorklet.addModule).toHaveBeenCalledWith('piano.js')
    expect(sources.length).toBeGreaterThan(0)
    expect(synth.strungNotes('p1')).toBe(0)

    await loaded()
    const before = sources.length
    synth.play('p1', [note('piano', { pitch: 64, level: 0.5, pan: 0.5, length: 300 })])
    expect(sources).toHaveLength(before)
    expect(synth.strungNotes('p1')).toBe(1)
    const [strings] = FakeWorklet.made
    expect(strings?.posted).toEqual([
      { t: 'strike', id: 1, pitch: 64, level: 0.5, pan: 0.5, at: expect.any(Number) },
      { t: 'release', id: 1, at: expect.any(Number) },
    ])
    const [strike, release] = strings?.posted ?? []
    expect((release?.at as number) - (strike?.at as number)).toBeCloseTo(0.3, 6)

    // A note given no length is held as the recipe's piano rang, then let go.
    synth.play('p1', [note('piano')])
    const [, , second, secondRelease] = strings?.posted ?? []
    expect((secondRelease?.at as number) - (second?.at as number)).toBeCloseTo(1.4, 6)
    // The other voices are still the recipe's.
    synth.play('p1', [note('epiano')])
    expect(sources.length).toBeGreaterThan(before)
    expect(FakeWorklet.made).toHaveLength(1)
  })

  it('lets a held key go when it comes up, and cuts it short when the voices run out', async () => {
    const { ac } = fakeContext(Promise.resolve())
    const synth = new Synth(() => ac as unknown as AudioContext, 'piano.js')
    synth.play('p1', [note('hat')])
    await loaded()
    const held = synth.start('p1', note('piano', { pitch: 72 }))
    const strings = FakeWorklet.made[0]
    expect(held).not.toBeNull()
    ac.currentTime = 11
    if (held) synth.release(held)
    expect(strings?.posted.at(-1)).toEqual({ t: 'release', id: 1, at: 11 })
    // Let go, it is silent once its damper has fallen, not thirty seconds on.
    expect(held?.end).toBeLessThan(12)
    held?.stop(11.5)
    expect(strings?.posted.at(-1)).toEqual({ t: 'stop', id: 1, at: 11.5 })
  })

  it('rings on after release at the top of the keyboard, which has no dampers', async () => {
    const { ac } = fakeContext(Promise.resolve())
    const synth = new Synth(() => ac as unknown as AudioContext, 'piano.js')
    synth.play('p1', [note('hat')])
    await loaded()
    const low = synth.start('p1', note('piano', { pitch: 60 }))
    const top = synth.start('p1', note('piano', { pitch: 100 }))
    if (low) synth.release(low)
    if (top) synth.release(top)
    expect((top?.end as number) - 10).toBeGreaterThan((low?.end as number) - 10)
  })

  it('hears the pane pedal, even pressed before the strings were made, and forgets it on stop', async () => {
    const { ac } = fakeContext(Promise.resolve())
    const synth = new Synth(() => ac as unknown as AudioContext, 'piano.js')
    synth.play('p1', [note('hat')])
    await loaded()
    synth.pedal('p1', true)
    synth.play('p1', [note('piano')])
    const first = FakeWorklet.made[0]
    expect(first?.posted[0]).toEqual({ t: 'pedal', on: true, at: 10 })
    synth.pedal('p1', false)
    expect(first?.posted.at(-1)).toEqual({ t: 'pedal', on: false, at: 10 })

    synth.pedal('p1', true)
    synth.stop('p1')
    expect(first?.posted.at(-1)).toEqual({ t: 'silence' })
    vi.advanceTimersByTime(600)
    expect(first?.disconnected).toBe(true)
    // A stop forgets the pedal, as the held keys do; the next strings are a new instrument.
    synth.play('p1', [note('piano')])
    const second = FakeWorklet.made[1]
    expect(second).toBeDefined()
    expect(second?.posted.some((m) => m.t === 'pedal')).toBe(false)
  })

  it('stays the recipe where the strings cannot load', async () => {
    const { ac, sources } = fakeContext(Promise.reject(new Error('refused')))
    const synth = new Synth(() => ac as unknown as AudioContext, 'piano.js')
    synth.play('p1', [note('piano')])
    await loaded()
    const before = sources.length
    synth.play('p1', [note('piano')])
    expect(sources.length).toBeGreaterThan(before)
    expect(FakeWorklet.made).toHaveLength(0)
    expect(synth.strungNotes('p1')).toBe(0)
  })
})
