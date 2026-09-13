import { describe, expect, it } from 'vitest'
import { japaneseHolidays } from '../../src/shared/jp-holidays.js'

const holidayOn = (date: Date) =>
  japaneseHolidays(date.getFullYear()).get(
    `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  )

/** Checked against the Cabinet Office's published lists (内閣府「国民の祝日について」). */
const PUBLISHED: Record<number, string> = {
  2019: '01-01 01-14 02-11 03-21 04-29 04-30 05-01 05-02 05-03 05-04 05-05 05-06 07-15 08-11 08-12 09-16 09-23 10-14 10-22 11-03 11-04 11-23',
  2020: '01-01 01-13 02-11 02-23 02-24 03-20 04-29 05-03 05-04 05-05 05-06 07-23 07-24 08-10 09-21 09-22 11-03 11-23',
  2021: '01-01 01-11 02-11 02-23 03-20 04-29 05-03 05-04 05-05 07-22 07-23 08-08 08-09 09-20 09-23 11-03 11-23',
  2025: '01-01 01-13 02-11 02-23 02-24 03-20 04-29 05-03 05-04 05-05 05-06 07-21 08-11 09-15 09-23 10-13 11-03 11-23 11-24',
  2026: '01-01 01-12 02-11 02-23 03-20 04-29 05-03 05-04 05-05 05-06 07-20 08-11 09-21 09-22 09-23 10-12 11-03 11-23',
}

describe('Japanese holidays', () => {
  for (const [year, list] of Object.entries(PUBLISHED)) {
    it(`matches the published list for ${year}`, () => {
      expect([...japaneseHolidays(Number(year)).keys()].sort()).toEqual(list.split(' '))
    })
  }

  it('names substitute and in-between days', () => {
    expect(holidayOn(new Date(2026, 4, 6))?.ja).toBe('振替休日')
    expect(holidayOn(new Date(2026, 8, 22))).toEqual({ ja: '国民の休日', en: "Citizens' Holiday" })
    expect(holidayOn(new Date(2026, 8, 21))?.en).toBe('Respect for the Aged Day')
    expect(holidayOn(new Date(2026, 8, 24))).toBeUndefined()
  })

  it('returns nothing outside the years it covers', () => {
    expect(japaneseHolidays(1999).size).toBe(0)
    expect(japaneseHolidays(2100).size).toBe(0)
  })
})
