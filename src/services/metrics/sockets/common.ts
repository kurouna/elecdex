import type { NetSocket, SocketState } from '@shared/metrics'

/**
 * What every platform reader produces before the collector places and caps it.
 *
 * The readers differ in where the table comes from and in whether it names an
 * owner; what they agree on is this row. Keeping the platform code behind it is
 * what lets the country lookup, the sort and the cap be written once.
 */
export interface RawSocket {
  family: 4 | 6
  localAddress: string
  localPort: number
  remoteAddress: string
  remotePort: number
  state: SocketState
  pid: number
  process: string
}

/** A reader for one platform. */
export interface SocketReader {
  read(): Promise<{ sockets: RawSocket[]; ownersUnknown: boolean }>
}

/**
 * The kernel's TCP state numbers, which Linux writes in /proc/net/tcp and
 * Windows returns from GetExtendedTcpTable. They are the same states in a
 * different order, so each reader brings its own table.
 */
export const LINUX_STATES: Record<string, SocketState> = {
  '01': 'established',
  '02': 'syn-sent',
  '03': 'syn-recv',
  '04': 'fin-wait',
  '05': 'fin-wait',
  '06': 'time-wait',
  '07': 'closed',
  '08': 'close-wait',
  '09': 'last-ack',
  '0A': 'listen',
  '0B': 'closing',
}

/** MIB_TCP_STATE, in the order iphlpapi numbers it from 1. */
export const WINDOWS_STATES: Record<number, SocketState> = {
  1: 'closed',
  2: 'listen',
  3: 'syn-sent',
  4: 'syn-recv',
  5: 'established',
  6: 'fin-wait',
  7: 'fin-wait',
  8: 'close-wait',
  9: 'closing',
  10: 'last-ack',
  11: 'time-wait',
  12: 'closed',
}

/** BSD's netstat prints the names; macOS uses these. */
export const BSD_STATES: Record<string, SocketState> = {
  ESTABLISHED: 'established',
  LISTEN: 'listen',
  SYN_SENT: 'syn-sent',
  SYN_RCVD: 'syn-recv',
  FIN_WAIT_1: 'fin-wait',
  FIN_WAIT_2: 'fin-wait',
  TIME_WAIT: 'time-wait',
  CLOSE_WAIT: 'close-wait',
  LAST_ACK: 'last-ack',
  CLOSING: 'closing',
  CLOSED: 'closed',
}

/**
 * The address as the pane should show it: an IPv4-mapped IPv6 peer written in
 * the dotted form it really is, and no interface suffix.
 *
 * The GeoIP database does not know `::ffff:8.8.8.8` either, so this is also what
 * makes a dual-stack socket's peer placeable.
 */
export function normalizeAddress(raw: string): string {
  return raw.replace(/^::ffff:/i, '').replace(/%.*$/, '')
}

/** A listening socket has no peer; different platforms spell that differently. */
export function isNoPeer(address: string, port: number): boolean {
  return port === 0 || address === '' || address === '0.0.0.0' || address === '::'
}

/** Builds the row the pane receives, with the peer placed. */
export function place(
  raw: RawSocket,
  lookup: (ip: string) => string | null,
  isPublic: (ip: string) => boolean,
): NetSocket {
  const remoteAddress = raw.state === 'listen' ? '' : normalizeAddress(raw.remoteAddress)
  const publicPeer = remoteAddress !== '' && isPublic(remoteAddress)
  return {
    family: raw.family,
    localAddress: normalizeAddress(raw.localAddress),
    localPort: raw.localPort,
    remoteAddress,
    remotePort: raw.state === 'listen' ? 0 : raw.remotePort,
    state: raw.state,
    pid: raw.pid,
    process: raw.process,
    // Placing a private address would be a lie: the database has no record of it
    // and any answer would be the RIR's, not the machine's.
    country: publicPeer ? (lookup(remoteAddress) ?? '') : '',
    publicPeer,
  }
}
