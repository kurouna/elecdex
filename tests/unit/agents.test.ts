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
})
