import { readdir, readFile, readlink } from 'node:fs/promises'
import os from 'node:os'
import type { Duplex, EtherCounters, EtherLink, EtherRoute } from '@shared/ethernet'
import { gatewayFromRoute, resolvers } from '../wifi/linux.js'
import { rate } from '../wifi/windows.js'

/**
 * Ethernet on Linux, from the kernel's files alone: /sys/class/net for the link,
 * its counters and its bus, /proc/net/route for the default route. Nothing needs
 * root, and no process is started. The adapter's best speed, auto-negotiation and
 * EEE need ethtool's ioctl, which is not read (`no-capability`); broadcast frames
 * are not counted apart from multicast (`no-broadcast`).
 *
 * Not verified by hand (CLAUDE.md): the parsers are unit-tested, the e2e tests run
 * the stub.
 */

const readText = (path: string): Promise<string> => readFile(path, 'utf8').catch(() => '')

/** Drivers that look like a cable and are a phone: tethering, never a wired port. */
const TETHERING = /^(rndis_host|cdc_ether|cdc_ncm|ipheth)$/

/** A number from a sysfs file; null for a missing file, -1 (unknown) or garbage. */
export function sysNumber(text: string): number | null {
  const n = Number(text.trim())
  return text.trim() === '' || !Number.isFinite(n) || n < 0 ? null : n
}

/** `duplex`: "full", "half", or "unknown" (or EINVAL while down). */
export function sysDuplex(text: string): Duplex | null {
  const t = text.trim()
  return t === 'full' || t === 'half' ? t : null
}

/**
 * Whether an interface is a physical wired port: Ethernet (type 1), not wireless,
 * not virtual (a bridge, a bond, a veth, docker0, a VPN's tun), not a phone.
 */
export function isWiredPort(f: {
  type: string
  wireless: boolean
  device: string | null
  bridge: boolean
  bond: boolean
  driver: string | null
}): boolean {
  if (f.type.trim() !== '1' || f.wireless || f.bridge || f.bond) return false
  if (f.device === null || f.device.includes('/virtual/')) return false
  return f.driver === null || !TETHERING.test(f.driver)
}

/** The interface carrying the default route, the one with the lowest metric. */
export function defaultInterface(route: string): string | null {
  let best: { name: string; metric: number } | null = null
  for (const line of route.split('\n').slice(1)) {
    const f = line.trim().split(/\s+/)
    if (f[1] !== '00000000' || f[0] === undefined) continue
    const metric = Number(f[6] ?? 0)
    if (best === null || metric < best.metric) best = { name: f[0], metric }
  }
  return best?.name ?? null
}

const exists = (path: string): Promise<boolean> =>
  readdir(path).then(
    () => true,
    () => false,
  )

async function linkTarget(path: string): Promise<string | null> {
  try {
    return await readlink(path)
  } catch {
    return null
  }
}

async function wiredPort(name: string): Promise<boolean> {
  const base = `/sys/class/net/${name}`
  const [type, wireless, phy, device, bridge, bond, driver] = await Promise.all([
    readText(`${base}/type`),
    exists(`${base}/wireless`),
    linkTarget(`${base}/phy80211`),
    linkTarget(`${base}`),
    exists(`${base}/bridge`),
    exists(`${base}/bonding`),
    linkTarget(`${base}/device/driver`),
  ])
  return isWiredPort({
    type,
    wireless: wireless || phy !== null,
    device,
    bridge,
    bond,
    driver: driver?.split('/').pop() ?? null,
  })
}

/** What carries the route when it is not this port. */
async function routeKind(name: string, def: string | null): Promise<EtherRoute | null> {
  if (def === null) return null
  if (def === name) return 'default'
  const base = `/sys/class/net/${def}`
  if ((await exists(`${base}/wireless`)) || (await linkTarget(`${base}/phy80211`)) !== null)
    return 'wifi'
  const device = await linkTarget(base)
  return device?.includes('/virtual/') ? 'vpn' : 'other'
}

const COUNTER_FILES = [
  'rx_packets',
  'tx_packets',
  'multicast',
  'rx_crc_errors',
  'rx_frame_errors',
  'rx_length_errors',
  'tx_errors',
  'rx_dropped',
  'rx_missed_errors',
  'tx_dropped',
  'collisions',
  'rx_bytes',
  'tx_bytes',
] as const

type Stat = Record<(typeof COUNTER_FILES)[number], number | null>

/** The kernel's counters as the pane reads them: damaged frames only are the cable's. */
export function countersOf(s: Stat): EtherCounters {
  const damaged = [s.rx_crc_errors, s.rx_frame_errors, s.rx_length_errors]
  const discards = [s.rx_dropped, s.rx_missed_errors]
  const add = (values: (number | null)[]): number | null =>
    values.every((v) => v === null) ? null : values.reduce<number>((a, v) => a + (v ?? 0), 0)
  return {
    rxPackets: s.rx_packets,
    txPackets: s.tx_packets,
    rxNonUnicast: null,
    rxBroadcastOctets: null,
    rxMulticast: s.multicast,
    rxErrors: add(damaged),
    txErrors: s.tx_errors,
    rxDiscards: add(discards),
    txDiscards: s.tx_dropped,
    rxUnknown: null,
    collisions: s.collisions,
  }
}

interface Bytes {
  at: number
  rx: number
  tx: number
}

export class LinuxEtherReader {
  private readonly bytes = new Map<string, Bytes>()

  async read(): Promise<EtherLink[]> {
    const names = await readdir('/sys/class/net').catch(() => [] as string[])
    const wired: string[] = []
    for (const name of names) if (await wiredPort(name)) wired.push(name)
    const [route, resolv] = await Promise.all([
      readText('/proc/net/route'),
      readText('/etc/resolv.conf'),
    ])
    const def = defaultInterface(route)
    return Promise.all(
      wired.slice(0, 8).map((name) => this.link(name, route, def, resolvers(resolv))),
    )
  }

  private async link(
    name: string,
    route: string,
    def: string | null,
    dns: string[],
  ): Promise<EtherLink> {
    const base = `/sys/class/net/${name}`
    const [carrier, operstate, speed, duplex, downs, changes, mtu, subsystem] = await Promise.all([
      readText(`${base}/carrier`),
      readText(`${base}/operstate`),
      readText(`${base}/speed`),
      readText(`${base}/duplex`),
      readText(`${base}/carrier_down_count`),
      readText(`${base}/carrier_changes`),
      readText(`${base}/mtu`),
      linkTarget(`${base}/device/subsystem`),
    ])
    const stat = await statistics(base)
    const up = carrier.trim() === '1'
    const bus = subsystem?.split('/').pop() ?? null
    const usbMbps = bus === 'usb' ? await usbSpeed(base) : null
    return {
      id: name,
      adapter: name,
      alias: name,
      ...busPart(bus, usbMbps),
      driver: null,
      state: up ? 'up' : 'no-carrier',
      speedMbps: up ? sysNumber(speed) : null,
      duplex: up ? sysDuplex(duplex) : null,
      // dormant: up, held by 802.1X.
      authenticated: up ? operstate.trim() !== 'dormant' : null,
      settings: null,
      internet: null,
      route: up ? await routeKind(name, def) : null,
      ...addressesOf(name, up),
      gateway: up ? gatewayFromRoute(route, name) : null,
      dns: up ? dns : [],
      mtu: sysNumber(mtu),
      dhcp: null,
      leaseSeconds: null,
      ...this.rates(name, stat.rx_bytes ?? 0, stat.tx_bytes ?? 0),
      counters: countersOf(stat),
      carrierDowns: downsOf(downs, changes),
      conflicts: [],
    }
  }

  private rates(name: string, rx: number, tx: number): Pick<EtherLink, 'rxSec' | 'txSec'> {
    const now = Date.now()
    const before = this.bytes.get(name)
    this.bytes.set(name, { at: now, rx, tx })
    if (before === undefined) return { rxSec: null, txSec: null }
    const seconds = (now - before.at) / 1000
    return { rxSec: rate(rx, before.rx, seconds), txSec: rate(tx, before.tx, seconds) }
  }
}

async function statistics(base: string): Promise<Stat> {
  const pairs = await Promise.all(
    COUNTER_FILES.map(
      async (f) => [f, sysNumber(await readText(`${base}/statistics/${f}`))] as const,
    ),
  )
  return Object.fromEntries(pairs) as Stat
}

/** The bus, and USB's own speed where the kernel says it: 480 is a USB 2.0 port. */
export function busPart(
  bus: string | null,
  usbMbps: number | null,
): Pick<EtherLink, 'bus' | 'busDetail' | 'usbMbps'> {
  if (bus === 'usb') {
    const speed =
      usbMbps === null ? '' : usbMbps >= 1000 ? ` ${usbMbps / 1000} Gb/s` : ` ${usbMbps} Mb/s`
    return { bus: 'usb', busDetail: `USB${speed}`, usbMbps }
  }
  if (bus === 'pci') return { bus: 'pci', busDetail: 'PCIe', usbMbps: null }
  return { bus: bus === null ? null : 'other', busDetail: bus, usbMbps: null }
}

function addressesOf(
  name: string,
  up: boolean,
): Pick<EtherLink, 'mac' | 'ip4' | 'prefix4' | 'ip6'> {
  const addresses = os.networkInterfaces()[name] ?? []
  const v4 = addresses.find((a) => a.family === 'IPv4')
  if (!up) return { mac: v4?.mac ?? null, ip4: null, prefix4: null, ip6: [] }
  return {
    mac: v4?.mac ?? null,
    ip4: v4?.address ?? null,
    prefix4: v4?.cidr ? Number(v4.cidr.split('/')[1]) : null,
    ip6: addresses
      .filter((a) => a.family === 'IPv6' && !a.address.startsWith('fe80'))
      .map((a) => a.address)
      .slice(0, 4),
  }
}

/** Drops since boot: carrier_down_count, or half of carrier_changes (both edges) on an older kernel. */
export function downsOf(downs: string, changes: string): number | null {
  const down = sysNumber(downs)
  if (down !== null) return down
  const both = sysNumber(changes)
  return both === null ? null : Math.floor(both / 2)
}

/** The USB device's own speed, Mb/s, from the first parent that has one. */
async function usbSpeed(base: string): Promise<number | null> {
  for (const up of ['device/..', 'device/../..']) {
    const n = sysNumber(await readText(`${base}/${up}/speed`))
    if (n !== null) return n
  }
  return null
}
