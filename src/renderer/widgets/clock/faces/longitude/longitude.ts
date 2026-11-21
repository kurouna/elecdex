import { zoneOffsetMinutes } from '../../../../lib/time-zone.js'

/**
 * LONGITUDE's band: the width as the world's time zones, UTC-11 at the left to UTC+14 at the
 * right. Each city stands at its offset now - so a city moves along the band as daylight saving
 * comes and goes - and each column of the band is lit by the hour of day there.
 */

export const OFFSET_MIN = -11 * 60
export const OFFSET_MAX = 14 * 60

/** Round the world, a few hours apart, so most of the band has a name on it. */
export const LONGITUDE_CITIES: ReadonlyArray<readonly [code: string, timeZone: string]> = [
  ['HNL', 'Pacific/Honolulu'],
  ['LAX', 'America/Los_Angeles'],
  ['NYC', 'America/New_York'],
  ['SAO', 'America/Sao_Paulo'],
  ['LON', 'Europe/London'],
  ['BER', 'Europe/Berlin'],
  ['DXB', 'Asia/Dubai'],
  ['DEL', 'Asia/Kolkata'],
  ['SGP', 'Asia/Singapore'],
  ['TYO', 'Asia/Tokyo'],
  ['SYD', 'Australia/Sydney'],
  ['AKL', 'Pacific/Auckland'],
]

/** Where an offset sits across a band `width` wide. */
export const offsetX = (offset: number, width: number): number =>
  ((offset - OFFSET_MIN) / (OFFSET_MAX - OFFSET_MIN)) * width

/**
 * How light it is at a local hour, 0 (night) to 1 (day): dawn from 5 to 7, dusk from 17 to 19.
 * A hint of the day, not the sun's real height, which would need the place's latitude.
 */
export function daylight(localHour: number): number {
  const h = ((localHour % 24) + 24) % 24
  if (h < 5 || h >= 19) return 0
  if (h < 7) return (h - 5) / 2
  if (h > 17) return (19 - h) / 2
  return 1
}

/** The band's shading: `columns` values across it, each the daylight at its offset's hour. */
export function bandLight(now: number, columns: number): number[] {
  const d = new Date(now)
  const utcHour = d.getUTCHours() + d.getUTCMinutes() / 60
  const light: number[] = []
  for (let i = 0; i < columns; i++) {
    const offset = OFFSET_MIN + ((i + 0.5) / columns) * (OFFSET_MAX - OFFSET_MIN)
    light.push(daylight(utcHour + offset / 60))
  }
  return light
}

export interface CityMark {
  code: string
  offset: number
  hh: string
  mm: string
}

const formatters = new Map<string, Intl.DateTimeFormat>()
const clockIn = (timeZone: string): Intl.DateTimeFormat => {
  let f = formatters.get(timeZone)
  if (f === undefined) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(timeZone, f)
  }
  return f
}

/**
 * The cities to name across a band `width` wide: each at its offset with its time, leaving out
 * the system's own zone (the marker says it) and any city that would be drawn over one already
 * placed, nearest to here first so the neighbours of here are the ones kept.
 */
export function cityMarks(now: number, here: number, width: number, gap: number): CityMark[] {
  const all: CityMark[] = []
  for (const [code, timeZone] of LONGITUDE_CITIES) {
    const offset = zoneOffsetMinutes(timeZone, now)
    if (offset === null || offset === here) continue
    const parts = clockIn(timeZone).formatToParts(now)
    const hh = parts.find((p) => p.type === 'hour')?.value ?? '--'
    const mm = parts.find((p) => p.type === 'minute')?.value ?? '--'
    all.push({ code, offset, hh, mm })
  }
  all.sort((a, b) => Math.abs(a.offset - here) - Math.abs(b.offset - here))
  const hereX = offsetX(here, width)
  const placed: CityMark[] = []
  for (const city of all) {
    const x = offsetX(city.offset, width)
    if (Math.abs(x - hereX) < gap * 0.6) continue
    if (placed.some((p) => Math.abs(offsetX(p.offset, width) - x) < gap)) continue
    placed.push(city)
  }
  return placed.sort((a, b) => a.offset - b.offset)
}
