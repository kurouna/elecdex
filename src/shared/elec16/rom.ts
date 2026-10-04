/**
 * Builds the ELEC-16's ROM from its E16 assembly (resources/elec16/rom, docs/elec16.md
 * section 6). The tables the ROM shares with the page are made here from their one source
 * and given to it as include files: the font (font.ts), the key table (keys.ts) and the I/O
 * addresses (bus.ts). `npm run gen:elec16` writes the result for the page; a unit test holds
 * that result to what the sources build.
 */

import { fromBase64, toBase64 } from '../emu/base64.js'
import { type AsmError, assemble, romImage } from './asm.js'
import { REG } from './bus.js'
import { fontTable } from './font.js'
import { CONTROL, kanaTable, keyTable } from './keys.js'
import { LINK_CMD, LINK_REG, LINK_STATUS } from './link-services.js'
import { CODE_AREA, CODE_AREA_END, ROM_FIXED_SIZE, VRAM } from './map.js'
import { ANNUNCIATORS, IRQ, KEY_ROWS } from './state.js'

/** The file the ROM starts from. */
export const ROM_ENTRY = 'main.s'

/** Bytes as `.byte` lines of sixteen. */
function byteLines(bytes: Uint8Array): string {
  const lines: string[] = []
  for (let at = 0; at < bytes.length; at += 16) {
    const row = Array.from(
      bytes.subarray(at, at + 16),
      (b) => `0x${b.toString(16).padStart(2, '0')}`,
    )
    lines.push(`  .byte ${row.join(', ')}`)
  }
  return lines.join('\n')
}

const upper = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()

/** The I/O registers, the key characters, the annunciator bits and the memory map. */
function ioInclude(): string {
  const lines = ['; Made by src/shared/elec16/rom.ts: do not edit.']
  // As offsets below 0x10000, so `lw t0, IO_KEY_COUNT(zero)` reaches the register in one
  // instruction (an offset is 14 bits, signed), and `li` still gives the address.
  for (const [name, address] of Object.entries(REG)) {
    lines.push(`IO_${upper(name)} = -0x${(0x10000 - address).toString(16)}`)
  }
  for (const [name, address] of Object.entries(LINK_REG)) {
    lines.push(`IO_LINK_${upper(name)} = -0x${(0x10000 - address).toString(16)}`)
  }
  for (const [name, value] of Object.entries(LINK_CMD)) lines.push(`LINK_${upper(name)} = ${value}`)
  for (const [name, value] of Object.entries(LINK_STATUS)) {
    lines.push(`LINK_ST_${upper(name)} = ${value}`)
  }
  for (const [name, char] of Object.entries(CONTROL))
    lines.push(`K_${upper(name)} = 0x${char.toString(16)}`)
  ANNUNCIATORS.forEach((name, bit) => {
    lines.push(`ANN_${name} = 0x${(1 << bit).toString(16)}`)
  })
  for (const [name, line] of Object.entries(IRQ)) lines.push(`IRQ_${upper(name)} = ${line}`)
  lines.push(`KEY_CODES = ${KEY_ROWS * 8}`)
  lines.push(`CODE_AREA = 0x${CODE_AREA.toString(16)}`)
  lines.push(`CODE_AREA_END = 0x${CODE_AREA_END.toString(16)}`)
  lines.push(`VRAM = 0x${VRAM.toString(16)}`)
  return lines.join('\n')
}

/** The include files made from TypeScript, by name. */
export function generatedIncludes(): Record<string, string> {
  return {
    'io.inc': ioInclude(),
    'font.inc': `; Made by src/shared/elec16/rom.ts from font.ts: do not edit.\n${byteLines(fontTable())}`,
    'keys.inc': `; Made by src/shared/elec16/rom.ts from keys.ts: do not edit.\n${byteLines(keyTable(KEY_ROWS * 8))}`,
    'kana.inc': `; Made by src/shared/elec16/rom.ts from keys.ts: do not edit.\n${byteLines(kanaTable(KEY_ROWS * 8))}`,
  }
}

export interface BuiltRom {
  image: Uint8Array
  /** Global labels and their addresses, for CORE and MEM to name what they show. */
  symbols: Record<string, number>
  errors: AsmError[]
}

/** The ROM as the page loads it (rom.json): the image in base64, and the labels. */
export interface RomFile {
  image: string
  symbols: Record<string, number>
}

export function romFile(rom: BuiltRom): RomFile {
  return { image: toBase64(rom.image), symbols: rom.symbols }
}

/** The ROM image from its file, or null when it is not one (the fixed 16 KB at least). */
export function romFromFile(file: RomFile): Uint8Array | null {
  const image = fromBase64(file.image)
  return image !== null && image.length >= ROM_FIXED_SIZE ? image : null
}

/**
 * Assembles the ROM. `read` gives the text of a source file by name (main.s and what it
 * includes), or null; the generated includes come first, so a source file cannot stand in
 * for one.
 */
export function buildRom(read: (name: string) => string | null): BuiltRom {
  const generated = generatedIncludes()
  const include = (name: string) => generated[name] ?? read(name)
  const source = read(ROM_ENTRY)
  if (source === null) {
    return {
      image: new Uint8Array(),
      symbols: {},
      errors: [{ file: ROM_ENTRY, line: 0, message: 'no ROM source' }],
    }
  }
  const out = assemble(source, { include, file: ROM_ENTRY })
  if (out.errors.length > 0) return { image: new Uint8Array(), symbols: {}, errors: out.errors }
  const symbols: Record<string, number> = {}
  // Global labels only - the hand-written ROM's and BASIC's functions (camelCase, e16c) -
  // not local ones (`loop.next`), constants (upper case) or e16c's strings (`str_12`).
  for (const [name, value] of out.symbols) {
    if (/^[a-z_][A-Za-z0-9_]*$/.test(name) && !/^str_\d+$/.test(name)) symbols[name] = value
  }
  return { image: romImage(out), symbols, errors: [] }
}
