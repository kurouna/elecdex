import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
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
    expect(args).toEqual(['--goto', `${path.join(repo, 'app.ts')}:1`])
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
