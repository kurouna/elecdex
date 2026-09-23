import { expect, test } from '@playwright/test'
import { launch, selectedRow, showStatusBar, terminalPane } from './support.js'

/**
 * Closing any pane and bringing it back. eDEX-UI's modules were fixed; here a
 * closed widget must never be gone for good.
 */

const pane = (page: import('@playwright/test').Page, widget: string) =>
  page.locator(`[data-testid=pane][data-widget=${widget}]`)

test('a closed pane can be brought back from the picker', async () => {
  const { page, close } = await launch()
  try {
    // Close the clock with its own button.
    await pane(page, 'clock').hover()
    await pane(page, 'clock').getByTestId('pane-close').click()
    await expect(pane(page, 'clock')).toHaveCount(0)

    // Bring it back from the keyboard, with a terminal focused - the shortcut and
    // the typing in the picker must not reach the shell.
    await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyA')
    const picker = page.getByTestId('pane-picker')
    await expect(picker).toBeVisible()
    await page.keyboard.type('clock')
    // The clock comes first; other panes that keep time (orbit's world clocks) may follow it.
    await expect(picker.getByTestId('pane-picker-item').first()).toContainText('clock')
    await page.keyboard.press('Enter')

    await expect(picker).toHaveCount(0)
    await expect(pane(page, 'clock')).toHaveCount(1)
    await expect(pane(page, 'clock')).toHaveClass(/focused/)
  } finally {
    await close()
  }
})

test('placement puts the new pane right, below or in a tab', async () => {
  const { page, close } = await launch()
  try {
    const cpu = pane(page, 'cpu')
    await cpu.dispatchEvent('pointerdown') // focus it

    await showStatusBar(page)
    await page.getByTestId('add-pane').click()
    const picker = page.getByTestId('pane-picker')
    await picker.locator('[data-testid=pane-picker-placement][data-placement=tab]').click()
    await picker.locator('[data-testid=pane-picker-item][data-widget=terminal]').click()

    // CPU and the new terminal now share a tab group.
    const group = page.getByTestId('tabs-host').filter({ has: page.locator('[data-widget=cpu]') })
    await expect(group.getByTestId('tab')).toHaveCount(2)

    // The last placement is remembered, and Tab cycles it from the keyboard.
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(picker.locator('[aria-checked=true]')).toHaveAttribute('data-placement', 'tab')
    await page.keyboard.press('Tab')
    await expect(picker.locator('[aria-checked=true]')).toHaveAttribute('data-placement', 'right')
    await page.keyboard.press('Escape')
    await expect(picker).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a single-instance widget already on screen is focused, not duplicated', async () => {
  const { page, close } = await launch()
  try {
    await page.keyboard.press('Control+Shift+KeyA')
    const item = page.locator('[data-testid=pane-picker-item][data-widget=memory]')
    await expect(item).toContainText(/on screen/i)
    await item.click()
    await expect(pane(page, 'memory')).toHaveCount(1)
    await expect(pane(page, 'memory')).toHaveClass(/focused/)
  } finally {
    await close()
  }
})

test('every pane has a way to close it', async () => {
  const { page, close } = await launch()
  try {
    // Every pane of its own has the × in its corner; a tab group has one that
    // closes the whole group, and each of its tabs closes from its tab as well.
    const own = page.locator('[data-testid=pane]:not([data-chrome=bare])')
    const count = await own.count()
    expect(count).toBeGreaterThan(5)
    await expect(own.getByTestId('pane-close')).toHaveCount(count)
    const groups = page.getByTestId('tabs-host')
    await expect(groups.getByTestId('group-close')).toHaveCount(await groups.count())
    const tabbed = page.locator('[data-testid=pane][data-chrome=bare]')
    await expect(groups.getByTestId('tab-close')).toHaveCount(await tabbed.count())
    await expect(tabbed.getByTestId('pane-close')).toHaveCount(0)

    // The group's × says what it takes, and every tab dims while it is aimed.
    const group = groups.first()
    const tabsOf = group.getByTestId('tab')
    await expect(group.getByTestId('group-close')).toHaveAttribute(
      'aria-label',
      `close all ${await tabsOf.count()} tabs`,
    )
    await group.hover()
    await group.getByTestId('group-close').hover()
    await expect(group.locator('.tab.doomed')).toHaveCount(await tabsOf.count())
    await group.getByTestId('tab-new').hover()
    await expect(group.locator('.tab.doomed')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('the layout can be reset from the status bar and from the picker, with confirmation', async () => {
  const { page, close } = await launch()
  try {
    const panes = page.locator('[data-testid=pane]')
    const initial = await panes.count()
    await pane(page, 'clock').hover()
    await pane(page, 'clock').getByTestId('pane-close').click()
    await expect(panes).toHaveCount(initial - 1)

    // Status bar: one click only arms it.
    await showStatusBar(page)
    const reset = page.getByTestId('reset-layout')
    await reset.click()
    await expect(reset).toHaveText(/click again/i)
    await expect(panes).toHaveCount(initial - 1)
    await reset.click()
    await expect(panes).toHaveCount(initial)
    await expect(pane(page, 'clock')).toHaveCount(1)

    // The picker offers the same.
    await pane(page, 'memory').hover()
    await pane(page, 'memory').getByTestId('pane-close').click()
    await expect(pane(page, 'memory')).toHaveCount(0)
    await showStatusBar(page)
    await page.getByTestId('add-pane').click()
    const pickerReset = page.getByTestId('pane-picker-reset')
    await pickerReset.click()
    await expect(page.getByTestId('pane-picker')).toBeVisible()
    await pickerReset.click()
    await expect(page.getByTestId('pane-picker')).toHaveCount(0)
    await expect(pane(page, 'memory')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('closing a pane gives its WebGL contexts back at once', async () => {
  const { page, close } = await launch()
  try {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (/webgl/i.test(message.text())) warnings.push(message.text())
    })
    const shellTabs = page.getByTestId('tabs-host').getByTestId('tab')
    await expect(shellTabs).toHaveCount(3)
    // Wait until the globe and every shell have drawn with WebGL.
    const liveContexts = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('canvas')].filter((canvas) => {
            const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
            return gl !== null && !gl.isContextLost()
          }).length,
      )
    await expect.poll(liveContexts, { timeout: 20_000 }).toBeGreaterThanOrEqual(4)

    // Keep hold of the contexts of the panes about to close, which leave the DOM.
    await page.evaluate(() => {
      const contextsIn = (selector: string) =>
        [...document.querySelectorAll(`${selector} canvas`)]
          .map((canvas) => (canvas as HTMLCanvasElement).getContext('webgl2'))
          .filter((gl) => gl !== null)
      const held = window as unknown as Record<string, WebGL2RenderingContext[]>
      held.__globe = contextsIn('[data-testid=pane][data-widget=globe]')
      const lastTab = document.querySelectorAll('[data-testid=tabs-host] [data-testid=tab]')[2]
      held.__shell = contextsIn(`[data-pane-id="${lastTab?.getAttribute('data-pane-id')}"]`)
    })
    const lostCounts = () =>
      page.evaluate(() => {
        const held = window as unknown as Record<string, WebGL2RenderingContext[]>
        const count = (list: WebGL2RenderingContext[] = []) => ({
          total: list.length,
          lost: list.filter((gl) => gl.isContextLost()).length,
        })
        return { globe: count(held.__globe), shell: count(held.__shell) }
      })
    const before = await lostCounts()
    expect(before.globe.total).toBeGreaterThan(0)
    expect(before.shell.total).toBeGreaterThan(0)
    expect(before.globe.lost + before.shell.lost).toBe(0)

    await pane(page, 'globe').hover()
    await pane(page, 'globe').getByTestId('pane-close').click()
    await page.getByTestId('tabs-host').getByTestId('tab-close').last().click()
    await expect(shellTabs).toHaveCount(2)

    // Lost straight away, not whenever the canvases are garbage collected.
    await expect.poll(lostCounts).toEqual({
      globe: { total: before.globe.total, lost: before.globe.total },
      shell: { total: before.shell.total, lost: before.shell.total },
    })
    // The panes still open keep theirs.
    expect(await liveContexts()).toBeGreaterThanOrEqual(2)
    expect(warnings).toEqual([])
  } finally {
    await close()
  }
})

test('the arrow keys keep the selected widget in view in the picker', async () => {
  const { app, page, close } = await launch()
  try {
    // A window short enough that the widget list cannot show every row at once.
    const window = await app.browserWindow(page)
    await window.evaluate((w) => {
      w.setFullScreen(false)
      w.setSize(1100, 560)
    })

    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker')).toBeVisible()
    const rows = page.getByTestId('pane-picker-item')
    const count = await rows.count()
    expect(count).toBeGreaterThan(5)
    const list = '[data-testid=pane-picker] [role=listbox]'
    expect((await selectedRow(page, list))?.scrollable).toBe(true)

    // Walking down to the last row scrolls with the selection.
    await page.keyboard.press('ArrowDown', { delay: 10 })
    for (let i = 2; i < count; i++) await page.keyboard.press('ArrowDown', { delay: 10 })
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({
        index: count - 1,
        scrollable: true,
        inView: true,
      })

    // Down from the last row wraps to the first, which must be shown again.
    await page.keyboard.press('ArrowDown')
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({
        index: 0,
        scrollable: true,
        inView: true,
      })

    // And up from the first wraps back to the last.
    await page.keyboard.press('ArrowUp')
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({
        index: count - 1,
        scrollable: true,
        inView: true,
      })
  } finally {
    await close()
  }
})

test('a resting pointer does not steal the keyboard selection as the list scrolls', async () => {
  const { app, page, close } = await launch()
  try {
    const window = await app.browserWindow(page)
    await window.evaluate((w) => {
      w.setFullScreen(false)
      w.setSize(1100, 560)
    })

    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker')).toBeVisible()
    const list = '[data-testid=pane-picker] [role=listbox]'

    // Point at a row, then leave the mouse where it is: the rows scroll under it,
    // and the row that arrives beneath the pointer must not take the selection.
    const third = page.getByTestId('pane-picker-item').nth(2)
    await third.hover()
    await expect.poll(() => selectedRow(page, list).then((r) => r?.index)).toBe(2)
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown', { delay: 30 })
    await expect
      .poll(() => selectedRow(page, list))
      .toEqual({
        index: 8,
        scrollable: true,
        inView: true,
      })
  } finally {
    await close()
  }
})
