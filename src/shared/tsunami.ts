/**
 * Tsunami warnings, watches and advisories in effect, read alongside the
 * earthquake list of the chosen source.
 *
 *  - Japan: JMA's `bosai/tsunami/data/list.json` (usually empty) names each
 *    report's detail file; the latest report's forecast lists every coastal area
 *    with its category (大津波警報, 津波警報, 津波注意報, a forecast, a lifting),
 *    and the expected arrival and height.
 *  - The world: the latest bulletin of each of NOAA's two tsunami warning centres
 *    (Pacific, and National for North America), as their Atom feeds carry it.
 *
 * Only levels that ask people to act count: a forecast of slight sea-level change,
 * an information statement or a lifting leaves no tsunami in effect.
 */

export type TsunamiLevel = 'major' | 'warning' | 'watch' | 'advisory'

/** Strongest first. */
export const TSUNAMI_LEVELS: readonly TsunamiLevel[] = ['major', 'warning', 'watch', 'advisory']

export const tsunamiRank = (level: TsunamiLevel): number =>
  TSUNAMI_LEVELS.length - TSUNAMI_LEVELS.indexOf(level)

export interface TsunamiArea {
  name: string
  level: TsunamiLevel
  /** The expected arrival time (ms since epoch), when given as a time. */
  arrivalAt: number | null
  /** Or what is said instead: "第１波の到達を確認", "ただちに津波来襲と予測". */
  arrivalNote: string | null
  /** The expected maximum height as JMA writes it: "3", "10超", "巨大". */
  height: string | null
}

export interface Tsunami {
  source: 'jma' | 'noaa'
  /** The event it is about; with the level, what an alert is announced once for. */
  eventId: string
  /** The strongest level in effect anywhere. */
  level: TsunamiLevel
  issuedAt: number
  /** The issuer's own summary, when it gives one. */
  headline: string | null
  /** Areas under a warning, watch or advisory, strongest first. */
  areas: TsunamiArea[]
  /** For NOAA, the region of the earthquake. */
  region: string | null
  url: string
}

/** A tsunami in effect is dropped this long after its last report, if no lifting ever came. */
export const TSUNAMI_STALE_MS = 24 * 60 * 60_000

export const JMA_TSUNAMI_PAGE = 'https://www.jma.go.jp/bosai/map.html#contents=tsunami'
export const NOAA_TSUNAMI_PAGE = 'https://www.tsunami.gov/'

/** The key a tsunami alert is announced once for: a stronger level is announced again. */
export const tsunamiAlertKey = (tsunami: Tsunami): string =>
  `tsunami:${tsunami.source}:${tsunami.eventId}:${tsunami.level}`

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/** The value at a path of object keys, or undefined where the shape differs. */
function at(value: unknown, ...keys: string[]): unknown {
  let current = value
  for (const key of keys) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]

/**
 * JMA's category codes (防災情報XML): 52 and 53 大津波警報, 51 津波警報,
 * 62 津波注意報. Forecasts (71-73), liftings (50, 60) and "no tsunami" (00) are
 * not in effect.
 */
const JMA_KINDS: Record<string, TsunamiLevel> = {
  '52': 'major',
  '53': 'major',
  '51': 'warning',
  '62': 'advisory',
}

/**
 * The detail file of JMA's latest tsunami report, or null when there is none
 * recent enough to matter. Cancelled reports are skipped.
 */
export function latestJmaTsunamiReport(
  raw: unknown,
  now: number,
): { json: string; eventId: string; reportedAt: number } | null {
  let latest: { json: string; eventId: string; reportedAt: number } | null = null
  for (const entry of asArray(raw)) {
    if (typeof entry !== 'object' || entry === null) continue
    const e = entry as Record<string, unknown>
    const json = text(e.json)
    const reportedAt = Date.parse(text(e.rdt))
    if (!/^[\w.-]+\.json$/.test(json) || !Number.isFinite(reportedAt)) continue
    if (text(e.ift) === '取消' || now - reportedAt > TSUNAMI_STALE_MS) continue
    if (latest === null || reportedAt > latest.reportedAt) {
      latest = { json, eventId: text(e.eid) || json, reportedAt }
    }
  }
  return latest
}

function jmaArea(item: unknown): TsunamiArea | null {
  const level = JMA_KINDS[text(at(item, 'Category', 'Kind', 'Code'))]
  const name = text(at(item, 'Area', 'Name'))
  if (level === undefined || name === '') return null
  const arrivalAt = Date.parse(text(at(item, 'FirstHeight', 'ArrivalTime')))
  return {
    name,
    level,
    arrivalAt: Number.isFinite(arrivalAt) ? arrivalAt : null,
    arrivalNote: text(at(item, 'FirstHeight', 'Condition')) || null,
    height:
      text(at(item, 'MaxHeight', 'TsunamiHeight')) ||
      text(at(item, 'MaxHeight', 'Condition')) ||
      null,
  }
}

const byLevel = (a: { level: TsunamiLevel }, b: { level: TsunamiLevel }) =>
  tsunamiRank(b.level) - tsunamiRank(a.level)

/** A tsunami in effect from JMA's detail report, or null when none of its areas is under one. */
export function parseJmaTsunamiReport(
  raw: unknown,
  report: { eventId: string; reportedAt: number },
): Tsunami | null {
  const areas = asArray(at(raw, 'Body', 'Tsunami', 'Forecast', 'Item'))
    .map(jmaArea)
    .filter((a): a is TsunamiArea => a !== null)
    .sort(byLevel)
  const strongest = areas[0]
  if (strongest === undefined) return null
  return {
    source: 'jma',
    eventId: report.eventId,
    level: strongest.level,
    issuedAt: report.reportedAt,
    headline: text(at(raw, 'Head', 'Headline', 'Text')) || null,
    areas,
    region: null,
    url: JMA_TSUNAMI_PAGE,
  }
}

/** NOAA's bulletin categories: a threat message counts as a warning; information does not count. */
const NOAA_CATEGORIES: Record<string, TsunamiLevel> = {
  warning: 'warning',
  threat: 'warning',
  watch: 'watch',
  advisory: 'advisory',
}

const tag = (xml: string, name: string): string => {
  const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(xml)
  return (
    match?.[1]
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  )
}

/**
 * The bulletin in one of NOAA's tsunami Atom feeds, if it puts a tsunami in
 * effect. Each feed holds only its centre's latest bulletin, in a fixed format;
 * it is read with a few patterns rather than an XML parser, and anything
 * unexpected reads as no tsunami.
 */
export function parseNoaaTsunamiFeed(xml: string, now: number): Tsunami | null {
  const entry = /<entry>([\s\S]*?)<\/entry>/i.exec(xml)?.[1]
  if (entry === undefined) return null
  const category = /Category:\s*(?:<\/strong>)?\s*([A-Za-z]+)/i.exec(entry)?.[1]?.toLowerCase()
  const level = category === undefined ? undefined : NOAA_CATEGORIES[category]
  const issuedAt = Date.parse(tag(entry, 'updated'))
  if (level === undefined || !Number.isFinite(issuedAt) || now - issuedAt > TSUNAMI_STALE_MS) {
    return null
  }
  const region = tag(entry, 'title') || null
  const centre = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>/i.exec(xml)?.[1]?.trim() || null
  // Each new bulletin on the same earthquake has a new time; its epicentre does not.
  const epicentre = [tag(entry, 'geo:lat'), tag(entry, 'geo:long')].join(',')
  return {
    source: 'noaa',
    eventId: `${centre ?? 'noaa'}:${epicentre === ',' ? region : epicentre}`,
    level,
    issuedAt,
    headline: centre,
    areas:
      region === null
        ? []
        : [{ name: region, level, arrivalAt: null, arrivalNote: null, height: null }],
    region,
    url: bulletinUrl(entry),
  }
}

/** The bulletin's own page, when the feed links one on tsunami.gov; the site otherwise. */
function bulletinUrl(entry: string): string {
  const href = /<link\s[^>]*rel="alternate"[^>]*href="([^"]+)"/i.exec(entry)?.[1]
  try {
    const url = new URL(href ?? '')
    return url.protocol === 'https:' && url.hostname === 'www.tsunami.gov'
      ? url.href
      : NOAA_TSUNAMI_PAGE
  } catch {
    return NOAA_TSUNAMI_PAGE
  }
}

/** Of several tsunamis in effect, the one to show: the strongest, then the latest. */
export function strongestTsunami(tsunamis: ReadonlyArray<Tsunami | null>): Tsunami | null {
  let best: Tsunami | null = null
  for (const t of tsunamis) {
    if (t === null) continue
    if (
      best === null ||
      tsunamiRank(t.level) > tsunamiRank(best.level) ||
      (t.level === best.level && t.issuedAt > best.issuedAt)
    ) {
      best = t
    }
  }
  return best
}

/** The level in the viewer's language: JMA's own terms in Japanese. */
export function tsunamiLevelLabel(level: TsunamiLevel, language: 'ja' | 'en'): string {
  if (language === 'ja') {
    // NOAA's watch has no JMA equivalent; it is between a warning and an advisory.
    return { major: '大津波警報', warning: '津波警報', watch: '津波警戒', advisory: '津波注意報' }[
      level
    ]
  }
  return {
    major: 'Major tsunami warning',
    warning: 'Tsunami warning',
    watch: 'Tsunami watch',
    advisory: 'Tsunami advisory',
  }[level]
}

/** "北海道太平洋沿岸東部 ほか 5 区域" / "Pacific coast of Hokkaido and 5 more". */
export function tsunamiSummary(tsunami: Tsunami, language: 'ja' | 'en'): string {
  const [first, ...rest] = tsunami.areas
  if (first === undefined) return tsunami.region ?? ''
  if (rest.length === 0) return first.name
  return language === 'ja'
    ? `${first.name} ほか ${rest.length} 区域`
    : `${first.name} and ${rest.length} more`
}
