import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_LAST,
  BASS_LONG,
  EIGHTHS,
  KICK_13,
  KICK_BROKEN,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * OVERCLOCK - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * The fastest: drum and bass at 172 in A minor. The verse rides the beat at half its pace,
 * in long notes; the chorus goes to quavers, and the turn to E major reaches for G sharp (Y).
 */

const INTRO = '........|........|........|........'

const VERSE = ["h---;---|'---;-l-|;---k---|l---j---", "h---;---|'---;-l-|j---y---|d-------"]

const CHORUS = ["h-h-k-;-|'-;-l-k-|k-l-;-k-|l---j---", "h-h-k-;-|'-;-l-;-|y-j-k-j-|h-------"]

const BREAK = 'h-------|........|;-------|........'

const OUTRO = 'h-------|........'

const VERSE_CHORDS = 'Am | F | C | G | Am | F | E | E'
const CHORUS_CHORDS = 'Am | F | C | G | Am | F | E | Am'

/**
 * Drum and bass, kept easy to follow: the hats in steady eighths on every bar, the kick on
 * the one, the snare on two and four, the bass long and low.
 */
const BAND: Band = {
  sections: {
    I: { kick: KICK_13, hat: EIGHTHS, bass: BASS_LONG },
    V: { kick: KICK_BROKEN, snare: SNARE_24, hat: EIGHTHS, bass: BASS_LONG, pad: true },
    C: {
      kick: KICK_BROKEN,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      bass: 'r-----r-r---o-r-',
      arp: EIGHTHS,
      pad: true,
    },
    K: { kick: ONE, hat: EIGHTHS, pad: true },
    O: { kick: ONE, bass: BASS_LAST, pad: true },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | C* ${times('C', 7)} | K* K K K! | ${times('V', 7)} V! | C* ${times('C', 7)} | C* ${times('C', 7)} | O* E`,
}

export const song: SongSource = {
  id: 'overclock',
  title: 'OVERCLOCK',
  credit: 'elecdex',
  style: 'DRUM & BASS',
  genre: 'electro',
  tempo: [{ bar: 0, bpm: 172 }],
  grid: 2,
  melody: [INTRO, ...VERSE, ...CHORUS, BREAK, ...VERSE, ...CHORUS, ...CHORUS, OUTRO],
  chords: [
    'Am | F | C | G',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    'Am | F | C | E',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    CHORUS_CHORDS,
    'Am | Am',
  ],
  band: BAND,
}
