import type { BackgroundCapabilities } from '@shared/background'
import { describe, expect, it } from 'vitest'
import { settingsSections } from '../../src/renderer/settings-sections.js'

/**
 * The settings dialog's sections, which the action palette offers too. The order is the one
 * SettingsDialog.svelte had before the list moved out of it.
 */

const NONE: BackgroundCapabilities = {
  tray: false,
  closeToTray: false,
  minimizeToTray: false,
  staysWithoutWindow: false,
  globalShortcut: false,
  launchAtLogin: false,
  launchHidden: false,
}

describe('settingsSections', () => {
  it('lists the sections in the dialog’s order', () => {
    expect(settingsSections({ ...NONE, tray: true, closeToTray: true }).map((s) => s.id)).toEqual([
      'general',
      'window',
      'keyboard',
      'alerts',
      'ai',
      'plugins',
      'updates',
    ])
  })

  it('has the window section only where there is something to offer in it', () => {
    expect(settingsSections(NONE).map((s) => s.id)).not.toContain('window')
    for (const offered of [
      'closeToTray',
      'minimizeToTray',
      'globalShortcut',
      'launchAtLogin',
    ] as const) {
      expect(
        settingsSections({ ...NONE, [offered]: true }).map((s) => s.id),
        offered,
      ).toContain('window')
    }
  })

  it('labels each section by its id', () => {
    for (const section of settingsSections({ ...NONE, globalShortcut: true })) {
      expect(section.label).toBe(section.id)
    }
  })
})
