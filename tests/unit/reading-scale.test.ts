import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  applySettingsPatch,
  READING_PANES,
  READING_SCALE,
  readingPaneOf,
  SettingsSchema,
  snapReadingScale,
  stepReadingScale,
} from '../../src/shared/settings'

/**
 * The reading panes' type scale (settings.reading): AI CHAT, ELEC and TRANSLATE size their
 * reading text with the shells' type keys, a scale per kind of pane.
 */

const base = () => SettingsSchema.parse({})

describe('reading scale settings', () => {
  it('starts every reading pane at its designed size', () => {
    expect(base().reading).toEqual({ aichat: 100, elec: 100, translate: 100 })
  })

  it('takes a patch of one pane kind and keeps the others', () => {
    const next = applySettingsPatch(base(), { reading: { elec: 130 } })
    expect(next?.reading).toEqual({ aichat: 100, elec: 130, translate: 100 })
  })

  it('reads a broken or out-of-range value from disk as the designed size', () => {
    const read = SettingsSchema.parse({ reading: { aichat: 500, elec: 'big', translate: 120 } })
    expect(read.reading).toEqual({ aichat: 100, elec: 100, translate: 120 })
    expect(SettingsSchema.parse({ reading: 'x' }).reading).toEqual(base().reading)
  })
})

describe('stepReadingScale', () => {
  it('steps by one mark of the grid, within the range', () => {
    expect(stepReadingScale(100, 1)).toBe(110)
    expect(stepReadingScale(100, -1)).toBe(90)
    expect(stepReadingScale(READING_SCALE.max, 1)).toBe(READING_SCALE.max)
    expect(stepReadingScale(READING_SCALE.min, -1)).toBe(READING_SCALE.min)
  })

  it('takes a value off the grid to the next mark the way it is stepped', () => {
    expect(stepReadingScale(115, 1)).toBe(120)
    expect(stepReadingScale(115, -1)).toBe(110)
  })
})

describe('snapReadingScale', () => {
  it('puts a typed value on the nearest mark, within the range', () => {
    expect(snapReadingScale(124)).toBe(120)
    expect(snapReadingScale(10)).toBe(READING_SCALE.min)
    expect(snapReadingScale(999)).toBe(READING_SCALE.max)
  })
})

describe('readingPaneOf', () => {
  it('names only the reading panes', () => {
    for (const pane of READING_PANES) expect(readingPaneOf(pane)).toBe(pane)
    expect(readingPaneOf('terminal')).toBeNull()
    expect(readingPaneOf('logwatch')).toBeNull()
    expect(readingPaneOf(undefined)).toBeNull()
  })
})

describe('the scaled sizes', () => {
  const RENDERER = path.join(import.meta.dirname, '../../src/renderer')
  const FILES: Record<(typeof READING_PANES)[number], string> = {
    aichat: 'widgets/aichat/AiChatWidget.svelte',
    elec: 'widgets/elec/ElecWidget.svelte',
    translate: 'widgets/translate/TextView.svelte',
  }

  it('are a step of the scale times the pane kind’s scale, set on the pane', () => {
    for (const pane of READING_PANES) {
      const text = readFileSync(path.join(RENDERER, FILES[pane]), 'utf8')
      // The scale is the pane kind's own setting.
      expect(text).toContain(`appearance.settings.reading.${pane}`)
      expect(text).toMatch(/style:--read-scale=/)
      const uses = [...text.matchAll(/font-size:\s*([^;]*--read-scale[^;]*);/g)].map((m) => m[1])
      expect(uses.length).toBeGreaterThan(1)
      for (const use of uses)
        expect(use).toMatch(/^calc\(var\(--step-[-\d]+\) \* var\(--read-scale\)\)$/)
    }
  })
})
