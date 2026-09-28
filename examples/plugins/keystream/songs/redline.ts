import type { Band } from '../arrange'
import { barsIn, type SongSource } from '../notation'
import {
  BASS_LAST,
  BASS_LONG,
  BASS_OFFBEATS,
  EIGHTHS,
  KICK_4,
  OFFBEATS,
  ONE,
  QUARTERS,
  SIXTEENTHS,
  SNARE_24,
  times,
} from './parts'

/**
 * REDLINE - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * J-core at 200 in A minor, the fastest of them, and made to be hammered: the drop is one
 * key struck in a three-three-two rhythm, a key a chord (E, F, D, E: ; ' L ;, side by side),
 * the way a trance riff repeats its note. The verse keeps every beat on A (H) with the tune
 * on the 'and's, and the build strikes one key in quarters, then eighths. So EASY, which
 * plays only the beats, is one key in time throughout; the last drop fills all four beats.
 */

const INTRO = '........|........|........|........'

const VERSE = ['h.h;h.hl|h.hkh.h.|h.hlh.hj|h.h.y-j-', "h.h;h.hl|h.hkh.h'|h.hjh.hl|h.hjy-j-"]

const BUILD = 'l.l.l.l.|l.l.llll|j.j.jjjj|jjjj;---'

/** Three, three and two on one key a bar: the beats one, two and four for EASY. */
const DROP = [";.;;.;;.|'.''.''.|l.ll.ll.|;.;;.;;;", ";.;;.;;.|'.''.''.|l.ll.ll.|j.jjy.;."]

/** The last drop, pushed: every beat struck. */
const DROP_2 = [";.;;;.;;|'.'''.''|l.lll.ll|;.;;;.;;", ";.;;;.;;|'.'''.''|l.lll.ll|j.jjy.y."]

const OUTRO = 'h-------|........'

const LOOP = 'Am | F | G | E | Am | F | G | E'
/** The verse's A held over E as a suspension, resolving to G sharp (Y) on the third beat. */
const VERSE_CHORDS = 'Am | F | G | Esus4 E | Am | F | G | Esus4 E'

/** The drop's arpeggio, in sixteenths: at 200, a shimmer over the kick. */
const ARP_16 = 'xxxxxxxxxxxxxxxx'

/**
 * Hardcore's engine: four to the floor with the bass on every 'and' between the kicks, an
 * open hat over it, and a build whose snare goes from quarters to eighths to sixteenths.
 */
const BAND: Band = {
  sections: {
    I: { kick: KICK_4, hat: OFFBEATS, bass: BASS_LONG, pad: true },
    V: { kick: KICK_4, snare: SNARE_24, hat: EIGHTHS, bass: BASS_OFFBEATS, pad: true },
    B: { kick: KICK_4, snare: QUARTERS, bass: BASS_LONG, pad: true },
    U: { kick: KICK_4, snare: EIGHTHS, bass: BASS_LONG, pad: true },
    R: { kick: KICK_4, snare: SIXTEENTHS, bass: BASS_LONG, pad: true },
    D: {
      kick: KICK_4,
      snare: SNARE_24,
      clap: SNARE_24,
      hat: SIXTEENTHS,
      openhat: OFFBEATS,
      bass: BASS_OFFBEATS,
      arp: ARP_16,
      pad: true,
    },
    O: { kick: ONE, bass: BASS_LAST, pad: true },
    E: {},
  },
  form: `${times('I', 3)} I! | ${times('V', 7)} V! | B U R R! | D* ${times('D', 7)} | ${times('V', 7)} V! | B U R R! | D* ${times('D', 7)} | D* ${times('D', 7)} | O* E`,
  arp: 'lead',
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
  melody: [INTRO, ...VERSE, BUILD, ...DROP, ...VERSE, BUILD, ...DROP, ...DROP_2, OUTRO],
  chords: [
    'Am | F | G | E',
    VERSE_CHORDS,
    'Dm | Dm | E | E',
    LOOP,
    VERSE_CHORDS,
    'Dm | Dm | E | E',
    LOOP,
    LOOP,
    'Am | Am',
  ],
  band: BAND,
}
