/**
 * Generates the geographic data the globe needs, from public-domain sources.
 *
 *   src/renderer/widgets/globe/land-points.json
 *       Points on a Fibonacci sphere that fall on land - the dotted continents.
 *   src/shared/geo/country-centroids.json
 *       ISO 3166 alpha-2 code -> [lat, lon], where a connection to that country
 *       is pinned.
 *   src/shared/geo/timezone-countries.json
 *       IANA time zone -> ISO country, to place "you are here" without asking any
 *       online service for the machine's public IP.
 *
 * Sources: Natural Earth via world-atlas (public domain / ISC), country codes via
 * i18n-iso-countries (MIT), zones via countries-and-timezones (MIT). All are
 * build-time devDependencies; only the small generated files ship.
 *
 * Run with: npm run gen:geo
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ct from 'countries-and-timezones'
import countries from 'i18n-iso-countries'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Enough points for continents to read as dots at the globe's size, and no more. */
const SPHERE_POINTS = 12000

const write = (rel, value) => {
  const out = join(ROOT, rel)
  mkdirSync(dirname(out), { recursive: true })
  const json = JSON.stringify(value)
  writeFileSync(out, `${json}\n`)
  console.log(`wrote ${rel} (${(json.length / 1024).toFixed(1)} kB)`)
}

/** Polygons of a GeoJSON geometry, as arrays of rings of [lon, lat]. */
const polygonsOf = (geometry) =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : []

/** Even-odd ray casting in lon/lat space; Natural Earth rings are split at ±180. */
function ringContains(ring, lon, lat) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const polygonContains = (polygon, lon, lat) =>
  ringContains(polygon[0], lon, lat) &&
  !polygon.slice(1).some((hole) => ringContains(hole, lon, lat))

// --- land points -------------------------------------------------------------
const land = feature(require('world-atlas/land-110m.json'), 'land')
const landPolygons = land.features.flatMap((f) => polygonsOf(f.geometry))
const golden = Math.PI * (3 - Math.sqrt(5))
const points = []
for (let i = 0; i < SPHERE_POINTS; i++) {
  const y = 1 - (i / (SPHERE_POINTS - 1)) * 2
  const lat = (Math.asin(y) * 180) / Math.PI
  const lon = (((((i * golden * 180) / Math.PI) % 360) + 540) % 360) - 180
  if (landPolygons.some((p) => polygonContains(p, lon, lat))) {
    points.push(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10)
  }
}
write('src/renderer/widgets/globe/land-points.json', points)

// --- country centroids ---------------------------------------------------------
/** Makes longitudes continuous across the antimeridian, so a ring spanning it is not torn. */
function unwrap(ring) {
  const out = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0]
    const prev = out[i - 1][0]
    while (lon - prev > 180) lon -= 360
    while (lon - prev < -180) lon += 360
    out.push([lon, ring[i][1]])
  }
  return out
}

const wrapLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180

/** Planar area and centroid of a ring (shoelace), in lon/lat degrees. */
function ringCentroid(input) {
  const ring = unwrap(input)
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j]
    const [x1, y1] = ring[i]
    const cross = x0 * y1 - x1 * y0
    area += cross
    cx += (x0 + x1) * cross
    cy += (y0 + y1) * cross
  }
  area /= 2
  return area === 0
    ? { area: 0, lon: wrapLon(ring[0][0]), lat: ring[0][1] }
    : { area: Math.abs(area), lon: wrapLon(cx / (6 * area)), lat: cy / (6 * area) }
}

const world = feature(require('world-atlas/countries-50m.json'), 'countries')
const centroids = {}
for (const f of world.features) {
  const code = countries.numericToAlpha2(f.id)
  if (!code || !f.geometry) continue
  // The largest landmass, so France is pinned in Europe rather than pulled toward
  // French Guiana, and the United States in the contiguous states.
  const largest = polygonsOf(f.geometry)
    .map((p) => ringCentroid(p[0]))
    .sort((a, b) => b.area - a.area)[0]
  if (largest)
    centroids[code] = [Math.round(largest.lat * 100) / 100, Math.round(largest.lon * 100) / 100]
}
write('src/shared/geo/country-centroids.json', centroids)

// --- time zones ---------------------------------------------------------------
const zones = {}
for (const [name, zone] of Object.entries(ct.getAllTimezones())) {
  const country = zone.countries[0]
  if (country) zones[name] = country
}
write('src/shared/geo/timezone-countries.json', zones)
