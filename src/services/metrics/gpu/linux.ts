import { readdir, readFile } from 'node:fs/promises'
import type { GpuInfo, GpuUsage } from '@shared/metrics'
import { NO_GPU, vendorName } from './common.js'

/**
 * GPU load and memory on Linux, from what the kernel driver puts in sysfs - files
 * read, never a process. Only amdgpu says how busy it is (`gpu_busy_percent`) and
 * how much VRAM is in use (`mem_info_vram_*`, GTT for what it borrows); NVIDIA's
 * driver says it only through nvidia-smi or NVML, and i915 not at all, so those
 * machines have no GPU reading (the pane says so).
 */

const DRM = '/sys/class/drm'

export interface SysfsGpu {
  card: string
  name: string
  vendor: number
  busy: number | null
  vramUsed: number | null
  vramTotal: number | null
  gttUsed: number | null
  gttTotal: number | null
}

const numberIn = (text: string | null): number | null => {
  if (text === null) return null
  const value = Number(text.trim())
  return Number.isFinite(value) ? value : null
}

async function read(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

/** The cards (card0, card1 - not their connectors, card0-DP-1) whose driver reports a load. */
export async function readSysfsGpus(root: string = DRM): Promise<SysfsGpu[]> {
  let names: string[]
  try {
    names = await readdir(root)
  } catch {
    return []
  }
  const cards = names.filter((name) => /^card\d+$/.test(name)).sort()
  const gpus = await Promise.all(
    cards.map(async (card): Promise<SysfsGpu | null> => {
      const at = (file: string): Promise<string | null> => read(`${root}/${card}/device/${file}`)
      const busy = numberIn(await at('gpu_busy_percent'))
      if (busy === null) return null
      const [product, vendor, vramUsed, vramTotal, gttUsed, gttTotal] = await Promise.all([
        at('product_name'),
        at('vendor'),
        at('mem_info_vram_used'),
        at('mem_info_vram_total'),
        at('mem_info_gtt_used'),
        at('mem_info_gtt_total'),
      ])
      const vendorId = numberIn(vendor) ?? 0
      const maker = vendorName(vendorId)
      return {
        card,
        name: product?.trim().slice(0, 128) || `${maker || 'GPU'} ${card}`.trim(),
        vendor: vendorId,
        busy: Math.min(100, Math.max(0, busy)),
        vramUsed: numberIn(vramUsed),
        vramTotal: numberIn(vramTotal),
        gttUsed: numberIn(gttUsed),
        gttTotal: numberIn(gttTotal),
      }
    }),
  )
  return gpus.filter((gpu): gpu is SysfsGpu => gpu !== null)
}

const byVram = (gpus: readonly SysfsGpu[]): SysfsGpu | null =>
  gpus.reduce<SysfsGpu | null>(
    (best, gpu) => (best === null || (gpu.vramTotal ?? 0) > (best.vramTotal ?? 0) ? gpu : best),
    null,
  )

export const linuxGpuInfo = (gpus: readonly SysfsGpu[]): GpuInfo => ({
  adapters: gpus.map((gpu) => ({
    name: gpu.name,
    vendor: vendorName(gpu.vendor),
    dedicated: gpu.vramTotal ?? 0,
    shared: gpu.gttTotal ?? 0,
  })),
})

/** The card with the most VRAM, as on Windows. Busy is the whole GPU: no engine kinds. */
export function linuxGpuUsage(gpus: readonly SysfsGpu[]): GpuUsage {
  const gpu = byVram(gpus)
  if (gpu === null) return NO_GPU
  return {
    name: gpu.name,
    load: gpu.busy,
    engines: { graphics: null, compute: null, copy: null, video: null },
    vramUsed: gpu.vramUsed,
    vramTotal: gpu.vramTotal,
    sharedUsed: gpu.gttUsed,
    sharedTotal: gpu.gttTotal,
  }
}
