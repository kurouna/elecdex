import { describe, expect, it } from 'vitest'
import {
  angularDistance,
  arcPoints,
  guessHome,
  homeFromTimeZone,
  latLonToVec3,
} from '../../src/renderer/widgets/globe/geo.js'
import landPoints from '../../src/renderer/widgets/globe/land-points.json'

const close = (v: number[], expected: number[]) => {
  for (const [i, x] of v.entries()) expect(x).toBeCloseTo(expected[i] ?? 0, 6)
}

describe('latLonToVec3', () => {
  it('puts Greenwich on the equator facing +z, the poles on y, and 90E on +x', () => {
    close(latLonToVec3(0, 0), [0, 0, 1])
    close(latLonToVec3(90, 0), [0, 1, 0])
    close(latLonToVec3(-90, 0), [0, -1, 0])
    close(latLonToVec3(0, 90), [1, 0, 0])
  })

  it('scales by radius', () => {
    const [x, y, z] = latLonToVec3(35, 139, 2)
    expect(Math.hypot(x, y, z)).toBeCloseTo(2, 9)
  })
})

describe('arcPoints', () => {
  const tokyo = { lat: 35.68, lon: 139.69 }
  const newYork = { lat: 40.71, lon: -74.0 }

  it('starts and ends on the surface at the two places', () => {
    const points = arcPoints(tokyo, newYork, 32)
    expect(points).toHaveLength(33)
    close(points[0] ?? [], latLonToVec3(tokyo.lat, tokyo.lon))
    close(points[32] ?? [], latLonToVec3(newYork.lat, newYork.lon))
  })

  it('rises higher for a longer hop', () => {
    const peak = (points: number[][]) => Math.max(...points.map((p) => Math.hypot(...p)))
    const near = arcPoints(tokyo, { lat: 37.56, lon: 126.97 })
    const far = arcPoints(tokyo, newYork)
    expect(peak(far)).toBeGreaterThan(peak(near))
    expect(peak(near)).toBeGreaterThan(1)
  })

  it('does not produce NaN for the same place twice', () => {
    for (const p of arcPoints(tokyo, tokyo, 8))
      for (const v of p) expect(Number.isFinite(v)).toBe(true)
    expect(angularDistance(tokyo, tokyo)).toBeCloseTo(0, 6)
  })
})

describe('homeFromTimeZone', () => {
  it('places a time zone in its country', () => {
    expect(homeFromTimeZone('Asia/Tokyo')).toMatchObject({ zone: 'Asia/Tokyo', country: 'JP' })
    expect(homeFromTimeZone('Europe/Paris')?.country).toBe('FR')
    expect(homeFromTimeZone('America/New_York')?.lat).toBeCloseTo(39.5, 0)
  })

  it('gives up on a zone with no country', () => {
    expect(homeFromTimeZone('UTC')).toBeNull()
    expect(homeFromTimeZone('Not/AZone')).toBeNull()
  })
})

describe('guessHome', () => {
  const at = new Date(Date.UTC(2026, 8, 13, 12))

  it('prefers the time zone', () => {
    expect(guessHome('Asia/Tokyo', 'en-US', at)).toMatchObject({ country: 'JP', basis: 'zone' })
  })

  it('falls back to the locale region when the zone names no country', () => {
    expect(guessHome('UTC', 'ja-JP', at)).toMatchObject({ country: 'JP', basis: 'locale' })
    // A language alone implies its likeliest region.
    expect(guessHome('Etc/GMT-9', 'ja', at)).toMatchObject({ country: 'JP', basis: 'locale' })
  })

  it('then to the largest city on the same offset', () => {
    const home = guessHome('Etc/GMT-9', '', at)
    expect(home?.basis).toBe('offset')
    expect(['JP', 'KR']).toContain(home?.country)
  })
})

describe('generated land points', () => {
  it('covers the continents and leaves the oceans empty', () => {
    const pairs: Array<[number, number]> = []
    for (let i = 0; i < landPoints.length; i += 2)
      pairs.push([landPoints[i] ?? 0, landPoints[i + 1] ?? 0])
    // Roughly the 29% of the Earth that is land, of 12000 sphere points.
    expect(pairs.length).toBeGreaterThan(2800)
    expect(pairs.length).toBeLessThan(4200)
    const near = (lat: number, lon: number) =>
      pairs.some(([a, b]) => Math.abs(a - lat) < 3 && Math.abs(b - lon) < 3)
    expect(near(-25, 134)).toBe(true) // central Australia
    expect(near(60, 100)).toBe(true) // Siberia
    expect(near(0, -140)).toBe(false) // the middle of the Pacific
  })
})
