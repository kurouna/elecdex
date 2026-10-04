import { PAD_ALL, PAD_BUTTONS, padBit } from '@shared/elec16/pad'
import { describe, expect, it } from 'vitest'
import {
  GAMEPAD_BUTTONS,
  type GamepadLike,
  gamepadBits,
  PLAY_KEYS,
  playKeyFate,
  STICK_DEADZONE,
} from '../../src/renderer/widgets/elec16/play-input'

/**
 * PLAY-320's buttons from the PC (docs/elec16-play.md section 6): the keys by their place, the
 * standard gamepad by where its buttons sit - and nothing of the app's own keys taken.
 */

const key = (
  code: string,
  over: Partial<{ ctrl: boolean; alt: boolean; meta: boolean; shift: boolean }> = {},
) => ({
  code,
  key: '',
  shiftKey: over.shift ?? false,
  ctrlKey: over.ctrl ?? false,
  altKey: over.alt ?? false,
  metaKey: over.meta ?? false,
})

describe('the PC keys on PLAY-320', () => {
  it('press the buttons the spec names', () => {
    const want: Record<string, string> = {
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
      ShiftRight: 'select',
    }
    for (const [code, button] of Object.entries(want)) {
      expect(playKeyFate(key(code)), code).toEqual({ kind: 'pad', bit: padBit(button as never) })
    }
    expect(playKeyFate(key('NumpadEnter'))).toEqual({ kind: 'pad', bit: padBit('start') })
  })

  it('reach every button, one key each but START', () => {
    const pressed = new Set(Object.values(PLAY_KEYS))
    expect([...pressed].sort()).toEqual([...PAD_BUTTONS].sort())
  })

  it('go by place, whatever the key types', () => {
    expect(playKeyFate({ ...key('KeyZ'), key: 'y' })).toEqual({ kind: 'pad', bit: padBit('a') })
    expect(playKeyFate({ ...key('KeyA'), key: 'q' })).toEqual({ kind: 'pad', bit: padBit('y') })
    // Shift held with a button key is still the button (a game's two buttons at once).
    expect(playKeyFate(key('KeyX', { shift: true }))).toEqual({ kind: 'pad', bit: padBit('b') })
  })

  it("take Pause as BRK and leave the app's keys alone", () => {
    expect(playKeyFate(key('Pause'))).toEqual({ kind: 'brk' })
    for (const code of ['Tab', 'Escape', 'F1', 'F12', 'ShiftLeft', 'Space', 'KeyD', 'Digit1']) {
      expect(playKeyFate(key(code)), code).toEqual({ kind: 'pass' })
    }
    for (const over of [{ ctrl: true }, { alt: true }, { meta: true }]) {
      expect(playKeyFate(key('KeyZ', over)), JSON.stringify(over)).toEqual({ kind: 'pass' })
      expect(playKeyFate(key('ArrowUp', over))).toEqual({ kind: 'pass' })
    }
  })
})

function gamepad(
  pressed: number[],
  axes: number[] = [0, 0, 0, 0],
  over: Partial<GamepadLike> = {},
): GamepadLike {
  return {
    connected: true,
    mapping: 'standard',
    buttons: Array.from({ length: 17 }, (_, k) => ({ pressed: pressed.includes(k) })),
    axes,
    ...over,
  }
}

describe('a gamepad on PLAY-320', () => {
  it('matches the standard face buttons by where they sit: right A, bottom B, top X, left Y', () => {
    expect(gamepadBits([gamepad([1])])).toBe(padBit('a'))
    expect(gamepadBits([gamepad([0])])).toBe(padBit('b'))
    expect(gamepadBits([gamepad([3])])).toBe(padBit('x'))
    expect(gamepadBits([gamepad([2])])).toBe(padBit('y'))
  })

  it('has the shoulders, Start and Back, and the d-pad', () => {
    expect(gamepadBits([gamepad([4, 5])])).toBe(padBit('l') | padBit('r'))
    expect(gamepadBits([gamepad([9])])).toBe(padBit('start'))
    expect(gamepadBits([gamepad([8])])).toBe(padBit('select'))
    expect(gamepadBits([gamepad([12, 13, 14, 15])])).toBe(
      padBit('up') | padBit('down') | padBit('left') | padBit('right'),
    )
    // Every button of the pad is one a gamepad reaches.
    expect(new Set(Object.values(GAMEPAD_BUTTONS)).size).toBe(PAD_BUTTONS.length)
  })

  it('leaves out the triggers, the stick presses and the home button', () => {
    expect(gamepadBits([gamepad([6, 7, 10, 11, 16])])).toBe(0)
  })

  it('takes the left stick past half way as the d-pad, the right stick never', () => {
    const past = STICK_DEADZONE + 0.01
    expect(gamepadBits([gamepad([], [-past, 0])])).toBe(padBit('left'))
    expect(gamepadBits([gamepad([], [past, past])])).toBe(padBit('right') | padBit('down'))
    expect(gamepadBits([gamepad([], [0, -past])])).toBe(padBit('up'))
    expect(gamepadBits([gamepad([], [STICK_DEADZONE, -STICK_DEADZONE])])).toBe(0)
    expect(gamepadBits([gamepad([], [0, 0, -1, 1])])).toBe(0)
  })

  it('puts every pad together, and leaves out one disconnected or of another mapping', () => {
    expect(gamepadBits([gamepad([1]), null, gamepad([9])])).toBe(padBit('a') | padBit('start'))
    expect(gamepadBits([gamepad([1], undefined, { connected: false })])).toBe(0)
    expect(gamepadBits([gamepad([1], undefined, { mapping: '' })])).toBe(0)
    expect(gamepadBits([])).toBe(0)
    expect(
      gamepadBits([
        gamepad(
          Array.from({ length: 17 }, (_, k) => k),
          [-1, -1],
        ),
      ]) & ~PAD_ALL,
    ).toBe(0)
  })
})
