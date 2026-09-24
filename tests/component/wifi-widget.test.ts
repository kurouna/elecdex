import type { MetricSample } from '@shared/metrics'
import type { NetWifi, NetWifiEvents } from '@shared/wifi'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubWifi, stubWifiEvents } from '../../src/services/metrics/wifi/stub'

const { default: WifiWidget } = await import('../../src/renderer/widgets/wifi/WifiWidget.svelte')
const { metrics } = await import('../../src/renderer/stores/metrics.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { paneMeta } = await import('../../src/renderer/stores/pane-meta.svelte.ts')
const { wifiHistory } = await import('../../src/renderer/widgets/wifi/history.svelte.ts')

/**
 * The Wi-Fi pane: that it says where the trouble is, keeps the name and the
 * addresses off the screen when masked, and puts a report on the clipboard.
 * The readings are the collector's own stub, so what is asserted on is what
 * the e2e tests see too.
 */

const deliver = new Map<string, (sample: MetricSample) => void>()
/** The size every observed element reports: the Wi-Fi pane in the network preset. */
let size = { width: 620, height: 455 }
/** Every canvas call, by name, so a test can tell something was drawn. */
const drawn: string[] = []
const ctx = new Proxy(
  {},
  {
    get: (_target, name) =>
      typeof name === 'string' ? (..._args: unknown[]) => drawn.push(name) : undefined,
    set: () => true,
  },
)
const releases: (() => void)[] = []
/** When the stub scenarios start: every sample is stamped from it, never from the fake clock. */
let base = 0
const clipboard = { writeText: vi.fn(async (_text: string) => {}) }

beforeEach(() => {
  deliver.clear()
  wifiHistory.reset()
  clipboard.writeText.mockClear()
  size = { width: 620, height: 455 }
  drawn.length = 0
  base = 1_790_000_000_000
  vi.useFakeTimers()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly report: ResizeObserverCallback
      constructor(report: ResizeObserverCallback) {
        this.report = report
      }
      observe(target: Element): void {
        this.report(
          [{ target, contentRect: { ...size } } as unknown as ResizeObserverEntry],
          this as never,
        )
      }
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
  vi.stubGlobal('elecdex', {
    metrics: {
      subscribe: (id: string, onSample: (sample: MetricSample) => void) => {
        deliver.set(id, onSample)
        return () => deliver.delete(id)
      },
    },
    layout: { save: vi.fn(async () => {}) },
  })
  vi.stubGlobal('navigator', { ...navigator, clipboard })
})

afterEach(async () => {
  cleanup()
  for (const release of releases.splice(0)) release()
  vi.useRealTimers()
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

/** Past the frame loop's stall timer, which applies a waiting sample. */
async function frame(): Promise<void> {
  await vi.advanceTimersByTimeAsync(600)
  await settle()
}

async function mount(state: Record<string, unknown> = {}) {
  releases.push(metrics.retain('net.wifi'), metrics.retain('net.wifi.events'))
  const view = render(WifiWidget, {
    props: { paneId: 'w1', title: 'wi-fi', props: {}, state, active: true, widget: 'wifi' },
  })
  await settle()
  const push = async (wifi: NetWifi, events?: NetWifiEvents): Promise<void> => {
    deliver.get('net.wifi')?.({
      id: 'net.wifi',
      at: Date.now(),
      data: structuredClone(wifi),
    } as MetricSample)
    if (events) {
      deliver.get('net.wifi.events')?.({
        id: 'net.wifi.events',
        at: Date.now(),
        data: structuredClone(events),
      } as MetricSample)
    }
    await frame()
  }
  return { push, view }
}

/** `seconds` of a stub scenario, one sample a second. */
async function play(
  push: (w: NetWifi, e?: NetWifiEvents) => Promise<void>,
  kind: 'steady' | 'train',
  from: number,
  to: number,
): Promise<void> {
  for (let s = from; s < to; s++) {
    await push(
      stubWifi(kind, base, base + s * 1000),
      s === from ? stubWifiEvents(kind, base) : undefined,
    )
  }
}

describe('WifiWidget', () => {
  it('waits for the link, then shows it and calls it clear', async () => {
    const { push } = await mount()
    expect(screen.getByTestId('wifi-empty').textContent).toContain('ACQUIRING')
    await play(push, 'steady', 0, 12)
    expect(screen.getByTestId('wifi-ssid').textContent).toBe('ELECDEX-LAB')
    expect(screen.getByTestId('wifi-state').textContent).toContain('ONLINE')
    expect(screen.getByTestId('wifi-verdict').textContent).toContain('CLEAR')
    expect(screen.getByTestId('wifi-mos').textContent).toMatch(/4\.\d/)
    expect(paneMeta.get('w1').subtitle).toBe('5 GHz · ch 60 · -55 dBm')
    expect(paneMeta.get('w1').badge).toBeUndefined()
  })

  it('says there is no adapter when there is none', async () => {
    const { push } = await mount()
    await push({ links: [], probe: null, limits: [] })
    expect(screen.getByTestId('wifi-empty').textContent).toContain('NO WIRELESS ADAPTER')
  })

  it('names the way out lost on a train, and badges the pane with it', async () => {
    const { push } = await mount()
    // Seconds 20-27 of every 40 are a tunnel: the gateway answers, the internet does not.
    await play(push, 'train', 12, 26)
    expect(screen.getByTestId('wifi-verdict').textContent).toContain('UPSTREAM LOST')
    expect(paneMeta.get('w1')).toMatchObject({ badge: 'upstream lost', badgeKind: 'danger' })
  })

  it('masked, shows neither the name nor an address, and the report hides them too', async () => {
    const { push } = await mount({ mask: true, view: 'detail' })
    await play(push, 'steady', 0, 3)
    expect(screen.getByTestId('wifi-ssid').textContent).not.toContain('ELECDEX-LAB')
    const detail = screen.getByTestId('wifi-detail').textContent ?? ''
    expect(detail).not.toContain('192.0.2.23')
    expect(detail).not.toContain('02:00:5e:10:00:01')

    await fireEvent.click(screen.getByTestId('wifi-copy'))
    await settle()
    const report = clipboard.writeText.mock.calls[0]?.[0] ?? ''
    expect(report).toContain('elecdex Wi-Fi report')
    expect(report).not.toContain('ELECDEX-LAB')
    expect(report).not.toContain('192.0.2.23')
    expect(screen.getByTestId('wifi-copy').textContent).toBe('COPIED')
  })

  it('keeps the mask, the view and the window in pane state', async () => {
    const patch = vi.spyOn(layout, 'patchPaneState')
    const { push } = await mount()
    await play(push, 'steady', 0, 2)
    await fireEvent.click(screen.getByTestId('wifi-mask'))
    expect(patch).toHaveBeenLastCalledWith('w1', { mask: true })
    const log = screen.getAllByTestId('wifi-view').find((b) => b.dataset.view === 'log')
    await fireEvent.click(log as HTMLElement)
    expect(patch).toHaveBeenLastCalledWith('w1', { view: 'log' })
  })

  it('lists the log with how long each drop lasted', async () => {
    const { push } = await mount({ view: 'log' })
    await play(push, 'train', 0, 2)
    const rows = screen.getAllByTestId('wifi-event')
    expect(rows.some((row) => row.textContent?.includes('LINK LOST'))).toBe(true)
    expect(rows.some((row) => row.textContent?.includes('down 14s'))).toBe(true)
  })

  it('in a small pane, offers the radio as a tab; brought forward, stacks everything', async () => {
    const small = await mount({ view: 'radio' })
    await play(small.push, 'steady', 0, 2)
    const tabs = screen.getAllByTestId('wifi-view').map((b) => b.dataset.view)
    expect(tabs).toEqual(['timeline', 'radio', 'log', 'detail'])
    expect(screen.getByTestId('wifi-rssi').textContent).toBe('-55')
    expect(screen.queryByTestId('wifi-timeline')).toBeNull()
    small.view.unmount()

    size = { width: 1700, height: 1000 }
    const big = await mount()
    await play(big.push, 'steady', 2, 4)
    expect(screen.queryAllByTestId('wifi-view')).toHaveLength(0)
    for (const part of ['wifi-radio', 'wifi-timeline', 'wifi-log', 'wifi-detail']) {
      expect(screen.getByTestId(part)).toBeTruthy()
    }
    expect(screen.getByTestId('wifi-notes').textContent).toContain('DFS')
  })

  it('keeps its history when the pane is remounted, as a move does', async () => {
    const first = await mount()
    await play(first.push, 'steady', 0, 5)
    const kept = wifiHistory.points.length
    first.view.unmount()
    await settle()
    const second = await mount()
    await play(second.push, 'steady', 5, 6)
    expect(wifiHistory.points.length).toBe(kept + 1)
  })
})
