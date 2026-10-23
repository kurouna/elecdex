import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DIALOGS } from '../e2e/contracts/dialogs.js'

/**
 * The motion contract (tests/e2e/contracts/motion.spec.ts) runs over a table of every dialog,
 * popup, toast and notice. It is written by hand, so this holds it to the app: every overlay the
 * ui store knows (`type Overlay` in stores/ui.svelte.ts) has a row, and so has every component
 * outside the widgets that powers on and off with `crtPower` (a toast, a notice). A new one
 * without a row fails here before any e2e runs. What a pane draws inside itself is the pane's.
 */

const RENDERER = fileURLToPath(new URL('../../src/renderer/', import.meta.url))

/** The members of `type Overlay = | 'a' | 'b' …` in the ui store. */
function overlays(): string[] {
  const text = readFileSync(path.join(RENDERER, 'stores/ui.svelte.ts'), 'utf8')
  const union = /type Overlay =([\s\S]*?)\n\n/.exec(text)?.[1] ?? ''
  return [...union.matchAll(/'([a-z]+)'/g)].map((m) => m[1] ?? '').sort()
}

/** Every .svelte file under src/renderer but the widgets' own, relative and with forward slashes. */
function components(dir = RENDERER): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'widgets' || entry.name.startsWith('.')) return []
      return components(full)
    }
    return entry.name.endsWith('.svelte')
      ? [path.relative(RENDERER, full).replaceAll('\\', '/')]
      : []
  })
}

describe('the e2e dialogs table', () => {
  it('has a row for every overlay of the ui store', () => {
    const known = overlays()
    expect(known.length).toBeGreaterThan(5)
    expect(DIALOGS.flatMap((r) => (r.overlay === undefined ? [] : [r.overlay])).sort()).toEqual(
      known,
    )
  })

  it('has a row for every component outside the widgets that powers on and off', () => {
    const powered = components().filter((file) =>
      /transition:crtPower/.test(readFileSync(path.join(RENDERER, file), 'utf8')),
    )
    expect(powered.length).toBeGreaterThan(5)
    const rows = new Set(DIALOGS.map((r) => r.component))
    expect(powered.filter((file) => !rows.has(file))).toEqual([])
  })

  it('names components that exist and testids that their component draws', () => {
    for (const row of DIALOGS) {
      const source = readFileSync(path.join(RENDERER, row.component), 'utf8')
      expect(source, row.component).toContain(`data-testid="${row.testid}"`)
    }
  })
})
