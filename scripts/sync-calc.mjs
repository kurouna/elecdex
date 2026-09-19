/**
 * Replaces src/shared/calc/vendor with a fresh copy of elecxzy's src/utils/calc.
 *
 *   node scripts/sync-calc.mjs ../elecxzy-dev
 *
 * The copy is verbatim - that is the whole point of the arrangement (see
 * vendor/README.md). Anything elecdex needs differently belongs in the wrapper
 * beside the folder, so this script only copies, records where the copy came
 * from, and leaves the verdict to `npm run verify`.
 */

import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const VENDOR = path.join(HERE, '..', 'src', 'shared', 'calc', 'vendor')

/**
 * Files this repository owns, which a sync must not wipe, and files the copy
 * leaves behind. `index.docs.test.ts` reads elecxzy's own directory layout off
 * disk; tests/unit/calc-wrapper.test.ts keeps its rule here instead.
 */
const KEEP = new Set(['README.md', 'SOURCE.json'])
const SKIP = new Set(['index.docs.test.ts'])

const source = process.argv[2]
if (!source) {
  console.error('usage: node scripts/sync-calc.mjs <path to an elecxzy checkout>')
  process.exit(2)
}

const from = path.resolve(source, 'src', 'utils', 'calc')
if (!existsSync(from)) {
  console.error(`not an elecxzy checkout: ${from} does not exist`)
  process.exit(2)
}

/** The commit the copy is taken at, when the source is a git checkout. */
function commitOf(repo) {
  try {
    return execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function versionOf(repo) {
  try {
    const pkg = JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf8'))
    return typeof pkg.version === 'string' ? pkg.version : null
  } catch {
    return null
  }
}

mkdirSync(VENDOR, { recursive: true })
for (const name of readdirSync(VENDOR)) {
  if (!KEEP.has(name)) rmSync(path.join(VENDOR, name), { recursive: true, force: true })
}

const copied = []
for (const name of readdirSync(from)) {
  if (SKIP.has(name) || !name.endsWith('.ts')) continue
  copyFileSync(path.join(from, name), path.join(VENDOR, name))
  copied.push(name)
}

const licence = path.resolve(source, 'LICENSE')
if (existsSync(licence)) copyFileSync(licence, path.join(VENDOR, 'LICENSE.md'))

const repo = path.resolve(source)
writeFileSync(
  path.join(VENDOR, 'SOURCE.json'),
  `${JSON.stringify(
    {
      project: 'elecxzy',
      repository: 'https://github.com/kurouna/elecxzy',
      path: 'src/utils/calc',
      version: versionOf(repo),
      commit: commitOf(repo),
      copiedAt: new Date().toISOString().slice(0, 10),
      license: 'MIT',
      omitted: [...SKIP],
    },
    null,
    2,
  )}\n`,
)

console.log(`copied ${copied.length} files from ${from}`)
console.log('now run: npm run verify')
