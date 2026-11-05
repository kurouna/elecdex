import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BUILTIN_THEMES, themeVariables } from '../../src/shared/theme'

/**
 * A CSS variable a component reads must be one something defines: tokens.css and the other
 * stylesheets, a theme, or a rule of the component's own (`--frame-color: …`). A name that is no
 * token is read as nothing - a background that is not there - and nothing else says so (found in
 * the TRANSLATE pane: its language list read `--panel-raised`, and the text under it showed through).
 */

const root = path.resolve(__dirname, '../../src/renderer')

const files = (dir: string, ext: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full, ext) : full.endsWith(ext) ? [full] : []
  })

const defined = (text: string): string[] =>
  [...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1] ?? '')

/** Defined anywhere in the page: every stylesheet, every theme's variables, every component. */
function everywhere(): Set<string> {
  const names = new Set<string>()
  for (const file of [...files(root, '.css'), ...files(root, '.svelte'), ...files(root, '.ts')]) {
    for (const name of defined(readFileSync(file, 'utf8'))) names.add(name)
  }
  for (const theme of BUILTIN_THEMES)
    for (const name of Object.keys(themeVariables(theme))) names.add(name)
  return names
}

/** Set from script (`style:--x`, `style="--x: …"`, setProperty): defined, though not as a rule. */
const setInMarkup = (text: string): string[] => [
  ...[...text.matchAll(/style:(--[\w-]+)/g)].map((m) => m[1] ?? ''),
  ...[...text.matchAll(/setProperty\(\s*'(--[\w-]+)'/g)].map((m) => m[1] ?? ''),
]

/**
 * Written by name in script, from a prefix: a flight's keyframes (layout/pane-zoom.ts `flipVars`,
 * `--zoom-` for a pane flying to the front, `--land-` for one a move carried).
 */
const BUILT_BY_NAME = ['--zoom-', '--land-'].flatMap((prefix) =>
  ['dx', 'dy', 'sx', 'sy'].map((part) => prefix + part),
)

describe('CSS variables', () => {
  it('reads only variables something defines', () => {
    const known = everywhere()
    for (const name of BUILT_BY_NAME) known.add(name)
    for (const file of files(root, '.svelte'))
      for (const name of setInMarkup(readFileSync(file, 'utf8'))) known.add(name)
    for (const file of files(root, '.ts'))
      for (const name of setInMarkup(readFileSync(file, 'utf8'))) known.add(name)
    const unknown: string[] = []
    for (const file of [...files(root, '.svelte'), ...files(root, '.css')]) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
        const name = match[1] ?? ''
        // A read with a fallback of its own (`var(--x, …)`) is a hook a parent may set.
        if (match[2] === ',' || known.has(name)) continue
        unknown.push(`${path.relative(root, file)}: ${name}`)
      }
    }
    expect([...new Set(unknown)]).toEqual([])
  })
})
