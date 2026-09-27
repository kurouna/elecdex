import { cpSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * KEYSTREAM, the sample plugin for canvas blocks, keys and sound
 * (examples/plugins/keystream), running as a user would install it: the folder copied into
 * the plugins folder, agreed to. Its volume is 0, so nothing is heard; the pane counts the
 * notes the host's synthesiser took (data-notes).
 */

const SOURCE = fileURLToPath(new URL('../../examples/plugins/keystream', import.meta.url))

function withKeystream(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-'))
  cpSync(SOURCE, path.join(dir, 'plugins', 'keystream'), { recursive: true })
  writeFileSync(
    path.join(dir, 'settings.json'),
    JSON.stringify({
      sound: { enabled: false },
      plugins: {
        keystream: {
          enabled: true,
          key: 'keystream',
          granted: { keys: true, sound: true },
          values: { volume: 0 },
        },
      },
    }),
  )
  return dir
}

const LAYOUT = { version: 1, root: { kind: 'pane', id: 'p1', widget: 'plugin:keystream' } }

test('the sample draws on its canvas, takes the keys only while focused, and plays a track', async () => {
  const dir = withKeystream()
  const app = await launch(dir, { layout: LAYOUT })
  const { page } = app
  const pane = page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
  const notes = async () => Number(await pane.getAttribute('data-notes'))
  try {
    await expect(pane).toHaveAttribute('data-status', 'ready')
    const canvas = pane.getByTestId('plugin-canvas')
    await expect(canvas).toBeVisible()
    await expect(pane.getByTestId('plugin-error')).toHaveCount(0)
    await expect(pane.getByTestId('plugin-problem')).toHaveCount(0)

    // No keys until the pane is clicked, and the lamp says when it has them.
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    await canvas.click()
    await expect(pane.getByTestId('plugin-keys')).toBeVisible()

    // A key's note is played by the host itself, the moment the key goes down.
    const before = await notes()
    await page.keyboard.press('a')
    await expect.poll(notes).toBeGreaterThan(before)

    // Enter starts the first track: the boot log's ticks, then the band a few seconds ahead
    // at a time - more goes to the host while the track plays, never the song at once.
    const idle = await notes()
    await page.keyboard.press('Enter')
    await expect.poll(notes, { timeout: 8000 }).toBeGreaterThan(idle + 20)
    const first = await notes()
    await expect.poll(notes, { timeout: 10_000 }).toBeGreaterThan(first + 20)

    // Pausing and quitting to the menu raise nothing.
    await page.keyboard.press('Escape')
    await page.keyboard.press('q')
    await expect(pane.getByTestId('plugin-error')).toHaveCount(0)

    // The keyboard leaves while a track loads: it waits, paused before its count, playing
    // nothing but the boot log's ticks - and goes on from the count once the pane is back.
    const loading = await notes()
    await page.keyboard.press('Enter')
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    await page.waitForTimeout(2500)
    expect(await notes()).toBeLessThanOrEqual(loading + 4)
    await canvas.click()
    await expect(pane.getByTestId('plugin-keys')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect.poll(notes, { timeout: 8000 }).toBeGreaterThan(loading + 20)
    await page.keyboard.press('Escape')
    await page.keyboard.press('q')

    // The keyboard leaves the pane: the lamp goes out, and a key plays nothing.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    const away = await notes()
    await page.keyboard.press('a')
    await page.waitForTimeout(300)
    expect(await notes()).toBe(away)
  } finally {
    await app.quit()
    removeDir(dir)
  }
})
