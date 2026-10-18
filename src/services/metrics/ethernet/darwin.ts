import { execFile } from 'node:child_process'
import os from 'node:os'
import { promisify } from 'node:util'
import type { Duplex, EtherCounters, EtherLink, EtherRoute, EtherSettings } from '@shared/ethernet'
import { rate } from '../wifi/windows.js'

/**
 * Ethernet on macOS: `networksetup -listallhardwareports` for which ports are
 * wired (a minute apart), `ifconfig` for the link's state, speed, duplex and its
 * flow control and EEE, `netstat -I -b` for the counters, and `route -n get
 * default` for the way out. Each is a process, so they run ten seconds apart and
 * the pane reads the last answer in between. No broadcast count (`no-broadcast`),
 * no adapter's best (`no-capability`).
 *
 * Not verified by hand (CLAUDE.md): the parsers are unit-tested, the e2e tests run
 * the stub.
 */

const run = promisify(execFile)

async function out(command: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await run(command, args, { timeout: 3000 })
    return stdout
  } catch {
    return ''
  }
}

/**
 * The wired ports of `networksetup -listallhardwareports`: Ethernet, USB and
 * Thunderbolt LAN adapters - not Wi-Fi, not the Thunderbolt Bridge (a virtual
 * port over the cables between Macs), not a bare "Thunderbolt n" port.
 */
export function wiredPorts(text: string): { port: string; device: string }[] {
  const found: { port: string; device: string }[] = []
  for (const block of text.split(/\n\s*\n/)) {
    const port = /Hardware Port:\s*(.+)/.exec(block)?.[1]?.trim()
    const device = /Device:\s*(\S+)/.exec(block)?.[1]?.trim()
    if (port === undefined || device === undefined) continue
    if (/wi-?fi|airport|bluetooth|bridge|iphone|ipad/i.test(port)) continue
    if (/^Thunderbolt \d+$/i.test(port)) continue
    if (/ethernet|lan|usb|thunderbolt/i.test(port)) found.push({ port, device })
  }
  return found.slice(0, 8)
}

export interface IfconfigMedia {
  active: boolean
  speed: number | null
  duplex: Duplex | null
  flow: boolean | null
  eee: boolean | null
  mtu: number | null
}

const MEDIA_SPEEDS: [RegExp, number][] = [
  [/\b10Gbase/i, 10_000],
  [/\b5000base|\b5Gbase/i, 5000],
  [/\b2500base/i, 2500],
  [/\b1000base/i, 1000],
  [/\b100base/i, 100],
  [/\b10base/i, 10],
]

/** `ifconfig <if>`: `media: autoselect (1000baseT <full-duplex,flow-control,energy-efficient-ethernet>)`. */
export function parseIfconfig(text: string): IfconfigMedia {
  const media = /media:\s*(.+)/.exec(text)?.[1] ?? ''
  const active = /status:\s*active/.test(text)
  const options = /<([^>]*)>/.exec(media)?.[1] ?? ''
  const speed = MEDIA_SPEEDS.find(([re]) => re.test(media))?.[1] ?? null
  return {
    active,
    speed: active ? speed : null,
    duplex: !active
      ? null
      : /full-duplex/.test(options)
        ? 'full'
        : /half-duplex/.test(options)
          ? 'half'
          : null,
    flow: active ? /flow-control/.test(options) : null,
    eee: active ? /energy-efficient-ethernet/.test(options) : null,
    mtu: Number(/mtu (\d+)/.exec(text)?.[1]) || null,
  }
}

/** `netstat -I <if> -b`: the link row's packets, errors, bytes and collisions. */
export function parseNetstat(text: string): Pick<
  EtherCounters,
  'rxPackets' | 'txPackets' | 'rxErrors' | 'txErrors' | 'collisions'
> & {
  rx: number | null
  tx: number | null
} {
  const lines = text.trim().split('\n')
  const header = lines[0]?.trim().split(/\s+/) ?? []
  const row = lines
    .find((l) => /<Link#\d+>/.test(l))
    ?.trim()
    .split(/\s+/)
  const col = (name: string): number | null => {
    const i = header.indexOf(name)
    if (row === undefined || i < 0) return null
    // A link row has an address column only when the port has a MAC; count from the end.
    const fromEnd = header.length - i
    const n = Number(row[row.length - fromEnd])
    return Number.isFinite(n) ? n : null
  }
  return {
    rxPackets: col('Ipkts'),
    txPackets: col('Opkts'),
    rxErrors: col('Ierrs'),
    txErrors: col('Oerrs'),
    collisions: col('Coll'),
    rx: col('Ibytes'),
    tx: col('Obytes'),
  }
}

/** `route -n get default`: the interface the default route leaves by. */
export function routeInterface(text: string): string | null {
  return /interface:\s*(\S+)/.exec(text)?.[1] ?? null
}

const PORTS_MS = 60_000
const LINK_MS = 10_000

interface Cached {
  at: number
  links: EtherLink[]
}

export class DarwinEtherReader {
  private ports: { at: number; list: { port: string; device: string }[] } | null = null
  private cache: Cached | null = null
  private readonly bytes = new Map<string, { at: number; rx: number; tx: number }>()

  async read(): Promise<EtherLink[]> {
    const now = Date.now()
    if (this.cache !== null && now - this.cache.at < LINK_MS) return this.cache.links
    if (this.ports === null || now - this.ports.at > PORTS_MS)
      this.ports = {
        at: now,
        list: wiredPorts(await out('networksetup', ['-listallhardwareports'])),
      }
    const def = routeInterface(await out('route', ['-n', 'get', 'default']))
    const links = await Promise.all(this.ports.list.map((p) => this.link(p.port, p.device, def)))
    this.cache = { at: now, links }
    return links
  }

  private async link(port: string, device: string, def: string | null): Promise<EtherLink> {
    const [ifconfig, netstat] = await Promise.all([
      out('ifconfig', [device]),
      out('netstat', ['-I', device, '-b']),
    ])
    const media = parseIfconfig(ifconfig)
    const stat = parseNetstat(netstat)
    const up = media.active
    const v4 = (os.networkInterfaces()[device] ?? []).find((a) => a.family === 'IPv4')
    return {
      id: device,
      adapter: port,
      alias: device,
      ...portBus(port),
      usbMbps: null,
      driver: null,
      state: up ? 'up' : 'no-carrier',
      speedMbps: media.speed,
      duplex: media.duplex,
      authenticated: null,
      settings: settingsOf(media),
      internet: null,
      route: up ? routeOf(device, def) : null,
      mac: v4?.mac ?? null,
      ip4: up ? (v4?.address ?? null) : null,
      prefix4: up && v4?.cidr ? Number(v4.cidr.split('/')[1]) : null,
      ip6: [],
      gateway: null,
      dns: [],
      mtu: media.mtu,
      dhcp: null,
      leaseSeconds: null,
      ...this.rates(device, stat.rx, stat.tx),
      counters: countersOf(stat),
      carrierDowns: null,
      conflicts: [],
    }
  }

  private rates(
    device: string,
    rx: number | null,
    tx: number | null,
  ): Pick<EtherLink, 'rxSec' | 'txSec'> {
    if (rx === null || tx === null) return { rxSec: null, txSec: null }
    const now = Date.now()
    const before = this.bytes.get(device)
    this.bytes.set(device, { at: now, rx, tx })
    if (before === undefined) return { rxSec: null, txSec: null }
    const seconds = (now - before.at) / 1000
    return { rxSec: rate(rx, before.rx, seconds), txSec: rate(tx, before.tx, seconds) }
  }
}

/** What ifconfig's media options say of the driver's settings: only flow control and EEE. */
function settingsOf(media: IfconfigMedia): EtherSettings | null {
  if (!media.active) return null
  return {
    speed: null,
    duplex: null,
    capMbps: null,
    power: { eee: media.eee ?? false },
    jumbo: null,
    flow: media.flow,
    vlan: null,
    wol: null,
  }
}

function portBus(port: string): Pick<EtherLink, 'bus' | 'busDetail'> {
  if (/usb/i.test(port)) return { bus: 'usb', busDetail: 'USB' }
  if (/thunderbolt/i.test(port)) return { bus: 'thunderbolt', busDetail: 'Thunderbolt' }
  return { bus: null, busDetail: null }
}

function countersOf(stat: ReturnType<typeof parseNetstat>): EtherCounters {
  return {
    rxPackets: stat.rxPackets,
    txPackets: stat.txPackets,
    rxNonUnicast: null,
    rxBroadcastOctets: null,
    rxMulticast: null,
    rxErrors: stat.rxErrors,
    txErrors: stat.txErrors,
    rxDiscards: null,
    txDiscards: null,
    rxUnknown: null,
    collisions: stat.collisions,
  }
}

function routeOf(device: string, def: string | null): EtherRoute | null {
  if (def === null) return null
  if (def === device) return 'default'
  return /^utun|^ipsec|^ppp/.test(def) ? 'vpn' : 'other'
}
