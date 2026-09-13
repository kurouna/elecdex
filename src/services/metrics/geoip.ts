import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import centroids from '@shared/geo/country-centroids.json'
import type { ConnectionCountry, NetConnections } from '@shared/metrics'
import { Reader, type Response } from 'mmdb-lib'

/**
 * Country lookup for IP addresses, entirely on this machine.
 *
 * The database is @ip-location-db/geo-whois-asn-country-mmdb, built from RIR
 * whois, GeoFeed and ASN data published by the NRO under CC BY 4.0 (credited in
 * the globe pane and the README). It is bundled, so there is no account, no key,
 * no download and no lookup service - an address never leaves the machine.
 *
 * The ~8 MB file is read on the first lookup, which only happens while a globe is
 * on screen, and kept for the life of the collector.
 */

/** ip-location-db's records are `{ country_code }`, not MaxMind's shape. */
interface CountryRecord {
  country_code?: string
}

let reader: Reader<Response> | null = null
let failed = false

function database(): Reader<Response> | null {
  if (reader !== null || failed) return reader
  try {
    const require = createRequire(import.meta.url)
    const pkg = require.resolve('@ip-location-db/geo-whois-asn-country-mmdb/package.json')
    const file = path.join(path.dirname(pkg), 'geo-whois-asn-country.mmdb')
    reader = new Reader<Response>(readFileSync(file))
  } catch (error) {
    failed = true
    console.warn('[elecdex] GeoIP database unavailable:', error)
  }
  return reader
}

/** ISO 3166 alpha-2 code for an address, or null. */
export function countryOf(ip: string): string | null {
  try {
    const record = database()?.get(ip) as CountryRecord | null | undefined
    return record?.country_code ?? null
  } catch {
    return null // not an address the database understands
  }
}

const CENTROIDS = centroids as unknown as Record<string, [number, number]>

/** Groups remote addresses by country, most connections first. */
export function summarizeConnections(
  remotes: readonly string[],
  lookup: (ip: string) => string | null = countryOf,
): NetConnections {
  const byCountry = new Map<string, number>()
  let unresolved = 0
  for (const ip of remotes) {
    const code = lookup(ip)
    if (code === null || CENTROIDS[code] === undefined) {
      unresolved += 1
      continue
    }
    byCountry.set(code, (byCountry.get(code) ?? 0) + 1)
  }
  const countries: ConnectionCountry[] = [...byCountry.entries()]
    .map(([code, count]) => {
      const [lat, lon] = CENTROIDS[code] as [number, number]
      return { code, count, lat, lon }
    })
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
  return { total: remotes.length, unresolved, countries }
}
