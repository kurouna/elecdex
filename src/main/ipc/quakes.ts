import path from 'node:path'
import { CH } from '@shared/channels'
import {
  describeQuake,
  intensityLabel,
  type Quake,
  type QuakeState,
  quakeLanguage,
} from '@shared/quakes'
import { app, BrowserWindow, ipcMain, Notification, net, type WebContents } from 'electron'
import { z } from 'zod'
import { USER_AGENT } from '../build-info.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { QuakeService } from '../quakes/service.js'
import { cacheFile } from '../store/cache-file.js'
import type { SettingsHandle } from './settings.js'

/**
 * Earthquake IPC.
 *
 * The list is kept current while earthquake alerts are on in settings or any page
 * has a quakes pane open (subscribed); otherwise nothing runs. Every change is
 * sent to every window, so the globe can mark earthquakes without keeping the
 * list alive itself. Alerts go to every window (banner and sound) and, when no
 * window is in front, to the system's notifications.
 *
 * The list is JMA's, under `ELECDEX_JMA_BASE_URL` like the weather forecasts, so
 * the end-to-end tests' closed port or stub covers it too.
 */
const JMA_BASE_URL = 'https://www.jma.go.jp/bosai'
const FETCH_TIMEOUT_MS = 15_000
/** The only source key: a pane subscribes to "the list", not to anything in it. */
const SOURCE = 'jma'

export function registerQuakesIpc(settings: SettingsHandle): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
  const alerted = cacheFile(
    path.join(app.getPath('userData'), 'quake-alerts.json'),
    z.array(z.string().max(40)).max(1000),
    [],
  )

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  const service = new QuakeService({
    fetch: async (url, init) => {
      const response = await net.fetch(url, {
        headers: init.headers,
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (response.status !== 200) void response.body?.cancel().catch(() => {})
      return { status: response.status, headers: response.headers, json: () => response.json() }
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    baseUrl: (process.env.ELECDEX_JMA_BASE_URL ?? JMA_BASE_URL).replace(/\/$/, ''),
    userAgent: USER_AGENT,
    loadAlerted: alerted.load,
    saveAlerted: alerted.save,
    publish: (state: QuakeState) => broadcast(CH.quakes.update, state),
    alert: (quakes) => {
      broadcast(CH.quakes.alert, quakes)
      notifySystem(quakes, settings)
    },
  })

  const sync = (): void => {
    const { quakes } = settings.current()
    service.setAlerts(quakes.notify ? { minIntensity: quakes.minIntensity } : null)
    service.setActive(quakes.notify || registry.activeSources().length > 0)
  }
  sync()
  settings.onChange(sync)

  const track = (sender: WebContents): void => {
    if (tracked.has(sender)) return
    tracked.add(sender)
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) sync()
    }
    sender.once('destroyed', drop)
    sender.on('did-start-navigation', (details) => {
      if (details.isMainFrame && !details.isSameDocument) drop()
    })
  }

  ipcMain.on(CH.quakes.subscribe, (event) => {
    track(event.sender)
    if (registry.subscribe(event.sender, SOURCE)) sync()
  })
  ipcMain.on(CH.quakes.unsubscribe, (event) => {
    if (registry.unsubscribe(event.sender, SOURCE)) sync()
  })
  ipcMain.handle(CH.quakes.state, () => service.state())

  return {
    dispose: () => {
      service.dispose()
      ipcMain.removeAllListeners(CH.quakes.subscribe)
      ipcMain.removeAllListeners(CH.quakes.unsubscribe)
      ipcMain.removeHandler(CH.quakes.state)
    },
  }
}

/** A system notification per earthquake, when no elecdex window is in front to show the banner. */
function notifySystem(quakes: Quake[], settings: SettingsHandle): void {
  if (!settings.current().quakes.system || !Notification.isSupported()) return
  const windows = BrowserWindow.getAllWindows()
  if (windows.some((win) => win.isFocused() && !win.isMinimized())) return
  const language = quakeLanguage(app.getLocale())
  for (const quake of quakes) {
    const time = new Date(quake.at).toTimeString().slice(0, 5)
    const notification = new Notification({
      title:
        language === 'ja'
          ? `地震情報 ${time}${quake.maxIntensity ? ` ${intensityLabel(quake.maxIntensity, 'ja')}` : ''}`
          : `Earthquake ${time}${quake.maxIntensity ? ` · ${intensityLabel(quake.maxIntensity, 'en')}` : ''}`,
      body: `${describeQuake(quake, language)}\n${language === 'ja' ? '出典：気象庁' : 'Source: JMA'}`,
    })
    notification.on('click', () => {
      const [win] = BrowserWindow.getAllWindows()
      if (!win) return
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    })
    notification.show()
  }
}
