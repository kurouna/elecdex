import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * The toast stack.
 *
 * Two rules it exists to keep: a toast never disappears from under the pointer
 * that is reaching for its button, and the stack cannot grow into a wall of
 * cards that hides the workspace.
 */

beforeEach(() => {
  vi.useFakeTimers()
  toasts.clear()
})

afterEach(() => {
  toasts.hold(false)
  toasts.clear()
  vi.useRealTimers()
})

describe('the toast stack', () => {
  it('takes a toast away when its time is up', () => {
    toasts.show({ title: 'done', timeoutMs: 5000 })
    expect(toasts.items).toHaveLength(1)
    vi.advanceTimersByTime(5000)
    expect(toasts.items).toEqual([])
  })

  it('keeps one that asks to stay until it is dismissed', () => {
    const id = toasts.show({ title: 'waiting', timeoutMs: 0 })
    vi.advanceTimersByTime(600_000)
    expect(toasts.items).toHaveLength(1)
    toasts.dismiss(id)
    expect(toasts.items).toEqual([])
  })

  it('holds everything open while the pointer is over the stack', () => {
    toasts.show({ title: 'reachable', timeoutMs: 1000 })
    toasts.hold(true)
    vi.advanceTimersByTime(60_000)
    expect(toasts.items).toHaveLength(1)

    // And goes on counting from where it was once the pointer leaves.
    toasts.hold(false)
    vi.advanceTimersByTime(999)
    expect(toasts.items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.items).toEqual([])
  })

  it('takes only the answered card away when the pointer leaves after a long hold', () => {
    // The user's report: two reminders and an alarm up, the pointer resting on
    // the stack past the reminders' twenty seconds, DISMISS on the alarm - and
    // the reminders went with it, all at once, as the pointer left.
    toasts.show({ title: 'report due', timeoutMs: 20_000 })
    vi.advanceTimersByTime(5000)
    toasts.show({ title: 'call back', timeoutMs: 20_000 })
    const alarm = toasts.show({ title: 'lunch', timeoutMs: 0 })
    vi.advanceTimersByTime(1000)
    toasts.hold(true)
    vi.advanceTimersByTime(30_000)
    toasts.dismiss(alarm)
    toasts.hold(false)
    expect(toasts.items.map((item) => item.title)).toEqual(['report due', 'call back'])

    // Each goes on from where its fuse stopped: 14 s left, and 19 s.
    vi.advanceTimersByTime(14_000)
    expect(toasts.items.map((item) => item.title)).toEqual(['call back'])
    vi.advanceTimersByTime(5000)
    expect(toasts.items).toEqual([])
  })

  it('counts a toast raised under the pointer from when the pointer leaves', () => {
    toasts.hold(true)
    vi.advanceTimersByTime(10_000)
    toasts.show({ title: 'raised while held', timeoutMs: 5000 })
    vi.advanceTimersByTime(10_000)
    toasts.hold(false)
    vi.advanceTimersByTime(4999)
    expect(toasts.items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.items).toEqual([])
  })

  it('does not hold the next toast for a pointer whose stack went away under it', () => {
    const last = toasts.show({ title: 'answered', timeoutMs: 0 })
    toasts.hold(true)
    // The last card goes, and the stack with it: no pointerleave comes.
    toasts.dismiss(last)
    toasts.show({ title: 'next', timeoutMs: 1000 })
    vi.advanceTimersByTime(1000)
    expect(toasts.items).toEqual([])
  })

  it('drops the oldest rather than stacking without end', () => {
    for (let i = 0; i < 6; i += 1) toasts.show({ title: `t${i}`, timeoutMs: 0 })
    expect(toasts.items.map((item) => item.title)).toEqual(['t2', 't3', 't4', 't5'])
  })

  it('drops a card that would go of its own accord before one waiting for an answer', () => {
    toasts.show({ title: 'alarm 1', timeoutMs: 0 })
    toasts.show({ title: 'alarm 2', timeoutMs: 0 })
    toasts.show({ title: 'timer finished', timeoutMs: 10_000 })
    toasts.show({ title: 'alarm 3', timeoutMs: 0 })
    toasts.show({ title: 'alarm 4', timeoutMs: 0 })
    expect(toasts.items.map((item) => item.title)).toEqual([
      'alarm 1',
      'alarm 2',
      'alarm 3',
      'alarm 4',
    ])

    // The newest is never the one dropped, timed or not.
    toasts.show({ title: 'alarm removed', timeoutMs: 10_000 })
    expect(toasts.items.map((item) => item.title)).toEqual([
      'alarm 2',
      'alarm 3',
      'alarm 4',
      'alarm removed',
    ])
  })

  it('closes on an action, unless the action asks to stay', () => {
    const id = toasts.show({
      title: 'undo?',
      timeoutMs: 0,
      actions: [{ label: 'go', run: () => undefined }],
    })
    const action = toasts.items[0]?.actions[0]
    expect(action).toBeTruthy()
    if (action) toasts.run(id, action)
    expect(toasts.items).toEqual([])

    const kept = toasts.show({
      title: 'stay',
      timeoutMs: 0,
      actions: [{ label: 'more', run: () => true }],
    })
    const sticky = toasts.items[0]?.actions[0]
    if (sticky) toasts.run(kept, sticky)
    expect(toasts.items).toHaveLength(1)
  })
})
