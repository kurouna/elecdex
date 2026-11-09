import { describe, expect, it } from 'vitest'
import { shareText } from '../../src/renderer/widgets/aws/aws-view.ts'
import {
  barShares,
  heatPad,
  QUEUE_GROUPS,
  sparkPoints,
} from '../../src/renderer/widgets/github/github-view.ts'

/** The two cloud panes' view helpers that draw: pure, run where the renderer's modules type. */

describe("a tile's little charts", () => {
  it('draws the stars as a line in its box, lowest at the bottom', () => {
    expect(sparkPoints([10, 12, 11], 40, 10)).toBe('0,10 20,0 40,5')
    // A flat month is a level line through the middle; one value or none draws nothing.
    expect(sparkPoints([5, 5, 5], 40, 10)).toBe('0,5 20,5 40,5')
    expect(sparkPoints([5], 40, 10)).toBe('')
    expect(sparkPoints([], 40, 10)).toBe('')
  })

  it("gives the views' bars their share of the busiest day", () => {
    expect(barShares([0, 5, 10])).toEqual([0, 0.5, 1])
    expect(barShares([0, 0])).toEqual([])
    expect(barShares([])).toEqual([])
  })
})

describe('the contribution grid', () => {
  it('lights the busy days: brighter steps, and a glow on the two busiest', () => {
    // Pale accents (Tron's) drew the grid as grey squares: the steps were too close and nothing
    // stood out. Each level is brighter than the last, and levels 3 and 4 glow like lit pads.
    const pads = [0, 1, 2, 3, 4].map(heatPad)
    for (let i = 1; i < pads.length; i++)
      expect(pads[i]?.alpha).toBeGreaterThan(pads[i - 1]?.alpha ?? 1)
    expect(pads.map((p) => p.glow)).toEqual([0, 0, 0, 0.6, 1])
    expect(pads[0]?.alpha).toBeLessThanOrEqual(0.08)
    expect(pads[4]?.alpha).toBe(1)
  })
})

describe("QUEUE's groups", () => {
  it('are named by when they need you, not by a cause some rows do not have', () => {
    // "Broken or blocked" held a review merely eight days old; "Waiting too long" held runs
    // that wait for a press, not for time.
    expect(QUEUE_GROUPS.map((group) => [group.weight, group.label])).toEqual([
      ['danger', 'Needs you now'],
      ['warn', 'Needs you soon'],
      ['info', 'For you'],
      ['quiet', 'Triage · nobody has answered'],
    ])
  })
})

describe("COST's rows", () => {
  it("say each service's share of the month beside its amount", () => {
    // The bar ran the pane's whole width, the amount at the far end: 1600 pixels from its name.
    expect(shareText(88, 246)).toBe('36%')
    expect(shareText(2.46, 246)).toBe('1%')
    expect(shareText(0.4, 246)).toBe('<1%')
    expect(shareText(0, 0)).toBe('')
  })
})
