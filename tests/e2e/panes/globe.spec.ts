import { expect } from '@playwright/test'
import { test } from '../support/shared.js'
import { launch, metricsActive, single } from '../support.js'

/**
 * The world view: it renders, it reads connections from the collector, and it
 * stops that collection when it goes away.
 */

test('the globe renders and reports connections by country', async ({ shared }) => {
  const { page, close } = await shared()
  try {
    const pane = page.locator('[data-testid=pane][data-widget=globe]')
    await expect(pane.getByTestId('globe-canvas')).toBeVisible()
    await expect(pane.getByTestId('globe-failed')).toHaveCount(0)
    await expect.poll(() => metricsActive(page), { timeout: 20_000 }).toContain('net.connections')

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

test('a time zone with no country still places home, approximately, without asking the OS', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: single('globe', { id: 'g' }),
    env: { TZ: 'Etc/Unknown' },
  })
  try {
    // The zone the pane used, not the one the page reports now: the widget reads
    // it once as it is created, and Chromium may still have been on the machine's
    // own zone at that moment. Asking the page later then disagreed with what was
    // drawn, and the test failed for the environment rather than for the code.
    const shown = (await page.getByTestId('globe-home').textContent()) ?? ''
    const zone = shown.split(' · ')[0] ?? ''
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
