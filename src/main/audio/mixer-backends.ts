import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { MixerChannel, MixerCommand, MixerPeaks, MixerState } from '@shared/audio'
import { parseMacVolume, parsePactlSinkInputs, parseWpctlVolume } from './mixer-parse.js'
import type { MixerBackend } from './mixer-service.js'
import { windowsMixerBackend } from './mixer-windows.js'

/**
 * The mixer backend for this platform, or the in-memory stub the tests use.
 *
 *  - Windows: Core Audio in one long-lived PowerShell (mixer-windows.ts) - master,
 *    apps and peak meters.
 *  - macOS: AppleScript's volume settings - the master only; macOS has no per-app
 *    volume without an audio driver.
 *  - Linux: PipeWire's wpctl for the master and pactl for the apps, where present.
 *
 * macOS and Linux read every two seconds while a mixer pane shows, and at once
 * after a change. Spawning a reader per poll is fine there; on Windows it is not
 * (see the metrics sampler), hence the long-lived process.
 */

const run = promisify(execFile)
const POLL_MS = 2000
const RUN_TIMEOUT_MS = 4000

export function mixerBackend(stub: boolean): MixerBackend {
  if (stub) return stubMixerBackend()
  if (process.platform === 'win32') return windowsMixerBackend()
  if (process.platform === 'darwin') return pollingBackend(readMac, applyMac)
  return pollingBackend(readLinux, applyLinux)
}

const output = async (file: string, args: string[]): Promise<string> =>
  (await run(file, args, { timeout: RUN_TIMEOUT_MS, windowsHide: true })).stdout

/** A backend that reads on a timer and applies commands by running a tool. */
export function pollingBackend(
  read: () => Promise<MixerState>,
  apply: (command: MixerCommand) => Promise<void>,
  pollMs = POLL_MS,
): MixerBackend {
  let timer: ReturnType<typeof setTimeout> | null = null
  let generation = 0
  let emit: ((state: MixerState) => void) | null = null

  const poll = (current: number): void => {
    void read()
      .catch(
        (error: unknown): MixerState => ({
          support: 'none',
          device: null,
          master: null,
          apps: [],
          error: error instanceof Error ? error.message : String(error),
        }),
      )
      .then((state) => {
        if (current !== generation) return
        emit?.(state)
        timer = setTimeout(() => poll(current), pollMs)
      })
  }

  return {
    start: (events) => {
      generation += 1
      emit = events.state
      poll(generation)
    },
    stop: () => {
      generation += 1
      emit = null
      if (timer) clearTimeout(timer)
      timer = null
    },
    apply: (command) => {
      void apply(command)
        .catch(() => {})
        .then(() => {
          if (emit === null) return
          if (timer) clearTimeout(timer)
          poll(generation)
        })
    },
  }
}

async function readMac(): Promise<MixerState> {
  const master = parseMacVolume(await output('osascript', ['-e', 'get volume settings']))
  return {
    support: master ? 'master' : 'none',
    device: null,
    master,
    apps: [],
    error: master ? null : 'this output has no volume control',
  }
}

async function applyMac(command: MixerCommand): Promise<void> {
  if (command.id !== 'master') return
  const statement =
    command.t === 'volume'
      ? `set volume output volume ${Math.round(command.volume * 100)}`
      : `set volume output muted ${command.muted}`
  await output('osascript', ['-e', statement])
}

const SINK = '@DEFAULT_AUDIO_SINK@'

async function readLinux(): Promise<MixerState> {
  let master: MixerChannel | null
  try {
    master = parseWpctlVolume(await output('wpctl', ['get-volume', SINK]))
  } catch {
    return {
      support: 'none',
      device: null,
      master: null,
      apps: [],
      error: 'wpctl (PipeWire) was not found',
    }
  }
  const apps = await output('pactl', ['-f', 'json', 'list', 'sink-inputs'])
    .then(parsePactlSinkInputs)
    .catch(() => null)
  return {
    support: apps === null ? 'master' : 'full',
    device: null,
    master,
    apps: apps ?? [],
    error: master ? null : 'the default output has no volume',
  }
}

async function applyLinux(command: MixerCommand): Promise<void> {
  if (command.id === 'master') {
    await (command.t === 'volume'
      ? output('wpctl', ['set-volume', SINK, command.volume.toFixed(2)])
      : output('wpctl', ['set-mute', SINK, command.muted ? '1' : '0']))
    return
  }
  const index = /^sink-input:(\d+)$/.exec(command.id)?.[1]
  if (index === undefined) return
  await (command.t === 'volume'
    ? output('pactl', ['set-sink-input-volume', index, `${Math.round(command.volume * 100)}%`])
    : output('pactl', ['set-sink-input-mute', index, command.muted ? '1' : '0']))
}

/**
 * A mixer with a master and two apps, for the end-to-end tests: they must never
 * change the volume of the machine running them. Peaks move so meters show.
 */
export function stubMixerBackend(): MixerBackend {
  let state: MixerState = {
    support: 'full',
    device: 'Test Speakers',
    master: { id: 'master', name: 'Master', volume: 0.5, muted: false },
    apps: [
      { id: 'app:music', name: 'Music Player', volume: 0.8, muted: false },
      { id: 'app:browser', name: 'Web Browser', volume: 1, muted: false },
    ],
    error: null,
  }
  let stateTimer: ReturnType<typeof setInterval> | null = null
  let peakTimer: ReturnType<typeof setInterval> | null = null
  let events: { state(s: MixerState): void; peaks(p: MixerPeaks): void } | null = null
  const peakOf = (channel: MixerChannel | null, t: number, phase: number) =>
    channel && !channel.muted
      ? channel.volume * (0.5 + 0.4 * Math.abs(Math.sin(t / 300 + phase)))
      : 0

  return {
    start: (next) => {
      events = next
      next.state(state)
      stateTimer = setInterval(() => events?.state(state), 1000)
      peakTimer = setInterval(() => {
        const t = Date.now()
        events?.peaks({
          master: peakOf(state.master, t, 0),
          ...Object.fromEntries(state.apps.map((app, i) => [app.id, peakOf(app, t, i + 1)])),
        })
      }, 100)
    },
    stop: () => {
      events = null
      if (stateTimer) clearInterval(stateTimer)
      if (peakTimer) clearInterval(peakTimer)
      stateTimer = peakTimer = null
    },
    apply: (command) => {
      const change = (channel: MixerChannel): MixerChannel =>
        channel.id !== command.id
          ? channel
          : command.t === 'volume'
            ? { ...channel, volume: command.volume }
            : { ...channel, muted: command.muted }
      state = {
        ...state,
        master: state.master ? change(state.master) : null,
        apps: state.apps.map(change),
      }
      events?.state(state)
    },
  }
}
