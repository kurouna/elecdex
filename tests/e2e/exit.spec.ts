import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { ElectronApplication } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL, showStatusBar, terminalPane } from './support.js'

/**
 * Leaving the app. In fullscreen the window has no frame and no close button,
 * so the app has to provide its own way out.
 */

/** Resolves once the app's main process has exited. */
function exited(app: ElectronApplication): Promise<void> {
  const child = app.process()
  if (child.exitCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('exit', () => resolve()))
}

test('the exit button asks for a second click, then quits', async () => {
  const { app, page, close } = await launch()
  try {
    await showStatusBar(page)
    const button = page.getByTestId('exit')
    await button.click()
    await expect(button).toHaveText(/click again/i)
    await expect(button).toHaveClass(/armed/)

    // The first click alone does not quit, and the confirmation lapses.
    await page.waitForTimeout(3500)
    await expect(button).not.toHaveClass(/armed/)
    expect(app.process().exitCode).toBeNull()

    const gone = exited(app)
    await button.click()
    await button.click()
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('a window still asking for sessions while the app quits gets an answer', async () => {
  const { app, page, close } = await launch()
  try {
    const stderr: string[] = []
    app.process().stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()))
    // What the orphan reaper or a mounting pane does if its moment falls in the quit:
    // the page is still open after before-quit, until its window closes.
    await page.evaluate(() => {
      window.addEventListener('beforeunload', () => {
        void window.elecdex.pty.list()
        void window.elecdex.settings.startDirectory()
      })
    })
    const gone = exited(app)
    await page.evaluate(() => window.elecdex.system.quit())
    await gone
    expect(stderr.join('')).not.toMatch(/No handler registered/)
  } finally {
    await close().catch(() => {})
  }
})

test('Ctrl+Shift+Q quits, even with a terminal focused', async () => {
  const { app, page, close } = await launch()
  try {
    await page
      .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-helper-textarea')
      .first()
      .focus()
    const gone = exited(app)
    // The window can close before the key-up is delivered, which rejects the press.
    await page.keyboard.press('Control+Shift+KeyQ').catch(() => {})
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('a rearrangement made a moment before quitting is still saved, live and in its layout', async () => {
  // The save is debounced, so quitting straight after a change is the case that
  // loses it if the page does not write out on its way down - and with a layout
  // being worked in, it would be lost from two files rather than one.
  const { app, page, userData, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: { layout: { confirmSwitch: false } },
  })
  try {
    await page.keyboard.press('Control+Shift+KeyG')
    await page.getByTestId('layouts-name').fill('one')
    await page.getByTestId('layouts-save').click()
    await expect(page.getByTestId('layouts-item')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()

    const gone = exited(app)
    // Split and quit in one task: the debounce cannot have fired in between, so
    // what reaches the disk can only have come from the flush on the way out.
    await page.evaluate(() => {
      const press = (code: string) =>
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            code,
            key: code,
            ctrlKey: true,
            shiftKey: true,
          }),
        )
      press('KeyE')
      press('KeyQ')
    })
    await gone

    const count = (file: string) =>
      (readFileSync(path.join(userData, file), 'utf8').match(/"terminal"/g) ?? []).length
    expect(count('layout.json'), 'the live layout').toBe(2)
    expect(count('layouts.json'), 'the layout being worked in').toBe(2)
  } finally {
    await close().catch(() => {})
  }
})
