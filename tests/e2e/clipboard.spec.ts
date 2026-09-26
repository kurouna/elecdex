import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch, settleLayout } from './support.js'

/**
 * The clipboard pane, on main's stand-in clipboard (support.ts sets
 * ELECDEX_CLIPBOARD_STUB=1): nothing this machine has copied is read, and nothing
 * is put on its clipboard. Copies are made through globalThis.__elecdexClipboard.
 */

interface Formats {
  html?: string
  rtf?: string
}

interface Hooks {
  copy(text: string, options?: Formats & { private?: boolean }): void
  copyOther(): void
  current(): { text: string; html: string | null; rtf: string | null } | null
  reads(): number
}

const copy = (app: ElectronApplication, text: string, options?: Formats & { private?: boolean }) =>
  app.evaluate(
    (_electron, [value, extra]) => {
      const bound = (globalThis as unknown as { __elecdexClipboard: Hooks }).__elecdexClipboard
      bound.copy(value, extra)
    },
    [text, options] as const,
  )

const held = (app: ElectronApplication) =>
  app.evaluate(() =>
    (globalThis as unknown as { __elecdexClipboard: Hooks }).__elecdexClipboard.current(),
  )

const reads = (app: ElectronApplication) =>
  app.evaluate(() =>
    (globalThis as unknown as { __elecdexClipboard: Hooks }).__elecdexClipboard.reads(),
  )

const texts = (page: Page) => page.getByTestId('clip-text').allInnerTexts()

/**
 * Copies, and waits for the pane to list it: main looks four times a second, and
 * two copies inside one quarter are one copy to it, as they would be for real.
 */
async function copied(app: ElectronApplication, page: Page, text: string, formats?: Formats) {
  await copy(app, text, formats)
  await expect.poll(async () => (await texts(page))[0]).toBe(text)
}

const beside = (widget: string) => ({
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [50, 50],
    children: [
      { kind: 'pane', id: 'k', widget: 'clipboard' },
      { kind: 'pane', id: 'c', widget },
    ],
  },
})

test('lists copies newest first, puts one back with its HTML, removes and clears', async () => {
  const { app, page, close } = await launch(undefined, { layout: beside('clock') })
  try {
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    await expect(page.getByTestId('clip-empty')).toBeVisible()
    await copied(app, page, 'first copy', { html: '<b>first</b> copy' })
    await copied(app, page, 'https://example.test/second')
    await copied(app, page, '#3fd2ff')
    expect(await texts(page)).toEqual(['#3fd2ff', 'https://example.test/second', 'first copy'])
    await expect(page.getByTestId('clip-count')).toHaveText('3/50')
    // The newest is what the clipboard holds.
    await expect(page.getByTestId('clip-row').first().getByTestId('clip-current')).toBeVisible()
    await expect(page.getByTestId('clip-row').first()).toHaveAttribute('data-kind', 'color')
    // Every row says what it is; one copied with its formatting says RICH under that.
    await expect(page.getByTestId('clip-tag')).toHaveText(['CLR', 'URL', 'TXT', 'RICH'])

    // Resting on a row brings its card, drawn like the git pane's; leaving takes it away.
    await page.getByTestId('clip-row').nth(2).hover()
    await expect(page.getByTestId('clip-card-text')).toHaveText('first copy')
    await expect(page.getByTestId('clip-card-formats')).toHaveText('text + HTML')
    await page.getByTestId('clip-count').hover()
    await expect(page.getByTestId('clip-card')).toHaveCount(0)

    // Put back: the text and its HTML, the row marked, and nothing moves.
    await page.getByTestId('clip-entry').nth(2).click()
    await expect(page.getByTestId('clip-age').nth(2)).toHaveText('COPIED')
    expect(await held(app)).toEqual({ text: 'first copy', html: '<b>first</b> copy', rtf: null })
    await expect(page.getByTestId('clip-row').nth(2).getByTestId('clip-current')).toBeVisible()
    await page.waitForTimeout(800)
    expect(await texts(page)).toEqual(['#3fd2ff', 'https://example.test/second', 'first copy'])

    // The same text copied again moves up, counted, rather than listed twice.
    await copy(app, 'https://example.test/second')
    await expect
      .poll(() => texts(page))
      .toEqual(['https://example.test/second', '#3fd2ff', 'first copy'])
    await expect(page.getByTestId('clip-row').first()).toContainText('×2')

    // Filtering.
    await page.getByTestId('clip-filter').fill('FIRST')
    await expect.poll(() => texts(page)).toEqual(['first copy'])
    await page.getByTestId('clip-filter').fill('')

    // Removing one leaves the clipboard as it is.
    await page.getByTestId('clip-row').first().hover()
    await page.getByTestId('clip-remove').first().click()
    await expect(page.getByTestId('clip-row')).toHaveCount(2)
    expect((await held(app))?.text).toBe('https://example.test/second')

    // Clearing asks once more.
    await page.getByTestId('clip-clear').click()
    await expect(page.getByTestId('clip-clear')).toHaveText('CLEAR 2 + CLIPBOARD?')
    await expect(page.getByTestId('clip-row')).toHaveCount(2)
    await page.getByTestId('clip-clear').click()
    await expect(page.getByTestId('clip-empty')).toBeVisible()
    // The clipboard is emptied with it, so nothing comes back at the next looks...
    expect(await held(app)).toBeNull()
    await page.waitForTimeout(800)
    await expect(page.getByTestId('clip-row')).toHaveCount(0)
    // ...and the text that was on it, copied again, is a copy (it was not listed before).
    await copied(app, page, 'https://example.test/second')
    await expect(page.getByTestId('clip-row')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('keeps what WordPad copies - RTF alone - and puts it back, and shows it in a card', async () => {
  const { app, page, close } = await launch(undefined, { layout: beside('clock') })
  try {
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    const rtf = '{\\rtf1\\ansi {\\b bold} words}'
    await copied(app, page, 'bold words', { rtf })
    await copied(app, page, 'plain words')
    await expect(page.getByTestId('clip-tag')).toHaveText(['TXT', 'TXT', 'RICH'])
    // The keyboard brings the card at once.
    await page.getByTestId('clip-filter').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('clip-card-text')).toHaveText('plain words')
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('clip-card-formats')).toHaveText('text + RTF')
    await page.getByTestId('clip-entry').nth(1).click()
    await expect(page.getByTestId('clip-age').nth(1)).toHaveText('COPIED')
    expect(await held(app)).toEqual({ text: 'bold words', html: null, rtf })
  } finally {
    await close()
  }
})

test('leaves out a copy its application marked private, and masks what is listed', async () => {
  const { app, page, close } = await launch(undefined, { layout: beside('clock') })
  try {
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    await copy(app, 'an ordinary line')
    await expect(page.getByTestId('clip-row')).toHaveCount(1)
    await copy(app, 'hunter2', { private: true })
    await expect(page.getByTestId('clip-skipped')).toHaveText('1 private copy left out')
    await expect(page.getByTestId('clip-row')).toHaveCount(1)
    await expect(page.getByTestId('clipboard')).not.toContainText('hunter2')
    // Nothing listed is on the clipboard now.
    await expect(page.getByTestId('clip-current')).toHaveCount(0)

    await page.getByTestId('clip-mask').click()
    await expect(page.getByTestId('clip-text')).not.toContainText('ordinary')
    await expect(page.getByTestId('clip-filter')).toHaveCount(0)
    // Masked, a row still puts back what it holds.
    await page.getByTestId('clip-entry').click()
    expect((await held(app))?.text).toBe('an ordinary line')
    // The choice is the pane's, and survives a reload.
    await page.reload()
    await expect(page.getByTestId('clip-mask')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('clip-row')).toHaveCount(1)
    await expect(page.getByTestId('clip-text')).not.toContainText('ordinary')
  } finally {
    await close()
  }
})

test('paused, it reads nothing; resumed, it lists what the clipboard holds then', async () => {
  const { app, page, close } = await launch(undefined, { layout: beside('clock') })
  try {
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    await page.getByTestId('clip-pause').click()
    await expect(page.getByTestId('clip-state')).toHaveText('PAUSED')
    await expect(page.locator('[data-testid=pane][data-widget=clipboard]')).toContainText('paused')
    expect(await page.evaluate(() => window.elecdex.clipboard.watching())).toBe(false)
    const before = await reads(app)
    await copy(app, 'while paused')
    await page.waitForTimeout(1200)
    expect(await reads(app)).toBe(before)
    await expect(page.getByTestId('clip-row')).toHaveCount(0)
    await page.getByTestId('clip-pause').click()
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    await expect.poll(() => texts(page)).toEqual(['while paused'])
  } finally {
    await close()
  }
})

test('behind another tab or closed, nothing is read; shown again, it takes up', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'tabs',
        id: 't',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'k', widget: 'clipboard' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
  })
  const watching = () => page.evaluate(() => window.elecdex.clipboard.watching())
  try {
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    await copy(app, 'seen')
    await expect.poll(() => texts(page)).toEqual(['seen'])

    await page.locator('[data-testid=tab][data-pane-id=c]').click()
    await expect.poll(watching).toBe(false)
    const before = await reads(app)
    await copy(app, 'copied unseen')
    await copy(app, 'copied unseen, twice')
    await page.waitForTimeout(1200)
    expect(await reads(app)).toBe(before)

    // Shown again: what was copied meanwhile is not there, only what the clipboard holds now.
    await page.locator('[data-testid=tab][data-pane-id=k]').click()
    await expect.poll(watching).toBe(true)
    await expect.poll(() => texts(page)).toEqual(['copied unseen, twice', 'seen'])

    // Closed, nothing reads; the history waits in main's memory.
    await page.locator('[data-testid=tab-close][data-pane-id=k]').click()
    await expect(page.getByTestId('clipboard')).toHaveCount(0)
    await expect.poll(watching).toBe(false)
    const after = await reads(app)
    await page.waitForTimeout(1000)
    expect(await reads(app)).toBe(after)
  } finally {
    await close()
  }
})

test('switched away from the desk layout, nothing is read; switched back, it takes up', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'c', widget: 'clock' } },
    // The dev layout has shells: no question on the way back to the desk.
    settings: { layout: { confirmSwitch: false } },
  })
  const watching = () => page.evaluate(() => window.elecdex.clipboard.watching())
  const pane = page.locator('[data-testid=pane][data-widget=clipboard]')
  try {
    // The desk preset (Ctrl+Shift+F6) has the clipboard pane on screen: it reads.
    await page.keyboard.press('Control+Shift+F6')
    await settleLayout(page)
    await expect(page.getByTestId('clip-state')).toHaveText('WATCHING')
    await copied(app, page, 'copied at the desk')

    // The dev preset has no clipboard pane: the pane goes, and so does the reading.
    await page.keyboard.press('Control+Shift+F4')
    await settleLayout(page)
    await expect(pane).toHaveCount(0)
    await expect.poll(watching).toBe(false)
    const before = await reads(app)
    await copy(app, 'copied in dev')
    await copy(app, 'copied in dev, later')
    await page.waitForTimeout(1200)
    expect(await reads(app)).toBe(before)

    // Back at the desk: the history kept in main is there, with only what the
    // clipboard holds now added - nothing copied while away.
    await page.keyboard.press('Control+Shift+F6')
    await settleLayout(page)
    await expect.poll(watching).toBe(true)
    await expect.poll(() => texts(page)).toEqual(['copied in dev, later', 'copied at the desk'])
    await copied(app, page, 'copied back at the desk')
  } finally {
    await close()
  }
})
