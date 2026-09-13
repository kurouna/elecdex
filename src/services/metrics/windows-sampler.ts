import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import type {
  Battery,
  DiskIo,
  DiskVolumes,
  MemSwap,
  NetInterface,
  NetPing,
  NetThroughput,
  ProcessEntry,
  ProcessList,
} from '@shared/metrics'
import { type RawDrive, windowsDiskIo, windowsVolumes } from './disks.js'

/**
 * Frequent metrics on Windows, without spawning a process per reading.
 *
 * systeminformation implements most of its Windows readings by starting a fresh
 * PowerShell (or wmic, or ping.exe) for every call. PowerShell's cold start costs
 * several hundred milliseconds across multiple cores. Measured system-wide on an
 * i5-1335U, the default layout's monitoring cost ~144% of one core that way.
 * systeminformation's "persistent PowerShell" mode would avoid the cold start,
 * but on the same machine every call after the first hung indefinitely.
 *
 * Instead we keep ONE PowerShell alive, running a loop that reads everything
 * through .NET APIs - IP Helper for interfaces, the process table, ICMP for
 * ping, SystemInformation for power - and writes a JSON line per reading. Only
 * the page file needs WMI, and that is read every 30 seconds.
 *
 * Rates are computed here, in Node, from successive raw counters, in pure
 * functions that are unit-tested.
 */

// ---------------------------------------------------------------------------
// Raw readings, as emitted by the sampler script
// ---------------------------------------------------------------------------

export interface RawAdapter {
  /** Adapter name, e.g. "Wi-Fi". */
  n: string
  up: boolean
  /** Cumulative bytes. */
  rx: number
  tx: number
}

export interface RawProcess {
  id: number
  /** Image name without extension. */
  n: string
  /** Cumulative CPU time in milliseconds; null where access is denied. */
  c: number | null
  /** Working set, bytes. */
  m: number
}

export interface RawIface {
  n: string
  ip4: string | null
  mac: string | null
  /** Has an IPv4 default gateway - i.e. carries the default route. */
  gw: boolean
}

export interface RawPower {
  /** 0-1, or 2.55 (255%) when Windows does not know. */
  pct: number
  /** PowerLineStatus: 'Online' | 'Offline' | 'Unknown'. */
  line: string
  /** BatteryChargeStatus flags: 8 = charging, 128 = no system battery, 255 = unknown. */
  status: number
}

export interface RawSwap {
  totalMb: number
  usedMb: number
}

export interface Reading<T> {
  /** Epoch milliseconds when the line was received. */
  at: number
  data: T[]
}

export type SamplerLine =
  | { kind: 'net'; data: RawAdapter[] }
  | { kind: 'proc'; data: RawProcess[] }
  | { kind: 'iface'; data: RawIface[] }
  | { kind: 'ping'; ms: number | null }
  | { kind: 'tcp'; remotes: string[] }
  | { kind: 'power'; data: RawPower }
  | { kind: 'swap'; data: RawSwap }
  | { kind: 'drives'; data: RawDrive[] }
  | { kind: 'dio'; data: { r: number; w: number; idle: number | null } }

// ---------------------------------------------------------------------------
// Pure computations
// ---------------------------------------------------------------------------

/** Adapters that never carry real traffic. */
const IGNORED_ADAPTER = /loopback|pseudo-interface|isatap|teredo/i

/**
 * Picks the adapter to report. `preferred` - the adapter holding the default
 * route - wins when it is present and up; otherwise the busiest real adapter,
 * which is the same one in practice.
 */
export function pickAdapter(
  adapters: readonly RawAdapter[],
  preferred: string | null = null,
): RawAdapter | null {
  if (preferred !== null) {
    const match = adapters.find((a) => a.n === preferred && a.up)
    if (match) return match
  }
  let best: RawAdapter | null = null
  for (const a of adapters) {
    if (!a.up || IGNORED_ADAPTER.test(a.n)) continue
    if (best === null || a.rx + a.tx > best.rx + best.tx) best = a
  }
  return best
}

/** Bytes per second between two readings of the same adapter. */
export function computeThroughput(
  previous: Reading<RawAdapter> | null,
  current: Reading<RawAdapter>,
  preferred: string | null = null,
): NetThroughput {
  const adapter = pickAdapter(current.data, preferred)
  if (adapter === null) return { iface: null, rxSec: 0, txSec: 0, rxTotal: 0, txTotal: 0 }

  const before = previous?.data.find((a) => a.n === adapter.n)
  const seconds = previous ? (current.at - previous.at) / 1000 : 0

  // A counter that went backwards means the adapter was reset: report zero for
  // this interval rather than a huge negative (or wrapped) rate.
  const rate = (now: number, then: number | undefined): number =>
    then === undefined || seconds <= 0 || now < then ? 0 : (now - then) / seconds

  return {
    iface: adapter.n,
    rxSec: rate(adapter.rx, before?.rx),
    txSec: rate(adapter.tx, before?.tx),
    rxTotal: adapter.rx,
    txTotal: adapter.tx,
  }
}

/** pid 0 is the Idle pseudo-process, whose "CPU time" is idle time. */
const isPseudoProcess = (p: RawProcess): boolean => p.id === 0 || p.n === '' || p.n === 'Idle'

/** CPU milliseconds spent since the baseline; zero when either side is unknown. */
function cpuDelta(p: RawProcess, before: number | undefined): number {
  if (p.c === null || before === undefined || p.c < before) return 0
  return p.c - before
}

/**
 * CPU and memory per program between two process-table readings.
 *
 * CPU is the share of all cores (0-100), which is what systeminformation reports
 * elsewhere, grouped by program name as eDEX-UI's excludeThreadsFromToplist did.
 * A process first seen in `current` has no baseline and counts as zero for this
 * interval; a pid that was reused by a different program is not confused with
 * the old one, because baselines are matched on pid AND name.
 */
export function computeTopProcesses(
  previous: Reading<RawProcess> | null,
  current: Reading<RawProcess>,
  options: { cores: number; totalMemory: number; limit: number },
): ProcessList {
  const baseline = new Map<string, number>()
  for (const p of previous?.data ?? []) {
    if (p.c !== null) baseline.set(`${p.id}:${p.n}`, p.c)
  }

  const elapsedMs = previous ? current.at - previous.at : 0
  const capacityMs = elapsedMs * Math.max(1, options.cores)

  const byName = new Map<string, ProcessEntry>()
  for (const p of current.data) {
    if (isPseudoProcess(p)) continue

    const cpuMs = cpuDelta(p, baseline.get(`${p.id}:${p.n}`))
    const cpu = capacityMs > 0 ? (cpuMs / capacityMs) * 100 : 0
    const mem = options.totalMemory > 0 ? (p.m / options.totalMemory) * 100 : 0

    const existing = byName.get(p.n)
    if (existing) {
      existing.cpu += cpu
      existing.mem += mem
    } else {
      byName.set(p.n, { pid: p.id, name: p.n, cpu, mem })
    }
  }

  const top = [...byName.values()]
    .sort((a, b) => b.cpu - a.cpu || b.mem - a.mem)
    .slice(0, options.limit)
  return { all: current.data.length, top }
}

/** The interface holding the default route, as NetInterface. */
export function toNetInterface(ifaces: readonly RawIface[]): NetInterface {
  // With no default route (offline), fall back to any real adapter with an
  // address - but never loopback, which always has one.
  const chosen =
    ifaces.find((i) => i.gw) ??
    ifaces.find((i) => i.ip4 !== null && !IGNORED_ADAPTER.test(i.n)) ??
    null
  if (chosen === null) return { iface: null, ip4: null, mac: null, state: 'down' }
  return { iface: chosen.n, ip4: chosen.ip4, mac: chosen.mac, state: chosen.gw ? 'up' : 'down' }
}

const CHARGING = 8
const NO_BATTERY = 128
const UNKNOWN = 255

/** SystemInformation.PowerStatus as Battery. */
export function toBattery(power: RawPower): Battery {
  const hasBattery = (power.status & NO_BATTERY) === 0 && power.status !== UNKNOWN
  const percent = hasBattery && power.pct >= 0 && power.pct <= 1 ? power.pct * 100 : null
  return {
    hasBattery,
    percent,
    isCharging: hasBattery && (power.status & CHARGING) !== 0,
    acConnected: power.line === 'Online',
  }
}

const MIB = 1024 * 1024

/** Win32_PageFileUsage as the swap part of MemSwap. */
export function toSwap(swap: RawSwap, freeMemory: number): MemSwap {
  // Windows has no separate reclaimable-cache figure here, so "available" is
  // simply free memory and the memory panel shows no cached tier.
  return {
    total: swap.totalMb * MIB,
    used: swap.usedMb * MIB,
    available: freeMemory,
    active: 0,
  }
}

/** Parses one sampler line. Returns null for anything that is not a reading. */
export function parseSamplerLine(line: string): SamplerLine | null {
  let message: unknown
  try {
    message = JSON.parse(line)
  } catch {
    return null
  }
  if (!isRecord(message)) return null
  const { t, data } = message
  // ConvertTo-Json collapses a one-element array into a bare object.
  const rows = (Array.isArray(data) ? data : data == null ? [] : [data]).filter(isRecord)

  switch (t) {
    case 'net':
      return {
        kind: 'net',
        data: rows.map((r) => ({
          n: str(r.n),
          up: r.up === true,
          rx: finite(r.rx),
          tx: finite(r.tx),
        })),
      }
    case 'proc':
      return {
        kind: 'proc',
        data: rows.map((r) => ({
          id: finite(r.id),
          n: str(r.n),
          c: finiteOrNull(r.c),
          m: finite(r.m),
        })),
      }
    case 'tcp':
      return { kind: 'tcp', remotes: rows.map((r) => str(r.r)).filter((r) => r !== '') }
    case 'iface':
      return {
        kind: 'iface',
        data: rows.map((r) => ({
          n: str(r.n),
          ip4: str(r.ip4) || null,
          mac: str(r.mac) || null,
          gw: r.gw === true,
        })),
      }
    case 'ping':
      return { kind: 'ping', ms: isRecord(data) ? finiteOrNull(data.ms) : null }
    case 'power':
      return isRecord(data)
        ? {
            kind: 'power',
            data: { pct: finite(data.pct), line: str(data.line), status: finite(data.status) },
          }
        : null
    case 'swap':
      return isRecord(data)
        ? { kind: 'swap', data: { totalMb: finite(data.totalMb), usedMb: finite(data.usedMb) } }
        : null
    case 'drives':
      return {
        kind: 'drives',
        data: rows.map((r) => ({
          n: str(r.n),
          label: str(r.label),
          fs: str(r.fs),
          type: str(r.type),
          total: finite(r.total),
          free: finite(r.free),
        })),
      }
    case 'dio':
      return isRecord(data)
        ? {
            kind: 'dio',
            data: { r: finite(data.r), w: finite(data.w), idle: finiteOrNull(data.idle) },
          }
        : null
    default:
      return null
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const finite = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const finiteOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))

// ---------------------------------------------------------------------------
// The long-lived sampler process
// ---------------------------------------------------------------------------

/**
 * The loop PowerShell runs, one tick per second:
 *   every tick       interface byte counters
 *   every 5 ticks    process table, interface addresses, TCP connections, ping
 *   every 2 ticks    disk read/write rates and busy time (performance counters)
 *   every 30 ticks   power status, page file (the only WMI read), drives
 *
 * It must never outlive us. Windows does not take child processes down with
 * their parent, and the collector is ended with a hard kill, so an unguarded
 * loop would run forever as an orphan. The script therefore exits as soon as
 * its parent is gone, or as soon as a write to the pipe fails.
 */
const script = (parentPid: number, pingHost: string): string => `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
$parent = ${parentPid}
$pinger = New-Object System.Net.NetworkInformation.Ping
$tick = 0
function Emit($t, $data) {
  try {
    [Console]::Out.WriteLine((ConvertTo-Json -Compress -Depth 4 -InputObject @{ t = $t; data = $data }))
  } catch { exit 0 }
}
while ($true) {
  $alive = $false
  try { $null = [System.Diagnostics.Process]::GetProcessById($parent); $alive = $true } catch {}
  if (-not $alive) { exit 0 }

  $adapters = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
  $net = foreach ($a in $adapters) {
    $s = $a.GetIPStatistics()
    @{ n = $a.Name; up = ($a.OperationalStatus -eq 'Up'); rx = $s.BytesReceived; tx = $s.BytesSent }
  }
  Emit 'net' @($net)

  if ($tick % 5 -eq 0) {
    $procs = foreach ($p in [System.Diagnostics.Process]::GetProcesses()) {
      $c = $null
      try { $c = $p.TotalProcessorTime.TotalMilliseconds } catch {}
      @{ id = $p.Id; n = $p.ProcessName; c = $c; m = $p.WorkingSet64 }
    }
    Emit 'proc' @($procs)

    $ifaces = foreach ($a in $adapters) {
      if ($a.OperationalStatus -ne 'Up') { continue }
      $props = $a.GetIPProperties()
      $v4 = $props.UnicastAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' } | Select-Object -First 1
      $gw = $props.GatewayAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' } | Select-Object -First 1
      $mac = ($a.GetPhysicalAddress().ToString() -replace '(..)(?!$)', '$1:').ToLower()
      @{ n = $a.Name; ip4 = if ($v4) { $v4.Address.ToString() } else { $null }; mac = $mac; gw = [bool]$gw }
    }
    Emit 'iface' @($ifaces)

    $tcp = foreach ($c in [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpConnections()) {
      if ($c.State -eq 'Established') { @{ r = $c.RemoteEndPoint.Address.ToString() } }
    }
    Emit 'tcp' @($tcp)

    $ms = $null
    try { $r = $pinger.Send('${pingHost}', 1000); if ($r.Status -eq 'Success') { $ms = $r.RoundtripTime } } catch {}
    Emit 'ping' @{ ms = $ms }
  }

  if ($tick % 30 -eq 0) {
    $ps = [System.Windows.Forms.SystemInformation]::PowerStatus
    Emit 'power' @{ pct = $ps.BatteryLifePercent; line = $ps.PowerLineStatus.ToString(); status = [int]$ps.BatteryChargeStatus }

    $pf = Get-CimInstance Win32_PageFileUsage
    Emit 'swap' @{ totalMb = [int](($pf | Measure-Object AllocatedBaseSize -Sum).Sum); usedMb = [int](($pf | Measure-Object CurrentUsage -Sum).Sum) }

    # Network drives are left out: an unreachable share can block IsReady for seconds.
    $drives = foreach ($d in [System.IO.DriveInfo]::GetDrives()) {
      if (($d.DriveType -ne 'Fixed' -and $d.DriveType -ne 'Removable') -or -not $d.IsReady) { continue }
      @{ n = $d.Name; label = $d.VolumeLabel; fs = $d.DriveFormat; type = $d.DriveType.ToString(); total = $d.TotalSize; free = $d.AvailableFreeSpace }
    }
    Emit 'drives' @($drives)
  }

  # Performance counters by their English names, which Windows accepts in every
  # display language. Creating them takes about a second, so it happens once,
  # after the first round of readings is out; each read then takes ~2ms.
  if ($tick -eq 1) {
    try {
      $diskRead = New-Object System.Diagnostics.PerformanceCounter('PhysicalDisk', 'Disk Read Bytes/sec', '_Total')
      $diskWrite = New-Object System.Diagnostics.PerformanceCounter('PhysicalDisk', 'Disk Write Bytes/sec', '_Total')
      $diskIdle = New-Object System.Diagnostics.PerformanceCounter('PhysicalDisk', '% Idle Time', '_Total')
      $null = $diskRead.NextValue(); $null = $diskWrite.NextValue(); $null = $diskIdle.NextValue()
    } catch { $diskRead = $null }
  }
  if ($tick -gt 1 -and $tick % 2 -eq 0) {
    if ($diskRead) {
      Emit 'dio' @{ r = $diskRead.NextValue(); w = $diskWrite.NextValue(); idle = $diskIdle.NextValue() }
    } else {
      Emit 'dio' @{ r = 0; w = 0; idle = $null }
    }
  }

  try { [Console]::Out.Flush() } catch { exit 0 }
  $tick++
  Start-Sleep -Milliseconds 1000
}`

/** Stop the sampler when nothing has read from it for this long. */
const IDLE_TIMEOUT_MS = 40_000
/** Give up waiting for a reading after this long. */
const FIRST_READING_TIMEOUT_MS = 20_000
/** Do not respawn a sampler that died more often than this. */
const RESPAWN_MIN_INTERVAL_MS = 5000

type Waiter = () => void

export class WindowsSampler {
  private readonly pingHost: string
  private child: ChildProcessWithoutNullStreams | null = null
  private buffer = ''
  private lastRead = 0
  private lastSpawn = 0
  private idleTimer: ReturnType<typeof setInterval> | null = null
  private exitReason: string | null = null
  private readonly waiters = new Set<Waiter>()

  private netPrevious: Reading<RawAdapter> | null = null
  private netCurrent: Reading<RawAdapter> | null = null
  private procPrevious: Reading<RawProcess> | null = null
  private procCurrent: Reading<RawProcess> | null = null
  private ifaces: RawIface[] | null = null
  private ping: { ms: number | null } | null = null
  private tcp: string[] | null = null
  private power: RawPower | null = null
  private swap: RawSwap | null = null
  private drives: RawDrive[] | null = null
  private dio: { r: number; w: number; idle: number | null } | null = null

  constructor(pingHost: string) {
    // The host is interpolated into the script, so accept only an address or
    // hostname - never anything that could close the string.
    if (!/^[A-Za-z0-9.:-]+$/.test(pingHost)) throw new Error(`Invalid ping host: ${pingHost}`)
    this.pingHost = pingHost
  }

  async throughput(): Promise<NetThroughput> {
    await this.until(() => this.netCurrent !== null && this.netPrevious !== null)
    const preferred = this.ifaces?.find((i) => i.gw)?.n ?? null
    return computeThroughput(this.netPrevious, this.netCurrent as Reading<RawAdapter>, preferred)
  }

  async processes(options: {
    cores: number
    totalMemory: number
    limit: number
  }): Promise<ProcessList> {
    await this.until(() => this.procCurrent !== null && this.procPrevious !== null)
    return computeTopProcesses(this.procPrevious, this.procCurrent as Reading<RawProcess>, options)
  }

  async netInterface(): Promise<NetInterface> {
    await this.until(() => this.ifaces !== null)
    return toNetInterface(this.ifaces ?? [])
  }

  async netPing(): Promise<NetPing> {
    await this.until(() => this.ping !== null)
    return { host: this.pingHost, ms: this.ping?.ms ?? null }
  }

  /** Remote addresses of established TCP connections. */
  async tcpRemotes(): Promise<string[]> {
    await this.until(() => this.tcp !== null)
    return this.tcp ?? []
  }

  async battery(): Promise<Battery> {
    await this.until(() => this.power !== null)
    return toBattery(this.power as RawPower)
  }

  async memSwap(freeMemory: number): Promise<MemSwap> {
    await this.until(() => this.swap !== null)
    return toSwap(this.swap as RawSwap, freeMemory)
  }

  async diskVolumes(): Promise<DiskVolumes> {
    await this.until(() => this.drives !== null)
    return { volumes: windowsVolumes(this.drives ?? []) }
  }

  async diskIo(): Promise<DiskIo> {
    await this.until(() => this.dio !== null)
    return windowsDiskIo(this.dio ?? { r: 0, w: 0, idle: null })
  }

  stop(): void {
    if (this.idleTimer) clearInterval(this.idleTimer)
    this.idleTimer = null
    this.child?.kill()
    this.child = null
  }

  /** Starts the sampler if needed, then resolves once `ready()` holds. */
  private until(ready: () => boolean): Promise<void> {
    this.lastRead = Date.now()
    this.ensureRunning()
    if (ready()) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(check)
        reject(new Error(this.exitReason ?? 'Windows sampler produced no reading'))
      }, FIRST_READING_TIMEOUT_MS)
      const check: Waiter = () => {
        if (!ready()) return
        clearTimeout(timer)
        this.waiters.delete(check)
        resolve()
      }
      this.waiters.add(check)
    })
  }

  private ensureRunning(): void {
    if (this.child !== null) return
    const now = Date.now()
    if (now - this.lastSpawn < RESPAWN_MIN_INTERVAL_MS) return
    this.lastSpawn = now
    this.exitReason = null

    // The script is passed as a command, never written to or run from a file,
    // so Windows' ExecutionPolicy does not apply to it.
    const child = spawn(
      'powershell.exe',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script(process.pid, this.pingHost)],
      { windowsHide: true },
    )
    this.child = child
    this.buffer = ''

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => this.onData(chunk))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      this.exitReason = `Windows sampler: ${chunk.trim().slice(0, 300)}`
    })
    child.on('error', (error) => {
      this.exitReason = `Windows sampler failed to start: ${error.message}`
    })
    child.on('exit', (code) => {
      if (this.child !== child) return
      this.child = null
      this.exitReason ??= `Windows sampler exited with code ${code}`
      // Stale counters would produce one bogus interval after a restart.
      this.netPrevious = this.netCurrent = null
      this.procPrevious = this.procCurrent = null
    })

    if (this.idleTimer === null) {
      this.idleTimer = setInterval(() => {
        if (Date.now() - this.lastRead > IDLE_TIMEOUT_MS) this.stop()
      }, IDLE_TIMEOUT_MS / 2)
      this.idleTimer.unref?.()
    }
  }

  private onData(chunk: string): void {
    this.buffer += chunk
    let newline = this.buffer.indexOf('\n')
    while (newline >= 0) {
      const line = this.buffer.slice(0, newline).trim()
      this.buffer = this.buffer.slice(newline + 1)
      if (line !== '') this.onLine(line)
      newline = this.buffer.indexOf('\n')
    }
  }

  private onLine(line: string): void {
    const parsed = parseSamplerLine(line)
    if (parsed === null) return
    const at = Date.now()
    switch (parsed.kind) {
      case 'net':
        this.netPrevious = this.netCurrent
        this.netCurrent = { at, data: parsed.data }
        break
      case 'proc':
        this.procPrevious = this.procCurrent
        this.procCurrent = { at, data: parsed.data }
        break
      case 'iface':
        this.ifaces = parsed.data
        break
      case 'ping':
        this.ping = { ms: parsed.ms }
        break
      case 'tcp':
        this.tcp = parsed.remotes
        break
      case 'power':
        this.power = parsed.data
        break
      case 'swap':
        this.swap = parsed.data
        break
      case 'drives':
        this.drives = parsed.data
        break
      case 'dio':
        this.dio = parsed.data
        break
    }
    for (const waiter of [...this.waiters]) waiter()
  }
}
