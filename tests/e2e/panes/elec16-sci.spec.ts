import { expect } from '@playwright/test'
import { atSize, ELEC16_BESIDE_CLOCK } from '../support/elec16.js'
import { test } from '../support/shared.js'
import { launch, settleLayout } from '../support.js'

/**
 * ELEC-16 SCI in the running app (docs/elec16-sci.md section 10, S2 to S4): the picker's own
 * row opens the ELEC-16 pane on a new calculator unit beside a pocket one it leaves alone, the
 * body's keys and the PC's type a line that is answered and kept in the history, and the panel
 * offers only what the calculator has.
 */

test('the picker opens a calculator on a unit of its own, whose keys reach it from the body and the PC', async () => {
  const launched = await atSize(await launch(undefined, { layout: ELEC16_BESIDE_CLOCK }))
  const { page, close } = launched
  try {
    await settleLayout(page)
    const pocket = page.locator('[data-testid=elec16]:not(:has([data-testid=elec16-sci-device]))')
    const pocketText = async () => (await pocket.getByTestId('elec16-text').textContent()) ?? ''
    await expect.poll(pocketText).toContain('ELEC-16 BASIC')

    // As a tab of the pocket pane's group: the calculator gets the pocket pane's room.
    await pocket.click({ delay: 20 })
    await page.keyboard.press('Control+Shift+KeyA')
    await page.getByTestId('pane-picker-filter').fill('sci')
    await page.locator('[data-testid=pane-picker-placement][data-placement=tab]').click()
    await page
      .locator('[data-testid=pane-picker-item][data-widget=elec16][data-variant=sci]')
      .click()
    const sci = page.locator('[data-testid=elec16]', { has: page.getByTestId('elec16-sci-device') })
    await expect(sci).toHaveCount(1)
    const firstRow = async () =>
      ((await sci.getByTestId('elec16-text').textContent()) ?? '').split('\n')[0]?.trim() ?? ''
    await expect(sci).toHaveAttribute('data-asleep', 'true', { timeout: 15_000 })
    await settleLayout(page)
    await expect(sci.locator('[data-testid=elec16-sci-device] .body')).toHaveAttribute(
      'data-mode',
      'full',
    )

    // A new unit starts in 2D; SETUP 2 puts it in LINE, whose row of characters the pane's
    // text reads back (2D's line is set off the eight-row bands, docs/elec16-sci.md S3).
    const mark = (name: string) => sci.locator(`[data-mark="${name}"]`)
    const key = (id: string) =>
      sci.locator(`[data-testid=elec16-sci-key][data-key="${id}"]`).click({ delay: 20 })
    await expect(mark('2D')).toHaveClass(/\bon\b/)
    await key('setup')
    await key('2')
    await key('ac')
    await expect(mark('2D')).not.toHaveClass(/\bon\b/)

    // A key of the body, then keys typed on the PC while the pane has the focus: the line.
    await key('sin')
    await expect.poll(firstRow).toBe('sin(')
    await sci.focus()
    await page.keyboard.type('30')
    await expect.poll(firstRow).toBe('sin(30')
    // SHIFT lights its mark until the next key; Enter answers the line, which the history keeps.
    await key('shift')
    await expect(mark('S')).toHaveClass(/\bon\b/)
    await sci.focus()
    await page.keyboard.press('Enter')
    await expect(mark('S')).not.toHaveClass(/\bon\b/)
    await expect(mark('UP')).toHaveClass(/\bon\b/)
    // AC (Delete) clears the line; up brings it back from the history.
    await page.keyboard.press('Delete')
    await expect.poll(firstRow).toBe('')
    await page.keyboard.press('ArrowUp')
    await expect.poll(firstRow).toBe('sin(30')

    // The panel offers CORE, MEM and TUNE only; TUNE names the unit SCI 1 and its model.
    await expect(sci.getByRole('tab')).toHaveText(['core', 'mem', 'tune'])
    await sci.getByRole('tab', { name: 'tune' }).click()
    await expect(sci.locator('[data-testid=elec16-model][data-model=sci-128]')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(sci.getByTestId('elec16-tune')).toContainText('SCI 1')

    // The pocket pane's unit is as it was: BASIC at its prompt.
    expect(await pocketText()).toContain('ELEC-16 BASIC')
  } finally {
    await close()
  }
})
