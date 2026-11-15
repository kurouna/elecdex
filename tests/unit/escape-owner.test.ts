import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every widget with an Escape of its own says so (lib/escape-owner.ts): the workspace's Escape
 * (putting a forward pane back) and a popup's (closing it) run first, in the capture phase on
 * the window, and took the key from the RSS article, the AI chat's composer, TERMINAL search,
 * TRANSLATE's language picker and the snippet editor (found in review, 2026-11-15). A widget
 * file that handles Escape must mark the element whose Escape it is with `data-owns-escape`,
 * or be listed below with why it needs none.
 */

const WIDGETS = path.resolve(import.meta.dirname, '../../src/renderer/widgets')

/** Widgets whose Escape needs no mark, and why. */
const NO_MARK: Record<string, string> = {}

function svelteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return svelteFiles(full)
    return entry.name.endsWith('.svelte') ? [full] : []
  })
}

/**
 * An Escape handled: a comparison of the key, a map of keys to what they do (`Escape: () =>`),
 * or a switch. The map was missed at first, and with it the image viewer (found in review).
 */
const HANDLES_ESCAPE = /key\s*[!=]==\s*'Escape'|\bEscape\s*:\s*\(|case\s+'Escape'/

describe('widgets with an Escape of their own', () => {
  const files = svelteFiles(WIDGETS)
    .filter((file) => HANDLES_ESCAPE.test(readFileSync(file, 'utf8')))
    .map((file) => path.relative(WIDGETS, file).replaceAll('\\', '/'))

  it('are found (the scan is not empty)', () => {
    expect(files.length).toBeGreaterThan(15)
  })

  it.each(files)('%s marks what its Escape is for', (file) => {
    if (NO_MARK[file] !== undefined) return
    const text = readFileSync(path.join(WIDGETS, file), 'utf8')
    expect(text, `${file} handles Escape but marks no element data-owns-escape`).toMatch(
      /data-owns-escape/,
    )
  })
})
