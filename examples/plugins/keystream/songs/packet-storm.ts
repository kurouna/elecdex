import type { SongSource } from '../notation'

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

export const song: SongSource = {
  id: 'packet-storm',
  title: 'PACKET STORM',
  credit: 'elecdex',
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
  energy: '1122 22222222 33333333 1111 22222222 33333333 33333333 21',
  style: 'eurobeat',
}
