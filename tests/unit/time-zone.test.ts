import { describe, expect, it } from 'vitest'
import { zoneOffsetMinutes } from '../../src/renderer/lib/time-zone.js'

/**
 * A zone's offset from UTC, read from the zone's own rules: what the globe uses to guess where a
 * machine is when its zone names no country.
 */

const at = (iso: string) => Date.parse(iso)

describe('zoneOffsetMinutes', () => {
  it('reads whole, half and three-quarter hours, east and west', () => {
    expect(zoneOffsetMinutes('Asia/Tokyo', at('2026-11-21T05:00:00Z'))).toBe(540)
    expect(zoneOffsetMinutes('Asia/Kathmandu', at('2026-11-21T05:00:00Z'))).toBe(345)
    expect(zoneOffsetMinutes('America/St_Johns', at('2026-11-21T05:00:00Z'))).toBe(-210)
    expect(zoneOffsetMinutes('UTC', at('2026-11-21T05:00:00Z'))).toBe(0)
  })

  it('follows daylight saving', () => {
    expect(zoneOffsetMinutes('America/New_York', at('2026-01-15T12:00:00Z'))).toBe(-300)
    expect(zoneOffsetMinutes('America/New_York', at('2026-07-15T12:00:00Z'))).toBe(-240)
  })

  it('is null for a zone this machine does not know', () => {
    expect(zoneOffsetMinutes('Nowhere/Atlantis', 0)).toBeNull()
  })
})
