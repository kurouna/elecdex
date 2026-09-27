import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import { ARP_EIGHTHS, BASS_LAST, COMP_LAST, ONE, SIXTEENTHS, SNARE_24, times } from './parts'

/**
 * LOOPBACK - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * City pop at 112 in C, written in sixteenths for its funk: the verse goes round the
 * progression the city's night songs lean on - Fmaj7, E7, Am7, Gm7 to C7 - with G sharp (Y)
 * on the E7 and B flat (U) on the Gm7; the chorus lifts to long notes over Dm7, G7 and an
 * A7 that reaches C sharp (O). A Rhodes pushes ahead of the beat, a slapped bass answers
 * the kick, the hats run in sixteenths.
 */

const INTRO = '................|................'

const VERSE_1 = [
  'h.h.k...h.j.k.h.|y...j.d...s...d.|d.g.h...g.d...s.|f...u.f.d...s.a.',
  'h.h.k...h.j.k.l.|;...j.y...j...d.|k.l.k...j.g...d.|f...d...s.a.....',
]

const VERSE_2 = [
  'h.h.k...h.j.k.h.|y...j.d...s...d.|d.g.h...g.d...s.|f...u.f.d...s.a.',
  'k.k.l...k.l.;.l.|;...j.y.j...d...|k.l.k...j.g...s.|f...d...s.......',
]

const CHORUS = [
  "l-------k.l.;...|'-----l.;.l.j...|k-------l.k.j.g.|h---o---;-------",
  "l-------k.l.;.'.|;.....l...j.....|g.j.;...o...;...|k.....l...j.....",
]

const OUTRO = 'k-------........|................'

const VERSE_CHORDS = 'Fmaj7 | E7 | Am7 | Gm7 C7 | Fmaj7 | E7 | Am7 | Gm7 C7'
const CHORUS_CHORDS = 'Dm7 | G7 | Cmaj7 | A7 | Dm7 | G7 | Em7 A7 | Dm7 G7'

/** Funk: the kick on one, the 'a' of one and the 'and' of three, ghost notes on the snare. */
const KICK_FUNK = 'x..x....x.x.....'
const SNARE_GHOST = '....x..o....x..o'
/** An open hat on the last 'and', lifting the bar into the next. */
const OPEN_LAST = '..............x.'
/** A slapped bass: the root, again on the 'and' of two, the octave on three, the fifth to close. */
const BASS_SLAP = 'r.....r.o...r.5.'
/** The Rhodes, pushed a sixteenth ahead of two and four, and soft in between. */
const COMP_FUNK = 'x..o..o...x..o..'

const BAND: Band = {
  sections: {
    I: { kick: KICK_FUNK, hat: SIXTEENTHS, bass: BASS_SLAP, comp: COMP_FUNK },
    V: {
      kick: KICK_FUNK,
      snare: SNARE_GHOST,
      hat: SIXTEENTHS,
      openhat: OPEN_LAST,
      bass: BASS_SLAP,
      comp: COMP_FUNK,
    },
    C: {
      kick: KICK_FUNK,
      snare: SNARE_GHOST,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OPEN_LAST,
      bass: BASS_SLAP,
      comp: COMP_FUNK,
      arp: ARP_EIGHTHS,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I! | ${times('V', 7)} V! | C* ${times('C', 7)} | ${times('V', 7)} V! | C* ${times('C', 7)} | O* E`,
}

export const song: SongSource = {
  id: 'loopback',
  title: 'LOOPBACK',
  credit: 'elecdex',
  style: 'CITY POP',
  genre: 'pop',
  preview: barsIn(INTRO, ...VERSE_1),
  tempo: [{ bar: 0, bpm: 112 }],
  grid: 4,
  melody: [INTRO, ...VERSE_1, ...CHORUS, ...VERSE_2, ...CHORUS, OUTRO],
  chords: [
    'Fmaj7 | Gm7 C7',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    VERSE_CHORDS,
    CHORUS_CHORDS,
    'Cmaj7 | Cmaj7',
  ],
  band: BAND,
}
