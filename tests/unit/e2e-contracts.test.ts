import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PANES } from '../e2e/contracts/panes.js'

/**
 * The e2e contracts (tests/e2e/contracts/) run over a table of every built-in widget. The table
 * is written by hand, beside the registry rather than from it (the registry imports Svelte
 * components, which neither a unit test nor Playwright can load), so this holds the two together:
 * a widget registered and missing from the table, or a row that says otherwise than the registry
 * about popping up, the zoom, the sources read or kept, fails here before any e2e runs. The web
 * panes are registered by preset, not by a literal id, and have their own spec (they go on
 * unseen, CLAUDE.md §5.4).
 */

const registry = readFileSync(
  new URL('../../src/renderer/widgets/builtins.ts', import.meta.url),
  'utf8',
)

interface Registered {
  id: string
  popup: boolean
  zoom: 'full' | 'panel' | null
  metrics: string[]
  kept: string[]
}

/** The ids in a `sources(...)` call of `block` after `key:`, in order. */
function sourcesOf(block: string, key: string): string[] {
  const call = new RegExp(`${key}: sources\\(([^)]*)\\)`).exec(block)?.[1] ?? ''
  return [...call.matchAll(/'([^']+)'/g)].map((m) => m[1] ?? '')
}

/** Each `registerBuiltin({ id: '…', … })` of builtins.ts, read as text. */
function registered(): Registered[] {
  return registry
    .split('registerBuiltin({')
    .slice(1)
    .flatMap((block) => {
      const id = /^\s*id: '([^']+)',$/m.exec(block)?.[1]
      if (id === undefined) return []
      const zoom = /^\s*zoom: '(full|panel)',$/m.exec(block)?.[1] as 'full' | 'panel' | undefined
      return [
        {
          id,
          popup: /^\s*popup: true,$/m.test(block),
          zoom: zoom ?? null,
          metrics: sourcesOf(block, 'metrics'),
          kept: sourcesOf(block, 'keepWhileHidden'),
        },
      ]
    })
}

describe('the e2e contracts table', () => {
  const widgets = registered()

  it('has a row for every built-in widget, and none for a widget that is not one', () => {
    expect(widgets.length).toBeGreaterThan(30)
    expect(PANES.map((r) => r.widget).sort()).toEqual(widgets.map((w) => w.id).sort())
  })

  it('says what the registry says about popping up, the zoom and the sources', () => {
    const table = PANES.map((r) => ({
      id: r.widget,
      popup: r.popup,
      zoom: r.zoom,
      metrics: [...(r.seen?.metrics ?? [])].sort(),
      kept: [...(r.kept ?? [])].sort(),
    })).sort((a, b) => a.id.localeCompare(b.id))
    const reg = widgets
      .map((w) => ({ ...w, metrics: [...w.metrics].sort(), kept: [...w.kept].sort() }))
      .sort((a, b) => a.id.localeCompare(b.id))
    expect(table).toEqual(reg)
  })
})
