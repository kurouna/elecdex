import { appendFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { choose, lamp, lines, logFolder, rows, singleLog, stamp } from './support/logwatch.js'
import { clipboardText } from './support/stub-hooks.js'
import { aiSettings, openaiProvider } from './support/stubs/ai.js'
import {
  beside,
  bringWindowBack,
  launch,
  pickerAnswers,
  putWindowAway,
  quietFor,
  removeDir,
  watching,
} from './support.js'

/**
 * LOG WATCH in the running app at the edges (docs/logwatch.md): a file rotated, deleted and made
 * again, a pattern followed to a newer file, an id this machine does not know, the window put
 * away, COPY of one line and of several, the dialect and the time shown changed, a file chosen again from RECENT, and
 * EXPLAIN when nobody answers. Logs are written by the test in a temp folder; the picker is
 * replaced in main.
 */

const folder = () => logFolder('elecdex-logwatch-edges-')
const single = singleLog

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
    expect(await watching(page, 'logwatch')).toEqual([])
    void app
  } finally {
    await close()
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

test('copies the chosen line through main, masked when MASK is on', async () => {
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR mail to rin@example.com failed\n    at send (a.js:1)\n`)
  const { app, page, close } = await launch(undefined, { layout: single({ mask: true }) })
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

test('chooses a run with Shift, and copies only the chosen lines still shown', async () => {
  const { dir, file } = folder()
  writeFileSync(
    file,
    `${stamp()} INFO one\n${stamp()} ERROR two\n${stamp()} INFO three\n${stamp()} INFO four\n`,
  )
  const { app, page, close } = await launch(undefined, { layout: single({ fold: false }) })
  const copied = () => clipboardText(app)
  try {
    await choose(page, app, file)
    await rows(page).filter({ hasText: 'one' }).click()
    await rows(page)
      .filter({ hasText: 'three' })
      .click({ modifiers: ['Shift'] })
    await expect(page.getByTestId('logwatch-chosen')).toContainText('3 lines chosen')
    // ERR switched off: the chosen line it hides is neither copied nor sent.
    await page.getByTestId('logwatch-level').filter({ hasText: 'ERR' }).click()
    await expect(page.getByTestId('logwatch-chosen')).toContainText('2 lines chosen')
    await page.getByTestId('logwatch-copy').click()
    await expect(page.getByTestId('logwatch-copy')).toHaveText('COPIED')
    const text = (await copied()) ?? ''
    expect(text).toContain('INFO one')
    expect(text).toContain('INFO three')
    expect(text).not.toContain('two')
    expect(text).not.toContain('four')
    await page.getByTestId('logwatch-clear').click()
    await expect(page.getByTestId('logwatch-chosen')).toHaveCount(0)
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
    // As the system names it: on GitHub's runners the temp folder comes as a short 8.3 name
    // (RUNNER~1), and main shows the file by its real path.
    await expect(page.getByTestId('logwatch-file-card')).toContainText(realpathSync.native(file))
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
    await quietFor(500, () => name.textContent(), 'the name of the file')
    await expect(name).toHaveText('other.log')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('without an AI provider, EXPLAIN says where to set one up, and goes there', async () => {
  const { dir, file } = folder()
  writeFileSync(file, lines(1, 1))
  const { app, page, close } = await launch(undefined, { layout: single() })
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

test('EXPLAIN on another line while the panel is open asks about that one instead', async () => {
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR first trouble\n${stamp()} WARN second trouble\n`)
  const { app, page, close } = await launch(undefined, {
    layout: single(),
    settings: aiSettings([
      openaiProvider('http://127.0.0.1:1', { id: 'p', name: 'P', model: 'm' }),
    ]),
  })
  try {
    await choose(page, app, file)
    await rows(page).filter({ hasText: 'first trouble' }).click()
    await page.getByTestId('logwatch-explain-open').click()
    await expect(page.getByTestId('logwatch-explain-preview')).toContainText('first trouble')
    await rows(page).filter({ hasText: 'second trouble' }).click()
    await page.getByTestId('logwatch-explain-open').click()
    const preview = page.getByTestId('logwatch-explain-preview')
    await expect(preview).toContainText('second trouble')
    // A plain click chose that line alone: the first is no longer sent.
    await expect(preview).not.toContainText('first trouble')
  } finally {
    await close()
    removeDir(dir)
  }
})

test('keeps COPY, CLEAR and EXPLAIN inside a narrow pane with lines chosen', async () => {
  // Found in review: the footer did not wrap or give way, and EXPLAIN went off the pane's edge.
  const { dir, file } = folder()
  writeFileSync(file, `${stamp()} ERROR first trouble\n${stamp()} WARN second trouble\n`)
  const { app, page, close } = await launch(undefined, {
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
