import type { GpuInfo, GpuUsage } from '@shared/metrics'
import { NO_GPU } from './common.js'

/**
 * A made-up GPU, for the tests and the README screenshots: every machine the
 * tests run on - CI's runners have none - draws the same panes.
 * `ELECDEX_GPU_STUB`: `1` a steady test adapter, `demo` a busier one for the
 * screenshots and demos, `none` a machine with nothing to read.
 */

export type GpuStub = '1' | 'demo' | 'none'

export function gpuStubFrom(value: string | undefined): GpuStub | null {
  return value === '1' || value === 'demo' || value === 'none' ? value : null
}

const GIB = 1024 ** 3

const ADAPTER = {
  '1': { name: 'Stub Graphics', vendor: '', dedicated: 8 * GIB, shared: 16 * GIB },
  demo: { name: 'Demo Graphics 12 GB', vendor: '', dedicated: 12 * GIB, shared: 16 * GIB },
} as const

export function stubGpuInfo(stub: GpuStub): GpuInfo {
  return { adapters: stub === 'none' ? [] : [{ ...ADAPTER[stub] }] }
}

/** A slow swell over a minute, from the clock, so a chart has a shape and a test a known range. */
export function stubGpuUsage(stub: GpuStub, now: number): GpuUsage {
  if (stub === 'none') return NO_GPU
  const adapter = ADAPTER[stub]
  const phase = Math.sin((now / 60_000) * 2 * Math.PI)
  const busy = stub === 'demo' ? 62 + 30 * phase : 30 + 10 * phase
  const vram = stub === 'demo' ? 0.78 + 0.08 * phase : 0.4
  return {
    name: adapter.name,
    load: busy,
    engines: { graphics: busy, compute: busy * 0.6, copy: 4, video: 0 },
    vramUsed: adapter.dedicated * vram,
    vramTotal: adapter.dedicated,
    sharedUsed: 0.6 * GIB,
    sharedTotal: adapter.shared,
  }
}
