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
    vi.advanceTimersByTime(10)
    expect(toasts.items).toEqual([])
  })

  it('drops the oldest rather than stacking without end', () => {
    for (let i = 0; i < 6; i += 1) toasts.show({ title: `t${i}`, timeoutMs: 0 })
    expect(toasts.items.map((item) => item.title)).toEqual(['t2', 't3', 't4', 't5'])
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
