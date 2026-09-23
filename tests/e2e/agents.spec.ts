import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { launch, removeDir } from './support.js'

/**
 * The AGENT pane against a made-up Claude Code folder (ELECDEX_CLAUDE_DIR) -
 * never this machine's. The session's process is this test's own, so it counts
 * as running. What only the running app can show: that main's layer finds the
 * session, follows its record as it grows, diffs a file it changed against the
 * copy taken before, obeys the setting that says whose records to read, and
 * stops reading when the pane goes.
 */

const ID = '11111111-2222-3333-4444-555555555555'

const line = (content: unknown[]) =>
  JSON.stringify({
    type: 'assistant',
    timestamp: new Date().toISOString(),
    message: {
      model: 'claude-opus-5-5',
      role: 'assistant',
      stop_reason: 'tool_use',
      usage: { input_tokens: 5, cache_read_input_tokens: 42_000, output_tokens: 120 },
      content,
    },
  })

function claudeFolder() {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-claude-'))
  const work = path.join(dir, 'work')
  mkdirSync(path.join(dir, 'sessions'))
  mkdirSync(path.join(dir, 'projects', 'work'), { recursive: true })
  mkdirSync(path.join(dir, 'file-history', ID), { recursive: true })
  mkdirSync(work)
  writeFileSync(
    path.join(dir, 'sessions', `${process.pid}.json`),
    JSON.stringify({
      pid: process.pid,
      sessionId: ID,
      cwd: work,
      name: 'Write the orbit pane',
      status: 'busy',
      startedAt: Date.now() - 5 * 60_000,
      updatedAt: Date.now(),
    }),
  )
  writeFileSync(path.join(work, 'orbit.ts'), 'export const ISS = 25544\nexport const CSS = 48274\n')
  writeFileSync(path.join(dir, 'file-history', ID, 'abcd@v1'), 'export const ISS = 25544\n')
  const record = path.join(dir, 'projects', 'work', `${ID}.jsonl`)
  writeFileSync(
    record,
    `${[
      JSON.stringify({
        type: 'file-history-snapshot',
        snapshot: { trackedFileBackups: { 'orbit.ts': { backupFileName: 'abcd@v1' } } },
      }),
      line([{ type: 'tool_use', name: 'Edit', input: { file_path: path.join(work, 'orbit.ts') } }]),
    ].join('\n')}\n`,
  )
  return { dir, record }
}

const single = { version: 1, root: { kind: 'pane', id: 'a', widget: 'agents' } }

test('follows a session as it works, and shows what it changed in a file', async () => {
  const { dir, record } = claudeFolder()
  const { page, close } = await launch(undefined, {
    layout: single,
    env: { ELECDEX_CLAUDE_DIR: dir },
  })
  try {
    const card = page.getByTestId('agent-card')
    await expect(card).toContainText('Write the orbit pane', { timeout: 15_000 })
    await expect(page.getByTestId('agent-status')).toHaveText('BUSY')
    await expect(page.getByTestId('agent-activity')).toContainText('orbit.ts')
    await expect(card).toContainText('CTX 42k')

    // The record grows; the pane follows it without being asked.
    appendFileSync(
      record,
      `${line([{ type: 'tool_use', name: 'Bash', input: { description: 'Run the orbit tests' } }])}\n`,
    )
    await expect(page.getByTestId('agent-activity')).toContainText('Run the orbit tests', {
      timeout: 10_000,
    })

    await card.locator('.head').click()
    await page.getByTestId('agent-file').click()
    await expect(page.getByTestId('agent-diff')).toContainText('export const CSS = 48274')
    await expect(page.locator('[data-testid="agent-diff"] [data-kind="add"]')).toHaveCount(1)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('reads only the agents settings name, and nothing once the pane is gone', async () => {
  const { dir } = claudeFolder()
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [50, 50],
        children: [
          { kind: 'pane', id: 'a', widget: 'agents' },
          { kind: 'pane', id: 'c', widget: 'clock' },
        ],
      },
    },
    settings: { sound: { enabled: false }, agents: { sources: [] } },
    env: { ELECDEX_CLAUDE_DIR: dir },
  })
  try {
    await expect(page.getByTestId('agents-empty')).toContainText('turned off in settings')
    await page.evaluate(() =>
      window.elecdex.settings.patch({ agents: { sources: ['claude-code'] } }),
    )
    await expect(page.getByTestId('agent-card')).toBeVisible({ timeout: 15_000 })

    expect(await page.evaluate(() => window.elecdex.agents.watching())).toBe(true)
    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('agents')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => window.elecdex.agents.watching())).toBe(false)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('keeps the width of the session list beside the diff, across a restart', async () => {
  const { dir } = claudeFolder()
  let launched = await launch(undefined, { layout: single, env: { ELECDEX_CLAUDE_DIR: dir } })
  try {
    const page = launched.page
    await page.getByTestId('agent-card').locator('.head').click()
    await page.getByTestId('agent-file').click()
    await expect(page.getByTestId('agent-diff')).toBeVisible()
    const list = page.locator('[data-testid="agents"] .list')
    const before = (await list.boundingBox())?.width ?? 0

    const handle = await page.getByTestId('agent-split-width').boundingBox()
    if (handle === null) throw new Error('the width handle is not on screen')
    const x = handle.x + handle.width / 2
    const y = handle.y + handle.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 60, y)
    await page.mouse.move(x + 120, y)
    await page.mouse.up()
    const after = (await list.boundingBox())?.width ?? 0
    expect(after).toBeGreaterThan(before + 80)

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('agent-diff')).toBeVisible({ timeout: 15_000 })
    const again =
      (await launched.page.locator('[data-testid="agents"] .list').boundingBox())?.width ?? 0
    expect(Math.abs(again - after)).toBeLessThan(4)
  } finally {
    await launched.close()
    removeDir(dir)
  }
})
