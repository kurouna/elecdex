import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { isStorageKey, PLUGIN_ID, PLUGIN_LIMITS } from '@shared/plugins'
import { replaceFile } from '../store/replace-file.js'

/**
 * ctx.storage: one JSON file per plugin under userData/plugin-data (docs/plugins.md 8.1).
 *
 * The worker keeps the live copy and sends each change; this keeps the same object and
 * writes it a second after the last change, and at once on quit. A missing file, or one that
 * is not JSON, is an empty store. A file that is there but cannot be read now (held open by
 * another program) is not: load throws, nothing is kept for it and a change is refused, so the
 * plugin is never started on nothing it would take for what it had, and what it stored is never
 * replaced by a change made over nothing (see load, loadPatiently and set).
 */

const WRITE_DELAY_MS = 1000

/** How often, and how far apart, a plugin's start tries a file it could not read. */
const LOAD_TRIES = 4
const LOAD_GAP_MS = 250

/** An id is also a file name here: anything that is not one is refused outright. */
function checkId(id: string): string {
  if (!PLUGIN_ID.test(id)) throw new Error('not a plugin id')
  return id
}

export class PluginStorage {
  private readonly dir: string
  private readonly data = new Map<string, Record<string, unknown>>()
  private readonly timers = new Map<string, NodeJS.Timeout>()

  constructor(dir: string) {
    this.dir = dir
  }

  private file(id: string): string {
    return path.join(this.dir, `${checkId(id)}.json`)
  }

  load(id: string): Record<string, unknown> {
    checkId(id)
    const cached = this.data.get(id)
    if (cached) return cached
    let value: Record<string, unknown> = {}
    let bytes: string
    try {
      bytes = readFileSync(this.file(id), 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException | null)?.code !== 'ENOENT') {
        // There but not readable now (held open by another program): nothing is kept for it,
        // so no change made now replaces what is in the file (see set), and the next load reads
        // the file again.
        console.warn(`[elecdex] could not read plugin data for ${id}:`, error)
        throw new Error(`${id}'s stored data could not be read: another program has the file open`)
      }
      bytes = ''
    }
    try {
      const parsed: unknown = bytes === '' ? {} : JSON.parse(bytes)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        value = parsed as Record<string, unknown>
      }
    } catch {
      // Not JSON: start empty.
    }
    this.data.set(id, value)
    return value
  }

  /**
   * load, for a plugin starting: a file held open for a moment (a virus scanner's look) is tried
   * again a few times before the start is refused.
   */
  async loadPatiently(id: string): Promise<Record<string, unknown>> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return this.load(id)
      } catch (error) {
        if (attempt >= LOAD_TRIES) throw error
        await new Promise((resolve) => setTimeout(resolve, LOAD_GAP_MS))
      }
    }
  }

  /** Applies one change; false when it would take the store past its limit, or was not read. */
  set(id: string, key: string, value: unknown, remove: boolean): boolean {
    if (!isStorageKey(key)) return false
    // An id that is not one is refused outright, as everywhere here; only a file not read is false.
    checkId(id)
    let current: Record<string, unknown>
    try {
      current = this.load(id)
    } catch {
      // Not read (see load): the change is refused rather than made over nothing.
      return false
    }
    const next = { ...current }
    if (remove) delete next[key]
    else next[key] = value
    if (JSON.stringify(next).length > PLUGIN_LIMITS.storageBytes) return false
    this.data.set(id, next)
    this.schedule(id)
    return true
  }

  /** Deletes the plugin's stored data. */
  clear(id: string): void {
    clearTimeout(this.timers.get(id))
    this.timers.delete(id)
    this.data.delete(id)
    rmSync(this.file(id), { force: true })
  }

  flush(): void {
    for (const id of [...this.timers.keys()]) this.write(id)
  }

  private schedule(id: string): void {
    clearTimeout(this.timers.get(id))
    this.timers.set(
      id,
      setTimeout(() => this.write(id), WRITE_DELAY_MS),
    )
  }

  private write(id: string): void {
    clearTimeout(this.timers.get(id))
    this.timers.delete(id)
    const value = this.data.get(id)
    if (value === undefined) return
    try {
      mkdirSync(this.dir, { recursive: true })
      const file = this.file(id)
      writeFileSync(`${file}.tmp`, JSON.stringify(value))
      replaceFile(`${file}.tmp`, file)
    } catch (error) {
      console.warn(`[elecdex] could not save plugin data for ${id}:`, error)
    }
  }
}
