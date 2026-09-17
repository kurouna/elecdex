import type { RunTool } from './mixer-linux.js'

/**
 * The volume of the monitor the Linux spectrum records, and how to undo it.
 *
 * PulseAudio and PipeWire apply a monitor source's own volume to what it records,
 * and that volume is easy to lower by accident: where the default input is the
 * output's monitor, a desktop's "microphone" slider moves it. At 8% (-66 dB) the
 * spectrum showed nothing although the speakers played. So the capture records
 * floats, which keep a quiet signal, reads the monitor's volume and divides it
 * back out; only a muted (or 0%) monitor cannot be undone that way, and the pane
 * offers to unmute it.
 *
 * The parsers are pure and the tool runner is injected, so this is unit-tested.
 */

export const MONITOR = '@DEFAULT_MONITOR@'

/** The most the capture amplifies: 100 dB, well above any volume a slider leaves audible. */
export const MAX_MONITOR_GAIN = 100_000

export interface MonitorLevel {
  muted: boolean
  /** The loudest channel's volume as a linear amplitude factor (1 at 100%). */
  volume: number
}

/**
 * `pactl get-source-volume` as a linear amplitude factor, or null when it lists
 * no channel. Pulse volumes are cubic: 65536 is 100%, and amplitude is the cube
 * of the ratio (pa_sw_volume_to_linear), which is what the dB figure shows.
 */
export function parsePactlVolume(text: string): number | null {
  let loudest: number | null = null
  for (const match of text.matchAll(/(\d+)\s*\/\s*\d+%/g)) {
    const ratio = Number(match[1]) / 65536
    loudest = Math.max(loudest ?? 0, ratio ** 3)
  }
  return loudest
}

/** `pactl get-source-mute`: true for "Mute: yes", false for "no", null otherwise. */
export function parsePactlMute(text: string): boolean | null {
  const match = /Mute:\s*(yes|no)/i.exec(text)
  return match ? match[1]?.toLowerCase() === 'yes' : null
}

/** The monitor's mute and volume, or null when pactl cannot tell. */
export async function readMonitorLevel(run: RunTool): Promise<MonitorLevel | null> {
  const [volume, mute] = await Promise.all([
    run('pactl', ['get-source-volume', MONITOR]).then(parsePactlVolume),
    run('pactl', ['get-source-mute', MONITOR]).then(parsePactlMute),
  ]).catch(() => [null, null] as const)
  if (volume === null || mute === null) return null
  return { muted: mute, volume }
}

/**
 * The factor that undoes the monitor's volume: 1 when it is unknown, null when
 * nothing can be recovered (muted, or a volume of zero).
 */
export function monitorGain(level: MonitorLevel | null): number | null {
  if (level === null) return 1
  if (level.muted || level.volume <= 0) return null
  return Math.min(MAX_MONITOR_GAIN, 1 / level.volume)
}

/** Unmutes the monitor and sets it to 100%: only ever on the user's click. */
export async function restoreMonitor(run: RunTool): Promise<void> {
  await run('pactl', ['set-source-mute', MONITOR, '0'])
  await run('pactl', ['set-source-volume', MONITOR, '100%'])
}
