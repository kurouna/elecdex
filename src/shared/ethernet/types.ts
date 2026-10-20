import type { PathInternet, PathProbe } from '../netpath.js'

// ---------------------------------------------------------------------------
// Readings
// ---------------------------------------------------------------------------

/**
 * How the port stands. `no-carrier` is no cable, or nothing at its other end;
 * `disabled` is the adapter turned off by the user - not a fault, and not a drop.
 */
export type EtherState = 'up' | 'no-carrier' | 'disabled'

export type EtherBus = 'pci' | 'usb' | 'thunderbolt' | 'other'

export type Duplex = 'full' | 'half'

/** Driver settings that lower the speed or sleep the link when idle, by what they do. */
export type PowerKey =
  | 'eee'
  | 'advancedEee'
  | 'green'
  | 'gigaLite'
  | 'powerSave'
  | 'autoDisableGigabit'
  | 'reduceSpeed'

export const POWER_LABELS: Record<PowerKey, string> = {
  eee: 'EEE',
  advancedEee: 'ADV EEE',
  green: 'GREEN',
  gigaLite: 'GIGA LITE',
  powerSave: 'POWER SAVE',
  autoDisableGigabit: 'AUTO 100M',
  reduceSpeed: 'REDUCE SPEED',
}

/**
 * What the driver is set to, read when the pane opens and whenever the link
 * comes up - never changed. Null fields are settings this driver does not have.
 */
export interface EtherSettings {
  /** A speed fixed by hand, Mb/s; null when the adapter negotiates. */
  speed: number | null
  /** A duplex fixed by hand; null when negotiated. */
  duplex: Duplex | null
  /** The fastest speed the driver offers: the adapter's own best. */
  capMbps: number | null
  power: Partial<Record<PowerKey, boolean>>
  /** The jumbo frame size in bytes when on, 0 when off. */
  jumbo: number | null
  flow: boolean | null
  vlan: number | null
  wol: boolean | null
}

/**
 * Counters since the adapter came up. A null is one this driver or platform does
 * not keep: shown as a dash, never as a zero.
 */
export interface EtherCounters {
  rxPackets: number | null
  txPackets: number | null
  /** Broadcast and multicast together (Windows' non-unicast). */
  rxNonUnicast: number | null
  /** Bytes received in broadcast frames: Windows counts broadcast only by bytes. */
  rxBroadcastOctets: number | null
  /** Multicast frames, where the platform counts them apart (Linux). */
  rxMulticast: number | null
  /** Frames received damaged: CRC, framing, length. What the cable is judged by. */
  rxErrors: number | null
  txErrors: number | null
  /** Frames this machine dropped itself (full rings, filters): its own doing, not the cable's. */
  rxDiscards: number | null
  txDiscards: number | null
  rxUnknown: number | null
  /** Collisions: none can happen on full duplex, so any is a mismatch (Linux). */
  collisions: number | null
}

/** Which way the internet's echo leaves, when it is not by this adapter. */
export type EtherRoute = 'default' | 'wifi' | 'vpn' | 'other'

export interface EtherLink {
  /** The interface: `if<index>` on Windows, its name elsewhere. Never a GUID or a path. */
  id: string
  /** The adapter, e.g. "Realtek Gaming GbE Family Controller". */
  adapter: string
  /** The system's name for it: "Ethernet", "eth0". */
  alias: string | null
  bus: EtherBus | null
  /** e.g. "PCIe 2.5 GT/s x1", "USB 5 Gb/s". */
  busDetail: string | null
  /** The USB port's own speed, Mb/s, where the platform tells it (Linux): 480 is USB 2.0. */
  usbMbps: number | null
  driver: string | null
  state: EtherState
  /** The negotiated speed, Mb/s; null while down. */
  speedMbps: number | null
  /** Null while down, or where the platform does not say. */
  duplex: Duplex | null
  /** False while 802.1X has not let the port through; null where not known. */
  authenticated: boolean | null
  settings: EtherSettings | null
  internet: PathInternet | null
  /** Whether the internet's echo leaves by this adapter, and if not, by what. */
  route: EtherRoute | null
  mac: string | null
  ip4: string | null
  prefix4: number | null
  ip6: string[]
  gateway: string | null
  dns: string[]
  mtu: number | null
  dhcp: boolean | null
  leaseSeconds: number | null
  /** Bytes per second through this adapter since the reading before. */
  rxSec: number | null
  txSec: number | null
  counters: EtherCounters | null
  /**
   * Times the link went down, counted by the system: since boot on Linux, since the
   * pane began to watch on Windows (NDIS's events). A rise between two readings
   * that both found the link up is a drop inside a second.
   */
  carrierDowns: number | null
  /** When the system logged another machine claiming this adapter's address, the last day, epoch ms. */
  conflicts: number[]
}

/** Something the platform will not tell, so the pane says so rather than show a dash. */
export type EtherLimit = 'no-log' | 'no-capability' | 'no-broadcast' | 'no-settings'

export interface NetEthernet {
  links: EtherLink[]
  /** The echo round, shared with the Wi-Fi and network status panes. */
  probe: PathProbe | null
  limits: EtherLimit[]
  /**
   * What went wrong while reading, in the reader's words, each said once: the pane
   * shows it as a toast, so a fault on a machine nobody here has tried reaches
   * whoever can report it.
   */
  problems: string[]
}
