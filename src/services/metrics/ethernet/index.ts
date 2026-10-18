import type { EtherLimit, EtherLink, NetEthernet } from '@shared/ethernet'
import type { GatewayEcho } from '@shared/netpath'
import { readInternet } from '../wifi/index.js'
import { PingStream } from '../wifi/ping-stream.js'
import type { WindowsSampler } from '../windows-sampler.js'
import { DarwinEtherReader } from './darwin.js'
import { LinuxEtherReader } from './linux.js'
import { etherStubFrom, stubEthernet } from './stub.js'

/**
 * The Ethernet pane's source, `net.ethernet` (architecture.md §5.23).
 *
 * On Windows it is the sampler's (ethernet/windows.ts), whose echo round also
 * serves the Wi-Fi and network status panes. Elsewhere the links come from the
 * platform's reader and each connected port's gateway from a long-lived ping
 * sent from that port. The internet's echo is the one stream the Wi-Fi pane and
 * the network status pane read too (wifi/index.ts).
 *
 * Read only while an Ethernet pane is seen: the source is not in
 * `keepWhileHidden`. No operating system keeps a log of a wired link's drops
 * that every driver writes, so there is no events source: the pane's log is
 * what it saw.
 */

const stub = etherStubFrom(process.env.ELECDEX_ETHER_STUB)
const startedAt = Date.now()

let reader: { read(): Promise<EtherLink[]> } | null = null
const gatewayPings = new Map<string, PingStream>()

function gatewayEchoes(links: readonly EtherLink[], now: number): GatewayEcho[] {
  const up = links.filter((l) => l.state === 'up' && l.gateway !== null).slice(0, 4)
  for (const [id, stream] of gatewayPings) {
    if (up.some((l) => l.id === id)) continue
    stream.end()
    gatewayPings.delete(id)
  }
  const echoes: GatewayEcho[] = []
  for (const link of up) {
    const stream = gatewayPings.get(link.id) ?? new PingStream()
    gatewayPings.set(link.id, stream)
    // From this port: its interface on Linux, its address on macOS.
    const source = process.platform === 'darwin' ? link.ip4 : link.id
    const rtt = stream.read(link.gateway, now, source)
    if (rtt !== undefined && link.gateway !== null)
      echoes.push({ link: link.id, address: link.gateway, rtt })
  }
  return echoes
}

const LIMITS: Record<string, EtherLimit[]> = {
  linux: ['no-log', 'no-capability', 'no-broadcast', 'no-settings'],
  darwin: ['no-log', 'no-capability', 'no-broadcast'],
}

export async function readEthernet(
  sampler: WindowsSampler | null,
  host: string,
): Promise<NetEthernet> {
  if (stub !== null) return stubEthernet(stub, startedAt, Date.now())
  if (sampler !== null) return sampler.ethernet()
  reader ??= process.platform === 'linux' ? new LinuxEtherReader() : new DarwinEtherReader()
  const links = await reader.read()
  const now = Date.now()
  const gateways = gatewayEchoes(links, now)
  const internet = readInternet(host, now)
  return {
    links,
    probe:
      internet === undefined
        ? null
        : { at: Math.floor(now / 1000) * 1000, host, internet, gateways },
    limits: LIMITS[process.platform] ?? ['no-log'],
  }
}
