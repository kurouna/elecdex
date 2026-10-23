import { expect, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL } from '../support.js'
import { PANES } from './panes.js'
import { type ContractApp, contractPane, launchContracts, tabOf } from './world.js'

/**
 * The mount contract (docs/e2e-design.md, section 3.2): every built-in pane draws in the running
 * app without a fault, the picker offers every one, and every one the registry lets pop up comes
 * up as a popup and goes again - and none that it does not. One app holds every pane as the tabs
 * of one group (the picker is asked on a layout of one shell); a failure names every pane that
 * broke the contract at once.
 */

let ctx: ContractApp
const errors: string[] = []

test.beforeAll(async () => {
  ctx = await launchContracts()
  ctx.page.on('pageerror', (error) => errors.push(error.message))
})

test.afterAll(async () => {
  await ctx?.dispose()
})

test('every built-in pane draws without a fault', async () => {
  const { page } = ctx
  const failed: Record<string, string> = {}
  for (const row of PANES) {
    await tabOf(page, row.widget).click()
    const pane = contractPane(page, row.widget)
    try {
      await expect(pane).toBeVisible()
      // Drawn: the widget put something in its pane, and neither a fault nor a placeholder.
      await expect
        .poll(() => pane.evaluate((el) => el.querySelectorAll('*').length))
        .toBeGreaterThan(3)
      await expect(pane.getByTestId('pane-fault')).toHaveCount(0)
      await expect(pane.getByTestId('pane-missing')).toHaveCount(0)
    } catch (error) {
      failed[row.widget] = String((error as Error).message).split('\n')[0] ?? ''
    }
  }
  expect(failed).toEqual({})
  expect(errors).toEqual([])
})

test('the picker offers every built-in pane, and pops up exactly those the registry says', async () => {
  // A layout of one shell: a widget already on screen is offered as "focus", not as a popup.
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page } = launched
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const picker = page.getByTestId('pane-picker')
  const popup = page.getByTestId('popup-pane')
  const openPopupPicker = async () => {
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(picker).toBeVisible()
    await picker.locator('[data-testid=pane-picker-placement][data-placement=popup]').click()
  }
  try {
    // What the picker says each row would do as a popup: pop up, pane only, or focus the shell.
    await openPopupPicker()
    const rows = await picker
      .locator('[data-testid=pane-picker-item]')
      .evaluateAll((items) =>
        Object.fromEntries(
          items.map((item) => [
            (item as HTMLElement).dataset.widget ?? '',
            item.querySelector('.state')?.textContent?.trim() ?? '',
          ]),
        ),
      )
    await page.keyboard.press('Escape')
    await expect(picker).toHaveCount(0)

    const builtins = PANES.map((r) => r.widget)
    expect(builtins.filter((id) => !(id in rows))).toEqual([])
    const poppable = builtins.filter((id) => rows[id] === 'pop up').sort()
    expect(poppable).toEqual(
      PANES.filter((r) => r.popup)
        .map((r) => r.widget)
        .sort(),
    )

    // Each comes up as a popup, without a fault, and goes on Escape.
    const failed: Record<string, string> = {}
    for (const id of poppable) {
      try {
        await openPopupPicker()
        await picker.locator(`[data-testid=pane-picker-item][data-widget="${id}"]`).click()
        await expect(popup).toHaveAttribute('data-widget', id)
        await expect(popup.getByTestId('pane-fault')).toHaveCount(0)
        await expect(popup.getByTestId('pane-missing')).toHaveCount(0)
        await page.keyboard.press('Escape')
        await expect(popup).toHaveCount(0)
      } catch (error) {
        failed[id] = String((error as Error).message).split('\n')[0] ?? ''
        await page.keyboard.press('Escape')
      }
    }
    expect(failed).toEqual({})
    expect(pageErrors).toEqual([])
  } finally {
    await launched.close()
  }
})
