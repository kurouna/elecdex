/**
 * The weather pane's view of a forecast, whatever the source.
 *
 * Three sources feed it: the Japan Meteorological Agency for places in Japan,
 * the US National Weather Service for the United States, and MET Norway for
 * everywhere else. Each provider (src/main/weather/) turns its own format into
 * a WeatherReport; the pane draws only that, and shows a field only when the
 * source has it - JMA gives no current temperature, MET Norway gives rain as an
 * amount rather than a chance outside the Nordic countries.
 *
 * See docs/weather-providers.md for the comparison this model came from.
 */

export type WeatherSourceId = 'jma' | 'met' | 'nws'

/** The kinds of sky the pane can draw. */
export type SkyKind = 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog'

/** A sky as drawn: a main condition, and optionally a second one ("/" at times, "→" later). */
export interface SkyGlyph {
  primary: SkyKind
  secondary: SkyKind | null
  transition: 'sometimes' | 'later' | null
  /** A short description for the tooltip. */
  label: string
}

export interface WeatherSource {
  id: WeatherSourceId
  name: string
  /** The credit line the source's terms ask for. */
  credit: string
  /** Opened when the credit is clicked. */
  url: string
}

export interface WeatherDay {
  /** YYYY-MM-DD, in the place's time zone. */
  date: string
  sky: SkyGlyph | null
  /** The source's own words for the day, where it has them. */
  text: string | null
  /** Celsius. */
  tempMin: number | null
  tempMax: number | null
  /** Highest chance of precipitation in the day, percent. */
  pop: number | null
  /** Precipitation over the day, millimetres. */
  precipMm: number | null
  wind: string | null
  /** Six-hour blocks from local midnight; null where the source has none. */
  blocks: Array<{ pop: number | null; precipMm: number | null } | null> | null
}

export interface WeatherReport {
  source: WeatherSource
  /** The place the forecast is for, as the source names it. */
  place: string
  timeZone: string
  /** When the forecast was issued or last updated at the source, ISO 8601. */
  issuedAt: string | null
  now: { temp: number | null; sky: SkyGlyph | null } | null
  days: WeatherDay[]
  /** JMA only: the forecast areas of the office, to choose between. */
  areas?: Array<{ code: string; name: string }>
  /** JMA only: the area shown. */
  areaCode?: string
}

export interface WeatherUpdate {
  /** The location key the page subscribed with. */
  key: string
  report: WeatherReport | null
  /** When main last received data, ms since epoch. */
  fetchedAt: number | null
  /** The last fetch failed with this message; any report shown is older. */
  error: string | null
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

/** What the pane stores and subscribes with. */
export type WeatherLocation =
  | { source: 'jma'; office: string; area?: string; name: string }
  | {
      source: 'met' | 'nws'
      lat: number
      lon: number
      name: string
      country: string
      timeZone: string
    }

export const DEFAULT_LOCATION: WeatherLocation = {
  source: 'nws',
  lat: 40.7143,
  lon: -74.006,
  name: 'New York City',
  country: 'US',
  timeZone: 'America/New_York',
}

/**
 * The place as the pane's title shows it. A JMA area name alone ("北部") does
 * not say where it is, so it follows the chosen place: "奈良県 北部". Until a
 * report arrives the area is unknown and the place stands alone. Panes from
 * before places had names read with the office code as the name, which is
 * no name to show: those keep the area alone.
 */
export function placeLabel(location: WeatherLocation, report: WeatherReport | null): string {
  if (location.source !== 'jma' || !report?.place) return location.name
  if (location.name === location.office) return report.place
  return `${location.name} ${report.place}`
}

/** MET Norway refuses coordinates with more than four decimals. */
export const roundCoordinate = (value: number): number => Math.round(value * 1e4) / 1e4

const OFFICE = /^\d{6}$/

/**
 * The key a location is fetched and cached under. Two panes on the same place
 * share one fetch. Only what changes the request is in it: the name is not.
 */
export function locationKey(location: WeatherLocation): string {
  if (location.source === 'jma') {
    return location.area ? `jma:${location.office}:${location.area}` : `jma:${location.office}`
  }
  return `${location.source}:${roundCoordinate(location.lat)},${roundCoordinate(location.lon)}:${location.timeZone}`
}

export type ParsedKey =
  | { source: 'jma'; office: string; area: string | null }
  | { source: 'met' | 'nws'; lat: number; lon: number; timeZone: string }

/** Validates a key from the renderer. Null for anything malformed. */
export function parseLocationKey(key: unknown): ParsedKey | null {
  if (typeof key !== 'string' || key.length > 120) return null
  const jma = key.match(/^jma:(\d{6})(?::(\d{6}))?$/)
  if (jma) return { source: 'jma', office: jma[1] as string, area: jma[2] ?? null }
  const point = key.match(
    /^(met|nws):(-?\d{1,2}(?:\.\d{1,4})?),(-?\d{1,3}(?:\.\d{1,4})?):([A-Za-z0-9_+\-/]{1,40})$/,
  )
  if (!point) return null
  const lat = Number(point[2])
  const lon = Number(point[3])
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180 || !isTimeZone(point[4] as string)) return null
  return { source: point[1] as 'met' | 'nws', lat, lon, timeZone: point[4] as string }
}

export function isTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

function readJma(l: Record<string, unknown>): WeatherLocation | null {
  if (typeof l.office !== 'string' || !OFFICE.test(l.office)) return null
  return {
    source: 'jma',
    office: l.office,
    ...(typeof l.area === 'string' && OFFICE.test(l.area) ? { area: l.area } : {}),
    name: typeof l.name === 'string' ? l.name : l.office,
  }
}

function readPoint(l: Record<string, unknown>): WeatherLocation | null {
  const { source, lat, lon, timeZone } = l
  if (source !== 'met' && source !== 'nws') return null
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  if (typeof timeZone !== 'string' || !isTimeZone(timeZone)) return null
  return {
    source,
    lat,
    lon,
    name: typeof l.name === 'string' ? l.name : `${lat}, ${lon}`,
    country: typeof l.country === 'string' ? l.country : '',
    timeZone,
  }
}

/**
 * Reads the pane's saved location. Panes from before the other sources kept
 * `{ office, area }` for JMA; those still read as the same JMA location.
 */
export function readLocation(state: Record<string, unknown> | undefined): WeatherLocation {
  const saved = state?.location
  if (typeof saved === 'object' && saved !== null) {
    const l = saved as Record<string, unknown>
    return (l.source === 'jma' ? readJma(l) : readPoint(l)) ?? DEFAULT_LOCATION
  }
  return (state ? readJma(state) : null) ?? DEFAULT_LOCATION
}

/** The source for a place: JMA in Japan, the NWS in the United States, MET Norway elsewhere. */
export function sourceForCountry(country: string): WeatherSourceId {
  if (country === 'JP') return 'jma'
  if (country === 'US') return 'nws'
  return 'met'
}

// ---------------------------------------------------------------------------
// Units and dates
// ---------------------------------------------------------------------------

export type TemperatureUnit = 'c' | 'f'

export function formatTemperature(celsius: number | null, unit: TemperatureUnit): string {
  if (celsius === null || !Number.isFinite(celsius)) return '--'
  const value = unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
  return `${Math.round(value)}°`
}

/** YYYY-MM-DD of an instant in a time zone. */
export function localDate(at: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Hour of the day (0-23) of an instant in a time zone. */
export function localHour(at: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(at)
    .find((p) => p.type === 'hour')?.value
  return Number(hour ?? 0)
}
