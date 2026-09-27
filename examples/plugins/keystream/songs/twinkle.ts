import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_4,
  BASS_8,
  BASS_LAST,
  BASS_OOM,
  COMP_24,
  COMP_LAST,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_4_SOFT,
  KICK_13,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * TWINKLE - the French tune "Ah! vous dirai-je, maman" (18th century), sung everywhere as
 * Twinkle, Twinkle, Little Star. In the public domain; this arrangement is elecdex's own and
 * is GPL-3.0 as the rest of this repository.
 *
 * The first track of all: six keys of the home row (A to H), in quarters, twice through -
 * a light beat the first time, the band the second.
 */

const INTRO = '........|........'

const TUNE = [
  'a-a-g-g-|h-h-g---|f-f-d-d-|s-s-a---',
  'g-g-f-f-|d-d-s---|g-g-f-f-|d-d-s---',
  'a-a-g-g-|h-h-g---|f-f-d-d-|s-s-a---',
]

const OUTRO = 'a-------|........'

const TUNE_CHORDS = 'C | F C | F C | G C | C F | C G | C F | C G | C | F C | F C | G C'

const BAND: Band = {
  sections: {
    I: { kick: KICK_4_SOFT, hat: EIGHTHS_SOFT, bass: BASS_4 },
    A: { kick: KICK_13, snare: SNARE_24, hat: EIGHTHS, bass: BASS_OOM, comp: COMP_24 },
    B: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      bass: BASS_8,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I! | ${times('A', 11)} A! | B* ${times('B', 11)} | O* E`,
}

export const song: SongSource = {
  id: 'twinkle',
  title: 'TWINKLE',
  credit: 'French folk tune, arr. elecdex',
  style: 'POP',
  genre: 'classics',
  preview: barsIn(INTRO),
  tempo: [{ bar: 0, bpm: 112 }],
  grid: 2,
  melody: [INTRO, ...TUNE, ...TUNE, OUTRO],
  chords: ['C | C', TUNE_CHORDS, TUNE_CHORDS, 'C | C'],
  band: BAND,
}
