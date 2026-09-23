import { describe, expect, it } from 'vitest'
import { clockFace, hourMinute, readObserver } from '../../src/renderer/widgets/orbit/clocks.js'
import { rgbOf } from '../../src/renderer/widgets/orbit/colour.js'

/**
 * The ORBIT pane's clocks and the observer it reads back from pane state, and
 * the colour it reads back from the theme for the day side's glow.
 */

const TOKYO = { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69, timeZone: 'Asia/Tokyo' }

describe('the orbit clocks', () => {
  it('tells the hour in a zone, and its offset', () => {
    const at = new Date(Date.UTC(2026, 8, 23, 3, 4, 0))
    expect(clockFace(at, 'Asia/Tokyo')).toEqual({ time: '12:04', offset: 'UTC+9' })
    expect(clockFace(at, 'Asia/Kolkata')).toEqual({ time: '08:34', offset: 'UTC+5:30' })
    expect(hourMinute('Europe/London').format(at)).toBe('04:04')
  })

  it('takes an observer from pane state only with a zone this machine knows', () => {
    expect(readObserver(TOKYO)).toEqual(TOKYO)
    // A layout from elsewhere, or a hand edit: an unknown zone would throw on every tick.
    expect(readObserver({ ...TOKYO, timeZone: 'Mars/Olympus_Mons' })).toBeNull()
    expect(readObserver({ ...TOKYO, lat: 91 })).toBeNull()
    expect(readObserver('Tokyo')).toBeNull()
  })
})

describe('reading a theme colour back', () => {
  it('reads rgb() in 0-255, and what color-mix() computes to, color(srgb) in 0-1, alike', () => {
    expect(rgbOf('rgb(51, 204, 255)')).toEqual([51, 204, 255])
    expect(rgbOf('rgba(51, 204, 255, 0.5)')).toEqual([51, 204, 255])
    // What Chromium answers for color-mix(in srgb, var(--accent) 100%, transparent).
    const [r, g, b] = rgbOf('color(srgb 0.2 0.8 1)')
    expect([r, g, b].map(Math.round)).toEqual([51, 204, 255])
    expect(rgbOf('color(srgb 0.2 0.8 1 / 0.6)').map(Math.round)).toEqual([51, 204, 255])
  })
})
