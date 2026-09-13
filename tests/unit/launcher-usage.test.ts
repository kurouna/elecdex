import { describe, expect, it } from 'vitest'
import { rankByUse, recordLaunch, USAGE_LIMIT } from '../../src/shared/launcher.js'

describe('launcher usage', () => {
  const entries = [{ id: 'user' }, { id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('keeps the catalog order while nothing has been launched', () => {
    expect(rankByUse(entries, {}).map((e) => e.id)).toEqual(['user', 'a', 'b', 'c'])
  })

  it('puts the most launched first, the most recent breaking ties', () => {
    const usage = {
      b: { count: 5, last: 10 },
      c: { count: 2, last: 50 },
      a: { count: 2, last: 90 },
    }
    expect(rankByUse(entries, usage).map((e) => e.id)).toEqual(['b', 'a', 'c', 'user'])
  })

  it('counts launches and forgets the least recent beyond the limit', () => {
    let usage = recordLaunch({}, 'x', 1)
    usage = recordLaunch(usage, 'x', 2)
    expect(usage.x).toEqual({ count: 2, last: 2 })

    const full = Object.fromEntries(
      Array.from({ length: USAGE_LIMIT }, (_, i) => [`id${i}`, { count: 1, last: i + 10 }]),
    )
    const next = recordLaunch(full, 'new', 10_000)
    expect(Object.keys(next)).toHaveLength(USAGE_LIMIT)
    expect(next.new).toEqual({ count: 1, last: 10_000 })
    expect(next.id0).toBeUndefined()
  })
})
