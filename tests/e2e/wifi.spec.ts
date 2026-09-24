import { expect, type Page, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The Wi-Fi pane, on the collector's stub (support.ts sets ELECDEX_WIFI_STUB=1,
 * a steady link; `train` loses the way out eight seconds in every forty and
 * changes access point every thirty). No echo leaves the machine.
 */

const alone = (widget = 'wifi') => ({
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [60, 40],
    children: [
      { kind: 'pane', id: 'w', widget },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
})

const active = async (page: Page): Promise<string[]> =>
  (await page.evaluate(() => window.elecdex.metrics.stats())).active ?? []

test('shows the link, its verdict and its call score, masks it, and copies a report', async () => {
  const { app, page, close } = await launch(undefined, { layout: alone() })
  try {
    await expect(page.getByTestId('wifi-ssid')).toHaveText('ELECDEX-LAB', { timeout: 20_000 })
    await expect(page.getByTestId('wifi-state')).toContainText('ONLINE')
    await expect(page.getByTestId('wifi-verdict')).toContainText('CLEAR', { timeout: 15_000 })
    await expect(page.getByTestId('wifi-mos')).toContainText(/4\.\d/)
    await expect(page.locator('[data-testid=wifi-station][data-station=internet]')).toContainText(
      '18 ms',
    )

    await page.getByTestId('wifi-mask').click()
    await expect(page.getByTestId('wifi-ssid')).not.toContainText('ELECDEX-LAB')
    await page.getByTestId('wifi-copy').click()
    await expect(page.getByTestId('wifi-copy')).toHaveText('COPIED')
    const report = await app.evaluate(({ clipboard }) => clipboard.readText())
    expect(report).toContain('elecdex Wi-Fi report')
    expect(report).toContain('CLEAR')
    expect(report).not.toContain('ELECDEX-LAB')
    expect(report).not.toContain('192.0.2.23')
  } finally {
    await close()
  }
})

test('nothing reads the link or pings once the pane has gone', async () => {
  const { page, close } = await launch(undefined, { layout: alone() })
  try {
    await expect(page.getByTestId('wifi-ssid')).toHaveText('ELECDEX-LAB', { timeout: 20_000 })
    expect(await active(page)).toEqual(expect.arrayContaining(['net.wifi', 'net.wifi.events']))
    await page.locator('[data-testid=pane][data-widget=wifi] [data-testid=pane-close]').click()
    await expect(page.getByTestId('wifi')).toHaveCount(0)
    await expect
      .poll(async () => (await active(page)).filter((id) => id.startsWith('net.wifi')), {
        timeout: 15_000,
      })
      .toEqual([])
  } finally {
    await close()
  }
})

test('on a train, names the way out lost, and logs the drops and the change of car', async () => {
  test.setTimeout(120_000)
  const { page, close } = await launch(undefined, {
    layout: alone(),
    env: { ELECDEX_WIFI_STUB: 'train' },
  })
  try {
    // Seconds 20-27 of every 40: the gateway answers, the internet does not.
    await expect(page.getByTestId('wifi-verdict')).toContainText('UPSTREAM LOST', {
      timeout: 60_000,
    })
    await expect(page.locator('[data-testid=pane][data-widget=wifi]')).toContainText(
      'upstream lost',
    )
    const log = page.locator('[data-testid=wifi-view][data-view=log]')
    if ((await log.count()) > 0) await log.click()
    const events = page.getByTestId('wifi-event')
    // The system's own log, from before the pane opened, with how long the drop lasted.
    await expect(events.filter({ hasText: 'LINK LOST' }).first()).toContainText('down 14s')
    // What the pane saw: the way out going, and a new access point at the half minute.
    await expect(events.filter({ hasText: 'UPSTREAM LOST' }).first()).toBeVisible()
    await expect(events.filter({ hasText: 'HANDOVER' }).first()).toBeVisible({ timeout: 40_000 })
  } finally {
    await close()
  }
})

test('the network preset puts the Wi-Fi pane over the socket table, beside the globe over the shells', async () => {
  const { page, close } = await launch(undefined, {
    env: { ELECDEX_SEED_LAYOUTS: '1' },
    settings: { layout: { confirmSwitch: false } },
  })
  try {
    await page.keyboard.press('Control+Shift+Digit2')
    const box = async (widget: string) => {
      const pane = page.locator(`[data-testid=pane][data-widget=${widget}]`).first()
      await expect(pane).toBeVisible({ timeout: 20_000 })
      const b = await pane.boundingBox()
      if (b === null) throw new Error(`${widget} has no box`)
      return b
    }
    const [globe, terminal, wifi, connections] = [
      await box('globe'),
      await box('terminal'),
      await box('wifi'),
      await box('connections'),
    ]
    // Left: the globe over the shells, two to one. Right: Wi-Fi over sockets, half and half.
    expect(terminal.y).toBeGreaterThan(globe.y + globe.height - 40)
    expect(globe.height / terminal.height).toBeGreaterThan(1.6)
    expect(connections.y).toBeGreaterThan(wifi.y + wifi.height - 40)
    expect(Math.abs(wifi.height - connections.height)).toBeLessThan(wifi.height * 0.15)
    expect(wifi.x).toBeGreaterThan(globe.x + globe.width - 20)
  } finally {
    await close()
  }
})
