import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * tests/e2e/hidden-panes.spec.ts puts every built-in pane behind a tab and
 * checks that it does nothing there. Its list is written out by hand, so a new
 * widget left out of it would never be checked: this holds the list to the
 * registry. The registry imports Svelte components, which a unit test cannot
 * load, so both files are read as text.
 */

const read = (file: string): string => readFileSync(new URL(file, import.meta.url), 'utf8')

describe('the hidden-pane check', () => {
  it('covers every built-in widget but the clock it hides them behind', () => {
    const registered = [
      ...read('../../src/renderer/widgets/builtins.ts').matchAll(/^ {2}id: '([^']+)',$/gm),
    ].map((match) => match[1])
    const list = /const WIDGETS = \[([^\]]*)\]/.exec(read('../e2e/hidden-panes.spec.ts'))?.[1] ?? ''
    const checked = [...list.matchAll(/'([^']+)'/g)].map((match) => match[1])
    expect(registered.length).toBeGreaterThan(20)
    expect([...checked, 'clock'].sort()).toEqual([...registered].sort())
  })
})
