import { backgroundCapabilities, HIDDEN_SWITCH, isWayland } from '@shared/background'
import { app, dialog } from 'electron'
import { appWindows } from './app-windows.js'
import { type Background, registerBackground } from './background/index.js'
import { registerAlarmsIpc } from './ipc/alarms.js'
import { registerAudioIpc } from './ipc/audio.js'
import { registerFeedsIpc } from './ipc/feeds.js'
import { registerFsIpc } from './ipc/fs.js'
import { registerLauncherIpc } from './ipc/launcher.js'
import { registerLayoutIpc } from './ipc/layout.js'
import { registerMarketsIpc } from './ipc/markets.js'
import { registerNotesIpc } from './ipc/notes.js'
import { registerPluginsIpc } from './ipc/plugins.js'
import { type PtyIpc, registerPtyIpc } from './ipc/pty.js'
import { registerQuakesIpc } from './ipc/quakes.js'
import { registerSettingsIpc } from './ipc/settings.js'
import { registerSystemIpc } from './ipc/system.js'
import { registerTasksIpc } from './ipc/tasks.js'
import { registerUpdatesIpc } from './ipc/updates.js'
import { registerWeatherIpc } from './ipc/weather.js'
import { registerWebIpc } from './ipc/web.js'
import { registerMetricsIpc } from './metrics/broker.js'
import { createMainWindow } from './window.js'
import { showMainWindow } from './window-control.js'

// Must run before anything reads `app.getName()` or `app.getPath('userData')`.
// Electron derives the name from the app directory's package.json, which `out/`
// does not have - so unpackaged runs would otherwise be called "Electron" and
// write their config into Electron's own userData folder.
app.setName('elecdex')
app.setAppUserModelId('dev.kurouna.elecdex')

/** `--windowed` is handy during development; fullscreen is the default. */
const wantsWindowed = process.argv.includes('--windowed')

/**
 * Launched at sign-in with "start in the background": the window waits in the
 * notification area. Only where the sign-in entry can carry the switch at all -
 * elsewhere the argument could only have been typed by hand, and a window that
 * never appears is not what that would mean.
 */
const startHidden =
  backgroundCapabilities({ platform: process.platform, wayland: isWayland(process.env) })
    .launchHidden && process.argv.includes(HIDDEN_SWITCH)

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

// Starting elecdex again brings the running one forward, from the notification
// area too - except for the sign-in entry, which only meant "be running".
app.on('second-instance', (_event, argv) => {
  if (argv.includes(HIDDEN_SWITCH)) return
  showMainWindow()
})

let ptyIpc: PtyIpc | null = null
let layoutIpc: { dispose: () => void } | null = null
let metricsIpc: { dispose: () => void } | null = null
let fsIpc: { dispose: () => void } | null = null
let weatherIpc: { dispose: () => void } | null = null
let settingsIpc: { dispose: () => void } | null = null
let launcherIpc: { dispose: () => void } | null = null
let marketsIpc: { dispose: () => void } | null = null
let feedsIpc: { dispose: () => void } | null = null
let quakesIpc: { dispose: () => void } | null = null
let notesIpc: { dispose: () => void } | null = null
let tasksIpc: { dispose: () => void } | null = null
let alarmsIpc: { dispose: () => void } | null = null
let updatesIpc: { dispose: () => void } | null = null
let audioIpc: { dispose: () => void } | null = null
let pluginsIpc: { dispose: () => void } | null = null
let webIpc: { dispose: () => void } | null = null
let background: Background | null = null

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
  notesIpc = registerNotesIpc()
  tasksIpc = registerTasksIpc(settings)
  alarmsIpc = registerAlarmsIpc(settings)
  audioIpc = registerAudioIpc()
  pluginsIpc = registerPluginsIpc(settings)
  webIpc = registerWebIpc(settings)
  background = registerBackground(settings)
  const win = createMainWindow({
    fullscreen: !wantsWindowed,
    devtools: !app.isPackaged,
    show: !startHidden,
  })
  background.attach(win, startHidden)

  // macOS, where the app goes on running with no window: the Dock icon, and the
  // app menu, ask for it back. A window that is only hidden or minimised is
  // brought forward rather than left where it is - the Dock is the one way back
  // there, and it has to work.
  app.on('activate', () => {
    if (appWindows().length > 0) {
      showMainWindow()
      return
    }
    const next = createMainWindow({
      fullscreen: !wantsWindowed,
      devtools: !app.isPackaged,
      show: true,
    })
    background?.attach(next, false)
  })
})

app.on('before-quit', () => {
  // Kill every shell before the app tears down, so no orphaned pty survives.
  // The handlers stay until will-quit: the window can still ask for sessions.
  ptyIpc?.closeSessions()
})

// Handlers must outlive the windows: a closing renderer flushes its pending
// layout save from beforeunload, and the terminal reaper may still list
// sessions. Removing them in before-quit made those calls fail with "no
// handler registered".
app.on('will-quit', () => {
  ptyIpc?.dispose()
  ptyIpc = null
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
  notesIpc?.dispose()
  notesIpc = null
  tasksIpc?.dispose()
  tasksIpc = null
  alarmsIpc?.dispose()
  alarmsIpc = null
  updatesIpc?.dispose()
  updatesIpc = null
  audioIpc?.dispose()
  audioIpc = null
  pluginsIpc?.dispose()
  pluginsIpc = null
  webIpc?.dispose()
  webIpc = null
  background?.dispose()
  background = null
})

app.on('window-all-closed', () => {
  // macOS keeps an app running with no window open - it is in the Dock and the
  // menu bar, and `activate` above makes a window when it is asked for. Quitting
  // here would make closing the window mean quitting, which is a Windows habit,
  // and would leave that `activate` unreachable.
  if (process.platform !== 'darwin') app.quit()
})
