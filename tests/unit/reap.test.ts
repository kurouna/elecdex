import { describe, expect, it } from 'vitest'
import { sessionsToReap } from '../../src/renderer/layout/reap.js'

/**
 * The workspace ends the shells no pane claims. The bug: a pane that had just
 * created its shell, and not yet recorded it, lost it to the reaper and was
 * left attached to nothing (seen in the e2e run as "No such terminal session").
 */
describe('which shells the reaper ends', () => {
  const now = 100_000

  it('ends a shell nobody claims, and keeps the claimed ones', () => {
    const alive = [
      { id: 'a', createdAt: now - 60_000 },
      { id: 'b', createdAt: now - 60_000 },
    ]
    expect(sessionsToReap(alive, new Set(['a']), now, 4000)).toEqual({ reap: ['b'], later: false })
  })

  it('leaves a shell just created for the next look, rather than ending it', () => {
    const alive = [{ id: 'new', createdAt: now - 500 }]
    expect(sessionsToReap(alive, new Set(), now, 4000)).toEqual({ reap: [], later: true })
  })

  it('ends it at the next look if still nobody has claimed it', () => {
    const alive = [{ id: 'new', createdAt: now - 500 }]
    expect(sessionsToReap(alive, new Set(), now + 4000, 4000)).toEqual({
      reap: ['new'],
      later: false,
    })
  })
})
