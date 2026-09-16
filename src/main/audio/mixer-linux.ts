import type { MixerChannel, MixerCommand, MixerState } from '@shared/audio'
import { parsePactlDefaultSink, parsePactlSinkInputs, parseWpctlVolume } from './mixer-parse.js'

/**
 * The Linux mixer: pactl for everything, wpctl for the master where pactl is missing.
 *
 * pactl talks to PulseAudio and to PipeWire's pulse server alike, and names the
 * output device; wpctl comes only with WirePlumber. Reading the master through
 * wpctl alone left the whole mixer blank on systems with pactl but no wpctl.
 * pactl's JSON output needs PulseAudio 16's pactl; an older one falls back to
 * wpctl for the master, as does a system without pactl.
 *
 * The tool runner is injected so every path here is unit-tested.
 */

export type RunTool = (file: string, args: string[]) => Promise<string>

const PULSE_SINK = '@DEFAULT_SINK@'
const WP_SINK = '@DEFAULT_AUDIO_SINK@'

export interface LinuxMixer {
  read(): Promise<MixerState>
  apply(command: MixerCommand): Promise<void>
}

export function linuxMixer(run: RunTool): LinuxMixer {
  // The tool the master was last read with, so a change goes to the same one.
  let masterTool: 'pactl' | 'wpctl' = 'pactl'

  const readPulse = async (): Promise<MixerState> => {
    const [name, sinks] = await Promise.all([
      run('pactl', ['get-default-sink']),
      run('pactl', ['-f', 'json', 'list', 'sinks']),
    ])
    if (!isJson(sinks))
      throw new Error('pactl has no JSON output (PulseAudio 16 or later is needed)')
    const sink = parsePactlDefaultSink(sinks, name)
    const apps = await run('pactl', ['-f', 'json', 'list', 'sink-inputs'])
      .then(parsePactlSinkInputs)
      .catch(() => null)
    return state(
      apps === null ? 'master' : 'full',
      sink?.device ?? null,
      sink?.master ?? null,
      apps,
    )
  }

  const readWirePlumber = async (): Promise<MixerState> => {
    const master = parseWpctlVolume(await run('wpctl', ['get-volume', WP_SINK]))
    return state(master ? 'master' : 'none', null, master, null)
  }

  return {
    read: async () => {
      try {
        const result = await readPulse()
        masterTool = 'pactl'
        return result
      } catch (pulseError) {
        try {
          const result = await readWirePlumber()
          masterTool = 'wpctl'
          return result
        } catch (wpError) {
          return {
            support: 'none',
            device: null,
            master: null,
            apps: [],
            error: failure(pulseError, wpError),
          }
        }
      }
    },
    apply: async (command) => {
      if (command.id === 'master') {
        await run(masterTool, masterArgs(masterTool, command))
        return
      }
      const index = /^sink-input:(\d+)$/.exec(command.id)?.[1]
      if (index === undefined) return
      await run(
        'pactl',
        command.t === 'volume'
          ? ['set-sink-input-volume', index, percent(command.volume)]
          : ['set-sink-input-mute', index, command.muted ? '1' : '0'],
      )
    },
  }
}

function state(
  support: MixerState['support'],
  device: string | null,
  master: MixerChannel | null,
  apps: MixerChannel[] | null,
): MixerState {
  return {
    support,
    device,
    master,
    apps: apps ?? [],
    error: master ? null : 'the default output has no volume',
  }
}

function masterArgs(tool: 'pactl' | 'wpctl', command: MixerCommand): string[] {
  const muted = command.t === 'mute' && command.muted ? '1' : '0'
  if (tool === 'wpctl') {
    return command.t === 'volume'
      ? ['set-volume', WP_SINK, command.volume.toFixed(2)]
      : ['set-mute', WP_SINK, muted]
  }
  return command.t === 'volume'
    ? ['set-sink-volume', PULSE_SINK, percent(command.volume)]
    : ['set-sink-mute', PULSE_SINK, muted]
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

const percent = (volume: number): string => `${Math.round(volume * 100)}%`

const missing = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'

/** Why neither tool could read the mixer, in one line. */
function failure(pulseError: unknown, wpError: unknown): string {
  if (missing(pulseError) && missing(wpError)) {
    return 'neither pactl (pulseaudio-utils) nor wpctl (WirePlumber) was found'
  }
  const error = missing(pulseError) ? wpError : pulseError
  const stderr = (error as { stderr?: unknown } | null)?.stderr
  const text = typeof stderr === 'string' && stderr.trim() !== '' ? stderr : String(error)
  return (text.trim().split('\n')[0] ?? '').slice(0, 200)
}
