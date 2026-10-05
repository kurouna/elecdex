import { type AsmError, type AsmResult, assemble } from './asm.js'
import {
  CART_HEADER,
  CART_ID,
  CART_MAX_BANKS,
  CART_MAX_SAVE_BANKS,
  CART_NAME_LENGTH,
  type CartHeader,
  makeCart,
  readCart,
} from './cartridge.js'
import { BANK_SIZE, BANK_WINDOW } from './map.js'
import { generatedIncludes } from './rom.js'

/**
 * Builds a cartridge (docs/elec16-play.md section 7) from E16 assembly: what `.bank n` puts
 * at C000-DFFF is ROM bank n of the cartridge (bank 0x100 + n of the machine's window). The
 * ROM's include files (io.inc and the rest) are there for it, as for the ROM, and the game's
 * own beside it (`read`). `npm run
 * gen:elec16` builds the bundled games with it; a test holds games.json to what it builds.
 */

export interface GameMeta {
  id: string
  name: string
  saveBanks: number
  about: string
}

/**
 * What is wrong with a game's id, name or save RAM for a header readCart takes (the kit's
 * builder asks too); null when nothing is.
 */
export function metaProblem(meta: GameMeta): string | null {
  if (!CART_ID.test(meta.id)) return `the id "${meta.id}" is not 1 to 16 of A-Z, 0-9 and -`
  if (meta.name.length > CART_NAME_LENGTH || !/^[\x20-\x7e]*$/.test(meta.name)) {
    return `the name "${meta.name}" is not up to ${CART_NAME_LENGTH} printable ASCII characters`
  }
  const save = meta.saveBanks
  if (!Number.isInteger(save) || save < 0 || save > CART_MAX_SAVE_BANKS) {
    return `saveBanks ${save} is not 0 to ${CART_MAX_SAVE_BANKS} banks of save RAM`
  }
  return null
}

/**
 * What is wrong with the entry: the machine jumps there with bank 0 in the window, so it is an
 * even address in C000-DFFF.
 */
export function entryProblem(entry: number): string | null {
  if (entry >= BANK_WINDOW && entry < BANK_WINDOW + BANK_SIZE && (entry & 1) === 0) return null
  return `start is at 0x${entry.toString(16)}, not an even address in the bank C000-DFFF`
}

/** The banks a program fills, as one block; every byte must be in a bank's window. */
function banksOf(out: AsmResult): Uint8Array {
  let banks = 1
  for (const c of out.chunks) {
    if (c.bank === null)
      throw new RangeError('a cartridge has only banks: put each part after .bank n')
    const end = c.address + c.bytes.length
    if (c.address < BANK_WINDOW || end > BANK_WINDOW + BANK_SIZE) {
      const range = `0x${c.address.toString(16)}-0x${end.toString(16)}`
      throw new RangeError(`bank ${c.bank} has bytes at ${range}, outside the bank C000-DFFF`)
    }
    banks = Math.max(banks, c.bank + 1)
  }
  if (banks > CART_MAX_BANKS) throw new RangeError(`${banks} banks is more than a cartridge has`)
  const rom = new Uint8Array(banks * BANK_SIZE).fill(0xff)
  for (const c of out.chunks)
    rom.set(c.bytes, (c.bank ?? 0) * BANK_SIZE + (c.address - BANK_WINDOW))
  return rom
}

/** The game's image, or what is wrong with it. The entry is the label `start`. */
export function buildGame(
  source: string,
  meta: GameMeta,
  read: (name: string) => string | null = () => null,
): { image: Uint8Array } | { errors: AsmError[] } {
  const problem = (message: string) => ({ errors: [{ file: `${meta.id}.s`, line: 0, message }] })
  const bad = metaProblem(meta)
  if (bad !== null) return problem(bad)
  const generated = generatedIncludes()
  const out = assemble(source, {
    include: (name) => generated[name] ?? read(name),
    file: `${meta.id}.s`,
  })
  if (out.errors.length > 0) return { errors: out.errors }
  const entry = out.symbols.get('start')
  if (entry === undefined) return problem('no start label')
  const wrongEntry = entryProblem(entry)
  if (wrongEntry !== null) return problem(wrongEntry)
  let rom: Uint8Array
  try {
    rom = banksOf(out)
  } catch (e) {
    return problem(e instanceof Error ? e.message : String(e))
  }
  const header: CartHeader = {
    banks: rom.length / BANK_SIZE,
    saveBanks: meta.saveBanks,
    entry,
    id: meta.id,
    name: meta.name,
  }
  const image = makeCart(header, rom)
  if (image.length !== CART_HEADER + rom.length) return problem('the image is not whole')
  // The last word is the reader's: what it refuses is no cartridge, whatever was checked above.
  return readCart(image) === null
    ? problem('the image is not a cartridge PLAY-320 takes')
    : { image }
}
