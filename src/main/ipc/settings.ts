import {
  existsSync,
  type FSWatcher,
  mkdirSync,
  readdirSync,
  readFileSync,
  unwatchFile,
  watch,
  watchFile,
} from 'node:fs'
import path from 'node:path'
import type { ThemeCatalog } from '@shared/api'
import { CH } from '@shared/channels'
import {
  applySettingsPatch,
  defaultSettings,
  type Settings,
  SettingsSchema,
} from '@shared/settings'
import {
  BUILTIN_THEMES,
  mergeThemes,
  type Theme,
  type ThemeProblem,
  ThemeSchema,
} from '@shared/theme'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { JsonStore } from '../store/json-store.js'

/**
 * Settings and themes.
 *
 * Both are files the user may edit by hand while the app runs - settings.json,
 * and theme files in the themes/ folder - so both are watched and every change
 * is pushed to every window. A half-saved edit that does not parse is ignored
 * until the next save rather than quarantined, because an editor writing the
 * file is not a corrupt file. (A file that is invalid at startup is quarantined
 * as usual by JsonStore.)
 */

/** Editors write in bursts: a truncate, a write, a rename. Settle before reading. */
const RELOAD_DEBOUNCE_MS = 150

/**
 * settings.json is also checked by modification time this often. fs.watch misses
 * events on some Windows setups (seen on CI runners); one stat a second is the
 * cost of never missing a hand edit.
 */
const SETTINGS_POLL_MS = 1000

/** A file caught mid-write is read again this many times before giving up until the next change. */
const UNREADABLE_RETRIES = 3
const UNREADABLE_RETRY_MS = 400

export interface SettingsHandle {
  dispose: () => void
  /** The settings in effect now. */
  current: () => Settings
  /** Called after every change, from the UI or a hand edit. */
  onChange: (handler: (settings: Settings) => void) => void
  /** Absolute path of settings.json. */
  file: string
}

export function registerSettingsIpc(): SettingsHandle {
  const userData = app.getPath('userData')
  const settingsFile = path.join(userData, 'settings.json')
  const themesDir = path.join(userData, 'themes')

  const store = new JsonStore<Settings>({
    file: settingsFile,
    schema: SettingsSchema,
    makeDefault: defaultSettings,
  })
  let settings = store.read()
  let catalog = loadThemes(themesDir)

  const listeners = new Set<(settings: Settings) => void>()
  const notify = (): void => {
    for (const listener of listeners) listener(settings)
  }

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  let retry: NodeJS.Timeout | undefined
  const reloadSettings = (attempt = 0): void => {
    clearTimeout(retry)
    const next = readSettingsQuietly(settingsFile)
    if (next === null) {
      // Half-written, or locked for a moment by the editor or a virus scanner.
      if (attempt < UNREADABLE_RETRIES) {
        retry = setTimeout(() => reloadSettings(attempt + 1), UNREADABLE_RETRY_MS)
      }
      return
    }
    if (JSON.stringify(next) === JSON.stringify(settings)) return
    settings = next
    store.invalidate()
    broadcast(CH.settings.changed, settings)
    notify()
  }

  const reloadThemes = (): void => {
    const next = loadThemes(themesDir)
    if (JSON.stringify(next) === JSON.stringify(catalog)) return
    catalog = next
    broadcast(CH.themes.changed, catalog)
  }

  const watchers: FSWatcher[] = []
  const timers = new Map<string, NodeJS.Timeout>()
  const debounced = (key: string, fn: () => void) => () => {
    const pending = timers.get(key)
    if (pending) clearTimeout(pending)
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        fn()
      }, RELOAD_DEBOUNCE_MS),
    )
  }

  try {
    mkdirSync(themesDir, { recursive: true })
    // Watch the folder, not the file: editors that save by renaming a temp file
    // over the original would leave a file watcher attached to a deleted inode.
    watchers.push(
      watch(userData, { persistent: false }, (_event, name) => {
        if (name === 'settings.json') debounced('settings', () => reloadSettings())()
      }),
      watch(themesDir, { persistent: false }, debounced('themes', reloadThemes)),
    )
    watchFile(settingsFile, { persistent: false, interval: SETTINGS_POLL_MS }, (now, before) => {
      if (now.mtimeMs !== before.mtimeMs) debounced('settings', () => reloadSettings())()
    })
  } catch (error) {
    console.warn('[elecdex] settings will not reload live:', error)
  }

  ipcMain.handle(CH.settings.get, () => settings)

  ipcMain.handle(CH.settings.patch, (_event, raw: unknown): Settings => {
    const next = applySettingsPatch(settings, raw)
    if (next === null) return settings
    settings = next
    store.write(next)
    broadcast(CH.settings.changed, settings)
    notify()
    return settings
  })

  ipcMain.handle(CH.themes.list, (): ThemeCatalog => catalog)
  ipcMain.handle(CH.themes.folder, () => themesDir)
  // Opens settings.json in the user's editor, for things the UI does not edit yet.
  ipcMain.handle(CH.settings.openFile, async () => {
    if (!existsSync(settingsFile)) store.write(settings)
    const error = await shell.openPath(settingsFile)
    return error === '' ? null : error
  })

  return {
    current: () => settings,
    onChange: (handler) => {
      listeners.add(handler)
    },
    file: settingsFile,
    dispose: () => {
      for (const watcher of watchers) watcher.close()
      unwatchFile(settingsFile)
      clearTimeout(retry)
      for (const timer of timers.values()) clearTimeout(timer)
      ipcMain.removeHandler(CH.settings.get)
      ipcMain.removeHandler(CH.settings.patch)
      ipcMain.removeHandler(CH.themes.list)
      ipcMain.removeHandler(CH.themes.folder)
      ipcMain.removeHandler(CH.settings.openFile)
    },
  }
}

function readSettingsQuietly(file: string): Settings | null {
  try {
    const parsed = SettingsSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Built-in themes plus every valid *.json in the themes folder. */
export function loadThemes(dir: string): ThemeCatalog {
  const user: Theme[] = []
  const problems: ThemeProblem[] = []
  let files: string[] = []
  try {
    files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json'))
  } catch {
    // No folder yet: built-ins only.
  }
  for (const file of files.sort()) {
    try {
      const parsed = ThemeSchema.safeParse(JSON.parse(readFileSync(path.join(dir, file), 'utf8')))
      if (parsed.success) {
        user.push(parsed.data)
      } else {
        problems.push({
          file,
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        })
      }
    } catch (error) {
      problems.push({ file, message: error instanceof Error ? error.message : String(error) })
    }
  }
  return { themes: mergeThemes(BUILTIN_THEMES, user), problems }
}
