import type { SongSource } from '../notation'

/**
 * BOOT SEQUENCE - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * The first track: a synthwave tune in A minor at an easy pace, on the home row alone - no
 * black key in it - in eighths. Verse over Am F C G, chorus over F G Em Am.
 */

const INTRO = '........|........'

const VERSE = ['h.k.;-lk|h--.fghk|g.d.g-hg|j-g-s--.', "h.k.;-lk|'-;-lkh.|g.k.;-lk|j---l---"]

const CHORUS = ["kk.kl.;.|l-j-g-..|;;.;'.;l|k--.h-..", "kk.kl.;.|'-;-l-j.|k-j-h-g-|h------."]

const OUTRO = '........|........'

export const song: SongSource = {
  id: 'boot-sequence',
  title: 'BOOT SEQUENCE',
  credit: 'elecdex',
  tempo: [{ bar: 0, bpm: 118 }],
  grid: 2,
  melody: [INTRO, ...VERSE, ...CHORUS, ...VERSE, ...CHORUS, OUTRO],
  chords: [
    'Am | F',
    'Am | F | C | G | Am | F | C | G',
    'F | G | Em | Am | F | G | F G | Am',
    'Am | F | C | G | Am | F | C | G',
    'F | G | Em | Am | F | G | F G | Am',
    'F G | Am',
  ],
  energy: '11 22222222 33333333 22222222 33333333 21',
  style: 'synthwave',
}
