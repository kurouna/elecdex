import type { Alarm } from '@shared/alarms'
import type { Task } from '@shared/tasks'
import { describe, expect, it } from 'vitest'
import {
  AHEAD_SPAN_MS,
  aheadEvents,
  aheadX,
  nextMidnight,
  untilLabel,
} from '../../src/renderer/widgets/clock/faces/ahead/ahead.js'
import {
  dialLayout,
  dialTicks,
  handAngles,
} from '../../src/renderer/widgets/clock/faces/dial/dial.js'
import {
  bandLight,
  cityMarks,
  daylight,
  LONGITUDE_CITIES,
  OFFSET_MAX,
  OFFSET_MIN,
  offsetX,
} from '../../src/renderer/widgets/clock/faces/longitude/longitude.js'
import {
  nightSpans,
  tapeHours,
  tapeMarks,
} from '../../src/renderer/widgets/clock/faces/tape/tape.js'
import { weekCaption, weekDays } from '../../src/renderer/widgets/clock/faces/week/week.js'
import {
  besideMark,
  STRIP_GAP,
  STRIP_PAD,
  stripMetrics,
  TALL_FROM,
} from '../../src/renderer/widgets/clock/parts/strip.js'
import { MONTHS, WEEKDAYS } from '../../src/renderer/widgets/clock/parts/words.js'

/**
 * The pure parts of the WEEK, TAPE, LONGITUDE, AHEAD and DIAL faces: what each draws, worked
 * out from the time alone, so the components only place it. Local times below are the test
 * process's own zone; each case builds its moments with `new Date(y, m, d, ...)` so it holds in
 * any zone.
 */

const HOUR = 3_600_000
const MIN = 60_000

describe('WEEK', () => {
  // Saturday 21 November 2026, 22:51.
  const now = new Date(2026, 10, 21, 22, 51)

  it('lays out the week around today from its first day, today lit', () => {
    const days = weekDays(now, 0)
    expect(days.map((d) => d.weekday)).toEqual(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
    expect(days.map((d) => d.day)).toEqual([15, 16, 17, 18, 19, 20, 21])
    expect(days.filter((d) => d.today).map((d) => d.day)).toEqual([21])
  })

  it('starts on Monday where the week does', () => {
    expect(weekDays(now, 1).map((d) => d.day)).toEqual([16, 17, 18, 19, 20, 21, 22])
  })

  it('fills the days gone, part of today, none of the days to come', () => {
    const days = weekDays(new Date(2026, 10, 18, 12, 0), 0)
    expect(days.map((d) => d.gone)).toEqual([1, 1, 1, 0.5, 0, 0, 0])
  })

  it('names the month on the week’s first day and on the first of a month', () => {
    const days = weekDays(new Date(2026, 10, 30, 9), 0)
    expect(days.map((d) => d.month)).toEqual(['NOV', null, 'DEC', null, null, null, null])
  })

  it('writes the month, the year and the ISO week under a tall face', () => {
    expect(weekCaption(now)).toBe('NOV 2026 · W47')
  })
})

describe('the strip the band faces share (AHEAD, TAPE, LONGITUDE)', () => {
  it('gives the band what the time, both paddings and the gap between leave (review 2026-11-22)', () => {
    // The padding on each side and the gap to the time: the band once took only the paddings
    // off and ran into the right-hand padding.
    expect(STRIP_PAD).toBe(12)
    expect(STRIP_GAP).toBe(12)
    const m = stripMetrics(340, 80, 90)
    expect(m.tall).toBe(false)
    expect(m.bandWidth).toBe(340 - 90 - 2 * STRIP_PAD - STRIP_GAP)
  })

  it('stacks the time over the band from TALL_FROM, the band then the full inner width', () => {
    const m = stripMetrics(340, TALL_FROM, 90)
    expect(m.tall).toBe(true)
    expect(m.bandWidth).toBe(340 - 2 * STRIP_PAD)
    expect(stripMetrics(340, TALL_FROM - 1, 90).tall).toBe(false)
  })

  it('never gives the band less than nothing, and sizes the time by the room', () => {
    expect(stripMetrics(100, 40, 120).bandWidth).toBe(0)
    expect(stripMetrics(340, 80, 90).size).toBeCloseTo(Math.min(80 * 0.66, 340 * 0.11))
    expect(stripMetrics(340, 32, 90).size).toBeGreaterThanOrEqual(12)
  })

  it('puts a label beside a mark with the gap asked for, or before it at the band’s end', () => {
    // The nearest event's name: 7 px from its marker, never over it (review 2026-11-22).
    expect(besideMark(100, 300, 'x'.repeat(10), 10, 7)).toMatchObject({ x: 107, anchor: 'start' })
    const end = besideMark(280, 300, 'x'.repeat(10), 10, 7)
    expect(end).toMatchObject({ x: 273, anchor: 'end' })
  })

  it('names the days and months once, for every face', () => {
    expect(WEEKDAYS).toEqual(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
    expect(MONTHS).toHaveLength(12)
    expect(MONTHS[10]).toBe('NOV')
  })
})

describe('TAPE', () => {
  it('starts at the first quarter at or after `from`, whatever its seconds (review 2026-11-22)', () => {
    const from = new Date(2026, 10, 21, 12, 0, 30).getTime()
    const marks = tapeMarks(from, from + 20 * MIN)
    expect(marks[0]?.at).toBe(new Date(2026, 10, 21, 12, 15).getTime())
    expect(marks.every((m) => m.at >= from)).toBe(true)
    // A whole quarter is its own first mark.
    const onQuarter = new Date(2026, 10, 21, 12, 15).getTime()
    expect(tapeMarks(onQuarter, onQuarter + MIN)[0]?.at).toBe(onQuarter)
  })

  it('marks quarters, labels hours, and names midnight by the day it begins', () => {
    const from = new Date(2026, 10, 21, 23, 0).getTime()
    const marks = tapeMarks(from, from + HOUR)
    expect(marks.map((m) => [m.kind, m.label])).toEqual([
      ['hour', '23'],
      ['quarter', null],
      ['quarter', null],
      ['quarter', null],
      ['day', 'SUN'],
    ])
  })

  it('leaves the quarters out when they would crowd', () => {
    const from = new Date(2026, 10, 21, 10, 7).getTime()
    expect(tapeMarks(from, from + 2 * HOUR, false).map((m) => m.label)).toEqual(['11', '12'])
  })

  it('shades the night from 18:00 to 06:00, the one begun yesterday included', () => {
    const from = new Date(2026, 10, 21, 4, 0).getTime()
    const to = new Date(2026, 10, 21, 20, 0).getTime()
    expect(nightSpans(from, to)).toEqual([
      { from, to: new Date(2026, 10, 21, 6).getTime() },
      { from: new Date(2026, 10, 21, 18).getTime(), to },
    ])
  })

  it('shows between 3 and 12 hours, about 55 px each', () => {
    expect(tapeHours(100)).toBe(3)
    expect(tapeHours(330)).toBe(6)
    expect(tapeHours(2000)).toBe(12)
  })
})

describe('LONGITUDE', () => {
  it('spreads UTC-11 to UTC+14 across the band', () => {
    expect(offsetX(OFFSET_MIN, 250)).toBe(0)
    expect(offsetX(OFFSET_MAX, 250)).toBe(250)
    expect(offsetX(0, 250)).toBe(110)
  })

  it('is day from 7 to 17, night from 19 to 5, and in between at dawn and dusk', () => {
    expect(daylight(12)).toBe(1)
    expect(daylight(2)).toBe(0)
    expect(daylight(6)).toBe(0.5)
    expect(daylight(18)).toBe(0.5)
    expect(daylight(-2)).toBe(0)
  })

  it('lights the band by the hour at each offset', () => {
    // 12:00 UTC: noon at UTC+0, midnight at UTC+12.
    const light = bandLight(Date.UTC(2026, 10, 21, 12), 25)
    expect(light[11]).toBe(1)
    expect(light[23]).toBe(0)
  })

  it('places each city at its offset with its own time, here left to the marker', () => {
    const now = Date.UTC(2026, 10, 21, 13, 51)
    const marks = cityMarks(now, 540, 1000, 10)
    expect(marks.find((m) => m.code === 'TYO')).toBeUndefined()
    const lon = marks.find((m) => m.code === 'LON')
    expect(lon).toMatchObject({ offset: 0, hh: '13', mm: '51' })
    expect(marks.find((m) => m.code === 'DEL')).toMatchObject({ offset: 330, hh: '19', mm: '21' })
    // In order across the band.
    expect(marks.map((m) => m.offset)).toEqual(
      [...marks.map((m) => m.offset)].sort((a, b) => a - b),
    )
  })

  it('drops cities that would be drawn over one already there, keeping those nearest here', () => {
    const now = Date.UTC(2026, 10, 21, 13, 51)
    const crowded = cityMarks(now, 540, 200, 40)
    expect(crowded.length).toBeLessThan(LONGITUDE_CITIES.length - 1)
    for (let i = 1; i < crowded.length; i++) {
      const a = crowded[i - 1]
      const b = crowded[i]
      if (a && b) expect(offsetX(b.offset, 200) - offsetX(a.offset, 200)).toBeGreaterThanOrEqual(40)
    }
  })
})

describe('AHEAD', () => {
  const now = new Date(2026, 10, 21, 22, 0).getTime()
  const alarm = (over: Partial<Alarm>): Alarm =>
    ({ id: 'a1', label: '', hour: 7, minute: 0, days: [], enabled: true, ...over }) as Alarm
  const task = (over: Partial<Task>): Task =>
    ({
      id: 't1',
      listId: 'l',
      title: 'Ship it',
      done: false,
      order: 0,
      createdAt: 0,
      updatedAt: 0,
      ...over,
    }) as Task

  it('gives the coming minutes most of the width on a log scale', () => {
    expect(aheadX(0, 300)).toBe(0)
    expect(aheadX(AHEAD_SPAN_MS, 300)).toBeCloseTo(300)
    expect(aheadX(HOUR, 300)).toBeGreaterThan(300 * 0.4)
    expect(aheadX(2 * AHEAD_SPAN_MS, 300)).toBeCloseTo(300)
  })

  it('stands the next 24 hours’ alarms and due tasks on it, soonest first', () => {
    const events = aheadEvents(
      [
        alarm({ label: 'wake' }),
        alarm({ id: 'a2', enabled: false }),
        alarm({ id: 'a3', hour: 22, minute: 30 }),
      ],
      [
        task({ due: now + 10 * MIN }),
        task({ id: 't2', due: now + 30 * HOUR }),
        task({ id: 't3', due: now + 5 * MIN, done: true }),
        task({ id: 't4', due: now - MIN }),
      ],
      now,
    )
    expect(events.map((e) => [e.key, e.label])).toEqual([
      ['t:t1', 'Ship it'],
      ['a:a3', 'alarm'],
      ['a:a1', 'wake'],
    ])
  })

  it('follows a snoozed task to its new time', () => {
    const events = aheadEvents([], [task({ due: now - HOUR, snoozedUntil: now + 20 * MIN })], now)
    expect(events[0]?.at).toBe(now + 20 * MIN)
  })

  it('says how long until it as briefly as it can', () => {
    expect(untilLabel(7 * MIN)).toBe('7m')
    expect(untilLabel(30_000)).toBe('1m')
    expect(untilLabel(125 * MIN)).toBe('2h05')
    expect(untilLabel(3 * HOUR)).toBe('3h')
    expect(untilLabel(18 * HOUR + 20 * MIN)).toBe('18h')
  })

  it('puts a label beside its mark, or before it at the band’s end', () => {
    expect(besideMark(100, 300, 'MON', 10)).toMatchObject({ x: 103, anchor: 'start' })
    // Found in the e2e at 00:25: midnight's day ran past the right edge.
    expect(besideMark(295, 300, 'MON', 10)).toMatchObject({ x: 292, anchor: 'end' })
  })

  it('marks the next midnight', () => {
    expect(nextMidnight(now)).toBe(new Date(2026, 10, 22).getTime())
  })
})

describe('DIAL', () => {
  it('points the hands from twelve, the second hand stepping', () => {
    expect(handAngles(new Date(2026, 10, 21, 3, 0, 0))).toEqual({ hour: 90, minute: 0, second: 0 })
    const h = handAngles(new Date(2026, 10, 21, 15, 30, 15))
    expect(h.second).toBe(90)
    expect(h.minute).toBeCloseTo(181.5)
    expect(h.hour).toBeCloseTo(105.125)
  })

  it('keeps the dial and the figures on one line in the strip and a wide pane', () => {
    expect(dialLayout(340, 80).stacked).toBe(false)
    expect(dialLayout(960, 540).stacked).toBe(false)
    expect(dialLayout(340, 80).diameter).toBe(72)
  })

  it('stacks them in a pane taller than it is wide, the dial as large as the width allows', () => {
    const l = dialLayout(200, 200)
    expect(l.stacked).toBe(true)
    expect(l.diameter).toBeLessThanOrEqual(200 - 24)
    expect(l.diameter + l.size * 1.2).toBeLessThanOrEqual(200)
  })

  it('draws sixty ticks, or only the twelve on a small dial', () => {
    expect(dialTicks(200)).toHaveLength(60)
    expect(dialTicks(28)).toHaveLength(12)
    expect(dialTicks(28).every((t) => t.major)).toBe(true)
  })
})
