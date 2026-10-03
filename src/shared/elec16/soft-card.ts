/**
 * The SOFT CARD (docs/elec16.md section 6): the programs elecdex brings, on a card of their
 * own that a unit reads but never writes. Made from resources/elec16/soft by
 * `npm run gen:elec16` into soft.json, which main reads; a unit test holds the file to what
 * the sources make. A .bas listing goes on it in the machine's character set (as IMPORT does),
 * an .asm source assembled for the code area as a .BIN. Pure.
 */

import { assemble, ramImage } from './asm.js'
import type { CardFile } from './card.js'
import { cardNameOf, toMachineText } from './charset.js'
import { CODE_AREA } from './map.js'

export interface SoftSource {
  /** The source file's name: hitblow.bas, asmdemo.asm. */
  name: string
  text: string
  /** How to use it, from the .help file beside it: what FILES shows for the program picked. */
  help: string
}

/** The most a program's help may say, in characters. */
export const SOFT_HELP_MAX = 400

/**
 * A file on the SOFT CARD, with its line of what it is for FILES' detail card and how to use
 * it, which FILES shows under the list for the program picked.
 */
export interface SoftFile extends CardFile {
  about: string
  help: string
}

/** What a program says it is: its first line's REM or comment, less its own name. */
export function aboutOf(text: string): string {
  const first = text.split(/\r?\n/).find((line) => line.trim() !== '') ?? ''
  const said = /^\s*(?:\d+\s+REM\s+|;\s*)(.*)$/i.exec(first)?.[1] ?? ''
  return said.replace(/^[^:]*:\s*/, '').trim()
}

/** The card's files, by name, or what is wrong with a source. */
export function buildSoftCard(sources: readonly SoftSource[]): {
  files: SoftFile[]
  errors: string[]
} {
  const files: SoftFile[] = []
  const errors: string[] = []
  for (const source of [...sources].sort((a, b) => a.name.localeCompare(b.name))) {
    const about = aboutOf(source.text)
    const help = source.help.trim()
    if (help === '') errors.push(`${source.name}: no .help beside it says how to use it`)
    if (help.length > SOFT_HELP_MAX)
      errors.push(`${source.name}: its help is over ${SOFT_HELP_MAX}`)
    if (/\.asm$/i.test(source.name)) {
      const out = assemble(`.org 0x${CODE_AREA.toString(16)}\n${source.text}`)
      if (out.errors.length > 0) {
        errors.push(...out.errors.map((e) => `${source.name}:${e.line - 1}: ${e.message}`))
        continue
      }
      const data = ramImage(out, CODE_AREA)
      files.push({ name: cardNameOf(source.name, 'BIN'), data, modified: 0, about, help })
      continue
    }
    const made = toMachineText(source.text)
    if ('problem' in made) {
      errors.push(`${source.name}: ${made.problem}`)
      continue
    }
    const long = source.text.split(/\r?\n/).findIndex((line) => line.length > 78)
    if (long >= 0) errors.push(`${source.name}:${long + 1}: longer than a BASIC line can be (78)`)
    files.push({ name: cardNameOf(source.name, 'BAS'), data: made.bytes, modified: 0, about, help })
  }
  return { files, errors }
}
