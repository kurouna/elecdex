import type { Band } from '../arrange'
import type { SongSource } from '../notation'
import {
  ARP_EIGHTHS,
  BASS_8,
  BASS_LAST,
  BASS_LONG,
  COMP_EIGHTHS,
  COMP_HALVES,
  COMP_LAST,
  EIGHTHS,
  EIGHTHS_SOFT,
  KICK_4_SOFT,
  KICK_ROCK,
  OFFBEATS,
  ONE,
  SNARE_24,
  SNARE_24_SOFT,
  times,
} from './parts'

/**
 * SAKURA SIGNAL - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * J-pop at 140 in C: a verse over the bass walking down a step a bar (C, B, A, G, F, E, D),
 * a pre-chorus that climbs, and a chorus on the progression J-pop leans on most - F, G, Em,
 * Am - with the E over F it likes. An eight-beat band under it, a piano on the chords.
 */

const INTRO = '........|........|........|........'

const VERSE = ['g-g-g-h-|g---d-f-|g-h-g-f-|d-----..', 'f-f-f-g-|d---a-s-|d-f-d-s-|s-----..']

const PRE = ['h-h-j-k-|j-h-g-..|g-g-h-j-|h-----..', 'f-g-h-f-|g-h-j-g-|h-j-k-l-|l---j---']

const CHORUS = ['k-kl;-l-|k-j-k-l-|j-g-g-h-|h-----gh', "k-kl;-l-|'-;-l-k-|k-l-;-l-|k-------"]

const OUTRO = 'k-------|........'

const CHORUS_CHORDS = 'F | G | Em | Am | F | G | C | C'

const BAND: Band = {
  sections: {
    I: { kick: KICK_4_SOFT, hat: EIGHTHS_SOFT, bass: BASS_LONG, arp: ARP_EIGHTHS, pad: true },
    A: {
      kick: KICK_ROCK,
      snare: SNARE_24_SOFT,
      hat: EIGHTHS_SOFT,
      bass: BASS_8,
      comp: COMP_HALVES,
    },
    B: { kick: KICK_ROCK, snare: SNARE_24, hat: EIGHTHS, bass: BASS_8, comp: COMP_EIGHTHS },
    C: {
      kick: KICK_ROCK,
      snare: SNARE_24,
      hat: EIGHTHS,
      openhat: OFFBEATS,
      bass: BASS_8,
      comp: COMP_HALVES,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, comp: COMP_LAST },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('A', 7)} A! | ${times('B', 7)} B! | C* ${times('C', 7)} | C* ${times('C', 7)} | O* E`,
  comp: 'piano',
}

export const song: SongSource = {
  id: 'sakura-signal',
  title: 'SAKURA SIGNAL',
  credit: 'elecdex',
  style: 'J-POP',
  tempo: [{ bar: 0, bpm: 140 }],
  grid: 2,
  melody: [INTRO, ...VERSE, ...PRE, ...CHORUS, ...CHORUS, OUTRO],
  chords: [
    'F | G | C | C',
    'C | G/B | Am | Em/G | F | C/E | Dm | G',
    'F | G | Em | Am | Dm | Em | F | G',
    CHORUS_CHORDS,
    CHORUS_CHORDS,
    'C | C',
  ],
  band: BAND,
}
