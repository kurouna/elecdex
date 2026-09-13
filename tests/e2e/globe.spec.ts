import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The world view: it renders, it reads connections from the collector, and it
 * stops that collection when it goes away.
 */

const stats = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.elecdex.metrics.stats())

test('the globe renders and reports connections by country', async () => {
  const { page, close } = await launch()
  try {
    const pane = page.locator('[data-testid=pane][data-widget=globe]')
    await expect(pane.getByTestId('globe-canvas')).toBeVisible()
    await expect(pane.getByTestId('globe-failed')).toHaveCount(0)
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 20_000 })
      .toContain('net.connections')

    // The collector's reading arrives: counts are numbers, countries are codes.
    await expect(pane.getByTestId('globe-counts')).toContainText(/\d+ connections/i, {
      timeout: 30_000,
    })
    const codes = await pane
      .getByTestId('globe-countries')
      .locator('li')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-code')))
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2}$/)

    // The GeoIP data's licence asks for credit.
    await expect(pane).toContainText('GeoIP: NRO, CC BY 4.0')
    await expect(pane.getByTestId('pane-subtitle')).toContainText(/endpoint/i)
  } finally {
    await close()
  }
})

test('closing the globe stops collecting connections', async () => {
  const { page, close } = await launch()
  try {
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 20_000 })
      .toContain('net.connections')
    const pane = page.locator('[data-testid=pane][data-widget=globe]')
    await pane.hover()
    await pane.getByTestId('pane-close').click()
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 10_000 })
      .not.toContain('net.connections')
  } finally {
    await close()
  }
})

test('a time zone with no country still places home, approximately, without asking the OS', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'g', widget: 'globe' } },
    env: { TZ: 'Etc/Unknown' },
  })
  try {
    const zone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
    test.skip(
      zone !== 'Etc/Unknown' && zone !== 'UTC' && zone !== 'Etc/UTC',
      `TZ not honoured (${zone})`,
    )
    // No country in the zone: placed from the locale (or the offset), marked approximate.
    await expect(page.getByTestId('globe-home')).toContainText('(approx.)')
    await expect(page.getByTestId('globe-no-location')).toHaveCount(0)

    // Whatever asks, location is refused without a prompt.
    const state = await page.evaluate(
      async () => (await navigator.permissions.query({ name: 'geolocation' })).state,
    )
    expect(state).toBe('denied')
    const granted = await app.evaluate(async ({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      return win?.webContents.executeJavaScript(
        'new Promise((resolve) => navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false)))',
      )
    })
    expect(granted).toBe(false)
  } finally {
    await close()
  }
})
