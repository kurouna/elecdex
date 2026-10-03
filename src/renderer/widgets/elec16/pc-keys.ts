import { keyCode, keyForChar } from '@shared/elec16/keys'

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

export function pcKeyFate(event: PcKey): PcKeyFate {
  if (event.ctrlKey || event.altKey || event.metaKey) return { kind: 'pass' }
  if (event.code === 'Pause') return { kind: 'brk' }
  const named = NAMED[event.code]
  if (named !== undefined) return { kind: 'key', code: keyCode(named), shift: false }
  const letter = letterOf(event)
  if (letter !== null) return { kind: 'key', code: keyCode(letter), shift: event.shiftKey }
  // One character, and not a dead key or a name like "Tab".
  if ([...event.key].length !== 1) return { kind: 'pass' }
  const found = keyForChar(event.key)
  return found === null ? { kind: 'pass' } : { kind: 'key', code: found.code, shift: found.shift }
}
