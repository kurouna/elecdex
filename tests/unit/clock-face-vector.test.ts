import { describe, expect, it } from 'vitest'
import {
  minuteShare,
  NUMERALS,
  nextSlots,
  numeral,
  vectorLayout,
} from '../../src/renderer/widgets/clock/faces/vector/strokes.js'

describe('VECTOR numerals', () => {
  it('are one stroke each, inside their 10 x 16 box', () => {
    expect(NUMERALS).toHaveLength(10)
    for (const d of NUMERALS) {
      // One move: the pen is put down once and draws the digit without lifting.
      expect(d.match(/M/g)).toHaveLength(1)
      const numbers = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
      for (const n of numbers) {
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(16)
      }
    }
  })

  it('draw nothing for what is not a digit', () => {
    expect(numeral('7')).toBe(NUMERALS[7])
    expect(numeral(':')).toBe('')
    expect(numeral('')).toBe('')
  })
})

describe('VECTOR slots', () => {
  it('draw everything once at first, with nothing to fade', () => {
    const slots = nextSlots([], '123456')
    expect(slots.map((s) => s.digit).join('')).toBe('123456')
    expect(slots.every((s) => s.old === null && s.gen === 0)).toBe(true)
  })

  it('draw again only the digits that changed', () => {
    const first = nextSlots([], '120959')
    const next = nextSlots(first, '121000')
    const changed = next.map((s, i) => s !== first[i])
    expect(changed).toEqual([false, false, true, true, true, true])
    expect(next[3]).toEqual({ digit: '0', old: '9', gen: 1 })
    expect(next[0]).toBe(first[0])
  })
})

describe('VECTOR layout', () => {
  it('puts the zone at the right and the line at the bottom in a low strip', () => {
    for (const h of [32, 48]) {
      const l = vectorLayout(340, h, 3)
      expect(l.compact).toBe(true)
      expect(16 * l.k).toBeGreaterThan(h * 0.6)
      const last = l.slots[5]
      expect(last).toBeDefined()
      expect(l.zone.x).toBeGreaterThan((last?.x ?? 0) + 10 * (last?.scale ?? 0))
      expect(l.zone.x + 3 * 10 * 0.62).toBeLessThanOrEqual(340)
      expect(l.line.y).toBeLessThan(h)
      expect(l.line.y).toBeGreaterThan(l.top + 16 * l.k)
    }
  })

  it('puts the zone above the seconds and the line under the digits in a tall pane', () => {
    const l = vectorLayout(1920, 1080, 3)
    expect(l.compact).toBe(false)
    const seconds = l.slots[4]
    expect(l.zone.y).toBeLessThan(seconds?.y ?? 0)
    expect(l.line.y).toBeGreaterThan(l.top + 16 * l.k)
    expect(l.line.y).toBeLessThan(1080)
    expect(l.line.x2).toBeLessThanOrEqual(1920)
    expect(16 * l.k).toBeGreaterThan(300)
  })

  it('sets the seconds smaller than HH:MM, on the same baseline', () => {
    const l = vectorLayout(720, 300, 3)
    const [h0, , , , s0] = l.slots
    expect(s0?.scale).toBeLessThan(h0?.scale ?? 0)
    expect((s0?.y ?? 0) + 16 * (s0?.scale ?? 0)).toBeCloseTo((h0?.y ?? 0) + 16 * (h0?.scale ?? 0))
  })

  it('draws nothing in a pane with no room', () => {
    expect(vectorLayout(0, 0, 3).k).toBe(0)
  })

  it('fills the seconds line over the minute', () => {
    expect(minuteShare(0)).toBe(0)
    expect(minuteShare(30)).toBe(0.5)
    expect(minuteShare(59)).toBeLessThan(1)
  })
})
