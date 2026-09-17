import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SysinfoWidget from '../../src/renderer/widgets/monitor/SysinfoWidget.svelte'

/**
 * The system strip's date. It wakes on wall-clock minutes, like the clock and
 * the frame loop wake on their boundaries, and changes only when the day does.
 */
describe('SysinfoWidget date', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const mount = () => {
    const view = render(SysinfoWidget, {
      props: {
        paneId: 'p',
        title: 'system',
        props: {},
        state: {},
        active: false,
        widget: 'sysinfo',
      },
    })
    flushSync()
    return view
  }

  it('turns the date over within a few ms of midnight, mounted mid-minute', () => {
    // 23:58:37.4 local time: an unaligned minute timer would change the date at 00:00:37.
    vi.setSystemTime(new Date(2026, 8, 17, 23, 58, 37, 400))
    const view = mount()
    const date = view.getByTestId('sysinfo-date')
    expect(date.textContent).toMatch(/^SEP 17 THU$/)

    vi.advanceTimersByTime(new Date(2026, 8, 18).getTime() - Date.now())
    flushSync()
    expect(date.textContent).toMatch(/^SEP 17 THU$/)
    vi.advanceTimersByTime(10)
    flushSync()
    expect(date.textContent).toMatch(/^SEP 18 FRI$/)
    view.unmount()
  })

  it('wakes just past each wall-clock minute, keeping the date within a day', () => {
    vi.setSystemTime(new Date(2026, 8, 17, 10, 0, 12, 345))
    const view = mount()
    const cell = view.getByTestId('sysinfo-date')
    const wakes: number[] = []
    const real = globalThis.setTimeout
    const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
      fn: () => void,
      ms: number,
    ) => {
      wakes.push(Date.now() + ms)
      return real(fn, ms)
    }) as typeof setTimeout)
    vi.advanceTimersByTime(5 * 60_000)
    flushSync()
    spy.mockRestore()
    expect(wakes.length).toBeGreaterThanOrEqual(5)
    for (const at of wakes) expect(at % 60_000).toBe(5)
    expect(cell.textContent).toMatch(/^SEP 17 THU$/)
    view.unmount()
  })
})
