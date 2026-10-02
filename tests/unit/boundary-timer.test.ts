import { describe, expect, it } from 'vitest'
import { BoundaryTimer } from '../../src/main/boundary-timer.js'
import { nextBoundary } from '../../src/shared/wall-clock'

/**
 * The one timer the watchers that read while a pane is seen share (main/boundary-timer.ts): on
 * the wall clock's grid, armed again before each run, never an interval, and gone when stopped.
 */

function clock(start: number) {
  let now = start
  const timers = new Map<number, { at: number; fn: () => void }>()
  let ids = 0
  const deps = {
    now: () => now,
    setTimer: (fn: () => void, ms: number) => {
      ids += 1
      timers.set(ids, { at: now + ms, fn })
      return ids
    },
    clearTimer: (handle: unknown) => {
      timers.delete(handle as number)
    },
  }
  /** Moves the clock on, firing what falls due on the way, in order. */
  const advance = (ms: number): void => {
    const end = now + ms
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, t]) => t.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0]
      if (due === undefined) break
      timers.delete(due[0])
      now = due[1].at
      due[1].fn()
    }
    now = end
  }
  return { deps, advance, timers, now: () => now }
}

describe('a boundary timer', () => {
  it('is the next boundary of its period, never now', () => {
    expect(nextBoundary(1000, 250)).toBe(1250)
    expect(nextBoundary(1001, 250)).toBe(1250)
    expect(nextBoundary(1249, 250)).toBe(1250)
    expect(nextBoundary(1250, 500)).toBe(1500)
  })

  it('runs on every boundary of its period once started, and stays on the grid', () => {
    const c = clock(1_010)
    const runs: number[] = []
    const timer = new BoundaryTimer(c.deps, 250, () => runs.push(c.now()))
    timer.start()
    timer.start()
    expect(c.timers.size).toBe(1)
    c.advance(1_000)
    expect(runs).toEqual([1_250, 1_500, 1_750, 2_000])
    expect(timer.armed).toBe(true)
  })

  it('is armed again before it runs, so a run that stops it ends it', () => {
    const c = clock(0)
    let runs = 0
    const timer = new BoundaryTimer(c.deps, 100, () => {
      runs += 1
      if (runs === 2) timer.stop()
    })
    timer.start()
    c.advance(1_000)
    expect(runs).toBe(2)
    expect(timer.armed).toBe(false)
    expect(c.timers.size).toBe(0)
  })

  it('runs once on the next boundary when asked once, however often it is asked', () => {
    const c = clock(30)
    const runs: number[] = []
    const timer = new BoundaryTimer(c.deps, 250, () => runs.push(c.now()))
    timer.once()
    timer.once()
    c.advance(2_000)
    expect(runs).toEqual([250])
    expect(timer.armed).toBe(false)
  })

  it('stopped, leaves no timer behind and runs nothing more', () => {
    const c = clock(0)
    let runs = 0
    const timer = new BoundaryTimer(c.deps, 500, () => {
      runs += 1
    })
    timer.start()
    c.advance(600)
    timer.stop()
    expect(c.timers.size).toBe(0)
    c.advance(5_000)
    expect(runs).toBe(1)
  })
})
