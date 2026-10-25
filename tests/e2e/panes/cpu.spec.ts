import { expect } from '@playwright/test'
import { test } from '../support/shared.js'
import { launch, single, waitForSaved } from '../support.js'

/**
 * The CPU pane's bar view.
 */

const layout = (widget: string, state?: Record<string, unknown>) =>
  single(widget, state === undefined ? { id: 'p' } : { id: 'p', state })

/**
 * Waits until layout.json holds the one pane's state with every key of `want`: what a restart
 * must find, written by a debounced save the test cannot see.
 */
const paneStateSaved = (userData: string, want: Record<string, unknown>) =>
  waitForSaved(userData, (text) => {
    const state = (JSON.parse(text) as { root?: { state?: Record<string, unknown> } }).root?.state
    return Object.entries(want).every(
      ([key, value]) => JSON.stringify(state?.[key]) === JSON.stringify(value),
    )
  })

test('the CPU pane switches to a bar per core, and remembers it', async () => {
  let launched = await launch(undefined, { layout: layout('cpu') })
  try {
    const { page } = launched
    const cpu = page.getByTestId('cpu')
    await expect(cpu).toHaveAttribute('data-view', 'line')
    await page.getByTestId('cpu-view').locator('[data-view=bars]').click()
    await expect(cpu).toHaveAttribute('data-view', 'bars')
    const cores = page.getByTestId('cpu-core')
    // This wait has timed out now and then on CI (Linux and Windows) and never locally;
    // on a timeout, report what the collector was doing so the cause can be found.
    await expect
      .poll(() => cores.count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
      .catch(async (error: Error) => {
        const stats = await page.evaluate(() => window.elecdex.metrics.stats()).catch(() => null)
        throw new Error(`${error.message}\nmetrics collector: ${JSON.stringify(stats)}`)
      })
    const load = Number(await cores.first().getAttribute('data-load'))
    expect(load).toBeGreaterThanOrEqual(0)
    expect(load).toBeLessThanOrEqual(100)

    await paneStateSaved(launched.userData, { view: 'bars' })
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('cpu')).toHaveAttribute('data-view', 'bars')
  } finally {
    await launched.close()
  }
})
