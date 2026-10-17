import type { GpuInfo, GpuUsage } from '@shared/metrics'
import type { WindowsSampler } from '../windows-sampler.js'
import { NO_GPU } from './common.js'
import { linuxGpuInfo, linuxGpuUsage, readSysfsGpus } from './linux.js'
import { gpuStubFrom, stubGpuInfo, stubGpuUsage } from './stub.js'

/**
 * The GPU's two sources, `gpu.info` and `gpu.usage`: on Windows the sampler's
 * performance counters (gpu/windows.ts), on Linux amdgpu's sysfs files. macOS
 * has no reading without a process per look (ioreg), so it reports none, and
 * so does a machine whose driver says nothing; the pane says so and CLUSTER
 * leaves the GPU out.
 */

const stub = gpuStubFrom(process.env.ELECDEX_GPU_STUB)

export async function readGpuInfo(sampler: WindowsSampler | null): Promise<GpuInfo> {
  if (stub !== null) return stubGpuInfo(stub)
  if (sampler !== null) return sampler.gpuInfo()
  if (process.platform === 'linux') return linuxGpuInfo(await readSysfsGpus())
  return { adapters: [] }
}

export async function readGpuUsage(sampler: WindowsSampler | null): Promise<GpuUsage> {
  if (stub !== null) return stubGpuUsage(stub, Date.now())
  if (sampler !== null) return sampler.gpuUsage()
  if (process.platform === 'linux') return linuxGpuUsage(await readSysfsGpus())
  return NO_GPU
}
