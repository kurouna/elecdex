import { expect } from '@playwright/test'
import { atSize, ELEC16_BESIDE_CLOCK } from '../support/elec16.js'
import { test } from '../support/shared.js'
import { launch, settleLayout } from '../support.js'

/**
 * ELEC-16 SCI's second stage (docs/elec16-sci.md section 10, S2), in the running app: the
 * picker's own row opens the ELEC-16 pane on a new calculator unit beside a pocket one it
 * leaves alone, the body's keys and the PC's reach the machine (its start screen names them),
 * and the panel offers only what the calculator has.
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
    const screen = async () =>
      ((await sci.getByTestId('elec16-text').textContent()) ?? '').split('\n').map((l) => l.trim())
    await expect.poll(screen, { timeout: 15_000 }).toContain('ELEC-16 SCI')
    await settleLayout(page)
    await expect(sci.locator('[data-testid=elec16-sci-device] .body')).toHaveAttribute(
      'data-mode',
      'full',
    )

    // A key of the body, then one typed on the PC while the pane has the focus.
    await sci.locator('[data-testid=elec16-sci-key][data-key=sin]').click({ delay: 20 })
    await expect.poll(screen).toContain('KEY SIN 001B')
    await sci.focus()
    await page.keyboard.press('7')
    await expect.poll(screen).toContain('KEY 7 0028')
    // SHIFT lights its mark until the next key.
    await sci.locator('[data-testid=elec16-sci-key][data-key=shift]').click({ delay: 20 })
    await expect(sci.locator('[data-mark=S]')).toHaveClass(/\bon\b/)
    await sci.focus()
    await page.keyboard.press('Enter')
    await expect.poll(screen).toContain('KEY S = 0004')
    await expect(sci.locator('[data-mark=S]')).not.toHaveClass(/\bon\b/)

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
