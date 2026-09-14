/**
 * Earthquake information from the Japan Meteorological Agency, shared by main
 * (which fetches and decides on alerts) and the renderer (the quakes pane, the
 * alert banner and the globe).
 *
 * The source is `bosai/quake/data/list.json`, the list JMA's own earthquake page
 * loads: about a month of reports, newest first. One earthquake gets several
 * reports - seismic intensities within about two minutes, then the hypocentre,
 * then both - which share an event id; they are merged here into one quake with
 * the latest known value of each field. This is not the Earthquake Early
 * Warning: every report comes after the shaking, and the app says so.
 */

/** JMA's seismic intensity scale (shindo), weakest first. */
export const INTENSITIES = ['1', '2', '3', '4', '5-', '5+', '6-', '6+', '7'] as const
export type Intensity = (typeof INTENSITIES)[number]

export const isIntensity = (value: unknown): value is Intensity =>
  typeof value === 'string' && (INTENSITIES as readonly string[]).includes(value)

/** Position on the scale, for comparing: 1 is 0, 7 is 8. */
export const intensityRank = (intensity: Intensity): number => INTENSITIES.indexOf(intensity)

/** How often the list is checked; JMA serves it with max-age=60. */
export const QUAKE_INTERVAL_MS = 60_000
/** A quake is only alerted while this recent: an app started later does not announce old news. */
export const ALERT_WINDOW_MS = 30 * 60_000
/** Quakes kept and sent to the renderer, newest first. */
export const QUAKES_KEPT = 100
/** The page the pane and the banner open. */
export const JMA_QUAKE_PAGE = 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map'

export interface Quake {
  /** JMA's event id, shared by every report on the same earthquake. */
  id: string
  /** When the earthquake happened, ms since epoch. */
  at: number
  /** When its latest report was issued. */
  reportedAt: number
  /** Where, in Japanese and English; null until the hypocentre is reported. */
  area: { ja: string; en: string } | null
  lat: number | null
  lon: number | null
  /** Depth in km; null when not given (a distant earthquake, or not yet reported). */
  depthKm: number | null
  magnitude: number | null
  /** The strongest intensity observed in Japan; null for a distant earthquake. */
  maxIntensity: Intensity | null
  /** An earthquake abroad, reported for its possible effect on Japan. */
  distant: boolean
}

export interface QuakeState {
  /** Whether main is keeping the list current: notifications on, or a quakes pane open. */
  active: boolean
  /** Newest first. */
  quakes: Quake[]
  fetchedAt: number | null
  error: string | null
  /**
   * Earthquakes announced in this run, newest first. An alert decided before a
   * page was ready to hear it (at startup, or during a reload) is shown from here.
   */
  announced: string[]
}

/** The reports that describe an earthquake. Others (Nankai Trough commentary) are not quakes. */
const QUAKE_TITLES: Record<string, 'intensity' | 'hypocentre' | 'both' | 'distant'> = {
  震度速報: 'intensity',
  震源に関する情報: 'hypocentre',
  '震源・震度情報': 'both',
  遠地地震に関する情報: 'distant',
}

interface Report {
  eid: string
  kind: 'intensity' | 'hypocentre' | 'both' | 'distant'
  cancelled: boolean
  at: number
  reportedAt: number
  anm: string
  enAnm: string
  cod: string
  mag: string
  maxi: string
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

function report(raw: unknown): Report | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const kind = QUAKE_TITLES[text(r.ttl)]
  const at = Date.parse(text(r.at))
  const reportedAt = Date.parse(text(r.rdt))
  if (kind === undefined || text(r.eid) === '' || !Number.isFinite(at)) return null
  return {
    eid: text(r.eid),
    kind,
    cancelled: text(r.ift) === '取消',
    at,
    reportedAt: Number.isFinite(reportedAt) ? reportedAt : at,
    anm: text(r.anm),
    enAnm: text(r.en_anm),
    cod: text(r.cod),
    mag: text(r.mag),
    maxi: text(r.maxi),
  }
}

/**
 * Reads JMA's coordinate string, ISO 6709 style: `+40.1+141.7-10000/` is 40.1°N
 * 141.7°E at a depth of 10 km; the depth may be missing, and a very shallow
 * quake is reported as `+0` (0 km).
 */
export function parseCoordinates(
  cod: string,
): { lat: number; lon: number; depthKm: number | null } | null {
  const match = /^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+)?\/?$/.exec(cod.trim())
  if (match === null) return null
  const lat = Number(match[1])
  const lon = Number(match[2])
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  const depthKm = match[3] === undefined ? null : Math.abs(Number(match[3])) / 1000
  return { lat, lon, depthKm }
}

/** "5.1" is 5.1; JMA writes "Ｍ不明" (unknown) or "Ｍ８を超える巨大地震" when it has no figure. */
function magnitudeOf(mag: string): number | null {
  const value = Number(mag)
  return mag.trim() !== '' && Number.isFinite(value) ? value : null
}

/** Folds one report into the quake: a later report's values replace, a missing one keeps. */
function apply(quake: Quake, r: Report): void {
  if (r.reportedAt >= quake.reportedAt) quake.reportedAt = r.reportedAt
  if (r.kind === 'distant') quake.distant = true
  if (r.anm !== '') quake.area = { ja: r.anm, en: r.enAnm || r.anm }
  const coordinates = parseCoordinates(r.cod)
  if (coordinates !== null) {
    quake.lat = coordinates.lat
    quake.lon = coordinates.lon
    quake.depthKm = coordinates.depthKm
  }
  const magnitude = magnitudeOf(r.mag)
  if (magnitude !== null) quake.magnitude = magnitude
  if (isIntensity(r.maxi)) quake.maxIntensity = r.maxi
}

/**
 * The earthquakes in JMA's list, one per event, newest first.
 *
 * Reports are applied oldest first so the latest value of each field wins. An
 * event with a cancellation is dropped altogether.
 */
export function parseQuakeList(raw: unknown, limit = QUAKES_KEPT): Quake[] {
  if (!Array.isArray(raw)) return []
  const reports = raw
    .map(report)
    .filter((r): r is Report => r !== null)
    .sort((a, b) => a.reportedAt - b.reportedAt)
  const cancelled = new Set(reports.filter((r) => r.cancelled).map((r) => r.eid))
  const quakes = new Map<string, Quake>()
  for (const r of reports) {
    if (cancelled.has(r.eid)) continue
    let quake = quakes.get(r.eid)
    if (quake === undefined) {
      quake = {
        id: r.eid,
        at: r.at,
        reportedAt: r.reportedAt,
        area: null,
        lat: null,
        lon: null,
        depthKm: null,
        magnitude: null,
        maxIntensity: null,
        distant: false,
      }
      quakes.set(r.eid, quake)
    }
    apply(quake, r)
  }
  return [...quakes.values()].sort((a, b) => b.at - a.at).slice(0, limit)
}

/**
 * The quakes to announce now: recent, as strong as the chosen intensity or
 * stronger, and not announced before. A quake first reported below the threshold
 * is announced when a later report raises it.
 */
export function quakesToAlert(
  quakes: readonly Quake[],
  options: { minIntensity: Intensity; now: number; alerted: ReadonlySet<string> },
): Quake[] {
  const min = intensityRank(options.minIntensity)
  return quakes.filter(
    (q) =>
      !options.alerted.has(q.id) &&
      q.maxIntensity !== null &&
      intensityRank(q.maxIntensity) >= min &&
      options.now - q.at <= ALERT_WINDOW_MS &&
      q.at <= options.now + 60_000,
  )
}

export type QuakeLanguage = 'ja' | 'en'

/** Place names in Japanese for a Japanese locale, in English otherwise. */
export const quakeLanguage = (locale: string | undefined): QuakeLanguage =>
  locale?.toLowerCase().startsWith('ja') ? 'ja' : 'en'

/** "震度5弱" in Japanese, "Shindo 5-" in English. */
export function intensityLabel(intensity: Intensity, language: QuakeLanguage): string {
  if (language === 'en') return `Shindo ${intensity}`
  return `震度${intensity.replace('-', '弱').replace('+', '強')}`
}

/** The place in the viewer's language, or a placeholder until it is reported. */
export function areaLabel(quake: Quake, language: QuakeLanguage): string {
  if (quake.area === null) return language === 'ja' ? '震源調査中' : 'Hypocentre pending'
  return language === 'ja' ? quake.area.ja : quake.area.en
}

/**
 * One line for a banner or notification: place, intensity, magnitude and depth,
 * leaving out what is not known yet.
 */
export function describeQuake(quake: Quake, language: QuakeLanguage): string {
  const parts = [areaLabel(quake, language)]
  if (quake.maxIntensity !== null) parts.push(intensityLabel(quake.maxIntensity, language))
  if (quake.magnitude !== null) parts.push(`M${quake.magnitude.toFixed(1)}`)
  if (quake.depthKm !== null) {
    parts.push(language === 'ja' ? `深さ${quake.depthKm}km` : `depth ${quake.depthKm} km`)
  }
  return parts.join(' · ')
}

/** How loudly a quake is shown: by its intensity, 5- and up the strongest. */
export function quakeSeverity(quake: Quake): 'minor' | 'moderate' | 'severe' {
  if (quake.maxIntensity === null) return 'minor'
  const rank = intensityRank(quake.maxIntensity)
  return rank >= intensityRank('5-') ? 'severe' : rank >= intensityRank('3') ? 'moderate' : 'minor'
}
