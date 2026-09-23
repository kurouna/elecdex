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
  /** "Windows 11 Pro", "Ubuntu", "macOS". */
  distro: string
  release: string
  /** "25H2" on Windows, "Noble Numbat" on Ubuntu, "Sequoia" on macOS; may be empty. */
  codename: string
  /** "26200.9457" on Windows, "24B83" on macOS; often empty on Linux. */
  build: string
  /** The kernel release, as uname -r prints it. */
  kernel: string
  /** Node's name for it: "x64", "arm64". */
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

/**
 * A TCP socket's state, as the kernel names it. Every platform reports the same
 * set under a different spelling, so the collector maps into this one.
 */
export type SocketState =
  | 'established'
  | 'listen'
  | 'syn-sent'
  | 'syn-recv'
  | 'fin-wait'
  | 'time-wait'
  | 'close-wait'
  | 'last-ack'
  | 'closing'
  | 'closed'
  | 'unknown'

/**
 * One socket, as the connections pane draws it.
 *
 * Unlike `net.connections`, which leaves the addresses in the collector and
 * reports only counts per country, this carries the addresses themselves: the
 * pane exists to show them. That is why it is not a reading a plugin can be
 * granted (PLUGIN_METRIC_SOURCE_IDS).
 */
export interface NetSocket {
  family: 4 | 6
  /** The address on this machine; 0.0.0.0 or :: for a socket listening on all of them. */
  localAddress: string
  localPort: number
  /** '' while listening. */
  remoteAddress: string
  /** 0 while listening. */
  remotePort: number
  state: SocketState
  /** 0 where the platform does not say who owns the socket (macOS). */
  pid: number
  /** '' where the owner is unknown, or the process has gone. */
  process: string
  /** ISO 3166 alpha-2 for the peer, or '' when it is private or unplaceable. */
  country: string
  /** The peer is on the public internet - not loopback, private or link-local. */
  publicPeer: boolean
}

/**
 * The machine's TCP sockets. Read only while a connections pane is open, and
 * capped: a busy machine can hold thousands, and no pane draws thousands.
 */
export interface NetSockets {
  sockets: NetSocket[]
  /** Totals before the cap, so the pane can say what it is not showing. */
  established: number
  listening: number
  /** Rows left out by the cap. */
  dropped: number
  /** True where the platform cannot name the owning process, so the pane says so. */
  ownersUnknown: boolean
  /**
   * What each listening process is, by pid, told from its command line (the
   * line itself never leaves the collector). Only processes with something to
   * say beyond their name are here.
   */
  owners: Record<string, SocketOwner>
}

/** A listening process as its command line tells it: `vite` serving `elecdex`. */
export interface SocketOwner {
  /** The program it runs: a package, a script, a module, a hosted service. '' if nothing. */
  tool: string
  /** The folder it serves: the project above node_modules or a venv. '' if unknown. */
  project: string
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
  /** Bytes per second; null where the platform has no reading (macOS). */
  readSec: number | null
  writeSec: number | null
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
  'net.sockets': NetSockets
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
  'net.sockets',
  'disk.volumes',
  'disk.io',
] as const satisfies readonly MetricSourceId[]

/** Readings that are never a plugin's to ask for, whatever its descriptor says. */
export const PRIVATE_METRIC_SOURCE_IDS = [
  'net.sockets',
] as const satisfies readonly MetricSourceId[]

/**
 * The readings a plugin can be granted (shared/plugins.ts).
 *
 * Everything except `net.sockets`, which carries the addresses this machine is
 * talking to together with the name of the program holding each one - the whole
 * point of the connections pane, and far more than the country counts a plugin
 * agrees to when it asks for `net.connections`. Widening a grant somebody has
 * already given, without asking them again, is what this list exists to prevent.
 *
 * Written out rather than filtered, so it stays a tuple of literals for zod - and
 * so a new source has to be put here deliberately. A unit test checks that every
 * source is either in this list or in PRIVATE_METRIC_SOURCE_IDS.
 */
export const PLUGIN_METRIC_SOURCE_IDS = [
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
