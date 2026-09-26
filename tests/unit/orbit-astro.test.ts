import { readFileSync } from 'node:fs'
import { readStations } from '@shared/orbits'
import { describe, expect, it } from 'vitest'
import {
  compass,
  footprint,
  footprintDegrees,
  gmtClock,
  hourRuler,
  latLonText,
  passes,
  satrecOf,
  satState,
  splitAtDateLine,
  subsolarPoint,
  sunAltitude,
  sunLines,
} from '../../src/renderer/widgets/orbit/astro.js'

/**
 * The ORBIT pane's astronomy, checked against what is known of the sky: the
 * Sun over the tropic at the solstice, the ISS in low orbit at 7.7 km/s, and
 * passes over Tokyo from the elements CelesTrak served on 2026-09-23.
 */

const [iss, css] = readStations(readFileSync('tests/fixtures/orbits/stations.json', 'utf8')) ?? []
const TOKYO = { lat: 35.68, lon: 139.69 }
const AT = Date.UTC(2026, 8, 23, 0, 0, 0)

describe('the Sun', () => {
  it('stands over the Tropic of Cancer at the June solstice, near Greenwich at noon', () => {
    const sun = subsolarPoint(new Date(Date.UTC(2026, 5, 21, 12, 0, 0)))
    expect(sun.lat).toBeCloseTo(23.44, 0)
    expect(Math.abs(sun.lon)).toBeLessThan(1)
  })

  it('crosses the equator at the September equinox', () => {
    expect(Math.abs(subsolarPoint(new Date(Date.UTC(2026, 8, 23, 0, 5))).lat)).toBeLessThan(0.3)
  })

  it('says on its card where it is, the season, and how it stands for the observer', () => {
    const tokyo = { ...TOKYO, name: 'Tokyo' }
    const noon = sunLines(subsolarPoint(new Date(Date.UTC(2026, 8, 23, 3, 0))), tokyo)
    expect(noon[0]).toMatch(/^\d+\.\d{2}°[NS] \d+\.\d{2}°E$/)
    expect(noon[1]).toMatch(/^DECLINATION [+−]0\.\d{2}°$/)
    expect(noon.at(-1)).toMatch(/^TOKYO: SUN \+\d+° · DAY$/)
    const night = sunLines(subsolarPoint(new Date(Date.UTC(2026, 8, 23, 15, 0))), tokyo)
    expect(night.at(-1)).toMatch(/^TOKYO: SUN −\d+° · NIGHT$/)
    // At the June solstice the declination is the Tropic of Cancer.
    expect(sunLines(subsolarPoint(new Date(Date.UTC(2026, 5, 21, 12))), tokyo)[1]).toMatch(
      /^DECLINATION \+23\.4\d°$/,
    )
    expect(latLonText({ lat: -0.64, lon: -42.131 })).toBe('0.64°S 42.13°W')
  })

  it('is up at noon and down at midnight', () => {
    const noon = subsolarPoint(new Date(Date.UTC(2026, 8, 23, 3, 0)))
    const midnight = subsolarPoint(new Date(Date.UTC(2026, 8, 23, 15, 0)))
    expect(sunAltitude(TOKYO, noon)).toBeGreaterThan(40)
    expect(sunAltitude(TOKYO, midnight)).toBeLessThan(-40)
  })
})

describe('the clock and the ruler', () => {
  it('counts the day of the year as mission control does', () => {
    expect(gmtClock(new Date(Date.UTC(2026, 8, 23, 0, 34, 26))).text).toBe('266/00:34:26')
    expect(gmtClock(new Date(Date.UTC(2026, 0, 1, 0, 0, 0))).day).toBe(1)
  })

  it('gives each nominal zone the hour it keeps', () => {
    const ruler = hourRuler(new Date(Date.UTC(2026, 8, 23, 3, 30)))
    expect(ruler).toHaveLength(24)
    expect(ruler.find((z) => z.lon === 0)?.hour).toBe(3)
    expect(ruler.find((z) => z.lon === 135)?.hour).toBe(12)
    expect(ruler.find((z) => z.lon === -165)?.hour).toBe(16)
  })
})

describe('the stations', () => {
  it('puts the ISS in low orbit at orbital speed, and Tiangong beside it', () => {
    const state = satState(satrecOf(iss as never) as never, new Date(AT))
    expect(state?.altKm).toBeGreaterThan(370)
    expect(state?.altKm).toBeLessThan(460)
    expect(state?.speedKmS).toBeGreaterThan(7.5)
    expect(state?.speedKmS).toBeLessThan(7.8)
    expect(Math.abs(state?.lat ?? 99)).toBeLessThanOrEqual(51.7)
    expect(satState(satrecOf(css as never) as never, new Date(AT))?.altKm).toBeGreaterThan(350)
  })

  it("goes into the Earth's shadow for part of every orbit", () => {
    const satrec = satrecOf(iss as never) as never
    const lit = Array.from(
      { length: 93 },
      (_, m) => satState(satrec, new Date(AT + m * 60_000))?.sunlit,
    )
    expect(lit).toContain(true)
    expect(lit).toContain(false)
  })

  it('finds passes over Tokyo in a day, each with a rise before its set', () => {
    const found = passes(satrecOf(iss as never) as never, TOKYO, AT, 24)
    expect(found.length).toBeGreaterThan(0)
    for (const pass of found) {
      expect(pass.end).toBeGreaterThanOrEqual(pass.start)
      expect(pass.maxElevation).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('drawing helpers', () => {
  it('sizes the footprint from the height', () => {
    expect(footprintDegrees(420)).toBeCloseTo(20.3, 0)
    const ring = footprint({ lat: 0, lon: 179 }, 10)
    expect(ring.every((p) => p.lon >= -180 && p.lon <= 180)).toBe(true)
  })

  it('cuts a track at the date line', () => {
    const runs = splitAtDateLine([
      { lat: 0, lon: 170 },
      { lat: 1, lon: 179 },
      { lat: 2, lon: -175 },
      { lat: 3, lon: -170 },
    ])
    expect(runs.map((r) => r.length)).toEqual([2, 2])
  })

  it('names the compass point', () => {
    expect(compass(0)).toBe('N')
    expect(compass(314)).toBe('NW')
    expect(compass(-90)).toBe('W')
  })
})
