import { PAD_ALL, type PadButton, padBit } from '@shared/elec16/pad'
import type { PcKey } from './pc-keys.js'

/**
 * PLAY-320's buttons from the PC (docs/elec16-play.md section 6): which pad button a key held
 * on the PC's keyboard presses, and which the gamepads hold. Pure: the pane asks for a key's
 * fate on each keydown while it has the focus, and reads the gamepads while it is seen and
 * has the focus.
 */

/** A key's place (`event.code`) and the button it presses. */
export const PLAY_KEYS: Readonly<Record<string, PadButton>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyZ: 'a',
  KeyX: 'b',
  KeyS: 'x',
  KeyA: 'y',
  KeyQ: 'l',
  KeyW: 'r',
  Enter: 'start',
  NumpadEnter: 'start',
  ShiftRight: 'select',
}

export type PlayKeyFate = { kind: 'pass' } | { kind: 'brk' } | { kind: 'pad'; bit: number }

/**
 * By the key's place, so a keyboard of another layout presses the same buttons. Ctrl, Alt or
 * the system key, Tab, Escape and the function keys are never taken (the app's shortcuts and
 * the way out of the pane); Pause is BRK, as on the pocket models.
 */
export function playKeyFate(event: PcKey): PlayKeyFate {
  if (event.ctrlKey || event.altKey || event.metaKey) return { kind: 'pass' }
  if (event.code === 'Pause') return { kind: 'brk' }
  const button = PLAY_KEYS[event.code]
  return button === undefined ? { kind: 'pass' } : { kind: 'pad', bit: padBit(button) }
}

/** What a gamepad is to us: the Gamepad API's, read only. */
export interface GamepadLike {
  readonly connected: boolean
  readonly mapping: string
  readonly buttons: readonly { readonly pressed: boolean }[]
  readonly axes: readonly number[]
}

/**
 * The standard mapping's buttons by index, matched by where they sit: the right face button
 * is A, the bottom B, the top X and the left Y, as on the body (X above, Y left, A right, B
 * below); the shoulders L and R; Start and Back; the d-pad.
 */
export const GAMEPAD_BUTTONS: Readonly<Record<number, PadButton>> = {
  0: 'b',
  1: 'a',
  2: 'y',
  3: 'x',
  4: 'l',
  5: 'r',
  8: 'select',
  9: 'start',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
}

/** How far the left stick goes before it is the d-pad. */
export const STICK_DEADZONE = 0.5

/**
 * The buttons every connected gamepad of the standard mapping holds, together. One of
 * another mapping is left out: its buttons could be anything.
 */
export function gamepadBits(pads: readonly (GamepadLike | null)[]): number {
  let bits = 0
  for (const pad of pads) {
    if (pad === null || !pad.connected || pad.mapping !== 'standard') continue
    pad.buttons.forEach((b, k) => {
      const button = GAMEPAD_BUTTONS[k]
      if (b.pressed && button !== undefined) bits |= padBit(button)
    })
    const [x = 0, y = 0] = pad.axes
    if (x < -STICK_DEADZONE) bits |= padBit('left')
    if (x > STICK_DEADZONE) bits |= padBit('right')
    if (y < -STICK_DEADZONE) bits |= padBit('up')
    if (y > STICK_DEADZONE) bits |= padBit('down')
  }
  return bits & PAD_ALL
}
