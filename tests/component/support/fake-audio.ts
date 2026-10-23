import { vi } from 'vitest'

/**
 * A stand-in AudioContext for the plugins' synthesiser and instruments: nothing is heard, and
 * the tests read the graph it builds instead. The synthesiser's and the piano's tests used
 * two copies of it.
 */

export class Param {
  value = 0
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  setTargetAtTime() {}
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
}

export class Node {
  disconnected = false
  connect<T>(next: T): T {
    return next
  }
  disconnect() {
    this.disconnected = true
  }
}

/** An oscillator or buffer source, recording when it was told to start and stop. */
export class Source extends Node {
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

/**
 * The context, at 10 s, with every source it made in `sources`. Its output timestamp is
 * `stamp`, which a test may move. Given `worklet` (the module's load), it has an
 * `audioWorklet` whose `addModule` answers that; without, it has none, as where the
 * instruments cannot load.
 */
export function fakeAudioContext({ worklet }: { worklet?: Promise<void> } = {}) {
  const sources: Source[] = []
  const source = () => {
    const made = new Source()
    sources.push(made)
    return made
  }
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
    ...(worklet === undefined ? {} : { audioWorklet: { addModule: vi.fn(() => worklet) } }),
    createGain: () => Object.assign(new Node(), { gain: new Param() }),
    createOscillator: source,
    createBufferSource: source,
    createBiquadFilter: () =>
      Object.assign(new Node(), { type: '', frequency: new Param(), Q: new Param() }),
    createStereoPanner: () => Object.assign(new Node(), { pan: new Param() }),
    createWaveShaper: () => Object.assign(new Node(), { curve: null, oversample: 'none' }),
    createDelay: () => Object.assign(new Node(), { delayTime: new Param() }),
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
