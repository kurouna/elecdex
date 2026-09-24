import {
  cipherLabel,
  type NetWifi,
  securityLabel,
  standardOfPhy,
  type WifiCounters,
  type WifiEvent,
  type WifiEventKind,
  type WifiInternet,
  type WifiLink,
  type WifiProbe,
  type WifiState,
} from '@shared/wifi'

/**
 * Wi-Fi on Windows, read inside the long-lived sampler (windows-sampler.ts).
 *
 * Three readings, each a sampler kind:
 *
 *  - `wlan`, every second: the Native Wifi API (wlanapi.dll) for the radio -
 *    signal, channel, the negotiated rates and the frame counters - and, when
 *    the connection changes and every ten seconds, the WinRT connection profile
 *    for the name, the security and the way out, and .NET for the addresses.
 *  - `probe`, every second: one echo to the gateway and one to the host the
 *    network status pane pings - the same echo serves that pane's reading.
 *  - `wlanlog`, every five seconds: the WLAN-AutoConfig event log's
 *    connections, failures and disconnections with their reasons.
 *
 * **Nothing here is behind the location consent**, and nothing may be: since
 * Windows 11 24H2, WlanGetNetworkBssList, WlanGetAvailableNetworkList, WlanScan
 * and WlanQueryInterface's `current_connection` (opcode 7) need the user's
 * precise location, and asking for it is what elecdex never does (CLAUDE.md, No
 * location prompts; netsh wlan is the same thing behind a process). The name
 * comes from WlanConnectionProfileDetails.GetConnectedSsid, which Microsoft
 * points to for exactly this. The event log names the access point (BSSID) as
 * well: only the fields read below leave the script. A unit test holds the
 * script to all of this (wifi-windows.test.ts).
 */

/**
 * The C# compiled once, the first time Wi-Fi is wanted (about a second, like
 * the socket table's). Its opcodes are WLAN_INTF_OPCODE values; offsets are
 * those of the structures in wlanapi.h on 64-bit Windows.
 *
 * WLAN_REALTIME_CONNECTION_QUALITY (opcode 19, Windows 11 24H2 and later):
 * phy type, link quality, rx and tx rate in kbit/s, an MLO flag and the number
 * of links, then per link (272 bytes) its id, centre frequency in MHz,
 * bandwidth, RSSI and rate set. An older Windows answers an error, and the
 * rates and frequency are simply not there.
 *
 * WLAN_STATISTICS: two ULONGLONGs of 4-way handshake and TKIP failures, one
 * reserved, the unicast and multicast MAC counters (12 ULONGLONGs each), the
 * number of PHYs at 216, and from 224 one WLAN_PHY_FRAME_STATISTICS (18
 * ULONGLONGs, 144 bytes) per PHY. The larger of each counter is taken, not
 * the sum: the Intel AX211 repeats the interface's counters on all six of its
 * PHYs, and a driver that keeps them apart counts on the one in use.
 *
 * It goes into a single-quoted here-string, so it must contain no line
 * beginning with the terminator.
 */
export const WLAN_SOURCE = `
using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class ElecdexWlan {
  [DllImport("wlanapi.dll")]
  static extern int WlanOpenHandle(uint version, IntPtr reserved, out uint negotiated, out IntPtr handle);
  [DllImport("wlanapi.dll")]
  static extern int WlanEnumInterfaces(IntPtr handle, IntPtr reserved, out IntPtr list);
  [DllImport("wlanapi.dll")]
  static extern int WlanQueryInterface(IntPtr handle, ref Guid iface, int opcode, IntPtr reserved, out int size, out IntPtr data, IntPtr type);
  [DllImport("wlanapi.dll")]
  static extern void WlanFreeMemory(IntPtr memory);

  const int OP_BACKGROUND_SCAN = 2;
  const int OP_MEDIA_STREAMING = 3;
  const int OP_RADIO_STATE = 4;
  const int OP_CHANNEL_NUMBER = 8;
  const int OP_REALTIME_QUALITY = 19;
  const int OP_STATISTICS = 0x10000101;
  const int OP_RSSI = 0x10000102;

  const int INFO_SIZE = 532;
  const int LINK_SIZE = 272;
  const int PHY_SIZE = 144;

  static IntPtr handle = IntPtr.Zero;

  public static Hashtable[] Read() {
    if (handle == IntPtr.Zero) {
      uint negotiated;
      if (WlanOpenHandle(2, IntPtr.Zero, out negotiated, out handle) != 0) {
        handle = IntPtr.Zero;
        return new Hashtable[0];
      }
    }
    IntPtr list;
    if (WlanEnumInterfaces(handle, IntPtr.Zero, out list) != 0) return new Hashtable[0];
    List<Hashtable> rows = new List<Hashtable>();
    try {
      int count = Marshal.ReadInt32(list);
      for (int i = 0; i < count && i < 8; i++) {
        IntPtr at = (IntPtr)((long)list + 8 + i * INFO_SIZE);
        Guid id = (Guid)Marshal.PtrToStructure(at, typeof(Guid));
        Hashtable row = new Hashtable();
        row["g"] = id.ToString();
        row["d"] = Marshal.PtrToStringUni((IntPtr)((long)at + 16));
        row["s"] = Marshal.ReadInt32((IntPtr)((long)at + 528));
        Fill(id, row);
        rows.Add(row);
      }
    } finally {
      WlanFreeMemory(list);
    }
    return rows.ToArray();
  }

  static IntPtr Query(Guid id, int opcode, out int size) {
    IntPtr data;
    if (WlanQueryInterface(handle, ref id, opcode, IntPtr.Zero, out size, out data, IntPtr.Zero) != 0) {
      size = 0;
      return IntPtr.Zero;
    }
    return data;
  }

  static object Int(Guid id, int opcode) {
    int size;
    IntPtr data = Query(id, opcode, out size);
    if (data == IntPtr.Zero) return null;
    try {
      return size >= 4 ? (object)Marshal.ReadInt32(data) : null;
    } finally {
      WlanFreeMemory(data);
    }
  }

  static void Fill(Guid id, Hashtable row) {
    row["bg"] = Int(id, OP_BACKGROUND_SCAN);
    row["ms"] = Int(id, OP_MEDIA_STREAMING);
    row["ch"] = Int(id, OP_CHANNEL_NUMBER);
    row["rssi"] = Int(id, OP_RSSI);
    row["radio"] = Radio(id);
    Quality(id, row);
    Statistics(id, row);
  }

  // 1 when any PHY is on in both software and hardware, 0 when none is.
  static object Radio(Guid id) {
    int size;
    IntPtr data = Query(id, OP_RADIO_STATE, out size);
    if (data == IntPtr.Zero) return null;
    try {
      int phys = Marshal.ReadInt32(data);
      bool on = false;
      for (int i = 0; i < phys && i < 64 && 4 + (i + 1) * 12 <= size; i++) {
        int software = Marshal.ReadInt32(data, 4 + i * 12 + 4);
        int hardware = Marshal.ReadInt32(data, 4 + i * 12 + 8);
        if (software == 1 && hardware == 1) on = true;
      }
      return phys == 0 ? null : (object)(on ? 1 : 0);
    } finally {
      WlanFreeMemory(data);
    }
  }

  static void Quality(Guid id, Hashtable row) {
    int size;
    IntPtr data = Query(id, OP_REALTIME_QUALITY, out size);
    if (data == IntPtr.Zero) return;
    try {
      if (size < 24) return;
      row["phy"] = Marshal.ReadInt32(data, 0);
      row["q"] = Marshal.ReadInt32(data, 4);
      row["rx"] = Marshal.ReadInt32(data, 8);
      row["tx"] = Marshal.ReadInt32(data, 12);
      row["mlo"] = Marshal.ReadInt32(data, 16);
      int count = Marshal.ReadInt32(data, 20);
      List<Hashtable> links = new List<Hashtable>();
      for (int i = 0; i < count && i < 8 && 24 + (i + 1) * LINK_SIZE <= size; i++) {
        int at = 24 + i * LINK_SIZE;
        Hashtable link = new Hashtable();
        link["f"] = Marshal.ReadInt32(data, at + 4);
        link["w"] = Marshal.ReadInt32(data, at + 8);
        link["r"] = Marshal.ReadInt32(data, at + 12);
        links.Add(link);
      }
      row["links"] = links.ToArray();
    } finally {
      WlanFreeMemory(data);
    }
  }

  static void Statistics(Guid id, Hashtable row) {
    int size;
    IntPtr data = Query(id, OP_STATISTICS, out size);
    if (data == IntPtr.Zero) return;
    try {
      if (size < 224) return;
      int phys = Marshal.ReadInt32(data, 216);
      long[] sum = new long[18];
      for (int p = 0; p < phys && 224 + (p + 1) * PHY_SIZE <= size; p++) {
        for (int k = 0; k < 18; k++) sum[k] = Math.Max(sum[k], Marshal.ReadInt64(data, 224 + p * PHY_SIZE + k * 8));
      }
      Hashtable c = new Hashtable();
      c["tx"] = sum[0];
      c["failed"] = sum[2];
      c["retry"] = sum[3];
      c["multi"] = sum[4];
      c["ack"] = sum[9];
      c["rx"] = sum[10];
      c["fcs"] = sum[17];
      c["decrypt"] = Marshal.ReadInt64(data, 24 + 11 * 8);
      c["hs"] = Marshal.ReadInt64(data, 0);
      row["c"] = c;
    } finally {
      WlanFreeMemory(data);
    }
  }
}
`

/**
 * The PowerShell the sampler runs for Wi-Fi: functions only, called from its
 * loop. The WinRT type is loaded the first time a profile is read.
 */
export const WLAN_SCRIPT = `
$wlanSource = @'${WLAN_SOURCE}'@
$wlanMode = 'unset'
$winrt = $false
$profiles = @{}
$profilesAt = -100
$wlanKey = ''
$logLast = -1
$gwPinger = New-Object System.Net.NetworkInformation.Ping

function WlanProfiles {
  $out = @{}
  try {
    if (-not $script:winrt) {
      $null = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]
      $script:winrt = $true
    }
    foreach ($p in [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()) {
      if (-not $p.IsWlanConnectionProfile) { continue }
      $ssid = $p.WlanConnectionProfileDetails.GetConnectedSsid()
      if (-not $ssid) { continue }
      $sec = $p.NetworkSecuritySettings
      $out[$p.NetworkAdapter.NetworkAdapterId.ToString()] = @{
        ssid = $ssid
        auth = $sec.NetworkAuthenticationType.ToString()
        cipher = $sec.NetworkEncryptionType.ToString()
        level = $p.GetNetworkConnectivityLevel().ToString()
        cost = $p.GetConnectionCost().NetworkCostType.ToString()
      }
    }
  } catch {}
  return $out
}

# What .NET says of a wireless interface's addresses: read when the connection
# changes and every ten seconds, not every tick - walking the interfaces through
# PowerShell's pipeline each second cost more than the rest of the reading.
function NicInfo($a) {
  $props = $a.GetIPProperties()
  $v4 = $props.UnicastAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' } | Select-Object -First 1
  $v6 = @($props.UnicastAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetworkV6' -and -not $_.Address.IsIPv6LinkLocal } | ForEach-Object { $_.Address.ToString() })
  $gw = $props.GatewayAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' -and $_.Address.ToString() -ne '0.0.0.0' } | Select-Object -First 1
  $mtu = $null; $dhcp = $null; $lease = $null
  try { $p4 = $props.GetIPv4Properties(); $mtu = $p4.Mtu; $dhcp = $p4.IsDhcpEnabled } catch {}
  if ($v4) { try { $lease = $v4.DhcpLeaseLifetime } catch {} }
  return @{
    mac = ($a.GetPhysicalAddress().ToString() -replace '(..)(?!$)', '$1:').ToLower()
    ip4 = if ($v4) { $v4.Address.ToString() } else { $null }
    pfx = if ($v4) { $v4.PrefixLength } else { $null }
    ip6 = $v6
    gw = if ($gw) { $gw.Address.ToString() } else { $null }
    dns = @($props.DnsAddresses | ForEach-Object { $_.ToString() })
    mtu = $mtu; dhcp = $dhcp; lease = $lease
  }
}

$nics = @{}
$nicInfo = @{}
$wlanGw = $null

function WlanNics {
  $script:nics = @{}
  $script:nicInfo = @{}
  $script:wlanGw = $null
  foreach ($a in [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
    if ($a.NetworkInterfaceType -ne 'Wireless80211') { continue }
    $id = $a.Id.Trim('{}').ToLower()
    $info = NicInfo $a
    $script:nics[$id] = $a
    $script:nicInfo[$id] = $info
    if ($null -eq $script:wlanGw -and $a.OperationalStatus -eq 'Up' -and $info['gw']) { $script:wlanGw = $info['gw'] }
  }
}

function EmitWlan {
  if ($script:wlanMode -eq 'unset') {
    try { Add-Type -TypeDefinition $script:wlanSource; $script:wlanMode = 'ok' } catch { $script:wlanMode = 'none' }
  }
  if ($script:wlanMode -ne 'ok') { Emit 'wlan' @(); return }
  $rows = @([ElecdexWlan]::Read())
  # The profile and the addresses change with the connection: read again when an
  # interface's state or channel moves, and every ten seconds for the way out.
  $key = ($rows | ForEach-Object { '{0}:{1}:{2}' -f $_['g'], $_['s'], $_['ch'] }) -join ','
  if ($key -ne $script:wlanKey -or $script:tick - $script:profilesAt -ge 10) {
    $script:profiles = WlanProfiles
    WlanNics
    $script:profilesAt = $script:tick
    $script:wlanKey = $key
  }
  foreach ($r in $rows) {
    $g = $r['g']
    $p = $script:profiles[$g]
    if ($p) { foreach ($k in $p.Keys) { $r[$k] = $p[$k] } }
    $n = $script:nicInfo[$g]
    if ($n) { foreach ($k in $n.Keys) { $r[$k] = $n[$k] } }
    # The byte counters, fresh each tick from the interface found above.
    $a = $script:nics[$g]
    if ($a) {
      try { $st = $a.GetIPStatistics(); $r['rxb'] = $st.BytesReceived; $r['txb'] = $st.BytesSent } catch {}
    }
  }
  Emit 'wlan' $rows
}

# The gateway the last reading found; the echo round runs before this tick's reading.
function WlanGateway { return $script:wlanGw }

function PingResult($task) {
  if ($null -eq $task) { return $null }
  try { if ($task.Wait(1000) -and $task.Result.Status -eq 'Success') { return $task.Result.RoundtripTime } } catch {}
  return $null
}

# Connections, failures and disconnections from the last day, then only newer
# records. Only the fields named here leave: the record also names the access point.
function EmitWlanLog {
  if ($script:fresh.ContainsKey('wlanlog')) { $script:logLast = -1 }
  $ids = '(EventID=8001 or EventID=8002 or EventID=8003)'
  $when = if ($script:logLast -lt 0) { 'TimeCreated[timediff(@SystemTime) <= 86400000]' } else { 'EventRecordID > ' + $script:logLast }
  $rows = New-Object System.Collections.ArrayList
  try {
    $query = New-Object System.Diagnostics.Eventing.Reader.EventLogQuery('Microsoft-Windows-WLAN-AutoConfig/Operational', [System.Diagnostics.Eventing.Reader.PathType]::LogName, ('*[System[' + $ids + ' and ' + $when + ']]'))
    $reader = New-Object System.Diagnostics.Eventing.Reader.EventLogReader($query)
    for ($e = $reader.ReadEvent(); $null -ne $e; $e = $reader.ReadEvent()) {
      $d = @{}
      foreach ($n in ([xml]$e.ToXml()).Event.EventData.Data) { $d[$n.Name] = $n.'#text' }
      $why = $d['Reason']
      if (-not $why) { $why = $d['FailureReason'] }
      [void]$rows.Add(@{
        rid = $e.RecordId; id = $e.Id
        at = [long](($e.TimeCreated.ToUniversalTime() - [DateTime]'1970-01-01').TotalMilliseconds)
        g = $d['InterfaceGuid']; ssid = $d['SSID']; code = $d['ReasonCode']; why = $why
      })
      if ($e.RecordId -gt $script:logLast) { $script:logLast = $e.RecordId }
    }
  } catch {}
  Emit 'wlanlog' @($rows | Select-Object -Last 200)
}
`

/**
 * The loop's part: one echo round serves both the network status pane (`ping`,
 * every five ticks) and the Wi-Fi pane (`probe`, every tick, with the gateway).
 * `$host` is the validated ping host.
 */
export const probeStep = (pingHost: string): string => `
  $probeOn = $want.ContainsKey('probe')
  $pingDue = Due 'ping' 5
  if ($probeOn -or $pingDue) {
    $gwAddr = $null
    if ($probeOn) { $gwAddr = WlanGateway }
    $tNet = $null; $tGw = $null
    try { $tNet = $pinger.SendPingAsync('${pingHost}', 900) } catch {}
    if ($gwAddr) { try { $tGw = $gwPinger.SendPingAsync($gwAddr, 900) } catch {} }
    $ms = PingResult $tNet
    $gms = PingResult $tGw
    if ($probeOn) { Emit 'probe' @{ net = $ms; gw = $gms; gwa = $gwAddr } }
    if ($pingDue) { Emit 'ping' @{ ms = $ms } }
  }
  if ($want.ContainsKey('wlan')) { EmitWlan }
  if (Due 'wlanlog' 5) { EmitWlanLog }
`

// ---------------------------------------------------------------------------
// The script's lines, read back
// ---------------------------------------------------------------------------

export interface RawWlanCounters {
  tx: number
  rx: number
  retry: number
  multi: number
  failed: number
  ack: number
  fcs: number
  decrypt: number
  hs: number
}

/** One interface as the script reports it; see WLAN_SOURCE and WLAN_SCRIPT. */
export interface RawWlan {
  g: string
  d: string
  /** WLAN_INTERFACE_STATE. */
  s: number
  radio: number | null
  bg: number | null
  ms: number | null
  ch: number | null
  rssi: number | null
  phy: number | null
  q: number | null
  /** kbit/s. */
  rx: number | null
  tx: number | null
  mlo: number | null
  links: { f: number; w: number; r: number }[]
  c: RawWlanCounters | null
  ssid: string | null
  auth: string | null
  cipher: string | null
  level: string | null
  cost: string | null
  mac: string | null
  ip4: string | null
  pfx: number | null
  ip6: string[]
  gw: string | null
  dns: string[]
  mtu: number | null
  dhcp: boolean | null
  lease: number | null
  rxb: number | null
  txb: number | null
}

export interface RawProbe {
  net: number | null
  gw: number | null
  gwa: string | null
}

export interface RawWlanEvent {
  rid: number
  id: number
  at: number
  g: string
  ssid: string | null
  code: number | null
  why: string
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
const texts = (v: unknown): string[] =>
  list(v)
    .map((x) => text(x, 64))
    .filter((x): x is string => x !== null)
    .slice(0, 8)

function counters(v: unknown): RawWlanCounters | null {
  if (!isRow(v)) return null
  const n = (k: string): number => num(v[k]) ?? 0
  return {
    tx: n('tx'),
    rx: n('rx'),
    retry: n('retry'),
    multi: n('multi'),
    failed: n('failed'),
    ack: n('ack'),
    fcs: n('fcs'),
    decrypt: n('decrypt'),
    hs: n('hs'),
  }
}

export function parseWlanRows(data: unknown): RawWlan[] {
  return list(data)
    .filter(isRow)
    .slice(0, 8)
    .map((r) => ({
      g: text(r.g, 64) ?? '',
      d: text(r.d) ?? '',
      s: num(r.s) ?? 0,
      radio: num(r.radio),
      bg: num(r.bg),
      ms: num(r.ms),
      ch: num(r.ch),
      rssi: num(r.rssi),
      phy: num(r.phy),
      q: num(r.q),
      rx: num(r.rx),
      tx: num(r.tx),
      mlo: num(r.mlo),
      links: list(r.links)
        .filter(isRow)
        .slice(0, 8)
        .map((l) => ({ f: num(l.f) ?? 0, w: num(l.w) ?? 0, r: num(l.r) ?? 0 })),
      c: counters(r.c),
      ssid: text(r.ssid, 64),
      auth: text(r.auth, 64),
      cipher: text(r.cipher, 64),
      level: text(r.level, 64),
      cost: text(r.cost, 64),
      mac: text(r.mac, 64),
      ip4: text(r.ip4, 64),
      pfx: num(r.pfx),
      ip6: texts(r.ip6),
      gw: text(r.gw, 64),
      dns: texts(r.dns),
      mtu: num(r.mtu),
      dhcp: typeof r.dhcp === 'boolean' ? r.dhcp : null,
      lease: num(r.lease),
      rxb: num(r.rxb),
      txb: num(r.txb),
    }))
    .filter((r) => r.g !== '')
}

export function parseProbe(data: unknown): RawProbe | null {
  if (!isRow(data)) return null
  return { net: num(data.net), gw: num(data.gw), gwa: text(data.gwa, 64) }
}

export function parseWlanEvents(data: unknown): RawWlanEvent[] {
  return list(data)
    .filter(isRow)
    .slice(-200)
    .map((r) => ({
      rid: num(r.rid) ?? 0,
      id: num(r.id) ?? 0,
      at: num(r.at) ?? 0,
      g: (text(r.g, 64) ?? '').replace(/[{}]/g, '').toLowerCase(),
      ssid: text(r.ssid, 64),
      code: num(r.code),
      why: text(r.why, 400) ?? '',
    }))
    .filter((r) => r.rid > 0 && r.at > 0)
}

// ---------------------------------------------------------------------------
// Pure conversion to what the pane reads
// ---------------------------------------------------------------------------

/** WLAN_INTERFACE_STATE, with the radio's own switch taking precedence. */
export function stateOf(state: number, radio: number | null): WifiState {
  if (radio === 0) return 'off'
  if (state === 1) return 'connected'
  if (state === 5 || state === 6 || state === 7) return 'connecting'
  return 'disconnected'
}

const LEVELS: Record<string, WifiInternet> = {
  InternetAccess: 'internet',
  ConstrainedInternetAccess: 'constrained',
  LocalAccess: 'local',
  None: 'none',
}

const METERED: Record<string, boolean> = { Unrestricted: false, Fixed: true, Variable: true }

const COUNTER_MAP = (c: RawWlanCounters): WifiCounters => ({
  txFrames: c.tx,
  rxFrames: c.rx,
  retries: c.retry,
  multiRetries: c.multi,
  failed: c.failed,
  ackFailures: c.ack,
  fcsErrors: c.fcs,
  decryptFailures: c.decrypt,
  handshakeFailures: c.hs,
})

/** Bytes per second between two readings of a counter; null across a reset or with no baseline. */
export function rate(now: number | null, then: number | null, seconds: number): number | null {
  if (now === null || then === null || seconds <= 0 || now < then) return null
  return (now - then) / seconds
}

/** What the radio says, all null while the interface is not connected. */
type RadioFields = Pick<
  WifiLink,
  | 'ssid'
  | 'standard'
  | 'freqMhz'
  | 'channel'
  | 'widthMhz'
  | 'rssi'
  | 'quality'
  | 'rxMbps'
  | 'txMbps'
  | 'radios'
  | 'security'
  | 'cipher'
  | 'internet'
  | 'metered'
>

const NO_RADIO: RadioFields = {
  ssid: null,
  standard: null,
  freqMhz: null,
  channel: null,
  widthMhz: null,
  rssi: null,
  quality: null,
  rxMbps: null,
  txMbps: null,
  radios: [],
  security: null,
  cipher: null,
  internet: null,
  metered: null,
}

const kbps = (v: number | null): number | null => (v === null ? null : v / 1000)
const positive = (v: number | undefined): number | null => (v !== undefined && v > 0 ? v : null)

function radioFields(row: RawWlan): RadioFields {
  const first = row.links[0]
  return {
    ssid: row.ssid,
    standard: standardOfPhy(row.phy),
    freqMhz: positive(first?.f),
    channel: row.ch,
    widthMhz: positive(first?.w),
    rssi: row.rssi ?? first?.r ?? null,
    quality: row.q,
    rxMbps: kbps(row.rx),
    txMbps: kbps(row.tx),
    radios:
      row.mlo === 1 && row.links.length > 1
        ? row.links.map((l) => ({ freqMhz: l.f, widthMhz: positive(l.w), rssi: l.r }))
        : [],
    security: securityLabel(row.auth),
    cipher: cipherLabel(row.cipher),
    internet: row.level === null ? null : (LEVELS[row.level] ?? null),
    metered: row.cost === null ? null : (METERED[row.cost] ?? null),
  }
}

const flag = (v: number | null): boolean | null => (v === null ? null : v !== 0)

/** One interface, with its byte rates from the reading before. */
export function toWifiLink(row: RawWlan, previous: RawWlan | undefined, seconds: number): WifiLink {
  const state = stateOf(row.s, row.radio)
  const since = (now: number | null, then: number | null | undefined): number | null =>
    then === undefined ? null : rate(now, then, seconds)
  return {
    id: row.g,
    adapter: row.d,
    state,
    ...(state === 'connected' ? radioFields(row) : NO_RADIO),
    noise: null,
    backgroundScan: flag(row.bg),
    streamingMode: flag(row.ms),
    mac: row.mac,
    ip4: row.ip4,
    prefix4: row.pfx,
    ip6: row.ip6,
    gateway: row.gw,
    dns: row.dns,
    mtu: row.mtu,
    dhcp: row.dhcp,
    // .NET answers with the maximum when the address is not from DHCP.
    leaseSeconds:
      row.dhcp === true && row.lease !== null && row.lease < 0xffffffff ? row.lease : null,
    rxSec: since(row.rxb, previous?.rxb),
    txSec: since(row.txb, previous?.txb),
    counters: row.c === null ? null : COUNTER_MAP(row.c),
  }
}

/**
 * The sampler's Wi-Fi lines (`wlan`, `probe`, `wlanlog`), or undefined for a
 * line of another kind - kept here so the sampler's own parser stays about the
 * kinds it has always had.
 */
export function parseWifiLine(
  t: unknown,
  data: unknown,
):
  | { kind: 'wlan'; data: RawWlan[] }
  | { kind: 'probe'; data: RawProbe }
  | { kind: 'wlanlog'; data: RawWlanEvent[] }
  | null
  | undefined {
  if (t === 'wlan') return { kind: 'wlan', data: parseWlanRows(data) }
  if (t === 'wlanlog') return { kind: 'wlanlog', data: parseWlanEvents(data) }
  if (t !== 'probe') return undefined
  const probe = parseProbe(data)
  return probe === null ? null : { kind: 'probe', data: probe }
}

export function toNetWifi(
  previous: { at: number; data: RawWlan[] } | null,
  current: { at: number; data: RawWlan[] },
  probe: (RawProbe & { at: number }) | null,
  host: string,
): NetWifi {
  const seconds = previous === null ? 0 : (current.at - previous.at) / 1000
  const links = current.data.map((row) =>
    toWifiLink(
      row,
      previous?.data.find((p) => p.g === row.g),
      seconds,
    ),
  )
  const wifiProbe: WifiProbe | null =
    probe === null
      ? null
      : {
          at: probe.at,
          host,
          internet: probe.net,
          gatewayAddress: probe.gwa,
          gateway: probe.gwa === null ? null : probe.gw,
        }
  return { links, probe: wifiProbe, limits: ['bssid-location'] }
}

const EVENT_KINDS: Record<number, WifiEventKind> = {
  8001: 'connected',
  8002: 'failed',
  8003: 'disconnected',
}

/** The log's records as events, newest first, the last day only. */
export function toWifiEvents(records: Iterable<RawWlanEvent>, now: number): WifiEvent[] {
  const events: WifiEvent[] = []
  for (const r of records) {
    const kind = EVENT_KINDS[r.id]
    if (kind === undefined || r.at < now - 86_400_000) continue
    events.push({
      key: `log:${r.rid}`,
      at: r.at,
      kind,
      ssid: r.ssid,
      code: r.code,
      reason: r.why.trim(),
    })
  }
  return events.sort((a, b) => b.at - a.at).slice(0, 200)
}
