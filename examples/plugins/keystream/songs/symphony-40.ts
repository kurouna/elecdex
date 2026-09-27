import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
  BASS_OCTAVES,
  COMP_LAST,
  COMP_OFFBEATS,
  EIGHTHS,
  KICK_4,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * SYMPHONY 40 - Wolfgang Amadeus Mozart (1756-1791), the opening of the Symphony No. 40 in
 * G minor, K. 550 (1788). In the public domain; this arrangement is elecdex's own, made
 * from the tune itself, and is GPL-3.0 as the rest of this repository.
 *
 * In D minor, over the eurobeat band: the theme - its sighing figure on the black key B flat
 * (U), and C sharp (O) where it turns to the dominant - twice, a bridge of elecdex's own in
 * the relative major, and the theme once more. Each statement starts on the two quavers
 * before its first beat.
 */

const INTRO = '........|........|......uh'

const THEME_OPENING = "h-uhh-uh|h-'---';|l-lku-uh|g-g---hg"
const THEME_CLOSE = 'g-hgg-hg|g-;---;l|o-ojh-hg'

const BRIDGE = ['k-l-k-h-|g-h-k---|l-;-l-h-|o-;-o---', "k-l-'-k-|;-l-k-g-|u-k-l-u-|o-j-h-uh"]

const OUTRO = 'l-------|........'

const THEME_CHORDS = 'Dm | Dm | Gm | A7 | A7 | A7 | A7 | Dm'

/** Eurobeat: the octave bass and a pluck on every 'and', the bridge on a pad alone. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_8 },
    A: { kick: KICK_4, snare: SNARE_24, hat: EIGHTHS, bass: BASS_OCTAVES, comp: COMP_OFFBEATS },
    L: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_OFFBEATS,
      pad: true,
    },
    B: { kick: KICK_4, snare: SNARE_24, hat: EIGHTHS, bass: BASS_8, pad: true },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I I! | ${times('A', 7)} A! | L* ${times('L', 7)} | ${times('B', 7)} B! | L* ${times('L', 7)} | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'symphony-40',
  title: 'SYMPHONY 40',
  credit: 'W. A. Mozart, arr. elecdex',
  style: 'EUROBEAT',
  genre: 'classics',
  preview: barsIn(INTRO),
  tempo: [{ bar: 0, bpm: 140 }],
  grid: 2,
  melody: [
    INTRO,
    THEME_OPENING,
    THEME_CLOSE,
    'f-f---uh',
    THEME_OPENING,
    THEME_CLOSE,
    'f-f-----',
    ...BRIDGE,
    THEME_OPENING,
    THEME_CLOSE,
    'f-f-----',
    OUTRO,
  ],
  chords: [
    'Dm | Dm | Dm',
    THEME_CHORDS,
    THEME_CHORDS,
    'F | C | Dm | A7 | F | C | Bb | A7',
    THEME_CHORDS,
    'Dm | Dm',
  ],
  band: BAND,
}
