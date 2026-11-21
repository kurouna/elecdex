/**
 * The system's time zone, and a zone's offset from UTC: the clock names the
 * zone the system is in now, and the globe guesses where a machine is from the
 * offset.
 */

const formatters = new Map<string, Intl.DateTimeFormat | null>()

/** One formatter a zone: building them is the costly part. */
function offsetFormatter(timeZone: string): Intl.DateTimeFormat | null {
  let formatter = formatters.get(timeZone)
  if (formatter === undefined) {
    try {
      formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    } catch {
      // A zone this machine's ICU does not know.
      formatter = null
    }
    formatters.set(timeZone, formatter)
  }
  return formatter
}

/** Minutes east of UTC for a zone at a moment (540 for Tokyo), or null for a zone not known. */
export function zoneOffsetMinutes(timeZone: string, at: number): number | null {
  const name = offsetFormatter(timeZone)
    ?.formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value
  if (name === undefined) return null
  if (name === 'GMT') return 0
  const m = /^GMT([+-])(\d{2}):(\d{2})/.exec(name)
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : null
}

/** The system's zone now: Chromium follows a change made in the system while the app runs. */
export function systemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
