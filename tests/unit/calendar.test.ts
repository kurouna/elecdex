import { describe, expect, it } from 'vitest'
import {
  firstDayOfWeek,
  isoWeek,
  monthGrid,
  msUntilMidnight,
  waveStep,
  waveTowards,
} from '../../src/renderer/lib/calendar.js'

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

describe('calendar', () => {
  it('starts the grid on the week holding the 1st', () => {
    // 1 September 2026 is a Tuesday.
    const sunday = monthGrid(2026, 8, 0)
    expect(sunday).toHaveLength(42)
    expect(ymd(sunday[0] as Date)).toBe('2026-8-30')
    expect(ymd(sunday[41] as Date)).toBe('2026-10-10')
    expect(ymd(monthGrid(2026, 8, 1)[0] as Date)).toBe('2026-8-31')
    // A month that starts on the week's first day has no leading days.
    expect(ymd(monthGrid(2026, 1, 0)[0] as Date)).toBe('2026-2-1')
  })

  it('numbers weeks as ISO 8601 does', () => {
    expect(isoWeek(new Date(2026, 8, 13))).toBe(37)
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53) // belongs to 2026's last week
    expect(isoWeek(new Date(2024, 11, 30))).toBe(1)
  })

  it('knows where weeks start', () => {
    expect(firstDayOfWeek('ja-JP')).toBe(0)
    expect(firstDayOfWeek('en-US')).toBe(0)
    expect([0, 1]).toContain(firstDayOfWeek('de-DE')) // 1 where Node has week info
    expect(firstDayOfWeek('not a locale')).toBe(0)
  })

  it('counts down to midnight', () => {
    expect(msUntilMidnight(new Date(2026, 8, 13, 23, 59, 30))).toBe(30_000)
  })

  it('sweeps a later month in from the top left, an earlier one from the bottom right', () => {
    const steps = (direction: 'next' | 'prev') =>
      Array.from({ length: 42 }, (_, i) => waveStep(i, direction))
    const next = steps('next')
    expect([next[0], next[6], next[35], next[41]]).toEqual([0, 6, 5, 11])
    // A diagonal arrives together: the second cell of the first row with the first of the second.
    expect(next[1]).toBe(next[7])
    const prev = steps('prev')
    expect([prev[41], prev[0]]).toEqual([0, 11])
    // Mirrored, every cell's step is the same distance from the end.
    expect(prev.every((step, i) => step === 11 - (next[i] as number))).toBe(true)
  })

  it('tells which way the calendar moved, across a year too', () => {
    expect(waveTowards(new Date(2026, 8, 1), new Date(2026, 9, 1))).toBe('next')
    expect(waveTowards(new Date(2026, 8, 1), new Date(2026, 7, 1))).toBe('prev')
    expect(waveTowards(new Date(2026, 11, 1), new Date(2027, 0, 1))).toBe('next')
    expect(waveTowards(new Date(2027, 0, 1), new Date(2026, 11, 1))).toBe('prev')
    // "today" on the month already shown replays nothing.
    expect(waveTowards(new Date(2026, 8, 1), new Date(2026, 8, 1))).toBeNull()
  })
})
