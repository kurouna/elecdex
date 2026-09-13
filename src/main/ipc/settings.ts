import { type FSWatcher, mkdirSync, readdirSync, readFileSync, watch } from 'node:fs'
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
import { app, BrowserWindow, ipcMain } from 'electron'
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

export function registerSettingsIpc(): { dispose: () => void } {
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

  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  const reloadSettings = (): void => {
    const next = readSettingsQuietly(settingsFile)
    if (next === null || JSON.stringify(next) === JSON.stringify(settings)) return
    settings = next
    store.invalidate()
    broadcast(CH.settings.changed, settings)
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
        if (name === 'settings.json') debounced('settings', reloadSettings)()
      }),
      watch(themesDir, { persistent: false }, debounced('themes', reloadThemes)),
    )
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
    return settings
  })

  ipcMain.handle(CH.themes.list, (): ThemeCatalog => catalog)
  ipcMain.handle(CH.themes.folder, () => themesDir)

  return {
    dispose: () => {
      for (const watcher of watchers) watcher.close()
      for (const timer of timers.values()) clearTimeout(timer)
      ipcMain.removeHandler(CH.settings.get)
      ipcMain.removeHandler(CH.settings.patch)
      ipcMain.removeHandler(CH.themes.list)
      ipcMain.removeHandler(CH.themes.folder)
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
