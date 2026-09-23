import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Packages main loads only when a pane first needs them, never at start: each
 * costs start-up time before the window can open (yahoo-finance2 alone took
 * ~70 ms to load), and most sessions never use them. A static import in a
 * module main loads at start would load it with the app; `import type` and
 * `await import()` do not, and neither does a static import in a module that
 * is itself only ever loaded with `import()` (the AI adapter, the feed parser).
 */

const LAZY = ['yahoo-finance2', '@anthropic-ai/sdk', 'fast-xml-parser']

const root = path.resolve(__dirname, '..', '..')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return files(full)
    return name.endsWith('.ts') ? [full] : []
  })
}

/** A static, value import of a module whose specifier matches `spec` (a regex source). */
const staticImport = (spec: string): RegExp =>
  // No quote before `from`: the match stays within one statement (the code has no semicolons).
  new RegExp(`^import\\s+(?!type\\b)[^'"]*?from\\s+['"]${spec}['"]`, 'm')

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/@-]/g, '\\$&')

describe("main's start", () => {
  it('loads the heavy, single-pane packages only when first used', () => {
    const sources = [
      ...files(path.join(root, 'src/main')),
      ...files(path.join(root, 'src/services')),
    ]
    const text = new Map(sources.map((file) => [file, readFileSync(file, 'utf8')]))
    const eager: string[] = []
    for (const [file, code] of text) {
      for (const name of LAZY) {
        if (!staticImport(escaped(name)).test(code)) continue
        // The module holding the import must itself be loaded only through import().
        const module = `[^'"]*/${escaped(path.basename(file, '.ts'))}\\.js`
        const importers = sources.filter(
          (other) => other !== file && staticImport(module).test(text.get(other) ?? ''),
        )
        const loadedLazily = sources.some((other) =>
          new RegExp(`import\\(\\s*['"]${module}['"]`).test(text.get(other) ?? ''),
        )
        if (importers.length > 0 || !loadedLazily)
          eager.push(`${path.relative(root, file)}: ${name}`)
      }
    }
    expect(eager).toEqual([])
  })
})
