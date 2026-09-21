import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { ElectronApplication, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { atDesignSize, type Launched, launch } from './support.js'

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
    // The time, then the zone's short name (JST, EDT, UTC+5:45).
    await expect(page.getByTestId('clock')).toHaveText(
      /^\d{2}:\d{2}:\d{2}( ?[A-Z][A-Za-z0-9+:-]*)?$/,
    )
    await expect(page.getByTestId('sysinfo-date')).toHaveText(
      /^[A-Z]{3} \d{1,2} (SUN|MON|TUE|WED|THU|FRI|SAT)$/,
    )
    await expect(page.getByTestId('uptime')).toHaveText(/^\d+:\d{2}:\d{2}$/, { timeout: 20_000 })
    // "Windows 11 Pro Version 25H2 (Build 26200.9457) x64", "Ubuntu 24.04 ... x64".
    await expect(page.getByTestId('sysinfo-os')).toHaveText(/\S.* (x64|arm64|ia32|arm)$/, {
      timeout: 30_000,
    })
    if (process.platform === 'win32') {
      await expect(page.getByTestId('sysinfo-os')).toHaveText(/^Windows .*\(Build \d+(\.\d+)?\)/)
    }
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
    if (process.platform === 'darwin') {
      // No activity reading on macOS: the row is left out, not shown as dashes.
      await expect(page.getByTestId('disk-io')).toHaveCount(0, { timeout: 30_000 })
    } else {
      await expect(page.getByTestId('disk-read')).toHaveText(/\/s$/, { timeout: 30_000 })
    }
  } finally {
    await close()
  }
})

test('the collector is never started for a layout without monitoring widgets', async () => {
  const first = await launch()
  await first.quit()
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

test('a tab behind another stops what it does not chart, and resumes when shown', async () => {
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'tabs',
        id: 'g',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'clock', widget: 'clock' },
          { kind: 'pane', id: 'top', widget: 'toplist' },
          { kind: 'pane', id: 'cpu', widget: 'cpu' },
        ],
      },
    },
  })
  const active = async () => (await stats(page)).active
  try {
    // Hidden from the start: the CPU chart keeps its history, the rest waits.
    await expect.poll(active, { timeout: 20_000 }).toEqual(['cpu.info', 'cpu.load'])
    await page.waitForTimeout(3000)
    expect(await active()).toEqual(['cpu.info', 'cpu.load'])
    expect((await stats(page)).collections['proc.list'] ?? 0).toBe(0)

    await page.locator('[data-testid=tab][data-pane-id=top]').click()
    await expect(page.getByTestId('toplist-row').first()).toBeVisible({ timeout: 30_000 })
    expect(await active()).toEqual(['cpu.info', 'cpu.load', 'proc.list'])

    await page.locator('[data-testid=tab][data-pane-id=cpu]').click()
    await expect(page.getByTestId('cpu-tasks')).toHaveText(/^\d+$/, { timeout: 30_000 })
    expect(await active()).toEqual([
      'cpu.info',
      'cpu.load',
      'cpu.speed',
      'cpu.temperature',
      'proc.list',
    ])

    await page.locator('[data-testid=tab][data-pane-id=clock]').click()
    await expect.poll(active, { timeout: 10_000 }).toEqual(['cpu.info', 'cpu.load'])
  } finally {
    await close()
  }
})

test('what cannot change is collected once, however often it is subscribed again', async () => {
  const STATIC = ['cpu.info', 'os.info', 'hardware.system'] as const
  const { page, close } = await launch()
  const counts = async () => {
    const { collections } = await stats(page)
    return STATIC.map((id) => collections[id] ?? 0)
  }
  const reload = async () => {
    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
  }
  try {
    await expect.poll(counts, { timeout: 30_000 }).toEqual([1, 1, 1])
    await expect(page.getByTestId('sysinfo-os')).not.toHaveText('--')

    // A reload drops every subscription and makes them again.
    await reload()
    await reload()
    await expect(page.getByTestId('sysinfo-os')).not.toHaveText('--')

    // Closing the only readers and bringing them back, as a pane move does.
    await page.waitForTimeout(2000) // let the page's own debounced save land first
    const tree = await page.evaluate(() => window.elecdex.layout.load())
    await closeWidget(page, 'sysinfo')
    await closeWidget(page, 'cpu')
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 10_000 })
      .not.toContain('os.info')
    await page.waitForTimeout(2000) // the closes' own save, which would overwrite ours
    await page.evaluate((t) => window.elecdex.layout.save(t), tree)
    await reload()
    // Served from the broker's cache, not collected again.
    await expect(page.getByTestId('sysinfo-os')).not.toHaveText('--')
    await expect
      .poll(async () => (await stats(page)).active, { timeout: 10_000 })
      .toEqual(expect.arrayContaining([...STATIC]))
    await page.waitForTimeout(3000)
    expect(await counts()).toEqual([1, 1, 1])
  } finally {
    await close()
  }
})

/**
 * Waits for the system pane's OS row to be filled in. A collection that failed is
 * retried within seconds (ONCE_RETRY_MS); if the row still stays empty on a busy
 * runner, the failure says what main was told, which the row alone cannot.
 */
async function osRowShown({ page, warnings }: Launched): Promise<void> {
  await expect(page.getByTestId('sysinfo-os'))
    .not.toHaveText('--', { timeout: 30_000 })
    .catch((error: Error) => {
      throw new Error(`${error.message}\nmain warned:\n${warnings().join('\n') || '(nothing)'}`)
    })
}

test('the system pane fits its rows in a layout saved before the OS row', async () => {
  const OLD = [0.04, 0.075, 0.19, 0.12, 0.116, 0.239, 0.055, 0.165]
  const first = await launch()
  // Settled before it quits: both times this test failed on CI, the first app had
  // hung for 20 s quitting in the middle of its start.
  await osRowShown(first).catch(async (error: unknown) => {
    await first.close()
    throw error
  })
  const saved = await first.page.evaluate(() => window.elecdex.layout.load())
  await first.quit()
  const root = saved.root
  if (root.kind !== 'split' || root.children[0]?.kind !== 'split') throw new Error('unexpected')
  root.children[0].sizes = OLD
  writeFileSync(path.join(first.userData, 'layout.json'), JSON.stringify(saved))

  const second = await launch(first.userData)
  const { app, page, close } = second
  try {
    // The size the default layout is designed for; a much smaller window is too short
    // for three rows at any height the column gives this pane. A screen that cannot give
    // the window that many pixels - the macOS CI runner's is about 1024x640 - gets them
    // as CSS pixels instead, by zooming out: the same layout, measured in the same units.
    await atDesignSize(app, page)
    const viewport = await page.evaluate(() => [window.innerWidth, window.innerHeight])
    expect(
      viewport[0],
      'the workspace has the width the layout is designed for',
    ).toBeGreaterThanOrEqual(1919)
    expect(viewport[1], 'and the height, minus the title bar').toBeGreaterThanOrEqual(1040)
    await osRowShown(second)
    await page.waitForTimeout(500) // the resize settling
    const pane = await page.locator('[data-testid=pane][data-widget=sysinfo]').boundingBox()
    const lastRow = await page.getByTestId('sysinfo').locator('.hud-cells').last().boundingBox()
    if (!pane || !lastRow) throw new Error('no boxes')
    expect(lastRow.y + lastRow.height).toBeLessThanOrEqual(pane.y + pane.height + 0.5)
    const loaded = await page.evaluate(() => window.elecdex.layout.load())
    const column = loaded.root.kind === 'split' ? loaded.root.children[0] : null
    expect(column?.kind === 'split' ? column.sizes[1] : 0).toBeCloseTo(0.125)
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
    // cores, so the number there says more about the runner than about elecdex:
    // measured across six runs on 2026-09-20, macOS 15-21%, Windows 121-141%
    // and Linux under xvfb 168-205%, with 651-1102 MB. The ceiling was 150,
    // which Linux went over in every run - a check that always fails is not a
    // check, and it hid the real failures in the same suite. On CI this now only
    // catches a runaway loop or a leak, which would be far past these; the real
    // budget is the local one, where the default layout measures ~12% and ~600MB.
    expect(percentOfOneCore).toBeLessThan(process.env.CI ? 300 : 40)
    expect(end.workingSetMb).toBeLessThan(process.env.CI ? 1500 : 1200)
  } finally {
    await close()
  }
})

test('put away in the notification area, the full layout stops drawing', async () => {
  test.skip(process.platform !== 'win32', 'running in the background is Windows only for now')
  test.setTimeout(120_000)
  // Measured locally: ~25% of one core on screen, ~7.5% put away (the monitors
  // still collect, nothing is drawn); without the pause it stayed at ~26%. The
  // clock's rolling digits are ~4% of the figure on screen and none of the one
  // put away, which is what `data-offscreen` buys (docs/architecture.md 16).
  const { app, page, close } = await launch(undefined, {
    settings: { sound: { enabled: false }, window: { closeToTray: true } },
  })
  try {
    // The workspace, not the audio capture window beside it.
    const workspace = (action: 'size' | 'close') =>
      app.evaluate(({ BrowserWindow }, what) => {
        const win = BrowserWindow.getAllWindows().find((w) =>
          w.webContents.getURL().endsWith('/index.html'),
        )
        if (what === 'size') win?.setContentSize(1920, 1080)
        else win?.close()
      }, action)
    await workspace('size')
    await page.waitForTimeout(15_000)
    const WINDOW_MS = 15_000
    const measure = async () => {
      const start = await appUsage(app)
      await page.waitForTimeout(WINDOW_MS)
      return ((await appUsage(app)).cpuSeconds - start.cpuSeconds) / (WINDOW_MS / 1000)
    }
    const shown = await measure()
    await workspace('close')
    await page.waitForTimeout(3000)
    const hidden = await measure()
    console.log(
      `on screen ${(shown * 100).toFixed(1)}%, put away ${(hidden * 100).toFixed(1)}% of one core`,
    )
    expect(hidden).toBeLessThan(shown * 0.5)
  } finally {
    await close()
  }
})
