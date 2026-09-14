import cities from '@shared/geo/cities.json'
import centroids from '@shared/geo/country-centroids.json'
import zones from '@shared/geo/timezone-countries.json'
import type { Quake } from '@shared/quakes'

/**
 * The globe's geometry, as pure functions: where a latitude/longitude sits on
 * the sphere, the arc between two places, and where "here" is.
 */

export type Vec3 = [number, number, number]

const DEG = Math.PI / 180

/**
 * A point on a sphere of `radius`, in three.js axes: y up, and longitude 0 facing
 * +z so the globe starts centred on Greenwich.
 */
export function latLonToVec3(lat: number, lon: number, radius = 1): Vec3 {
  const phi = lat * DEG
  const theta = lon * DEG
  return [
    radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(theta),
  ]
}

/** Central angle between two places, in radians. */
export function angularDistance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const [ax, ay, az] = latLonToVec3(a.lat, a.lon)
  const [bx, by, bz] = latLonToVec3(b.lat, b.lon)
  return Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz)))
}

/**
 * Points along the great circle from `a` to `b`, lifted off the surface into an
 * arch whose height grows with distance - a hop to a neighbour hugs the ground,
 * a link across an ocean rises well clear of it.
 */
export function arcPoints(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  segments = 48,
  radius = 1,
): Vec3[] {
  const va = latLonToVec3(a.lat, a.lon)
  const vb = latLonToVec3(b.lat, b.lon)
  const omega = angularDistance(a, b)
  const lift = 0.05 + 0.35 * (omega / Math.PI)
  const points: Vec3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Spherical interpolation; for (nearly) identical points fall back to a.
    const s = Math.sin(omega)
    const wa = s < 1e-6 ? 1 - t : Math.sin((1 - t) * omega) / s
    const wb = s < 1e-6 ? t : Math.sin(t * omega) / s
    const r = radius * (1 + lift * Math.sin(Math.PI * t))
    points.push([
      (va[0] * wa + vb[0] * wb) * r,
      (va[1] * wa + vb[1] * wb) * r,
      (va[2] * wa + vb[2] * wb) * r,
    ])
  }
  return points
}

export interface Home {
  zone: string
  country: string
  lat: number
  lon: number
  /** What placed it: the time zone's country, the locale's region, or only the UTC offset. */
  basis: 'zone' | 'locale' | 'offset'
}

const ZONES = zones as Record<string, string>
const CENTROIDS = centroids as unknown as Record<string, [number, number]>

/**
 * Where this machine is, approximately: the country of its time zone.
 *
 * eDEX-UI asked an online IP-lookup service for the machine's public address.
 * The time zone is already known, needs no request, and names a country, which
 * is as precise as the country-level GeoIP used for connections anyway.
 */
export function homeFromTimeZone(zone: string): Home | null {
  const country = ZONES[zone]
  const at = country === undefined ? undefined : CENTROIDS[country]
  if (country === undefined || at === undefined) return null
  return { zone, country, lat: at[0], lon: at[1], basis: 'zone' }
}

/** Minutes east of UTC for a zone at a moment. */
function offsetMinutes(zone: string, at: Date): number | null {
  const key = `${zone}@${Math.floor(at.getTime() / 3_600_000)}`
  if (!offsets.has(key)) offsets.set(key, readOffset(zone, at))
  return offsets.get(key) ?? null
}

const offsets = new Map<string, number | null>()

function readOffset(zone: string, at: Date): number | null {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value
    if (!name) return null
    if (name === 'GMT') return 0
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name)
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : null
  } catch {
    return null
  }
}

type CityRow = [string, string, string, number, number, string]

/**
 * Where this machine probably is, however little the system says.
 *
 *  1. The country of its time zone - the usual case.
 *  2. The region of its locale ("ja-JP" is Japan), when the zone names no
 *     country: UTC, "Etc/GMT-9", or a zone the table does not know.
 *  3. The largest city keeping the same UTC offset right now, when the locale
 *     has no region either. The right side of the world, at least.
 *
 * Never the OS location service, which would ask the user for permission.
 */
export function guessHome(zone: string, locale: string, at: Date): Home | null {
  const fromZone = homeFromTimeZone(zone)
  if (fromZone) return fromZone

  let region: string | undefined
  try {
    region = new Intl.Locale(locale).maximize().region
  } catch {
    region = undefined
  }
  const centroid = region === undefined ? undefined : CENTROIDS[region]
  if (region !== undefined && centroid !== undefined) {
    return { zone, country: region, lat: centroid[0], lon: centroid[1], basis: 'locale' }
  }

  const offset = offsetMinutes(zone, at)
  if (offset === null) return null
  // cities.json is sorted by population, so the first match is the largest.
  const city = (cities as CityRow[]).find((c) => offsetMinutes(c[5], at) === offset)
  return city ? { zone, country: city[2], lat: city[3], lon: city[4], basis: 'offset' } : null
}

/** Earthquakes are marked for a day, and pulse for their first hour. */
export const QUAKE_SHOWN_MS = 24 * 60 * 60_000
export const QUAKE_PULSE_MS = 60 * 60_000

type LocatedQuake = Quake & { lat: number; lon: number }

/** The marked earthquakes at `now`: located and within a day, with whether each still pulses. */
export function visibleQuakes(
  quakes: readonly Quake[],
  now: number,
): Array<{ quake: LocatedQuake; pulse: boolean }> {
  return quakes
    .filter(
      (q): q is LocatedQuake =>
        q.lat !== null && q.lon !== null && now - q.at <= QUAKE_SHOWN_MS && q.at <= now + 60_000,
    )
    .map((quake) => ({ quake, pulse: now - quake.at <= QUAKE_PULSE_MS }))
}
