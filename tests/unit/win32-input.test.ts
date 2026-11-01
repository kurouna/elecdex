import { describe, expect, it } from 'vitest'
import {
  encodeWin32Key,
  type KeyLike,
  PressedKeys,
} from '../../src/renderer/widgets/terminal/win32-input.js'
import { win32ModeChange } from '../../src/shared/win32-input-mode.js'

/**
 * Keys as win32-input-mode sends them (widgets/terminal/win32-input.ts). The sequences below
 * were measured against Emacs 31.1 (-nw) under ConPTY on a Japanese layout, 2026-11-01: each
 * reads as the key named. Through xterm's text, Ctrl+Space read as C-".
 */

const key = (over: Partial<KeyLike> & Pick<KeyLike, 'keyCode' | 'code' | 'key'>): KeyLike => {
  const locks = new Set<string>()
  return {
    type: 'keydown',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    isComposing: false,
    getModifierState: (k) => locks.has(k),
    ...over,
  }
}

const SPACE = { keyCode: 32, code: 'Space', key: ' ' }

describe('encodeWin32Key', () => {
  it('sends Ctrl+Space as the space key with Ctrl, not as NUL', () => {
    expect(encodeWin32Key(key({ ...SPACE, ctrlKey: true }))).toBe('\u001b[32;57;0;1;8;1_')
    expect(encodeWin32Key(key({ ...SPACE, ctrlKey: true, type: 'keyup' }))).toBe(
      '\u001b[32;57;0;0;8;1_',
    )
    // C-M-SPC: Ctrl and Alt together.
    expect(encodeWin32Key(key({ ...SPACE, ctrlKey: true, altKey: true }))).toBe(
      '\u001b[32;57;0;1;10;1_',
    )
  })

  it('sends the keys xterm makes no text of', () => {
    // Ctrl+/ and Ctrl+.: xterm sent nothing for either.
    expect(encodeWin32Key(key({ keyCode: 191, code: 'Slash', key: '/', ctrlKey: true }))).toBe(
      '\u001b[191;53;0;1;8;1_',
    )
    expect(encodeWin32Key(key({ keyCode: 190, code: 'Period', key: '.', ctrlKey: true }))).toBe(
      '\u001b[190;52;0;1;8;1_',
    )
  })

  it('gives a character as Windows would: a control character for Ctrl with a letter', () => {
    expect(encodeWin32Key(key({ keyCode: 65, code: 'KeyA', key: 'a' }))).toBe(
      '\u001b[65;30;97;1;0;1_',
    )
    expect(encodeWin32Key(key({ keyCode: 65, code: 'KeyA', key: 'A', shiftKey: true }))).toBe(
      '\u001b[65;30;65;1;16;1_',
    )
    expect(encodeWin32Key(key({ keyCode: 65, code: 'KeyA', key: 'a', ctrlKey: true }))).toBe(
      '\u001b[65;30;1;1;8;1_',
    )
    expect(encodeWin32Key(key({ keyCode: 88, code: 'KeyX', key: 'x', altKey: true }))).toBe(
      '\u001b[88;45;120;1;2;1_',
    )
    expect(encodeWin32Key(key({ keyCode: 13, code: 'Enter', key: 'Enter' }))).toBe(
      '\u001b[13;28;13;1;0;1_',
    )
    expect(encodeWin32Key(key({ keyCode: 8, code: 'Backspace', key: 'Backspace' }))).toBe(
      '\u001b[8;14;8;1;0;1_',
    )
  })

  it("takes a Japanese layout's keys by the key code and place the page reports", () => {
    // ':' is VK_OEM_1 on a Japanese layout, on the key a US layout calls Quote.
    expect(encodeWin32Key(key({ keyCode: 186, code: 'Quote', key: ':' }))).toBe(
      '\u001b[186;40;58;1;0;1_',
    )
    // C-_ on the ろ key.
    expect(
      encodeWin32Key(
        key({ keyCode: 226, code: 'IntlRo', key: '_', ctrlKey: true, shiftKey: true }),
      ),
    ).toBe('\u001b[226;115;0;1;24;1_')
  })

  it('marks the extended keys, and the right-hand Ctrl and Alt', () => {
    expect(encodeWin32Key(key({ keyCode: 37, code: 'ArrowLeft', key: 'ArrowLeft' }))).toBe(
      '\u001b[37;75;0;1;256;1_',
    )
    // The keypad's 4 is the same scan code, not extended.
    expect(encodeWin32Key(key({ keyCode: 100, code: 'Numpad4', key: '4' }))).toBe(
      '\u001b[100;75;52;1;0;1_',
    )
    const locks = (on: string) => (k: string) => k === on
    expect(
      encodeWin32Key(
        key({ keyCode: 65, code: 'KeyA', key: 'A', getModifierState: locks('CapsLock') }),
      ),
    ).toBe('\u001b[65;30;65;1;128;1_')
  })

  it('leaves to xterm what is text rather than a key, or what it cannot describe', () => {
    const left: KeyLike[] = [
      // An input method composing, and its keys.
      key({ keyCode: 229, code: 'KeyA', key: 'Process' }),
      key({ ...SPACE, isComposing: true }),
      // A dead key, and AltGr making a character.
      key({ keyCode: 222, code: 'Quote', key: 'Dead' }),
      key({
        keyCode: 69,
        code: 'KeyE',
        key: '€',
        ctrlKey: true,
        altKey: true,
        getModifierState: (k) => k === 'AltGraph',
      }),
      // The paste keys, which go through the paste question.
      key({ keyCode: 86, code: 'KeyV', key: 'V', ctrlKey: true, shiftKey: true }),
      key({ keyCode: 45, code: 'Insert', key: 'Insert', shiftKey: true }),
      // Modifiers alone, and the Windows key.
      key({ keyCode: 17, code: 'ControlLeft', key: 'Control', ctrlKey: true }),
      key({ keyCode: 16, code: 'ShiftLeft', key: 'Shift', shiftKey: true }),
      key({ keyCode: 65, code: 'KeyA', key: 'a', metaKey: true }),
      // A key with no scan code known, and a keypress.
      key({ keyCode: 173, code: 'AudioVolumeMute', key: 'AudioVolumeMute' }),
      key({ ...SPACE, type: 'keypress' }),
    ]
    for (const event of left) expect(encodeWin32Key(event), event.key).toBeNull()
  })
})

describe('PressedKeys', () => {
  it('sends a release only for a key whose press it sent', () => {
    const pressed = new PressedKeys()
    const slash = { keyCode: 221, code: 'BracketRight', key: ']', ctrlKey: true, shiftKey: true }
    // The workspace took the press (Ctrl+Shift+], the next pane): the release here sends nothing.
    expect(pressed.take(key({ ...slash, type: 'keyup' }))).toBe('')
    expect(pressed.take(key({ ...SPACE, ctrlKey: true }))).toBe('\u001b[32;57;0;1;8;1_')
    expect(pressed.take(key({ ...SPACE, ctrlKey: true, type: 'keyup' }))).toBe(
      '\u001b[32;57;0;0;8;1_',
    )
    expect(pressed.take(key({ ...SPACE, type: 'keyup' }))).toBe('')
    // What it leaves to xterm stays xterm's.
    expect(pressed.take(key({ keyCode: 229, code: 'KeyA', key: 'Process' }))).toBeNull()
  })
})

describe('win32ModeChange', () => {
  it('reads the mode among the others a DECSET or DECRST names', () => {
    expect(win32ModeChange([9001], true)).toBe(true)
    expect(win32ModeChange([1004, 9001], false)).toBe(false)
    expect(win32ModeChange([1049], true)).toBeUndefined()
  })
})
