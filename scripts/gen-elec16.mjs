#!/usr/bin/env node
/**
 * Builds the ELEC-16's ROM from its E16 assembly (resources/elec16/rom, docs/elec16.md
 * section 6) with the pane's own assembler, and writes what the page loads:
 * src/renderer/widgets/elec16/rom.json, the image in base64 and the global labels. A unit
 * test (elec16-rom-file.test.ts) holds the file to what the sources build, so run this after
 * changing a source, the font, the keys or the assembler.
 *
 *   npm run gen:elec16
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sources = path.join(root, 'resources', 'elec16', 'rom')
const target = path.join(root, 'src', 'renderer', 'widgets', 'elec16', 'rom.json')

// The core imports its neighbours as './x.js', as TypeScript's own output would name them;
// here they are the .ts files themselves, which Node runs with their types stripped.
registerHooks({
  resolve(specifier, context, next) {
    const parent = context.parentURL ?? ''
    if (specifier.startsWith('.') && specifier.endsWith('.js') && parent.includes('/src/shared/')) {
      const ts = new URL(specifier.replace(/\.js$/, '.ts'), parent)
      if (existsSync(fileURLToPath(ts))) return next(ts.href, context)
    }
    return next(specifier, context)
  },
})
const shared = (file) => import(pathToFileURL(path.join(root, 'src', 'shared', file)).href)
const { buildRom, romFile } = await shared('elec16/rom.ts')

const read = (name) => {
  const file = path.join(sources, name)
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}
const built = buildRom(read)
if (built.errors.length > 0) {
  for (const e of built.errors) console.error(`${e.file}:${e.line}: ${e.message}`)
  process.exit(1)
}
writeFileSync(target, `${JSON.stringify(romFile(built), null, 2)}\n`)
const used = built.symbols.rom_end ?? 0
console.log(
  `rom.json: ${built.image.length} bytes, ${Object.keys(built.symbols).length} labels, code and tables to ${used.toString(16)}`,
)
