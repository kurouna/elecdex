import { describe, expect, it, vi } from 'vitest'
import { linuxMixer, type RunTool } from '../../src/main/audio/mixer-linux.js'
import { parsePactlDefaultSink } from '../../src/main/audio/mixer-parse.js'

const SINKS = JSON.stringify([
  {
    name: 'alsa_output.hdmi',
    description: 'HDMI Output',
    mute: false,
    volume: { 'front-left': { value: 65536 } },
  },
  {
    name: 'alsa_output.analog-stereo',
    description: 'Built-in Audio Analog Stereo',
    mute: true,
    volume: { 'front-left': { value: 32768 }, 'front-right': { value: 32768 } },
  },
])
const INPUTS = JSON.stringify([
  {
    index: 7,
    mute: false,
    volume: { mono: { value: 65536 } },
    properties: { 'application.name': 'mpv' },
  },
])

const enoent = () => Object.assign(new Error('spawn pactl ENOENT'), { code: 'ENOENT' })

/** A runner answering like a machine with the given tools; the rest are missing. */
function machine(
  tools: Record<string, (args: string[]) => string>,
): RunTool & { calls: string[][] } {
  const calls: string[][] = []
  const run = vi.fn(async (file: string, args: string[]) => {
    calls.push([file, ...args])
    const tool = tools[file]
    if (!tool) throw enoent()
    return tool(args)
  })
  return Object.assign(run, { calls })
}

const pactl = (args: string[]): string => {
  if (args[0] === 'get-default-sink') return 'alsa_output.analog-stereo\n'
  if (args.at(-1) === 'sinks') return SINKS
  if (args.at(-1) === 'sink-inputs') return INPUTS
  return ''
}

describe('parsePactlDefaultSink', () => {
  it('finds the default sink by name, naming it by its description', () => {
    expect(parsePactlDefaultSink(SINKS, 'alsa_output.analog-stereo\n')).toEqual({
      device: 'Built-in Audio Analog Stereo',
      master: { id: 'master', name: 'Master', volume: 0.5, muted: true },
    })
  })

  it('falls back to the name, and returns null for a missing sink or bad output', () => {
    const bare = JSON.stringify([{ name: 'x', mute: false, volume: {} }])
    expect(parsePactlDefaultSink(bare, 'x')?.device).toBe('x')
    expect(parsePactlDefaultSink(SINKS, 'gone')).toBeNull()
    expect(parsePactlDefaultSink('Sink #0', 'x')).toBeNull()
  })
})

describe('linuxMixer', () => {
  it('reads device, master and apps from pactl alone, without wpctl', async () => {
    // wpctl missing used to blank the whole mixer even though pactl worked.
    const run = machine({ pactl })
    expect(await linuxMixer(run).read()).toEqual({
      support: 'full',
      device: 'Built-in Audio Analog Stereo',
      master: { id: 'master', name: 'Master', volume: 0.5, muted: true },
      apps: [{ id: 'sink-input:7', name: 'mpv', volume: 1, muted: false }],
      error: null,
    })
    expect(run.calls.some(([file]) => file === 'wpctl')).toBe(false)
  })

  it('sets the master and apps through pactl', async () => {
    const run = machine({ pactl })
    const mixer = linuxMixer(run)
    await mixer.read()
    await mixer.apply({ t: 'volume', id: 'master', volume: 0.426 })
    await mixer.apply({ t: 'mute', id: 'master', muted: true })
    await mixer.apply({ t: 'volume', id: 'sink-input:7', volume: 0.3 })
    await mixer.apply({ t: 'mute', id: 'sink-input:7', muted: false })
    await mixer.apply({ t: 'mute', id: 'app:other', muted: false })
    expect(run.calls.slice(3)).toEqual([
      ['pactl', 'set-sink-volume', '@DEFAULT_SINK@', '43%'],
      ['pactl', 'set-sink-mute', '@DEFAULT_SINK@', '1'],
      ['pactl', 'set-sink-input-volume', '7', '30%'],
      ['pactl', 'set-sink-input-mute', '7', '0'],
    ])
  })

  it('falls back to wpctl for the master where pactl is missing, and sets it there', async () => {
    const run = machine({ wpctl: () => 'Volume: 0.40 [MUTED]\n' })
    const mixer = linuxMixer(run)
    expect(await mixer.read()).toEqual({
      support: 'master',
      device: null,
      master: { id: 'master', name: 'Master', volume: 0.4, muted: true },
      apps: [],
      error: null,
    })
    await mixer.apply({ t: 'volume', id: 'master', volume: 0.5 })
    await mixer.apply({ t: 'mute', id: 'master', muted: false })
    expect(run.calls.slice(-2)).toEqual([
      ['wpctl', 'set-volume', '@DEFAULT_AUDIO_SINK@', '0.50'],
      ['wpctl', 'set-mute', '@DEFAULT_AUDIO_SINK@', '0'],
    ])
  })

  it('falls back to wpctl when pactl is too old for JSON', async () => {
    const run = machine({
      pactl: (args) => (args[0] === 'get-default-sink' ? 'x' : 'Sink #0\n\tState: RUNNING'),
      wpctl: () => 'Volume: 0.40\n',
    })
    expect(await linuxMixer(run).read()).toMatchObject({
      support: 'master',
      master: { volume: 0.4 },
    })
  })

  it('keeps the master when only the app list fails', async () => {
    const run = machine({
      pactl: (args) => {
        if (args.at(-1) === 'sink-inputs') throw new Error('boom')
        return pactl(args)
      },
    })
    expect(await linuxMixer(run).read()).toMatchObject({ support: 'master', apps: [], error: null })
  })

  it('says which tools are missing when neither is there', async () => {
    expect(await linuxMixer(machine({})).read()).toEqual({
      support: 'none',
      device: null,
      master: null,
      apps: [],
      error: 'neither pactl (pulseaudio-utils) nor wpctl (WirePlumber) was found',
    })
  })

  it('reports why a present tool failed rather than calling it missing', async () => {
    const run = machine({
      pactl: () => {
        throw Object.assign(new Error('Command failed'), {
          stderr: 'Connection failure: Connection refused\n',
        })
      },
    })
    expect(await linuxMixer(run).read()).toMatchObject({
      support: 'none',
      error: 'Connection failure: Connection refused',
    })
  })
})
