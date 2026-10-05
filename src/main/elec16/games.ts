import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CART_MAX_SIZE, type CartHeader, readCart } from '@shared/elec16/cartridge'
import type { Elec16Game, Elec16GameImport } from '@shared/elec16-units'
import { fromBase64 } from '@shared/emu/base64'
import { z } from 'zod'
import { JsonStore } from '../store/json-store.js'
import { replaceFile } from '../store/replace-file.js'

/**
 * ELEC-16 PLAY's game shelf (docs/elec16-play.md section 7): its own, apart from everything of
 * CHIP-8's - another file, folder, channel and list. The bundled games come from
 * resources/elec16/games/games.json (written only by npm run gen:elec16); the ones the user
 * imported live in userData/elec16/games, the images under their hash beside library.json.
 *
 * An import is the user's action through main's picker: the file's size is checked before it
 * is read, its header and length by the core's own reader, and a game is known by the id in
 * its header - one id, one game, so its save RAM is never another's. The page gets the list;
 * an image (with its hash) goes only to a machine, through CART.
 */

const BundledSchema = z.object({
  games: z.array(z.object({ data: z.string(), about: z.string().max(120).default('') })),
})

const ImportedSchema = z.object({
  id: z.string().regex(/^[A-Z0-9-]{1,16}$/),
  file: z.string().regex(/^[0-9a-f]{64}\.e16g$/),
  /** The name the file had where it came from. */
  from: z.string().max(260),
  at: z.number(),
  /** Built from a folder by DEVELOP (section 11): a later build takes its place. */
  built: z.boolean().optional(),
})

const LibrarySchema = z.object({
  version: z.literal(1).default(1),
  games: z
    .array(z.unknown())
    .default([])
    // One broken entry costs only itself.
    .transform((list) => list.flatMap((g) => ImportedSchema.safeParse(g).data ?? [])),
})
type LibraryOnDisk = { version: 1; games: z.infer<typeof ImportedSchema>[] }

interface Held {
  game: Elec16Game
  image: Uint8Array
  digest: Uint8Array
}

/** An imported file as read: its header, image and hash; null when it does not read as one. */
type Read = { header: CartHeader; image: Uint8Array; digest: Uint8Array } | null

const digestOf = (image: Uint8Array): Uint8Array =>
  new Uint8Array(createHash('sha256').update(image).digest())

export class Elec16Games {
  readonly #dir: string
  readonly #bundled: readonly Held[]
  readonly #library: JsonStore<LibraryOnDisk>
  readonly #now: () => number
  /**
   * The imported files as read, by file name: a file is named by its image's hash, so it is
   * read and hashed once, not on every list, insert or CART request; dropped with its entry.
   */
  readonly #read = new Map<string, { stamp: string; read: Read }>()

  /** `dir` is userData/elec16; `resources` the folder holding games/games.json, if any. */
  constructor(dir: string, resources: string | null, now: () => number = Date.now) {
    this.#dir = path.join(dir, 'games')
    this.#bundled = readBundled(resources)
    this.#now = now
    this.#library = new JsonStore({
      file: path.join(this.#dir, 'library.json'),
      schema: LibrarySchema as unknown as z.ZodType<LibraryOnDisk>,
      makeDefault: () => ({ version: 1 as const, games: [] }),
    })
  }

  /** The shelf: the bundled games, then the imported ones by name. */
  list(): Elec16Game[] {
    const imported = this.#imported()
      .map((h) => h.game)
      .sort((a, b) => a.name.localeCompare(b.name))
    return [...this.#bundled.map((h) => h.game), ...imported]
  }

  /** A game's image and its hash, by id; null when the shelf has no such game. */
  image(id: string): { image: Uint8Array; digest: Uint8Array } | null {
    const held =
      this.#bundled.find((h) => h.game.id === id) ?? this.#imported().find((h) => h.game.id === id)
    return held === undefined ? null : { image: held.image, digest: held.digest }
  }

  /** A picked file put on the shelf, or why not. */
  import(file: string): Elec16GameImport {
    let image: Uint8Array
    try {
      const size = statSync(file).size
      if (size > CART_MAX_SIZE)
        return { ok: false, problem: `${size} bytes is more than a cartridge holds` }
      image = new Uint8Array(readFileSync(file))
    } catch {
      return { ok: false, problem: 'the file could not be read' }
    }
    return this.#take(image, path.basename(file), false)
  }

  /**
   * A game built from a folder (docs/elec16-play.md section 11) put on the shelf: the same
   * checks as an import, and it takes the place of an earlier build of the same id - never of
   * a bundled game.
   */
  importBuilt(image: Uint8Array, from: string): Elec16GameImport {
    if (image.length > CART_MAX_SIZE) {
      return { ok: false, problem: `${image.length} bytes is more than a cartridge holds` }
    }
    return this.#take(image, from, true)
  }

  #take(image: Uint8Array, from: string, built: boolean): Elec16GameImport {
    const header = readCart(image)
    if (header === null)
      return { ok: false, problem: 'it is not an ELEC-16 PLAY cartridge (.E16G)' }
    if (this.#bundled.some((h) => h.game.id === header.id)) {
      return { ok: false, problem: `${header.id} is the id of a game that comes with the app` }
    }
    const shown = this.#entries().find((e) => e.entry.id === header.id)
    if (!built && shown !== undefined) {
      return { ok: false, problem: `a game with the id ${header.id} is already on the shelf` }
    }
    if (shown !== undefined && shown.entry.built !== true) {
      return {
        ok: false,
        problem: `${header.id} is the id of a game imported from a file: take it off the shelf first`,
      }
    }
    const hash = Buffer.from(digestOf(image)).toString('hex')
    const name = `${hash}.e16g`
    const target = path.join(this.#dir, name)
    try {
      mkdirSync(this.#dir, { recursive: true })
      writeFileSync(`${target}.tmp`, image)
      replaceFile(`${target}.tmp`, target)
    } catch {
      // Never the path: the page shows the problem as it is.
      return { ok: false, problem: 'the game could not be written to the shelf' }
    }
    // The new image is in place before the entry moves to it: a build never leaves the
    // shelf without its game, and an entry of the same id left behind goes with the swap.
    const lib = this.#library.read()
    const entry = {
      id: header.id,
      file: name,
      from: from.slice(0, 260),
      at: this.#now(),
      ...(built ? { built: true } : {}),
    }
    const old = lib.games.filter((g) => g.id === header.id)
    const games = [...lib.games.filter((g) => g.id !== header.id), entry]
    this.#library.write({ ...lib, games })
    for (const g of old) this.#dropFile(g.file, games)
    return { ok: true, id: header.id }
  }

  /** An imported game taken off the shelf (a bundled one stays): false when there is none. */
  remove(id: string): boolean {
    const lib = this.#library.read()
    const entry = lib.games.find((g) => g.id === id)
    if (entry === undefined) return false
    const games = lib.games.filter((g) => g !== entry)
    this.#library.write({ ...lib, games })
    this.#dropFile(entry.file, games)
    return true
  }

  /** An image file no entry names any more, removed and forgotten. */
  #dropFile(file: string, games: readonly { file: string }[]): void {
    if (games.some((g) => g.file === file)) return
    this.#read.delete(file)
    rmSync(path.join(this.#dir, file), { force: true })
  }

  /** The imported games whose files are there and still read as cartridges. */
  #imported(): Held[] {
    return this.#entries().map(({ entry, read }) => ({
      game: gameOf(read.header, false, entry.from),
      image: read.image,
      digest: read.digest,
    }))
  }

  /** The library's entries with their files as read, those that read as their game. */
  #entries(): {
    entry: z.infer<typeof ImportedSchema>
    read: NonNullable<Read>
  }[] {
    return this.#library.read().games.flatMap((entry) => {
      const read = this.#readFile(entry.file)
      return read === null || read.header.id !== entry.id ? [] : [{ entry, read }]
    })
  }

  /**
   * An imported file, read and hashed again only when its size or time moved (one changed or
   * taken away behind the app's back is not taken for the game it was); a stat each call.
   */
  #readFile(name: string): Read {
    const file = path.join(this.#dir, name)
    let stamp: string
    try {
      const st = statSync(file)
      if (!st.isFile() || st.size > CART_MAX_SIZE) return null
      stamp = `${st.size}:${st.mtimeMs}`
    } catch {
      return null
    }
    const known = this.#read.get(name)
    if (known !== undefined && known.stamp === stamp) return known.read
    let read: Read = null
    try {
      const image = new Uint8Array(readFileSync(file))
      const header = readCart(image)
      if (header !== null) read = { header, image, digest: digestOf(image) }
    } catch {
      read = null
    }
    this.#read.set(name, { stamp, read })
    return read
  }
}

function gameOf(
  h: { id: string; name: string; banks: number; saveBanks: number },
  bundled: boolean,
  about: string,
): Elec16Game {
  return { id: h.id, name: h.name, banks: h.banks, saveBanks: h.saveBanks, bundled, about }
}

/** The bundled games from games.json; none when it cannot be read. */
function readBundled(resources: string | null): Held[] {
  if (resources === null) return []
  try {
    const parsed = BundledSchema.safeParse(
      JSON.parse(readFileSync(path.join(resources, 'games', 'games.json'), 'utf8')),
    )
    if (!parsed.success) return []
    return parsed.data.games.flatMap((g) => {
      const image = fromBase64(g.data)
      const header = image === null ? null : readCart(image)
      if (image === null || header === null) return []
      return [{ game: gameOf(header, true, g.about), image, digest: digestOf(image) }]
    })
  } catch {
    return []
  }
}
