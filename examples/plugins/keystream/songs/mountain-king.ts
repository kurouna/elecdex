import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_4,
  BASS_8,
  BASS_LAST,
  BASS_OCTAVES,
  COMP_LAST,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_4_SOFT,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

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

/**
 * A pizzicato bass on every beat from the first bar, as in the piece, and the drums coming in
 * a statement at a time while the tempo climbs; four hits and a last chord to end.
 */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4_SOFT, bass: BASS_4 },
    S1: { kick: KICK_4_SOFT, bass: BASS_4, comp: '....o.......o...' },
    S2: { kick: KICK_4, snare: SNARE_24, hat: EIGHTHS_SOFT, bass: BASS_4, comp: COMP_OFFBEATS },
    S3: {
      kick: KICK_4,
      snare: SNARE_24,
      hat: EIGHTHS,
      bass: BASS_8,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    S4: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    H: { kick: KICK_4, snare: KICK_4, bass: BASS_4, comp: 'x...x...x...x...' },
    Z: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
  },
  form: `I I | ${times('S1', 7)} S1! | S2* ${times('S2', 6)} S2! | S3* ${times('S3', 6)} S3! | S4* ${times('S4', 6)} S4! | H* Z*`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'mountain-king',
  title: 'MOUNTAIN KING',
  credit: 'E. Grieg, arr. elecdex',
  style: 'ROCK',
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
  band: BAND,
}
