import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { isStorageKey, PLUGIN_ID, PLUGIN_LIMITS } from '@shared/plugins'

/**
 * ctx.storage: one JSON file per plugin under userData/plugin-data (docs/plugins.md 8.1).
 *
 * The worker keeps the live copy and sends each change; this keeps the same object and
 * writes it a second after the last change, and at once on quit. A file that cannot be
 * read is an empty store - nothing in it is the user's own work.
 */

const WRITE_DELAY_MS = 1000

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
    try {
      const parsed: unknown = JSON.parse(readFileSync(this.file(id), 'utf8'))
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        value = parsed as Record<string, unknown>
      }
    } catch {
      // No file yet, or unreadable: start empty.
    }
    this.data.set(id, value)
    return value
  }

  /** Applies one change; false when it would take the store past its limit. */
  set(id: string, key: string, value: unknown, remove: boolean): boolean {
    if (!isStorageKey(key)) return false
    const current = this.load(id)
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
      renameSync(`${file}.tmp`, file)
    } catch (error) {
      console.warn(`[elecdex] could not save plugin data for ${id}:`, error)
    }
  }
}
