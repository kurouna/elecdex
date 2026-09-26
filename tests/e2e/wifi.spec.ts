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

test('with two adapters, a chip chooses the one followed, with its own gateway', async () => {
  const { page, close } = await launch(undefined, {
    layout: alone(),
    env: { ELECDEX_WIFI_STUB: 'dual' },
  })
  try {
    const chips = page.getByTestId('wifi-adapter')
    await expect(chips).toHaveCount(2, { timeout: 20_000 })
    await expect(page.getByTestId('wifi-ssid')).toHaveText('ELECDEX-LAB')
    await chips.nth(1).click()
    await expect(page.getByTestId('wifi-ssid')).toHaveText('ELECDEX-LAB-2G')
    await expect(chips.nth(1)).toHaveAttribute('aria-selected', 'true')
    // The second adapter's own gateway, not the first one's.
    await expect(page.locator('[data-testid=wifi-station][data-station=gateway]')).toContainText(
      '7 ms',
      { timeout: 15_000 },
    )
  } finally {
    await close()
  }
})

test('a figure the pointer rests on explains itself, with what it reads now', async () => {
  const { page, close } = await launch(undefined, { layout: alone() })
  try {
    const internet = page.locator('[data-testid=wifi-station][data-station=internet]')
    await expect(internet).toContainText('18 ms', { timeout: 20_000 })
    await expect(page.getByTestId('wifi-legend')).toContainText('median ± jitter')
    await internet.hover()
    const card = page.getByTestId('wifi-hint')
    await expect(card).toHaveAttribute('data-key', 'station-internet')
    await expect(page.getByTestId('wifi-hint-now')).toContainText('median 18 ms')
    await page.getByTestId('wifi-mos').hover()
    await expect(card).toHaveAttribute('data-key', 'mos')
    await page.mouse.move(2, 2)
    await expect(card).toHaveCount(0)
  } finally {
    await close()
  }
})

test('what is read is at the body size, and labels a step below, however narrow the pane', async () => {
  // A pane under 26rem wide: the width at which the stations once dropped a size.
  const withLog = (share: number) => ({
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'row',
      sizes: [share, 100 - share],
      children: [
        { kind: 'pane', id: 'w', widget: 'wifi', state: { view: 'log' } },
        { kind: 'pane', id: 'c', widget: 'clock' },
      ],
    },
  })
  for (const layout of [withLog(60), withLog(22)]) {
    const { page, close } = await launch(undefined, { layout })
    try {
      await expect(page.getByTestId('wifi-ssid')).toHaveText('ELECDEX-LAB', { timeout: 20_000 })
      await expect(page.getByTestId('wifi-event').first()).toBeVisible()
      const rems = await page.evaluate(() => {
        const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        const rem = (selector: string) => {
          const el = document.querySelector(selector)
          return el === null ? null : Number.parseFloat(getComputedStyle(el).fontSize) / root
        }
        return {
          name: rem('[data-testid=wifi-station] .name'),
          main: rem('[data-testid=wifi-station] .main'),
          sub: rem('[data-testid=wifi-station] .sub'),
          evidence: rem('[data-testid=wifi-verdict] .evidence'),
          state: rem('[data-testid=wifi-state]'),
          event: rem('[data-testid=wifi-event]'),
          legend: rem('[data-testid=wifi-legend]'),
          mosLabel: rem('[data-testid=wifi-mos] .k'),
        }
      })
      // --step--1 is 0.75rem (12 px on a 1080p screen); --step--2, 0.625rem, is for labels.
      for (const read of ['name', 'main', 'sub', 'evidence', 'state', 'event'] as const) {
        expect(rems[read], read).toBeCloseTo(0.75, 2)
      }
      expect(rems.legend).toBeCloseTo(0.625, 2)
      expect(rems.mosLabel).toBeCloseTo(0.625, 2)
    } finally {
      await close()
    }
  }
})
