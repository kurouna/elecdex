import { describe, expect, it } from 'vitest'
import { bucketsOf, columnsOf, echoLoss, newestFirst } from '../../src/shared/netpath'

/**
 * What the Wi-Fi and Ethernet panes share for their timelines and logs
 * (shared/netpath.ts): the columns a timeline is drawn in, the share of echoes
 * lost, and the order of the log. Each pane's own lanes are tested beside it
 * (wifi.test.ts, ethernet.test.ts).
 */

const at = (ms: number, v = 0) => ({ at: ms, v })

describe('timeline columns', () => {
  it('puts each point in its column, the end left out, and an empty column empty', () => {
    const columns = columnsOf([at(0), at(999), at(1000), at(3500), at(4000)], 0, 4000, 4)
    expect(columns.map((c) => c.map((p) => p.at))).toEqual([[0, 999], [1000], [], [3500]])
  })

  it('gives every column its stretch and count, and the measure of its points', () => {
    const points = [at(0, 1), at(500, 3), at(2500, 7)]
    const buckets = bucketsOf(points, 0, 3000, 3, (column) => ({
      sum: column.reduce((a, p) => a + p.v, 0),
    }))
    expect(buckets).toEqual([
      { from: 0, to: 1000, count: 2, sum: 4 },
      { from: 1000, to: 2000, count: 0, sum: 0 },
      { from: 2000, to: 3000, count: 1, sum: 7 },
    ])
  })

  it('measures a column the pane did not watch too, so it can say null', () => {
    const seen: number[] = []
    bucketsOf([at(100)], 0, 2000, 2, (column) => seen.push(column.length))
    expect(seen).toEqual([1, 0])
  })

  it('makes one column of a count below one', () => {
    expect(bucketsOf([at(10)], 0, 100, 0, () => ({}))).toEqual([{ from: 0, to: 100, count: 1 }])
  })
})

describe('echo loss', () => {
  it('counts only the echoes asked: a null is lost, an undefined never sent', () => {
    expect(echoLoss([12, null, undefined, 14])).toBeCloseTo(100 / 3)
    expect(echoLoss([null, null])).toBe(100)
    expect(echoLoss([3, 4])).toBe(0)
  })

  it('is null when nothing was asked', () => {
    expect(echoLoss([])).toBeNull()
    expect(echoLoss([undefined, undefined])).toBeNull()
  })
})

describe('the log order', () => {
  const e = (ms: number, key: string) => ({ at: ms, key })

  it('puts every list together newest first, a tie by key whichever list it came from', () => {
    const merged = newestFirst([e(1, 'b'), e(3, 'z')], [e(2, 'x'), e(1, 'a')])
    expect(merged.map((m) => m.key)).toEqual(['z', 'x', 'a', 'b'])
    const swapped = newestFirst([e(2, 'x'), e(1, 'a')], [e(1, 'b'), e(3, 'z')])
    expect(swapped).toEqual(merged)
  })

  it('leaves the lists it was given as they were', () => {
    const one = [e(1, 'a'), e(2, 'b')]
    newestFirst(one)
    expect(one.map((m) => m.key)).toEqual(['a', 'b'])
  })
})
