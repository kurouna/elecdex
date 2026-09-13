import type { OfficeInfo } from './weather.js'
import {
  roundCoordinate,
  sourceForCountry,
  type WeatherLocation,
  type WeatherSourceId,
} from './weather-report.js'

/**
 * Searching for a place in the weather pane's location picker. Pure, over data
 * the caller passes in (the bundled city list, JMA's office list), so ranking
 * and the Japan special case are unit-tested.
 */

/** [name, admin1, country, lat, lon, timeZone], from scripts/gen-cities.mjs. */
export type CityRow = [string, string, string, number, number, string]

export interface PlaceChoice {
  /** Stable within a search, for keyed lists. */
  id: string
  title: string
  detail: string
  source: WeatherSourceId
  location: WeatherLocation
}

/**
 * GeoNames' first-level division names for Japan, in JIS order (01 Hokkaido to
 * 47 Okinawa). A Japanese city is forecast by its prefecture's JMA office, which
 * for most prefectures is the prefecture code followed by 0000.
 */
const PREFECTURES = [
  'Hokkaido',
  'Aomori',
  'Iwate',
  'Miyagi',
  'Akita',
  'Yamagata',
  'Fukushima',
  'Ibaraki',
  'Tochigi',
  'Gunma',
  'Saitama',
  'Chiba',
  'Tokyo',
  'Kanagawa',
  'Niigata',
  'Toyama',
  'Ishikawa',
  'Fukui',
  'Yamanashi',
  'Nagano',
  'Gifu',
  'Shizuoka',
  'Aichi',
  'Mie',
  'Shiga',
  'Kyoto',
  'Osaka',
  'Hyogo',
  'Nara',
  'Wakayama',
  'Tottori',
  'Shimane',
  'Okayama',
  'Hiroshima',
  'Yamaguchi',
  'Tokushima',
  'Kagawa',
  'Ehime',
  'Kochi',
  'Fukuoka',
  'Saga',
  'Nagasaki',
  'Kumamoto',
  'Oita',
  'Miyazaki',
  'Kagoshima',
  'Okinawa',
]

/** Offices that are not the prefecture code + 0000: JMA splits these prefectures. */
const OFFICE_EXCEPTIONS: Record<string, string> = {
  // Sapporo's office (Ishikari, Sorachi, Shiribeshi).
  Hokkaido: '016000',
  Kagoshima: '460100',
  // The main island.
  Okinawa: '471000',
}

export function officeForPrefecture(admin1: string): string | null {
  const exception = OFFICE_EXCEPTIONS[admin1]
  if (exception) return exception
  const index = PREFECTURES.findIndex((p) => p.toLowerCase() === admin1.toLowerCase())
  return index < 0 ? null : `${String(index + 1).padStart(2, '0')}0000`
}

const SOURCE_NAMES: Record<WeatherSourceId, string> = {
  jma: 'JMA',
  met: 'MET Norway',
  nws: 'NWS',
}
export const sourceName = (id: WeatherSourceId): string => SOURCE_NAMES[id]

function cityChoice(row: CityRow, countryName: (code: string) => string): PlaceChoice {
  const [name, admin1, country, lat, lon, timeZone] = row
  const source = sourceForCountry(country)
  const office = source === 'jma' ? officeForPrefecture(admin1) : null
  const location: WeatherLocation =
    office !== null
      ? { source: 'jma', office, name }
      : { source: source === 'jma' ? 'met' : source, lat, lon, name, country, timeZone }
  return {
    id: `city:${name}:${country}:${lat},${lon}`,
    title: name,
    detail: [admin1 !== name ? admin1 : '', countryName(country)].filter(Boolean).join(', '),
    source: location.source,
    location,
  }
}

function officeChoice(office: OfficeInfo): PlaceChoice {
  return {
    id: `office:${office.code}`,
    title: office.enName,
    detail: `${office.name} · forecast office, Japan`,
    source: 'jma',
    location: { source: 'jma', office: office.code, name: office.name },
  }
}

const POINT = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/

/** "35.68, 139.69" as a place of its own, forecast by MET Norway in the given time zone. */
export function pointChoice(query: string, timeZone: string): PlaceChoice | null {
  const m = POINT.exec(query)
  if (!m) return null
  const lat = roundCoordinate(Number(m[1]))
  const lon = roundCoordinate(Number(m[2]))
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return {
    id: `point:${lat},${lon}`,
    title: `${lat}, ${lon}`,
    detail: `coordinates · ${timeZone}`,
    source: 'met',
    location: { source: 'met', lat, lon, name: `${lat}, ${lon}`, country: '', timeZone },
  }
}

/** How well a name matches: a prefix beats a word start beats anywhere; 0 is no match. */
function score(text: string, query: string): number {
  const t = text.toLowerCase()
  if (t === query) return 4
  if (t.startsWith(query)) return 3
  if (t.split(/[\s,.-]+/).some((w) => w.startsWith(query))) return 2
  return t.includes(query) ? 1 : 0
}

export function searchPlaces(
  query: string,
  data: {
    cities: readonly CityRow[]
    offices: readonly OfficeInfo[]
    countryName: (code: string) => string
    timeZone: string
  },
  limit = 60,
): PlaceChoice[] {
  const q = query.trim().toLowerCase()
  const point = pointChoice(query, data.timeZone)
  if (point) return [point]

  const ranked: Array<{ choice: PlaceChoice; score: number; order: number }> = []
  data.cities.forEach((row, order) => {
    const [name, admin1, country] = row
    const s =
      q === ''
        ? 1
        : Math.max(
            score(name, q) * 3,
            score(admin1, q),
            score(data.countryName(country), q),
            country.toLowerCase() === q ? 2 : 0,
          )
    if (s > 0) ranked.push({ choice: cityChoice(row, data.countryName), score: s, order })
  })
  data.offices.forEach((office, i) => {
    const s =
      q === ''
        ? 0
        : Math.max(score(office.enName, q) * 3, score(office.name, q) * 3, score('japan', q))
    if (s > 0)
      ranked.push({ choice: officeChoice(office), score: s, order: data.cities.length + i })
  })
  // Higher score first; then the city list's own order, which is by population.
  ranked.sort((a, b) => b.score - a.score || a.order - b.order)
  return ranked.slice(0, limit).map((r) => r.choice)
}
