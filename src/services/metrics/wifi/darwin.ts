import { execFile } from 'node:child_process'
import os from 'node:os'
import { promisify } from 'node:util'
import { freqOf, type WifiBand, type WifiLink, type WifiStandard } from '@shared/wifi'
import si from 'systeminformation'

/**
 * Wi-Fi on macOS, from `system_profiler SPAirPortDataType -json`: channel,
 * width, PHY mode, rate, security, and signal with the noise floor - read
 * every ten seconds, since the command takes a second or two. The network's
 * name comes back "<redacted>" from macOS 14.4 on unless the app has Location
 * Services, which elecdex never asks for; CoreWLAN would raise that very
 * prompt, so it is not used. The pane says why the name is missing.
 *
 * Not verified by hand (CLAUDE.md): the parser is unit-tested on a recorded
 * answer, and the e2e tests run the stub.
 */

const run = promisify(execFile)
const PROFILE_EVERY_MS = 10_000

type Json = Record<string, unknown>
const isJson = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)

export interface AirportLink {
  iface: string
  connected: boolean
  ssid: string | null
  channel: number | null
  band: WifiBand | null
  widthMhz: number | null
  standard: WifiStandard | null
  txMbps: number | null
  rssi: number | null
  noise: number | null
  security: string | null
}

const PHY_MODES: Record<string, WifiStandard> = {
  '802.11a': 'a',
  '802.11b': 'b',
  '802.11g': 'g',
  '802.11n': 'n',
  '802.11ac': 'ac',
  '802.11ax': 'ax',
  '802.11be': 'be',
}

/** "spairport_security_mode_wpa2_personal" -> "WPA2-Personal". */
export function airportSecurity(mode: string | null): string | null {
  if (mode === null) return null
  const m = /security_mode_(\w+?)_(personal|enterprise)(?:_mixed)?$/.exec(mode)
  if (m?.[1] && m[2])
    return `${m[1].toUpperCase().replace('WPA2_WPA3', 'WPA2/3')}-${m[2][0]?.toUpperCase()}${m[2].slice(1)}`
  if (mode.endsWith('_none')) return 'Open'
  return null
}

/** "149 (5GHz, 80MHz)" -> its band. */
export function airportBand(channel: string): WifiBand | null {
  if (/(2GHz|2\.4GHz)/.test(channel)) return '2.4'
  if (/6GHz/.test(channel)) return '6'
  if (/5GHz/.test(channel)) return '5'
  return null
}

const numberIn = (re: RegExp, text: string): number | null => {
  const m = re.exec(text)
  return m ? Number(m[1]) : null
}

function airportLink(i: Json): AirportLink {
  const current = isJson(i.spairport_current_network_information)
    ? i.spairport_current_network_information
    : null
  const channel = str(current?.spairport_network_channel) ?? ''
  const signal = str(current?.spairport_signal_noise) ?? ''
  const name = str(current?._name)
  const rate = current?.spairport_network_rate
  return {
    iface: str(i._name) ?? 'en0',
    connected: current !== null,
    ssid: name?.includes('redacted') ? null : name,
    channel: numberIn(/^(\d+)/, channel),
    band: airportBand(channel),
    widthMhz: numberIn(/(\d+)MHz/, channel),
    standard: PHY_MODES[str(current?.spairport_network_phymode) ?? ''] ?? null,
    txMbps: typeof rate === 'number' ? rate : null,
    rssi: numberIn(/^(-?\d+) dBm/, signal),
    noise: numberIn(/\/ (-?\d+) dBm/, signal),
    security: airportSecurity(str(current?.spairport_security_mode)),
  }
}

/** The current network of each interface in system_profiler's answer. */
export function parseAirport(json: unknown): AirportLink[] {
  const root = isJson(json) ? json.SPAirPortDataType : null
  const top = Array.isArray(root) ? root[0] : null
  const ifaces = isJson(top) ? top.spairport_airport_interfaces : null
  if (!Array.isArray(ifaces)) return []
  return ifaces.filter(isJson).map(airportLink)
}

export class DarwinWifiReader {
  private profile: AirportLink[] = []
  private profiledAt = 0
  private pending: Promise<void> | null = null
  private gateway: string | null = null

  async read(): Promise<WifiLink[]> {
    if (Date.now() - this.profiledAt >= PROFILE_EVERY_MS && this.pending === null) {
      this.pending = this.refresh().finally(() => {
        this.pending = null
      })
      if (this.profiledAt === 0) await this.pending
    }
    return Promise.all(this.profile.map((link) => this.link(link)))
  }

  private async refresh(): Promise<void> {
    this.profiledAt = Date.now()
    try {
      const { stdout } = await run('system_profiler', ['SPAirPortDataType', '-json'], {
        timeout: 8000,
        maxBuffer: 4 * 1024 * 1024,
      })
      this.profile = parseAirport(JSON.parse(stdout))
    } catch {
      this.profile = []
    }
    try {
      const { stdout } = await run('route', ['-n', 'get', 'default'], { timeout: 2000 })
      this.gateway = /gateway:\s*(\S+)/.exec(stdout)?.[1] ?? null
    } catch {
      this.gateway = null
    }
  }

  private async link(a: AirportLink): Promise<WifiLink> {
    const addresses = os.networkInterfaces()[a.iface] ?? []
    const v4 = addresses.find((x) => x.family === 'IPv4')
    // systeminformation asks `netstat` for the byte counters: a small process a second
    // while the pane is seen, as the network traffic pane already costs on macOS.
    const stats = await si.networkStats(a.iface).catch(() => [])
    const s = stats[0]
    return {
      id: a.iface,
      adapter: a.iface,
      state: a.connected ? 'connected' : 'disconnected',
      ssid: a.ssid,
      standard: a.standard,
      freqMhz: a.channel !== null && a.band !== null ? freqOf(a.channel, a.band) : null,
      channel: a.channel,
      widthMhz: a.widthMhz,
      rssi: a.rssi,
      noise: a.noise,
      quality: null,
      rxMbps: null,
      txMbps: a.txMbps,
      radios: [],
      security: a.security,
      cipher: null,
      internet: null,
      metered: null,
      backgroundScan: null,
      streamingMode: null,
      mac: v4?.mac ?? null,
      ip4: v4?.address ?? null,
      prefix4: v4?.cidr ? Number(v4.cidr.split('/')[1]) : null,
      ip6: addresses
        .filter((x) => x.family === 'IPv6' && !x.address.startsWith('fe80'))
        .map((x) => x.address)
        .slice(0, 4),
      gateway: this.gateway,
      dns: [],
      mtu: null,
      dhcp: null,
      leaseSeconds: null,
      rxSec: s && typeof s.rx_sec === 'number' && s.rx_sec >= 0 ? s.rx_sec : null,
      txSec: s && typeof s.tx_sec === 'number' && s.tx_sec >= 0 ? s.tx_sec : null,
      counters: null,
    }
  }
}
