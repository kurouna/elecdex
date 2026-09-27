import type { SongSource } from '../notation'

/**
 * NEON CIRCUIT - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * A house tune in E minor at 120, written in sixteenths for its off-beat pushes: F sharp (T)
 * belongs to the key, and the chorus turns home through a B7 on D sharp (E).
 */

const INTRO = '................|................'

const VERSE = [
  'j...j.g...j.l...|k...j.g.......d.|g...g.j...l.j...|h.....t...h.l...',
  'j...j.g...j.;...|l...k.j.......g.|j...l.;...l.j...|h.......t.h.j.l.',
]

const CHORUS = [
  ';...;.l.;...g...|h...l.;...l.h...|j...l.t...j.l...|d.......g.h.j.l.',
  ';...;.l.;...k...|l...h.l.t...h...|e...t.h...j.h...|d...............',
]

const OUTRO = 'd...............|................'

const VERSE_CHORDS = 'Em | C | G | D | Em | C | G | D'
const CHORUS_CHORDS = 'C | D | Bm | Em | C | D | B7 | Em'

export const song: SongSource = {
  id: 'neon-circuit',
  title: 'NEON CIRCUIT',
  credit: 'elecdex',
  tempo: [{ bar: 0, bpm: 120 }],
  grid: 4,
  melody: [INTRO, ...VERSE, ...CHORUS, ...VERSE, ...CHORUS, OUTRO],
  chords: ['Em | Em', VERSE_CHORDS, CHORUS_CHORDS, VERSE_CHORDS, CHORUS_CHORDS, 'Em | Em'],
  energy: '11 22222222 33333333 22222222 33333333 31',
  style: 'house',
}
