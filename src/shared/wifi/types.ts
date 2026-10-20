import type { PathInternet, PathProbe } from '../netpath.js'

// ---------------------------------------------------------------------------
// Readings
// ---------------------------------------------------------------------------

/** How the interface stands. `off` is the radio switched off (airplane mode, a switch). */
export type WifiState = 'connected' | 'connecting' | 'disconnected' | 'off'

/** IEEE 802.11 amendment: `ax` is Wi-Fi 6, `be` Wi-Fi 7. */
export type WifiStandard = 'a' | 'b' | 'g' | 'n' | 'ac' | 'ad' | 'ax' | 'be'

export type WifiBand = '2.4' | '5' | '6'

/** What the OS says of the way out: `constrained` is a captive portal waiting for a sign-in. */
export type WifiInternet = PathInternet

/** One radio link of a multi-link (Wi-Fi 7 MLO) connection. */
export interface WifiRadioLink {
  freqMhz: number
  widthMhz: number | null
  rssi: number | null
}

/**
 * Frame counters since the interface came up. Null where the driver does not
 * keep them. The pane works in their differences.
 */
export interface WifiCounters {
  txFrames: number
  rxFrames: number
  retries: number
  multiRetries: number
  failed: number
  ackFailures: number
  fcsErrors: number
  decryptFailures: number
  handshakeFailures: number
}

export interface WifiLink {
  /** The interface: its GUID on Windows, its name elsewhere. Never a path. */
  id: string
  /** The adapter, e.g. "Intel(R) Wi-Fi 6E AX211 160MHz", or the interface name. */
  adapter: string
  state: WifiState
  /** Null when the OS keeps it back (macOS without location access) or it is not connected. */
  ssid: string | null
  standard: WifiStandard | null
  freqMhz: number | null
  channel: number | null
  widthMhz: number | null
  /** dBm. */
  rssi: number | null
  /** dBm, where the platform reports a noise floor (macOS). */
  noise: number | null
  /** The driver's own link quality, 0-100 (Windows). */
  quality: number | null
  /** The PHY's negotiated rates, Mbit/s - what the radio could carry, not what it does. */
  rxMbps: number | null
  txMbps: number | null
  /** The links of a multi-link connection; empty for a single link. */
  radios: WifiRadioLink[]
  /** e.g. "WPA2-Personal"; null when unknown. */
  security: string | null
  /** e.g. "CCMP". */
  cipher: string | null
  internet: WifiInternet | null
  metered: boolean | null
  /** Windows' periodic background scan, which stalls traffic for a moment each time. */
  backgroundScan: boolean | null
  /** Windows' media streaming mode, which holds the scan off. */
  streamingMode: boolean | null
  mac: string | null
  ip4: string | null
  prefix4: number | null
  ip6: string[]
  gateway: string | null
  dns: string[]
  mtu: number | null
  dhcp: boolean | null
  /** Seconds left on the DHCP lease. */
  leaseSeconds: number | null
  /** Bytes per second through this adapter since the reading before. */
  rxSec: number | null
  txSec: number | null
  counters: WifiCounters | null
}

export interface NetWifi {
  links: WifiLink[]
  /** Null while the pings are starting, or where they cannot run. */
  probe: PathProbe | null
  /** What this platform cannot tell, so the pane can say why a figure is missing. */
  limits: WifiLimit[]
}

/** Something the platform will not tell, and the pane says so rather than show a dash. */
export type WifiLimit = 'bssid-location' | 'ssid-location' | 'no-log' | 'no-counters'

export type WifiEventKind = 'connected' | 'failed' | 'disconnected'

/** A connection event from the operating system's own log (Windows' WLAN-AutoConfig). */
export interface WifiEvent {
  /** Unique within the log, so a re-read never counts one twice. */
  key: string
  at: number
  kind: WifiEventKind
  ssid: string | null
  /** The OS's reason code, when it gives one. */
  code: number | null
  /** The OS's own words, in its display language. */
  reason: string
}

export interface NetWifiEvents {
  /** Newest first, the last 24 hours. */
  events: WifiEvent[]
}
