import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Things on disk made for a test in a temp folder: a git repository, a Claude Code folder. The
 * test removes them (`removeDir`) when it is done.
 */

/** Runs git in `dir`, quietly, and answers what it wrote. */
export const git = (dir: string, ...args: string[]): Buffer =>
  execFileSync('git', args, { cwd: dir, stdio: 'pipe' })

/**
 * A repository on `main` with one commit ("first commit") of `app.ts`, a committer of its own
 * and no line-ending conversion, so a diff reads the same on every platform.
 */
export function makeRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-git-'))
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@example.test')
  git(dir, 'config', 'user.name', 'Test')
  git(dir, 'config', 'core.autocrlf', 'false')
  writeFileSync(path.join(dir, 'app.ts'), 'const greeting = "hello"\nexport default greeting\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'first commit')
  return dir
}

/** The session id of {@link claudeFolder}'s one session. */
export const SESSION_ID = '11111111-2222-3333-4444-555555555555'

/** One line of a Claude Code record: the model's turn, with `content` and its usage. */
export const agentLine = (content: unknown[]): string =>
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

/**
 * A made-up Claude Code folder (for `ELECDEX_CLAUDE_DIR`) with one busy session, "Write the
 * orbit pane", whose process is this test's own, so it counts as running. Its record has edited
 * `work/orbit.ts`, and the file history keeps the copy from before the edit.
 */
export function claudeFolder(): { dir: string; record: string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-e2e-claude-'))
  const work = path.join(dir, 'work')
  mkdirSync(path.join(dir, 'sessions'))
  mkdirSync(path.join(dir, 'projects', 'work'), { recursive: true })
  mkdirSync(path.join(dir, 'file-history', SESSION_ID), { recursive: true })
  mkdirSync(work)
  writeFileSync(
    path.join(dir, 'sessions', `${process.pid}.json`),
    JSON.stringify({
      pid: process.pid,
      sessionId: SESSION_ID,
      cwd: work,
      name: 'Write the orbit pane',
      status: 'busy',
      startedAt: Date.now() - 5 * 60_000,
      updatedAt: Date.now(),
    }),
  )
  writeFileSync(path.join(work, 'orbit.ts'), 'export const ISS = 25544\nexport const CSS = 48274\n')
  writeFileSync(path.join(dir, 'file-history', SESSION_ID, 'abcd@v1'), 'export const ISS = 25544\n')
  const record = path.join(dir, 'projects', 'work', `${SESSION_ID}.jsonl`)
  writeFileSync(
    record,
    `${[
      JSON.stringify({
        type: 'file-history-snapshot',
        snapshot: { trackedFileBackups: { 'orbit.ts': { backupFileName: 'abcd@v1' } } },
      }),
      agentLine([
        { type: 'tool_use', name: 'Edit', input: { file_path: path.join(work, 'orbit.ts') } },
      ]),
    ].join('\n')}\n`,
  )
  return { dir, record }
}
