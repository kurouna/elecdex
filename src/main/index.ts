import { app, dialog } from 'electron'
import { appWindows } from './app-windows.js'
import { registerAudioIpc } from './ipc/audio.js'
import { registerFeedsIpc } from './ipc/feeds.js'
import { registerFsIpc } from './ipc/fs.js'
import { registerLauncherIpc } from './ipc/launcher.js'
import { registerLayoutIpc } from './ipc/layout.js'
import { registerMarketsIpc } from './ipc/markets.js'
import { registerPtyIpc } from './ipc/pty.js'
import { registerQuakesIpc } from './ipc/quakes.js'
import { registerSettingsIpc } from './ipc/settings.js'
import { registerSystemIpc } from './ipc/system.js'
import { registerUpdatesIpc } from './ipc/updates.js'
import { registerWeatherIpc } from './ipc/weather.js'
import { registerMetricsIpc } from './metrics/broker.js'
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
  const [win] = appWindows()
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

let ptyIpc: { dispose: () => void } | null = null
let layoutIpc: { dispose: () => void } | null = null
let metricsIpc: { dispose: () => void } | null = null
let fsIpc: { dispose: () => void } | null = null
let weatherIpc: { dispose: () => void } | null = null
let settingsIpc: { dispose: () => void } | null = null
let launcherIpc: { dispose: () => void } | null = null
let marketsIpc: { dispose: () => void } | null = null
let feedsIpc: { dispose: () => void } | null = null
let quakesIpc: { dispose: () => void } | null = null
let updatesIpc: { dispose: () => void } | null = null
let audioIpc: { dispose: () => void } | null = null

app.whenReady().then(() => {
  registerSystemIpc()
  const settings = registerSettingsIpc()
  settingsIpc = settings
  ptyIpc = registerPtyIpc(settings)
  layoutIpc = registerLayoutIpc()
  metricsIpc = registerMetricsIpc()
  fsIpc = registerFsIpc()
  weatherIpc = registerWeatherIpc()
  launcherIpc = registerLauncherIpc(settings)
  marketsIpc = registerMarketsIpc()
  feedsIpc = registerFeedsIpc()
  updatesIpc = registerUpdatesIpc(settings)
  quakesIpc = registerQuakesIpc(settings)
  audioIpc = registerAudioIpc()
  createMainWindow({
    fullscreen: !wantsWindowed,
    devtools: !app.isPackaged,
  })

  app.on('activate', () => {
    if (appWindows().length === 0) {
      createMainWindow({ fullscreen: !wantsWindowed, devtools: !app.isPackaged })
    }
  })
})

app.on('before-quit', () => {
  // Kill every shell before the app tears down, so no orphaned pty survives.
  ptyIpc?.dispose()
  ptyIpc = null
})

// Layout and metrics handlers must outlive the windows: a closing renderer
// flushes its pending layout save from beforeunload, and removing the handler
// in before-quit made that final save fail with "no handler registered".
app.on('will-quit', () => {
  layoutIpc?.dispose()
  layoutIpc = null
  metricsIpc?.dispose()
  metricsIpc = null
  fsIpc?.dispose()
  fsIpc = null
  weatherIpc?.dispose()
  weatherIpc = null
  settingsIpc?.dispose()
  settingsIpc = null
  launcherIpc?.dispose()
  launcherIpc = null
  marketsIpc?.dispose()
  marketsIpc = null
  feedsIpc?.dispose()
  feedsIpc = null
  quakesIpc?.dispose()
  quakesIpc = null
  updatesIpc?.dispose()
  updatesIpc = null
  audioIpc?.dispose()
  audioIpc = null
})

app.on('window-all-closed', () => {
  app.quit()
})
