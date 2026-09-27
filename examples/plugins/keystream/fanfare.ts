import type { Note } from '../elecdex-plugin'
import type { Rank } from './judge'

/**
 * What the result sounds as the rank lands: a kick and a cymbal, and a chord run upwards -
 * brighter and longer the better the rank, a minor one for a C and a diminished one for a D
 * - and two high blips when the score is a new record. Times are on the view's clock.
 */

const CHORDS: Readonly<Record<Rank, readonly number[]>> = {
  S: [60, 64, 67, 71, 74, 79],
  A: [60, 64, 67, 72],
  B: [60, 64, 67],
  C: [57, 60, 64],
  D: [57, 60, 63],
}

export function fanfare(
  rank: Rank,
  newRecord: boolean,
  when: { rank: number; record: number },
  volume: number,
): Note[] {
  const notes: Note[] = [
    { voice: 'kick', at: when.rank, level: 0.9 * volume },
    { voice: 'crash', at: when.rank, level: (rank === 'D' ? 0.2 : 0.45) * volume },
  ]
  CHORDS[rank].forEach((pitch, i) => {
    notes.push({ voice: 'pluck', pitch, at: when.rank + i * 40, length: 900, level: 0.5 * volume })
  })
  if (newRecord) {
    notes.push(
      { voice: 'chip', pitch: 84, at: when.record, length: 90, level: 0.3 * volume },
      { voice: 'chip', pitch: 91, at: when.record + 100, length: 160, level: 0.3 * volume },
    )
  }
  return notes
}
