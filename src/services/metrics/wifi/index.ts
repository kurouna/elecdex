import type { NetWifi, NetWifiEvents, WifiGatewayEcho, WifiLink } from '@shared/wifi'
import type { WindowsSampler } from '../windows-sampler.js'
import { DarwinWifiReader } from './darwin.js'
import { LinuxWifiReader } from './linux.js'
import { PingStream } from './ping-stream.js'
import { stubWifi, stubWifiEvents, wifiStubFrom } from './stub.js'

/**
 * The Wi-Fi pane's two sources, `net.wifi` and `net.wifi.events`.
 *
 * On Windows both are the sampler's (wifi/windows.ts), whose echo round also
 * answers the network status pane's ping. Elsewhere the link comes from the
 * platform's reader and the echoes from two long-lived pings, one to the
 * gateway and one to the same host. Neither platform's log is read (the pane
 * says so), so the events are what the pane sees happen.
 *
 * Read only while a Wi-Fi pane is seen: neither source is in `keepWhileHidden`,
 * so a pane behind a tab, or a window put away, stops every echo.
 */

const stub = wifiStubFrom(process.env.ELECDEX_WIFI_STUB)
const startedAt = Date.now()

let reader: { read(): Promise<WifiLink[]> } | null = null
const internetPing = new PingStream()
/** One stream per connected adapter's gateway, by the adapter's id. */
const gatewayPings = new Map<string, PingStream>()

/** Each connected adapter's gateway echo; streams for adapters gone are ended. */
function gatewayEchoes(links: readonly WifiLink[], now: number): WifiGatewayEcho[] {
  const up = links.filter((l) => l.state === 'connected' && l.gateway !== null).slice(0, 4)
  for (const [id, stream] of gatewayPings) {
    if (up.some((l) => l.id === id)) continue
    stream.end()
    gatewayPings.delete(id)
  }
  const echoes: WifiGatewayEcho[] = []
  for (const link of up) {
    const stream = gatewayPings.get(link.id) ?? new PingStream()
    gatewayPings.set(link.id, stream)
    const rtt = stream.read(link.gateway, now)
    if (rtt !== undefined && link.gateway !== null)
      echoes.push({ link: link.id, address: link.gateway, rtt })
  }
  return echoes
}

export async function readWifi(sampler: WindowsSampler | null, host: string): Promise<NetWifi> {
  if (stub !== null) return stubWifi(stub, startedAt, Date.now())
  if (sampler !== null) return sampler.wifi()
  reader ??= process.platform === 'linux' ? new LinuxWifiReader() : new DarwinWifiReader()
  const links = await reader.read()
  const now = Date.now()
  const gateways = gatewayEchoes(links, now)
  const internet = internetPing.read(host, now)
  return {
    links,
    probe:
      internet === undefined
        ? null
        : {
            at: Math.floor(now / 1000) * 1000,
            host,
            internet,
            gateways,
          },
    limits:
      process.platform === 'darwin'
        ? ['bssid-location', 'ssid-location', 'no-log', 'no-counters']
        : ['bssid-location', 'no-log'],
  }
}

/**
 * The internet's round trip from the Wi-Fi pane's own echoes, while they run;
 * undefined otherwise, and the network status pane pings for itself.
 */
export function sharedInternetPing(host: string): number | null | undefined {
  return stub === null ? internetPing.peek(host) : undefined
}

export async function readWifiEvents(sampler: WindowsSampler | null): Promise<NetWifiEvents> {
  if (stub !== null) return stubWifiEvents(stub, startedAt)
  if (sampler !== null) return sampler.wifiEvents()
  return { events: [] }
}
