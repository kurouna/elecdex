import type { GpuUsage } from '@shared/metrics'

/** What a machine whose GPU cannot be read reports: the pane says so, CLUSTER leaves it out. */
export const NO_GPU: GpuUsage = {
  name: null,
  load: null,
  engines: { graphics: null, compute: null, copy: null, video: null },
  vramUsed: null,
  vramTotal: null,
  sharedUsed: null,
  sharedTotal: null,
}

const VENDORS: ReadonlyMap<number, string> = new Map([
  [0x10de, 'NVIDIA'],
  [0x1002, 'AMD'],
  [0x1022, 'AMD'],
  [0x8086, 'Intel'],
  [0x106b, 'Apple'],
  [0x5143, 'Qualcomm'],
])

/** The maker by PCI vendor id; '' for one not listed. */
export const vendorName = (id: number): string => VENDORS.get(id) ?? ''
