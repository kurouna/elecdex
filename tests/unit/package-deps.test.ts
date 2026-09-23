import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * CLAUDE.md: renderer-only and build-time packages are devDependencies (Vite
 * bundles them into the page), and only what main, the collector or preload
 * load at runtime stays in dependencies - which electron-builder ships whole,
 * a second copy beside the bundle.
 */

const root = path.resolve(__dirname, '..', '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return name === 'vendor' ? [] : files(full)
    return /\.(ts|svelte)$/.test(name) ? [full] : []
  })
}

/** The packages a tree imports, by name (`@scope/name` or `name`). */
function imported(dir: string): Set<string> {
  const found = new Set<string>()
  const pattern = /(?:from|import)\s*\(?\s*['"]([^'".][^'"]*)['"]/g
  for (const file of files(path.join(root, dir))) {
    for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
      const spec = match[1] ?? ''
      if (spec.startsWith('node:') || spec.startsWith('@shared') || spec.startsWith('@calc')) continue
      const parts = spec.split('/')
      found.add(spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : (parts[0] ?? spec))
    }
  }
  return found
}

describe('what the app ships', () => {
  it('keeps packages only the page imports out of dependencies', () => {
    const runtime = new Set([
      ...imported('src/main'),
      ...imported('src/services'),
      ...imported('src/preload'),
    ])
    const pageOnly = [...imported('src/renderer')].filter((name) => !runtime.has(name))
    const shipped = Object.keys(pkg.dependencies ?? {})
    expect(pageOnly.filter((name) => shipped.includes(name))).toEqual([])
  })
})
