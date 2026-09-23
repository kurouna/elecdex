import type { OrbitElements } from '@shared/orbits'
import {
  degreesLat,
  degreesLong,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type SatRec,
  twoline2satrec,
} from '../../lib/sgp4.js'

/**
 * The ORBIT pane's astronomy, pure and in plain numbers: where the Sun is
 * overhead, where a satellite is and where it will be, whether it is in
 * sunlight, and when it next passes over the observer. Positions come from the
 * satellite's mean elements by SGP4 (satellite.js), worked out here - nothing
 * asks a service where anything is.
 */

export const EARTH_RADIUS_KM = 6378.137
const RAD = Math.PI / 180

export interface GroundPoint {
  lat: number
  lon: number
}

export interface SatState extends GroundPoint {
  altKm: number
  speedKmS: number
  /** In the Sun's light, as the Earth's cylindrical shadow puts it. */
  sunlit: boolean
}

/** Longitude folded into -180..180. */
export const wrapLon = (lon: number): number => ((((lon + 180) % 360) + 360) % 360) - 180

/**
 * The point on the Earth with the Sun overhead, to about a hundredth of a
 * degree (the Astronomical Almanac's low-precision formulae) - finer than a
 * pixel on any map this pane draws.
 */
export function subsolarPoint(at: Date): GroundPoint {
  const n = at.getTime() / 86_400_000 + 2440587.5 - 2451545.0
  const meanLon = 280.46 + 0.9856474 * n
  const anomaly = (357.528 + 0.9856003 * n) * RAD
  const eclipticLon = (meanLon + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD
  const obliquity = (23.439 - 0.0000004 * n) * RAD
  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLon), Math.cos(eclipticLon)) / RAD
  const dec = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLon)) / RAD
  const gmst = 280.46061837 + 360.98564736629 * n
  return { lat: dec, lon: wrapLon(ra - gmst) }
}

/** The Sun's height above the horizon at a place, in degrees. */
export function sunAltitude(place: GroundPoint, sun: GroundPoint): number {
  const hour = (place.lon - sun.lon) * RAD
  return (
    Math.asin(
      Math.sin(place.lat * RAD) * Math.sin(sun.lat * RAD) +
        Math.cos(place.lat * RAD) * Math.cos(sun.lat * RAD) * Math.cos(hour),
    ) / RAD
  )
}

/** Mission control's clock: GMT as day of the year and time, `266/00:34:26`. */
export function gmtClock(at: Date): { day: number; text: string } {
  const start = Date.UTC(at.getUTCFullYear(), 0, 1)
  const day = Math.floor((at.getTime() - start) / 86_400_000) + 1
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    day,
    text: `${String(day).padStart(3, '0')}/${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}:${pad(at.getUTCSeconds())}`,
  }
}

/** SGP4's record for a satellite's elements, or null when they do not make one. */
export function satrecOf(elements: OrbitElements): SatRec | null {
  try {
    if (elements.tle !== null) return twoline2satrec(elements.tle[0], elements.tle[1])
    if (elements.omm !== null) return json2satrec(elements.omm as never)
  } catch {
    return null
  }
  return null
}

/** The Sun's direction from the Earth in the same frame SGP4 answers in (TEME ~ ECI). */
function sunDirection(at: Date): { x: number; y: number; z: number } {
  const n = at.getTime() / 86_400_000 + 2440587.5 - 2451545.0
  const anomaly = (357.528 + 0.9856003 * n) * RAD
  const lon =
    (280.46 + 0.9856474 * n + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD
  const obliquity = (23.439 - 0.0000004 * n) * RAD
  return {
    x: Math.cos(lon),
    y: Math.cos(obliquity) * Math.sin(lon),
    z: Math.sin(obliquity) * Math.sin(lon),
  }
}

/** Where a satellite is at a moment, or null when SGP4 cannot say (a decayed orbit). */
export function satState(satrec: SatRec, at: Date): SatState | null {
  const state = propagate(satrec, at)
  const r = state?.position
  const v = state?.velocity
  if (!r || !v || typeof r === 'boolean') return null
  const geo = eciToGeodetic(r, gstime(at))
  const sun = sunDirection(at)
  // In the Earth's shadow: behind the Earth from the Sun, and within its radius of the axis.
  const along = r.x * sun.x + r.y * sun.y + r.z * sun.z
  const off = Math.hypot(r.x - along * sun.x, r.y - along * sun.y, r.z - along * sun.z)
  return {
    lat: degreesLat(geo.latitude),
    lon: degreesLong(geo.longitude),
    altKm: geo.height,
    speedKmS: Math.hypot(v.x, v.y, v.z),
    sunlit: along > 0 || off > EARTH_RADIUS_KM,
  }
}

/** Points along the ground track from `from` to `to`, `stepS` apart. */
export function groundTrack(
  satrec: SatRec,
  from: number,
  to: number,
  stepS = 30,
): (GroundPoint & { t: number })[] {
  const points: (GroundPoint & { t: number })[] = []
  for (let t = from; t <= to; t += stepS * 1000) {
    const state = satState(satrec, new Date(t))
    if (state !== null) points.push({ lat: state.lat, lon: state.lon, t })
  }
  return points
}

/**
 * The part of the Earth that sees the satellite above the horizon: a circle
 * this many degrees (of arc on the ground) around the point below it.
 */
export const footprintDegrees = (altKm: number): number =>
  Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + Math.max(0, altKm))) / RAD

/** The circle a footprint makes on the ground, as points, for drawing. */
export function footprint(centre: GroundPoint, radiusDeg: number, steps = 72): GroundPoint[] {
  const lat1 = centre.lat * RAD
  const lon1 = centre.lon * RAD
  const d = radiusDeg * RAD
  const points: GroundPoint[] = []
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 2 * Math.PI
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
    )
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      )
    points.push({ lat: lat2 / RAD, lon: wrapLon(lon2 / RAD) })
  }
  return points
}

export interface Pass {
  /** When it rises above MIN_ELEVATION and sets below it, ms since the epoch. */
  start: number
  end: number
  maxElevation: number
  /** Compass bearings where it rises and sets, in degrees from north. */
  startAzimuth: number
  endAzimuth: number
  /** Seen with the eye: the satellite in sunlight while the observer's sky is dark. */
  visible: boolean
}

/** Low passes are lost in haze and buildings; ten degrees is the usual floor. */
export const MIN_ELEVATION = 10

/**
 * The passes over an observer in the next `hours`, found in 30-second steps -
 * enough to name the minute a pass starts. A pass counts as visible when at
 * some moment of it the satellite is sunlit and the Sun is six degrees or more
 * below the observer's horizon.
 */
export function passes(satrec: SatRec, observer: GroundPoint, from: number, hours = 24): Pass[] {
  const place = { latitude: observer.lat * RAD, longitude: observer.lon * RAD, height: 0 }
  const found: Pass[] = []
  let current: Pass | null = null
  for (let t = from; t <= from + hours * 3_600_000; t += 30_000) {
    const at = new Date(t)
    const state = propagate(satrec, at)
    const r = state?.position
    if (!r || typeof r === 'boolean') continue
    const look = ecfToLookAngles(place, eciToEcf(r, gstime(at)))
    const elevation = look.elevation / RAD
    const azimuth = look.azimuth / RAD
    if (elevation >= MIN_ELEVATION) {
      current ??= {
        start: t,
        end: t,
        maxElevation: 0,
        startAzimuth: azimuth,
        endAzimuth: azimuth,
        visible: false,
      }
      current.end = t
      current.endAzimuth = azimuth
      current.maxElevation = Math.max(current.maxElevation, elevation)
      if (!current.visible) {
        const lit = satState(satrec, at)?.sunlit === true
        current.visible = lit && sunAltitude(observer, subsolarPoint(at)) <= -6
      }
    } else if (current !== null) {
      found.push(current)
      current = null
    }
  }
  if (current !== null) found.push(current)
  return found
}

/** Eight points of the compass, for where a pass rises and sets. */
export function compass(azimuth: number): string {
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return names[Math.round((((azimuth % 360) + 360) % 360) / 45) % 8] ?? 'N'
}

/**
 * The hour ruler along the map's top: the nominal zones, fifteen degrees wide
 * and centred on the meridians of whole hours, each with the hour it keeps now.
 * Nominal - the ruling lines on the map say where clocks really change.
 */
export function hourRuler(at: Date): { lon: number; hour: number }[] {
  const utc = at.getUTCHours() + at.getUTCMinutes() / 60
  return Array.from({ length: 24 }, (_, i) => {
    const offset = i - 12
    return { lon: offset * 15, hour: Math.floor((((utc + offset) % 24) + 24) % 24) }
  })
}

/** Cuts a track where it crosses the map's edge, so a line is not drawn across the whole map. */
export function splitAtDateLine<T extends GroundPoint>(points: readonly T[]): T[][] {
  const runs: T[][] = []
  let run: T[] = []
  let previous: T | null = null
  for (const point of points) {
    if (previous !== null && Math.abs(point.lon - previous.lon) > 180) {
      runs.push(run)
      run = []
    }
    run.push(point)
    previous = point
  }
  if (run.length > 0) runs.push(run)
  return runs
}
