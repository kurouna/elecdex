#!/usr/bin/env node
/**
 * Builds the ELEC-16's ROM (resources/elec16/rom, docs/elec16.md section 6): BASIC compiled
 * from its TypeScript by e16c into basic.s, then everything assembled with the pane's own
 * assembler, and writes what the page loads:
 * src/renderer/widgets/elec16/rom.json, the image in base64 and the global labels. A unit
 * test (elec16-tables.test.ts) holds the file to what the sources build, so run this after
 * changing a source, the font, the keys or the assembler.
 *
 *   npm run gen:elec16
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
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
const { compileBasic } = await shared('e16c/basic-rom.ts')

// BASIC first: e16c compiles its TypeScript into basic.s, which the ROM includes.
const basic = compileBasic((name) => readFileSync(path.join(sources, 'basic', name), 'utf8'))
if (basic.errors.length > 0) {
  for (const e of basic.errors) console.error(`${e.file}:${e.line}:${e.column}: ${e.message}`)
  process.exit(1)
}
writeFileSync(path.join(sources, 'basic.s'), basic.asm)

const read = (name) => {
  const file = path.join(sources, name)
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}
// The SOFT CARD: the bundled programs, as main reads them (soft.json).
const { buildSoftCard } = await shared('elec16/soft-card.ts')
const { toBase64 } = await shared('emu/base64.ts')
const softDir = path.join(root, 'resources', 'elec16', 'soft')
const soft = buildSoftCard(
  readdirSync(softDir)
    .filter((name) => /\.(bas|asm)$/i.test(name))
    .map((name) => {
      const help = path.join(softDir, name.replace(/\.\w+$/, '.help'))
      return {
        name,
        text: readFileSync(path.join(softDir, name), 'utf8'),
        help: existsSync(help) ? readFileSync(help, 'utf8') : '',
      }
    }),
)
if (soft.errors.length > 0) {
  for (const e of soft.errors) console.error(e)
  process.exit(1)
}
const softFile = {
  files: soft.files.map((f) => ({
    name: f.name,
    about: f.about,
    help: f.help,
    data: toBase64(f.data),
  })),
}
writeFileSync(
  path.join(root, 'resources', 'elec16', 'soft.json'),
  `${JSON.stringify(softFile, null, 2)}\n`,
)

const built = buildRom(read)
if (built.errors.length > 0) {
  for (const e of built.errors) console.error(`${e.file}:${e.line}: ${e.message}`)
  process.exit(1)
}
writeFileSync(target, `${JSON.stringify(romFile(built), null, 2)}\n`)
// The fixed ROM ends where BASIC's fixed part does, once it has banked parts.
const used = built.symbols.e16c_fixed_end ?? built.symbols.rom_end ?? 0
console.log(
  `rom.json: ${built.image.length} bytes, ${Object.keys(built.symbols).length} labels, fixed ROM to ${used.toString(16)}`,
)

// The PLAY ROM for PLAY-320 (resources/elec16/play, docs/elec16-play.md): its screen from
// e16c into play.s, then assembled the same way, into play-rom.json.
const { compilePlay } = await shared('e16c/play-rom.ts')
const playSources = path.join(root, 'resources', 'elec16', 'play')
const play = compilePlay((name) => readFileSync(path.join(playSources, name), 'utf8'))
if (play.errors.length > 0) {
  for (const e of play.errors) console.error(`${e.file}:${e.line}:${e.column}: ${e.message}`)
  process.exit(1)
}
writeFileSync(path.join(playSources, 'play.s'), play.asm)
const { playRomFile } = await shared('e16c/play-rom.ts')
const playBuilt = buildRom((name) => {
  const file = path.join(root, 'resources', 'elec16', playRomFile(name))
  return existsSync(file) ? readFileSync(file, 'utf8') : null
})
if (playBuilt.errors.length > 0) {
  for (const e of playBuilt.errors) console.error(`play/${e.file}:${e.line}: ${e.message}`)
  process.exit(1)
}
writeFileSync(
  path.join(root, 'src', 'renderer', 'widgets', 'elec16', 'play-rom.json'),
  `${JSON.stringify(romFile(playBuilt), null, 2)}\n`,
)
const playUsed = playBuilt.symbols.e16c_fixed_end ?? playBuilt.symbols.rom_end ?? 0
console.log(`play-rom.json: ${playBuilt.image.length} bytes, fixed ROM to ${playUsed.toString(16)}`)

// ELEC-16 PLAY's bundled games (resources/elec16/games/<name>/game.s and game.json), each built
// into a .E16G for the shelf (main/elec16/games.ts) in games.json.
const { buildGame } = await shared('elec16/cart-build.ts')
const gamesDir = path.join(root, 'resources', 'elec16', 'games')
const bundled = []
for (const name of readdirSync(gamesDir, { withFileTypes: true })) {
  if (!name.isDirectory()) continue
  const at = path.join(gamesDir, name.name)
  const meta = JSON.parse(readFileSync(path.join(at, 'game.json'), 'utf8'))
  const made = buildGame(readFileSync(path.join(at, 'game.s'), 'utf8'), meta)
  if ('errors' in made) {
    for (const e of made.errors)
      console.error(`games/${name.name}/${e.file}:${e.line}: ${e.message}`)
    process.exit(1)
  }
  bundled.push({ data: toBase64(made.image), about: meta.about })
}
writeFileSync(path.join(gamesDir, 'games.json'), `${JSON.stringify({ games: bundled }, null, 2)}\n`)
console.log(`games.json: ${bundled.length} games`)
