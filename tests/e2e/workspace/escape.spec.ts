import { expect, type Page } from '@playwright/test'
import { test } from '../support/shared.js'
import { launch, single } from '../support.js'

/**
 * Escape belongs first to what a widget has open of its own (lib/escape-owner.ts), then to the
 * workspace: a forward pane goes back, a popped-up one closes. The workspace's handlers run in
 * the capture phase, so before `data-owns-escape` they took the key - a forward shell's search
 * bar put the pane back instead of closing, a popped-up calculator closed instead of clearing
 * its line (found in review, 2026-11-15; the RSS pane's article is in panes/rss.spec.ts).
 */

const popup = (page: Page) => page.getByTestId('popup-pane')

async function popUp(page: Page, widget: string): Promise<void> {
  await page.keyboard.press('Control+Shift+KeyA')
  const picker = page.getByTestId('pane-picker')
  await picker.locator('[data-testid=pane-picker-placement][data-placement=popup]').click()
  await picker.locator(`[data-testid=pane-picker-item][data-widget=${widget}]`).click()
  await expect(popup(page)).toHaveAttribute('data-widget', widget)
}

test('a forward shell: Escape closes its search bar first, then puts the pane back', async () => {
  const { page, close } = await launch(undefined, { layout: single('terminal', { id: 't' }) })
  try {
    const pane = page.locator('[data-testid=pane][data-widget=terminal]')
    await pane.locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyZ')
    const forward = page.locator('[data-testid=pane].pane-pinned')
    await expect(forward).toHaveCount(1)
    await pane.locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyF')
    await expect(pane.getByTestId('terminal-search-box')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(pane.getByTestId('terminal-search')).toHaveCount(0)
    await expect(forward).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(forward).toHaveCount(0)
  } finally {
    await close()
  }
})

test('popped up: Escape clears the calculator line, the launcher filter and closes the language list before the popup', async () => {
  const { page, close } = await launch(undefined, { layout: single('clock', { id: 'c' }) })
  try {
    // The calculator: a line typed is cleared first.
    await popUp(page, 'calc')
    const line = popup(page).locator('.entry input')
    await line.fill('1+2')
    await line.press('Escape')
    await expect(line).toHaveValue('')
    await expect(popup(page)).toHaveCount(1)
    await line.press('Escape')
    await expect(popup(page)).toHaveCount(0)

    // The launcher, called up by its key: a filter typed is emptied first.
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(popup(page)).toHaveAttribute('data-widget', 'launcher')
    const filter = popup(page).getByTestId('launcher-filter')
    await expect(filter).toBeFocused()
    await filter.fill('zz')
    await page.keyboard.press('Escape')
    await expect(filter).toHaveValue('')
    await expect(popup(page)).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(popup(page)).toHaveCount(0)

    // TRANSLATE: its language list closes first.
    await popUp(page, 'translate')
    await popup(page).getByTestId('translate-src-lang').click()
    const list = popup(page).getByTestId('translate-lang-src')
    await expect(list).toBeVisible()
    await list.locator('input').press('Escape')
    await expect(list).toHaveCount(0)
    await expect(popup(page)).toHaveCount(1)
  } finally {
    await close()
  }
})
