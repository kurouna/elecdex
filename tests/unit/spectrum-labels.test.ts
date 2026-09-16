import { describe, expect, it } from 'vitest'
import { labelStep } from '../../src/renderer/widgets/audio/spectrum-draw.js'

describe('spectrum labels', () => {
  it('labels every column while the labels fit', () => {
    expect(labelStep(40, 24)).toBe(1)
  })

  it('skips columns so the widest label keeps a gap, as 32 bands in a narrow pane need', () => {
    // 32 columns in 400 px: 12.5 px each, and "1.1k" is about 24 px wide.
    expect(labelStep(12.5, 24)).toBe(3)
    expect(labelStep(20, 24)).toBe(2)
  })

  it('does not divide by an empty column', () => {
    expect(labelStep(0, 24)).toBe(1)
  })
})
