import { neighbourToward, paneShares } from '@shared/layout-direction'
import { pane, split, tabs } from '@shared/layout-ops'
import { describe, expect, it } from 'vitest'

/**
 * Which pane lies to one side of another, from the tree's sizes alone: what
 * Ctrl+Shift+Arrow moves the keyboard to.
 */

const a = pane('terminal', { id: 'a' })
const b = pane('clock', { id: 'b' })
const c = pane('calendar', { id: 'c' })
const d = pane('notes', { id: 'd' })
const t1 = pane('terminal', { id: 't1' })
const t2 = pane('clock', { id: 't2' })

// a | (b over c) | group of t1, t2
const GRID = split('row', [a, split('column', [b, c], [0.5, 0.5]), tabs([t1, t2])], [0.4, 0.3, 0.3])

describe('paneShares', () => {
  it('shares the workspace out by the sizes, a group by the tab it shows', () => {
    const shares = paneShares(GRID)
    expect(shares.get('a')).toEqual({ top: 0, right: 0.4, bottom: 1, left: 0 })
    expect(shares.get('c')?.top).toBeCloseTo(0.5)
    expect(shares.get('t1')?.left).toBeCloseTo(0.7)
    expect(shares.has('t2')).toBe(false)
  })
})

describe('neighbourToward', () => {
  it('goes to the pane that way which shares most of that side', () => {
    expect(neighbourToward(GRID, 'b', 'down')).toBe('c')
    expect(neighbourToward(GRID, 'c', 'up')).toBe('b')
    expect(neighbourToward(GRID, 'b', 'left')).toBe('a')
    // From the tall pane, the two to its right share as much of its side: the first in order.
    expect(neighbourToward(GRID, 'a', 'right')).toBe('b')
  })

  it('reaches a group through the tab it shows, and leaves a group from its tab behind too', () => {
    expect(neighbourToward(GRID, 'c', 'right')).toBe('t1')
    expect(neighbourToward(GRID, 't2', 'left')).toBe('b')
  })

  it('finds nothing at the edge, so the key goes to the pane', () => {
    expect(neighbourToward(GRID, 'a', 'left')).toBeNull()
    expect(neighbourToward(GRID, 'a', 'up')).toBeNull()
    expect(neighbourToward(GRID, 't1', 'right')).toBeNull()
    expect(neighbourToward(a, 'a', 'right')).toBeNull()
  })

  it('prefers the pane touching it to one further away', () => {
    const row = split('row', [a, b, c])
    expect(neighbourToward(row, 'a', 'right')).toBe('b')
    expect(neighbourToward(row, 'c', 'left')).toBe('b')
  })

  it('goes to the pane sharing more of the side when the panes beyond are uneven', () => {
    // a over d on the left; b, taller than c, on the right: from d the most it shares is with c.
    const uneven = split('row', [
      split('column', [a, d], [0.5, 0.5]),
      split('column', [b, c], [0.3, 0.7]),
    ])
    expect(neighbourToward(uneven, 'd', 'right')).toBe('c')
    expect(neighbourToward(uneven, 'a', 'right')).toBe('b')
  })

  it('knows nothing of a pane not in the tree', () => {
    expect(neighbourToward(GRID, 'gone', 'right')).toBeNull()
  })
})
