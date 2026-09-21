import { describe, expect, it } from 'vitest'
import {
  columnStrip,
  geometry,
  labelStep,
  segmentRect,
} from '../../src/renderer/widgets/audio/spectrum-draw.js'

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

/** Every glow rectangle of a spectrum, with its column's strip. */
function glows(
  w: number,
  prefs: Parameters<typeof geometry>[3],
): Array<{
  at: string
  strip: { left: number; width: number }
  r: ReturnType<typeof segmentRect>
}> {
  const g = geometry(w, 300, 1, prefs, { accent: '#aacfd1', label: '#aacfd1' })
  const out = []
  for (let col = 0; col < g.bands.length; col++) {
    for (let row = g.mirror ? -g.count : 0; row < g.count; row++) {
      out.push({
        at: `${w}px col ${col} row ${row}`,
        strip: columnStrip(g, col),
        r: segmentRect(g, col, row, g.look.glow / 2),
      })
    }
  }
  return out
}

describe('segmentRect', () => {
  it('keeps a glow on whole pixels inside its strip, so no edge is smoothed into a neighbour', () => {
    // macOS's canvas smoothed a glow's fractional edge a pixel past it, into a
    // strip that was not redrawn: faint lines left standing after the sound.
    for (const [w, bands, style, pattern] of [
      [524, 31, 'vfd-cyan', 'bar'],
      [523, 31, 'vfd-amber', 'mirror'],
      [401, 16, 'vfd-cyan', 'peak'],
      [333, 10, 'accent', 'bar'],
    ] as const) {
      for (const { at, strip, r } of glows(w, { style, bands, pattern, peakHold: true })) {
        const edges = [r.x, r.y, r.x + r.width, r.y + r.height]
        expect(edges.every(Number.isInteger), at).toBe(true)
        expect(r.x, at).toBeGreaterThanOrEqual(strip.left)
        expect(r.x + r.width, at).toBeLessThanOrEqual(strip.left + strip.width)
        expect(r.width, at).toBeGreaterThan(0)
      }
    }
  })

  it('leaves a lit segment where it is', () => {
    const g = geometry(
      524,
      300,
      1,
      { style: 'vfd-cyan', bands: 31, pattern: 'bar', peakHold: true },
      {
        accent: '#aacfd1',
        label: '#aacfd1',
      },
    )
    const r = segmentRect(g, 3, 0, 0)
    expect(r.width).toBeCloseTo(g.barW)
    expect(r.height).toBeCloseTo(g.segH)
  })
})
