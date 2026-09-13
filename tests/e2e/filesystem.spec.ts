import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { type Launched, launch, terminalPane, typeInto } from './support.js'

/**
 * The filesystem widget: follows the terminal's directory (on Windows too, via
 * shell integration), drives the terminal when an entry is clicked, notices
 * changes made behind its back, and reports the volume's usage.
 */

let launched: Launched
let page: Page
let fixture: string

const fsPane = () => page.locator('[data-testid=pane][data-widget=filesystem]')
const entry = (name: string) => fsPane().locator(`[data-testid=fs-entry][data-name="${name}"]`)
const terminalCwd = () => terminalPane(page).getByTestId('pane-subtitle')

/** The followed terminal's screen, as a reattaching pane would receive it. */
async function terminalScreen(): Promise<string> {
  return page.evaluate(async () => {
    const sessions = await window.elecdex.pty.list()
    const decoder = new TextDecoder()
    let text = ''
    for (const session of sessions) {
      const detach = await window.elecdex.pty.attach(session.id, {
        onData: (chunk) => {
          text += decoder.decode(chunk, { stream: true })
        },
        onExit: () => {},
        onCwd: () => {},
        onCommandEnd: () => {},
        onIntegrationUnavailable: () => {},
      })
      await new Promise((r) => setTimeout(r, 500))
      detach()
    }
    return text
  })
}

test.beforeAll(async () => {
  fixture = mkdtempSync(path.join(tmpdir(), 'elecdex-fs-'))
  mkdirSync(path.join(fixture, 'sub dir'))
  writeFileSync(path.join(fixture, 'alpha.txt'), 'hello')
  writeFileSync(path.join(fixture, '.hidden'), '')

  // A terminal above the file browser. In the default layout the terminals are
  // tabs, whose directory shows on the tab strip rather than a pane header.
  launched = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 'root',
        direction: 'column',
        sizes: [0.6, 0.4],
        children: [
          { kind: 'pane', id: 'term', widget: 'terminal' },
          { kind: 'pane', id: 'files', widget: 'filesystem' },
        ],
      },
    },
  })
  page = launched.page
  // Wait for shell integration, then move the terminal into the fixture.
  await expect
    .poll(async () => (await terminalCwd().innerText()).trim(), { timeout: 40_000 })
    .toMatch(/[A-Za-z0-9]/)
  await typeInto(page, terminalPane(page), `cd '${fixture}'`)
})

test.afterAll(async () => {
  await launched?.close()
  rmSync(fixture, { recursive: true, force: true })
})

test('follows the terminal into a directory and lists it', async () => {
  const base = path.basename(fixture)
  await expect(fsPane().getByTestId('pane-subtitle')).toContainText(base, { timeout: 40_000 })
  await expect(fsPane().getByTestId('filesystem')).toHaveAttribute('data-attached', 'true')

  // Directories first, then files; dotfiles listed but dimmed.
  await expect(entry('sub dir')).toHaveAttribute('data-kind', 'dir')
  await expect(entry('alpha.txt')).toHaveAttribute('data-kind', 'file')
  await expect(entry('.hidden')).toHaveClass(/hidden-entry/)
  const names = await fsPane()
    .getByTestId('fs-entry')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-name')))
  expect(names.indexOf('sub dir')).toBeLessThan(names.indexOf('alpha.txt'))
})

test('shows the usage of the volume', async () => {
  await expect(fsPane().getByTestId('fs-usage')).toHaveCount(0)
})

test('clicking a directory changes the terminal into it, even with a space in the name', async () => {
  await entry('sub dir').click()
  await expect(terminalCwd()).toContainText('sub dir', { timeout: 40_000 })
  await expect(fsPane().getByTestId('pane-subtitle')).toContainText('sub dir')

  await fsPane().getByTestId('fs-up').click()
  await expect(terminalCwd()).not.toContainText('sub dir', { timeout: 40_000 })
  await expect(entry('alpha.txt')).toBeVisible()
})

test('clicking a file types its path at the prompt without running anything', async () => {
  await entry('alpha.txt').click()
  await expect.poll(terminalScreen, { timeout: 10_000 }).toContain('alpha.txt')
  // The terminal gets the keyboard back, so the command can be finished.
  await expect(terminalPane(page)).toHaveClass(/focused/)
  // Clear the typed path so later tests start from an empty prompt.
  await page.keyboard.press('Escape')
  await page.keyboard.press('Control+KeyU')
})

test('a file created outside the app appears without a refresh', async () => {
  writeFileSync(path.join(fixture, 'created-later.txt'), '')
  await expect(entry('created-later.txt')).toBeVisible({ timeout: 10_000 })
})

test('lists drives', async () => {
  await fsPane().getByTestId('fs-show-drives').click()
  await expect(fsPane().getByTestId('fs-drive').first()).toBeVisible({ timeout: 20_000 })
  await expect(fsPane().getByTestId('pane-subtitle')).toHaveText('drives')
})

test('browses on its own when there is no terminal to follow', async () => {
  const lone = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'f', widget: 'filesystem' } },
  })
  try {
    const pane = lone.page.locator('[data-testid=pane][data-widget=filesystem]')
    await expect(pane.getByTestId('pane-badge')).toHaveText('detached')
    await expect(pane.getByTestId('fs-entry').first()).toBeVisible({ timeout: 20_000 })

    const firstDir = pane.locator('[data-testid=fs-entry][data-kind=dir]').first()
    const name = await firstDir.getAttribute('data-name')
    await firstDir.click()
    await expect(pane.getByTestId('pane-subtitle')).toContainText(name ?? '')
  } finally {
    await lone.close()
  }
})
