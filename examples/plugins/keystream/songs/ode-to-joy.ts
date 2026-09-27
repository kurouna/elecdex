import type { SongSource } from '../notation'

/**
 * ODE TO JOY - Ludwig van Beethoven (1770-1827), the finale of the Ninth Symphony (1824).
 * In the public domain; this arrangement is elecdex's own, made from the tune itself, and
 * is GPL-3.0 as the rest of this repository.
 *
 * The first track to learn on: the tune in F major, in quarters, over a house groove. Set in
 * F so its one low note, at the end of the third line, is the keyboard's lowest (A, middle C).
 */

const INTRO = '........|........|........|........'

const THEME = [
  'h-h-u-k-|k-u-h-g-|f-f-g-h-|h--gg---',
  'h-h-u-k-|k-u-h-g-|f-f-g-h-|g--ff---',
  'g-g-h-f-|g-huh-f-|g-huh-g-|f-g-a---',
  'h-h-u-k-|k-u-h-g-|f-f-g-h-|g--ff---',
]

const OUTRO = 'f-------|........'

const THEME_CHORDS = 'F | C | F | F C | F | C | F | C F | C7 | C F | C F | F C | F | C | F | C F'

export const song: SongSource = {
  id: 'ode-to-joy',
  title: 'ODE TO JOY',
  credit: 'L. v. Beethoven, arr. elecdex',
  tempo: [{ bar: 0, bpm: 124 }],
  grid: 2,
  melody: [INTRO, ...THEME, ...THEME, OUTRO],
  chords: ['F | C | F | C', THEME_CHORDS, THEME_CHORDS, 'F | F'],
  energy: '1122 2222222222222222 3333333333333333 31',
  style: 'house',
}
