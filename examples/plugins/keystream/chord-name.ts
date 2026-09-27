/**
 * The name of the chord under the fingers, for FREE mode: the notes held, read as a chord
 * where they make one ('C', 'Am7', 'G/B'), or null where they do not.
 */

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

/** Chord shapes, as intervals above the root, most common first. */
const SHAPES: readonly [string, readonly number[]][] = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['m7', [0, 3, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['6', [0, 4, 7, 9]],
  ['m6', [0, 3, 7, 9]],
  ['sus4', [0, 5, 7]],
  ['sus2', [0, 2, 7]],
  ['dim', [0, 3, 6]],
  ['dim7', [0, 3, 6, 9]],
  ['m7b5', [0, 3, 6, 10]],
  ['aug', [0, 4, 8]],
  ['add9', [0, 2, 4, 7]],
  ['5', [0, 7]],
]

export const pitchName = (pitchClass: number): string => NAMES[((pitchClass % 12) + 12) % 12] ?? ''

const same = (a: readonly number[], b: ReadonlySet<number>) =>
  a.length === b.size && a.every((n) => b.has(n))

/**
 * The chord the pitches make, named from the lowest note where it is the root, else as an
 * inversion over its bass ('C/E'); null for one note, or notes that make no chord here.
 */
export function chordName(pitches: readonly number[]): string | null {
  if (pitches.length < 2) return null
  const classes = new Set(pitches.map((p) => ((p % 12) + 12) % 12))
  const bass = ((Math.min(...pitches) % 12) + 12) % 12
  const roots = [bass, ...[...classes].filter((c) => c !== bass)]
  for (const root of roots) {
    const intervals = new Set([...classes].map((c) => (c - root + 12) % 12))
    const shape = SHAPES.find(([, notes]) => same(notes, intervals))
    if (shape === undefined) continue
    const name = `${pitchName(root)}${shape[0]}`
    return root === bass ? name : `${name}/${pitchName(bass)}`
  }
  return null
}
