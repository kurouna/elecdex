import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_4,
  BASS_8,
  BASS_OOM,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_4_SOFT,
  SIXTEENTHS,
  SNARE_24,
  SNARE_24_SOFT,
  times,
} from './parts'

/**
 * FROG CHORUS - a German folk song, known in Japan as kaeru no gassho. The tune is in the
 * public domain (only the tune is used here, no words); this arrangement is elecdex's own and
 * is GPL-3.0 as the rest of this repository.
 *
 * It is a round, and the band sings it so: the tune comes back two bars behind the player,
 * in another voice, all the way through - the last two bars are the round finishing alone.
 */

const INTRO = '........|........'

const TUNE = ['a-s-d-f-|d-s-a---|d-f-g-h-|g-f-d---', 'a-..a-..|a-..a-..|aassddff|d-s-a---']

const OUTRO = '........|........'

const TUNE_CHORDS = 'C | C | C | C | C | C | C | G C'

const BAND: Band = {
  sections: {
    I: { kick: KICK_4_SOFT, hat: EIGHTHS_SOFT, bass: BASS_4 },
    A: { kick: KICK_4, snare: SNARE_24_SOFT, hat: EIGHTHS, bass: BASS_OOM, comp: COMP_OFFBEATS },
    B: {
      kick: KICK_4,
      snare: SNARE_24,
      hat: SIXTEENTHS,
      bass: BASS_8,
      comp: COMP_OFFBEATS,
      pad: true,
    },
  },
  form: `I I! | ${times('A', 7)} A! | B* ${times('B', 7)} | B* ${times('B', 7)} | A A`,
  round: { bars: 2, voice: 'pluck', level: 0.4 },
}

export const song: SongSource = {
  id: 'frog-chorus',
  title: 'FROG CHORUS',
  credit: 'German folk song, arr. elecdex',
  tempo: [{ bar: 0, bpm: 120 }],
  grid: 2,
  melody: [INTRO, ...TUNE, ...TUNE, ...TUNE, OUTRO],
  chords: ['C | C', TUNE_CHORDS, TUNE_CHORDS, TUNE_CHORDS, 'G | C'],
  band: BAND,
}
