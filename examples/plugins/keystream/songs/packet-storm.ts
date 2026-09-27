import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
  BASS_LONG,
  BASS_OCTAVES,
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
 * PACKET STORM - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * The fast one: eurobeat in D minor at 150, in sixteenths, with the black keys a minor key
 * wants - B flat (U) and the leading C sharp (O). Verse, chorus, a break that builds, and the
 * chorus twice to finish.
 */

const INTRO = '................|................|................|................'

const VERSE = [
  's.f.h.f.s.f.h.l.|k...g...d.g.k...|u...f...s.f.u.h.|o...h...d...h...',
  's.f.h.f.s.f.h.l.|;...l.k.g...k...|u.h.u.k.l...k.u.|h.......o...;...',
]

const CHORUS = [
  "l...l.k.l...'.;.|l...k.u...h.u...|k...k.u.k...l.;.|'...;.l.........",
  "u...u.h.u...l.k.|;...l.k...u.k...|h...k.'...;.l.k.|o...;...o.......",
]

const BREAK = 'l...............|....k.......u...|k...............|........o.;.o.;.'

const OUTRO = 'l...............|................'

const VERSE_CHORDS = 'Dm | C | Bb | A | Dm | C | Bb | A'
const CHORUS_CHORDS = 'Dm | Bb | C | Dm | Gm | C | F | A7'

/** Eurobeat at 150: open hats on the 'and', the octave bass, the break still on the kick. */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_8 },
    V: {
      kick: KICK_4,
      snare: SNARE_24,
      hat: KICK_4,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_OFFBEATS,
    },
    C: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      arp: EIGHTHS,
      pad: true,
    },
    K: { kick: KICK_4, hat: OFFBEATS, bass: BASS_LONG, pad: true },
    O: { kick: ONE, bass: BASS_LAST, pad: true },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | C* ${times('C', 7)} | K* K K K! | ${times('V', 7)} V! | C* ${times('C', 7)} | C* ${times('C', 7)} | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'packet-storm',
  title: 'PACKET STORM',
  credit: 'elecdex',
  style: 'EUROBEAT',
  genre: 'dance',
  preview: barsIn(INTRO, ...VERSE),
  tempo: [{ bar: 0, bpm: 150 }],
  grid: 4,
  melody: [INTRO, ...VERSE, ...CHORUS, BREAK, ...VERSE, ...CHORUS, ...CHORUS, OUTRO],
  chords: [
    'Dm | Bb | C | A',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    'Dm | Bb | C | A',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    CHORUS_CHORDS,
    'Dm | Dm',
  ],
  band: BAND,
}
