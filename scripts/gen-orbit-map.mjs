/**
 * Generates the ORBIT pane's world map data.
 *
 *   src/renderer/widgets/orbit/land-mask.json
 *       Land on a 0.5-degree grid, as a bitmask (Natural Earth 50m land, public
 *       domain, via world-atlas): the dotted continents of the flat map.
 *   src/renderer/widgets/orbit/tz-lines.json
 *       The lines where clocks differ today, as one SVG path in degrees
 *       (x = longitude + 180, y = 90 - latitude). From timezone-boundary-builder's
 *       "with oceans, now" release, under the ODbL: the file says so, and the pane
 *       credits OpenStreetMap contributors.
 *
 * How the lines are made: every zone gets its UTC offset in January and in July
 * of this year (Intl, so the tz database Node carries); the zones are painted
 * onto a 0.25-degree grid; a line is drawn wherever two neighbouring cells keep
 * different time, and the stair steps are smoothed away. So Arizona is set off
 * from Colorado (same winter, different summer), and zones that merely have
 * different names are not.
 *
 * The release is downloaded once into node_modules/.cache. Run: npm run gen:orbit-map
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'node_modules', '.cache', 'elecdex-tz')
const RELEASE = '2026d'
const ASSET = 'timezones-with-oceans-now.geojson.zip'
const URL_ = `https://github.com/evansiroky/timezone-boundary-builder/releases/download/${RELEASE}/${ASSET}`

const write = (rel, value) => {
  const out = join(ROOT, rel)
  mkdirSync(dirname(out), { recursive: true })
  const json = JSON.stringify(value, null, 2)
  writeFileSync(out, `${json}\n`)
  console.log(`wrote ${rel} (${(json.length / 1024).toFixed(1)} kB)`)
}

const polygonsOf = (geometry) =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : []

/**
 * Paints each polygon onto a grid by scanlines: for each row, where the rings'
 * edges cross the row's centre, and the cells between pairs of crossings.
 */
function paint(grid, cols, rows, res, polygons, value) {
  for (const polygon of polygons) {
    // A reduce, not Math.max(...): an ocean's ring has more points than a call has arguments.
    const north = polygon[0].reduce((top, [, lat]) => Math.max(top, lat), -90)
    const south = polygon[0].reduce((bottom, [, lat]) => Math.min(bottom, lat), 90)
    const first = Math.max(0, Math.floor((90 - north) / res))
    const last = Math.min(rows - 1, Math.ceil((90 - south) / res))
    for (let r = first; r <= last; r++) {
      const xs = crossings(polygon, 90 - (r + 0.5) * res)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const from = Math.max(0, Math.ceil((xs[k] + 180) / res - 0.5))
        const to = Math.min(cols - 1, Math.floor((xs[k + 1] + 180) / res - 0.5))
        if (to >= from) grid.fill(value, r * cols + from, r * cols + to + 1)
      }
    }
  }
}

/** Where a polygon's rings cross a parallel, west to east. */
function crossings(polygon, lat) {
  const xs = []
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > lat !== yj > lat) xs.push(((xj - xi) * (lat - yi)) / (yj - yi) + xi)
    }
  }
  return xs.sort((a, b) => a - b)
}

// --- land --------------------------------------------------------------------
{
  const RES = 0.5
  const cols = 360 / RES
  const rows = 180 / RES
  const grid = new Uint8Array(cols * rows)
  const land = feature(require('world-atlas/land-50m.json'), 'land')
  for (const f of land.features) paint(grid, cols, rows, RES, polygonsOf(f.geometry), 1)
  const bytes = new Uint8Array(Math.ceil((cols * rows) / 8))
  grid.forEach((v, i) => {
    if (v) bytes[i >> 3] |= 1 << (i & 7)
  })
  write('src/renderer/widgets/orbit/land-mask.json', {
    source: 'Natural Earth 50m land (public domain), via world-atlas',
    resolution: RES,
    cols,
    rows,
    bits: Buffer.from(bytes).toString('base64'),
  })
}

// --- time zones ------------------------------------------------------------------
function geojson() {
  mkdirSync(CACHE, { recursive: true })
  const zip = join(CACHE, `${RELEASE}-${ASSET}`)
  if (!existsSync(zip)) {
    console.log(`downloading ${URL_}`)
    const got = spawnSync('curl', ['-sSL', '-o', zip, URL_], { stdio: 'inherit' })
    if (got.status !== 0) throw new Error('download failed')
  }
  const dir = join(CACHE, RELEASE)
  if (!existsSync(dir) || readdirSync(dir).length === 0) {
    mkdirSync(dir, { recursive: true })
    // bsdtar (Windows, macOS) reads zip; elsewhere unzip does.
    const tar = spawnSync('tar', ['-xf', zip, '-C', dir], { stdio: 'inherit' })
    if (tar.status !== 0) spawnSync('unzip', ['-o', zip, '-d', dir], { stdio: 'inherit' })
  }
  const file = readdirSync(dir, { recursive: true }).find((name) => String(name).endsWith('.json'))
  if (!file) throw new Error('no geojson in the release')
  return JSON.parse(readFileSync(join(dir, String(file)), 'utf8'))
}

/** Minutes east of UTC in a zone at a moment, from the tz database Node carries. */
function offsetAt(zone, when) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(when)
    .find((part) => part.type === 'timeZoneName')?.value
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? '')
  return match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0
}

/** Douglas-Peucker on [x, y] points. */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  let index = 0
  let far = 0
  const [ax, ay] = points[0]
  const [bx, by] = points[points.length - 1]
  const length = Math.hypot(bx - ax, by - ay) || 1
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i]
    const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length
    if (distance > far) {
      far = distance
      index = i
    }
  }
  if (far <= tolerance) return [points[0], points[points.length - 1]]
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ]
}

{
  const RES = 0.25
  const cols = 360 / RES
  const rows = 180 / RES
  const data = geojson()
  const year = new Date().getUTCFullYear()
  const winter = new Date(Date.UTC(year, 0, 15, 12))
  const summer = new Date(Date.UTC(year, 6, 15, 12))
  const keys = new Map()
  const grid = new Int16Array(cols * rows).fill(-1)
  for (const f of data.features) {
    const zone = f.properties.tzid
    const key = `${offsetAt(zone, winter)}|${offsetAt(zone, summer)}`
    if (!keys.has(key)) keys.set(key, keys.size)
    paint(grid, cols, rows, RES, polygonsOf(f.geometry), keys.get(key))
  }

  // Grid edges between cells keeping different time, as segments between grid vertices.
  const vertex = (x, y) => y * (cols + 1) + x
  const links = new Map()
  const link = (a, b) => {
    if (!links.has(a)) links.set(a, [])
    if (!links.has(b)) links.set(b, [])
    links.get(a).push(b)
    links.get(b).push(a)
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const here = grid[r * cols + c]
      if (c + 1 < cols && grid[r * cols + c + 1] !== here)
        link(vertex(c + 1, r), vertex(c + 1, r + 1))
      if (r + 1 < rows && grid[(r + 1) * cols + c] !== here)
        link(vertex(c, r + 1), vertex(c + 1, r + 1))
    }
  }

  // Walk the segments into lines, from every end and junction, then round loops.
  const used = new Set()
  const edge = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`)
  const lines = []
  const walk = (start, next) => {
    const line = [start]
    let prev = start
    let at = next
    used.add(edge(prev, at))
    for (;;) {
      line.push(at)
      const onward = (links.get(at) ?? []).filter((n) => !used.has(edge(at, n)))
      if (links.get(at).length !== 2 || onward.length === 0) break
      prev = at
      at = onward[0]
      used.add(edge(prev, at))
    }
    lines.push(line)
  }
  for (const [v, ns] of links)
    if (ns.length !== 2) for (const n of ns) if (!used.has(edge(v, n))) walk(v, n)
  for (const [v, ns] of links) for (const n of ns) if (!used.has(edge(v, n))) walk(v, n)

  const round = (n) => Math.round(n * 100) / 100
  let path = ''
  let kept = 0
  for (const line of lines) {
    const points = line.map((v) => [(v % (cols + 1)) * RES, Math.floor(v / (cols + 1)) * RES])
    // A tenth of a degree more than half a cell: the stair steps go, the coast shapes stay.
    const smooth = simplify(points, RES * 0.6)
    if (
      smooth.length < 2 ||
      (smooth.length === 2 && smooth[0][0] === smooth[1][0] && smooth[0][1] === smooth[1][1])
    )
      continue
    kept += smooth.length
    path += smooth.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join('')
  }
  console.log(`${keys.size} distinct clocks, ${lines.length} lines, ${kept} points`)
  write('src/renderer/widgets/orbit/tz-lines.json', {
    source: `timezone-boundary-builder ${RELEASE} (timezones-with-oceans-now), https://github.com/evansiroky/timezone-boundary-builder`,
    license: 'Open Database License (ODbL) 1.0, https://opendatacommons.org/licenses/odbl/1-0/',
    attribution: '© OpenStreetMap contributors',
    derived: `Zones grouped by their UTC offsets in January and July ${year}, traced on a ${RES}-degree grid and simplified.`,
    space: 'x = longitude + 180, y = 90 - latitude, in degrees',
    path,
  })
}
