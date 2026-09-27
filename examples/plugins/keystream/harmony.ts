/**
 * Chord symbols, as the songs write them: a root, a quality and an optional bass
 * ('Am', 'C7', 'Bbmaj7', 'D7/C'), turned into the notes the band plays.
 */

export interface Chord {
  /** Pitch class of the root, 0 (C) to 11. */
  root: number
  /** Intervals above the root, in semitones. */
  tones: readonly number[]
  /** Pitch class the bass plays: the root, or the note after a slash. */
  bass: number
}

const LETTERS: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const QUALITIES: Readonly<Record<string, readonly number[]>> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  '5': [0, 7],
}

const SYMBOL = /^([A-G])([#b]?)(maj7|m7|sus4|dim|aug|m|7|5)?(?:\/([A-G])([#b]?))?$/

const pitchClass = (letter: string, accidental: string | undefined): number =>
  ((LETTERS[letter] ?? 0) + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0) + 12) % 12

/** A chord symbol read, or null when it is not one. */
export function parseChord(symbol: string): Chord | null {
  const match = SYMBOL.exec(symbol)
  if (match === null) return null
  const [, letter = 'C', accidental, quality = '', bassLetter, bassAccidental] = match
  const root = pitchClass(letter, accidental)
  return {
    root,
    tones: QUALITIES[quality] ?? [0, 4, 7],
    bass: bassLetter === undefined ? root : pitchClass(bassLetter, bassAccidental),
  }
}

/** The lowest MIDI note of a pitch class at or above `low`. */
export const lift = (pitchClass: number, low: number): number =>
  low + ((((pitchClass - low) % 12) + 12) % 12)

/** The chord's notes, each placed in the octave from `low` up, lowest first. */
export function voicing(chord: Chord, low: number): number[] {
  return chord.tones.map((t) => lift((chord.root + t) % 12, low)).sort((a, b) => a - b)
}
