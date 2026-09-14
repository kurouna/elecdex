import { readFileSync } from 'node:fs'
import { parseUsgsFeed } from '@shared/quakes-usgs'
import {
  JMA_TSUNAMI_PAGE,
  latestJmaTsunamiReport,
  NOAA_TSUNAMI_PAGE,
  parseJmaTsunamiReport,
  parseNoaaTsunamiFeed,
  strongestTsunami,
  TSUNAMI_STALE_MS,
  type Tsunami,
  tsunamiAlertKey,
  tsunamiCurrent,
  tsunamiLevelLabel,
  tsunamiNeedsAlert,
  tsunamiSummary,
} from '@shared/tsunami'
import { describe, expect, it } from 'vitest'

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/quakes/${name}`, import.meta.url), 'utf8')

/** NOAA's National centre's real feed: an information statement ("no tsunami danger"). */
const information = fixture('noaa-paaq-information.xml')
/** The same feed as a warning bulletin would have it. */
const warning = information
  .replace('<strong>Category:</strong> Information', '<strong>Category:</strong> Warning')
  .replaceAll('2026-09-11T10:49:50Z', '2026-09-14T03:00:00Z')

describe('parseUsgsFeed', () => {
  it('reads the USGS feed: English places, magnitude, position, depth and event page', () => {
    const quakes = parseUsgsFeed(JSON.parse(fixture('usgs-4.5-day.json')))
    expect(quakes).toHaveLength(3)
    expect(quakes[0]).toMatchObject({
      source: 'usgs',
      id: 'us7000th8v',
      area: { ja: '120 km NE of Hengchun, Taiwan', en: '120 km NE of Hengchun, Taiwan' },
      lat: 22.7398,
      lon: 121.6019,
      depthKm: 10,
      magnitude: 4.6,
      maxIntensity: null,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000th8v',
    })
    // Newest first.
    expect(quakes.map((q) => q.at)).toEqual([...quakes.map((q) => q.at)].sort((a, b) => b - a))
  })

  it('drops what is not an earthquake or has no id or time, and links only to the USGS', () => {
    const quakes = parseUsgsFeed({
      features: [
        { id: 'a', properties: { type: 'quarry blast', time: 1, mag: 2 }, geometry: null },
        { id: '', properties: { time: 1 } },
        { id: 'b', properties: { mag: 5 } },
        {
          id: 'c',
          properties: { time: 5, mag: 5, place: '  ', url: 'https://evil.example/x' },
          geometry: { coordinates: [500, 10, 3.6] },
        },
        null,
      ],
    })
    expect(quakes).toHaveLength(1)
    expect(quakes[0]).toMatchObject({
      id: 'c',
      area: null,
      lat: null,
      lon: null,
      depthKm: 4,
      url: 'https://earthquake.usgs.gov/earthquakes/map/',
    })
    expect(parseUsgsFeed({ not: 'a feed' })).toEqual([])
  })
})

const NOW = Date.parse('2026-09-14T12:00:00+09:00')

/** A JMA tsunami report, shaped like bosai/tsunami/data/<file>.json (fields trimmed). */
const jmaReport = {
  Head: {
    Title: '津波警報・注意報・予報',
    ReportDateTime: '2026-09-14T11:50:00+09:00',
    Headline: { Text: '津波警報を発表しました。\nただちに避難してください。' },
  },
  Body: {
    Tsunami: {
      Forecast: {
        Item: [
          {
            Area: { Name: '宮城県', Code: '220' },
            Category: { Kind: { Name: '津波注意報', Code: '62' } },
            FirstHeight: { ArrivalTime: '2026-09-14T12:20:00+09:00' },
            MaxHeight: { TsunamiHeight: '1' },
          },
          {
            Area: { Name: '岩手県', Code: '210' },
            Category: { Kind: { Name: '津波警報', Code: '51' } },
            FirstHeight: { Condition: 'ただちに津波来襲と予測' },
            MaxHeight: { TsunamiHeight: '3' },
          },
          {
            Area: { Name: '青森県太平洋沿岸', Code: '201' },
            Category: { Kind: { Name: '津波予報（若干の海面変動）', Code: '71' } },
          },
        ],
      },
    },
  },
}

describe('JMA tsunami', () => {
  const list = [
    { eid: 'e1', json: 'older_VTSE41_0.json', rdt: '2026-09-14T11:40:00+09:00', ift: '発表' },
    { eid: 'e1', json: 'latest_VTSE41_1.json', rdt: '2026-09-14T11:50:00+09:00', ift: '発表' },
    { eid: 'e1', json: 'cancelled.json', rdt: '2026-09-14T11:55:00+09:00', ift: '取消' },
    { eid: 'e2', json: '../../etc/passwd', rdt: '2026-09-14T11:59:00+09:00', ift: '発表' },
  ]

  it('picks the latest report, skipping cancellations, odd file names and stale reports', () => {
    expect(latestJmaTsunamiReport(list, NOW)).toEqual({
      json: 'latest_VTSE41_1.json',
      eventId: 'e1',
      reportedAt: Date.parse('2026-09-14T11:50:00+09:00'),
    })
    expect(latestJmaTsunamiReport(list, NOW + TSUNAMI_STALE_MS.jma)).toBeNull()
    expect(latestJmaTsunamiReport([], NOW)).toBeNull()
    expect(latestJmaTsunamiReport('nonsense', NOW)).toBeNull()
  })

  it('reads the areas under a warning or advisory, strongest first, with arrival and height', () => {
    const tsunami = parseJmaTsunamiReport(jmaReport, { eventId: 'e1', reportedAt: NOW })
    expect(tsunami).toMatchObject({
      source: 'jma',
      level: 'warning',
      headline: '津波警報を発表しました。\nただちに避難してください。',
      url: JMA_TSUNAMI_PAGE,
    })
    expect(tsunami?.areas).toEqual([
      {
        name: '岩手県',
        level: 'warning',
        arrivalAt: null,
        arrivalNote: 'ただちに津波来襲と予測',
        height: '3',
      },
      {
        name: '宮城県',
        level: 'advisory',
        arrivalAt: Date.parse('2026-09-14T12:20:00+09:00'),
        arrivalNote: null,
        height: '1',
      },
    ])
    expect(tsunamiSummary(tsunami as Tsunami, 'ja')).toBe('岩手県 ほか 1 区域')
  })

  it('reads a major warning, and none when only forecasts or liftings remain', () => {
    const major = structuredClone(jmaReport)
    const first = major.Body.Tsunami.Forecast.Item[1]
    if (first) first.Category.Kind = { Name: '大津波警報', Code: '52' }
    expect(parseJmaTsunamiReport(major, { eventId: 'e1', reportedAt: NOW })?.level).toBe('major')

    const lifted = structuredClone(jmaReport)
    for (const item of lifted.Body.Tsunami.Forecast.Item) {
      item.Category.Kind = { Name: '津波警報解除', Code: '50' }
    }
    expect(parseJmaTsunamiReport(lifted, { eventId: 'e1', reportedAt: NOW })).toBeNull()
    expect(parseJmaTsunamiReport({}, { eventId: 'e1', reportedAt: NOW })).toBeNull()
    // A single area is an object, not a list.
    const single = {
      Body: { Tsunami: { Forecast: { Item: jmaReport.Body.Tsunami.Forecast.Item[1] } } },
    }
    expect(parseJmaTsunamiReport(single, { eventId: 'e1', reportedAt: NOW })?.areas).toHaveLength(1)
  })
})

describe('NOAA tsunami', () => {
  it('reads nothing from an information statement', () => {
    expect(parseNoaaTsunamiFeed(information, Date.parse('2026-09-11T11:00:00Z'))).toBeNull()
  })

  it('reads a warning: level, region, centre, bulletin page, and an id that survives new bulletins', () => {
    const now = Date.parse('2026-09-14T03:30:00Z')
    const tsunami = parseNoaaTsunamiFeed(warning, now)
    expect(tsunami).toMatchObject({
      source: 'noaa',
      level: 'warning',
      region: '110 miles SE of Amchitka, Alaska',
      headline: 'NWS National Tsunami Warning Center Palmer AK',
      url: 'https://www.tsunami.gov/events/PAAQ/2026/09/11/tl74mn/1/WEAK53/WEAK53.txt',
      issuedAt: Date.parse('2026-09-14T03:00:00Z'),
    })
    expect(tsunami?.areas.map((a) => a.name)).toEqual(['110 miles SE of Amchitka, Alaska'])
    const next = parseNoaaTsunamiFeed(warning.replaceAll('03:00:00Z', '04:00:00Z'), now)
    expect(next?.eventId).toBe(tsunami?.eventId)
    // Taken as over six hours after the last bulletin (NOAA sends no lifting in these feeds).
    expect(parseNoaaTsunamiFeed(warning, Date.parse('2026-09-14T09:00:00Z'))).not.toBeNull()
    expect(parseNoaaTsunamiFeed(warning, Date.parse('2026-09-14T09:00:01Z'))).toBeNull()
  })

  it('reads a watch, an advisory and a threat message; anything malformed reads as none', () => {
    const as = (category: string) =>
      parseNoaaTsunamiFeed(
        warning.replace('Category:</strong> Warning', `Category:</strong> ${category}`),
        Date.parse('2026-09-14T03:30:00Z'),
      )
    expect(as('Watch')?.level).toBe('watch')
    expect(as('Advisory')?.level).toBe('advisory')
    expect(as('Threat')?.level).toBe('warning')
    expect(as('Cancellation')).toBeNull()
    expect(parseNoaaTsunamiFeed('<feed></feed>', 0)).toBeNull()
    const elsewhere = warning.replaceAll(
      'https://www.tsunami.gov/events/PAAQ/2026/09/11/tl74mn/1/WEAK53/WEAK53.txt',
      'https://evil.example/x',
    )
    expect(parseNoaaTsunamiFeed(elsewhere, Date.parse('2026-09-14T03:30:00Z'))?.url).toBe(
      NOAA_TSUNAMI_PAGE,
    )
  })
})

describe('NOAA tsunami without a position', () => {
  it('keys the event by its region instead, still the same across bulletins', () => {
    const noGeo = warning
      .replace(/<geo:lat>[^<]*<\/geo:lat>/, '')
      .replace(/<geo:long>[^<]*<\/geo:long>/, '')
    const now = Date.parse('2026-09-14T03:30:00Z')
    const first = parseNoaaTsunamiFeed(noGeo, now)
    expect(first?.eventId).toContain('110 miles SE of Amchitka, Alaska')
    const later = parseNoaaTsunamiFeed(noGeo.replaceAll('03:00:00Z', '04:00:00Z'), now)
    expect(later?.eventId).toBe(first?.eventId)
  })
})

describe('tsunami helpers', () => {
  const make = (level: Tsunami['level'], issuedAt: number, eventId = 'e'): Tsunami => ({
    source: 'noaa',
    eventId,
    level,
    issuedAt,
    headline: null,
    areas: [],
    region: 'Somewhere',
    url: NOAA_TSUNAMI_PAGE,
  })

  it('keeps a tsunami in effect by its source’s limit', () => {
    expect(tsunamiCurrent(make('warning', 0), TSUNAMI_STALE_MS.noaa)).toBe(true)
    expect(tsunamiCurrent(make('warning', 0), TSUNAMI_STALE_MS.noaa + 1)).toBe(false)
    const jma = { ...make('warning', 0), source: 'jma' as const }
    expect(tsunamiCurrent(jma, TSUNAMI_STALE_MS.noaa + 1)).toBe(true)
    expect(tsunamiCurrent(jma, TSUNAMI_STALE_MS.jma + 1)).toBe(false)
  })

  it('shows the strongest, then the latest', () => {
    expect(strongestTsunami([null, make('advisory', 5), make('warning', 1)])?.level).toBe('warning')
    expect(strongestTsunami([make('watch', 1, 'a'), make('watch', 2, 'b')])?.eventId).toBe('b')
    expect(strongestTsunami([null, null])).toBeNull()
  })

  it('keys an alert by event and level, and announces only a level stronger than before', () => {
    expect(tsunamiAlertKey(make('advisory', 1))).not.toBe(tsunamiAlertKey(make('warning', 2)))
    expect(tsunamiAlertKey(make('warning', 1))).toBe(tsunamiAlertKey(make('warning', 9)))
    const announced = [tsunamiAlertKey(make('warning', 1)), 'quake-id', 'tsunami:noaa:e:bogus']
    expect(tsunamiNeedsAlert(make('advisory', 2), [])).toBe(true)
    expect(tsunamiNeedsAlert(make('warning', 2), announced)).toBe(false)
    expect(tsunamiNeedsAlert(make('advisory', 2), announced)).toBe(false)
    expect(tsunamiNeedsAlert(make('major', 2), announced)).toBe(true)
    // Another event starts afresh.
    expect(tsunamiNeedsAlert(make('advisory', 2, 'other'), announced)).toBe(true)
  })

  it('names levels in JMA’s terms in Japanese', () => {
    expect(tsunamiLevelLabel('major', 'ja')).toBe('大津波警報')
    expect(tsunamiLevelLabel('advisory', 'ja')).toBe('津波注意報')
    expect(tsunamiLevelLabel('watch', 'en')).toBe('Tsunami watch')
    expect(tsunamiSummary(make('watch', 1), 'en')).toBe('Somewhere')
  })
})
