import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import { promisify } from 'node:util'
import type {
  Battery,
  CpuInfo,
  CpuLoad,
  CpuSpeed,
  CpuTemperature,
  DiskIo,
  DiskVolumes,
  HardwareSystem,
  MemSwap,
  MemUsage,
  MetricSourceId,
  NetConnections,
  NetInterface,
  NetPing,
  NetThroughput,
  OsInfo,
  OsUptime,
  ProcessEntry,
  ProcessList,
} from '@shared/metrics'
import si from 'systeminformation'
import { type DiskCounters, diskIoBetween, parseDiskstats, posixVolumes } from './disks.js'
import { summarizeConnections } from './geoip.js'
import { parseBsdNetstat, parseProcNetTcp, publicRemotes } from './net-connections.js'
import type { SourceDefinition } from './scheduler.js'
import { WindowsSampler } from './windows-sampler.js'

/**
 * What each metric source collects, and how often.
 *
 * Intervals are set from measurements, not guesses. On Windows 11 (i5-1335U),
 * systeminformation took, per call:
 *
 *   cpu()                 ~1550ms   static                -> 10 min
 *   osInfo()              ~1000ms   static                -> 10 min
 *   system() + chassis()  ~1450ms   static                -> 10 min
 *   networkInterfaces()   ~1400ms   rarely changes        -> 30s
 *   battery()              ~450ms                         -> 30s
 *   mem()                  ~400ms   spawns a process      -> swap only, 10s
 *   cpuTemperature()       ~400ms   and returns null      -> not called on win32
 *   processes()            ~680ms   spawns PowerShell      -> own sampler on win32
 *   networkStats()         ~120ms   spawns PowerShell      -> own sampler on win32
 *   currentLoad(), cpuCurrentSpeed(), time()   ~0ms       -> 1-2s
 *
 * eDEX-UI called si.mem() every 1.5s - on Windows that is roughly a quarter of a
 * core spent spawning processes. Used/free memory now comes from Node's `os`,
 * which is instant, and si.mem() is only asked for swap.
 *
 * Per-call timings understate the real cost, though. Measured system-wide, the
 * default layout's monitoring cost ~144% of one core on Windows, because each of
 * those calls starts a fresh PowerShell, wmic or ping.exe. Every frequent Windows
 * source - traffic, processes, interface, ping, battery, swap - therefore reads
 * from WindowsSampler, one long-lived process; see windows-sampler.ts. Only the
 * static sources, read once every ten minutes, still go through
 * systeminformation there.
 */

const isWindows = process.platform === 'win32'
const byPlatform = (windows: number, other: number): number => (isWindows ? windows : other)

const TEN_MINUTES = 10 * 60 * 1000

/** Host pinged for latency. The same default eDEX-UI used. */
export const PING_HOST = '1.1.1.1'

/** One long-lived sampler shared by every frequent Windows source. */
const windowsSampler = isWindows ? new WindowsSampler(PING_HOST) : null

/** Processes reported in the top list. */
const TOP_PROCESSES = 12

const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const num = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0
const numOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

async function cpuInfo(): Promise<CpuInfo> {
  const c = await si.cpu()
  return {
    manufacturer: str(c.manufacturer),
    brand: str(c.brand),
    cores: num(c.cores) || os.cpus().length,
    physicalCores: num(c.physicalCores),
  }
}

async function cpuLoad(): Promise<CpuLoad> {
  const l = await si.currentLoad()
  return { total: num(l.currentLoad), cores: (l.cpus ?? []).map((c) => num(c.load)) }
}

async function cpuSpeed(): Promise<CpuSpeed> {
  const s = await si.cpuCurrentSpeed()
  return { avg: num(s.avg), min: num(s.min), max: num(s.max) }
}

async function cpuTemperature(): Promise<CpuTemperature> {
  // Windows does not expose it to unprivileged processes: systeminformation
  // spends ~400ms asking WMI and gets null back. Do not pay for nothing.
  if (isWindows) return { main: null, max: null }
  const t = await si.cpuTemperature()
  return { main: numOrNull(t.main), max: numOrNull(t.max) }
}

async function memUsage(): Promise<MemUsage> {
  const total = os.totalmem()
  const free = os.freemem()
  return { total, free, used: total - free }
}

async function memSwap(): Promise<MemSwap> {
  if (windowsSampler) return windowsSampler.memSwap(os.freemem())
  const m = await si.mem()
  return {
    total: num(m.swaptotal),
    used: num(m.swapused),
    available: num(m.available),
    active: num(m.active),
  }
}

async function processList(): Promise<ProcessList> {
  if (windowsSampler) {
    return windowsSampler.processes({
      cores: os.cpus().length,
      totalMemory: os.totalmem(),
      limit: TOP_PROCESSES,
    })
  }
  const p = await si.processes()
  // Group by program name, like eDEX-UI's excludeThreadsFromToplist: a browser
  // is one entry, not forty.
  const byName = new Map<string, ProcessEntry>()
  for (const proc of p.list ?? []) {
    const name = str(proc.name)
    if (name === '' || num(proc.pid) === 0) continue // skip the idle pseudo-process
    const existing = byName.get(name)
    if (existing) {
      existing.cpu += num(proc.cpu)
      existing.mem += num(proc.mem)
    } else {
      byName.set(name, { pid: num(proc.pid), name, cpu: num(proc.cpu), mem: num(proc.mem) })
    }
  }
  const top = [...byName.values()]
    .sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)
    .slice(0, TOP_PROCESSES)
  return { all: num(p.all), top }
}

async function osInfo(): Promise<OsInfo> {
  const o = await si.osInfo()
  return {
    platform: str(o.platform),
    distro: str(o.distro),
    release: str(o.release),
    arch: str(o.arch),
    hostname: str(o.hostname),
  }
}

async function osUptime(): Promise<OsUptime> {
  return { seconds: os.uptime() }
}

async function battery(): Promise<Battery> {
  if (windowsSampler) return windowsSampler.battery()
  const b = await si.battery()
  return {
    hasBattery: b.hasBattery === true,
    percent: b.hasBattery ? numOrNull(b.percent) : null,
    isCharging: b.isCharging === true,
    acConnected: b.acConnected === true,
  }
}

async function hardwareSystem(): Promise<HardwareSystem> {
  const [system, chassis] = await Promise.all([si.system(), si.chassis()])
  return {
    manufacturer: str(system.manufacturer),
    model: str(system.model),
    chassis: str(chassis.type),
  }
}

async function netInterface(): Promise<NetInterface> {
  if (windowsSampler) return windowsSampler.netInterface()
  const data = await si.networkInterfaces('default')
  const iface = Array.isArray(data) ? data[0] : data
  if (!iface) return { iface: null, ip4: null, mac: null, state: 'unknown' }
  return {
    iface: str(iface.iface) || null,
    ip4: str(iface.ip4) || null,
    mac: str(iface.mac) || null,
    state: str(iface.operstate) || 'unknown',
  }
}

async function netThroughput(): Promise<NetThroughput> {
  if (windowsSampler) return windowsSampler.throughput()
  // networkStats() with no argument reports the default interface. rx_sec is
  // null on the very first call, since it is a delta between calls.
  const stats = await si.networkStats()
  const s = stats[0]
  if (!s) return { iface: null, rxSec: 0, txSec: 0, rxTotal: 0, txTotal: 0 }
  return {
    iface: str(s.iface) || null,
    rxSec: Math.max(0, num(s.rx_sec)),
    txSec: Math.max(0, num(s.tx_sec)),
    rxTotal: num(s.rx_bytes),
    txTotal: num(s.tx_bytes),
  }
}

async function netPing(): Promise<NetPing> {
  if (windowsSampler) return windowsSampler.netPing()
  const ms = await si.inetLatency(PING_HOST)
  return { host: PING_HOST, ms: typeof ms === 'number' && ms >= 0 ? ms : null }
}

const run = promisify(execFile)

async function netConnections(): Promise<NetConnections> {
  let remotes: string[]
  if (windowsSampler) {
    remotes = await windowsSampler.tcpRemotes()
  } else if (process.platform === 'linux') {
    const tables = await Promise.all(
      ['/proc/net/tcp', '/proc/net/tcp6'].map((f) => readFile(f, 'utf8').catch(() => '')),
    )
    remotes = tables.flatMap(parseProcNetTcp)
  } else {
    const { stdout } = await run('netstat', ['-anp', 'tcp'], { timeout: 4000 })
    remotes = parseBsdNetstat(stdout)
  }
  return summarizeConnections(publicRemotes(remotes))
}

async function diskVolumes(): Promise<DiskVolumes> {
  if (windowsSampler) return windowsSampler.diskVolumes()
  const rows = await si.fsSize()
  return {
    volumes: posixVolumes(
      rows.map((r) => ({
        fs: str(r.fs),
        type: str(r.type),
        size: num(r.size),
        used: num(r.used),
        mount: str(r.mount),
      })),
      process.platform,
    ),
  }
}

let diskCounters: DiskCounters | null = null

async function diskIo(): Promise<DiskIo> {
  if (windowsSampler) return windowsSampler.diskIo()
  if (process.platform === 'linux') {
    const current = parseDiskstats(await readFile('/proc/diskstats', 'utf8'), Date.now())
    const io = diskIoBetween(diskCounters, current)
    diskCounters = current
    return io
  }
  // macOS reports disk I/O only through ioreg, a process per reading; not worth
  // it every two seconds for a readout.
  return { readSec: null, writeSec: null, busy: null }
}

export const SOURCES: Record<MetricSourceId, SourceDefinition> = {
  'cpu.info': { intervalMs: TEN_MINUTES, collect: cpuInfo },
  'cpu.load': { intervalMs: 1000, collect: cpuLoad },
  'cpu.speed': { intervalMs: 2000, collect: cpuSpeed },
  'cpu.temperature': { intervalMs: 5000, collect: cpuTemperature },
  // Every second, like cpu.load: the two graphs sit together and should move in step.
  'mem.usage': { intervalMs: 1000, collect: memUsage },
  'mem.swap': { intervalMs: 10_000, collect: memSwap },
  'proc.list': { intervalMs: byPlatform(5000, 3000), collect: processList },
  'os.info': { intervalMs: TEN_MINUTES, collect: osInfo },
  'os.uptime': { intervalMs: 5000, collect: osUptime },
  'power.battery': { intervalMs: 30_000, collect: battery },
  'hardware.system': { intervalMs: TEN_MINUTES, collect: hardwareSystem },
  'net.interface': { intervalMs: byPlatform(5000, 30_000), collect: netInterface },
  'net.throughput': { intervalMs: 1000, collect: netThroughput },
  'net.ping': { intervalMs: 5000, collect: netPing },
  'net.connections': { intervalMs: 5000, collect: netConnections },
  'disk.volumes': { intervalMs: 30_000, collect: diskVolumes },
  'disk.io': { intervalMs: 2000, collect: diskIo },
}
