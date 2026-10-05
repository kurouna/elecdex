import { clearRuns } from '@shared/e16c/back'
import { describe, expect, it } from 'vitest'

/**
 * e16c_init (shared/e16c/back.ts): the arrays are cleared as runs of memory - arrays that lie
 * end to end are one MSET, not one each.
 */
describe('e16c_init', () => {
  it('clears arrays that follow one another with one MSET, an odd length rounded up', () => {
    expect(
      clearRuns([
        { name: 'b', at: 0x310, bytes: 5 },
        { name: 'a', at: 0x300, bytes: 16 },
        { name: 'c', at: 0x316, bytes: 2 },
        { name: 'd', at: 0x400, bytes: 8 },
      ]),
    ).toEqual([
      { at: 0x300, bytes: 24, names: ['a', 'b', 'c'] },
      { at: 0x400, bytes: 8, names: ['d'] },
    ])
    expect(clearRuns([])).toEqual([])
  })
})
