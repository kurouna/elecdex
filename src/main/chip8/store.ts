import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { guessPlatform } from '@shared/chip8/platform'
import { type PreviewRun, previewRun } from '@shared/chip8/preview'
import { quirksFor } from '@shared/chip8/quirks'
import { maxProgramSize, PLATFORMS, type Platform } from '@shared/chip8/types'
import {
  type Chip8ImportChange,
  Chip8ImportChangeSchema,
  type Chip8ImportResult,
  type Chip8Program,
  Chip8TuningSchema,
  DEFAULT_IPF,
  isChip8ProgramId,
  PreviewSchema,
} from '@shared/chip8-library'
import { z } from 'zod'
import { JsonStore } from '../store/json-store.js'
import { replaceFile } from '../store/replace-file.js'
import type { Chip8Catalog } from './catalog.js'

/**
 * The CHIP-8 library as this user has it (docs/architecture.md section 5.18): the bundled
 * programs (Chip8Catalog), the ones they imported, their tuning of any program, and the ones
 * they starred - in userData/chip8/library.json, with the imported files beside it under
 * imported/<sha256>.ch8.
 *
 * An import is the user's own action: main opens the picker (ipc/chip8.ts), so the page
 * never hands over a path; the file's size is checked before it is read, its bytes are
 * copied under their hash (the same file twice is one program), the machine is guessed from
 * the instructions it reaches (shared/chip8/platform.ts), and its preview is made by running
 * it on the core, as gen-chip8 does for the bundled ones - once, at the import or a change of
 * machine, given a moment of main's time (`PREVIEW_BUDGET_MS`: a program clearing the screen
 * a thousand times a frame took seconds, and the window draws nothing meanwhile), and kept
 * in library.json with the entry.
 */

/** How long main may spend on one imported program's preview. */
export const PREVIEW_BUDGET_MS = 300

/** A preview kept with its entry, for the machine it was made on. */
const LookSchema = z.object({
  platform: z.enum(PLATFORMS),
  preview: PreviewSchema.nullable(),
  keys: z.number().int().min(0).max(0xffff),
})

const ImportedSchema = z.object({
  id: z.string().regex(/^imported\/[0-9a-f]{16}$/),
  title: z.string().min(1).max(80),
  platform: z.enum(PLATFORMS),
  /** The file under imported/, by its hash. */
  file: z.string().regex(/^[0-9a-f]{64}\.ch8$/),
  /** The name it had where it came from. */
  name: z.string().max(260),
  size: z.number().int().min(1),
  at: z.number(),
  look: LookSchema.optional(),
})
type Imported = z.infer<typeof ImportedSchema>

const LibraryFileSchema = z.object({
  version: z.literal(1).default(1),
  imported: z
    .array(z.unknown())
    .default([])
    // One broken entry costs only itself.
    .transform((list) => list.flatMap((raw) => ImportedSchema.safeParse(raw).data ?? [])),
  tuning: z
    .record(z.string(), z.unknown())
    .default({})
    .transform((map) =>
      Object.fromEntries(
        Object.entries(map).flatMap(([id, raw]) => {
          const tuning = Chip8TuningSchema.safeParse(raw)
          return isChip8ProgramId(id) && tuning.success ? [[id, tuning.data]] : []
        }),
      ),
    ),
  favourites: z
    .array(z.string())
    .default([])
    .transform((ids) => [...new Set(ids.filter(isChip8ProgramId))]),
})
type LibraryFile = z.infer<typeof LibraryFileSchema>

/** A title from a file's name: its extension gone, dashes and underscores spaces. */
export function titleOfFile(name: string): string {
  const stem = path.basename(name).replace(/\.[^.]*$/, '')
  const title = stem.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return title === '' ? 'Untitled' : title
}

/** The largest program of any machine: XO-CHIP's 64 KB less the 512 bytes below 0x200. */
const MAX_IMPORT = maxProgramSize('xochip')

export class Chip8Store {
  readonly #catalog: Chip8Catalog
  readonly #dir: string
  readonly #file: JsonStore<LibraryFile>
  readonly #now: () => number
  /** A clock for the preview's budget: a test's can say the time is up at once. */
  readonly #clock: () => number

  constructor(
    catalog: Chip8Catalog,
    dir: string,
    now: () => number = Date.now,
    clock: () => number = () => performance.now(),
  ) {
    this.#catalog = catalog
    this.#dir = dir
    this.#now = now
    this.#clock = clock
    this.#file = new JsonStore({
      file: path.join(dir, 'library.json'),
      schema: LibraryFileSchema as unknown as z.ZodType<LibraryFile>,
      makeDefault: () => LibraryFileSchema.parse({}),
    })
  }

  get #importedDir(): string {
    return path.join(this.#dir, 'imported')
  }

  /** Every program, bundled then imported, with the user's tuning and stars. */
  async programs(): Promise<Chip8Program[]> {
    const file = this.#lookedAt(this.#file.read())
    const bundled = await this.#catalog.programs()
    const all = [...bundled, ...file.imported.flatMap((entry) => this.#program(entry) ?? [])]
    const starred = new Set(file.favourites)
    return all.map((program) => {
      const tuning = file.tuning[program.id]
      return { ...program, favourite: starred.has(program.id), ...(tuning ? { tuning } : {}) }
    })
  }

  /** Whether a program is in the library: only such a program's machine is kept. */
  async has(id: unknown): Promise<boolean> {
    if (!isChip8ProgramId(id)) return false
    if (id.startsWith('imported/')) return this.#file.read().imported.some((e) => e.id === id)
    return (await this.#catalog.programs()).some((p) => p.id === id)
  }

  /** The machine a program in the library runs as, or null for one that is not in it. */
  async platformOf(id: unknown): Promise<Platform | null> {
    if (!isChip8ProgramId(id)) return null
    if (id.startsWith('imported/'))
      return this.#file.read().imported.find((e) => e.id === id)?.platform ?? null
    return (await this.#catalog.programs()).find((p) => p.id === id)?.platform ?? null
  }

  /** A program's bytes, bundled or imported; null for an id that is neither. */
  async rom(id: unknown): Promise<Uint8Array | null> {
    if (!isChip8ProgramId(id)) return null
    if (!id.startsWith('imported/')) return this.#catalog.rom(id)
    const entry = this.#file.read().imported.find((e) => e.id === id)
    return entry === undefined ? null : this.#bytes(entry)
  }

  /** Keeps (or with null, forgets) the user's speed and quirks for a program in the library. */
  async tune(id: unknown, raw: unknown): Promise<boolean> {
    if (!(await this.has(id)) || typeof id !== 'string') return false
    const file = this.#file.read()
    const tuning = { ...file.tuning }
    if (raw === null) delete tuning[id]
    else {
      const parsed = Chip8TuningSchema.safeParse(raw)
      if (!parsed.success) return false
      tuning[id] = parsed.data
    }
    this.#file.write({ ...file, tuning })
    return true
  }

  async favourite(id: unknown, on: unknown): Promise<boolean> {
    if (typeof on !== 'boolean' || !(await this.has(id)) || typeof id !== 'string') return false
    const file = this.#file.read()
    const favourites = on
      ? [...new Set([...file.favourites, id])]
      : file.favourites.filter((f) => f !== id)
    this.#file.write({ ...file, favourites })
    return true
  }

  /**
   * Takes a file the user picked into the library. Its size is checked before it is read and
   * again on what was read (the file may change between), and the bytes read - never the file
   * again - are what is kept, through a temp file, under their own hash.
   */
  async importFile(from: string): Promise<Chip8ImportResult> {
    const read = readPicked(from)
    if (!(read instanceof Uint8Array)) return { ok: false, problem: read }
    const bytes = read
    const hash = createHash('sha256').update(bytes).digest('hex')
    const id = `imported/${hash.slice(0, 16)}`
    const guess = guessPlatform(bytes)
    const file = this.#file.read()
    const known = file.imported.find((e) => e.id === id)
    try {
      // Written again when the kept copy has gone: otherwise the same file could never
      // come back, and its entry could not be seen to be removed.
      if (known === undefined || this.#bytes(known) === null) this.#keep(`${hash}.ch8`, bytes)
    } catch {
      return { ok: false, problem: 'That file could not be kept.' }
    }
    if (known === undefined) {
      const entry: Imported = {
        id,
        title: titleOfFile(from),
        platform: guess.platform,
        file: `${hash}.ch8`,
        name: path.basename(from).slice(0, 260),
        size: bytes.length,
        at: this.#now(),
      }
      this.#file.write({ ...file, imported: [...file.imported, this.#looked(entry, bytes)] })
    }
    const program = (await this.programs()).find((p) => p.id === id)
    if (program === undefined) return { ok: false, problem: 'That file could not be kept.' }
    return { ok: true, program, guess: guess.reason, already: known !== undefined }
  }

  #keep(name: string, bytes: Uint8Array): void {
    mkdirSync(this.#importedDir, { recursive: true })
    const target = path.join(this.#importedDir, name)
    const temp = `${target}.tmp`
    writeFileSync(temp, bytes)
    replaceFile(temp, target)
  }

  /**
   * Renames an imported program, or runs it as another machine; null when nothing was
   * changed. A new machine drops the tuning, whose quirks were the old one's.
   */
  update(id: unknown, raw: unknown): { machine: boolean } | null {
    const change = Chip8ImportChangeSchema.safeParse(raw)
    if (!isChip8ProgramId(id) || !id.startsWith('imported/') || !change.success) return null
    const file = this.#file.read()
    const at = file.imported.findIndex((e) => e.id === id)
    const entry = file.imported[at]
    if (entry === undefined) return null
    const changed = applyChange(entry, change.data)
    // A program too big for the machine asked for stays on its own.
    if (!bytesFit(changed.size, changed.platform)) return null
    const machine = changed.platform !== entry.platform
    // Another machine draws another picture: its preview is made again, once.
    const bytes = machine ? this.#bytes(changed) : null
    const next = bytes === null ? changed : this.#looked(changed, bytes)
    const imported = file.imported.with(at, next)
    const { [id]: _old, ...rest } = file.tuning
    this.#file.write({ ...file, imported, tuning: machine ? rest : file.tuning })
    return { machine }
  }

  /** Takes an imported program out of the library, with its file and its tuning and star. */
  remove(id: unknown): boolean {
    if (!isChip8ProgramId(id) || !id.startsWith('imported/')) return false
    const file = this.#file.read()
    const entry = file.imported.find((e) => e.id === id)
    if (entry === undefined) return false
    const { [id]: _gone, ...tuning } = file.tuning
    this.#file.write({
      ...file,
      imported: file.imported.filter((e) => e.id !== id),
      tuning,
      favourites: file.favourites.filter((f) => f !== id),
    })
    try {
      rmSync(path.join(this.#importedDir, entry.file), { force: true })
    } catch {
      // Held open by a scanner a moment: the entry is gone, and an orphan file costs nothing.
    }
    return true
  }

  #bytes(entry: Imported): Uint8Array | null {
    try {
      const bytes = new Uint8Array(readFileSync(path.join(this.#importedDir, entry.file)))
      return bytes.length > 0 && bytesFit(bytes.length, entry.platform) ? bytes : null
    } catch {
      return null
    }
  }

  /** An imported entry as a program, with the preview kept for it; null when its file is gone. */
  #program(entry: Imported): Chip8Program | null {
    if (this.#bytes(entry) === null) return null
    const quirks = quirksFor(entry.platform)
    const ipf = DEFAULT_IPF[entry.platform]
    const look = entry.look?.platform === entry.platform ? entry.look : null
    const preview = look?.preview ?? null
    const sensed = look?.keys ?? 0
    return {
      id: entry.id,
      title: entry.title,
      authors: [],
      platform: entry.platform,
      genre: 'imported',
      description: `Imported from ${entry.name}.`,
      ipf,
      quirks,
      font: 'octo',
      rotation: 0,
      licence: 'unknown',
      ...(preview !== null ? { preview } : {}),
      keys: sensed,
      favourite: false,
      source: { name: entry.name, size: entry.size, at: entry.at },
    }
  }

  /** An entry with its preview made for its machine, within main's budget for it. */
  #looked(entry: Imported, bytes: Uint8Array): Imported {
    const { platform } = entry
    const until = this.#clock() + PREVIEW_BUDGET_MS
    const run: PreviewRun = previewRun(
      bytes,
      { platform, quirks: quirksFor(platform), ipf: DEFAULT_IPF[platform], font: 'octo' },
      () => this.#clock() >= until,
    )
    // encodePreview makes only the sizes the schema names.
    const preview = run.preview as z.infer<typeof PreviewSchema> | null
    return { ...entry, look: { platform, preview, keys: run.sensed } }
  }

  /**
   * The file with every imported entry's preview made for its machine: an entry written
   * before previews were kept, or edited by hand, gets its own once, and it is written back.
   */
  #lookedAt(file: LibraryFile): LibraryFile {
    const stale = file.imported.some((e) => e.look?.platform !== e.platform && this.#bytes(e))
    if (!stale) return file
    const imported = file.imported.map((entry) => {
      if (entry.look?.platform === entry.platform) return entry
      const bytes = this.#bytes(entry)
      return bytes === null ? entry : this.#looked(entry, bytes)
    })
    const next = { ...file, imported }
    this.#file.write(next)
    return next
  }
}

/** A picked file's bytes, or why not: not a file, empty, too big, unreadable. */
function readPicked(from: string): Uint8Array | string {
  try {
    const stat = statSync(from)
    if (!stat.isFile()) return 'That is not a file.'
    if (stat.size === 0) return 'That file is empty.'
    if (stat.size > MAX_IMPORT) return tooBig(stat.size)
    const bytes = new Uint8Array(readFileSync(from))
    if (bytes.length === 0) return 'That file is empty.'
    if (bytes.length > MAX_IMPORT) return tooBig(bytes.length)
    return bytes
  } catch {
    return 'That file could not be read.'
  }
}

const tooBig = (size: number): string =>
  `That file is ${size.toLocaleString('en-US')} bytes: no CHIP-8 program is more than ${MAX_IMPORT.toLocaleString('en-US')}.`

const applyChange = (entry: Imported, change: Chip8ImportChange): Imported => ({
  ...entry,
  ...(change.title !== undefined ? { title: change.title } : {}),
  ...(change.platform !== undefined ? { platform: change.platform } : {}),
})

const bytesFit = (size: number, platform: Platform): boolean => size <= maxProgramSize(platform)
