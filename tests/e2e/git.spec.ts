import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
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
