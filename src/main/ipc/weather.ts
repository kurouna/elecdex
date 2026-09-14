import path from 'node:path'
import { CH } from '@shared/channels'
import type { JmaUpdate } from '@shared/weather'
import { parseLocationKey, type WeatherUpdate } from '@shared/weather-report'
import { jmaReport } from '@shared/weather-sources'
import { app, ipcMain, net, type WebContents } from 'electron'
import { USER_AGENT } from '../build-info.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { cacheFile } from '../store/cache-file.js'
import { PointCacheSchema, PointForecasts } from '../weather/point-forecasts.js'
import { CachedForecastsSchema, type FetchResponse, WeatherService } from '../weather/service.js'

/**
 * Weather IPC: pages subscribe to a location key; main fetches only what is
 * watched, from the source the key names - JMA by forecast office, MET Norway or
 * the NWS by point - and sends every page the same WeatherReport shape.
 *
 * `ELECDEX_JMA_BASE_URL`, `ELECDEX_MET_BASE_URL` and `ELECDEX_NWS_BASE_URL`
 * point the services elsewhere. The end-to-end tests set them to closed ports or
 * local servers, so running the suite never reaches a real weather service.
 */
const JMA_BASE_URL = 'https://www.jma.go.jp/bosai'
const MET_BASE_URL = 'https://api.met.no/weatherapi'
const NWS_BASE_URL = 'https://api.weather.gov'

/** A request that has not answered in this long is treated as failed. */
const FETCH_TIMEOUT_MS = 15_000

const base = (env: string | undefined, fallback: string) => (env ?? fallback).replace(/\/$/, '')

export function registerWeatherIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
  const userData = app.getPath('userData')

  const fetch = async (
    url: string,
    init: { headers: Record<string, string> },
  ): Promise<FetchResponse> =>
    net.fetch(url, { headers: init.headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  const timers = {
    now: () => Date.now(),
    setTimer: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimer: (handle: unknown) => clearTimeout(handle as NodeJS.Timeout),
  }

  const send = (sender: WebContents, update: WeatherUpdate): void => {
    if (!sender.isDestroyed()) sender.send(CH.weather.update, update)
  }

  /** A JMA office's forecast, as the report for one subscribed key (its area). */
  const jmaUpdate = (key: string, office: JmaUpdate): WeatherUpdate => {
    const parsed = parseLocationKey(key)
    const area = parsed?.source === 'jma' ? (parsed.area ?? undefined) : undefined
    return {
      key,
      report: office.forecast ? jmaReport(office.forecast, area) : null,
      fetchedAt: office.fetchedAt,
      error: office.error,
    }
  }

  const jmaCache = cacheFile(path.join(userData, 'weather-cache.json'), CachedForecastsSchema, {})
  const jma = new WeatherService({
    fetch,
    ...timers,
    baseUrl: base(process.env.ELECDEX_JMA_BASE_URL, JMA_BASE_URL),
    userAgent: USER_AGENT,
    loadCache: jmaCache.load,
    saveCache: jmaCache.save,
    publish: (update) => {
      for (const key of registry.activeSources()) {
        const parsed = parseLocationKey(key)
        if (parsed?.source !== 'jma' || parsed.office !== update.office) continue
        const report = jmaUpdate(key, update)
        for (const sender of registry.subscribers(key)) send(sender, report)
      }
    },
  })

  const pointCache = cacheFile(
    path.join(userData, 'weather-cache-points.json'),
    PointCacheSchema,
    {},
  )
  const points = new PointForecasts({
    fetch,
    ...timers,
    metBaseUrl: base(process.env.ELECDEX_MET_BASE_URL, MET_BASE_URL),
    nwsBaseUrl: base(process.env.ELECDEX_NWS_BASE_URL, NWS_BASE_URL),
    userAgent: USER_AGENT,
    loadCache: pointCache.load,
    saveCache: pointCache.save,
    publish: (update) => {
      for (const sender of registry.subscribers(update.key)) send(sender, update)
    },
  })

  const snapshot = (key: string): WeatherUpdate => {
    const parsed = parseLocationKey(key)
    return parsed?.source === 'jma'
      ? jmaUpdate(key, jma.snapshot(parsed.office))
      : points.snapshot(key)
  }

  /** Brings a service's watched set in line with what pages want. */
  const reconcile = (
    service: { watching(): string[]; watch(id: string): void; unwatch(id: string): void },
    wanted: Set<string>,
  ): void => {
    for (const id of service.watching()) if (!wanted.has(id)) service.unwatch(id)
    for (const id of wanted) service.watch(id)
  }

  const sync = (): void => {
    const offices = new Set<string>()
    const pointKeys = new Set<string>()
    for (const key of registry.activeSources()) {
      const parsed = parseLocationKey(key)
      if (parsed?.source === 'jma') offices.add(parsed.office)
      else if (parsed !== null) pointKeys.add(key)
    }
    reconcile(jma, offices)
    reconcile(points, pointKeys)
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
    if (typeof raw !== 'string' || parseLocationKey(raw) === null) return
    track(event.sender)
    send(event.sender, snapshot(raw))
    if (registry.subscribe(event.sender, raw)) sync()
  })

  ipcMain.on(CH.weather.unsubscribe, (event, raw: unknown) => {
    if (typeof raw !== 'string' || parseLocationKey(raw) === null) return
    if (registry.unsubscribe(event.sender, raw)) sync()
  })

  ipcMain.handle(CH.weather.offices, () => jma.listOffices())
  ipcMain.handle(CH.weather.watching, () => [
    ...jma.watching().map((office) => `jma:${office}`),
    ...points.watching(),
  ])

  return {
    dispose: () => {
      jma.dispose()
      points.dispose()
      ipcMain.removeAllListeners(CH.weather.subscribe)
      ipcMain.removeAllListeners(CH.weather.unsubscribe)
      ipcMain.removeHandler(CH.weather.offices)
      ipcMain.removeHandler(CH.weather.watching)
    },
  }
}
