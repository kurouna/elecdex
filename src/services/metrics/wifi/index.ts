import type { NetWifi, NetWifiEvents, WifiLink } from '@shared/wifi'
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
const gatewayPing = new PingStream()

export async function readWifi(sampler: WindowsSampler | null, host: string): Promise<NetWifi> {
  if (stub !== null) return stubWifi(stub, startedAt, Date.now())
  if (sampler !== null) return sampler.wifi()
  reader ??= process.platform === 'linux' ? new LinuxWifiReader() : new DarwinWifiReader()
  const links = await reader.read()
  const up = links.find((link) => link.state === 'connected' && link.gateway !== null) ?? null
  const now = Date.now()
  const gateway = gatewayPing.read(up?.gateway ?? null, now)
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
            gatewayAddress: gateway === undefined ? null : (up?.gateway ?? null),
            gateway: gateway ?? null,
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
