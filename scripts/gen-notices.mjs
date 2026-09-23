#!/usr/bin/env node
/**
 * Writes out/THIRD_PARTY_NOTICES.txt after `electron-vite build`: the packages
 * each build bundled (out/.notices/*.json, recorded by the bundledPackages
 * plugin in electron.vite.config.ts), the production dependencies shipped in
 * app.asar, the packages whose data the app's data files were made from, and
 * the vendored calculator. See scripts/third-party-notices.mjs.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BUNDLED_DIR,
  DATA_PACKAGES,
  readPackage,
  renderNotices,
  shippedPackages,
  withBorrowedTexts,
} from './third-party-notices.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bundled = path.join(root, BUNDLED_DIR)

if (!existsSync(bundled)) {
  console.error('gen-notices: out/.notices is missing - run electron-vite build first')
  process.exit(1)
}

const roots = new Set()
for (const file of readdirSync(bundled).filter((name) => name.endsWith('.json'))) {
  for (const dir of JSON.parse(readFileSync(path.join(bundled, file), 'utf8')))
    roots.add(path.resolve(root, dir))
}
for (const dir of shippedPackages(root)) roots.add(dir)
for (const name of DATA_PACKAGES) roots.add(path.join(root, 'node_modules', name))

// One entry per package and version, however many places it was found in.
const seen = new Map()
for (const dir of [...roots].sort()) {
  const pkg = readPackage(dir)
  const key = `${pkg.name}@${pkg.version}`
  if (!seen.has(key)) seen.set(key, pkg)
}

const vendor = path.join(root, 'src', 'shared', 'calc', 'vendor', 'LICENSE.md')
const extra = existsSync(vendor)
  ? [
      {
        title: 'elecxzy calculator (src/shared/calc/vendor)',
        text: readFileSync(vendor, 'utf8').trim(),
      },
    ]
  : []

const out = path.join(root, 'out', 'THIRD_PARTY_NOTICES.txt')
writeFileSync(out, renderNotices(withBorrowedTexts([...seen.values()]), extra))
console.log(`gen-notices: ${seen.size} packages -> ${path.relative(root, out)}`)
