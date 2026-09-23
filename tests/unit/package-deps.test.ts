import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * CLAUDE.md: renderer-only and build-time packages are devDependencies (Vite
 * bundles them into the page), and what main, the collector or preload load at
 * runtime stays in dependencies - which electron-builder ships, a second copy
 * beside the bundle. Both ways are checked: a page-only package shipped again,
 * and a runtime package (a native addon, a data file) left out of the app.
 */

const root = path.resolve(__dirname, '..', '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** Runtime packages main reaches without an import: the GeoIP database, found by require.resolve. */
const RESOLVED_AT_RUNTIME = ['@ip-location-db/geo-whois-asn-country-mmdb']
/** Runtime packages bundled into main on purpose, so their own dependencies are not shipped (§16). */
const BUNDLED_INTO_MAIN = ['yahoo-finance2']

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return name === 'vendor' ? [] : files(full)
    return /\.(ts|svelte)$/.test(name) ? [full] : []
  })
}

/**
 * The packages a text loads as values, by name (`@scope/name` or `name`): an import or
 * export from, a side-effect import, a dynamic import and a require. `import type` loads nothing.
 */
function packagesIn(text: string): string[] {
  const pattern =
    /^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]([^'"\s.][^'"\s]*)['"]|^\s*import\s+['"]([^'"\s.][^'"\s]*)['"]|\b(?:import|require)\(\s*['"]([^'"\s.][^'"\s]*)['"]\s*\)/gm
  const found: string[] = []
  for (const match of text.matchAll(pattern)) {
    const spec = match[1] ?? match[2] ?? match[3] ?? ''
    if (/^(node:|@shared|@calc|@renderer|@main)/.test(spec)) continue
    const parts = spec.split('/')
    found.push(spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : (parts[0] ?? spec))
  }
  return found
}

/** The packages a tree loads. */
function imported(dir: string): Set<string> {
  const found = new Set<string>()
  for (const file of files(path.join(root, dir))) {
    for (const name of packagesIn(readFileSync(file, 'utf8'))) found.add(name)
  }
  return found
}

const runtime = new Set([
  ...imported('src/main'),
  ...imported('src/services'),
  ...imported('src/preload'),
  ...imported('src/shared'),
])
const shipped = Object.keys(pkg.dependencies ?? {})

describe('what the app ships', () => {
  it('sees every way a file loads a package', () => {
    const text = [
      "import a from 'pkg-a'",
      "import type { B } from 'pkg-type-only'",
      "import 'pkg-side-effect'",
      "export { c } from '@scope/pkg-c/sub'",
      "const d = await import('pkg-d')",
      "const e = require('pkg-e/deep')",
      "import f from './local'",
      "import g from 'node:fs'",
    ].join('\n')
    expect(packagesIn(text)).toEqual(['pkg-a', 'pkg-side-effect', '@scope/pkg-c', 'pkg-d', 'pkg-e'])
  })

  it('keeps packages only the page imports out of dependencies', () => {
    const pageOnly = [...imported('src/renderer')].filter((name) => !runtime.has(name))
    expect(pageOnly.filter((name) => shipped.includes(name))).toEqual([])
  })

  it('ships every package main, the collector or preload loads at runtime', () => {
    const needed = [...runtime].filter(
      (name) => name !== 'electron' && !BUNDLED_INTO_MAIN.includes(name),
    )
    const bundledOnly = Object.keys(pkg.devDependencies ?? {})
    // A runtime package in devDependencies is bundled at best, and missing at worst (a native addon).
    expect(needed.filter((name) => bundledOnly.includes(name) && !shipped.includes(name))).toEqual(
      [],
    )
    for (const name of RESOLVED_AT_RUNTIME) expect(shipped).toContain(name)
  })

  it('ships nothing that nothing loads', () => {
    expect(
      shipped.filter((name) => !runtime.has(name) && !RESOLVED_AT_RUNTIME.includes(name)),
    ).toEqual([])
  })
})
