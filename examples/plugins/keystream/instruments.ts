import type { Voice } from '../elecdex-plugin'

/**
 * The instruments the keyboard plays, each on a key of the number row: 1 to 0, and the key
 * after 0 for the synthesiser bass. The same choice everywhere - the menu, a track, FREE PLAY
 * - so a player can change instrument in the middle of a song, and it is kept in the pane.
 *
 * The number row, because the row under the letters is the DAWs' (Z and X the octave, C and V
 * the strength, which FREE PLAY follows), and the digits are nobody's there.
 */

export interface Instrument {
  voice: Voice
  name: string
  /** The key that picks it (KeyboardEvent.code), and what that key prints on a US keyboard. */
  code: string
  key: string
}

export const INSTRUMENTS: readonly Instrument[] = [
  { voice: 'epiano', name: 'E.PIANO', code: 'Digit1', key: '1' },
  { voice: 'piano', name: 'PIANO', code: 'Digit2', key: '2' },
  { voice: 'guitar', name: 'GUITAR', code: 'Digit3', key: '3' },
  { voice: 'lead', name: 'SYNTH LEAD', code: 'Digit4', key: '4' },
  { voice: 'chip', name: 'CHIP', code: 'Digit5', key: '5' },
  { voice: 'organ', name: 'ORGAN', code: 'Digit6', key: '6' },
  { voice: 'marimba', name: 'MARIMBA', code: 'Digit7', key: '7' },
  { voice: 'ebass', name: 'E.BASS', code: 'Digit8', key: '8' },
  { voice: 'pad', name: 'PAD', code: 'Digit9', key: '9' },
  { voice: 'pluck', name: 'PLUCK', code: 'Digit0', key: '0' },
  { voice: 'bass', name: 'SYNTH BASS', code: 'Minus', key: '-' },
]

/** The instrument a key picks, by its place in the list; null for any other key. */
export function instrumentOfKey(code: string): number | null {
  const at = INSTRUMENTS.findIndex((i) => i.code === code)
  return at < 0 ? null : at
}

/** An instrument's place by its voice (a saved choice), or the first. */
export function instrumentOfVoice(voice: unknown): number {
  return Math.max(
    0,
    INSTRUMENTS.findIndex((i) => i.voice === voice),
  )
}
