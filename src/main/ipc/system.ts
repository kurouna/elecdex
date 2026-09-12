import path from 'node:path'
import type { AppInfo } from '@shared/api'
import { CH } from '@shared/channels'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { APP_VERSION } from '../build-info.js'
import { openExternalIfSafe } from '../window.js'

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function registerSystemIpc(): void {
  ipcMain.handle(CH.system.info, (): AppInfo => {
    return {
      name: app.getName(),
      version: APP_VERSION,
      platform: process.platform,
      arch: process.arch,
      isPackaged: app.isPackaged,
      versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        v8: process.versions.v8,
      },
    }
  })

  ipcMain.handle(CH.system.openExternal, async (_event, rawUrl: unknown) => {
    const url = asString(rawUrl)
    if (url === null) return
    await openExternalIfSafe(url)
  })

  ipcMain.handle(CH.system.revealInFolder, (_event, rawPath: unknown) => {
    const target = asString(rawPath)
    if (target === null) return
    shell.showItemInFolder(path.resolve(target))
  })

  ipcMain.on(CH.system.toggleDevTools, (event) => {
    event.sender.toggleDevTools()
  })

  ipcMain.on(CH.system.setFullscreen, (event, on: unknown) => {
    if (typeof on !== 'boolean') return
    BrowserWindow.fromWebContents(event.sender)?.setFullScreen(on)
  })
}
