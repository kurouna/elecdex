import {
  ALERT_WINDOW_MS,
  areaLabel,
  clockTime,
  describeQuake,
  intensityLabel,
  intensityShort,
  JMA_QUAKE_PAGE,
  magnitudeLabel,
  parseCoordinates,
  parseQuakeList,
  type Quake,
  quakeLanguage,
  quakeSeverity,
  quakesToAlert,
  resolveQuakeSource,
  sourceCredit,
} from '@shared/quakes'
import { describe, expect, it } from 'vitest'
import {
  QUAKE_PULSE_MS,
  QUAKE_SHOWN_MS,
  visibleQuakes,
} from '../../src/renderer/widgets/globe/geo.js'

/** Reports shaped as in JMA's list.json (fields trimmed to those read). */
const report = (fields: Record<string, unknown>) => ({
  ift: '発表',
  ser: '1',
  anm: '',
  en_anm: '',
  cod: '',
  mag: '',
  maxi: '',
  ...fields,
})

/** One earthquake's three reports, as JMA issues them: intensities, hypocentre, both. */
const sequence = [
  report({
    ttl: '震源・震度情報',
    eid: '20260913173132',
    at: '2026-09-13T17:31:00+09:00',
    rdt: '2026-09-13T17:35:00+09:00',
    anm: '福島県沖',
    en_anm: 'Off the Coast of Fukushima Prefecture',
    cod: '+37.6+141.7-50000/',
    mag: '4.6',
    maxi: '4',
  }),
  report({
    ttl: '震源に関する情報',
    eid: '20260913173132',
    at: '2026-09-13T17:31:00+09:00',
    rdt: '2026-09-13T17:34:00+09:00',
    anm: '福島県沖',
    en_anm: 'Off the Coast of Fukushima Prefecture',
    cod: '+37.6+141.7-50000/',
    mag: '4.5',
  }),
  report({
    ttl: '震度速報',
    eid: '20260913173132',
    at: '2026-09-13T17:31:00+09:00',
    rdt: '2026-09-13T17:33:00+09:00',
    ser: 0,
    maxi: '3',
  }),
]

describe('parseCoordinates', () => {
  it('reads latitude, longitude and depth in km', () => {
    expect(parseCoordinates('+40.1+141.7-10000/')).toEqual({ lat: 40.1, lon: 141.7, depthKm: 10 })
    expect(parseCoordinates('-06.1+105.4/')).toEqual({ lat: -6.1, lon: 105.4, depthKm: null })
    expect(parseCoordinates('+35.0+135.0+0/')).toEqual({ lat: 35, lon: 135, depthKm: 0 })
  })

  it('refuses what is not a coordinate', () => {
    expect(parseCoordinates('')).toBeNull()
    expect(parseCoordinates('+95.0+141.7/')).toBeNull()
    expect(parseCoordinates('somewhere')).toBeNull()
  })
})

describe('parseQuakeList', () => {
  it('merges an earthquake’s reports into one, the latest value of each field winning', () => {
    const [quake, ...rest] = parseQuakeList(sequence)
    expect(rest).toEqual([])
    expect(quake).toEqual({
      source: 'jma',
      url: JMA_QUAKE_PAGE,
      id: '20260913173132',
      at: Date.parse('2026-09-13T17:31:00+09:00'),
      reportedAt: Date.parse('2026-09-13T17:35:00+09:00'),
      area: { ja: '福島県沖', en: 'Off the Coast of Fukushima Prefecture' },
      lat: 37.6,
      lon: 141.7,
      depthKm: 50,
      magnitude: 4.6,
      maxIntensity: '4',
      distant: false,
    })
  })

  it('has only intensities while the first report is all there is', () => {
    const [quake] = parseQuakeList([sequence[2]])
    expect(quake).toMatchObject({ area: null, lat: null, magnitude: null, maxIntensity: '3' })
  })

  it('keeps distant earthquakes, without an intensity, and reads an unknown magnitude as none', () => {
    const [quake] = parseQuakeList([
      report({
        ttl: '遠地地震に関する情報',
        eid: '20260905025000',
        at: '2026-09-05T02:50:00+09:00',
        rdt: '2026-09-05T12:30:00+09:00',
        anm: 'インドネシア付近',
        en_anm: 'Adjacent Indonesia',
        cod: '-06.1+105.4/',
        mag: 'Ｍ不明',
      }),
    ])
    expect(quake).toMatchObject({
      distant: true,
      maxIntensity: null,
      magnitude: null,
      depthKm: null,
    })
  })

  it('drops cancelled earthquakes, reports that are not about one, and malformed entries', () => {
    const quakes = parseQuakeList([
      ...sequence,
      report({
        ttl: '震度速報',
        ift: '取消',
        eid: '20260913173132',
        at: '2026-09-13T17:31:00+09:00',
        rdt: '2026-09-13T17:40:00+09:00',
      }),
      report({ ttl: '南海トラフ地震関連解説情報', eid: '1', at: '2026-09-13T00:00:00+09:00' }),
      report({ ttl: '震度速報', eid: '', at: '2026-09-13T00:00:00+09:00' }),
      report({ ttl: '震度速報', eid: '2', at: 'not a date' }),
      null,
      'text',
    ])
    expect(quakes).toEqual([])
    expect(parseQuakeList({ not: 'a list' })).toEqual([])
  })

  it('lists earthquakes newest first, at most the limit', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      report({
        ttl: '震度速報',
        eid: `e${i}`,
        at: new Date(Date.UTC(2026, 8, 1 + i)).toISOString(),
        rdt: new Date(Date.UTC(2026, 8, 1 + i)).toISOString(),
        maxi: '1',
      }),
    )
    expect(parseQuakeList(many, 3).map((q) => q.id)).toEqual(['e4', 'e3', 'e2'])
  })
})

const NOW = Date.parse('2026-09-14T12:00:00+09:00')
const quake = (fields: Partial<Quake>): Quake => ({
  source: 'jma',
  url: JMA_QUAKE_PAGE,
  id: 'q',
  at: NOW - 5 * 60_000,
  reportedAt: NOW - 3 * 60_000,
  area: { ja: '岩手県沖', en: 'Off the Coast of Iwate Prefecture' },
  lat: 40.4,
  lon: 142.1,
  depthKm: 10,
  magnitude: 5.1,
  maxIntensity: '5-',
  distant: false,
  ...fields,
})

describe('quakesToAlert', () => {
  const jma = { source: 'jma', minIntensity: '5-' } as const
  const options = { rule: jma, now: NOW, alerted: new Set<string>() }

  it('announces a recent earthquake at or above the chosen intensity', () => {
    expect(quakesToAlert([quake({ id: 'a' })], options).map((q) => q.id)).toEqual(['a'])
    expect(quakesToAlert([quake({ id: 'b', maxIntensity: '6+' })], options)).toHaveLength(1)
  })

  it('stays quiet below it, without an intensity, when old, or when already announced', () => {
    expect(quakesToAlert([quake({ maxIntensity: '4' })], options)).toEqual([])
    expect(quakesToAlert([quake({ maxIntensity: null, distant: true })], options)).toEqual([])
    expect(quakesToAlert([quake({ at: NOW - ALERT_WINDOW_MS.jma - 1 })], options)).toEqual([])
    expect(
      quakesToAlert([quake({ id: 'seen' })], { ...options, alerted: new Set(['seen']) }),
    ).toEqual([])
  })

  it('does not announce an earthquake dated in the future (a bad clock or report)', () => {
    expect(quakesToAlert([quake({ at: NOW + 60_000 })], options)).toHaveLength(1)
    expect(quakesToAlert([quake({ at: NOW + 60_001 })], options)).toEqual([])
  })

  it('follows the chosen intensity down the scale', () => {
    expect(
      quakesToAlert([quake({ maxIntensity: '1' })], {
        ...options,
        rule: { source: 'jma', minIntensity: '1' },
      }),
    ).toHaveLength(1)
  })

  it('announces the world by magnitude, within a longer window, and only its own source', () => {
    const world = { ...options, rule: { source: 'usgs', minMagnitude: 6 } as const }
    const usgs = (fields: Partial<Quake>) =>
      quake({ source: 'usgs', maxIntensity: null, magnitude: 6.2, ...fields })
    expect(quakesToAlert([usgs({ id: 'big' })], world).map((q) => q.id)).toEqual(['big'])
    expect(quakesToAlert([usgs({ magnitude: 5.9 })], world)).toEqual([])
    expect(quakesToAlert([usgs({ magnitude: null })], world)).toEqual([])
    expect(quakesToAlert([usgs({ at: NOW - 45 * 60_000 })], world)).toHaveLength(1)
    expect(quakesToAlert([usgs({ at: NOW - ALERT_WINDOW_MS.usgs - 1 })], world)).toEqual([])
    // A JMA quake never passes a world rule, and the other way round.
    expect(quakesToAlert([quake({ magnitude: 7 })], world)).toEqual([])
    expect(quakesToAlert([usgs({ maxIntensity: '7' })], options)).toEqual([])
  })
})

describe('resolveQuakeSource', () => {
  it('keeps a chosen source, and picks Japan by the Tokyo zone or a ja-JP locale', () => {
    expect(resolveQuakeSource('usgs', 'Asia/Tokyo', 'ja-JP')).toBe('usgs')
    expect(resolveQuakeSource('jma', 'America/New_York', 'en-US')).toBe('jma')
    expect(resolveQuakeSource('auto', 'Asia/Tokyo', 'en-US')).toBe('jma')
    expect(resolveQuakeSource('auto', 'UTC', 'ja-JP')).toBe('jma')
    expect(resolveQuakeSource('auto', 'Europe/London', 'ja')).toBe('usgs')
    expect(resolveQuakeSource('auto', undefined, undefined)).toBe('usgs')
  })
})

describe('labels', () => {
  it('names intensities in Japanese and English', () => {
    expect(intensityLabel('5-', 'ja')).toBe('震度5弱')
    expect(intensityLabel('6+', 'ja')).toBe('震度6強')
    expect(intensityLabel('3', 'ja')).toBe('震度3')
    expect(intensityLabel('5+', 'en')).toBe('Shindo 5+')
  })

  it('picks the language from the locale', () => {
    expect(quakeLanguage('ja-JP')).toBe('ja')
    expect(quakeLanguage('en-US')).toBe('en')
    expect(quakeLanguage(undefined)).toBe('en')
  })

  it('describes what is known so far', () => {
    expect(describeQuake(quake({}), 'ja')).toBe('岩手県沖 · 震度5弱 · M5.1 · 深さ10km')
    expect(describeQuake(quake({}), 'en')).toBe(
      'Off the Coast of Iwate Prefecture · Shindo 5- · M5.1 · depth 10 km',
    )
    const first = quake({ area: null, magnitude: null, depthKm: null, maxIntensity: '4' })
    expect(describeQuake(first, 'ja')).toBe('震源調査中 · 震度4')
    expect(areaLabel(first, 'en')).toBe('Hypocentre pending')
  })

  it('shortens intensities for a badge, and labels magnitudes, times and sources', () => {
    expect(intensityShort('5-', 'ja')).toBe('5弱')
    expect(intensityShort('6+', 'en')).toBe('6+')
    expect(magnitudeLabel(6.05)).toBe('M6.0')
    expect(magnitudeLabel(null)).toBe('M?')
    expect(clockTime(new Date(2026, 8, 14, 9, 5).getTime())).toBe('09:05')
    expect(sourceCredit('jma', 'ja')).toBe('出典：気象庁')
    expect(sourceCredit('usgs', 'en')).toBe('Source: USGS')
    expect(sourceCredit('noaa', 'en')).toContain('NOAA')
  })

  it('grades severity by intensity, and by magnitude for the world', () => {
    expect(quakeSeverity(quake({ maxIntensity: '2' }))).toBe('minor')
    expect(quakeSeverity(quake({ maxIntensity: '3' }))).toBe('moderate')
    expect(quakeSeverity(quake({ maxIntensity: '4' }))).toBe('moderate')
    expect(quakeSeverity(quake({ maxIntensity: '5-' }))).toBe('severe')
    expect(quakeSeverity(quake({ maxIntensity: null }))).toBe('minor')
    const usgs = (magnitude: number | null) =>
      quake({ source: 'usgs', maxIntensity: null, magnitude })
    expect(quakeSeverity(usgs(4.9))).toBe('minor')
    expect(quakeSeverity(usgs(5))).toBe('moderate')
    expect(quakeSeverity(usgs(6))).toBe('severe')
    expect(quakeSeverity(usgs(null))).toBe('minor')
  })
})

describe('visibleQuakes (globe)', () => {
  it('marks located earthquakes of the last day, pulsing for the first hour', () => {
    const marked = visibleQuakes(
      [
        quake({ id: 'fresh', at: NOW - 10 * 60_000 }),
        quake({ id: 'today', at: NOW - QUAKE_PULSE_MS - 1 }),
        quake({ id: 'old', at: NOW - QUAKE_SHOWN_MS - 1 }),
        quake({ id: 'unlocated', lat: null, lon: null }),
      ],
      NOW,
    )
    expect(marked.map(({ quake: q, pulse }) => [q.id, pulse])).toEqual([
      ['fresh', true],
      ['today', false],
    ])
  })
})
