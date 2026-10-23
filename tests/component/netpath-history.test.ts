import type { NetEthernet } from '@shared/ethernet'
import type { MetricSample } from '@shared/metrics'
import type { NetWifi } from '@shared/wifi'
import { beforeEach, describe, expect, it } from 'vitest'
import { type EtherStub, stubEthernet } from '../../src/services/metrics/ethernet/stub'
import { stubWifi, type WifiStub } from '../../src/services/metrics/wifi/stub'

const { etherHistory } = await import('../../src/renderer/widgets/ethernet/history.svelte.ts')
const { wifiHistory } = await import('../../src/renderer/widgets/wifi/history.svelte.ts')

/**
 * The Wi-Fi and Ethernet panes' histories (widgets/wifi/history.svelte.ts,
 * widgets/ethernet/history.svelte.ts): one point a second for every adapter
 * apart, the counters of the last minute and a half for the rates, and for
 * Ethernet the best speed seen. Fed from the collector's own stubs.
 */

const BASE = 1_790_000_000_000

const ether = (kind: EtherStub, s: number, data?: NetEthernet): MetricSample<'net.ethernet'> => ({
  id: 'net.ethernet',
  at: BASE + s * 1000 + 300,
  data: data ?? stubEthernet(kind, BASE, BASE + s * 1000),
})

const wifi = (kind: WifiStub, s: number, data?: NetWifi): MetricSample<'net.wifi'> => ({
  id: 'net.wifi',
  at: BASE + s * 1000 + 300,
  data: data ?? stubWifi(kind, BASE, BASE + s * 1000),
})

/** The second a sample stands for: its probe round's, else its own floored. */
const second = (sample: MetricSample<'net.ethernet' | 'net.wifi'>): number =>
  sample.data.probe?.at ?? Math.floor(sample.at / 1000) * 1000

beforeEach(() => {
  etherHistory.reset()
  wifiHistory.reset()
})

describe.each([
  {
    name: 'Ethernet',
    history: etherHistory,
    sample: (s: number) => ether('steady', s),
    id: (s: number) => stubEthernet('steady', BASE, BASE + s * 1000).links[0]?.id ?? '',
    dual: (s: number) => ether('dual', s),
    dualIds: () => stubEthernet('dual', BASE, BASE).links.map((l) => l.id),
    /** The steady link at `s`, its counters no longer kept. */
    uncounted: (s: number) => {
      const now = stubEthernet('steady', BASE, BASE + s * 1000)
      const link = now.links[0]
      if (link === undefined) throw new Error('no link')
      return ether('steady', s, { ...now, links: [{ ...link, counters: null }] })
    },
  },
  {
    name: 'Wi-Fi',
    history: wifiHistory,
    sample: (s: number) => wifi('steady', s),
    id: (s: number) => stubWifi('steady', BASE, BASE + s * 1000).links[0]?.id ?? '',
    dual: (s: number) => wifi('dual', s),
    dualIds: () => stubWifi('dual', BASE, BASE).links.map((l) => l.id),
    uncounted: (s: number) => {
      const now = stubWifi('steady', BASE, BASE + s * 1000)
      const link = now.links[0]
      if (link === undefined) throw new Error('no link')
      return wifi('steady', s, { ...now, links: [{ ...link, counters: null }] })
    },
  },
] as const)('$name history', ({ history, sample, id, dual, dualIds, uncounted }) => {
  it('keeps one point a second, at the second the probe round stands for', () => {
    for (let s = 0; s < 5; s++) history.push(sample(s) as never)
    const points = history.points(id(0))
    expect(points).toHaveLength(5)
    expect(points.map((p) => p.at)).toEqual([0, 1, 2, 3, 4].map((s) => second(sample(s))))
  })

  it('takes a second only once, and never one before the last', () => {
    history.push(sample(3) as never)
    history.push(sample(3) as never)
    history.push(sample(1) as never)
    expect(history.points(id(0))).toHaveLength(1)
  })

  it('answers nothing for no adapter or one it never saw', () => {
    history.push(sample(0) as never)
    expect(history.points(null)).toEqual([])
    expect(history.points('nowhere')).toEqual([])
    expect(history.marks(null)).toEqual([])
    expect(history.marks('nowhere')).toEqual([])
  })

  it('keeps the counters of the last minute and a half only', () => {
    for (let s = 0; s < 120; s++) history.push(sample(s) as never)
    const marks = history.marks(id(0))
    const last = second(sample(119))
    expect(marks.length).toBeGreaterThan(80)
    expect(marks.every((m) => m.at > last - 90_000)).toBe(true)
    expect(marks[marks.length - 1]?.at).toBe(last)
  })

  it('replaces its records whole on a push, so a reader sees one change', () => {
    history.push(sample(0) as never)
    const points = history.byLink
    const marks = history.marksByLink
    history.push(sample(1) as never)
    expect(history.byLink).not.toBe(points)
    expect(history.marksByLink).not.toBe(marks)
    expect(points[id(0)]).toHaveLength(1)
  })

  it('keeps each adapter apart', () => {
    for (let s = 0; s < 4; s++) history.push(dual(s) as never)
    const ids = dualIds()
    expect(ids).toHaveLength(2)
    for (const one of ids) expect(history.points(one)).toHaveLength(4)
  })

  it('empties the counters of an adapter that stops keeping them', () => {
    history.push(sample(0) as never)
    expect(history.marks(id(1))).toHaveLength(1)
    history.push(uncounted(1) as never)
    expect(history.marks(id(1))).toEqual([])
  })

  it('starts over on reset, the second before too', () => {
    history.push(sample(5) as never)
    history.reset()
    history.push(sample(2) as never)
    expect(history.points(id(0))).toHaveLength(1)
  })
})

describe('Ethernet history', () => {
  it('counts a rate only from the reading before, on the same adapter', () => {
    for (let s = 0; s < 3; s++) etherHistory.push(ether('crc', s))
    const id = stubEthernet('crc', BASE, BASE).links[0]?.id ?? ''
    const [first, next] = etherHistory.points(id)
    expect(first?.errors).toBeNull()
    expect(next?.errors).not.toBeNull()
  })

  it('keeps the best speed seen while up, through a fall and a drop', () => {
    const id = stubEthernet('downshift', BASE, BASE).links[0]?.id ?? ''
    for (let s = 0; s < 40; s++) etherHistory.push(ether('downshift', s))
    expect(etherHistory.points(id).at(-1)?.speed).toBe(100)
    expect(etherHistory.bestSpeed(id)).toBe(1000)
    expect(etherHistory.bestSpeed(null)).toBeNull()
    expect(etherHistory.bestSpeed('nowhere')).toBeNull()
  })

  it('takes no best speed from a link that is down', () => {
    const down = stubEthernet('steady', BASE, BASE)
    const link = down.links[0]
    if (link === undefined) throw new Error('no link')
    etherHistory.push(ether('steady', 0, { ...down, links: [{ ...link, state: 'no-carrier' }] }))
    expect(etherHistory.bestSpeed(link.id)).toBeNull()
    expect(etherHistory.points(link.id)).toHaveLength(1)
  })

  it('forgets the best speed on reset', () => {
    etherHistory.push(ether('steady', 0))
    etherHistory.reset()
    expect(etherHistory.best).toEqual({})
  })
})

describe('Wi-Fi history', () => {
  it('counts the retries only from the reading before', () => {
    for (let s = 0; s < 3; s++) wifiHistory.push(wifi('steady', s))
    const id = stubWifi('steady', BASE, BASE).links[0]?.id ?? ''
    const [first, next] = wifiHistory.points(id)
    expect(first?.frames).toBeNull()
    expect(next?.frames).not.toBeNull()
  })
})
