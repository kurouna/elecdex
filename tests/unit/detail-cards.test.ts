import type { AgentSession, AgentTask } from '@shared/agents'
import type { GitFile } from '@shared/git'
import { describe, expect, it } from 'vitest'
import {
  agentFilePath,
  fileRows as agentFileRows,
  sessionRows,
  span,
  taskRows,
} from '../../src/renderer/widgets/agents/cards.js'
import { fileRows, repoFilePath } from '../../src/renderer/widgets/git/file-card.js'

/**
 * What the AGENT and git panes' detail cards say: more than their rows have
 * room for, and never the same thing the row already shows.
 */

const time = (at: number) => `T${at}`
const value = (rows: { label: string; value: string }[], label: string) =>
  rows.find((row) => row.label === label)?.value

const task = (over: Partial<AgentTask> = {}): AgentTask => ({
  id: 't1',
  kind: 'agent',
  title: 'Find every caller of the old API',
  type: 'Explore',
  background: false,
  state: 'running',
  startedAt: 0,
  endedAt: null,
  activity: { tool: 'Grep', detail: 'oldApi(', at: 0 },
  steps: 12,
  ...over,
})

const session = (over: Partial<AgentSession> = {}): AgentSession => ({
  source: 'claude-code',
  id: '11111111-2222-3333-4444-555555555555',
  title: 'Refactor the store',
  project: 'app',
  cwd: 'C:\\work\\app',
  status: 'busy',
  live: true,
  startedAt: 0,
  updatedAt: 3 * 60_000,
  model: 'claude-fable-5-1',
  activity: { tool: 'Edit', detail: 'store.ts', at: 0 },
  context: 48_000,
  output: 12_300,
  turns: 7,
  tools: [
    { name: 'Read', count: 3 },
    { name: 'Edit', count: 9 },
  ],
  files: [
    { key: 'a'.repeat(16), path: 'src/store.ts', created: false, subagent: false },
    { key: 'b'.repeat(16), path: 'src/new.ts', created: true, subagent: true },
  ],
  tasks: [task(), task({ id: 't2', state: 'done', endedAt: 60_000 })],
  partial: false,
  ...over,
})

describe('the AGENT cards', () => {
  it('say what a session is doing, with what, since when, and how big it has grown', () => {
    const rows = sessionRows(session(), 90 * 60_000, time)
    expect(value(rows, 'STATE')).toContain('busy')
    expect(value(rows, 'PROCESS')).toBe('Claude Code · running')
    expect(value(rows, 'MODEL')).toBe('claude-fable-5-1')
    expect(value(rows, 'STARTED')).toBe('T0 · 1h30 ago')
    expect(value(rows, 'LAST')).toBe('1h27 ago')
    expect(value(rows, 'SIZE')).toBe('context 48,000 tokens · written 12,300 tokens · 7 turns')
    expect(value(rows, 'NOW')).toBe('EDIT store.ts')
    expect(value(rows, 'TASKS')).toBe('1 running · 1 done')
    expect(value(rows, 'FILES')).toBe('1 changed · 1 created')
    // The busiest tools first.
    expect(value(rows, 'TOOLS')).toBe('Edit 9 · Read 3')
    expect(rows.at(-1)).toEqual({ label: 'ID', value: session().id, muted: true })
  })

  it('say when only the end of a long record was read, and leave out what is not known', () => {
    const rows = sessionRows(
      session({
        partial: true,
        context: null,
        model: '',
        activity: null,
        tasks: [],
        files: [],
        tools: [],
      }),
      0,
      time,
    )
    expect(value(rows, 'SIZE')).toContain('the recent part of a long record')
    expect(value(rows, 'SIZE')).not.toContain('context')
    for (const label of ['MODEL', 'NOW', 'TASKS', 'FILES', 'TOOLS'])
      expect(value(rows, label)).toBeUndefined()
  })

  it('say what a task is, how it stands, and for how long', () => {
    const running = taskRows(task({ background: true }), 5 * 60_000, time)
    expect(value(running, 'KIND')).toBe('subagent · Explore · in the background')
    expect(value(running, 'RUNNING')).toBe('5m')
    expect(value(running, 'STEPS')).toBe('12 tool calls')
    expect(value(running, 'LAST STEP')).toBe('GREP oldApi(')
    const ended = taskRows(
      task({ kind: 'shell', type: '', state: 'unknown', endedAt: 120_000, activity: null }),
      0,
      time,
    )
    expect(value(ended, 'KIND')).toBe('shell command')
    expect(value(ended, 'STATE')).toContain('still running when its session went')
    expect(value(ended, 'ENDED')).toBe('T120000')
    expect(value(ended, 'LASTED')).toBe('2m')
    expect(value(ended, 'STEPS')).toBeUndefined()
  })

  it('give a changed file its full path, under the session’s folder when it is inside it', () => {
    expect(agentFilePath('C:\\work\\app', 'src/store.ts')).toBe('C:\\work\\app\\src\\store.ts')
    expect(agentFilePath('/home/me/app/', 'src/a.ts')).toBe('/home/me/app/src/a.ts')
    expect(agentFilePath('C:\\work\\app', 'D:\\other\\x.ts')).toBe('D:\\other\\x.ts')
    expect(agentFilePath('/home/me/app', '/etc/hosts')).toBe('/etc/hosts')
    expect(
      value(agentFileRows(session().files[1] as AgentSession['files'][number]), 'BY'),
    ).toContain('subagent')
  })

  it('count time in minutes, then hours', () => {
    expect(span(59_000)).toBe('0m')
    expect(span(61 * 60_000)).toBe('1h01')
  })
})

describe('the git file card', () => {
  const file = (over: Partial<GitFile> = {}): GitFile => ({
    path: 'src/lib/a.ts',
    area: 'unstaged',
    code: 'M',
    added: 4,
    deleted: 1,
    binary: false,
    ...over,
  })

  it('writes the full path the way the system does', () => {
    expect(repoFilePath('C:\\work\\repo', 'src/lib/a.ts')).toBe('C:\\work\\repo\\src\\lib\\a.ts')
    expect(repoFilePath('/home/me/repo', 'src/lib/a.ts')).toBe('/home/me/repo/src/lib/a.ts')
    expect(repoFilePath('', 'a.ts')).toBe('a.ts')
    // git names the folder with forward slashes on Windows too: written whole with backslashes.
    expect(repoFilePath('C:/Users/me/repo', 'src/a.ts')).toBe('C:\\Users\\me\\repo\\src\\a.ts')
    expect(repoFilePath('C:/Users/me/repo/', 'a.ts')).toBe('C:\\Users\\me\\repo\\a.ts')
  })

  it('says what happened to the file and where it stands, in words', () => {
    const rows = fileRows(file(), '/r', false)
    expect(value(rows, 'CHANGE')).toBe('modified · in the working tree, not staged')
    expect(value(rows, 'LINES')).toBe('+4 −1')
    expect(value(fileRows(file(), '/r', true), 'CHANGE')).toBe('modified in this commit')
    const renamed = fileRows(file({ code: 'R', from: 'src/old.ts', area: 'staged' }), '/r', false)
    expect(value(renamed, 'FROM')).toBe('/r/src/old.ts')
    expect(value(fileRows(file({ binary: true, added: null }), '/r', false), 'LINES')).toBe(
      'a binary file',
    )
    expect(
      value(fileRows(file({ code: '?', area: 'untracked', added: null }), '/r', false), 'LINES'),
    ).toBeUndefined()
  })
})
