import { parseChord } from './keybindings.js'
import type { Settings } from './settings.js'

/**
 * Running in the background (Windows): the notification-area icon, closing or
 * minimising to it, the system-wide show/hide shortcut and launching at sign-in.
 *
 * The decisions are pure so they can be tested without a window; main's
 * background/ folder carries them out. See docs/architecture.md section 16.
 */

/** Started with this switch (the sign-in entry adds it), the window stays hidden. */
export const HIDDEN_SWITCH = '--hidden'

/**
 * The registry value name of the sign-in entry, under HKCU's Run key. Fixed
 * rather than Electron's default so the uninstaller (build/installer.nsh) can
 * remove exactly this value.
 */
export const LOGIN_ITEM_NAME = 'dev.kurouna.elecdex'

/** Only Windows for now: the other platforms were not checked, so they show none of it. */
export const backgroundSupported = (platform: NodeJS.Platform): boolean => platform === 'win32'

export type WindowOptions = Settings['window']

/**
 * The icon is in the notification area while either tray option is on, or while
 * the window is hidden - so a hidden window can always be brought back from it.
 */
export const trayWanted = (options: WindowOptions, hidden: boolean): boolean =>
  options.minimizeToTray || options.closeToTray || hidden

/** What closing the window does: hide it to the notification area, or close it (and quit). */
export function decideClose(options: WindowOptions, quitting: boolean): 'hide' | 'close' {
  return options.closeToTray && !quitting ? 'hide' : 'close'
}

/**
 * Whether closing the window would put it away rather than end elecdex, which
 * the page needs to know: the fullscreen corner's close button asks before
 * quitting, but not before hiding - as the ordinary window's close button does
 * not either.
 */
export const closesToTray = (options: WindowOptions, platform: NodeJS.Platform): boolean =>
  backgroundSupported(platform) && options.closeToTray

/** What minimising does: hide it to the notification area, or leave it on the taskbar. */
export function decideMinimize(options: WindowOptions): 'hide' | 'minimize' {
  return options.minimizeToTray ? 'hide' : 'minimize'
}

export interface WindowFacts {
  visible: boolean
  minimized: boolean
  focused: boolean
}

/**
 * What the show/hide shortcut does. A window in front is put away - to the
 * notification area when a tray option is on, else to the taskbar; anything
 * else (hidden, minimised, behind another window) is brought to the front.
 */
export function decideToggle(
  options: WindowOptions,
  window: WindowFacts,
): 'show' | 'hide' | 'minimize' {
  if (!window.visible || window.minimized || !window.focused) return 'show'
  return options.minimizeToTray || options.closeToTray ? 'hide' : 'minimize'
}

/** Arguments of the sign-in entry. */
export const loginArgs = (startInBackground: boolean): string[] =>
  startInBackground ? [HIDDEN_SWITCH] : []

const NAMED_KEYS: Record<string, string> = {
  Space: 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
}

/** The Electron accelerator key for a KeyboardEvent.code; null for keys it cannot name reliably. */
function acceleratorKey(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter) return letter[1] ?? null
  const digit = /^Digit([0-9])$/.exec(code)
  if (digit) return digit[1] ?? null
  const numpad = /^Numpad([0-9])$/.exec(code)
  if (numpad) return `num${numpad[1]}`
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code
  return NAMED_KEYS[code] ?? null
}

/**
 * "Ctrl+Alt+Shift+KeyE" -> "CommandOrControl+Alt+Shift+E", for globalShortcut.
 *
 * Accelerators name keys by the character they type, not by position, so
 * punctuation - and keys such as Backquote, which is 半角/全角 on a Japanese
 * keyboard - would mean a different key on another layout. Only letters,
 * digits, function and named keys are accepted.
 */
export function chordToAccelerator(chord: string): string | null {
  const parsed = parseChord(chord)
  if (parsed === null) return null
  const key = acceleratorKey(parsed.code)
  if (key === null) return null
  return [
    parsed.ctrl ? 'CommandOrControl' : null,
    parsed.alt ? 'Alt' : null,
    parsed.shift ? 'Shift' : null,
    key,
  ]
    .filter(Boolean)
    .join('+')
}

/** The sign-in entry, as Windows has it. */
export interface LoginItemState {
  /** False where it cannot be set: other platforms, and a development run (it would register electron.exe). */
  available: boolean
  /** The entry exists. */
  registered: boolean
  /** The entry exists but is turned off in Task Manager's startup apps (or Windows Settings). */
  disabledByOs: boolean
}

export type ShortcutState =
  /** The option is off, or this platform has none. */
  | 'off'
  | 'registered'
  /** Another app holds the keys. */
  | 'taken'
  /** No chord, or one that cannot be a system-wide shortcut. */
  | 'invalid'

export interface ShortcutStatus {
  state: ShortcutState
  /** The chord in effect for window.toggle, registered or not. */
  chord: string | null
}

export interface BackgroundState {
  loginItem: LoginItemState
  shortcut: ShortcutStatus
}

/**
 * A Run-key entry for this executable, as Electron lists them
 * (LoginItemSettings.launchItems). Electron lists only entries for the path it
 * is asked about, and reports `args` empty whatever the value holds (seen with
 * Electron 44), so neither a moved install nor the arguments can be read back.
 */
export interface LaunchItem {
  name: string
  path: string
  args: string[]
  scope: 'user' | 'machine'
  enabled: boolean
}

/** Our own entry among the executable's Run-key entries: the per-user one under LOGIN_ITEM_NAME. */
export const ownLaunchItem = (items: readonly LaunchItem[]): LaunchItem | undefined =>
  items.find((item) => item.name === LOGIN_ITEM_NAME && item.scope === 'user')
