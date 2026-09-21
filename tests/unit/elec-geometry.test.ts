import { describe, expect, it } from 'vitest'
import { coreGaps, coreTop, plateArea, plateBox } from '../../src/renderer/widgets/elec/geometry.js'

describe("the council's plates", () => {
  it('are one area: the top one was a fifth smaller than the two below it', () => {
    expect(plateArea(2)).toBe(plateArea(0))
    expect(plateArea(1) / plateArea(0)).toBeCloseTo(1, 2)
  })

  it('are one height, and the lower two mirror each other', () => {
    const [, , , height] = plateBox(0)
    expect(plateBox(1)[3]).toBe(height)
    expect(plateBox(2)[3]).toBe(height)
    expect(plateBox(2)[2]).toBe(plateBox(0)[2])
    expect(100 - (plateBox(2)[0] + plateBox(2)[2])).toBe(plateBox(0)[0])
    // The top one sits on the centre line.
    expect(plateBox(1)[0] + plateBox(1)[2] / 2).toBeCloseTo(50, 6)
  })
})

describe("the council's core", () => {
  it('is as far from the top plate as from the cut edges of the lower two, at any proportion', () => {
    for (const [width, height] of [
      [920, 400],
      [640, 400],
      [300, 190],
      [1200, 522],
    ] as const) {
      const [toTop, toCut] = coreGaps(width, height, coreTop(width, height))
      expect(toTop).toBeGreaterThan(0)
      expect(toCut).toBeCloseTo(toTop, 6)
    }
  })

  it('is not half-way down the gap between the plates, which left it too high', () => {
    // Half-way down the gap (49.5%) was nearer the top plate than the cut edges, which slant away.
    const [toTop, toCut] = coreGaps(920, 400, 49.5)
    expect(toTop).toBeLessThan(toCut)
    expect(coreTop(920, 400)).toBeCloseTo(57.25, 1)
  })

  it('falls back on the middle of the gap before the board has a size', () => {
    expect(coreTop(0, 0)).toBe(49.5)
  })
})
