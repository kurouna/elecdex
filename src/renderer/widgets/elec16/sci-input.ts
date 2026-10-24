import { sciKeyCode } from '@shared/elec16/sci-keys'
import type { PcKey } from './pc-keys.js'

/**
 * SCI-128's keys from the PC (docs/elec16-sci.md section 5.3): which calculator key a key
 * typed on the PC's keyboard presses, and whether after SHIFT. Pure: the pane asks for a key's
 * fate on each keydown while it has the focus, as pc-keys.ts and play-input.ts are asked.
 */

export type SciKeyFate =
  | { kind: 'pass' }
  | { kind: 'brk' }
  | { kind: 'key'; code: number; shift: boolean }

/** By the place of the keys that type nothing (`event.code`). */
const BY_PLACE: Readonly<Record<string, string>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'eq',
  NumpadEnter: 'eq',
  Backspace: 'del',
  Delete: 'ac',
}

/**
 * By the character typed (`event.key`), so a keyboard of any layout types its own digits and
 * signs; the letters are the functions' first letters. `!` and `r` are SHIFT faces: x! on x⁻¹,
 * √ on x².
 */
const BY_CHARACTER: Readonly<Record<string, readonly [string, boolean]>> = {
  '0': ['0', false],
  '1': ['1', false],
  '2': ['2', false],
  '3': ['3', false],
  '4': ['4', false],
  '5': ['5', false],
  '6': ['6', false],
  '7': ['7', false],
  '8': ['8', false],
  '9': ['9', false],
  '.': ['dot', false],
  '+': ['add', false],
  '-': ['sub', false],
  '*': ['mul', false],
  '/': ['div', false],
  '^': ['pow', false],
  '(': ['lp', false],
  ')': ['rp', false],
  '=': ['eq', false],
  s: ['sin', false],
  c: ['cos', false],
  t: ['tan', false],
  l: ['ln', false],
  g: ['log', false],
  f: ['frac', false],
  e: ['exp', false],
  r: ['sq', true],
  '!': ['inv', true],
}

/**
 * Ctrl, Alt or the system key, Tab, Escape and the function keys are never taken (the app's
 * shortcuts and the way out of the pane); Pause is ON (BRK), as on the other models.
 */
export function sciKeyFate(event: PcKey): SciKeyFate {
  if (event.ctrlKey || event.altKey || event.metaKey) return { kind: 'pass' }
  if (event.code === 'Pause') return { kind: 'brk' }
  const placed = BY_PLACE[event.code]
  if (placed !== undefined) return { kind: 'key', code: sciKeyCode(placed), shift: false }
  const typed = BY_CHARACTER[event.key]
  if (typed === undefined) return { kind: 'pass' }
  return { kind: 'key', code: sciKeyCode(typed[0]), shift: typed[1] }
}
