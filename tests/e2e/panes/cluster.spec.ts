import { expect, type Page } from '@playwright/test'
import { idleCpu, sizeWindow as sizeTo } from '../support/measure.js'
import { test } from '../support/shared.js'
import { type Launched, launch, reloadWorkspace, single } from '../support.js'

/**
 * The CLUSTER pane (docs/cluster.md): the machine on one pane, read from the
 * metric sources other panes read too. Its judgements are unit-tested
 * (cluster.test.ts); here, that it lays itself out by its size without parts
 * running into each other, that its figures and cards come up, and that the
 * QUAKE lamp is there only with quake alerts on. The tests' made-up GPU
 * (STUB_ENV) gives it seven lanes; a machine without one, six - drawn by
 * tests/component/cluster-widget.test.ts.
 */

const beside = (share: number, direction: 'row' | 'column' = 'row') => ({
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction,
    sizes: [share, 1 - share],
    children: [
      { kind: 'pane', id: 'cl', widget: 'cluster' },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
})

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
      axis: rect(root.querySelector('.axis')),
      scrolls: root.scrollHeight > root.clientHeight + 1,
    }
  })
  const lanes = boxes.lanes as DOMRect[]
  expect(lanes).toHaveLength(7)
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
  // The time axis under the lanes is never cut off at the pane's foot.
  if (boxes.axis !== null && boxes.root !== null) {
    expect((boxes.axis as DOMRect).bottom).toBeLessThanOrEqual((boxes.root as DOMRect).bottom + 1)
  }
  if (boxes.tier !== 'narrow' && last !== undefined && boxes.root !== null) {
    expect(last.bottom).toBeLessThanOrEqual((boxes.root as DOMRect).bottom + 1)
    expect(boxes.scrolls).toBe(false)
  }
}

/** A window size, CLUSTER's share of it, and, for the 9:16 tour's tall window, its zoom. */
type Room = {
  width: number
  height: number
  share: number
  tier: string
  column?: true
  zoom?: number
}

const ROOMS = [
  { width: 1920, height: 1080, share: 0.98, tier: 'wide' },
  { width: 1366, height: 768, share: 0.45, tier: 'medium' },
  // The 9:16 tour: 720x1280 through a zoom of 0.75, CLUSTER over a shell. The type grows with
  // the window's height, and measured in CSS pixels its slots once lay over its lanes. With the
  // GPU's lane and ten slots it is short (it was medium with six lanes and eight slots).
  { width: 540, height: 960, share: 0.7, tier: 'short', column: true, zoom: 0.75 },
  { width: 1366, height: 340, share: 0.98, tier: 'short' },
  { width: 1366, height: 768, share: 0.22, tier: 'narrow' },
] satisfies Room[]

test.describe('in every room', () => {
  // One app for every room: each takes its layout through a save and a reload (as switching to
  // it would), its window size and its zoom, rather than a launch of its own.
  let launched: Launched
  test.beforeAll(async () => {
    launched = await launch(undefined, { layout: beside(0.5) })
  })
  test.afterAll(async () => {
    await launched?.close()
  })

  for (const { width, height, share, tier, column, zoom } of ROOMS) {
    const how = column === true ? ' over a pane' : ''
    test(`lays itself out ${tier} at ${width}x${height}${how}, its parts never running into each other`, async () => {
      const { app, page } = launched
      const layout = beside(share, column === true ? 'column' : 'row')
      await page.evaluate((tree) => window.elecdex.layout.save(tree as never), layout)
      await reloadWorkspace(page)
      await sizeTo(app, width, height)
      await app.evaluate(
        ({ BrowserWindow }, z) => BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(z),
        zoom ?? 1,
      )
      await expect(page.getByTestId('cluster')).toHaveAttribute('data-tier', tier)
      // A few readings in, so every lane has something in it.
      await expect(page.getByTestId('cluster-figure-cpu')).toContainText(/\d/)
      await partsApart(page)
    })
  }
})

test('shows the readings, rolls the clock, and opens a figure’s card', async ({ shared }) => {
  const { page, close } = await shared({ layout: beside(0.7) })
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

test('shows the QUAKE lamp only while quake alerts are on', async ({ shared }) => {
  const { page, close } = await shared({
    layout: beside(0.7),
    settings: { quakes: { notify: true } },
  })
  try {
    await expect(page.locator('[data-lamp="quake"]')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a full screen of it stays cheap when idle', { tag: '@perf' }, async () => {
  // Measured 2026-10-10 on Windows 11 at 1920x1080: 10-15% of one core, against 24% for CPU,
  // memory, traffic and disk panes side by side (docs/cluster.md §5). The lanes step once per
  // reading and hold still between, so the loop is let go between readings.
  const { app, page, close } = await launch(undefined, {
    layout: single('cluster', { id: 'p' }),
  })
  try {
    await sizeTo(app, 1920, 1080)
    const { percentOfOneCore: percent, power } = await idleCpu(app, page, {
      warmupMs: 15_000,
      windowMs: 20_000,
    })
    console.log(`cluster idle: ${percent.toFixed(1)}% of one core, ${power}`)
    // As metrics.spec.ts: on CI the number says more about the runner than about elecdex.
    expect(percent).toBeLessThan(process.env.CI ? 300 : 30)
  } finally {
    await close()
  }
})

test('opens a card by its figure in the narrow column, however far it is scrolled', async ({
  shared,
}) => {
  // Found in review: the card was placed in the scrolled column, as far above its figure as the
  // column had been scrolled.
  const { app, page, close } = await shared({ layout: beside(0.22) })
  try {
    await sizeTo(app, 1366, 560)
    const cluster = page.getByTestId('cluster')
    await expect(cluster).toHaveAttribute('data-tier', 'narrow')
    await expect(page.getByTestId('cluster-figure-cpu')).toContainText(/\d/)
    const slot = page.getByTestId('cluster-slot-address')
    await cluster.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    expect(await cluster.evaluate((el) => el.scrollTop)).toBeGreaterThan(120)
    await slot.hover()
    const card = page.getByTestId('cluster-card')
    await expect(card).toBeVisible()
    const [cardBox, slotBox, paneBox] = await Promise.all([
      card.boundingBox(),
      slot.boundingBox(),
      cluster.boundingBox(),
    ])
    if (cardBox === null || slotBox === null || paneBox === null) throw new Error('no box')
    // Next to its figure, above or below it, and inside what the pane shows. Loosely: the rows
    // above may still be filling in and move it a line; scrolled wrong, it was the scroll away.
    const near = Math.min(
      Math.abs(cardBox.y - (slotBox.y + slotBox.height)),
      Math.abs(cardBox.y + cardBox.height - slotBox.y),
    )
    expect(near).toBeLessThan(80)
    expect(cardBox.y).toBeGreaterThanOrEqual(paneBox.y - 1)
    expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(paneBox.y + paneBox.height + 1)
  } finally {
    await close()
  }
})

test('writes every lane’s scale at the type size of the window it is in now', async ({
  shared,
}) => {
  // Found adding the GPU lane: the size was read once a canvas, so after the window changed size
  // the lanes kept the old one, and a lane that came in later (the GPU's) wrote its scale smaller.
  const { app, page, close } = await shared({ layout: beside(0.98) })
  try {
    await sizeTo(app, 1920, 1080)
    await expect(page.getByTestId('cluster-figure-gpu')).toContainText(/\d/)
    await sizeTo(app, 1600, 900)
    const sizes = () =>
      page.evaluate(() => {
        const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        const lanes = [...document.querySelectorAll('[data-testid^=cluster-lane-]')]
        return {
          want: Math.max(8, Math.round(root * 0.625)),
          have: lanes.map((el) => Number(el.getAttribute('data-label-size'))),
        }
      })
    await expect
      .poll(async () => {
        const { want, have } = await sizes()
        return have.length === 7 && have.every((size) => size === want)
      })
      .toBe(true)
  } finally {
    await close()
  }
})

test('draws each lane once a reading, not once for every source', async ({ shared }) => {
  // Found in review: each cpu.load sample reset every lane's bitmap and drew it twice.
  const { page, close } = await shared({ layout: beside(0.7) })
  try {
    await expect(page.getByTestId('cluster-figure-cpu')).toContainText(/\d/)
    // Once the layout has come in: its panes power on growing, which is a resize each frame.
    // wait: nothing marks the end of a launch's power-on (settleLayout is for a switch).
    await page.waitForTimeout(3000)
    const draws = await page.evaluate(async () => {
      const proto = CanvasRenderingContext2D.prototype
      const clear = proto.clearRect
      let count = 0
      proto.clearRect = function (this: CanvasRenderingContext2D, ...args) {
        if (this.canvas.closest('[data-testid=cluster]') !== null) count += 1
        return clear.apply(this, args)
      }
      // wait: the counting window: three cpu.load samples' worth of draws.
      await new Promise((resolve) => setTimeout(resolve, 3000))
      proto.clearRect = clear
      return count
    })
    // Seven lanes, one cpu.load sample a second: about 21 in three seconds, never twice that.
    expect(draws).toBeGreaterThan(0)
    expect(draws).toBeLessThanOrEqual(7 * 4)
  } finally {
    await close()
  }
})
