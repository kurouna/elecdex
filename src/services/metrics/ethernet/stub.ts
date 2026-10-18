import type { EtherCounters, EtherLink, EtherSettings, NetEthernet } from '@shared/ethernet'
import type { PathProbe } from '@shared/netpath'

/**
 * A made-up wired link, for the tests, the README screenshots and the demos, so
 * none of them reads - or publishes - this machine's adapters or addresses.
 * `ELECDEX_ETHER_STUB` names one of the cases the pane's mock was drawn with
 * (docs/ethernet-mock): `1` a steady gigabit link to assert on, and the faults.
 *
 *  - `flapping`: down for 3 s every 2 minutes, power saving on.
 *  - `downshift`: 1 Gb/s for the first 30 s, 100 Mb/s after.
 *  - `crc`: damaged frames at 0.3 % of what arrives.
 *  - `mismatch`: fixed at 100 Mb/s full by hand, with CRC errors (the other end at half).
 *  - `half`: negotiated at 100 Mb/s half duplex.
 *  - `storm`: 2,400 broadcast frames a second and a lossy gateway (a loop).
 *  - `multicast`: IPTV's 1,600 multicast frames a second, which is no fault.
 *  - `router`, `upstream`, `vpn`, `usb`, `auth`, `unplugged`, `none`, `dual`, `demo`.
 *
 * Pure functions of the time since the collector started, so a spec can wait for
 * a phase rather than race one. The addresses are documentation ranges.
 */

export const ETHER_STUBS = [
  'steady',
  'demo',
  'flapping',
  'downshift',
  'crc',
  'mismatch',
  'half',
  'storm',
  'multicast',
  'router',
  'upstream',
  'vpn',
  'usb',
  'auth',
  'unplugged',
  'none',
  'dual',
] as const
export type EtherStub = (typeof ETHER_STUBS)[number]

export function etherStubFrom(value: string | undefined): EtherStub | null {
  if (value === '1') return 'steady'
  return ETHER_STUBS.find((s) => s === value && s !== 'steady') ?? null
}

/** Frames a second arriving and leaving: a working day's trickle. */
const RX_PPS = 2200
const TX_PPS = 600

const SETTINGS: EtherSettings = {
  speed: null,
  duplex: null,
  capMbps: 1000,
  power: { eee: false, green: true, gigaLite: true, powerSave: true },
  jumbo: 0,
  flow: true,
  vlan: null,
  wol: true,
}

interface Shape {
  speed: (seconds: number) => number
  duplex: 'full' | 'half'
  down: (seconds: number) => boolean
  /** Damaged frames per thousand arriving. */
  crc: number
  broadcast: number
  multicast: number
  settings: EtherSettings
}

const steadyShape: Shape = {
  speed: () => 1000,
  duplex: 'full',
  down: () => false,
  crc: 0,
  broadcast: 22,
  multicast: 60,
  settings: SETTINGS,
}

function shape(kind: EtherStub): Shape {
  switch (kind) {
    case 'flapping':
      return { ...steadyShape, down: (s) => s % 120 >= 60 && s % 120 < 63 }
    case 'downshift':
      return { ...steadyShape, speed: (s) => (s < 30 ? 1000 : 100) }
    case 'crc':
      return { ...steadyShape, crc: 3.2 }
    case 'mismatch':
      return {
        ...steadyShape,
        speed: () => 100,
        crc: 1.4,
        settings: { ...SETTINGS, speed: 100, duplex: 'full' },
      }
    case 'half':
      return { ...steadyShape, speed: () => 100, duplex: 'half' }
    case 'storm':
      return { ...steadyShape, broadcast: 2400 }
    case 'multicast':
      return { ...steadyShape, multicast: 1600 }
    case 'usb':
      return { ...steadyShape, settings: { ...SETTINGS, power: { eee: true } } }
    default:
      return steadyShape
  }
}

/** Seconds the link was up in the first `seconds`, for counters that only climb while it is. */
function upSeconds(s: Shape, seconds: number): number {
  let up = 0
  for (let t = 1; t <= seconds; t++) if (!s.down(t)) up++
  return up
}

function counters(s: Shape, seconds: number): EtherCounters {
  const up = upSeconds(s, seconds)
  return {
    rxPackets: 9_000_000 + up * RX_PPS,
    txPackets: 2_000_000 + up * TX_PPS,
    rxNonUnicast: 400_000 + up * Math.round(s.broadcast + s.multicast),
    rxBroadcastOctets: 9_000_000 + up * Math.round(s.broadcast) * 60,
    rxMulticast: null,
    rxErrors: 12 + Math.round((up * RX_PPS * s.crc) / 1000),
    txErrors: 0,
    rxDiscards: 2,
    txDiscards: 0,
    rxUnknown: 1204,
    collisions: null,
  }
}

function rates(kind: EtherStub, seconds: number): { rx: number; tx: number } {
  if (kind === 'usb') return { rx: 34_000_000 + Math.sin(seconds) * 400_000, tx: 400_000 }
  if (kind === 'steady' || kind === 'dual') return { rx: 3_000_000, tx: 400_000 }
  const wave = Math.sin(seconds / 9)
  return {
    rx: Math.max(50_000, 3_000_000 + wave * 2_400_000),
    tx: 300_000 + Math.cos(seconds / 5) * 200_000,
  }
}

/** What a port has only while its link is up. */
function upPart(kind: EtherStub, s: Shape, seconds: number) {
  const addressed = kind !== 'auth'
  const { rx, tx } = rates(kind, seconds)
  return {
    speedMbps: s.speed(seconds),
    duplex: s.duplex,
    authenticated: addressed,
    internet: 'internet' as const,
    route: kind === 'vpn' ? ('vpn' as const) : ('default' as const),
    ip4: addressed ? '192.0.2.31' : null,
    prefix4: addressed ? 24 : null,
    gateway: addressed ? '192.0.2.1' : null,
    dns: ['192.0.2.1'],
    leaseSeconds: 86_400 - (seconds % 86_400),
    rxSec: rx,
    txSec: tx,
  }
}

const DOWN = {
  speedMbps: null,
  duplex: null,
  authenticated: null,
  internet: null,
  route: null,
  ip4: null,
  prefix4: null,
  gateway: null,
  dns: [],
  leaseSeconds: null,
  rxSec: 0,
  txSec: 0,
}

function link(kind: EtherStub, seconds: number): EtherLink {
  const s = shape(kind)
  const down = kind === 'unplugged' || s.down(seconds)
  const usb = kind === 'usb'
  return {
    id: 'stub-eth0',
    adapter: usb ? 'USB Gigabit Ethernet (stub dock)' : 'Gigabit Ethernet Adapter (stub)',
    alias: 'Ethernet',
    bus: usb ? 'usb' : 'pci',
    busDetail: usb ? 'USB' : 'PCIe 2.5 GT/s x1',
    usbMbps: null,
    driver: 'Stub · 1.0 · 2026-01-01',
    state: down ? 'no-carrier' : 'up',
    ...(down ? DOWN : upPart(kind, s, seconds)),
    settings: s.settings,
    mac: '02:00:5e:10:00:02',
    ip6: [],
    mtu: 1500,
    dhcp: true,
    // No cable, no frames: the counters stand where they were.
    counters: counters(s, kind === 'unplugged' ? 0 : seconds),
    carrierDowns: null,
  }
}

function gatewayRtt(kind: EtherStub, seconds: number): number | null {
  switch (kind) {
    case 'router':
      return seconds % 20 === 0 ? null : Math.round(24 + Math.abs(Math.sin(seconds)) * 14)
    case 'storm':
      return seconds % 25 === 0 ? null : Math.round(4 + Math.abs(Math.sin(seconds)) * 9)
    case 'half':
      return Math.round(2 + Math.abs(Math.sin(seconds)) * 4)
    default:
      return 0.4
  }
}

function internetRtt(kind: EtherStub, seconds: number): number | null {
  if (kind === 'upstream' && seconds >= 20 && seconds % 40 >= 20 && seconds % 40 < 30) return null
  if (kind === 'steady' || kind === 'dual') return 18
  if (kind === 'router') return Math.round(46 + Math.abs(Math.sin(seconds / 2)) * 18)
  return Math.round(17 + Math.abs(Math.sin(seconds / 3)) * 4)
}

function probe(kind: EtherStub, seconds: number, at: number, links: EtherLink[]): PathProbe {
  const gateways = links
    .filter((l) => l.state === 'up' && l.gateway !== null)
    .map((l) => ({
      link: l.id,
      address: l.gateway as string,
      rtt: l.id === 'stub-eth0' ? gatewayRtt(kind, seconds) : 1,
    }))
  return { at, host: '192.0.2.53', internet: internetRtt(kind, seconds), gateways }
}

/** The dual case's second port: a dock with no cable in it. */
function dock(seconds: number): EtherLink {
  return {
    ...link('unplugged', seconds),
    id: 'stub-eth1',
    adapter: 'USB Gigabit Ethernet (stub dock)',
    alias: 'Ethernet 2',
    bus: 'usb',
    busDetail: 'USB',
  }
}

export function stubEthernet(kind: EtherStub, startedAt: number, now: number): NetEthernet {
  const seconds = Math.floor((now - startedAt) / 1000)
  const at = Math.floor(now / 1000) * 1000
  const links =
    kind === 'none'
      ? []
      : kind === 'dual'
        ? [link('steady', seconds), dock(seconds)]
        : [link(kind, seconds)]
  return { links, probe: probe(kind, seconds, at, links), limits: ['no-log'] }
}
