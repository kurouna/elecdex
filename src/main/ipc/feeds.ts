import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CH } from '@shared/channels'
import { FEED_IMAGE_URL_MAX, type FeedUpdate, feedUrl } from '@shared/feeds'
import type { DiscoverResult } from '@shared/feeds-discover'
import { app, BrowserWindow, dialog, nativeImage, net, type WebContents } from 'electron'
import { USER_AGENT } from '../build-info.js'
import { discover } from '../feeds/discover.js'
import { FeedImages, MAX_IMAGE_BYTES } from '../feeds/images.js'
import { heldItems, READ_KEY_MAX, ReadMarks, ReadMarksSchema } from '../feeds/read-marks.js'
import { decodeFeed, FeedCacheSchema, FeedService, readLimited } from '../feeds/service.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { readLimited as readBody } from '../read-limited.js'
import { showSaveDialogFor } from '../save-dialog.js'
import { cacheFile } from '../store/cache-file.js'
import { whenPageGoes } from './page-gone.js'
import { registerTable } from './table.js'

/**
 * Feeds IPC: pages subscribe to feed URLs; main fetches only what is watched.
 *
 * Nothing happens until an RSS pane lists a feed: the service (and with it the
 * cache file) is created on the first subscription, and the XML parser is loaded
 * on the first download. Feed URLs are the user's own, so tests
 * serve them from a local server and need no switch to stay offline.
 *
 * Beside the feeds (§5.27): ADD's discovery fetches a page only when the user presses FIND;
 * a picture is fetched only when a pane shows it, and only one a watched feed names; read
 * marks are one small file; OPML goes through main's own picker and save dialog.
 */

/** A feed that has not answered, body included, in this long is treated as failed. */
const FETCH_TIMEOUT_MS = 10_000
/** The most of a page read for discovery: a page's head is in its first kilobytes. */
const PAGE_MAX_BYTES = 2 * 1024 * 1024
/** The largest OPML file read. */
const OPML_MAX_BYTES = 1024 * 1024

/** A public request: no cookies either way, and Chromium's HTTP cache not in the way. */
const fetchPublic = (url: string, headers: Record<string, string> = {}) =>
  net.fetch(url, {
    headers: { 'User-Agent': USER_AGENT, ...headers },
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

export function registerFeedsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()

  const send = (sender: WebContents, update: FeedUpdate): void => {
    if (!sender.isDestroyed()) sender.send(CH.feeds.update, update)
  }

  const readStore = cacheFile(
    path.join(app.getPath('userData'), 'feeds-read.json'),
    ReadMarksSchema,
    {},
  )
  const marks = new ReadMarks({ load: readStore.load, save: readStore.save, now: () => Date.now() })

  const createService = (): FeedService => {
    const cache = cacheFile(
      path.join(app.getPath('userData'), 'feeds-cache.json'),
      FeedCacheSchema,
      {},
    )
    return new FeedService({
      fetch: async (url, init) => {
        const response = await fetchPublic(url, init.headers)
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
      isRead: (key) => marks.has(key),
    })
  }
  let service: FeedService | null = null

  const images = new FeedImages({
    fetch: async (url) => {
      const response = await fetchPublic(url)
      if (response.status !== 200) void response.body?.cancel().catch(() => {})
      return {
        status: response.status,
        type: response.headers.get('content-type'),
        url: response.url,
        bytes: () => readBody(response.body, MAX_IMAGE_BYTES, 'image too large'),
        cancel: () => void response.body?.cancel().catch(() => {}),
      }
    },
    shrink: (bytes, width) => {
      const image = nativeImage.createFromBuffer(Buffer.from(bytes))
      if (image.isEmpty()) return null
      const size = image.getSize()
      const fitted = size.width > width ? image.resize({ width, quality: 'good' }) : image
      return `data:image/jpeg;base64,${fitted.toJPEG(80).toString('base64')}`
    },
    feedOf: (url) => service?.imageFeed(url) ?? null,
    now: () => Date.now(),
  })

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

  const findFeeds = (input: unknown): Promise<DiscoverResult> =>
    discover(
      {
        fetch: async (url) => {
          const response = await fetchPublic(url)
          if (response.status !== 200) void response.body?.cancel().catch(() => {})
          return {
            status: response.status,
            url: response.url,
            text: async () =>
              decodeFeed(
                await readBody(response.body, PAGE_MAX_BYTES, 'page too large'),
                response.headers.get('content-type'),
              ),
          }
        },
        parse: async (xml, url) => (await import('../feeds/parse.js')).parseFeed(xml, url),
      },
      input,
    )

  const unregister = registerTable({
    on: {
      [CH.feeds.subscribe]: (event, raw) => {
        const url = asFeed(raw)
        if (url === null) return
        service ??= createService()
        track(event.sender)
        send(event.sender, service.snapshot(url))
        if (registry.subscribe(event.sender, url)) sync(service)
      },
      [CH.feeds.unsubscribe]: (event, raw) => {
        const url = asFeed(raw)
        if (url !== null && registry.unsubscribe(event.sender, url) && service !== null)
          sync(service)
      },
    },
    handle: {
      [CH.feeds.watching]: () => service?.watching() ?? [],
      [CH.feeds.discover]: (_event, raw): Promise<DiscoverResult> => findFeeds(raw),
      [CH.feeds.image]: (_event, raw): Promise<string | null> =>
        typeof raw === 'string' && raw.length <= FEED_IMAGE_URL_MAX
          ? images.get(raw)
          : Promise.resolve(null),
      [CH.feeds.markRead]: (_event, rawFeed, rawKey, rawRead): boolean => {
        const feed = asFeed(rawFeed)
        if (feed === null || service === null) return false
        if (typeof rawKey !== 'string' || rawKey.length > READ_KEY_MAX) return false
        if (typeof rawRead !== 'boolean') return false
        // Only an item a watched feed holds now: the file is never a store for the page's strings.
        const holders = service.feedsWith(rawKey)
        if (!holders.includes(feed)) return false
        if (marks.set(rawKey, rawRead)) for (const url of holders) service.republish(url)
        return true
      },
      [CH.feeds.markAllRead]: (_event, raw): boolean => {
        const held =
          service === null ? null : heldItems((key) => service?.feedsWith(key) ?? [], raw)
        if (service === null || held === null) return false
        if (marks.setMany(held.keys, true).length > 0) {
          for (const url of held.feeds) service.republish(url)
        }
        return true
      },
      [CH.feeds.importOpml]: async (event) => {
        const owner = BrowserWindow.fromWebContents(event.sender)
        const options: Electron.OpenDialogOptions = {
          title: 'Import feeds from OPML',
          properties: ['openFile'],
          buttonLabel: 'Import',
          filters: [
            { name: 'OPML', extensions: ['opml', 'xml'] },
            { name: 'All files', extensions: ['*'] },
          ],
        }
        const picked = owner
          ? await dialog.showOpenDialog(owner, options)
          : await dialog.showOpenDialog(options)
        const file = picked.canceled ? undefined : picked.filePaths[0]
        if (file === undefined) return null
        try {
          // The size first: a file picked by mistake (a video, a disk image) is never read.
          if ((await stat(file)).size > OPML_MAX_BYTES)
            return { ok: false, error: 'file too large' }
          const bytes = await readFile(file)
          const { parseOpml } = await import('../feeds/opml.js')
          return { ok: true, feeds: parseOpml(decodeFeed(bytes, null)) }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) }
        }
      },
      [CH.feeds.exportOpml]: async (event, raw): Promise<string | null> => {
        const { exportList, writeOpml } = await import('../feeds/opml.js')
        const list = exportList(raw)
        if (list === null || list.length === 0) return null
        // The renderer has no filesystem; the path comes from the user's own dialog.
        const result = await showSaveDialogFor(event.sender, {
          defaultPath: 'elecdex-feeds.opml',
          filters: [{ name: 'OPML', extensions: ['opml'] }],
        })
        if (result.canceled || result.filePath === '') return null
        await writeFile(result.filePath, writeOpml(list, new Date()), 'utf8')
        return result.filePath
      },
    },
  })

  return {
    dispose: () => {
      service?.dispose()
      unregister()
    },
  }
}
