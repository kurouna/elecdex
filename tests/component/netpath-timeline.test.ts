import type { EtherEvent, EtherPoint } from '@shared/ethernet'
import type { TrackEvent, WifiPoint } from '@shared/wifi'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: WifiTimeline } = await import('../../src/renderer/widgets/wifi/Timeline.svelte')
const { default: EtherTimeline } = await import(
  '../../src/renderer/widgets/ethernet/Timeline.svelte'
)

/**
 * The two panes' timelines (widgets/wifi/Timeline.svelte,
 * widgets/ethernet/Timeline.svelte) around their canvas: the header with its
 * legend and windows, the lanes' names and cards, the canvas drawn on mount and
 * again when what it reads changes, and the crosshair's readout of a moment.
 * Written before the two were put on one frame, so the frame keeps what each
 * one showed. The canvas itself is a stand-in: what it draws is draw.ts's.
 */

const NOW = 1_790_000_000_000
const SIZE = { width: 600, height: 300 }
/** Where the plot starts: the lanes' names take the room to its left. */
const LABEL = 46
const drawn: string[] = []
const ctx = new Proxy(
  {},
  {
    get: (_target, name) =>
      name === 'measureText'
        ? () => ({ width: 10 })
        : typeof name === 'string'
          ? (..._args: unknown[]) => drawn.push(name)
          : undefined,
    set: () => true,
  },
)

beforeEach(() => {
  drawn.length = 0
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly report: ResizeObserverCallback
      constructor(report: ResizeObserverCallback) {
        this.report = report
      }
      observe(target: Element): void {
        this.report(
          [{ target, contentRect: { ...SIZE } } as unknown as ResizeObserverEntry],
          this as never,
        )
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

/** The pointer over the plot at `secondsAgo` in the one-minute window. */
function xAt(secondsAgo: number): number {
  return LABEL + ((60 - secondsAgo) / 60) * (SIZE.width - LABEL)
}

const clock = (at: number): string => new Date(at).toTimeString().slice(0, 8)

const lines = (el: HTMLElement): string[] =>
  [...el.children].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())

const wifiPoint = (at: number, over: Partial<WifiPoint> = {}): WifiPoint => ({
  at,
  state: 'connected',
  rssi: -55,
  quality: 90,
  rxMbps: 1200,
  txMbps: 960,
  retry: 3,
  frames: 300,
  retries: 9,
  gateway: 2,
  internet: 0.4,
  up: 20_000,
  down: 2_000_000,
  freqMhz: 5300,
  channel: 60,
  internetState: 'internet',
  ...over,
})

const etherPoint = (at: number, over: Partial<EtherPoint> = {}): EtherPoint => ({
  at,
  state: 'up',
  speed: 1000,
  duplex: 'full',
  up: 20_000,
  down: 2_000_000,
  rxPackets: 1000,
  errors: 2.4,
  broadcast: 5,
  multicast: 1,
  gateway: 0.5,
  internet: 21.4,
  internetState: 'internet',
  route: 'default',
  carrierDowns: 0,
  ...over,
})

/** Every second of the last minute, the one 30 s ago as `at30` says. */
function minute<P>(make: (at: number) => P, at30: (at: number) => P): P[] {
  return Array.from({ length: 60 }, (_, i) => {
    const at = NOW - (59 - i) * 1000
    return at === NOW - 30_000 ? at30(at) : make(at)
  })
}

const cases = [
  {
    name: 'Wi-Fi',
    id: 'wifi',
    component: WifiTimeline,
    extra: {},
    lanes: ['SIGNAL', 'RETRY', 'RTT', 'LOSS', 'TRAFFIC', 'EVENTS'],
    hints: ['signal', 'retry', 'rtt', 'loss', 'traffic', 'events'],
    legend: 'internet gateway up down',
    label: 'signal, retries, round trips, loss, traffic and events over time',
  },
  {
    name: 'Ethernet',
    id: 'ether',
    component: EtherTimeline,
    extra: { bestSeen: 1000, capMbps: 1000, speedMbps: 1000 },
    lanes: ['LINK', 'L2', 'RTT', 'LOSS', 'TRAFFIC', 'EVENTS'],
    hints: ['link', 'l2', 'rtt', 'loss', 'traffic', 'events'],
    legend: 'internet gateway up down fell crc link lost',
    label:
      'link speed, damaged and broadcast frames, round trips, loss, traffic and events over time',
  },
] as const

describe.each(cases)('the $name timeline', (c) => {
  const props = (over: Record<string, unknown> = {}) => ({
    points: [],
    events: [],
    window: '1m',
    onwindow: () => {},
    ...c.extra,
    ...over,
  })

  const show = (p: ReturnType<typeof props>) => render(c.component as never, { props: p } as never)

  it('heads itself with its title, its legend and the windows, the one shown pressed', async () => {
    const onwindow = vi.fn()
    show(props({ window: '5m', onwindow }))
    const section = screen.getByTestId(`${c.id}-timeline`)
    const header = section.querySelector('header') as HTMLElement
    expect(header.querySelector('.title')?.textContent).toBe('TIMELINE')
    expect(header.querySelector('.legend')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(c.legend)
    const windows = screen.getAllByTestId(`${c.id}-window`)
    expect(
      windows.map((w) => [w.textContent, w.dataset.window, w.getAttribute('aria-pressed')]),
    ).toEqual([
      ['1M', '1m', 'false'],
      ['5M', '5m', 'true'],
      ['15M', '15m', 'false'],
      ['60M', '60m', 'false'],
    ])
    expect(windows[1]?.classList.contains('on')).toBe(true)
    await fireEvent.click(windows[3] as HTMLElement)
    expect(onwindow).toHaveBeenCalledWith('60m')
  })

  it('leaves its title to the tab that says it', () => {
    show(props({ titled: false }))
    expect(screen.getByTestId(`${c.id}-timeline`).querySelector('.title')).toBeNull()
  })

  it('names its lanes beside the plot, each with its card', async () => {
    show(props())
    await settle()
    const plot = screen.getByRole('img')
    expect(plot.getAttribute('aria-label')).toBe(c.label)
    const names = [...plot.querySelectorAll<HTMLElement>('.lane-name')]
    expect(names.map((n) => n.textContent)).toEqual(c.lanes)
    expect(names.map((n) => n.dataset.hint)).toEqual(c.hints.map((h) => `lane-${h}`))
    // Laid out down the plot, each where the draw puts its lane.
    const tops = names.map((n) => Number.parseFloat(n.style.top))
    expect(tops).toEqual([...tops].sort((a, b) => a - b))
    expect(names.every((n) => Number.parseFloat(n.style.height) > 0)).toBe(true)
  })

  it('draws on mount and again when what it reads changes', async () => {
    const { rerender } = show(props())
    await settle()
    const first = drawn.length
    expect(first).toBeGreaterThan(0)
    await rerender(props({ window: '15m' }) as never)
    await vi.advanceTimersByTimeAsync(300)
    await settle()
    expect(drawn.length).toBeGreaterThan(first)
  })

  it('draws again every second on its own', async () => {
    show(props())
    await settle()
    const first = drawn.length
    await vi.advanceTimersByTimeAsync(2100)
    await settle()
    expect(drawn.length).toBeGreaterThan(first)
  })

  it('says a moment was not watched, and leaves when the pointer does', async () => {
    show(props())
    await settle()
    const plot = screen.getByRole('img')
    await fireEvent.pointerMove(plot, { clientX: xAt(40), clientY: 40 })
    const readout = screen.getByTestId(`${c.id}-crosshair`)
    expect(lines(readout)).toEqual([clock(NOW - 40_000), 'not watched'])
    expect(readout.classList.contains('left')).toBe(false)
    expect(readout.style.getPropertyValue('--x')).toBe(`${xAt(40)}px`)
    await fireEvent.pointerLeave(plot)
    expect(screen.queryByTestId(`${c.id}-crosshair`)).toBeNull()
  })

  it('reads nothing over the lanes’ names', async () => {
    show(props())
    await settle()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: LABEL - 5, clientY: 40 })
    expect(screen.queryByTestId(`${c.id}-crosshair`)).toBeNull()
  })

  it('turns its readout to the left on the right half', async () => {
    show(props())
    await settle()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: xAt(5), clientY: 40 })
    expect(screen.getByTestId(`${c.id}-crosshair`).classList.contains('left')).toBe(true)
  })
})

describe('the Wi-Fi crosshair', () => {
  it('reads every lane at the moment, and the event there', async () => {
    const points = minute(wifiPoint, (at) =>
      wifiPoint(at, { rssi: -61, retry: 12.34, gateway: 7.6 }),
    )
    const events: TrackEvent[] = [
      {
        key: 'h',
        at: NOW - 30_000,
        kind: 'handover',
        detail: 'ch 36 → 60',
        code: null,
        ssid: null,
        downFor: null,
      },
    ]
    render(WifiTimeline, { props: { points, events, window: '1m', onwindow: () => {} } })
    await settle()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: xAt(30), clientY: 40 })
    expect(lines(screen.getByTestId('wifi-crosshair'))).toEqual([
      clock(NOW - 30_000),
      'signal -61 dBm',
      'retry 12.3 %',
      'gateway 8 ms',
      'internet <1 ms',
      '↑ 160 kb/s ↓ 16 Mb/s',
      'handover · ch 36 → 60',
    ])
  })

  it('says what was not read, and an echo that was lost', async () => {
    const points = minute(wifiPoint, (at) =>
      wifiPoint(at, {
        rssi: null,
        retry: null,
        gateway: undefined,
        internet: null,
        up: null,
        down: null,
      }),
    )
    render(WifiTimeline, { props: { points, events: [], window: '1m', onwindow: () => {} } })
    await settle()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: xAt(30), clientY: 40 })
    expect(lines(screen.getByTestId('wifi-crosshair'))).toEqual([
      clock(NOW - 30_000),
      'signal — dBm',
      'retry —',
      'gateway —',
      'internet lost',
      '↑ — ↓ —',
    ])
  })
})

describe('the Ethernet crosshair', () => {
  it('reads every lane at the moment, and the event there', async () => {
    const points = minute(etherPoint, (at) => etherPoint(at, { speed: 100, errors: 7.6 }))
    const events: EtherEvent[] = [
      { key: 's', at: NOW - 30_000, kind: 'speed', detail: '1 Gb/s → 100 Mb/s', downFor: null },
    ]
    render(EtherTimeline, {
      props: {
        points,
        events,
        window: '1m',
        onwindow: () => {},
        bestSeen: 1000,
        capMbps: 1000,
        speedMbps: 100,
      },
    })
    await settle()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: xAt(30), clientY: 40 })
    expect(lines(screen.getByTestId('ether-crosshair'))).toEqual([
      clock(NOW - 30_000),
      'link 100 Mb/s full',
      'crc 8/s',
      'broadcast 5/s',
      'gateway <1 ms',
      'internet 21 ms',
      '↑ 160 kb/s ↓ 16 Mb/s',
      'speed · 1 Gb/s → 100 Mb/s',
    ])
  })

  it('names the state of a link that is down, and what was not read', async () => {
    const points = minute(etherPoint, (at) =>
      etherPoint(at, {
        state: 'no-carrier',
        errors: null,
        broadcast: null,
        gateway: undefined,
        internet: null,
        up: null,
        down: null,
      }),
    )
    render(EtherTimeline, {
      props: {
        points,
        events: [],
        window: '1m',
        onwindow: () => {},
        bestSeen: null,
        capMbps: null,
        speedMbps: null,
      },
    })
    await settle()
    await fireEvent.pointerMove(screen.getByRole('img'), { clientX: xAt(30), clientY: 40 })
    expect(lines(screen.getByTestId('ether-crosshair'))).toEqual([
      clock(NOW - 30_000),
      'link no-carrier',
      'crc —/s',
      'broadcast —/s',
      'gateway —',
      'internet lost',
      '↑ — ↓ —',
    ])
  })
})
