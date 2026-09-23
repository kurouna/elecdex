import type { CityRow } from '@shared/weather-places'

/**
 * The ORBIT pane's clocks: the cities along its header, and the observer the
 * pane works passes out for.
 */

export interface ClockCity {
  code: string
  name: string
  timeZone: string
  lat: number
  lon: number
}

/**
 * Round the world from mission control in Houston, one city to a few hours,
 * with the half-hour zone of India among them.
 */
export const CLOCK_CITIES: readonly ClockCity[] = [
  { code: 'LAX', name: 'Los Angeles', timeZone: 'America/Los_Angeles', lat: 34.05, lon: -118.24 },
  { code: 'HOU', name: 'Houston', timeZone: 'America/Chicago', lat: 29.76, lon: -95.37 },
  { code: 'NYC', name: 'New York', timeZone: 'America/New_York', lat: 40.71, lon: -74.01 },
  { code: 'LON', name: 'London', timeZone: 'Europe/London', lat: 51.51, lon: -0.13 },
  { code: 'MOW', name: 'Moscow', timeZone: 'Europe/Moscow', lat: 55.76, lon: 37.62 },
  { code: 'DEL', name: 'Delhi', timeZone: 'Asia/Kolkata', lat: 28.61, lon: 77.21 },
  { code: 'BJS', name: 'Beijing', timeZone: 'Asia/Shanghai', lat: 39.91, lon: 116.4 },
  { code: 'TYO', name: 'Tokyo', timeZone: 'Asia/Tokyo', lat: 35.68, lon: 139.69 },
  { code: 'SYD', name: 'Sydney', timeZone: 'Australia/Sydney', lat: -33.87, lon: 151.21 },
]

export interface Observer {
  name: string
  country: string
  lat: number
  lon: number
  timeZone: string
}

/** A city from the bundled list as an observer. */
export const observerOf = (row: CityRow): Observer => ({
  name: row[0],
  country: row[2],
  lat: row[3],
  lon: row[4],
  timeZone: row[5],
})

/**
 * Where to work out passes for before the user says: the largest city in this
 * machine's time zone (the list is by population), so no one is asked for a
 * location and no other pane is consulted.
 */
export function defaultObserver(cities: readonly CityRow[], timeZone: string): Observer {
  const here =
    cities.find((row) => row[5] === timeZone) ?? cities.find((row) => row[0] === 'London')
  return here
    ? observerOf(here)
    : { name: 'Greenwich', country: 'GB', lat: 51.48, lon: 0, timeZone: 'Europe/London' }
}

/** An observer from pane state, or null when it is not one. */
export function readObserver(value: unknown): Observer | null {
  if (typeof value !== 'object' || value === null) return null
  const o = value as Record<string, unknown>
  if (typeof o.name !== 'string' || typeof o.timeZone !== 'string') return null
  if (typeof o.lat !== 'number' || typeof o.lon !== 'number') return null
  if (Math.abs(o.lat) > 90 || Math.abs(o.lon) > 180) return null
  return {
    name: o.name.slice(0, 60),
    country: typeof o.country === 'string' ? o.country.slice(0, 2) : '',
    lat: o.lat,
    lon: o.lon,
    timeZone: o.timeZone,
  }
}

/** Cities whose name starts with, then contains, what was typed: a short list to pick from. */
export function findCities(cities: readonly CityRow[], query: string, limit = 12): CityRow[] {
  const q = query.trim().toLowerCase()
  if (q === '') return cities.slice(0, limit)
  const starts = cities.filter((row) => row[0].toLowerCase().startsWith(q))
  const contains = cities.filter(
    (row) => !row[0].toLowerCase().startsWith(q) && row[0].toLowerCase().includes(q),
  )
  return [...starts, ...contains].slice(0, limit)
}

/** A clock's face in a zone: `09:42`, the offset as `UTC+9`, and whether it is night there. */
export function clockFace(at: Date, timeZone: string): { time: string; offset: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  }).formatToParts(at)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    time: `${part('hour')}:${part('minute')}`,
    offset: part('timeZoneName').replace('GMT', 'UTC') || 'UTC',
  }
}
