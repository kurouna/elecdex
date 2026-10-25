import { appendFileSync, mkdtempSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect } from '@playwright/test'
import {
  choose,
  lamp,
  lines,
  logFolder,
  requestLines,
  rows,
  singleLog,
  stamp,
} from '../support/logwatch.js'
import { test } from '../support/shared.js'
import { clipboardText } from '../support/stub-hooks.js'
import {
  type AiStub,
  aiSettings,
  aiStub,
  firstOf,
  isChat,
  openaiProvider,
} from '../support/stubs/ai.js'
import {
  beside,
  bringWindowBack,
  launch,
  paneById,
  putWindowAway,
  quietFor,
  removeDir,
  savedLayout,
  tabbed,
  watching,
} from '../support.js'

/**
 * The LOG WATCH pane against log files written by the test in a temp folder (docs/logwatch.md).
 *
 * What only the running app shows: that main follows the file the picker returns (the picker is
 * replaced in main) and sends what is appended without being asked; that a pane behind another
 * tab reads nothing and, shown again, gets what was written meanwhile as the latest lines; that
 * the pane's switches take; and that EXPLAIN sends what it showed - the lines
 * chosen and nothing else - to the provider of the AI settings, a stand-in served here, and draws
 * the answer.
 */

let stub: AiStub

/** What EXPLAIN asked the stand-in: the system prompt and the text, in order. */
const asked = () =>
  stub.seen
    .filter(isChat)
    .map((entry) => ({ system: firstOf(entry, 'system'), text: firstOf(entry, 'user') }))

test.beforeAll(async () => {
  stub = await aiStub({
    openai: () => ({ pieces: ['The mail server ', 'refused the **connection**.'] }),
  })
})

test.afterAll(async () => {
  await stub.close()
})

test('follows a file, shows what is appended, and stops when the pane goes', async ({ shared }) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, requestLines(1, 3))
  const { app, page, close } = await shared({
    // A clock beside it, so the log's pane can close and leave a workspace.
    layout: beside('logwatch', { id: 'l', sizes: [70, 30] }),
  })
  try {
    await choose(page, app, file)
    await expect(rows(page)).toHaveCount(1)
    await expect(page.getByTestId('logwatch-reps')).toHaveText('×3')
    await expect(page.getByTestId('logwatch-where')).toContainText('app.log · text')

    appendFileSync(
      file,
      `${stamp()} ERROR mail to rin@example.com failed\n    at send (mail.js:1)\n    at run (job.js:2)\n`,
    )
    const error = rows(page).filter({ hasText: 'mail to' })
    await expect(error).toHaveAttribute('data-level', 'ERR', { timeout: 5000 })
    await expect(error.getByTestId('logwatch-new')).toBeVisible()
    await expect(page.getByTestId('logwatch-err')).toHaveText('1')
    await error.getByTestId('logwatch-more').click()
    await expect(page.getByTestId('logwatch-trace')).toContainText('at run (job.js:2)')

    // MASK hides the address in the row.
    await page.getByTestId('logwatch-mask').click()
    await expect(error).toContainText('mail to ••• failed')
    await page.getByTestId('logwatch-mask').click()

    // The filter; a bad expression keeps the last good one.
    await page.getByTestId('logwatch-filter').fill('/mail/')
    await expect(rows(page)).toHaveCount(1)
    await page.getByTestId('logwatch-filter').fill('/(/')
    await expect(page.getByTestId('logwatch-filter')).toHaveClass(/bad/)
    await expect(rows(page)).toHaveCount(1)
    await page.getByTestId('logwatch-filter').fill('')
    await expect(rows(page)).toHaveCount(2)

    expect(await watching(page, 'logwatch')).toHaveLength(1)
    await page.getByTestId('logwatch-tab-patterns').click()
    await expect(page.getByTestId('logwatch-pattern')).toHaveCount(2)
    await page.getByTestId('logwatch-pattern').first().getByTestId('logwatch-mute').click()
    await page.getByTestId('logwatch-tab-stream').click()
    await expect(rows(page)).toHaveCount(1)
    await expect(page.getByTestId('logwatch-muted')).toHaveText('1 MUTED')

    // The pane goes, and main stops watching the file.
    await paneById(page, 'l').getByTestId('pane-close').click()
    await expect(page.getByTestId('logwatch-row')).toHaveCount(0)
    await expect.poll(() => watching(page, 'logwatch')).toEqual([])
  } finally {
    await close()
    removeDir(dir)
  }
})

test('behind another tab nothing is read; shown again, what came meanwhile arrives as the latest lines', async ({
  shared,
}) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, requestLines(1, 1))
  const { app, page, close } = await shared({
    layout: tabbed(['logwatch', 'clock']),
  })
  const show = (id: string) => page.locator(`[data-testid=tab][data-pane-id=${id}]`).click()
  try {
    await choose(page, app, file)
    expect(await watching(page, 'logwatch')).toHaveLength(1)
    await show('clock')
    await expect.poll(() => watching(page, 'logwatch')).toEqual([])
    appendFileSync(file, '2026-10-12 12:00:02 ERROR one\n2026-10-12 12:00:03 WARN two\n')
    expect(await quietFor(1500, () => watching(page, 'logwatch'), 'what main watches')).toEqual([])
    await show('logwatch')
    await expect(rows(page)).toHaveCount(3, { timeout: 5000 })
    await expect(rows(page).last()).toContainText('two')
    // No banner of what came (user decision 2026-10-12): the lines, as any others.
    await expect(page.getByTestId('logwatch-mark')).toHaveCount(1)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('the chart and the error bar can be turned off, and stay off', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, requestLines(1, 2))
  let launched = await launch(undefined, {
    layout: singleLog(),
  })
  const { userData } = launched
  try {
    const { app, page } = launched
    await choose(page, app, file)
    await expect(page.getByTestId('logwatch-lanes')).toBeVisible()
    await expect(page.getByTestId('logwatch-errorbar')).toBeVisible()
    await page.getByTestId('logwatch-settings-toggle').click()
    await page.getByTestId('logwatch-chart-off').click()
    await page.getByTestId('logwatch-errorBar-off').click()
    await expect(page.getByTestId('logwatch-lanes')).toHaveCount(0)
    await expect(page.getByTestId('logwatch-errorbar')).toHaveCount(0)
    await page.getByTestId('logwatch-keep').filter({ hasText: '1k' }).click()
    await expect
      .poll(() =>
        page.evaluate(async () => (await window.elecdex.settings.get()).logWatch.keepLines),
      )
      .toBe(1000)

    // They stay off through a restart: the pane comes back on its file, without them.
    await expect
      .poll(() => (savedLayout(userData) ?? '').replace(/\s/g, ''))
      .toContain('"chart":false')
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('logwatch-where')).toContainText('app.log')
    await expect(launched.page.getByTestId('logwatch-lanes')).toHaveCount(0)
    await expect(launched.page.getByTestId('logwatch-errorbar')).toHaveCount(0)
  } finally {
    await launched.close()
    removeDir(userData)
    removeDir(dir)
  }
})

test('EXPLAIN shows what it will send - the lines chosen, only those - sends it on a press, and draws the answer', async ({
  shared,
}) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(
    file,
    `${requestLines(1, 2)}2026-10-12 12:00:09 ERROR mail to rin@example.com failed\n`,
  )
  stub.seen.length = 0
  const { app, page, close } = await shared({
    layout: singleLog({ mask: true }),
    settings: aiSettings([openaiProvider(stub.origin)], { systemPrompt: 'Answer briefly.' }),
  })
  try {
    await choose(page, app, file)
    await rows(page).filter({ hasText: 'mail to' }).click()
    await rows(page)
      .filter({ hasText: 'request 1' })
      .click({ modifiers: ['ControlOrMeta'] })
    await expect(page.getByTestId('logwatch-chosen')).toContainText('2 lines chosen')
    await page.getByTestId('logwatch-explain-open').click()
    const preview = page.getByTestId('logwatch-explain-preview')
    await expect(preview).toContainText('Explain these 2 log lines')
    await expect(preview).toContainText('mail to ••• failed')
    await expect(preview).toContainText('request 1 done')
    // The line between them was not chosen, and is not sent.
    await expect(preview).not.toContainText('request 2 done')
    expect(asked()).toHaveLength(0)
    const shown = await preview.textContent()
    await page.getByTestId('logwatch-explain-send').click()
    await expect(page.getByTestId('logwatch-explain-answer')).toContainText(
      'The mail server refused the connection.',
    )
    expect(asked()).toHaveLength(1)
    // What was sent is what was shown.
    expect(asked()[0]?.text).toBe(shown)
    expect(asked()[0]?.text).not.toContain('example.com')
    expect(asked()[0]?.system).toContain('Answer briefly.')
  } finally {
    await close()
    removeDir(dir)
  }
})

/*
 * At the edges: a file rotated, deleted and made again, a pattern followed to a newer file, the
 * window put away, COPY through main, a file chosen again from RECENT, and EXPLAIN when nobody
 * answers.
 */

const folder = () => logFolder('elecdex-logwatch-edges-')
const single = singleLog

test('follows a file through a rotation, a deletion and its making again', async ({ shared }) => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 2))
  const { app, page, close } = await shared({ layout: single({ fold: false }) })
  try {
    await choose(page, app, file)
    renameSync(file, `${file}.1`)
    writeFileSync(file, lines(1, 1, 'rotated'))
    await expect(page.locator('[data-testid=logwatch-mark][data-mark=rotated]')).toHaveCount(1, {
      timeout: 5000,
    })
    await expect(rows(page).last()).toContainText('rotated 1')
    unlinkSync(file)
    await expect(lamp(page)).toContainText('WAITING FOR FILE', { timeout: 5000 })
    writeFileSync(file, lines(1, 1, 'again'))
    await expect(lamp(page)).toContainText('LIVE', { timeout: 5000 })
    await expect(rows(page).last()).toContainText('again 1')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('follows the newest file like the one chosen, and moves on to a newer one', async ({
  shared,
}) => {
  const { dir } = folder()
  const first = path.join(dir, 'app-20261011.log')
  writeFileSync(first, lines(1, 1, 'monday'))
  const { app, page, close } = await shared({ layout: single() })
  try {
    await choose(page, app, first, true)
    await expect(page.getByTestId('logwatch-where')).toContainText('app-20261011.log')
    writeFileSync(path.join(dir, 'app-20261012.log'), lines(1, 1, 'tuesday'))
    await expect(page.locator('[data-testid=logwatch-mark][data-mark=switched]')).toContainText(
      'app-20261012.log',
      { timeout: 15_000 },
    )
    await expect(rows(page).last()).toContainText('tuesday 1')
    await expect(page.getByTestId('logwatch-where')).toContainText('app-20261012.log')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('with the window put away nothing is read, and on coming back the gap arrives as lines', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const { app, page, close } = await launch(undefined, { layout: single({ fold: false }) })
  try {
    await choose(page, app, file)
    await putWindowAway(app, page)
    await expect.poll(() => watching(page, 'logwatch'), { timeout: 10_000 }).toEqual([])
    appendFileSync(file, lines(2, 3))
    expect(await quietFor(1500, () => watching(page, 'logwatch'), 'what main watches')).toEqual([])
    await bringWindowBack(app, page)
    await expect(rows(page).last()).toContainText('line 3', { timeout: 10_000 })
    await expect(rows(page)).toHaveCount(3)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('copies the chosen line through main, masked when MASK is on', async ({ shared }) => {
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR mail to rin@example.com failed\n    at send (a.js:1)\n`)
  const { app, page, close } = await shared({ layout: single({ mask: true }) })
  const copied = () => clipboardText(app)
  try {
    await choose(page, app, file)
    await rows(page).first().click()
    await page.getByTestId('logwatch-copy').click()
    await expect(page.getByTestId('logwatch-copy')).toHaveText('COPIED')
    const text = (await copied()) ?? ''
    expect(text).toContain('mail to ••• failed')
    expect(text).toContain('at send (a.js:1)')
    expect(text).not.toContain('example.com')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('chooses a file again from RECENT', async ({ shared }) => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const other = path.join(dir, 'other.log')
  writeFileSync(other, lines(1, 1, 'other'))
  const { app, page, close } = await shared({ layout: single() })
  try {
    await choose(page, app, file)
    await page.getByTestId('logwatch-settings-toggle').click()
    await page.getByTestId('logwatch-change').click()
    await choose(page, app, other)
    await expect(rows(page).first()).toContainText('other 1')
    await page.getByTestId('logwatch-settings-toggle').click()
    await page.getByTestId('logwatch-change').click()
    await page.getByTestId('logwatch-recent').filter({ hasText: 'app.log' }).click()
    await expect(rows(page).first()).toContainText('line 1', { timeout: 5000 })
  } finally {
    await close()
    removeDir(dir)
  }
})

test('says EXPLAIN failed, in the link words with the reason, when nobody answers', async ({
  shared,
}) => {
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR boom\n`)
  // A port free a moment ago, so nobody answers there (Chromium refuses the well-known ones).
  const port = await new Promise<number>((resolve) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => resolve(typeof address === 'object' && address !== null ? address.port : 1))
    })
  })
  const { app, page, close } = await shared({
    layout: single(),
    settings: aiSettings([
      openaiProvider(`http://127.0.0.1:${port}`, { id: 'down', name: 'Down', model: 'm' }),
    ]),
  })
  try {
    await choose(page, app, file)
    await rows(page).first().click()
    await page.getByTestId('logwatch-explain-open').click()
    await page.getByTestId('logwatch-explain-send').click()
    await expect(page.getByTestId('logwatch-explain-failure')).toContainText(
      'FAILED · no carrier',
      {
        timeout: 15_000,
      },
    )
    await expect(page.getByTestId('logwatch-explain-stop')).toHaveCount(0)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('the level switches, PAUSE and WRAP change what is shown, and stay with the pane', async ({
  shared,
}) => {
  const { dir, file } = folder()
  const long = 'x'.repeat(1500)
  writeFileSync(
    file,
    `${stamp()} DEBUG quiet\n${stamp()} INFO said\n${stamp()} ERROR broke ${long}\n`,
  )
  const { app, page, close } = await shared({ layout: single({ fold: false }) })
  const level = (group: string) => page.getByTestId('logwatch-level').filter({ hasText: group })
  try {
    await choose(page, app, file)
    // DBG is off until switched on.
    await expect(rows(page)).toHaveCount(2)
    await level('DBG').click()
    await expect(rows(page)).toHaveCount(3)
    await level('ERR').click()
    await expect(rows(page)).toHaveCount(2)
    await expect(level('ERR')).toHaveAttribute('aria-pressed', 'false')
    await level('ERR').click()
    // PAUSE holds the stream while lines keep coming.
    await page.getByTestId('logwatch-pause').click()
    appendFileSync(file, `${stamp()} INFO later\n`)
    await expect(lamp(page)).toContainText('PAUSED · 1 HELD', { timeout: 5000 })
    await expect(rows(page)).toHaveCount(3)
    await page.getByTestId('logwatch-pause').click()
    await expect(rows(page)).toHaveCount(4)
    // WRAP lets the long line take several lines, and the row after it starts below it: the
    // lines a row takes are counted, not measured, and the count must be right.
    const broke = rows(page).filter({ hasText: 'broke' })
    const after = rows(page).filter({ hasText: 'later' })
    const before = (await broke.boundingBox())?.height ?? 0
    await page.getByTestId('logwatch-wrap').click()
    await expect
      .poll(async () => (await broke.boundingBox())?.height ?? 0)
      .toBeGreaterThan(before * 3)
    const box = await broke.boundingBox()
    const next = await after.boundingBox()
    expect(next?.y ?? 0).toBeGreaterThanOrEqual((box?.y ?? 0) + (box?.height ?? 0) - 1)
    // The pane's choices are kept with it.
    // (saved a moment after the change, as every layout change is)
    const state = () =>
      page.evaluate(async () => {
        const tree = (await window.elecdex.layout.load()) as {
          root: { state?: Record<string, unknown> }
        } | null
        return tree?.root.state ?? {}
      })
    await expect.poll(state, { timeout: 5000 }).toMatchObject({ hidden: [], wrap: true })
  } finally {
    await close()
    removeDir(dir)
  }
})

test('without an AI provider, EXPLAIN says where to set one up, and goes there', async ({
  shared,
}) => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const { app, page, close } = await shared({ layout: single() })
  try {
    await choose(page, app, file)
    await expect(page.getByTestId('logwatch-hint')).toContainText('click lines')
    await rows(page).first().click()
    // Copy is there, EXPLAIN itself is not: only the way to set a provider up.
    await expect(page.getByTestId('logwatch-copy')).toBeVisible()
    await expect(page.getByTestId('logwatch-explain-open')).toHaveCount(0)
    await page.getByTestId('logwatch-explain-setup').click()
    await expect(page.getByTestId('settings-dialog')).toBeVisible()
    await expect(page.locator('[data-testid=settings-section][data-section=ai]')).toHaveAttribute(
      'aria-current',
      'page',
    )
  } finally {
    await close()
    removeDir(dir)
  }
})

test('keeps COPY, CLEAR and EXPLAIN inside a narrow pane with lines chosen', async ({ shared }) => {
  // Found in review: the footer did not wrap or give way, and EXPLAIN went off the pane's edge.
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR first trouble\n${stamp()} WARN second trouble\n`)
  const { app, page, close } = await shared({
    layout: beside('logwatch', { id: 'l', state: { fold: false }, sizes: [0.15, 0.85] }),
    settings: aiSettings([
      openaiProvider('http://127.0.0.1:1', { id: 'p', name: 'P', model: 'm' }),
    ]),
  })
  try {
    await choose(page, app, file)
    await rows(page).filter({ hasText: 'first' }).click()
    await rows(page)
      .filter({ hasText: 'second' })
      .click({ modifiers: ['ControlOrMeta'] })
    const pane = await page.locator('[data-testid=pane][data-widget=logwatch]').boundingBox()
    expect(pane?.width ?? 0).toBeLessThan(480)
    for (const id of ['logwatch-clear', 'logwatch-copy', 'logwatch-explain-open']) {
      const box = await page.getByTestId(id).boundingBox()
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        (pane?.x ?? 0) + (pane?.width ?? 0),
      )
    }
  } finally {
    await close()
    removeDir(dir)
  }
})
