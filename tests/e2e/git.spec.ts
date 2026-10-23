import { execFileSync, spawn } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { git, makeRepo } from './support/fixtures.js'
import {
  beside,
  launch,
  pickerAnswers,
  quietFor,
  removeDir,
  single,
  tabbed,
  watching,
} from './support.js'

/**
 * The git pane against a real repository made for the test in a temp folder.
 *
 * What only the running app can show: that main finds the repository from the
 * folder the picker returns (the picker itself is replaced in main, as a test
 * cannot drive the system's dialog), watches it, and sends each change to the
 * pane - an edit, staging, a commit - without being asked; that a double-click
 * runs the command the settings name, with the file and line filled in; and
 * that main stops watching when the pane goes.
 */

const layout = single('git', { id: 'g' })

async function watchRepo(page: Page, app: ElectronApplication, repo: string): Promise<void> {
  await pickerAnswers(app, path.join(repo))
  await page.getByTestId('git-select').click()
  await expect(page.getByTestId('git-branch')).toContainText('main')
}

test('follows a repository through an edit, staging and a commit', async () => {
  const repo = makeRepo()
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, repo)
    await expect(page.getByTestId('git-clean')).toBeVisible()
    await expect(page.getByTestId('git-commit').first()).toContainText('first commit')

    // An edit, made outside the app: the pane learns of it from the watcher alone.
    writeFileSync(
      path.join(repo, 'app.ts'),
      'const greeting = "hello, world"\nexport default greeting\n',
    )
    const row = page.locator('[data-testid="git-file"][data-path="app.ts"]')
    await expect(row).toHaveAttribute('data-area', 'unstaged', { timeout: 10_000 })
    await expect(page.getByTestId('diff-view')).toContainText('hello, world')

    // A rest on the row: its full path on this machine, not the name the row already shows.
    await row.hover()
    const cardPath = page.getByTestId('git-file-card-path')
    await expect(cardPath).toHaveText(/app\.ts$/)
    const full = (await cardPath.textContent()) ?? ''
    expect(path.isAbsolute(full)).toBe(true)
    expect(full.endsWith(`${path.basename(repo)}${path.sep}app.ts`)).toBe(true)
    await expect(page.getByTestId('git-file-card')).toContainText(
      'modified · in the working tree, not staged',
    )
    await page.mouse.move(2, 2)
    await expect(page.getByTestId('git-file-card')).toHaveCount(0)
    await expect(page.locator('[data-testid="diff-line"][data-kind="del"]')).toHaveCount(1)

    git(repo, 'add', 'app.ts')
    await expect(row).toHaveAttribute('data-area', 'staged', { timeout: 10_000 })

    git(repo, 'commit', '-q', '-m', 'say hello to the world')
    await expect(page.getByTestId('git-clean')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('git-commit').first()).toContainText('say hello to the world')

    // A commit in the log shows its own files and diff.
    await page.getByTestId('git-commit').first().click()
    await expect(page.getByTestId('git-viewing')).toBeVisible()
    await expect(page.getByTestId('git-file')).toHaveCount(1)
    await expect(page.getByTestId('diff-view')).toContainText('hello, world')
  } finally {
    await close()
    removeDir(repo)
  }
})

test('scrolls a long line into view sideways, unified and side by side', async () => {
  const repo = makeRepo()
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await watchRepo(page, app, repo)
    const long = `const greeting = "${'hello '.repeat(80)}END_OF_LINE"`
    writeFileSync(path.join(repo, 'app.ts'), `${long}\nexport default greeting\n`)
    const row = page.locator('[data-testid="git-file"][data-path="app.ts"]')
    await expect(row).toHaveAttribute('data-area', 'unstaged', { timeout: 10_000 })
    const body = page.getByTestId('diff-body')
    const added = page.locator('[data-testid="diff-line"][data-kind="add"]').first()

    for (const mode of ['diff-unified', 'diff-split'] as const) {
      await page.getByTestId(mode).click()
      await expect(added).toContainText('END_OF_LINE')
      // The line is not cut: the body is wider than its view, and scrolled to its end shows the end.
      const reach = await body.evaluate((el) => {
        el.scrollLeft = el.scrollWidth
        const view = el.getBoundingClientRect()
        const line = [...el.querySelectorAll('[data-kind="add"] .code')].at(-1) as HTMLElement
        const range = document.createRange()
        range.selectNodeContents(line)
        const end = range.getBoundingClientRect().right
        const right = view.left + el.clientLeft + el.clientWidth
        return { wider: el.scrollWidth > el.clientWidth, end, right, left: view.left }
      })
      expect(reach.wider, mode).toBe(true)
      expect(reach.end, mode).toBeLessThanOrEqual(reach.right + 1)
      expect(reach.end, mode).toBeGreaterThan(reach.left)
      await body.evaluate((el) => {
        el.scrollLeft = 0
      })
    }

    // Side by side, every row's halves meet at one line, however long either side is, and
    // only the new side is widened by its long line: the old side stays half the view.
    const edges = await page
      .locator('[data-testid="diff-lines"] .ln.left')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().right)))
    expect(new Set(edges).size).toBe(1)
    const half = await body.evaluate(
      (el) => el.getBoundingClientRect().left + el.clientLeft + el.clientWidth / 2,
    )
    expect(Math.abs((edges[0] ?? 0) - half)).toBeLessThanOrEqual(2)
  } finally {
    await close()
    removeDir(repo)
  }
})

test('draws a file as text, whatever it holds, and lists new files', async () => {
  const repo = makeRepo()
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, repo)
    // A page that drew highlight.js's answer as HTML would run this.
    writeFileSync(
      path.join(repo, 'evil.html'),
      '<script>window.__gitOwned = true</script>\n<img src=x onerror="window.__gitOwned = true">\n',
    )
    const row = page.locator('[data-testid="git-file"][data-path="evil.html"]')
    await expect(row).toHaveAttribute('data-area', 'untracked', { timeout: 10_000 })
    await row.click()
    await expect(page.getByTestId('diff-view')).toContainText(
      '<script>window.__gitOwned = true</script>',
    )
    expect(
      await page.evaluate(() => (window as { __gitOwned?: boolean }).__gitOwned),
    ).toBeUndefined()
    await expect(page.getByTestId('diff-body').locator('script, img')).toHaveCount(0)
  } finally {
    await close()
    removeDir(repo)
  }
})

test('opens a double-clicked file with the command in settings, at its line', async () => {
  const repo = makeRepo()
  const out = path.join(repo, '..', `${path.basename(repo)}-opened.json`)
  const opener = path.join(repo, '..', `${path.basename(repo)}-opener.cjs`)
  // A stand-in editor: it writes down what it was started with.
  writeFileSync(
    opener,
    `require('node:fs').writeFileSync(${JSON.stringify(out)}, JSON.stringify(process.argv.slice(2)))\n`,
  )
  const command = `"${process.execPath}" "${opener}" --goto "{file}:{line}"`
  const { app, page, close } = await launch(undefined, {
    layout,
    settings: { sound: { enabled: false }, git: { openCommand: command } },
  })
  try {
    await watchRepo(page, app, repo)
    writeFileSync(path.join(repo, 'app.ts'), 'const greeting = "hi"\nexport default greeting\n')
    await expect(page.locator('[data-testid="git-file"][data-path="app.ts"]')).toBeVisible({
      timeout: 10_000,
    })
    await page.locator('[data-testid="diff-line"][data-kind="add"]').first().dblclick()
    await expect.poll(() => existsSync(out), { timeout: 10_000 }).toBe(true)
    const args = JSON.parse(readFileSync(out, 'utf8')) as string[]
    // Main hands over the file with every link resolved (GitService.locate), and a
    // temp folder may not be written that way: a short 8.3 name on Windows, /var
    // standing for /private/var on macOS.
    const file = realpathSync.native(path.join(repo, 'app.ts'))
    expect(args).toEqual(['--goto', `${file}:1`])
  } finally {
    await close()
    removeDir(repo)
    removeDir(out)
    removeDir(opener)
  }
})

test('opens text with no command set, and shows in its folder what is not text (issue 26)', async () => {
  const repo = makeRepo()
  // A compiled help file runs its scripts when opened, whatever it is named.
  writeFileSync(
    path.join(repo, 'README.chm'),
    Buffer.from([0x49, 0x54, 0x53, 0x46, 3, 0, 0, 0, 0x60, 0, 0, 0]),
  )
  writeFileSync(path.join(repo, 'notes.md'), '# notes\n')
  const { app, page, close } = await launch(undefined, {
    layout,
    settings: { sound: { enabled: false } },
  })
  try {
    // The system's own open and reveal, stood in for: nothing on this machine is started.
    await app.evaluate(({ shell }) => {
      const seen: string[] = []
      ;(globalThis as { __gitShell?: string[] }).__gitShell = seen
      shell.openPath = async (file: string) => {
        seen.push(`open ${file}`)
        return ''
      }
      shell.showItemInFolder = (file: string) => {
        seen.push(`reveal ${file}`)
      }
    })
    const seen = () =>
      app.evaluate(() => (globalThis as { __gitShell?: string[] }).__gitShell ?? [])
    await watchRepo(page, app, repo)
    for (const name of ['README.chm', 'notes.md']) {
      await expect(page.locator(`[data-testid="git-file"][data-path="${name}"]`)).toBeVisible({
        timeout: 10_000,
      })
    }
    await page.locator('[data-testid="git-file"][data-path="README.chm"]').dblclick()
    await expect.poll(seen).toEqual([expect.stringMatching(/^reveal .*README\.chm$/)])
    await expect(page.getByText('Cannot open README.chm')).toBeVisible()
    await page.locator('[data-testid="git-file"][data-path="notes.md"]').dblclick()
    await expect.poll(async () => (await seen()).at(-1)).toMatch(/^open .*notes\.md$/)
  } finally {
    await close()
    removeDir(repo)
  }
})

test('stops watching when the pane goes, and says so when the folder is not a repository', async () => {
  const repo = makeRepo()
  const plain = mkdtempSync(path.join(tmpdir(), 'elecdex-notgit-'))
  const { app, page, close } = await launch(undefined, {
    layout: beside('git', { id: 'g' }),
  })
  try {
    await pickerAnswers(app, plain)
    await page.getByTestId('git-select').click()
    await expect(page.getByTestId('git-problem')).toBeVisible()

    await watchRepo(page, app, repo)
    expect(await watching(page, 'git')).toHaveLength(1)
    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('git')).toHaveCount(0)
    // Main must stop watching the folder: the rule every subscription keeps.
    await expect.poll(() => watching(page, 'git')).toEqual([])
  } finally {
    await close()
    removeDir(repo)
    removeDir(plain)
  }
})

test('keeps the list width and the log height the user drags, per pane, across a restart', async () => {
  const repo = makeRepo()
  let launched = await launch(undefined, { layout })
  try {
    await watchRepo(launched.page, launched.app, repo)
    const page = launched.page
    const list = page.getByTestId('git-files').locator('..')
    const log = page.getByTestId('git-log')
    const before = {
      width: (await list.boundingBox())?.width ?? 0,
      log: (await log.boundingBox())?.height ?? 0,
    }

    const drag = async (testid: string, dx: number, dy: number) => {
      const box = await page.getByTestId(testid).boundingBox()
      if (box === null) throw new Error(`${testid} is not on screen`)
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + dx / 2, y + dy / 2)
      await page.mouse.move(x + dx, y + dy)
      await page.mouse.up()
    }
    await drag('git-split-width', 150, 0)
    await drag('git-split-log', 0, -80)
    const after = {
      width: (await list.boundingBox())?.width ?? 0,
      log: (await log.boundingBox())?.height ?? 0,
    }
    expect(after.width).toBeGreaterThan(before.width + 100)
    expect(after.log).toBeGreaterThan(before.log + 50)

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('git-branch')).toContainText('main')
    const again = launched.page.getByTestId('git-files').locator('..')
    expect(Math.abs(((await again.boundingBox())?.width ?? 0) - after.width)).toBeLessThan(4)
    const logAgain = (await launched.page.getByTestId('git-log').boundingBox())?.height ?? 0
    expect(Math.abs(logAgain - after.log)).toBeLessThan(4)

    // A double-click puts the width back where it began.
    await launched.page.getByTestId('git-split-width').dblclick()
    await expect
      .poll(async () => Math.abs(((await again.boundingBox())?.width ?? 0) - before.width))
      .toBeLessThan(4)
  } finally {
    await launched.close()
    removeDir(repo)
  }
})

test('shows a changed image as before and after, and a file only named as one as neither', async () => {
  const repo = makeRepo()
  // Two one-pixel PNGs, told apart by colour.
  const red = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64',
  )
  const blue = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
    'base64',
  )
  writeFileSync(path.join(repo, 'logo.png'), red)
  git(repo, 'add', 'logo.png')
  git(repo, 'commit', '-q', '-m', 'a red logo')
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, repo)
    writeFileSync(path.join(repo, 'logo.png'), blue)
    const row = page.locator('[data-testid="git-file"][data-path="logo.png"]')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.click()
    const images = page.getByTestId('diff-image')
    await expect(images).toHaveCount(2)
    await expect(page.getByTestId('diff-images')).toContainText('BEFORE')
    await expect(page.getByTestId('diff-images')).toContainText('1 × 1')
    expect(await images.first().getAttribute('src')).toMatch(/^data:image\/png;base64,/)

    // A click on a side shows it alone, fitted to the body (a pixel this small, as large as allowed).
    await page.getByTestId('diff-image-open').nth(1).click()
    const viewer = page.getByTestId('image-viewer')
    await expect(viewer).toBeVisible()
    await expect(page.getByTestId('diff-images')).toHaveCount(0)
    await expect(viewer).toHaveAttribute('data-scale', '32.000')
    await expect(page.getByTestId('image-tools').locator('.after')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // The wheel zooms, a drag pans, 0 fits again.
    const box = await viewer.boundingBox()
    if (box === null) throw new Error('no viewer')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, 400)
    await expect.poll(async () => Number(await viewer.getAttribute('data-scale'))).toBeLessThan(32)
    const picture = viewer.locator('img')
    const before = await picture.evaluate((img) => (img as HTMLElement).style.transform)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 4 })
    await page.mouse.up()
    expect(await picture.evaluate((img) => (img as HTMLElement).style.transform)).not.toBe(before)
    await page.keyboard.press('0')
    await expect(viewer).toHaveAttribute('data-scale', '32.000')
    // The other side at the same place, then ← back to the two side by side.
    await page.getByTestId('image-tools').getByRole('button', { name: 'BEFORE' }).click()
    await expect(page.getByTestId('image-tools').locator('.before')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await page.getByTestId('image-back').click()
    await expect(page.getByTestId('diff-images')).toBeVisible()
    await expect(page.getByTestId('image-back')).toHaveCount(0)
    // Escape goes back too.
    await page.getByTestId('diff-image-open').first().click()
    await expect(viewer).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('diff-images')).toBeVisible()

    // Bytes that are not an image never reach an <img>, whatever the name says.
    writeFileSync(path.join(repo, 'fake.png'), '<svg onload="window.__gitOwned = true"></svg>')
    const fake = page.locator('[data-testid="git-file"][data-path="fake.png"]')
    await expect(fake).toBeVisible({ timeout: 10_000 })
    await fake.click()
    await expect(page.getByTestId('diff-view')).toContainText('after is not an image')
    await expect(page.getByTestId('diff-image')).toHaveCount(0)
  } finally {
    await close()
    removeDir(repo)
  }
})

/**
 * A program a repository's own config names, as a cloned repository could: it
 * writes `marker` when run. A shell script, which git starts through its shell
 * on every platform, running this test's node.
 */
function trap(marker: string): { script: string; command: string } {
  const slash = (p: string) => p.replaceAll('\\', '/')
  const js = `${marker}.cjs`
  writeFileSync(
    js,
    `require('node:fs').appendFileSync(${JSON.stringify(marker)}, 'ran\\n')\nif (process.argv[2] === 'pass') process.stdin.pipe(process.stdout)\nelse process.exit(1)\n`,
  )
  const script = `${marker}.sh`
  writeFileSync(script, `#!/bin/sh\nexec "${slash(process.execPath)}" "${slash(js)}" "$@"\n`, {
    mode: 0o755,
  })
  return { script: slash(script), command: `"${slash(process.execPath)}" "${slash(js)}" pass` }
}

test("runs none of the programs a repository's own config names, reading it or its log", async () => {
  const repo = makeRepo()
  const marker = path.join(repo, '..', `${path.basename(repo)}-ran`)
  const { script, command } = trap(marker)
  // A clean filter on every file, and signature checks through a program of the repository's choosing.
  writeFileSync(path.join(repo, '.gitattributes'), '* filter=x\n')
  git(repo, 'add', '.gitattributes')
  git(repo, 'commit', '-q', '-m', 'attributes')
  const body = git(repo, 'cat-file', 'commit', 'HEAD').toString()
  const signed = body.replace(
    /^(committer .*)$/m,
    '$1\ngpgsig -----BEGIN PGP SIGNATURE-----\n \n iQEzBAABCAAdFiEE\n -----END PGP SIGNATURE-----',
  )
  const oid = execFileSync('git', ['hash-object', '-t', 'commit', '-w', '--stdin'], {
    cwd: repo,
    input: signed,
  })
    .toString()
    .trim()
  git(repo, 'update-ref', 'refs/heads/main', oid)
  git(repo, 'config', 'filter.x.clean', command)
  git(repo, 'config', 'log.showSignature', 'true')
  git(repo, 'config', 'gpg.program', script)
  // A file touched since the index was written: git must read it, through the filter, to compare.
  const touched = path.join(repo, 'app.ts')
  const later = new Date(Date.now() + 5000)
  utimesSync(touched, later, later)
  // The trap is armed: git left to itself runs both.
  git(repo, 'status', '--porcelain')
  git(repo, 'log', '-1')
  expect(readFileSync(marker, 'utf8').trim().split('\n').length).toBeGreaterThanOrEqual(2)
  rmSync(marker)

  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, repo)
    await expect(page.getByTestId('git-commit').first()).toContainText('attributes')
    // Another change, read and diffed, and the signed commit opened.
    writeFileSync(path.join(repo, 'new.txt'), 'new\n')
    await expect(page.locator('[data-testid="git-file"][data-path="new.txt"]')).toBeVisible({
      timeout: 10_000,
    })
    utimesSync(touched, new Date(Date.now() + 9000), new Date(Date.now() + 9000))
    await page.getByTestId('git-commit').first().click()
    await expect(page.getByTestId('git-viewing')).toBeVisible()
    await expect(page.getByTestId('diff-view')).toContainText('.gitattributes')
    expect(await quietFor(1500, async () => existsSync(marker), 'the trap')).toBe(false)
  } finally {
    await close()
    removeDir(repo)
    for (const file of [marker, `${marker}.cjs`, `${marker}.sh`]) removeDir(file)
  }
})

test('draws the commit graph with its branches and names, and shows a commit on a rest', async () => {
  const repo = makeRepo()
  // A branch merged back with a message body, a tag on the merge, and a branch not merged.
  git(repo, 'checkout', '-q', '-b', 'feature')
  writeFileSync(path.join(repo, 'feature.ts'), 'export const on = true\n')
  git(repo, 'add', '.')
  git(repo, 'commit', '-q', '-m', 'add the feature', '-m', 'Why it is here.\nAnd how.')
  git(repo, 'checkout', '-q', 'main')
  git(repo, 'merge', '-q', '--no-ff', 'feature', '-m', 'merge the feature')
  git(repo, 'tag', 'v1.0')
  git(repo, 'checkout', '-q', '-b', 'side')
  git(repo, 'commit', '-q', '--allow-empty', '-m', 'on the side')
  git(repo, 'checkout', '-q', 'main')
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, repo)
    const commits = page.getByTestId('git-commit')
    // This branch: the side branch is not in it.
    await expect(commits).toHaveCount(3)
    await expect(commits.first()).toContainText('merge the feature')
    await expect(page.locator('[data-testid="git-ref"][data-kind="tag"]')).toHaveText('◆ v1.0')
    await expect(commits.first().locator('[data-testid="git-ref"]').first()).toHaveClass(/current/)
    await expect(page.locator('[data-testid="git-node"][data-merge="true"]')).toHaveCount(1)

    // Every branch: the side branch's commit, on a lane of its own.
    await page.getByTestId('git-scope-all').click()
    await expect(commits).toHaveCount(4)
    await expect(commits.first()).toContainText('on the side')

    // A rest on a commit: the whole of it, the body as written and what it changed.
    await commits.filter({ hasText: 'add the feature' }).hover()
    const card = page.getByTestId('git-card')
    await expect(card).toBeVisible()
    await expect(page.getByTestId('git-card-body')).toHaveText('Why it is here.\nAnd how.')
    await expect(page.getByTestId('git-card-files')).toContainText('1 file changed · +1 −0')
    await page.mouse.move(2, 2)
    await expect(card).toHaveCount(0)

    // A tag made outside: HEAD has not moved, and the graph still shows it.
    git(repo, 'tag', 'v1.1', 'HEAD~1')
    await expect(page.locator('[data-testid="git-ref"][data-kind="tag"]')).toHaveCount(2, {
      timeout: 10_000,
    })
  } finally {
    await close()
    removeDir(repo)
  }
})

test('reads a hundred commits at first, and more when asked', async () => {
  const repo = makeRepo()
  // 120 commits more, written straight into the repository: quicker than 120 commit commands.
  const lines = ['reset refs/heads/main', 'from refs/heads/main^0']
  for (let i = 1; i <= 120; i++) {
    const message = `commit ${i}`
    lines.push(
      'commit refs/heads/main',
      `committer Test <test@example.test> ${1_790_000_000 + i} +0000`,
      `data ${Buffer.byteLength(message)}`,
      message,
    )
  }
  execFileSync('git', ['fast-import', '--quiet'], { cwd: repo, input: `${lines.join('\n')}\n` })
  git(repo, 'reset', '-q', '--hard', 'main')
  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, repo)
    const commits = page.getByTestId('git-commit')
    await expect(commits).toHaveCount(100)
    await page.getByTestId('git-more').click()
    await expect(commits).toHaveCount(121)
    await expect(page.getByTestId('git-more')).toHaveCount(0)
  } finally {
    await close()
    removeDir(repo)
  }
})

/** A solid PNG of the given size, made here: a screenshot's shape without a screenshot's bytes. */
function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data])
    const out = Buffer.alloc(12 + data.length)
    out.writeUInt32BE(data.length, 0)
    body.copy(out, 4)
    out.writeUInt32BE(crc32(body), 8 + data.length)
    return out
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(width).fill(rgb).flat())])
  const pixels = deflateSync(Buffer.concat(Array(height).fill(row)))
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', pixels),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

test('puts two wide images one above the other in a tall, narrow diff, and side by side in a wide one', async () => {
  const repo = makeRepo()
  writeFileSync(path.join(repo, 'shot.png'), solidPng(1360, 880, [200, 40, 40]))
  git(repo, 'add', 'shot.png')
  git(repo, 'commit', '-q', '-m', 'a screenshot')
  // The git pane a narrow column beside the clock: its diff is tall and narrow.
  const narrow = {
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'row',
      sizes: [0.62, 0.38],
      children: [
        { kind: 'pane', id: 'c', widget: 'clock' },
        { kind: 'pane', id: 'g', widget: 'git' },
      ],
    },
  }
  const { app, page, close } = await launch(undefined, { layout: narrow })
  try {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await watchRepo(page, app, repo)
    writeFileSync(path.join(repo, 'shot.png'), solidPng(1360, 880, [40, 40, 200]))
    const row = page.locator('[data-testid="git-file"][data-path="shot.png"]')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.click()
    const pair = page.getByTestId('diff-images')
    await expect(page.getByTestId('diff-image')).toHaveCount(2)
    await expect(pair).toHaveAttribute('data-direction', 'column')
    const [top, bottom] = await page
      .getByTestId('diff-image')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
    // One above the other, each wider than half the diff would have allowed.
    expect(bottom.top).toBeGreaterThan(top.bottom)
    const body = await page.getByTestId('diff-body').boundingBox()
    expect(top.width).toBeGreaterThan((body?.width ?? 0) * 0.6)

    // Brought forward in a short window, the diff is wide and low: side by side again.
    await page.setViewportSize({ width: 1920, height: 640 })
    await page.locator('[data-testid=pane][data-widget=git]').getByTestId('pane-zoom').click()
    await expect(pair).toHaveAttribute('data-direction', 'row', { timeout: 5000 })
  } finally {
    await close()
    removeDir(repo)
  }
})

/**
 * Serves the bare repositories in `root` over git's smart HTTP protocol, through
 * `git http-backend` run as a CGI for each request. The pane never syncs with a remote that is a
 * folder on this machine (its hooks would run on the other side: protocol.file.allow=never), so
 * the tests give the clone it shows an http remote. `git daemon` would be simpler, but a push
 * through it hangs on Windows.
 */
async function serveOverHttp(
  root: string,
): Promise<{ url: (repo: string) => string; stop: () => void }> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const cgi = spawn('git', ['http-backend'], {
      env: {
        ...process.env,
        GIT_PROJECT_ROOT: root,
        GIT_HTTP_EXPORT_ALL: '1',
        REQUEST_METHOD: request.method ?? 'GET',
        PATH_INFO: decodeURIComponent(url.pathname),
        QUERY_STRING: url.search.slice(1),
        CONTENT_TYPE: request.headers['content-type'] ?? '',
        // git gzips a large upload-pack request, and says which protocol version it speaks.
        HTTP_CONTENT_ENCODING: request.headers['content-encoding'] ?? '',
        GIT_PROTOCOL: String(request.headers['git-protocol'] ?? ''),
        // A user, so http-backend lets a push through (receive-pack is on for one by default).
        REMOTE_USER: 'test',
        REMOTE_ADDR: '127.0.0.1',
      },
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsHide: true,
    })
    let head = Buffer.alloc(0)
    let started = false
    // A CGI that could not start, or ended before its headers: an answer, never a hang.
    const fail = (): void => {
      if (started || response.headersSent) return
      started = true
      response.writeHead(502)
      response.end()
    }
    cgi.on('error', fail)
    cgi.on('close', fail)
    cgi.stdin.on('error', () => {})
    request.pipe(cgi.stdin)
    cgi.stdout.on('data', (chunk: Buffer) => {
      if (started) {
        response.write(chunk)
        return
      }
      head = Buffer.concat([head, chunk])
      // A CGI ends its headers with a blank line, CRLF or LF.
      const blank = /\r?\n\r?\n/.exec(head.toString('latin1'))
      if (blank === null) return
      const end = blank.index
      started = true
      let status = 200
      for (const line of head.subarray(0, end).toString().split(/\r?\n/)) {
        const colon = line.indexOf(':')
        const name = line.slice(0, colon).trim()
        const value = line.slice(colon + 1).trim()
        if (name.toLowerCase() === 'status') status = Number.parseInt(value, 10)
        else response.setHeader(name, value)
      }
      response.writeHead(status)
      response.write(head.subarray(end + blank[0].length))
    })
    cgi.stdout.on('end', () => response.end())
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return {
    url: (repo) => `http://127.0.0.1:${port}/${repo}`,
    stop: () => server.close(),
  }
}

test('fetches and pulls fast-forward only on two presses, running none of the repository hooks', async () => {
  // A remote, a clone the pane shows, and another clone that moves the remote on.
  const source = makeRepo()
  const root = mkdtempSync(path.join(tmpdir(), 'elecdex-git-remote-'))
  const origin = path.join(root, 'origin.git')
  const work = path.join(root, 'work')
  const other = path.join(root, 'other')
  git(root, 'clone', '-q', '--bare', source, origin)
  for (const dir of [work, other]) {
    // Set as it is cloned, so the checkout itself does not follow a global autocrlf.
    git(root, 'clone', '-q', '-c', 'core.autocrlf=false', origin, dir)
    git(dir, 'config', 'user.email', 'test@example.test')
    git(dir, 'config', 'user.name', 'Test')
  }
  const push = (subject: string) => {
    writeFileSync(path.join(other, `${subject.replaceAll(' ', '-')}.txt`), `${subject}\n`)
    git(other, 'add', '.')
    git(other, 'commit', '-q', '-m', subject)
    git(other, 'push', '-q', 'origin', 'main')
  }
  push('second commit')

  // Hooks where husky keeps them, in the working tree, so a pulled commit could
  // rewrite them: a fetch runs reference-transaction, a pull post-merge as well.
  const marker = path.join(root, 'hook-ran')
  const hooks = path.join(work, '.husky')
  mkdirSync(hooks)
  for (const hook of ['reference-transaction', 'post-merge']) {
    const log = marker.replaceAll('\\', '/')
    writeFileSync(path.join(hooks, hook), `#!/bin/sh\necho ${hook} >> "${log}"\n`, {
      mode: 0o755,
    })
  }
  git(work, 'config', 'core.hooksPath', '.husky')
  // The trap is armed: git left to itself runs them.
  git(work, 'update-ref', 'refs/heads/armed', 'HEAD')
  expect(existsSync(marker)).toBe(true)
  rmSync(marker)
  const http = await serveOverHttp(root)
  git(work, 'remote', 'set-url', 'origin', http.url('origin.git'))

  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, work)
    await expect(page.getByTestId('git-commit').first()).toContainText('first commit')
    const toast = page.getByTestId('toast')

    // One press arms, the second runs.
    const fetch = page.getByTestId('git-fetch')
    await fetch.click()
    await expect(fetch).toContainText('click again to fetch')
    await fetch.click()
    await expect(toast.last()).toContainText('FETCHED · 1 COMMIT BEHIND', { timeout: 30_000 })
    // Fetched, not merged: the graph shows the upstream ahead, HEAD stays where it was.
    await expect(page.getByTestId('git-head')).toContainText('↓1', { timeout: 10_000 })
    await expect(page.getByTestId('git-head')).toContainText('first commit')
    await expect(page.getByTestId('git-commit').first()).toContainText('second commit')

    const pull = page.getByTestId('git-pull')
    await pull.click()
    await pull.click()
    await expect(toast.last()).toContainText('PULLED 1 COMMIT', { timeout: 30_000 })
    await expect(page.getByTestId('git-head')).toContainText('second commit', { timeout: 10_000 })
    await expect(page.getByTestId('git-head')).toContainText('↓0')

    // Both sides move on: a fast-forward cannot join them, and nothing is merged.
    writeFileSync(path.join(work, 'local.txt'), 'local\n')
    git(work, 'add', 'local.txt')
    // The test's own commit runs no hook either, so the marker speaks only of the app.
    git(
      work,
      '-c',
      `core.hooksPath=${path.join(root, 'none')}`,
      'commit',
      '-q',
      '-m',
      'local commit',
    )
    push('third commit')
    await expect(page.getByTestId('git-head')).toContainText('local commit', { timeout: 10_000 })
    await pull.click()
    await pull.click()
    await expect(toast.last()).toContainText('DIVERGED', { timeout: 30_000 })
    await expect(toast.last()).toContainText('merge or rebase in the terminal')
    expect(git(work, 'log', '-1', '--format=%s').toString().trim()).toBe('local commit')
    // Now known to have diverged, the pull is not offered until the terminal has dealt with it.
    await expect(pull).toBeDisabled({ timeout: 10_000 })

    expect(existsSync(marker) ? readFileSync(marker, 'utf8') : '').toBe('')
  } finally {
    await close()
    http.stop()
    removeDir(root)
    removeDir(source)
  }
})

test('pushes the branch onto its upstream alone on two presses, never forced, running no hook', async () => {
  // A remote with a second branch, a clone the pane shows, and another clone that moves it on.
  const source = makeRepo()
  git(source, 'branch', 'side')
  const root = mkdtempSync(path.join(tmpdir(), 'elecdex-git-remote-'))
  const origin = path.join(root, 'origin.git')
  const work = path.join(root, 'work')
  const other = path.join(root, 'other')
  git(root, 'clone', '-q', '--bare', source, origin)
  for (const dir of [work, other]) {
    git(root, 'clone', '-q', '-c', 'core.autocrlf=false', origin, dir)
    git(dir, 'config', 'user.email', 'test@example.test')
    git(dir, 'config', 'user.name', 'Test')
  }
  const none = path.join(root, 'none')
  // A commit of the test's own runs no hook, so the marker speaks only of the app.
  const commit = (dir: string, subject: string) => {
    writeFileSync(path.join(dir, `${subject.replaceAll(' ', '-')}.txt`), `${subject}\n`)
    git(dir, 'add', '.')
    git(dir, '-c', `core.hooksPath=${none}`, 'commit', '-q', '-m', subject)
  }
  const remoteRef = (ref: string) => git(origin, 'rev-parse', ref).toString().trim()

  // Config that would send more than the branch: every matching branch, tags along with it.
  git(work, 'config', 'push.default', 'matching')
  git(work, 'config', 'push.followTags', 'true')
  git(work, 'checkout', '-q', 'side')
  commit(work, 'side commit')
  git(work, 'checkout', '-q', 'main')
  const side = remoteRef('refs/heads/side')

  // A pre-push hook where husky keeps one: git left to itself runs it.
  const marker = path.join(root, 'hook-ran')
  mkdirSync(path.join(work, '.husky'))
  writeFileSync(
    path.join(work, '.husky', 'pre-push'),
    `#!/bin/sh\necho pre-push >> "${marker.replaceAll('\\', '/')}"\n`,
    { mode: 0o755 },
  )
  git(work, 'config', 'core.hooksPath', '.husky')
  commit(work, 'local commit')
  git(work, '-c', `core.hooksPath=${none}`, 'tag', '-a', '-m', 'v1', 'v1')
  const http = await serveOverHttp(root)
  git(work, 'remote', 'set-url', 'origin', http.url('origin.git'))

  const { app, page, close } = await launch(undefined, { layout })
  try {
    await watchRepo(page, app, work)
    await expect(page.getByTestId('git-head')).toContainText('↑1')
    const toast = page.getByTestId('toast')

    // One press arms and says where it goes and that no hooks run; the second pushes.
    const push = page.getByTestId('git-push')
    await push.click()
    await expect(push).toContainText('click again to push ↑1 to origin/main · no hooks')
    await push.click()
    await expect(toast.last()).toContainText('PUSHED 1 COMMIT', { timeout: 30_000 })
    expect(remoteRef('refs/heads/main')).toBe(git(work, 'rev-parse', 'HEAD').toString().trim())
    await expect(page.getByTestId('git-head')).toContainText('↑0', { timeout: 10_000 })
    // Nothing else went: not the matching branch, not the tag; and the hook did not run.
    expect(remoteRef('refs/heads/side')).toBe(side)
    expect(git(origin, 'tag', '--list').toString().trim()).toBe('')
    expect(existsSync(marker) ? readFileSync(marker, 'utf8') : '').toBe('')
    // Up to date, there is nothing to press.
    await expect(push).toBeDisabled()

    // The remote moves on before the pane has fetched: the push is refused, not forced.
    git(other, 'pull', '-q', '--ff-only')
    commit(other, 'other commit')
    git(other, 'push', '-q', 'origin', 'main')
    const theirs = remoteRef('refs/heads/main')
    commit(work, 'second local commit')
    await expect(page.getByTestId('git-head')).toContainText('↑1', { timeout: 10_000 })
    await push.click()
    await push.click()
    await expect(toast.last()).toContainText('REJECTED', { timeout: 30_000 })
    await expect(toast.last()).toContainText('FETCH, then PULL')
    expect(remoteRef('refs/heads/main')).toBe(theirs)

    // A branch with no upstream is left to the terminal.
    git(work, 'checkout', '-q', '-b', 'topic')
    await expect(page.getByTestId('git-branch')).toContainText('topic', { timeout: 10_000 })
    await expect(push).toBeDisabled()
    await expect(push).toHaveAttribute('title', /push -u in the terminal/)
    expect(existsSync(marker) ? readFileSync(marker, 'utf8') : '').toBe('')
  } finally {
    await close()
    http.stop()
    removeDir(root)
    removeDir(source)
  }
})

test('lands the kept reading quietly on a return from behind a tab, and lights for a change', async () => {
  // Found in review: the receive lamp lit on every return, as if the repository had changed.
  const repo = makeRepo()
  writeFileSync(path.join(repo, 'app.ts'), 'const greeting = "hi"\nexport default greeting\n')
  const { app, page, close } = await launch(undefined, {
    layout: tabbed(['git', 'clock']),
  })
  const show = (id: string) => page.locator(`[data-testid=tab][data-pane-id=${id}]`).click()
  const received = () => page.getByTestId('git-lamp').getAttribute('data-received')
  try {
    await watchRepo(page, app, repo)
    await expect(page.locator('[data-testid="git-file"][data-path="app.ts"]')).toBeVisible()
    const before = await received()
    await show('clock')
    await expect.poll(() => watching(page, 'git')).toEqual([])
    await show('git')
    await expect.poll(() => watching(page, 'git')).toHaveLength(1)
    // Main's kept reading, then the one it makes on the return: neither is news.
    expect(await quietFor(2500, received, 'the receive lamp')).toBe(before)
    writeFileSync(path.join(repo, 'more.ts'), 'export {}\n')
    await expect(page.locator('[data-testid="git-file"][data-path="more.ts"]')).toBeVisible()
    expect(Number(await received())).toBeGreaterThan(Number(before))
  } finally {
    await close()
    removeDir(repo)
  }
})
