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
const TEN_MINUTES = 600_000

// Through the card that uses it, as the app does: a component's own props all
// change together when a test rerenders it, which would redraw it for any of them.
const card = (now: number, durationMs = HOUR) => ({
  timer: { id: 'a', durationMs, running: true, startedAt: T0, accumulatedMs: 0, rang: false },
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

  it('is drawn again when the tone changes, though the same segments are lit', () => {
    // The colours are read from the computed style at draw time, so a tone the
    // ladder is never redrawn for is a tone it never takes. On a ten-minute
    // countdown one segment is nearly a minute, so the warn at ten seconds and
    // the danger at three both fall inside the last segment: the readout beside
    // it went amber and then red while the ladder stayed accent.
    const at = (left: number) => card(T0 + TEN_MINUTES - left, TEN_MINUTES)
    const view = render(TimerCard, { props: at(11_000) })
    flushSync()
    const lit = () => view.getByTestId('timer-ladder').dataset.lit
    const accent = drawn()
    expect(lit()).toBe('1')

    view.rerender(at(8000))
    flushSync()
    expect(lit()).toBe('1')
    const warn = drawn()
    expect(warn).toBeGreaterThan(accent)

    view.rerender(at(2000))
    flushSync()
    expect(lit()).toBe('1')
    expect(drawn()).toBeGreaterThan(warn)
  })
})
