import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * The GIT, ORBIT and AGENT panes do nothing while nobody sees them: not added,
 * or behind another tab. Main watches no repository, no Claude Code folder and
 * asks CelesTrak for nothing; the page changes nothing in them (no clock, no
 * pulse, no Starlink slice). Shown again, each takes up where it was.
 */

const ID = '11111111-2222-3333-4444-555555555555'

function repo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-hidden-git-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.test')
  git('config', 'user.name', 'Test')
  writeFileSync(path.join(dir, 'a.txt'), 'one\n')
  git('add', '.')
  git('commit', '-q', '-m', 'first')
  writeFileSync(path.join(dir, 'a.txt'), 'two\n')
  return dir
}

/** A Claude Code folder with one busy session, whose process is this test's own. */
function claudeFolder(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-hidden-claude-'))
  const work = path.join(dir, 'work')
  mkdirSync(path.join(dir, 'sessions'))
  mkdirSync(path.join(dir, 'projects', 'work'), { recursive: true })
  mkdirSync(work)
  writeFileSync(
    path.join(dir, 'sessions', `${process.pid}.json`),
    JSON.stringify({
      pid: process.pid,
      sessionId: ID,
      cwd: work,
      name: 'Busy',
      status: 'busy',
      startedAt: Date.now() - 60_000,
      updatedAt: Date.now(),
    }),
  )
  writeFileSync(path.join(dir, 'projects', 'work', `${ID}.jsonl`), '')
  return dir
}

/** What main is doing for the three panes. */
const watching = (page: Page) =>
  page.evaluate(async () => ({
    git: await window.elecdex.git.watching(),
    orbits: await window.elecdex.orbits.watching(),
    agents: await window.elecdex.agents.watching(),
  }))

const IDLE = { git: [], orbits: [], agents: false }

/** Every change the page makes inside the three panes for `ms`, counted. */
const mutationsIn = (page: Page, ms: number) =>
  page.evaluate(async (wait) => {
    let count = 0
    const observer = new MutationObserver((records) => {
      count += records.length
    })
    for (const id of ['g', 'o', 'a']) {
      const pane = document.querySelector(`[data-testid=pane][data-pane-id=${id}]`)
      if (pane !== null)
        observer.observe(pane, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        })
    }
    await new Promise((resolve) => setTimeout(resolve, wait))
    observer.disconnect()
    return count
  }, ms)

test('not added, the three panes cost nothing', async () => {
  const claude = claudeFolder()
  const { page, close } = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'c', widget: 'clock' } },
    env: { ELECDEX_CLAUDE_DIR: claude },
  })
  try {
    await expect(page.getByTestId('pane')).toHaveCount(1)
    await page.waitForTimeout(1500)
    expect(await watching(page)).toEqual(IDLE)
  } finally {
    await close()
    removeDir(claude)
  }
})

test('behind another tab, the three panes do nothing, and take up again when shown', async () => {
  const dir = repo()
  const claude = claudeFolder()
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'tabs',
        id: 't',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'g', widget: 'git' },
          { kind: 'pane', id: 'o', widget: 'orbit', state: { starlink: true } },
          { kind: 'pane', id: 'a', widget: 'agents' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
    env: { ELECDEX_CLAUDE_DIR: claude },
  })
  const show = (id: string) => page.locator(`[data-testid=tab][data-pane-id=${id}]`).click()
  try {
    // Each, while shown, is at work.
    await app.evaluate(({ dialog }, answer) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [answer] })) as never
    }, dir)
    await page.getByTestId('git-select').click()
    await expect(page.locator('[data-testid="git-file"][data-path="a.txt"]')).toBeVisible({
      timeout: 10_000,
    })
    expect((await watching(page)).git).toHaveLength(1)
    await show('o')
    await expect
      .poll(async () => (await watching(page)).orbits.sort())
      .toEqual(['starlink', 'stations'])
    await show('a')
    await expect(page.getByTestId('agent-card')).toHaveCount(1, { timeout: 10_000 })
    expect((await watching(page)).agents).toBe(true)

    // Behind the clock, all three stop: in main, and in the page.
    await show('c')
    await expect.poll(() => watching(page), { timeout: 10_000 }).toEqual(IDLE)
    expect(await mutationsIn(page, 3000)).toBe(0)

    // Shown again, each is as it was and at work again.
    await show('g')
    await expect(page.locator('[data-testid="git-file"][data-path="a.txt"]')).toBeVisible()
    await expect.poll(async () => (await watching(page)).git).toHaveLength(1)
    await show('a')
    await expect(page.getByTestId('agent-card')).toHaveCount(1)
    await expect.poll(async () => (await watching(page)).agents).toBe(true)
  } finally {
    await close()
    removeDir(dir)
    removeDir(claude)
  }
})
