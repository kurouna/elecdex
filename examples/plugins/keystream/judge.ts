import type { Level } from './chart'

/**
 * Judgement, in the link's words: a note typed on time is in SYNC, a little off it is a
 * LOCK, further off still an ACK, and one never typed is a DROP. The windows are how far
 * from the note, either way, a key may land; HARD holds them to three quarters.
 */

export type Grade = 'SYNC' | 'LOCK' | 'ACK' | 'DROP'
export const GRADES: readonly Grade[] = ['SYNC', 'LOCK', 'ACK', 'DROP']

const WINDOWS = { SYNC: 40, LOCK: 80, ACK: 120 } as const
const WEIGHT: Readonly<Record<Grade, number>> = { SYNC: 1, LOCK: 0.75, ACK: 0.4, DROP: 0 }
/** What each grade does to the signal gauge; HARD drops harder. */
const SIGNAL: Readonly<Record<Grade, number>> = {
  SYNC: 0.012,
  LOCK: 0.008,
  ACK: 0.002,
  DROP: -0.05,
}
const HARD_DROP = -0.09
/** Where the signal gauge starts a play. */
export const SIGNAL_START = 0.6
/**
 * HARD only: the signal at which the link is lost. The play ends there (Session.over), and
 * the result says NO CARRIER; on EASY and NORMAL the gauge only shows how it goes.
 */
export const SIGNAL_LOST = 0

/** How far from its note a key still counts, in milliseconds, at a level. */
export function windowOf(level: Level, grade: Exclude<Grade, 'DROP'> = 'ACK'): number {
  return WINDOWS[grade] * (level === 'hard' ? 0.75 : 1)
}

/** The grade of a key `delta` milliseconds from its note, or null when outside every window. */
export function gradeOf(delta: number, level: Level): Exclude<Grade, 'DROP'> | null {
  const off = Math.abs(delta)
  if (off <= windowOf(level, 'SYNC')) return 'SYNC'
  if (off <= windowOf(level, 'LOCK')) return 'LOCK'
  if (off <= windowOf(level, 'ACK')) return 'ACK'
  return null
}

export interface Tally {
  level: Level
  /** The player's notes in the song. */
  total: number
  counts: Record<Grade, number>
  /** Keys that matched no note: counted, never punished. */
  stray: number
  chain: number
  maxChain: number
  points: number
  /** The gauge, 0 to 1. */
  signal: number
  /** HARD only: the signal ran out. */
  failed: boolean
  /** How early (negative) or late each hit was. */
  deltas: number[]
}

export function newTally(level: Level, total: number): Tally {
  return {
    level,
    total,
    counts: { SYNC: 0, LOCK: 0, ACK: 0, DROP: 0 },
    stray: 0,
    chain: 0,
    maxChain: 0,
    points: 0,
    signal: SIGNAL_START,
    failed: false,
    deltas: [],
  }
}

/** The tally with one more note judged. */
export function record(tally: Tally, grade: Grade, delta: number | null): Tally {
  const chain = grade === 'DROP' ? 0 : tally.chain + 1
  const change = grade === 'DROP' && tally.level === 'hard' ? HARD_DROP : SIGNAL[grade]
  const signal = Math.min(1, Math.max(0, tally.signal + change))
  return {
    ...tally,
    counts: { ...tally.counts, [grade]: tally.counts[grade] + 1 },
    chain,
    maxChain: Math.max(tally.maxChain, chain),
    points: tally.points + WEIGHT[grade],
    signal,
    failed: tally.failed || (tally.level === 'hard' && signal <= SIGNAL_LOST),
    deltas: delta === null ? tally.deltas : [...tally.deltas, delta],
  }
}

export const judged = (tally: Tally): number =>
  tally.counts.SYNC + tally.counts.LOCK + tally.counts.ACK + tally.counts.DROP

/** Out of 1,000,000, over every note of the song. */
export const scoreOf = (tally: Tally): number =>
  tally.total === 0 ? 0 : Math.round((tally.points / tally.total) * 1_000_000)

/** Per cent, over the notes judged so far. */
export function accuracyOf(tally: Tally): number {
  const done = judged(tally)
  return done === 0 ? 100 : (tally.points / done) * 100
}

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'

export function rankOf(score: number): Rank {
  if (score >= 950_000) return 'S'
  if (score >= 900_000) return 'A'
  if (score >= 800_000) return 'B'
  if (score >= 700_000) return 'C'
  return 'D'
}

/** The mean of the hits' timing, milliseconds: negative is early. */
export const meanDelta = (tally: Tally): number =>
  tally.deltas.length === 0 ? 0 : tally.deltas.reduce((a, b) => a + b, 0) / tally.deltas.length

/** The setting's step and reach, as the descriptor declares them (index.ts). */
export const OFFSET_STEP = 5
export const OFFSET_LIMIT = 150
/** Fewer hits than this say nothing about a player's lag. */
const OFFSET_HITS = 10

/**
 * The timing offset a play says the player should set: the one they played at, plus how
 * late their hits ran on average, on the setting's step - or null when a play was too short
 * to tell, or already had it right. The deltas are measured with the offset taken off, so
 * the mean is what is still left over.
 */
export function suggestedOffset(tally: Tally, offset: number): number | null {
  if (tally.deltas.length < OFFSET_HITS) return null
  const raw = Math.round((offset + meanDelta(tally)) / OFFSET_STEP) * OFFSET_STEP
  const suggested = Math.min(OFFSET_LIMIT, Math.max(-OFFSET_LIMIT, raw))
  return suggested === offset ? null : suggested
}

/**
 * How a play ended, as the result's lamp says it: the link lost (HARD only), every note in
 * SYNC, none dropped, or simply played out.
 */
export type Lamp = 'NO CARRIER' | 'ALL SYNC' | 'FULL CHAIN' | 'CLEAR'

export function lampOf(tally: Tally): Lamp {
  if (tally.failed) return 'NO CARRIER'
  if (tally.total > 0 && tally.counts.SYNC === tally.total) return 'ALL SYNC'
  if (tally.total > 0 && tally.counts.DROP === 0) return 'FULL CHAIN'
  return 'CLEAR'
}

/** The hits outside SYNC, early and late: which way the player leans. */
export function fastSlow(tally: Tally): { fast: number; slow: number } {
  const edge = windowOf(tally.level, 'SYNC')
  let fast = 0
  let slow = 0
  for (const d of tally.deltas) {
    if (d < -edge) fast += 1
    else if (d > edge) slow += 1
  }
  return { fast, slow }
}
