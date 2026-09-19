import {
  type ChronoState,
  elapsed,
  formatClock,
  lapExtremes,
  litSegments,
  remaining,
  segmentCount,
  splitDuration,
} from '@shared/timer'
import { describe, expect, it } from 'vitest'

/**
 * The chrono's arithmetic.
 *
 * The point of all of it is that time is read from the wall clock rather than
 * counted in ticks, so a pane that is moved (and therefore remounted), a tab
 * switched away from, a reload and a restart all leave a running chrono where it
 * was. These tests are what says so without running the app.
 */

const T0 = 1_700_000_000_000

const running = (over: Partial<ChronoState> = {}): ChronoState => ({
  running: true,
  startedAt: T0,
  accumulatedMs: 0,
  ...over,
})

describe('elapsed', () => {
  it('counts from the moment it started', () => {
    expect(elapsed(running(), T0 + 5000)).toBe(5000)
  })

  it('adds what earlier runs banked', () => {
    expect(elapsed(running({ accumulatedMs: 60_000 }), T0 + 5000)).toBe(65_000)
  })

  it('is exactly what was banked while it is stopped', () => {
    const stopped: ChronoState = { running: false, startedAt: 0, accumulatedMs: 12_345 }
    expect(elapsed(stopped, T0 + 999_999)).toBe(12_345)
  })

  it('does not run backwards when the clock is set back under it', () => {
    expect(elapsed(running(), T0 - 5000)).toBe(0)
  })
})

describe('remaining', () => {
  it('counts down and stops at zero', () => {
    expect(remaining(running(), 10_000, T0 + 4000)).toBe(6000)
    expect(remaining(running(), 10_000, T0 + 30_000)).toBe(0)
  })
})

describe('splitDuration and formatClock', () => {
  it('splits to tenths, which is all a 10 fps readout can honestly show', () => {
    expect(splitDuration(94_250)).toEqual({ hours: 0, minutes: 1, seconds: 34, tenths: 2 })
  })

  it('shows hours only once there are any', () => {
    expect(formatClock(94_250)).toBe('01:34')
    expect(formatClock(3_723_000)).toBe('1:02:03')
  })

  it('treats a negative as zero rather than printing a minus', () => {
    expect(formatClock(-5)).toBe('00:00')
    expect(splitDuration(-5).seconds).toBe(0)
  })
})

describe('lapExtremes', () => {
  it('finds the fastest and the slowest', () => {
    const laps = [
      { ms: 30_000, atMs: 30_000 },
      { ms: 18_000, atMs: 48_000 },
      { ms: 42_000, atMs: 90_000 },
    ]
    expect(lapExtremes(laps)).toEqual({ best: 1, worst: 2 })
  })

  it('marks nothing until there is something to compare', () => {
    expect(lapExtremes([{ ms: 1, atMs: 1 }])).toBeNull()
    expect(lapExtremes([])).toBeNull()
  })
})

describe('the ladder', () => {
  it('takes its segment count from the space it has, within limits', () => {
    expect(segmentCount(240)).toBe(30)
    expect(segmentCount(10)).toBe(12)
    expect(segmentCount(4000)).toBe(60)
  })

  it('puts out the last segment exactly at zero, not before', () => {
    expect(litSegments(10_000, 10_000, 20)).toBe(20)
    expect(litSegments(1, 10_000, 20)).toBe(1)
    expect(litSegments(0, 10_000, 20)).toBe(0)
  })

  it('does not divide by a duration of nothing', () => {
    expect(litSegments(5, 0, 20)).toBe(0)
  })
})
