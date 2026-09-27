import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
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

/** House: four on the floor, the chords pushing ahead of the beat in the chorus as the tune does. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_8 },
    V: { kick: KICK_4, clap: SNARE_24, hat: OFFBEATS, bass: BASS_8, comp: COMP_OFFBEATS },
    C: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_PUSH,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I! | ${times('V', 7)} V! | C* ${times('C', 7)} | ${times('V', 7)} V! | C* ${times('C', 7)} | O* E`,
}

export const song: SongSource = {
  id: 'neon-circuit',
  title: 'NEON CIRCUIT',
  credit: 'elecdex',
  style: 'HOUSE',
  tempo: [{ bar: 0, bpm: 120 }],
  grid: 4,
  melody: [INTRO, ...VERSE, ...CHORUS, ...VERSE, ...CHORUS, OUTRO],
  chords: ['Em | Em', VERSE_CHORDS, CHORUS_CHORDS, VERSE_CHORDS, CHORUS_CHORDS, 'Em | Em'],
  band: BAND,
}
