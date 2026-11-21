import { describe, expect, it } from 'vitest'
import {
  DIGIT_SEGMENTS,
  digitOffsets,
  HM_BOX,
  HM_OFFSETS,
  lit,
  SEGMENT_NAMES,
  SEGMENTS,
  SLANT,
  SS_BOX,
  segmentPoints,
  segmentSize,
} from '../../src/renderer/widgets/clock/faces/segment/segments.js'

/** The points of a polygon string as numbers. */
const points = (s: string): [number, number][] =>
  s.split(' ').map((p) => p.split(',').map(Number) as [number, number])

describe('SEGMENT digits', () => {
  it('light the segments a seven-segment display lights', () => {
    expect(SEGMENT_NAMES.filter((s) => lit('8', s))).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    expect(SEGMENT_NAMES.filter((s) => lit('1', s))).toEqual(['b', 'c'])
    expect(SEGMENT_NAMES.filter((s) => lit('0', s))).not.toContain('g')
    expect(SEGMENT_NAMES.filter((s) => lit('7', s))).toEqual(['a', 'b', 'c'])
  })

  it('give every digit a different pattern', () => {
    expect(new Set(DIGIT_SEGMENTS).size).toBe(10)
  })

  it('light nothing for what is not a digit', () => {
    expect(SEGMENT_NAMES.some((s) => lit('', s) || lit(':', s) || lit('x', s))).toBe(false)
  })

  it('lean forward: the bottom of a segment is left of its top', () => {
    const [top] = points(segmentPoints('a', 0))
    const [bottom] = points(segmentPoints('d', 0))
    expect(top?.[0]).toBeCloseTo(1.4)
    expect(bottom?.[0]).toBeCloseTo(1.4 - 18 * SLANT)
  })

  it('keep every segment inside its picture box', () => {
    for (const [offsets, box] of [
      [HM_OFFSETS, HM_BOX],
      [digitOffsets(2), SS_BOX],
    ] as const) {
      for (const x of offsets) {
        for (const s of SEGMENT_NAMES) {
          for (const [px, py] of points(segmentPoints(s, x))) {
            expect(px).toBeGreaterThanOrEqual(box[0])
            expect(px).toBeLessThanOrEqual(box[0] + box[2])
            expect(py).toBeGreaterThanOrEqual(box[1])
            expect(py).toBeLessThanOrEqual(box[1] + box[3])
          }
        }
      }
    }
    expect(Object.keys(SEGMENTS)).toHaveLength(7)
  })

  it('leave room for the colon between the hours and the minutes', () => {
    const [h0, h1, m0, m1] = HM_OFFSETS
    expect((h1 ?? 0) - (h0 ?? 0)).toBe(10.5)
    expect((m0 ?? 0) - (h1 ?? 0)).toBeGreaterThan(11.5)
    expect((m1 ?? 0) - (m0 ?? 0)).toBe(10.5)
  })
})

describe('SEGMENT size', () => {
  it('reads in the default strip and in a low one', () => {
    for (const height of [32, 48]) {
      const size = segmentSize(340, height, 3)
      expect(size).toBeGreaterThan(height * 0.7)
      expect(size).toBeLessThanOrEqual(height)
    }
  })

  it('fills a zoomed pane, bounded by its width', () => {
    const size = segmentSize(1920, 1080, 3)
    expect(size).toBeGreaterThan(400)
    const width = (size * HM_BOX[2]) / HM_BOX[3]
    expect(width).toBeLessThan(1920)
  })

  it('shrinks for a long zone rather than running out of the pane', () => {
    expect(segmentSize(160, 48, 8)).toBeLessThan(segmentSize(160, 48, 3))
  })

  it('is nothing in a pane with no room', () => {
    expect(segmentSize(0, 0, 3)).toBe(0)
  })
})
