import { createHash } from 'node:crypto'
import type { Dirent } from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { LauncherEntry } from '@shared/launcher'
import type { LauncherItem } from '@shared/settings'

/**
 * What the launcher can start: the platform's own application list, plus
 * entries the user adds in settings.json.
 *
 *  - Windows: the Start Menu folders (all users and this user), as shortcuts.
 *  - macOS: .app bundles in /Applications, /System/Applications, ~/Applications.
 *  - Linux: .desktop files in the XDG application directories.
 *
 * Entries carry an opaque id; the renderer launches by id, never by path or
 * command, so a compromised page cannot run anything that is not in the list.
 */

export interface CatalogEntry extends Omit<LauncherEntry, 'launches'> {
  /** What to open: a shortcut, bundle, .desktop file, executable or URL. */
  target: string
  args: string[]
  /** Linux only: the command line from the .desktop file. */
  exec?: string
}

export const idOf = (kind: string, target: string, args: readonly string[] = []): string =>
  createHash('sha1')
    .update(`${kind}\0${target}\0${args.join('\0')}`)
    .digest('hex')
    .slice(0, 16)

/** Shortcuts nobody wants to launch from a HUD. */
const NOISE =
  /\b(uninstall|uninstaller|remove|readme|release notes|license|help|website|manual)\b|アンインストール/i

export function isNoise(name: string): boolean {
  return NOISE.test(name)
}

/** Keeps the first entry per display name; Start Menu often has duplicates across folders. */
export function dedupeByName<T extends { name: string }>(entries: T[]): T[] {
  const seen = new Set<string>()
  return entries.filter((e) => {
    const key = e.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function walk(
  dir: string,
  match: (name: string) => boolean,
  depth: number,
): Promise<string[]> {
  if (depth < 0) return []
  let entries: Dirent[]
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const found: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.endsWith('.app')) {
      found.push(...(await walk(full, match, depth - 1)))
    } else if (match(entry.name)) {
      found.push(full)
    }
  }
  return found
}

async function windowsEntries(): Promise<CatalogEntry[]> {
  const roots = [
    process.env.ProgramData &&
      path.join(process.env.ProgramData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    process.env.APPDATA &&
      path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
  ].filter((r): r is string => Boolean(r))
  const entries: CatalogEntry[] = []
  for (const root of roots) {
    for (const file of await walk(root, (n) => /\.(lnk|url|appref-ms)$/i.test(n), 4)) {
      const name = path.basename(file).replace(/\.(lnk|url|appref-ms)$/i, '')
      const folder = path.relative(root, path.dirname(file))
      entries.push({
        id: idOf('system', file),
        name,
        group: folder === '' ? null : (folder.split(path.sep)[0] ?? null),
        source: 'system',
        target: file,
        args: [],
      })
    }
  }
  return entries
}

async function macEntries(): Promise<CatalogEntry[]> {
  const roots = ['/Applications', '/System/Applications', path.join(os.homedir(), 'Applications')]
  const entries: CatalogEntry[] = []
  for (const root of roots) {
    for (const bundle of await walk(root, (n) => n.endsWith('.app'), 1)) {
      entries.push({
        id: idOf('system', bundle),
        name: path.basename(bundle, '.app'),
        group: null,
        source: 'system',
        target: bundle,
        args: [],
      })
    }
  }
  return entries
}

/** The fields of a .desktop file's [Desktop Entry] group that the launcher uses. */
export function parseDesktopEntry(
  text: string,
): { name: string; exec: string; hidden: boolean; categories: string[] } | null {
  let inEntry = false
  const fields = new Map<string, string>()
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('[')) {
      inEntry = line === '[Desktop Entry]'
      continue
    }
    if (!inEntry || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq > 0) {
      const key = line.slice(0, eq).trim()
      if (!fields.has(key)) fields.set(key, line.slice(eq + 1).trim())
    }
  }
  const name = fields.get('Name')
  const exec = fields.get('Exec')
  if (!name || !exec || fields.get('Type') !== 'Application') return null
  return {
    name,
    exec,
    hidden: fields.get('NoDisplay') === 'true' || fields.get('Hidden') === 'true',
    categories: (fields.get('Categories') ?? '').split(';').filter(Boolean),
  }
}

async function linuxEntries(): Promise<CatalogEntry[]> {
  const dataDirs = (process.env.XDG_DATA_DIRS ?? '/usr/local/share:/usr/share').split(':')
  const home = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
  const entries: CatalogEntry[] = []
  for (const base of [home, ...dataDirs]) {
    for (const file of await walk(
      path.join(base, 'applications'),
      (n) => n.endsWith('.desktop'),
      2,
    )) {
      try {
        const parsed = parseDesktopEntry(await fsp.readFile(file, 'utf8'))
        if (parsed === null || parsed.hidden) continue
        entries.push({
          id: idOf('system', file),
          name: parsed.name,
          group: parsed.categories[0] ?? null,
          source: 'system',
          target: file,
          args: [],
          exec: parsed.exec,
        })
      } catch {
        // Unreadable entry: skip it.
      }
    }
  }
  return entries
}

export async function systemEntries(): Promise<CatalogEntry[]> {
  const all =
    process.platform === 'win32'
      ? await windowsEntries()
      : process.platform === 'darwin'
        ? await macEntries()
        : await linuxEntries()
  return dedupeByName(all.filter((e) => !isNoise(e.name))).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

export function userEntries(items: readonly LauncherItem[]): CatalogEntry[] {
  // The same target and arguments twice would share an id, which the list cannot
  // key on and a launch count cannot tell apart; the first one wins.
  const seen = new Set<string>()
  return items.flatMap((item) => {
    const id = idOf('user', item.target, item.args ?? [])
    if (seen.has(id)) return []
    seen.add(id)
    return [
      {
        id,
        name: item.name,
        group: null,
        source: 'user' as const,
        target: item.target,
        args: [...(item.args ?? [])],
      },
    ]
  })
}

/** Strips .desktop field codes (%U, %f, …) from an Exec line and splits it into argv. */
export function desktopExecArgv(exec: string): string[] {
  const argv: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < exec.length; i++) {
    const ch = exec[i]
    if (ch === '"') {
      quoted = !quoted
    } else if (ch === '\\' && quoted && i + 1 < exec.length) {
      current += exec[++i]
    } else if (ch === ' ' && !quoted) {
      if (current !== '') argv.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current !== '') argv.push(current)
  return argv.filter((arg) => !/^%[a-zA-Z]$/.test(arg)).map((arg) => arg.replace(/%%/g, '%'))
}
