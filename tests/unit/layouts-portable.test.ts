import { portableTree } from '@shared/layouts'
import { describe, expect, it } from 'vitest'

/**
 * A saved layout travels (architecture.md §5.6): what only means something on this machine, in
 * this run, is left out of it.
 */
describe('a portable layout', () => {
  it('leaves out a shell’s session and a chat’s files waiting to be sent, and keeps the rest', () => {
    const tree = portableTree({
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [0.5, 0.5],
        children: [
          { kind: 'pane', id: 't', widget: 'terminal', state: { sessionId: 's1' } },
          {
            kind: 'pane',
            id: 'c',
            widget: 'aichat',
            state: {
              chat: '11111111-2222-4333-8444-555555555555',
              filesDraft: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
            },
          },
        ],
      },
    })
    expect(tree.root.kind === 'split' && tree.root.children).toEqual([
      { kind: 'pane', id: 't', widget: 'terminal' },
      {
        kind: 'pane',
        id: 'c',
        widget: 'aichat',
        state: { chat: '11111111-2222-4333-8444-555555555555' },
      },
    ])
  })
})
