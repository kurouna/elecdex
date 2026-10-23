import { expect, type Locator, type Page, test } from '@playwright/test'
import { readScreen } from '../support/terminal.js'
import {
  type Launched,
  launch,
  sessionIds as listedSessions,
  quietFor,
  settleLayout,
  waitForSaved,
} from '../support.js'

/**
 * Moving panes by dragging their titles, end to end, on the default layout.
 *
 * The tree logic is covered exhaustively by unit tests (layout-ops) and the
 * gesture by component tests (pane-drag); these check what only the real app
 * can: hit testing and geometry, remounting live widgets - shells with sessions,
 * WebGL canvases - and that a moved layout persists.
 */

let launched: Launched
let page: Page

test.beforeEach(async () => {
  launched = await launch()
  ;({ page } = launched)
  // The panes power on scaled from a line: a title pressed before that ends moves under the
  // pointer, and the drag never starts (seen once in a whole run, on the first drag).
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (a) =>
              (a as CSSAnimation).animationName === 'crt-power-on' && a.playState === 'running',
          ),
      ),
    )
    .toBe(false)
})

test.afterEach(async () => {
  await launched?.close()
})

type Side = 'left' | 'right' | 'up' | 'down'

/** A pane of `widget`, shown or not (support's `paneOf` takes only the shown ones). */
const paneWith = (widget: string) => page.locator(`[data-testid=pane][data-widget=${widget}]`)
const titleOf = (widget: string) => paneWith(widget).locator('.module-title')
const shellGroup = () => page.getByTestId('tabs-host')
const preview = () => page.getByTestId('pane-drop-preview')

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('not visible')
  return box
}

/** Presses on `handle` and moves, in steps as a hand would, to (x, y); releases unless told not to. */
async function drag(handle: Locator, x: number, y: number, release = true) {
  const box = await boxOf(handle)
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  // Nothing may cover the handle where it is pressed.
  const hit = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y)
    return `${el?.tagName}.${el?.className} in ${el?.closest('[data-testid=pane], [data-testid=tabs-host]')?.getAttribute('data-widget') ?? '?'}`
  }, start)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(x, y, { steps: 12 })
  await expect(page.getByTestId('pane-drag'), `the drag started (pressed on ${hit})`).toHaveCount(1)
  if (release) await page.mouse.up()
}

/** A point just inside `side` of a box, halfway along it. */
function nearSide(box: { x: number; y: number; width: number; height: number }, side: Side) {
  const inset = 12
  switch (side) {
    case 'left':
      return { x: box.x + inset, y: box.y + box.height / 2 }
    case 'right':
      return { x: box.x + box.width - inset, y: box.y + box.height / 2 }
    case 'up':
      return { x: box.x + box.width / 2, y: box.y + inset }
    case 'down':
      return { x: box.x + box.width / 2, y: box.y + box.height - inset }
  }
}

/** The half of `box` a pane dropped on `side` takes. */
function halfOn(box: { x: number; y: number; width: number; height: number }, side: Side) {
  const { x, y, width, height } = box
  if (side === 'left') return { x, y, width: width / 2, height }
  if (side === 'right') return { x: x + width / 2, y, width: width / 2, height }
  if (side === 'up') return { x, y, width, height: height / 2 }
  return { x, y: y + height / 2, width, height: height / 2 }
}

const sessionIds = async () => (await listedSessions(page)).sort()

/** Everything a session's screen shows, as a reattaching pane receives it. */
const screenOf = (sessionId: string): Promise<string> => readScreen(page, sessionId, 800)

/** A node of a saved layout tree, as much of it as these tests read. */
interface SavedNode {
  kind: string
  id?: string
  widget?: string
  direction?: string
  children?: SavedNode[]
}

/** Whether, somewhere in `node`, a column holds a pane of `upper` with one of `lower` right under it. */
function stacked(node: SavedNode, upper: string, lower: string): boolean {
  const children = node.children ?? []
  if (node.kind === 'split' && node.direction === 'column') {
    for (let i = 0; i + 1 < children.length; i++) {
      if (children[i]?.widget === upper && children[i + 1]?.widget === lower) return true
    }
  }
  return children.some((child) => stacked(child, upper, lower))
}

/** Whether a saved layout holds a tab group whose tabs are `ids`, in that order. */
function tabsInOrder(node: SavedNode, ids: (string | null | undefined)[]): boolean {
  const children = node.children ?? []
  if (node.kind === 'tabs' && children.map((child) => child.id).join() === ids.join()) return true
  return children.some((child) => tabsInOrder(child, ids))
}

async function waitForShells(count: number) {
  await expect.poll(async () => (await sessionIds()).length, { timeout: 20_000 }).toBe(count)
}

for (const side of ['left', 'right', 'up', 'down'] as const) {
  test(`a pane dropped near the ${side} edge of another previews that half and lands there`, async () => {
    const globe = await boxOf(paneWith('globe'))
    const point = nearSide(globe, side)
    await drag(titleOf('memory'), point.x, point.y, false)

    await expect(preview()).toHaveAttribute('data-placement', side)
    const expected = halfOn(globe, side)
    await expect
      .poll(async () => {
        const box = await boxOf(preview())
        return [
          box.x - expected.x,
          box.y - expected.y,
          box.width - expected.width,
          box.height - expected.height,
        ]
          .map((d) => Math.round(Math.abs(d)))
          .every((d) => d <= 2)
      })
      .toBe(true)
    await page.mouse.up()
    await expect(page.getByTestId('pane-drag')).toHaveCount(0)

    // The moved pane now sits on that side of the globe, sharing its row or column.
    const memoryAfter = await boxOf(paneWith('memory'))
    const globeAfter = await boxOf(paneWith('globe'))
    const slack = 24
    if (side === 'left')
      expect(memoryAfter.x + memoryAfter.width).toBeLessThanOrEqual(globeAfter.x + slack)
    if (side === 'right')
      expect(memoryAfter.x).toBeGreaterThanOrEqual(globeAfter.x + globeAfter.width - slack)
    if (side === 'up')
      expect(memoryAfter.y + memoryAfter.height).toBeLessThanOrEqual(globeAfter.y + slack)
    if (side === 'down')
      expect(memoryAfter.y).toBeGreaterThanOrEqual(globeAfter.y + globeAfter.height - slack)
    await expect(paneWith('memory')).toHaveCount(1)
  })
}

test('a moved layout is saved and restored on the next launch', async () => {
  const globe = await boxOf(paneWith('globe'))
  const point = nearSide(globe, 'down')
  await drag(titleOf('cpu'), point.x, point.y)
  const order = () =>
    page.$$eval('[data-testid=pane]', (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return `${e.getAttribute('data-widget')}@${Math.round(r.x / 10)},${Math.round(r.y / 10)}`
      }),
    )
  await expect.poll(async () => (await boxOf(paneWith('cpu'))).y).toBeGreaterThan(globe.y)
  const before = await order()
  // The save, past its debounce: the CPU pane right under the globe.
  await waitForSaved(launched.userData, (json) =>
    stacked((JSON.parse(json) as { root: SavedNode }).root, 'globe', 'cpu'),
  )

  launched = await launched.relaunch()
  ;({ page } = launched)
  await expect(paneWith('cpu')).toBeVisible()
  await expect.poll(order).toEqual(before)
})

test('a shell tab dragged out keeps its session, its screen and its input', async () => {
  const strip = shellGroup().getByTestId('tab')
  await expect(strip).toHaveCount(3)
  await waitForShells(3)
  const sessions = await sessionIds()

  // Mark the last tab's screen before moving it.
  await strip.last().click()
  const moved = await strip.last().getAttribute('data-pane-id')
  const marker = `MOVE-MARKER-${Date.now()}`
  await page.locator(`[data-pane-id="${moved}"] .xterm-helper-textarea`).focus()
  await page.keyboard.type(`echo ${marker}`)
  await page.keyboard.press('Enter')

  const globe = await boxOf(paneWith('globe'))
  await drag(strip.last(), globe.x + globe.width / 2, globe.y + 10)

  await expect(strip).toHaveCount(2)
  const pane = page.locator(`[data-testid=pane][data-pane-id="${moved}"]`)
  await expect(pane).toHaveAttribute('data-chrome', 'shell')
  await expect(pane.getByTestId('terminal-host')).toBeVisible()
  await expect(pane.getByTestId('pane-subtitle')).not.toHaveText('', { timeout: 20_000 })
  // The moved pane took focus, so typing goes to it.
  await expect(pane.locator('.xterm-helper-textarea')).toBeFocused()

  // Same sessions: nothing started, nothing ended.
  await quietFor(3000, sessionIds, 'the sessions')
  expect(await sessionIds()).toEqual(sessions)

  // Its screen came along, and it still takes input.
  const second = `AFTER-MOVE-${Date.now()}`
  await page.keyboard.type(`echo ${second}`)
  await page.keyboard.press('Enter')
  await expect
    .poll(
      async () => {
        const screens = await Promise.all(sessions.map((id) => screenOf(id)))
        // Both lines on one screen: the moved pane is still that same shell.
        return screens.some((screen) => screen.includes(marker) && screen.includes(second))
      },
      { timeout: 20_000 },
    )
    .toBe(true)
})

test('the shell group moves as a whole by its header, keeping every tab and the shown one', async () => {
  const strip = shellGroup().getByTestId('tab')
  await expect(strip).toHaveCount(3)
  await waitForShells(3)
  const sessions = await sessionIds()
  await strip.nth(1).click()
  const shown = await strip.nth(1).getAttribute('data-pane-id')
  const tabIds = await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))

  const launcher = await boxOf(paneWith('launcher'))
  const point = nearSide(launcher, 'down')
  await drag(shellGroup().locator('> header'), point.x, point.y)

  // The launcher moves up to make room, so compare with where it is now.
  await expect
    .poll(async () => {
      const group = await boxOf(shellGroup())
      const now = await boxOf(paneWith('launcher'))
      return group.y >= now.y + now.height - 24
    })
    .toBe(true)
  await expect(strip).toHaveCount(3)
  expect(await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))).toEqual(
    tabIds,
  )
  await expect(shellGroup().locator('li.active [data-testid=tab]')).toHaveAttribute(
    'data-pane-id',
    shown ?? '',
  )
  await quietFor(2000, sessionIds, 'the sessions')
  expect(await sessionIds()).toEqual(sessions)
})

test('holding Ctrl adds the pane to another as a tab, and it can be dragged back out', async () => {
  const globe = await boxOf(paneWith('globe'))
  await drag(titleOf('memory'), globe.x + globe.width / 2, globe.y + globe.height / 2, false)
  await expect(preview()).not.toHaveAttribute('data-placement', 'tab')
  // Ctrl pressed and released without moving switches the preview both ways.
  await page.keyboard.down('Control')
  await expect(preview()).toHaveAttribute('data-placement', 'tab')
  await page.keyboard.up('Control')
  await expect(preview()).not.toHaveAttribute('data-placement', 'tab')
  await page.keyboard.down('Control')
  await expect(preview()).toHaveAttribute('data-placement', 'tab')
  await page.mouse.up()
  await page.keyboard.up('Control')

  const group = page.getByTestId('tabs-host').filter({ has: page.locator('[data-widget=globe]') })
  await expect(group.getByTestId('tab')).toHaveCount(2)
  await expect(group.locator('[data-testid=pane][data-widget=memory]')).toBeVisible()

  // And out again, beside the group.
  const memoryTab = group.getByTestId('tab').last()
  const groupBox = await boxOf(group)
  const point = nearSide(groupBox, 'down')
  await drag(memoryTab, point.x, point.y)
  await expect(
    page.getByTestId('tabs-host').filter({ has: page.locator('[data-widget=globe]') }),
  ).toHaveCount(0)
  await expect(paneWith('memory')).toHaveAttribute('data-chrome', 'module')
  await expect(paneWith('globe')).toHaveAttribute('data-chrome', 'module')
})

test('an untitled pane is dragged by the strip along its top rule', async () => {
  const weather = await boxOf(paneWith('weather'))
  const point = nearSide(weather, 'left')
  await drag(paneWith('clock').getByTestId('pane-drag-strip'), point.x, point.y)
  await expect
    .poll(async () => {
      const clock = await boxOf(paneWith('clock'))
      return clock.x > weather.x - 20 && clock.y > weather.y - 20
    })
    .toBe(true)
})

test('a moved pane closes from its own close button', async () => {
  const globe = await boxOf(paneWith('globe'))
  const point = nearSide(globe, 'down')
  await drag(titleOf('disk'), point.x, point.y)
  await expect.poll(async () => (await boxOf(paneWith('disk'))).y).toBeGreaterThan(globe.y)
  await paneWith('disk').hover()
  await paneWith('disk').getByTestId('pane-close').click()
  await expect(paneWith('disk')).toHaveCount(0)
})

test('panes with WebGL canvases survive being moved again and again', async () => {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (/webgl|context/i.test(message.text())) warnings.push(message.text())
  })
  const strip = shellGroup().getByTestId('tab')
  const targets = ['launcher', 'filesystem', 'markets', 'calendar', 'cpu', 'disk']
  for (const [i, widget] of targets.entries()) {
    // Start each round from the default layout: every WebGL pane remounts, and a
    // pane moved out and back leaves its neighbour smaller, which repeated rounds
    // would otherwise compound until titles sit under dividers.
    if (i > 0) {
      await page.keyboard.press('Control+Shift+Backspace')
      // The shells open end with the reset, so it asks first.
      await page.getByTestId('switch-layout-go').click()
      await expect(strip).toHaveCount(3)
      // The default layout arrives powering on, pane by pane: pressing on a
      // title before that ends presses where the pane is going to be.
      await settleLayout(page)
    }
    // The globe, alternately below the weather and the markets panes.
    const anchor = i % 2 === 0 ? 'weather' : 'markets'
    const below = await boxOf(paneWith(anchor))
    const point = nearSide(below, 'down')
    await drag(titleOf('globe'), point.x, point.y)
    // The panes above close up, so compare with where the anchor is now.
    await expect
      .poll(async () => (await boxOf(paneWith('globe'))).y > (await boxOf(paneWith(anchor))).y)
      .toBe(true)
    // A shell tab out beside another pane, and back in with Ctrl.
    const target = await boxOf(paneWith(widget))
    const beside = nearSide(target, 'down')
    await drag(strip.last(), beside.x, beside.y)
    await expect(strip).toHaveCount(2)
    const lone = page.locator(
      '[data-testid=pane][data-widget=terminal][data-chrome=shell] > header',
    )
    const group = await boxOf(shellGroup())
    await page.keyboard.down('Control')
    await drag(lone, group.x + group.width / 2, group.y + group.height / 2)
    await page.keyboard.up('Control')
    await expect(strip).toHaveCount(3)
  }

  // wait: a context the moves cost is reported lost a moment later; read once, as reading
  // makes a context on any bare canvas.
  await page.waitForTimeout(1500)
  const lost = await page.evaluate(
    () =>
      [...document.querySelectorAll('canvas')]
        .map((canvas) => canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
        .filter((gl) => gl !== null)
        .filter((gl) => gl.isContextLost()).length,
  )
  expect(lost).toBe(0)
  await expect(paneWith('globe').getByText(/context was lost/)).toHaveCount(0)
  expect(warnings).toEqual([])
})

test('Ctrl over its own group reorders a tab along the strip, without remounting it', async () => {
  const strip = shellGroup().getByTestId('tab')
  const tabs = shellGroup().locator('[data-drop-tab]')
  await expect(strip).toHaveCount(3)
  const ids = await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))
  const sessions = await sessionIds()

  // Past the midpoint of the last tab: the gap after it.
  const last = await boxOf(tabs.nth(2))
  await page.keyboard.down('Control')
  await drag(strip.first(), last.x + last.width - 2, last.y + last.height / 2, false)
  // A tab changing places in its own group joins nothing, so no area is outlined.
  await expect(page.getByTestId('tab-drop-caret')).toHaveAttribute('data-index', '3')
  await expect(preview()).toHaveCount(0)
  await page.mouse.up()
  await page.keyboard.up('Control')

  await expect(strip).toHaveCount(3)
  expect(await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))).toEqual([
    ids[1],
    ids[2],
    ids[0],
  ])
  // The tab that moved is the one showing, and it is still the same shell: the
  // pane was not remounted, so nothing was torn down and started again.
  await expect(shellGroup().locator('li.active [data-testid=tab]')).toHaveAttribute(
    'data-pane-id',
    ids[0] ?? '',
  )
  await quietFor(2000, sessionIds, 'the sessions')
  expect(await sessionIds()).toEqual(sessions)
})

test('Ctrl over another group puts the pane at the place in the strip the pointer picks', async () => {
  const strip = shellGroup().getByTestId('tab')
  await expect(strip).toHaveCount(3)
  const globeId = await paneWith('globe').getAttribute('data-pane-id')

  // The left end of the strip: before every tab there is.
  const bar = await boxOf(shellGroup().getByTestId('tab-strip'))
  await page.keyboard.down('Control')
  await drag(titleOf('globe'), bar.x + 3, bar.y + bar.height / 2, false)
  await expect(page.getByTestId('tab-drop-caret')).toHaveAttribute('data-index', '0')
  // It is joining this group, so the group it would join is outlined too.
  await expect(preview()).toHaveAttribute('data-placement', 'tab')
  await page.mouse.up()
  await page.keyboard.up('Control')

  await expect(strip).toHaveCount(4)
  await expect(strip.first()).toHaveAttribute('data-pane-id', globeId ?? '')
  await expect(paneWith('globe')).toHaveAttribute('data-chrome', 'bare')
})

test('a reordered strip survives a restart', async () => {
  const strip = shellGroup().getByTestId('tab')
  const tabs = shellGroup().locator('[data-drop-tab]')
  await expect(strip).toHaveCount(3)
  const ids = await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))

  const last = await boxOf(tabs.nth(2))
  await page.keyboard.down('Control')
  await drag(strip.first(), last.x + last.width - 2, last.y + last.height / 2)
  await page.keyboard.up('Control')
  const after = [ids[1], ids[2], ids[0]]
  expect(await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))).toEqual(
    after,
  )
  // The save, past its debounce: the strip in its new order.
  await waitForSaved(launched.userData, (json) =>
    tabsInOrder((JSON.parse(json) as { root: SavedNode }).root, after),
  )

  launched = await launched.relaunch()
  ;({ page } = launched)
  const again = shellGroup().getByTestId('tab')
  await expect(again).toHaveCount(3)
  expect(await again.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))).toEqual(
    after,
  )
})

test('a tab reorders into the middle of the strip, and stays clickable after', async () => {
  const strip = shellGroup().getByTestId('tab')
  const tabs = shellGroup().locator('[data-drop-tab]')
  await expect(strip).toHaveCount(3)
  const ids = await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))

  // Between the second and third tabs: just past the second one's midpoint.
  const second = await boxOf(tabs.nth(1))
  await page.keyboard.down('Control')
  await drag(strip.first(), second.x + second.width - 2, second.y + second.height / 2, false)
  await expect(page.getByTestId('tab-drop-caret')).toHaveAttribute('data-index', '2')
  await page.mouse.up()
  await page.keyboard.up('Control')

  expect(await strip.evaluateAll((els) => els.map((e) => e.getAttribute('data-pane-id')))).toEqual([
    ids[1],
    ids[0],
    ids[2],
  ])
  // The drop swallowed its own click; a real click afterwards still selects.
  await strip.first().click()
  await expect(shellGroup().locator('li.active [data-testid=tab]')).toHaveAttribute(
    'data-pane-id',
    ids[1] ?? '',
  )
})

test('the caret for the first gap stays inside the strip, not out on the frame', async () => {
  const strip = shellGroup().getByTestId('tab')
  const bar = await boxOf(shellGroup().getByTestId('tab-strip'))
  await expect(strip).toHaveCount(3)

  // The first tab's slanted edge is pushed outside the frame on purpose, so its
  // own box starts left of the strip that clips it; the caret must not follow.
  const firstTab = await boxOf(shellGroup().locator('[data-drop-tab]').first())
  expect(firstTab.x).toBeLessThan(bar.x)

  await page.keyboard.down('Control')
  await drag(strip.last(), bar.x + 3, bar.y + bar.height / 2, false)
  const caret = page.getByTestId('tab-drop-caret')
  await expect(caret).toHaveAttribute('data-index', '0')
  // The placed left edge, not the rendered box: the caret is skewed with the
  // tabs and slides between gaps, so its box is neither square nor settled.
  const left = () => caret.evaluate((el) => Number.parseFloat((el as HTMLElement).style.left))
  // An inline style is serialised to three decimals, so allow a sub-pixel; the
  // overhang this guards against is the best part of a rem.
  await expect.poll(left).toBeGreaterThanOrEqual(bar.x - 0.5)
  expect(await left()).toBeLessThanOrEqual(bar.x + bar.width)
  expect(firstTab.x).toBeLessThan(bar.x - 4)
  await page.mouse.up()
  await page.keyboard.up('Control')
})
