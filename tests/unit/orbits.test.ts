import { readFileSync } from 'node:fs'
import { orbitQuery, readStations, readTle } from '@shared/orbits'
import { json2satrec, propagate, twoline2satrec } from 'satellite.js'
import { describe, expect, it } from 'vitest'

/**
 * Reading CelesTrak's answers. The fixtures are what CelesTrak served on
 * 2026-09-23: the stations group as OMM JSON, and the first 60 Starlink
 * satellites as TLE.
 */

const stations = readFileSync('tests/fixtures/orbits/stations.json', 'utf8')
const starlink = readFileSync('tests/fixtures/orbits/starlink-60.tle', 'utf8')

describe('the stations', () => {
  it('keeps the ISS and Tiangong, and only the fields SGP4 reads', () => {
    const read = readStations(stations)
    expect(read?.map((s) => s.id)).toEqual([25544, 48274])
    const iss = read?.[0]
    expect(Object.keys(iss?.omm ?? {}).sort()).toContain('MEAN_MOTION')
    expect(JSON.stringify(read)).not.toContain('CCSDS')
  })

  it('gives SGP4 what it needs to put the ISS in low orbit', () => {
    const iss = readStations(stations)?.[0]
    const satrec = json2satrec(iss?.omm as never)
    const at = new Date(Date.UTC(2026, 8, 23, 0, 0, 0))
    const state = propagate(satrec, at)
    const r = state?.position
    expect(r).toBeTruthy()
    const radius = Math.hypot(r?.x ?? 0, r?.y ?? 0, r?.z ?? 0)
    // Earth's radius plus 370-460 km.
    expect(radius).toBeGreaterThan(6740)
    expect(radius).toBeLessThan(6840)
  })

  it('refuses what is not a list of elements', () => {
    expect(readStations('<html>blocked</html>')).toBeNull()
    expect(readStations('{"a":1}')).toBeNull()
    expect(readStations('[{"NORAD_CAT_ID":25544,"EPOCH":"x"}]')).toEqual([])
  })
})

describe('Starlink as TLE', () => {
  it('reads each name and its two lines', () => {
    const read = readTle(starlink)
    expect(read).toHaveLength(60)
    expect(read?.[0]?.name).toMatch(/^STARLINK-/)
    const [one, two] = read?.[0]?.tle ?? ['', '']
    const satrec = twoline2satrec(one, two)
    expect(propagate(satrec, new Date(Date.UTC(2026, 8, 23)))?.position).toBeTruthy()
  })

  it('skips lines that are not TLE, and refuses a page that holds none', () => {
    const broken = starlink.split('\n')
    broken[1] = '1 99999U garbage'
    expect(readTle(broken.join('\n'))).toHaveLength(59)
    expect(readTle('No GP data found')).toBeNull()
    expect(readTle('')).toEqual([])
  })

  it('asks for the smallest format of each set', () => {
    expect(orbitQuery('stations')).toContain('GROUP=stations&FORMAT=json')
    expect(orbitQuery('starlink')).toContain('GROUP=starlink&FORMAT=tle')
  })
})
