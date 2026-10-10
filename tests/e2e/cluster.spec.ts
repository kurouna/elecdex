import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The CLUSTER pane (docs/cluster.md): the machine on one pane, read from the
 * metric sources other panes read too. Its judgements are unit-tested
 * (cluster.test.ts); here, that it lays itself out by its size without parts
 * running into each other, that its figures and cards come up, and that the
 * QUAKE lamp is there only with quake alerts on.
 */

const beside = (share: number) => ({
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [share, 1 - share],
    children: [
      { kind: 'pane', id: 'cl', widget: 'cluster' },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
})

const sizeTo = (app: ElectronApplication, width: number, height: number) =>
  app.evaluate(
    ({ BrowserWindow }, [w, h]) => {
      BrowserWindow.getAllWindows()[0]?.setContentSize(w as number, h as number)
    },
    [width, height],
  )

/** No two of the pane's parts overlap, and none runs past its bottom (narrow scrolls instead). */
async function partsApart(page: Page): Promise<void> {
  const boxes = await page.getByTestId('cluster').evaluate((root) => {
    const rect = (el: Element | null) => (el === null ? null : el.getBoundingClientRect().toJSON())
    const lanes = [...root.querySelectorAll('[data-lane]')].map((el) =>
      el.getBoundingClientRect().toJSON(),
    )
    return {
      root: rect(root),
      tier: root.getAttribute('data-tier'),
      lanes,
      below: rect(root.querySelector('.slots.below')),
      scrolls: root.scrollHeight > root.clientHeight + 1,
    }
  })
  const lanes = boxes.lanes as DOMRect[]
  expect(lanes).toHaveLength(6)
  for (let i = 1; i < lanes.length; i++) {
    const before = lanes[i - 1]
    const lane = lanes[i]
    if (before === undefined || lane === undefined) continue
    // In two columns (short) a lane sits beside the one before, not under it.
    if (lane.left >= before.right - 1) continue
    expect(lane.top, `lane ${i} starts under lane ${i - 1}`).toBeGreaterThanOrEqual(
      before.bottom - 1,
    )
  }
  const last = lanes.at(-1)
  if (boxes.below !== null && last !== undefined) {
    expect((boxes.below as DOMRect).top).toBeGreaterThanOrEqual(last.bottom - 1)
  }
  if (boxes.tier !== 'narrow' && last !== undefined && boxes.root !== null) {
    expect(last.bottom).toBeLessThanOrEqual((boxes.root as DOMRect).bottom + 1)
    expect(boxes.scrolls).toBe(false)
  }
}

for (const [width, height, share, tier] of [
  [1920, 1080, 0.98, 'wide'],
  [1366, 768, 0.45, 'medium'],
  [1366, 340, 0.98, 'short'],
  [1366, 768, 0.22, 'narrow'],
] as const) {
  test(`lays itself out ${tier} at ${width}x${height}, its parts never running into each other`, async () => {
    const { app, page, close } = await launch(undefined, { layout: beside(share) })
    try {
      await sizeTo(app, width, height)
      await expect(page.getByTestId('cluster')).toHaveAttribute('data-tier', tier)
      // A few readings in, so every lane has something in it.
      await expect(page.getByTestId('cluster-figure-cpu')).toContainText(/\d/)
      await partsApart(page)
    } finally {
      await close()
    }
  })
}

test('shows the readings, rolls the clock, and opens a figure’s card', async () => {
  const { page, close } = await launch(undefined, { layout: beside(0.7) })
  try {
    const cluster = page.getByTestId('cluster')
    await expect(cluster).toHaveAttribute('data-tier', /wide|medium/)
    await expect(page.getByTestId('cluster-figure-cpu')).toContainText(/\d+\s*%/)
    await expect(page.getByTestId('cluster-figure-mem')).toContainText(/\d+\s*%/)
    await expect(page.getByTestId('cluster-date')).toContainText(
      /(MON|TUES|WEDNES|THURS|FRI|SATUR|SUN)DAY/,
    )

    // The lamps in their order; QUAKE is not there with quake alerts off (the default).
    const lamps = page.getByTestId('cluster-lamps').locator('[data-lamp]')
    await expect(lamps.first()).toHaveAttribute('data-lamp', 'link')
    await expect(page.locator('[data-lamp="quake"]')).toHaveCount(0)
    await expect(page.getByTestId('cluster-message')).not.toBeEmpty()

    // The clock moves on the second.
    const clock = page.getByTestId('cluster-clock')
    const before = await clock.textContent()
    await expect(clock).not.toHaveText(before ?? '', { timeout: 3000 })

    // A card opens after a rest on a figure, with only what the row has no room for.
    await expect(page.getByTestId('cluster-slot-disk')).toContainText('%', { timeout: 40_000 })
    await page.getByTestId('cluster-slot-disk').hover()
    const card = page.getByTestId('cluster-card')
    await expect(card).toBeVisible()
    await expect(card).toContainText('DISK')
    await expect(card).toContainText('disk.volumes')
    await page.mouse.move(2, 2)
    await expect(card).toHaveCount(0)

    // And from the keyboard, at once.
    await page.getByTestId('cluster-figure-cpu').focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(card).toBeVisible()
    await expect(card).toContainText('CPU LOAD')
  } finally {
    await close()
  }
})

test('shows the QUAKE lamp only while quake alerts are on', async () => {
  const { page, close } = await launch(undefined, {
    layout: beside(0.7),
    settings: { quakes: { notify: true } },
  })
  try {
    await expect(page.locator('[data-lamp="quake"]')).toHaveCount(1)
  } finally {
    await close()
  }
})

/** CPU seconds used by every Electron process. */
const cpuSeconds = (app: ElectronApplication) =>
  app.evaluate(({ app: electronApp }) =>
    electronApp.getAppMetrics().reduce((sum, m) => sum + (m.cpu.cumulativeCPUUsage ?? 0), 0),
  )

test('a full screen of it stays cheap when idle', async () => {
  // Measured 2026-10-10 on Windows 11 at 1920x1080: 10-15% of one core, against 24% for CPU,
  // memory, traffic and disk panes side by side (docs/cluster.md §5). The lanes step once per
  // reading and hold still between, so the loop is let go between readings.
  const { app, page, close } = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'p', widget: 'cluster' } },
  })
  try {
    await sizeTo(app, 1920, 1080)
    await page.waitForTimeout(15_000)
    const WINDOW_MS = 20_000
    const start = await cpuSeconds(app)
    await page.waitForTimeout(WINDOW_MS)
    const end = await cpuSeconds(app)
    const percent = ((end - start) / (WINDOW_MS / 1000)) * 100
    console.log(`cluster idle: ${percent.toFixed(1)}% of one core`)
    // As metrics.spec.ts: on CI the number says more about the runner than about elecdex.
    expect(percent).toBeLessThan(process.env.CI ? 300 : 30)
  } finally {
    await close()
  }
})
