import type { MetricSample } from '@shared/metrics'
import { cleanup, render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type GpuStub, stubGpuUsage } from '../../src/services/metrics/gpu/stub'

const { default: ClusterWidget } = await import(
  '../../src/renderer/widgets/cluster/ClusterWidget.svelte'
)
const { metrics } = await import('../../src/renderer/stores/metrics.svelte.ts')

/**
 * The CLUSTER pane with and without a GPU that can be read. Where `gpu.usage`'s
 * `name` is null, the GPU's lane, its VRAM lamp and slot are left out - never
 * drawn dark (CLAUDE.md, the GPU rule). The readings are the collector's own
 * stub, so this sees what the e2e tests see.
 */

const deliver = new Map<string, (sample: MetricSample) => void>()
const releases: (() => void)[] = []

beforeEach(() => {
  deliver.clear()
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  )
  // The lanes draw on a canvas jsdom does not have: any call is taken and ignored.
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
  vi.stubGlobal('elecdex', {
    metrics: {
      subscribe: (id: string, onSample: (sample: MetricSample) => void) => {
        deliver.set(id, onSample)
        return () => deliver.delete(id)
      },
    },
    utility: {
      awake: {
        onChange: () => () => {},
        state: () => new Promise(() => {}),
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

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

/** Mounts the pane and hands it one `gpu.usage` reading from the collector's stub. */
async function withGpu(stub: GpuStub): Promise<void> {
  releases.push(metrics.retain('gpu.usage'))
  render(ClusterWidget, {
    props: { paneId: 'cl', title: 'cluster', props: {}, state: {}, active: true, visible: true },
  })
  await settle()
  const at = 1_790_000_000_000
  deliver.get('gpu.usage')?.({
    id: 'gpu.usage',
    at,
    data: structuredClone(stubGpuUsage(stub, at)),
  } as MetricSample)
  // Past the frame loop's stall timer, which applies a waiting sample.
  await vi.advanceTimersByTimeAsync(600)
  await settle()
}

const lanes = (): (string | undefined)[] =>
  [...document.querySelectorAll<HTMLElement>('[data-lane]')].map((el) => el.dataset.lane)
const lamps = (): (string | undefined)[] =>
  [...document.querySelectorAll<HTMLElement>('[data-lamp]')].map((el) => el.dataset.lamp)

describe('ClusterWidget and the GPU', () => {
  it('with a GPU read, draws its lane, its VRAM lamp after MEM and its VRAM slot', async () => {
    await withGpu('1')
    expect(lanes()).toHaveLength(7)
    expect(lanes()).toContain('gpu')
    expect(screen.getByTestId('cluster-figure-gpu').textContent).toMatch(/\d+\s*%/)
    expect(lamps().indexOf('vram')).toBe(lamps().indexOf('mem') + 1)
    expect(screen.getByTestId('cluster-slot-vram').textContent).toContain('3.2 / 8.0 GiB')
  })

  it('without one, leaves out its lane, its VRAM lamp and slot, never drawn dark', async () => {
    await withGpu('none')
    expect(lanes()).toHaveLength(6)
    expect(lanes()).not.toContain('gpu')
    expect(screen.queryByTestId('cluster-figure-gpu')).toBeNull()
    expect(lamps()).not.toContain('vram')
    expect(lamps()).toContain('mem')
    expect(screen.queryByTestId('cluster-slot-vram')).toBeNull()
    expect(screen.getByTestId('cluster-slot-ram')).toBeTruthy()
  })
})
