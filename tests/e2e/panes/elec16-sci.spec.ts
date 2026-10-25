import { expect } from '@playwright/test'
import { atSize, ELEC16_BESIDE_CLOCK } from '../support/elec16.js'
import { test } from '../support/shared.js'
import { cpuSeconds, launch, powerNote, settleLayout } from '../support.js'

/**
 * ELEC-16 SCI in the running app (docs/elec16-sci.md section 10, S2 to S7): the picker's own
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
    // The two tabs by their kind of machine, no longer both ELEC-16.
    expect(await page.getByTestId('tab-label').allTextContents()).toEqual([
      'elec-16 pocket',
      'elec-16 sci',
    ])
    const firstRow = async () =>
      ((await sci.getByTestId('elec16-text').textContent()) ?? '').split('\n')[0]?.trim() ?? ''
    await expect(sci).toHaveAttribute('data-asleep', 'true', { timeout: 15_000 })
    await settleLayout(page)
    await expect(sci.locator('[data-testid=elec16-sci-device] .body')).toHaveAttribute(
      'data-mode',
      'full',
    )

    // A new unit starts in 2D, whose line the pane's text reads back by its dots (S7).
    const mark = (name: string) => sci.locator(`[data-mark="${name}"]`)
    const key = (id: string) =>
      sci.locator(`[data-testid=elec16-sci-key][data-key="${id}"]`).click({ delay: 20 })
    await expect(mark('2D')).toHaveClass(/\bon\b/)

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
    // SETUP 2 is LINE: the 2D mark goes out; its title band reads as the rest does.
    await key('setup')
    await expect.poll(firstRow).toMatch(/^SETUP +1\/2$/)
    await key('2')
    await key('ac')
    await expect(mark('2D')).not.toHaveClass(/\bon\b/)
    // v2's banks in the built app: SHIFT FUNC is CONST, its first constant c₀ (bank 10).
    await key('shift')
    await key('func')
    await key('1')
    await expect.poll(firstRow).toBe('c₀')

    // The printing above the keys - SHIFT faces left, ALPHA letters right - never runs into
    // its neighbour's, the long ones side by side too (ANGLE, CONST on SETUP and FUNC).
    const printed = await sci.locator('.faces > span').evaluateAll((spans) =>
      spans
        .map((s) => s.getBoundingClientRect())
        .filter((r) => r.width > 0)
        .map((r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })),
    )
    expect(printed.length).toBeGreaterThan(30)
    for (const [i, a] of printed.entries()) {
      for (const b of printed.slice(i + 1)) {
        const sameRow = a.top < b.bottom && b.top < a.bottom
        expect(sameRow && a.left < b.right && b.left < a.right, JSON.stringify([a, b])).toBe(false)
      }
    }

    // The panel offers CORE, MEM and TUNE only; TUNE names the unit SCI 1 and its model.
    await expect(sci.getByRole('tab')).toHaveText(['core', 'mem', 'tune'])
    await sci.getByRole('tab', { name: 'tune' }).click()
    await expect(sci.locator('[data-testid=elec16-model][data-model=sci-128]')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(sci.getByTestId('elec16-tune')).toContainText('SCI 1')
    await expect(sci.getByTestId('elec16-model')).toHaveText([
      'POCKET-32',
      'POCKET-48',
      'POCKET-64',
      'HANDHELD-160',
      'PLAY-320',
      'SCI-128',
    ])
    await expect(page.getByTestId('group-subtitle')).toHaveText('SCI 1 · SCI-128')

    // The pocket pane's unit is as it was: BASIC at its prompt.
    expect(await pocketText()).toContain('ELEC-16 BASIC')
  } finally {
    await close()
  }
})

test('asleep at its keys it costs what a paused pane does; typing costs little', {
  tag: '@perf',
}, async () => {
  // Measured for S7 (docs/elec16-sci.md): the calculator sleeps for a key between keys, and
  // a key redraws its 2D line and answer, which the screen reader then reads by its dots.
  test.setTimeout(180_000)
  const launched = await atSize(await launch(undefined, { layout: ELEC16_BESIDE_CLOCK }))
  const { app, page, close } = launched
  try {
    await settleLayout(page)
    const pocket = page.locator('[data-testid=elec16]:not(:has([data-testid=elec16-sci-device]))')
    await pocket.click({ delay: 20 })
    await page.keyboard.press('Control+Shift+KeyA')
    await page.getByTestId('pane-picker-filter').fill('sci')
    await page.locator('[data-testid=pane-picker-placement][data-placement=tab]').click()
    await page
      .locator('[data-testid=pane-picker-item][data-widget=elec16][data-variant=sci]')
      .click()
    const sci = page.locator('[data-testid=elec16]', { has: page.getByTestId('elec16-sci-device') })
    await expect(sci).toHaveAttribute('data-asleep', 'true', { timeout: 15_000 })
    await settleLayout(page)
    const WINDOW_MS = 8_000
    const measure = async (during: () => Promise<void> = async () => {}) => {
      const start = await cpuSeconds(app)
      const end = Date.now() + WINDOW_MS
      await during()
      // wait: the rest of the window CPU time is measured over.
      await page.waitForTimeout(Math.max(0, end - Date.now()))
      return ((await cpuSeconds(app)) - start) / (WINDOW_MS / 1000)
    }
    // wait: the boot's own work dies down before the first window is measured.
    await page.waitForTimeout(2000)
    const asleep = await measure()
    await sci.getByTestId('elec16-pause').click()
    await expect(sci).toHaveAttribute('data-status', 'paused')
    const paused = await measure()
    await sci.getByTestId('elec16-pause').click()
    await sci.focus()
    // Ten keys a second: a fraction typed and taken away again, so the 2D line keeps changing.
    const tenKeys = async () => {
      const end = Date.now() + WINDOW_MS - 500
      while (Date.now() < end) {
        for (const k of ['1', 'f', '2', 'Backspace', 'Backspace', 'Backspace', 'Backspace']) {
          await page.keyboard.press(k)
          // wait: a person's pace between keys.
          await page.waitForTimeout(100)
        }
      }
    }
    const typing = await measure(tenKeys)
    // The same keys to the pocket pane's BASIC beside it, for what typing costs any ELEC-16.
    // The pocket is the group's first tab, behind the calculator.
    await page.getByTestId('tab').first().click({ delay: 20 })
    await expect(pocket).toBeVisible()
    await pocket.focus()
    const pocketTyping = await measure(tenKeys)
    const pct = (n: number) => `${(n * 100).toFixed(1)}%`
    const power = await powerNote(app, page)
    console.log(
      `elec16 sci: asleep ${pct(asleep)}, paused ${pct(paused)}, typing ten keys a second ${pct(typing)} (the pocket ${pct(pocketTyping)}) of one core, ${power}`,
    )
    // Asleep it costs what it does paused (docs/elec16.md section 9's budget, half as much
    // again for the rest of the machine, user decision 2026-10-04); typing pays for a redraw a key.
    const room = 1.5
    expect(asleep - paused, `asleep over paused, ${power}`).toBeLessThan(
      process.env.CI ? 1 : 0.02 * room,
    )
    // On CI only a bound against a runaway: Linux's runner draws in software, where a key's
    // redraw of the 2D line and the whole LCD came to 1.55-1.69 of a core (cluster.spec's 3 too).
    expect(typing - asleep, `typing over asleep, ${power}`).toBeLessThan(
      process.env.CI ? 3 : 0.1 * room,
    )
  } finally {
    await close()
  }
})
