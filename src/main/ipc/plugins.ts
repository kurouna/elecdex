import { type FSWatcher, watch } from 'node:fs'
import path from 'node:path'
import { CH } from '@shared/channels'
import {
  type Grant,
  isPluginHost,
  isStorageKey,
  PLUGIN_ID,
  PLUGIN_LIMITS,
  type PluginCatalog,
  type PluginInstalled,
  parseHostMap,
  TokenBucket,
} from '@shared/plugins'
import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron'
import { appWindows } from '../app-windows.js'
import { APP_VERSION } from '../build-info.js'
import { PluginFolder } from '../plugins/folder.js'
import { type InstallResult, installFromFolder } from '../plugins/install.js'
import { PluginNet } from '../plugins/net.js'
import { closeSignIn, openSignIn, rawRequest, signOut } from '../plugins/sessions.js'
import { PluginStorage } from '../plugins/storage.js'
import { PLUGIN_SAMPLE, PLUGIN_TYPES } from '../plugins/templates.js'
import { showMainWindow, windowInFront } from '../window-control.js'
import type { SettingsHandle } from './settings.js'

/**
 * Plugins IPC (docs/plugins.md): the folder, and everything a plugin's worker asks main
 * to do for it - fetch, storage, sign-in and notifications.
 *
 * The renderer names the plugin; main decides from settings.json alone whether that
 * plugin is enabled and what it was granted. Nothing here runs plugin code.
 */

const RESCAN_DEBOUNCE_MS = 300

export function registerPluginsIpc(settings: SettingsHandle): { dispose: () => void } {
  const userData = app.getPath('userData')
  const folder = new PluginFolder({
    dir: path.join(userData, 'plugins'),
    types: PLUGIN_TYPES,
    sample: PLUGIN_SAMPLE,
  })
  const storage = new PluginStorage(path.join(userData, 'plugin-data'))
  const hostMap = parseHostMap(process.env.ELECDEX_PLUGIN_HOST_MAP)

  /** The grant of an enabled plugin, or null. */
  const grant = (id: unknown): Grant | null => {
    if (typeof id !== 'string' || !PLUGIN_ID.test(id)) return null
    const entry = settings.current().plugins[id]
    return entry?.enabled ? entry.granted : null
  }

  const net = new PluginNet({
    grant,
    now: () => Date.now(),
    hostMap,
    request: (id, options) => rawRequest(id, `elecdex/${APP_VERSION} plugin/${id}`, options),
  })

  let catalog: PluginCatalog | null = null
  const scan = (): PluginCatalog => {
    try {
      folder.prepare()
    } catch (error) {
      console.warn('[elecdex] could not prepare the plugins folder:', error)
    }
    return { folder: folder.dir, plugins: folder.scan() }
  }

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  let watcher: FSWatcher | null = null
  let timer: NodeJS.Timeout | undefined
  const startWatching = (): void => {
    if (watcher !== null) return
    try {
      watcher = watch(folder.dir, { recursive: true, persistent: false }, () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          const next = scan()
          if (JSON.stringify(next) === JSON.stringify(catalog)) return
          catalog = next
          broadcast(CH.plugins.changed, catalog)
        }, RESCAN_DEBOUNCE_MS)
      })
    } catch (error) {
      console.warn('[elecdex] plugins will not reload live:', error)
    }
  }

  ipcMain.handle(CH.plugins.catalog, () => {
    catalog ??= scan()
    startWatching()
    return catalog
  })

  ipcMain.handle(CH.plugins.openFolder, async () => {
    catalog ??= scan()
    await shell.openPath(folder.dir)
  })

  /**
   * Installs a plugin from a folder the user picks.
   *
   * main opens the picker and does the copying: the page never says where to
   * read from, which keeps the boundary where it is (there is no path-taking
   * call in the API). A name already taken is asked about rather than
   * overwritten, since replacing is how a plugin is updated and losing one to a
   * mis-click is not.
   */
  ipcMain.handle(CH.plugins.install, async (event): Promise<PluginInstalled> => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    const source = await pickPluginFolder(owner)
    if (source === null) return { status: 'cancelled' }

    // The folder may not exist yet on a first run.
    catalog ??= scan()
    const first = installFromFolder({ pluginsDir: folder.dir, source })
    const result =
      first.status === 'exists'
        ? await replaceAfterAsking(owner, folder.dir, source, first.name)
        : first
    if (result.status === 'cancelled') return result
    if (result.status !== 'installed') {
      return { status: 'refused', reason: 'reason' in result ? result.reason : 'already there' }
    }

    // The watcher would find it on its own after its debounce; this puts it on
    // screen with the answer, so the plugin is there when the note appears.
    catalog = scan()
    broadcast(CH.plugins.changed, catalog)
    return { status: 'installed', name: result.name, files: result.files }
  })

  ipcMain.handle(CH.plugins.fetch, async (_event, id: unknown, url: unknown, headers: unknown) => {
    if (typeof id !== 'string' || typeof url !== 'string' || url.length > 2048) {
      return { ok: false, error: 'invalid request' }
    }
    const extra =
      typeof headers === 'object' && headers !== null
        ? Object.fromEntries(
            Object.entries(headers).filter((e): e is [string, string] => typeof e[1] === 'string'),
          )
        : undefined
    try {
      return { ok: true, ...(await net.fetch(id, url, extra)) }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle(CH.plugins.storageLoad, (_event, id: unknown) =>
    grant(id) === null ? {} : storage.load(id as string),
  )

  ipcMain.handle(
    CH.plugins.storageSet,
    (_event, id: unknown, key: unknown, value: unknown, remove: unknown) => {
      if (grant(id) === null || !isStorageKey(key)) return false
      return storage.set(id as string, key, value, remove === true)
    },
  )

  ipcMain.handle(CH.plugins.signIn, async (_event, id: unknown, host: unknown) => {
    const granted = grant(id)
    if (granted === null || !isPluginHost(host) || !granted.session.includes(host)) return
    const mapped = hostMap.get(host)
    await openSignIn(
      id as string,
      mapped ? `http://${mapped}/` : `https://${host}/`,
      appWindows()[0],
      () => broadcast(CH.plugins.session, id),
    )
    broadcast(CH.plugins.session, id)
  })

  // The plugin says its requests work now: the user need not close the window by hand.
  ipcMain.on(CH.plugins.closeSignIn, (_event, id: unknown) => {
    if (typeof id === 'string' && PLUGIN_ID.test(id)) closeSignIn(id)
  })

  ipcMain.handle(CH.plugins.signOut, async (_event, id: unknown) => {
    if (typeof id !== 'string' || !PLUGIN_ID.test(id)) return
    await signOut(id)
    broadcast(CH.plugins.session, id)
  })

  ipcMain.handle(CH.plugins.forget, async (_event, id: unknown) => {
    if (typeof id !== 'string' || !PLUGIN_ID.test(id)) return
    storage.clear(id)
    net.forget(id)
    await signOut(id)
    broadcast(CH.plugins.session, id)
  })

  const notices = new Map<string, TokenBucket>()
  ipcMain.on(CH.plugins.notify, (_event, id: unknown, message: unknown) => {
    const granted = grant(id)
    if (granted === null || !granted.notify || !Notification.isSupported()) return
    const { title, body } = (message ?? {}) as { title?: unknown; body?: unknown }
    if (typeof title !== 'string') return
    let bucket = notices.get(id as string)
    if (bucket === undefined) {
      bucket = new TokenBucket(2, PLUGIN_LIMITS.notifyPerMinute, Date.now())
      notices.set(id as string, bucket)
    }
    if (!bucket.take(Date.now())) return
    if (windowInFront()) return
    const notification = new Notification({
      title: title.slice(0, 200),
      body: typeof body === 'string' ? body.slice(0, 500) : '',
    })
    notification.on('click', showMainWindow)
    notification.show()
  })

  return {
    dispose: () => {
      storage.flush()
      clearTimeout(timer)
      watcher?.close()
      for (const channel of [
        CH.plugins.catalog,
        CH.plugins.openFolder,
        CH.plugins.install,
        CH.plugins.fetch,
        CH.plugins.storageLoad,
        CH.plugins.storageSet,
        CH.plugins.signIn,
        CH.plugins.signOut,
        CH.plugins.forget,
      ]) {
        ipcMain.removeHandler(channel)
      }
      ipcMain.removeAllListeners(CH.plugins.notify)
      ipcMain.removeAllListeners(CH.plugins.closeSignIn)
    },
  }
}

/** The folder to install from, or null when the picker was closed. */
async function pickPluginFolder(owner: BrowserWindow | null): Promise<string | null> {
  const options: Electron.OpenDialogOptions = {
    title: 'Install a plugin from a folder',
    properties: ['openDirectory'],
    buttonLabel: 'Install',
  }
  const picked = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options)
  return picked.canceled ? null : (picked.filePaths[0] ?? null)
}

/**
 * Asks before replacing a plugin of the same name, and replaces it if the user
 * says so. What it is allowed to do and what it saved are keyed by its id, so
 * they are untouched - and a plugin whose id changed asks for consent again on
 * its own (docs/plugins.md).
 */
async function replaceAfterAsking(
  owner: BrowserWindow | null,
  pluginsDir: string,
  source: string,
  name: string,
): Promise<InstallResult | { status: 'cancelled' }> {
  const question: Electron.MessageBoxOptions = {
    type: 'question',
    message: `Replace the plugin "${name}"?`,
    detail: 'Its files are replaced. What it is allowed to do, and anything it saved, stay.',
    buttons: ['Replace', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
  }
  const answer = owner
    ? await dialog.showMessageBox(owner, question)
    : await dialog.showMessageBox(question)
  if (answer.response !== 0) return { status: 'cancelled' }
  return installFromFolder({ pluginsDir, source, replace: true })
}
