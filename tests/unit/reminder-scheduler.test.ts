import { createScheduler } from '@main/reminders/scheduler'
import type { Task } from '@shared/tasks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The one timer behind every deadline.
 *
 * What is checked here is that it waits for the *next* deadline and nothing
 * else - no polling - and the two ways a plain timeout would be wrong: a task
 * that was ticked off between being scheduled and coming due, and a deadline
 * further out than setTimeout can count to.
 */

const NOW = 1_700_000_000_000
const MINUTE = 60_000

const task = (over: Partial<Task> = {}): Task => ({
  id: 'a',
  listId: 'tasks',
  title: 'a task',
  allDay: false,
  repeat: 'none',
  done: false,
  order: 0,
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the reminder scheduler', () => {
  it('waits for the soonest deadline and announces it once', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    scheduler.update(
      [task({ id: 'soon', due: NOW + MINUTE }), task({ id: 'later', due: NOW + 10 * MINUTE })],
      0,
    )

    expect(scheduler.next()).toBe(NOW + MINUTE)
    vi.advanceTimersByTime(MINUTE)
    expect(rung.map((t) => t.id)).toEqual(['soon'])

    // Having announced it, it waits for the next one rather than repeating.
    vi.advanceTimersByTime(MINUTE)
    expect(rung).toHaveLength(1)
    expect(scheduler.next()).toBe(NOW + 10 * MINUTE)
    scheduler.dispose()
  })

  it('runs no timer at all when nothing has a deadline', () => {
    const scheduler = createScheduler(() => {})
    scheduler.update([task(), task({ id: 'b', done: true, due: NOW + MINUTE })], 0)
    expect(scheduler.next()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    scheduler.dispose()
  })

  it('announces a deadline already past, on the next turn of the loop', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    scheduler.update([task({ due: NOW - MINUTE })], 0)
    expect(rung).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(rung).toHaveLength(1)
    scheduler.dispose()
  })

  it('says nothing about a task ticked off while it was waiting', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    scheduler.update([task({ due: NOW + MINUTE })], 0)
    scheduler.update([task({ due: NOW + MINUTE, done: true })], 0)
    vi.advanceTimersByTime(5 * MINUTE)
    expect(rung).toEqual([])
    scheduler.dispose()
  })

  it('brings the wait forward when a nearer deadline arrives', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    scheduler.update([task({ id: 'far', due: NOW + 10 * MINUTE })], 0)
    scheduler.update(
      [task({ id: 'far', due: NOW + 10 * MINUTE }), task({ id: 'near', due: NOW + MINUTE })],
      0,
    )
    vi.advanceTimersByTime(MINUTE)
    expect(rung.map((t) => t.id)).toEqual(['near'])
    scheduler.dispose()
  })

  it('hops towards a deadline further off than a timeout can count', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    // Sixty days: past setTimeout's 32-bit delay, which would otherwise fire at once.
    const due = NOW + 60 * 24 * 3_600_000
    scheduler.update([task({ due })], 0)
    vi.advanceTimersByTime(2_000_000_000)
    expect(rung).toEqual([])
    expect(scheduler.next()).toBe(due)
    scheduler.dispose()
  })

  it('takes the warning time off the deadline', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    scheduler.update([task({ due: NOW + 10 * MINUTE })], 5 * MINUTE)
    expect(scheduler.next()).toBe(NOW + 5 * MINUTE)
    vi.advanceTimersByTime(5 * MINUTE)
    expect(rung).toHaveLength(1)
    scheduler.dispose()
  })

  it('waits for the end of a snooze instead of the deadline', () => {
    const rung: Task[] = []
    const scheduler = createScheduler((t) => rung.push(t))
    scheduler.update([task({ due: NOW - MINUTE, snoozedUntil: NOW + MINUTE })], 0)
    expect(scheduler.next()).toBe(NOW + MINUTE)
    vi.advanceTimersByTime(MINUTE)
    expect(rung).toHaveLength(1)
    scheduler.dispose()
  })

  it('stops holding a timer once disposed', () => {
    const scheduler = createScheduler(() => {})
    scheduler.update([task({ due: NOW + MINUTE })], 0)
    expect(vi.getTimerCount()).toBe(1)
    scheduler.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
