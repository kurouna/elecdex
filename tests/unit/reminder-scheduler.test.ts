import { createScheduler, type ScheduleEntry } from '@main/reminders/scheduler'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The one timer behind every deadline and every alarm.
 *
 * What is checked here is that it waits for the *next* moment and nothing else -
 * no polling - and the three ways a plain timeout would be wrong: something
 * taken away between being scheduled and coming due, a moment further off than
 * setTimeout can count to, and a caller that never records what it was told.
 */

const NOW = 1_700_000_000_000
const MINUTE = 60_000

const at = (id: string, minutes: number): ScheduleEntry => ({ id, at: NOW + minutes * MINUTE })

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the scheduler', () => {
  it('waits for the soonest moment and announces it once', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('soon', 1), at('later', 10)])

    expect(scheduler.next()).toBe(NOW + MINUTE)
    vi.advanceTimersByTime(MINUTE)
    expect(rung).toEqual(['soon'])

    // Having announced it, it waits for the next one rather than repeating.
    vi.advanceTimersByTime(MINUTE)
    expect(rung).toHaveLength(1)
    expect(scheduler.next()).toBe(NOW + 10 * MINUTE)
    scheduler.dispose()
  })

  it('runs no timer at all when nothing is waiting', () => {
    const scheduler = createScheduler(() => {})
    scheduler.update([])
    expect(scheduler.next()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    scheduler.dispose()
  })

  it('announces a moment already past, on the next turn of the loop', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('late', -1)])
    expect(rung).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(rung).toEqual(['late'])
    scheduler.dispose()
  })

  it('says nothing about something taken away while it was waiting', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('gone', 1)])
    scheduler.update([])
    vi.advanceTimersByTime(5 * MINUTE)
    expect(rung).toEqual([])
    scheduler.dispose()
  })

  it('says nothing about something moved while it was waiting', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('moved', 1)])
    scheduler.update([at('moved', 30)])
    vi.advanceTimersByTime(5 * MINUTE)
    expect(rung).toEqual([])
    expect(scheduler.next()).toBe(NOW + 30 * MINUTE)
    scheduler.dispose()
  })

  it('brings the wait forward when a nearer moment arrives', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('far', 10)])
    scheduler.update([at('far', 10), at('near', 1)])
    vi.advanceTimersByTime(MINUTE)
    expect(rung).toEqual(['near'])
    scheduler.dispose()
  })

  it('hops towards a moment further off than a timeout can count', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    // Sixty days: past setTimeout's 32-bit delay, which would otherwise fire at once.
    const due = NOW + 60 * 24 * 3_600_000
    scheduler.update([{ id: 'distant', at: due }])
    vi.advanceTimersByTime(2_000_000_000)
    expect(rung).toEqual([])
    expect(scheduler.next()).toBe(due)
    scheduler.dispose()
  })

  it('announces once even when the caller records nothing', () => {
    // The caller usually marks what it was told, but its record may not be back
    // by the next update - and if it never comes, a past moment would otherwise
    // be announced on every turn of the loop.
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('quiet', -1)])
    vi.advanceTimersByTime(1)
    for (let i = 0; i < 5; i += 1) {
      scheduler.update([at('quiet', -1)])
      vi.advanceTimersByTime(1)
    }
    expect(rung).toEqual(['quiet'])
    scheduler.dispose()
  })

  it('announces again once the moment moves on', () => {
    const rung: string[] = []
    const scheduler = createScheduler((id) => rung.push(id))
    scheduler.update([at('daily', -1)])
    vi.advanceTimersByTime(1)
    expect(rung).toEqual(['daily'])

    // The next day's time of day is a new moment for the same alarm.
    scheduler.update([at('daily', 5)])
    vi.advanceTimersByTime(5 * MINUTE)
    expect(rung).toEqual(['daily', 'daily'])
    scheduler.dispose()
  })

  it('stops holding a timer once disposed', () => {
    const scheduler = createScheduler(() => {})
    scheduler.update([at('soon', 1)])
    expect(vi.getTimerCount()).toBe(1)
    scheduler.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
