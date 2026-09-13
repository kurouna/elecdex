import { expect, test } from '@playwright/test'
import { launch, terminalPane } from './support.js'

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
    await expect(picker.getByTestId('pane-picker-item')).toHaveCount(1)
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
    // Panes in a tab group close from their tab; every other pane has a button.
    const untabbed = page.locator('[data-testid=pane]:not([data-chrome=bare])')
    const count = await untabbed.count()
    expect(count).toBeGreaterThan(5)
    await expect(untabbed.getByTestId('pane-close')).toHaveCount(count)
  } finally {
    await close()
  }
})
