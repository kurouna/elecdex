import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CH } from '@shared/channels'
import { isOfficeCode, type WeatherUpdate } from '@shared/weather'
import { app, ipcMain, net, type WebContents } from 'electron'
import { APP_VERSION } from '../build-info.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { type CachedForecasts, CachedForecastsSchema, WeatherService } from '../weather/service.js'

/**
 * Weather IPC: pages subscribe to offices; main fetches only what is watched.
 *
 * `ELECDEX_JMA_BASE_URL` points the service somewhere other than JMA. The
 * end-to-end tests set it to a local server, so running the suite never sends a
 * request to the real site.
 */
const JMA_BASE_URL = 'https://www.jma.go.jp/bosai'

/** A request that has not answered in this long is treated as failed. */
const FETCH_TIMEOUT_MS = 15_000

export function registerWeatherIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
  const cacheFile = path.join(app.getPath('userData'), 'weather-cache.json')

  const service = new WeatherService({
    fetch: async (url, init) => {
      const response = await net.fetch(url, {
        headers: init.headers,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      return response
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    baseUrl: (process.env.ELECDEX_JMA_BASE_URL ?? JMA_BASE_URL).replace(/\/$/, ''),
    userAgent: `elecdex/${APP_VERSION} (+https://github.com/kurouna/elecdex)`,
    loadCache: () => {
      try {
        const parsed = CachedForecastsSchema.safeParse(JSON.parse(readFileSync(cacheFile, 'utf8')))
        return parsed.success ? parsed.data : {}
      } catch {
        return {}
      }
    },
    saveCache: (cache: CachedForecasts) => {
      mkdirSync(path.dirname(cacheFile), { recursive: true })
      const temp = `${cacheFile}.tmp`
      writeFileSync(temp, JSON.stringify(cache))
      renameSync(temp, cacheFile)
    },
    publish: (update: WeatherUpdate) => {
      for (const sender of registry.subscribers(update.office)) send(sender, update)
    },
  })

  const send = (sender: WebContents, update: WeatherUpdate): void => {
    if (!sender.isDestroyed()) sender.send(CH.weather.update, update)
  }

  const sync = (): void => {
    const active = new Set(registry.activeSources())
    for (const office of service.watching()) if (!active.has(office)) service.unwatch(office)
    for (const office of active) service.watch(office)
  }

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

  ipcMain.on(CH.weather.subscribe, (event, raw: unknown) => {
    if (!isOfficeCode(raw)) return
    track(event.sender)
    send(event.sender, service.snapshot(raw))
    if (registry.subscribe(event.sender, raw)) sync()
  })

  ipcMain.on(CH.weather.unsubscribe, (event, raw: unknown) => {
    if (!isOfficeCode(raw)) return
    if (registry.unsubscribe(event.sender, raw)) sync()
  })

  ipcMain.handle(CH.weather.offices, () => service.listOffices())
  ipcMain.handle(CH.weather.watching, () => service.watching())

  return {
    dispose: () => {
      service.dispose()
      ipcMain.removeAllListeners(CH.weather.subscribe)
      ipcMain.removeAllListeners(CH.weather.unsubscribe)
      ipcMain.removeHandler(CH.weather.offices)
      ipcMain.removeHandler(CH.weather.watching)
    },
  }
}
