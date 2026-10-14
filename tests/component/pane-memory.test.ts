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
