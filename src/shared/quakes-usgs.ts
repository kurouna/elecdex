import { QUAKES_KEPT, type Quake, USGS_QUAKE_PAGE } from './quakes.js'

/**
 * Earthquakes around the world from the US Geological Survey's real-time feed,
 * `summary/4.5_day.geojson`: every magnitude 4.5 and up of the past day, updated
 * every minute. Public domain. Places are English descriptions ("120 km NE of
 * Hengchun, Taiwan"), and there are no intensities - the world is graded by
 * magnitude.
 */

export const USGS_FEED_PATH = '/earthquakes/feed/v1.0/summary/4.5_day.geojson'

const finite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

/** An event page, only on the USGS's own site; anything else falls back to the map. */
function eventPage(url: unknown): string {
  if (typeof url !== 'string') return USGS_QUAKE_PAGE
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'earthquake.usgs.gov'
      ? parsed.href
      : USGS_QUAKE_PAGE
  } catch {
    return USGS_QUAKE_PAGE
  }
}

/** Longitude, latitude and depth, as GeoJSON orders them; an impossible position is dropped. */
function position(geometry: unknown): Pick<Quake, 'lat' | 'lon' | 'depthKm'> {
  const coordinates = (geometry as { coordinates?: unknown } | null)?.coordinates
  const [lon, lat, depth] = Array.isArray(coordinates) ? coordinates.map(finite) : []
  const located = lat != null && lon != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  return {
    lat: located ? lat : null,
    lon: located ? lon : null,
    depthKm: depth == null ? null : Math.round(depth),
  }
}

function feature(raw: unknown): Quake | null {
  if (typeof raw !== 'object' || raw === null) return null
  const f = raw as { id?: unknown; properties?: unknown; geometry?: unknown }
  const p = (
    typeof f.properties === 'object' && f.properties !== null ? f.properties : {}
  ) as Record<string, unknown>
  if (p.type !== undefined && p.type !== 'earthquake') return null
  const at = finite(p.time)
  if (typeof f.id !== 'string' || f.id === '' || at === null) return null
  const place = typeof p.place === 'string' && p.place.trim() !== '' ? p.place.trim() : null
  return {
    source: 'usgs',
    id: f.id,
    at,
    reportedAt: finite(p.updated) ?? at,
    area: place === null ? null : { ja: place, en: place },
    ...position(f.geometry),
    magnitude: finite(p.mag),
    maxIntensity: null,
    distant: false,
    url: eventPage(p.url),
  }
}

/** The earthquakes in a USGS GeoJSON feed, newest first. */
export function parseUsgsFeed(raw: unknown, limit = QUAKES_KEPT): Quake[] {
  const features = (raw as { features?: unknown } | null)?.features
  if (!Array.isArray(features)) return []
  return features
    .map(feature)
    .filter((q): q is Quake => q !== null)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
}
