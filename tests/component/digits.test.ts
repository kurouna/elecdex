import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { default: Digits } = await import('../../src/renderer/widgets/common/Digits.svelte')
const { default: ClockWidget } = await import(
  '../../src/renderer/widgets/monitor/ClockWidget.svelte'
)

/**
 * The rolling digits the clock, the markets and a plugin's countdown share.
 *
 * What has to hold is that only the column whose character changed is recreated:
 * the roll is a CSS animation on a new element, so a column that is rebuilt when
 * nothing about it moved would flash for no reason, and one that is kept when it
 * did change would not play at all.
 */

afterEach(() => cleanup())

const columns = (root: HTMLElement): HTMLSpanElement[] => [...root.querySelectorAll('span')]

describe('Digits', () => {
  it('recreates only the column that changed', async () => {
    const view = render(Digits, { props: { value: '01:23' } })
    flushSync()
    const before = columns(document.body)

    await view.rerender({ value: '01:24' })
    flushSync()
    const after = columns(document.body)

    expect(after).toHaveLength(before.length)
    expect(after.at(-1)).not.toBe(before.at(-1))
    // Everything up to the last figure is the very same node, separators included.
    for (let i = 0; i < before.length - 1; i += 1) expect(after[i]).toBe(before[i])
  })

  it('keeps the spaces in text that is not all figures', () => {
    render(Digits, { props: { value: '3m ago' } })
    flushSync()
    expect(document.body.textContent).toBe('3m ago')
    // The space is a column of its own, and keeps its width through `white-space:
    // pre` - an inline-block holding nothing but a space would collapse. The rule
    // itself cannot be read here: component styles are not injected under jsdom.
    expect(columns(document.body).map((cell) => cell.textContent)).toEqual([
      '3',
      'm',
      ' ',
      'a',
      'g',
      'o',
    ])
  })

  it('rolls the figures and leaves the separators alone', () => {
    render(Digits, { props: { value: '1:2' } })
    flushSync()
    const [first, separator, second] = columns(document.body)
    expect(first?.className).toContain('fx-digit')
    expect(second?.className).toContain('fx-digit')
    expect(separator?.className).not.toContain('fx-digit')
  })
})

describe('the clock', () => {
  it('rolls the second without disturbing the hour', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 19, 9, 41, 12))
    try {
      render(ClockWidget, {
        props: {
          paneId: 'p1',
          title: 'clock',
          props: {},
          state: {},
          active: false,
          widget: 'clock',
        },
      })
      flushSync()
      const before = columns(screen.getByTestId('clock'))

      // The clock wakes just past each wall-clock second (WAKE_PHASE_MS), so a
      // second and a bit covers exactly one tick.
      vi.advanceTimersByTime(1010)
      flushSync()
      const after = columns(screen.getByTestId('clock'))

      // hh:mm:ss - the last figure moved from 2 to 3, and nothing else did.
      expect(after.at(-1)?.textContent).toBe('3')
      expect(after.at(-1)).not.toBe(before.at(-1))
      expect(after[0]).toBe(before[0])
      expect(after.at(-2)).toBe(before.at(-2))
    } finally {
      vi.useRealTimers()
    }
  })
})
