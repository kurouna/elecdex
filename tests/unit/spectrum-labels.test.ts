import { describe, expect, it } from 'vitest'
import { columnStrip, labelStep } from '../../src/renderer/widgets/audio/spectrum-draw.js'

describe('spectrum labels', () => {
  it('labels every column while the labels fit', () => {
    expect(labelStep(40, 24)).toBe(1)
  })

  it('skips columns so the widest label keeps a gap, as 31 bands in a narrow pane need', () => {
    // 31 columns in 400 px: about 13 px each, and "1.25k" is about 30 px wide.
    expect(labelStep(12.9, 30)).toBe(3)
    expect(labelStep(20, 24)).toBe(2)
  })

  it('does not divide by an empty column', () => {
    expect(labelStep(0, 24)).toBe(1)
  })
})

describe('columnStrip', () => {
  it('gives each column whole pixels that tile the plot, whatever the width', () => {
    // A strip with a fractional edge is clipped with anti-aliasing, and the pixel two
    // columns shared kept part of a glow that a later redraw only partly took out:
    // thin lines as tall as the sound had been, over a silent display.
    for (const [w, bands, pad] of [
      [524, 31, 6],
      [523, 31, 6],
      [401, 16, 6],
      [333, 10, 0],
      [97, 7, 0],
    ] as const) {
      const g = { pad, colW: (w - pad * 2) / bands }
      let edge = pad
      for (let col = 0; col < bands; col++) {
        const { left, width } = columnStrip(g, col)
        expect(Number.isInteger(left) && Number.isInteger(width)).toBe(true)
        expect(left).toBe(edge)
        expect(width).toBeGreaterThan(0)
        edge = left + width
      }
      expect(edge).toBe(w - pad)
    }
  })
})
