import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect } from '@playwright/test'
import { appMemory, idleCpu, sizeWindow, metricsStats as stats } from '../support/measure.js'
import { test } from '../support/shared.js'
import {
  atDesignSize,
  closePane,
  type Launched,
  launch,
  metricsActive,
  paneOf,
  quietFor,
  reloadWorkspace,
  SINGLE_TERMINAL,
  waitForSaved,
} from '../support.js'

/**
 * Metrics and monitoring widgets, end to end.
 *
 * The guarantees that matter here are the ones eDEX-UI broke: a source nobody
 * is watching is not polled, a reloaded page does not leave its subscriptions
 * running, and the whole monitoring layout stays cheap.
 */

/**
 * Whether every shell in the saved layout has recorded its session and the folder it reported:
 * the page's own saves at the start, which would overwrite a layout a test writes over them.
 */
function shellRecorded(text: string): boolean {
  const panes: { widget?: string; state?: { sessionId?: unknown; cwd?: unknown } }[] = []
  const walk = (node: unknown): void => {
    if (typeof node !== 'object' || node === null) return
    const n = node as { kind?: string; children?: unknown[] }
    if (n.kind === 'pane') panes.push(node as (typeof panes)[number])
    for (const child of n.children ?? []) walk(child)
  }
  walk((JSON.parse(text) as { root?: unknown }).root)
  const shells = panes.filter((p) => p.widget === 'terminal')
  return (
    shells.length > 0 &&
    shells.every((p) => p.state?.sessionId !== undefined && p.state.cwd !== undefined)
  )
}

/** Whether the saved layout has no pane of `widgets` left. */
const without = (widgets: string[]) => (text: string) =>
  widgets.every((widget) => !text.includes(`"widget": "${widget}"`))

test('every monitoring widget shows live data', async ({ shared }) => {
  const { page, close } = await shared()
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

const GPU_ONLY = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [0.5, 0.5],
    children: [
      { kind: 'pane', id: 'g', widget: 'gpu' },
      { kind: 'pane', id: 't', widget: 'terminal' },
    ],
  },
} as const

test('the GPU pane charts the made-up GPU, and says so on a machine with none', async () => {
  const { page, close } = await launch(undefined, { layout: GPU_ONLY })
  try {
    // The stub's adapter, its load between 20% and 40%, its VRAM 40% of 8 GiB.
    await expect(page.getByTestId('gpu-load')).toHaveText(/^[234]\d%$/, { timeout: 20_000 })
    await expect(page.getByTestId('gpu-vram')).toHaveText(/^3\.2 GiB \/ 8\.0 GiB$/i)
    await expect(page.getByTestId('gpu-engines')).toContainText('3D')
    await expect
      .poll(async () =>
        Number(await page.getByTestId('gpu-vram-bar').getAttribute('data-fraction')),
      )
      .toBeCloseTo(0.4, 2)
    await expect(page.locator('[data-testid=pane][data-widget=gpu]')).toContainText('Stub Graphics')
  } finally {
    await close()
  }
  const none = await launch(undefined, { layout: GPU_ONLY, env: { ELECDEX_GPU_STUB: 'none' } })
  try {
    await expect(none.page.getByTestId('gpu-none')).toBeVisible({ timeout: 20_000 })
    await expect(none.page.getByTestId('gpu-chart')).toHaveCount(0)
  } finally {
    await none.close()
  }
})

test('on Windows the GPU is read for real from the sampler, or said to be unreadable', async () => {
  test.skip(process.platform !== 'win32', 'the sampler is Windows only')
  // No stub: this machine's own counters, through the long-lived PowerShell (gpu/windows.ts).
  const { page, close } = await launch(undefined, {
    layout: GPU_ONLY,
    env: { ELECDEX_GPU_STUB: '' },
  })
  try {
    const load = page.getByTestId('gpu-load')
    const none = page.getByTestId('gpu-none')
    await expect(load.or(none)).toBeVisible({ timeout: 30_000 })
    if (await load.isVisible()) await expect(load).toHaveText(/^\d+(\.\d)?%$/, { timeout: 30_000 })
  } finally {
    await close()
  }
})

test('the collector is never started for a layout without monitoring widgets', async () => {
  // An app of its own: one shared with earlier tests has started the collector already.
  const second = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    const seen = await quietFor(3000, () => stats(second.page), 'the collector')
    expect(seen).toEqual({ active: [], collections: {}, running: false })
  } finally {
    await second.close()
  }
})

test('what cannot change is collected once, however often it is subscribed again', async () => {
  const STATIC = ['cpu.info', 'os.info', 'hardware.system'] as const
  const { page, userData, close } = await launch()
  const counts = async () => {
    const { collections } = await stats(page)
    return STATIC.map((id) => collections[id] ?? 0)
  }
  const reload = () => reloadWorkspace(page)
  try {
    await expect.poll(counts, { timeout: 30_000 }).toEqual([1, 1, 1])
    await expect(page.getByTestId('sysinfo-os')).not.toHaveText('--')

    // A reload drops every subscription and makes them again.
    await reload()
    await reload()
    await expect(page.getByTestId('sysinfo-os')).not.toHaveText('--')

    // Closing the only readers and bringing them back, as a pane move does.
    // Let the page's own debounced save land first.
    await waitForSaved(userData, shellRecorded)
    const tree = await page.evaluate(() => window.elecdex.layout.load())
    await closePane(paneOf(page, 'sysinfo'))
    await closePane(paneOf(page, 'cpu'))
    await expect.poll(() => metricsActive(page), { timeout: 10_000 }).not.toContain('os.info')
    // The closes' own save, which would overwrite ours.
    await waitForSaved(userData, without(['sysinfo', 'cpu']))
    await page.evaluate((t) => window.elecdex.layout.save(t), tree)
    await reload()
    // Served from the broker's cache, not collected again.
    await expect(page.getByTestId('sysinfo-os')).not.toHaveText('--')
    await expect
      .poll(() => metricsActive(page), { timeout: 10_000 })
      .toEqual(expect.arrayContaining([...STATIC]))
    expect(await quietFor(3000, counts, 'the once-only collections')).toEqual([1, 1, 1])
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
    // wait: the resize reaches the layout over a few frames; nothing says it has finished.
    await page.waitForTimeout(500)
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

test('unknown metric ids are rejected rather than polled', async ({ shared }) => {
  const { page, close } = await shared()
  try {
    await page.evaluate(() => {
      // @ts-expect-error - deliberately not a MetricSourceId.
      window.elecdex.metrics.subscribe('rm -rf /', () => {})
    })
    const polled = await quietFor(
      1000,
      async () => (await metricsActive(page)).includes('rm -rf /'),
      'the unknown id',
    )
    expect(polled).toBe(false)
  } finally {
    await close()
  }
})

test('the full monitoring layout stays cheap when idle', { tag: '@perf' }, async () => {
  // eDEX-UI's biggest problem was cost at idle. The budget here is generous for
  // noisy CI machines; locally the default layout measures ~12% of one core
  // and ~600MB. (On Windows the metrics sampler runs as a separate PowerShell
  // outside Electron's own process list, adding about 1% more.)
  test.setTimeout(120_000)
  const { app, page, close } = await launch()
  try {
    await sizeWindow(app, 1920, 1080)
    // Startup collections, fonts, first paints - and the GPU process, whose caches fill over the
    // first 30-50 s: measured at 35 s, a growth there showed in some runs only (2026-10-18).
    const { percentOfOneCore, power } = await idleCpu(app, page, {
      warmupMs: 45_000,
      windowMs: 20_000,
    })
    const end = await appMemory(app)
    console.log(
      `idle: ${percentOfOneCore.toFixed(1)}% of one core, ${end.workingSetMb.toFixed(0)} MB working set (GPU process ${end.gpuMb.toFixed(0)} MB), ${power}`,
    )
    // CI runners have no GPU (the globe renders in software) and share their
    // cores, so the number there says more about the runner than about elecdex:
    // measured across six runs on 2026-09-20, macOS 15-21%, Windows 121-141%
    // and Linux under xvfb 168-205%, with 651-1102 MB. The ceiling was 150,
    // which Linux went over in every run - a check that always fails is not a
    // check, and it hid the real failures in the same suite. On CI this now only
    // catches a runaway loop or a leak, which would be far past these; the real
    // budget is the local one, where the default layout measures ~12% and ~600MB.
    expect(percentOfOneCore, `% of one core, ${power}`).toBeLessThan(process.env.CI ? 300 : 40)
    expect(end.workingSetMb, `MB working set, ${power}`).toBeLessThan(process.env.CI ? 1500 : 1200)
    // The GPU process on its own: the charts' fill, clipped to its line, once grew it from about
    // 230 MB to 770-1030 MB, the whole then passing the ceiling above in some runs (2026-10-18).
    // Not on CI, which draws in software, and whose numbers say more about the runner.
    if (!process.env.CI) expect(end.gpuMb, `MB in the GPU process, ${power}`).toBeLessThan(450)
  } finally {
    await close()
  }
})

test('put away in the notification area, the full layout stops drawing', {
  tag: '@perf',
}, async () => {
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
    const WINDOW_MS = 15_000
    const onScreen = await idleCpu(app, page, { warmupMs: 15_000, windowMs: WINDOW_MS })
    const shown = onScreen.percentOfOneCore / 100
    await workspace('close')
    // A moment for the window put away to settle, then the same measurement.
    const away = await idleCpu(app, page, { warmupMs: 3000, windowMs: WINDOW_MS })
    const hidden = away.percentOfOneCore / 100
    const power = away.power
    console.log(
      `on screen ${(shown * 100).toFixed(1)}%, put away ${(hidden * 100).toFixed(1)}% of one core, ${power}`,
    )
    expect(hidden, `put away against on screen, ${power}`).toBeLessThan(shown * 0.5)
  } finally {
    await close()
  }
})
