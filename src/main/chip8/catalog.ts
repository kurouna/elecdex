import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { maxProgramSize } from '@shared/chip8/types'
import {
  type Chip8CatalogEntry,
  type Chip8Program,
  isChip8ProgramId,
  programFromEntry,
  readCatalog,
} from '@shared/chip8-library'

/**
 * The CHIP-8 programs that ship with the app (docs/architecture.md section 5.18):
 * resources/chip8/programs.json and the files beside it.
 *
 * The page is given programs and, by id, their bytes; a path never crosses to it, and an
 * id is answered only from this list, whose file names the schema already holds to one
 * folder and a .ch8 name - nothing can climb out of resources/chip8.
 */

/**
 * resources/chip8, found by walking up from the bundle: it is two levels above out/main
 * in development, and inside app.asar when packaged (read through Electron's fs there).
 */
export function findChip8Dir(from = path.dirname(fileURLToPath(import.meta.url))): string | null {
  let dir = from
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'resources', 'chip8')
    if (existsSync(path.join(candidate, 'programs.json'))) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export class Chip8Catalog {
  readonly #dir: string | null
  #entries: Map<string, Chip8CatalogEntry> | null = null
  #loading: Promise<Map<string, Chip8CatalogEntry>> | null = null

  constructor(dir: string | null) {
    this.#dir = dir
  }

  async #load(): Promise<Map<string, Chip8CatalogEntry>> {
    if (this.#entries !== null) return this.#entries
    this.#loading ??= (async () => {
      const entries = new Map<string, Chip8CatalogEntry>()
      if (this.#dir === null) return entries
      try {
        const json: unknown = JSON.parse(
          await readFile(path.join(this.#dir, 'programs.json'), 'utf8'),
        )
        const { entries: list, dropped } = readCatalog(json)
        if (dropped.length > 0)
          console.warn(`[elecdex] chip8: dropped programs ${dropped.join(', ')}`)
        for (const entry of list) entries.set(entry.id, entry)
      } catch (error) {
        console.warn(`[elecdex] chip8: no program list: ${String(error)}`)
      }
      this.#entries = entries
      return entries
    })()
    return this.#loading
  }

  /** Every bundled program, in the list's order. */
  async programs(): Promise<Chip8Program[]> {
    return [...(await this.#load()).values()].map(programFromEntry)
  }

  /** A program's bytes, or null for an id not in the list or a file that is missing or too big. */
  async rom(id: unknown): Promise<Uint8Array | null> {
    if (!isChip8ProgramId(id) || this.#dir === null) return null
    const entry = (await this.#load()).get(id)
    if (entry === undefined) return null
    try {
      const bytes = await readFile(path.join(this.#dir, entry.file))
      if (bytes.length === 0 || bytes.length > maxProgramSize(entry.platform)) return null
      return new Uint8Array(bytes)
    } catch {
      return null
    }
  }
}
