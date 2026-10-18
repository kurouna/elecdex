import type { NetEthernet } from '@shared/ethernet'
import type { MetricSample } from '@shared/metrics'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type EtherStub, stubEthernet } from '../../src/services/metrics/ethernet/stub'

const { default: EthernetWidget } = await import(
  '../../src/renderer/widgets/ethernet/EthernetWidget.svelte'
)
const { metrics } = await import('../../src/renderer/stores/metrics.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { paneMeta } = await import('../../src/renderer/stores/pane-meta.svelte.ts')
const { etherHistory } = await import('../../src/renderer/widgets/ethernet/history.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')
const { forgetSaid } = await import('../../src/renderer/lib/fault-report.ts')

/**
 * The Ethernet pane: that it says where the trouble is on a cable, colours the
 * figure at fault rather than the speed, keeps the addresses off the screen when
 * masked, lays itself out as the Wi-Fi pane does, and puts a report on the
 * clipboard. The readings are the collector's own stub, as in the e2e tests.
 */

const deliver = new Map<string, (sample: MetricSample) => void>()
/** The size every observed element reports: a pane in the network preset's slot. */
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
  // The hint card powers on and off like a tube: enough of Web Animations and
  // matchMedia for that to run its length in jsdom.
  Element.prototype.animate = function animate(_frames, options) {
    const animation = { onfinish: null as (() => void) | null, cancel() {}, currentTime: 0 }
    const length = typeof options === 'number' ? options : Number(options?.duration ?? 0)
    setTimeout(() => animation.onfinish?.(), length)
    return animation as unknown as Animation
  }
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  deliver.clear()
  etherHistory.reset()
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
  Reflect.deleteProperty(Element.prototype, 'animate')
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
  releases.push(metrics.retain('net.ethernet'))
  const view = render(EthernetWidget, {
    props: { paneId: 'e1', title: 'ethernet', props: {}, state, active: true, widget: 'ethernet' },
  })
  await settle()
  const push = async (net: NetEthernet): Promise<void> => {
    deliver.get('net.ethernet')?.({
      id: 'net.ethernet',
      at: Date.now(),
      data: structuredClone(net),
    } as MetricSample)
    await frame()
  }
  return { push, view }
}

/** `seconds` of a stub case, one sample a second. */
async function play(
  push: (n: NetEthernet) => Promise<void>,
  kind: EtherStub,
  from: number,
  to: number,
): Promise<void> {
  for (let s = from; s < to; s++) await push(stubEthernet(kind, base, base + s * 1000))
}

const station = (id: string): HTMLElement =>
  screen.getAllByTestId('ether-station').find((s) => s.dataset.station === id) as HTMLElement

describe('EthernetWidget', () => {
  it('waits for the link, then shows it and calls it clear', async () => {
    const { push } = await mount()
    expect(screen.getByTestId('ether-empty').textContent).toContain('ACQUIRING')
    await play(push, 'steady', 0, 12)
    expect(screen.getByTestId('ether-name').textContent).toBe('Gigabit Ethernet Adapter')
    expect(screen.getByTestId('ether-state').textContent).toContain('ONLINE')
    expect(screen.getByTestId('ether-verdict').textContent).toContain('CLEAR')
    expect(station('link').textContent).toContain('1 Gb/s full')
    expect(station('gateway').textContent).toContain('<1 ms')
    expect(screen.getByTestId('ether-mos').textContent).toMatch(/4\.\d/)
    expect(paneMeta.get('e1').subtitle).toBe('1 Gb/s · full · PCIe')
    expect(paneMeta.get('e1').badge).toBeUndefined()
  })

  it('says there is no adapter when there is none', async () => {
    const { push } = await mount()
    await push({ links: [], probe: null, limits: [], problems: [] })
    expect(screen.getByTestId('ether-empty').textContent).toContain('NO WIRED ADAPTER')
    expect(screen.getByTestId('ether-state').textContent).toContain('NO ADAPTER')
  })

  it('with no cable, says NO CARRIER once: the badge the state, the subtitle the adapter', async () => {
    const { push } = await mount()
    await play(push, 'unplugged', 0, 3)
    expect(screen.getByTestId('ether-verdict').textContent).toContain('NO CARRIER')
    expect(paneMeta.get('e1')).toMatchObject({
      badge: 'no carrier',
      subtitle: 'Ethernet · PCIe 2.5 GT/s x1',
    })
    expect(station('link').dataset.culprit).toBe('true')
    expect(station('gateway').textContent).toContain('—')
  })

  it('blames the cable for CRC errors, and colours the CRC figure, not the speed', async () => {
    size = { width: 1700, height: 1000 }
    const { push } = await mount()
    await play(push, 'crc', 0, 70)
    expect(screen.getByTestId('ether-verdict').textContent).toContain('LINK')
    expect(screen.getByTestId('ether-verdict').textContent).toContain('CRC errors')
    expect(paneMeta.get('e1')).toMatchObject({ badge: 'link', badgeKind: 'danger' })
    expect(screen.getByTestId('ether-link').dataset.tone).toBe('ok')
    expect(screen.getByTestId('ether-crc').querySelector('b')?.className).toContain('bad')
    expect(screen.getByTestId('ether-grade').textContent).toContain('BEST')
  })

  it('a fall in speed is DOWNSHIFTED, and power saving is named only once something happened', async () => {
    size = { width: 1700, height: 1000 }
    const quiet = await mount()
    await play(quiet.push, 'steady', 0, 20)
    expect(screen.queryByTestId('ether-caution')).toBeNull()
    expect(
      screen.getAllByTestId('ether-power').every((p) => !p.classList.contains('suspect')),
    ).toBe(true)
    quiet.view.unmount()
    etherHistory.reset()

    const fell = await mount()
    await play(fell.push, 'downshift', 0, 40)
    expect(screen.getByTestId('ether-grade').textContent).toContain('DOWNSHIFTED')
    expect(screen.getByTestId('ether-link').dataset.tone).toBe('warn')
    expect(screen.getByTestId('ether-caution').textContent).toContain('power saving on')
  })

  it('masked, shows no address, and the report hides them too, the MAC always', async () => {
    const { push } = await mount({ mask: true, view: 'detail' })
    await play(push, 'steady', 0, 3)
    const detail = screen.getByTestId('ether-detail').textContent ?? ''
    expect(detail).not.toContain('192.0.2.31')
    expect(detail).not.toContain('02:00:5e:10:00:02')
    await fireEvent.click(screen.getByTestId('ether-copy'))
    await settle()
    const report = clipboard.writeText.mock.calls[0]?.[0] ?? ''
    expect(report).toContain('elecdex Ethernet report')
    expect(report).not.toContain('192.0.2.31')
    expect(report).not.toContain('02:00:5e')
  })

  it('in the network preset’s slot, offers the link panel as a tab; forward, stacks everything in two columns', async () => {
    const small = await mount({ view: 'link' })
    await play(small.push, 'steady', 0, 2)
    expect(screen.getAllByTestId('ether-view').map((b) => b.dataset.view)).toEqual([
      'timeline',
      'link',
      'log',
      'detail',
    ])
    expect(screen.getByTestId('ether-speed').textContent).toContain('1')
    expect(screen.queryByTestId('ether-timeline')).toBeNull()
    small.view.unmount()

    size = { width: 1700, height: 1000 }
    const big = await mount()
    await play(big.push, 'steady', 2, 4)
    expect(screen.queryAllByTestId('ether-view')).toHaveLength(0)
    for (const part of ['ether-link', 'ether-timeline', 'ether-log', 'ether-detail']) {
      expect(screen.getByTestId(part)).toBeTruthy()
    }
    expect(document.querySelector('.upper.wide')).not.toBeNull()
  })

  it('with no cable, offers no link tab', async () => {
    const { push } = await mount()
    await play(push, 'unplugged', 0, 2)
    expect(screen.getAllByTestId('ether-view').map((b) => b.dataset.view)).toEqual([
      'timeline',
      'log',
      'detail',
    ])
  })

  it('logs the link going and coming back, with how long it was down', async () => {
    const { push } = await mount({ view: 'log' })
    await play(push, 'flapping', 55, 70)
    const rows = screen.getAllByTestId('ether-event').map((r) => r.textContent ?? '')
    expect(rows.some((r) => r.includes('LINK LOST'))).toBe(true)
    expect(rows.some((r) => r.includes('CONNECTED') && r.includes('down 3s'))).toBe(true)
  })

  it('with two adapters, offers each as a chip and follows the one chosen', async () => {
    const patch = vi.spyOn(layout, 'patchPaneState')
    const { push } = await mount()
    await play(push, 'dual', 0, 3)
    const chips = screen.getAllByTestId('ether-adapter')
    expect(chips.map((c) => c.dataset.link)).toEqual(['stub-eth0', 'stub-eth1'])
    expect(chips[0]?.getAttribute('aria-selected')).toBe('true')
    expect(chips[1]?.textContent).toContain('no carrier')
    await fireEvent.click(chips[1] as HTMLElement)
    expect(patch).toHaveBeenLastCalledWith('e1', { link: 'stub-eth1' })
  })

  it('explains a figure the pointer rests on, with what it reads now', async () => {
    const { push } = await mount()
    await play(push, 'steady', 0, 12)
    await fireEvent.pointerOver(station('gateway'))
    await settle()
    expect(screen.queryByTestId('ether-hint')).toBeNull()
    await vi.advanceTimersByTimeAsync(400)
    await settle()
    expect(screen.getByTestId('ether-hint').dataset.key).toBe('station-gateway')
    expect(screen.getByTestId('ether-hint-now').textContent).toContain('median <1 ms')
  })

  it('keeps its history, and the best speed seen, when the pane is remounted', async () => {
    const first = await mount()
    await play(first.push, 'steady', 0, 5)
    const kept = etherHistory.points('stub-eth0').length
    first.view.unmount()
    await settle()
    const second = await mount()
    await play(second.push, 'steady', 5, 6)
    expect(etherHistory.points('stub-eth0').length).toBe(kept + 1)
    expect(etherHistory.bestSpeed('stub-eth0')).toBe(1000)
  })
})

describe('EthernetWidget, when the reader has a problem', () => {
  beforeEach(() => {
    toasts.clear()
    forgetSaid()
  })

  it('says it as a toast, once, and goes on', async () => {
    const { push } = await mount()
    await play(push, 'problem', 0, 4)
    const said = toasts.items.filter((t) => t.title.startsWith('ETHERNET'))
    expect(said).toHaveLength(1)
    expect(said[0]?.body).toContain('a made-up failure')
    expect(said[0]?.tone).toBe('warn')
    expect(said[0]?.timeoutMs).toBe(0)
    expect(screen.getByTestId('ether-name').textContent).toBe('Gigabit Ethernet Adapter')
  })
})

describe('the Ethernet log, as the review read it', () => {
  it('says the hour was quiet rather than showing nothing', async () => {
    const { default: EventLog } = await import(
      '../../src/renderer/widgets/ethernet/EventLog.svelte'
    )
    render(EventLog, { props: { events: [], points: [], now: base, dropEvery: null } })
    expect(screen.getByTestId('ether-log-empty').textContent).toContain('nothing happened')
  })
})
