import { compile } from '../../e16c/compile.js'
import { type AsmChunk, type AsmError, type AsmResult, assemble } from '../asm.js'
import { entryProblem, type GameMeta, metaProblem } from '../cart-build.js'
import { CART_HEADER, CART_MAX_BANKS, type CartHeader, makeCart, readCart } from '../cartridge.js'
import { BANK_SIZE } from '../map.js'
import { generatedIncludes } from '../rom.js'
import { compileSongs, songBytes } from './mml.js'
import { type Palette, type Picture, readMap, readPalettes, readSheet } from './tiles.js'

/**
 * The game kit's builder (docs/elec16-play.md section 10): a game written in e16c, its
 * pictures and its music, made into a cartridge.
 *
 * The cartridge's banks, in order:
 *   0               the entry (runtime.s), which copies the game's code into RAM
 *   1 ..            code an e16c file was given a bank for (runs in the window)
 *   then            the data: the kit's tables, palettes, sheets, maps, songs, tables
 *   last            the code for RAM (2000-6FFF), copied at the start
 *
 * Everything the game needs to find its data is a constant in a generated `assets.e16.ts`:
 * the machine's bank (0x100 + the cartridge's) and the address in the window. Pure: the build
 * script, the tests and anything later build alike.
 */

export interface KitMeta extends GameMeta {
  /** The e16c sources, in order; a file with a bank runs from that cartridge bank (1 on). */
  sources: (string | { file: string; bank: number })[]
  /** The palette picture (16 points wide, a palette a row) and each row's name. */
  palettes: { png: string; names: string[] }
  /** Sprite sheets (and fonts): frames of one size in one palette. */
  sheets?: KitSheet[]
  /** Background pictures, made into tiles and a map 64 cells wide. */
  maps?: KitMap[]
  /** MML files of songs (`song name` sections). */
  music?: string[]
  /** Text files of numbers (words), for a game's own tables. */
  tables?: { name: string; file: string }[]
}

export interface KitSheet {
  name: string
  png: string
  cell: 8 | 16 | 32
  palette: string
  count?: number
  tile?: number
  /**
   * Frames kept in the cartridge and loaded a few at a time: the sheet takes room in video
   * memory for only this many frames from `tile` (a game `load`s the ones it shows).
   */
  stream?: number
}

export interface KitMap {
  name: string
  png: string
  palettes: { palette: string; slot: number }[]
  tile?: number
  /** Every cell drawn (not clear) in front of the sprites: panels round the field, say. */
  front?: boolean
}

export interface KitInput {
  meta: KitMeta
  /** A text file of the game's folder. */
  read: (name: string) => string | null
  /** A picture of the game's folder, decoded. */
  picture: (name: string) => Picture | null
  /** A file of the kit's library (games/lib). */
  lib: (name: string) => string | null
  /** Where the PLAY ROM's trap handler is (play-rom.json's `trap`). */
  romTrap: number
}

export interface KitReport {
  banks: number
  /** Bytes of code and strings copied into RAM. */
  ramCode: number
  /** Tiles used of the 1,024. */
  tiles: number
  /** The generated assets.e16.ts: gen:elec16 writes it beside the game's sources. */
  assets: string
  /** e16c's output (every source, the library's too): gen:elec16 writes it as compiled.s. */
  asm: string
}

export type KitResult = { image: Uint8Array; report: KitReport } | { errors: AsmError[] }

export const KIT_LIB_SOURCES = ['kit.e16.ts', 'sound.e16.ts']
/** The name of the generated constants, beside the game's sources. */
export const KIT_ASSETS = 'assets.e16.ts'
/** The name of e16c's output for the game, kept beside its sources to read and compare. */
export const KIT_COMPILED = 'compiled.s'
/** The game's globals and arrays in RAM; its code from IMAGE_AT to the stack. */
export const KIT_DATA = { start: 0x0280, end: 0x2000 }
export const KIT_IMAGE_AT = 0x2000
export const KIT_IMAGE_END = 0x7000
const CART_BANK = 0x100
const TILES = 1024
/** Map rows are always 64 cells (a background's width), 128 bytes. */
const MAP_ROW = 128

class KitError extends Error {}

/** The data placed bank by bank: a blob never straddles a bank unless it says it may. */
export class Layout {
  bank: number
  offset = 0
  readonly blobs: { bank: number; offset: number; bytes: Uint8Array }[] = []

  constructor(first: number) {
    this.bank = first
  }

  /** Places `bytes`; answers its machine bank and window address. */
  put(bytes: Uint8Array, wholeBanks = false): { bank: number; at: number } {
    if (!wholeBanks && bytes.length > BANK_SIZE) {
      throw new KitError(`a part of ${bytes.length} bytes is more than a bank`)
    }
    this.offset += this.offset & 1
    // Even an empty part is placed in its bank's window, never at its end (E000).
    if (wholeBanks ? this.offset !== 0 : this.offset + Math.max(1, bytes.length) > BANK_SIZE) {
      this.bank++
      this.offset = 0
    }
    const place = { bank: CART_BANK + this.bank, at: 0xc000 + this.offset }
    this.blobs.push({ bank: this.bank, offset: this.offset, bytes })
    const end = this.offset + bytes.length
    this.bank += Math.floor(end / BANK_SIZE)
    this.offset = end % BANK_SIZE
    return place
  }

  /** The first bank after everything placed. */
  end(): number {
    return this.offset === 0 ? this.bank : this.bank + 1
  }
}

const words = (values: number[]) => {
  const out = new Uint8Array(values.length * 2)
  values.forEach((v, k) => {
    out[k * 2] = v & 0xff
    out[k * 2 + 1] = (v >> 8) & 0xff
  })
  return out
}

const constName = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '_')

/** A tile range of video memory and what took it. */
interface TileRange {
  first: number
  count: number
  what: string
}

/** The data, laid out after the code's banks, and the constants that find it. */
class Assets {
  readonly layout: Layout
  readonly #consts: string[] = []
  readonly #input: KitInput
  readonly #palettes = new Map<string, Palette>()
  readonly #names = new Set<string>()
  readonly #ranges: TileRange[] = []
  #tile = 0
  tiles = 0

  constructor(input: KitInput, firstBank: number) {
    this.#input = input
    this.layout = new Layout(firstBank)
    this.#kitTables()
    this.#readPalettes()
    for (const s of input.meta.sheets ?? []) this.#sheet(s)
    for (const m of input.meta.maps ?? []) this.#map(m)
    for (const file of input.meta.music ?? []) this.#music(file)
    for (const t of input.meta.tables ?? []) this.#table(t.name, t.file)
  }

  /** The generated assets.e16.ts. */
  text(): string {
    const head = `// Made by the game kit's builder (shared/elec16/kit/build.ts) for ${this.#input.meta.id}: do not edit.`
    return `${[head, ...this.#consts].join('\n')}\n`
  }

  /** A constant for the game's sources: a name of its own, which TypeScript can read. */
  #say(name: string, value: number): void {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
      throw new KitError(`${name} is not a name a constant can have: start a name with a letter`)
    }
    if (this.#names.has(name)) {
      throw new KitError(`${name} is made twice: give the parts different names`)
    }
    this.#names.add(name)
    this.#consts.push(`export const ${name} = 0x${value.toString(16)}`)
  }

  #picture(name: string): Picture {
    const p = this.#input.picture(name)
    if (p === null) throw new KitError(`no picture ${name}`)
    return p
  }

  #text(name: string, what: string): string {
    const t = this.#input.read(name)
    if (t === null) throw new KitError(`no ${what} ${name}`)
    return t
  }

  #paletteOf(name: string): Palette {
    const p = this.#palettes.get(name)
    if (p === undefined) throw new KitError(`no palette ${name}`)
    return p
  }

  /**
   * Tiles from `want` (or the next free), `count` of them. Parts share tiles only when they
   * say so, by starting at the same `tile` (frames loaded in turn into one room); any other
   * overlap is a mistake that would draw one part with the other's tiles.
   */
  #tilesAt(want: number | undefined, count: number, what: string): number {
    const first = want ?? this.#tile
    if (first < 0 || !Number.isInteger(first))
      throw new KitError(`${what}: tile ${first} is no tile`)
    if (first + count > TILES) throw new KitError(`${what} needs tiles past ${TILES}`)
    for (const r of this.#ranges) {
      const overlaps = count > 0 && first < r.first + r.count && r.first < first + count
      if (overlaps && first !== r.first) {
        const range = (x: number, n: number) => `${x}-${x + n - 1}`
        throw new KitError(
          `${what}'s tiles ${range(first, count)} run into ${r.what}'s ${range(r.first, r.count)}: give both the same tile to share them`,
        )
      }
    }
    this.#ranges.push({ first, count, what })
    this.#tile = Math.max(this.#tile, first + count)
    this.tiles = Math.max(this.tiles, first + count)
    return first
  }

  /** Sines of 256 steps times 256, then atan(k/32) for k 0-32 in the same steps. */
  #kitTables(): void {
    const sin = Array.from(
      { length: 256 },
      (_, k) => Math.round(256 * Math.sin((2 * Math.PI * k) / 256)) & 0xffff,
    )
    const atan = Array.from({ length: 33 }, (_, k) =>
      Math.round((Math.atan(k / 32) * 128) / Math.PI),
    )
    const place = this.layout.put(words([...sin, ...atan]))
    this.#say('KIT_TABLES_BANK', place.bank)
    this.#say('KIT_SIN_AT', place.at)
    this.#say('KIT_ATAN_AT', place.at + 512)
  }

  #readPalettes(): void {
    const { png, names } = this.#input.meta.palettes
    const palettes = readPalettes(this.#picture(png))
    if (palettes.length !== names.length) {
      throw new KitError(`${png} has ${palettes.length} palettes and ${names.length} names`)
    }
    const place = this.layout.put(words(palettes.flat()))
    this.#say('PALETTES_BANK', place.bank)
    this.#say('PALETTES_AT', place.at)
    names.forEach((n, k) => {
      this.#palettes.set(n, palettes[k] ?? [])
      this.#say(`PAL_${constName(n)}`, k)
    })
  }

  #sheet(s: KitSheet): void {
    const sheet = readSheet(this.#picture(s.png), s.cell, this.#paletteOf(s.palette), s.count)
    const n = constName(s.name)
    // A sheet larger than a bank starts at one and runs on through the next, as a map does:
    // frames a game loads one at a time (`load` crosses banks), the rest left in the cartridge.
    const place = this.layout.put(sheet.bytes, sheet.bytes.length > BANK_SIZE)
    const shown = Math.min(sheet.frames, s.stream ?? sheet.frames)
    this.#say(`${n}_TILE`, this.#tilesAt(s.tile, shown * sheet.tilesPerFrame, s.name))
    this.#say(`${n}_BANK`, place.bank)
    this.#say(`${n}_AT`, place.at)
    // A streamed sheet's bytes are its room's (what one `load` copies): the whole may pass a word.
    this.#say(`${n}_BYTES`, shown * sheet.tilesPerFrame * 32)
    this.#say(`${n}_FRAMES`, sheet.frames)
    this.#say(`${n}_STEP`, sheet.tilesPerFrame)
  }

  #map(m: KitMap): void {
    const n = constName(m.name)
    const p = this.#picture(m.png)
    if (p.width > 64 * 8) throw new KitError(`${m.name} is wider than 64 cells`)
    const first = m.tile ?? this.#tile
    for (const x of m.palettes) {
      if (!(Number.isInteger(x.slot) && x.slot >= 0 && x.slot <= 7)) {
        throw new KitError(`${m.name}: slot ${x.slot} is not a background's palette, 0 to 7`)
      }
    }
    const palettes = m.palettes.map((x) => ({ slot: x.slot, palette: this.#paletteOf(x.palette) }))
    const map = readMap(p, palettes, first)
    this.#tilesAt(m.tile, map.tiles.length / 32, m.name)
    const t = this.layout.put(map.tiles, map.tiles.length > BANK_SIZE)
    this.#say(`${n}_TILE`, first)
    this.#say(`${n}_TILES_BANK`, t.bank)
    this.#say(`${n}_TILES_AT`, t.at)
    this.#say(`${n}_TILES_BYTES`, map.tiles.length)
    // Rows of 64 cells, so a row is one DMA of 128 bytes; the rest of a row is clear.
    const rows = new Uint16Array(map.height * 64).fill(first)
    for (let y = 0; y < map.height; y++) {
      rows.set(map.cells.subarray(y * map.width, (y + 1) * map.width), y * 64)
    }
    // The clear tile is first, whatever palette its cell took: only drawn cells go in front.
    if (m.front === true) {
      for (let k = 0; k < rows.length; k++) {
        if (((rows[k] ?? 0) & 0x3ff) !== first) rows[k] = (rows[k] ?? 0) | 0x8000
      }
    }
    const cells = this.layout.put(words([...rows]), true)
    this.#say(`${n}_MAP_BANK`, cells.bank)
    this.#say(`${n}_W`, map.width)
    this.#say(`${n}_H`, map.height)
    this.#say(`${n}_ROWS_PER_BANK`, BANK_SIZE / MAP_ROW)
  }

  #music(file: string): void {
    for (const song of compileSongs(this.#text(file, 'music'))) {
      const place = this.layout.put(songBytes(song))
      const n = constName(song.name)
      this.#say(`SONG_${n}_BANK`, place.bank)
      this.#say(`SONG_${n}_AT`, place.at)
    }
  }

  #table(name: string, file: string): void {
    const values = this.#text(file, 'table')
      .replace(/#.*$/gm, '')
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((v) => {
        const n = Number(v)
        // A word: -32768 to 65535, whole. Anything else is a typing slip, never a 0.
        if (!Number.isInteger(n) || n < -0x8000 || n > 0xffff) {
          throw new KitError(`${file}: "${v}" is not a word (a whole number, -32768 to 65535)`)
        }
        return n & 0xffff
      })
    const n = constName(name)
    const place = this.layout.put(words(values))
    this.#say(`${n}_BANK`, place.bank)
    this.#say(`${n}_AT`, place.at)
    this.#say(`${n}_LEN`, values.length)
  }
}

/** The game's cartridge, or what is wrong with it. */
export function buildKitGame(input: KitInput): KitResult {
  const { meta } = input
  const problem = (message: string): KitResult => ({
    errors: [{ file: meta.id, line: 0, message }],
  })
  const bad = metaProblem(meta)
  if (bad !== null) return problem(bad)
  try {
    return build(input)
  } catch (e) {
    return problem(e instanceof Error ? e.message : String(e))
  }
}

function needed(text: string | null, name: string): string {
  if (text === null) throw new KitError(`no ${name}`)
  return text
}

/** The sources with their banks; bank 0 is the entry's, so a file's is 1 or more. */
function sourcesOf(meta: KitMeta): { file: string; bank?: number }[] {
  return meta.sources.map((s) => {
    if (typeof s === 'string') return { file: s }
    if (s.bank < 1) throw new KitError(`${s.file}: bank 0 is the entry's; give 1 or more`)
    return s
  })
}

function build(input: KitInput): KitResult {
  const sources = sourcesOf(input.meta)
  const codeBanks = sources.reduce((m, s) => Math.max(m, s.bank ?? 0), 0)
  const data = new Assets(input, codeBanks + 1)
  const files = [
    ...KIT_LIB_SOURCES.map((name) => ({
      name: `lib/${name}`,
      text: needed(input.lib(name), name),
    })),
    ...sources.map((s) => ({ name: s.file, text: needed(input.read(s.file), s.file), ...s })),
    { name: KIT_ASSETS, text: data.text() },
  ]
  const compiled = compile(files, {
    opt: 2,
    data: KIT_DATA,
    banks: CART_MAX_BANKS,
    bankBase: CART_BANK,
  })
  if (compiled.errors.length > 0) {
    return {
      errors: compiled.errors.map((e) => ({ file: e.file, line: e.line, message: e.message })),
    }
  }
  const imageBank = data.layout.end()
  const assembleWith = (imageLen: number) =>
    assembleGame(input, compiled.asm, CART_BANK + imageBank, imageLen)
  // Twice: the entry copies the code for RAM, and must know how long it is.
  const first = assembleWith(0)
  if (first.errors.length > 0) return { errors: first.errors }
  const out = assembleWith(ramImage(first.chunks).length)
  if (out.errors.length > 0) return { errors: out.errors }
  const image = ramImage(out.chunks)
  const banks = imageBank + Math.ceil(image.length / BANK_SIZE)
  if (banks > CART_MAX_BANKS) throw new KitError(`${banks} banks is more than a cartridge has`)
  const rom = romOf(banks, codeBanks, out.chunks, data.layout, imageBank, image)
  const entry = out.symbols.get('start')
  if (entry === undefined) throw new KitError('no start')
  const wrongEntry = entryProblem(entry)
  if (wrongEntry !== null) throw new KitError(wrongEntry)
  const { meta } = input
  const header: CartHeader = {
    banks,
    saveBanks: meta.saveBanks,
    entry,
    id: meta.id,
    name: meta.name,
  }
  const cart = makeCart(header, rom)
  if (cart.length !== CART_HEADER + rom.length) throw new KitError('the image is not whole')
  // The last word is the reader's: what it refuses is no cartridge, whatever was checked above.
  if (readCart(cart) === null) throw new KitError('the image is not a cartridge PLAY-320 takes')
  return {
    image: cart,
    report: {
      banks,
      ramCode: image.length,
      tiles: data.tiles,
      assets: data.text(),
      asm: compiled.asm,
    },
  }
}

/** The runtime and the game's e16c output, assembled for a cartridge. */
function assembleGame(
  input: KitInput,
  asm: string,
  imageBank: number,
  imageLen: number,
): AsmResult {
  const generated = generatedIncludes()
  const head = [
    `IMAGE_BANK = 0x${imageBank.toString(16)}`,
    `IMAGE_LEN = ${imageLen}`,
    `ROM_TRAP = 0x${input.romTrap.toString(16)}`,
  ].join('\n')
  const runtime = needed(input.lib('runtime.s'), 'runtime.s')
  return assemble(`${head}\n${runtime}\n.include "game.s"\n`, {
    include: (name) => (name === 'game.s' ? asm : (generated[name] ?? input.lib(name))),
    file: `${input.meta.id}.s`,
    banks: CART_MAX_BANKS,
  })
}

/** The cartridge's ROM: the code's banks, the data, then the code for RAM. */
function romOf(
  banks: number,
  codeBanks: number,
  chunks: AsmChunk[],
  layout: Layout,
  imageBank: number,
  image: Uint8Array,
): Uint8Array {
  const rom = new Uint8Array(banks * BANK_SIZE).fill(0xff)
  for (const c of chunks) {
    if (c.bank === null) continue
    if (c.bank > codeBanks) throw new KitError(`code in bank ${c.bank}, past the code's banks`)
    rom.set(c.bytes, c.bank * BANK_SIZE + (c.address - 0xc000))
  }
  for (const b of layout.blobs) rom.set(b.bytes, b.bank * BANK_SIZE + b.offset)
  rom.set(image, imageBank * BANK_SIZE)
  return rom
}

/** Past the window: where a bank's code runs on when it is more than the bank's 8 KB. */
const WINDOW_END = 0xe000

/**
 * The bytes assembled for RAM, from IMAGE_AT; nothing may fall outside 2000-6FFF. Code that
 * ran past E000 is a bank's, too long for it: the assembler leaves the window there.
 */
function ramImage(chunks: AsmChunk[]): Uint8Array {
  const ram = chunks.filter((c) => c.bank === null)
  let end = KIT_IMAGE_AT
  for (const c of ram) {
    const last = c.address + c.bytes.length
    if (c.address < KIT_IMAGE_AT || last > KIT_IMAGE_END) {
      const range = `0x${c.address.toString(16)}-0x${last.toString(16)}`
      if (c.address >= WINDOW_END) {
        throw new KitError(
          `a bank's code runs past its 8 KB (to ${range}): move a file to a bank of its own`,
        )
      }
      throw new KitError(`code at ${range}, outside RAM's 2000-6FFF`)
    }
    end = Math.max(end, last)
  }
  const image = new Uint8Array(end - KIT_IMAGE_AT)
  for (const c of ram) image.set(c.bytes, c.address - KIT_IMAGE_AT)
  return image
}
