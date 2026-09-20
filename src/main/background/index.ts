import path from 'node:path'
import {
  type BackgroundState,
  backgroundCapabilities,
  decideClose,
  decideMinimize,
  decideToggle,
  isWayland,
  type ShortcutStatus,
  trayWanted,
  type WindowOptions,
} from '@shared/background'
import { CH } from '@shared/channels'
import { effectiveBindings } from '@shared/keybindings'
import { app, type BrowserWindow, ipcMain, Notification } from 'electron'
import { z } from 'zod'
import { appWindows } from '../app-windows.js'
import type { SettingsHandle } from '../ipc/settings.js'
import { JsonStore } from '../store/json-store.js'
import { mainWindow, showMainWindow } from '../window-control.js'
import { createGlobalToggle, StubRegistry } from './global-shortcut.js'
import { createLoginItems } from './login/index.js'
import { StubRunKey } from './login/stub.js'
import { windowsLoginBackend } from './login/windows.js'
import { type AppTray, createTray, StubTray, trayCanBeShown } from './tray.js'

/**
 * Running in the background: closing or minimising to the icon outside the
 * window, the system-wide show/hide shortcut and the sign-in entry. The
 * decisions are in shared/background.ts; this carries them out.
 *
 * What is on offer is `backgroundCapabilities`, not the platform name: macOS
 * keeps the app running with no window and has no minimise-to-menu-bar, and on
 * Linux the tray and the shortcut depend on the desktop, so both are found out
 * here - the tray by trying to make one, the shortcut from the session type -
 * and the answer travels to the page with the rest of the state.
 *
 * `quitting` separates putting the window away from quitting: every real quit
 * (the Quit shortcut and button, the tray menu, Windows signing out) goes
 * through before-quit or session-end first, so a close after it is let through.
 *
 * With ELECDEX_BACKGROUND_STUB=1 (the end-to-end tests) the tray, the shortcut
 * and the Run key are in-memory stand-ins, driven through
 * `globalThis.__elecdexBackground`, and the one-time hint is counted instead of
 * shown: a test run must not touch the machine's taskbar, keys or sign-in.
 */

const HintSchema = z.object({ trayHintShown: z.boolean().default(false) })

export interface Background {
  /** Takes over the window's close and minimise; `startHidden` when started at sign-in in the background. */
  attach(win: BrowserWindow, startHidden: boolean): void
  dispose(): void
}

export function registerBackground(settings: SettingsHandle): Background {
  const stub = process.env.ELECDEX_BACKGROUND_STUB === '1'
  const capabilities = backgroundCapabilities({
    platform: process.platform,
    // Asked once, by making one and taking it away again: on Linux the desktop
    // decides, and an option to put the window somewhere that does not exist
    // would be an option to lose it. The stub always has one.
    trayAvailable: stub || trayCanBeShown(),
    wayland: isWayland(process.env),
  })
  const options = () => settings.current().window
  let quitting = false
  const onBeforeQuit = (): void => {
    quitting = true
  }
  app.on('before-quit', onBeforeQuit)

  const hints = new JsonStore({
    file: path.join(app.getPath('userData'), 'background.json'),
    schema: HintSchema,
    makeDefault: () => HintSchema.parse({}),
  })
  let hintsShown = 0

  const actions = {
    open: showMainWindow,
    settings: () => {
      showMainWindow()
      const win = mainWindow()
      if (win && !win.webContents.isDestroyed()) win.webContents.send(CH.background.openSettings)
    },
    quit: () => app.quit(),
  }
  const stubTray = stub ? new StubTray(actions) : null
  const tray: AppTray = stubTray ?? createTray(actions)
  const runKey = stub ? new StubRunKey() : undefined
  const loginItems = createLoginItems(
    runKey === undefined ? undefined : windowsLoginBackend(true, runKey),
  )
  const registry = stub ? new StubRegistry() : undefined
  const toggle = createGlobalToggle(() => toggleWindow(), registry)

  // Hidden by hide(), not merely minimised (on the taskbar), and not a window
  // still loading before its first show.
  let hidden = false
  const refreshTray = (): void => {
    if (capabilities.tray) tray.setVisible(trayWanted(wanted(), hidden))
  }

  /**
   * The window options with anything this machine cannot do turned off, so a
   * settings.json carried from another platform - or edited by hand - cannot
   * ask for a tray that is not there.
   */
  const wanted = (): WindowOptions => ({
    ...options(),
    trayIcon: capabilities.tray && options().trayIcon,
    closeToTray: capabilities.closeToTray && options().closeToTray,
    minimizeToTray: capabilities.minimizeToTray && options().minimizeToTray,
  })

  /** Once ever: where the window went, since Windows 11 tucks new icons under "^". */
  const hintOnce = (): void => {
    if (hints.read().trayHintShown) return
    hints.write({ trayHintShown: true })
    hintsShown += 1
    if (stub || !Notification.isSupported()) return
    const notification = new Notification({
      title: 'elecdex is still running',
      body: 'Open it from the notification area (^) on the taskbar.',
    })
    notification.on('click', showMainWindow)
    notification.show()
  }

  /**
   * Off the taskbar while the window is in the notification area, and back on it
   * when it returns. A window hidden while minimised keeps its taskbar button,
   * and it is the one place the window can be brought back from that does not
   * restore it (window.ts puts that right); being in both places at once is not
   * what "minimize to the notification area" says either.
   */
  let offTaskbar = false
  const keepOffTaskbar = (win: BrowserWindow, off: boolean): void => {
    offTaskbar = off
    win.setSkipTaskbar(off)
  }

  const putAway = (win: BrowserWindow): void => {
    win.hide()
    hintOnce()
  }

  function toggleWindow(): void {
    const win = mainWindow()
    if (!win) return
    const facts = {
      visible: win.isVisible(),
      minimized: win.isMinimized(),
      focused: win.isFocused(),
    }
    const action = decideToggle(wanted(), facts)
    if (action === 'show') showMainWindow()
    else if (action === 'hide') win.hide()
    else win.minimize()
  }

  const state = (): BackgroundState => ({
    capabilities,
    loginItem: loginItems.state(),
    shortcut: shortcutStatus,
  })
  const broadcast = (): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(CH.background.changed, state())
    }
  }

  const applyShortcut = (): ShortcutStatus => {
    // Nowhere to register it: say so rather than reporting it merely off, so the
    // settings can give the reason instead of an unexplained dead switch.
    if (!capabilities.globalShortcut) return { state: 'unavailable', chord: null }
    const chord = effectiveBindings(settings.current().keybindings, process.platform)[
      'window.toggle'
    ]
    return toggle.apply(chord, options().globalShortcut)
  }
  let shortcutStatus = applyShortcut()
  let startInBackground = options().startInBackground

  settings.onChange(() => {
    const before = JSON.stringify(shortcutStatus)
    shortcutStatus = applyShortcut()
    let changed = JSON.stringify(shortcutStatus) !== before
    if (capabilities.launchHidden && options().startInBackground !== startInBackground) {
      startInBackground = options().startInBackground
      loginItems.sync(startInBackground)
      changed = true
    }
    refreshTray()
    if (changed) broadcast()
  })

  ipcMain.handle(CH.background.state, state)
  // Handing the keys back is safe at any time, so anything that means the page
  // is no longer recording does it: the page saying so, a reload, a crash, the
  // window going away.
  const suspendShortcut = (on: boolean): void => toggle.suspend(on)
  ipcMain.on(CH.background.suspendShortcut, (_event, on: unknown) => {
    suspendShortcut(on === true)
  })

  ipcMain.handle(CH.background.setLaunchAtLogin, (_event, on: unknown) => {
    if (capabilities.launchAtLogin && typeof on === 'boolean') {
      loginItems.set(on, capabilities.launchHidden && options().startInBackground)
    }
    const next = state()
    broadcast()
    return next
  })

  if (stub) {
    ;(globalThis as Record<string, unknown>).__elecdexBackground = {
      pressShortcut: () => registry?.press(),
      registered: () => [...(registry?.registered.keys() ?? [])],
      suspended: () => registry?.suspended ?? false,
      take: (accelerator: string) => registry?.taken.add(accelerator),
      tray: stubTray,
      runKey,
      hintsShown: () => hintsShown,
      offTaskbar: () => offTaskbar,
    }
  }

  return {
    attach: (win, startHidden) => {
      hidden = startHidden
      win.on('close', (event) => {
        if (decideClose(wanted(), quitting) === 'close') return
        event.preventDefault()
        putAway(win)
      })
      win.on('minimize', () => {
        if (decideMinimize(wanted()) === 'hide') putAway(win)
      })
      // Windows is signing out or shutting down: a close held back would hold that up.
      win.on('session-end', onBeforeQuit)
      win.on('closed', () => suspendShortcut(false))
      win.webContents.on('did-start-navigation', () => suspendShortcut(false))
      win.webContents.on('render-process-gone', () => suspendShortcut(false))
      const follow = (on: boolean) => (): void => {
        hidden = on
        keepOffTaskbar(win, on)
        refreshTray()
      }
      win.on('show', follow(false))
      win.on('hide', follow(true))
      refreshTray()
    },
    dispose: () => {
      app.off('before-quit', onBeforeQuit)
      toggle.dispose()
      tray.dispose()
      ipcMain.removeAllListeners(CH.background.suspendShortcut)
      ipcMain.removeHandler(CH.background.state)
      ipcMain.removeHandler(CH.background.setLaunchAtLogin)
    },
  }
}
