import type { ElectronApplication } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch } from './support.js'

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
