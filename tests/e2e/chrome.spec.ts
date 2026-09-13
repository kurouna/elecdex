import { expect, test } from '@playwright/test'
import { launch, showStatusBar } from './support.js'

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
