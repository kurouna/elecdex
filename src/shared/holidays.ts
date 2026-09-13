import { japaneseHolidays } from './jp-holidays.js'

/**
 * The national holiday calendars the calendar pane can mark.
 *
 * Each country is a pure function from a year to its holidays, computed
 * locally - no network, no yearly data to refresh. Adding a country (the United
 * States, say) is one module with its rules and one entry here; the pane's
 * settings list every entry as a checkbox.
 */
export interface HolidayCalendar {
  /** Stored in pane state; never change one once released. */
  id: string
  /** Shown in the settings panel. */
  name: string
  /** Short tag shown with a holiday's name when more than one country is on. */
  tag: string
  /** Holidays of a year, keyed "MM-DD", with English names. */
  holidays(year: number): Map<string, { en: string }>
}

export const HOLIDAY_CALENDARS: readonly HolidayCalendar[] = [
  { id: 'jp', name: 'Japan', tag: 'JP', holidays: japaneseHolidays },
]

export interface HolidayMark {
  /** Calendar id. */
  country: string
  name: string
}

const key = (date: Date): string =>
  `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Keeps only ids that name a calendar, once each, in registry order. */
export function knownCalendars(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  return HOLIDAY_CALENDARS.filter((c) => ids.includes(c.id)).map((c) => c.id)
}

/**
 * Reads the pane's holiday choice. Before the settings panel it was a single
 * string ('jp' or 'none'), which is still honoured.
 */
export function holidayChoice(state: Record<string, unknown> | undefined): string[] {
  const value = state?.holidays
  if (typeof value === 'string') return knownCalendars([value])
  return knownCalendars(value)
}

/**
 * A memo of holiday tables by calendar and year: the pane asks for 42 days at a
 * time and the next holiday up to a year ahead.
 */
export function holidayLookup(ids: readonly string[]): (date: Date) => HolidayMark[] {
  const calendars = HOLIDAY_CALENDARS.filter((c) => ids.includes(c.id))
  const tables = new Map<string, Map<string, { en: string }>>()
  return (date) => {
    const marks: HolidayMark[] = []
    for (const calendar of calendars) {
      const cacheKey = `${calendar.id}:${date.getFullYear()}`
      let table = tables.get(cacheKey)
      if (!table) {
        table = calendar.holidays(date.getFullYear())
        tables.set(cacheKey, table)
      }
      const holiday = table.get(key(date))
      if (holiday) marks.push({ country: calendar.id, name: holiday.en })
    }
    return marks
  }
}

/** "New Year's Day", or "New Year's Day (JP) · …" when several countries are on. */
export function describeMarks(marks: readonly HolidayMark[], tagged: boolean): string {
  return marks
    .map((m) => {
      const tag = HOLIDAY_CALENDARS.find((c) => c.id === m.country)?.tag
      return tagged && tag ? `${m.name} (${tag})` : m.name
    })
    .join(' · ')
}
