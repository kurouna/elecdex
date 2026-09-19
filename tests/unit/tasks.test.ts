import { bandOf, dueAt, nextOccurrence, nextReminder, type Task, urgency } from '@shared/tasks'
import { describe, expect, it } from 'vitest'

/**
 * The rules a deadline follows: when a repeat comes round again, which task is
 * announced next, and how a task is banded and drawn.
 *
 * All of it is pure, and all of it decides something the user notices: a missed
 * reminder, a task that reappears on the wrong day, a meter that is full when it
 * should be empty.
 */

/** Wednesday, 16 September 2026, 10:00 local. */
const NOW = new Date(2026, 8, 16, 10, 0).getTime()
const HOUR = 3_600_000
const DAY = 86_400_000

const task = (over: Partial<Task> = {}): Task => ({
  id: 'a',
  listId: 'tasks',
  title: 'a task',
  allDay: false,
  repeat: 'none',
  done: false,
  order: 0,
  createdAt: NOW - DAY,
  updatedAt: NOW - DAY,
  ...over,
})

describe('nextOccurrence', () => {
  it('has none without a repeat', () => {
    expect(nextOccurrence(NOW, 'none', NOW)).toBeNull()
  })

  it('counts from the deadline, not from when it was ticked off', () => {
    // Done three days late, a weekly task is still due on its own day.
    const due = NOW - 3 * DAY
    const next = nextOccurrence(due, 'weekly', NOW)
    expect(next).toBe(due + 7 * DAY)
  })

  it('keeps walking forward until it is in the future', () => {
    const due = NOW - 30 * DAY
    const next = nextOccurrence(due, 'daily', NOW)
    expect(next).toBeGreaterThan(NOW)
    // And lands on the same time of day it always had.
    expect(new Date(next ?? 0).getHours()).toBe(new Date(due).getHours())
  })

  it('jumps the weekend for a weekday repeat', () => {
    const friday = new Date(2026, 8, 18, 9, 0).getTime()
    const next = nextOccurrence(friday, 'weekdays', friday)
    expect(new Date(next ?? 0).getDay()).toBe(1)
  })

  it('clamps a monthly repeat to the length of the month', () => {
    const jan31 = new Date(2026, 0, 31, 9, 0).getTime()
    const next = nextOccurrence(jan31, 'monthly', jan31)
    const date = new Date(next ?? 0)
    expect(date.getMonth()).toBe(1)
    expect(date.getDate()).toBe(28)
  })
})

describe('dueAt', () => {
  it('is the deadline, less the warning time', () => {
    expect(dueAt(task({ due: NOW + HOUR }), 5 * 60_000)).toBe(NOW + HOUR - 5 * 60_000)
  })

  it('is the end of a snooze while one is running', () => {
    expect(dueAt(task({ due: NOW, snoozedUntil: NOW + HOUR }))).toBe(NOW + HOUR)
  })

  it('is nothing for a task that is done, or has no deadline', () => {
    expect(dueAt(task({ due: NOW, done: true }))).toBeNull()
    expect(dueAt(task())).toBeNull()
  })
})

describe('nextReminder', () => {
  it('finds the soonest deadline still to be announced', () => {
    const soon = task({ id: 'soon', due: NOW + HOUR })
    const later = task({ id: 'later', due: NOW + 2 * HOUR })
    expect(nextReminder([later, soon])?.task.id).toBe('soon')
  })

  it('passes over one already announced for that deadline', () => {
    const rung = task({ id: 'rung', due: NOW + HOUR, remindedAt: NOW + HOUR })
    const other = task({ id: 'other', due: NOW + 2 * HOUR })
    expect(nextReminder([rung, other])?.task.id).toBe('other')
  })

  it('announces again once the deadline moves', () => {
    const moved = task({ id: 'moved', due: NOW + 3 * HOUR, remindedAt: NOW + HOUR })
    expect(nextReminder([moved])?.task.id).toBe('moved')
  })

  it('has nothing to say about an empty list', () => {
    expect(nextReminder([])).toBeNull()
  })
})

describe('bandOf', () => {
  it('sorts a task into the heading it belongs under', () => {
    expect(bandOf(task({ due: NOW - HOUR }), NOW)).toBe('overdue')
    expect(bandOf(task({ due: NOW + HOUR }), NOW)).toBe('today')
    expect(bandOf(task({ due: NOW + DAY }), NOW)).toBe('tomorrow')
    expect(bandOf(task({ due: NOW + 5 * DAY }), NOW)).toBe('later')
    expect(bandOf(task(), NOW)).toBe('someday')
  })

  it('reads "tomorrow" by the calendar, not by 24 hours', () => {
    const lateTonight = new Date(2026, 8, 16, 23, 30).getTime()
    expect(bandOf(task({ due: lateTonight }), NOW)).toBe('today')
  })
})

describe('urgency', () => {
  it('runs from nothing to full between being made and being due', () => {
    const half = task({ createdAt: NOW - HOUR, due: NOW + HOUR })
    expect(urgency(half, NOW)).toBeCloseTo(0.5, 5)
    expect(urgency(half, NOW - HOUR)).toBe(0)
    expect(urgency(half, NOW + HOUR)).toBe(1)
  })

  it('is full, not broken, for a task typed in already late', () => {
    expect(urgency(task({ createdAt: NOW, due: NOW - HOUR }), NOW)).toBe(1)
  })

  it('is nothing at all without a deadline', () => {
    expect(urgency(task(), NOW)).toBe(0)
  })
})
