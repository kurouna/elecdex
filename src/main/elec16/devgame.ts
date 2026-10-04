import {
  existsSync,
  type FSWatcher,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  watch,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { replaceFile } from '../store/replace-file.js'

/**
 * ELEC-16 PLAY's development folders (docs/elec16-play.md section 11): a game's folder opened
 * from the GAMES panel, its files read for the page to build (e16c runs in the page's worker,
 * never here), watched while the page wants it, and the two files the build makes written
 * back. Main remembers the folder for each page and gives the page only its name.
 *
 * What is read is only what game.json names, inside the folder: no `..`, no absolute path, no
 * file outside it, every file and the whole held to a size. What is written is only
 * assets.e16.ts and compiled.s in that folder - or, for a new game, the template into an
 * empty folder the user picked.
 */

/** The files a build writes back, the only ones main writes into a game's folder. */
export const WRITTEN_BACK = ['assets.e16.ts', 'compiled.s'] as const
const FILE_MAX = 4 * 1024 * 1024
const TOTAL_MAX = 16 * 1024 * 1024
const WATCH_SETTLE_MS = 300

const NameSchema = z.string().min(1).max(200)
const MetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  sources: z.array(z.union([NameSchema, z.object({ file: NameSchema, bank: z.number() })])).min(1),
  palettes: z.object({ png: NameSchema, names: z.array(z.string()) }),
  sheets: z.array(z.object({ png: NameSchema })).default([]),
  maps: z.array(z.object({ png: NameSchema })).default([]),
  music: z.array(NameSchema).default([]),
  tables: z.array(z.object({ file: NameSchema })).default([]),
})

/** What the page builds from: game.json as written, the text files and the pictures by name. */
export interface DevFiles {
  meta: string
  texts: Record<string, string>
  pictures: Record<string, Uint8Array>
}

export type DevRead = { ok: true; files: DevFiles } | { ok: false; problem: string }

/** The names game.json lists, the texts and the pictures apart; or why it cannot be read. */
export function listedFiles(meta: unknown): { texts: string[]; pictures: string[] } | string {
  const parsed = MetaSchema.safeParse(meta)
  if (!parsed.success) return 'game.json is not a kit game (it needs sources and palettes)'
  const m = parsed.data
  const texts = [
    ...m.sources.map((s) => (typeof s === 'string' ? s : s.file)),
    ...m.music,
    ...m.tables.map((t) => t.file),
  ]
  const pictures = [m.palettes.png, ...m.sheets.map((s) => s.png), ...m.maps.map((x) => x.png)]
  const bad = [...texts, ...pictures].find((n) => !insideName(n))
  if (bad !== undefined) return `${bad} is not a file inside the folder`
  return { texts: [...new Set(texts)], pictures: [...new Set(pictures)] }
}

/** A name that stays inside the folder: relative, no `..` part, forward or back slashes. */
export function insideName(name: string): boolean {
  if (path.isAbsolute(name) || /^[a-zA-Z]:/.test(name) || name.includes('\0')) return false
  return !name.split(/[\\/]/).some((part) => part === '..' || part === '')
}

/** Reads a game folder's files for a build. */
export function readGameFolder(dir: string): DevRead {
  const meta = readMeta(dir)
  if (typeof meta !== 'object') return { ok: false, problem: meta }
  const listed = listedFiles(meta.json)
  if (typeof listed === 'string') return { ok: false, problem: listed }
  const files: DevFiles = { meta: meta.text, texts: {}, pictures: {} }
  const total = { bytes: meta.text.length }
  const texts = gather(dir, listed.texts, total)
  if (typeof texts === 'string') return { ok: false, problem: texts }
  const pictures = gather(dir, listed.pictures, total)
  if (typeof pictures === 'string') return { ok: false, problem: pictures }
  for (const [name, bytes] of Object.entries(texts))
    files.texts[name] = new TextDecoder().decode(bytes)
  files.pictures = pictures
  return { ok: true, files }
}

/** game.json, as text and parsed; or why not. */
function readMeta(dir: string): { text: string; json: unknown } | string {
  let text: string
  try {
    text = readFileSync(path.join(dir, 'game.json'), 'utf8')
  } catch {
    return 'the folder has no game.json'
  }
  try {
    return { text, json: JSON.parse(text) }
  } catch (e) {
    return `game.json: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** The named files' bytes, the running total kept under 16 MB; or what stopped it. */
function gather(
  dir: string,
  names: string[],
  total: { bytes: number },
): Record<string, Uint8Array> | string {
  const out: Record<string, Uint8Array> = {}
  for (const name of names) {
    const got = readInside(dir, name)
    if (typeof got === 'string') return got
    total.bytes += got.length
    if (total.bytes > TOTAL_MAX) return "the game's files are more than 16 MB"
    out[name] = got
  }
  return out
}

/** One file of the folder, if it is inside it, a file, and small enough. */
function readInside(dir: string, name: string): Uint8Array | string {
  const file = path.resolve(dir, name)
  const root = path.resolve(dir)
  if (file !== root && !file.startsWith(root + path.sep)) return `${name} is not inside the folder`
  try {
    const st = statSync(file)
    if (!st.isFile()) return `${name} is not a file`
    if (st.size > FILE_MAX) return `${name} is more than 4 MB`
    return new Uint8Array(readFileSync(file))
  } catch {
    return `${name} could not be read`
  }
}

/** The build's two files into the folder, each only when it changed. */
export function writeBack(dir: string, assets: string, compiled: string): void {
  for (const [name, text] of [
    [WRITTEN_BACK[0], assets],
    [WRITTEN_BACK[1], compiled],
  ] as const) {
    const file = path.join(dir, name)
    try {
      if (existsSync(file) && readFileSync(file, 'utf8') === text) continue
    } catch {
      // Unreadable: written afresh.
    }
    writeFileSync(`${file}.tmp`, text)
    replaceFile(`${file}.tmp`, file)
  }
}

/**
 * A new game: the template's files into `dir`, which must hold no game.json (the user's work
 * is never written over). `files` maps a name under the folder to its bytes.
 */
export function writeTemplate(
  dir: string,
  files: Record<string, Uint8Array | string>,
): string | null {
  if (existsSync(path.join(dir, 'game.json'))) return 'the folder already has a game.json'
  for (const [name, content] of Object.entries(files)) {
    if (!insideName(name)) return `${name} is not a file inside the folder`
    const file = path.join(dir, name)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
  return null
}

/** The template's files read from a folder of the app's resources, by their names inside it. */
export function templateFiles(root: string): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {}
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = prefix === '' ? entry.name : `${prefix}/${entry.name}`
      if (entry.isDirectory()) walk(path.join(dir, entry.name), name)
      else out[name] = new Uint8Array(readFileSync(path.join(dir, entry.name)))
    }
  }
  walk(root, '')
  return out
}

/**
 * The folder each page has open, and its watch while the page wants one. A change to anything
 * but the two files the build writes back is told after it settles.
 */
export class DevFolders {
  readonly #open = new Map<
    number,
    { dir: string; watcher: FSWatcher | null; timer: ReturnType<typeof setTimeout> | null }
  >()

  open(page: number, dir: string): void {
    this.close(page)
    this.#open.set(page, { dir, watcher: null, timer: null })
  }

  dirOf(page: number): string | null {
    return this.#open.get(page)?.dir ?? null
  }

  /** Watches the page's folder (`onChange` after the changes settle), or stops. */
  watch(page: number, on: boolean, onChange: () => void): void {
    const held = this.#open.get(page)
    if (held === undefined) return
    if (!on) {
      held.watcher?.close()
      held.watcher = null
      return
    }
    if (held.watcher !== null) return
    try {
      held.watcher = watch(held.dir, { recursive: true, persistent: false }, (_kind, name) => {
        const base = name === null ? '' : path.basename(String(name)).replace(/\.tmp$/, '')
        if ((WRITTEN_BACK as readonly string[]).includes(base)) return
        if (held.timer !== null) clearTimeout(held.timer)
        held.timer = setTimeout(() => {
          held.timer = null
          onChange()
        }, WATCH_SETTLE_MS)
      })
    } catch {
      held.watcher = null
    }
  }

  close(page: number): void {
    const held = this.#open.get(page)
    if (held === undefined) return
    held.watcher?.close()
    if (held.timer !== null) clearTimeout(held.timer)
    this.#open.delete(page)
  }

  /** The pages with a folder open. */
  pages(): number[] {
    return [...this.#open.keys()]
  }

  /** For tests: which pages are watching. */
  watching(): string[] {
    return [...this.#open]
      .filter(([, h]) => h.watcher !== null)
      .map(([page]) => String(page))
      .sort()
  }
}
