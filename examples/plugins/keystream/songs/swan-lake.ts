import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
  BASS_LONG,
  BASS_OCTAVES,
  EIGHTHS,
  KICK_4,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * SWAN LAKE - Pyotr Ilyich Tchaikovsky (1840-1893), the swans' theme from Swan Lake (1876).
 * In the public domain; this arrangement is elecdex's own - the theme as the ballet has it,
 * and a middle of elecdex's own between its statements - and is GPL-3.0 as the rest of this
 * repository.
 *
 * In A minor, a tone below the ballet's B minor so the theme sits on the keys, as trance at
 * 132: its long notes ride a kick on every beat.
 */

const INTRO = '........|........|........|........'

const THEME = [';---hjkl|;--k;--k|;--hkhfk|h-------', ';---hjkl|;--k;--k|;--hkhfk|h-------']

const MIDDLE = "k-l-;---|l-;-'---|;-'-;-l-|j-------"

const OUTRO = 'h-------|........'

const THEME_CHORDS = 'Am | Am | Am F | Am | Am | Am | Am F | Am'

/** Trance: a pad and an arpeggio under the theme, the middle on the pad and the kick alone. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_8, pad: true },
    A: { kick: KICK_4, clap: SNARE_24, hat: OFFBEATS, bass: BASS_8, arp: EIGHTHS, pad: true },
    M: { kick: KICK_4, hat: OFFBEATS, bass: BASS_LONG, pad: true },
    L: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      arp: EIGHTHS,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, pad: true },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('A', 7)} A! | ${times('M', 3)} M! | L* ${times('L', 7)} | ${times('M', 3)} M! | L* ${times('L', 7)} | O* E`,
}

export const song: SongSource = {
  id: 'swan-lake',
  title: 'SWAN LAKE',
  credit: 'P. I. Tchaikovsky, arr. elecdex',
  tempo: [{ bar: 0, bpm: 132 }],
  grid: 2,
  melody: [INTRO, ...THEME, MIDDLE, ...THEME, MIDDLE, ...THEME, OUTRO],
  chords: [
    'Am | Am | F | E',
    THEME_CHORDS,
    'F | G | Em | E',
    THEME_CHORDS,
    'F | G | Em | E',
    THEME_CHORDS,
    'Am | Am',
  ],
  band: BAND,
}
