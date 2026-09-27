import type { Voice } from '../elecdex-plugin'

/**
 * How the band plays under the melody, per style. A pattern is one bar of sixteen
 * sixteenths: 'x' a hit, 'o' a softer one, '.' nothing. Patterns come three to a part, for
 * the energy of the bar (1 to 3); a part with none for an energy sits that energy out.
 *
 * The bass writes what it plays: 'r' the chord's bass note, 'o' an octave up, '5' its fifth,
 * '-' holds on, '.' rests.
 */

export type StyleName = 'synthwave' | 'eurobeat' | 'galop' | 'dark' | 'house' | 'dnb'

type ByEnergy = readonly [one: string | null, two: string | null, three: string | null]

export type DrumVoice = 'kick' | 'snare' | 'clap' | 'hat' | 'openhat' | 'tom'

export interface Style {
  drums: Partial<Record<DrumVoice, ByEnergy>>
  bass: ByEnergy
  /** An arpeggio of the chord, a note every `every` sixteenths by energy (0 sits it out). */
  arp: { every: readonly [number, number, number]; order: 'up' | 'updown' } | null
  /** The chord held under the bar, from this energy up. */
  pad: number | null
  /** Short chord hits. */
  stab: ByEnergy | null
  stabVoice: Voice
  /** What the tom is tuned to, as a MIDI note. */
  tom: number
}

export const STYLES: Readonly<Record<StyleName, Style>> = {
  // Drum machine and arpeggios: a steady back beat under a glassy pad.
  synthwave: {
    drums: {
      kick: ['x.......x.......', 'x.......x.......', 'x.......x.x.....'],
      snare: [null, '....x.......x...', '....x.......x...'],
      clap: [null, null, '....x.......x...'],
      hat: ['..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'xoxoxoxoxoxoxoxo'],
    },
    bass: ['r-------r-------', 'r.r.r.r.r.r.r.r.', 'r.ror.ror.ror.ro'],
    arp: { every: [2, 2, 1], order: 'up' },
    pad: 1,
    stab: null,
    stabVoice: 'pluck',
    tom: 45,
  },
  // Four on the floor, open hats on the off-beat, the octave bass that never stops.
  eurobeat: {
    drums: {
      kick: ['x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...'],
      snare: [null, '....x.......x...', '....x.......x...'],
      clap: [null, null, '....x.......x..o'],
      hat: ['..x...x...x...x.', 'x...x...x...x...', 'x.o.x.o.x.o.x.o.'],
      openhat: [null, '..x...x...x...x.', '..x...x...x...x.'],
    },
    bass: ['r...r...r...r...', 'r.o.r.o.r.o.r.o.', 'rorororororororo'],
    arp: { every: [2, 1, 1], order: 'updown' },
    pad: 1,
    stab: [null, null, '..x..x....x..x..'],
    stabVoice: 'pluck',
    tom: 45,
  },
  // Oom-pah at a gallop: the bass on the beat, the chord on the off-beat.
  galop: {
    drums: {
      kick: ['x.......x.......', 'x.......x.......', 'x...x...x...x...'],
      snare: [null, '....x.......x...', '....x.......x...'],
      hat: [null, 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'],
      openhat: [null, null, '..x...x...x...x.'],
    },
    bass: ['r-------5-------', 'r---5---r---5---', 'r---5---r---5---'],
    arp: null,
    pad: 3,
    stab: ['....x.......x...', '..x...x...x...x.', '..x...x...x...x.'],
    stabVoice: 'epiano',
    tom: 45,
  },
  // A pizzicato pedal and a drum that grows, for a tune that runs faster and faster.
  dark: {
    drums: {
      tom: ['x.......x.......', 'x...x...x...x...', null],
      kick: [null, 'x.......x.......', 'x...x...x...x...'],
      snare: [null, '....x.......x...', '....x.......x...'],
      clap: [null, null, '....x.......x...'],
      hat: [null, 'x.x.x.x.x.x.x.x.', 'xoxoxoxoxoxoxoxo'],
    },
    bass: ['r...r...r...r...', 'r.r.r.r.r.r.r.r.', 'r.ror.ror.ror.ro'],
    arp: null,
    pad: 2,
    stab: [null, null, '....x.......x...'],
    stabVoice: 'pluck',
    tom: 43,
  },
  // House: four on the floor, the bass on the off-beat, piano chords when it lifts.
  house: {
    drums: {
      kick: ['x...x...x...x...', 'x...x...x...x...', 'x...x...x...x...'],
      clap: [null, '....x.......x...', '....x.......x...'],
      hat: ['..x...x...x...x.', '.x.x.x.x.x.x.x.x', '.x.x.x.x.x.x.x.x'],
      openhat: [null, '..x...x...x...x.', '..x...x...x...x.'],
    },
    bass: ['..r...r...r...r.', '..r...r...r...r.', '..r.o.r...r.o.r.'],
    arp: null,
    pad: 1,
    stab: [null, null, 'x..x..x...x..x..'],
    stabVoice: 'epiano',
    tom: 45,
  },
  // Drum and bass: a broken beat at speed over a long, low bass, the tune at half the pace.
  dnb: {
    drums: {
      kick: ['x.........x.....', 'x.........x.....', 'x.........x..x..'],
      snare: [null, '....x.......x...', '....x.......x..o'],
      hat: ['..x...x...x...x.', 'x.x.x.x.x.x.x.x.', 'xoxoxoxoxoxoxoxo'],
    },
    bass: ['r-------r-------', 'r-------r---o---', 'r-----r-r---o-r-'],
    arp: { every: [0, 2, 2], order: 'updown' },
    pad: 1,
    stab: null,
    stabVoice: 'pluck',
    tom: 45,
  },
}
