import { promises as fsp } from 'node:fs'
import path from 'node:path'
import { replaceFile } from '../store/replace-file.js'

/**
 * Launcher icons kept on disk, one PNG per entry id, so a start of elecdex shows
 * the icons it showed last time without running anything: on Windows an icon
 * not on disk costs a PowerShell start (windows-icons.ts, about 0.6 s).
 *
 * Only an icon drawn the platform's own way is kept (`keep`: on Windows the
 * shell's). "No icon" and Windows' fallback through Electron, which is often the
 * generic program icon, live in memory alone and are asked again on the next
 * start: written down, one asked for while an app was still installing would
 * stay a monogram or a wrong icon for a month (user decision 2026-11-02).
 *
 * A file older than `ICON_MAX_AGE_MS` counts as absent and the icon is drawn
 * again, so an icon an update changed comes back in time. Shortcut timestamps
 * say nothing about it: an updater replaces the executable, not the shortcut.
 */

/** Past this age an icon on disk is drawn again: icons rarely change, and a month is soon enough. */
export const ICON_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** Icons held in memory; beyond it they are read from disk each time. */
export const ICON_MEMORY_LIMIT = 1000

/** An icon as drawn, and whether it is worth writing down. */
export interface DrawnIcon {
  icon: string | null
  keep: boolean
}

const PNG_DATA_URL = 'data:image/png;base64,'
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
/** Entry ids are 16 hex digits (catalog.ts `idOf`); anything else never names a file. */
const ID = /^[0-9a-f]{16}$/
const FILE = /^([0-9a-f]{16})\.png$/

export class IconStore {
  readonly #dir: string
  readonly #draw: (target: string) => Promise<DrawnIcon>
  readonly #now: () => number
  readonly #memory = new Map<string, string | null>()
  readonly #asking = new Map<string, Promise<string | null>>()

  constructor(options: {
    dir: string
    draw: (target: string) => Promise<DrawnIcon>
    now?: () => number
  }) {
    this.#dir = options.dir
    this.#draw = options.draw
    this.#now = options.now ?? Date.now
  }

  get(id: string, target: string): Promise<string | null> {
    if (this.#memory.has(id)) return Promise.resolve(this.#memory.get(id) ?? null)
    let asking = this.#asking.get(id)
    if (!asking) {
      asking = this.#load(id, target).finally(() => this.#asking.delete(id))
      this.#asking.set(id, asking)
    }
    return asking
  }

  /** Deletes the icons of entries no longer in the launcher. */
  async prune(ids: ReadonlySet<string>): Promise<void> {
    let names: string[]
    try {
      names = await fsp.readdir(this.#dir)
    } catch {
      return
    }
    for (const name of names) {
      const id = FILE.exec(name)?.[1]
      if (id === undefined || ids.has(id)) continue
      this.#memory.delete(id)
      await fsp.rm(path.join(this.#dir, name), { force: true }).catch(() => {})
    }
  }

  async #load(id: string, target: string): Promise<string | null> {
    const saved = ID.test(id) ? await this.#read(id) : null
    if (saved !== null) return this.#remember(id, saved)
    let drawn: DrawnIcon
    try {
      drawn = await this.#draw(target)
    } catch {
      // Not remembered: the next request tries again.
      return null
    }
    if (drawn.keep && drawn.icon !== null && ID.test(id)) await this.#write(id, drawn.icon)
    return this.#remember(id, drawn.icon)
  }

  #remember(id: string, icon: string | null): string | null {
    if (this.#memory.size < ICON_MEMORY_LIMIT) this.#memory.set(id, icon)
    return icon
  }

  async #read(id: string): Promise<string | null> {
    const file = path.join(this.#dir, `${id}.png`)
    try {
      const { mtimeMs } = await fsp.stat(file)
      if (this.#now() - mtimeMs > ICON_MAX_AGE_MS) return null
      const bytes = await fsp.readFile(file)
      if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return null
      return `${PNG_DATA_URL}${bytes.toString('base64')}`
    } catch {
      return null
    }
  }

  async #write(id: string, icon: string): Promise<void> {
    if (!icon.startsWith(PNG_DATA_URL)) return
    const file = path.join(this.#dir, `${id}.png`)
    const temp = `${file}.tmp`
    try {
      await fsp.mkdir(this.#dir, { recursive: true })
      await fsp.writeFile(temp, Buffer.from(icon.slice(PNG_DATA_URL.length), 'base64'))
      replaceFile(temp, file)
    } catch (error) {
      // The icon is shown all the same; it is drawn again on the next start.
      console.error('[elecdex] cannot save a launcher icon', error)
    }
  }
}
