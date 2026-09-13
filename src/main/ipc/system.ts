import os from 'node:os'
import path from 'node:path'
import type { AppInfo, HostFacts } from '@shared/api'
import { CH } from '@shared/channels'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { APP_VERSION } from '../build-info.js'
import { openExternalIfSafe } from '../window.js'

/** `--no-intro` skips the boot sequence; the end-to-end tests launch with it. */
const wantsIntro = !process.argv.includes('--no-intro')

function hostFacts(): HostFacts {
  let user: string | null = null
  try {
    user = os.userInfo().username || null
  } catch {
    // No passwd entry for this uid, e.g. in some containers.
  }
  const cpus = os.cpus()
  return {
    user,
    home: os.homedir(),
    hostname: os.hostname(),
    osRelease: `${os.type()} ${os.release()}`,
    cpuModel: cpus[0]?.model.trim() ?? 'unknown',
    cpuThreads: cpus.length,
    totalMemory: os.totalmem(),
  }
}

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
      intro: wantsIntro,
      host: hostFacts(),
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

  ipcMain.on(CH.system.toggleFullscreen, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.setFullScreen(!win.isFullScreen())
  })

  // The window is frameless in fullscreen, so the app must offer its own way out.
  ipcMain.on(CH.system.quit, () => {
    app.quit()
  })

  ipcMain.on(CH.system.setFullscreen, (event, on: unknown) => {
    if (typeof on !== 'boolean') return
    BrowserWindow.fromWebContents(event.sender)?.setFullScreen(on)
  })
}
