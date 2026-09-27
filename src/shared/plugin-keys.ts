/**
 * Keys for plugins (docs/plugins.md section 13): which keys a focused plugin pane is given,
 * and what they print. Pure, so the pane and the tests share one rule.
 *
 * A plugin is given a key only while one of its panes has the keyboard, and never a key held
 * with Ctrl, Alt or the system key: those are the app's shortcuts (keybindings.ts), and a
 * plugin must not be able to take them. Tab is not given either, so the keyboard can always
 * leave the pane.
 */

const LETTERS = Array.from({ length: 26 }, (_, i) => `Key${String.fromCharCode(65 + i)}`)
const DIGITS = Array.from({ length: 10 }, (_, i) => `Digit${i}`)

/** Punctuation and named keys, with what a US keyboard prints on them. */
const NAMED: Readonly<Record<string, string>> = {
  Space: 'SPACE',
  Enter: 'ENTER',
  Escape: 'ESC',
  Backspace: 'BS',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
  IntlRo: '\\',
  IntlYen: '¥',
  IntlBackslash: '\\',
}

/** Every KeyboardEvent.code a plugin can be given. */
export const PLUGIN_KEY_CODES: readonly string[] = [...LETTERS, ...DIGITS, ...Object.keys(NAMED)]
const CODES = new Set(PLUGIN_KEY_CODES)

/** The keys that name a place rather than print a character: the layout map leaves them out. */
const NAMED_ONLY = new Set([
  'Space',
  'Enter',
  'Escape',
  'Backspace',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])

export interface KeyEventLike {
  code: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  isComposing: boolean
  repeat: boolean
}

/**
 * What becomes of a key pressed in a plugin pane that has the keyboard: 'deliver' to the
 * plugin; 'swallow' a held key repeating (taken from the page, since its first press was the
 * plugin's, but not passed on); or 'pass' it to the app untouched.
 */
export function keyFate(event: KeyEventLike): 'deliver' | 'swallow' | 'pass' {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return 'pass'
  if (!CODES.has(event.code)) return 'pass'
  return event.repeat ? 'swallow' : 'deliver'
}

/** What a US keyboard prints on a key. */
export function usLabel(code: string): string {
  if (code.startsWith('Key') && code.length === 4) return code.slice(3)
  if (code.startsWith('Digit') && code.length === 6) return code.slice(5)
  return NAMED[code] ?? code
}

/**
 * The label of every plugin key on this keyboard: what the system's layout map says it
 * prints, in capitals, or the US label where it says nothing (named keys, or no map at all).
 */
export function keyLabels(layout: ReadonlyMap<string, string> | null): Record<string, string> {
  const labels: Record<string, string> = {}
  for (const code of PLUGIN_KEY_CODES) {
    const printed = NAMED_ONLY.has(code) ? undefined : layout?.get(code)
    labels[code] =
      printed !== undefined && printed.trim() !== '' ? printed.toUpperCase() : usLabel(code)
  }
  return labels
}

export const isPluginKey = (code: unknown): code is string =>
  typeof code === 'string' && CODES.has(code)
