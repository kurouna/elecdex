import { expect, type Page, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The Ethernet pane, on the collector's stub (support.ts sets ELECDEX_ETHER_STUB=1,
 * a steady gigabit link; `flapping` drops for 3 s every two minutes, power saving
 * on; `crc` takes damaged frames). Nothing of this machine's adapters is read and
 * no echo leaves it.
 */

const alone = (widget = 'ethernet') => ({
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [60, 40],
    children: [
      { kind: 'pane', id: 'e', widget },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
})

const active = async (page: Page): Promise<string[]> =>
  (await page.evaluate(() => window.elecdex.metrics.stats())).active ?? []

const station = (page: Page, id: string) =>
  page.locator(`[data-testid=ether-station][data-station=${id}]`)

test('shows the link, its verdict and its call score, masks it, and copies a report', async () => {
  const { app, page, close } = await launch(undefined, { layout: alone() })
  try {
    await expect(page.getByTestId('ether-state')).toContainText('ONLINE', { timeout: 20_000 })
    await expect(page.getByTestId('ether-verdict')).toContainText('CLEAR', { timeout: 15_000 })
    await expect(station(page, 'link')).toContainText('1 Gb/s full')
    await expect(station(page, 'gateway')).toContainText('<1 ms')
    await expect(page.getByTestId('ether-mos')).toContainText(/4\.\d/)

    await page.getByTestId('ether-mask').click()
    await page.getByTestId('ether-copy').click()
    await expect(page.getByTestId('ether-copy')).toHaveText('COPIED')
    const report = await app.evaluate(({ clipboard }) => clipboard.readText())
    expect(report).toContain('elecdex Ethernet report')
    expect(report).toContain('CLEAR')
    expect(report).not.toContain('192.0.2.31')
    expect(report).not.toContain('02:00:5e')
  } finally {
    await close()
  }
})

test('nothing reads the link or echoes once the pane has gone', async () => {
  const { page, close } = await launch(undefined, { layout: alone() })
  try {
    await expect(page.getByTestId('ether-state')).toContainText('ONLINE', { timeout: 20_000 })
    expect(await active(page)).toContain('net.ethernet')
    await page.locator('[data-testid=pane][data-widget=ethernet] [data-testid=pane-close]').click()
    await expect(page.getByTestId('ether')).toHaveCount(0)
    await expect
      .poll(async () => (await active(page)).filter((id) => id === 'net.ethernet'), {
        timeout: 15_000,
      })
      .toEqual([])
  } finally {
    await close()
  }
})

test('blames the cable for CRC errors, the figure at fault coloured and not the speed', async () => {
  const { page, close } = await launch(undefined, {
    layout: alone(),
    env: { ELECDEX_ETHER_STUB: 'crc' },
  })
  try {
    await expect(page.getByTestId('ether-verdict')).toContainText('LINK', { timeout: 40_000 })
    await expect(page.getByTestId('ether-verdict')).toContainText('CRC errors')
    await expect(station(page, 'link')).toHaveAttribute('data-culprit', 'true')
  } finally {
    await close()
  }
})

test('logs a drop and the link coming back, and names power saving only after it', async () => {
  test.setTimeout(150_000)
  const { page, close } = await launch(undefined, {
    layout: alone(),
    env: { ELECDEX_ETHER_STUB: 'flapping' },
  })
  try {
    await expect(page.getByTestId('ether-state')).toContainText('ONLINE', { timeout: 20_000 })
    await expect(page.getByTestId('ether-caution')).toHaveCount(0)
    // The stub's first drop is at 60 s.
    const pane = page.locator('[data-testid=pane][data-widget=ethernet]')
    await expect(pane.getByTestId('ether-event').filter({ hasText: 'LINK LOST' })).toHaveCount(1, {
      timeout: 90_000,
    })
    await expect(pane.getByTestId('ether-event').filter({ hasText: 'down 3s' })).toHaveCount(1, {
      timeout: 15_000,
    })
    await expect(page.getByTestId('ether-caution')).toContainText('power saving on')
  } finally {
    await close()
  }
})
