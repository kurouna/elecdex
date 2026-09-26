import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * The GIT, ORBIT and AI AGENT panes do nothing while nobody sees them: not added,
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

/** Every built-in pane (builtins.ts), each behind the clock in one tab group. */
const WIDGETS = [
  'terminal',
  'sysinfo',
  'cpu',
  'memory',
  'disk',
  'toplist',
  'netstat',
  'connections',
  'wifi',
  'throughput',
  'filesystem',
  'weather',
  'globe',
  'launcher',
  'markets',
  'aichat',
  'elec',
  'git',
  'agents',
  'orbit',
  'rss',
  'quakes',
  'calendar',
  'spectrum',
  'mixer',
  'calc',
  'notes',
  'todo',
  'timer',
  'clipboard',
  'nowplaying',
]

/** The sources a pane behind a tab keeps (builtins.ts `keepWhileHidden`): charts, and once-only readings. */
const KEPT = [
  'cpu.info',
  'cpu.load',
  'hardware.system',
  'mem.swap',
  'mem.usage',
  'net.throughput',
  'os.info',
]

/**
 * The readings collected once per collector (scheduler.ts), which a pane behind a tab keeps
 * (`keepWhileHidden`) so its row never blanks: the first of each fills the row wherever the pane
 * is, and that is the start, not a change.
 */
const ONCE = ['cpu.info', 'hardware.system', 'os.info']

test('behind another tab, no built-in pane changes anything or has main fetch for it', async () => {
  test.setTimeout(120_000)
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'tabs',
        id: 't',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'p-clock', widget: 'clock' },
          ...WIDGETS.map((widget) => ({
            kind: 'pane',
            id: `p-${widget}`,
            widget,
            ...(widget === 'rss' ? { state: { feeds: ['http://127.0.0.1:9/feed.xml'] } } : {}),
          })),
        ],
      },
    },
  })
  const main = () =>
    page.evaluate(async () => ({
      metrics: (await window.elecdex.metrics.stats()).active,
      weather: await window.elecdex.weather.watching(),
      markets: await window.elecdex.markets.watching(),
      feeds: await window.elecdex.feeds.watching(),
      orbits: await window.elecdex.orbits.watching(),
      git: await window.elecdex.git.watching(),
      agents: await window.elecdex.agents.watching(),
      clipboard: await window.elecdex.clipboard.watching(),
      nowPlaying: await window.elecdex.nowPlaying.watching(),
    }))
  try {
    await expect(page.getByTestId('pane')).toHaveCount(WIDGETS.length + 1)
    // Only what a chart needs goes on: no forecast, quote, feed or orbit is asked for.
    await expect.poll(main, { timeout: 20_000 }).toEqual({
      metrics: KEPT,
      weather: [],
      markets: [],
      feeds: [],
      orbits: [],
      git: [],
      agents: false,
      clipboard: false,
      nowPlaying: false,
    })
    // Once the start is over (a shell's first prompt, the launcher's catalog, the one-off readings),
    // the page writes nothing into any of them: no figure, no clock, no pulse. The one-off readings
    // are waited for, not timed: on a busy machine the OS version and the machine's model took
    // longer than the six seconds below, landed in the watched window, and failed the check.
    await expect
      .poll(
        async () => {
          const { collections } = await page.evaluate(() => window.elecdex.metrics.stats())
          return ONCE.filter((id) => !((collections as Record<string, number>)[id] ?? 0))
        },
        { timeout: 60_000 },
      )
      .toEqual([])
    await page.waitForTimeout(6000)
    const changed = await page.evaluate(async (widgets) => {
      const counts: Record<string, number> = {}
      const observers = widgets.map((widget) => {
        counts[widget] = 0
        const observer = new MutationObserver((records) => {
          counts[widget] = (counts[widget] ?? 0) + records.length
        })
        const pane = document.querySelector(`[data-testid=pane][data-pane-id=p-${widget}]`)
        if (pane !== null)
          observer.observe(pane, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          })
        return observer
      })
      await new Promise((resolve) => setTimeout(resolve, 4000))
      for (const observer of observers) observer.disconnect()
      return Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0))
    }, WIDGETS)
    expect(changed).toEqual({})

    // Shown, each asks again for what it shows.
    await page.locator('[data-testid=tab][data-pane-id=p-weather]').click()
    await expect.poll(async () => (await main()).weather).toHaveLength(1)
    await page.locator('[data-testid=tab][data-pane-id=p-markets]').click()
    await expect.poll(async () => (await main()).markets.length).toBeGreaterThan(0)
    await expect.poll(async () => (await main()).weather).toEqual([])
    await page.locator('[data-testid=tab][data-pane-id=p-rss]').click()
    await expect.poll(async () => (await main()).feeds).toEqual(['http://127.0.0.1:9/feed.xml'])
    await expect.poll(async () => (await main()).markets).toEqual([])
  } finally {
    await close()
  }
})

/** The panes that fetch or write only for the eye, side by side, all on screen. */
const FOR_THE_EYE = [
  'git',
  'orbit',
  'agents',
  'weather',
  'markets',
  'rss',
  'cpu',
  'memory',
  'toplist',
  'wifi',
  'clipboard',
  'nowplaying',
]
const FEED = 'http://127.0.0.1:9/feed.xml'

test('minimised, the panes stop what they do for the eye, and take it up again when restored', async () => {
  test.setTimeout(120_000)
  const dir = repo()
  const claude = claudeFolder()
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: FOR_THE_EYE.map(() => 100 / FOR_THE_EYE.length),
        children: FOR_THE_EYE.map((widget) => ({
          kind: 'pane',
          id: `p-${widget}`,
          widget,
          ...(widget === 'rss' ? { state: { feeds: [FEED] } } : {}),
        })),
      },
    },
    env: { ELECDEX_CLAUDE_DIR: claude },
  })
  const main = () =>
    page.evaluate(async () => ({
      metrics: (await window.elecdex.metrics.stats()).active,
      weather: (await window.elecdex.weather.watching()).length,
      markets: (await window.elecdex.markets.watching()).length,
      feeds: await window.elecdex.feeds.watching(),
      orbits: await window.elecdex.orbits.watching(),
      git: (await window.elecdex.git.watching()).length,
      agents: await window.elecdex.agents.watching(),
      clipboard: await window.elecdex.clipboard.watching(),
      nowPlaying: await window.elecdex.nowPlaying.watching(),
    }))
  const atWork = async () => {
    const now = await main()
    return (
      now.metrics.includes('proc.list') &&
      now.metrics.includes('net.wifi') &&
      now.weather === 1 &&
      now.markets > 0 &&
      now.feeds.length === 1 &&
      now.orbits.length === 1 &&
      now.git === 1 &&
      now.agents &&
      now.clipboard &&
      now.nowPlaying
    )
  }
  const windowTo = (how: 'minimize' | 'restore') =>
    app.evaluate(({ BrowserWindow }, action) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.isVisible() || w.isMinimized())
      if (action === 'minimize') win?.minimize()
      else win?.restore()
    }, how)
  try {
    await app.evaluate(({ dialog }, answer) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [answer] })) as never
    }, dir)
    await page.getByTestId('git-select').click()
    await expect.poll(atWork, { timeout: 20_000 }).toBe(true)

    await windowTo('minimize')
    // Only the charts' samples go on, so the graphs have no gap when the window is back.
    await expect.poll(main, { timeout: 10_000 }).toEqual({
      metrics: ['cpu.info', 'cpu.load', 'mem.swap', 'mem.usage'],
      weather: 0,
      markets: 0,
      feeds: [],
      orbits: [],
      git: 0,
      agents: false,
      clipboard: false,
      nowPlaying: false,
    })
    const writes = await page.evaluate(async (widgets) => {
      let count = 0
      const observer = new MutationObserver((records) => {
        count += records.length
      })
      for (const widget of widgets) {
        const pane = document.querySelector(`[data-testid=pane][data-pane-id=p-${widget}]`)
        if (pane !== null)
          observer.observe(pane, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          })
      }
      await new Promise((resolve) => setTimeout(resolve, 4000))
      observer.disconnect()
      return count
    }, FOR_THE_EYE)
    expect(writes).toBe(0)

    // Restored, every one of them is at work again, and what it showed is still there.
    await windowTo('restore')
    await expect.poll(atWork, { timeout: 20_000 }).toBe(true)
    await expect(page.locator('[data-testid="git-file"][data-path="a.txt"]')).toBeVisible()
    await expect(page.getByTestId('agent-card')).toHaveCount(1)
  } finally {
    await close()
    removeDir(dir)
    removeDir(claude)
  }
})
