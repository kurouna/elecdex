import { type FSWatcher, watch } from 'node:fs'
import { CH } from '@shared/channels'
import { ipcMain, type WebContents } from 'electron'
import { diskUsage, listDrives, readDirectory, validatePath } from '../fs/listing.js'
import { SubscriptionRegistry } from '../metrics/subscriptions.js'

/**
 * Filesystem IPC: read-only listings, volume usage, drives, and directory watches.
 *
 * Watches follow the same rule as metric subscriptions: one OS watcher per
 * directory however many panes watch it, closed when the last watcher lets go,
 * and every watch of a page dropped when that page reloads or closes.
 */

/** Changes within this window are reported once; a `git checkout` touches hundreds. */
const CHANGE_DEBOUNCE_MS = 200

export function registerFsIpc(): { dispose: () => void } {
  const registry = new SubscriptionRegistry<WebContents>()
  const watchers = new Map<string, { watcher: FSWatcher; timer: NodeJS.Timeout | null }>()
  const tracked = new WeakSet<WebContents>()

  const notify = (dir: string): void => {
    for (const sender of registry.subscribers(dir)) {
      if (!sender.isDestroyed()) sender.send(CH.fs.changed, dir)
    }
  }

  const open = (dir: string): void => {
    try {
      const watcher = watch(dir, { persistent: false }, () => {
        const entry = watchers.get(dir)
        if (!entry || entry.timer !== null) return
        entry.timer = setTimeout(() => {
          entry.timer = null
          notify(dir)
        }, CHANGE_DEBOUNCE_MS)
      })
      // A watched directory that is deleted or becomes unreadable: stop quietly.
      // The widget still refreshes on the next cwd change.
      watcher.on('error', () => close(dir))
      watchers.set(dir, { watcher, timer: null })
    } catch {
      // Not watchable (permissions, a network path). Listings still work.
    }
  }

  const close = (dir: string): void => {
    const entry = watchers.get(dir)
    if (!entry) return
    if (entry.timer !== null) clearTimeout(entry.timer)
    entry.watcher.close()
    watchers.delete(dir)
  }

  const syncWatchers = (): void => {
    const active = new Set(registry.activeSources())
    for (const dir of [...watchers.keys()]) if (!active.has(dir)) close(dir)
    for (const dir of active) if (!watchers.has(dir)) open(dir)
  }

  const track = (sender: WebContents): void => {
    if (tracked.has(sender)) return
    tracked.add(sender)
    const drop = (): void => {
      if (registry.dropSubscriber(sender)) syncWatchers()
    }
    sender.once('destroyed', drop)
    sender.on('did-start-navigation', (details) => {
      if (details.isMainFrame && !details.isSameDocument) drop()
    })
  }

  ipcMain.handle(CH.fs.readDir, async (_event, raw: unknown) => {
    const dir = validatePath(raw)
    if (dir === null) return { ok: false, error: 'EINVAL' }
    return readDirectory(dir)
  })

  ipcMain.handle(CH.fs.diskUsage, async (_event, raw: unknown) => {
    const target = validatePath(raw)
    return target === null ? null : diskUsage(target)
  })

  ipcMain.handle(CH.fs.drives, () => listDrives())

  ipcMain.on(CH.fs.watch, (event, raw: unknown) => {
    const dir = validatePath(raw)
    if (dir === null) return
    track(event.sender)
    if (registry.subscribe(event.sender, dir)) syncWatchers()
  })

  ipcMain.on(CH.fs.unwatch, (event, raw: unknown) => {
    const dir = validatePath(raw)
    if (dir === null) return
    if (registry.unsubscribe(event.sender, dir)) syncWatchers()
  })

  return {
    dispose: () => {
      for (const dir of [...watchers.keys()]) close(dir)
      ipcMain.removeHandler(CH.fs.readDir)
      ipcMain.removeHandler(CH.fs.diskUsage)
      ipcMain.removeHandler(CH.fs.drives)
      ipcMain.removeAllListeners(CH.fs.watch)
      ipcMain.removeAllListeners(CH.fs.unwatch)
    },
  }
}
