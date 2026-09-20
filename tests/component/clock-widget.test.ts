import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The clock ticks on the shared wall-clock boundary (lib/frame-loop.ts), so it
 * stops rewriting the page while the window is put away or minimised - and is
 * right the moment the window is back, not a second later.
 */

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
