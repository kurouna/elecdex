import type { GpuUsage } from './metrics.js'

/**
 * What the GPU pane and CLUSTER both read from a `gpu.usage` sample, once:
 * the share of memory in use and the engine kinds' loads.
 */

/** Used over total, 0-1; null where either is not known. */
export function memoryFraction(used: number | null, total: number | null): number | null {
  if (used === null || total === null || total <= 0) return null
  return Math.min(1, Math.max(0, used / total))
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
