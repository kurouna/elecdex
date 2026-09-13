import { describe, expect, it } from 'vitest'
import cities from '../../src/shared/geo/cities.json'
import {
  type CityRow,
  officeForPrefecture,
  pointChoice,
  searchPlaces,
} from '../../src/shared/weather-places.js'

const regions = new Intl.DisplayNames('en', { type: 'region' })
const data = {
  cities: cities as CityRow[],
  offices: [
    { code: '130000', name: '東京都', enName: 'Tokyo' },
    { code: '270000', name: '大阪府', enName: 'Osaka' },
  ],
  countryName: (code: string) => regions.of(code) ?? code,
  timeZone: 'Asia/Tokyo',
}

describe('place search', () => {
  it('bundles large cities and every capital', () => {
    expect(cities.length).toBeGreaterThan(1000)
    const names = new Set((cities as CityRow[]).map((c) => c[0]))
    for (const city of ['New York City', 'London', 'Tokyo', 'Reykjavik', 'Canberra']) {
      expect(names.has(city), city).toBe(true)
    }
  })

  it('finds a US city and forecasts it with the NWS', () => {
    const [first] = searchPlaces('new york', data)
    expect(first?.title).toBe('New York City')
    expect(first?.source).toBe('nws')
    expect(first?.location).toMatchObject({ timeZone: 'America/New_York', country: 'US' })
  })

  it('uses MET Norway elsewhere, and finds cities by country', () => {
    expect(searchPlaces('london', data)[0]).toMatchObject({ title: 'London', source: 'met' })
    const german = searchPlaces('germany', data)
    expect(german.length).toBeGreaterThan(2)
    expect(german.every((c) => c.detail.endsWith('Germany'))).toBe(true)
  })

  it('sends Japanese cities to their prefecture JMA office', () => {
    const yokohama = searchPlaces('yokohama', data)[0]
    expect(yokohama?.location).toEqual({ source: 'jma', office: '140000', name: 'Yokohama' })
    expect(searchPlaces('sapporo', data)[0]?.location).toMatchObject({ office: '016000' })
    expect(searchPlaces('osaka', data).some((c) => c.id === 'office:270000')).toBe(true)
    expect(officeForPrefecture('Kagoshima')).toBe('460100')
    expect(officeForPrefecture('Nowhere')).toBeNull()
  })

  it('takes coordinates as a place of their own', () => {
    expect(searchPlaces('35.68, 139.69', data)).toEqual([
      pointChoice('35.68, 139.69', 'Asia/Tokyo'),
    ])
    expect(pointChoice('35.681234 139.699999', 'UTC')?.location).toMatchObject({
      lat: 35.6812,
      lon: 139.7,
      source: 'met',
    })
    expect(pointChoice('95, 10', 'UTC')).toBeNull()
  })
})
