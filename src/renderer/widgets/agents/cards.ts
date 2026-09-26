import type { AgentFile, AgentSession, AgentTask, AgentTaskState } from '@shared/agents'
import { AGENT_SOURCE_NAMES } from '@shared/agents'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What the AGENT pane's detail cards say (AgentCard.svelte, the frame being every
 * detail card's: architecture.md §7.4). Pure: the pane hands in a session, a
 * task or a file, and gets back rows of words.
 */

const exact = (n: number): string => n.toLocaleString('en-US')

/** A length of time in minutes, then hours. */
export function span(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`
}

const STATUS_WORDS: Record<AgentSession['status'], string> = {
  busy: 'busy: working on an answer',
  idle: 'idle: waiting for the next message',
  waiting: 'waiting: asking for permission or an answer',
  ended: 'ended',
  unknown: 'unknown: a state this version cannot read',
}

const TASK_WORDS: Record<AgentTaskState, string> = {
  running: 'running',
  done: 'done',
  failed: 'failed',
  stopped: 'stopped',
  unknown: 'unknown: still running when its session went',
}

/** How many tasks stand each way, in words: "2 running · 5 done". */
function taskCounts(tasks: readonly AgentTask[]): string {
  const counts = new Map<AgentTaskState, number>()
  for (const task of tasks) counts.set(task.state, (counts.get(task.state) ?? 0) + 1)
  return [...counts].map(([state, n]) => `${n} ${state}`).join(' · ')
}

/** What a session's card says below its title and folder. */
export function sessionRows(
  session: AgentSession,
  now: number,
  time: (at: number) => string,
): CardRow[] {
  const rows: CardRow[] = [
    { label: 'STATE', value: STATUS_WORDS[session.status] },
    {
      label: 'PROCESS',
      value: `${AGENT_SOURCE_NAMES[session.source]} · ${session.live ? 'running' : 'gone'}`,
    },
  ]
  if (session.model) rows.push({ label: 'MODEL', value: session.model })
  rows.push({
    label: 'STARTED',
    value: `${time(session.startedAt)} · ${span(now - session.startedAt)} ago`,
  })
  rows.push({ label: 'LAST', value: `${span(now - session.updatedAt)} ago` })
  const figures = [
    // Exact, where the row rounds: the card is where the whole figure is read.
    ...(session.context !== null ? [`context ${exact(session.context)} tokens`] : []),
    `written ${exact(session.output)} tokens`,
    `${session.turns} ${session.turns === 1 ? 'turn' : 'turns'}`,
  ]
  rows.push({
    label: 'SIZE',
    value: figures.join(' · ') + (session.partial ? ' (the recent part of a long record)' : ''),
  })
  if (session.activity !== null) {
    rows.push({
      label: 'NOW',
      value: `${session.activity.tool.toUpperCase()} ${session.activity.detail}`.trim(),
    })
  }
  if (session.tasks.length > 0) rows.push({ label: 'TASKS', value: taskCounts(session.tasks) })
  if (session.files.length > 0) {
    const created = session.files.filter((f) => f.created).length
    const changed = session.files.length - created
    rows.push({
      label: 'FILES',
      value: [
        ...(changed > 0 ? [`${changed} changed`] : []),
        ...(created > 0 ? [`${created} created`] : []),
      ].join(' · '),
    })
  }
  if (session.tools.length > 0) {
    const top = [...session.tools].sort((a, b) => b.count - a.count).slice(0, 6)
    rows.push({ label: 'TOOLS', value: top.map((t) => `${t.name} ${t.count}`).join(' · ') })
  }
  rows.push({ label: 'ID', value: session.id, muted: true })
  return rows
}

/** What a task's card says below its title. */
export function taskRows(task: AgentTask, now: number, time: (at: number) => string): CardRow[] {
  const kind = task.kind === 'agent' ? 'subagent' : 'shell command'
  const rows: CardRow[] = [
    {
      label: 'KIND',
      value: [kind, task.type, task.background ? 'in the background' : '']
        .filter(Boolean)
        .join(' · '),
    },
    { label: 'STATE', value: TASK_WORDS[task.state] },
    { label: 'STARTED', value: time(task.startedAt) },
  ]
  if (task.endedAt !== null) rows.push({ label: 'ENDED', value: time(task.endedAt) })
  rows.push({
    label: task.endedAt === null ? 'RUNNING' : 'LASTED',
    value: span((task.endedAt ?? now) - task.startedAt),
  })
  if (task.kind === 'agent') rows.push({ label: 'STEPS', value: `${task.steps} tool calls` })
  if (task.activity !== null) {
    rows.push({
      label: 'LAST STEP',
      value: `${task.activity.tool.toUpperCase()} ${task.activity.detail}`.trim(),
    })
  }
  return rows
}

const ABSOLUTE = /^(?:[a-z]:[\\/]|\\\\|\/)/i

/**
 * A changed file's full path: its path as shown is relative to the session's
 * folder when it is inside it, and whole when it is not.
 */
export function agentFilePath(cwd: string, path: string): string {
  if (ABSOLUTE.test(path) || cwd === '') return path
  const windows = cwd.includes('\\')
  const sep = windows ? '\\' : '/'
  const rest = windows ? path.replaceAll('/', '\\') : path
  return cwd.endsWith(sep) ? `${cwd}${rest}` : `${cwd}${sep}${rest}`
}

/** What a changed file's card says below its full path. */
export function fileRows(file: AgentFile): CardRow[] {
  return [
    { label: 'CHANGE', value: file.created ? 'created by the session' : 'changed by the session' },
    ...(file.subagent ? [{ label: 'BY', value: 'a subagent of the session' }] : []),
  ]
}
