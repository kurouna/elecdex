import path from 'node:path'
import {
  type BackgroundState,
  backgroundSupported,
  decideClose,
  decideMinimize,
  decideToggle,
  trayWanted,
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
import { createLoginItems, StubRunKey } from './login-item.js'
import { type AppTray, createTray, StubTray } from './tray.js'

/**
 * Running in the background, Windows only: closing or minimising to the
 * notification area, the system-wide show/hide shortcut and the sign-in entry.
 * The decisions are in shared/background.ts; this carries them out.
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
  const supported = backgroundSupported(process.platform)
  const stub = process.env.ELECDEX_BACKGROUND_STUB === '1'
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
  const loginItems = createLoginItems(runKey)
  const registry = stub ? new StubRegistry() : undefined
  const toggle = createGlobalToggle(() => toggleWindow(), registry)

  // Hidden by hide(), not merely minimised (on the taskbar), and not a window
  // still loading before its first show.
  let hidden = false
  const refreshTray = (): void => {
    if (supported) tray.setVisible(trayWanted(options(), hidden))
  }

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
    const action = decideToggle(options(), facts)
    if (action === 'show') showMainWindow()
    else if (action === 'hide') win.hide()
    else win.minimize()
  }

  const state = (): BackgroundState => ({
    loginItem: loginItems.state(),
    shortcut: shortcutStatus,
  })
  const broadcast = (): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(CH.background.changed, state())
    }
  }

  const applyShortcut = () => {
    const chord = effectiveBindings(settings.current().keybindings, process.platform)[
      'window.toggle'
    ]
    return toggle.apply(chord, supported && options().globalShortcut)
  }
  let shortcutStatus = applyShortcut()
  let startInBackground = options().startInBackground

  settings.onChange(() => {
    const before = JSON.stringify(shortcutStatus)
    shortcutStatus = applyShortcut()
    let changed = JSON.stringify(shortcutStatus) !== before
    if (supported && options().startInBackground !== startInBackground) {
      startInBackground = options().startInBackground
      loginItems.sync(startInBackground)
      changed = true
    }
    refreshTray()
    if (changed) broadcast()
  })

  ipcMain.handle(CH.background.state, state)
  ipcMain.handle(CH.background.setLaunchAtLogin, (_event, on: unknown) => {
    if (supported && typeof on === 'boolean') loginItems.set(on, options().startInBackground)
    const next = state()
    broadcast()
    return next
  })

  if (stub) {
    ;(globalThis as Record<string, unknown>).__elecdexBackground = {
      pressShortcut: () => {
        for (const callback of registry?.registered.values() ?? []) callback()
      },
      registered: () => [...(registry?.registered.keys() ?? [])],
      take: (accelerator: string) => registry?.taken.add(accelerator),
      tray: stubTray,
      runKey,
      hintsShown: () => hintsShown,
    }
  }

  return {
    attach: (win, startHidden) => {
      if (!supported) return
      hidden = startHidden
      win.on('close', (event) => {
        if (decideClose(options(), quitting) === 'close') return
        event.preventDefault()
        putAway(win)
      })
      win.on('minimize', () => {
        if (decideMinimize(options()) === 'hide') putAway(win)
      })
      // Windows is signing out or shutting down: a close held back would hold that up.
      win.on('session-end', onBeforeQuit)
      const follow = (on: boolean) => (): void => {
        hidden = on
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
      ipcMain.removeHandler(CH.background.state)
      ipcMain.removeHandler(CH.background.setLaunchAtLogin)
    },
  }
}
