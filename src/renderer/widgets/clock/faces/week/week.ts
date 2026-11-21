import { isoWeek } from '../../../../lib/calendar.js'
import { MONTHS, WEEKDAYS } from '../../parts/words.js'

/**
 * WEEK's days: the seven days of the week `now` is in, from the week's first day, each with
 * how much of it has gone - so the seven bars under them read as the week's progress.
 */

export interface WeekDay {
  /** Local midnight of the day, as a key. */
  key: number
  weekday: string
  day: number
  /** The month's short name, for the first day of the week and the first of a month. */
  month: string | null
  today: boolean
  /** 0 before the day, 1 after it, the share gone today. */
  gone: number
}

/** The week around `now`, starting on `weekStart` (0 Sunday … 6 Saturday). */
export function weekDays(now: Date, weekStart: number): WeekDay[] {
  const back = (now.getDay() - weekStart + 7) % 7
  const days: WeekDay[] = []
  for (let i = 0; i < 7; i++) {
    // By date, not by adding 24 hours: a day of daylight saving has 23 or 25.
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back + i)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
    const t = now.getTime()
    const gone =
      t >= end.getTime()
        ? 1
        : t < start.getTime()
          ? 0
          : (t - start.getTime()) / (end.getTime() - start.getTime())
    days.push({
      key: start.getTime(),
      weekday: WEEKDAYS[start.getDay()] as string,
      day: start.getDate(),
      month: i === 0 || start.getDate() === 1 ? (MONTHS[start.getMonth()] as string) : null,
      today: t >= start.getTime() && t < end.getTime(),
      gone,
    })
  }
  return days
}

/** The line under a tall WEEK: "NOV 2026 · W47". */
export function weekCaption(now: Date): string {
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()} · W${isoWeek(now)}`
}
