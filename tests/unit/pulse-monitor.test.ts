import { describe, expect, it, vi } from 'vitest'
import type { RunTool } from '../../src/main/audio/mixer-linux.js'
import {
  MAX_MONITOR_GAIN,
  MONITOR,
  monitorGain,
  parsePactlMute,
  parsePactlVolume,
  readMonitorLevel,
  restoreMonitor,
} from '../../src/main/audio/pulse-monitor.js'

// What pactl printed for the monitor on a machine where the spectrum stayed dark.
const EIGHT_PERCENT_OUTPUT = [
  'Volume: front-left: 5140 /   8% / -66.33 dB,   front-right: 5140 /   8% / -66.33 dB',
  '        balance 0.00',
].join('\n')

const dB = (linear: number): number => 20 * Math.log10(linear)

describe('parsePactlVolume', () => {
  it('reads the cubic volume as the amplitude its dB figure shows', () => {
    const volume = parsePactlVolume(EIGHT_PERCENT_OUTPUT)
    expect(dB(volume as number)).toBeCloseTo(-66.33, 1)
  })

  it('takes the loudest channel, and reads 100% and 0% without dB figures', () => {
    expect(parsePactlVolume('Volume: front-left: 32768 /  50%,   front-right: 65536 / 100%')).toBe(
      1,
    )
    expect(parsePactlVolume('Volume: mono: 0 /   0% / -inf dB')).toBe(0)
  })

  it('is null for output without a volume', () => {
    expect(parsePactlVolume('Failed to get source volume: No such entity')).toBeNull()
    expect(parsePactlVolume('')).toBeNull()
  })
})

describe('parsePactlMute', () => {
  it.each([
    ['Mute: yes\n', true],
    ['Mute: no\n', false],
    ['No such entity', null],
  ])('%j reads as %s', (text, expected) => {
    expect(parsePactlMute(text)).toBe(expected)
  })
})

describe('monitorGain', () => {
  it('divides the volume back out, within a limit', () => {
    expect(monitorGain({ muted: false, volume: 1 })).toBe(1)
    expect(monitorGain({ muted: false, volume: 0.001 })).toBeCloseTo(1000)
    expect(monitorGain({ muted: false, volume: 1e-12 })).toBe(MAX_MONITOR_GAIN)
  })

  it('leaves an unknown volume alone and gives up on a muted or silent monitor', () => {
    expect(monitorGain(null)).toBe(1)
    expect(monitorGain({ muted: true, volume: 1 })).toBeNull()
    expect(monitorGain({ muted: false, volume: 0 })).toBeNull()
  })
})

describe('readMonitorLevel', () => {
  it('asks pactl about the default monitor, the one parec records', async () => {
    const run = vi.fn<RunTool>(async (_file, args) =>
      args[0] === 'get-source-mute' ? 'Mute: no\n' : EIGHT_PERCENT_OUTPUT,
    )
    const level = await readMonitorLevel(run)
    expect(level?.muted).toBe(false)
    expect(dB(level?.volume as number)).toBeCloseTo(-66.33, 1)
    expect(run.mock.calls).toEqual(
      expect.arrayContaining([
        ['pactl', ['get-source-volume', MONITOR]],
        ['pactl', ['get-source-mute', MONITOR]],
      ]),
    )
    expect(MONITOR).toBe('@DEFAULT_MONITOR@')
  })

  it('is null when pactl fails or prints something else', async () => {
    expect(await readMonitorLevel(async () => Promise.reject(new Error('ENOENT')))).toBeNull()
    expect(await readMonitorLevel(async () => 'unexpected')).toBeNull()
  })
})

describe('restoreMonitor', () => {
  it('unmutes the default monitor and sets it to 100%, and nothing else', async () => {
    const run = vi.fn<RunTool>(async () => '')
    await restoreMonitor(run)
    expect(run.mock.calls).toEqual([
      ['pactl', ['set-source-mute', MONITOR, '0']],
      ['pactl', ['set-source-volume', MONITOR, '100%']],
    ])
  })
})
