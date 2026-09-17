import type { BrowserWindow } from 'electron'
import { appWindows } from './app-windows.js'

/** The elecdex window, if there is one. */
export const mainWindow = (): BrowserWindow | undefined => appWindows()[0]

/**
 * Brings the window to the front from wherever it is: hidden in the
 * notification area, minimised, or behind another window.
 */
export function showMainWindow(): void {
  const win = mainWindow()
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

/**
 * Whether the user is looking at elecdex, so a system notification would only
 * repeat what the page shows. A window hidden in the notification area can
 * still report focus for a moment, hence the visibility check.
 */
export const windowInFront = (): boolean =>
  appWindows().some((win) => win.isVisible() && win.isFocused() && !win.isMinimized())
