import { type AsmError, type AsmResult, assemble } from './asm.js'
import { CART_HEADER, CART_ID, CART_MAX_BANKS, type CartHeader, makeCart } from './cartridge.js'
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

/** The banks a program fills, as one block; every byte must be in a bank's window. */
function banksOf(out: AsmResult): Uint8Array {
  let banks = 1
  for (const c of out.chunks) {
    if (c.bank === null)
      throw new RangeError('a cartridge has only banks: put each part after .bank n')
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
  const generated = generatedIncludes()
  const out = assemble(source, {
    include: (name) => generated[name] ?? read(name),
    file: `${meta.id}.s`,
  })
  if (out.errors.length > 0) return { errors: out.errors }
  const entry = out.symbols.get('start')
  const problem = (message: string) => ({ errors: [{ file: `${meta.id}.s`, line: 0, message }] })
  if (entry === undefined) return problem('no start label')
  if (!CART_ID.test(meta.id) || meta.name.length > 24) return problem('a bad id or name')
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
  return image.length === CART_HEADER + rom.length ? { image } : problem('the image is not whole')
}
