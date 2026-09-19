import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: TimerWidget } = await import('../../src/renderer/widgets/timer/TimerWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * The chrono pane.
 *
 * The point of the whole design is that the running time is kept as wall-clock
 * moments rather than a count of ticks, so this checks the thing that proves it:
 * a pane taken down and put back - which is what moving a pane does - carries on
 * from where it was, rather than starting again or freezing.
 */

const T0 = 1_700_000_000_000

let state: Record<string, unknown>

beforeEach(() => {
  state = {}
  vi.useFakeTimers()
  vi.setSystemTime(T0)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #callback: () => void
      constructor(callback: () => void) {
        this.#callback = callback
      }
      observe() {
        this.#callback()
      }
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    layout: { load: vi.fn(), save: vi.fn(async () => undefined) },
  })
  vi.spyOn(layout, 'setPaneState').mockImplementation((_id, next) => {
    state = structuredClone(next)
  })
})

afterEach(async () => {
  cleanup()
  toasts.clear()
  await layout.flush()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

const readout = (): string => screen.getByTestId('timer-readout').textContent?.trim() ?? ''

/**
 * Hands the pane state back, as the layout store would.
 *
 * The widget has no state of its own: everything it knows is in the pane state,
 * which it writes through the layout store and reads back as a prop. The mock
 * has to close that loop or the pane never sees its own change.
 */
async function apply(view: { rerender: (props: never) => Promise<void> }): Promise<void> {
  await view.rerender({ paneId: 'p', state } as never)
  await settle()
}

describe('TimerWidget', () => {
  it('counts from the moment it was started', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    expect(state).toMatchObject({ running: true, startedAt: T0 })

    vi.setSystemTime(T0 + 65_000)
    await settle()
    // The readout is driven by the shared loop; ask it for the frame.
    vi.advanceTimersByTime(200)
    await settle()
    expect(readout()).toContain('01:05')
  })

  it('carries on across the remount a pane move causes', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    const saved = state

    // The pane is moved: the widget is destroyed and made again with its state.
    view.unmount()
    vi.setSystemTime(T0 + 30_000)
    render(TimerWidget, { props: { paneId: 'p', state: saved } as never })
    await settle()
    expect(readout()).toContain('00:30')
  })

  it('banks what was counted when it is stopped', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    vi.setSystemTime(T0 + 12_000)
    await fireEvent.click(screen.getByTestId('timer-stop'))
    await settle()
    expect(state).toMatchObject({ running: false, accumulatedMs: 12_000, startedAt: 0 })
  })

  it('takes a lap as the time since the last one', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)

    vi.setSystemTime(T0 + 10_000)
    await fireEvent.click(screen.getByTestId('timer-lap'))
    await apply(view)

    vi.setSystemTime(T0 + 25_000)
    await fireEvent.click(screen.getByTestId('timer-lap'))
    await settle()
    expect(state.laps).toEqual([
      { ms: 10_000, atMs: 10_000 },
      { ms: 15_000, atMs: 25_000 },
    ])
  })

  it('counts a timer down and raises one toast when it lands', async () => {
    const view = render(TimerWidget, {
      props: { paneId: 'p', state: { mode: 'timer', durationMs: 60_000 } } as never,
    })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    expect(readout()).toContain('01:00')

    vi.setSystemTime(T0 + 61_000)
    vi.advanceTimersByTime(200)
    await settle()
    expect(readout()).toContain('00:00')
    expect(toasts.items).toHaveLength(1)
    expect(state).toMatchObject({ running: false })

    // And not again on the next frame.
    vi.advanceTimersByTime(1000)
    await settle()
    expect(toasts.items).toHaveLength(1)
  })

  it('takes a custom duration through the calculator', async () => {
    render(TimerWidget, { props: { paneId: 'p', state: { mode: 'timer' } } as never })
    await settle()
    const field = screen.getByTestId('timer-custom')
    await fireEvent.input(field, { target: { value: '90/2' } })
    await fireEvent.keyDown(field, { key: 'Enter' })
    await settle()
    expect(state.durationMs).toBe(45 * 60_000)
  })
})
