import centroids from '@shared/geo/country-centroids.json'
import zones from '@shared/geo/timezone-countries.json'

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
  return { zone, country, lat: at[0], lon: at[1] }
}
