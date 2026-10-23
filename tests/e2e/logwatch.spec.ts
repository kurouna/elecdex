import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch, pickerAnswers, removeDir, savedLayout } from './support.js'

/**
 * The LOG WATCH pane against log files written by the test in a temp folder (docs/logwatch.md).
 *
 * What only the running app shows: that main follows the file the picker returns (the picker is
 * replaced in main) and sends what is appended without being asked; that a pane behind another
 * tab reads nothing and, shown again, gets what was written meanwhile as the latest lines; that
 * the encoding and the pane's switches take; and that EXPLAIN sends what it showed - the lines
 * chosen and nothing else - to the provider of the AI settings, a stand-in served here, and draws
 * the answer.
 */

let server: Server
let origin: string
const asked: { system: string; text: string }[] = []

test.beforeAll(async () => {
  server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      if (req.url !== '/v1/chat/completions') {
        res.writeHead(404).end('{}')
        return
      }
      const parsed = JSON.parse(body) as { messages: { role: string; content: string }[] }
      asked.push({
        system: parsed.messages.find((m) => m.role === 'system')?.content ?? '',
        text: parsed.messages.find((m) => m.role === 'user')?.content ?? '',
      })
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      for (const piece of ['The mail server ', 'refused the **connection**.']) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
      }
      res.end('data: [DONE]\n\n')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
})

const lines = (from: number, to: number): string =>
  Array.from(
    { length: to - from + 1 },
    (_, i) => `2026-10-12 12:00:00 INFO request ${from + i} done\n`,
  ).join('')

/** Now, as a log writes it: the five minutes' figures count by the log's own time. */
function stamp(): string {
  const t = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`
}

const watching = (page: Page) => page.evaluate(() => window.elecdex.logwatch.watching())
const rows = (page: Page) => page.getByTestId('logwatch-row')

async function choose(page: Page, app: ElectronApplication, file: string): Promise<void> {
  await pickerAnswers(app, file)
  await page.getByTestId('logwatch-select').click()
  await expect(page.getByTestId('logwatch-lamp')).toContainText('LIVE', { timeout: 10_000 })
}

test('follows a file, shows what is appended, and stops when the pane goes', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, lines(1, 3))
  const { app, page, close } = await launch(undefined, {
    // A clock beside it, so the log's pane can close and leave a workspace.
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [70, 30],
        children: [
          { kind: 'pane', id: 'l', widget: 'logwatch' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
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

    expect(await watching(page)).toHaveLength(1)
    await page.getByTestId('logwatch-tab-patterns').click()
    await expect(page.getByTestId('logwatch-pattern')).toHaveCount(2)
    await page.getByTestId('logwatch-pattern').first().getByTestId('logwatch-mute').click()
    await page.getByTestId('logwatch-tab-stream').click()
    await expect(rows(page)).toHaveCount(1)
    await expect(page.getByTestId('logwatch-muted')).toHaveText('1 MUTED')

    // The pane goes, and main stops watching the file.
    await page.locator('[data-testid="pane"][data-pane-id="l"]').getByTestId('pane-close').click()
    await expect(page.getByTestId('logwatch-row')).toHaveCount(0)
    await expect.poll(() => watching(page)).toEqual([])
  } finally {
    await close()
    removeDir(dir)
  }
})

test('behind another tab nothing is read; shown again, what came meanwhile arrives as the latest lines', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, lines(1, 1))
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'tabs',
        id: 't',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'l', widget: 'logwatch' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
  })
  const show = (id: string) => page.locator(`[data-testid=tab][data-pane-id=${id}]`).click()
  try {
    await choose(page, app, file)
    expect(await watching(page)).toHaveLength(1)
    await show('c')
    await expect.poll(() => watching(page)).toEqual([])
    appendFileSync(file, '2026-10-12 12:00:02 ERROR one\n2026-10-12 12:00:03 WARN two\n')
    await page.waitForTimeout(1500)
    expect(await watching(page)).toEqual([])
    await show('l')
    await expect(rows(page)).toHaveCount(3, { timeout: 5000 })
    await expect(rows(page).last()).toContainText('two')
    // No banner of what came (user decision 2026-10-12): the lines, as any others.
    await expect(page.getByTestId('logwatch-mark')).toHaveCount(1)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('reads Shift_JIS once told, and says when the text looks garbled', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'tool.log')
  // 「接続に失敗しました」 in Shift_JIS, after a level; mixed with enough to look garbled as UTF-8.
  const sjis = Buffer.from([
    0x45, 0x52, 0x52, 0x4f, 0x52, 0x20, 0x90, 0xda, 0x91, 0xb1, 0x82, 0xc9, 0x8e, 0xb8, 0x94, 0x73,
    0x82, 0xb5, 0x82, 0xdc, 0x82, 0xb5, 0x82, 0xbd, 0x0a,
  ])
  writeFileSync(file, Buffer.concat(Array.from({ length: 30 }, () => sjis)))
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: { kind: 'pane', id: 'l', widget: 'logwatch', state: { encoding: 'utf-8' } },
    },
  })
  try {
    await choose(page, app, file)
    await expect(page.getByTestId('logwatch-garbled')).toBeVisible()
    await page.getByTestId('logwatch-garbled').click()
    await page.getByTestId('logwatch-encoding').selectOption('auto')
    await expect(rows(page).first()).toContainText('接続に失敗しました', { timeout: 5000 })
    await expect(page.getByTestId('logwatch-where')).toContainText('auto · Shift_JIS')
    await expect(page.getByTestId('logwatch-garbled')).toHaveCount(0)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('the chart and the error bar can be turned off, and stay off', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, lines(1, 2))
  let launched = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 'l', widget: 'logwatch' } },
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

test('EXPLAIN shows what it will send - the lines chosen, only those - sends it on a press, and draws the answer', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-'))
  const file = path.join(dir, 'app.log')
  writeFileSync(file, `${lines(1, 2)}2026-10-12 12:00:09 ERROR mail to rin@example.com failed\n`)
  asked.length = 0
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: { kind: 'pane', id: 'l', widget: 'logwatch', state: { mask: true } },
    },
    settings: {
      sound: { enabled: false },
      ai: {
        systemPrompt: 'Answer briefly.',
        providers: [
          { id: 'local', name: 'Local', kind: 'openai', baseUrl: `${origin}/v1`, model: 'tiny' },
        ],
      },
    },
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
    expect(asked).toHaveLength(0)
    const shown = await preview.textContent()
    await page.getByTestId('logwatch-explain-send').click()
    await expect(page.getByTestId('logwatch-explain-answer')).toContainText(
      'The mail server refused the connection.',
    )
    expect(asked).toHaveLength(1)
    // What was sent is what was shown.
    expect(asked[0]?.text).toBe(shown)
    expect(asked[0]?.text).not.toContain('example.com')
    expect(asked[0]?.system).toContain('Answer briefly.')
  } finally {
    await close()
    removeDir(dir)
  }
})
