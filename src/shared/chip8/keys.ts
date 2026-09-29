/**
 * The keyboard as a CHIP-8 keypad (docs/architecture.md section 5.18).
 *
 * The COSMAC VIP's 4 x 4 keypad sits on the left of the keyboard, by position
 * (`KeyboardEvent.code`), so it is the same on every layout:
 *
 *   1 2 3 4        1 2 3 C
 *   Q W E R   ->   4 5 6 D
 *   A S D F        7 8 9 E
 *   Z X C V        A 0 B F
 *
 * The arrows and Space also press 5 7 8 9 and 6, as in Octo: chip8Archive's programs
 * were written in Octo, and many tell the player to use them. So the pane's own keys
 * are P (pause) and, while paused, Enter (one frame).
 *
 * A key held with Ctrl, Alt or the system key is never taken: those are the app's
 * shortcuts (keybindings.ts). Tab, Escape and the function keys are not taken either,
 * so the keyboard can always leave the pane and a pane brought forward can be put back.
 */

export const KEYPAD_CODES: Readonly<Record<string, number>> = {
  Digit1: 0x1,
  Digit2: 0x2,
  Digit3: 0x3,
  Digit4: 0xc,
  KeyQ: 0x4,
  KeyW: 0x5,
  KeyE: 0x6,
  KeyR: 0xd,
  KeyA: 0x7,
  KeyS: 0x8,
  KeyD: 0x9,
  KeyF: 0xe,
  KeyZ: 0xa,
  KeyX: 0x0,
  KeyC: 0xb,
  KeyV: 0xf,
}

/** Octo's second keys for the same pads. */
export const ALIAS_CODES: Readonly<Record<string, number>> = {
  ArrowUp: 0x5,
  ArrowLeft: 0x7,
  ArrowDown: 0x8,
  ArrowRight: 0x9,
  Space: 0x6,
}

export const PAUSE_CODE = 'KeyP'
export const STEP_CODE = 'Enter'

/** The keypad as it is drawn, row by row, with the keyboard key on each. */
export const KEYPAD_LAYOUT: readonly (readonly { key: number; code: string }[])[] = [
  ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV'],
].map((row) => row.map((code) => ({ key: KEYPAD_CODES[code] ?? 0, code })))

export interface KeyLike {
  code: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  isComposing: boolean
  repeat: boolean
}

export type KeyFate =
  | { kind: 'pad'; key: number }
  | { kind: 'pause' }
  | { kind: 'step' }
  /** A held key repeating: taken from the page, since its first press was ours, and dropped. */
  | { kind: 'swallow' }
  /** Not ours: the app's shortcuts, Tab, Escape, and anything else. */
  | { kind: 'pass' }

/** The pad a key presses, or null. */
export function padOf(code: string): number | null {
  return KEYPAD_CODES[code] ?? ALIAS_CODES[code] ?? null
}

/** What becomes of a key pressed while a CHIP-8 pane has the keyboard. */
export function keyFate(event: KeyLike, paused: boolean): KeyFate {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return { kind: 'pass' }
  const pad = padOf(event.code)
  if (pad !== null) return event.repeat ? { kind: 'swallow' } : { kind: 'pad', key: pad }
  if (event.code === PAUSE_CODE) return event.repeat ? { kind: 'swallow' } : { kind: 'pause' }
  if (event.code === STEP_CODE && paused) return { kind: 'step' }
  return { kind: 'pass' }
}
