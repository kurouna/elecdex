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

/** Who takes the shared frame loop: KARMAN, only while its smoke moves. */
const frameTakers = vi.hoisted(() => ({ count: 0 }))
vi.mock('../../src/renderer/lib/frame-loop.ts', async (original) => {
  const real = await original<typeof import('../../src/renderer/lib/frame-loop.ts')>()
  return {
    ...real,
    onFrame: (...args: Parameters<typeof real.onFrame>) => {
      frameTakers.count++
      return real.onFrame(...args)
    },
  }
})

const loop = await import('../../src/renderer/lib/frame-loop.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { defaultSettings } = await import('@shared/settings')
const { CLOCK_FACES } = await import('../../src/renderer/widgets/clock/faces.ts')
const { canvasContext, stubCanvas, stubMatchMedia, stubResizeObserver } = await import(
  './support/dom.ts'
)
const { stubElecdex } = await import('./support/elecdex.ts')

/** Draws every clock pane with `face`, as the settings dialog would. */
const useFace = (face: string): void => {
  appearance.settings = { ...defaultSettings(), clock: { face } }
}
const { default: ClockWidget } = await import('../../src/renderer/widgets/clock/ClockWidget.svelte')

beforeEach(() => {
  // The faces measure themselves, and AHEAD reads the alarms and tasks main keeps.
  stubResizeObserver()
  stubElecdex({
    alarms: { list: async () => ({ alarms: [] }), onChange: () => () => {} },
    tasks: { list: async () => ({ tasks: [], lists: [] }), onChange: () => () => {} },
  })
  useFace('digital')
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-14T10:20:30.010Z'))
})

afterEach(() => {
  cleanup()
  loop.setWindowHidden(false)
  vi.useRealTimers()
  zoneOverride = null
  appearance.settings = defaultSettings()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
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

describe('ClockWidget, the zone and what a screen reader hears', () => {
  it('names the minute and the full zone, the same for every face', () => {
    zoneOverride = 'Asia/Tokyo'
    vi.setSystemTime(new Date('2026-09-14T01:20:30.010Z'))
    for (const face of ['digital', 'week', 'dial']) {
      useFace(face)
      render(ClockWidget, { props: { paneId: 'p' } as never })
      flushSync()
      const clock = screen.getByTestId('clock')
      expect(clock.getAttribute('role')).toBe('img')
      expect(clock.getAttribute('aria-label')).toBe('10:20, time zone JST, Asia/Tokyo')
      // A title is not how elecdex says more (architecture.md §7.4).
      expect(clock.querySelector('[title]')).toBeNull()
      cleanup()
    }
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
    expect(screen.getByTestId('clock').dataset.zone).toBe('EDT')
    expect(screen.getByTestId('clock').getAttribute('aria-label')).toContain(
      'time zone EDT, America/New_York',
    )
  })

  it('is read as the minute: the seconds go by without a new label', () => {
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    const clock = screen.getByTestId('clock')
    const label = clock.getAttribute('aria-label')
    expect(label).toMatch(/^\d{2}:\d{2}/)
    vi.advanceTimersByTime(5000)
    flushSync()
    expect(clock.getAttribute('aria-label')).toBe(label)
  })

  it('counts a long zone name in the room DIGITAL’s digits take', () => {
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    const face = screen.getByTestId('clock').querySelector<HTMLElement>('.face')
    const zone = screen.getByTestId('clock-zone').textContent ?? ''
    expect(face?.style.getPropertyValue('--zone-chars')).toBe(String(zone.length))
  })
})

describe('ClockWidget, the face', () => {
  it('draws LONGITUDE when no face is chosen', () => {
    appearance.settings = defaultSettings()
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    expect(screen.getByTestId('clock').dataset.face).toBe('longitude')
  })

  it('follows the setting at once, every clock pane alike', () => {
    render(ClockWidget, { props: { paneId: 'a' } as never })
    render(ClockWidget, { props: { paneId: 'b' } as never })
    useFace('dial')
    flushSync()
    for (const clock of screen.getAllByTestId('clock')) expect(clock.dataset.face).toBe('dial')
    expect(screen.getAllByTestId('clock-dial')).toHaveLength(2)
  })

  it('draws a face it does not know as LONGITUDE', () => {
    useFace('gone-in-a-later-version')
    render(ClockWidget, { props: { paneId: 'p' } as never })
    flushSync()
    expect(screen.getByTestId('clock').dataset.face).toBe('longitude')
  })

  it('mounts and ticks every face in the table, and takes each down cleanly', () => {
    // Measured as the default strip, so every face lays itself out and KARMAN builds its tunnel:
    // building it once looped (an effect read the count it wrote) and stopped the pane.
    stubResizeObserver({ width: 340, height: 48 })
    vi.stubGlobal(
      'ImageData',
      class {
        readonly data: Uint8ClampedArray
        readonly width: number
        readonly height: number
        constructor(width: number, height: number) {
          this.width = width
          this.height = height
          this.data = new Uint8ClampedArray(width * height * 4)
        }
      },
    )
    stubMatchMedia(false)
    // KARMAN reads its obstacle mask back from a canvas and paints its smoke into one.
    const context: Record<string | symbol, unknown> = {
      ...(canvasContext() as object),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      }),
      putImageData: () => {},
    }
    // Any other drawing call is a no-op: only that nothing throws or loops is asked here.
    stubCanvas(new Proxy(context, { get: (t, k) => (k in t ? t[k] : () => {}) }))
    for (const face of CLOCK_FACES) {
      useFace(face.id)
      const view = render(ClockWidget, { props: { paneId: face.id } as never })
      flushSync()
      vi.advanceTimersByTime(2000)
      flushSync()
      expect(screen.getByTestId('clock').dataset.face).toBe(face.id)
      view.unmount()
    }
  })
})

describe('ClockWidget, AHEAD', () => {
  it('reads the alarms and tasks only while the pane is seen, and lets go when it is not', async () => {
    const stops = { alarms: vi.fn(), tasks: vi.fn() }
    const api = stubElecdex({
      alarms: { list: vi.fn(async () => ({ alarms: [] })), onChange: vi.fn(() => stops.alarms) },
      tasks: {
        list: vi.fn(async () => ({ tasks: [], lists: [] })),
        onChange: vi.fn(() => stops.tasks),
      },
    })
    useFace('ahead')
    const { rerender } = render(ClockWidget, { props: { paneId: 'p', visible: false } as never })
    flushSync()
    expect(api.alarms.onChange).not.toHaveBeenCalled()
    expect(api.tasks.onChange).not.toHaveBeenCalled()

    await rerender({ paneId: 'p', visible: true } as never)
    flushSync()
    expect(api.alarms.onChange).toHaveBeenCalledTimes(1)
    expect(api.tasks.onChange).toHaveBeenCalledTimes(1)

    await rerender({ paneId: 'p', visible: false } as never)
    flushSync()
    expect(stops.alarms).toHaveBeenCalledTimes(1)
    expect(stops.tasks).toHaveBeenCalledTimes(1)
  })

  it('names the nearest alarm and how long until it', async () => {
    vi.setSystemTime(new Date(2026, 8, 14, 6, 50, 0))
    stubElecdex({
      alarms: {
        list: async () => ({
          alarms: [{ id: 'a', label: 'wake', hour: 7, minute: 0, days: [], enabled: true }],
        }),
        onChange: () => () => {},
      },
      tasks: { list: async () => ({ tasks: [], lists: [] }), onChange: () => () => {} },
    })
    // The default strip, 340 by 48, with the time taking 80 of it.
    stubResizeObserver('once')
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('time') ? 80 : 340
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(48)
    useFace('ahead')
    render(ClockWidget, { props: { paneId: 'p' } as never })
    await vi.waitFor(() => {
      flushSync()
      expect(screen.getByTestId('clock-ahead-next').textContent).toBe('wake · 10m')
    })
  })
})

describe('ClockWidget, KARMAN', () => {
  /** A ResizeObserver the test reports sizes through, by hand. */
  function handResize(): (width: number, height: number) => void {
    const callbacks: Array<{ cb: ResizeObserverCallback; target: Element }> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        readonly #cb: ResizeObserverCallback
        constructor(cb: ResizeObserverCallback) {
          this.#cb = cb
        }
        observe(target: Element): void {
          callbacks.push({ cb: this.#cb, target })
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    )
    return (width, height) => {
      for (const { cb, target } of callbacks) {
        cb([{ target, contentRect: { width, height } } as never], {} as ResizeObserver)
      }
    }
  }

  function karmanStubs(): void {
    stubMatchMedia(false)
    vi.stubGlobal(
      'ImageData',
      class {
        readonly data: Uint8ClampedArray
        readonly width: number
        readonly height: number
        constructor(width: number, height: number) {
          this.width = width
          this.height = height
          this.data = new Uint8ClampedArray(width * height * 4)
        }
      },
    )
    const context: Record<string | symbol, unknown> = {
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
    }
    stubCanvas(new Proxy(context, { get: (t, k) => (k in t ? t[k] : () => {}) }))
  }

  const tunnelOf = (): string | undefined => screen.getByTestId('karman-canvas').dataset.tunnel

  it('keeps its tunnel, and the flow in it, across a turn behind another tab', () => {
    const report = handResize()
    karmanStubs()
    useFace('karman')
    render(ClockWidget, { props: { paneId: 'p' } as never })
    report(340, 80)
    flushSync()
    const first = tunnelOf()
    expect(first).toBe('1')
    // Behind a tab the pane is display: none and measures 0 x 0; back, it is its old size.
    report(0, 0)
    flushSync()
    vi.advanceTimersByTime(1000)
    report(340, 80)
    flushSync()
    vi.advanceTimersByTime(1000)
    flushSync()
    expect(tunnelOf()).toBe(first)
  })

  it('builds a tunnel for a new size only once the size has held', () => {
    const report = handResize()
    karmanStubs()
    useFace('karman')
    render(ClockWidget, { props: { paneId: 'p' } as never })
    report(340, 80)
    flushSync()
    // A divider dragged through many sizes: no tunnel for each of them.
    for (let w = 360; w <= 900; w += 60) {
      report(w, 300)
      flushSync()
      vi.advanceTimersByTime(50)
    }
    expect(tunnelOf()).toBe('1')
    vi.advanceTimersByTime(400)
    flushSync()
    expect(tunnelOf()).toBe('2')
  })

  it('takes the frame loop while its smoke moves, and not with motion reduced', () => {
    handResize()(340, 80)
    karmanStubs()
    useFace('karman')
    frameTakers.count = 0
    const report = handResize()
    const view = render(ClockWidget, { props: { paneId: 'p' } as never })
    report(340, 80)
    flushSync()
    expect(frameTakers.count).toBeGreaterThan(0)
    view.unmount()

    appearance.settings = { ...defaultSettings(), motion: 'reduced', clock: { face: 'karman' } }
    frameTakers.count = 0
    const reportStill = handResize()
    render(ClockWidget, { props: { paneId: 'q' } as never })
    reportStill(340, 80)
    flushSync()
    vi.advanceTimersByTime(3000)
    flushSync()
    expect(frameTakers.count).toBe(0)
    // Still, it moves on with the second: the tunnel is there and painted.
    expect(tunnelOf()).toBe('1')
  })
})
