import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { openSettings } from './workspace.js'

/**
 * Profiles with plugins in place, as `launch`'s `files` (paths inside the profile), and the
 * settings dialog's walk that turns one on.
 */

/** Plugins as single files in the plugins folder, by file name (`'tally.js'`). */
export function pluginFiles(plugins: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(plugins).map(([name, text]) => [`plugins/${name}`, text]),
  )
}

/** Every file of a plugin's folder `source`, as the folder `name` in the plugins folder. */
export function pluginFolder(source: string, name: string): Record<string, string> {
  const files: Record<string, string> = {}
  const walk = (dir: string, under: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name)
      const to = `${under}/${entry.name}`
      if (entry.isDirectory()) walk(from, to)
      else files[to] = readFileSync(from, 'utf8')
    }
  }
  walk(source, `plugins/${name}`)
  return files
}

/** The KEYSTREAM sample's folder (examples/plugins/keystream). */
export const KEYSTREAM_SOURCE = fileURLToPath(
  new URL('../../../examples/plugins/keystream', import.meta.url),
)

/**
 * KEYSTREAM installed, turned on and agreed to (keys and sound), its volume 0 so nothing is
 * heard, over `settings`: the `files` and `settings` of a launch.
 */
export function keystreamProfile(settings: Record<string, unknown> = {}): {
  files: Record<string, string>
  settings: Record<string, unknown>
} {
  return {
    files: pluginFolder(KEYSTREAM_SOURCE, 'keystream'),
    settings: {
      ...settings,
      plugins: {
        keystream: {
          enabled: true,
          key: 'keystream',
          granted: { keys: true, sound: true },
          values: { volume: 0 },
        },
      },
    },
  }
}

/**
 * Turns plugin `id` on in the settings dialog, agreeing to what it asks for when asked, and
 * closes the dialog once it is ready.
 */
export async function turnOnPlugin(page: Page, id: string): Promise<void> {
  await openSettings(page, 'plugins')
  const entry = page.locator(`[data-testid=settings-plugin][data-plugin="${id}"]`)
  await entry.getByTestId('plugin-enabled').click()
  const agree = entry.getByTestId('plugin-agree')
  if (await agree.isVisible()) await agree.click()
  await expect(entry).toHaveAttribute('data-status', 'ready')
  await page.getByTestId('settings-close').click()
}
