/**
 * The ORBIT pane's orbital elements: what main downloads from CelesTrak, and the
 * checks that decide what of it reaches the page.
 *
 * CelesTrak's rules (celestrak.org/usage-policy.php, read 2026-09-23): its data
 * changes every two hours at most, a set may be downloaded once per update, and
 * a client must stop asking at once when it gets anything but a 200. So each
 * set here is asked for far less often than it changes - the stations twice a
 * day, the Starlink constellation once a day and only for a pane that shows it -
 * the answer is kept on disk, and a refusal ends asking until the next day.
 * Positions are worked out on this machine from the elements (SGP4), so the
 * service is asked for elements, never for positions.
 */

export type OrbitSet = 'stations' | 'starlink'
export const ORBIT_SETS: readonly OrbitSet[] = ['stations', 'starlink']

/** How long a set's elements are used before main asks for new ones. */
export const ORBIT_REFRESH_MS: Record<OrbitSet, number> = {
  stations: 12 * 60 * 60_000,
  starlink: 24 * 60 * 60_000,
}

/** After a refusal (anything but a 200), how long main leaves CelesTrak alone. */
export const ORBIT_REFUSED_MS = 24 * 60 * 60_000
/** After the network failed (no answer at all), when to try again. */
export const ORBIT_OFFLINE_MS = 60 * 60_000
/** The most a download may be; the Starlink set is about 2 MB as TLE. */
export const ORBIT_MAX_BYTES = 8 * 1024 * 1024

/** The stations the pane draws, by NORAD catalogue number. */
export const STATIONS = [
  { id: 25544, code: 'ISS', name: 'International Space Station' },
  { id: 48274, code: 'CSS', name: 'Tiangong (Tianhe core module)' },
] as const

/** CelesTrak's query for a set: the stations as OMM JSON (small), Starlink as TLE (the smallest). */
export function orbitQuery(set: OrbitSet): string {
  return set === 'stations'
    ? '/NORAD/elements/gp.php?GROUP=stations&FORMAT=json'
    : '/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle'
}

/** One satellite's mean elements, as the page feeds them to SGP4. */
export interface OrbitElements {
  /** NORAD catalogue number. */
  id: number
  name: string
  /** OMM fields for a station; null for a TLE satellite. */
  omm: Record<string, string | number> | null
  /** The two TLE lines for a Starlink satellite; null for a station. */
  tle: [string, string] | null
}

export interface OrbitUpdate {
  set: OrbitSet
  elements: OrbitElements[]
  /** When these elements were downloaded; null before the first download. */
  fetchedAt: number | null
  /** Why the last attempt failed, or null. The elements shown are the last good ones. */
  error: string | null
}

/** The OMM fields SGP4 reads, all of which must be there and be numbers (bar the epoch). */
const OMM_NUMBERS = [
  'MEAN_MOTION',
  'ECCENTRICITY',
  'INCLINATION',
  'RA_OF_ASC_NODE',
  'ARG_OF_PERICENTER',
  'MEAN_ANOMALY',
  'NORAD_CAT_ID',
  'BSTAR',
  'MEAN_MOTION_DOT',
  'MEAN_MOTION_DDOT',
] as const

/**
 * The stations the pane draws, from CelesTrak's OMM JSON for the group. Only
 * the fields SGP4 needs are kept, and only for the stations listed above: the
 * page gets numbers and a date, never whatever else the answer held.
 */
export function readStations(text: string): OrbitElements[] | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!Array.isArray(data)) return null
  const wanted = new Set<number>(STATIONS.map((s) => s.id))
  const out: OrbitElements[] = []
  for (const entry of data) {
    if (typeof entry !== 'object' || entry === null) continue
    const station = stationOf(entry as Record<string, unknown>)
    if (station !== null && wanted.has(station.id)) out.push(station)
  }
  return out
}

/** One entry of the OMM JSON, cut down to what SGP4 reads; null when a field is missing. */
function stationOf(record: Record<string, unknown>): OrbitElements | null {
  const epoch = record.EPOCH
  if (typeof epoch !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(epoch)) return null
  const omm: Record<string, string | number> = { EPOCH: epoch }
  for (const field of OMM_NUMBERS) {
    const value = Number(record[field])
    if (!Number.isFinite(value)) return null
    omm[field] = value
  }
  omm.OBJECT_NAME = String(record.OBJECT_NAME ?? '').slice(0, 40)
  omm.OBJECT_ID = String(record.OBJECT_ID ?? '').slice(0, 20)
  omm.ELEMENT_SET_NO = Number(record.ELEMENT_SET_NO) || 999
  omm.REV_AT_EPOCH = Number(record.REV_AT_EPOCH) || 0
  omm.EPHEMERIS_TYPE = 0
  omm.CLASSIFICATION_TYPE = 'U'
  return { id: Number(omm.NORAD_CAT_ID), name: String(omm.OBJECT_NAME), omm, tle: null }
}

const TLE_LINE_1 =
  /^1 (\d{5})[A-Z ] [\w ]{8} [\d. ]{14} [-+ .\d]{10} [-+ \d]{8} [-+ \d]{8} \d [ \d]{4}\d$/
const TLE_LINE_2 = /^2 (\d{5}) [\d. ]{8} [\d. ]{8} \d{7} [\d. ]{8} [\d. ]{8} [\d. ]{11}[ \d]{5}\d$/

/**
 * Satellites from a three-line TLE file: a name, then the two element lines.
 * A group that does not read as TLE is skipped, not guessed at.
 */
export function readTle(text: string, limit = 20_000): OrbitElements[] | null {
  const lines = text.split(/\r?\n/).map((line) => line.trimEnd())
  const out: OrbitElements[] = []
  for (let i = 0; i + 2 < lines.length + 1 && out.length < limit; i += 1) {
    const one = lines[i + 1] ?? ''
    const two = lines[i + 2] ?? ''
    const first = TLE_LINE_1.exec(one)
    const second = TLE_LINE_2.exec(two)
    if (first === null || second === null || first[1] !== second[1]) continue
    out.push({
      id: Number(first[1]),
      name: (lines[i] ?? '').trim().slice(0, 40),
      omm: null,
      tle: [one, two],
    })
    i += 2
  }
  return out.length > 0 ? out : text.trim() === '' ? [] : null
}

export const readOrbitSet = (set: OrbitSet, text: string): OrbitElements[] | null =>
  set === 'stations' ? readStations(text) : readTle(text)

export const isOrbitSet = (value: unknown): value is OrbitSet =>
  value === 'stations' || value === 'starlink'
