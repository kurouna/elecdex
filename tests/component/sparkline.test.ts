import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: Sparkline } = await import('../../src/renderer/widgets/markets/Sparkline.svelte')

/**
 * The sparkline builds its line once, as a Path2D that is both filled and
 * stroked; nothing is traced on the context's own path besides the baseline
 * and the end dot.
 */

const paths: FakePath[] = []

class FakePath {
  readonly segments: string[] = []
  constructor(from?: FakePath) {
    if (from) this.segments.push(...from.segments)
    paths.push(this)
  }
  moveTo() {
    this.segments.push('M')
  }
  lineTo() {
    this.segments.push('L')
  }
  closePath() {
    this.segments.push('Z')
  }
}

const ctx = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  setLineDash: vi.fn(),
  createLinearGradient: () => ({ addColorStop: vi.fn() }),
}

beforeEach(() => {
  paths.length = 0
  for (const fn of Object.values(ctx)) if (vi.isMockFunction(fn)) fn.mockClear()
  vi.stubGlobal('Path2D', FakePath)
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
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(120)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const points = [
  { t: 0, v: 1 },
  { t: 1, v: 3 },
  { t: 2, v: 2 },
]

describe('Sparkline', () => {
  it('traces the line only once, as the path it fills and strokes', () => {
    render(Sparkline, { props: { points, baseline: null, up: true } })
    flushSync()

    const line = ctx.stroke.mock.calls.at(-1)?.[0] as FakePath | undefined
    expect(line?.segments).toEqual(['M', 'L', 'L'])
    expect(ctx.fill.mock.calls.some(([p]) => p instanceof FakePath)).toBe(true)
    // The line itself plus the fill copied from it.
    expect(paths).toHaveLength(2)
    expect(ctx.moveTo).not.toHaveBeenCalled()
    expect(ctx.lineTo).not.toHaveBeenCalled()
  })

  it('draws the baseline on the context', () => {
    render(Sparkline, { props: { points, baseline: 2, up: true } })
    flushSync()
    expect(ctx.moveTo).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).toHaveBeenCalledTimes(1)
  })
})
