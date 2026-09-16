import type { MixerChannel, MixerPeaks, MixerState } from '@shared/audio'
import { z } from 'zod'

/**
 * What each platform's mixer tools print, read into MixerState. Pure: every
 * format here is unit-tested against real output.
 */

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const ChannelSchema = z.object({
  id: z.string().min(1).max(1024),
  name: z.string().max(200),
  volume: z.number(),
  muted: z.boolean(),
})

const WindowsLineSchema = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('state'),
    device: z.string().max(200).nullable(),
    master: ChannelSchema.nullable(),
    apps: z.array(ChannelSchema).max(100),
  }),
  z.object({ t: z.literal('peaks'), p: z.record(z.string().max(1024), z.number()) }),
  z.object({ t: z.literal('error'), message: z.string().max(500) }),
])

export type BackendLine =
  | { t: 'state'; state: MixerState }
  | { t: 'peaks'; peaks: MixerPeaks }
  | { t: 'error'; message: string }

const channel = (c: z.infer<typeof ChannelSchema>): MixerChannel => ({
  id: c.id,
  name: c.name.trim() || c.id,
  volume: clamp01(c.volume),
  muted: c.muted,
})

/** A line from the Windows mixer loop (mixer-windows.ts), or null for anything else. */
export function parseWindowsLine(line: string): BackendLine | null {
  let raw: unknown
  try {
    raw = JSON.parse(line)
  } catch {
    return null
  }
  const parsed = WindowsLineSchema.safeParse(raw)
  if (!parsed.success) return null
  const data = parsed.data
  if (data.t === 'error') return data
  if (data.t === 'peaks') {
    return {
      t: 'peaks',
      peaks: Object.fromEntries(Object.entries(data.p).map(([id, v]) => [id, clamp01(v)])),
    }
  }
  return {
    t: 'state',
    state: {
      support: 'full',
      device: data.device,
      master: data.master ? channel(data.master) : null,
      apps: data.apps.map(channel),
      error: null,
    },
  }
}

/**
 * macOS: `osascript -e 'get volume settings'` prints
 * "output volume:54, input volume:75, alert volume:100, output muted:false".
 * An output with no volume control reads "missing value".
 */
export function parseMacVolume(text: string): MixerChannel | null {
  const volume = /output volume:(\d+)/.exec(text)?.[1]
  const muted = /output muted:(true|false)/.exec(text)?.[1]
  if (volume === undefined) return null
  return {
    id: 'master',
    name: 'Master',
    volume: clamp01(Number(volume) / 100),
    muted: muted === 'true',
  }
}

/** Linux: `wpctl get-volume @DEFAULT_AUDIO_SINK@` prints "Volume: 0.54" or "Volume: 0.54 [MUTED]". */
export function parseWpctlVolume(text: string): MixerChannel | null {
  const match = /Volume:\s*([\d.]+)(\s*\[MUTED\])?/.exec(text)
  if (!match?.[1]) return null
  return {
    id: 'master',
    name: 'Master',
    volume: clamp01(Number(match[1])),
    muted: match[2] !== undefined,
  }
}

const SinkInputSchema = z.object({
  index: z.number().int().nonnegative(),
  mute: z.boolean(),
  volume: z.record(z.string(), z.object({ value: z.number() })),
  properties: z.record(z.string(), z.unknown()),
})

/** Linux: the apps playing, from `pactl -f json list sink-inputs`. */
export function parsePactlSinkInputs(text: string): MixerChannel[] {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    const parsed = SinkInputSchema.safeParse(entry)
    if (!parsed.success) return []
    const { index, mute, volume, properties } = parsed.data
    const name = [properties['application.name'], properties['application.process.binary']].find(
      (v): v is string => typeof v === 'string' && v.trim() !== '',
    )
    return [
      {
        id: `sink-input:${index}`,
        name: name ?? `stream ${index}`,
        volume: averageVolume(volume),
        muted: mute,
      },
    ]
  })
}

const SinkSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  mute: z.boolean(),
  volume: z.record(z.string(), z.object({ value: z.number() })),
})

/**
 * Linux: the default output, from `pactl -f json list sinks` and the name
 * `pactl get-default-sink` printed. Null when that sink is not in the list.
 */
export function parsePactlDefaultSink(
  text: string,
  defaultName: string,
): { device: string; master: MixerChannel } | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (!Array.isArray(raw)) return null
  for (const entry of raw) {
    const parsed = SinkSchema.safeParse(entry)
    if (!parsed.success || parsed.data.name !== defaultName.trim()) continue
    const { name, description, mute, volume } = parsed.data
    return {
      device: description?.trim() || name,
      master: { id: 'master', name: 'Master', volume: averageVolume(volume), muted: mute },
    }
  }
  return null
}

/** PulseAudio's channel volumes as one level; its 100% is 65536. */
function averageVolume(volume: Record<string, { value: number }>): number {
  const values = Object.values(volume).map((v) => v.value)
  const average = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length
  return clamp01(average / 65536)
}
