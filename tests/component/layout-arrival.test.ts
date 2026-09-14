import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * A pane just added powers on once (PaneHost asks `arrived` as it mounts): the
 * answer is yes for the new pane only, and only the first time, so a move that
 * remounts it later does not play the power-on again.
 */
describe('layout.arrived', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('elecdex', { layout: { save: vi.fn(async () => {}) } })
    const a = pane('clock')
    const b = pane('calendar')
    layout.tree = { version: LAYOUT_VERSION, root: split('row', [a, b]) }
    layout.focusedPaneId = a.id
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const newest = (before: Set<string>) =>
    layout.panes.map((p) => p.id).find((id) => !before.has(id)) as string

  it('answers yes once for a pane added beside another', () => {
    const before = new Set(layout.panes.map((p) => p.id))
    const [existing] = before
    layout.addPane('weather', 'right')
    const added = newest(before)
    expect(layout.arrived(existing as string)).toBe(false)
    expect(layout.arrived(added)).toBe(true)
    expect(layout.arrived(added)).toBe(false)
  })

  it('answers yes once for a pane added as a tab', () => {
    const before = new Set(layout.panes.map((p) => p.id))
    layout.addPane('rss', 'tab')
    const added = newest(before)
    expect(layout.arrived(added)).toBe(true)
    expect(layout.arrived(added)).toBe(false)
  })

  it('a move is not an arrival', () => {
    const [first, second] = layout.panes.map((p) => p.id) as [string, string]
    layout.move(first, second, 'down')
    expect(layout.arrived(first)).toBe(false)
    expect(layout.arrived(second)).toBe(false)
  })

  it('only the last pane added is arriving', () => {
    const before = new Set(layout.panes.map((p) => p.id))
    layout.addPane('weather', 'right')
    const firstAdded = newest(before)
    before.add(firstAdded)
    layout.addPane('rss', 'down')
    expect(layout.arrived(firstAdded)).toBe(false)
    expect(layout.arrived(newest(before))).toBe(true)
  })
})
