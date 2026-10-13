import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { type Launched, launch, SINGLE_TERMINAL, terminalPane, typeInto } from './support.js'

/**
 * What the shell pane does around the shell (docs/architecture.md §6): a shell ended and
 * started again by a key, the question before a paste of several lines, the scrollback
 * cleared, the type size stepped, a tab marked when its shell writes behind it, and a bell.
 * Each launches its own app, so none depends on another's shells.
 */

/** Two shells as tabs, the first in front. */
const TWO_TABS = {
  version: 1,
  root: {
    kind: 'tabs',
    id: 'tabs',
    activeIndex: 0,
    children: [
      { kind: 'pane', id: 'one', widget: 'terminal' },
      { kind: 'pane', id: 'two', widget: 'terminal' },
    ],
  },
} as const

/** Waits until the shell has reported its folder: its prompt is up and takes typing. */
async function ready(page: Page, index = 0): Promise<void> {
  await expect
    .poll(
      () =>
        page
          .locator('[data-testid=pane-subtitle], [data-testid=group-subtitle]')
          .nth(index)
          .innerText()
          .catch(() => ''),
      { timeout: 40_000, intervals: [300] },
    )
    .toMatch(/[\\/~]/)
}

const sessionIds = (page: Page) =>
  page.evaluate(async () => (await window.elecdex.pty.list()).map((s) => s.id).sort())

test('a shell that ended starts again on a key, where it was', async () => {
  const launched: Launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page } = launched
  try {
    await ready(page)
    const pane = terminalPane(page).first()
    const before = await sessionIds(page)
    await typeInto(page, pane, 'exit')
    await expect(pane.getByTestId('pane-badge')).toContainText('exited', { timeout: 20_000 })
    await pane.locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Enter')
    await expect(pane.getByTestId('pane-badge')).toHaveCount(0, { timeout: 20_000 })
    await expect.poll(() => sessionIds(page), { timeout: 20_000 }).not.toEqual(before)
    await ready(page)
  } finally {
    await launched.close()
  }
})

test('several lines pasted ask first; a line alone goes straight in', async () => {
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page, app } = launched
  try {
    await ready(page)
    const host = terminalPane(page).first().getByTestId('terminal-host')
    const paste = async (text: string) => {
      await app.evaluate(({ clipboard }, value) => clipboard.writeText(value), text)
      await host.click({ button: 'right', position: { x: 60, y: 60 } })
    }
    await paste('echo one\necho two')
    await expect(page.getByTestId('paste-dialog')).toBeVisible()
    await expect(page.getByTestId('paste-lines')).toContainText('2 lines')
    await page.getByTestId('paste-cancel').click()
    await expect(page.getByTestId('paste-dialog')).toHaveCount(0)
    await paste('echo alone')
    await page.waitForTimeout(600)
    await expect(page.getByTestId('paste-dialog')).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('Ctrl+Shift+K clears the scrollback of the shell that has the keys', async () => {
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page, platform } = launched
  try {
    await ready(page)
    const pane = terminalPane(page).first()
    // xterm 6 draws its own scrollbar: its slider's share of the track is the screen's share of
    // the buffer - small with a long scrollback, the whole track once it is cleared.
    const share = () =>
      pane.locator('.xterm-scrollable-element .scrollbar.vertical').evaluate((track) => {
        const slider = track.querySelector('.slider')
        const whole = track.getBoundingClientRect().height
        return whole === 0 || slider === null ? 1 : slider.getBoundingClientRect().height / whole
      })
    await typeInto(page, pane, platform === 'win32' ? '1..300 | % { $_ }' : 'seq 300')
    await expect.poll(share, { timeout: 20_000 }).toBeLessThan(0.5)
    await page.keyboard.press('Control+Shift+KeyK')
    await expect.poll(share, { timeout: 5000 }).toBeGreaterThan(0.9)
  } finally {
    await launched.close()
  }
})

test('Ctrl+Shift+= and - step every shell type size, and leave the page zoom alone', async () => {
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page, app } = launched
  try {
    await ready(page)
    const pane = terminalPane(page).first()
    await pane.locator('.xterm-helper-textarea').first().focus()
    const size = () =>
      page.evaluate(async () => (await window.elecdex.settings.get()).terminal.fontSize)
    const zoom = () =>
      app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()
          .find((w) => w.isVisible())
          ?.webContents.getZoomFactor(),
      )
    const cell = () => pane.locator('.xterm-screen').evaluate((el) => el.getBoundingClientRect())
    const before = await cell()
    await page.keyboard.press('Control+Shift+Equal')
    await expect.poll(size).toBe(14)
    await page.keyboard.press('Control+Shift+Equal')
    await expect.poll(size).toBe(15)
    expect(await zoom()).toBe(1)
    await expect
      .poll(async () => {
        const now = await cell()
        return now.width !== before.width || now.height !== before.height
      })
      .toBe(true)
    await page.keyboard.press('Control+Shift+Minus')
    await expect.poll(size).toBe(14)
  } finally {
    await launched.close()
  }
})

test('a shell writing behind its tab marks the tab until it is shown', async () => {
  const launched = await launch(undefined, { layout: TWO_TABS })
  const { page, platform } = launched
  try {
    await ready(page)
    const tabs = page.getByTestId('tab')
    const first = terminalPane(page).first()
    await typeInto(
      page,
      first,
      platform === 'win32' ? 'Start-Sleep 3; echo LATER' : 'sleep 3; echo LATER',
    )
    await tabs.nth(1).click()
    await expect(tabs.nth(0).getByTestId('tab-activity')).toBeVisible({ timeout: 15_000 })
    await tabs.nth(0).click()
    // Gone from the tab shown; the other shell may write behind it too (its prompt, late).
    await expect(tabs.nth(0).getByTestId('tab-activity')).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('a bell flashes the pane', async () => {
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page, platform } = launched
  try {
    await ready(page)
    const pane = terminalPane(page).first()
    // Counted on the frame: a flash of a quarter second was missed now and then.
    const bells = () => pane.locator('[data-bells]').getAttribute('data-bells')
    await typeInto(
      page,
      pane,
      platform === 'win32' ? 'Write-Host -NoNewline ([char]7)' : "printf '\\a'",
    )
    await expect.poll(bells, { timeout: 15_000 }).toBe('1')
  } finally {
    await launched.close()
  }
})
