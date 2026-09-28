import type { Level } from './chart'

/**
 * How hard a chart is, in stars from 1 to 5, worked out from its notes rather than written
 * by hand: how many a second on average, and how many in its busiest four seconds, half and
 * half - a track that is easy but for one run is harder than its average says. HARD has
 * the notes of NORMAL and a narrower window of judgement, which the notes cannot show: it
 * is rated a star above NORMAL, at most five (`levelStars`; user decision 2026-09-28, for now
 * - to be looked at again).
 *
 * A note on the key the one before it was on counts for less than a note that sends the hand
 * somewhere else: striking one key again asks only for the timing, not for finding the key.
 * So a part written as one key tapped in time (FEVER CALL's and REDLINE's EASY) is rated by
 * what it asks rather than by its notes alone.
 */

export interface Struck {
  /** Milliseconds from the start of the song. */
  time: number
  /** The key it is struck on. */
  code: string
}

const BUSIEST_MS = 4000
/** Where each star begins, in notes a second (the mean of the average and the busiest). */
const STEPS = [2.0, 2.6, 3.3, 4.2] as const
/** What a note on the same key as the one before counts for, against a note that moves. */
export const REPEAT_WEIGHT = 0.6

/** Each note's weight: a whole note, or less for the same key again. */
function weights(notes: readonly Struck[]): number[] {
  return notes.map((note, i) => (i > 0 && notes[i - 1]?.code === note.code ? REPEAT_WEIGHT : 1))
}

/** Notes a second, the average and the busiest window's mean, a repeated key counting less. */
export function busyness(notes: readonly Struck[]): number {
  if (notes.length < 2) return 0
  const weight = weights(notes)
  const total = weight.reduce((sum, w) => sum + w, 0)
  const span = ((notes.at(-1)?.time ?? 0) - (notes[0]?.time ?? 0)) / 1000
  const average = span > 0 ? total / span : 0
  let busiest = 0
  let inWindow = 0
  let from = 0
  for (let i = 0; i < notes.length; i++) {
    inWindow += weight[i] ?? 0
    while ((notes[i]?.time ?? 0) - (notes[from]?.time ?? 0) > BUSIEST_MS) {
      inWindow -= weight[from] ?? 0
      from += 1
    }
    busiest = Math.max(busiest, inWindow)
  }
  return (average + busiest / (BUSIEST_MS / 1000)) / 2
}

/** 1 to 5, by the notes alone. */
export function starsOf(notes: readonly Struck[]): number {
  const value = busyness(notes)
  return 1 + STEPS.filter((step) => value >= step).length
}

/** A level's stars, 1 to 5: its notes', and one more on HARD for its narrower window. */
export function levelStars(notes: readonly Struck[], level: Level): number {
  return Math.min(5, starsOf(notes) + (level === 'hard' ? 1 : 0))
}
