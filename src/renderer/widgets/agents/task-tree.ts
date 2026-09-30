import type { AgentTask, AgentTaskState } from '@shared/agents'

/**
 * How the AGENT pane lays out a session's tasks: the running ones always in
 * sight, the finished ones folded into one row that says how they ended, opened
 * by the user per session. Pure, so the fold's rules are tested without a page.
 */

export interface TaskTree {
  running: AgentTask[]
  finished: AgentTask[]
  /** How the finished ones ended, in the order the row reads them: "3 DONE · 1 FAIL". */
  tally: { state: Exclude<AgentTaskState, 'running'>; count: number }[]
}

const ENDINGS = ['done', 'failed', 'stopped', 'unknown'] as const

/** Splits a session's tasks, keeping main's order (newest first) within each part. */
export function taskTree(tasks: readonly AgentTask[]): TaskTree {
  const running = tasks.filter((task) => task.state === 'running')
  const finished = tasks.filter((task) => task.state !== 'running')
  const tally = ENDINGS.map((state) => ({
    state,
    count: finished.filter((task) => task.state === state).length,
  })).filter((entry) => entry.count > 0)
  return { running, finished, tally }
}

/**
 * The sessions whose finished tasks are open, as pane state keeps them: a list
 * of ids, read defensively since pane state is whatever the layout file holds.
 */
export function openFolds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}

/**
 * Opens or closes one session's finished tasks. Ids of sessions no longer on
 * the board are dropped on the way, so the list in the layout cannot grow with
 * every session that has come and gone.
 */
export function toggleFold(
  folds: readonly string[],
  sessionId: string,
  present: readonly string[],
): string[] {
  const kept = folds.filter((id) => id !== sessionId && present.includes(id))
  return folds.includes(sessionId) ? kept : [...kept, sessionId]
}
