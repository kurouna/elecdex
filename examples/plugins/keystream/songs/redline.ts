import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_4,
  BASS_LAST,
  BASS_LONG,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_13_SOFT,
  OFFBEATS,
  ONE,
  QUARTERS,
  SNARE_24,
  times,
} from './parts'

/**
 * REDLINE - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * J-core at 200 in A minor, the fastest of them, and made to be hammered: the drop is one
 * key struck in a riff's rhythm - one, two and its 'and', the 'and' of three, four - a key a
 * chord (E, F, D, E: ; ' L ;, side by side), the way a trance riff repeats its note. The
 * verse keeps every beat on A (H) with the tune on the 'and's, and the build strikes one key
 * in quarters, then eighths. So EASY, which plays only the beats, is one key a bar in time.
 *
 * What changes on the way: the second verse puts its beats on each chord's root (A, F, G), the
 * second drop answers its riff a third higher (C, C, B), a half-time breakdown of long notes
 * gives the hands a rest, and the last drop strikes all four beats.
 */

const INTRO = '........|........|........|........'

const VERSE = ['h.h;h.hl|h.hkh.h.|h.hlh.hj|h.h.y-j-', "h.h;h.hl|h.hkh.h'|h.hjh.hl|h.hjy-j-"]

/** The second verse: each bar's beats on its chord's root. */
const VERSE_2 = ['h.h;h.hl|f.fkf.fh|g.gjg.gl|h.h.y-j-', 'h.h;h.hl|f.fkf.fh|g.gjg.gl|h.hjy-j-']

const BUILD = 'l.l.l.l.|l.l.llll|j.j.jjjj|jjjj;---'

/** The riff on one key a bar: the beats one, two and four for EASY. */
const DROP = [";.;;.;;.|'.''.''.|l.ll.ll.|;.;;.;;;", ";.;;.;;.|'.''.''.|l.ll.ll.|j.jjy.;."]

/** The second drop's answer: the riff a third higher, C, C, B, then up through the E chord. */
const ANSWER = 'k.kk.kk.|k.kk.kk.|j.jj.jj.|y.yyj.;.'

/** Half time: a long note a bar, then eighths into the last drop. */
const BREAKDOWN = 'h-------|k-------|l-------|j.j.jjjj'

/** The last drop, pushed: every beat struck. */
const DROP_2 = [";.;;;.;;|'.'''.''|l.lll.ll|;.;;;.;;", ";.;;;.;;|'.'''.''|l.lll.ll|j.jjy.y."]

const OUTRO = 'h-------|........'

const LOOP = 'Am | F | G | E | Am | F | G | E'
/** The verse's A held over E as a suspension, resolving to G sharp (Y) on the third beat. */
const VERSE_CHORDS = 'Am | F | G | Esus4 E | Am | F | G | Esus4 E'

/*
 * The band plays the tune's own rhythm: the stabs and the bass strike where the melody does,
 * so the riff a player types is the riff they hear. The verse's stabs and bass are on the
 * beats, which its A falls on, and the kick is on every beat a player taps on EASY. Nothing
 * is finer than the melody's eighths but a soft hat.
 */

/** The last drop: one, two and its 'and', three, four and its 'and'. */
const VERSE_HITS = 'x...x.x.x...x.x.'
/** The drop's riff: one, two and its 'and', the 'and' of three, four. */
const RIFF = 'x...x.x...x.x...'
/** A drop's last bar, turning back: one, two and its 'and', three, four. */
const TURN = 'x...x.x.x...x...'
/** The build: quarters, then eighths from the third beat, then eighths into a held note. */
const RUN_IN = 'x...x...x.x.x.x.'
const RUSH = 'x.x.x.x.x-------'

const bassOf = (hits: string): string => hits.replace(/x/g, 'r')

/**
 * Hardcore's four to the floor with the clap on two and four; the stabs are a pluck, the
 * bass the synthesiser's, both on the riff, and the build's snare steps up with the tune.
 */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_LONG, pad: true },
    V: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS_SOFT,
      bass: BASS_4,
      comp: QUARTERS,
    },
    B: { kick: KICK_4, snare: QUARTERS, bass: bassOf(QUARTERS), comp: QUARTERS, pad: true },
    U: { kick: KICK_4, snare: RUN_IN, bass: bassOf(RUN_IN), comp: RUN_IN, pad: true },
    R: { kick: KICK_4, snare: 'x.x.x.x.x.......', bass: bassOf(RUSH), comp: RUSH },
    D: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS,
      bass: bassOf(RIFF),
      comp: RIFF,
      pad: true,
    },
    F: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS,
      bass: bassOf(VERSE_HITS),
      comp: VERSE_HITS,
      pad: true,
    },
    X: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: EIGHTHS,
      bass: bassOf(TURN),
      comp: TURN,
      pad: true,
    },
    H: { kick: KICK_13_SOFT, bass: BASS_LONG, pad: true },
    O: { kick: ONE, bass: BASS_LAST, pad: true },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | B U U R! | D* ${times('D', 6)} X | ${times('V', 7)} V! | B U U R! | D* ${times('D', 6)} X | H* H H U! | F* ${times('F', 6)} X | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'redline',
  title: 'REDLINE',
  credit: 'elecdex',
  style: 'J-CORE',
  genre: 'electro',
  preview: barsIn(INTRO, ...VERSE, BUILD),
  tempo: [{ bar: 0, bpm: 200 }],
  grid: 2,
  melody: [
    INTRO,
    ...VERSE,
    BUILD,
    ...DROP,
    ...VERSE_2,
    BUILD,
    DROP[0] ?? '',
    ANSWER,
    BREAKDOWN,
    ...DROP_2,
    OUTRO,
  ],
  chords: [
    'Am | F | G | E',
    VERSE_CHORDS,
    'Dm | Dm | E | E',
    LOOP,
    VERSE_CHORDS,
    'Dm | Dm | E | E',
    LOOP,
    'Am | F | G | E',
    LOOP,
    'Am | Am',
  ],
  band: BAND,
}
