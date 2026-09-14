/**
 * Month grids for the calendar pane. Pure, so the edges (weeks that start on
 * Monday, months that need six rows, week numbers at the turn of a year) are
 * unit-tested.
 */

/** Always six weeks, so the pane does not change height from month to month. */
export const GRID_DAYS = 42

/** The dates shown for a month: from the week holding the 1st, 42 days. `month` is 0-11. */
export function monthGrid(year: number, month: number, weekStart: number): Date[] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() - weekStart + 7) % 7
  return Array.from({ length: GRID_DAYS }, (_, i) => new Date(year, month, 1 - lead + i))
}

/** ISO 8601 week number: weeks start on Monday, week 1 holds the year's first Thursday. */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/**
 * The first day of the week for a locale (0 Sunday … 6 Saturday), from
 * Intl.Locale week info where the engine has it. Sunday otherwise, as in Japan
 * and the US.
 */
export function firstDayOfWeek(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    const info = loc.getWeekInfo?.() ?? loc.weekInfo
    // Intl counts 1 Monday … 7 Sunday.
    return info ? info.firstDay % 7 : 0
  } catch {
    return 0
  }
}

/** Milliseconds until the next local midnight, when "today" moves. */
export function msUntilMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

export type WaveDirection = 'next' | 'prev'

/**
 * A day's place in the wave that brings a month in, 0 first and 11 last: along
 * the diagonals from the top-left corner for a later month, from the bottom-right
 * for an earlier one, so the dates sweep in the direction the calendar moved.
 */
export function waveStep(index: number, direction: WaveDirection): number {
  const row = Math.floor(index / 7)
  const column = index % 7
  return direction === 'next' ? row + column : 5 - row + (6 - column)
}

/** The direction from the month shown to another, or null when it is the same month. */
export function waveTowards(from: Date, to: Date): WaveDirection | null {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
  return months === 0 ? null : months > 0 ? 'next' : 'prev'
}
