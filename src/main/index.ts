import { app, BrowserWindow, dialog } from 'electron'
import { registerLayoutIpc } from './ipc/layout.js'
import { registerPtyIpc } from './ipc/pty.js'
import { registerSystemIpc } from './ipc/system.js'
import { createMainWindow } from './window.js'

// Must run before anything reads `app.getName()` or `app.getPath('userData')`.
// Electron derives the name from the app directory's package.json, which `out/`
// does not have - so unpackaged runs would otherwise be called "Electron" and
// write their config into Electron's own userData folder.
app.setName('elecdex')
app.setAppUserModelId('dev.kurouna.elecdex')

/** `--windowed` is handy during development; fullscreen is the default. */
const wantsWindowed = process.argv.includes('--windowed')

if (!app.requestSingleInstanceLock()) {
  app.exit(0)
}

// Trade a little stability for a lot of GPU performance, mostly on Linux.
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('enable-gpu-rasterization')

process.on('uncaughtException', (error) => {
  console.error('[elecdex] uncaught exception', error)
  if (app.isReady()) {
    dialog.showErrorBox('elecdex crashed', error.stack ?? error.message)
  }
  app.exit(1)
})

app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows()
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

let ptyIpc: { dispose: () => void } | null = null
let layoutIpc: { dispose: () => void } | null = null

app.whenReady().then(() => {
  registerSystemIpc()
  ptyIpc = registerPtyIpc()
  layoutIpc = registerLayoutIpc()
  createMainWindow({
    fullscreen: !wantsWindowed,
    devtools: !app.isPackaged,
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow({ fullscreen: !wantsWindowed, devtools: !app.isPackaged })
    }
  })
})

app.on('before-quit', () => {
  // Kill every shell before the app tears down, so no orphaned pty survives.
  ptyIpc?.dispose()
  ptyIpc = null
  layoutIpc?.dispose()
  layoutIpc = null
})

app.on('window-all-closed', () => {
  app.quit()
})
