import { defaultSettings, READING_SCALE } from '@shared/settings'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubMatchMedia } from './support/dom.ts'
import { stubElecdex } from './support/elecdex.ts'
import { settle } from './support/settle.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))
const { default: SettingsDialog } = await import('../../src/renderer/SettingsDialog.svelte')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')

/**
 * The settings' reading type fields (settings.reading): what a field left says is the scale
 * kept. Found in review: an emptied field was taken as 0 and stored as 80%, and 95 typed where
 * 100 was kept snapped back to 100 - no change, so the field went on saying 95.
 */

let patches: unknown[]

beforeEach(() => {
  stubMatchMedia()
  patches = []
  appearance.settings = {
    ...defaultSettings(),
    sound: { enabled: false, volume: 0 },
    motion: 'reduced',
    reading: { aichat: 130, elec: 100, translate: 100 },
  }
  stubElecdex({
    system: {
      platform: 'win32',
      info: async () => ({ version: '0.0.0' }),
      openExternal: async () => {},
    },
    settings: {
      patch: async (change: unknown) => {
        patches.push(structuredClone(change))
        return appearance.settings
      },
      startDirectory: async () => null,
      openFile: async () => {},
    },
    background: {
      suspendShortcut: async () => {},
      state: async () => null,
      onChange: () => () => {},
    },
    updates: { status: async () => null, onChange: () => () => {}, check: async () => null },
  })
  ui.openSettings('general')
})

afterEach(() => {
  ui.settingsOpen = false
  cleanup()
  vi.unstubAllGlobals()
})

async function field(pane: string): Promise<HTMLInputElement> {
  render(SettingsDialog)
  await settle()
  return screen.getByTestId(`settings-reading-${pane}`) as HTMLInputElement
}

describe('the reading type fields', () => {
  it('keep the scale when the field is emptied, and show it again', async () => {
    const input = await field('aichat')
    expect(input.value).toBe('130')
    input.value = ''
    await fireEvent.change(input)
    await settle()
    expect(patches).toEqual([])
    expect(input.value).toBe('130')
  })

  it('show the scale kept when what is typed snaps to it', async () => {
    const input = await field('elec')
    input.value = '95'
    await fireEvent.change(input)
    await settle()
    expect(patches).toEqual([])
    expect(input.value).toBe('100')
  })

  it('store a scale typed on its mark, within the range', async () => {
    const input = await field('translate')
    input.value = '124'
    await fireEvent.change(input)
    await settle()
    expect(patches).toEqual([{ reading: { translate: 120 } }])
    expect(input.value).toBe('120')
    input.value = '5'
    await fireEvent.change(input)
    await settle()
    expect(patches.at(-1)).toEqual({ reading: { translate: READING_SCALE.min } })
    expect(input.value).toBe(String(READING_SCALE.min))
  })
})
