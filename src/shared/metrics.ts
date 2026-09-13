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

export interface ConnectionCountry {
  /** ISO 3166 alpha-2. */
  code: string
  /** Established connections to addresses in this country. */
  count: number
  /** Where the country is pinned: the centroid of its largest landmass. */
  lat: number
  lon: number
}

/**
 * Established TCP connections to public addresses, grouped by country. Addresses
 * themselves stay in the collector; only counts per country leave it.
 */
export interface NetConnections {
  /** Distinct public remote addresses. */
  total: number
  /** Addresses the GeoIP database could not place. */
  unresolved: number
  countries: ConnectionCountry[]
}

export type VolumeKind = 'fixed' | 'removable' | 'network' | 'other'

export interface DiskVolume {
  /** Where it is mounted: "C:\" on Windows, "/" or "/Volumes/Backup" elsewhere. */
  mount: string
  /** Volume label, or '' when it has none. */
  label: string
  /** Filesystem, e.g. "NTFS", "apfs", "ext4". */
  fs: string
  kind: VolumeKind
  /** Bytes. */
  total: number
  used: number
}

export interface DiskVolumes {
  volumes: DiskVolume[]
}

/** Reads and writes across every physical disk, since the previous sample. */
export interface DiskIo {
  /** Bytes per second. */
  readSec: number
  writeSec: number
  /** Share of time the disks were busy, 0-100; null where the platform does not say. */
  busy: number | null
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
  'net.connections': NetConnections
  'disk.volumes': DiskVolumes
  'disk.io': DiskIo
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
  'net.connections',
  'disk.volumes',
  'disk.io',
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
