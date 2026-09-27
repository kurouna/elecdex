import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
  BASS_OCTAVES,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

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

/** A drum machine that keeps time on every beat, the arpeggio only in the chorus. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: EIGHTHS_SOFT, bass: BASS_8, pad: true },
    V: { kick: KICK_4, snare: SNARE_24, hat: EIGHTHS, bass: BASS_8, pad: true },
    C: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      bass: BASS_OCTAVES,
      arp: EIGHTHS,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, pad: true },
    E: {},
  },
  form: `I I! | ${times('V', 7)} V! | C* ${times('C', 7)} | ${times('V', 7)} V! | C* ${times('C', 7)} | O* E`,
}

export const song: SongSource = {
  id: 'boot-sequence',
  title: 'BOOT SEQUENCE',
  credit: 'elecdex',
  style: 'SYNTHWAVE',
  genre: 'electro',
  preview: barsIn(INTRO, ...VERSE),
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
  band: BAND,
}
