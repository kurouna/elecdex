import {
  applySettingsPatch,
  DEFAULT_CLOCK_FACE,
  defaultSettings,
  SettingsSchema,
} from '@shared/settings'
import { describe, expect, it } from 'vitest'
import { CLOCK_FACES, clockFace, clockFaceName } from '../../src/renderer/widgets/clock/faces.js'

/**
 * The CLOCK pane's faces are a table: the pane and the settings dialog read only it, so a face
 * is added by a folder and a row. These hold the table to what the pane and the dialog rely on.
 */

describe('the clock face table', () => {
  it('has the faces chosen for the first release, each id once', () => {
    const ids = CLOCK_FACES.map((face) => face.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(
      [
        'ahead',
        'dial',
        'digital',
        'karman',
        'longitude',
        'segment',
        'tape',
        'vector',
        'week',
      ].sort(),
    )
  })

  it('has the default face, WEEK (user decision 2026-11-21)', () => {
    expect(DEFAULT_CLOCK_FACE).toBe('week')
    expect(clockFace(DEFAULT_CLOCK_FACE).id).toBe('week')
  })

  it('draws a face it does not know as the default, rather than nothing', () => {
    expect(clockFace('removed-long-ago').id).toBe(DEFAULT_CLOCK_FACE)
    expect(clockFace('').id).toBe(DEFAULT_CLOCK_FACE)
  })

  it('says in the list which faces use more CPU, and only those', () => {
    const heavy = CLOCK_FACES.filter((face) => face.heavy).map((face) => face.id)
    expect(heavy).toEqual(['karman'])
    expect(clockFaceName(clockFace('karman'))).toBe('karman (uses more CPU)')
    for (const face of CLOCK_FACES.filter((f) => !f.heavy)) {
      expect(clockFaceName(face)).not.toMatch(/CPU/)
    }
  })

  it('names every face with a label for the list and a component to draw', () => {
    for (const face of CLOCK_FACES) {
      expect(face.label).toMatch(/^[a-z]+$/)
      expect(face.component).toBeTypeOf('function')
    }
  })
})

describe('the clock.face setting', () => {
  it('is WEEK until one is chosen', () => {
    expect(defaultSettings().clock.face).toBe('week')
  })

  it('keeps an id the page does not know, so a later version can still read it', () => {
    expect(SettingsSchema.parse({ clock: { face: 'aurora' } }).clock.face).toBe('aurora')
  })

  it('falls back to the default for what is not an id at all', () => {
    expect(SettingsSchema.parse({ clock: { face: 42 } }).clock.face).toBe('week')
    expect(SettingsSchema.parse({ clock: { face: 'x'.repeat(41) } }).clock.face).toBe('week')
  })

  it('is changed by a patch, leaving the rest of the settings alone', () => {
    const before = defaultSettings()
    const after = applySettingsPatch(before, { clock: { face: 'dial' } })
    expect(after?.clock.face).toBe('dial')
    expect(after?.theme).toBe(before.theme)
  })
})
