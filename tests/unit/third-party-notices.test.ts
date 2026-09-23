import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DATA_SOURCES,
  packageRootOf,
  readPackage,
  renderNotices,
  withBorrowedTexts,
} from '../../scripts/third-party-notices.mjs'

/**
 * The third-party notices shipped with the app (THIRD_PARTY_NOTICES.txt): which
 * package a bundled module belongs to, what is read from a package, and what
 * the file says. The built file itself is checked in tests/e2e/bundle.spec.ts.
 */

const root = path.resolve(__dirname, '..', '..')
const nm = (...parts: string[]) => path.join(root, 'node_modules', ...parts)

describe('the third-party notices', () => {
  it('finds the package a bundled module is in, scoped or nested, and nothing for our own code', () => {
    expect(packageRootOf(nm('svelte', 'src', 'internal', 'client', 'index.js'))).toBe(nm('svelte'))
    expect(packageRootOf(nm('@xterm', 'xterm', 'lib', 'xterm.mjs'))).toBe(nm('@xterm', 'xterm'))
    // A module id with a query, as CSS and assets arrive.
    expect(packageRootOf(`${nm('@fontsource', 'chakra-petch', 'index.css')}?used`)).toBe(
      nm('@fontsource', 'chakra-petch'),
    )
    expect(packageRootOf(nm('sucrase', 'node_modules', 'commander', 'index.js'))).toBe(
      nm('sucrase', 'node_modules', 'commander'),
    )
    expect(packageRootOf(path.join(root, 'src', 'renderer', 'main.ts'))).toBeNull()
    expect(packageRootOf('\0virtual:svelte')).toBeNull()
  })

  it('reads a package its name, version, licence and the licence text it carries', () => {
    const svelte = readPackage(nm('svelte'))
    expect(svelte.name).toBe('svelte')
    expect(svelte.license).toBe('MIT')
    expect(svelte.texts.map((t) => t.file)).toContain('LICENSE.md')
    expect(svelte.texts[0]?.text).toMatch(/Permission is hereby granted/)
  })

  it('gives a package without a licence file the text of its repository, or the MIT terms', () => {
    // @xterm/headless ships no LICENSE, but comes from the same repository as @xterm/xterm.
    const text = renderNotices(
      withBorrowedTexts([
        readPackage(nm('@xterm', 'headless')),
        readPackage(nm('@xterm', 'xterm')),
      ]),
    )
    const headless = text.slice(text.indexOf('@xterm/headless@'), text.indexOf('@xterm/xterm@'))
    expect(headless).toMatch(/from @xterm\/xterm/)
    expect(headless).toMatch(/Copyright/)
    // One with nothing to borrow names its author and points to the MIT terms at the end.
    const alone = renderNotices(withBorrowedTexts([readPackage(nm('standardwebhooks'))]))
    expect(alone).toMatch(/Author: Standard Webhooks/)
    expect(alone).toMatch(/The MIT License[\s\S]*Permission is hereby granted/)
  })

  it('writes every package with its text, in order, and every data source', () => {
    const text = renderNotices([readPackage(nm('zod')), readPackage(nm('svelte'))])
    expect(text.indexOf('svelte@')).toBeLessThan(text.indexOf('zod@'))
    expect(text).toMatch(/Permission is hereby granted/)
    for (const source of DATA_SOURCES) expect(text).toContain(source.name)
  })
})
