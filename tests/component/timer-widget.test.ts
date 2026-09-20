import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: TimerWidget } = await import('../../src/renderer/widgets/timer/TimerWidget.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * The chrono pane.
 *
 * Two things this pins down. The running time is kept as wall-clock moments
 * rather than a count of ticks, so a pane taken down and put back - which is
 * what moving a pane does - carries on from where it was. And the stopwatch and
 * the countdowns are separate machines: they were one clock at first, so
 * starting the stopwatch started the countdown too and resetting the countdown
 * stopped the stopwatch.
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

const readout = (): string => screen.getAllByTestId('timer-readout')[0]?.textContent?.trim() ?? ''

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

const stopwatchOf = (s: Record<string, unknown>) => s.stopwatch as Record<string, unknown>
const timersOf = (s: Record<string, unknown>) => s.timers as Record<string, unknown>[]

describe('TimerWidget', () => {
  it('counts the stopwatch from the moment it was started', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    expect(stopwatchOf(state)).toMatchObject({ running: true, startedAt: T0 })

    vi.setSystemTime(T0 + 65_000)
    vi.advanceTimersByTime(200)
    await settle()
    expect(readout()).toContain('01:05')
  })

  it('leaves the countdowns alone when the stopwatch starts', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    expect(timersOf(state).every((timer) => timer.running !== true)).toBe(true)
  })

  it('leaves the stopwatch alone when a countdown is reset', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)

    await fireEvent.click(screen.getByTestId('timer-mode-timer'))
    await apply(view)
    await fireEvent.click(screen.getAllByTestId('timer-reset')[0] as HTMLElement)
    await apply(view)

    expect(stopwatchOf(state)).toMatchObject({ running: true, startedAt: T0 })
  })

  it('runs a countdown and the stopwatch at the same time', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)

    await fireEvent.click(screen.getByTestId('timer-mode-timer'))
    await apply(view)
    await fireEvent.click(screen.getAllByTestId('timer-start')[0] as HTMLElement)
    await apply(view)

    expect(stopwatchOf(state).running).toBe(true)
    expect(timersOf(state)[0]?.running).toBe(true)
    // Each mode says what the other is doing, so neither is a surprise.
    expect(screen.getByTestId('timer-stopwatch-aside')).toBeTruthy()
  })

  it('carries on across the remount a pane move causes', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    const saved = state

    view.unmount()
    vi.setSystemTime(T0 + 30_000)
    render(TimerWidget, { props: { paneId: 'p', state: saved } as never })
    await settle()
    expect(readout()).toContain('00:30')
  })

  it('banks what the stopwatch counted when it is stopped', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: {} } as never })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    vi.setSystemTime(T0 + 12_000)
    await fireEvent.click(screen.getByTestId('timer-stop'))
    await settle()
    expect(stopwatchOf(state)).toMatchObject({
      running: false,
      accumulatedMs: 12_000,
      startedAt: 0,
    })
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
    expect(stopwatchOf(state).laps).toEqual([
      { ms: 10_000, atMs: 10_000 },
      { ms: 15_000, atMs: 25_000 },
    ])
  })

  it('keeps several countdowns, each with its own duration', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: { mode: 'timer' } } as never })
    await settle()
    await fireEvent.click(
      screen.getByTestId('timer-add').querySelector('[data-minutes="3"]') as HTMLElement,
    )
    await apply(view)
    await fireEvent.click(
      screen.getByTestId('timer-add').querySelector('[data-minutes="10"]') as HTMLElement,
    )
    await apply(view)

    expect(screen.getAllByTestId('timer-card')).toHaveLength(3)
    expect(timersOf(state).map((timer) => timer.durationMs)).toEqual([300_000, 180_000, 600_000])

    // One started leaves the others where they were.
    await fireEvent.click(screen.getAllByTestId('timer-start')[1] as HTMLElement)
    await apply(view)
    expect(timersOf(state).map((timer) => timer.running)).toEqual([false, true, false])
  })

  it('removes a countdown, and leaves one behind when the last goes', async () => {
    const view = render(TimerWidget, { props: { paneId: 'p', state: { mode: 'timer' } } as never })
    await settle()
    await fireEvent.click(
      screen.getByTestId('timer-add').querySelector('[data-minutes="3"]') as HTMLElement,
    )
    await apply(view)
    expect(screen.getAllByTestId('timer-card')).toHaveLength(2)

    await fireEvent.click(screen.getAllByTestId('timer-remove')[0] as HTMLElement)
    await apply(view)
    expect(timersOf(state)).toHaveLength(1)
    expect(timersOf(state)[0]?.durationMs).toBe(180_000)

    await fireEvent.click(screen.getAllByTestId('timer-remove')[0] as HTMLElement)
    await apply(view)
    expect(timersOf(state)).toHaveLength(1)
  })

  it('counts a countdown down and raises one toast when it lands', async () => {
    const view = render(TimerWidget, {
      props: {
        paneId: 'p',
        state: {
          mode: 'timer',
          timers: [
            {
              id: 'a',
              durationMs: 60_000,
              running: false,
              startedAt: 0,
              accumulatedMs: 0,
              rang: false,
            },
          ],
        },
      } as never,
    })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)
    expect(readout()).toContain('01:00')

    vi.setSystemTime(T0 + 61_000)
    vi.advanceTimersByTime(200)
    await settle()
    await apply(view)
    expect(readout()).toContain('00:00')
    expect(toasts.items).toHaveLength(1)
    expect(timersOf(state)[0]).toMatchObject({ running: false, rang: true })

    // And not again on the next frame, nor after the pane is remounted.
    vi.advanceTimersByTime(1000)
    await settle()
    expect(toasts.items).toHaveLength(1)
  })

  it('lands a countdown while the window is put away, when no frame is drawn', async () => {
    // The frame loop stops for a window in the notification area or minimised,
    // and the countdown was only ever looked at from the loop: it rang when the
    // window came back, however long after.
    const loop = await import('../../src/renderer/lib/frame-loop.ts')
    const view = render(TimerWidget, {
      props: {
        paneId: 'p',
        state: {
          mode: 'timer',
          timers: [
            {
              id: 'a',
              durationMs: 60_000,
              running: false,
              startedAt: 0,
              accumulatedMs: 0,
              rang: false,
            },
          ],
        },
      } as never,
    })
    await settle()
    await fireEvent.click(screen.getByTestId('timer-start'))
    await apply(view)

    loop.setWindowHidden(true)
    try {
      vi.advanceTimersByTime(59_000)
      await settle()
      expect(toasts.items).toHaveLength(0)

      vi.advanceTimersByTime(1500)
      await settle()
      await apply(view)
      expect(toasts.items).toHaveLength(1)
      expect(timersOf(state)[0]).toMatchObject({ running: false, rang: true })
    } finally {
      loop.setWindowHidden(false)
    }
  })

  it('takes a duration through the calculator', async () => {
    render(TimerWidget, { props: { paneId: 'p', state: { mode: 'timer' } } as never })
    await settle()
    const field = screen.getByTestId('timer-custom')
    await fireEvent.input(field, { target: { value: '90/2' } })
    await fireEvent.keyDown(field, { key: 'Enter' })
    await settle()
    expect(timersOf(state).at(-1)?.durationMs).toBe(45 * 60_000)
  })
})
