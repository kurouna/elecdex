import { appendFileSync, mkdtempSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * LOG WATCH in the running app at the edges (docs/logwatch.md): a file rotated, deleted and made
 * again, a pattern followed to a newer file, an id this machine does not know, the window put
 * away, COPY, the dialect and the time shown changed, a file chosen again from RECENT, and
 * EXPLAIN when nobody answers. Logs are written by the test in a temp folder; the picker is
 * replaced in main.
 */

const stamp = (): string => {
  const t = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`
}
const lines = (from: number, to: number, word = 'line'): string =>
  Array.from({ length: to - from + 1 }, (_, i) => `${stamp()} INFO ${word} ${from + i}\n`).join('')

async function pickerAnswers(app: ElectronApplication, file: string): Promise<void> {
  await app.evaluate(({ dialog }, answer) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [answer] })) as never
  }, file)
}

const single = (state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'l', widget: 'logwatch', ...(state ? { state } : {}) },
})
const rows = (page: Page) => page.getByTestId('logwatch-row')
const lamp = (page: Page) => page.getByTestId('logwatch-lamp')
const watching = (page: Page) => page.evaluate(() => window.elecdex.logwatch.watching())

async function choose(page: Page, app: ElectronApplication, file: string, newest = false) {
  await pickerAnswers(app, file)
  await page.getByTestId(newest ? 'logwatch-select-newest' : 'logwatch-select').click()
  await expect(lamp(page)).toContainText('LIVE', { timeout: 10_000 })
}

function folder(): { dir: string; file: string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-logwatch-edges-'))
  return { dir, file: path.join(dir, 'app.log') }
}

test('follows a file through a rotation, a deletion and its making again', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 2))
  const { app, page, close } = await launch(undefined, { layout: single({ fold: false }) })
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

test('follows the newest file like the one chosen, and moves on to a newer one', async () => {
  const { dir } = folder()
  const first = path.join(dir, 'app-20261011.log')
  writeFileSync(first, lines(1, 1, 'monday'))
  const { app, page, close } = await launch(undefined, { layout: single() })
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

test('refuses a name with nothing to follow by, and a file that is not text', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const binary = path.join(dir, 'tool.bin')
  writeFileSync(binary, Buffer.from([0x4d, 0x5a, 0, 0, 1, 2]))
  const { app, page, close } = await launch(undefined, { layout: single() })
  try {
    await pickerAnswers(app, file)
    await page.getByTestId('logwatch-select-newest').click()
    await expect(page.getByTestId('logwatch-problem')).toContainText('nothing that changes')
    await pickerAnswers(app, binary)
    await page.getByTestId('logwatch-select').click()
    await expect(page.getByTestId('logwatch-problem')).toContainText('not a text file')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('asks for the file again for an id this machine does not know', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: single({ file: 'abcdefabcdefabcd' }),
  })
  try {
    await expect(page.getByTestId('logwatch-choose')).toContainText('not known on this machine')
    expect(await watching(page)).toEqual([])
    void app
  } finally {
    await close()
  }
})

test('with the window put away nothing is read, and on coming back the gap arrives', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const { app, page, close } = await launch(undefined, { layout: single() })
  const windowTo = (how: 'minimize' | 'restore') =>
    app.evaluate(({ BrowserWindow }, action) => {
      const win = BrowserWindow.getAllWindows().find((w) => w.isVisible() || w.isMinimized())
      if (action === 'minimize') win?.minimize()
      else win?.restore()
    }, how)
  try {
    await choose(page, app, file)
    await windowTo('minimize')
    await expect.poll(() => watching(page), { timeout: 10_000 }).toEqual([])
    appendFileSync(file, lines(2, 3))
    await page.waitForTimeout(1500)
    expect(await watching(page)).toEqual([])
    await windowTo('restore')
    await expect(page.locator('[data-testid=logwatch-mark][data-mark=away]')).toContainText(
      '2 lines',
      { timeout: 10_000 },
    )
  } finally {
    await close()
    removeDir(dir)
  }
})

test('copies the chosen line through main, masked when MASK is on', async () => {
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR mail to rin@example.com failed\n    at send (a.js:1)\n`)
  const { app, page, close } = await launch(undefined, { layout: single({ mask: true }) })
  const copied = () =>
    app.evaluate(
      () =>
        (
          globalThis as unknown as { __elecdexClipboard: { current(): { text: string } | null } }
        ).__elecdexClipboard.current()?.text,
    )
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

test('reads in a dialect set by hand, and shows times as asked', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 2))
  const { app, page, close } = await launch(undefined, { layout: single({ fold: false }) })
  try {
    await choose(page, app, file)
    await expect(page.getByTestId('logwatch-where')).toContainText('text')
    await page.getByTestId('logwatch-settings-toggle').click()
    await page.getByTestId('logwatch-format').selectOption('plain')
    await expect(page.getByTestId('logwatch-where')).toContainText('plain', { timeout: 5000 })
    await expect(rows(page).first()).toContainText(`${stamp().slice(0, 10)}`)
    await page.locator('[data-testid=logwatch-time][data-value=rel]').click()
    await expect(rows(page).first().locator('.t')).toContainText('ago')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('chooses a file again from RECENT', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const other = path.join(dir, 'other.log')
  writeFileSync(other, lines(1, 1, 'other'))
  const { app, page, close } = await launch(undefined, { layout: single() })
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

test('says EXPLAIN failed, in the link words with the reason, when nobody answers', async () => {
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR boom\n`)
  // A port free a moment ago, so nobody answers there (Chromium refuses the well-known ones).
  const port = await new Promise<number>((resolve) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close(() => resolve(typeof address === 'object' && address !== null ? address.port : 1))
    })
  })
  const { app, page, close } = await launch(undefined, {
    layout: single(),
    settings: {
      sound: { enabled: false },
      ai: {
        providers: [
          {
            id: 'down',
            name: 'Down',
            kind: 'openai',
            baseUrl: `http://127.0.0.1:${port}/v1`,
            model: 'm',
          },
        ],
      },
    },
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

test('the level switches, PAUSE and WRAP change what is shown, and stay with the pane', async () => {
  const { dir, file } = folder()
  const long = 'x'.repeat(1500)
  writeFileSync(
    file,
    `${stamp()} DEBUG quiet\n${stamp()} INFO said\n${stamp()} ERROR broke ${long}\n`,
  )
  const { app, page, close } = await launch(undefined, { layout: single({ fold: false }) })
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

test('the name of the file shows its whole path, and a click on it chooses another', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const other = path.join(dir, 'other.log')
  writeFileSync(other, lines(1, 1, 'other'))
  const { app, page, close } = await launch(undefined, { layout: single() })
  try {
    await choose(page, app, file)
    const name = page.getByTestId('logwatch-file')
    await expect(name).toHaveText('app.log')
    await name.hover()
    await expect(page.getByTestId('logwatch-file-card')).toContainText(file)
    await expect(page.getByTestId('logwatch-file-card')).toContainText(
      'click the name to choose another file',
    )
    await pickerAnswers(app, other)
    await name.click()
    await expect(name).toHaveText('other.log', { timeout: 5000 })
    await expect(rows(page).first()).toContainText('other 1')
    // Closed without a choice: nothing changes.
    await app.evaluate(({ dialog }) => {
      dialog.showOpenDialog = (async () => ({ canceled: true, filePaths: [] })) as never
    })
    await name.click()
    await page.waitForTimeout(500)
    await expect(name).toHaveText('other.log')
  } finally {
    await close()
    removeDir(dir)
  }
})
