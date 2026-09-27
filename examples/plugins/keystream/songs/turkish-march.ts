import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_4,
  BASS_LAST,
  BASS_OOM,
  COMP_LAST,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * TURKISH MARCH - Wolfgang Amadeus Mozart (1756-1791), the Rondo alla Turca of the Piano
 * Sonata K. 331 (1783). In the public domain; this arrangement is elecdex's own - the rondo's
 * first period as Mozart wrote it, and a middle of elecdex's own - and is GPL-3.0 as the rest
 * of this repository.
 *
 * A fifth below Mozart's A minor, in D minor, so the runs sit on the keys: C sharp (W) and
 * G sharp (Y) are the turns in them. Written in sixteenths, two of Mozart's 2/4 bars to a bar
 * here, each period starting on the four sixteenths before its first beat. A march under it:
 * the bass on the beat, the chord on the 'and'.
 */

const INTRO = '................|............dsws'

const PERIOD = "f-..gfdfh-..uhyh|;lol;lol'---l-'-|;-l-k-l-;-l-k-l-|;-l-k-j-h---dsws"
const PERIOD_END = "f-..gfdfh-..uhyh|;lol;lol'---l-'-|;-l-k-l-;-l-k-l-|;-l-k-j-h-------"

const MIDDLE = "'-;-l-k-h---k---|g-h-u-k-l---;---|'-;-l-k-l-h-f-h-|;-o-;-h-;---dsws"

const OUTRO = 'l---------------|................'

const PERIOD_CHORDS = 'Dm A | A Dm | Am | E Am'

const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: EIGHTHS_SOFT, bass: BASS_OOM },
    A: { kick: KICK_4, snare: OFFBEATS, hat: EIGHTHS, bass: BASS_OOM, comp: COMP_OFFBEATS },
    M: { kick: KICK_4, snare: SNARE_24, hat: EIGHTHS, bass: BASS_4, pad: true },
    L: {
      kick: KICK_4,
      snare: OFFBEATS,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      bass: BASS_OOM,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I! | ${times('A', 8)} | ${times('M', 3)} M! | L* ${times('L', 7)} | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'turkish-march',
  title: 'TURKISH MARCH',
  credit: 'W. A. Mozart, arr. elecdex',
  style: 'MARCH',
  genre: 'classics',
  tempo: [{ bar: 0, bpm: 116 }],
  grid: 4,
  melody: [INTRO, PERIOD, PERIOD_END, MIDDLE, PERIOD, PERIOD_END, OUTRO],
  chords: [
    'Dm | A',
    PERIOD_CHORDS,
    PERIOD_CHORDS,
    'F | C | Dm | A',
    PERIOD_CHORDS,
    PERIOD_CHORDS,
    'Dm | Dm',
  ],
  band: BAND,
}
