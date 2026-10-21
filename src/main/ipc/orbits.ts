import path from 'node:path'
import { CH } from '@shared/channels'
import { isOrbitSet, type OrbitSet, type OrbitUpdate } from '@shared/orbits'
import { app, net, type WebContents } from 'electron'
import { USER_AGENT } from '../build-info.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { type OrbitCache, OrbitCacheSchema, OrbitService } from '../orbits/service.js'
import { readLimited } from '../read-limited.js'
import { cacheFile } from '../store/cache-file.js'
import { whenPageGoes } from './page-gone.js'
import { registerTable } from './table.js'

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
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) sync()
    }
    whenPageGoes(sender, registry, drop)
  }

  const unregister = registerTable({
    on: {
      [CH.orbits.subscribe]: (event, raw) => {
        if (!isOrbitSet(raw)) return
        track(event.sender)
        send(event.sender, service.snapshot(raw))
        if (registry.subscribe(event.sender, raw)) sync()
      },
      [CH.orbits.unsubscribe]: (event, raw) => {
        if (isOrbitSet(raw) && registry.unsubscribe(event.sender, raw)) sync()
      },
    },
    handle: {
      [CH.orbits.watching]: () => service.watching().sort(),
    },
  })

  return {
    dispose: () => {
      service.dispose()
      unregister()
    },
  }
}

const TOO_LARGE = 'orbital elements too large'

/** The body as text, or null when it runs past `limit` bytes (read-limited.ts reads it). */
async function readText(response: Response, limit: number): Promise<string | null> {
  try {
    return new TextDecoder().decode(await readLimited(response.body, limit, TOO_LARGE))
  } catch (error) {
    if (error instanceof Error && error.message === TOO_LARGE) return null
    throw error
  }
}
