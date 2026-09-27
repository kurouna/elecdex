import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  ARP_EIGHTHS,
  BASS_8,
  BASS_LAST,
  BASS_LONG,
  BASS_OCTAVES,
  COMP_LAST,
  COMP_OFFBEATS,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4,
  KICK_13,
  KICK_ROCK,
  OFFBEATS,
  ONE,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * PIXEL RUSH - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * Chiptune at 160 in A minor, as a game's stage plays: a verse of quick repeated notes over
 * Am, F, C and G that turns on an E major with G sharp (Y), a chorus that climbs the top of
 * the keyboard and once runs down it in sixteenths, and a bridge that drops to half time
 * before the last chorus. The band is a chip: an arpeggio in sixteenths, chords on the
 * off-beats, the bass in octaves.
 */

const INTRO = '................|................|................|................'

const VERSE_1 = [
  "h.h.k.h.;.k.h...|f.f.h.f.k.h.f...|g.g.k.g.;.l.k...|j.j.l.j.'.l.j...",
  'h.h.k.h.;.k.h...|f.f.h.f.k.h.f...|g.g.k.g.;.l.k.l.|;.y.j.y.;.y.j...',
]

const VERSE_2 = [
  "h.h.k.h.;.k.h...|f.f.h.f.k.h.f...|g.g.k.g.;.l.k...|j.j.l.j.'.l.j...",
  "k.k.;.k.'.;.k...|f.f.k.f.l.k.f...|g.g.k.g.;.l.k.l.|;.y.j.y.;.y.j.;.",
]

const CHORUS = [
  ";.;.l.;.'.;.l...|l.l.j.l.;.l.j...|k.k.j.k.l.k.h...|h.....k.l.;.'.;.",
  ";.;.l.;.'.;.l...|l.l.j.l.;.l.j...|kl;';l;.k.j.k.l.|;-----..y.j.;...",
]

const BRIDGE = [
  's.f.h.f.s.f.h...|a.d.g.d.a.d.g...|s.f.h.l.h.f.s...|y.j.;.j.y.j.d...',
  "f...h...k...l...|j...l...;...'...|k.....l.;.....'.|;---............",
]

const OUTRO = 'h-------........|................'

const VERSE_CHORDS = 'Am | F | C | G | Am | F | C | E'
const CHORUS_CHORDS = 'F | G | Am | Am | F | G | C | E'
const BRIDGE_CHORDS = 'Dm | Am | Dm | E | F | G | Am | E'

/** The chip's arpeggio: every sixteenth, the chord's notes going up and round. */
const ARP_16 = 'xxxxxxxxxxxxxxxx'

const BAND: Band = {
  sections: {
    I: { hat: EIGHTHS_SOFT, bass: BASS_8, arp: ARP_16 },
    V: { kick: KICK_ROCK, snare: SNARE_24, hat: EIGHTHS, bass: BASS_8, comp: COMP_OFFBEATS },
    C: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OCTAVES,
      arp: ARP_16,
      pad: true,
    },
    R: { kick: KICK_13, hat: EIGHTHS_SOFT, bass: BASS_LONG, arp: ARP_EIGHTHS, pad: true },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | C* ${times('C', 7)} | ${times('V', 7)} V! | C* ${times('C', 7)} | R* ${times('R', 6)} R! | C* ${times('C', 7)} | O* E`,
  comp: 'chip',
  arp: 'chip',
}

export const song: SongSource = {
  id: 'pixel-rush',
  title: 'PIXEL RUSH',
  credit: 'elecdex',
  style: 'CHIPTUNE',
  genre: 'electro',
  tempo: [{ bar: 0, bpm: 160 }],
  grid: 4,
  melody: [INTRO, ...VERSE_1, ...CHORUS, ...VERSE_2, ...CHORUS, ...BRIDGE, ...CHORUS, OUTRO],
  chords: [
    'Am | F | C | G',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    VERSE_CHORDS,
    CHORUS_CHORDS,
    BRIDGE_CHORDS,
    CHORUS_CHORDS,
    'Am | Am',
  ],
  band: BAND,
}
