import type { SongSource } from '../notation'

/**
 * IN THE HALL OF THE MOUNTAIN KING - Edvard Grieg (1843-1907), from Peer Gynt (1875). In the
 * public domain; this arrangement is elecdex's own, made from the tune itself, and is
 * GPL-3.0 as the rest of this repository.
 *
 * In C minor: the tune, then the same a fifth higher, four times over while the tempo climbs
 * from 96 to 176 - the piece's own acceleration, which is what makes it a game. Where the
 * higher statement leaps to a G above the keyboard, it reaches for the F below instead.
 */

const INTRO = '........|........'

const STATEMENT = ['asefgeg-|tst-fwf-|asefgegk|ugegu---', "ghuklul-|oho-kyk-|ghuklul'|'lul'---"]

const ENDING = 'k-k-k-k-|a-------'

const STATEMENT_CHORDS = 'Cm | D7 Db | Cm | Eb | Gm | A7 Ab | Gm | Bb'

export const song: SongSource = {
  id: 'mountain-king',
  title: 'MOUNTAIN KING',
  credit: 'E. Grieg, arr. elecdex',
  tempo: [
    { bar: 0, bpm: 96, ramp: true },
    { bar: 34, bpm: 176 },
  ],
  grid: 2,
  melody: [INTRO, ...STATEMENT, ...STATEMENT, ...STATEMENT, ...STATEMENT, ENDING],
  chords: [
    'Cm | Cm',
    STATEMENT_CHORDS,
    STATEMENT_CHORDS,
    STATEMENT_CHORDS,
    STATEMENT_CHORDS,
    'Cm | Cm',
  ],
  energy: '11 11111111 22222222 33333333 33333333 33',
  style: 'dark',
}
