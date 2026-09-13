import { z } from 'zod'

/**
 * JMA forecast data: the raw shape main fetches and validates, and the per-day
 * summary the weather widget renders.
 *
 * Source: 気象庁ホームページ (https://www.jma.go.jp/bosai/forecast/). The JSON is
 * what JMA's own forecast pages load; it is not a documented API, so everything
 * here parses leniently and treats a missing field as "no data" rather than an
 * error.
 */

/** Office codes are six digits, e.g. 130000 for Tokyo. */
export const OFFICE_CODE = /^\d{6}$/
export const isOfficeCode = (value: unknown): value is string =>
  typeof value === 'string' && OFFICE_CODE.test(value)

/** Where attribution links to, as JMA's terms require. */
export const JMA_FORECAST_URL = 'https://www.jma.go.jp/bosai/forecast/'

const Area = z.object({ name: z.string(), code: z.string() })

const TimeSeries = z.object({
  timeDefines: z.array(z.string()),
  areas: z.array(
    z
      .object({
        area: Area,
        weatherCodes: z.array(z.string()).optional(),
        weathers: z.array(z.string()).optional(),
        winds: z.array(z.string()).optional(),
        pops: z.array(z.string()).optional(),
        reliabilities: z.array(z.string()).optional(),
        temps: z.array(z.string()).optional(),
        tempsMin: z.array(z.string()).optional(),
        tempsMax: z.array(z.string()).optional(),
      })
      .loose(),
  ),
})

const Report = z
  .object({
    publishingOffice: z.string(),
    reportDatetime: z.string(),
    timeSeries: z.array(TimeSeries),
  })
  .loose()

export const JmaForecastSchema = z.array(Report).min(1)
export type JmaForecast = z.infer<typeof JmaForecastSchema>

export interface WeatherUpdate {
  office: string
  /** Validated forecast JSON, or null if none has been fetched yet. */
  forecast: JmaForecast | null
  /** When main last received data (not a 304), ms since epoch. */
  fetchedAt: number | null
  /** The last fetch failed with this message; any forecast shown is older. */
  error: string | null
}

export interface OfficeInfo {
  code: string
  name: string
  enName: string
}

export interface DayForecast {
  /** Local date in Japan, YYYY-MM-DD. */
  date: string
  code: string | null
  /** JMA's own wording; the first three days only. */
  text: string | null
  wind: string | null
  /** Highest chance of precipitation for the day, percent. */
  pop: number | null
  /** Six-hour chances for 00-06, 06-12, 12-18, 18-24; null for past or unknown blocks. */
  popBlocks: Array<number | null> | null
  tempMin: number | null
  tempMax: number | null
  /** Weekly forecast confidence, A (high) to C. */
  reliability: string | null
}

export interface ForecastSummary {
  publishingOffice: string
  reportDatetime: string
  area: { code: string; name: string }
  areas: Array<{ code: string; name: string }>
  /** Temperatures are for this observation point. */
  point: string | null
  days: DayForecast[]
}

const num = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** The Japan date and hour of a JMA timestamp, which always carries +09:00. */
function jst(iso: string): { date: string; hour: number } {
  const date = iso.slice(0, 10)
  const hour = Number(iso.slice(11, 13))
  return { date, hour: Number.isFinite(hour) ? hour : 0 }
}

/**
 * Condenses a forecast into one entry per day for one area.
 *
 * The JSON holds two reports. The first (short-term) has, per area, weather for
 * three days, six-hourly precipitation chances, and morning-minimum/daytime-
 * maximum temperatures per observation point. The second (weekly) has seven
 * days of codes, chances and temperatures. Short-term values win where both
 * cover a day.
 */
export function summarizeForecast(
  forecast: JmaForecast,
  areaCode?: string,
): ForecastSummary | null {
  const [short, weekly] = forecast
  if (!short) return null

  const weatherSeries = short.timeSeries[0]
  const popSeries = short.timeSeries[1]
  const tempSeries = short.timeSeries[2]
  if (!weatherSeries) return null

  const areas = weatherSeries.areas.map((a) => a.area)
  const index = Math.max(
    0,
    areas.findIndex((a) => a.code === areaCode),
  )
  const area = areas[index]
  if (!area) return null

  const days = new Map<string, DayForecast>()
  const day = (date: string): DayForecast => {
    let entry = days.get(date)
    if (!entry) {
      entry = {
        date,
        code: null,
        text: null,
        wind: null,
        pop: null,
        popBlocks: null,
        tempMin: null,
        tempMax: null,
        reliability: null,
      }
      days.set(date, entry)
    }
    return entry
  }

  // Short-term weather.
  const weather = weatherSeries.areas[index]
  weatherSeries.timeDefines.forEach((time, i) => {
    const d = day(jst(time).date)
    d.code = weather?.weatherCodes?.[i] ?? null
    // JMA separates words with full-width spaces for its narrow layout.
    d.text = weather?.weathers?.[i]?.replace(/　/g, '') ?? null
    d.wind = weather?.winds?.[i]?.replace(/　/g, ' ') ?? null
  })

  // Six-hourly chances of precipitation.
  const pops = popSeries?.areas.find((a) => a.area.code === area.code) ?? popSeries?.areas[index]
  popSeries?.timeDefines.forEach((time, i) => {
    const { date, hour } = jst(time)
    const value = num(pops?.pops?.[i])
    const d = day(date)
    d.popBlocks ??= [null, null, null, null]
    d.popBlocks[Math.min(3, Math.floor(hour / 6))] = value
    if (value !== null) d.pop = Math.max(d.pop ?? 0, value)
  })

  // Temperatures: a 00:00 entry is the morning minimum, a 09:00 entry the daytime
  // maximum. Once the morning has passed JMA repeats the maximum in the minimum's
  // place, which is not a real minimum.
  const temps = tempSeries?.areas[index] ?? tempSeries?.areas[0]
  const point = temps?.area.name ?? null
  const seen = new Map<string, { min?: number; max?: number }>()
  tempSeries?.timeDefines.forEach((time, i) => {
    const { date, hour } = jst(time)
    const value = num(temps?.temps?.[i])
    if (value === null) return
    const entry = seen.get(date) ?? {}
    if (hour < 9) entry.min = value
    else entry.max = value
    seen.set(date, entry)
  })
  const firstDate = weatherSeries.timeDefines[0] ? jst(weatherSeries.timeDefines[0]).date : null
  for (const [date, { min, max }] of seen) {
    const d = day(date)
    d.tempMax = max ?? null
    d.tempMin = date === firstDate && min === max ? null : (min ?? null)
  }

  // Weekly forecast fills in the rest, and temperatures the short-term one lacks.
  const weekWeather = weekly?.timeSeries[0]
  const weekTemps = weekly?.timeSeries[1]
  const weekArea =
    weekWeather?.areas.find((a) => a.area.code === area.code) ?? weekWeather?.areas[0]
  const weekPoint =
    weekTemps?.areas.find((a) => a.area.code === temps?.area.code) ?? weekTemps?.areas[0]

  weekWeather?.timeDefines.forEach((time, i) => {
    const d = day(jst(time).date)
    d.code ??= weekArea?.weatherCodes?.[i] ?? null
    if (d.popBlocks === null) d.pop ??= num(weekArea?.pops?.[i])
    d.reliability = weekArea?.reliabilities?.[i]?.trim() || null
  })
  weekTemps?.timeDefines.forEach((time, i) => {
    const d = day(jst(time).date)
    d.tempMin ??= num(weekPoint?.tempsMin?.[i])
    d.tempMax ??= num(weekPoint?.tempsMax?.[i])
  })

  return {
    publishingOffice: short.publishingOffice,
    reportDatetime: short.reportDatetime,
    area,
    areas,
    point,
    days: [...days.values()]
      .filter((d) => d.code !== null)
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/**
 * When JMA's forecasts are published, in Japan hours. Short-term forecasts come
 * out at 5, 11 and 17; the 0 o'clock slot is checked as well.
 */
export const PUBLICATION_HOURS_JST = [0, 5, 11, 17] as const

/**
 * Minutes around each slot at which to look for a new forecast. The file often
 * appears ten minutes early (the 11:00 report was modified at 10:49), and
 * occasionally late. Requests are conditional, so an unchanged file costs a 304.
 */
export const CHECK_OFFSETS_MIN = [-12, 3, 20] as const

const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** Every check time within the day around `now`, ascending, in ms since epoch. */
function checkTimesAround(now: number): number[] {
  const jstMidnight = Math.floor((now + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS
  const times: number[] = []
  for (const dayStart of [jstMidnight - DAY_MS, jstMidnight, jstMidnight + DAY_MS]) {
    for (const hour of PUBLICATION_HOURS_JST) {
      for (const offset of CHECK_OFFSETS_MIN) {
        times.push(dayStart + hour * 3_600_000 + offset * 60_000)
      }
    }
  }
  return times.sort((a, b) => a - b)
}

/** The next moment after `now` at which a new forecast may have been published. */
export function nextCheckAt(now: number): number {
  return checkTimesAround(now).find((t) => t > now) ?? now + 60 * 60 * 1000
}

/** The latest check moment at or before `now`: data fetched before it may be stale. */
export function lastCheckAt(now: number): number {
  return (
    checkTimesAround(now)
      .filter((t) => t <= now)
      .at(-1) ?? now
  )
}
