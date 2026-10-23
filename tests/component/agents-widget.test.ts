import type { AgentBoard, AgentSession, AgentTask } from '@shared/agents'
import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { settle } from './support/settle.ts'

const { default: AgentsWidget } = await import(
  '../../src/renderer/widgets/agents/AgentsWidget.svelte'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The AI AGENT pane over a hand-driven main: how it draws the tasks a session runs and the files
 * they changed. Reading them from Claude Code's records is main's (agents.test.ts); ordering and
 * folding them is task-tree.ts's (agent-task-tree.test.ts).
 */

const ID = '0123abcd-0000-4000-8000-000000000001'
const NOW = Date.now()

const task = (id: string, change: Partial<AgentTask>): AgentTask => ({
  id,
  kind: 'agent',
  title: id,
  type: '',
  background: true,
  state: 'running',
  startedAt: NOW - 60_000,
  endedAt: null,
  activity: null,
  steps: 0,
  children: [],
  ...change,
})

const session = (tasks: AgentTask[]): AgentSession => ({
  source: 'claude-code',
  id: ID,
  title: 'Fix the orbits',
  project: 'work',
  cwd: '/home/dev/work',
  status: 'busy',
  live: true,
  startedAt: NOW - 120_000,
  updatedAt: NOW,
  model: 'm',
  activity: null,
  context: null,
  output: 0,
  turns: 1,
  tools: [],
  files: [
    { key: '0000000000000001', path: 'tle.ts', created: false, subagent: true },
    { key: '0000000000000002', path: 'main.ts', created: false, subagent: false },
  ],
  tasks,
  partial: false,
})

const board = (tasks: AgentTask[]): AgentBoard => ({
  sources: [{ id: 'claude-code', name: 'Claude Code', enabled: true, found: true, problem: null }],
  sessions: [session(tasks)],
  readAt: NOW,
})

let deliver: ((next: AgentBoard) => void) | null

beforeEach(() => {
  deliver = null
  vi.stubGlobal('elecdex', {
    agents: {
      subscribe: (handler: (next: AgentBoard) => void) => {
        deliver = handler
        return () => {
          deliver = null
        }
      },
      diff: async () => null,
    },
  })
  vi.spyOn(layout, 'patchPaneState').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const rows = () => screen.queryAllByTestId('agent-task')
const row = (title: string) => rows().find((r) => r.textContent?.includes(title)) as HTMLElement

describe('AgentsWidget', () => {
  it('draws a subagent and a background command as theirs, and folds them once they end', async () => {
    const view = render(AgentsWidget, {
      props: { paneId: 'a', state: { open: ID } } as never,
    })
    await settle()
    const sub = task('toolu_sub', {
      title: 'Hunt the orbit bugs',
      type: 'Explore',
      activity: { tool: 'Write', detail: 'tle.ts', at: NOW },
      steps: 1,
    })
    const shell = task('toolu_sh', { kind: 'shell', title: 'Run the whole suite' })
    deliver?.(board([sub, shell]))
    await settle()

    expect(rows()).toHaveLength(2)
    expect(screen.getByTestId('agent-running').textContent).toBe('2 RUNNING')
    expect(row('Hunt the orbit bugs').textContent).toContain('AGENT')
    expect(
      row('Hunt the orbit bugs').querySelector('[data-testid=agent-task-step]')?.textContent,
    ).toContain('tle.ts')
    expect(row('Run the whole suite').textContent).toContain('SHELL')
    // What a subagent wrote is among the session's files, marked as its; the session's own is not.
    const files = screen.getAllByTestId('agent-file')
    expect(files.find((f) => f.textContent?.includes('tle.ts'))?.textContent).toContain('SUB')
    expect(files.find((f) => f.textContent?.includes('main.ts'))?.textContent).not.toContain('SUB')

    const ended = { endedAt: NOW - 1000, activity: null }
    deliver?.(
      board([
        { ...sub, ...ended, state: 'done' },
        { ...shell, ...ended, state: 'failed' },
      ]),
    )
    await settle()
    // Finished, they fold into one row under the session that says how they ended.
    const finished = screen.getByTestId('agent-finished')
    expect(finished.textContent).toContain('2 FINISHED')
    expect(finished.textContent).toContain('1 DONE')
    expect(finished.textContent).toContain('1 FAIL')
    expect(finished.getAttribute('aria-expanded')).toBe('false')
    expect(rows()).toHaveLength(0)
    expect(screen.queryByTestId('agent-running')).toBeNull()

    // Unfolded (the fold is pane state), each is there with how it ended.
    await view.rerender({ state: { open: ID, finished: [ID] } })
    await settle()
    const state = (title: string) =>
      row(title).querySelector('[data-testid=agent-task-state]')?.textContent
    expect(state('Hunt the orbit bugs')).toBe('DONE')
    expect(state('Run the whole suite')).toBe('FAIL')
    expect(screen.queryByTestId('agent-task-step')).toBeNull()
  })
})
