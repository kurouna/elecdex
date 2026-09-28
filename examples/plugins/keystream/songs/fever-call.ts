import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_4,
  BASS_LAST,
  COMP_LAST,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  OFFBEATS,
  ONE,
  QUARTERS,
  SNARE_24,
  times,
} from './parts'

/**
 * FEVER CALL - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * Idol pop at 180 in C major, written to be played along with as a crowd calls along: every
 * beat of every line lands on one key, the same for a whole part - G (G) in the verse, E (;)
 * in the chorus - and the tune moves on the 'and's between them. On EASY, which plays only
 * the beats, a player taps that one key in time and the game sings the rest; on NORMAL the
 * 'and's are theirs too. The pre-chorus climbs a key a bar (A, B, C, D) into the chorus's E,
 * and the break is the crowd's own call, three, three and two.
 *
 * So that one key never wears thin, the second verse turns to A (H) half way, a key up, and
 * leads the pre-chorus in on it; and the last chorus comes down from the E a key a bar - E,
 * D, C (; L K) - to land on the C it ends on.
 */

const INTRO = '........|........|g.g.g.g.|g.g.gggg'

const VERSE = ['g.gkg.gd|g.gjg.g.|g.ghg.gk|g.gdg---', 'g.gkg.gf|g.gdg.gk|g.gfg.gl|g.g.gggg']

/** The second verse: livelier 'and's, then A (H) on the beats from its fifth bar. */
const VERSE_2 = ['g.gkg.gd|g.gjg.gl|g.ghgkg;|g.gdg---', 'h.hkh.h;|h.hkh.hj|h.hlh.hk|h.h.hhhh']

const PRE = 'h.h.h.hh|j.j.j.jj|k.k.k.kk|l.l.llll'

const CHORUS = [";.;';.;l|;.;l;.;j|;.;j;.;h|;.;.;---", ";.;';.;l|;.;l;.;j|;.;.l.k.|k-------"]

/** The last chorus's second half: the beats step down, E, D, C, to the last note. */
const LAST_LINE = ";.;';.;l|l.l;l.lk|k.klk.k;|k-------"

const BREAK = 'h..h..h.|h..h..h.|g..g..g.|g.g.gggg'

const OUTRO = 'k-------|........'

const VERSE_CHORDS = 'C | G | Am | Em | F | C | Dm | G'
const PRE_CHORDS = 'Dm | Em | F | G'
const CHORUS_CHORDS = 'Fmaj7 | G | Em | Am | Fmaj7 | G | C | C'

/*
 * The band plays the tune's own rhythm: its chords and its bass strike where the melody
 * does, so what a player hears is what they are to type, and the kick is on every beat they
 * tap on EASY. Nothing is finer than the melody's eighths but a soft hat.
 */

/** The verse and the pre-chorus: a note on every beat, the last bar's 'and' of four too. */
const ON_BEATS_AND_4 = 'x...x...x...x.x.'
/** The chorus: one, two and its 'and', three, four and its 'and'. */
const CHORUS_HITS = 'x...x.x.x...x.x.'
/** The chorus's fourth bar: three beats, the third held. */
const HELD_3 = 'x...x...x-------'
/** Its last: the one note, held. */
const HELD_1 = 'x---------------'
/** A bar that runs into the next in eighths from its third beat. */
const RUN_IN = 'x...x...x.x.x.x.'
/** The break's call, three, three and two eighths: one, the 'and' of two, four. */
const CALL_332 = 'x.....x.....x...'

const bassOf = (hits: string): string => hits.replace(/x/g, 'r')
const QUARTERS_SOFT = 'o...o...o...o...'
const CHORUS_BAND = {
  kick: KICK_4,
  snare: SNARE_24,
  clap: SNARE_24,
  hat: EIGHTHS,
  openhat: OFFBEATS,
  pad: true,
}

/**
 * Idol pop at a run, four to the floor with the clap on two and four throughout. The piano
 * strikes the chord with every note of the tune, the bass with it. The first verse is the
 * lightest, the piano soft; the second opens its hat; the last chorus adds an arpeggio.
 */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_4, pad: true },
    V: { kick: KICK_4, clap: SNARE_24, hat: EIGHTHS_SOFT, bass: BASS_4, comp: QUARTERS_SOFT },
    W2: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS_SOFT,
      openhat: OFFBEATS,
      bass: BASS_4,
      comp: QUARTERS,
    },
    P: {
      kick: KICK_4,
      snare: QUARTERS,
      hat: EIGHTHS_SOFT,
      bass: bassOf(ON_BEATS_AND_4),
      comp: ON_BEATS_AND_4,
      pad: true,
    },
    Q: { kick: KICK_4, snare: RUN_IN, bass: bassOf(RUN_IN), comp: RUN_IN, pad: true },
    C: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: EIGHTHS,
      bass: bassOf(CHORUS_HITS),
      comp: CHORUS_HITS,
      pad: true,
    },
    H: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS,
      bass: bassOf(HELD_3),
      comp: HELD_3,
      pad: true,
    },
    W: { kick: KICK_4, clap: SNARE_24, hat: EIGHTHS, bass: BASS_4, comp: QUARTERS, pad: true },
    Z: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS,
      bass: bassOf(HELD_1),
      comp: HELD_1,
      pad: true,
    },
    A: { ...CHORUS_BAND, bass: bassOf(CHORUS_HITS), comp: CHORUS_HITS, arp: EIGHTHS },
    A1: { ...CHORUS_BAND, bass: bassOf(HELD_3), comp: HELD_3, arp: EIGHTHS },
    A2: { ...CHORUS_BAND, bass: bassOf(HELD_1), comp: HELD_1 },
    K: { kick: CALL_332, clap: CALL_332, hat: QUARTERS, bass: bassOf(CALL_332), comp: CALL_332 },
    L: { kick: KICK_4, snare: RUN_IN, bass: bassOf(RUN_IN), comp: RUN_IN },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | P P P Q! | C* C C H C C W Z | ${times('W2', 7)} W2! | P P P Q! | C* C C H C C W Z | K* K K L! | A* A A A1 A A A A2 | O* E`,
  comp: 'piano',
}

export const song: SongSource = {
  id: 'fever-call',
  title: 'FEVER CALL',
  credit: 'elecdex',
  style: 'IDOL POP',
  genre: 'pop',
  preview: barsIn(INTRO, ...VERSE, PRE),
  tempo: [{ bar: 0, bpm: 180 }],
  grid: 2,
  melody: [
    INTRO,
    ...VERSE,
    PRE,
    ...CHORUS,
    ...VERSE_2,
    PRE,
    ...CHORUS,
    BREAK,
    CHORUS[0] ?? '',
    LAST_LINE,
    OUTRO,
  ],
  chords: [
    'F | G | Em | Am',
    VERSE_CHORDS,
    PRE_CHORDS,
    CHORUS_CHORDS,
    VERSE_CHORDS,
    PRE_CHORDS,
    CHORUS_CHORDS,
    'Am | F | G | G',
    CHORUS_CHORDS,
    'C | C',
  ],
  band: BAND,
}
