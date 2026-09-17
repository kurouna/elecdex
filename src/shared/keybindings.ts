/**
 * App-wide keyboard shortcuts: the actions, their default chords, and the
 * user's overrides from settings.json.
 *
 * A chord is written as modifiers plus a KeyboardEvent.code - "Ctrl+Shift+KeyA",
 * "F11" - so it names a physical key and means the same on every keyboard
 * layout. "Ctrl" matches Ctrl or Cmd, as the shortcuts always have, so one
 * setting works on macOS too.
 *
 * Shortcuts are taken before the focused terminal sees the key, so a chord must
 * never be something a shell needs typed: every chord has Ctrl, Alt or Cmd, or
 * is a function key.
 */

export const KEYBINDING_ACTIONS = [
  { id: 'pane.add', label: 'Add a pane', chord: 'Ctrl+Shift+KeyA' },
  { id: 'pane.splitRight', label: 'Split right', chord: 'Ctrl+Shift+KeyE' },
  { id: 'pane.splitDown', label: 'Split down', chord: 'Ctrl+Shift+KeyO' },
  { id: 'pane.newTab', label: 'New tab', chord: 'Ctrl+Shift+KeyT' },
  { id: 'pane.close', label: 'Close pane', chord: 'Ctrl+Shift+KeyW' },
  { id: 'focus.next', label: 'Focus next pane', chord: 'Ctrl+Shift+BracketRight' },
  { id: 'focus.previous', label: 'Focus previous pane', chord: 'Ctrl+Shift+BracketLeft' },
  { id: 'layout.reset', label: 'Reset layout', chord: 'Ctrl+Shift+Backspace' },
  { id: 'launcher.focus', label: 'Search the launcher', chord: 'Ctrl+Shift+KeyL' },
  { id: 'shell.focus', label: 'Focus the shell', chord: 'Ctrl+Shift+KeyS' },
  { id: 'tab.next', label: 'Next tab', chord: 'Ctrl+Shift+ArrowRight' },
  { id: 'tab.previous', label: 'Previous tab', chord: 'Ctrl+Shift+ArrowLeft' },
  { id: 'shell.next', label: 'Next shell pane', chord: 'Ctrl+Alt+Shift+ArrowRight' },
  { id: 'shell.previous', label: 'Previous shell pane', chord: 'Ctrl+Alt+Shift+ArrowLeft' },
  { id: 'settings.open', label: 'Open settings', chord: 'Ctrl+Shift+Period' },
  { id: 'window.fullscreen', label: 'Toggle fullscreen', chord: 'F11' },
  {
    id: 'window.minimize',
    label: 'Minimize window',
    chord: 'Ctrl+Shift+KeyM',
    // macOS will not minimise a fullscreen window; its own controls do the rest.
    platforms: ['win32', 'linux'],
  },
  { id: 'app.quit', label: 'Quit', chord: 'Ctrl+Shift+KeyQ' },
] as const

export type KeybindingAction = (typeof KEYBINDING_ACTIONS)[number]['id']

/** Whether an action exists on this platform. Most do everywhere. */
export function availableOn(action: KeybindingAction, platform: NodeJS.Platform): boolean {
  const definition = KEYBINDING_ACTIONS.find((a) => a.id === action)
  if (definition === undefined) return false
  return (
    !('platforms' in definition) || (definition.platforms as readonly string[]).includes(platform)
  )
}

/** Per action: a chord, or null to leave the action without a shortcut. */
export type KeybindingOverrides = Partial<Record<KeybindingAction, string | null>>

const MODIFIERS = ['Ctrl', 'Alt', 'Shift'] as const
const FUNCTION_KEY = /^F([1-9]|1[0-9]|2[0-4])$/
const MODIFIER_CODES = new Set([
  'ControlLeft',
  'ControlRight',
  'ShiftLeft',
  'ShiftRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
])

/** Parses "Ctrl+Shift+KeyA" into its parts; null if it is not a usable chord. */
export function parseChord(
  chord: string,
): { ctrl: boolean; alt: boolean; shift: boolean; code: string } | null {
  const parts = chord.split('+')
  const code = parts.pop()
  if (!code || !/^[A-Za-z][A-Za-z0-9]*$/.test(code) || MODIFIER_CODES.has(code)) return null
  const mods = new Set(parts)
  if (mods.size !== parts.length) return null
  for (const mod of mods) if (!(MODIFIERS as readonly string[]).includes(mod)) return null
  const ctrl = mods.has('Ctrl')
  const alt = mods.has('Alt')
  // A shell needs every plain and Shift-ed key; only these are safe to take.
  if (!ctrl && !alt && !FUNCTION_KEY.test(code)) return null
  return { ctrl, alt, shift: mods.has('Shift'), code }
}

export const isValidChord = (chord: string): boolean => parseChord(chord) !== null

/** The chord a key event makes, in canonical order; null for a lone modifier or an unusable chord. */
export function chordFromEvent(event: {
  code: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}): string | null {
  if (MODIFIER_CODES.has(event.code) || event.code === '') return null
  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  parts.push(event.code)
  const chord = parts.join('+')
  return isValidChord(chord) ? chord : null
}

/** Puts modifiers in canonical order, so "Shift+Ctrl+KeyA" and "Ctrl+Shift+KeyA" compare equal. */
export function normalizeChord(chord: string): string | null {
  const parsed = parseChord(chord)
  if (!parsed) return null
  return [
    parsed.ctrl ? 'Ctrl' : null,
    parsed.alt ? 'Alt' : null,
    parsed.shift ? 'Shift' : null,
    parsed.code,
  ]
    .filter(Boolean)
    .join('+')
}

/** "Ctrl+Shift+KeyA" -> "Ctrl+Shift+A", "BracketRight" -> "]", for display. */
export function formatChord(chord: string): string {
  const KEY_NAMES: Record<string, string> = {
    BracketLeft: '[',
    BracketRight: ']',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  }
  return chord
    .split('+')
    .map((part) => KEY_NAMES[part] ?? part.replace(/^Key/, '').replace(/^Digit/, ''))
    .join('+')
}

/**
 * The chord in effect for each action: the user's override where valid, else the
 * default - and none for an action this platform does not have, so its chord is
 * neither taken from the shell nor reported as a clash.
 */
export function effectiveBindings(
  overrides: KeybindingOverrides,
  platform: NodeJS.Platform,
): Record<KeybindingAction, string | null> {
  const result = {} as Record<KeybindingAction, string | null>
  for (const action of KEYBINDING_ACTIONS) {
    const override = overrides[action.id]
    if (!availableOn(action.id, platform) || override === null) result[action.id] = null
    else if (typeof override === 'string')
      result[action.id] = normalizeChord(override) ?? action.chord
    else result[action.id] = action.chord
  }
  return result
}

/**
 * Chord -> action. Where two actions share a chord the first in the list keeps
 * it; `conflicts` reports the pairs so the settings UI can say so.
 */
export function keymap(
  overrides: KeybindingOverrides,
  platform: NodeJS.Platform,
): Map<string, KeybindingAction> {
  const map = new Map<string, KeybindingAction>()
  for (const [action, chord] of Object.entries(effectiveBindings(overrides, platform))) {
    if (chord !== null && !map.has(chord)) map.set(chord, action as KeybindingAction)
  }
  return map
}

/** Actions whose chord another action already uses, with the action that has it. */
export function conflicts(
  overrides: KeybindingOverrides,
  platform: NodeJS.Platform,
): Partial<Record<KeybindingAction, KeybindingAction>> {
  const owner = new Map<string, KeybindingAction>()
  const result: Partial<Record<KeybindingAction, KeybindingAction>> = {}
  for (const [action, chord] of Object.entries(effectiveBindings(overrides, platform))) {
    if (chord === null) continue
    const first = owner.get(chord)
    if (first) result[action as KeybindingAction] = first
    else owner.set(chord, action as KeybindingAction)
  }
  return result
}

/** The overrides after setting one action's chord; a chord equal to the default is dropped. */
export function withBinding(
  overrides: KeybindingOverrides,
  action: KeybindingAction,
  chord: string | null | undefined,
): KeybindingOverrides {
  const next: KeybindingOverrides = { ...overrides }
  const fallback = KEYBINDING_ACTIONS.find((a) => a.id === action)?.chord
  if (chord === undefined || chord === fallback) delete next[action]
  else next[action] = chord
  return next
}
