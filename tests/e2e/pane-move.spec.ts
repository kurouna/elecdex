import { expect, type Locator, type Page, test } from '@playwright/test'
import { type Launched, launch } from './support.js'

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
})

test.afterEach(async () => {
  await launched?.close()
})

type Side = 'left' | 'right' | 'up' | 'down'

const paneOf = (widget: string) => page.locator(`[data-testid=pane][data-widget=${widget}]`)
const titleOf = (widget: string) => paneOf(widget).locator('.module-title')
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

const sessionIds = async () =>
  (await page.evaluate(() => window.elecdex.pty.list())).map((s) => s.id).sort()

/** Everything a session's screen shows, as a reattaching pane receives it. */
function screenOf(sessionId: string): Promise<string> {
  return page.evaluate(async (id) => {
    const decoder = new TextDecoder()
    let text = ''
    const detach = await window.elecdex.pty.attach(id, {
      onData: (chunk) => {
        text += decoder.decode(chunk, { stream: true })
      },
      onExit: () => {},
      onCwd: () => {},
      onCommandEnd: () => {},
      onIntegrationUnavailable: () => {},
    })
    await new Promise((resolve) => setTimeout(resolve, 800))
    detach()
    return text
  }, sessionId)
}

async function waitForShells(count: number) {
  await expect.poll(async () => (await sessionIds()).length, { timeout: 20_000 }).toBe(count)
}

for (const side of ['left', 'right', 'up', 'down'] as const) {
  test(`a pane dropped near the ${side} edge of another previews that half and lands there`, async () => {
    const globe = await boxOf(paneOf('globe'))
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
    const memoryAfter = await boxOf(paneOf('memory'))
    const globeAfter = await boxOf(paneOf('globe'))
    const slack = 24
    if (side === 'left')
      expect(memoryAfter.x + memoryAfter.width).toBeLessThanOrEqual(globeAfter.x + slack)
    if (side === 'right')
      expect(memoryAfter.x).toBeGreaterThanOrEqual(globeAfter.x + globeAfter.width - slack)
    if (side === 'up')
      expect(memoryAfter.y + memoryAfter.height).toBeLessThanOrEqual(globeAfter.y + slack)
    if (side === 'down')
      expect(memoryAfter.y).toBeGreaterThanOrEqual(globeAfter.y + globeAfter.height - slack)
    await expect(paneOf('memory')).toHaveCount(1)
  })
}

test('a moved layout is saved and restored on the next launch', async () => {
  const globe = await boxOf(paneOf('globe'))
  const point = nearSide(globe, 'down')
  await drag(titleOf('cpu'), point.x, point.y)
  const order = () =>
    page.$$eval('[data-testid=pane]', (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return `${e.getAttribute('data-widget')}@${Math.round(r.x / 10)},${Math.round(r.y / 10)}`
      }),
    )
  await expect.poll(async () => (await boxOf(paneOf('cpu'))).y).toBeGreaterThan(globe.y)
  const before = await order()
  // Past the save debounce.
  await page.waitForTimeout(1500)

  launched = await launched.relaunch()
  ;({ page } = launched)
  await expect(paneOf('cpu')).toBeVisible()
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

  const globe = await boxOf(paneOf('globe'))
  await drag(strip.last(), globe.x + globe.width / 2, globe.y + 10)

  await expect(strip).toHaveCount(2)
  const pane = page.locator(`[data-testid=pane][data-pane-id="${moved}"]`)
  await expect(pane).toHaveAttribute('data-chrome', 'shell')
  await expect(pane.getByTestId('terminal-host')).toBeVisible()
  await expect(pane.getByTestId('pane-subtitle')).not.toHaveText('', { timeout: 20_000 })
  // The moved pane took focus, so typing goes to it.
  await expect(pane.locator('.xterm-helper-textarea')).toBeFocused()

  // Same sessions: nothing started, nothing ended.
  await page.waitForTimeout(3000)
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

  const launcher = await boxOf(paneOf('launcher'))
  const point = nearSide(launcher, 'down')
  await drag(shellGroup().locator('> header'), point.x, point.y)

  // The launcher moves up to make room, so compare with where it is now.
  await expect
    .poll(async () => {
      const group = await boxOf(shellGroup())
      const now = await boxOf(paneOf('launcher'))
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
  await page.waitForTimeout(2000)
  expect(await sessionIds()).toEqual(sessions)
})

test('a tab is still selected by a click after tabs have been dragged', async () => {
  const strip = shellGroup().getByTestId('tab')
  await expect(strip).toHaveCount(3)
  const globe = await boxOf(paneOf('globe'))
  await drag(strip.nth(2), globe.x + globe.width / 2, globe.y + 10)
  await expect(strip).toHaveCount(2)

  // The drop swallowed its own click; a real click afterwards still works.
  await strip.first().click()
  await expect(shellGroup().locator('li.active [data-testid=tab]')).toHaveAttribute(
    'data-pane-id',
    (await strip.first().getAttribute('data-pane-id')) ?? '',
  )
  await strip.last().click()
  await expect(shellGroup().locator('li.active [data-testid=tab]')).toHaveAttribute(
    'data-pane-id',
    (await strip.last().getAttribute('data-pane-id')) ?? '',
  )
})

test('holding Ctrl adds the pane to another as a tab, and it can be dragged back out', async () => {
  const globe = await boxOf(paneOf('globe'))
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
  await expect(paneOf('memory')).toHaveAttribute('data-chrome', 'module')
  await expect(paneOf('globe')).toHaveAttribute('data-chrome', 'module')
})

test('Escape cancels a drag, and a drop onto itself or outside every pane changes nothing', async () => {
  const layoutNow = () =>
    page.$$eval('[data-testid=pane]', (els) =>
      els.map((e) => `${e.getAttribute('data-widget')}:${Math.round(e.getBoundingClientRect().x)}`),
    )
  const before = await layoutNow()
  const globe = await boxOf(paneOf('globe'))

  await drag(titleOf('memory'), globe.x + 10, globe.y + globe.height / 2, false)
  await expect(preview()).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('pane-drag')).toHaveCount(0)
  await page.mouse.up()

  const own = await boxOf(paneOf('memory'))
  await drag(titleOf('memory'), own.x + own.width / 2, own.y + own.height / 2, false)
  await expect(page.getByTestId('pane-drag')).toHaveCount(1)
  await expect(preview()).toHaveCount(0)
  await page.mouse.up()

  // The window's title strip holds no pane.
  const size = await page.evaluate(() => ({ w: window.innerWidth }))
  await drag(titleOf('memory'), size.w / 2, 2, false)
  await expect(preview()).toHaveCount(0)
  await page.mouse.up()

  expect(await layoutNow()).toEqual(before)
})

test('an untitled pane is dragged by the strip along its top rule', async () => {
  const weather = await boxOf(paneOf('weather'))
  const point = nearSide(weather, 'left')
  await drag(paneOf('clock').getByTestId('pane-drag-strip'), point.x, point.y)
  await expect
    .poll(async () => {
      const clock = await boxOf(paneOf('clock'))
      return clock.x > weather.x - 20 && clock.y > weather.y - 20
    })
    .toBe(true)
})

test('a moved pane closes from its own close button', async () => {
  const globe = await boxOf(paneOf('globe'))
  const point = nearSide(globe, 'down')
  await drag(titleOf('disk'), point.x, point.y)
  await expect.poll(async () => (await boxOf(paneOf('disk'))).y).toBeGreaterThan(globe.y)
  await paneOf('disk').hover()
  await paneOf('disk').getByTestId('pane-close').click()
  await expect(paneOf('disk')).toHaveCount(0)
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
      await expect(strip).toHaveCount(3)
    }
    // The globe, alternately below the weather and the markets panes.
    const anchor = i % 2 === 0 ? 'weather' : 'markets'
    const below = await boxOf(paneOf(anchor))
    const point = nearSide(below, 'down')
    await drag(titleOf('globe'), point.x, point.y)
    // The panes above close up, so compare with where the anchor is now.
    await expect
      .poll(async () => (await boxOf(paneOf('globe'))).y > (await boxOf(paneOf(anchor))).y)
      .toBe(true)
    // A shell tab out beside another pane, and back in with Ctrl.
    const target = await boxOf(paneOf(widget))
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

  await page.waitForTimeout(1500)
  const lost = await page.evaluate(
    () =>
      [...document.querySelectorAll('canvas')]
        .map((canvas) => canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
        .filter((gl) => gl !== null)
        .filter((gl) => gl.isContextLost()).length,
  )
  expect(lost).toBe(0)
  await expect(paneOf('globe').getByText(/context was lost/)).toHaveCount(0)
  expect(warnings).toEqual([])
})
