import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_8,
  BASS_LAST,
  BASS_OCTAVES,
  CLAP_3,
  COMP_LAST,
  COMP_OFFBEATS,
  COMP_PUSH,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_13,
  KICK_ROCK,
  OFFBEATS,
  ONE,
  QUARTERS,
  RIFF_332,
  SIXTEENTHS,
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
 */

const INTRO = '........|........|g.g.g.g.|g.g.gggg'

const VERSE = ['g.gkg.gd|g.gjg.g.|g.ghg.gk|g.gdg---', 'g.gkg.gf|g.gdg.gk|g.gfg.gl|g.g.gggg']

const PRE = 'h.h.h.hh|j.j.j.jj|k.k.k.kk|l.l.llll'

const CHORUS = [";.;';.;l|;.;l;.;j|;.;j;.;h|;.;.;---", ";.;';.;l|;.;l;.;j|;.;.l.k.|k-------"]

const BREAK = 'h..h..h.|h..h..h.|g..g..g.|g.g.gggg'

const OUTRO = 'k-------|........'

const VERSE_CHORDS = 'C | G | Am | Em | F | C | Dm | G'
const PRE_CHORDS = 'Dm | Em | F | G'
const CHORUS_CHORDS = 'Fmaj7 | G | Em | Am | Fmaj7 | G | C | C'

/** The break's bass, on the crowd's three, three and two. */
const BASS_332 = 'r..r..r.r..r..r.'

/**
 * Idol pop at a run: an eight-beat verse, a pre-chorus whose snare doubles up as it climbs,
 * and a chorus on four to the floor with the octave bass - the piano's chords pushed ahead
 * of the beat, as the genre's own records do.
 */
const BAND: Band = {
  sections: {
    I: { kick: KICK_13, hat: EIGHTHS_SOFT, bass: BASS_8, pad: true },
    V: { kick: KICK_ROCK, snare: SNARE_24, hat: EIGHTHS, bass: BASS_8, comp: COMP_OFFBEATS },
    P: { kick: KICK_4, snare: QUARTERS, hat: EIGHTHS, bass: BASS_8, pad: true },
    Q: { kick: KICK_4, snare: EIGHTHS, hat: EIGHTHS, bass: BASS_8, pad: true },
    C: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_PUSH,
      arp: EIGHTHS,
      pad: true,
    },
    K: { kick: RIFF_332, clap: CLAP_3, hat: EIGHTHS, bass: BASS_332 },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | P P Q Q! | C* ${times('C', 7)} | ${times('V', 7)} V! | P P Q Q! | C* ${times('C', 7)} | K* K K K! | C* ${times('C', 7)} | O* E`,
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
  melody: [INTRO, ...VERSE, PRE, ...CHORUS, ...VERSE, PRE, ...CHORUS, BREAK, ...CHORUS, OUTRO],
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
