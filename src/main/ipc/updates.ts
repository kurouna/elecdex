import { CH } from '@shared/channels'
import { RELEASES_API, type UpdateStatus } from '@shared/updates'
import { BrowserWindow, ipcMain } from 'electron'
import { APP_VERSION } from '../build-info.js'
import { UpdateChecker } from '../updates/checker.js'
import type { SettingsHandle } from './settings.js'

/**
 * The update check's IPC. Follows `updates.check` in settings, and broadcasts
 * every status to all windows.
 *
 * `ELECDEX_UPDATES_URL` replaces the GitHub API URL; the end-to-end tests point
 * it at a closed port (or a local stub), so they never contact GitHub.
 */
const REQUEST_TIMEOUT_MS = 10_000

export function registerUpdatesIpc(settings: SettingsHandle): { dispose: () => void } {
  const url = process.env.ELECDEX_UPDATES_URL ?? RELEASES_API

  const checker = new UpdateChecker({
    currentVersion: APP_VERSION,
    fetchLatest: async () => {
      const response = await fetch(url, {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': `elecdex/${APP_VERSION}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      return { status: response.status, json: response.ok ? await response.json() : null }
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    publish: (status: UpdateStatus) => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.webContents.isDestroyed()) win.webContents.send(CH.updates.changed, status)
      }
    },
  })

  checker.setEnabled(settings.current().updates.check)
  settings.onChange((next) => checker.setEnabled(next.updates.check))

  ipcMain.handle(CH.updates.status, () => checker.status())
  ipcMain.handle(CH.updates.check, () => checker.check())

  return {
    dispose: () => {
      checker.dispose()
      ipcMain.removeHandler(CH.updates.status)
      ipcMain.removeHandler(CH.updates.check)
    },
  }
}
