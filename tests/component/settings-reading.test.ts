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
    reading: { aichat: 130, elec: 100, translate: 100, rss: 100 },
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

async function fieldOf(testid: string): Promise<HTMLInputElement> {
  render(SettingsDialog)
  await settle()
  return screen.getByTestId(testid) as HTMLInputElement
}

const field = (pane: string) => fieldOf(`settings-reading-${pane}`)

describe('the shells’ type size field', () => {
  // The same field, the same faults (found in review): emptied it became 8 px, and a size
  // rounded or held to the one kept left what was typed in the field.
  it('keeps the size when emptied, and shows the size kept for what rounds or is held to it', async () => {
    appearance.settings = {
      ...appearance.settings,
      terminal: { ...appearance.settings.terminal, fontSize: 13 },
    }
    const input = await fieldOf('settings-terminal-font')
    for (const typed of ['', '13.4', 'x']) {
      input.value = typed
      await fireEvent.change(input)
      await settle()
      expect(input.value, typed).toBe('13')
    }
    expect(patches).toEqual([])
    input.value = '5'
    await fireEvent.change(input)
    await settle()
    expect(patches).toEqual([{ terminal: { fontSize: 8 } }])
    expect(input.value).toBe('8')
  })
})

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

  it('offer a field for every reading pane, the RSS article included', async () => {
    render(SettingsDialog)
    await settle()
    for (const pane of ['aichat', 'elec', 'translate', 'rss'])
      expect(screen.getByTestId(`settings-reading-${pane}`)).toBeTruthy()
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
