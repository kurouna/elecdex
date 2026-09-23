import path from 'node:path'
import { CH } from '@shared/channels'
import { isOrbitSet, type OrbitSet, type OrbitUpdate } from '@shared/orbits'
import { app, ipcMain, net, type WebContents } from 'electron'
import { USER_AGENT } from '../build-info.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { type OrbitCache, OrbitCacheSchema, OrbitService } from '../orbits/service.js'
import { cacheFile } from '../store/cache-file.js'

/**
 * Orbits IPC: ORBIT panes subscribe to a set of elements; main keeps only those.
 *
 * Nothing is asked of CelesTrak until a pane shows a set (the Starlink set only
 * once a pane turns it on), and each set keeps its copy on disk, so a restart
 * asks for nothing that is not due. Tests point ELECDEX_CELESTRAK_BASE_URL at a
 * closed port or a local stand-in.
 */

const FETCH_TIMEOUT_MS = 30_000

export function registerOrbitsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const tracked = new WeakSet<WebContents>()
  const files = new Map<OrbitSet, ReturnType<typeof cacheFile<OrbitCache | null>>>()
  const file = (set: OrbitSet) => {
    let found = files.get(set)
    if (found === undefined) {
      found = cacheFile(
        path.join(app.getPath('userData'), `orbits-${set}.json`),
        OrbitCacheSchema.nullable(),
        null,
      )
      files.set(set, found)
    }
    return found
  }

  const send = (sender: WebContents, update: OrbitUpdate): void => {
    if (!sender.isDestroyed()) sender.send(CH.orbits.update, update)
  }

  const service = new OrbitService({
    baseUrl: (process.env.ELECDEX_CELESTRAK_BASE_URL ?? 'https://celestrak.org').replace(/\/$/, ''),
    userAgent: USER_AGENT,
    fetch: async (url, headers) => {
      const response = await net.fetch(url, {
        headers,
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      return {
        status: response.status,
        text: (limit) => readText(response, limit),
        discard: () => void response.body?.cancel().catch(() => {}),
      }
    },
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    load: (set) => file(set).load(),
    save: (set, cache) => file(set).save(cache),
    publish: (update) => {
      for (const sender of registry.subscribers(update.set)) send(sender, update)
    },
  })

  const sync = (): void => {
    const active = new Set(registry.activeSources())
    for (const set of service.watching()) if (!active.has(set)) service.unwatch(set)
    for (const set of active) if (isOrbitSet(set)) service.watch(set)
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

  ipcMain.on(CH.orbits.subscribe, (event, raw: unknown) => {
    if (!isOrbitSet(raw)) return
    track(event.sender)
    send(event.sender, service.snapshot(raw))
    if (registry.subscribe(event.sender, raw)) sync()
  })

  ipcMain.on(CH.orbits.unsubscribe, (event, raw: unknown) => {
    if (isOrbitSet(raw) && registry.unsubscribe(event.sender, raw)) sync()
  })

  ipcMain.handle(CH.orbits.watching, () => service.watching())

  return {
    dispose: () => {
      service.dispose()
      ipcMain.removeAllListeners(CH.orbits.subscribe)
      ipcMain.removeAllListeners(CH.orbits.unsubscribe)
      ipcMain.removeHandler(CH.orbits.watching)
    },
  }
}

/** The body as text, or null when it runs past `limit` bytes. */
async function readText(response: Response, limit: number): Promise<string | null> {
  const reader = response.body?.getReader()
  if (reader === undefined) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
