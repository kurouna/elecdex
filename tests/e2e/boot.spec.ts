import os from 'node:os'
import { expect, test } from '@playwright/test'
import { launch, terminalPane } from './support.js'

/**
 * The boot sequence: boot log, title card, then the panes powering on.
 *
 * What matters beyond "it plays": it never costs the user their workspace (the
 * shell is already running underneath), any key gets them out of it, and a
 * reload does not make them sit through it again.
 */

test('the intro plays through to a revealed workspace', async () => {
  const { page, close } = await launch(undefined, { intro: true })
  try {
    const app = page.getByTestId('app')
    await expect(page.getByTestId('boot-log')).toBeVisible()
    await expect(app).toHaveAttribute('data-boot', 'concealed')
    const log = page.getByTestId('boot-log')
    // A Linux boot in form, with this machine's facts: the kernel ring buffer, then systemd.
    await expect(log).toContainText(`${os.hostname()} login:`, { timeout: 20_000 })
    const text = await log.innerText()
    const lines = text.split('\n')
    expect(lines[0]).toMatch(/^\[\s*\d+\.\d{6}\] Linux version /)
    expect(lines[0]).toContain(`Linux version ${os.release()}-elecdex-`)
    expect(text).toContain(`smpboot: CPU0: ${os.cpus()[0]?.model.trim()}`)
    expect(text).toContain(`systemd[1]: Hostname set to <${os.hostname()}>.`)
    expect(text).toContain('Welcome to elecdex')
    expect(text).toMatch(/\[ {2}OK {2}\] Started pty\.service - Terminal Backend/)
    expect(text).toMatch(/systemd\[1\]: Startup finished in \d+\.\d{3}s\./)
    // The timestamps are real seconds since start, so they never go backwards.
    const stamps = lines
      .map((line) => /^\[\s*(\d+\.\d{6})\]/.exec(line)?.[1])
      .filter((stamp) => stamp !== undefined)
      .map(Number)
    expect(stamps.length).toBeGreaterThan(20)
    expect(stamps).toEqual([...stamps].sort((a, b) => a - b))

    // The shell starts while the intro is still on screen.
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
        timeout: 20_000,
      })
      .toBeGreaterThan(0)

    await expect(page.getByTestId('boot-screen')).toHaveAttribute('data-phase', 'title', {
      timeout: 20_000,
    })
    await expect(page.getByTestId('boot-greeting')).toContainText(/welcome back/i)

    await expect(app).toHaveAttribute('data-boot', 'reveal', { timeout: 20_000 })
    // Every pane is powering on with its own delay, the shell first.
    const terminalDelay = await terminalPane(page).evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--crt-delay'),
    )
    expect(terminalDelay.trim()).toBe('0ms')
    await expect(page.locator('[data-testid=pane].crt-on').first()).toBeAttached()

    await expect(app).toHaveAttribute('data-boot', 'done', { timeout: 20_000 })
    await expect(page.getByTestId('boot-screen')).toHaveCount(0)
    // Nothing is left animating, or holding a transform, once it is over.
    await expect(page.locator('.crt-on')).toHaveCount(0)
    await expect(terminalPane(page)).toBeVisible()
  } finally {
    await close()
  }
})

test('a key skips the intro', async () => {
  const { page, close } = await launch(undefined, { intro: true })
  try {
    await expect(page.getByTestId('boot-log')).toBeVisible()
    await page.keyboard.press('KeyQ')
    await expect(page.getByTestId('app')).toHaveAttribute('data-boot', 'done')
    await expect(page.getByTestId('boot-screen')).toHaveCount(0)
    await expect(terminalPane(page)).toBeVisible()
  } finally {
    await close()
  }
})

test('a reload does not replay the intro', async () => {
  const { page, close } = await launch(undefined, { intro: true })
  try {
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('app')).toHaveAttribute('data-boot', 'done')

    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect(page.getByTestId('app')).toHaveAttribute('data-boot', 'done')
    await expect(page.getByTestId('boot-screen')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('--no-intro opens straight into the workspace', async () => {
  const { page, close } = await launch()
  try {
    await expect(page.getByTestId('app')).toHaveAttribute('data-boot', 'done')
    await expect(page.getByTestId('boot-screen')).toHaveCount(0)
    await expect(terminalPane(page)).toBeVisible()
  } finally {
    await close()
  }
})
