import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/** The settings dialog: appearance, shortcuts and the update check. */

const SINGLE_CLOCK = { version: 1, root: { kind: 'pane', id: 'c', widget: 'clock' } } as const

const savedSettings = (userData: string) =>
  JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8'))

test('settings open from the shortcut, apply at once and are saved', async () => {
  const { page, userData, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    await page.keyboard.press('Control+Shift+Comma')
    const dialog = page.getByTestId('settings-dialog')
    await expect(dialog).toBeVisible()

    await page.getByTestId('settings-theme').selectOption('amber')
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
      .toBe('amber')
    await page.getByTestId('settings-launcher-system').uncheck()
    await expect.poll(() => savedSettings(userData).launcher?.showSystem).toBe(false)
    expect(savedSettings(userData).theme).toBe('amber')

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a shortcut can be rebound, cleared and reset, and conflicts are shown', async () => {
  const { page, userData, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    await page.keyboard.press('Control+Shift+Comma')
    await page.locator('[data-testid=settings-section][data-section=keyboard]').click()
    const addPane = page.locator('[data-testid=keybinding][data-action="pane.add"]')
    await expect(addPane.getByTestId('keybinding-chord')).toHaveText('Ctrl+Shift+A')

    // A plain key is refused: the shell needs it.
    await addPane.getByTestId('keybinding-chord').click()
    await page.keyboard.press('KeyP')
    await expect(addPane).toContainText(/use ctrl, alt or a function key/i)
    await page.keyboard.press('Alt+KeyP')
    await expect(addPane.getByTestId('keybinding-chord')).toHaveText('Alt+P')
    await expect.poll(() => savedSettings(userData).keybindings).toEqual({ 'pane.add': 'Alt+KeyP' })

    // Another action on a chord already in use is flagged.
    const quit = page.locator('[data-testid=keybinding][data-action="app.quit"]')
    await quit.getByTestId('keybinding-chord').click()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(quit.getByTestId('keybinding-conflict')).toHaveText(/in use by split right/i)
    await quit.getByTestId('keybinding-reset').click()
    await expect(quit.getByTestId('keybinding-conflict')).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('settings-dialog')).toHaveCount(0)

    // The new chord works and the old one no longer does.
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker')).toHaveCount(0)
    await page.keyboard.press('Alt+KeyP')
    await expect(page.getByTestId('pane-picker')).toBeVisible()
    await page.keyboard.press('Escape')

    // Cleared, then back to the default.
    await page.keyboard.press('Control+Shift+Comma')
    await page.locator('[data-testid=settings-section][data-section=keyboard]').click()
    await addPane.getByTestId('keybinding-clear').click()
    await expect(addPane.getByTestId('keybinding-chord')).toHaveText('none')
    await addPane.getByTestId('keybinding-reset').click()
    await expect(addPane.getByTestId('keybinding-chord')).toHaveText('Ctrl+Shift+A')
    await expect.poll(() => savedSettings(userData).keybindings).toEqual({})
  } finally {
    await close()
  }
})

test.describe('update check', () => {
  let server: Server
  let stubUrl = ''
  let requests = 0

  test.beforeAll(async () => {
    server = createServer((_req, res) => {
      requests += 1
      res.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          tag_name: 'v99.0.0',
          html_url: 'https://github.com/kurouna/elecdex/releases/tag/v99.0.0',
          draft: false,
          prerelease: false,
        }),
      )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    stubUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/releases/latest`
  })

  test.afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  test('a newer release is announced and links to its page; the daily check can be turned off', async () => {
    const { app, page, userData, close } = await launch(undefined, {
      layout: SINGLE_CLOCK,
      env: { ELECDEX_UPDATES_URL: stubUrl },
    })
    try {
      await app.evaluate(({ shell }) => {
        const opened: string[] = []
        ;(globalThis as { __opened?: string[] }).__opened = opened
        shell.openExternal = async (url: string) => {
          opened.push(url)
        }
      })
      await page.keyboard.press('Control+Shift+Comma')
      await page.locator('[data-testid=settings-section][data-section=updates]').click()
      await page.getByTestId('settings-updates-now').click()
      await expect(page.getByTestId('settings-updates-status')).toHaveAttribute(
        'data-state',
        'available',
      )
      await expect(page.getByTestId('settings-updates-status')).toContainText('99.0.0')
      expect(requests).toBeGreaterThanOrEqual(1)

      await page.getByTestId('settings-updates-check').uncheck()
      await expect.poll(() => savedSettings(userData).updates?.check).toBe(false)
      await page.keyboard.press('Escape')

      const notice = page.getByTestId('update-notice')
      await expect(notice).toContainText('99.0.0')
      await notice.getByRole('button', { name: /available/i }).click()
      await expect
        .poll(() => app.evaluate(() => (globalThis as { __opened?: string[] }).__opened))
        .toEqual(['https://github.com/kurouna/elecdex/releases/tag/v99.0.0'])
      await page.getByTestId('update-notice-dismiss').click()
      await expect(notice).toHaveCount(0)
    } finally {
      await close()
    }
  })
})
