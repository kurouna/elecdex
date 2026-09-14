import { describe, expect, it } from 'vitest'
import { carryFresh, FreshTracker } from '../../src/renderer/lib/fresh.js'

describe('FreshTracker', () => {
  it('takes the first reading as known, and later keys as new, in their order', () => {
    const tracker = new FreshTracker()
    expect(tracker.next(['a', 'b'])).toEqual([])
    expect(tracker.next(['d', 'c', 'a', 'b'])).toEqual(['d', 'c'])
    // Already reported: not new a second time.
    expect(tracker.next(['d', 'c', 'a'])).toEqual([])
  })

  it('an empty first reading still sets the baseline', () => {
    const tracker = new FreshTracker()
    expect(tracker.next([])).toEqual([])
    expect(tracker.next(['a'])).toEqual(['a'])
  })

  it('a row that drops off the list and comes back is not new again', () => {
    const tracker = new FreshTracker()
    tracker.next(['a', 'b', 'c'])
    expect(tracker.next(['x', 'a', 'b'])).toEqual(['x'])
    expect(tracker.next(['x', 'a', 'b', 'c'])).toEqual([])
  })

  it('a reset starts over, as for another list', () => {
    const tracker = new FreshTracker()
    tracker.next(['a'])
    tracker.reset()
    expect(tracker.next(['p', 'q'])).toEqual([])
    expect(tracker.next(['r', 'p', 'q'])).toEqual(['r'])
  })

  it('remembers a bounded number of keys, forgetting the oldest', () => {
    const tracker = new FreshTracker(3)
    tracker.next(['a', 'b', 'c'])
    expect(tracker.next(['d'])).toEqual(['d'])
    // 'a' was the oldest and is forgotten; 'b' to 'd' are still known.
    expect(tracker.next(['a', 'b', 'c', 'd'])).toEqual(['a'])
    // Remembering 'a' again forgot 'b', the oldest by then.
    expect(tracker.next(['c', 'd', 'a'])).toEqual([])
    expect(tracker.next(['b'])).toEqual(['b'])
  })
})

describe('carryFresh', () => {
  it('keeps the rows still new and adds the arrivals, of those still listed', () => {
    const fresh = new Set(['a', 'gone'])
    expect([...carryFresh(fresh, ['n'], ['n', 'a', 'b'])]).toEqual(['n', 'a'])
  })

  it('leaves out an arrival not in the list', () => {
    expect([...carryFresh(new Set(), ['too-old'], ['a', 'b'])]).toEqual([])
  })

  it('returns the same set when there is nothing to carry, so nothing re-renders', () => {
    const empty = new Set<string>()
    expect(carryFresh(empty, [], ['a'])).toBe(empty)
  })
})
