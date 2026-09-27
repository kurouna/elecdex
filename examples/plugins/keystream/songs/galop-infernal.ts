import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_OOM,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  OFFBEATS,
  OFFBEATS_SOFT,
  SIXTEENTHS,
  times,
} from './parts'

/**
 * GALOP INFERNAL - Jacques Offenbach (1819-1880), from Orpheus in the Underworld (1858):
 * the can-can. In the public domain; this arrangement is elecdex's own, made from the tune
 * itself, and is GPL-3.0 as the rest of this repository.
 *
 * Set in F major so the tune's whole range - down to its last low note - fits the keyboard.
 * The theme three times, with a bridge of elecdex's own between the second and the third.
 */

const INTRO = '........|........'

const THEME = ["f---guhg|k-k-klhu|g-g-guhg|f';lkuhg", 'f---guhg|k-k-klhu|g-g-guhg|faghf---']

const BRIDGE = ["u-l-'-lu|h-k-'---|g-k-;-k-|f-h-k---", "u-l-'-lu|'-;-l-k-|l-j-g-u-|h-g-f---"]

const OUTRO = 'f-f-f---|........'

const THEME_CHORDS = 'F | F | C7 | F C7 | F | F | C7 | C7 F'

/** Oom-pah at a gallop: the bass on every beat, the chord and the snare on every 'and'. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: EIGHTHS_SOFT, bass: BASS_OOM, comp: COMP_OFFBEATS },
    A: { kick: KICK_4, snare: OFFBEATS_SOFT, hat: EIGHTHS, bass: BASS_OOM, comp: COMP_OFFBEATS },
    L: {
      kick: KICK_4,
      snare: OFFBEATS,
      hat: SIXTEENTHS,
      bass: BASS_OOM,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    // The last three chords, with the tune's three last notes.
    O: {
      kick: 'x...x...x.......',
      snare: 'x...x...x.......',
      bass: 'r...r...r-------',
      comp: 'x...x...x-------',
    },
    E: {},
  },
  form: `I I! | ${times('A', 7)} A! | L* ${times('L', 7)} | ${times('A', 7)} A! | L* ${times('L', 7)} | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'galop-infernal',
  title: 'GALOP INFERNAL',
  credit: 'J. Offenbach, arr. elecdex',
  style: 'GALOP',
  genre: 'classics',
  preview: barsIn(INTRO),
  tempo: [{ bar: 0, bpm: 150 }],
  grid: 2,
  melody: [INTRO, ...THEME, ...THEME, ...BRIDGE, ...THEME, OUTRO],
  chords: [
    'F | C7',
    THEME_CHORDS,
    THEME_CHORDS,
    'Bb | F | C7 | F | Bb | F | G7 C7 | F',
    THEME_CHORDS,
    'F | F',
  ],
  band: BAND,
}
