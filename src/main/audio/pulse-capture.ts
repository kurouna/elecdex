import { type ChildProcess, spawn } from 'node:child_process'
import { pumpSpectrum, type SpectrumUpdate } from '@shared/audio'
import { PcmSpectrum } from './pcm-spectrum.js'
import type { CaptureHandle } from './spectrum-capture.js'

/**
 * The spectrum's capture on Linux, where Electron has no loopback audio.
 *
 * parec (pulseaudio-utils; PulseAudio and PipeWire's pulse server both serve it)
 * records the monitor of the default output - what the computer plays - as 16-bit
 * mono, and main turns it into the panes' bins as the capture page does. The
 * device is always `@DEFAULT_MONITOR@`: without it parec would record the default
 * input, a microphone. No sound is kept; only the levels leave this module.
 *
 * The recorder runs only while a spectrum pane is showing (SpectrumCapture) and
 * is killed with the last one. Spawning is injected so the lifecycle is tested.
 */

export const PAREC_RATE = 48_000

export const PAREC_ARGS = [
  '--device=@DEFAULT_MONITOR@',
  '--raw',
  '--format=s16le',
  `--rate=${PAREC_RATE}`,
  '--channels=1',
  // Small blocks so the bars follow the sound; the server's default is far larger.
  '--latency-msec=40',
  '--client-name=elecdex',
  '--stream-name=spectrum',
]

export type SpawnRecorder = (file: string, args: string[]) => ChildProcess

const spawnRecorder: SpawnRecorder = (file, args) =>
  spawn(file, args, { stdio: ['ignore', 'pipe', 'pipe'] })

export function openPulseCapture(
  onUpdate: (update: SpectrumUpdate) => void,
  spawnFn: SpawnRecorder = spawnRecorder,
): CaptureHandle {
  const spectrum = new PcmSpectrum(PAREC_RATE)
  let closed = false
  let running = false
  let stderr = ''
  let stopPump = (): void => {}

  const fail = (message: string): void => {
    if (closed) return
    closed = true
    stopPump()
    onUpdate({ t: 'status', status: 'failed', message: message.slice(0, 300) })
  }

  const child = spawnFn('parec', PAREC_ARGS)
  child.stdout?.on('data', (chunk: Buffer) => {
    spectrum.push(chunk)
    if (running || closed) return
    // Running once sound flows, so a monitor that cannot open reports a failure instead.
    running = true
    onUpdate({ t: 'status', status: 'running', message: null })
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

  stopPump = pumpSpectrum(
    () => spectrum.bins(),
    (bins) => {
      // A frame tells a pane capture is running, so none go before it is.
      if (running && !closed) onUpdate({ t: 'frame', bins })
    },
  )

  return {
    close: () => {
      if (closed) return
      closed = true
      stopPump()
      child.kill()
    },
  }
}
