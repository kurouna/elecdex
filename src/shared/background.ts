import { parseChord } from './keybindings.js'
import type { Settings } from './settings.js'

/**
 * Running in the background: the icon outside the window, closing or minimising
 * to it, the system-wide show/hide shortcut and launching at sign-in.
 *
 * The decisions are pure so they can be tested without a window; main's
 * background/ folder carries them out. See docs/architecture.md section 16.
 *
 * What each platform can actually do differs enough that it is a fact rather
 * than a flag: macOS keeps an app running with no window open and has no notion
 * of minimising to the menu bar, and on Linux both the tray and the system-wide
 * shortcut depend on the desktop the user happens to be running. So the answer
 * is `backgroundCapabilities`, computed from what this machine can be seen to
 * have, and everything - main and the settings dialog alike - asks it rather
 * than the platform name.
 */

/** Started with this switch (the sign-in entry adds it), the window stays hidden. */
export const HIDDEN_SWITCH = '--hidden'

/**
 * The registry value name of the sign-in entry, under HKCU's Run key. Fixed
 * rather than Electron's default so the uninstaller (build/installer.nsh) can
 * remove exactly this value.
 */
export const LOGIN_ITEM_NAME = 'dev.kurouna.elecdex'

/** What can be seen about this machine, beyond which platform it is. */
export interface PlatformFacts {
  platform: NodeJS.Platform
  /**
   * Whether an icon outside the window can be shown. Windows and macOS always
   * can; on Linux it depends on the desktop - stock GNOME shows nothing without
   * an extension - so main tries and reports what happened.
   */
  trayAvailable?: boolean
  /**
   * A Wayland session. `globalShortcut.register` returns true there and the keys
   * never arrive, so the option is not offered rather than offered and dead.
   */
  wayland?: boolean
}

/** What running in the background means on this machine. */
export interface BackgroundCapabilities {
  /** An icon outside the window that brings it back. */
  tray: boolean
  /** Closing the window may put it away instead of ending elecdex. */
  closeToTray: boolean
  /** Minimising may put it away rather than leave it on the taskbar. */
  minimizeToTray: boolean
  /**
   * The app goes on running with no window open, and the platform itself brings
   * it back (macOS: the Dock, and the app menu). Where this is true, closing the
   * window is not the end of elecdex and needs no tray to be safe.
   */
  staysWithoutWindow: boolean
  /** The show/hide shortcut can be registered with the OS, and will fire. */
  globalShortcut: boolean
  launchAtLogin: boolean
  /** The sign-in entry can be told to start with the window hidden. */
  launchHidden: boolean
}

const NONE: BackgroundCapabilities = {
  tray: false,
  closeToTray: false,
  minimizeToTray: false,
  staysWithoutWindow: false,
  globalShortcut: false,
  launchAtLogin: false,
  launchHidden: false,
}

export function backgroundCapabilities(facts: PlatformFacts): BackgroundCapabilities {
  if (facts.platform === 'win32') {
    return {
      tray: true,
      closeToTray: true,
      minimizeToTray: true,
      staysWithoutWindow: false,
      globalShortcut: true,
      launchAtLogin: true,
      launchHidden: true,
    }
  }
  if (facts.platform === 'darwin') {
    return {
      ...NONE,
      tray: true,
      // macOS keeps the app in the Dock with no window open and brings it back
      // from there, so closing is already "put away" and minimising belongs to
      // the Dock. Taking either over would be a Windows habit worn on macOS.
      staysWithoutWindow: true,
      globalShortcut: true,
      launchAtLogin: true,
      // The login item is the app itself (SMAppService): no arguments to carry
      // a "start hidden" switch, unlike a Run key value or a .desktop file.
      launchHidden: false,
    }
  }
  if (facts.platform === 'linux') {
    // Without an icon to bring the window back from, putting it away would lose
    // it: the two options go together with the tray, not with the platform.
    const tray = facts.trayAvailable === true
    return {
      tray,
      closeToTray: tray,
      minimizeToTray: tray,
      staysWithoutWindow: false,
      globalShortcut: facts.wayland !== true,
      launchAtLogin: true,
      launchHidden: true,
    }
  }
  return NONE
}

/** Whether there is anything to offer at all: the settings section hangs on this. */
export const backgroundOffered = (capabilities: BackgroundCapabilities): boolean =>
  capabilities.closeToTray ||
  capabilities.minimizeToTray ||
  capabilities.globalShortcut ||
  capabilities.launchAtLogin

/**
 * A Wayland session, from the environment main was started in.
 *
 * `XDG_SESSION_TYPE` is what the session manager sets; `WAYLAND_DISPLAY` is
 * there for a compositor started by hand, which leaves the former unset.
 */
export function isWayland(env: Record<string, string | undefined>): boolean {
  if ((env.XDG_SESSION_TYPE ?? '').toLowerCase() === 'wayland') return true
  return (env.WAYLAND_DISPLAY ?? '') !== ''
}

export type WindowOptions = Settings['window']

/**
 * The icon is out there while the user asked for it, while either tray option is
 * on, or while the window is hidden - so a hidden window can always be brought
 * back from it.
 */
export const trayWanted = (options: WindowOptions, hidden: boolean): boolean =>
  options.trayIcon || options.minimizeToTray || options.closeToTray || hidden

/**
 * What the place outside the window is called here. Naming it "the notification
 * area" on macOS would send the user looking for something that is not there.
 */
export function trayName(platform: NodeJS.Platform): string {
  if (platform === 'darwin') return 'the menu bar'
  if (platform === 'win32') return 'the notification area'
  return 'the system tray'
}

/** Where the platform keeps the sign-in entry, so the settings can say where it was turned off. */
export function loginItemPlace(platform: NodeJS.Platform): string {
  if (platform === 'darwin') return 'System Settings, under General → Login Items'
  if (platform === 'win32') return "Task Manager's startup apps"
  return "your desktop's startup applications"
}

/** What signing in is called here, for the switch that starts elecdex with it. */
export function signInName(platform: NodeJS.Platform): string {
  if (platform === 'darwin') return 'you log in'
  if (platform === 'win32') return 'you sign in to Windows'
  return 'you log in'
}

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
export const closesToTray = (
  options: WindowOptions,
  capabilities: BackgroundCapabilities,
): boolean => capabilities.closeToTray && options.closeToTray

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
  /** The option is off. */
  | 'off'
  /** This machine cannot hold one at all (a Wayland session, an unknown platform). */
  | 'unavailable'
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
  /** What this machine can do, as main found it (the tray probe, the session). */
  capabilities: BackgroundCapabilities
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
