import { memoryFraction } from '@shared/gpu'
import type { GpuUsage } from '@shared/metrics'
import { formatBytes } from '../../lib/format.js'

/**
 * What the GPU pane writes, from a `gpu.usage` sample: kept out of the
 * component so a unit test reads it. What CLUSTER reads too is in shared/gpu.ts.
 */

/**
 * A sample's points on the chart, 0-100, each on its own: the sampler's first reading has
 * memory but no load yet (found in review: its memory was dropped with the load).
 */
export function chartPoints(usage: GpuUsage): { load: number | null; vram: number | null } {
  const vram = memoryFraction(usage.vramUsed, usage.vramTotal)
  return { load: usage.load, vram: vram === null ? null : vram * 100 }
}

/** "10.2 / 12.0 GiB", or what is known of it. */
export function memoryText(used: number | null, total: number | null): string {
  if (used === null) return '--'
  return total === null ? formatBytes(used) : `${formatBytes(used)} / ${formatBytes(total)}`
}
