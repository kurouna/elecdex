import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  BASS_808,
  BASS_LAST,
  BASS_LONG,
  BASS_OCTAVES,
  CLAP_3,
  COMP_LAST,
  COMP_PUSH,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_13,
  KICK_SYNC,
  OFFBEATS,
  ONE,
  QUARTERS,
  RIFF_332,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * HEART PROTOCOL - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * K-pop at 124 in A minor: a clipped verse over an 808, a pre-chorus that drops to half
 * time and climbs to E major (G sharp, Y), a chorus built on one short hook said four
 * times, and a dance break whose hits the band plays with the player.
 */

const INTRO = '................|................'

const VERSE = [
  'h.h.k.h...g.h...|f.f.h.f...d.f...|g.g.k.g...;.l.k.|j...g...j.l.....',
  'h.h.k.h...g.h...|f.f.h.f...d.f...|g.g.k.g...;.l.k.|l...k...j...g...',
]

const PRE = [
  'h---j---k---l---|j---k---l---;---|;-------l---k---|h-----------....',
  "h---j---k---l---|l---;---'---;---|j-------........|y---j---l---j---",
]

const CHORUS = [
  ";.;.l.k.l...h...|;.;.l.k.l...'...|;.;.l.k.l...h.k.|j...g...j...k...",
  ";.;.l.k.l...h...|;.;.l.k.l...'...|;.;.l.k.l...;.l.|k-------h-------",
]

const BREAK = 'h..h..;.h..h..l.|h..h..;.h..h..k.|f..f..k.f..f..l.|g..g..l.j..g..j.'

const OUTRO = 'h---------------|................'

const CHORUS_CHORDS = 'Am | F | C | G | Am | F | G | Am'

/** The dance break's bass, on its hits. */
const BASS_332 = 'r..r..r.r..r..r.'

const BAND: Band = {
  sections: {
    I: { kick: KICK_13, hat: EIGHTHS_SOFT, bass: BASS_LONG, pad: true },
    V: { kick: KICK_SYNC, clap: SNARE_24, hat: EIGHTHS, bass: BASS_808, comp: COMP_PUSH },
    P: { kick: KICK_13, clap: CLAP_3, hat: QUARTERS, bass: BASS_LONG, pad: true },
    C: {
      kick: KICK_4,
      clap: SNARE_24,
      snare: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      comp: COMP_PUSH,
      pad: true,
    },
    D: { kick: RIFF_332, clap: SNARE_24, hat: SIXTEENTHS, bass: BASS_332 },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I! | ${times('V', 7)} V! | ${times('P', 7)} P! | C* ${times('C', 7)} | D* D D D! | C* ${times('C', 7)} | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'heart-protocol',
  title: 'HEART PROTOCOL',
  credit: 'elecdex',
  style: 'K-POP',
  genre: 'pop',
  tempo: [{ bar: 0, bpm: 124 }],
  grid: 4,
  melody: [INTRO, ...VERSE, ...PRE, ...CHORUS, BREAK, ...CHORUS, OUTRO],
  chords: [
    'Am | G',
    'Am | F | C | G | Am | F | C | G',
    'F | G | Em | Am | F | G | E | E7',
    CHORUS_CHORDS,
    'Am | Am | F | G',
    CHORUS_CHORDS,
    'Am | Am',
  ],
  band: BAND,
}
