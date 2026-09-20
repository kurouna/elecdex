import { describe, expect, it, vi } from 'vitest'
import {
  type BackgroundCapabilities,
  backgroundCapabilities,
  backgroundOffered,
  chordToAccelerator,
  closesToTray,
  decideClose,
  decideMinimize,
  decideToggle,
  HIDDEN_SWITCH,
  isWayland,
  type LaunchItem,
  LOGIN_ITEM_NAME,
  loginArgs,
  loginItemPlace,
  ownLaunchItem,
  trayName,
  trayWanted,
  type WindowOptions,
} from '../../src/shared/background.js'

vi.mock('electron', () => ({
  app: { isPackaged: false, getLoginItemSettings: () => ({}), setLoginItemSettings: () => {} },
  globalShortcut: { register: () => true, unregister: () => {} },
}))

const { createGlobalToggle, StubRegistry } = await import(
  '../../src/main/background/global-shortcut.js'
)
const { StubRunKey } = await import('../../src/main/background/login/stub.js')
const { windowsLoginBackend } = await import('../../src/main/background/login/windows.js')
const createLoginItems = (runKey: InstanceType<typeof StubRunKey>) =>
  windowsLoginBackend(true, runKey)

const caps = (platform: NodeJS.Platform, facts = {}): BackgroundCapabilities =>
  backgroundCapabilities({ platform, ...facts })

const OFF: WindowOptions = {
  trayIcon: false,
  minimizeToTray: false,
  closeToTray: false,
  globalShortcut: false,
  startInBackground: false,
}
const on = (change: Partial<WindowOptions>): WindowOptions => ({ ...OFF, ...change })

describe('what a machine can do in the background', () => {
  it('gives Windows all of it', () => {
    expect(caps('win32')).toEqual({
      tray: true,
      closeToTray: true,
      minimizeToTray: true,
      staysWithoutWindow: false,
      globalShortcut: true,
      launchAtLogin: true,
      launchHidden: true,
    })
  })

  it('leaves closing and minimising to macOS, which keeps the app without a window', () => {
    const mac = caps('darwin')
    expect(mac.staysWithoutWindow).toBe(true)
    expect(mac.closeToTray).toBe(false)
    expect(mac.minimizeToTray).toBe(false)
    // The menu bar icon and the shortcut are still on offer.
    expect(mac.tray).toBe(true)
    expect(mac.globalShortcut).toBe(true)
    // The login item is the app itself: no arguments, so no "start hidden".
    expect(mac.launchAtLogin).toBe(true)
    expect(mac.launchHidden).toBe(false)
  })

  it('ties putting the window away on Linux to there being an icon to bring it back from', () => {
    expect(caps('linux', { trayAvailable: true }).closeToTray).toBe(true)
    expect(caps('linux', { trayAvailable: true }).minimizeToTray).toBe(true)
    const noTray = caps('linux', { trayAvailable: false })
    expect(noTray.tray).toBe(false)
    expect(noTray.closeToTray).toBe(false)
    expect(noTray.minimizeToTray).toBe(false)
    // Not knowing is not the same as knowing there is one.
    expect(caps('linux').closeToTray).toBe(false)
  })

  it('does not offer a shortcut a Wayland session would swallow', () => {
    expect(caps('linux', { trayAvailable: true, wayland: true }).globalShortcut).toBe(false)
    expect(caps('linux', { trayAvailable: true, wayland: false }).globalShortcut).toBe(true)
    // The sign-in entry is a file, and does not depend on the session.
    expect(caps('linux', { wayland: true }).launchAtLogin).toBe(true)
    expect(caps('linux', { wayland: true }).launchHidden).toBe(true)
  })

  it('offers nothing on a platform it does not know', () => {
    expect(backgroundOffered(caps('freebsd'))).toBe(false)
    expect(backgroundOffered(caps('win32'))).toBe(true)
    expect(backgroundOffered(caps('darwin'))).toBe(true)
    // Linux with no tray still has the shortcut and the sign-in entry.
    expect(backgroundOffered(caps('linux', { trayAvailable: false }))).toBe(true)
  })

  it('names the place outside the window as the platform does', () => {
    expect(trayName('win32')).toBe('the notification area')
    expect(trayName('darwin')).toBe('the menu bar')
    expect(trayName('linux')).toBe('the system tray')
    expect(loginItemPlace('win32')).toContain('Task Manager')
    expect(loginItemPlace('darwin')).toContain('System Settings')
    expect(loginItemPlace('linux')).toContain('startup applications')
  })

  it('reads a Wayland session out of the environment', () => {
    expect(isWayland({ XDG_SESSION_TYPE: 'wayland' })).toBe(true)
    expect(isWayland({ XDG_SESSION_TYPE: 'Wayland' })).toBe(true)
    expect(isWayland({ WAYLAND_DISPLAY: 'wayland-0' })).toBe(true)
    expect(isWayland({ XDG_SESSION_TYPE: 'x11' })).toBe(false)
    expect(isWayland({ XDG_SESSION_TYPE: '', WAYLAND_DISPLAY: '' })).toBe(false)
    expect(isWayland({})).toBe(false)
  })
})

describe('running in the background', () => {
  it('shows the tray icon while a tray option is on, or while the window is hidden', () => {
    expect(trayWanted(OFF, false)).toBe(false)
    expect(trayWanted(on({ minimizeToTray: true }), false)).toBe(true)
    expect(trayWanted(on({ closeToTray: true }), false)).toBe(true)
    // The shortcut alone or a start in the background never leaves a hidden window unreachable.
    expect(trayWanted(on({ globalShortcut: true }), false)).toBe(false)
    expect(trayWanted(OFF, true)).toBe(true)
    // Asked for on its own: on macOS this is all the icon is for, since closing
    // and minimising belong to the platform there.
    expect(trayWanted(on({ trayIcon: true }), false)).toBe(true)
  })

  it('closes to the tray only when chosen, and never once quitting', () => {
    expect(decideClose(OFF, false)).toBe('close')
    expect(decideClose(on({ minimizeToTray: true }), false)).toBe('close')
    expect(decideClose(on({ closeToTray: true }), false)).toBe('hide')
    // Quit from the shortcut, the tray menu or a Windows sign-out.
    expect(decideClose(on({ closeToTray: true }), true)).toBe('close')
  })

  it('tells the page whether closing the window would put it away', () => {
    // The fullscreen corner's close button: it hides where the machine can do
    // that and the option is on, and quits (after asking) otherwise.
    expect(closesToTray(on({ closeToTray: true }), caps('win32'))).toBe(true)
    expect(closesToTray(OFF, caps('win32'))).toBe(false)
    expect(closesToTray(on({ minimizeToTray: true }), caps('win32'))).toBe(false)
    // The option exists in the file everywhere; a machine that cannot act on it
    // does not, whether that is macOS or a Linux desktop with no tray.
    expect(closesToTray(on({ closeToTray: true }), caps('darwin'))).toBe(false)
    expect(closesToTray(on({ closeToTray: true }), caps('linux'))).toBe(false)
    expect(closesToTray(on({ closeToTray: true }), caps('linux', { trayAvailable: true }))).toBe(
      true,
    )
  })

  it('minimises to the tray only when chosen', () => {
    expect(decideMinimize(OFF)).toBe('minimize')
    expect(decideMinimize(on({ closeToTray: true }))).toBe('minimize')
    expect(decideMinimize(on({ minimizeToTray: true }))).toBe('hide')
  })

  it('toggles: put away when in front, brought forward otherwise', () => {
    const front = { visible: true, minimized: false, focused: true }
    expect(decideToggle(OFF, front)).toBe('minimize')
    expect(decideToggle(on({ closeToTray: true }), front)).toBe('hide')
    expect(decideToggle(on({ minimizeToTray: true }), front)).toBe('hide')
    for (const facts of [
      { visible: false, minimized: false, focused: false },
      // A hidden window can still report focus for a moment.
      { visible: false, minimized: false, focused: true },
      { visible: true, minimized: true, focused: false },
      { visible: true, minimized: false, focused: false },
    ]) {
      expect(decideToggle(on({ closeToTray: true }), facts)).toBe('show')
    }
  })

  it('starts hidden at sign-in only when the user chose it', () => {
    expect(loginArgs(false)).toEqual([])
    expect(loginArgs(true)).toEqual([HIDDEN_SWITCH])
  })

  it('turns chords into accelerators, refusing keys that move with the layout', () => {
    expect(chordToAccelerator('Ctrl+Alt+Shift+KeyE')).toBe('CommandOrControl+Alt+Shift+E')
    expect(chordToAccelerator('Ctrl+Alt+Digit1')).toBe('CommandOrControl+Alt+1')
    expect(chordToAccelerator('Alt+F9')).toBe('Alt+F9')
    expect(chordToAccelerator('F24')).toBe('F24')
    expect(chordToAccelerator('Ctrl+Shift+Space')).toBe('CommandOrControl+Shift+Space')
    expect(chordToAccelerator('Ctrl+Alt+ArrowUp')).toBe('CommandOrControl+Alt+Up')
    expect(chordToAccelerator('Ctrl+Alt+Numpad5')).toBe('CommandOrControl+Alt+num5')
    // 半角/全角 on a Japanese keyboard; punctuation differs between layouts.
    expect(chordToAccelerator('Ctrl+Alt+Backquote')).toBeNull()
    expect(chordToAccelerator('Ctrl+Shift+Period')).toBeNull()
    expect(chordToAccelerator('Ctrl+Alt+IntlYen')).toBeNull()
    // Not a chord at all.
    expect(chordToAccelerator('KeyE')).toBeNull()
    expect(chordToAccelerator('Shift+KeyE')).toBeNull()
  })
})

const item = (change: Partial<LaunchItem> = {}): LaunchItem => ({
  name: LOGIN_ITEM_NAME,
  path: 'C:\\Users\\u\\AppData\\Local\\Programs\\elecdex\\elecdex.exe',
  args: [],
  scope: 'user',
  enabled: true,
  ...change,
})

describe('the sign-in entry', () => {
  it('is our per-user value, not another entry for the same executable', () => {
    expect(ownLaunchItem([item({ name: 'other' }), item({ scope: 'machine' })])).toBeUndefined()
    expect(ownLaunchItem([item({ name: 'other' }), item()])).toEqual(item())
  })

  it('reads the state from Windows, including a Task Manager switch-off', () => {
    const runKey = new StubRunKey()
    const items = createLoginItems(runKey)
    expect(items.state()).toEqual({ available: true, registered: false, disabledByOs: false })
    items.set(true, false)
    expect(items.state()).toEqual({ available: true, registered: true, disabledByOs: false })
    runKey.setEnabled(false)
    expect(items.state()).toEqual({ available: true, registered: true, disabledByOs: true })
    // Turning it on in the app turns it on in Task Manager too.
    items.set(true, true)
    expect(items.state().disabledByOs).toBe(false)
    expect(runKey.entry?.args).toEqual([HIDDEN_SWITCH])
    items.set(false, true)
    expect(items.state().registered).toBe(false)
  })

  it('rewrites the entry for a changed start option, keeping a Task Manager switch-off', () => {
    const runKey = new StubRunKey()
    const items = createLoginItems(runKey)
    // Nothing to sync without an entry: syncing must never add one.
    items.sync(true)
    expect(runKey.entry).toBeNull()
    items.set(true, false)
    runKey.setEnabled(false)
    items.sync(true)
    expect(runKey.entry).toMatchObject({ args: [HIDDEN_SWITCH], enabled: false })
  })

  it('is not offered where it cannot be written', () => {
    const runKey = new StubRunKey()
    runKey.available = false
    const items = createLoginItems(runKey)
    items.set(true, false)
    expect(runKey.entry).toBeNull()
    expect(items.state()).toEqual({ available: false, registered: false, disabledByOs: false })
  })
})

describe('the system-wide shortcut', () => {
  it('holds its keys only while turned on', () => {
    const registry = new StubRegistry()
    const toggle = createGlobalToggle(() => {}, registry)
    expect(toggle.apply('Ctrl+Alt+Shift+KeyE', false)).toEqual({
      state: 'off',
      chord: 'Ctrl+Alt+Shift+KeyE',
    })
    expect(registry.registered.size).toBe(0)
    expect(toggle.apply('Ctrl+Alt+Shift+KeyE', true).state).toBe('registered')
    expect([...registry.registered.keys()]).toEqual(['CommandOrControl+Alt+Shift+E'])
    toggle.apply('Ctrl+Alt+Shift+KeyE', false)
    expect(registry.registered.size).toBe(0)
  })

  it('moves to new keys, releasing the old ones', () => {
    const registry = new StubRegistry()
    const toggle = createGlobalToggle(() => {}, registry)
    toggle.apply('Ctrl+Alt+Shift+KeyE', true)
    // The same keys again (another setting changed) are kept, not registered twice.
    expect(toggle.apply('Ctrl+Alt+Shift+KeyE', true).state).toBe('registered')
    toggle.apply('Ctrl+Alt+KeyF', true)
    expect([...registry.registered.keys()]).toEqual(['CommandOrControl+Alt+F'])
    toggle.dispose()
    expect(registry.registered.size).toBe(0)
  })

  it('reports keys another app holds, and keys that cannot be registered', () => {
    const registry = new StubRegistry()
    registry.taken.add('CommandOrControl+Alt+Shift+E')
    const toggle = createGlobalToggle(() => {}, registry)
    expect(toggle.apply('Ctrl+Alt+Shift+KeyE', true).state).toBe('taken')
    expect(toggle.apply('Ctrl+Alt+Backquote', true).state).toBe('invalid')
    expect(toggle.apply(null, true)).toEqual({ state: 'invalid', chord: null })
    expect(registry.registered.size).toBe(0)
    // Other keys work, and a failed attempt left nothing behind.
    expect(toggle.apply('Ctrl+Alt+Shift+KeyD', true).state).toBe('registered')
  })

  it('calls back when pressed', () => {
    const registry = new StubRegistry()
    const pressed = vi.fn()
    createGlobalToggle(pressed, registry).apply('Ctrl+Alt+Shift+KeyE', true)
    registry.registered.get('CommandOrControl+Alt+Shift+E')?.()
    expect(pressed).toHaveBeenCalledOnce()
  })
})
