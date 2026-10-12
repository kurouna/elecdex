import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { isPattern } from '@shared/logwatch/files'
import { isLogFormat, type LogFileRef, type LogFormat } from '@shared/logwatch/types'
import { z } from 'zod'
import { JsonStore } from '../store/json-store.js'

/**
 * The log files LOG WATCH panes have been pointed at, in log-files.json (docs/logwatch.md §3).
 *
 * As git-repos.json does for the git pane: a pane keeps only the id, so a layout never carries
 * a path, and the page never hands one back. On another machine the id is unknown and the pane
 * asks for a file again. Nothing of a log's content is ever written here.
 */

const EntrySchema = z.object({
  id: z.string().regex(/^[0-9a-f]{16}$/),
  /** The file, or with a pattern the folder whose newest matching file is read. */
  path: z.string().min(1).max(4096),
  pattern: z.string().refine(isPattern).nullable(),
  /** The dialect, when the user set it rather than leaving it to detection. */
  format: z.string().refine(isLogFormat).nullable().catch(null),
  lastUsed: z.number(),
})

const FileSchema = z.object({
  version: z.literal(1).default(1),
  // A broken entry is dropped alone: one bad line must not empty the list of files used before.
  files: z
    .array(z.unknown())
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = EntrySchema.safeParse(item)
        return parsed.success ? [parsed.data] : []
      }),
    )
    .catch([])
    .default([]),
})

export interface LogEntryRecord {
  id: string
  path: string
  pattern: string | null
  format: LogFormat | null
  lastUsed: number
}

const KEEP = 40

const samePath = (a: string, b: string): boolean =>
  process.platform === 'win32' || process.platform === 'darwin'
    ? a.toLowerCase() === b.toLowerCase()
    : a === b

/** Home as `~`, for the eye. */
export function displayFolder(folder: string, home: string): string {
  if (home !== '' && samePath(folder.slice(0, home.length), home)) {
    const rest = folder.slice(home.length)
    if (rest === '' || rest.startsWith(path.sep)) return `~${rest}`
  }
  return folder
}

export class LogCatalog {
  private readonly store: JsonStore<z.infer<typeof FileSchema>>
  private readonly home: string

  constructor(file: string, home: string) {
    this.home = home
    this.store = new JsonStore({
      file,
      schema: FileSchema,
      makeDefault: () => ({ version: 1, files: [] }),
    })
  }

  get(id: string): LogEntryRecord | null {
    return (this.store.read().files.find((entry) => entry.id === id) as LogEntryRecord) ?? null
  }

  ref(entry: LogEntryRecord): LogFileRef {
    const folder = entry.pattern === null ? path.dirname(entry.path) : entry.path
    return {
      id: entry.id,
      name: entry.pattern ?? path.basename(entry.path),
      folder: displayFolder(folder, this.home),
      path: entry.pattern === null ? entry.path : path.join(entry.path, entry.pattern),
      pattern: entry.pattern,
      format: entry.format,
    }
  }

  /** Files used before on this machine, most recent first. */
  recent(): LogFileRef[] {
    return (this.store.read().files as LogEntryRecord[])
      .slice()
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .map((entry) => this.ref(entry))
  }

  /** Adds a file (or a folder and a pattern), or finds it; either way it is used now. */
  add(target: string, pattern: string | null, now: number): LogEntryRecord {
    const full = path.resolve(target)
    const file = this.store.read()
    const found = file.files.find(
      (entry) => samePath(entry.path, full) && entry.pattern === pattern,
    ) as LogEntryRecord | undefined
    const entry: LogEntryRecord = found
      ? { ...found, lastUsed: now }
      : { id: randomBytes(8).toString('hex'), path: full, pattern, format: null, lastUsed: now }
    const others = file.files.filter((item) => item.id !== entry.id)
    const kept = [entry, ...others.sort((a, b) => b.lastUsed - a.lastUsed)].slice(0, KEEP)
    this.store.write({ version: 1, files: kept })
    return entry
  }

  /** The dialect a file is read in; null leaves it to detection. */
  setFormat(id: string, format: LogFormat | null): LogEntryRecord | null {
    const file = this.store.read()
    const entry = file.files.find((item) => item.id === id)
    if (entry === undefined) return null
    const next = { ...entry, format }
    this.store.write({
      version: 1,
      files: file.files.map((item) => (item.id === id ? next : item)),
    })
    return next as LogEntryRecord
  }
}
