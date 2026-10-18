import type { EtherLimit, EtherLink, NetEthernet } from '@shared/ethernet'
import type { GatewayEcho } from '@shared/netpath'
import { readInternet } from '../wifi/index.js'
import { gatewayEchoes, type PingStream } from '../wifi/ping-stream.js'
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

const etherEchoes = (links: readonly EtherLink[], now: number): GatewayEcho[] =>
  gatewayEchoes(
    gatewayPings,
    links.filter((l) => l.state === 'up'),
    now,
  )

const LIMITS: Record<string, EtherLimit[]> = {
  linux: ['no-log', 'no-capability', 'no-broadcast', 'no-settings'],
  darwin: ['no-log', 'no-capability', 'no-broadcast'],
}

/** The last reading that worked, kept on screen while a later one fails. */
let lastGood: NetEthernet | null = null

/**
 * The reading, never a throw: a failure comes back as the last good reading with
 * the failure in `problems`, which the pane shows as a toast - a fault on a
 * machine or adapter nobody here has tried should reach whoever can report it,
 * not a console nobody reads (the collector logs a thrown error and nothing more).
 */
export async function readEthernet(
  sampler: WindowsSampler | null,
  host: string,
): Promise<NetEthernet> {
  try {
    const net = await readOnce(sampler, host)
    lastGood = net
    return net
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      links: lastGood?.links ?? [],
      probe: lastGood?.probe ?? null,
      limits: lastGood?.limits ?? [],
      problems: [`the wired adapters could not be read: ${message}`.slice(0, 300)],
    }
  }
}

async function readOnce(sampler: WindowsSampler | null, host: string): Promise<NetEthernet> {
  if (stub !== null) return stubEthernet(stub, startedAt, Date.now())
  if (sampler !== null) return sampler.ethernet()
  reader ??= process.platform === 'linux' ? new LinuxEtherReader() : new DarwinEtherReader()
  const links = await reader.read()
  const now = Date.now()
  const gateways = etherEchoes(links, now)
  const internet = readInternet(host, now)
  return {
    links,
    probe:
      internet === undefined
        ? null
        : { at: Math.floor(now / 1000) * 1000, host, internet, gateways },
    limits: LIMITS[process.platform] ?? ['no-log'],
    problems: [],
  }
}
