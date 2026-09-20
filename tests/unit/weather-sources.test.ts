import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { JmaForecastSchema } from '../../src/shared/weather.js'
import {
  DEFAULT_LOCATION,
  formatTemperature,
  locationKey,
  parseLocationKey,
  placeLabel,
  readLocation,
  sourceForCountry,
} from '../../src/shared/weather-report.js'
import {
  forecastPageUrl,
  jmaReport,
  MetForecastSchema,
  metGlyph,
  metReport,
  NwsForecastSchema,
  NwsPointSchema,
  nwsGlyph,
  nwsReport,
} from '../../src/shared/weather-sources.js'

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'))

describe('locations', () => {
  it('keys a place by what changes the request', () => {
    expect(locationKey(DEFAULT_LOCATION)).toBe('nws:40.7143,-74.006:America/New_York')
    expect(locationKey({ source: 'jma', office: '130000', area: '130010', name: 'Tokyo' })).toBe(
      'jma:130000:130010',
    )
    expect(
      locationKey({
        source: 'met',
        lat: 51.50853,
        lon: -0.12574,
        name: 'London',
        country: 'GB',
        timeZone: 'Europe/London',
      }),
    ).toBe('met:51.5085,-0.1257:Europe/London')
  })

  it('accepts only well-formed keys from the renderer', () => {
    expect(parseLocationKey('jma:130000')).toEqual({ source: 'jma', office: '130000', area: null })
    expect(parseLocationKey('met:51.5085,-0.1257:Europe/London')).toEqual({
      source: 'met',
      lat: 51.5085,
      lon: -0.1257,
      timeZone: 'Europe/London',
    })
    expect(parseLocationKey('met:51.50853,-0.1257:Europe/London')).toBeNull()
    expect(parseLocationKey('met:95,0:UTC')).toBeNull()
    expect(parseLocationKey('met:1,1:Not/AZone')).toBeNull()
    expect(parseLocationKey('file:///etc/passwd')).toBeNull()
  })

  it('reads old JMA panes and falls back to New York', () => {
    expect(readLocation({ office: '270000', area: '270100' })).toEqual({
      source: 'jma',
      office: '270000',
      area: '270100',
      name: '270000',
    })
    expect(readLocation(undefined)).toEqual(DEFAULT_LOCATION)
    expect(
      readLocation({ location: { source: 'met', lat: 200, lon: 0, timeZone: 'UTC' } }),
    ).toEqual(DEFAULT_LOCATION)
  })

  it('picks the source by country', () => {
    expect(sourceForCountry('JP')).toBe('jma')
    expect(sourceForCountry('US')).toBe('nws')
    expect(sourceForCountry('GB')).toBe('met')
  })

  it('converts temperatures', () => {
    expect(formatTemperature(20, 'c')).toBe('20°')
    expect(formatTemperature(20, 'f')).toBe('68°')
    expect(formatTemperature(-40, 'f')).toBe('-40°')
    expect(formatTemperature(null, 'f')).toBe('--')
  })
})

describe('the page each source shows the place on', () => {
  it('opens the prefecture on JMA, the point on the NWS and on yr.no', () => {
    expect(
      forecastPageUrl({ source: 'jma', office: '270000', area: '270000', name: '大阪市' }),
    ).toBe('https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=270000')
    expect(forecastPageUrl(DEFAULT_LOCATION)).toBe(
      'https://forecast.weather.gov/MapClick.php?lat=40.7143&lon=-74.006',
    )
    expect(
      forecastPageUrl({
        source: 'met',
        lat: 51.50735,
        lon: -0.12776,
        name: 'London',
        country: 'GB',
        timeZone: 'Europe/London',
      }),
    ).toBe('https://www.yr.no/en/forecast/daily-table/51.5074,-0.1278')
  })
})

describe('JMA', () => {
  it('becomes a report with its areas and six-hour chances', () => {
    const forecast = JmaForecastSchema.parse(fixture('jma-forecast-130000.json'))
    const report = jmaReport(forecast, undefined)
    expect(report?.source.id).toBe('jma')
    expect(report?.place).toBe('東京地方')
    expect(report?.now).toBeNull()
    expect(report?.areas?.length).toBeGreaterThan(1)
    expect(report?.days[0]?.text).toBe('くもり夕方から晴れ所により昼過ぎまで雨')
    expect(report?.days[0]?.blocks).toHaveLength(4)
    expect(report?.days.length).toBeGreaterThanOrEqual(7)
  })

  it('titles a place with its area, since an area alone does not say where it is', () => {
    const forecast = JmaForecastSchema.parse(fixture('jma-forecast-130000.json'))
    const office = { source: 'jma', office: '130000', name: '東京都' } as const
    expect(placeLabel(office, jmaReport(forecast, undefined))).toBe('東京都 東京地方')
    // Another area of the same office keeps the place in front.
    const other = { ...office, area: '130040' }
    expect(placeLabel(other, jmaReport(forecast, '130040'))).toBe('東京都 小笠原諸島')
    // A city chosen in the picker is the place, whatever the office's areas are called.
    const city = { source: 'jma', office: '130000', name: 'Hachioji' } as const
    expect(placeLabel(city, jmaReport(forecast, undefined))).toBe('Hachioji 東京地方')
    // Before a report arrives there is no area to add.
    expect(placeLabel(office, null)).toBe('東京都')
    // An old pane saved no name and reads with the office code in its place.
    const old = readLocation({ office: '130000', area: '130040' })
    expect(placeLabel(old, jmaReport(forecast, '130040'))).toBe('小笠原諸島')
    expect(placeLabel(old, null)).toBe('130000')
  })

  it('titles other sources by the chosen place only', () => {
    const forecast = MetForecastSchema.parse(fixture('met-london.json'))
    const london = {
      source: 'met',
      lat: 51.5085,
      lon: -0.1257,
      name: 'London',
      country: 'GB',
      timeZone: 'Europe/London',
    } as const
    const report = metReport(forecast, { name: 'Somewhere else', timeZone: london.timeZone }, 0)
    expect(placeLabel(london, report)).toBe('London')
    expect(placeLabel(DEFAULT_LOCATION, null)).toBe('New York City')
  })
})

describe('MET Norway', () => {
  const forecast = MetForecastSchema.parse(fixture('met-london.json'))
  const first = Date.parse(forecast.properties.timeseries[0]?.time ?? '')

  it('summarises the time series into local days', () => {
    const report = metReport(forecast, { name: 'London', timeZone: 'Europe/London' }, first)
    expect(report.source.credit).toMatch(/MET Norway.*CC BY 4\.0/)
    expect(report.now?.temp).toBeTypeOf('number')
    expect(report.days.length).toBeGreaterThanOrEqual(8)
    for (const day of report.days) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(day.sky).not.toBeNull()
      expect(day.tempMax).not.toBeNull()
      expect(day.tempMin as number).toBeLessThanOrEqual(day.tempMax as number)
      expect(day.precipMm).not.toBeNull()
    }
    // Dates are distinct and in order.
    const dates = report.days.map((d) => d.date)
    expect([...dates].sort()).toEqual(dates)
    expect(new Set(dates).size).toBe(dates.length)
  })

  it('does not count overlapping hours twice', () => {
    const t0 = Date.parse('2026-01-01T00:00:00Z')
    const series = Array.from({ length: 12 }, (_, i) => ({
      time: new Date(t0 + i * 3_600_000).toISOString(),
      data: {
        instant: { details: { air_temperature: 5 } },
        next_1_hours: { summary: { symbol_code: 'rain' }, details: { precipitation_amount: 1 } },
        next_6_hours: { summary: { symbol_code: 'rain' }, details: { precipitation_amount: 6 } },
      },
    }))
    const report = metReport(
      { properties: { meta: { updated_at: '2026-01-01T00:00:00Z' }, timeseries: series } },
      { name: 'Test', timeZone: 'UTC' },
      t0,
    )
    expect(report.days[0]?.precipMm).toBe(12)
    expect(report.days[0]?.blocks?.map((b) => b?.precipMm ?? null)).toEqual([6, 6, null, null])
  })

  it('reads symbol codes', () => {
    expect(metGlyph('clearsky_day')).toMatchObject({ primary: 'clear', secondary: null })
    expect(metGlyph('partlycloudy_night')).toMatchObject({ primary: 'clear', secondary: 'cloudy' })
    expect(metGlyph('lightrainshowers_day')).toMatchObject({ primary: 'cloudy', secondary: 'rain' })
    expect(metGlyph('heavysnow')).toMatchObject({ primary: 'snow' })
    expect(metGlyph('rainandthunder')).toMatchObject({ primary: 'thunder', secondary: 'rain' })
    expect(metGlyph('fog')).toMatchObject({ primary: 'fog' })
  })
})

describe('NWS', () => {
  const point = NwsPointSchema.parse(fixture('nws-point-nyc.json'))
  const forecast = NwsForecastSchema.parse(fixture('nws-forecast-nyc.json'))
  const hourly = NwsForecastSchema.parse(fixture('nws-hourly-nyc.json'))

  it('pairs day and night periods into days, in Celsius', () => {
    const report = nwsReport(point, forecast, hourly, 'New York City')
    expect(report.source.id).toBe('nws')
    expect(report.timeZone).toBe('America/New_York')
    expect(report.now?.temp).toBeTypeOf('number')
    expect(report.days.length).toBeGreaterThanOrEqual(6)
    const today = report.days[0]
    expect(today?.pop).toBe(88)
    expect(today?.text).toBe('Showers And Thunderstorms')
    // 79°F
    expect(today?.tempMax).toBe(26)
    expect(report.days.slice(1, -1).every((d) => d.tempMin !== null && d.tempMax !== null)).toBe(
      true,
    )
  })

  it('reads short forecasts', () => {
    expect(nwsGlyph('Sunny')).toMatchObject({ primary: 'clear', secondary: null })
    expect(nwsGlyph('Partly Cloudy')).toMatchObject({ primary: 'clear', secondary: 'cloudy' })
    expect(nwsGlyph('Chance Rain Showers')).toMatchObject({ primary: 'cloudy', secondary: 'rain' })
    expect(nwsGlyph('Showers And Thunderstorms')).toMatchObject({ primary: 'thunder' })
    expect(nwsGlyph('Rain then Mostly Sunny')).toMatchObject({
      primary: 'rain',
      secondary: 'clear',
      transition: 'later',
    })
  })
})
