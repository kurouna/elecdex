import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseAgentDiffRequest } from '@shared/agents'
import { SettingsSchema } from '@shared/settings'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClaudeCodeSource } from '../../src/main/agents/claude/source.js'
import {
  emptyTally,
  readLines,
  readLiveRecord,
  readSubagentMeta,
  toolDetail,
} from '../../src/main/agents/claude/transcript.js'
import { AgentHub } from '../../src/main/agents/hub.js'
import type { AgentSource } from '../../src/main/agents/source.js'

/**
 * The AGENT pane's layer and its Claude Code source. The records are shaped as
 * Claude Code 2.1 writes them (seen on 2026-09-23): an assistant line carries
 * the model, the usage and the tool calls; a snapshot line names the copies of
 * files taken before they were first changed.
 */

const CWD = path.resolve('/work/app')

const assistant = (
  content: unknown[],
  usage = {},
  stop = 'tool_use',
  at = '2026-09-23T01:00:00Z',
) =>
  JSON.stringify({
    type: 'assistant',
    timestamp: at,
    message: {
      model: 'claude-opus-5-5',
      role: 'assistant',
      stop_reason: stop,
      usage: {
        input_tokens: 2,
        cache_read_input_tokens: 80_000,
        cache_creation_input_tokens: 1000,
        output_tokens: 300,
        ...usage,
      },
      content,
    },
  })

/** An answer's line, with the id every line of one answer shares. */
const answer = (id: string, content: unknown[], at = '2026-09-23T01:00:00Z') =>
  JSON.stringify({
    type: 'assistant',
    timestamp: at,
    message: { id, model: 'claude-opus-5-5', role: 'assistant', stop_reason: 'tool_use', content },
  })

const agentCall = (id: string, description: string, input: Record<string, unknown>) => ({
  type: 'tool_use',
  id,
  name: 'Agent',
  input: { description, prompt: 'Look.', ...input },
})

const shellCall = (id: string, description: string, background: boolean) => ({
  type: 'tool_use',
  id,
  name: 'Bash',
  input: { command: 'npx playwright test', description, run_in_background: background },
})

/**
 * Claude Code's notice that a background task ended: queued while the session
 * is busy (`queue`), then handed to it as a message (`user`).
 */
const notice = (as: 'queue' | 'user', id: string, status: string, at: string) => {
  const text = `<task-notification>\n<task-id>x</task-id>\n<tool-use-id>${id}</tool-use-id>\n<status>${status}</status>\n<summary>Ended</summary>\n</task-notification>`
  return JSON.stringify(
    as === 'queue'
      ? { type: 'queue-operation', operation: 'enqueue', timestamp: at, content: text }
      : {
          type: 'user',
          timestamp: at,
          message: { role: 'user', content: text },
          origin: { kind: 'task-notification' },
        },
  )
}

/** A call's result, as Claude Code hands it back to the session. */
const result = (id: string, text: string, error: boolean, at: string) =>
  JSON.stringify({
    type: 'user',
    timestamp: at,
    message: {
      role: 'user',
      content: [{ type: 'tool_result', content: text, is_error: error, tool_use_id: id }],
    },
  })

describe('reading a Claude Code record', () => {
  it('counts the tools, the tokens and the answers, and keeps the last step', () => {
    const tally = emptyTally()
    const text = [
      assistant([
        {
          type: 'tool_use',
          name: 'Bash',
          input: { command: 'npm run verify', description: 'Run verify' },
        },
      ]),
      assistant([
        { type: 'tool_use', name: 'Edit', input: { file_path: path.join(CWD, 'src', 'a.ts') } },
      ]),
      assistant([{ type: 'text', text: 'Done.\nAll green.' }], { output_tokens: 50 }, 'end_turn'),
      '',
    ].join('\n')
    expect(readLines(text, CWD, tally)).toBe('')
    expect(tally.model).toBe('claude-opus-5-5')
    expect(tally.context).toBe(81_002)
    expect(tally.output).toBe(650)
    expect(tally.turns).toBe(1)
    expect(Object.fromEntries(tally.tools)).toEqual({ Bash: 1, Edit: 1 })
    expect([...tally.files.keys()]).toEqual([path.join(CWD, 'src', 'a.ts')])
    expect(tally.activity).toMatchObject({ tool: 'reply', detail: 'Done. All green.' })
  })

  it('keeps an unfinished last line for the next reading', () => {
    const tally = emptyTally()
    const line = assistant([{ type: 'tool_use', name: 'Read', input: { file_path: 'x.md' } }])
    const rest = readLines(line.slice(0, 40), CWD, tally)
    expect(rest).toBe(line.slice(0, 40))
    readLines(`${rest}${line.slice(40)}\n`, CWD, tally)
    expect(tally.tools.get('Read')).toBe(1)
  })

  it('never parses a tool result, however large, and survives a broken line', () => {
    const tally = emptyTally()
    const huge = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: 'x'.repeat(2_000_000) },
    })
    readLines(`${huge}\n{"role":"assistant" broken\n`, CWD, tally)
    expect(tally.tools.size).toBe(0)
  })

  it('takes the first copy of each file as what it was, and marks a file it created', () => {
    const tally = emptyTally()
    const snapshot = (files: Record<string, unknown>) =>
      JSON.stringify({ type: 'file-history-snapshot', snapshot: { trackedFileBackups: files } })
    readLines(
      `${[
        snapshot({ 'src\\a.ts': { backupFileName: 'aaaa@v1', version: 1 } }),
        snapshot({
          'src\\a.ts': { backupFileName: 'aaaa@v2', version: 2 },
          'new.ts': { backupFileName: null },
        }),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    expect(tally.files.get(path.join(CWD, 'src\\a.ts'))?.backup).toBe('aaaa@v1')
    expect(tally.files.get(path.join(CWD, 'new.ts'))).toEqual({ backup: null, seen: true })
  })

  it('says what a tool worked on in a few words', () => {
    expect(toolDetail('Edit', { file_path: 'C:\\w\\src\\main.ts' })).toBe('main.ts')
    expect(toolDetail('Bash', { command: 'ls -la\n  && pwd' })).toBe('ls -la && pwd')
    expect(toolDetail('WebFetch', { url: 'https://celestrak.org/x' })).toBe('celestrak.org')
    expect(toolDetail('Grep', { pattern: 'x'.repeat(200) })).toHaveLength(80)
  })

  it('reads a live session file, and refuses anything else', () => {
    expect(
      readLiveRecord(
        '{"pid":1,"sessionId":"86bd3a49-5a2d","cwd":"C:\\\\w","name":"Pane ideas","status":"busy"}',
      ),
    ).toMatchObject({
      pid: 1,
      name: 'Pane ideas',
      status: 'busy',
    })
    expect(readLiveRecord('{"pid":1,"sessionId":"../../etc"}')).toBeNull()
    expect(readLiveRecord('not json')).toBeNull()
  })

  it('takes only a diff request it could have handed out', () => {
    const ok = { source: 'claude-code', sessionId: '86bd3a49-5a2d-4e35', key: '0123456789abcdef' }
    expect(parseAgentDiffRequest(ok)).toEqual(ok)
    expect(parseAgentDiffRequest({ ...ok, source: 'codex' })).toBeNull()
    expect(parseAgentDiffRequest({ ...ok, key: '../x' })).toBeNull()
    // Only the keys the source hands out: sixteen hex digits.
    expect(parseAgentDiffRequest({ ...ok, key: 'new:12' })).toBeNull()
  })

  it("leaves out an agent this build does not know, and keeps the user's choice of the rest", () => {
    const read = (sources: unknown) => SettingsSchema.parse({ agents: { sources } }).agents.sources
    // A newer build's settings: another agent on, Claude Code turned off. It must stay off.
    expect(read(['codex'])).toEqual([])
    expect(read(['codex', 'claude-code', 'claude-code'])).toEqual(['claude-code'])
    expect(read('everything')).toEqual(['claude-code'])
  })

  it('marks the subagents and background commands a session starts, and how each ended', () => {
    const tally = emptyTally()
    readLines(
      `${[
        answer('m1', [
          agentCall('t1', 'Review the fix', { subagent_type: 'Explore' }),
          agentCall('t2', 'Research the terms', { run_in_background: true }),
          shellCall('t3', 'Run the whole suite', true),
          shellCall('t4', 'List the files', false),
        ]),
        notice('queue', 't2', 'completed', '2026-09-23T01:05:00Z'),
        notice('user', 't3', 'failed', '2026-09-23T01:06:00Z'),
        // A progress notice ends nothing.
        notice('user', 't1', 'running', '2026-09-23T01:06:30Z'),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    expect([...tally.tasks.keys()]).toEqual(['t1', 't2', 't3'])
    expect(tally.tasks.get('t1')).toMatchObject({
      kind: 'agent',
      title: 'Review the fix',
      type: 'Explore',
      background: false,
      answeredAt: null,
      ended: null,
    })
    expect(tally.tasks.get('t2')?.ended).toEqual({
      state: 'done',
      at: Date.parse('2026-09-23T01:05:00Z'),
    })
    expect(tally.tasks.get('t3')).toMatchObject({ kind: 'shell', background: true })
    expect(tally.tasks.get('t3')?.ended?.state).toBe('failed')
  })

  it('counts a subagent the session waited for as answered only when the next answer begins', () => {
    const tally = emptyTally()
    // One answer is written as several lines, one per block: the second is not a new answer.
    readLines(
      `${[
        answer('m1', [agentCall('t1', 'Review', {})], '2026-09-23T01:00:00Z'),
        answer('m1', [agentCall('t2', 'Also review', {})], '2026-09-23T01:00:01Z'),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    expect(tally.tasks.get('t1')?.answeredAt).toBeNull()
    readLines(
      `${answer('m2', [{ type: 'text', text: 'Both done.' }], '2026-09-23T01:09:00Z')}\n`,
      CWD,
      tally,
    )
    expect(tally.tasks.get('t1')?.answeredAt).toBe(Date.parse('2026-09-23T01:09:00Z'))
    expect(tally.tasks.get('t2')?.answeredAt).toBe(Date.parse('2026-09-23T01:09:00Z'))
  })

  it('ends no task on a tool output that quotes a notice, and takes the latest notice', () => {
    const tally = emptyTally()
    const quoted = JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            content:
              '<task-notification>\n<tool-use-id>t1</tool-use-id>\n<status>completed</status>',
          },
        ],
      },
    })
    readLines(
      `${answer('m1', [agentCall('t1', 'Review', { run_in_background: true })])}\n${quoted}\n`,
      CWD,
      tally,
    )
    expect(tally.tasks.get('t1')?.ended).toBeNull()
    // Sent another message, a subagent ends again; an older notice read later changes nothing.
    readLines(
      `${[
        notice('user', 't1', 'completed', '2026-09-23T01:05:00Z'),
        notice('user', 't1', 'failed', '2026-09-23T01:08:00Z'),
        notice('queue', 't1', 'completed', '2026-09-23T01:07:00Z'),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    expect(tally.tasks.get('t1')?.ended?.state).toBe('failed')
  })

  it('ends a background command stopped with TaskStop, and one refused before it ran', () => {
    const tally = emptyTally()
    readLines(
      `${[
        answer('m1', [shellCall('t1', 'Run the suite', true), shellCall('t2', 'Build', true)]),
        result(
          't1',
          'Command running in background with ID: bx1. Output is being written to: x',
          false,
          '2026-09-23T01:00:01Z',
        ),
        result('t2', 'Permission to use Bash has been denied.', true, '2026-09-23T01:00:02Z'),
        answer(
          'm2',
          [{ type: 'tool_use', id: 't3', name: 'TaskStop', input: { task_id: 'bx1' } }],
          '2026-09-23T01:04:00Z',
        ),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    // No notice came for either: the stop and the refusal are all the record says.
    expect(tally.tasks.get('t1')?.ended).toEqual({
      state: 'stopped',
      at: Date.parse('2026-09-23T01:04:00Z'),
    })
    expect(tally.tasks.get('t2')?.ended).toEqual({
      state: 'failed',
      at: Date.parse('2026-09-23T01:00:02Z'),
    })
  })

  it('ends a subagent the session waited for by its own result, as that result says', () => {
    const tally = emptyTally()
    readLines(
      `${[
        answer('m1', [
          agentCall('t1', 'Look it up', {}),
          agentCall('t2', 'Review', {}),
          agentCall('t3', 'Explore', { subagent_type: 'Nope' }),
          agentCall('t4', 'Hunt', {}),
        ]),
        result('t1', 'Found it in PassList.', false, '2026-09-23T01:02:00Z'),
        result('t2', '[Request interrupted by user for tool use]', true, '2026-09-23T01:03:00Z'),
        result('t3', 'Agent type Nope not found.', true, '2026-09-23T01:00:01Z'),
        // No flag, but Claude Code ran it in the background: its result says so.
        result(
          't4',
          'Async agent launched successfully.\nagentId: a9f (internal ID)',
          false,
          '2026-09-23T01:00:01Z',
        ),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    expect(tally.tasks.get('t1')?.ended).toEqual({
      state: 'done',
      at: Date.parse('2026-09-23T01:02:00Z'),
    })
    expect(tally.tasks.get('t2')?.ended?.state).toBe('stopped')
    expect(tally.tasks.get('t3')?.ended?.state).toBe('failed')
    expect(tally.tasks.get('t4')).toMatchObject({ background: true, ended: null })
    readLines(
      `${answer('m2', [{ type: 'tool_use', id: 't5', name: 'TaskStop', input: { task_id: 'a9f' } }])}\n`,
      CWD,
      tally,
    )
    expect(tally.tasks.get('t4')?.ended?.state).toBe('stopped')
  })

  it("parses no tool result but a pending task's, and never one that only quotes its id", () => {
    const tally = emptyTally()
    readLines(`${answer('m1', [agentCall('t1', 'Look', {})])}\n`, CWD, tally)
    // Another call's result that mentions t1's id in its text is not t1's result.
    const quoting = JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'x9', content: '{"tool_use_id":"t1"} was here' },
        ],
      },
    })
    readLines(`${quoting}\n`, CWD, tally)
    expect(tally.tasks.get('t1')?.ended).toBeNull()
  })

  it("reads a subagent's meta file, and refuses one that names no call", () => {
    expect(
      readSubagentMeta('{"agentType":"Explore","toolUseId":"toolu_1","requestShape":"background"}'),
    ).toEqual({ toolUseId: 'toolu_1', background: true })
    expect(
      readSubagentMeta('{"toolUseId":"toolu_1","requestShape":"foreground"}')?.background,
    ).toBe(false)
    expect(readSubagentMeta('{"agentType":"Explore"}')).toBeNull()
    expect(readSubagentMeta('not json')).toBeNull()
  })

  it('takes a file written by a tool and by a backup as one file', () => {
    const tally = emptyTally()
    readLines(
      `${[
        assistant([
          { type: 'tool_use', name: 'Edit', input: { file_path: `${CWD}/src/../src/a.ts` } },
        ]),
        JSON.stringify({
          type: 'file-history-snapshot',
          snapshot: { trackedFileBackups: { 'src/a.ts': { backupFileName: 'aaaa@v1' } } },
        }),
      ].join('\n')}\n`,
      CWD,
      tally,
    )
    expect([...tally.files.keys()]).toEqual([path.join(CWD, 'src', 'a.ts')])
  })
})

describe('the Claude Code source', () => {
  let dir = ''
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  function claudeFolder(pid: number) {
    dir = mkdtempSync(path.join(tmpdir(), 'elecdex-claude-'))
    const id = '11111111-2222-3333-4444-555555555555'
    const work = path.join(dir, 'work')
    mkdirSync(path.join(dir, 'sessions'))
    mkdirSync(path.join(dir, 'projects', 'work'), { recursive: true })
    mkdirSync(path.join(dir, 'file-history', id), { recursive: true })
    mkdirSync(work)
    writeFileSync(
      path.join(dir, 'sessions', `${pid}.json`),
      JSON.stringify({
        pid,
        sessionId: id,
        cwd: work,
        name: 'Add a pane',
        status: 'busy',
        startedAt: 1,
        updatedAt: 2,
      }),
    )
    writeFileSync(path.join(work, 'a.ts'), 'one\nTWO\nthree\n')
    writeFileSync(path.join(dir, 'file-history', id, 'aaaa@v1'), 'one\ntwo\nthree\n')
    const record = path.join(dir, 'projects', 'work', `${id}.jsonl`)
    writeFileSync(
      record,
      `${[
        JSON.stringify({
          type: 'file-history-snapshot',
          snapshot: { trackedFileBackups: { 'a.ts': { backupFileName: 'aaaa@v2' } } },
        }),
        assistant([
          { type: 'tool_use', name: 'Edit', input: { file_path: path.join(work, 'a.ts') } },
        ]),
      ].join('\n')}\n`,
    )
    return { id, work, record }
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

  it('lists a running session with what it did, and diffs a file against its first copy', async () => {
    const { id } = claudeFolder(process.pid)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await settle()
    const [session] = source.sessions(Date.now())
    source.stop()
    expect(session).toMatchObject({
      id,
      title: 'Add a pane',
      status: 'busy',
      live: true,
      project: 'work',
    })
    expect(session?.activity).toMatchObject({ tool: 'Edit', detail: 'a.ts' })
    expect(session?.files).toHaveLength(1)
    source.start(() => {})
    await settle()
    const key = source.sessions(Date.now())[0]?.files[0]?.key ?? ''
    const diff = await source.diff(id, key)
    source.stop()
    const lines = diff?.hunks.flatMap((h) => h.lines).map((l) => `${l.kind}:${l.text}`)
    expect(lines).toEqual(['ctx:one', 'del:two', 'add:TWO', 'ctx:three'])
  })

  it('does not list a session whose process has gone', async () => {
    claudeFolder(2 ** 22 + 12_345)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await settle()
    expect(source.sessions(Date.now())).toEqual([])
    source.stop()
  })

  it('reads only what the record gained since the last reading', async () => {
    const { record, work } = claudeFolder(process.pid)
    const source = new ClaudeCodeSource(dir)
    let changes = 0
    source.start(() => {
      changes += 1
    })
    await settle()
    appendFileSync(
      record,
      `${assistant([{ type: 'tool_use', name: 'Bash', input: { description: 'Run the tests' } }])}\n`,
    )
    await new Promise((resolve) => setTimeout(resolve, 900))
    const [session] = source.sessions(Date.now())
    source.stop()
    expect(session?.activity).toMatchObject({ tool: 'Bash', detail: 'Run the tests' })
    expect(session?.tools).toEqual([
      { name: 'Edit', count: 1 },
      { name: 'Bash', count: 1 },
    ])
    expect(changes).toBeGreaterThan(1)
    void work
  })

  /** The session's entry, as the source keeps it: for driving a reading directly. */
  const entryOf = (source: ClaudeCodeSource, id: string) =>
    (source as unknown as { tracked: Map<string, unknown> }).tracked.get(id)
  const readNow = (source: ClaudeCodeSource, entry: unknown): Promise<void> =>
    (source as unknown as { read(entry: unknown): Promise<void> }).read(entry)
  /** Until the source has read the whole record, however long a loaded machine takes. */
  const readAll = (source: ClaudeCodeSource, id: string, record: string) =>
    vi.waitFor(
      () => {
        const entry = entryOf(source, id) as { offset: number; reading: boolean } | undefined
        if (entry === undefined || entry.reading || entry.offset < statSync(record).size)
          throw new Error('still reading')
      },
      { timeout: 10_000, interval: 10 },
    )

  it('reads again what the record gained while it was being read', async () => {
    const { id, record } = claudeFolder(process.pid)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await settle()
    const entry = entryOf(source, id)
    // A reading starts; the turn's last line lands before it ends, and its own read finds one running.
    const reading = readNow(source, entry)
    appendFileSync(record, `${assistant([{ type: 'text', text: 'Done.' }], {}, 'end_turn')}\n`)
    void readNow(source, entry)
    await reading
    await settle()
    const [session] = source.sessions(Date.now())
    source.stop()
    expect(session?.activity).toMatchObject({ tool: 'reply', detail: 'Done.' })
  })

  it('keeps a character whole when a read ends in the middle of it', async () => {
    const { id, record } = claudeFolder(process.pid)
    const reply = assistant([{ type: 'text', text: '日本語の返事です' }], {}, 'end_turn')
    const at = Buffer.byteLength(reply.slice(0, reply.indexOf('日')))
    // Filler before the reply, sized so the first read's 1 MB ends one byte into 日.
    const before = Buffer.byteLength(`${readFileSync(record, 'utf8')}`)
    const pad = 1024 * 1024 - before - at - 1 - '{"type":"user","x":""}\n'.length
    appendFileSync(record, `{"type":"user","x":"${'x'.repeat(pad)}"}\n${reply}\n`)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await readAll(source, id, record)
    const session = source.sessions(Date.now()).find((s) => s.id === id)
    source.stop()
    expect(session?.activity?.detail).toBe('日本語の返事です')
  })

  it('reads the line after one too long to keep, gathered over several reads', async () => {
    const { id, record } = claudeFolder(process.pid)
    const huge = `{"type":"user","x":"${'y'.repeat(5 * 1024 * 1024)}"}`
    appendFileSync(
      record,
      `${huge}\n${assistant([{ type: 'text', text: 'After.' }], {}, 'end_turn')}\n`,
    )
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await readAll(source, id, record)
    const session = source.sessions(Date.now()).find((s) => s.id === id)
    source.stop()
    expect(session?.activity).toMatchObject({ tool: 'reply', detail: 'After.' })
  })

  it('says it has no copy for a file written with no backup read, rather than calling it new', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    // Written after the snapshot, and no snapshot names it (a tail that began past it, say).
    writeFileSync(path.join(work, 'b.ts'), 'long\nexisting\nfile\n')
    appendFileSync(
      record,
      `${assistant([{ type: 'tool_use', name: 'Edit', input: { file_path: path.join(work, 'b.ts') } }])}\n`,
    )
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await settle()
    const session = source.sessions(Date.now()).find((s) => s.id === id)
    const file = session?.files.find((f) => f.path === 'b.ts')
    const diff = await source.diff(id, file?.key ?? '')
    source.stop()
    expect(file?.created).toBe(false)
    expect(diff?.hunks).toEqual([])
    expect(diff?.problem).toMatch(/no copy/)
  })

  it('never stamps a session with the time of asking', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    // A session that has said nothing yet: no update time, and no timed line in its record.
    writeFileSync(
      path.join(dir, 'sessions', `${process.pid}.json`),
      JSON.stringify({ pid: process.pid, sessionId: id, cwd: work, status: 'idle', startedAt: 5 }),
    )
    writeFileSync(record, '')
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await settle()
    // Two boards a second apart must still be alike, or every board is sent as new.
    const first = source.sessions(1_000)[0]?.updatedAt
    const second = source.sessions(2_000)[0]?.updatedAt
    source.stop()
    expect(first).toBe(second)
  })

  /** A subagent's record and meta file, where Claude Code puts them beside the session's. */
  function subagent(
    id: string,
    agent: string,
    call: string,
    shape: 'background' | 'foreground',
    lines: string[],
  ) {
    const folder = path.join(dir, 'projects', 'work', id, 'subagents')
    mkdirSync(folder, { recursive: true })
    writeFileSync(
      path.join(folder, `agent-${agent}.meta.json`),
      JSON.stringify({ agentType: 'general-purpose', toolUseId: call, requestShape: shape }),
    )
    const record = path.join(folder, `agent-${agent}.jsonl`)
    writeFileSync(record, `${lines.join('\n')}\n`)
    return record
  }

  const steps = (work: string, at = '2026-09-23T01:02:00Z') => [
    answer(
      's1',
      [{ type: 'tool_use', id: 'u1', name: 'Read', input: { file_path: path.join(work, 'a.ts') } }],
      at,
    ),
    answer(
      's2',
      [{ type: 'tool_use', id: 'u2', name: 'Edit', input: { file_path: path.join(work, 'c.ts') } }],
      at,
    ),
  ]

  it('shows a subagent at work from its own record, and the files it changed', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    // Started with no flag: Claude Code ran it in the background by default, as its meta file says.
    appendFileSync(record, `${answer('m1', [agentCall('toolu_a', 'Review the fix', {})])}\n`)
    appendFileSync(record, `${answer('m2', [{ type: 'text', text: 'Waiting.' }])}\n`)
    subagent(id, 'a1', 'toolu_a', 'background', steps(work))
    writeFileSync(path.join(work, 'c.ts'), 'changed by the subagent\n')
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.steps).toBe(2))
    const session = source.sessions(Date.now())[0]
    expect(session?.tasks).toEqual([
      expect.objectContaining({
        kind: 'agent',
        title: 'Review the fix',
        background: true,
        state: 'running',
        activity: expect.objectContaining({ tool: 'Edit', detail: 'c.ts' }),
      }),
    ])
    const file = session?.files.find((f) => f.path === 'c.ts')
    expect(file).toMatchObject({ subagent: true, created: false })
    expect(session?.files.find((f) => f.path === 'a.ts')?.subagent).toBe(false)
    // Claude Code keeps no copy from before a subagent's edit: the pane says so, not "all new".
    const diff = await source.diff(id, file?.key ?? '')
    expect(diff?.problem).toMatch(/subagent/)

    appendFileSync(record, `${notice('queue', 'toolu_a', 'completed', new Date().toISOString())}\n`)
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.state).toBe('done'), {
      timeout: 5000,
    })
    // A finished task stays a while, then leaves the card.
    expect(source.sessions(Date.now() + 11 * 60_000)[0]?.tasks).toEqual([])
    source.stop()
  })

  it('counts a subagent the session waited for as done once the session answers again', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    appendFileSync(record, `${answer('m1', [agentCall('toolu_f', 'Look it up', {})])}\n`)
    subagent(id, 'f1', 'toolu_f', 'foreground', steps(work))
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.steps).toBe(2))
    expect(source.sessions(Date.now())[0]?.tasks[0]).toMatchObject({
      background: false,
      state: 'running',
    })
    appendFileSync(
      record,
      `${answer('m2', [{ type: 'text', text: 'Found it.' }], new Date().toISOString())}\n`,
    )
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.state).toBe('done'), {
      timeout: 5000,
    })
    source.stop()
  })

  it('finds a subagent started while the pane is open, and runs it again when it is resumed', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await settle()
    appendFileSync(record, `${answer('m1', [agentCall('toolu_b', 'Hunt bugs', {})])}\n`)
    const sub = subagent(id, 'b1', 'toolu_b', 'background', steps(work))
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.steps).toBe(2), {
      timeout: 5000,
    })
    appendFileSync(
      record,
      `${notice('user', 'toolu_b', 'completed', new Date(Date.now() - 60_000).toISOString())}\n`,
    )
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.state).toBe('done'), {
      timeout: 5000,
    })
    // Sent another message: its record moves on past the notice.
    appendFileSync(sub, `${steps(work, new Date().toISOString())[0]}\n`)
    await vi.waitFor(
      () => expect(source.sessions(Date.now())[0]?.tasks[0]?.state).toBe('running'),
      {
        timeout: 5000,
      },
    )
    source.stop()
  }, 20_000)

  it('keeps every running task on the card, and cuts only finished ones', async () => {
    const { record } = claudeFolder(process.pid)
    const now = Date.now()
    const calls = Array.from({ length: 14 }, (_, i) => shellCall(`r${i}`, `Run ${i}`, true))
    const done = Array.from({ length: 3 }, (_, i) => shellCall(`d${i}`, `Done ${i}`, true))
    appendFileSync(
      record,
      `${[
        answer('m1', [...done, ...calls], new Date(now - 60_000).toISOString()),
        ...done.map((call) => notice('queue', call.id, 'completed', new Date(now).toISOString())),
      ].join('\n')}\n`,
    )
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks.length).toBeGreaterThan(0))
    const tasks = source.sessions(Date.now())[0]?.tasks ?? []
    source.stop()
    expect(tasks.filter((t) => t.state === 'running')).toHaveLength(14)
    expect(tasks.every((t) => t.state === 'running')).toBe(true)
  })

  it("keeps the session's own files when its subagents wrote many more", async () => {
    const { id, record, work } = claudeFolder(process.pid)
    appendFileSync(record, `${answer('m1', [agentCall('toolu_w', 'Write a lot', {})])}\n`)
    const many = Array.from({ length: 80 }, (_, i) =>
      answer(`s${i}`, [
        {
          type: 'tool_use',
          id: `w${i}`,
          name: 'Write',
          input: { file_path: path.join(work, `gen${i}.ts`) },
        },
      ]),
    )
    subagent(id, 'w1', 'toolu_w', 'background', many)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await vi.waitFor(() =>
      expect(source.sessions(Date.now())[0]?.files.some((f) => f.subagent)).toBe(true),
    )
    const files = source.sessions(Date.now())[0]?.files ?? []
    source.stop()
    expect(files.find((f) => f.path === 'a.ts')?.subagent).toBe(false)
    expect(files.length).toBeLessThanOrEqual(60)
  })

  it('looks for a subagent it cannot find once, not with every reading', async () => {
    const { id, record } = claudeFolder(process.pid)
    // Refused before it ran: no record of its own will ever come.
    appendFileSync(record, `${answer('m1', [agentCall('toolu_x', 'Never ran', {})])}\n`)
    const find = vi.spyOn(
      ClaudeCodeSource.prototype as unknown as { findSubagents(entry: unknown): void },
      'findSubagents',
    )
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await readAll(source, id, record)
    const entry = entryOf(source, id)
    for (let i = 0; i < 3; i++) {
      appendFileSync(record, `${answer(`n${i}`, [{ type: 'text', text: 'More.' }])}\n`)
      await readNow(source, entry)
    }
    source.stop()
    expect(find).toHaveBeenCalledTimes(1)
    find.mockRestore()
  })

  it('finds a subagent from its meta file changing', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    appendFileSync(record, `${answer('m1', [agentCall('toolu_m', 'Look', {})])}\n`)
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await readAll(source, id, record)
    subagent(id, 'm1', 'toolu_m', 'background', steps(work))
    // As the watcher names it: the meta file of a subagent of this session.
    ;(source as unknown as { onChange(folder: string, name: string): void }).onChange(
      'projects',
      `work/${id}/subagents/agent-m1.meta.json`,
    )
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks[0]?.steps).toBe(2), {
      timeout: 5000,
    })
    source.stop()
  })

  it('says nothing more once stopped, even with a reading under way', async () => {
    const { id, record } = claudeFolder(process.pid)
    let changes = 0
    const source = new ClaudeCodeSource(dir)
    source.start(() => {
      changes += 1
    })
    await readAll(source, id, record)
    const entry = entryOf(source, id)
    appendFileSync(record, `${answer('m1', [agentCall('toolu_s', 'Look', {})])}\n`)
    const reading = readNow(source, entry)
    source.stop()
    const before = changes
    await reading
    expect(changes).toBe(before)
  })

  it('does not guess how a task ended when its session went', async () => {
    const { id, record, work } = claudeFolder(process.pid)
    appendFileSync(
      record,
      `${answer('m1', [agentCall('toolu_c', 'Hunt', { run_in_background: true }), shellCall('toolu_s', 'Build', true)])}\n`,
    )
    const source = new ClaudeCodeSource(dir)
    source.start(() => {})
    await vi.waitFor(() => expect(source.sessions(Date.now())[0]?.tasks).toHaveLength(2))
    // The session's process is gone: its file names one that is not running.
    writeFileSync(
      path.join(dir, 'sessions', `${process.pid}.json`),
      JSON.stringify({ pid: 2 ** 22 + 12_345, sessionId: id, cwd: work, status: 'busy' }),
    )
    ;(source as unknown as { scan(): void }).scan()
    const tasks = source.sessions(Date.now())[0]?.tasks ?? []
    source.stop()
    expect(tasks.map((t) => t.state)).toEqual(['unknown', 'unknown'])
  })
})

describe('the layer', () => {
  function fake(): AgentSource & { started: number; stopped: number } {
    const source = {
      id: 'claude-code' as const,
      started: 0,
      stopped: 0,
      found: () => true,
      start: () => {
        source.started += 1
      },
      stop: () => {
        source.stopped += 1
      },
      sessions: () => [],
      diff: async () => null,
    }
    return source
  }

  it('reads nothing until subscribed, and only the sources the settings turn on', () => {
    const source = fake()
    let enabled: 'claude-code'[] = []
    const hub = new AgentHub({
      sources: { 'claude-code': source },
      enabled: () => enabled,
      now: () => 0,
      setTimer: () => 0,
      clearTimer: () => {},
      publish: () => {},
    })
    hub.sync(true)
    expect(source.started).toBe(0)
    enabled = ['claude-code']
    hub.sync(true)
    expect(source.started).toBe(1)
    hub.sync(false)
    expect(source.stopped).toBe(1)
    expect(hub.board().sources[0]).toMatchObject({ id: 'claude-code', enabled: true, found: true })
  })

  it('publishes nothing, and is not watching, once the last pane has gone', () => {
    let told = () => {}
    const source = { ...fake(), start: (changed: () => void) => (told = changed) }
    const timers: (() => void)[] = []
    const published: unknown[] = []
    const hub = new AgentHub({
      sources: { 'claude-code': source },
      enabled: () => ['claude-code'],
      now: () => 0,
      setTimer: (fn: () => void) => timers.push(fn),
      clearTimer: () => {},
      publish: (board) => published.push(board),
    })
    hub.sync(true)
    for (const fn of timers.splice(0)) fn()
    hub.sync(false)
    // A reading that was under way when the pane went reports in late.
    told()
    for (const fn of timers.splice(0)) fn()
    expect(published).toHaveLength(1)
    expect(hub.active).toBe(false)
  })
})
