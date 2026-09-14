import { statfsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { MachineFacts } from '@shared/api'
import { app, screen } from 'electron'

/**
 * Facts about the machine for the boot log, read when it asks.
 *
 * Everything comes from Node and Electron in this process, without running a
 * program: no systeminformation, whose network functions run `netsh wlan` and
 * with it a location prompt on Windows. Network interfaces are listed by name
 * only - the log is on screen, and an address is nobody's business.
 */

/** Electron's GPU query waits for the GPU process; a boot log does not wait longer than this. */
const GPU_TIMEOUT_MS = 1000

export async function machineFacts(): Promise<MachineFacts> {
  const cpus = os.cpus()
  const home = os.homedir()
  return {
    kernel: { name: os.version(), release: os.release(), machine: os.machine() },
    cpuSpeedMhz: cpus[0]?.speed ?? 0,
    freeMemory: os.freemem(),
    pid: process.pid,
    startedAt: Math.round(Date.now() - process.uptime() * 1000),
    switches: switchNames(process.argv.slice(1)),
    volume: volumeOf(home),
    network: upInterfaces(os.networkInterfaces()),
    gpus: gpuDevices(await gpuInfo()),
    displays: screen.getAllDisplays().map((d) => ({
      width: d.size.width,
      height: d.size.height,
      hz: Math.round(d.displayFrequency),
      scale: d.scaleFactor,
      internal: d.internal,
    })),
  }
}

/** The switches among command-line arguments, by name: a value may be a path. */
export function switchNames(argv: readonly string[]): string[] {
  const names = argv
    .filter((arg) => /^--[a-z][\w-]*(=|$)/i.test(arg))
    .map((arg) => arg.split('=')[0] as string)
  return [...new Set(names)]
}

/** Interfaces with an address that is not loopback, in the order the OS gives them. */
export function upInterfaces(interfaces: NodeJS.Dict<Array<{ internal: boolean }>>): string[] {
  return Object.entries(interfaces)
    .filter(([, addresses]) => addresses?.some((a) => !a.internal))
    .map(([name]) => name)
}

interface GpuDevice {
  vendorId?: unknown
  deviceId?: unknown
  deviceString?: unknown
  driverVersion?: unknown
}

/** The GPUs in Electron's basic GPU info, skipping software renderers with no device id. */
export function gpuDevices(info: unknown): MachineFacts['gpus'] {
  const devices = (info as { gpuDevice?: unknown } | null)?.gpuDevice
  if (!Array.isArray(devices)) return []
  return devices.flatMap((raw: GpuDevice) => {
    const vendorId = typeof raw.vendorId === 'number' ? raw.vendorId : 0
    const deviceId = typeof raw.deviceId === 'number' ? raw.deviceId : 0
    if (vendorId === 0 && deviceId === 0) return []
    return [
      {
        vendorId,
        deviceId,
        name: typeof raw.deviceString === 'string' ? raw.deviceString : '',
        driver: typeof raw.driverVersion === 'string' ? raw.driverVersion : '',
      },
    ]
  })
}

function gpuInfo(): Promise<unknown> {
  return Promise.race([
    app.getGPUInfo('basic').catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), GPU_TIMEOUT_MS)),
  ])
}

function volumeOf(dir: string): MachineFacts['volume'] {
  const root = path.parse(dir).root
  try {
    const stats = statfsSync(root)
    return { root, total: stats.blocks * stats.bsize, free: stats.bavail * stats.bsize }
  } catch {
    return null
  }
}
