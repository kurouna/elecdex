import type { AgentTask, AgentTaskState } from '@shared/agents'
import { describe, expect, it } from 'vitest'
import { openFolds, taskTree, toggleFold } from '../../src/renderer/widgets/agents/task-tree.js'

/**
 * The AGENT pane's tasks as a tree under their session: what runs is always in
 * sight, what has finished folds into one row, opened per session.
 */

const task = (id: string, state: AgentTaskState): AgentTask => ({
  id,
  kind: 'agent',
  title: id,
  type: 'Explore',
  background: true,
  state,
  startedAt: 0,
  endedAt: state === 'running' ? null : 1,
  activity: null,
  steps: 0,
})

describe('taskTree', () => {
  it('keeps the running tasks apart from the finished ones, each in the order main gave', () => {
    const tree = taskTree([
      task('a', 'running'),
      task('b', 'done'),
      task('c', 'running'),
      task('d', 'failed'),
      task('e', 'done'),
    ])
    expect(tree.running.map((t) => t.id)).toEqual(['a', 'c'])
    expect(tree.finished.map((t) => t.id)).toEqual(['b', 'd', 'e'])
  })

  it('tallies how the finished ones ended, in a fixed order and without empty counts', () => {
    const tree = taskTree([
      task('a', 'unknown'),
      task('b', 'failed'),
      task('c', 'done'),
      task('d', 'done'),
    ])
    expect(tree.tally).toEqual([
      { state: 'done', count: 2 },
      { state: 'failed', count: 1 },
      { state: 'unknown', count: 1 },
    ])
  })

  it('has nothing to fold when nothing has finished', () => {
    const tree = taskTree([task('a', 'running')])
    expect(tree.finished).toEqual([])
    expect(tree.tally).toEqual([])
  })
})

describe('the folds kept in pane state', () => {
  it('reads only a list of ids, whatever the layout file holds', () => {
    expect(openFolds(undefined)).toEqual([])
    expect(openFolds('s1')).toEqual([])
    expect(openFolds(['s1', 3, null, 's2'])).toEqual(['s1', 's2'])
  })

  it('opens and closes one session, leaving the others as they were', () => {
    const present = ['s1', 's2']
    expect(toggleFold([], 's1', present)).toEqual(['s1'])
    expect(toggleFold(['s1'], 's2', present)).toEqual(['s1', 's2'])
    expect(toggleFold(['s1', 's2'], 's1', present)).toEqual(['s2'])
  })

  it('forgets sessions that have left the board, so the list cannot grow for good', () => {
    expect(toggleFold(['gone', 's1'], 's2', ['s1', 's2'])).toEqual(['s1', 's2'])
  })
})
