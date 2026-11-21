import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The clock ticks on the shared wall-clock boundary (lib/frame-loop.ts), so it
 * stops rewriting the page while the window is put away or minimised - and is
 * right the moment the window is back, not a second later.
 */

/** The system's zone as a test sets it; null for the machine's own. */
let zoneOverride: string | null = null
vi.mock('../../src/renderer/lib/time-zone.ts', async (original) => {
  const real = await original<typeof import('../../src/renderer/lib/time-zone.ts')>()
  return { ...real, systemTimeZone: () => zoneOverride ?? real.systemTimeZone() }
})

const loop = await import('../../src/renderer/lib/frame-loop.ts')
const { default: ClockWidget } = await import(
  '../../src/renderer/widgets/monitor/ClockWidget.svelte'
)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-14T10:20:30.010Z'))
})

afterEach(() => {
  cleanup()
  loop.setWindowHidden(false)
  vi.useRealTimers()
  zoneOverride = null
})

const shown = (): string => screen.getByTestId('clock').querySelector('time')?.textContent ?? ''
const seconds = (): string => shown().replace(/\D/g, '').slice(4, 6)

describe('ClockWidget', () => {
  it('moves on with each second', () => {
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    expect(seconds()).toBe('30')
    vi.advanceTimersByTime(2000)
    flushSync()
    expect(seconds()).toBe('32')
  })

  it('stands still while the window is put away, and is right as soon as it is back', () => {
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    loop.setWindowHidden(true)
    vi.advanceTimersByTime(15_000)
    flushSync()
    expect(seconds()).toBe('30')

    loop.setWindowHidden(false)
    flushSync()
    expect(seconds()).toBe('45')
  })
})

describe('ClockWidget behind another tab', () => {
  it('stands still while it is not the tab shown, and is right as soon as it is', async () => {
    // Found in the sweep: a clock behind a tab ticked every second for no one.
    const { rerender } = render(ClockWidget, { props: { paneId: 'p', visible: false } as never })
    flushSync()
    vi.advanceTimersByTime(5000)
    flushSync()
    expect(seconds()).toBe('30')
    await rerender({ paneId: 'p', visible: true } as never)
    flushSync()
    expect(seconds()).toBe('35')
  })
})

describe('ClockWidget, the zone', () => {
  it('names the full zone to a screen reader, with no tooltip of its own', () => {
    zoneOverride = 'Asia/Tokyo'
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    const zone = screen.getByTestId('clock-zone')
    // A title is not how elecdex says more (architecture.md §7.4); the abbreviation says enough.
    expect(zone.getAttribute('title')).toBeNull()
    expect(zone.getAttribute('aria-label')).toBe('time zone JST, Asia/Tokyo')
  })

  it('names the zone the system changes to, within the minute', () => {
    zoneOverride = 'Asia/Tokyo'
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    expect(screen.getByTestId('clock-zone').textContent).toBe('JST')
    // A trip: the system's zone is changed while the app runs.
    zoneOverride = 'America/New_York'
    vi.advanceTimersByTime(60_000)
    flushSync()
    expect(screen.getByTestId('clock-zone').textContent).toBe('EDT')
    expect(screen.getByTestId('clock-zone').getAttribute('aria-label')).toBe(
      'time zone EDT, America/New_York',
    )
  })

  it('is read as the minute, not digit by digit', () => {
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    const time = screen.getByTestId('clock').querySelector('time')
    const label = time?.getAttribute('aria-label') ?? ''
    expect(label).toMatch(/^\d{2}:\d{2}$/)
    expect(time?.getAttribute('role')).toBe('img')
    // Only the minute: the seconds go by without a new label.
    vi.advanceTimersByTime(5000)
    flushSync()
    expect(time?.getAttribute('aria-label')).toBe(label)
  })

  it('counts a long zone name in the room the digits take', () => {
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    const face = screen.getByTestId('clock').querySelector<HTMLElement>('.face')
    const zone = screen.getByTestId('clock-zone').textContent ?? ''
    expect(face?.style.getPropertyValue('--zone-chars')).toBe(String(zone.length))
  })
})
