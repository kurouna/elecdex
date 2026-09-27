import type { Voice } from './plugin-api.js'
import { isPluginKey } from './plugin-keys.js'
import { PLUGIN_LIMITS } from './plugins.js'

/**
 * Sound for plugins (docs/plugins.md section 13): the notes a worker posts, read and held to
 * their ranges before the page's synthesiser (renderer/plugins/synth.ts) plays one of them.
 * Pure, so the tests reach every rule.
 */

export const PLUGIN_VOICES = [
  'piano',
  'epiano',
  'lead',
  'chip',
  'bass',
  'pluck',
  'pad',
  'kick',
  'snare',
  'clap',
  'hat',
  'openhat',
  'crash',
  'tom',
] as const satisfies readonly Voice[]

const VOICES = new Set<string>(PLUGIN_VOICES)

/** A note as the synthesiser takes it: every field present and in range. */
export interface SoundNote {
  voice: Voice
  pitch: number
  /** When it is to be heard, in the page's performance.now() milliseconds; null for at once. */
  at: number | null
  /** Milliseconds before it is let go; null for the voice's own length. */
  length: number | null
  level: number
  pan: number
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const within = (value: unknown, lo: number, hi: number, fallback: number): number =>
  finite(value) ? Math.min(hi, Math.max(lo, value)) : fallback

/**
 * One note a worker posted, or null when it names no voice. Its `at` arrives in epoch
 * milliseconds (the worker's own clock plus its time origin) and leaves on the page's clock;
 * a note further ahead than the limit is refused rather than kept for ten minutes and more.
 */
export function readNote(raw: unknown, origin: number, now: number): SoundNote | null {
  if (typeof raw !== 'object' || raw === null) return null
  const note = raw as Record<string, unknown>
  if (typeof note.voice !== 'string' || !VOICES.has(note.voice)) return null
  const at = finite(note.at) ? note.at - origin : null
  if (at !== null && at > now + PLUGIN_LIMITS.noteAheadMs) return null
  return {
    voice: note.voice as Voice,
    pitch: within(note.pitch, 0, 127, 60),
    at,
    length: finite(note.length) ? within(note.length, 0, PLUGIN_LIMITS.noteLengthMs, 0) : null,
    level: within(note.level, 0, 1, 0.8),
    pan: within(note.pan, -1, 1, 0),
  }
}

/** The notes of one ctx.sound.play, in order of when they are heard; bad ones are dropped. */
export function readNotes(raw: readonly unknown[], origin: number, now: number): SoundNote[] {
  const notes: SoundNote[] = []
  for (const item of raw.slice(0, PLUGIN_LIMITS.notesPerCall)) {
    const note = readNote(item, origin, now)
    if (note !== null) notes.push(note)
  }
  return notes.sort((a, b) => (a.at ?? now) - (b.at ?? now))
}

/** The notes a pane's keys play, by code: only plugin keys, each note read as above. */
export function readKeymap(
  raw: Readonly<Record<string, unknown>> | null,
  origin: number,
  now: number,
): Map<string, SoundNote> {
  const map = new Map<string, SoundNote>()
  for (const [code, value] of Object.entries(raw ?? {})) {
    const note = isPluginKey(code) ? readNote(value, origin, now) : null
    if (note !== null) map.set(code, { ...note, at: null })
  }
  return map
}

export const midiToHz = (pitch: number): number => 440 * 2 ** ((pitch - 69) / 12)

/** A reading of when the output is: `contextTime` is heard at `performanceTime`. */
export interface OutputStamp {
  contextTime: number
  performanceTime: number
}

/**
 * The AudioContext time a sound must start at to be heard at `at` (page milliseconds).
 * The output's own stamp says it best, latency included; before the output has produced
 * one, the current time plus the latency it reports stands in. Never in the past.
 */
export function contextTimeFor(
  at: number | null,
  clock: { currentTime: number; now: number; latency: number; stamp: OutputStamp | null },
): number {
  const soonest = clock.currentTime + 0.002
  if (at === null) return soonest
  const stamp = clock.stamp
  const time =
    stamp !== null && stamp.performanceTime > 0
      ? stamp.contextTime + (at - stamp.performanceTime) / 1000
      : clock.currentTime + (at - clock.now) / 1000 - clock.latency
  return Math.max(soonest, time)
}
