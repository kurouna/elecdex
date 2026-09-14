import { spawn } from 'node:child_process'
import path from 'node:path'
import { CH } from '@shared/channels'
import {
  type LauncherEntry,
  type LaunchResult,
  type LaunchUsage,
  rankByUse,
  recordLaunch,
} from '@shared/launcher'
import { app, ipcMain, shell } from 'electron'
import { z } from 'zod'
import {
  type CatalogEntry,
  desktopExecArgv,
  systemEntries,
  userEntries,
} from '../launcher/catalog.js'
import { IconBatcher } from '../launcher/windows-icons.js'
import { JsonStore } from '../store/json-store.js'
import { openExternalIfSafe } from '../window.js'
import type { SettingsHandle } from './settings.js'

/**
 * The application launcher's IPC.
 *
 * The catalog lives here. The renderer receives names and opaque ids, asks for
 * an icon by id, and launches by id - so the only programs a page can start are
 * the ones in the Start Menu (or equivalent) and the ones the user put in
 * settings.json.
 *
 * Successful launches are counted in launcher-usage.json (by id, which is a hash
 * of the target, so it survives restarts) and the list is ordered by them.
 */

const UsageSchema = z.record(
  z.string().max(64),
  z.object({ count: z.number().int().nonnegative(), last: z.number().nonnegative() }),
)

/** Rescan the platform's application list at most this often. */
const SYSTEM_CACHE_MS = 60_000

/** Icons are cached for the life of the app; a changed shortcut icon is rare. */
const ICON_CACHE_LIMIT = 1000

export function registerLauncherIpc(settings: SettingsHandle): { dispose: () => void } {
  let system: { at: number; entries: CatalogEntry[] } | null = null
  const icons = new Map<string, string | null>()
  const shellIcons = process.platform === 'win32' ? new IconBatcher() : null
  let byId = new Map<string, CatalogEntry>()
  const usage = new JsonStore<Record<string, LaunchUsage>>({
    file: path.join(app.getPath('userData'), 'launcher-usage.json'),
    schema: UsageSchema,
    makeDefault: () => ({}),
  })

  const catalog = async (): Promise<CatalogEntry[]> => {
    const { showSystem, items } = settings.current().launcher
    let systemList: CatalogEntry[] = []
    if (showSystem) {
      if (system === null || Date.now() - system.at > SYSTEM_CACHE_MS) {
        system = { at: Date.now(), entries: await systemEntries() }
      }
      systemList = system.entries
    }
    const all = [...userEntries(items), ...systemList]
    byId = new Map(all.map((e) => [e.id, e]))
    return all
  }

  ipcMain.handle(CH.launcher.list, async (): Promise<LauncherEntry[]> => {
    const counts = usage.read()
    return rankByUse(await catalog(), counts).map(({ id, name, group, source }) => ({
      id,
      name,
      group,
      source,
      launches: counts[id]?.count ?? 0,
    }))
  })

  ipcMain.handle(CH.launcher.icon, async (_event, raw: unknown): Promise<string | null> => {
    if (typeof raw !== 'string') return null
    if (icons.has(raw)) return icons.get(raw) ?? null
    const entry = byId.get(raw)
    if (!entry || /^https?:/i.test(entry.target)) return null
    const data = (await shellIcons?.get(entry.target)) ?? (await electronIcon(entry.target))
    if (icons.size < ICON_CACHE_LIMIT) icons.set(raw, data)
    return data
  })

  ipcMain.handle(CH.launcher.launch, async (_event, raw: unknown): Promise<LaunchResult> => {
    if (typeof raw !== 'string') return { ok: false, error: 'invalid id' }
    if (!byId.has(raw)) await catalog() // the page may hold an id from before a settings edit
    const entry = byId.get(raw)
    if (!entry) return { ok: false, error: 'not in the launcher' }
    const result = await launch(entry)
    if (result.ok) {
      try {
        usage.write(recordLaunch(usage.read(), entry.id, Date.now()))
      } catch (error) {
        // A count that cannot be saved is not worth failing a launch that worked.
        console.error('[elecdex] cannot save launcher usage', error)
      }
    }
    return result
  })

  return {
    dispose: () => {
      ipcMain.removeHandler(CH.launcher.list)
      ipcMain.removeHandler(CH.launcher.icon)
      ipcMain.removeHandler(CH.launcher.launch)
    },
  }
}

/**
 * The icon Electron finds, where the Windows shell gives none (or elsewhere than
 * Windows). See launcher/windows-icons.ts for why it is not the first choice there.
 */
async function electronIcon(target: string): Promise<string | null> {
  try {
    const image = await app.getFileIcon(iconSource(target), { size: 'normal' })
    return image.isEmpty() ? null : image.toDataURL()
  } catch {
    return null
  }
}

/**
 * Where to take an entry's icon from. A Windows shortcut's own icon is the
 * generic shortcut arrow; the icon worth showing is its target's.
 */
function iconSource(target: string): string {
  if (process.platform !== 'win32' || !target.toLowerCase().endsWith('.lnk')) return target
  try {
    const link = shell.readShortcutLink(target)
    // The icon field often names a DLL or .ico with an index that getFileIcon
    // cannot pick out; the target executable carries the same icon.
    return link.target || target
  } catch {
    return target
  }
}

async function launch(entry: CatalogEntry): Promise<LaunchResult> {
  try {
    if (/^https?:\/\//i.test(entry.target)) {
      await openExternalIfSafe(entry.target)
      return { ok: true }
    }
    if (entry.exec !== undefined) return detached(desktopExecArgv(entry.exec))
    if (entry.args.length > 0) return detached([entry.target, ...entry.args])
    const error = await shell.openPath(entry.target)
    return error === '' ? { ok: true } : { ok: false, error }
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) }
  }
}

/** Starts a program that outlives elecdex, without a shell in between. */
function detached(argv: string[]): LaunchResult {
  const [program, ...args] = argv
  if (!program) return { ok: false, error: 'empty command' }
  const child = spawn(program, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
    cwd: path.isAbsolute(program) ? path.dirname(program) : undefined,
  })
  child.on('error', () => {})
  child.unref()
  return { ok: true }
}
