import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { ElectronApplication, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * Metrics and monitoring widgets, end to end.
 *
 * The guarantees that matter here are the ones eDEX-UI broke: a source nobody
 * is watching is not polled, a reloaded page does not leave its subscriptions
 * running, and the whole monitoring layout stays cheap.
 */

const TERMINAL_ONLY = { version: 1, root: { kind: 'pane', id: 't', widget: 'terminal' } } as const

const stats = (page: Page) => page.evaluate(() => window.elecdex.metrics.stats())

/** Closes the pane showing `widget` by focusing it and using the close shortcut. */
async function closeWidget(page: Page, widget: string) {
  const pane = page.locator(`[data-testid=pane][data-widget=${widget}]`)
  await pane.dispatchEvent('pointerdown')
  await page.keyboard.press('Control+Shift+KeyW')
  await expect(pane).toHaveCount(0)
}

test('every monitoring widget shows live data', async () => {
  const { page, close } = await launch()
  try {
    await expect(page.getByTestId('clock')).toHaveText(/^\d{2}:\d{2}:\d{2}$/)
    await expect(page.getByTestId('uptime')).toHaveText(/^\d+:\d{2}:\d{2}$/, { timeout: 20_000 })
    await expect(page.getByTestId('cpu-tasks')).toHaveText(/^\d+$/, { timeout: 30_000 })
    await expect(page.getByTestId('cpu-avg-1')).toHaveText(/Avg\. \d/, { timeout: 20_000 })
    await expect
      .poll(
        async () => Number(await page.getByTestId('memory-used-bar').getAttribute('data-fraction')),
        {
          timeout: 20_000,
        },
      )
      .toBeGreaterThan(0)
    await expect(page.getByTestId('toplist-row').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('net-state')).toHaveText(/ONLINE|OFFLINE/, { timeout: 30_000 })
    await expect(page.getByTestId('net-totals')).toHaveText(/OUT, .* IN/, { timeout: 30_000 })
    await expect(page.getByTestId('stream-chart').first()).toBeVisible()
    // At least the system volume, with a sensible fill, and disk activity.
    const volume = page.getByTestId('disk-volume').first()
    await expect(volume).toBeVisible({ timeout: 40_000 })
    const fraction = Number(await volume.getAttribute('data-fraction'))
    expect(fraction).toBeGreaterThan(0)
    expect(fraction).toBeLessThanOrEqual(1)
    await expect(page.getByTestId('disk-read')).toHaveText(/\/s$/, { timeout: 30_000 })
  } finally {
    await close()
  }
})

test('the collector is never started for a layout without monitoring widgets', async () => {
  const first = await launch()
  await first.app.close()
  writeFileSync(path.join(first.userData, 'layout.json'), JSON.stringify(TERMINAL_ONLY))

  const second = await launch(first.userData)
  try {
    await second.page.waitForTimeout(3000)
    expect(await stats(second.page)).toEqual({ active: [], collections: {}, running: false })
  } finally {
    await second.close()
  }
})

test('polling stops when the last widget reading a source goes away', async () => {
  const { page, close } = await launch()
  try {
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 20_000 })
      .toContain('cpu.load')

    // cpu.load is read only by the CPU widget; proc.list also by top processes.
    await closeWidget(page, 'cpu')
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 10_000 })
      .not.toContain('cpu.load')
    expect((await stats(page)).active).toContain('proc.list')

    // And the count really stops moving - not just the reported set.
    await page.waitForTimeout(2000) // let an in-flight collection land
    const before = (await stats(page)).collections['cpu.load'] ?? 0
    await page.waitForTimeout(4000)
    expect((await stats(page)).collections['cpu.load'] ?? 0).toBe(before)
  } finally {
    await close()
  }
})

test('removing every monitoring widget stops every source', async () => {
  const { page, close } = await launch()
  try {
    await expect
      .poll(async () => (await stats(page)).active.length, { timeout: 20_000 })
      .toBeGreaterThan(5)

    // Let the page's own debounced save (the terminal recording its session)
    // land first, or it would overwrite the layout this test writes.
    await page.waitForTimeout(2000)
    await page.evaluate((tree) => window.elecdex.layout.save(tree), TERMINAL_ONLY)
    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')

    await expect.poll(async () => (await stats(page)).active, { timeout: 10_000 }).toEqual([])
    // Collections already in flight still land: on a slow machine a process list
    // through PowerShell takes seconds. Wait until the counts hold still, then
    // check that they stay that way.
    let settled = (await stats(page)).collections
    await expect
      .poll(
        async () => {
          await page.waitForTimeout(3000)
          const now = (await stats(page)).collections
          const same = JSON.stringify(now) === JSON.stringify(settled)
          settled = now
          return same
        },
        { timeout: 30_000, intervals: [0] },
      )
      .toBe(true)
    await page.waitForTimeout(5000)
    expect((await stats(page)).collections).toEqual(settled)
  } finally {
    await close()
  }
})

test('a reloaded page does not leave its subscriptions behind', async () => {
  const { page, close } = await launch()
  try {
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 20_000 })
      .toContain('cpu.load')

    // If the old page's subscriptions survived the reload, closing the CPU widget
    // on the new page would not bring cpu.load's subscriber count to zero.
    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 20_000 })
      .toContain('cpu.load')

    await closeWidget(page, 'cpu')
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 10_000 })
      .not.toContain('cpu.load')
  } finally {
    await close()
  }
})

test('unknown metric ids are rejected rather than polled', async () => {
  const { page, close } = await launch()
  try {
    await page.evaluate(() => {
      // @ts-expect-error - deliberately not a MetricSourceId.
      window.elecdex.metrics.subscribe('rm -rf /', () => {})
    })
    await page.waitForTimeout(1000)
    expect((await stats(page)).active).not.toContain('rm -rf /')
  } finally {
    await close()
  }
})

/** CPU seconds used by every Electron process, and their combined memory. */
async function appUsage(app: ElectronApplication) {
  return app.evaluate(({ app: electronApp }) => {
    const metrics = electronApp.getAppMetrics()
    return {
      cpuSeconds: metrics.reduce((sum, m) => sum + (m.cpu.cumulativeCPUUsage ?? 0), 0),
      workingSetMb: metrics.reduce((sum, m) => sum + m.memory.workingSetSize, 0) / 1024,
    }
  })
}

test('the full monitoring layout stays cheap when idle', async () => {
  // eDEX-UI's biggest problem was cost at idle. The budget here is generous for
  // noisy CI machines; locally the default layout measures ~12% of one core
  // and ~600MB. (On Windows the metrics sampler runs as a separate PowerShell
  // outside Electron's own process list, adding about 1% more.)
  const { app, page, close } = await launch()
  try {
    await app.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      win?.setContentSize(1920, 1080)
    })
    await page.waitForTimeout(15_000) // startup collections, fonts, first paints

    const WINDOW_MS = 20_000
    const start = await appUsage(app)
    await page.waitForTimeout(WINDOW_MS)
    const end = await appUsage(app)

    const percentOfOneCore = ((end.cpuSeconds - start.cpuSeconds) / (WINDOW_MS / 1000)) * 100
    console.log(
      `idle: ${percentOfOneCore.toFixed(1)}% of one core, ${end.workingSetMb.toFixed(0)} MB working set`,
    )
    // CI runners have no GPU (the globe renders in software) and share their
    // cores: ~45% on Windows and ~85% under xvfb on Linux. There the check only
    // catches a runaway loop; the real budget applies on a developer machine.
    expect(percentOfOneCore).toBeLessThan(process.env.CI ? 150 : 40)
    expect(end.workingSetMb).toBeLessThan(1200)
  } finally {
    await close()
  }
})
