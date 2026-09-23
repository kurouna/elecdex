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
})
