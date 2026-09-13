import { readFileSync } from 'node:fs'
import { glyphFor, WEATHER_CODES } from '@shared/jma-weather-codes'
import { JmaForecastSchema, lastCheckAt, nextCheckAt, summarizeForecast } from '@shared/weather'
import { describe, expect, it } from 'vitest'

// A real forecast for Tokyo (office 130000), issued 2026-09-13 11:00 JST.
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/jma-forecast-130000.json', import.meta.url), 'utf8'),
)

describe('JmaForecastSchema', () => {
  it('accepts a real forecast', () => {
    expect(JmaForecastSchema.safeParse(fixture).success).toBe(true)
  })

  it('rejects something that is not a forecast', () => {
    expect(JmaForecastSchema.safeParse({ error: 'nope' }).success).toBe(false)
    expect(JmaForecastSchema.safeParse([]).success).toBe(false)
  })
})

describe('summarizeForecast', () => {
  const forecast = JmaForecastSchema.parse(fixture)

  it('defaults to the first area and lists the others', () => {
    const summary = summarizeForecast(forecast)
    expect(summary?.area).toEqual({ name: '東京地方', code: '130010' })
    expect(summary?.areas.map((a) => a.code)).toEqual(['130010', '130020', '130030', '130040'])
    expect(summary?.point).toBe('東京')
    expect(summary?.reportDatetime).toBe('2026-09-13T11:00:00+09:00')
  })

  it('merges three short-term days with the weekly forecast, one entry per day', () => {
    const days = summarizeForecast(forecast)?.days ?? []
    expect(days.map((d) => d.date)).toEqual([
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ])
    // Short-term wording, with JMA's layout spaces removed.
    expect(days[0]?.code).toBe('211')
    expect(days[0]?.text).toBe('くもり夕方から晴れ所により昼過ぎまで雨')
    // Weekly-only days have codes but no wording.
    expect(days[5]?.text).toBeNull()
    expect(days[5]?.code).toBe('200')
    expect(days[5]?.reliability).toBe('B')
  })

  it('reads temperatures, dropping the repeated maximum JMA puts in a past minimum', () => {
    const days = summarizeForecast(forecast)?.days ?? []
    expect(days[0]).toMatchObject({ tempMax: 26, tempMin: null })
    expect(days[1]).toMatchObject({ tempMin: 23, tempMax: 31 })
    // From the weekly forecast.
    expect(days[2]).toMatchObject({ tempMin: 23, tempMax: 30 })
  })

  it('keeps six-hour precipitation chances where the short-term forecast has them', () => {
    const days = summarizeForecast(forecast)?.days ?? []
    expect(days[0]?.popBlocks).toHaveLength(4)
    expect(days[0]?.popBlocks?.[0]).toBeNull() // already past at 11:00
    expect(days[0]?.pop).not.toBeNull()
    // The weekly forecast's daily chance for a later day.
    expect(days[3]?.pop).toBe(60)
    expect(days[3]?.popBlocks).toBeNull()
  })

  it('switches area, and falls back to the first for an unknown code', () => {
    expect(summarizeForecast(forecast, '130040')?.area.name).toBe('小笠原諸島')
    expect(summarizeForecast(forecast, '130040')?.point).toBe('父島')
    expect(summarizeForecast(forecast, '999999')?.area.code).toBe('130010')
  })
})

describe('glyphFor', () => {
  it.each([
    ['100', 'clear', null, null],
    ['101', 'clear', 'cloudy', 'sometimes'],
    ['111', 'clear', 'cloudy', 'later'],
    ['203', 'cloudy', 'rain', 'sometimes'],
    ['211', 'cloudy', 'clear', 'later'],
    ['209', 'fog', null, null],
    ['300', 'rain', null, null],
    ['350', 'rain', 'thunder', 'sometimes'],
    ['405', 'snow', null, null],
    ['130', 'clear', 'fog', 'sometimes'],
  ])('reads code %s', (code, primary, secondary, transition) => {
    expect(glyphFor(code)).toMatchObject({ primary, secondary, transition })
  })

  it('never fails on a code missing from the table', () => {
    expect(glyphFor('399')).toMatchObject({ primary: 'rain', secondary: null, label: '雨' })
    expect(glyphFor('xyz').primary).toBe('cloudy')
  })

  it('gives every code in the table a main condition', () => {
    for (const code of Object.keys(WEATHER_CODES)) {
      expect(glyphFor(code).primary, code).toBeTruthy()
    }
  })
})

describe('forecast check schedule', () => {
  const jst = (s: string) => Date.parse(`${s}+09:00`)

  it('checks shortly before and after each publication', () => {
    expect(nextCheckAt(jst('2026-09-13T10:00:00'))).toBe(jst('2026-09-13T10:48:00'))
    expect(nextCheckAt(jst('2026-09-13T10:48:00'))).toBe(jst('2026-09-13T11:03:00'))
    expect(nextCheckAt(jst('2026-09-13T11:03:00'))).toBe(jst('2026-09-13T11:20:00'))
    expect(nextCheckAt(jst('2026-09-13T11:20:00'))).toBe(jst('2026-09-13T16:48:00'))
  })

  it('wraps past midnight', () => {
    expect(nextCheckAt(jst('2026-09-13T17:30:00'))).toBe(jst('2026-09-13T23:48:00'))
    expect(nextCheckAt(jst('2026-09-13T23:50:00'))).toBe(jst('2026-09-14T00:03:00'))
  })

  it('knows the latest check that has passed', () => {
    expect(lastCheckAt(jst('2026-09-13T12:00:00'))).toBe(jst('2026-09-13T11:20:00'))
    expect(lastCheckAt(jst('2026-09-13T00:01:00'))).toBe(jst('2026-09-12T23:48:00'))
  })
})
