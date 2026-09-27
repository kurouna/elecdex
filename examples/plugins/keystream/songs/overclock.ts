import type { SongSource } from '../notation'

/**
 * OVERCLOCK - written for elecdex (GPL-3.0, as the rest of this repository).
 *
 * The fastest: drum and bass at 172 in A minor. The verse rides the beat at half its pace,
 * in long notes; the chorus goes to quavers, and the turn to E major reaches for G sharp (Y).
 */

const INTRO = '........|........|........|........'

const VERSE = ["h---;---|'---;-l-|;---k---|l---j---", "h---;---|'---;-l-|j---y---|d-------"]

const CHORUS = ["h-h-k-;-|'-;-l-k-|k-l-;-k-|l---j---", "h-h-k-;-|'-;-l-;-|y-j-k-j-|h-------"]

const BREAK = 'h-------|........|;-------|........'

const OUTRO = 'h-------|........'

const VERSE_CHORDS = 'Am | F | C | G | Am | F | E | E'
const CHORUS_CHORDS = 'Am | F | C | G | Am | F | E | Am'

export const song: SongSource = {
  id: 'overclock',
  title: 'OVERCLOCK',
  credit: 'elecdex',
  tempo: [{ bar: 0, bpm: 172 }],
  grid: 2,
  melody: [INTRO, ...VERSE, ...CHORUS, BREAK, ...VERSE, ...CHORUS, ...CHORUS, OUTRO],
  chords: [
    'Am | F | C | G',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    'Am | F | C | E',
    VERSE_CHORDS,
    CHORUS_CHORDS,
    CHORUS_CHORDS,
    'Am | Am',
  ],
  energy: '1122 22222222 33333333 1111 22222222 33333333 33333333 31',
  style: 'dnb',
}
