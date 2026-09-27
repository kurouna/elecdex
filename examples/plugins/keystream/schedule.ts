import type { Note, Voice } from '../elecdex-plugin'
import { type Chart, firstAt } from './chart'

/**
 * What the game plays itself - the band, EASY's share of the melody, the guide - handed to
 * the host a few seconds ahead of when it is heard rather than a whole song at once. A long
 * or dense song then never meets the host's limits (notes a pane may have waiting, how far
 * ahead one may be), a resume sends only what comes next, and each window is small.
 */

/** How far ahead of the song the notes are sent, and how low that may run before more go. */
export const AHEAD_MS = 5000
export const REFILL_MS = 3000

export interface Sending {
  lead: Voice
  volume: number
  guide: boolean
  /** When, on the view's clock, a song time is heard. */
  heardAt: (songTime: number) => number
}

function* between<T extends { time: number }>(list: readonly T[], from: number, to: number) {
  for (let i = firstAt(list, from); i < list.length; i++) {
    const item = list[i] as T
    if (item.time >= to) return
    yield item
  }
}

/** The notes heard from song time `from` up to, not including, `to`. */
export function notesBetween(chart: Chart, from: number, to: number, how: Sending): Note[] {
  const notes: Note[] = []
  for (const cue of between(chart.band, from, to)) {
    notes.push({
      voice: cue.voice,
      pitch: cue.pitch,
      at: how.heardAt(cue.time),
      ...(cue.length === null ? {} : { length: cue.length }),
      level: cue.level * how.volume,
      pan: cue.pan,
    })
  }
  const melody = (list: Chart['auto'], level: number) => {
    for (const note of between(list, from, to)) {
      notes.push({
        voice: how.lead,
        pitch: note.pitch,
        at: how.heardAt(note.time),
        length: note.length * 0.95,
        level,
      })
    }
  }
  melody(chart.auto, 0.8 * how.volume)
  if (how.guide) melody(chart.notes, 0.16 * how.volume)
  return notes
}

/**
 * Where the next window ends, when the song at `time` has come within REFILL_MS of what was
 * sent up to `sentTo`; null while enough is on its way.
 */
export function nextWindow(time: number, sentTo: number): number | null {
  return time + REFILL_MS < sentTo ? null : time + AHEAD_MS
}

/** How long a track's band runs before it goes round again: its last beat. */
export const loopLength = (chart: Chart): number => chart.beats.at(-1)?.time ?? 0

/**
 * A track's band going round and round, for FREE mode: the notes heard from `from` up to
 * `to`, in milliseconds since the loop began - the count-in left out, and no melody.
 */
export function loopBetween(
  chart: Chart,
  from: number,
  to: number,
  how: Pick<Sending, 'volume' | 'heardAt'>,
): Note[] {
  const length = loopLength(chart)
  const notes: Note[] = []
  if (length <= 0 || to <= from) return notes
  for (let cycle = Math.max(0, Math.floor(from / length)); cycle * length < to; cycle++) {
    const base = cycle * length
    for (const cue of between(chart.band, Math.max(0, from - base), Math.min(length, to - base))) {
      notes.push({
        voice: cue.voice,
        pitch: cue.pitch,
        at: how.heardAt(base + cue.time),
        ...(cue.length === null ? {} : { length: cue.length }),
        level: cue.level * how.volume,
        pan: cue.pan,
      })
    }
  }
  return notes
}
