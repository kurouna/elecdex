import { describe, expect, it } from 'vitest'
import {
  firstDayOfWeek,
  isoWeek,
  monthGrid,
  msUntilMidnight,
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
})
