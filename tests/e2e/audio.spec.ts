import type { ElectronApplication, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The spectrum and mixer panes, against the stand-ins support.ts turns on
 * (ELECDEX_AUDIO_STUB): a steady 1 kHz tone and a mixer with two made-up apps. No
 * test here captures the machine's sound or changes its volume.
 *
 * What matters beyond the display: capture runs in its own hidden window only
 * while a spectrum pane is on screen - not in a background tab, not after the
 * pane closes - and the app still quits with it open.
 */

const split = (left: Record<string, unknown>, right: Record<string, unknown>) => ({
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [0.6, 0.4],
    children: [
      { kind: 'pane', id: 'left', ...left },
      { kind: 'pane', id: 'right', ...right },
    ],
  },
})

/** The windows Electron has open: the workspace, and the capture window while it runs. */
const windowCount = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)

const litBands = async (page: Page) =>
  ((await page.getByTestId('spectrum-canvas').getAttribute('data-lit')) ?? '')
    .split(',')
    .map(Number)

test('a spectrum pane captures while shown, lights the tone band, and keeps its settings', async () => {
  let launched = await launch(undefined, {
    layout: split({ widget: 'spectrum' }, { widget: 'clock' }),
  })
  try {
    const { app, page } = launched
    const spectrum = page.getByTestId('spectrum')
    // The cyan VFD with ten bands is the default.
    await expect(spectrum).toHaveAttribute('data-style', 'vfd-cyan')
    await expect(spectrum).toHaveAttribute('data-bands', '10')
    await expect(spectrum).toHaveAttribute('data-status', 'running', { timeout: 20_000 })
    await expect.poll(() => windowCount(app)).toBe(2)

    // 1 kHz is the sixth of ten bands, and the only one lit.
    await expect
      .poll(async () => (await litBands(page)).flatMap((v, i) => (v > 0 ? [i] : [])), {
        timeout: 10_000,
      })
      .toEqual([5])

    await page.getByTestId('spectrum-settings-toggle').click()
    await page.locator('[data-testid=spectrum-style][data-value=led]').click()
    await page.locator('[data-testid=spectrum-bands][data-value="16"]').click()
    await page.locator('[data-testid=spectrum-pattern][data-value=mirror]').click()
    await expect(spectrum).toHaveAttribute('data-style', 'led')
    await expect(spectrum).toHaveAttribute('data-bands', '16')
    await expect(page.getByTestId('pane-subtitle')).toHaveText('system output · 16 bands')
    // Sixteen bands: 1 kHz is the ninth.
    await expect
      .poll(async () => (await litBands(page)).flatMap((v, i) => (v > 0 ? [i] : [])), {
        timeout: 10_000,
      })
      .toEqual([8])

    // Thirty-one bands: 1 kHz is the eighteenth.
    await page.locator('[data-testid=spectrum-bands][data-value="31"]').click()
    await expect(spectrum).toHaveAttribute('data-bands', '31')
    await expect(page.getByTestId('pane-subtitle')).toHaveText('system output · 31 bands')
    await expect
      .poll(async () => (await litBands(page)).flatMap((v, i) => (v > 0 ? [i] : [])), {
        timeout: 10_000,
      })
      .toEqual([17])
    await page.locator('[data-testid=spectrum-bands][data-value="16"]').click()

    await page.waitForTimeout(1500) // let the layout save
    launched = await launched.relaunch()
    const again = launched.page.getByTestId('spectrum')
    await expect(again).toHaveAttribute('data-style', 'led')
    await expect(again).toHaveAttribute('data-bands', '16')
    await expect(again).toHaveAttribute('data-pattern', 'mirror')

    // Closing the pane destroys the capture window.
    await expect.poll(() => windowCount(launched.app), { timeout: 20_000 }).toBe(2)
    const pane = launched.page.locator('[data-testid=pane][data-widget=spectrum]')
    await pane.hover()
    await pane.getByTestId('pane-close').click()
    await expect.poll(() => windowCount(launched.app)).toBe(1)
  } finally {
    await launched.close()
  }
})

test('a spectrum pane in a background tab does not capture, and the app quits with capture running', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'tabs',
        id: 'g',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'clock', widget: 'clock' },
          { kind: 'pane', id: 'spec', widget: 'spectrum' },
        ],
      },
    },
  })
  try {
    await expect(page.getByTestId('clock')).toBeVisible()
    await page.waitForTimeout(1500)
    expect(await windowCount(app)).toBe(1)

    await page.locator('[data-testid=tab][data-pane-id=spec]').click()
    await expect(page.getByTestId('spectrum')).toHaveAttribute('data-status', 'running', {
      timeout: 20_000,
    })
    expect(await windowCount(app)).toBe(2)

    await page.locator('[data-testid=tab][data-pane-id=clock]').click()
    await expect.poll(() => windowCount(app)).toBe(1)

    await page.locator('[data-testid=tab][data-pane-id=spec]').click()
    await expect.poll(() => windowCount(app)).toBe(2)
    // Closing the workspace window with capture running still ends the app.
    const exited = new Promise<void>((resolve) => app.process().once('exit', () => resolve()))
    await app.evaluate(({ BrowserWindow }) => {
      const workspace = BrowserWindow.getAllWindows().find((w) => w.isVisible())
      workspace?.close()
    })
    await expect(exited).resolves.toBeUndefined()
  } finally {
    await close().catch(() => {})
  }
})

test('the mixer lists the master and apps, sets a volume and mutes, and refuses unknown channels', async () => {
  const { page, close } = await launch(undefined, {
    layout: split({ widget: 'mixer' }, { widget: 'clock' }),
  })
  try {
    const strips = page.getByTestId('mixer-strip')
    await expect(strips).toHaveCount(3, { timeout: 20_000 })
    await expect(strips.nth(0)).toHaveAttribute('data-channel', 'master')
    await expect(strips.nth(1)).toContainText('Music Player')
    await expect(page.getByTestId('pane-subtitle')).toHaveText('Test Speakers · 2 apps')
    await expect(strips.nth(0).getByTestId('mixer-value')).toHaveText('50%')
    // Peaks arrive, so each strip has its meter.
    await expect(page.locator('[data-testid=mixer-strip] canvas.meter')).toHaveCount(3)

    const fader = strips.nth(1).getByTestId('mixer-fader')
    await fader.fill('35')
    await expect(strips.nth(1).getByTestId('mixer-value')).toHaveText('35%')
    // Still so once the grace period for unconfirmed changes is over: the stub took it.
    await page.waitForTimeout(2000)
    await expect(strips.nth(1).getByTestId('mixer-value')).toHaveText('35%')

    const mute = strips.nth(2).getByTestId('mixer-mute')
    await mute.click()
    await expect(mute).toHaveAttribute('aria-pressed', 'true')
    await expect(strips.nth(2).getByTestId('mixer-value')).toHaveText('MUTE')
    await mute.click()
    await expect(mute).toHaveAttribute('aria-pressed', 'false')

    // A command for a channel the mixer does not have changes nothing.
    await page.evaluate(() =>
      window.elecdex.audio.mixerCommand({ t: 'volume', id: 'app:ghost', volume: 0 }),
    )
    await page.waitForTimeout(500)
    await expect(strips).toHaveCount(3)
  } finally {
    await close()
  }
})
