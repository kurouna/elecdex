import { keyCode, keyForChar } from '@shared/elec16/keys'
import type { PasteModes } from '@shared/elec16/paste'
import { ANNUNCIATORS } from '@shared/elec16/state'

/**
 * What a key pressed on the PC does to an ELEC-16 (docs/elec16.md section 7, key table).
 * Pure: the pane asks this for each keydown while it has the focus.
 *
 * A letter is the one the key types (`event.key`), or on a layout of other letters the one
 * at its place (`event.code`); its case is the machine's CAPS and the PC's Shift - never the
 * OS CapsLock state, which would act on top of the machine's CAPS. Other characters go by
 * `event.key`, with the machine's SHIFT when the character is on a key's shifted face.
 * Ctrl, Alt or the system key, Tab, Escape and the function keys are never taken: they are
 * the app's shortcuts and the way out of the pane (as for CHIP-8). Pause is BRK.
 *
 * In the machine's KANA mode a key goes by its place instead (`event.code`), as the JIS kana
 * layout has it: the PC key that types a kana presses the machine key that types the same one
 * (keys.ts, KANA_KEYS), whatever the PC's own input method is doing. Shift is the PC's.
 */

export type PcKeyFate =
  | { kind: 'pass' }
  | { kind: 'brk' }
  /** A machine key, held while the PC key is; `shift` whether the machine's SHIFT is wanted. */
  | { kind: 'key'; code: number; shift: boolean }

const NAMED: Readonly<Record<string, string>> = {
  Enter: 'enter',
  NumpadEnter: 'enter',
  Backspace: 'bs',
  Delete: 'del',
  Insert: 'ins',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Home: 'cls',
  CapsLock: 'caps',
  KanaMode: 'kana',
}

/** In KANA mode, the PC key at each place of the JIS layout that is not a letter: its machine key. */
const KANA_PLACES: Readonly<Record<string, string>> = {
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Digit0: '0',
  Minus: '-', // ﾎ
  Equal: '=', // ﾍ, the JIS layout's ^ key
  IntlYen: '*', // ｰ
  BracketLeft: '(', // ﾞ, the JIS layout's @ key
  BracketRight: ')', // ﾟ and ｢, its [ key
  Semicolon: ';', // ﾚ
  Quote: '+', // ｹ, its : key
  Backslash: 'kp/', // ﾑ and ｣, its ] key
  Comma: ',',
  Period: '.',
  Slash: '/',
  IntlRo: 'kp.', // ﾛ
}

export interface PcKey {
  code: string
  key: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}

/** The letter a key types, lower case, or null for a key that types none. */
function letterOf(event: PcKey): string | null {
  if (/^[a-z]$/i.test(event.key)) return event.key.toLowerCase()
  // A letter of another alphabet: the Latin one at the same place.
  const place = /^Key([A-Z])$/.exec(event.code)
  return place !== null && /^\p{L}$/u.test(event.key) ? (place[1] ?? 'A').toLowerCase() : null
}

const KANA_LAMP = 1 << ANNUNCIATORS.indexOf('KANA')

/** Whether the machine is in KANA mode: its annunciator is lit (the ROM keeps it so). */
export const kanaLit = (annunciators: number): boolean => (annunciators & KANA_LAMP) !== 0

const CAPS_LAMP = 1 << ANNUNCIATORS.indexOf('CAPS')

/** CAPS and KANA as the annunciators show them, for PASTE to plan its keys from. */
export const pasteModes = (annunciators: number): PasteModes => ({
  caps: (annunciators & CAPS_LAMP) !== 0,
  kana: kanaLit(annunciators),
})

/** `kana`: whether the machine is in KANA mode (`kanaLit`). */
export function pcKeyFate(event: PcKey, kana = false): PcKeyFate {
  if (event.ctrlKey || event.altKey || event.metaKey) return { kind: 'pass' }
  if (event.code === 'Pause') return { kind: 'brk' }
  const named = NAMED[event.code]
  if (named !== undefined) return { kind: 'key', code: keyCode(named), shift: false }
  if (kana) {
    const place = /^Key([A-Z])$/.exec(event.code)?.[1]?.toLowerCase() ?? KANA_PLACES[event.code]
    if (place !== undefined) return { kind: 'key', code: keyCode(place), shift: event.shiftKey }
  }
  const letter = letterOf(event)
  if (letter !== null) return { kind: 'key', code: keyCode(letter), shift: event.shiftKey }
  // One character, and not a dead key or a name like "Tab".
  if ([...event.key].length !== 1) return { kind: 'pass' }
  const found = keyForChar(event.key)
  return found === null ? { kind: 'pass' } : { kind: 'key', code: found.code, shift: found.shift }
}
