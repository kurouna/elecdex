import { type ElectronApplication, expect, type Page } from '@playwright/test'

/**
 * The CLI panes' stand-ins (src/main/cloud-cli/stub-aws.ts, stub-github.ts; support.ts sets
 * ELECDEX_CLOUD_STUB=1): their mode changed while the app runs, and the URLs main would open
 * noted in place of the browser. The shared app puts `shell.openExternal` back after each test.
 */

/** Sets the stand-in's mode (demo, signedout, nocli, …), or back to the variable's with null. */
export const cloudMode = (app: ElectronApplication, tool: 'aws' | 'github', mode: string | null) =>
  app.evaluate(
    (_electron, { tool, mode }) => {
      const g = globalThis as { __elecdexCloud?: Record<string, string> }
      const next = { ...g.__elecdexCloud }
      if (mode === null) delete next[tool]
      else next[tool] = mode
      g.__elecdexCloud = next
    },
    { tool, mode },
  )

/** Notes every URL main would open, in place of the browser. */
export const captureOpens = (app: ElectronApplication) =>
  app.evaluate(({ shell }) => {
    const notes = globalThis as { __e2eOpened?: string[] }
    notes.__e2eOpened = []
    shell.openExternal = async (url: string) => {
      notes.__e2eOpened?.push(url)
    }
  })

export const opened = (app: ElectronApplication) =>
  app.evaluate(() => (globalThis as { __e2eOpened?: string[] }).__e2eOpened ?? [])

/**
 * A 1600 x 900 window at no zoom (or the screen's own, if smaller), where the page draws fewer
 * than 16 px to the rem (reset.css: 1.48vh): the size the cloud panes once measured in 16 px.
 */
export async function nineHundredHigh(app: ElectronApplication, page: Page): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0]
    win?.webContents.setZoomFactor(1)
    win?.setContentSize(1600, 900)
  })
  await expect
    .poll(() =>
      page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)),
    )
    .toBeLessThan(15)
}

/** Pops `widget` up through the add-pane picker and answers its frame. */
export async function popUp(page: Page, widget: string) {
  await page.keyboard.press('Control+Shift+KeyA')
  const picker = page.getByTestId('pane-picker')
  await picker.locator('[data-testid=pane-picker-placement][data-placement=popup]').click()
  await picker.locator(`[data-testid=pane-picker-item][data-widget=${widget}]`).click()
  const popup = page.getByTestId('popup-pane')
  await expect(popup).toHaveAttribute('data-widget', widget)
  return popup
}
