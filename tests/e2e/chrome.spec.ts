import { expect, test } from '@playwright/test'
import { type Launched, launch, showStatusBar } from './support.js'

/** The window's own title bar and the status bar that slides in from the bottom. */

const SINGLE_CLOCK = { version: 1, root: { kind: 'pane', id: 'c', widget: 'clock' } } as const

test('a windowed app draws its title bar in the theme, and not in fullscreen', async () => {
  const { app, page, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    const bar = page.getByTestId('titlebar')
    await expect(bar).toBeVisible()
    await expect(bar).toHaveText('elecdex')
    const colours = await page.evaluate(() => {
      const el = document.querySelector('[data-testid=titlebar]') as HTMLElement
      const probe = document.createElement('div')
      probe.style.background = 'var(--app-bg)'
      document.body.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()
      return { actual: getComputedStyle(el).backgroundColor, expected }
    })
    expect(colours.actual).toBe(colours.expected)
    expect(colours.actual).not.toBe('rgba(0, 0, 0, 0)')

    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setFullScreen(true))
    const isFullScreen = () =>
      app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isFullScreen() ?? false)
    const entered = await expect
      .poll(isFullScreen, { timeout: 10_000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false)
    // A macOS CI runner has no user session to open a fullscreen Space in, so the
    // window never gets there; what is checked is the page following the window.
    if (!entered) {
      test
        .info()
        .annotations.push({ type: 'skipped', description: 'window cannot go fullscreen here' })
      return
    }
    await expect(bar).toHaveCount(0, { timeout: 10_000 })
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.setFullScreen(false),
    )
    await expect(page.getByTestId('titlebar')).toBeVisible({ timeout: 10_000 })
  } finally {
    await close()
  }
})

test('the status bar stays hidden until the pointer reaches the bottom edge', async () => {
  const { app, page, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    const bar = page.getByTestId('status-bar')
    await expect(bar).toHaveAttribute('data-shown', 'false')
    await expect(page.getByTestId('add-pane')).toBeHidden()

    await showStatusBar(page)
    await expect(page.getByTestId('add-pane')).toBeVisible()

    // Away from it, it slides out again.
    await page.mouse.move(200, 200)
    await expect(bar).toHaveAttribute('data-shown', 'false')

    // The name is lower case and opens the repository in the browser.
    await app.evaluate(({ shell }) => {
      const opened: string[] = []
      ;(globalThis as { __opened?: string[] }).__opened = opened
      shell.openExternal = async (url: string) => {
        opened.push(url)
      }
    })
    await showStatusBar(page)
    const brand = page.getByTestId('brand-link')
    await expect(brand).toHaveText(/^elecdex/)
    await expect(brand).toHaveCSS('text-transform', 'none')
    await brand.click()
    await expect
      .poll(() => app.evaluate(() => (globalThis as { __opened?: string[] }).__opened))
      .toEqual(['https://github.com/kurouna/elecdex'])
  } finally {
    await close()
  }
})

/**
 * Runs `act` and checks it minimised the window. Main's minimize() is recorded
 * as it is called, which holds everywhere; whether the window then actually is
 * minimised is checked where the OS can do it, and restored. A Linux CI display
 * (Xvfb) has no window manager to iconify windows, so there it is only noted.
 */
async function expectMinimized(launched: Launched, act: () => Promise<void>): Promise<void> {
  const { app, platform } = launched
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    const record = globalThis as { __minimizeCalls?: number }
    record.__minimizeCalls = 0
    const minimize = win.minimize.bind(win)
    win.minimize = () => {
      record.__minimizeCalls = (record.__minimizeCalls ?? 0) + 1
      minimize()
    }
  })
  await act()
  await expect
    .poll(() => app.evaluate(() => (globalThis as { __minimizeCalls?: number }).__minimizeCalls))
    .toBe(1)

  const isMinimized = () =>
    app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isMinimized() ?? false)
  const minimized = await expect
    .poll(isMinimized, { timeout: 10_000 })
    .toBe(true)
    .then(() => true)
    .catch(() => false)
  if (!minimized && platform === 'linux') {
    test
      .info()
      .annotations.push({ type: 'note', description: 'no window manager to minimise here' })
    return
  }
  expect(minimized).toBe(true)
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.restore())
  await expect.poll(isMinimized, { timeout: 10_000 }).toBe(false)
}

test('in fullscreen, window controls slide down from the top-right corner only', async () => {
  const launched = await launch(undefined, { layout: SINGLE_CLOCK })
  const { app, page, platform, close } = launched
  try {
    test.skip(platform === 'darwin', 'macOS keeps its own fullscreen controls')
    const isFullScreen = () =>
      app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isFullScreen() ?? false)

    // Windowed: the native controls are there, so the corner is not.
    await expect(page.getByTestId('titlebar')).toBeVisible()
    await expect(page.getByTestId('window-corner')).toHaveCount(0)

    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setFullScreen(true))
    const entered = await expect
      .poll(isFullScreen, { timeout: 10_000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false)
    if (!entered) {
      test
        .info()
        .annotations.push({ type: 'skipped', description: 'window cannot go fullscreen here' })
      return
    }
    const corner = page.getByTestId('window-corner')
    await expect(corner).toHaveAttribute('data-shown', 'false', { timeout: 10_000 })

    const width = await page.evaluate(() => window.innerWidth)
    // The rest of the top edge, over pane titles and tabs, does not call it up.
    for (const x of [20, width / 2, width - 400]) {
      await page.mouse.move(x, 2)
      await page.waitForTimeout(150)
      await expect(corner).toHaveAttribute('data-shown', 'false')
    }
    await page.mouse.move(width - 10, 2)
    await expect(corner).toHaveAttribute('data-shown', 'true')
    // Onto the controls it stays; away from them it slides back up.
    const minimize = page.getByTestId('window-minimize')
    await minimize.hover()
    await page.waitForTimeout(700)
    await expect(corner).toHaveAttribute('data-shown', 'true')
    await page.mouse.move(width / 2, 300)
    await expect(corner).toHaveAttribute('data-shown', 'false')

    // Quit asks first: one click only arms it.
    await page.mouse.move(width - 10, 2)
    await page.getByTestId('window-quit').click()
    await expect(page.getByTestId('window-quit')).toHaveText(/click again to exit/)
    await page.waitForTimeout(500)
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1)

    await expectMinimized(launched, () => minimize.click())
    // Restored, it is still fullscreen.
    await expect.poll(isFullScreen, { timeout: 10_000 }).toBe(true)

    await page.mouse.move(width - 10, 2)
    await page.getByTestId('window-leave-fullscreen').click()
    await expect.poll(isFullScreen, { timeout: 10_000 }).toBe(false)
    await expect(page.getByTestId('window-corner')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByTestId('titlebar')).toBeVisible()
  } finally {
    await close()
  }
})

test('Ctrl+Shift+M minimizes the window, even with a shell focused', async () => {
  const launched = await launch()
  const { page, platform, close } = launched
  try {
    test.skip(platform === 'darwin', 'not offered on macOS')
    await page.locator('.xterm-helper-textarea').first().focus()
    await expectMinimized(launched, () => page.keyboard.press('Control+Shift+KeyM'))
  } finally {
    await close()
  }
})
