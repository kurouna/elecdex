import path from 'node:path'
import { CH } from '@shared/channels'
import { notificationsFor } from '@shared/quake-notifications'
import { type QuakeAlert, type QuakeState, quakeLanguage, resolveQuakeSource } from '@shared/quakes'
import { app, ipcMain, Notification, net, type WebContents } from 'electron'
import { z } from 'zod'
import { appWindows } from '../app-windows.js'
import { USER_AGENT } from '../build-info.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { QuakeService } from '../quakes/service.js'
import { cacheFile } from '../store/cache-file.js'
import { showMainWindow, windowInFront } from '../window-control.js'
import type { SettingsHandle } from './settings.js'

/**
 * Earthquake and tsunami IPC.
 *
 * The list is kept current while alerts are on in settings or any page has a
 * quakes pane open (subscribed); otherwise nothing runs. Every change is sent to
 * every window, so the globe can mark earthquakes without keeping the list alive
 * itself. Alerts go to every window (banner and sound) and, when no window is in
 * front, to the system's notifications.
 *
 * `ELECDEX_JMA_BASE_URL` (shared with the forecasts), `ELECDEX_USGS_BASE_URL` and
 * `ELECDEX_NOAA_BASE_URL` point the services elsewhere; the end-to-end tests use
 * closed ports or local stubs, so they never reach the real sites.
 */
const JMA_BASE_URL = 'https://www.jma.go.jp/bosai'
const USGS_BASE_URL = 'https://earthquake.usgs.gov'
const NOAA_BASE_URL = 'https://www.tsunami.gov'
const FETCH_TIMEOUT_MS = 15_000
/** The only source key: a pane subscribes to "the list", not to anything in it. */
const SOURCE = 'quakes'

const base = (env: string | undefined, fallback: string) => (env ?? fallback).replace(/\/$/, '')

export function registerQuakesIpc(settings: SettingsHandle): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
  const alerted = cacheFile(
    path.join(app.getPath('userData'), 'quake-alerts.json'),
    z.array(z.string().max(200)).max(1000),
    [],
  )

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows()) {
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
      return { status: response.status, headers: response.headers, text: () => response.text() }
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    urls: {
      jma: base(process.env.ELECDEX_JMA_BASE_URL, JMA_BASE_URL),
      usgs: base(process.env.ELECDEX_USGS_BASE_URL, USGS_BASE_URL),
      noaa: base(process.env.ELECDEX_NOAA_BASE_URL, NOAA_BASE_URL),
    },
    userAgent: USER_AGENT,
    loadAlerted: alerted.load,
    saveAlerted: alerted.save,
    publish: (state: QuakeState) => broadcast(CH.quakes.update, state),
    alert: (payload) => {
      broadcast(CH.quakes.alert, payload)
      notifySystem(payload, settings)
    },
  })

  const sync = (): void => {
    const { quakes } = settings.current()
    const source = resolveQuakeSource(
      quakes.source,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      app.getLocale(),
    )
    service.configure({
      active: quakes.notify || registry.activeSources().length > 0,
      source,
      rule: !quakes.notify
        ? null
        : source === 'jma'
          ? { source, minIntensity: quakes.minIntensity }
          : { source, minMagnitude: quakes.minMagnitude },
      tsunami: quakes.tsunami,
    })
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

/** System notifications, when no elecdex window is in front to show the banner. */
function notifySystem(payload: QuakeAlert, settings: SettingsHandle): void {
  if (!settings.current().quakes.system || !Notification.isSupported()) return
  if (windowInFront()) return
  for (const { title, body } of notificationsFor(payload, quakeLanguage(app.getLocale()))) {
    const notification = new Notification({ title, body })
    notification.on('click', showMainWindow)
    notification.show()
  }
}
