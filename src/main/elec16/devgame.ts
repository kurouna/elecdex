import {
  type FSWatcher,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
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
 * never here), watched while the pane wants it, and the two files the build makes written
 * back. Main remembers the folder for each pane of each page and gives the page only its name.
 *
 * What is read is only what game.json names, inside the folder: no `..`, no absolute path, no
 * file that is outside it once its links are followed, every file and the whole held to a
 * size. What is written is only assets.e16.ts and compiled.s in that folder - or, for a new
 * game, the template into an empty folder the user picked.
 */

/** The files a build writes back, the only ones main writes into a game's folder. */
export const WRITTEN_BACK = ['assets.e16.ts', 'compiled.s'] as const
const FILE_MAX = 4 * 1024 * 1024
const TOTAL_MAX = 16 * 1024 * 1024
/** game.json is a list of names: anything bigger is not one, and is not read. */
const META_MAX = 256 * 1024
/** More names than any game needs: each is a file opened, so the list is held to a count. */
const NAMES_MAX = 512
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

/** A record keyed by file names: a file named `__proto__` stays a file. */
const byName = <T>(): Record<string, T> => Object.create(null) as Record<string, T>

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
  const listed = { texts: [...new Set(texts)], pictures: [...new Set(pictures)] }
  if (listed.texts.length + listed.pictures.length > NAMES_MAX) {
    return `game.json names more than ${NAMES_MAX} files`
  }
  return listed
}

/** A name that stays inside the folder: relative, no `..` part, forward or back slashes. */
export function insideName(name: string): boolean {
  if (path.isAbsolute(name) || /^[a-zA-Z]:/.test(name) || name.includes('\0')) return false
  return !name.split(/[\\/]/).some((part) => part === '..' || part === '')
}

/**
 * The folder where it really is (a folder picked through a link is read where it leads), and
 * the prefix every file in it starts with once its own links are followed. A drive's root
 * already ends in its separator.
 */
interface Root {
  real: string
  prefix: string
}

function rootOf(dir: string): Root | null {
  try {
    const real = realpathSync(dir)
    return { real, prefix: real.endsWith(path.sep) ? real : real + path.sep }
  } catch {
    return null
  }
}

/** Reads a game folder's files for a build. */
export function readGameFolder(dir: string): DevRead {
  const root = rootOf(dir)
  if (root === null) return { ok: false, problem: 'the folder could not be read' }
  const meta = readMeta(root)
  if (typeof meta !== 'object') return { ok: false, problem: meta }
  const listed = listedFiles(meta.json)
  if (typeof listed === 'string') return { ok: false, problem: listed }
  const files: DevFiles = { meta: meta.text, texts: byName(), pictures: byName() }
  const total = { bytes: Buffer.byteLength(meta.text) }
  const texts = gather(root, listed.texts, total)
  if (typeof texts === 'string') return { ok: false, problem: texts }
  const pictures = gather(root, listed.pictures, total)
  if (typeof pictures === 'string') return { ok: false, problem: pictures }
  for (const [name, bytes] of Object.entries(texts)) {
    files.texts[name] = new TextDecoder().decode(bytes)
  }
  files.pictures = pictures
  return { ok: true, files }
}

/** game.json, as text and parsed; or why not. */
function readMeta(root: Root): { text: string; json: unknown } | string {
  const got = readInside(root, 'game.json', META_MAX)
  if (got === 'missing') return 'the folder has no game.json'
  if (got === 'big') return 'game.json is more than 256 kB'
  if (typeof got === 'string') return got
  const text = new TextDecoder().decode(got)
  try {
    return { text, json: JSON.parse(text) }
  } catch (e) {
    return `game.json: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** The named files' bytes, the running total kept under 16 MB; or what stopped it. */
function gather(
  root: Root,
  names: string[],
  total: { bytes: number },
): Record<string, Uint8Array> | string {
  const out = byName<Uint8Array>()
  for (const name of names) {
    const got = readInside(root, name, FILE_MAX)
    if (got === 'missing') return `${name} could not be read`
    if (got === 'big') return `${name} is more than 4 MB`
    if (typeof got === 'string') return got
    total.bytes += got.length
    if (total.bytes > TOTAL_MAX) return "the game's files are more than 16 MB"
    out[name] = got
  }
  return out
}

/**
 * One file of the folder, if it is inside it with its links followed, a plain file, and no
 * bigger than `max` (looked at before it is read); 'missing' or 'big' for those two, or what
 * else is wrong.
 */
function readInside(root: Root, name: string, max: number): Uint8Array | string {
  let file: string
  try {
    file = realpathSync(path.resolve(root.real, name))
  } catch {
    return 'missing'
  }
  if (!file.startsWith(root.prefix)) return `${name} is not inside the folder`
  try {
    const st = statSync(file)
    if (!st.isFile()) return `${name} is not a file`
    if (st.size > max) return 'big'
    return new Uint8Array(readFileSync(file))
  } catch {
    return 'missing'
  }
}

/**
 * The build's two files into the folder, each only when it changed. The temporary file is
 * made afresh, never opened where it lies: a file, a link or a hard link left there by
 * anyone is removed, not written through.
 */
export function writeBack(dir: string, assets: string, compiled: string): void {
  for (const [name, text] of [
    [WRITTEN_BACK[0], assets],
    [WRITTEN_BACK[1], compiled],
  ] as const) {
    const file = path.join(dir, name)
    if (sameText(file, text)) continue
    const temp = `${file}.tmp`
    rmSync(temp, { force: true })
    writeFileSync(temp, text, { flag: 'wx' })
    replaceFile(temp, file)
  }
}

/** Whether `file` is a plain file already holding `text` (read only when its size agrees). */
function sameText(file: string, text: string): boolean {
  try {
    const st = lstatSync(file)
    if (!st.isFile() || st.size !== Buffer.byteLength(text)) return false
    return readFileSync(file, 'utf8') === text
  } catch {
    return false
  }
}

/**
 * A new game: the template's files into `dir`, which must be empty (the user's work is never
 * written over, nor mixed with the template). `files` maps a name under the folder to its
 * bytes. Each file is made, never opened where one lies; a failure part way says so.
 */
export function writeTemplate(
  dir: string,
  files: Record<string, Uint8Array | string>,
): string | null {
  try {
    if (readdirSync(dir).length > 0) return 'NEW GAME needs an empty folder'
  } catch {
    return 'the folder could not be read'
  }
  const bad = Object.keys(files).find((name) => !insideName(name))
  if (bad !== undefined) return `${bad} is not a file inside the folder`
  try {
    for (const [name, content] of Object.entries(files)) {
      const file = path.join(dir, name)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, content, { flag: 'wx' })
    }
  } catch {
    return 'the template could not all be written into the folder'
  }
  return null
}

/** The template's files read from a folder of the app's resources, by their names inside it. */
export function templateFiles(root: string): Record<string, Uint8Array> {
  const out = byName<Uint8Array>()
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

/** Whether a change the watch reports is the author's: not the build's own, nor a tool's. */
export function changeCounts(name: string | null): boolean {
  if (name === null) return true
  const parts = String(name).split(/[\\/]/)
  // A dot-folder (.git, an editor's) or node_modules changes for reasons of its own.
  if (parts.some((p) => p.startsWith('.') || p === 'node_modules')) return false
  const base = (parts.at(-1) ?? '').replace(/\.tmp$/, '')
  return !(WRITTEN_BACK as readonly string[]).includes(base)
}

/** A pane's key among the folders: the page and the pane, as each ELEC-16 pane has its own. */
export const devKey = (page: number, pane: string): string => `${page}:${pane}`

interface Opened {
  dir: string
  /** Which opening: a build of an earlier one is refused. */
  gen: number
  watcher: FSWatcher | null
  timer: ReturnType<typeof setTimeout> | null
}

/**
 * The folder each pane has open, and its watch while the pane wants one. A change to anything
 * but the two files the build writes back is told after it settles.
 */
export class DevFolders {
  readonly #open = new Map<string, Opened>()
  #gen = 0

  /** The pane's folder, in place of any it had; the opening's number. */
  open(key: string, dir: string): number {
    this.close(key)
    this.#gen++
    this.#open.set(key, { dir, gen: this.#gen, watcher: null, timer: null })
    return this.#gen
  }

  /** Where the pane's folder is; null for none, or when `gen` is not its opening. */
  dirOf(key: string, gen?: number): string | null {
    const held = this.#open.get(key)
    if (held === undefined || (gen !== undefined && held.gen !== gen)) return null
    return held.dir
  }

  /** What the page may know of the pane's folder: its name and opening; null for none. */
  state(key: string): { name: string; gen: number } | null {
    const held = this.#open.get(key)
    return held === undefined ? null : { name: path.basename(held.dir), gen: held.gen }
  }

  /** Watches the pane's folder (`onChange` after the changes settle), or stops. */
  watch(key: string, on: boolean, onChange: () => void): void {
    const held = this.#open.get(key)
    if (held === undefined) return
    if (!on) {
      stopWatch(held)
      return
    }
    if (held.watcher !== null) return
    try {
      const watcher = watch(held.dir, { recursive: true, persistent: false }, (_kind, name) => {
        if (!changeCounts(name === null ? null : String(name))) return
        if (held.timer !== null) clearTimeout(held.timer)
        held.timer = setTimeout(() => {
          held.timer = null
          if (held.watcher === watcher) onChange()
        }, WATCH_SETTLE_MS)
      })
      // A folder taken away under the watch: the watch ends, main goes on.
      watcher.on('error', () => {
        if (held.watcher === watcher) stopWatch(held)
      })
      held.watcher = watcher
    } catch {
      held.watcher = null
    }
  }

  close(key: string): void {
    const held = this.#open.get(key)
    if (held === undefined) return
    stopWatch(held)
    this.#open.delete(key)
  }

  /** Every folder of a page that went. */
  closePage(page: number): void {
    for (const key of this.keys()) if (key.startsWith(`${page}:`)) this.close(key)
  }

  /** The panes with a folder open. */
  keys(): string[] {
    return [...this.#open.keys()]
  }

  /** Which panes are watching their folder (the hidden-panes e2e asks). */
  watching(): string[] {
    return [...this.#open]
      .filter(([, h]) => h.watcher !== null)
      .map(([key]) => key)
      .sort()
  }
}

/** The watch and a change waiting to settle, both gone. */
function stopWatch(held: Opened): void {
  const watcher = held.watcher
  held.watcher = null
  if (held.timer !== null) clearTimeout(held.timer)
  held.timer = null
  try {
    watcher?.close()
  } catch {
    // Already closed by its error.
  }
}
