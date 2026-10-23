import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isGlobal, KEYBINDING_ACTIONS } from '../../src/shared/keybindings.js'
import { KEY_ROWS } from '../e2e/contracts/keys.js'

/**
 * The keybindings contract (tests/e2e/contracts/keybindings.spec.ts) presses every page action
 * of src/shared/keybindings.ts, from a table beside it (contracts/keys.ts). This holds the two
 * together, as e2e-contracts.test.ts holds the panes' table to the registry: an action added
 * and missing from the table, a system-wide one in it, or a row that sends its action to a test
 * that is not there, fails here before any e2e runs.
 */

const spec = (name: string): string =>
  readFileSync(new URL(`../e2e/${name}`, import.meta.url), 'utf8')

describe('the e2e keybindings contract table', () => {
  it('has a row for every page action, and none for a system-wide one', () => {
    const page = KEYBINDING_ACTIONS.map((a) => a.id).filter((id) => !isGlobal(id))
    expect(page.length).toBeGreaterThan(30)
    expect(Object.keys(KEY_ROWS).sort()).toEqual([...page].sort())
  })

  it('sends every row it does not press to a test that presses it, with a reason', () => {
    for (const [action, row] of Object.entries(KEY_ROWS)) {
      if (!('elsewhere' in row)) continue
      const { spec: name, test, why } = row.elsewhere
      expect(why.length, action).toBeGreaterThan(10)
      const text = spec(name)
      const start = text.indexOf(`test('${test}'`)
      expect(start, action).toBeGreaterThanOrEqual(0)
      // That test - not just its file - presses the action's own chord, as the contract would have.
      const end = text.indexOf('\ntest(', start + 1)
      const body = text.slice(start, end === -1 ? undefined : end)
      const chord = KEYBINDING_ACTIONS.find((a) => a.id === action)?.chord ?? ''
      expect(body, action).toContain(chord.replace('Ctrl', 'Control'))
    }
  })

  it('gives every workspace row a check in the spec', () => {
    const text = spec('contracts/keybindings.spec.ts')
    const checks = text.slice(text.indexOf('const WORKSPACE_CHECKS'))
    for (const [action, row] of Object.entries(KEY_ROWS)) {
      if ('world' in row && row.world === 'workspace') {
        expect(checks, action).toContain(`'${action}': async`)
      }
    }
  })
})
