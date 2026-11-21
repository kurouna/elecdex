import { WEEKDAYS } from '../../parts/words.js'

/**
 * TAPE's scale: the day as a tape of ticks between two moments, hours labelled, midnight named
 * by the day it begins, and the night (18:00 to 06:00) as bands. Pure, so the face only places
 * what this returns.
 */

const HOUR_MS = 3_600_000
const QUARTER_MS = HOUR_MS / 4

export interface TapeMark {
  at: number
  kind: 'day' | 'hour' | 'quarter'
  /** "22" for an hour, the weekday for midnight; none for a quarter. */
  label: string | null
}

/**
 * The ticks from `from` to `to`: every quarter hour, labelled hours, and midnight as the day it
 * starts. Local time: an hour mark is where the local clock reads :00, so a half-hour zone's
 * marks fall where its own clock says the hour.
 */
export function tapeMarks(from: number, to: number, quarters = true): TapeMark[] {
  const marks: TapeMark[] = []
  // The first quarter at or after `from`, seconds and all: rounding the minutes alone put a mark
  // before `from` when it had seconds (review 2026-11-22). Every zone's offset is a whole number
  // of quarter hours, so a quarter of UTC is a quarter of the local clock too.
  for (let at = Math.ceil(from / QUARTER_MS) * QUARTER_MS; at <= to; at += QUARTER_MS) {
    const d = new Date(at)
    const minutes = d.getMinutes()
    if (minutes !== 0) {
      if (quarters) marks.push({ at, kind: 'quarter', label: null })
      continue
    }
    const hour = d.getHours()
    marks.push(
      hour === 0
        ? { at, kind: 'day', label: WEEKDAYS[d.getDay()] as string }
        : { at, kind: 'hour', label: String(hour).padStart(2, '0') },
    )
  }
  return marks
}

/** The nights between `from` and `to`: the spans whose local hour is 18 or later, or before 6. */
export function nightSpans(from: number, to: number): Array<{ from: number; to: number }> {
  const spans: Array<{ from: number; to: number }> = []
  const day = new Date(from)
  day.setHours(0, 0, 0, 0)
  // From the day before, so a night that began yesterday evening is included.
  for (let d = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1); d.getTime() < to; ) {
    const evening = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18).getTime()
    const morning = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 6).getTime()
    const a = Math.max(from, evening)
    const b = Math.min(to, morning)
    if (a < b) spans.push({ from: a, to: b })
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  }
  return spans
}

/**
 * How many hours the tape shows across `width` pixels: about 55 px an hour, so the hour labels
 * never touch, between 3 and 12 hours.
 */
export const tapeHours = (width: number): number =>
  Math.min(12, Math.max(3, Math.round(width / 55)))
