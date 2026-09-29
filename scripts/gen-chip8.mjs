#!/usr/bin/env node
/**
 * Writes resources/chip8/programs.json, the CHIP-8 pane's bundled library
 * (docs/architecture.md section 5.18):
 *
 *   node scripts/gen-chip8.mjs                     # from what is in resources/chip8
 *   node scripts/gen-chip8.mjs --archive <dir>     # first copy a chip8Archive checkout in
 *
 * Two sources: chip8-test-suite's eight programs (DIAG), in resources/chip8/test-suite with
 * their sources, and chip8Archive's (CC0), copied into resources/chip8/archive with the
 * archive's own programs.json beside them. Each entry keeps its settings the way
 * chip8Archive writes them (Octo's option names, `tickrate`, `fontStyle`), so main reads
 * them through the core's own profiles (shared/chip8-library.ts).
 *
 * Every program is then run for ten seconds of its time, with no key pressed, on the very
 * core the pane runs (shared/chip8, loaded as TypeScript): the frame that shows it best
 * becomes its preview, and the keys it looked at light its keypad in the library.
 */
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'resources', 'chip8')
const archiveDir = path.join(dir, 'archive')

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
const { previewRun } = await shared('chip8/preview.ts')
const { programFromEntry, readCatalog } = await shared('chip8-library.ts')

/** Rewrites a JSON file in the repository's own format, so `npm run verify` passes on it. */
function biomeFormat(file) {
  const biome = path.join(root, 'node_modules', '@biomejs', 'biome', 'bin', 'biome')
  execFileSync(process.execPath, [biome, 'format', '--write', file], { stdio: 'ignore' })
}

/* ---------------- chip8-test-suite ---------------- */

const SUITE = {
  '1-chip8-logo': [
    'CHIP-8 Logo',
    'Draws the CHIP-8 logo with the six simplest instructions: the first check that the screen works.',
  ],
  '2-ibm-logo': ['IBM Logo', 'The classic first program: clear, load, draw and jump.'],
  '3-corax+': [
    'Corax+',
    'Runs every arithmetic, logic and branch instruction and ticks each one off on screen.',
  ],
  '4-flags': ['Flags', 'Checks VF after every carry, borrow and shift, in both orders.'],
  '5-quirks': [
    'Quirks',
    'Finds which quirks the interpreter has, for CHIP-8, SUPER-CHIP or XO-CHIP chosen with keys 1 to 3, and says whether they match. Change them in TUNE.',
  ],
  '6-keypad': [
    'Keypad',
    'Tests the three key instructions, EX9E, EXA1 and FX0A, one key at a time. Choose with keys 1 to 3.',
  ],
  '7-beep': ['Beep', 'Beeps SOS in morse and flashes a speaker; hold B to beep by hand.'],
  '8-scrolling': [
    'Scrolling',
    'Scrolls down, left and right in both resolutions: every arrow should land in its box.',
  ],
}

const suite = () =>
  Object.entries(SUITE).map(([name, [title, description]]) => ({
    id: `diag/${name}`,
    title,
    authors: ['Timendus'],
    platform: name === '8-scrolling' ? 'schip' : 'chip8',
    genre: 'diag',
    description,
    released: '2025',
    tickrate: 1000,
    licence: 'GPL-3.0',
    file: `test-suite/${name}.ch8`,
  }))

/* ---------------- chip8Archive ---------------- */

/** Which tab each of chip8Archive's programs goes under (shared/chip8-library.ts). */
const GENRES = {
  showcase: [
    'octojam1title',
    'octojam2title',
    'octojam3title',
    'octojam4title',
    'octojam5title',
    'octojam6title',
    'octojam7title',
    'octojam8title',
    'octojam9title',
    'octojam10title',
  ],
  music: ['jub8-1', 'jub8-2', 'jub8-3', 'jub8-4', 'jub8-5', 'jub8-6', 'superOctoTrackXO', 'tick'],
  story: [
    'octoachip8story',
    'petdog',
    '8ceattourny_d1',
    '8ceattourny_d2',
    '8ceattourny_d3',
    'DVN8',
    'octorancher',
    'anEveningToDieFor',
    'keshaWasBird',
    'keshaWasBiird',
    'keshaWasNiiinja',
    'redOctober',
    'expedition',
    'gradsim',
    'octoma',
    'businessiscontagious',
  ],
  puzzle: [
    'fuse',
    'chipwar',
    'RPS',
    'ultimatetictactoe',
    'masquer8',
    'civiliz8n',
    'mini-lights-out',
    'mastermind',
    'chipcross',
    'spockpaperscissors',
    'wdl',
    'knumberknower',
    'tombstontipp',
    'sens8tion',
    'blackrainbow',
  ],
  toys: [
    'mondrian',
    'octopaint',
    '1dcell',
    'chipquarium',
    'applejak',
    'bulb',
    'squad',
    'nokiatemplate',
    'pumpkindressup',
    'horseWorldOnline',
    'ordinaryidlegarden',
  ],
  action: [
    'garlicscape',
    'superneatboy',
    'eaty',
    'slipperyslope',
    'caveexplorer',
    'sweetcopter',
    'wonkypong',
    'outlaw',
    'tank',
    'rockto',
    'flightrunner',
    'turnover77',
    't8nks',
    'sub8',
    'octopeg',
    'carbon8',
    'BadKaiJuJu',
    'piper',
    'supersquare',
    'skyward',
    'horseyJump',
    'ghostEscape',
    'flutterby',
    'br8kout',
    'sk8',
    'snake',
    'spacejam',
    'spaceracer',
    'down8',
    'trucksimul8or',
    'danm8ku',
    'binding',
    'knight',
    'glitchGhost',
    'octovore',
    'OctoPartyMix',
    'chickenScratch',
    'dodge',
    'snek',
    'octogon',
    'superpong',
    'dinorun',
    'mato8',
    'mrworm',
  ],
}
const genreOf = new Map(
  Object.entries(GENRES).flatMap(([genre, ids]) => ids.map((id) => [id, genre])),
)

/** The CSS colour names chip8Archive uses, and Octo's own colours for what a program leaves out. */
const NAMED = {
  aquamarine: '#7fffd4',
  black: '#000000',
  coral: '#ff7f50',
  deeppink: '#ff1493',
  gray: '#808080',
  hotpink: '#ff69b4',
  lavender: '#e6e6fa',
  lightcyan: '#e0ffff',
  lightgray: '#d3d3d3',
  navy: '#000080',
  powderblue: '#b0e0e6',
  red: '#ff0000',
  white: '#ffffff',
}
const OCTO = {
  backgroundColor: '#996600',
  fillColor: '#ffcc00',
  fillColor2: '#ff6600',
  blendColor: '#662200',
  buzzColor: '#ffaa00',
}

/** A colour as #rrggbb, from a name, #rgb, #rrggbb or rrggbb; null for anything else. */
function colour(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (NAMED[v]) return NAMED[v]
  const bare = v.replace(/^#/, '')
  if (/^[0-9a-f]{6}$/.test(bare)) return `#${bare}`
  if (/^[0-9a-f]{3}$/.test(bare)) return `#${[...bare].map((c) => c + c).join('')}`
  return null
}

function colours(options) {
  if (
    !['backgroundColor', 'fillColor', 'fillColor2', 'blendColor'].some(
      (k) => options[k] !== undefined,
    )
  )
    return undefined
  const pick = (key) => colour(options[key]) ?? OCTO[key]
  return {
    ground: pick('backgroundColor'),
    plane1: pick('fillColor'),
    plane2: pick('fillColor2'),
    both: pick('blendColor'),
    buzz: pick('buzzColor'),
  }
}

const FLAGS = [
  'shiftQuirks',
  'loadStoreQuirks',
  'vfOrderQuirks',
  'clipQuirks',
  'jumpQuirks',
  'vBlankQuirks',
  'logicQuirks',
]

function archiveEntry(id, program) {
  const options = program.options ?? {}
  const octo = Object.fromEntries(
    FLAGS.filter((flag) => typeof options[flag] === 'boolean').map((flag) => [flag, options[flag]]),
  )
  const tickrate = Math.round(Number(options.tickrate))
  const genre = genreOf.get(id)
  if (genre === undefined) throw new Error(`${id} has no genre in GENRES`)
  return {
    id: `archive/${id}`,
    title: String(program.title).trim().slice(0, 80),
    authors: (program.authors ?? [])
      .map((a) => String(a).trim())
      .filter(Boolean)
      .slice(0, 8),
    platform: program.platform,
    genre,
    description: String(program.desc ?? '')
      .trim()
      .slice(0, 600),
    ...(program.event ? { event: String(program.event).slice(0, 60) } : {}),
    ...(program.release ? { released: String(program.release) } : {}),
    ...(Number.isFinite(tickrate) && tickrate >= 1 ? { tickrate: Math.min(10000, tickrate) } : {}),
    ...(Object.keys(octo).length > 0 ? { octo } : {}),
    ...(options.fontStyle === 'octo' || options.fontStyle === 'fish' || options.fontStyle === 'vip'
      ? { fontStyle: options.fontStyle }
      : {}),
    ...(options.screenRotation ? { screenRotation: options.screenRotation } : {}),
    ...(colours(options) ? { colours: colours(options) } : {}),
    licence: 'CC0-1.0',
    file: `archive/${id}.ch8`,
  }
}

/** Copies a chip8Archive checkout's roms and list into resources/chip8/archive. */
function copyArchive(from) {
  const list = path.join(from, 'programs.json')
  if (!existsSync(list))
    throw new Error(`${from} is not a chip8Archive checkout (no programs.json)`)
  mkdirSync(archiveDir, { recursive: true })
  const programs = JSON.parse(readFileSync(list, 'utf8'))
  for (const id of Object.keys(programs))
    copyFileSync(path.join(from, 'roms', `${id}.ch8`), path.join(archiveDir, `${id}.ch8`))
  const source = path.join(archiveDir, 'source.json')
  writeFileSync(source, `${JSON.stringify(programs, null, 2)}\n`)
  biomeFormat(source)
  let commit = 'unknown'
  try {
    commit = execFileSync('git', ['-C', from, 'log', '-1', '--format=%H (%cs)'], {
      encoding: 'utf8',
    }).trim()
  } catch {}
  writeFileSync(
    path.join(archiveDir, 'README.md'),
    `# chip8Archive\n\nThe CHIP-8 pane's library, from https://github.com/JohnEarnest/chip8Archive, commit\n${commit}: every \`.ch8\` in its \`roms/\`, and its \`programs.json\` as \`source.json\`.\n\nEverything in chip8Archive is placed under Creative Commons 0 (CC0 1.0), "No Rights\nReserved": https://creativecommons.org/publicdomain/zero/1.0/ - the authors are named in\n\`source.json\` and in the pane beside each program.\n\nUpdate with \`node scripts/gen-chip8.mjs --archive <a newer checkout>\`.\n`,
  )
}

function archive() {
  const source = path.join(archiveDir, 'source.json')
  if (!existsSync(source)) return []
  const programs = JSON.parse(readFileSync(source, 'utf8'))
  return Object.entries(programs).map(([id, program]) => archiveEntry(id, program))
}

/* ---------------- the list ---------------- */

const at = process.argv.indexOf('--archive')
if (at >= 0) copyArchive(path.resolve(process.argv[at + 1] ?? ''))

const drafts = [...archive(), ...suite()]
for (const draft of drafts) {
  const file = path.join(dir, draft.file)
  if (!existsSync(file) || statSync(file).size === 0) throw new Error(`missing ${draft.file}`)
}

// Checked by the same reader main uses, then previewed on the machine the pane runs.
const { entries, dropped } = readCatalog({ version: 1, programs: drafts })
if (dropped.length > 0) throw new Error(`entries that do not parse: ${dropped.join(', ')}`)
const programs = entries.map((entry) => {
  const program = programFromEntry(entry)
  const bytes = new Uint8Array(readFileSync(path.join(dir, entry.file)))
  const { preview, sensed } = previewRun(bytes, {
    platform: program.platform,
    quirks: program.quirks,
    ipf: program.ipf,
    font: program.font,
  })
  return { ...entry, ...(preview !== null ? { preview } : {}), keys: sensed }
})

const unused = (
  existsSync(archiveDir) ? readdirSync(archiveDir, { withFileTypes: true }) : []
).filter((f) => f.name.endsWith('.ch8') && !programs.some((p) => p.file === `archive/${f.name}`))
if (unused.length > 0)
  console.warn(`gen-chip8: not listed: ${unused.map((f) => f.name).join(', ')}`)

const out = path.join(dir, 'programs.json')
writeFileSync(out, `${JSON.stringify({ version: 1, programs }, null, 2)}\n`)
biomeFormat(out)
const shown = programs.filter((p) => p.preview !== undefined).length
console.log(
  `gen-chip8: ${programs.length} programs (${shown} with a preview) -> ${path.relative(root, out)}`,
)
