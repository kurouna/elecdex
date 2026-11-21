import { describe, expect, it } from 'vitest'
import { segmentSize } from '../../src/renderer/widgets/clock/faces/segment/segments.js'
import { type TapeClock, tapeMarks } from '../../src/renderer/widgets/clock/faces/tape/tape.js'
import {
  NUMERAL_HEIGHT,
  vectorLayout,
} from '../../src/renderer/widgets/clock/faces/vector/strokes.js'
import { besideMark, labelWidth, TALL_FROM } from '../../src/renderer/widgets/clock/parts/strip.js'

/**
 * The edges the second review of the clock faces found (Fable, 2026-11-22): a label that does
 * not fit on either side of its mark, a face that changed size at a height of its own, a long
 * zone name in VECTOR's strip, and a day whose midnight daylight saving skips.
 */

describe('a label beside its mark', () => {
  it('counts a full-width character as about one em, a narrow one as about 0.62', () => {
    expect(labelWidth('ABC', 10)).toBeCloseTo(18.6)
    expect(labelWidth('朝会', 10)).toBeCloseTo(20)
  })

  it('goes on the side with room, and is cut short with an ellipsis where neither has it', () => {
    // The default strip's AHEAD: a band 205 px wide, an alarm 37 px in, a long name.
    const name = 'A rather long alarm name · 10m'
    const placed = besideMark(37, 205, name, 12, 7)
    expect(placed.anchor).toBe('start')
    expect(placed.text.endsWith('…')).toBe(true)
    expect(placed.x + labelWidth(placed.text, 12)).toBeLessThanOrEqual(205 + 0.5)
  })

  it('never puts a right-aligned label past the band’s left edge', () => {
    // Late in the band, a Japanese name: once it ran 105 px off the left.
    const name = '朝会の準備をする定例ミーティングの資料 · 3h'
    const placed = besideMark(180, 205, name, 12, 7)
    expect(placed.anchor).toBe('end')
    expect(placed.x - labelWidth(placed.text, 12)).toBeGreaterThanOrEqual(-0.5)
  })

  it('leaves a label that fits as it is', () => {
    expect(besideMark(20, 300, 'MON', 10)).toEqual({ x: 23, anchor: 'start', text: 'MON' })
    expect(besideMark(295, 300, 'MON', 10)).toEqual({ x: 292, anchor: 'end', text: 'MON' })
  })
})

describe('SEGMENT in the strip', () => {
  it('grows with the strip up to TALL_FROM, with no jump on the way', () => {
    let before = segmentSize(340, 60, 3)
    for (let h = 61; h < TALL_FROM; h++) {
      const size = segmentSize(340, h, 3)
      // Once it fell 17 px from 79 to 80 px high, mid-way through the default strip's range.
      expect(size).toBeGreaterThanOrEqual(before - 0.01)
      before = size
    }
    expect(segmentSize(340, 90, 3)).toBeGreaterThanOrEqual(60)
  })
})

describe('VECTOR in the strip', () => {
  it('keeps a long zone name inside the pane, at the size it is drawn', () => {
    for (const h of [67, 80, 91, 120]) {
      const l = vectorLayout(340, h, 8)
      const zonePx = Math.max(0.3 * NUMERAL_HEIGHT * l.k, 10)
      // 8 letters at 0.62 em each, from where the zone starts.
      expect(l.zone.x + 8 * zonePx * 0.62).toBeLessThanOrEqual(340)
    }
  })
})

describe('TAPE on a day without a midnight', () => {
  it('marks the day where the date changes, when daylight saving skips 00:00', () => {
    // A clock that jumps from 23:59 to 01:00, as Santiago's does on its changeover day.
    const start = Date.UTC(2026, 8, 5, 22, 0)
    const clock: TapeClock = (at) => {
      const minutes = Math.round((at - start) / 60_000) + 22 * 60
      // From 24:00 on the clock reads an hour ahead: 00:xx never happens.
      const shown = minutes >= 24 * 60 ? minutes + 60 : minutes
      const day = Math.floor(shown / (24 * 60))
      const inDay = shown % (24 * 60)
      return {
        hour: Math.floor(inDay / 60),
        minute: inDay % 60,
        date: 5 + day,
        weekday: (6 + day) % 7,
      }
    }
    const marks = tapeMarks(start, start + 4 * 3_600_000, true, clock)
    const days = marks.filter((m) => m.kind === 'day')
    expect(days).toHaveLength(1)
    expect(days[0]?.label).toBe('SUN')
  })
})
