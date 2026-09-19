import {
  type Alarm,
  AlarmsFileSchema,
  describeDays,
  describeWait,
  emptyAlarms,
  formatAlarmTime,
  nextAlarmAt,
  parseTimeOfDay,
  sortAlarms,
} from '@shared/alarms'
import { describe, expect, it } from 'vitest'

/**
 * When an alarm goes off next.
 *
 * Everything the alarms do rests on this one function: main schedules a single
 * timer for the soonest of them, so a wrong answer here is an alarm that does
 * not ring - the one failure an alarm must never have.
 */

/** Wednesday, 16 September 2026, 10:00 local. */
const NOW = new Date(2026, 8, 16, 10, 0).getTime()

const alarm = (over: Partial<Alarm> = {}): Alarm => ({
  id: 'a',
  label: 'wake up',
  hour: 7,
  minute: 0,
  days: [],
  enabled: true,
  ...over,
})

const on = (at: number | null): Date => new Date(at ?? 0)

describe('nextAlarmAt', () => {
  it('is tomorrow when the time has gone by today', () => {
    const at = nextAlarmAt(alarm(), NOW)
    expect(on(at).getDate()).toBe(17)
    expect(on(at).getHours()).toBe(7)
  })

  it('is today when the time is still to come', () => {
    const at = nextAlarmAt(alarm({ hour: 12, minute: 30 }), NOW)
    expect(on(at).getDate()).toBe(16)
    expect(on(at).getMinutes()).toBe(30)
  })

  it('skips to the next day it repeats on', () => {
    // Mondays only, from a Wednesday: the 21st.
    const at = nextAlarmAt(alarm({ days: [1] }), NOW)
    expect(on(at).getDate()).toBe(21)
    expect(on(at).getDay()).toBe(1)
  })

  it('takes today when today is one of its days and the time is still to come', () => {
    const at = nextAlarmAt(alarm({ hour: 18, days: [3] }), NOW)
    expect(on(at).getDate()).toBe(16)
  })

  it('is nothing at all while it is switched off', () => {
    expect(nextAlarmAt(alarm({ enabled: false }), NOW)).toBeNull()
  })

  it('does not go off twice for the same moment', () => {
    const at = nextAlarmAt(alarm({ hour: 12 }), NOW)
    const rung = alarm({ hour: 12, lastRangAt: at ?? 0 })
    // Having rung for noon today, the next is noon tomorrow.
    expect(on(nextAlarmAt(rung, NOW)).getDate()).toBe(17)
  })

  it('counts in days rather than in 24 hours, so a clock change does not move it', () => {
    // 07:00 stays 07:00 on the far side of a daylight-saving change; adding
    // 86,400,000 milliseconds would land on 06:00 or 08:00.
    const at = nextAlarmAt(alarm({ days: [0, 1, 2, 3, 4, 5, 6] }), NOW)
    expect(on(at).getHours()).toBe(7)
    expect(on(at).getMinutes()).toBe(0)
  })
})

describe('describeDays', () => {
  it('says what the days are in the fewest words', () => {
    expect(describeDays([])).toBe('once')
    expect(describeDays([0, 1, 2, 3, 4, 5, 6])).toBe('every day')
    expect(describeDays([1, 2, 3, 4, 5])).toBe('weekdays')
    expect(describeDays([0, 6])).toBe('weekends')
    expect(describeDays([5, 1])).toBe('mon fri')
  })
})

describe('describeWait', () => {
  it('is rough on purpose: what matters is tonight or tomorrow', () => {
    expect(describeWait(NOW + 30_000, NOW)).toBe('in 30s')
    expect(describeWait(NOW + 45 * 60_000, NOW)).toBe('in 45m')
    expect(describeWait(NOW + 7 * 3_600_000 + 20 * 60_000, NOW)).toBe('in 7h 20m')
    expect(describeWait(NOW + 2 * 86_400_000, NOW)).toBe('in 2d 0h')
  })
})

describe('parseTimeOfDay', () => {
  it('takes a time however it is typed, Japanese keyboard included', () => {
    expect(parseTimeOfDay('7')).toEqual({ hour: 7, minute: 0 })
    expect(parseTimeOfDay('07:30')).toEqual({ hour: 7, minute: 30 })
    expect(parseTimeOfDay('19.5')).toEqual({ hour: 19, minute: 5 })
    expect(parseTimeOfDay('１９：３０')).toEqual({ hour: 19, minute: 30 })
  })

  it('refuses what is not a time rather than inventing one', () => {
    expect(parseTimeOfDay('')).toBeNull()
    expect(parseTimeOfDay('25:00')).toBeNull()
    expect(parseTimeOfDay('7:99')).toBeNull()
    expect(parseTimeOfDay('lunch')).toBeNull()
  })
})

describe('the file and the list', () => {
  it('reads an empty file as no alarms', () => {
    expect(AlarmsFileSchema.parse({})).toEqual(emptyAlarms())
  })

  it('refuses a time that is not one', () => {
    expect(AlarmsFileSchema.safeParse({ alarms: [{ id: 'a', hour: 24, minute: 0 }] }).success).toBe(
      false,
    )
  })

  it('lists them by time of day', () => {
    const list = sortAlarms([
      alarm({ id: 'noon', hour: 12 }),
      alarm({ id: 'early', hour: 6, minute: 30 }),
      alarm({ id: 'seven', hour: 7 }),
    ])
    expect(list.map((entry) => entry.id)).toEqual(['early', 'seven', 'noon'])
  })

  it('shows a time of day with both digits', () => {
    expect(formatAlarmTime({ hour: 7, minute: 5 })).toBe('07:05')
  })
})
