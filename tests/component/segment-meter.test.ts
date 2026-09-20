import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: TimerCard } = await import('../../src/renderer/widgets/timer/TimerCard.svelte')

/**
 * The ladder of segments a countdown burns down.
 *
 * Its picture is a whole number of lit segments, but its value moves every frame
 * while a countdown runs - and it was drawn again, colours read from the computed
 * style and all, for each of them: ten times a second for a picture that changes
 * once in many seconds.
 */

const ctx = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  globalAlpha: 1,
}

beforeEach(() => {
  ctx.clearRect.mockClear()
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
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(20)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const drawn = () => ctx.clearRect.mock.calls.length

const T0 = 1_700_000_000_000
const HOUR = 3_600_000

// Through the card that uses it, as the app does: a component's own props all
// change together when a test rerenders it, which would redraw it for any of them.
const card = (now: number) => ({
  timer: { id: 'a', durationMs: HOUR, running: true, startedAt: T0, accumulatedMs: 0, rang: false },
  now,
  onstart: () => {},
  onstop: () => {},
  onreset: () => {},
  onremove: () => {},
  onduration: () => {},
  onadd: () => {},
})

describe('SegmentMeter', () => {
  it('is drawn again only when the number of lit segments changes', async () => {
    const view = render(TimerCard, { props: card(T0 + 1000) })
    flushSync()
    const first = drawn()
    expect(first).toBeGreaterThan(0)
    const lit = () => view.getByTestId('timer-ladder').dataset.lit

    // A second of frames: the time left moves in each, the ladder in none.
    const before = lit()
    for (let frame = 1; frame <= 10; frame++) {
      await view.rerender(card(T0 + 1000 + frame * 100))
      flushSync()
    }
    expect(lit()).toBe(before)
    expect(drawn()).toBe(first)

    // Half an hour on, half the ladder is out: that is a new picture.
    await view.rerender(card(T0 + HOUR / 2))
    flushSync()
    expect(lit()).not.toBe(before)
    expect(drawn()).toBeGreaterThan(first)
  })
})
