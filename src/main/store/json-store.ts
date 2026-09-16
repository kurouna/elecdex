import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'

/**
 * A validated, atomically-written JSON file under userData.
 *
 * Two behaviours worth calling out, both reactions to how the original project
 * handled its config:
 *
 *  - it never overwrites the user's file with built-in defaults. The original
 *    re-copied its bundled themes and keyboard layouts over userData on every
 *    single launch, so any edit the user made was silently destroyed.
 *
 *  - a corrupt file is preserved, not discarded. It is moved aside to `.bak`
 *    and the caller gets the default, so a malformed edit costs the user
 *    nothing and can be recovered by hand. A store the user edits by hand
 *    (`keepInvalid`, settings.json) leaves the file where it is instead, so the
 *    user still finds their file and a fix applies live; the file is copied to
 *    `.bak` only when a write is about to replace it.
 *
 * Writes go to a temp file and are renamed over the target, so a crash mid-write
 * cannot leave a truncated file behind.
 */
export class JsonStore<T> {
  private readonly file: string
  private readonly schema: z.ZodType<T>
  private readonly makeDefault: () => T
  private readonly keepInvalid: boolean
  private cache: T | null = null

  constructor(opts: {
    file: string
    schema: z.ZodType<T>
    makeDefault: () => T
    keepInvalid?: boolean
  }) {
    this.file = opts.file
    this.schema = opts.schema
    this.makeDefault = opts.makeDefault
    this.keepInvalid = opts.keepInvalid ?? false
  }

  get path(): string {
    return this.file
  }

  /**
   * Reads and validates the file.
   *
   * `repair` is given a structurally-valid value that failed a higher-level
   * check (a version migration, say) and may return a corrected value or null
   * to fall back to the default.
   */
  read(repair?: (value: T) => T | null): T {
    if (this.cache !== null) return this.cache

    if (!existsSync(this.file)) {
      this.cache = this.makeDefault()
      return this.cache
    }

    let raw: string
    try {
      raw = readFileSync(this.file, 'utf8')
    } catch (error) {
      console.error(`[elecdex] cannot read ${this.file}`, error)
      this.cache = this.makeDefault()
      return this.cache
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      this.quarantine('not valid JSON')
      this.cache = this.makeDefault()
      return this.cache
    }

    const result = this.schema.safeParse(parsed)
    if (!result.success) {
      this.quarantine(
        result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      )
      this.cache = this.makeDefault()
      return this.cache
    }

    const repaired = repair ? repair(result.data) : result.data
    if (repaired === null) {
      this.quarantine('could not be migrated to the current version')
      this.cache = this.makeDefault()
      return this.cache
    }

    this.cache = repaired
    return this.cache
  }

  write(value: T): void {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      // Refusing is the right call: writing an invalid file would make the next
      // launch quarantine it and silently lose the user's layout.
      throw new Error(
        `Refusing to write invalid ${path.basename(this.file)}: ${result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      )
    }

    mkdirSync(path.dirname(this.file), { recursive: true })
    if (this.keepInvalid) this.backUpIfInvalid()
    const temp = `${this.file}.${process.pid}.tmp`
    writeFileSync(temp, `${JSON.stringify(result.data, null, 2)}\n`, 'utf8')
    // rename is atomic within a filesystem, so readers never see a partial file.
    renameSync(temp, this.file)
    this.cache = result.data
  }

  /** Drops the in-memory copy, so the next read hits disk again. */
  invalidate(): void {
    this.cache = null
  }

  /**
   * Copies the file on disk to `.bak` when it would not load, so a write never
   * destroys a broken hand edit - one made before launch or while the app runs.
   */
  private backUpIfInvalid(): void {
    let raw: string
    try {
      raw = readFileSync(this.file, 'utf8')
    } catch {
      return // No file yet: nothing to lose.
    }
    if (this.parses(raw)) return
    try {
      copyFileSync(this.file, `${this.file}.bak`)
      console.warn(`[elecdex] ${path.basename(this.file)} was invalid; copied to ${this.file}.bak`)
    } catch (error) {
      // Losing the user's edit is worse than losing this one change.
      throw new Error(`Refusing to overwrite invalid ${path.basename(this.file)}: ${error}`)
    }
  }

  private parses(raw: string): boolean {
    try {
      return this.schema.safeParse(JSON.parse(raw)).success
    } catch {
      return false
    }
  }

  /** Moves an unusable file aside instead of deleting the user's work. */
  private quarantine(reason: string): void {
    if (this.keepInvalid) {
      console.warn(`[elecdex] ${path.basename(this.file)} ${reason}; using defaults, file kept`)
      return
    }
    const backup = `${this.file}.bak`
    try {
      if (existsSync(backup)) unlinkSync(backup)
      renameSync(this.file, backup)
      console.warn(`[elecdex] ${path.basename(this.file)} ${reason}; moved to ${backup}`)
    } catch (error) {
      console.error(`[elecdex] could not quarantine ${this.file}`, error)
    }
  }
}
