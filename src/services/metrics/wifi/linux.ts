import { execFile } from 'node:child_process'
import { access, readdir, readFile } from 'node:fs/promises'
import os from 'node:os'
import { promisify } from 'node:util'
import { channelOf, type WifiCounters, type WifiLink, type WifiStandard } from '@shared/wifi'
import { rate } from './windows.js'

/**
 * Wi-Fi on Linux: `iw` for the link (name, frequency, signal, the bit rates
 * with their MCS and width), `iw station dump` for the retry counters, and the
 * kernel's files for the rest - byte counters, MTU, the default route and the
 * resolvers. Nothing needs root, and nothing scans. Without `iw` the link
 * still shows from /proc/net/wireless, without a name or rates.
 *
 * Not verified by hand (CLAUDE.md): the parsers are unit-tested on `iw`'s
 * documented output, and the e2e tests run the stub.
 */

const run = promisify(execFile)

export interface IwLink {
  connected: boolean
  ssid: string | null
  freqMhz: number | null
  rssi: number | null
  rxMbps: number | null
  txMbps: number | null
  widthMhz: number | null
  standard: WifiStandard | null
}

/** The standard a bit rate line names: "HE-MCS 11", "VHT-MCS 9", "MCS 7", "EHT-MCS". */
export function standardOfRate(line: string): WifiStandard | null {
  if (/\bEHT-/.test(line)) return 'be'
  if (/\bHE-/.test(line)) return 'ax'
  if (/\bVHT-/.test(line)) return 'ac'
  if (/\bMCS\b/.test(line)) return 'n'
  return null
}

/** `iw dev <if> link`. */
export function parseIwLink(text: string): IwLink {
  const field = (name: string): string | null => {
    const m = new RegExp(`^\\s*${name}:\\s*(.+)$`, 'm').exec(text)
    return m?.[1]?.trim() ?? null
  }
  const connected = /^Connected to /m.test(text)
  const rx = field('rx bitrate')
  const tx = field('tx bitrate')
  const mbps = (line: string | null): number | null => {
    const m = line === null ? null : /([\d.]+)\s*MBit\/s/.exec(line)
    return m ? Number(m[1]) : null
  }
  const width = /(\d+)MHz/.exec(tx ?? rx ?? '')
  const freq = field('freq')
  const signal = field('signal')
  return {
    connected,
    ssid: connected ? field('SSID') : null,
    freqMhz: freq === null ? null : Math.round(Number.parseFloat(freq)),
    rssi: signal === null ? null : Number.parseInt(signal, 10),
    rxMbps: mbps(rx),
    txMbps: mbps(tx),
    widthMhz: width ? Number(width[1]) : null,
    standard: standardOfRate(`${tx ?? ''} ${rx ?? ''}`),
  }
}

/** `iw dev <if> station dump`: the frame counters of the station we are associated with. */
export function parseStationDump(text: string): WifiCounters | null {
  const n = (name: string): number | null => {
    const m = new RegExp(`^\\s*${name}:\\s*(\\d+)`, 'm').exec(text)
    return m ? Number(m[1]) : null
  }
  const tx = n('tx packets')
  if (tx === null) return null
  return {
    txFrames: tx,
    rxFrames: n('rx packets') ?? 0,
    retries: n('tx retries') ?? 0,
    multiRetries: 0,
    failed: n('tx failed') ?? 0,
    ackFailures: 0,
    fcsErrors: 0,
    decryptFailures: 0,
    handshakeFailures: 0,
  }
}

/** /proc/net/wireless: link quality and level per interface, when `iw` is missing. */
export function parseProcWireless(text: string): Map<string, { quality: number; level: number }> {
  const out = new Map<string, { quality: number; level: number }>()
  for (const line of text.split('\n').slice(2)) {
    const m = /^\s*([^:]+):\s+\S+\s+([\d.]+)\.?\s+(-?[\d.]+)\.?/.exec(line)
    if (m?.[1] && m[2] && m[3]) out.set(m[1].trim(), { quality: Number(m[2]), level: Number(m[3]) })
  }
  return out
}

/** The default gateway of an interface from /proc/net/route (little-endian hex). */
export function gatewayFromRoute(text: string, iface: string): string | null {
  for (const line of text.split('\n').slice(1)) {
    const f = line.trim().split(/\s+/)
    if (f[0] !== iface || f[1] !== '00000000' || f[2] === undefined) continue
    const hex = f[2]
    const bytes = [6, 4, 2, 0].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
    if (bytes.some((b) => Number.isNaN(b))) return null
    return bytes.join('.')
  }
  return null
}

/** `nameserver` lines of resolv.conf. */
export function resolvers(text: string): string[] {
  return [...text.matchAll(/^\s*nameserver\s+(\S+)/gm)].map((m) => m[1] ?? '').slice(0, 4)
}

const readText = (path: string): Promise<string> => readFile(path, 'utf8').catch(() => '')

const exists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  )

/**
 * The wireless interfaces: those with a `phy80211` link (cfg80211, every modern
 * driver) or the older `wireless` folder, which a kernel built without the
 * wireless extensions no longer makes.
 */
async function wirelessInterfaces(): Promise<string[]> {
  const names = await readdir('/sys/class/net').catch(() => [] as string[])
  const found: string[] = []
  for (const name of names) {
    const base = `/sys/class/net/${name}`
    if ((await exists(`${base}/phy80211`)) || (await exists(`${base}/wireless`))) found.push(name)
  }
  return found.slice(0, 8)
}

async function iw(args: string[]): Promise<string | null> {
  try {
    const { stdout } = await run('iw', args, { timeout: 2000 })
    return stdout
  } catch {
    return null
  }
}

interface Bytes {
  at: number
  rx: number
  tx: number
}

export class LinuxWifiReader {
  private readonly bytes = new Map<string, Bytes>()

  async read(): Promise<WifiLink[]> {
    const names = await wirelessInterfaces()
    const [route, resolv, proc] = await Promise.all([
      readText('/proc/net/route'),
      readText('/etc/resolv.conf'),
      readText('/proc/net/wireless'),
    ])
    const levels = parseProcWireless(proc)
    return Promise.all(names.map((name) => this.link(name, route, resolvers(resolv), levels)))
  }

  private async link(
    name: string,
    route: string,
    dns: string[],
    levels: Map<string, { quality: number; level: number }>,
  ): Promise<WifiLink> {
    const base = `/sys/class/net/${name}`
    const [linkText, dump, operstate, mtu, rx, tx] = await Promise.all([
      iw(['dev', name, 'link']),
      iw(['dev', name, 'station', 'dump']),
      readText(`${base}/operstate`),
      readText(`${base}/mtu`),
      readText(`${base}/statistics/rx_bytes`),
      readText(`${base}/statistics/tx_bytes`),
    ])
    const iwLink = linkText === null ? null : parseIwLink(linkText)
    return {
      id: name,
      adapter: name,
      state: (iwLink?.connected ?? operstate.trim() === 'up') ? 'connected' : 'disconnected',
      ...radioOf(iwLink, levels.get(name)),
      ...addressesOf(name),
      gateway: gatewayFromRoute(route, name),
      dns,
      mtu: Number(mtu) || null,
      ...this.rates(name, Number(rx) || 0, Number(tx) || 0),
      counters: dump === null ? null : parseStationDump(dump),
    }
  }

  private rates(name: string, rx: number, tx: number): Pick<WifiLink, 'rxSec' | 'txSec'> {
    const now = Date.now()
    const before = this.bytes.get(name)
    this.bytes.set(name, { at: now, rx, tx })
    if (before === undefined) return { rxSec: null, txSec: null }
    const seconds = (now - before.at) / 1000
    return { rxSec: rate(rx, before.rx, seconds), txSec: rate(tx, before.tx, seconds) }
  }
}

type LinuxRadio = Omit<
  WifiLink,
  | 'id'
  | 'adapter'
  | 'state'
  | 'mac'
  | 'ip4'
  | 'prefix4'
  | 'ip6'
  | 'gateway'
  | 'dns'
  | 'mtu'
  | 'rxSec'
  | 'txSec'
  | 'counters'
>

/** What `iw` (or, without it, /proc/net/wireless) tells of the radio. */
function radioOf(
  iwLink: IwLink | null,
  level: { quality: number; level: number } | undefined,
): LinuxRadio {
  const freq = iwLink?.freqMhz ?? null
  return {
    ssid: iwLink?.ssid ?? null,
    standard: iwLink?.standard ?? null,
    freqMhz: freq,
    channel: channelOf(freq),
    widthMhz: iwLink?.widthMhz ?? null,
    rssi: iwLink?.rssi ?? level?.level ?? null,
    noise: null,
    // /proc/net/wireless counts quality out of 70.
    quality: level === undefined ? null : Math.round((level.quality / 70) * 100),
    rxMbps: iwLink?.rxMbps ?? null,
    txMbps: iwLink?.txMbps ?? null,
    radios: [],
    security: null,
    cipher: null,
    internet: null,
    metered: null,
    backgroundScan: null,
    streamingMode: null,
    dhcp: null,
    leaseSeconds: null,
  }
}

function addressesOf(name: string): Pick<WifiLink, 'mac' | 'ip4' | 'prefix4' | 'ip6'> {
  const addresses = os.networkInterfaces()[name] ?? []
  const v4 = addresses.find((a) => a.family === 'IPv4')
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
