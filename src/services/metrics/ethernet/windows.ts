import type {
  Duplex,
  EtherBus,
  EtherCounters,
  EtherLink,
  EtherRoute,
  EtherSettings,
  EtherState,
  NetEthernet,
  PowerKey,
} from '@shared/ethernet'
import type { PathInternet, PathProbe } from '@shared/netpath'
import { rate } from '../wifi/windows.js'

/**
 * Ethernet on Windows, read inside the long-lived sampler (windows-sampler.ts),
 * as the sampler's `ether` kind, every second while the pane is seen.
 *
 *  - Every second: IP Helper's GetIfTable2 (no process, no WMI): state, speeds,
 *    and the counters - frames, damaged frames, discards, broadcast bytes. Only
 *    physical wired adapters: type 6 (ethernetCsmacd), medium 14 (802.3), the
 *    HardwareInterface flag set and FilterInterface clear. On this machine that
 *    keeps one row of the nineteen .NET calls Ethernet (decisions.md).
 *  - When the adapters change and every ten seconds: the addresses (the Wi-Fi
 *    script's NicInfo), the connection profile's way out, and which interface
 *    carries the route to the echo host (GetBestInterface).
 *  - When an adapter first appears and whenever its link comes up: the duplex,
 *    the bus, the driver and the advanced properties, in a runspace of their own:
 *    Get-NetAdapter's first call took 1.4 s here, which would hold the sampler's
 *    loop - and every pane's readings with it - for a second and more.
 *
 * Nothing is changed, and only the fields named below leave the script: never the
 * interface GUID (used inside only, to match the profile and the addresses), the
 * vendor and device ids, the DNS suffix, the DHCP server or a profile's name.
 *
 * The C# also echoes each adapter's gateway from that adapter's own address
 * (IcmpSendEcho2Ex), for the Wi-Fi pane as well: .NET's Ping cannot choose a
 * source, so with Wi-Fi and a cable on the same router, both gateways' echoes
 * went out by whichever route was preferred and were counted for both.
 */

/**
 * The C# compiled once, the first time the echo round or the cable is wanted.
 *
 * MIB_IF_ROW2 is 1352 bytes on 64-bit Windows; the offsets are those of
 * netioapi.h, and were checked on this machine against .NET's own figures (the
 * Wi-Fi adapter's speed, bytes and non-unicast frames agreed). The flags byte is
 * InterfaceAndOperStatusFlags: 1 HardwareInterface, 2 FilterInterface,
 * 4 ConnectorPresent, 8 NotAuthenticated, 16 NotMediaConnected.
 *
 * ICMP_ECHO_REPLY's status is at 4 and its round trip, in ms, at 8. It reaches
 * the sampler in its environment (ETHER_SOURCE_ENV).
 */
export const ETHER_SOURCE = `
using System;
using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

public class ElecdexEther {
  [DllImport("iphlpapi.dll")] static extern int GetIfTable2(out IntPtr table);
  [DllImport("iphlpapi.dll")] static extern void FreeMibTable(IntPtr table);
  [DllImport("iphlpapi.dll")] static extern int GetBestInterface(uint destination, out uint index);
  [DllImport("iphlpapi.dll", SetLastError = true)] static extern IntPtr IcmpCreateFile();
  [DllImport("iphlpapi.dll")] static extern bool IcmpCloseHandle(IntPtr handle);
  [DllImport("iphlpapi.dll", SetLastError = true)]
  static extern uint IcmpSendEcho2Ex(IntPtr handle, IntPtr evt, IntPtr apc, IntPtr ctx, uint source, uint destination, byte[] data, ushort size, IntPtr options, IntPtr reply, uint replySize, uint timeout);

  const int ROW = 1352;

  static uint Addr(string s) { return BitConverter.ToUInt32(IPAddress.Parse(s).GetAddressBytes(), 0); }

  static IntPtr Table(out int count) {
    IntPtr table;
    count = 0;
    if (GetIfTable2(out table) != 0) return IntPtr.Zero;
    count = Marshal.ReadInt32(table);
    return table;
  }

  static IntPtr RowAt(IntPtr table, int i) { return (IntPtr)((long)table + 8 + (long)i * ROW); }

  static bool Wired(IntPtr r) {
    int flags = Marshal.ReadByte(r, 1152);
    return Marshal.ReadInt32(r, 1128) == 6 && Marshal.ReadInt32(r, 1140) == 14 && (flags & 1) == 1 && (flags & 2) == 0;
  }

  public static Hashtable[] Rows() {
    int count;
    IntPtr table = Table(out count);
    List<Hashtable> rows = new List<Hashtable>();
    if (table == IntPtr.Zero) return rows.ToArray();
    try {
      for (int i = 0; i < count && rows.Count < 8; i++) {
        IntPtr r = RowAt(table, i);
        if (!Wired(r)) continue;
        Hashtable row = new Hashtable();
        row["i"] = Marshal.ReadInt32(r, 8);
        row["g"] = ((Guid)Marshal.PtrToStructure((IntPtr)((long)r + 12), typeof(Guid))).ToString();
        row["a"] = Marshal.PtrToStringUni((IntPtr)((long)r + 28));
        row["d"] = Marshal.PtrToStringUni((IntPtr)((long)r + 542));
        row["na"] = (Marshal.ReadByte(r, 1152) & 8) != 0;
        row["o"] = Marshal.ReadInt32(r, 1156);
        row["ad"] = Marshal.ReadInt32(r, 1160);
        row["m"] = Marshal.ReadInt32(r, 1164);
        row["ts"] = Marshal.ReadInt64(r, 1192);
        row["rs"] = Marshal.ReadInt64(r, 1200);
        Hashtable c = new Hashtable();
        c["io"] = Marshal.ReadInt64(r, 1208);
        c["iu"] = Marshal.ReadInt64(r, 1216);
        c["inu"] = Marshal.ReadInt64(r, 1224);
        c["id"] = Marshal.ReadInt64(r, 1232);
        c["ie"] = Marshal.ReadInt64(r, 1240);
        c["iun"] = Marshal.ReadInt64(r, 1248);
        c["ibo"] = Marshal.ReadInt64(r, 1272);
        c["oo"] = Marshal.ReadInt64(r, 1280);
        c["ou"] = Marshal.ReadInt64(r, 1288);
        c["onu"] = Marshal.ReadInt64(r, 1296);
        c["od"] = Marshal.ReadInt64(r, 1304);
        c["oe"] = Marshal.ReadInt64(r, 1312);
        row["c"] = c;
        rows.Add(row);
      }
    } finally {
      FreeMibTable(table);
    }
    return rows.ToArray();
  }

  // The interface the route to a host leaves by, and what kind it is: wifi (type 71),
  // wired (a physical 802.3 adapter), or virtual (a VPN, a tunnel, a virtual switch).
  public static Hashtable Route(string target) {
    Hashtable route = new Hashtable();
    uint index;
    if (GetBestInterface(Addr(target), out index) != 0) return route;
    route["i"] = (int)index;
    int count;
    IntPtr table = Table(out count);
    if (table == IntPtr.Zero) return route;
    try {
      for (int i = 0; i < count; i++) {
        IntPtr r = RowAt(table, i);
        if (Marshal.ReadInt32(r, 8) != (int)index) continue;
        int type = Marshal.ReadInt32(r, 1128);
        bool hardware = (Marshal.ReadByte(r, 1152) & 1) == 1;
        route["k"] = type == 71 ? "wifi" : (hardware && type == 6 ? "wired" : "virtual");
        break;
      }
    } finally {
      FreeMibTable(table);
    }
    return route;
  }

  static object One(string source, string target, int timeout) {
    IntPtr handle = IcmpCreateFile();
    if (handle == new IntPtr(-1)) return null;
    IntPtr reply = Marshal.AllocHGlobal(256);
    try {
      byte[] data = new byte[32];
      uint n = IcmpSendEcho2Ex(handle, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, Addr(source), Addr(target), data, (ushort)data.Length, IntPtr.Zero, reply, 256, (uint)timeout);
      if (n == 0 || Marshal.ReadInt32(reply, 4) != 0) return null;
      return Marshal.ReadInt32(reply, 8);
    } catch {
      return null;
    } finally {
      Marshal.FreeHGlobal(reply);
      IcmpCloseHandle(handle);
    }
  }

  // Each gateway echoed from its own adapter's address, all at once; null for one lost.
  public static object[] Echo(string[] sources, string[] targets, int timeout) {
    Task<object>[] tasks = new Task<object>[targets.Length];
    for (int i = 0; i < targets.Length; i++) {
      string source = sources[i];
      string target = targets[i];
      tasks[i] = Task.Run(() => One(source, target, timeout));
    }
    try { Task.WaitAll(tasks, timeout + 300); } catch {}
    object[] results = new object[targets.Length];
    for (int i = 0; i < tasks.Length; i++) results[i] = tasks[i].IsCompleted ? tasks[i].Result : null;
    return results;
  }
}
`

/** The advanced properties read, by their registry keyword: the same name in every driver and language. */
export const ADVANCED_KEYWORDS = [
  '*SpeedDuplex',
  '*EEE',
  '*FlowControl',
  '*JumboPacket',
  '*WakeOnMagicPacket',
  'AdvancedEEE',
  'EnableGreenEthernet',
  'GigaLite',
  'PowerSavingMode',
  'AutoDisableGigabit',
  'ReduceSpeedOnPowerDown',
] as const

/**
 * NDIS's own word that a link went down, as it happens: the second-by-second
 * reading misses a link that drops and comes back inside a second (EEE's
 * interop trouble does that). WMI's `MSNdis_StatusMediaDisconnect` event, which
 * needs no administrator and no process, is counted per adapter from when the
 * pane began to watch; only the count leaves, keyed by the adapter's
 * description, and the watcher stops when the pane stops being seen. The event's
 * payload is not read (it was not seen with a cable on this machine, so its
 * layout is not trusted). Compiled apart from ElecdexEther, with a reference to
 * System.Management, so a machine where it fails loses only the count.
 */
export const ETHER_WATCH_SOURCE = `
using System;
using System.Collections.Concurrent;
using System.Management;

public class ElecdexEtherWatch {
  static ManagementEventWatcher watcher;
  static readonly ConcurrentDictionary<string, long> downs = new ConcurrentDictionary<string, long>();

  public static string Start() {
    if (watcher != null) return "";
    try {
      watcher = new ManagementEventWatcher(new ManagementScope("root\\\\wmi"), new WqlEventQuery("SELECT * FROM MSNdis_StatusMediaDisconnect"));
      watcher.EventArrived += (s, e) => {
        object name = e.NewEvent["InstanceName"];
        if (name != null) downs.AddOrUpdate(name.ToString(), 1, (k, v) => v + 1);
      };
      watcher.Start();
      return "";
    } catch (Exception e) {
      watcher = null;
      return e.Message;
    }
  }

  public static void Stop() {
    if (watcher == null) return;
    try { watcher.Stop(); watcher.Dispose(); } catch {}
    watcher = null;
    downs.Clear();
  }

  public static long Downs(string name) {
    long n;
    return name != null && downs.TryGetValue(name, out n) ? n : 0;
  }
}
`

/**
 * The C# and the runspace's script go to the sampler in its environment, not in
 * its script: on the command line as well, they took it past Windows' 32,767
 * characters (as the GPU's C# did before them).
 */
export const ETHER_SOURCE_ENV = 'ELECDEX_ETHER_SOURCE'
export const ETHER_INFO_ENV = 'ELECDEX_ETHER_INFO'
export const ETHER_WATCH_ENV = 'ELECDEX_ETHER_WATCH'
export const ETHER_SCRIPT_ENV = 'ELECDEX_ETHER_SCRIPT'

/**
 * What the runspace reads of each adapter it is given: only these fields, as
 * strings and numbers, never the device's ids (the bus is the first word of its
 * component id: PCI, USB).
 */
export const ETHER_INFO_SCRIPT = `
param($indexes, $keywords)
foreach ($i in $indexes) {
  $r = @{ i = $i }
  try {
    $a = Get-NetAdapter -InterfaceIndex $i -ErrorAction Stop
    $r.dup = [int]$a.MediaDuplexState
    $r.bus = ([string]$a.ComponentID -split '\\\\')[0]
    $r.drv = [string]$a.DriverProvider
    $r.dv = [string]$a.DriverVersion
    $r.dd = [string]$a.DriverDate
    $r.vlan = $a.VlanID
    $props = @{}
    foreach ($p in (Get-NetAdapterAdvancedProperty -InterfaceDescription $a.InterfaceDescription -ErrorAction SilentlyContinue)) {
      if ($keywords -notcontains $p.RegistryKeyword) { continue }
      $props[$p.RegistryKeyword] = @{ v = [string](@($p.RegistryValue) | Select-Object -First 1); o = @($p.ValidRegistryValues | ForEach-Object { [string]$_ }) }
    }
    $r.adv = $props
    $hw = Get-NetAdapterHardwareInfo -InterfaceDescription $a.InterfaceDescription -ErrorAction SilentlyContinue
    if ($hw) { $r.ps = [string]$hw.PcieLinkSpeed; $r.pw = [string]$hw.PcieLinkWidth }
  } catch {
    # An adapter pulled out (a USB one, a dock) can still be a row when its read starts: gone, not
    # a fault. Told by the error's category, as its message is in the user's language.
    if ($_.CategoryInfo.Category -eq 'ObjectNotFound') { $r.gone = $true } else { $r.err = [string]$_.Exception.Message }
  }
  $r
}
`

/**
 * The PowerShell the sampler runs for Ethernet: functions only, called from its
 * loop (EmitEther), and the gateways the echo round adds (EtherGateways). It too
 * goes in the environment (ETHER_SCRIPT_ENV), dot-sourced by `etherScript`, so
 * its functions and state live in the sampler's own scope.
 */
export const ETHER_SCRIPT = `
$etherSource = $env:${ETHER_SOURCE_ENV}
$etherInfoScript = $env:${ETHER_INFO_ENV}
$etherWatchSource = $env:${ETHER_WATCH_ENV}
$etherWatch = 'unset'
$etherWatching = $false
$etherErr = @()
$etherConflicts = @{}
$etherConflictLast = -1
$etherConflictTried = $false
$etherKeywords = @(${ADVANCED_KEYWORDS.map((k) => `'${k}'`).join(', ')})
$etherMode = 'unset'
$etherKey = ''
$etherAt = -100
$etherNic = @{}
$etherProfile = @{}
$etherRoute = @{}
$etherGws = @()
$etherInfo = @{}
$etherMedia = @{}
$etherGone = @{}
$etherAsk = @{}
$etherJob = $null

# What went wrong, said once each and sent with the next reading: the pane shows it, so a fault
# reaches whoever can report it rather than a console nobody reads.
function EtherProblem($what) {
  $m = ([string]$what).Trim()
  if ($m.Length -gt 300) { $m = $m.Substring(0, 300) }
  if ($m -and $script:etherErr -notcontains $m -and $script:etherErr.Count -lt 5) { $script:etherErr += $m }
}

function EtherReady {
  if ($script:etherMode -eq 'unset') {
    try { Add-Type -TypeDefinition $script:etherSource; $script:etherMode = 'ok' } catch {
      $script:etherMode = 'none'
      EtherProblem ('the wired reader did not compile: ' + $_.Exception.Message)
    }
  }
  return $script:etherMode -eq 'ok'
}

# NDIS's disconnect events, counted while the pane is seen (ETHER_WATCH_SOURCE).
function EtherWatchStart {
  if ($script:etherWatch -eq 'unset') {
    try { Add-Type -TypeDefinition $script:etherWatchSource -ReferencedAssemblies System.Management; $script:etherWatch = 'ok' } catch {
      $script:etherWatch = 'none'
      EtherProblem ('the link-event watcher did not compile: ' + $_.Exception.Message)
    }
  }
  if ($script:etherWatch -ne 'ok' -or $script:etherWatching) { return }
  $why = [ElecdexEtherWatch]::Start()
  if ($why) { $script:etherWatch = 'none'; EtherProblem ('NDIS link events are not available: ' + $why) } else { $script:etherWatching = $true }
}
# Stopped once when the pane stops being seen. A settings read under way is never stopped (that
# would hold the loop up): it is looked at each second and collected once it has ended.
function EtherWatchStop {
  if ($script:etherWatching) { [ElecdexEtherWatch]::Stop(); $script:etherWatching = $false }
  EtherInfoCollect
}

# Tcpip's address conflicts from the last day, then only newer: the time, and which of the wired
# addresses it was. Neither the other machine's hardware address nor the message leaves.
function EtherConflictStep($rows) {
  $script:etherConflictTried = $true
  $when = if ($script:etherConflictLast -lt 0) { 'TimeCreated[timediff(@SystemTime) <= 86400000]' } else { 'EventRecordID > ' + $script:etherConflictLast }
  try {
    $query = New-Object System.Diagnostics.Eventing.Reader.EventLogQuery('System', [System.Diagnostics.Eventing.Reader.PathType]::LogName, ("*[System[Provider[@Name='Tcpip'] and EventID=4199 and " + $when + ']]'))
    $reader = New-Object System.Diagnostics.Eventing.Reader.EventLogReader($query)
    for ($e = $reader.ReadEvent(); $null -ne $e; $e = $reader.ReadEvent()) {
      if ($e.RecordId -gt $script:etherConflictLast) { $script:etherConflictLast = $e.RecordId }
      $ip = @($e.Properties | ForEach-Object { [string]$_.Value } | Where-Object { $_ -match '^\\d{1,3}(\\.\\d{1,3}){3}$' -and $_ -ne '0.0.0.0' }) | Select-Object -First 1
      if ($ip) { $script:etherConflicts[[long]$e.RecordId] = @{ at = [long](($e.TimeCreated.ToUniversalTime() - [DateTime]'1970-01-01').TotalMilliseconds); ip = $ip } }
      $e.Dispose()
    }
    # Read once: from here on only newer records. A failed read stays at the last day.
    if ($script:etherConflictLast -lt 0) { $script:etherConflictLast = 0 }
  } catch { EtherProblem ('the address-conflict log could not be read: ' + $_.Exception.Message) } finally { if ($reader) { $reader.Dispose(); $reader = $null } }
  $cut = [long](([DateTime]::UtcNow - [DateTime]'1970-01-01').TotalMilliseconds) - 86400000
  foreach ($k in @($script:etherConflicts.Keys)) { if ($script:etherConflicts[$k].at -lt $cut) { $script:etherConflicts.Remove($k) } }
}

# The way out of every connection profile but Wi-Fi's, by adapter. Only the level leaves.
function EtherProfiles {
  $out = @{}
  try {
    if (-not $script:winrt) {
      $null = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]
      $script:winrt = $true
    }
    foreach ($p in [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()) {
      if ($p.IsWlanConnectionProfile -or $null -eq $p.NetworkAdapter) { continue }
      $out[$p.NetworkAdapter.NetworkAdapterId.ToString()] = $p.GetNetworkConnectivityLevel().ToString()
    }
  } catch {}
  return $out
}

function EtherNics($rows) {
  $script:etherNic = @{}
  $byId = @{}
  foreach ($a in [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) { $byId[$a.Id.Trim('{}').ToLower()] = $a }
  foreach ($r in $rows) {
    $a = $byId[$r['g']]
    if ($a) { $script:etherNic[$r['g']] = NicInfo $a }
  }
  $script:etherProfile = EtherProfiles
  $script:etherRoute = [ElecdexEther]::Route($script:etherPingHost)
}

# Adapters newly seen, or whose link just came up, are read again in the runspace: one at a time.
# One found gone is asked once more while it is still a row, then not until it has left the rows
# and come back (plugged in again).
function EtherInfoStep($rows) {
  EtherInfoCollect
  $seen = @($rows | ForEach-Object { [int]$_['i'] })
  foreach ($k in @($script:etherGone.Keys)) { if ($seen -notcontains $k) { $script:etherGone.Remove($k) } }
  $busy = if ($null -ne $script:etherJob) { $script:etherJob.ix } else { @() }
  foreach ($r in $rows) {
    $i = [int]$r['i']
    $up = $r['m'] -eq 1
    $unknown = -not $script:etherInfo.ContainsKey($i) -and $busy -notcontains $i -and $script:etherGone[$i] -lt 2
    if ($unknown -or ($up -and $script:etherMedia[$i] -ne 1)) { $script:etherAsk[$i] = $true }
    $script:etherMedia[$i] = $r['m']
  }
  if ($null -eq $script:etherJob -and $script:etherAsk.Count -gt 0) {
    $ps = [powershell]::Create()
    $ix = @($script:etherAsk.Keys)
    [void]$ps.AddScript($script:etherInfoScript).AddArgument($ix).AddArgument($script:etherKeywords)
    $script:etherJob = @{ ps = $ps; h = $ps.BeginInvoke(); ix = $ix }
    $script:etherAsk = @{}
  }
}

function EtherInfoCollect {
  if ($null -ne $script:etherJob -and $script:etherJob.h.IsCompleted) {
    try {
      foreach ($x in $script:etherJob.ps.EndInvoke($script:etherJob.h)) {
        $i = [int]$x['i']
        if ($x['gone']) { $script:etherInfo.Remove($i); $script:etherGone[$i] = 1 + $script:etherGone[$i]; continue }
        $script:etherGone.Remove($i)
        $script:etherInfo[$i] = $x
        if ($x['err']) { EtherProblem ('the settings of an adapter could not be read: ' + $x['err']) }
      }
    } catch { EtherProblem ('the settings of the adapters could not be read: ' + $_.Exception.Message) }
    $script:etherJob.ps.Dispose()
    $script:etherJob = $null
  }
}

function EmitEther {
  if (-not (EtherReady)) { Emit 'ether' @{ rows = @(); route = $null; err = @($script:etherErr) }; $script:etherErr = @(); return }
  EtherWatchStart
  $rows = @()
  try { $rows = @([ElecdexEther]::Rows()) } catch { EtherProblem ('the adapters could not be read: ' + $_.Exception.Message) }
  $key = ($rows | ForEach-Object { '{0}:{1}:{2}' -f $_['i'], $_['m'], $_['rs'] }) -join ','
  if ($key -ne $script:etherKey -or $script:tick - $script:etherAt -ge 10) {
    EtherNics $rows
    $script:etherKey = $key
    $script:etherAt = $script:tick
  }
  EtherInfoStep $rows
  # At once the first time, then on the five seconds: a read that fails is tried again then, not every second.
  if (-not $script:etherConflictTried -or $script:tick % 5 -eq 0) { EtherConflictStep }
  $script:etherGws = @()
  foreach ($r in $rows) {
    $g = $r['g']
    $n = $script:etherNic[$g]
    if ($n) { foreach ($k in $n.Keys) { $r[$k] = $n[$k] } }
    $r['lvl'] = $script:etherProfile[$g]
    $info = $script:etherInfo[[int]$r['i']]
    if ($info) { $r['inf'] = $info }
    if ($r['m'] -eq 1 -and $r['gw'] -and $r['ip4']) { $script:etherGws += @{ l = 'if' + $r['i']; a = $r['gw']; s = $r['ip4'] } }
    if ($script:etherWatch -eq 'ok') { $r['dn'] = [ElecdexEtherWatch]::Downs($r['d']) }
    $ip = $r['ip4']
    $r['cf'] = @($script:etherConflicts.Values | Where-Object { $ip -and $_.ip -eq $ip } | ForEach-Object { $_.at })
    # The GUID matched the profile and the addresses; it goes no further.
    $r.Remove('g')
  }
  Emit 'ether' @{ rows = $rows; route = $script:etherRoute; err = @($script:etherErr) }
  $script:etherErr = @()
}

function EtherGateways { return @($script:etherGws) }
`

/**
 * What the sampler's own script carries for Ethernet: the ping host (validated),
 * whose route says which adapter the internet's echo leaves by, and the line
 * that brings in ETHER_SCRIPT from the environment.
 */
export const etherScript = (pingHost: string): string => `
$etherPingHost = '${pingHost}'
. ([scriptblock]::Create($env:${ETHER_SCRIPT_ENV}))
`

// ---------------------------------------------------------------------------
// The script's lines, read back
// ---------------------------------------------------------------------------

export interface RawEtherCounters {
  io: number | null
  iu: number | null
  inu: number | null
  id: number | null
  ie: number | null
  iun: number | null
  ibo: number | null
  oo: number | null
  ou: number | null
  onu: number | null
  od: number | null
  oe: number | null
}

export interface RawEtherInfo {
  dup: number | null
  bus: string | null
  drv: string | null
  dv: string | null
  dd: string | null
  vlan: number | null
  /** Advanced properties by keyword: the value and the values the driver offers. */
  adv: Record<string, { v: string; o: string[] }>
  ps: string | null
  pw: string | null
}

/** One adapter as the script reports it; see ETHER_SOURCE and ETHER_SCRIPT. */
export interface RawEther {
  i: number
  a: string
  d: string
  na: boolean
  /** IF_OPER_STATUS: 1 up. */
  o: number
  /** NET_IF_ADMIN_STATUS: 1 up, 2 down. */
  ad: number
  /** NET_IF_MEDIA_CONNECT_STATE: 1 connected, 2 disconnected. */
  m: number
  /** Bits a second. */
  rs: number | null
  ts: number | null
  c: RawEtherCounters | null
  mac: string | null
  ip4: string | null
  pfx: number | null
  ip6: string[]
  gw: string | null
  dns: string[]
  mtu: number | null
  dhcp: boolean | null
  lease: number | null
  lvl: string | null
  inf: RawEtherInfo | null
  /** NDIS's disconnect events for this adapter since the pane began to watch; null without the watcher. */
  dn: number | null
  /** When Tcpip logged a conflict for this adapter's address, the last day, epoch ms. */
  cf: number[]
}

export interface RawEtherRoute {
  i: number | null
  k: string | null
}

export interface RawEtherLine {
  rows: RawEther[]
  route: RawEtherRoute | null
  /** What went wrong in the script since the last line, in its words. */
  err: string[]
}

type Row = Record<string, unknown>

const isRow = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}
const text = (v: unknown, max = 256): string | null =>
  typeof v === 'string' && v !== '' ? v.slice(0, max) : null
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v])
const texts = (v: unknown, max = 8, length = 64): string[] =>
  list(v)
    .map((x) => text(x, length))
    .filter((x): x is string => x !== null)
    .slice(0, max)

const COUNTER_KEYS = [
  'io',
  'iu',
  'inu',
  'id',
  'ie',
  'iun',
  'ibo',
  'oo',
  'ou',
  'onu',
  'od',
  'oe',
] as const

function counters(v: unknown): RawEtherCounters | null {
  if (!isRow(v)) return null
  const out = {} as RawEtherCounters
  for (const k of COUNTER_KEYS) out[k] = num(v[k])
  return out
}

function advanced(v: unknown): RawEtherInfo['adv'] {
  const out: RawEtherInfo['adv'] = {}
  if (!isRow(v)) return out
  for (const keyword of ADVANCED_KEYWORDS) {
    const p = v[keyword]
    if (!isRow(p)) continue
    out[keyword] = { v: text(p.v, 32) ?? '', o: texts(p.o, 24) }
  }
  return out
}

function info(v: unknown): RawEtherInfo | null {
  if (!isRow(v)) return null
  return {
    dup: num(v.dup),
    bus: text(v.bus, 16),
    drv: text(v.drv, 64),
    dv: text(v.dv, 32),
    dd: text(v.dd, 32),
    vlan: num(v.vlan),
    adv: advanced(v.adv),
    ps: text(v.ps, 32),
    pw: text(v.pw, 16),
  }
}

export function parseEtherLine(data: unknown): RawEtherLine {
  const d = isRow(data) ? data : {}
  const rows = list(d.rows)
    .filter(isRow)
    .slice(0, 8)
    .map((r) => ({
      i: num(r.i) ?? -1,
      a: text(r.a, 128) ?? '',
      d: text(r.d) ?? '',
      na: r.na === true,
      o: num(r.o) ?? 0,
      ad: num(r.ad) ?? 0,
      m: num(r.m) ?? 0,
      rs: num(r.rs),
      ts: num(r.ts),
      c: counters(r.c),
      mac: text(r.mac, 64),
      ip4: text(r.ip4, 64),
      pfx: num(r.pfx),
      ip6: texts(r.ip6),
      gw: text(r.gw, 64),
      dns: texts(r.dns),
      mtu: num(r.mtu),
      dhcp: typeof r.dhcp === 'boolean' ? r.dhcp : null,
      lease: num(r.lease),
      lvl: text(r.lvl, 64),
      inf: info(r.inf),
      dn: num(r.dn),
      cf: list(r.cf)
        .map(num)
        .filter((at): at is number => at !== null && at > 0)
        .slice(-50),
    }))
    .filter((r) => r.i >= 0)
  const route = isRow(d.route) ? { i: num(d.route.i), k: text(d.route.k, 16) } : null
  return { rows, route, err: texts(d.err, 5, 300) }
}

// ---------------------------------------------------------------------------
// Pure conversion to what the pane reads
// ---------------------------------------------------------------------------

/** NDIS's standard *SpeedDuplex values: a fixed speed (Mb/s) and duplex; 0 is auto. */
const SPEED_DUPLEX: Record<string, [number, Duplex]> = {
  '1': [10, 'half'],
  '2': [10, 'full'],
  '3': [100, 'half'],
  '4': [100, 'full'],
  '5': [1000, 'half'],
  '6': [1000, 'full'],
  '7': [10_000, 'full'],
  '8': [20_000, 'full'],
  '9': [40_000, 'full'],
  '10': [100_000, 'full'],
}

/**
 * A *SpeedDuplex value. 0 to 10 are NDIS's own (10 Mb/s half to 100 Gb/s full);
 * anything from 1,000 up is the speed itself in Mb/s, full duplex - how a driver
 * offers 2.5 and 5 Gb/s, which have no number of their own (Microsoft's
 * "Enumeration Keywords", checked 2026-10-18). Anything else is a vendor's
 * private value: ignored, never guessed, and the adapter's best is then the best
 * of the values it knows. Not yet seen on a 2.5 or 5 Gb/s adapter (README).
 */
export function speedDuplexOf(value: string): [number, Duplex] | null {
  const known = SPEED_DUPLEX[value]
  if (known !== undefined) return known
  const n = Number(value)
  return Number.isInteger(n) && n >= 1000 ? [n, 'full'] : null
}

/** The power-saving keywords and what each does, on or off by its value. */
const POWER_KEYWORDS: Record<string, PowerKey> = {
  '*EEE': 'eee',
  AdvancedEEE: 'advancedEee',
  EnableGreenEthernet: 'green',
  GigaLite: 'gigaLite',
  PowerSavingMode: 'powerSave',
  AutoDisableGigabit: 'autoDisableGigabit',
  ReduceSpeedOnPowerDown: 'reduceSpeed',
}

function powerOf(adv: RawEtherInfo['adv']): Partial<Record<PowerKey, boolean>> {
  const power: Partial<Record<PowerKey, boolean>> = {}
  for (const [keyword, key] of Object.entries(POWER_KEYWORDS)) {
    const p = adv[keyword]
    if (p !== undefined) power[key] = p.v !== '' && p.v !== '0'
  }
  return power
}

/** An on/off property: null where the driver has none. */
const switched = (p: { v: string } | undefined): boolean | null =>
  p === undefined ? null : p.v !== '0'

/** The driver's settings as the pane reads them, from the advanced properties. */
export function settingsOf(inf: RawEtherInfo | null): EtherSettings | null {
  if (inf === null || Object.keys(inf.adv).length === 0) return null
  const adv = inf.adv
  const sd = adv['*SpeedDuplex']
  const fixed = sd === undefined ? null : speedDuplexOf(sd.v)
  const offered = (sd?.o ?? []).map(speedDuplexOf).filter((x): x is [number, Duplex] => x !== null)
  const jumbo = num(adv['*JumboPacket']?.v)
  return {
    speed: fixed?.[0] ?? null,
    duplex: fixed?.[1] ?? null,
    capMbps: offered.length === 0 ? null : Math.max(...offered.map((x) => x[0])),
    power: powerOf(adv),
    // 1514 (or less) is the standard frame: jumbo frames off.
    jumbo: jumbo === null ? null : jumbo > 1514 ? jumbo : 0,
    flow: switched(adv['*FlowControl']),
    vlan: inf.vlan !== null && inf.vlan > 0 ? inf.vlan : null,
    wol: switched(adv['*WakeOnMagicPacket']),
  }
}

/** NetAdapter's MediaDuplexState: 1 half, 2 full, anything else not known - never taken for half. */
export function duplexOf(value: number | null): Duplex | null {
  if (value === 1) return 'half'
  if (value === 2) return 'full'
  return null
}

export function busOf(inf: RawEtherInfo | null): { bus: EtherBus | null; detail: string | null } {
  const word = inf?.bus?.toUpperCase() ?? null
  if (word === null) return { bus: null, detail: null }
  if (word.startsWith('USB')) return { bus: 'usb', detail: 'USB' }
  if (word.startsWith('PCI')) {
    const pcie = inf?.ps && inf.pw ? `PCIe ${inf.ps} x${inf.pw}` : 'PCIe'
    return { bus: 'pci', detail: pcie }
  }
  return { bus: 'other', detail: word }
}

export function etherStateOf(row: Pick<RawEther, 'ad' | 'm' | 'o'>): EtherState {
  if (row.ad === 2) return 'disabled'
  return row.m === 1 && row.o === 1 ? 'up' : 'no-carrier'
}

const LEVELS: Record<string, PathInternet> = {
  InternetAccess: 'internet',
  ConstrainedInternetAccess: 'constrained',
  LocalAccess: 'local',
  None: 'none',
}

export function routeOf(index: number, route: RawEtherRoute | null): EtherRoute | null {
  if (route === null || route.i === null) return null
  if (route.i === index) return 'default'
  if (route.k === 'wifi') return 'wifi'
  if (route.k === 'wired') return 'other'
  return 'vpn'
}

function countersOf(c: RawEtherCounters | null): EtherCounters | null {
  if (c === null) return null
  return {
    rxPackets: c.iu === null || c.inu === null ? null : c.iu + c.inu,
    txPackets: c.ou === null || c.onu === null ? null : c.ou + c.onu,
    rxNonUnicast: c.inu,
    rxBroadcastOctets: c.ibo,
    rxMulticast: null,
    rxErrors: c.ie,
    txErrors: c.oe,
    rxDiscards: c.id,
    txDiscards: c.od,
    rxUnknown: c.iun,
    collisions: null,
  }
}

/** "2024-03-12" from whatever date text the driver gives; the text cut short otherwise. */
function driverWords(inf: RawEtherInfo | null): string | null {
  if (inf === null || (inf.drv === null && inf.dv === null)) return null
  const date = inf.dd?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? inf.dd
  return [inf.drv, inf.dv, date].filter(Boolean).join(' · ')
}

type AddressPart = Pick<
  EtherLink,
  'ip4' | 'prefix4' | 'ip6' | 'gateway' | 'dns' | 'mtu' | 'dhcp' | 'leaseSeconds' | 'mac'
>

/** The addresses, only while the link is up: a port with no cable has none worth showing. */
function addressPart(row: RawEther, up: boolean): AddressPart {
  const always = { mac: row.mac, mtu: row.mtu, dhcp: row.dhcp }
  if (!up)
    return {
      ...always,
      ip4: null,
      prefix4: null,
      ip6: [],
      gateway: null,
      dns: [],
      leaseSeconds: null,
    }
  return {
    ...always,
    ip4: row.ip4,
    prefix4: row.pfx,
    ip6: row.ip6,
    gateway: row.gw,
    dns: row.dns,
    // .NET answers with the maximum when the address is not from DHCP.
    leaseSeconds:
      row.dhcp === true && row.lease !== null && row.lease < 0xffffffff ? row.lease : null,
  }
}

/** What only a link that is up has: its speed, duplex, 802.1X state and way out. */
function upPart(
  row: RawEther,
  route: RawEtherRoute | null,
): Pick<EtherLink, 'speedMbps' | 'duplex' | 'authenticated' | 'route'> {
  return {
    speedMbps: row.rs !== null && row.rs > 0 ? Math.round(row.rs / 1e6) : null,
    duplex: duplexOf(row.inf?.dup ?? null),
    authenticated: !row.na,
    route: routeOf(row.i, route),
  }
}

const DOWN = { speedMbps: null, duplex: null, authenticated: null, route: null } as const

export function toEtherLink(
  row: RawEther,
  previous: RawEther | undefined,
  seconds: number,
  route: RawEtherRoute | null,
): EtherLink {
  const state = etherStateOf(row)
  const up = state === 'up'
  const { bus, detail } = busOf(row.inf)
  return {
    id: `if${row.i}`,
    adapter: row.d,
    alias: row.a === '' ? null : row.a,
    bus,
    busDetail: detail,
    usbMbps: null,
    driver: driverWords(row.inf),
    state,
    ...(up ? upPart(row, route) : DOWN),
    settings: settingsOf(row.inf),
    internet: row.lvl === null ? null : (LEVELS[row.lvl] ?? null),
    ...addressPart(row, up),
    rxSec: rate(row.c?.io ?? null, previous?.c?.io, seconds),
    txSec: rate(row.c?.oo ?? null, previous?.c?.oo, seconds),
    counters: countersOf(row.c),
    // NDIS's disconnect events: a drop inside a second, between two readings, is counted too.
    carrierDowns: row.dn,
    conflicts: row.cf,
  }
}

export function toNetEthernet(
  previous: { at: number; data: RawEtherLine } | null,
  current: { at: number; data: RawEtherLine },
  probe: PathProbe | null,
): NetEthernet {
  const seconds = previous === null ? 0 : (current.at - previous.at) / 1000
  const links = current.data.rows.map((row) =>
    toEtherLink(
      row,
      previous?.data.rows.find((p) => p.i === row.i),
      seconds,
      current.data.route,
    ),
  )
  return { links, probe, limits: ['no-log'], problems: current.data.err }
}
