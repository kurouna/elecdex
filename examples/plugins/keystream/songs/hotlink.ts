import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
  BASS_OCTAVES,
  BASS_OFFBEATS,
  COMP_LAST,
  COMP_OFFBEATS,
  COMP_PUSH,
  KICK_4,
  KICK_4_SOFT,
  KICK_ROCK,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * HOTLINK - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * Funk-leaning house in C major at 128. The verse sits on the home row and leans on the
 * off-beats; the chorus climbs to the C above (K) and drops back through G (G) so the hand
 * learns the shape of a lift. F sharp (T) only shows up as a passing colour in the turn.
 */

const INTRO = '................|................'

// 8 bars: call on the beat, answer on the ands
const VERSE = [
  'a...a.s...d.f...|g...f.d.......a.|s...s.d...f.d...|s.....a...s.d...',
  'a...a.s...d.g...|f...d.s.......a.|d...f.g...f.d...|a...............',
]

// 8 bars: higher, more syncopation, one black key as spice
const CHORUS = [
  'g...g.k...g.f...|d...f.g...k.g...|a...g.f...d.s...|a.......s.d.f.g.',
  'k...k.g...k.;...|l...k.g.t...g...|f...d.s...a.s...|d...............',
]

const OUTRO = 'a...............|................'

const VERSE_CHORDS = 'C | Am | F | G | C | Am | F | G'
const CHORUS_CHORDS = 'F | G | Am | C | F | G | Dm | G'

/** Four on the floor under a bass that answers the kicks; chorus pushes chords ahead of the beat. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4_SOFT, hat: OFFBEATS, bass: BASS_8 },
    V: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: OFFBEATS,
      bass: BASS_OFFBEATS,
      comp: COMP_OFFBEATS,
    },
    C: {
      kick: KICK_ROCK,
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
  // intro 2 | verse 8 | chorus 8 | verse 8 | chorus 8 | outro 2
  form: `I I! | ${times('V', 7)} V! | C* ${times('C', 7)} | ${times('V', 7)} V! | C* ${times('C', 7)} | O* E`,
  bass: 'ebass',
  comp: 'epiano',
  arp: 'pluck',
}

export const song: SongSource = {
  id: 'hotlink',
  title: 'HOTLINK',
  credit: 'elecdex',
  style: 'FUNK',
  genre: 'dance',
  preview: barsIn(INTRO, ...VERSE),
  tempo: [{ bar: 0, bpm: 128 }],
  grid: 4,
  melody: [INTRO, ...VERSE, ...CHORUS, ...VERSE, ...CHORUS, OUTRO],
  chords: ['C | C', VERSE_CHORDS, CHORUS_CHORDS, VERSE_CHORDS, CHORUS_CHORDS, 'C | C'],
  band: BAND,
}
