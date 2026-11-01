/**
 * Keys as Windows' console reads them: win32-input-mode (architecture.md §6.4).
 *
 * ConPTY asks for it as it starts (`CSI ? 9001 h`). Without it, a key reaches a console program
 * as the VT text xterm.js makes of it, and ConPTY guesses the key back from that text on a US
 * layout: Ctrl+Space is sent as NUL and comes back as Ctrl+Shift+2, which Emacs on a Japanese
 * layout reads as C-" (measured, 2026-11-01); Ctrl+/ and Ctrl+. send nothing at all. In the
 * mode, each key goes as the key it is - `CSI Vk ; Sc ; Uc ; Kd ; Cs ; Rc _` - as Windows
 * Terminal sends it.
 *
 * A key this cannot describe for certain is left to xterm.js (null), which sends it as it did
 * before: what an input method is composing, a dead key, AltGr, a key with no known scan code.
 */

/** The parts of a KeyboardEvent the encoding reads. */
export interface KeyLike {
  type: string
  keyCode: number
  code: string
  key: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
  isComposing: boolean
  getModifierState(key: string): boolean
}

// dwControlKeyState's flags (wincon.h).
const RIGHT_ALT = 0x01
const LEFT_ALT = 0x02
const RIGHT_CTRL = 0x04
const LEFT_CTRL = 0x08
const SHIFT = 0x10
const NUM_LOCK = 0x20
const SCROLL_LOCK = 0x40
const CAPS_LOCK = 0x80
const ENHANCED_KEY = 0x100

/** Set-1 scan codes by `KeyboardEvent.code`: the key's place on the keyboard, any layout. */
const SCAN_CODES: Readonly<Record<string, number>> = {
  Escape: 0x01,
  Digit1: 0x02,
  Digit2: 0x03,
  Digit3: 0x04,
  Digit4: 0x05,
  Digit5: 0x06,
  Digit6: 0x07,
  Digit7: 0x08,
  Digit8: 0x09,
  Digit9: 0x0a,
  Digit0: 0x0b,
  Minus: 0x0c,
  Equal: 0x0d,
  Backspace: 0x0e,
  Tab: 0x0f,
  KeyQ: 0x10,
  KeyW: 0x11,
  KeyE: 0x12,
  KeyR: 0x13,
  KeyT: 0x14,
  KeyY: 0x15,
  KeyU: 0x16,
  KeyI: 0x17,
  KeyO: 0x18,
  KeyP: 0x19,
  BracketLeft: 0x1a,
  BracketRight: 0x1b,
  Enter: 0x1c,
  NumpadEnter: 0x1c,
  KeyA: 0x1e,
  KeyS: 0x1f,
  KeyD: 0x20,
  KeyF: 0x21,
  KeyG: 0x22,
  KeyH: 0x23,
  KeyJ: 0x24,
  KeyK: 0x25,
  KeyL: 0x26,
  Semicolon: 0x27,
  Quote: 0x28,
  Backquote: 0x29,
  Backslash: 0x2b,
  KeyZ: 0x2c,
  KeyX: 0x2d,
  KeyC: 0x2e,
  KeyV: 0x2f,
  KeyB: 0x30,
  KeyN: 0x31,
  KeyM: 0x32,
  Comma: 0x33,
  Period: 0x34,
  Slash: 0x35,
  NumpadDivide: 0x35,
  NumpadMultiply: 0x37,
  Space: 0x39,
  F1: 0x3b,
  F2: 0x3c,
  F3: 0x3d,
  F4: 0x3e,
  F5: 0x3f,
  F6: 0x40,
  F7: 0x41,
  F8: 0x42,
  F9: 0x43,
  F10: 0x44,
  Numpad7: 0x47,
  Home: 0x47,
  Numpad8: 0x48,
  ArrowUp: 0x48,
  Numpad9: 0x49,
  PageUp: 0x49,
  NumpadSubtract: 0x4a,
  Numpad4: 0x4b,
  ArrowLeft: 0x4b,
  Numpad5: 0x4c,
  Numpad6: 0x4d,
  ArrowRight: 0x4d,
  NumpadAdd: 0x4e,
  Numpad1: 0x4f,
  End: 0x4f,
  Numpad2: 0x50,
  ArrowDown: 0x50,
  Numpad3: 0x51,
  PageDown: 0x51,
  Numpad0: 0x52,
  Insert: 0x52,
  NumpadDecimal: 0x53,
  Delete: 0x53,
  IntlBackslash: 0x56,
  F11: 0x57,
  F12: 0x58,
  // The Japanese keyboard's own keys.
  IntlRo: 0x73,
  IntlYen: 0x7d,
  ContextMenu: 0x5d,
}

/** Keys Windows marks as extended: the ones apart from the numeric keypad that share its codes. */
const EXTENDED = new Set([
  'NumpadEnter',
  'NumpadDivide',
  'Home',
  'ArrowUp',
  'PageUp',
  'ArrowLeft',
  'ArrowRight',
  'End',
  'ArrowDown',
  'PageDown',
  'Insert',
  'Delete',
  'ContextMenu',
])

/** Keys that change others and are not sent alone (see `encodeWin32Key`). */
const MODIFIERS = new Set([
  'Shift',
  'Control',
  'Alt',
  'AltGraph',
  'Meta',
  'CapsLock',
  'NumLock',
  'ScrollLock',
])

/** The character Windows gives these keys, whatever the layout. */
const NAMED_CHARS: Readonly<Record<string, number>> = {
  Enter: 13,
  Tab: 9,
  Backspace: 8,
  Escape: 27,
}

/** The character the key makes, as Windows would give it: 0 where it makes none. */
function unicodeOf(event: KeyLike): number {
  const named = NAMED_CHARS[event.key]
  if (named !== undefined) return named
  // Ctrl with a letter is a control character; with anything else the program reads the key
  // itself (Emacs reads Ctrl+/ as C-/ from the key, measured), so nothing is guessed here.
  if (event.ctrlKey) return event.keyCode >= 65 && event.keyCode <= 90 ? event.keyCode - 64 : 0
  return event.key.length === 1 ? event.key.charCodeAt(0) : 0
}

function controlKeyState(event: KeyLike): number {
  let state = 0
  if (event.shiftKey) state |= SHIFT
  if (event.ctrlKey) state |= event.code === 'ControlRight' ? RIGHT_CTRL : LEFT_CTRL
  if (event.altKey) state |= event.code === 'AltRight' ? RIGHT_ALT : LEFT_ALT
  if (event.getModifierState('CapsLock')) state |= CAPS_LOCK
  if (event.getModifierState('NumLock')) state |= NUM_LOCK
  if (event.getModifierState('ScrollLock')) state |= SCROLL_LOCK
  if (EXTENDED.has(event.code)) state |= ENHANCED_KEY
  return state
}

/**
 * Whether the key is one the page takes as text rather than as a key: an input method at work,
 * a dead key, AltGr making a character, or the paste keys (pasted text goes through the paste
 * question, TerminalWidget's pasteChecked).
 */
function leftToXterm(event: KeyLike): boolean {
  if (event.isComposing || event.keyCode === 229) return true
  if (event.key === 'Process' || event.key === 'Dead' || event.key === 'Unidentified') return true
  if (event.getModifierState('AltGraph')) return true
  if (event.metaKey) return true
  if (event.shiftKey && event.code === 'Insert' && !event.ctrlKey && !event.altKey) return true
  return event.ctrlKey && event.shiftKey && event.code === 'KeyV'
}

/**
 * The key as win32-input-mode sends it, or null to leave it to xterm.js.
 *
 * Modifiers alone are not sent: Windows Terminal sends them, but no program needs them, and a
 * modifier held for a shortcut of elecdex's (Ctrl+Shift+] to the next pane) would reach the
 * shell going down and never coming up.
 */
export function encodeWin32Key(event: KeyLike): string | null {
  if (event.type !== 'keydown' && event.type !== 'keyup') return null
  if (MODIFIERS.has(event.key) || leftToXterm(event)) return null
  const vk = event.keyCode
  const scan = SCAN_CODES[event.code]
  if (scan === undefined || vk <= 0 || vk > 254) return null
  const down = event.type === 'keydown' ? 1 : 0
  return `\u001b[${vk};${scan};${unicodeOf(event)};${down};${controlKeyState(event)};1_`
}

/**
 * Keys pressed in win32-input-mode whose release is still to be sent: a release goes only for
 * a key whose press went, so a shortcut the workspace took on its press sends nothing on its
 * release.
 */
export class PressedKeys {
  private readonly down = new Set<string>()

  /** The sequence to send for this event, or null to send none and leave it to xterm.js. */
  take(event: KeyLike): string | null {
    const sequence = encodeWin32Key(event)
    if (sequence === null) return null
    if (event.type === 'keydown') {
      this.down.add(event.code)
      return sequence
    }
    return this.down.delete(event.code) ? sequence : ''
  }
}
