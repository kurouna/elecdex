import type { Voice } from '@shared/plugin-api'
import { PLUGIN_VOICES, type SoundNote } from '@shared/plugin-sound'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Synth } from '../../src/renderer/plugins/synth.ts'
import { fakeAudioContext, Node } from './support/fake-audio.ts'

/**
 * The instruments' page side (renderer/plugins/instruments/hall.ts, synth.ts), by the piano:
 * which notes go to the audio thread and what is posted to it, on a stand-in AudioContext
 * with a stand-in worklet. The strings themselves are tested in tests/unit/piano.test.ts.
 */

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
    const { ac, sources } = fakeAudioContext({ worklet: Promise.resolve() })
    const synth = new Synth(() => ac as unknown as AudioContext, 'piano.js')
    synth.play('p1', [note('piano')])
    expect(ac.audioWorklet?.addModule).toHaveBeenCalledWith('piano.js')
    expect(sources.length).toBeGreaterThan(0)
    expect(synth.strungNotes('p1')).toBe(0)

    await loaded()
    const before = sources.length
    synth.play('p1', [note('piano', { pitch: 64, level: 0.5, pan: 0.5, length: 300 })])
    expect(sources).toHaveLength(before)
    expect(synth.strungNotes('p1')).toBe(1)
    const [strings] = FakeWorklet.made
    expect(strings?.posted).toEqual([
      {
        t: 'strike',
        voice: 'piano',
        id: 1,
        pitch: 64,
        level: 0.5,
        pan: 0.5,
        at: expect.any(Number),
      },
      { t: 'release', id: 1, at: expect.any(Number) },
    ])
    const [strike, release] = strings?.posted ?? []
    expect((release?.at as number) - (strike?.at as number)).toBeCloseTo(0.3, 6)

    // A note given no length is held as the recipe's piano rang, then let go.
    synth.play('p1', [note('piano')])
    const [, , second, secondRelease] = strings?.posted ?? []
    expect((secondRelease?.at as number) - (second?.at as number)).toBeCloseTo(1.4, 6)
    // Every voice is an instrument on the audio thread now: none is built of nodes, and the
    // pane keeps its one band.
    for (const voice of PLUGIN_VOICES) synth.play('p1', [note(voice)])
    expect(sources).toHaveLength(before)
    expect(FakeWorklet.made).toHaveLength(1)
    expect(strings?.posted.filter((m) => m.t === 'strike').map((m) => m.voice)).toEqual(
      expect.arrayContaining([...PLUGIN_VOICES]),
    )
  })

  it('lets a held key go when it comes up, and cuts it short when the voices run out', async () => {
    const { ac } = fakeAudioContext({ worklet: Promise.resolve() })
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
    const { ac } = fakeAudioContext({ worklet: Promise.resolve() })
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
    const { ac } = fakeAudioContext({ worklet: Promise.resolve() })
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
    const { ac, sources } = fakeAudioContext({ worklet: Promise.reject(new Error('refused')) })
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
