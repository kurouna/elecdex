import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * The page's bundle, as built into out/: minified. The page parses and compiles
 * all of it at every start, with every pane in it, so its size is start-up
 * time (architecture.md §16 has the numbers).
 */

const ASSETS = path.join(process.cwd(), 'out', 'renderer', 'assets')

test('the page is built minified', () => {
  const entry = readdirSync(ASSETS).find((name) => /^index-.*\.js$/.test(name))
  expect(entry).toBeDefined()
  const code = readFileSync(path.join(ASSETS, entry ?? ''), 'utf8')
  const lines = code.split('\n').length
  // Unminified it was 3.4 MB on 77,800 lines; minified, 2.0 MB on 4,400 (template strings keep theirs).
  expect(lines).toBeLessThan(10_000)
  expect(code.length).toBeLessThan(2_500_000)
  // The licence notices the bundle keeps are kept at its end, not minified away.
  expect(code).toContain('@license')
  // No helper injected into functions (keepNames): the plugin worker is built from
  // stripGlobals' and pluginRuntime's source text, which must not call outside themselves.
  expect(code).not.toContain('__name(')
})

test('the third-party notices list every package the builds bundled, with its licence', () => {
  const out = path.join(process.cwd(), 'out')
  const notices = readFileSync(path.join(out, 'THIRD_PARTY_NOTICES.txt'), 'utf8')
  const bundledDir = path.join(out, '.notices')
  const roots = readdirSync(bundledDir).flatMap(
    (file) => JSON.parse(readFileSync(path.join(bundledDir, file), 'utf8')) as string[],
  )
  expect(roots.length).toBeGreaterThan(20)
  for (const root of roots) {
    const { name, version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    expect(notices, `${name}@${version}`).toContain(`${name}@${version}`)
  }
  // The page's own, the main process's own, and what ships as it is in app.asar.
  for (const name of ['svelte@', 'three@', '@xterm/xterm@', 'yahoo-finance2@', 'node-pty@']) {
    expect(notices).toContain(name)
  }
  // The data the app is made from, with the credits their licences ask for.
  expect(notices).toContain('GeoNames')
  expect(notices).toContain('© OpenStreetMap contributors')
  expect(notices).toContain('www.nro.net')
  expect(notices).toContain('elecxzy')
})
