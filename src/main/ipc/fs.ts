import { watch } from 'node:fs'
import { CH } from '@shared/channels'
import type { WebContents } from 'electron'
import { DirWatches } from '../fs/dir-watches.js'
import { listDrives, readDirectory, validatePath } from '../fs/listing.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'
import { whenPageGoes } from './page-gone.js'
import { registerTable } from './table.js'

/**
 * Filesystem IPC: read-only listings, volume usage, drives, and directory watches.
 *
 * Watches follow the same rule as metric subscriptions: one OS watcher per
 * directory however many panes watch it, closed when the last watcher lets go,
 * and every watch of a page dropped when that page reloads or closes.
 */

export function registerFsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const watches = new DirWatches({
    watch: (dir, onChange, onError) => {
      const watcher = watch(dir, { persistent: false }, onChange)
      watcher.on('error', () => {
        watcher.close()
        onError()
      })
      return watcher
    },
    notify: (dir) => {
      for (const sender of registry.subscribers(dir)) {
        if (!sender.isDestroyed()) sender.send(CH.fs.changed, dir)
      }
    },
    active: () => registry.activeSources(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (timer) => clearTimeout(timer as NodeJS.Timeout),
  })
  const syncWatchers = (): void => watches.sync()

  const track = (sender: WebContents): void => {
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) syncWatchers()
    }
    whenPageGoes(sender, registry, drop)
  }

  const unregister = registerTable({
    handle: {
      [CH.fs.readDir]: async (_event, raw) => {
        const dir = validatePath(raw)
        if (dir === null) return { ok: false, error: 'EINVAL' }
        return readDirectory(dir)
      },
      [CH.fs.drives]: () => listDrives(),
    },
    on: {
      [CH.fs.watch]: (event, raw) => {
        const dir = validatePath(raw)
        if (dir === null) return
        track(event.sender)
        if (registry.subscribe(event.sender, dir)) syncWatchers()
      },
      [CH.fs.unwatch]: (event, raw) => {
        const dir = validatePath(raw)
        if (dir === null) return
        if (registry.unsubscribe(event.sender, dir)) syncWatchers()
      },
    },
  })

  return {
    dispose: () => {
      watches.dispose()
      unregister()
    },
  }
}
