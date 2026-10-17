import type { GpuUsage } from '@shared/metrics'
import { formatBytes } from '../../lib/format.js'

/**
 * What the GPU pane writes, from a `gpu.usage` sample: kept out of the
 * component so a unit test reads it.
 */

/** Used over total, 0-1; null where either is not known. */
export function memoryFraction(used: number | null, total: number | null): number | null {
  if (used === null || total === null || total <= 0) return null
  return Math.min(1, Math.max(0, used / total))
}

/** "10.2 / 12.0 GiB", or what is known of it. */
export function memoryText(used: number | null, total: number | null): string {
  if (used === null) return '--'
  return total === null ? formatBytes(used) : `${formatBytes(used)} / ${formatBytes(total)}`
}

export interface EngineFigure {
  key: 'graphics' | 'compute' | 'copy' | 'video'
  label: string
  value: number
}

const ENGINE_LABELS = { graphics: '3D', compute: 'COMPUTE', copy: 'COPY', video: 'VIDEO' } as const

/** The engine kinds the adapter reports, in a fixed order; Linux reports none. */
export function engineFigures(usage: GpuUsage | null): EngineFigure[] {
  if (usage === null) return []
  return (Object.keys(ENGINE_LABELS) as EngineFigure['key'][]).flatMap((key) => {
    const value = usage.engines[key]
    return value === null ? [] : [{ key, label: ENGINE_LABELS[key], value }]
  })
}
