import { type Band, readForm } from './arrange'
import { keyOfChar } from './keyboard'

/**
 * How a song is written down: the melody as the keys that play it, one character per step,
 * so a line of a song reads as what the player will type.
 *
 *   'h.k.;-lk|h--.fghk'
 *
 * Each character is one step of the grid (an eighth or a sixteenth): a key character starts
 * a note on that key (keyboard.ts), '-' holds the note before it one step longer, '.' is a
 * rest. '|' ends a bar and spaces are ignored. Chords are written one bar at a time, two
 * to a bar when a bar changes half way ('F C7'). The band is written for each song too
 * (arrange.ts): its sections, and the one each bar plays.
 */

export interface TempoPoint {
  /** The bar it starts at, from 0. */
  bar: number
  bpm: number
  /** Change steadily from here to the next point, rather than at once. */
  ramp?: boolean
}

export interface SongSource {
  id: string
  title: string
  /** Who wrote it: shown on the menu and the result. */
  credit: string
  /** What kind of track it is (HOUSE, J-POP, CHIPTUNE): a word on the menu, to pick by. */
  style: string
  tempo: readonly TempoPoint[]
  /** Melody steps per beat: 2 for eighths, 4 for sixteenths. */
  grid: 2 | 4
  melody: readonly string[]
  chords: readonly string[]
  band: Band
}

export const BEATS_PER_BAR = 4

export interface MelodyNote {
  code: string
  pitch: number
  /** Where it starts, in beats from the start of the song. */
  beat: number
  beats: number
  /** Whether it starts on a beat (EASY plays only these). */
  onBeat: boolean
}

/** Beats to milliseconds and back, through tempo changes. */
export interface Clock {
  /** Milliseconds from the start of the song to a beat; negative beats (the count-in) too. */
  time(beat: number): number
  bpm(beat: number): number
}

export interface Score {
  source: SongSource
  bars: number
  notes: MelodyNote[]
  /** Chord symbols, by bar. */
  chords: string[][]
  clock: Clock
  /** Anything that does not add up: a song with problems is not offered. */
  problems: string[]
}

const bars = (lines: readonly string[]): string[] =>
  lines
    .join('|')
    .replace(/\s+/g, ' ')
    .split('|')
    .map((b) => b.trim())
    .filter((b) => b !== '')

/** The melody's notes, and what is wrong with it. */
export function parseMelody(
  lines: readonly string[],
  grid: number,
): { bars: number; notes: MelodyNote[]; problems: string[] } {
  const written = bars(lines).map((b) => b.replace(/ /g, ''))
  const steps = BEATS_PER_BAR * grid
  const notes: MelodyNote[] = []
  const problems: string[] = []
  let current: MelodyNote | null = null
  written.forEach((bar, b) => {
    if (bar.length !== steps) problems.push(`bar ${b + 1} has ${bar.length} steps, not ${steps}`)
    for (const [s, char] of [...bar].entries()) {
      const beat = (b * steps + s) / grid
      current = step(char, current, { beat, grid, bar: b, notes, problems })
    }
  })
  return { bars: written.length, notes, problems }
}

interface Step {
  beat: number
  grid: number
  bar: number
  notes: MelodyNote[]
  problems: string[]
}

/** One character of the melody: answers the note still sounding after it, if any. */
function step(char: string, current: MelodyNote | null, at: Step): MelodyNote | null {
  if (char === '.') return null
  if (char !== '-') return startNote(char, at.beat, at.grid, at.notes, at.problems, at.bar)
  if (current === null) at.problems.push(`bar ${at.bar + 1} holds a rest`)
  else current.beats += 1 / at.grid
  return current
}

function startNote(
  char: string,
  beat: number,
  grid: number,
  notes: MelodyNote[],
  problems: string[],
  bar: number,
): MelodyNote | null {
  const key = keyOfChar(char)
  if (key?.pitch == null) {
    problems.push(`bar ${bar + 1}: "${char}" is not a key that plays`)
    return null
  }
  const note = { code: key.code, pitch: key.pitch, beat, beats: 1 / grid, onBeat: beat % 1 === 0 }
  notes.push(note)
  return note
}

/** The chord symbols of each bar. */
export function parseChords(lines: readonly string[]): string[][] {
  return bars(lines).map((b) => b.split(' ').filter((c) => c !== ''))
}

/**
 * A clock through the tempo points. Each beat runs at the tempo of its middle, which on a
 * ramp is as close to the steady change as anyone can hear.
 */
export function makeClock(points: readonly TempoPoint[], totalBeats: number): Clock {
  const sorted = [...points].sort((a, b) => a.bar - b.bar)
  const bpm = (beat: number): number => {
    const bar = beat / BEATS_PER_BAR
    let index = 0
    while (index + 1 < sorted.length && (sorted[index + 1]?.bar ?? 0) <= bar) index += 1
    const here = sorted[index] ?? { bar: 0, bpm: 120 }
    const next = sorted[index + 1]
    if (!here.ramp || next === undefined) return here.bpm
    return here.bpm + ((next.bpm - here.bpm) * (bar - here.bar)) / (next.bar - here.bar)
  }
  const span = Math.max(0, Math.ceil(totalBeats)) + 16
  const starts = [0]
  for (let b = 0; b < span; b++) starts.push((starts[b] ?? 0) + 60_000 / bpm(b + 0.5))
  return {
    bpm,
    time(beat) {
      if (beat < 0) return (beat * 60_000) / bpm(0)
      const b = Math.min(Math.floor(beat), span - 1)
      return (starts[b] ?? 0) + ((beat - b) * 60_000) / bpm(b + 0.5)
    },
  }
}

/** A song read whole, with everything that does not add up in `problems`. */
export function readSong(source: SongSource): Score {
  const melody = parseMelody(source.melody, source.grid)
  const chords = parseChords(source.chords)
  const form = readForm(source.band)
  const problems = [...melody.problems, ...form.problems]
  if (chords.length !== melody.bars) {
    problems.push(`${chords.length} bars of chords for ${melody.bars} of melody`)
  }
  if (form.bars.length !== melody.bars) {
    problems.push(`${form.bars.length} bars of band for ${melody.bars} of melody`)
  }
  return {
    source,
    bars: melody.bars,
    notes: melody.notes,
    chords,
    clock: makeClock(source.tempo, melody.bars * BEATS_PER_BAR),
    problems,
  }
}
