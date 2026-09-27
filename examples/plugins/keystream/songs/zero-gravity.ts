import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  ARP_EIGHTHS,
  BASS_4,
  BASS_8,
  BASS_LAST,
  BASS_LONG,
  BASS_OFFBEATS,
  COMP_LAST,
  EIGHTHS,
  KICK_4,
  KICK_4_SOFT,
  KICK_13_SOFT,
  OFFBEATS,
  OFFBEATS_SOFT,
  ONE,
  QUARTERS,
  RIFF_332,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * ZERO GRAVITY - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * EDM at 128 in D minor, on the progression a drop leans on most - Dm, B flat (U), F, C.
 * A breakdown of long notes over a pad, a build whose snare goes from quarters to eighths
 * to a roll while the player's notes do the same, and a drop whose riff falls three, three
 * and two sixteenths apart, the band's stabs with it.
 */

const INTRO = '................|................'

const BREAKDOWN = [
  'l-------k---h---|u-------h---f---|h-------k---l---|;-------l---k---',
  "l-------k---h---|u-------h---f---|h---k---l---;---|'-----------;---",
]

const BUILD = 'h...h...h...h...|u...u...u...u...|k...k...k...k...|l...l...l...l...'
const RISE = "h.h.h.h.h.h.h.h.|u.u.u.u.u.u.u.u.|k.k.k.k.k.k.k.k.|l.l.l.l.;.;.'.'."

const DROP = [
  'l..l..l.k..k..h.|u..u..u.h..h..f.|h..h..h.k..k..l.|;..;..;.l..l..k.',
  'l..l..l.k..k..h.|u..u..u.h..h..f.|h..h..h.k..k..;.|l-------........',
]

const BREATHER = "l-------------..|u-------------..|h-------------..|k---l---;---'---"

const OUTRO = 'l---------------|................'

const LOOP = 'Dm | Bb | F | C'
const DROP_CHORDS = 'Dm | Bb | F | C | Dm | Bb | F | Dm'

const BAND: Band = {
  sections: {
    I: { kick: KICK_4_SOFT, pad: true },
    K: { kick: KICK_13_SOFT, bass: BASS_LONG, arp: ARP_EIGHTHS, pad: true },
    B: { kick: KICK_4, snare: QUARTERS, hat: OFFBEATS_SOFT, bass: BASS_4, pad: true },
    S: { kick: KICK_4, snare: EIGHTHS, hat: OFFBEATS, bass: BASS_8, pad: true },
    D: {
      kick: KICK_4,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OFFBEATS,
      comp: RIFF_332,
      pad: true,
    },
    R: { kick: KICK_13_SOFT, bass: BASS_LONG, arp: ARP_EIGHTHS, pad: true },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `I I | ${times('K', 8)} | ${times('B', 4)} | S S S S! | D* ${times('D', 7)} | R* R R R | S S S S! | D* ${times('D', 7)} | O* E`,
  comp: 'pluck',
}

export const song: SongSource = {
  id: 'zero-gravity',
  title: 'ZERO GRAVITY',
  credit: 'elecdex',
  style: 'EDM',
  genre: 'dance',
  preview: barsIn(INTRO, ...BREAKDOWN, BUILD),
  tempo: [{ bar: 0, bpm: 128 }],
  grid: 4,
  melody: [INTRO, ...BREAKDOWN, BUILD, RISE, ...DROP, BREATHER, RISE, ...DROP, OUTRO],
  chords: [
    'Dm | Bb',
    `${LOOP} | ${LOOP}`,
    LOOP,
    LOOP,
    DROP_CHORDS,
    LOOP,
    LOOP,
    DROP_CHORDS,
    'Dm | Dm',
  ],
  band: BAND,
}
