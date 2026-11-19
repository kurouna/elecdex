import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { composing } from '../../src/renderer/lib/ime'

/**
 * The Enter that commits an IME conversion and the Escape that cancels one are the IME's
 * (lib/ime.ts). Found in review (2026-11-19): a TODO line typed in Japanese was added as its
 * conversion was taken, and the same held for the task editor, the launcher, the calculator,
 * the notes' and the shell's search, names and labels across the page - and a popup or a pane
 * brought forward could close on the Escape that only cancelled a conversion in it. A file with
 * a text field whose key handler acts on Enter or Escape asks `composing` first, as do the
 * workspace's and the popup's own Escape, which run before any widget's.
 */

const RENDERER = path.resolve(import.meta.dirname, '../../src/renderer')

function svelteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return svelteFiles(full)
    return entry.name.endsWith('.svelte') ? [full] : []
  })
}

/** Enter or Escape acted on: by key or by code, compared, switched on, or a map of keys. */
const HANDLES =
  /(key|code)\s*[!=]==\s*'(Enter|Escape)'|case\s+'(Enter|Escape)'|\b(Enter|Escape)\s*:\s*\(/
/** A field the IME types into. */
const TEXT_FIELD = /<textarea|<input(?![^>]*type="(checkbox|radio|number|range|color|file)")/

/** Run before any widget's handler, on keys typed anywhere, fields included. */
const CAPTURING = ['layout/Workspace.svelte', 'layout/PopupPane.svelte']

describe('composing', () => {
  const key = (init: KeyboardEventInit & { keyCode?: number }) =>
    ({ isComposing: false, keyCode: 0, ...init }) as unknown as KeyboardEvent
  it('is true for a key of a conversion, by its flag or by the 229 some IMEs send', () => {
    expect(composing(key({ key: 'Enter', isComposing: true }))).toBe(true)
    expect(composing(key({ key: 'Process', keyCode: 229 }))).toBe(true)
    expect(composing(key({ key: 'Enter', keyCode: 13 }))).toBe(false)
    expect(composing(key({ key: 'Escape', keyCode: 27 }))).toBe(false)
  })
})

describe('key handlers next to a text field', () => {
  const files = svelteFiles(RENDERER)
    .map((file) => path.relative(RENDERER, file).replaceAll('\\', '/'))
    .filter((file) => {
      const text = readFileSync(path.join(RENDERER, file), 'utf8')
      return HANDLES.test(text) && TEXT_FIELD.test(text)
    })

  it('are found (the scan is not empty)', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it.each([...files, ...CAPTURING])(
    '%s leaves a conversion’s Enter and Escape to the IME',
    (file) => {
      const text = readFileSync(path.join(RENDERER, file), 'utf8')
      expect(text, `${file} acts on Enter or Escape but never asks composing()`).toMatch(
        /\bcomposing\(/,
      )
      expect(text, `${file} imports composing from lib/ime.ts`).toMatch(
        /import \{[^}]*\bcomposing\b[^}]*\} from '[./]+\/?lib\/ime\.ts'/,
      )
    },
  )
})
