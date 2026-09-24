import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

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

function makeRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-git-'))
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.test')
  git('config', 'user.name', 'Test')
  git('config', 'core.autocrlf', 'false')
  writeFileSync(path.join(dir, 'app.ts'), 'const greeting = "hello"\nexport default greeting\n')
  git('add', '.')
  git('commit', '-q', '-m', 'first commit')
  return dir
}

const git = (dir: string, ...args: string[]) =>
  execFileSync('git', args, { cwd: dir, stdio: 'pipe' })

/** Replaces the folder picker in main with one that answers `folder`. */
async function pickerAnswers(app: ElectronApplication, folder: string): Promise<void> {
  await app.evaluate(({ dialog }, answer) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [answer] })) as never
  }, folder)
}

const single = { version: 1, root: { kind: 'pane', id: 'g', widget: 'git' } }

async function watchRepo(page: Page, app: ElectronApplication, repo: string): Promise<void> {
  await pickerAnswers(app, path.join(repo))
  await page.getByTestId('git-select').click()
  await expect(page.getByTestId('git-branch')).toContainText('main')
}

test('follows a repository through an edit, staging and a commit', async () => {
  const repo = makeRepo()
  const { app, page, close } = await launch(undefined, { layout: single })
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

test('draws a file as text, whatever it holds, and lists new files', async () => {
  const repo = makeRepo()
  const { app, page, close } = await launch(undefined, { layout: single })
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
    layout: single,
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

test('stops watching when the pane goes, and says so when the folder is not a repository', async () => {
  const repo = makeRepo()
  const plain = mkdtempSync(path.join(tmpdir(), 'elecdex-notgit-'))
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [50, 50],
        children: [
          { kind: 'pane', id: 'g', widget: 'git' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
  })
  try {
    await pickerAnswers(app, plain)
    await page.getByTestId('git-select').click()
    await expect(page.getByTestId('git-problem')).toBeVisible()

    await watchRepo(page, app, repo)
    expect(await page.evaluate(() => window.elecdex.git.watching())).toHaveLength(1)
    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('git')).toHaveCount(0)
    // Main must stop watching the folder: the rule every subscription keeps.
    await expect.poll(() => page.evaluate(() => window.elecdex.git.watching())).toEqual([])
  } finally {
    await close()
    removeDir(repo)
    removeDir(plain)
  }
})

test('keeps the list width and the log height the user drags, per pane, across a restart', async () => {
  const repo = makeRepo()
  let launched = await launch(undefined, { layout: single })
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
  const { app, page, close } = await launch(undefined, { layout: single })
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

  const { app, page, close } = await launch(undefined, { layout: single })
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
    await page.waitForTimeout(1500)
    expect(existsSync(marker)).toBe(false)
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
  const { app, page, close } = await launch(undefined, { layout: single })
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
  const { app, page, close } = await launch(undefined, { layout: single })
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
