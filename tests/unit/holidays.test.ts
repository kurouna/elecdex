import { describe, expect, it } from 'vitest'
import {
  describeMarks,
  HOLIDAY_CALENDARS,
  holidayChoice,
  holidayLookup,
} from '../../src/shared/holidays.js'

describe('holiday calendars', () => {
  it('registers calendars with unique ids and tags', () => {
    const ids = HOLIDAY_CALENDARS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('jp')
  })

  it('reads the pane choice, including the old single-string form', () => {
    expect(holidayChoice(undefined)).toEqual([])
    expect(holidayChoice({ holidays: 'none' })).toEqual([])
    expect(holidayChoice({ holidays: 'jp' })).toEqual(['jp'])
    expect(holidayChoice({ holidays: ['xx', 'jp', 'jp'] })).toEqual(['jp'])
  })

  it('marks holidays of the chosen calendars only', () => {
    expect(holidayLookup([])(new Date(2026, 0, 1))).toEqual([])
    const marks = holidayLookup(['jp'])(new Date(2026, 0, 1))
    expect(marks).toEqual([{ country: 'jp', name: "New Year's Day" }])
    expect(describeMarks(marks, false)).toBe("New Year's Day")
    expect(describeMarks(marks, true)).toBe("New Year's Day (JP)")
    expect(holidayLookup(['jp'])(new Date(2026, 0, 2))).toEqual([])
  })
})
