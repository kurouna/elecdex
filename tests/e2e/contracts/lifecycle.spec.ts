import { expect, type Page, test } from '@playwright/test'
import { mutationsIn } from '../support/measure.js'
import {
  bringWindowBack,
  putWindowAway,
  reloadWorkspace,
  sessionIds,
  WATCHING_MODULES,
} from '../support.js'
import { PANES, type PaneRow, row } from './panes.js'
import {
  type ContractApp,
  contractPane,
  footprint,
  idle,
  launchContracts,
  missing,
  paneId,
  tabOf,
} from './world.js'

/**
 * The lifecycle contract (docs/e2e-design.md, section 3.2): every built-in pane that has main do
 * something for it while seen stops that when it is not seen - behind another tab, in a
 * minimised window, closed, or after a reload - and takes it up again at once when it is seen
 * again; a pane that is the page's alone changes nothing unseen; what is meant to go on unseen
 * does. One app holds every pane as the tabs of one group, the clock in front; each pane is
 * brought forward in turn. A failure names every pane that broke the contract at once.
 */

/** The rows whose footprint the contract can see. */
const FOOTPRINTED = PANES.filter((r) => r.seen !== undefined)

/**
 * The readings collected once per collector (scheduler.ts), which a pane behind a tab keeps so
 * its row never blanks: their first arrival is the start, not a change.
 */
const ONCE = ['cpu.info', 'hardware.system', 'os.info']

/** Every pane but the clock in front and those meant to go on unseen, for {@link mutationsIn}. */
const quietSelectors = () =>
  PANES.filter((r) => r.widget !== 'clock' && r.goesOn === undefined).map(
    (r) => `[data-testid=pane][data-pane-id="${paneId(r.widget)}"]`,
  )

/** How long a pane brought back may take to be at work again: "at once", with room for a busy machine. */
const RESUME_MS = 8_000

/** How long a pane first shown may take to be at work (a first fetch, a first sample). */
const START_MS = 20_000

let ctx: ContractApp
let page: Page

test.beforeEach(async () => {
  ctx = await launchContracts()
  page = ctx.page
  await expect(page.getByTestId('pane')).toHaveCount(PANES.length)
})

test.afterEach(async () => {
  await ctx?.dispose()
})

/** Brings `row`'s pane forward, puts it to work the first time, and waits until it is. */
async function atWork(row: PaneRow, first: boolean, timeout: number): Promise<void> {
  await tabOf(page, row.widget).click()
  await expect(contractPane(page, row.widget)).toBeVisible()
  if (first && row.work) await row.work(ctx.app, page, ctx.world)
  await expect
    .poll(async () => missing(row, await footprint(ctx.app, page)), {
      timeout,
      message: `${row.widget} at work`,
    })
    .toEqual([])
}

/** Waits until main does only what the panes keep unseen. */
async function backToIdle(rows: PaneRow[] = PANES, what = 'idle'): Promise<void> {
  await expect
    .poll(() => footprint(ctx.app, page), { timeout: 10_000, message: what })
    .toEqual(idle(rows))
}

/** Runs `check` for each row, and fails once at the end naming every row that failed. */
async function eachRow(rows: PaneRow[], check: (row: PaneRow) => Promise<void>): Promise<void> {
  const failed: Record<string, string> = {}
  for (const row of rows) {
    try {
      await check(row)
    } catch (error) {
      // The first line, and what a locator last resolved to - the element and its class -
      // from the call log, which says why it was not as expected.
      const lines = String((error as Error).message)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
      const resolved = lines.filter((line) => /resolved to|unexpected value/.test(line))
      failed[row.widget] = [lines[0] ?? '', ...resolved.slice(-2)].join(' | ')
    }
  }
  expect(failed).toEqual({})
}

test('behind another tab, every pane stops what main does for it, and takes it up at once when shown again', async () => {
  test.setTimeout(300_000)
  await backToIdle()
  // Never shown, no pane that is the page's alone changes anything once the start is over: the
  // one-off readings are waited for, as on a busy machine they once landed in the window watched.
  await expect
    .poll(
      async () => {
        const { collections } = await page.evaluate(() => window.elecdex.metrics.stats())
        return ONCE.filter((id) => !((collections as Record<string, number>)[id] ?? 0))
      },
      { timeout: 60_000 },
    )
    .toEqual([])
  // The rest of the start (a shell's first prompt, the launcher's catalog, the CHIP-8 library)
  // has no signal and lands late on a busy runner: the panes must come to rest and stay there -
  // a pane that keeps changing unseen never gives a quiet window.
  await expect
    .poll(() => mutationsIn(page, quietSelectors(), 4000), {
      timeout: 40_000,
      message: 'never shown',
    })
    .toEqual({})

  await eachRow(FOOTPRINTED, async (row) => {
    await atWork(row, true, START_MS)
    await tabOf(page, 'clock').click()
    await backToIdle(PANES, `${row.widget} behind the clock`)
    await atWork(row, false, RESUME_MS)
    await tabOf(page, 'clock').click()
    await backToIdle(PANES, `${row.widget} behind the clock again`)
  })

  // Every pane has been seen; behind the clock, none that is the page's alone changes anything.
  expect(await mutationsIn(page, quietSelectors(), 4000), 'after being seen').toEqual({})

  // A reload leaves nothing behind: what main does is again only what the panes keep.
  await reloadWorkspace(page)
  await backToIdle(PANES, 'after a reload')
})

test('in a minimised window, every pane stops what main does for it, and takes it up at once when restored', async () => {
  test.setTimeout(300_000)
  // Once, outside the rows: where nothing can minimise the window (a bare Xvfb) the test skips
  // here, rather than every row catching the skip as a failure.
  await putWindowAway(ctx.app, page)
  await bringWindowBack(ctx.app, page)
  await eachRow(FOOTPRINTED, async (row) => {
    await atWork(row, true, START_MS)
    await putWindowAway(ctx.app, page)
    try {
      await backToIdle(PANES, `${row.widget} minimised`)
    } finally {
      // Back whatever happened, or every pane after this one would be checked minimised.
      await bringWindowBack(ctx.app, page)
    }
    await expect
      .poll(async () => missing(row, await footprint(ctx.app, page)), {
        timeout: RESUME_MS,
        message: `${row.widget} restored`,
      })
      .toEqual([])
  })
})

test('closed, every pane leaves main doing nothing for it', async () => {
  test.setTimeout(300_000)
  let left = [...PANES]
  await eachRow(FOOTPRINTED, async (row) => {
    await atWork(row, true, START_MS)
    await page.locator(`[data-testid=tab-close][data-pane-id="${paneId(row.widget)}"]`).click()
    await expect(contractPane(page, row.widget)).toHaveCount(0)
    left = left.filter((r) => r !== row)
    await tabOf(page, 'clock').click()
    await backToIdle(left, `${row.widget} closed`)
  })
})

test('what is meant to go on unseen goes on: a shell behind a tab keeps its session', async () => {
  await tabOf(page, 'terminal').click()
  await expect.poll(() => sessionIds(page)).toHaveLength(1)
  const [session] = await sessionIds(page)
  await tabOf(page, 'clock').click()
  await expect(contractPane(page, 'terminal')).toBeHidden()
  await putWindowAway(ctx.app, page)
  expect(await sessionIds(page)).toEqual([session])
  await bringWindowBack(ctx.app, page)
  await tabOf(page, 'terminal').click()
  expect(await sessionIds(page)).toEqual([session])
})

test('a page that crashes leaves nothing behind: main drops what it was doing for it', async () => {
  // A page lets go of its subscriptions as it unloads, so a reload alone never tests main's own
  // drop (whenPageGoes): a crash gives the page no chance to. Seen at work first, then the page
  // crashes and comes back on a layout of one clock.
  for (const widget of ['cpu', 'weather', 'clipboard', 'docker'])
    await atWork(row(widget), true, START_MS)
  await tabOf(page, 'clock').click()
  // Back as one clock: a page that subscribes again would have main tidy the old subscriptions on
  // that path, and only a page that asks for nothing leaves main's own drop as the one at work.
  await page.evaluate(() =>
    window.elecdex.layout.save({
      version: 1,
      root: { kind: 'pane', id: 'p-clock', widget: 'clock' },
    } as never),
  )
  const inPage = (code: string) =>
    ctx.app.evaluate(
      ({ BrowserWindow }, js) =>
        BrowserWindow.getAllWindows()
          .find((w) => w.isVisible())
          ?.webContents.executeJavaScript(js),
      code,
    )
  const onWindow = (what: 'crash' | 'crashed' | 'reload') =>
    ctx.app.evaluate(({ BrowserWindow }, act) => {
      const contents = BrowserWindow.getAllWindows().find((w) => w.isVisible())?.webContents
      if (act === 'crash') contents?.forcefullyCrashRenderer()
      if (act === 'reload') contents?.reload()
      return contents?.isCrashed() ?? false
    }, what)

  await onWindow('crash')
  await expect.poll(() => onWindow('crashed')).toBe(true)
  await onWindow('reload')
  // Playwright's page went with the crash: the new page is asked through main.
  await expect
    .poll(
      () =>
        inPage("document.querySelector('[data-testid=workspace]')?.dataset.loaded ?? ''").catch(
          () => '',
        ),
      { timeout: 20_000 },
    )
    .toBe('true')
  const watched = `Promise.all([window.elecdex.metrics.stats().then((s) => s.active),
    ...${JSON.stringify(WATCHING_MODULES)}.map((m) => window.elecdex[m].watching())])`
  await expect
    .poll(async () => {
      const [metrics, ...modules] = (await inPage(watched)) as string[][]
      return { metrics: [...(metrics ?? [])].sort(), modules: modules.flat() }
    })
    .toEqual({ metrics: [], modules: [] })
})
