import { readFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { clickThen, LEAVING, launch, SINGLE_TERMINAL, terminalPane } from './support.js'

/** The settings dialog: appearance, shortcuts and the update check. */

const SINGLE_CLOCK = { version: 1, root: { kind: 'pane', id: 'c', widget: 'clock' } } as const

const savedSettings = (userData: string) =>
  JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8'))

test('settings open from the shortcut, apply at once and are saved', async () => {
  const { page, userData, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    await page.keyboard.press('Control+Shift+Period')
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
    await page.keyboard.press('Control+Shift+Period')
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
    await page.keyboard.press('Control+Shift+Period')
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
      await page.keyboard.press('Control+Shift+Period')
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
      // Dismissed, it powers off before it goes.
      const noticeSel = '[data-testid=update-notice]'
      expect(await clickThen(page, '[data-testid=update-notice-dismiss]', [noticeSel])).toEqual({
        [noticeSel]: LEAVING,
      })
      await expect(notice).toHaveCount(0)
    } finally {
      await close()
    }
  })
})

test('a shell starts in the home folder by default, and in the folder chosen in settings', async () => {
  const { page, userData, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  // Paths as the shells report them may differ in case, separators and a trailing one.
  const same = (a: string) => a.trim().replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase()
  const cwdOf = (pane: ReturnType<typeof terminalPane>) =>
    expect.poll(async () => same(await pane.getByTestId('pane-subtitle').innerText()), {
      timeout: 40_000,
      intervals: [300],
    })
  try {
    // Not the folder the app was started from: home.
    await cwdOf(terminalPane(page).first()).toBe(same(os.homedir()))

    await page.keyboard.press('Control+Shift+Period')
    const input = page.getByTestId('settings-start-directory')
    const note = page.getByTestId('settings-start-directory-note')
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('placeholder', `home (${os.homedir()})`)

    // A folder that is not there: kept as typed, and the dialog says shells start at home.
    await input.fill(path.join(userData, 'no-such-folder'))
    await input.press('Enter')
    await expect
      .poll(() => savedSettings(userData).terminal?.startDirectory)
      .toBe(path.join(userData, 'no-such-folder'))
    await expect(note).toHaveClass(/problem/)
    await expect(note).toContainText('Not a folder')

    await input.fill(userData)
    await input.press('Enter')
    await expect.poll(() => savedSettings(userData).terminal?.startDirectory).toBe(userData)
    await expect(note).not.toHaveClass(/problem/)
    await page.keyboard.press('Escape')

    // A new shell starts there; the one already open stays where it is.
    await page.keyboard.press('Control+Shift+KeyA')
    await page.locator('[data-testid=pane-picker-item][data-widget=terminal]').click()
    const panes = page.locator('[data-testid=pane][data-widget=terminal]')
    await expect(panes).toHaveCount(2)
    await cwdOf(panes.nth(1)).toBe(same(userData))
    await cwdOf(panes.nth(0)).toBe(same(os.homedir()))

    // "home" clears the setting.
    await page.keyboard.press('Control+Shift+Period')
    await page.getByTestId('settings-start-directory-home').click()
    await expect.poll(() => savedSettings(userData).terminal?.startDirectory).toBe('')
    await expect(input).toHaveValue('')
  } finally {
    await close()
  }
})

test('the window section is only offered on Windows', async () => {
  test.skip(process.platform === 'win32', 'offered here: background.spec.ts covers it')
  const { page, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    await page.keyboard.press('Control+Shift+Period')
    await expect(page.getByTestId('settings-dialog')).toBeVisible()
    await expect(page.locator('[data-testid=settings-section][data-section=window]')).toHaveCount(0)
  } finally {
    await close()
  }
})
