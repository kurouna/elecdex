import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_4,
  BASS_LAST,
  BASS_OCTAVES,
  COMP_LAST,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  SNARE_24_SOFT,
  times,
} from './parts'

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

/** A light beat under the first time through, the full band under the second. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: EIGHTHS_SOFT, bass: BASS_4 },
    A: { kick: KICK_4, snare: SNARE_24_SOFT, hat: EIGHTHS, bass: BASS_4, comp: COMP_OFFBEATS },
    B: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('A', 15)} A! | B* ${times('B', 15)} | O* E`,
}

export const song: SongSource = {
  id: 'ode-to-joy',
  title: 'ODE TO JOY',
  credit: 'L. v. Beethoven, arr. elecdex',
  tempo: [{ bar: 0, bpm: 124 }],
  grid: 2,
  melody: [INTRO, ...THEME, ...THEME, OUTRO],
  chords: ['F | C | F | C', THEME_CHORDS, THEME_CHORDS, 'F | F'],
  band: BAND,
}
