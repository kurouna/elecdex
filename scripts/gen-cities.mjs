/**
 * Generates the city list the weather pane's location picker searches.
 *
 *   src/shared/geo/cities.json
 *       [name, admin1, country, lat, lon, timeZone] for every city of 500,000
 *       people or more, and every national capital, sorted by population.
 *
 * Source: GeoNames (https://www.geonames.org/), cities15000 and admin1 codes,
 * licensed CC BY 4.0 - credited in the picker and the README. Downloaded at
 * generation time only; the app itself never contacts GeoNames, so a place the
 * user searches for is never sent anywhere.
 *
 * Run with: npm run gen:cities
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://download.geonames.org/export/dump'
const MIN_POPULATION = 500_000
const UA = { 'user-agent': 'elecdex gen-cities (github.com/kurouna/elecdex)' }

async function download(name) {
  const response = await fetch(`${BASE}/${name}`, { headers: UA })
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

const decode = (bytes) => new TextDecoder('utf-8').decode(bytes)

const admin1 = new Map()
for (const line of decode(await download('admin1CodesASCII.txt')).split('\n')) {
  const [code, name, ascii] = line.split('\t')
  if (code) admin1.set(code, ascii || name)
}

const zip = unzipSync(await download('cities15000.zip'))
const text = decode(zip['cities15000.txt'])

const rows = []
for (const line of text.split('\n')) {
  const f = line.split('\t')
  if (f.length < 18) continue
  const [, name, ascii, , lat, lon, , featureCode, country, , admin1Code] = f
  const population = Number(f[14])
  const timeZone = f[17]
  const capital = featureCode === 'PPLC'
  if (!capital && population < MIN_POPULATION) continue
  if (!timeZone) continue
  rows.push({
    population,
    row: [
      ascii || name,
      admin1.get(`${country}.${admin1Code}`) ?? '',
      country,
      Math.round(Number(lat) * 1e4) / 1e4,
      Math.round(Number(lon) * 1e4) / 1e4,
      timeZone,
    ],
  })
}
rows.sort((a, b) => b.population - a.population)

const out = join(ROOT, 'src/shared/geo/cities.json')
mkdirSync(dirname(out), { recursive: true })
const json = JSON.stringify(rows.map((r) => r.row))
writeFileSync(out, `${json}\n`)
console.log(
  `wrote src/shared/geo/cities.json: ${rows.length} cities (${(json.length / 1024).toFixed(1)} kB)`,
)
