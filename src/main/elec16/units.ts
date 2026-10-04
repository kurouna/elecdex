import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  CARD_STATUS,
  type CardAnswer,
  type CardFile,
  type CardRequest,
  cardOp,
  isCardName,
} from '@shared/elec16/card'
import { CART_ID, CART_MAX_SAVE_BANKS } from '@shared/elec16/cartridge'
import { BANK_SIZE } from '@shared/elec16/map'
import { decodeSnapshot, SNAPSHOT_MAX_SIZE } from '@shared/elec16/snapshot'
import { SOFT_HELP_MAX, type SoftFile } from '@shared/elec16/soft-card'
import {
  CardRequestSchema,
  type Elec16Claim,
  type Elec16FileInfo,
  type Elec16Unit,
  Elec16UnitChangeSchema,
  Elec16UnitSchema,
  type Elec16UnitSeed,
  isUnitId,
  unitDefaults,
} from '@shared/elec16-units'
import { fromBase64, toBase64 } from '@shared/emu/base64'
import { z } from 'zod'
import { JsonStore } from '../store/json-store.js'
import { replaceFile } from '../store/replace-file.js'

/**
 * The ELEC-16 units (docs/elec16.md section 8), in userData/elec16: units.json, and for each
 * unit a folder units/<id> with its battery backup (ram.e16s, a snapshot) and its memory card
 * (card.json). A unit's id is the folder's name and nothing a page says ever is.
 *
 * A unit runs in one pane at a time: the pane claims it, by (page, pane id), and gets its
 * backup; another pane is told no, or with MOVE HERE asks for it, and the holder is asked to
 * give it back with its machine as it is (`ask`), or after a moment it is taken anyway. The
 * writes are synchronous, one IPC message at a time, so a claim after a release always reads
 * what that release wrote - never the RAM before it.
 */

/** How long MOVE HERE waits for the pane that holds the unit to give it back. */
export const HAND_OVER_MS = 3000

const FileSchema = z.object({
  name: z.string().refine(isCardName),
  modified: z.number(),
  data: z.string().max(Math.ceil((32 * 1024 * 4) / 3) + 4),
})

const CardFileSchema = z.object({
  version: z.literal(1).default(1),
  files: z
    .array(z.unknown())
    .default([])
    // One broken file costs only itself.
    .transform((list) =>
      list.flatMap((raw) => {
        const file = FileSchema.safeParse(raw).data
        return file === undefined || fromBase64(file.data) === null ? [] : [file]
      }),
    ),
})
/** card.json: each file's bytes in base64. */
type CardOnDisk = { version: 1; files: z.infer<typeof FileSchema>[] }

const fromDisk = (card: CardOnDisk): CardFile[] =>
  card.files.map((f) => ({
    name: f.name,
    modified: f.modified,
    data: fromBase64(f.data) ?? new Uint8Array(),
  }))

const toDisk = (files: readonly CardFile[]): CardOnDisk => ({
  version: 1,
  files: files.map((f) => ({ name: f.name, modified: f.modified, data: toBase64(f.data) })),
})

const UnitsFileSchema = z.object({
  version: z.literal(1).default(1),
  units: z
    .array(z.unknown())
    .default([])
    .transform((list) => list.flatMap((raw) => Elec16UnitSchema.safeParse(raw).data ?? [])),
})
type UnitsFile = z.infer<typeof UnitsFileSchema>

/** Who holds a unit: a page (its WebContents id) and its pane. */
export interface Holder {
  page: number
  pane: string
}

interface Waiting {
  holder: Holder
  /** The holder let the unit go. */
  done: () => void
  /** A later MOVE HERE for the unit came: this one gives up. */
  superseded: () => void
}

export class Elec16Units {
  readonly #dir: string
  readonly #now: () => number
  readonly #units: JsonStore<UnitsFile>
  readonly #cards = new Map<string, JsonStore<CardOnDisk>>()
  readonly #holders = new Map<string, Holder>()
  /** A pane waiting for a unit another holds (MOVE HERE), by unit. */
  readonly #waiting = new Map<string, Waiting>()

  /** The SOFT CARD: elecdex's own programs, read by every unit, written by none. */
  readonly #soft: readonly SoftFile[]

  constructor(dir: string, now: () => number = Date.now, soft: readonly SoftFile[] = []) {
    this.#dir = dir
    this.#now = now
    this.#soft = soft
    this.#units = new JsonStore({
      file: path.join(dir, 'units.json'),
      schema: UnitsFileSchema as unknown as z.ZodType<UnitsFile>,
      makeDefault: () => UnitsFileSchema.parse({}),
    })
  }

  /** Every unit; the first is made when there is none, as a new pane needs one. */
  list(seed?: Elec16UnitSeed): Elec16Unit[] {
    const file = this.#units.read()
    if (file.units.length > 0) return file.units
    return [this.create(seed)]
  }

  /** A new unit, UNIT n after the highest, its clock and LCD from `seed`. */
  create(seed?: Elec16UnitSeed): Elec16Unit {
    const file = this.#units.read()
    const n = Math.max(0, ...file.units.map((u) => Number(u.id.slice(1)))) + 1
    const unit: Elec16Unit = {
      id: `u${n}`,
      name: `UNIT ${n}`,
      ...unitDefaults(seed),
      created: this.#now(),
    }
    this.#units.write({ ...file, units: [...file.units, unit] })
    return unit
  }

  unit(id: unknown): Elec16Unit | null {
    if (!isUnitId(id)) return null
    return this.#units.read().units.find((u) => u.id === id) ?? null
  }

  /** TUNE's changes to a unit; null when there is no such unit or the change is not one. */
  update(id: unknown, raw: unknown): Elec16Unit | null {
    const change = Elec16UnitChangeSchema.safeParse(raw)
    const unit = this.unit(id)
    if (unit === null || !change.success) return null
    const c = change.data
    const next: Elec16Unit = {
      ...unit,
      ...(c.name !== undefined ? { name: c.name } : {}),
      ...(c.clock !== undefined ? { clock: c.clock } : {}),
      ...(c.model !== undefined ? { model: c.model } : {}),
      ...(c.autoOff !== undefined ? { autoOff: c.autoOff } : {}),
      ...(c.xram !== undefined ? { xram: c.xram } : {}),
    }
    const file = this.#units.read()
    this.#units.write({ ...file, units: file.units.map((u) => (u.id === unit.id ? next : u)) })
    return next
  }

  /** Throws a unit away, its RAM and card with it: only one no pane holds, and never the last. */
  remove(id: unknown): boolean {
    const unit = this.unit(id)
    const file = this.#units.read()
    if (unit === null || this.#holders.has(unit.id) || file.units.length < 2) return false
    this.#units.write({ ...file, units: file.units.filter((u) => u.id !== unit.id) })
    this.#cards.delete(unit.id)
    rmSync(this.#unitDir(unit.id), { recursive: true, force: true })
    return true
  }

  /* ---------------- who runs a unit ---------------- */

  /** Every unit held, and by whom. */
  holders(): Map<string, Holder> {
    return new Map(this.#holders)
  }

  /** A pane takes a unit no other holds (or that it holds already): its battery backup. */
  claim(id: unknown, holder: Holder): Elec16Claim {
    const unit = this.unit(id)
    if (unit === null) return { ok: false }
    const now = this.#holders.get(unit.id)
    if (now !== undefined && !same(now, holder)) return { ok: false }
    this.#holders.set(unit.id, holder)
    return { ok: true, snapshot: this.#backup(unit.id) }
  }

  /**
   * MOVE HERE: the unit for this pane even though another holds it. The holder is asked to
   * give it back (`ask`), which its release does with its machine as it is; a holder that
   * does not answer within HAND_OVER_MS loses it anyway, with what it last saved.
   */
  async moveHere(id: unknown, holder: Holder, ask: (from: Holder) => void): Promise<Elec16Claim> {
    const unit = this.unit(id)
    if (unit === null) return { ok: false }
    const now = this.#holders.get(unit.id)
    if (now !== undefined && !same(now, holder)) {
      const outcome = await this.#askBack(unit.id, now, holder, ask)
      if (outcome === 'superseded') return { ok: false }
      const waiting = this.#waiting.get(unit.id)
      if (waiting !== undefined && same(waiting.holder, holder)) this.#waiting.delete(unit.id)
      // Taken meanwhile by someone other than the pane asked: two must never run one unit.
      const after = this.#holders.get(unit.id)
      if (after !== undefined && !same(after, now)) return { ok: false }
      this.#holders.delete(unit.id)
    }
    return this.claim(unit.id, holder)
  }

  /**
   * Asks the holder for the unit back and waits, at most HAND_OVER_MS: 'given' when it let
   * go, 'late' when it did not answer, 'superseded' when another MOVE HERE came first.
   */
  #askBack(
    unit: string,
    from: Holder,
    holder: Holder,
    ask: (from: Holder) => void,
  ): Promise<'given' | 'late' | 'superseded'> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve('late'), HAND_OVER_MS)
      this.#waiting.get(unit)?.superseded()
      this.#waiting.set(unit, {
        holder,
        done: () => {
          clearTimeout(timer)
          resolve('given')
        },
        superseded: () => {
          clearTimeout(timer)
          resolve('superseded')
        },
      })
      ask(from)
    })
  }

  /**
   * A pane lets a unit go, with its machine as it is (null: as last saved). Only the holder
   * can; a waiting MOVE HERE goes on at once.
   */
  release(id: unknown, holder: Holder, snapshot: unknown): boolean {
    const unit = this.unit(id)
    if (unit === null || !this.#holds(unit.id, holder)) return false
    if (snapshot !== null) this.#writeBackup(unit.id, snapshot)
    this.#holders.delete(unit.id)
    this.#waiting.get(unit.id)?.done()
    return true
  }

  /** A page went (closed, reloaded): its units are free, as last saved. */
  dropPage(page: number): string[] {
    const freed: string[] = []
    for (const [unit, holder] of this.#holders) {
      if (holder.page !== page) continue
      this.#holders.delete(unit)
      this.#waiting.get(unit)?.done()
      freed.push(unit)
    }
    return freed
  }

  /** The battery backup, written by the pane that holds the unit; false for anyone else. */
  save(id: unknown, holder: Holder, snapshot: unknown): boolean {
    const unit = this.unit(id)
    if (unit === null || !this.#holds(unit.id, holder)) return false
    return this.#writeBackup(unit.id, snapshot)
  }

  /** Whether this pane holds the unit now (LINK answers only the pane that runs it). */
  holds(id: unknown, holder: Holder): boolean {
    const unit = this.unit(id)
    return unit !== null && this.#holds(unit.id, holder)
  }

  #holds(id: string, holder: Holder): boolean {
    const now = this.#holders.get(id)
    return now !== undefined && same(now, holder)
  }

  #unitDir(id: string): string {
    return path.join(this.#dir, 'units', id)
  }

  /** The backup, checked as the core decodes it; null when there is none or it is not one. */
  #backup(id: string): Uint8Array | null {
    const file = path.join(this.#unitDir(id), 'ram.e16s')
    try {
      if (statSync(file).size > SNAPSHOT_MAX_SIZE) return null
      const bytes = new Uint8Array(readFileSync(file))
      return decodeSnapshot(bytes) === null ? null : bytes
    } catch {
      return null
    }
  }

  #writeBackup(id: string, snapshot: unknown): boolean {
    if (!(snapshot instanceof Uint8Array) || snapshot.length > SNAPSHOT_MAX_SIZE) return false
    const state = decodeSnapshot(snapshot)
    if (state === null) return false
    this.#write(path.join(this.#unitDir(id), 'ram.e16s'), snapshot)
    // The cartridge's save RAM is kept by the game's id too, for when it is put in again.
    const cart = state.cart
    if (cart !== null && cart.save.length > 0) this.#write(this.#saveFile(id, cart.id), cart.save)
    return true
  }

  #saveFile(unit: string, game: string): string {
    return path.join(this.#unitDir(unit), 'saves', `${game}.sav`)
  }

  /** The save RAM a unit keeps for a game; none when it has none (or no such unit). */
  saveOf(unit: unknown, game: string): Uint8Array | undefined {
    if (this.unit(unit) === null || !CART_ID.test(game)) return undefined
    try {
      const file = this.#saveFile(unit as string, game)
      if (statSync(file).size > CART_MAX_SAVE_BANKS * BANK_SIZE) return undefined
      return new Uint8Array(readFileSync(file))
    } catch {
      return undefined
    }
  }

  /**
   * GAMES: a game put in the unit's slot, or taken out (null) - only by the pane that holds it,
   * a game id as a header has one. The unit with its slot as it now is; null when refused.
   */
  setCart(id: unknown, holder: Holder, game: string | null): Elec16Unit | null {
    const unit = this.unit(id)
    if (unit === null || !this.#holds(unit.id, holder)) return null
    if (game !== null && !CART_ID.test(game)) return null
    const { cart: _was, ...rest } = unit
    const next: Elec16Unit = game === null ? rest : { ...rest, cart: game }
    const file = this.#units.read()
    this.#units.write({ ...file, units: file.units.map((u) => (u.id === unit.id ? next : u)) })
    return next
  }

  #write(file: string, bytes: Uint8Array | string): void {
    mkdirSync(path.dirname(file), { recursive: true })
    const temp = `${file}.tmp`
    writeFileSync(temp, bytes)
    replaceFile(temp, file)
  }

  /* ---------------- the memory card ---------------- */

  #card(id: string): JsonStore<CardOnDisk> {
    let store = this.#cards.get(id)
    if (store === undefined) {
      store = new JsonStore({
        file: path.join(this.#unitDir(id), 'card.json'),
        schema: CardFileSchema as unknown as z.ZodType<CardOnDisk>,
        makeDefault: () => ({ version: 1 as const, files: [] }),
      })
      this.#cards.set(id, store)
    }
    return store
  }

  #files(id: string): CardFile[] {
    return fromDisk(this.#card(id).read())
  }

  /** A card command from the pane that holds the unit; NO CARD for anyone else. */
  card(id: unknown, holder: Holder, raw: unknown): CardAnswer {
    const unit = this.unit(id)
    const request = CardRequestSchema.safeParse(raw)
    if (unit === null || !this.#holds(unit.id, holder) || !request.success) {
      return { status: CARD_STATUS.noCard }
    }
    return this.#do(unit.id, request.data)
  }

  #do(id: string, request: CardRequest): CardAnswer {
    // The core checked the names; a page is not trusted to have.
    const named = request.op === 'dir' || request.op === 'free' || isCardName(request.name)
    if (!named || (request.op === 'rename' && !isCardName(request.newName))) {
      return { status: CARD_STATUS.badName }
    }
    const files = this.#files(id)
    const done = cardOp(files, request, this.#now(), this.#soft)
    if (done.files !== files) this.#card(id).write(toDisk(done.files))
    return done.answer
  }

  /** The card's files, for FILES. */
  files(id: unknown): Elec16FileInfo[] {
    const unit = this.unit(id)
    if (unit === null) return []
    return this.#files(unit.id).map((f) => ({
      name: f.name,
      size: f.data.length,
      modified: f.modified,
    }))
  }

  /** The SOFT CARD's files, for FILES. */
  softFiles(): Elec16FileInfo[] {
    return this.#soft.map((f) => ({
      name: f.name,
      size: f.data.length,
      modified: f.modified,
      about: f.about,
      help: f.help,
    }))
  }

  /** A file's bytes, for EXPORT: the unit's own, or the SOFT CARD's. */
  fileData(id: unknown, name: unknown): Uint8Array | null {
    const unit = this.unit(id)
    if (unit === null || typeof name !== 'string') return null
    const own = this.#files(unit.id).find((f) => f.name === name)
    return own?.data ?? this.#soft.find((f) => f.name === name)?.data ?? null
  }

  /** IMPORT's bytes as a file on the card (written over one of the name): its status. */
  addFile(id: unknown, name: string, data: Uint8Array): number {
    const unit = this.unit(id)
    if (unit === null) return CARD_STATUS.noCard
    return this.#do(unit.id, {
      op: 'write',
      name,
      newName: '',
      offset: 0,
      length: data.length,
      data,
      address: 0,
    }).status
  }
}

const same = (a: Holder, b: Holder): boolean => a.page === b.page && a.pane === b.pane

/** The folder of resources/elec16 (soft.json), from where this file is, packaged or not. */
export function findElec16Dir(from: string): string | null {
  let dir = from
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'resources', 'elec16')
    if (existsSync(path.join(candidate, 'soft.json'))) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

const SoftFileSchema = z.object({
  files: z.array(
    z.object({
      name: z.string().refine(isCardName),
      data: z.string(),
      about: z.string().max(80).default(''),
      help: z.string().max(SOFT_HELP_MAX).default(''),
    }),
  ),
})

/** The SOFT CARD from soft.json; none when it cannot be read. */
export function readSoftCard(dir: string | null): SoftFile[] {
  if (dir === null) return []
  try {
    const parsed = SoftFileSchema.safeParse(
      JSON.parse(readFileSync(path.join(dir, 'soft.json'), 'utf8')),
    )
    if (!parsed.success) return []
    return parsed.data.files.flatMap((f) => {
      const data = fromBase64(f.data)
      return data === null
        ? []
        : [{ name: f.name, data, modified: 0, about: f.about, help: f.help }]
    })
  } catch {
    return []
  }
}
