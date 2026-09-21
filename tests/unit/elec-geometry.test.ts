import { describe, expect, it } from 'vitest'
import { coreGaps, coreTop, plateArea } from '../../src/renderer/widgets/elec/geometry.js'

describe("the council's plates", () => {
  it('are one area: the top one was a fifth smaller than the two below it', () => {
    expect(plateArea(2)).toBe(plateArea(0))
    expect(plateArea(1) / plateArea(0)).toBeCloseTo(1, 2)
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
    // Half-way down the gap (45.5%) was nearer the top plate than the cut edges, which slant away.
    const [toTop, toCut] = coreGaps(920, 400, 45.5)
    expect(toTop).toBeLessThan(toCut)
    expect(coreTop(920, 400)).toBeCloseTo(53.25, 1)
  })

  it('falls back on the middle of the gap before the board has a size', () => {
    expect(coreTop(0, 0)).toBe(45.5)
  })
})
