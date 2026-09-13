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
