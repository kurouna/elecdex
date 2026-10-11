import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { type Launched, launch, SINGLE_TERMINAL, terminalPane, typeInto } from './support.js'

/**
 * The shell is told the pane's size even when the pane is hidden before that
 * size has held.
 *
 * A pane waits PTY_RESIZE_SETTLE_MS before telling the shell a new size, and
 * tells nothing while it is hidden. Hidden within that wait - another tab chosen
 * just after the window changed - it once never told the shell at all: shown
 * again at the same size, xterm reported no resize, and the shell went on
 * wrapping at the old width.
 */

let launched: Launched
let page: Page

test.afterEach(async () => {
  await launched?.close()
})

/** The width the pane's own shell says it has, asked through the pane. */
async function shellColumns(sessionId: string): Promise<number> {
  const marker = `W${Date.now()}`
  const command =
    launched.platform === 'win32'
      ? `echo "${marker}=$($Host.UI.RawUI.WindowSize.Width)"`
      : `echo "${marker}=$(tput cols)"`
  await typeInto(page, terminalPane(page), command)
  const pattern = new RegExp(`${marker}=(\\d+)`)
  let width = 0
  await expect
    .poll(
      async () => {
        const screen = await page.evaluate(async (id) => {
          const decoder = new TextDecoder()
          let text = ''
          const detach = await window.elecdex.pty.attach(id, {
            onData: (chunk) => {
              text += decoder.decode(chunk, { stream: true })
            },
            onExit: () => {},
            onCwd: () => {},
            onCommandEnd: () => {},
            onIntegrationUnavailable: () => {},
          })
          await new Promise((r) => setTimeout(r, 300))
          detach()
          return text
        }, sessionId)
        width = Number(pattern.exec(screen)?.[1] ?? 0)
        return width
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0)
  return width
}

test('a pane hidden before its new size has held tells the shell once shown', async () => {
  launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  page = launched.page
  await expect(terminalPane(page).locator('.xterm-screen')).toBeVisible()
  await page.waitForTimeout(2000)
  const first = (await page.evaluate(() => window.elecdex.pty.list()))[0]?.id
  if (first === undefined) throw new Error('no session')

  // A second tab, then back to the first.
  await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.press('Control+Shift+KeyT')
  const strip = page.getByTestId('tabs-host').getByTestId('tab')
  await expect.poll(() => strip.count(), { timeout: 20_000 }).toBe(2)
  await page.waitForTimeout(1500)
  await strip.first().click()
  await page.waitForTimeout(1000)
  const before = await shellColumns(first)

  // The workspace narrows, and the other tab is chosen before the new size has held.
  await page.evaluate(async () => {
    const workspace = document.querySelector<HTMLElement>('[data-testid=workspace]')
    if (workspace === null) throw new Error('no workspace')
    workspace.style.width = '60%'
    await new Promise((r) => setTimeout(r, 30))
    document.querySelectorAll<HTMLElement>('[data-testid=tabs-host] [data-testid=tab]')[1]?.click()
  })
  await page.waitForTimeout(800)
  await strip.first().click()
  await page.waitForTimeout(800)

  const after = await shellColumns(first)
  expect(after).toBeLessThan(before * 0.8)
})
