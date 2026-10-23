import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect } from '@playwright/test'
import { agentLine, claudeFolder, SESSION_ID } from '../support/fixtures.js'
import { test } from '../support/shared.js'
import { beside, launch, removeDir, single, watching } from '../support.js'

/**
 * The AI AGENT pane against a made-up Claude Code folder (ELECDEX_CLAUDE_DIR) -
 * never this machine's. The session's process is this test's own, so it counts
 * as running. What only the running app can show: that main's layer finds the
 * session, follows its record as it grows, diffs a file it changed against the
 * copy taken before, obeys the setting that says whose records to read, and
 * stops reading when the pane goes.
 */

const ID = SESSION_ID
const line = agentLine
const layout = single('agents', { id: 'a' })

test('follows a session as it works, and shows what it changed in a file', async ({ shared }) => {
  const { dir, record } = claudeFolder()
  const { page, close } = await shared({
    layout,
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

    // A rest on the session: what its row has no room for.
    await card.locator('.head').hover()
    const detail = page.getByTestId('agent-detail')
    await expect(detail).toHaveAttribute('data-kind', 'session')
    await expect(page.getByTestId('agent-detail-sub')).toHaveText(path.join(dir, 'work'))
    await expect(detail).toContainText(ID)
    await expect(detail).toContainText('tokens')
    await page.mouse.move(2, 2)
    await expect(detail).toHaveCount(0)

    await card.locator('.head').click()
    // A changed file's card gives its full path; the row gives it from the session's folder.
    await page.getByTestId('agent-file').hover()
    await expect(detail).toHaveAttribute('data-kind', 'file')
    await expect(page.getByTestId('agent-detail-title')).toHaveText(
      path.join(dir, 'work', 'orbit.ts'),
    )
    await page.getByTestId('agent-file').click()
    await expect(page.getByTestId('agent-diff')).toContainText('export const CSS = 48274')
    await expect(page.locator('[data-testid="agent-diff"] [data-kind="add"]')).toHaveCount(1)
  } finally {
    await close()
    removeDir(dir)
  }
})

test('reads only the agents settings name, and nothing once the pane is gone', async ({
  shared,
}) => {
  const { dir } = claudeFolder()
  const { page, close } = await shared({
    layout: beside('agents', { id: 'a' }),
    settings: { sound: { enabled: false }, agents: { sources: [] } },
    env: { ELECDEX_CLAUDE_DIR: dir },
  })
  try {
    await expect(page.getByTestId('agents-empty')).toContainText('turned off in settings')
    await page.evaluate(() =>
      window.elecdex.settings.patch({ agents: { sources: ['claude-code'] } }),
    )
    await expect(page.getByTestId('agent-card')).toBeVisible({ timeout: 15_000 })

    expect(await watching(page, 'agents')).toEqual(['records'])
    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('agents')).toHaveCount(0)
    await expect.poll(() => watching(page, 'agents')).toEqual([])
  } finally {
    await close()
    removeDir(dir)
  }
})

test('keeps the width of the session list beside the diff, across a restart', async () => {
  const { dir } = claudeFolder()
  let launched = await launch(undefined, { layout, env: { ELECDEX_CLAUDE_DIR: dir } })
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

test("hangs a subagent's own subagent under it, and folds them together once both end", async ({
  shared,
}) => {
  // Claude Code 2.1.299: a subagent's subagent keeps its record in the session's one folder,
  // its meta file naming the subagent that started it; that subagent's record holds the call.
  const { dir, record } = claudeFolder()
  const work = path.join(dir, 'work')
  const stamp = (offset = 0) => new Date(Date.now() + offset).toISOString()
  const call = (message: string, id: string, input: Record<string, unknown>, at = stamp()) =>
    JSON.stringify({
      type: 'assistant',
      timestamp: at,
      message: {
        id: message,
        role: 'assistant',
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id, name: 'Agent', input: { prompt: 'Look.', ...input } }],
      },
    })
  const result = (id: string, text: string, at = stamp()) =>
    JSON.stringify({
      type: 'user',
      timestamp: at,
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: text }] },
    })
  appendFileSync(
    record,
    `${call('m-outer', 'toolu_outer', { description: 'Review the release' })}\n`,
  )
  const subagents = path.join(dir, 'projects', 'work', ID, 'subagents')
  mkdirSync(subagents, { recursive: true })
  writeFileSync(
    path.join(subagents, 'agent-p1.meta.json'),
    JSON.stringify({
      agentType: 'general-purpose',
      toolUseId: 'toolu_outer',
      spawnDepth: 1,
      requestShape: 'foreground',
    }),
  )
  const outer = path.join(subagents, 'agent-p1.jsonl')
  writeFileSync(
    outer,
    `${[
      call('s-outer', 'toolu_inner', { description: 'Check the notices', run_in_background: true }),
      result('toolu_inner', 'Async agent launched successfully.\nagentId: c1 (internal ID)'),
    ].join('\n')}\n`,
  )
  writeFileSync(
    path.join(subagents, 'agent-c1.meta.json'),
    JSON.stringify({
      agentType: 'Explore',
      toolUseId: 'toolu_inner',
      parentAgentId: 'p1',
      spawnDepth: 2,
      requestShape: 'background',
    }),
  )
  writeFileSync(
    path.join(subagents, 'agent-c1.jsonl'),
    `${line([{ type: 'tool_use', name: 'Write', input: { file_path: path.join(work, 'notices.ts') } }])}\n`,
  )

  const { page, close } = await shared({
    layout,
    env: { ELECDEX_CLAUDE_DIR: dir },
  })
  try {
    const tasks = page.getByTestId('agent-task')
    const outerRow = tasks.filter({ hasText: 'Review the release' })
    await expect(tasks).toHaveCount(2, { timeout: 15_000 })
    // Under the subagent that started it, not beside it as the session's own.
    await expect(
      outerRow.getByTestId('agent-task-children').getByTestId('agent-task'),
    ).toContainText('Check the notices')
    await expect(page.getByTestId('agent-running')).toHaveText('2 RUNNING')
    // A running subagent of a subagent shows its last step, from its own record.
    const inner = outerRow.getByTestId('agent-task-children').getByTestId('agent-task-row')
    await expect(inner.getByTestId('agent-task-step')).toContainText('notices.ts')

    // A rest on either row gives that task's card, placed by that row alone.
    const detail = page.getByTestId('agent-detail')
    await inner.hover()
    await expect(detail).toHaveAttribute('data-kind', 'task')
    await expect(page.getByTestId('agent-detail-title')).toHaveText('Check the notices')
    await page.mouse.move(2, 2)
    await expect(detail).toHaveCount(0)
    await outerRow.getByTestId('agent-task-row').first().hover()
    await expect(page.getByTestId('agent-detail-title')).toHaveText('Review the release')
    await page.mouse.move(2, 2)
    await expect(detail).toHaveCount(0)

    // Its report reaches the subagent that started it: it ends there, as that record says.
    appendFileSync(
      outer,
      `${JSON.stringify({
        type: 'user',
        timestamp: stamp(),
        message: { role: 'user', content: '<agent-message from="c1">\n  Nothing missing.' },
        origin: { kind: 'peer', from: 'c1', senderTaskId: 'c1', handback: true },
      })}\n`,
    )
    await expect(page.getByTestId('agent-running')).toHaveText('1 RUNNING', { timeout: 10_000 })
    // The session waited for the outer one: its call returns, and both are done.
    appendFileSync(
      record,
      `${result('toolu_outer', 'Report delivered.\nagentId: p1', stamp(1000))}\n`,
    )
    const finished = page.getByTestId('agent-finished')
    await expect(finished).toContainText('1 FINISHED', { timeout: 10_000 })
    await expect(tasks).toHaveCount(0)
    await finished.click()
    await expect(tasks).toHaveCount(2)
    await expect(inner.getByTestId('agent-task-state')).toHaveText('DONE')
  } finally {
    await close()
    removeDir(dir)
  }
})
