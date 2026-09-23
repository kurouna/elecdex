import path from 'node:path'
import { CH } from '@shared/channels'
import { type FeedUpdate, feedUrl } from '@shared/feeds'
import { app, ipcMain, net, type WebContents } from 'electron'
import { USER_AGENT } from '../build-info.js'
import { FeedCacheSchema, FeedService, readLimited } from '../feeds/service.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { cacheFile } from '../store/cache-file.js'
import { whenPageGoes } from './page-gone.js'

/**
 * Feeds IPC: pages subscribe to feed URLs; main fetches only what is watched.
 *
 * Nothing happens until an RSS pane lists a feed: the service (and with it the
 * cache file) is created on the first subscription, and the XML parser is loaded
 * on the first download. Feed URLs are the user's own, so tests
 * serve them from a local server and need no switch to stay offline.
 */

/** A feed that has not answered, body included, in this long is treated as failed. */
const FETCH_TIMEOUT_MS = 10_000

export function registerFeedsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()

  const send = (sender: WebContents, update: FeedUpdate): void => {
    if (!sender.isDestroyed()) sender.send(CH.feeds.update, update)
  }

  const createService = (): FeedService => {
    const cache = cacheFile(
      path.join(app.getPath('userData'), 'feeds-cache.json'),
      FeedCacheSchema,
      {},
    )
    return new FeedService({
      fetch: async (url, init) => {
        const response = await net.fetch(url, {
          headers: init.headers,
          // Feeds are public: no cookies either way. Conditional requests are ours,
          // so Chromium's HTTP cache must not answer in their place.
          credentials: 'omit',
          cache: 'no-store',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })
        // Only a 200's body is read; any other is dropped at once so the connection is freed.
        if (response.status !== 200) void response.body?.cancel().catch(() => {})
        return {
          status: response.status,
          headers: response.headers,
          bytes: () => readLimited(response.body),
        }
      },
      parse: async (xml, url) => (await import('../feeds/parse.js')).parseFeed(xml, url),
      now: () => Date.now(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      userAgent: USER_AGENT,
      loadCache: cache.load,
      saveCache: cache.save,
      publish: (update) => {
        for (const sender of registry.subscribers(update.url)) send(sender, update)
      },
    })
  }
  let service: FeedService | null = null

  const sync = (feeds: FeedService): void => {
    const active = new Set(registry.activeSources())
    for (const url of feeds.watching()) if (!active.has(url)) feeds.unwatch(url)
    for (const url of active) feeds.watch(url)
  }

  const track = (sender: WebContents): void => {
    const drop = (): void => {
      if (registry.dropSubscriber(sender) && service !== null) sync(service)
    }
    whenPageGoes(sender, registry, drop)
  }

  /** Only a URL already in canonical form is a key; anything else is not ours to fetch. */
  const asFeed = (raw: unknown): string | null => (feedUrl(raw) === raw ? (raw as string) : null)

  ipcMain.on(CH.feeds.subscribe, (event, raw: unknown) => {
    const url = asFeed(raw)
    if (url === null) return
    service ??= createService()
    track(event.sender)
    send(event.sender, service.snapshot(url))
    if (registry.subscribe(event.sender, url)) sync(service)
  })

  ipcMain.on(CH.feeds.unsubscribe, (event, raw: unknown) => {
    const url = asFeed(raw)
    if (url !== null && registry.unsubscribe(event.sender, url) && service !== null) sync(service)
  })

  ipcMain.handle(CH.feeds.watching, () => service?.watching() ?? [])

  return {
    dispose: () => {
      service?.dispose()
      ipcMain.removeAllListeners(CH.feeds.subscribe)
      ipcMain.removeAllListeners(CH.feeds.unsubscribe)
      ipcMain.removeHandler(CH.feeds.watching)
    },
  }
}
