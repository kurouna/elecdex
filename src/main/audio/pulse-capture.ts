import { type ChildProcess, spawn } from 'node:child_process'
import { pumpSpectrum, type SpectrumUpdate } from '@shared/audio'
import { PcmSpectrum } from './pcm-spectrum.js'
import { type MonitorLevel, monitorGain } from './pulse-monitor.js'
import type { CaptureHandle } from './spectrum-capture.js'

/**
 * The spectrum's capture on Linux, where Electron has no loopback audio.
 *
 * parec (pulseaudio-utils; PulseAudio and PipeWire's pulse server both serve it)
 * records the monitor of the default output - what the computer plays - as float
 * mono, and main turns it into the panes' bins as the capture page does. The
 * device is always `@DEFAULT_MONITOR@`: without it parec would record the default
 * input, a microphone. No sound is kept; only the levels leave this module.
 *
 * The monitor's own volume is read every few seconds and divided back out
 * (pulse-monitor.ts), so a monitor turned down by accident still shows the sound
 * as played. A muted one cannot be undone that way, and the panes are told `muted`.
 *
 * The recorder runs only while a spectrum pane is showing (SpectrumCapture) and
 * is killed with the last one. Spawning and the volume reader are injected so the
 * lifecycle is tested.
 */

export const PAREC_RATE = 48_000

export const PAREC_ARGS = [
  '--device=@DEFAULT_MONITOR@',
  '--raw',
  '--format=float32le',
  `--rate=${PAREC_RATE}`,
  '--channels=1',
  // Small blocks so the bars follow the sound; the server's default is far larger.
  '--latency-msec=40',
  '--client-name=elecdex',
  '--stream-name=spectrum',
]

/** How often the monitor's volume is read while capturing. */
export const MONITOR_POLL_MS = 2000

export type SpawnRecorder = (file: string, args: string[]) => ChildProcess
export type ReadMonitor = () => Promise<MonitorLevel | null>

const spawnRecorder: SpawnRecorder = (file, args) =>
  spawn(file, args, { stdio: ['ignore', 'pipe', 'pipe'] })

export interface PulseCaptureDeps {
  spawn?: SpawnRecorder
  /** The monitor's volume; without a reader the capture takes it as 100%. */
  readMonitor?: ReadMonitor
}

export function openPulseCapture(
  onUpdate: (update: SpectrumUpdate) => void,
  deps: PulseCaptureDeps = {},
): CaptureHandle {
  const spectrum = new PcmSpectrum(PAREC_RATE)
  let closed = false
  let running = false
  let muted = false
  let stderr = ''
  let stopPump = (): void => {}
  let stopMonitor = (): void => {}

  // Nothing is reported before sound flows, so a monitor that cannot open reports a failure instead.
  const report = (): void => {
    if (closed || !running) return
    onUpdate({ t: 'status', status: muted ? 'muted' : 'running', message: null })
  }

  const fail = (message: string): void => {
    if (closed) return
    closed = true
    stopPump()
    stopMonitor()
    onUpdate({ t: 'status', status: 'failed', message: message.slice(0, 300) })
  }

  const child = (deps.spawn ?? spawnRecorder)('parec', PAREC_ARGS)
  child.stdout?.on('data', (chunk: Buffer) => {
    spectrum.push(chunk)
    if (running || closed) return
    running = true
    report()
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr = (stderr + chunk.toString('utf8')).slice(-500)
  })
  child.on('error', (error: NodeJS.ErrnoException) => {
    fail(
      error.code === 'ENOENT'
        ? 'parec (pulseaudio-utils) was not found'
        : `parec could not start (${error.message})`,
    )
  })
  child.on('exit', (code, signal) => {
    const reason = stderr.trim().split('\n').at(-1) || `exit ${code ?? signal}`
    fail(`parec stopped: ${reason}`)
  })

  if (deps.readMonitor) {
    stopMonitor = watchMonitor(deps.readMonitor, (gain) => {
      if (closed) return
      spectrum.gain = gain ?? 1
      if ((gain === null) === muted) return
      muted = gain === null
      report()
    })
  }

  stopPump = pumpSpectrum(
    () => spectrum.bins(),
    (bins) => {
      // A frame tells a pane capture is running, so none go before it is, nor while muted.
      if (running && !muted && !closed) onUpdate({ t: 'frame', bins })
    },
  )

  return {
    close: () => {
      if (closed) return
      closed = true
      stopPump()
      stopMonitor()
      child.kill()
    },
  }
}

/** Reads the monitor's gain now and every MONITOR_POLL_MS, until stopped. */
function watchMonitor(read: ReadMonitor, onGain: (gain: number | null) => void): () => void {
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | null = null
  const poll = (): void => {
    void read()
      .catch(() => null)
      .then((level) => {
        if (stopped) return
        onGain(monitorGain(level))
        timer = setTimeout(poll, MONITOR_POLL_MS)
      })
  }
  poll()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
  }
}
