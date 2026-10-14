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
    await expect.poll(share, { timeout: 5000 }).toBeGreaterThan(0.75)
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

/** Everything the shells write for `ms`, from every session, to see what reached them. */
const listen = (page: Page, ms: number) =>
  page.evaluate(async (wait) => {
    const decoder = new TextDecoder()
    let text = ''
    const ids = (await window.elecdex.pty.list()).map((session) => session.id)
    const detachers = await Promise.all(
      ids.map((id) =>
        window.elecdex.pty.attach(id, {
          onData: (chunk) => {
            text += decoder.decode(chunk, { stream: true })
          },
          onExit: () => {},
          onCwd: () => {},
          onCommandEnd: () => {},
          onIntegrationUnavailable: () => {},
        }),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, wait))
    for (const detach of detachers) detach()
    return text
  }, ms)

test('a cd keeps the terminal it is typed into, rather than making it again', async () => {
  // Found in review: the pane's folder, kept in its state at every cd, made the whole terminal
  // again - its screen, scroll and what was being typed.
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page, platform } = launched
  try {
    await ready(page)
    const pane = terminalPane(page).first()
    const before = await pane.locator('.xterm').elementHandle()
    const subtitle = page.locator('[data-testid=pane-subtitle]').first()
    const was = await subtitle.innerText()
    await typeInto(page, pane, platform === 'win32' ? 'cd $env:TEMP' : 'cd /tmp')
    await expect.poll(() => subtitle.innerText(), { timeout: 30_000 }).not.toBe(was)
    await page.waitForTimeout(500)
    expect(await before?.evaluate((el) => el.isConnected)).toBe(true)
  } finally {
    await launched.close()
  }
})

test('a cleared scrollback stays cleared when the page comes back', async () => {
  // Found in review: only the pane was cleared; main's copy brought it all back on attaching.
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page, platform } = launched
  try {
    await ready(page)
    const share = () =>
      terminalPane(page)
        .first()
        .locator('.xterm-scrollable-element .scrollbar.vertical')
        .evaluate((track) => {
          const slider = track.querySelector('.slider')
          const whole = track.getBoundingClientRect().height
          return whole === 0 || slider === null ? 1 : slider.getBoundingClientRect().height / whole
        })
    await typeInto(
      page,
      terminalPane(page).first(),
      platform === 'win32' ? '1..300 | % { $_ }' : 'seq 300',
    )
    await expect.poll(share, { timeout: 20_000 }).toBeLessThan(0.5)
    await page.keyboard.press('Control+Shift+KeyK')
    await expect.poll(share, { timeout: 5000 }).toBeGreaterThan(0.75)
    await page.reload()
    await ready(page)
    await page.waitForTimeout(1500)
    // Not the whole screen alone: attached at another size, ConPTY paints its screen again,
    // which goes into the scrollback (0.4 to 0.64 on GitHub's runner). Brought back, the 300
    // lines held the slider near 0.1.
    expect(await share()).toBeGreaterThan(0.3)
  } finally {
    await launched.close()
  }
})

test('a pane brought back after its shell ended starts clean, and a key starts no second shell', async () => {
  // Found in review: it kept "exited" over the new shell it was given, and its first key started
  // a third.
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page } = launched
  try {
    await ready(page)
    const pane = terminalPane(page).first()
    await typeInto(page, pane, 'exit')
    await expect(pane.getByTestId('pane-badge')).toContainText('exited', { timeout: 20_000 })
    // Remounted into a tab group (a new tab beside it), the page and its record of the end kept.
    await page.keyboard.press('Control+Shift+KeyT')
    const tabs = page.getByTestId('tab')
    await expect(tabs).toHaveCount(2)
    await tabs.nth(0).click()
    await ready(page)
    await page.waitForTimeout(1500)
    await expect(tabs.nth(0)).not.toContainText('exited')
    const before = await sessionIds(page)
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.type('x')
    await page.waitForTimeout(1500)
    expect(await sessionIds(page)).toEqual(before)
  } finally {
    await launched.close()
  }
})

test('tabs behind another are not marked for the screen they get on coming back', async () => {
  // Found in review: after a reload, every shell tab behind another had a dot.
  const launched = await launch(undefined, { layout: TWO_TABS })
  const { page } = launched
  try {
    await ready(page)
    // Both shells up and quiet before the page comes back.
    await page.getByTestId('tab').nth(1).click()
    await ready(page)
    await page.getByTestId('tab').nth(0).click()
    await page.waitForTimeout(2000)
    await page.reload()
    await ready(page)
    await page.waitForTimeout(2000)
    await expect(page.getByTestId('tab-activity')).toHaveCount(0)
  } finally {
    await launched.close()
  }
})

test('a paste by the keyboard asks too, and only what is agreed reaches the shell', async () => {
  const launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  const { page } = launched
  try {
    await ready(page)
    const area = terminalPane(page).first().locator('.xterm-helper-textarea').first()
    await area.focus()
    const paste = (text: string) =>
      area.evaluate((el, value) => {
        const data = new DataTransfer()
        data.setData('text/plain', value)
        el.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
        )
      }, text)
    await paste('echo KEPT-OUT-1\necho KEPT-OUT-2')
    await expect(page.getByTestId('paste-dialog')).toBeVisible()
    const refused = listen(page, 2500)
    await page.getByTestId('paste-cancel').click()
    expect(await refused).not.toContain('KEPT-OUT')
    await paste('echo LET-IN-1\necho LET-IN-2')
    await expect(page.getByTestId('paste-dialog')).toBeVisible()
    const agreed = listen(page, 4000)
    await page.getByTestId('paste-go').click()
    expect(await agreed).toContain('LET-IN-2')
  } finally {
    await launched.close()
  }
})

test('an ended shell starts again on a key, not on the focus coming back to it', async () => {
  // Found in review: any data xterm sent restarted it - a focus report too, with no key pressed.
  const launched = await launch(undefined, { layout: TWO_TABS })
  const { page } = launched
  try {
    await ready(page)
    const tabs = page.getByTestId('tab')
    await typeInto(page, terminalPane(page).first(), 'exit')
    await expect(tabs.nth(0)).toContainText('exited', { timeout: 20_000 })
    const before = await sessionIds(page)
    await tabs.nth(1).click()
    await page.waitForTimeout(500)
    await tabs.nth(0).click()
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.waitForTimeout(1500)
    await expect(tabs.nth(0)).toContainText('exited')
    expect(await sessionIds(page)).toEqual(before)
  } finally {
    await launched.close()
  }
})
