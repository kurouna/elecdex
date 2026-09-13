/**
 * Metric sources: the contract between the collector, the broker and widgets.
 *
 * A widget declares the ids it reads (WidgetDefinition.metrics); the broker
 * polls a source only while at least one widget is subscribed to it. Ids are
 * plain strings so a plugin widget can subscribe by name - see docs/plugins.md.
 */

export interface CpuInfo {
  manufacturer: string
  brand: string
  cores: number
  physicalCores: number
}

export interface CpuLoad {
  /** Overall load, 0-100. */
  total: number
  /** Per logical core, 0-100. */
  cores: number[]
}

export interface CpuSpeed {
  /** GHz. */
  avg: number
  min: number
  max: number
}

export interface CpuTemperature {
  /** Celsius, or null where the platform does not expose it (Windows). */
  main: number | null
  max: number | null
}

export interface MemUsage {
  /** Bytes. */
  total: number
  used: number
  free: number
}

export interface MemSwap {
  /** Bytes. */
  total: number
  used: number
  /** Memory the OS reports as reclaimable (cache), where it distinguishes it. */
  available: number
  active: number
}

export interface ProcessEntry {
  pid: number
  name: string
  /** Percent of one core, summed across a program's processes. */
  cpu: number
  /** Percent of total memory. */
  mem: number
}

export interface ProcessList {
  /** Total number of processes. */
  all: number
  /** Busiest first. */
  top: ProcessEntry[]
}

export interface OsInfo {
  platform: string
  distro: string
  release: string
  arch: string
  hostname: string
}

export interface OsUptime {
  /** Seconds since boot. */
  seconds: number
}

export interface Battery {
  hasBattery: boolean
  percent: number | null
  isCharging: boolean
  acConnected: boolean
}

export interface HardwareSystem {
  manufacturer: string
  model: string
  chassis: string
}

export interface NetInterface {
  iface: string | null
  ip4: string | null
  mac: string | null
  /** 'up' / 'down' / 'unknown' */
  state: string
}

export interface NetThroughput {
  iface: string | null
  /** Bytes per second. */
  rxSec: number
  txSec: number
  /** Bytes since the interface came up. */
  rxTotal: number
  txTotal: number
}

export interface NetPing {
  host: string
  /** Round trip in milliseconds, or null when unreachable. */
  ms: number | null
}

/** Every source and the shape of the sample it produces. */
export interface MetricSamples {
  'cpu.info': CpuInfo
  'cpu.load': CpuLoad
  'cpu.speed': CpuSpeed
  'cpu.temperature': CpuTemperature
  'mem.usage': MemUsage
  'mem.swap': MemSwap
  'proc.list': ProcessList
  'os.info': OsInfo
  'os.uptime': OsUptime
  'power.battery': Battery
  'hardware.system': HardwareSystem
  'net.interface': NetInterface
  'net.throughput': NetThroughput
  'net.ping': NetPing
}

export type MetricSourceId = keyof MetricSamples

export const METRIC_SOURCE_IDS = [
  'cpu.info',
  'cpu.load',
  'cpu.speed',
  'cpu.temperature',
  'mem.usage',
  'mem.swap',
  'proc.list',
  'os.info',
  'os.uptime',
  'power.battery',
  'hardware.system',
  'net.interface',
  'net.throughput',
  'net.ping',
] as const satisfies readonly MetricSourceId[]

const KNOWN = new Set<string>(METRIC_SOURCE_IDS)

/** Narrows an untrusted string - from IPC or a plugin - to a known id. */
export function isMetricSourceId(value: unknown): value is MetricSourceId {
  return typeof value === 'string' && KNOWN.has(value)
}

/** A sample as delivered to a subscriber. */
export interface MetricSample<K extends MetricSourceId = MetricSourceId> {
  id: K
  /** Epoch milliseconds when the collection finished. */
  at: number
  data: MetricSamples[K]
}

/** Diagnostics: what the collector is doing. Used by tests and a future debug view. */
export interface MetricsStats {
  /** Sources currently being polled. */
  active: MetricSourceId[]
  /** Completed collections per source since the collector started. */
  collections: Partial<Record<MetricSourceId, number>>
  /** Whether the collector process is running. */
  running: boolean
}
