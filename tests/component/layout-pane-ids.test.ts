import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tracked } from './tracked.svelte.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * Which panes there are, as one value that changes only when a pane comes or goes.
 *
 * The workspace's shell reaper waits on it: it ends the shells no pane claims a
 * few seconds after the panes last changed. Waiting on the pane list itself, a new
 * array on every change to the tree, put the reaper off at every divider drag,
 * tab click and pane state written.
 */

const a = pane('clock')
const b = pane('terminal')

beforeEach(() => {
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async () => {}) } })
  layout.tree = { version: LAYOUT_VERSION, root: split('row', [a, b]) }
  layout.focusedPaneId = a.id
})

afterEach(async () => {
  layout.settle()
  await layout.flush()
  vi.unstubAllGlobals()
})

describe('paneIds', () => {
  it('names every pane in the tree', () => {
    expect(layout.paneIds).toBe([a.id, b.id].join(' '))
  })

  it('stays the same through a resize, a focus and a pane state change', async () => {
    const watched = tracked(() => layout.paneIds)
    await Promise.resolve()
    const runs = watched.runs()
    const root = layout.tree.root
    layout.resize(root.id, [0.3, 0.7])
    layout.patchPaneState(b.id, { sessionId: 's1' })
    layout.focus(b.id)
    await Promise.resolve()
    expect(watched.runs()).toBe(runs)
    watched.stop()
  })

  it('changes when a pane is added or closed', async () => {
    const watched = tracked(() => layout.paneIds)
    await Promise.resolve()
    layout.split(a.id, 'down', 'rss')
    await Promise.resolve()
    expect(watched.value()).not.toBe([a.id, b.id].join(' '))
    expect(watched.value().split(' ')).toHaveLength(3)
    watched.stop()
  })
})
