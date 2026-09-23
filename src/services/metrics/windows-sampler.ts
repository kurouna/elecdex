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

/**
 * A listening process's executable and command line (`p`, `e`, `c`), read
 * once per process by the sampler. Empty for a process that is not ours to open.
 */
export interface RawListener {
  p: number
  e: string
  c: string
}

export type SamplerLine =
  | { kind: 'net'; data: RawAdapter[] }
  | { kind: 'proc'; data: RawProcess[] }
  | { kind: 'iface'; data: RawIface[] }
  | { kind: 'ping'; ms: number | null }
  | { kind: 'tcp'; rows: string[] }
  | { kind: 'lsnr'; data: RawListener[] }
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

/**
 * The peers of the established rows, which is all the globe wants.
 *
 * MIB_TCP_STATE numbers ESTABLISHED 5, and .NET's TcpState enum happens to use
 * the same numbering, so the fallback table reads the same way.
 */
export function establishedRemotes(rows: readonly string[]): string[] {
  const remotes: string[] = []
  for (const row of rows) {
    const fields = row.split('|')
    if (fields[1] !== '5') continue
    const remote = fields[4] ?? ''
    if (remote !== '') remotes.push(remote)
  }
  return remotes
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

/**
 * The socket table's rows, which are packed strings rather than objects: a
 * machine can hold thousands of sockets, and `family|state|local|port|remote|
 * port|pid` is a third of the JSON the same row would take as an object.
 */
function packedRows(data: unknown): string[] {
  const list = Array.isArray(data) ? data : data == null ? [] : [data]
  return list.filter((row): row is string => typeof row === 'string')
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
      return { kind: 'tcp', rows: packedRows(data) }
    case 'lsnr':
      return {
        kind: 'lsnr',
        data: rows.map((r) => ({ p: finite(r.p), e: str(r.e), c: str(r.c).slice(0, 4096) })),
      }
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
 *   every 5 ticks    process table, interface addresses, TCP sockets, ping
 *   every 2 ticks    disk read/write rates and busy time (performance counters)
 *   every 30 ticks   power status, page file (the only WMI read), drives
 *
 * The socket table comes from iphlpapi's GetExtendedTcpTable, because it is the
 * only source that says which process holds a socket: .NET leaves the owner out
 * and `netstat -ano` would be a process per reading. Compiling the P/Invoke
 * costs a second, so it happens once, with the performance counters, after the
 * first round of readings is out; a machine that cannot compile it falls back to
 * .NET's own table, which is the same rows without their owners.
 *
 * It must never outlive us. Windows does not take child processes down with
 * their parent, and the collector is ended with a hard kill, so an unguarded
 * loop would run forever as an orphan. The script therefore exits as soon as
 * its parent is gone, or as soon as a write to the pipe fails.
 */
/**
 * The C# the sampler compiles once, to read the socket table with its owners.
 *
 * GetExtendedTcpTable with TCP_TABLE_OWNER_PID_ALL returns every socket -
 * listening ones included - each with the pid of the process holding it. The
 * ports in MIB_TCPROW_OWNER_PID are in network byte order in the low half of a
 * DWORD, hence the swap; a listening row's remote address is zero, which the
 * reader drops when it sees the state.
 *
 * Kept in its own constant rather than inline, so the PowerShell around it stays
 * readable. It goes into a single-quoted here-string, so nothing in it is
 * expanded: it must contain no line beginning with the here-string terminator.
 */
const TCP_TABLE_SOURCE = `
using System;
using System.Collections.Generic;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;

public class ElecdexTcpTable {
  [DllImport("iphlpapi.dll", SetLastError = true)]
  static extern uint GetExtendedTcpTable(IntPtr table, ref int size, bool order, int af, int cls, int reserved);

  [StructLayout(LayoutKind.Sequential)]
  struct Row4 {
    public uint state;
    public uint localAddr;
    public uint localPort;
    public uint remoteAddr;
    public uint remotePort;
    public uint pid;
  }

  [StructLayout(LayoutKind.Sequential)]
  struct Row6 {
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)] public byte[] localAddr;
    public uint localScope;
    public uint localPort;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)] public byte[] remoteAddr;
    public uint remoteScope;
    public uint remotePort;
    public uint state;
    public uint pid;
  }

  [DllImport("ntdll.dll")]
  static extern int NtQueryInformationProcess(IntPtr process, int cls, IntPtr info, int length, out int returned);

  [DllImport("kernel32.dll", SetLastError = true)]
  static extern IntPtr OpenProcess(int access, bool inherit, int pid);

  [DllImport("kernel32.dll")]
  static extern bool CloseHandle(IntPtr handle);

  [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
  static extern bool QueryFullProcessImageName(IntPtr process, int flags, StringBuilder name, ref int size);

  const int AF_INET = 2;
  const int AF_INET6 = 23;
  const int OWNER_PID_ALL = 5;
  // A pane draws a few hundred rows at most; this only bounds what crosses the pipe.
  const int MAX_ROWS = 2000;

  const int PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
  const int PROCESS_COMMAND_LINE_INFORMATION = 60;

  // A listening process's executable and command line. The limited right is
  // enough for the user's own processes, the only ones worth naming; a service's
  // is refused without elevation and comes back empty, which is fine.
  public static string[] Owner(int pid) {
    IntPtr process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
    if (process == IntPtr.Zero) return new string[] { "", "" };
    try {
      StringBuilder name = new StringBuilder(1024);
      int size = name.Capacity;
      string exe = QueryFullProcessImageName(process, 0, name, ref size) ? name.ToString() : "";
      return new string[] { exe, CommandLine(process) };
    } finally {
      CloseHandle(process);
    }
  }

  // The answer is a UNICODE_STRING (two lengths, then a pointer at the next
  // pointer-aligned offset) followed by the text it points at.
  static string CommandLine(IntPtr process) {
    int length;
    NtQueryInformationProcess(process, PROCESS_COMMAND_LINE_INFORMATION, IntPtr.Zero, 0, out length);
    if (length <= 0 || length > 65536) return "";
    IntPtr buffer = Marshal.AllocHGlobal(length);
    try {
      if (NtQueryInformationProcess(process, PROCESS_COMMAND_LINE_INFORMATION, buffer, length, out length) != 0) return "";
      int bytes = Marshal.ReadInt16(buffer) & 0xFFFF;
      return Marshal.PtrToStringUni(Marshal.ReadIntPtr(buffer, IntPtr.Size), bytes / 2);
    } finally {
      Marshal.FreeHGlobal(buffer);
    }
  }

  static int Port(uint value) {
    return (int)(((value & 0xFF) << 8) | ((value >> 8) & 0xFF));
  }

  public static string[] Rows() {
    List<string> rows = new List<string>();
    Collect(rows, AF_INET);
    Collect(rows, AF_INET6);
    return rows.ToArray();
  }

  static void Collect(List<string> rows, int af) {
    int size = 0;
    GetExtendedTcpTable(IntPtr.Zero, ref size, false, af, OWNER_PID_ALL, 0);
    if (size <= 0) return;
    IntPtr buffer = Marshal.AllocHGlobal(size);
    try {
      if (GetExtendedTcpTable(buffer, ref size, false, af, OWNER_PID_ALL, 0) != 0) return;
      int count = Marshal.ReadInt32(buffer);
      IntPtr at = (IntPtr)((long)buffer + 4);
      int stride = Marshal.SizeOf(af == AF_INET ? typeof(Row4) : typeof(Row6));
      for (int i = 0; i < count && rows.Count < MAX_ROWS; i++) {
        rows.Add(af == AF_INET ? Format4(at) : Format6(at));
        at = (IntPtr)((long)at + stride);
      }
    } finally {
      Marshal.FreeHGlobal(buffer);
    }
  }

  static string Format4(IntPtr at) {
    Row4 row = (Row4)Marshal.PtrToStructure(at, typeof(Row4));
    return string.Format("4|{0}|{1}|{2}|{3}|{4}|{5}", row.state, new IPAddress((long)row.localAddr),
      Port(row.localPort), new IPAddress((long)row.remoteAddr), Port(row.remotePort), row.pid);
  }

  static string Format6(IntPtr at) {
    Row6 row = (Row6)Marshal.PtrToStructure(at, typeof(Row6));
    return string.Format("6|{0}|{1}|{2}|{3}|{4}|{5}", row.state, new IPAddress(row.localAddr),
      Port(row.localPort), new IPAddress(row.remoteAddr), Port(row.remotePort), row.pid);
  }
}
`

const script = (parentPid: number, pingHost: string): string => `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
$parent = ${parentPid}
$tcpSource = @'${TCP_TABLE_SOURCE}'@
$pinger = New-Object System.Net.NetworkInformation.Ping
$tick = 0
$tcpMode = 'managed'

function TcpRows {
  if ($tcpMode -eq 'pinvoke') { return [ElecdexTcpTable]::Rows() }
  # Without the P/Invoke: the same rows, with 0 for every owner. .NET numbers
  # TcpState exactly as MIB_TCP_STATE does, so the state needs no translation.
  $out = New-Object System.Collections.ArrayList
  foreach ($c in [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpConnections()) {
    $l = $c.LocalEndPoint
    $r = $c.RemoteEndPoint
    $fam = 4
    if ($r.AddressFamily -eq 'InterNetworkV6') { $fam = 6 }
    [void]$out.Add(('{0}|{1}|{2}|{3}|{4}|{5}|0' -f $fam, [int]$c.State, $l.Address, $l.Port, $r.Address, $r.Port))
  }
  return $out.ToArray()
}
# The owners of the listening sockets, read once per process and forgotten when
# it stops listening, so a pid Windows hands to a new process is read afresh.
$owners = @{}
function ListenOwners($rows) {
  if ($tcpMode -ne 'pinvoke') { return @() }
  $seen = @{}
  foreach ($r in $rows) {
    $f = $r.Split('|')
    if ($f[1] -ne '2') { continue }
    $id = [int]$f[6]
    if ($id -le 4 -or $seen.ContainsKey($id)) { continue }
    $seen[$id] = $true
    if (-not $owners.ContainsKey($id)) {
      $o = [ElecdexTcpTable]::Owner($id)
      $owners[$id] = @{ p = $id; e = $o[0]; c = $o[1] }
    }
  }
  foreach ($k in @($owners.Keys)) { if (-not $seen.ContainsKey($k)) { $owners.Remove($k) } }
  return @($owners.Values)
}
function EmitTcp {
  $rows = @(TcpRows)
  Emit 'tcp' $rows
  Emit 'lsnr' @(ListenOwners $rows)
}
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

    EmitTcp

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
      Add-Type -TypeDefinition $tcpSource
      $null = [ElecdexTcpTable]::Rows()
      $tcpMode = 'pinvoke'
    } catch { $tcpMode = 'managed' }
    # Straight away, rather than waiting for tick 5: the owners are the point.
    EmitTcp

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
  private listeners: RawListener[] = []
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

  /** Remote addresses of established TCP connections, for the globe. */
  async tcpRemotes(): Promise<string[]> {
    await this.until(() => this.tcp !== null)
    return establishedRemotes(this.tcp ?? [])
  }

  /**
   * The whole socket table, with the process names from the reading taken on the
   * same tick: the connections pane wants the owner of every row, and the
   * sampler already knows what each pid is called.
   */
  async tcpSockets(): Promise<{
    rows: string[]
    names: Map<number, string>
    listeners: RawListener[]
  }> {
    await this.until(() => this.tcp !== null)
    const names = new Map<number, string>()
    for (const process of this.procCurrent?.data ?? []) names.set(process.id, process.n)
    return { rows: this.tcp ?? [], names, listeners: this.listeners }
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
        this.tcp = parsed.rows
        break
      case 'lsnr':
        this.listeners = parsed.data
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
