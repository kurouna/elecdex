import type { Voice } from '../elecdex-plugin'
import { arrange } from './arrange'
import { BEATS_PER_BAR } from './meter'
import type { Clock, Score, SongSource } from './notation'

/**
 * A song made playable at a level: the notes the player types, in milliseconds from the
 * start of the song, and everything the game plays around them.
 *
 * EASY gives the player only the notes that fall on a beat and plays the rest itself, so the
 * melody is always whole; NORMAL and HARD give every note of it (HARD judges tighter).
 */

export type Level = 'easy' | 'normal' | 'hard'
export const LEVELS: readonly Level[] = ['easy', 'normal', 'hard']

export interface PlayNote {
  id: number
  code: string
  pitch: number
  /** Milliseconds from the start of the song. */
  time: number
  length: number
}

/** Something the game plays itself. */
export interface Cue {
  voice: Voice
  pitch: number
  time: number
  /** Null for the voice's own length. */
  length: number | null
  level: number
  pan: number
}

export interface Chart {
  song: SongSource
  level: Level
  /** The player's notes, in order. */
  notes: PlayNote[]
  /** The melody the game plays for the player (EASY), in order. */
  auto: PlayNote[]
  /** The band, and the count-in before the song, in order. */
  band: Cue[]
  /** Every beat from the count-in to the end, for the lines across the field. */
  beats: { time: number; bar: boolean }[]
  /** How many bars the song has. */
  bars: number
  /** The song time a play begins at: a moment's silence, then the count-in. */
  start: number
  /** When the last note has sounded out. */
  duration: number
  clock: Clock
  /** The tempo at the start and the end, for the menu. */
  bpm: { from: number; to: number }
  /** How long a key's note sounds (the host plays it the moment the key goes down). */
  keyLength: number
}

export const COUNT_IN_BEATS = 4
/** The silence before the count-in, so its first click is not the first thing heard. */
const LEAD_IN_MS = 120

/** The first index whose time is at or after `time`: the list must be in order. */
export function firstAt(list: readonly { time: number }[], time: number): number {
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((list[mid]?.time ?? 0) < time) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** The player's first notes, bar by bar, as key codes: the first `count` bars that have any. */
export function openingBars(chart: Chart, count: number): string[][] {
  const bars = chart.beats.filter((b) => b.bar && b.time >= 0).map((b) => b.time)
  const groups = new Map<number, string[]>()
  for (const note of chart.notes) {
    let bar = 0
    while (bar + 1 < bars.length && (bars[bar + 1] ?? 0) <= note.time) bar += 1
    if (!groups.has(bar) && groups.size === count) break
    groups.set(bar, [...(groups.get(bar) ?? []), note.code])
  }
  return [...groups.values()]
}

/**
 * The band is the same at every level, and arranging it is the cost of building a chart:
 * arranged once per song, and shared by its charts.
 */
const BANDS = new WeakMap<Score, Cue[]>()

function bandOf(score: Score): Cue[] {
  let band = BANDS.get(score)
  if (band === undefined) {
    band = [...countIn(score.clock), ...arrange(score).map((p) => cue(p, score.clock))]
    band.sort((a, b) => a.time - b.time)
    BANDS.set(score, band)
  }
  return band
}

export function buildChart(score: Score, level: Level): Chart {
  const { clock } = score
  const at = (beat: number) => clock.time(beat)
  const player: PlayNote[] = []
  const auto: PlayNote[] = []
  score.notes.forEach((note, id) => {
    const played = {
      id,
      code: note.code,
      pitch: note.pitch,
      time: at(note.beat),
      length: at(note.beat + note.beats) - at(note.beat),
    }
    if (level !== 'easy' || note.onBeat) player.push(played)
    else auto.push(played)
  })
  const beatsInSong = score.bars * BEATS_PER_BAR
  const beats = []
  for (let b = -COUNT_IN_BEATS; b <= beatsInSong; b++) {
    beats.push({ time: at(b), bar: b % BEATS_PER_BAR === 0 })
  }
  const lastNote = Math.max(0, ...score.notes.map((n) => at(n.beat + n.beats)))
  return {
    song: score.source,
    level,
    notes: player,
    auto,
    band: bandOf(score),
    beats,
    bars: score.bars,
    start: at(-COUNT_IN_BEATS) - LEAD_IN_MS,
    duration: Math.max(at(beatsInSong), lastNote) + 600,
    clock,
    bpm: { from: Math.round(clock.bpm(0.5)), to: Math.round(clock.bpm(beatsInSong - 0.5)) },
    keyLength: Math.min(800, Math.max(260, (60_000 / clock.bpm(0.5)) * 1.1)),
  }
}

function cue(
  part: {
    voice: Voice
    pitch: number
    beat: number
    beats: number | null
    level: number
    pan: number
  },
  clock: Clock,
): Cue {
  const time = clock.time(part.beat)
  return {
    voice: part.voice,
    pitch: part.pitch,
    time,
    length: part.beats === null ? null : clock.time(part.beat + part.beats) - time,
    level: part.level,
    pan: part.pan,
  }
}

/** A bar of counts before the song: a kick and a click on every beat, the first the loudest. */
function countIn(clock: Clock): Cue[] {
  const cues: Cue[] = []
  for (let b = -COUNT_IN_BEATS; b < 0; b++) {
    const time = clock.time(b)
    const first = b === -COUNT_IN_BEATS
    cues.push({ voice: 'hat', pitch: 60, time, length: null, level: 0.9, pan: 0 })
    cues.push({ voice: 'kick', pitch: 60, time, length: null, level: first ? 0.7 : 0.45, pan: 0 })
  }
  return cues
}
