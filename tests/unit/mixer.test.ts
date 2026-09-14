import type { MixerCommand, MixerPeaks, MixerState, MixerUpdate } from '@shared/audio'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parseMacVolume,
  parsePactlSinkInputs,
  parseWindowsLine,
  parseWpctlVolume,
} from '../../src/main/audio/mixer-parse.js'
import {
  COMMAND_GRACE_MS,
  type MixerBackend,
  MixerService,
} from '../../src/main/audio/mixer-service.js'

vi.mock('electron', () => ({}))
const { pollingBackend, stubMixerBackend } = await import('../../src/main/audio/mixer-backends.js')

describe('parsing the Windows mixer loop', () => {
  it('reads a state line, clamping volumes and naming a nameless app by its id', () => {
    const line = JSON.stringify({
      t: 'state',
      device: 'スピーカー (Realtek(R) Audio)',
      master: { id: 'master', name: 'Master', volume: 0.54, muted: false },
      apps: [
        { id: 'app:chrome', name: 'Google Chrome', volume: 1.0000001, muted: true },
        { id: 'app:x', name: '  ', volume: -0.1, muted: false },
      ],
    })
    expect(parseWindowsLine(line)).toEqual({
      t: 'state',
      state: {
        support: 'full',
        device: 'スピーカー (Realtek(R) Audio)',
        master: { id: 'master', name: 'Master', volume: 0.54, muted: false },
        apps: [
          { id: 'app:chrome', name: 'Google Chrome', volume: 1, muted: true },
          { id: 'app:x', name: 'app:x', volume: 0, muted: false },
        ],
        error: null,
      },
    })
  })

  it('reads peaks and errors, and ignores anything else', () => {
    expect(parseWindowsLine('{"t":"peaks","p":{"master":0.25,"app:chrome":1.4}}')).toEqual({
      t: 'peaks',
      peaks: { master: 0.25, 'app:chrome': 1 },
    })
    expect(parseWindowsLine('{"t":"error","message":"no device"}')).toEqual({
      t: 'error',
      message: 'no device',
    })
    expect(parseWindowsLine('')).toBeNull()
    expect(parseWindowsLine('Add-Type : error CS1002')).toBeNull()
    expect(parseWindowsLine('{"t":"state","master":null}')).toBeNull()
  })
})

describe('parsing macOS and Linux tools', () => {
  it('reads AppleScript volume settings', () => {
    expect(
      parseMacVolume('output volume:54, input volume:75, alert volume:100, output muted:false'),
    ).toEqual({
      id: 'master',
      name: 'Master',
      volume: 0.54,
      muted: false,
    })
    expect(
      parseMacVolume(
        'output volume:100, input volume:missing value, alert volume:100, output muted:true',
      )?.muted,
    ).toBe(true)
    expect(
      parseMacVolume(
        'output volume:missing value, input volume:75, alert volume:100, output muted:missing value',
      ),
    ).toBeNull()
  })

  it('reads wpctl', () => {
    expect(parseWpctlVolume('Volume: 0.54\n')).toMatchObject({ volume: 0.54, muted: false })
    expect(parseWpctlVolume('Volume: 1.20 [MUTED]\n')).toMatchObject({ volume: 1, muted: true })
    expect(parseWpctlVolume('Could not connect to PipeWire')).toBeNull()
  })

  it('reads pactl sink inputs, averaging channels on the 65536 scale', () => {
    const json = JSON.stringify([
      {
        index: 42,
        mute: false,
        volume: { 'front-left': { value: 32768 }, 'front-right': { value: 65536 } },
        properties: { 'application.name': 'Firefox', 'application.process.binary': 'firefox' },
      },
      { index: 43, mute: true, volume: {}, properties: { 'application.process.binary': 'mpv' } },
      { index: 'bad' },
    ])
    expect(parsePactlSinkInputs(json)).toEqual([
      { id: 'sink-input:42', name: 'Firefox', volume: 0.75, muted: false },
      { id: 'sink-input:43', name: 'mpv', volume: 0, muted: true },
    ])
    expect(parsePactlSinkInputs('not json')).toEqual([])
  })
})

/** A backend the test drives by hand. */
function fakeBackend() {
  let events: { state(s: MixerState): void; peaks(p: MixerPeaks): void } | null = null
  const applied: MixerCommand[] = []
  const backend: MixerBackend = {
    start: vi.fn((next) => {
      events = next
    }),
    stop: vi.fn(() => {
      events = null
    }),
    apply: (command) => applied.push(command),
  }
  return {
    backend,
    applied,
    read: (state: MixerState) => events?.state(state),
    peaks: (peaks: MixerPeaks) => events?.peaks(peaks),
  }
}

const reading = (volume: number, muted = false): MixerState => ({
  support: 'full',
  device: 'Speakers',
  master: { id: 'master', name: 'Master', volume, muted },
  apps: [],
  error: null,
})

describe('MixerService', () => {
  let now = 0
  let published: MixerUpdate[] = []
  let fake: ReturnType<typeof fakeBackend>
  let service: MixerService

  beforeEach(() => {
    now = 1000
    published = []
    fake = fakeBackend()
    service = new MixerService({
      backend: fake.backend,
      publish: (u) => published.push(u),
      now: () => now,
    })
  })

  it('runs the backend only between start and stop, once however often started', () => {
    service.start()
    service.start()
    expect(fake.backend.start).toHaveBeenCalledTimes(1)
    fake.read(reading(0.5))
    fake.peaks({ master: 0.2 })
    expect(published.map((u) => u.t)).toEqual(['state', 'peaks'])
    service.stop()
    expect(fake.backend.stop).toHaveBeenCalledTimes(1)
    // A reading that arrives late is dropped.
    fake.read(reading(0.9))
    expect(published).toHaveLength(2)
  })

  it('refuses commands while stopped, or for channels it does not have', () => {
    expect(service.command({ t: 'volume', id: 'master', volume: 0.2 })).toBe(false)
    service.start()
    fake.read(reading(0.5))
    expect(service.command({ t: 'volume', id: 'app:nope', volume: 0.2 })).toBe(false)
    expect(service.command({ t: 'volume', id: 'master', volume: 2 })).toBe(false)
    expect(fake.applied).toEqual([])
  })

  it('shows a command at once, and does not let a stale reading undo it', () => {
    service.start()
    fake.read(reading(0.5))
    expect(service.command({ t: 'volume', id: 'master', volume: 0.2 })).toBe(true)
    expect(fake.applied).toEqual([{ t: 'volume', id: 'master', volume: 0.2 }])
    expect(service.state().master?.volume).toBe(0.2)
    // The system has not caught up: the old volume is read back.
    now += 500
    fake.read(reading(0.5))
    expect(service.state().master?.volume).toBe(0.2)
    // Now it has.
    fake.read(reading(0.2))
    expect(service.state().master?.volume).toBe(0.2)
    // And a later change made elsewhere (the volume keys) shows, not overridden.
    fake.read(reading(0.7))
    expect(service.state().master?.volume).toBe(0.7)
  })

  it('stops overriding after the grace period if the system never takes the change', () => {
    service.start()
    fake.read(reading(0.5, false))
    service.command({ t: 'mute', id: 'master', muted: true })
    now += COMMAND_GRACE_MS
    fake.read(reading(0.5, false))
    expect(service.state().master?.muted).toBe(false)
  })

  it('forgets pending commands on stop', () => {
    service.start()
    fake.read(reading(0.5))
    service.command({ t: 'volume', id: 'master', volume: 0.2 })
    service.stop()
    service.start()
    fake.read(reading(0.5))
    expect(service.state().master?.volume).toBe(0.5)
  })
})

describe('pollingBackend', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reads at once and then on its interval, stops cleanly, and reads again after a change', async () => {
    const read = vi.fn(async () => reading(0.5))
    const apply = vi.fn(async () => {})
    const states: MixerState[] = []
    const backend = pollingBackend(read, apply, 2000)
    backend.start({ state: (s) => states.push(s), peaks: () => {} })
    await vi.advanceTimersByTimeAsync(0)
    expect(read).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2000)
    expect(read).toHaveBeenCalledTimes(2)

    backend.apply({ t: 'volume', id: 'master', volume: 0.1 })
    await vi.advanceTimersByTimeAsync(0)
    expect(apply).toHaveBeenCalledOnce()
    expect(read).toHaveBeenCalledTimes(3)

    backend.stop()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(read).toHaveBeenCalledTimes(3)
    expect(states.length).toBe(3)
  })

  it('reports a failing tool as an error rather than going quiet', async () => {
    const backend = pollingBackend(
      async () => {
        throw new Error('wpctl: not found')
      },
      async () => {},
      2000,
    )
    const states: MixerState[] = []
    backend.start({ state: (s) => states.push(s), peaks: () => {} })
    await vi.advanceTimersByTimeAsync(0)
    expect(states[0]).toMatchObject({ support: 'none', error: 'wpctl: not found' })
    backend.stop()
  })
})

describe('the test stub', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reports a mixer at once, takes commands, and goes quiet when stopped', async () => {
    const backend = stubMixerBackend()
    const states: MixerState[] = []
    const peaks: MixerPeaks[] = []
    backend.start({ state: (s) => states.push(s), peaks: (p) => peaks.push(p) })
    expect(states[0]?.apps.map((a) => a.id)).toEqual(['app:music', 'app:browser'])
    backend.apply({ t: 'mute', id: 'app:music', muted: true })
    expect(states.at(-1)?.apps[0]?.muted).toBe(true)
    await vi.advanceTimersByTimeAsync(300)
    expect(peaks.at(-1)?.['app:music']).toBe(0)
    backend.stop()
    const count = states.length + peaks.length
    await vi.advanceTimersByTimeAsync(5000)
    expect(states.length + peaks.length).toBe(count)
  })
})
