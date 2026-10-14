import { describe, expect, it } from 'vitest'

const { forgetGonePanes } = await import('../../src/renderer/lib/pane-memory.ts')
const { composed } = await import('../../src/renderer/widgets/aichat/draft.svelte.ts')

/** What a widget keeps by pane id past its mount, let go when the reaper says the pane is gone. */
describe('memory kept by pane', () => {
  it("lets go of a closed chat pane's words, and keeps those of a pane still there", () => {
    // Issue 19: a pane closed with words in its composer held them until a restart.
    composed.set('gone', { text: 'half a question', editing: null, kept: [] })
    composed.set('here', { text: 'still typing', editing: null, kept: [] })
    forgetGonePanes(new Set(['here', 'other']))
    expect([...composed.keys()]).toEqual(['here'])
    composed.clear()
  })
})

describe('what is typed in a short field', () => {
  it('is kept by pane and field through a remount, and let go with the pane', async () => {
    // Found in the sweep: a filter or a symbol being typed was lost when the pane moved.
    const { keepTyped, recallTyped } = await import('../../src/renderer/lib/pane-memory.ts')
    keepTyped('p1', 'filter', 'error')
    keepTyped('p1', 'query', '10.0')
    keepTyped('p2', 'filter', 'warn')
    expect(recallTyped('p1', 'filter')).toBe('error')
    expect(recallTyped('p1', 'other')).toBe('')
    keepTyped('p1', 'query', '')
    expect(recallTyped('p1', 'query')).toBe('')
    forgetGonePanes(new Set(['p2']))
    expect(recallTyped('p1', 'filter')).toBe('')
    expect(recallTyped('p2', 'filter')).toBe('warn')
  })

  it('is not kept for a popped-up pane, which starts afresh each time it opens', async () => {
    const { keepTyped, recallTyped } = await import('../../src/renderer/lib/pane-memory.ts')
    keepTyped('popup:launcher', 'filter', 'code')
    expect(recallTyped('popup:launcher', 'filter')).toBe('')
  })
})
