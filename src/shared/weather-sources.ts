import { z } from 'zod'
import { glyphFor } from './jma-weather-codes.js'
import { JMA_FORECAST_URL, type JmaForecast, summarizeForecast } from './weather.js'
import {
  localDate,
  localHour,
  roundCoordinate,
  type SkyGlyph,
  type SkyKind,
  type WeatherDay,
  type WeatherLocation,
  type WeatherReport,
  type WeatherSource,
} from './weather-report.js'

/**
 * Each source's format, turned into a WeatherReport. Pure: the providers in
 * main fetch, these only read, and every one is unit-tested against captured
 * responses.
 */

export const SOURCES: Record<'jma' | 'met' | 'nws', WeatherSource> = {
  jma: {
    id: 'jma',
    name: 'Japan Meteorological Agency',
    credit: `出典：気象庁ホームページ（${JMA_FORECAST_URL}）を加工して作成`,
    url: JMA_FORECAST_URL,
  },
  met: {
    id: 'met',
    name: 'MET Norway',
    // CC BY 4.0: credit, a link to the licence, and that the data was changed.
    credit: 'Weather data: MET Norway, CC BY 4.0 (summarised by elecdex)',
    url: 'https://api.met.no/doc/License',
  },
  nws: {
    id: 'nws',
    name: 'National Weather Service',
    credit: 'Source: National Weather Service (NOAA)',
    url: 'https://www.weather.gov/',
  },
}

/**
 * The source's own forecast page for this place, opened when the forecast is
 * clicked - the same gesture as an earthquake in the quakes pane.
 *
 * JMA's page takes the office in its hash; there is no deep link to a class10
 * area (`area_type=class10s` falls back to the whole country), so it opens the
 * prefecture and the page's own area picker takes it from there. MET Norway's
 * data is read on yr.no, the site it runs with NRK, which takes coordinates;
 * the NWS point forecast takes them as query parameters.
 */
export function forecastPageUrl(location: WeatherLocation): string {
  if (location.source === 'jma') {
    return `${JMA_FORECAST_URL}#area_type=offices&area_code=${location.office}`
  }
  const lat = roundCoordinate(location.lat)
  const lon = roundCoordinate(location.lon)
  if (location.source === 'nws') {
    return `https://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}`
  }
  return `https://www.yr.no/en/forecast/daily-table/${lat},${lon}`
}

const glyph = (primary: SkyKind, label: string, secondary: SkyKind | null = null): SkyGlyph => ({
  primary,
  secondary,
  transition: secondary === null ? null : 'sometimes',
  label,
})

// ---------------------------------------------------------------------------
// JMA
// ---------------------------------------------------------------------------

export function jmaReport(
  forecast: JmaForecast,
  areaCode: string | undefined,
): WeatherReport | null {
  const summary = summarizeForecast(forecast, areaCode)
  if (summary === null) return null
  return {
    source: SOURCES.jma,
    place: summary.area.name,
    timeZone: 'Asia/Tokyo',
    issuedAt: summary.reportDatetime,
    now: null,
    days: summary.days.map((d) => ({
      date: d.date,
      sky: d.code === null ? null : glyphFor(d.code),
      text: d.text,
      tempMin: d.tempMin,
      tempMax: d.tempMax,
      pop: d.pop,
      precipMm: null,
      wind: d.wind,
      blocks: d.popBlocks?.map((p) => (p === null ? null : { pop: p, precipMm: null })) ?? null,
    })),
    areas: summary.areas,
    areaCode: summary.area.code,
  }
}

// ---------------------------------------------------------------------------
// MET Norway: Locationforecast 2.0 (complete)
// ---------------------------------------------------------------------------

const MetPeriod = z
  .object({
    summary: z.object({ symbol_code: z.string() }).loose().optional(),
    details: z
      .object({
        precipitation_amount: z.number().optional(),
        probability_of_precipitation: z.number().optional(),
        air_temperature_max: z.number().optional(),
        air_temperature_min: z.number().optional(),
      })
      .loose()
      .optional(),
  })
  .loose()

export const MetForecastSchema = z
  .object({
    properties: z
      .object({
        meta: z.object({ updated_at: z.string() }).loose(),
        timeseries: z.array(
          z
            .object({
              time: z.string(),
              data: z
                .object({
                  instant: z
                    .object({
                      details: z
                        .object({
                          air_temperature: z.number().optional(),
                          wind_speed: z.number().optional(),
                        })
                        .loose(),
                    })
                    .loose(),
                  next_1_hours: MetPeriod.optional(),
                  next_6_hours: MetPeriod.optional(),
                  next_12_hours: MetPeriod.optional(),
                })
                .loose(),
            })
            .loose(),
        ),
      })
      .loose(),
  })
  .loose()
export type MetForecast = z.infer<typeof MetForecastSchema>

/** How much a sky matters when a day has several: the worst weather of the day is its weather. */
const SEVERITY: Record<SkyKind, number> = {
  clear: 0,
  fog: 1,
  cloudy: 2,
  rain: 3,
  snow: 4,
  thunder: 5,
}

/**
 * MET Norway's symbol codes ("lightrainshowers_day") as a glyph. The table has
 * about forty bases; they are read by their words rather than listed one by one.
 */
/** Bases that name the whole sky on their own. */
const PLAIN_SKIES: Record<string, SkyGlyph> = {
  clearsky: glyph('clear', 'clear sky'),
  fair: glyph('clear', 'fair'),
  partlycloudy: glyph('clear', 'partly cloudy', 'cloudy'),
  cloudy: glyph('cloudy', 'cloudy'),
  fog: glyph('fog', 'fog'),
}

/** The precipitation a base names: "sleet" and "snow" freeze, "rain" and "drizzle" do not. */
function precipitationIn(base: string): SkyKind | null {
  if (/snow|sleet/.test(base)) return 'snow'
  if (/rain|drizzle/.test(base)) return 'rain'
  return null
}

export function metGlyph(symbol: string): SkyGlyph {
  const base = symbol.replace(/_(day|night|polartwilight)$/, '')
  const plain = PLAIN_SKIES[base]
  if (plain) return plain
  const label = base.replace(/andthunder/, ' and thunder').replace(/(light|heavy)/, '$1 ')
  const thunder = base.includes('thunder')
  const falling = precipitationIn(base)
  // Showers come and go between sunny spells; steady rain does not.
  if (base.includes('showers')) return glyph(thunder ? 'thunder' : 'cloudy', label, falling)
  if (thunder) return glyph('thunder', label, falling)
  return glyph(falling ?? 'cloudy', label)
}

const severity = (g: SkyGlyph): number =>
  Math.max(SEVERITY[g.primary], g.secondary ? SEVERITY[g.secondary] - 0.5 : 0)

interface DayAccumulator {
  day: WeatherDay
  worst: SkyGlyph | null
}

function emptyDay(date: string): WeatherDay {
  return {
    date,
    sky: null,
    text: null,
    tempMin: null,
    tempMax: null,
    pop: null,
    precipMm: null,
    wind: null,
    blocks: [null, null, null, null],
  }
}

const HOUR_MS = 3_600_000

const round1 = (n: number) => Math.round(n * 10) / 10
const minOf = (a: number | null, b: number | undefined) =>
  b === undefined ? a : a === null ? b : Math.min(a, b)
const maxOf = (a: number | null, b: number | undefined) =>
  b === undefined ? a : a === null ? b : Math.max(a, b)

type MetEntry = MetForecast['properties']['timeseries'][number]

/** Adds one period's precipitation to its day and its six-hour block. */
function addPrecipitation(day: WeatherDay, hour: number, entry: MetEntry): void {
  const period = entry.data.next_1_hours ?? entry.data.next_6_hours
  const amount = period?.details?.precipitation_amount
  if (amount !== undefined) {
    day.precipMm = round1((day.precipMm ?? 0) + amount)
    const blocks = day.blocks as NonNullable<WeatherDay['blocks']>
    const block = Math.min(3, Math.floor(hour / 6))
    blocks[block] = { pop: null, precipMm: round1((blocks[block]?.precipMm ?? 0) + amount) }
  }
  day.pop = maxOf(day.pop, period?.details?.probability_of_precipitation)
}

/** Keeps the worst six-hour sky of the daytime (06:00-18:00 starts). */
function worstSky(worst: SkyGlyph | null, hour: number, entry: MetEntry): SkyGlyph | null {
  const symbol = entry.data.next_6_hours?.summary?.symbol_code
  if (!symbol || hour < 6 || hour > 18) return worst
  const g = metGlyph(symbol)
  return worst === null || severity(g) > severity(worst) ? g : worst
}

function currentConditions(entry: MetEntry): WeatherReport['now'] {
  const period = entry.data.next_1_hours ?? entry.data.next_6_hours
  const symbol = period?.summary?.symbol_code
  return {
    temp: entry.data.instant.details.air_temperature ?? null,
    sky: symbol ? metGlyph(symbol) : null,
  }
}

export function metReport(
  forecast: MetForecast,
  place: { name: string; timeZone: string },
  now: number,
): WeatherReport {
  const entries = forecast.properties.timeseries.filter((e) => {
    const at = Date.parse(e.time)
    return Number.isFinite(at) && at >= now - HOUR_MS
  })
  const byDate = new Map<string, DayAccumulator>()
  // Precipitation is summed over periods that do not overlap: hourly where the
  // forecast has hours, six-hourly after that.
  let coveredUntil = 0

  for (const entry of entries) {
    const at = Date.parse(entry.time)
    const when = new Date(at)
    const date = localDate(when, place.timeZone)
    const hour = localHour(when, place.timeZone)
    const acc = byDate.get(date) ?? { day: emptyDay(date), worst: null }
    byDate.set(date, acc)

    const temp = entry.data.instant.details.air_temperature
    const six = entry.data.next_6_hours?.details
    acc.day.tempMin = minOf(minOf(acc.day.tempMin, temp), six?.air_temperature_min)
    acc.day.tempMax = maxOf(maxOf(acc.day.tempMax, temp), six?.air_temperature_max)

    if (at >= coveredUntil && (entry.data.next_1_hours || entry.data.next_6_hours)) {
      addPrecipitation(acc.day, hour, entry)
      coveredUntil = at + (entry.data.next_1_hours ? HOUR_MS : 6 * HOUR_MS)
    }
    acc.worst = worstSky(acc.worst, hour, entry)
  }

  const days = [...byDate.values()].map(({ day, worst }) => ({
    ...day,
    sky: worst,
    tempMin: day.tempMin === null ? null : Math.round(day.tempMin),
    tempMax: day.tempMax === null ? null : Math.round(day.tempMax),
  }))
  // A day that started before the forecast only has its last hours: its sky is
  // taken from whatever is left, rather than shown blank.
  const fallback = entries[0]?.data.next_6_hours?.summary?.symbol_code
  if (days[0] && days[0].sky === null && fallback) days[0].sky = metGlyph(fallback)

  return {
    source: SOURCES.met,
    place: place.name,
    timeZone: place.timeZone,
    issuedAt: forecast.properties.meta.updated_at,
    now: entries[0] ? currentConditions(entries[0]) : null,
    // The last day is usually a few hours of it; drop it when it has no sky.
    days: days.filter((d, i) => i < days.length - 1 || d.sky !== null),
  }
}

// ---------------------------------------------------------------------------
// NWS: api.weather.gov
// ---------------------------------------------------------------------------

export const NwsPointSchema = z
  .object({
    properties: z
      .object({
        forecast: z.string().url(),
        forecastHourly: z.string().url(),
        timeZone: z.string(),
        relativeLocation: z
          .object({
            properties: z.object({ city: z.string(), state: z.string() }).loose(),
          })
          .loose()
          .optional(),
      })
      .loose(),
  })
  .loose()
export type NwsPoint = z.infer<typeof NwsPointSchema>

const NwsPeriod = z
  .object({
    startTime: z.string(),
    isDaytime: z.boolean(),
    temperature: z.number().nullable(),
    temperatureUnit: z.string(),
    probabilityOfPrecipitation: z
      .object({ value: z.number().nullable() })
      .loose()
      .nullable()
      .optional(),
    windSpeed: z.string().nullable().optional(),
    windDirection: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    shortForecast: z.string().nullable().optional(),
  })
  .loose()

export const NwsForecastSchema = z
  .object({
    properties: z
      .object({
        updateTime: z.string().optional(),
        generatedAt: z.string().optional(),
        periods: z.array(NwsPeriod),
      })
      .loose(),
  })
  .loose()
export type NwsForecast = z.infer<typeof NwsForecastSchema>

const toCelsius = (value: number | null, unit: string): number | null =>
  value === null ? null : unit === 'F' ? Math.round(((value - 32) * 5) / 9) : Math.round(value)

/**
 * An NWS forecast as a glyph, from its short text ("Chance Rain Showers then
 * Mostly Sunny"). The icon URL codes say the same in fewer words, but the text
 * is always present and carries the order of events.
 */
export function nwsGlyph(text: string): SkyGlyph {
  const kindOf = (part: string): SkyKind | null => {
    const t = part.toLowerCase()
    if (/thunder|t-storm/.test(t)) return 'thunder'
    if (/snow|sleet|flurr|ice|wintry/.test(t)) return 'snow'
    if (/rain|shower|drizzle/.test(t)) return 'rain'
    if (/fog|haze|smoke|dust/.test(t)) return 'fog'
    if (/partly|mostly sunny|mostly clear/.test(t)) return 'clear'
    if (/cloud|overcast/.test(t)) return 'cloudy'
    if (/sunny|clear|fair/.test(t)) return 'clear'
    return null
  }
  const [head = '', tail] = text.split(/\s+then\s+/i)
  const primary = kindOf(head) ?? 'cloudy'
  const later = tail === undefined ? null : kindOf(tail)
  if (later !== null && later !== primary) {
    return { primary, secondary: later, transition: 'later', label: text }
  }
  const partly = /partly|mostly sunny|mostly clear/i.test(head)
  if (partly) return { primary: 'clear', secondary: 'cloudy', transition: 'sometimes', label: text }
  // "Chance Showers" is a mostly dry day with rain possible.
  if (/chance|slight|isolated|scattered/i.test(head) && primary !== 'cloudy') {
    return { primary: 'cloudy', secondary: primary, transition: 'sometimes', label: text }
  }
  return { primary, secondary: null, transition: null, label: text }
}

type NwsPeriodData = NwsForecast['properties']['periods'][number]

/** Folds one day or night period into its day. */
function applyNwsPeriod(day: WeatherDay, p: NwsPeriodData): void {
  const temp = toCelsius(p.temperature, p.temperatureUnit)
  day.pop = maxOf(day.pop, p.probabilityOfPrecipitation?.value ?? undefined)
  if (p.isDaytime) {
    day.tempMax = temp
    day.text = p.shortForecast ?? null
    day.sky = p.shortForecast ? nwsGlyph(p.shortForecast) : null
    day.wind = [p.windDirection, p.windSpeed].filter(Boolean).join(' ') || null
    return
  }
  day.tempMin = temp
  // Tonight, when the day's own period is already over.
  if (day.sky === null && p.shortForecast) {
    day.sky = nwsGlyph(p.shortForecast)
    day.text = p.shortForecast
  }
}

export function nwsReport(
  point: NwsPoint,
  forecast: NwsForecast,
  hourly: NwsForecast | null,
  place: string,
): WeatherReport {
  const timeZone = point.properties.timeZone
  const byDate = new Map<string, WeatherDay>()
  for (const p of forecast.properties.periods) {
    const date = localDate(new Date(p.startTime), timeZone)
    const day = byDate.get(date) ?? { ...emptyDay(date), blocks: null }
    applyNwsPeriod(day, p)
    byDate.set(date, day)
  }
  const first = hourly?.properties.periods[0]
  const relative = point.properties.relativeLocation?.properties
  return {
    source: SOURCES.nws,
    place: place || (relative ? `${relative.city}, ${relative.state}` : ''),
    timeZone,
    issuedAt: forecast.properties.updateTime ?? forecast.properties.generatedAt ?? null,
    now: first
      ? {
          temp: toCelsius(first.temperature, first.temperatureUnit),
          sky: first.shortForecast ? nwsGlyph(first.shortForecast) : null,
        }
      : null,
    days: [...byDate.values()],
  }
}
