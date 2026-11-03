import type { MetricSample, NetPing } from '@shared/metrics'
import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inertDom, stubCanvas } from './support/dom.ts'
import { settle } from './support/settle.ts'

const { default: NetstatWidget } = await import(
  '../../src/renderer/widgets/monitor/NetstatWidget.svelte'
)
const { default: ThroughputWidget } = await import(
  '../../src/renderer/widgets/monitor/ThroughputWidget.svelte'
)
const { metrics } = await import('../../src/renderer/stores/metrics.svelte.ts')

/**
 * The network panes say OFFLINE only when echoes went unanswered in a row, never for one lost
 * echo: a Wi-Fi link that stays associated passes nothing for a few seconds now and then, and
 * one echo every five seconds landing in that gap painted OFFLINE over both panes.
 */

const deliver = new Map<string, (sample: MetricSample) => void>()
const releases: (() => void)[] = []
let at = 1_790_000_000_000

beforeEach(() => {
  deliver.clear()
  vi.useFakeTimers()
  inertDom()
  // The traffic chart draws on a canvas jsdom does not have.
  stubCanvas()
  vi.stubGlobal('elecdex', {
    metrics: {
      subscribe: (id: string, onSample: (sample: MetricSample) => void) => {
        deliver.set(id, onSample)
        return () => deliver.delete(id)
      },
    },
  })
})

afterEach(() => {
  cleanup()
  for (const release of releases.splice(0)) release()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function mount(): Promise<void> {
  for (const id of ['net.interface', 'net.ping', 'net.throughput'] as const) {
    releases.push(metrics.retain(id))
  }
  const props = { title: 't', props: {}, state: {}, active: true, visible: true }
  render(NetstatWidget, { props: { ...props, paneId: 'ns' } })
  render(ThroughputWidget, { props: { ...props, paneId: 'tp' } })
  await settle()
  await send('net.interface', { iface: 'Wi-Fi', ip4: '192.168.50.2', mac: null, state: 'up' })
}

async function send(id: string, data: unknown): Promise<void> {
  at += 5000
  deliver.get(id)?.({ id, at, data } as MetricSample)
  // Past the frame loop's stall timer, which applies a waiting sample.
  await vi.advanceTimersByTimeAsync(600)
  await settle()
}

const echo = (ms: number | null, lost: number): Promise<void> =>
  send('net.ping', { host: '1.1.1.1', ms, lost } satisfies NetPing)

const state = (): string | null => screen.getByTestId('net-state').textContent
const overlaid = (): boolean => screen.queryByTestId('net-offline') !== null

describe('the network panes and lost echoes', () => {
  it('stay online through one lost echo and say OFFLINE from the second in a row', async () => {
    await mount()
    await echo(6, 0)
    expect(state()).toBe('ONLINE')
    expect(overlaid()).toBe(false)

    await echo(null, 1)
    expect(state()).toBe('ONLINE')
    expect(overlaid()).toBe(false)
    // The lost echo itself is still shown as lost.
    expect(screen.getByText('--ms')).toBeTruthy()

    await echo(null, 2)
    expect(state()).toBe('OFFLINE')
    expect(overlaid()).toBe(true)

    await echo(5, 0)
    expect(state()).toBe('ONLINE')
    expect(overlaid()).toBe(false)
  })
})
