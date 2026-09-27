import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_LAST,
  BASS_LONG,
  BASS_OCTAVES,
  COMP_LAST,
  COMP_OFFBEATS,
  COMP_PUSH,
  KICK_4,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * AFTERGLOW - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * Disco house at 124 in E minor and G: the octave bass that never stops, claps on two and
 * four, open hats on every 'and'. The verse walks up and down the home row; the chorus sits
 * a little higher, with F sharp (T) where the verse turns home.
 */

const INTRO = '........|........|........|........'

const VERSE = ['d-g-h-j-|k-j-h-g-|g-h-j-l-|h-------', 'd-g-h-j-|k-j-h-g-|j-h-g-t-|h---s---']

const CHORUS = ['l-l-;-l-|k-j-h---|j-j-k-j-|h-g-d---', 'l-l-;-l-|k-l-;-l-|j-k-l-j-|d-------']

const BREAK = 'l-------|........|j-------|........'

const OUTRO = 'g-------|........'

const VERSE_CHORDS = 'Em | C | G | D | Em | C | G | D'
const CHORUS_CHORDS = 'G | Am | Em | C | G | Am | G | Em'

const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_OCTAVES },
    V: { kick: KICK_4, clap: SNARE_24, hat: OFFBEATS, bass: BASS_OCTAVES, comp: COMP_OFFBEATS },
    C: {
      kick: KICK_4,
      clap: SNARE_24,
      snare: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_PUSH,
      pad: true,
    },
    K: { kick: KICK_4, hat: OFFBEATS, bass: BASS_LONG, pad: true },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | C* ${times('C', 7)} | K* K K K! | ${times('V', 7)} V! | C* ${times('C', 7)} | O* E`,
}

export const song: SongSource = {
  id: 'afterglow',
  title: 'AFTERGLOW',
  credit: 'elecdex',
  style: 'DISCO HOUSE',
  tempo: [{ bar: 0, bpm: 124 }],
  grid: 2,
  melody: [INTRO, ...VERSE, ...CHORUS, BREAK, ...VERSE, ...CHORUS, OUTRO],
  chords: [
    'Em | C | G | D',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    'G | Am | Em | C',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    'G | G',
  ],
  band: BAND,
}
