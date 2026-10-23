import { spawn } from 'node:child_process'
import { expect, test } from '@playwright/test'
import electronPath from 'electron'
import { exited, launch, MAIN, SINGLE_CLOCK, STUB_ENV } from '../support.js'

/**
 * One elecdex per profile (main/index.ts, requestSingleInstanceLock): a second start on the same
 * profile hands over to the first and ends, and the first goes on with its window on screen.
 * background.spec.ts covers the same hand-over to a window put away in the notification area.
 */

test('a second start on the same profile ends, and the first goes on in front', async () => {
  const { app, page, userData, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    // Ended, by a code or (Linux) by a signal: a second start that stayed would never get here.
    const ended = await new Promise<{ code: number | null; signal: string | null }>((resolve) => {
      const second = spawn(
        electronPath as unknown as string,
        [MAIN, '--windowed', '--no-intro', `--user-data-dir=${userData}`],
        { env: { ...process.env, ...STUB_ENV }, stdio: 'ignore' },
      )
      second.once('exit', (code, signal) => resolve({ code, signal }))
    })
    expect(ended.code === 0 || ended.signal !== null, JSON.stringify(ended)).toBe(true)
    expect(app.process().exitCode).toBeNull()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect
      .poll(() =>
        app.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows().some((w) => w.isVisible() && !w.isMinimized()),
        ),
      )
      .toBe(true)
  } finally {
    await close()
  }
})

/** The pids of every process under `root`, as the system lists them now. */
async function descendants(root: number): Promise<number[]> {
  const { execFileSync } = await import('node:child_process')
  const rows: { pid: number; ppid: number }[] =
    process.platform === 'win32'
      ? (
          JSON.parse(
            execFileSync(
              'powershell.exe',
              [
                '-NoProfile',
                '-Command',
                'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json -Compress',
              ],
              { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
            ),
          ) as { ProcessId: number; ParentProcessId: number }[]
        ).map((r) => ({ pid: r.ProcessId, ppid: r.ParentProcessId }))
      : execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' })
          .trim()
          .split('\n')
          .map((line) => line.trim().split(/\s+/).map(Number))
          .map(([pid, ppid]) => ({ pid: pid ?? 0, ppid: ppid ?? 0 }))
  const found = new Set<number>()
  let frontier = [root]
  while (frontier.length > 0) {
    const next = rows
      .filter((r) => frontier.includes(r.ppid) && !found.has(r.pid))
      .map((r) => r.pid)
    for (const pid of next) found.add(pid)
    frontier = next
  }
  return [...found]
}

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

test('quitting leaves no process of the app behind: shells, the collector, the GPU, the pages', async () => {
  // The default layout: three shells, the metrics collector (and on Windows its sampler), panes.
  const launched = await launch()
  const { app, page } = launched
  await expect
    .poll(() => page.evaluate(async () => (await window.elecdex.pty.list()).length))
    .toBeGreaterThan(0)
  await expect
    .poll(async () => (await page.evaluate(() => window.elecdex.metrics.stats())).running)
    .toBe(true)
  const main = app.process().pid ?? 0
  const children = await descendants(main)
  expect(children.length).toBeGreaterThan(3)
  // The press quits the app under it: the page may be gone before the press answers.
  await page.keyboard.press('Control+Shift+KeyQ').catch(() => {})
  await exited(app)
  await expect
    .poll(() => children.filter(alive), {
      timeout: 15_000,
      message: 'processes left after quitting',
    })
    .toEqual([])
  await launched.close()
})
