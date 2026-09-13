/**
 * Japanese national holidays (国民の祝日), computed rather than fetched.
 *
 * The calendar pane has no network, and the holiday law is regular enough to
 * compute: fixed dates, "Happy Monday" dates, the equinoxes from the standard
 * approximation (valid 1980-2099; the official dates are announced a year ahead
 * and have always matched it), substitute holidays (振替休日) and the day
 * sandwiched between two holidays (国民の休日). The one-off moves of 2019-2021
 * (the enthronement and the Tokyo Olympics) are listed explicitly.
 *
 * Covers 2000-2099. Before 2000 the Monday rules did not exist and nothing is
 * returned.
 */

export interface Holiday {
  ja: string
  en: string
}

const H = (ja: string, en: string): Holiday => ({ ja, en })

/** Day of month of the nth Monday. `month` is 1-12. */
function nthMonday(year: number, month: number, nth: number): number {
  const first = new Date(year, month - 1, 1).getDay()
  return 1 + ((8 - first) % 7) + (nth - 1) * 7
}

function equinox(year: number, base: number): number {
  const y = year - 1980
  return Math.floor(base + 0.242194 * y - Math.floor(y / 4))
}

const key = (month: number, day: number): string =>
  `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

function addSummer(year: number, add: (m: number, d: number, h: Holiday) => void): void {
  const marine = H('海の日', 'Marine Day')
  const mountain = H('山の日', 'Mountain Day')
  if (year === 2020) add(7, 23, marine)
  else if (year === 2021) add(7, 22, marine)
  else if (year >= 2003) add(7, nthMonday(year, 7, 3), marine)
  else add(7, 20, marine)
  if (year === 2020) add(8, 10, mountain)
  else if (year === 2021) add(8, 8, mountain)
  else if (year >= 2016) add(8, 11, mountain)
}

function addAutumn(year: number, add: (m: number, d: number, h: Holiday) => void): void {
  add(9, year >= 2003 ? nthMonday(year, 9, 3) : 15, H('敬老の日', 'Respect for the Aged Day'))
  add(9, equinox(year, 23.2488), H('秋分の日', 'Autumnal Equinox Day'))
  const sports =
    year >= 2020 ? H('スポーツの日', 'Sports Day') : H('体育の日', 'Health and Sports Day')
  if (year === 2020) add(7, 24, sports)
  else if (year === 2021) add(7, 23, sports)
  else add(10, nthMonday(year, 10, 2), sports)
  add(11, 3, H('文化の日', 'Culture Day'))
  add(11, 23, H('勤労感謝の日', 'Labour Thanksgiving Day'))
}

/** The holidays the law names, before substitutes and in-between days. */
function namedHolidays(year: number): Map<string, Holiday> {
  const days = new Map<string, Holiday>()
  const add = (m: number, d: number, h: Holiday): void => {
    days.set(key(m, d), h)
  }
  add(1, 1, H('元日', "New Year's Day"))
  add(1, nthMonday(year, 1, 2), H('成人の日', 'Coming of Age Day'))
  add(2, 11, H('建国記念の日', 'National Foundation Day'))
  if (year >= 2020) add(2, 23, H('天皇誕生日', "The Emperor's Birthday"))
  else if (year <= 2018) add(12, 23, H('天皇誕生日', "The Emperor's Birthday"))
  add(3, equinox(year, 20.8431), H('春分の日', 'Vernal Equinox Day'))
  add(4, 29, year >= 2007 ? H('昭和の日', 'Shōwa Day') : H('みどりの日', 'Greenery Day'))
  add(5, 3, H('憲法記念日', 'Constitution Memorial Day'))
  if (year >= 2007) add(5, 4, H('みどりの日', 'Greenery Day'))
  add(5, 5, H('こどもの日', "Children's Day"))
  addSummer(year, add)
  addAutumn(year, add)
  if (year === 2019) {
    add(5, 1, H('天皇の即位の日', 'Enthronement Day'))
    add(10, 22, H('即位礼正殿の儀', 'Enthronement Ceremony'))
  }
  return days
}

/** Every holiday of the year, keyed "MM-DD". Empty outside 2000-2099. */
export function japaneseHolidays(year: number): Map<string, Holiday> {
  if (year < 2000 || year > 2099) return new Map()
  const days = namedHolidays(year)
  const named = [...days.keys()].sort()

  // 国民の休日: a weekday that falls between two holidays.
  for (const k of named) {
    const [m, d] = k.split('-').map(Number) as [number, number]
    const next = new Date(year, m - 1, d + 1)
    const after = new Date(year, m - 1, d + 2)
    const nextKey = key(next.getMonth() + 1, next.getDate())
    const afterKey = key(after.getMonth() + 1, after.getDate())
    if (!days.has(nextKey) && days.has(afterKey) && next.getDay() !== 0) {
      days.set(nextKey, H('国民の休日', "Citizens' Holiday"))
    }
  }

  // 振替休日: a holiday on a Sunday moves to the next day that is not one.
  for (const k of named) {
    const [m, d] = k.split('-').map(Number) as [number, number]
    if (new Date(year, m - 1, d).getDay() !== 0) continue
    const substitute = new Date(year, m - 1, d + 1)
    while (days.has(key(substitute.getMonth() + 1, substitute.getDate()))) {
      substitute.setDate(substitute.getDate() + 1)
    }
    if (substitute.getFullYear() === year) {
      days.set(
        key(substitute.getMonth() + 1, substitute.getDate()),
        H('振替休日', 'Substitute Holiday'),
      )
    }
  }
  return days
}
