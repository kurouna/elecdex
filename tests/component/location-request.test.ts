import type { WeatherLocation } from '@shared/weather-report'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')

/**
 * The place picker a weather pane opens for itself.
 *
 * The picker outlives nothing: it answers one pane, through a callback into
 * that pane's component. A pane closed while its picker is open would leave the
 * picker over the workspace with nothing behind it to answer, so the pane takes
 * its request back as it goes.
 */

const TOKYO: WeatherLocation = { source: 'jma', office: '130000', name: 'Tokyo' }

const request = (name: string) => ({
  current: { ...TOKYO, name },
  choose: vi.fn(),
})

afterEach(() => {
  ui.closeLocationPicker()
  ui.closeSettings()
  ui.closePanePicker()
})

describe('a pane asking for the place picker', () => {
  it('takes its request back when it goes away', () => {
    const withdraw = ui.pickLocation(request('one'))
    expect(ui.locationRequest).not.toBeNull()

    withdraw()
    expect(ui.locationRequest).toBeNull()
  })

  it('leaves alone a picker another pane has taken over', () => {
    const withdrawFirst = ui.pickLocation(request('one'))
    const second = request('two')
    const withdrawSecond = ui.pickLocation(second)

    // The first pane is closed while the second pane's picker is showing.
    withdrawFirst()
    expect(ui.locationRequest).toBe(second)

    withdrawSecond()
    expect(ui.locationRequest).toBeNull()
  })

  it('disturbs nothing once the picker has already been answered', () => {
    const withdraw = ui.pickLocation(request('one'))
    ui.closeLocationPicker()
    ui.openSettings()

    withdraw()
    expect(ui.settingsOpen).toBe(true)
    expect(ui.locationRequest).toBeNull()
  })
})
