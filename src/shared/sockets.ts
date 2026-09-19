import type { NetSocket, SocketState } from './metrics.js'

/**
 * What the connections pane makes of a socket table: naming, grouping and
 * ordering. Pure, so the decisions the pane draws are unit-tested rather than
 * read off the screen.
 */

/** Stable across samples, so a row that is still there is the same row. */
export function socketKey(socket: NetSocket): string {
  return `${socket.pid}/${socket.localPort}/${socket.remoteAddress}/${socket.remotePort}`
}

/** Four letters, because the column is four letters wide. */
export const STATE_LABEL: Record<SocketState, string> = {
  established: 'ESTB',
  listen: 'LSTN',
  'syn-sent': 'SYN>',
  'syn-recv': 'SYN<',
  'fin-wait': 'FIN.',
  'time-wait': 'TIME',
  'close-wait': 'CLSW',
  'last-ack': 'LACK',
  closing: 'CLSG',
  closed: 'CLSD',
  unknown: '????',
}

/**
 * Well-known ports worth naming. Only the ones a person would recognise on their
 * own machine: naming every registered port would turn a useful hint into noise,
 * and a high port belongs to whoever grabbed it, not to whatever IANA wrote down.
 */
const SERVICES: Record<number, string> = {
  20: 'ftp',
  21: 'ftp',
  22: 'ssh',
  23: 'telnet',
  25: 'smtp',
  53: 'dns',
  80: 'http',
  110: 'pop3',
  123: 'ntp',
  143: 'imap',
  443: 'https',
  445: 'smb',
  465: 'smtps',
  587: 'smtp',
  993: 'imaps',
  995: 'pop3s',
  1433: 'mssql',
  3000: 'dev',
  3306: 'mysql',
  3389: 'rdp',
  5432: 'postgres',
  5173: 'vite',
  5900: 'vnc',
  6379: 'redis',
  8080: 'http-alt',
  8443: 'https-alt',
  9229: 'node-dbg',
  27017: 'mongo',
}

/** The service a port is known for, or '' when it is nobody's in particular. */
export const serviceOf = (port: number): string => SERVICES[port] ?? ''

/** `1.2.3.4:443`, and `[2001:db8::1]:443` for IPv6, as every tool writes it. */
export function endpoint(address: string, port: number): string {
  if (address === '') return `:${port}`
  return address.includes(':') ? `[${address}]:${port}` : `${address}:${port}`
}

/** What the pane is showing: the conversations, or the doors left open. */
export type SocketView = 'active' | 'listening'

export function inView(socket: NetSocket, view: SocketView): boolean {
  return view === 'listening' ? socket.state === 'listen' : socket.state !== 'listen'
}

/**
 * Text a row is searched by. Everything visible in it, so what the user filters
 * on is what they can see - no hidden field quietly matching.
 */
export function rowText(socket: NetSocket): string {
  return [
    socket.process,
    String(socket.pid),
    endpoint(socket.localAddress, socket.localPort),
    endpoint(socket.remoteAddress, socket.remotePort),
    serviceOf(socket.remotePort),
    serviceOf(socket.localPort),
    socket.country,
    STATE_LABEL[socket.state],
  ]
    .join(' ')
    .toLowerCase()
}

export function matches(socket: NetSocket, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return needle === '' || rowText(socket).includes(needle)
}

/**
 * Rows in the order they are read: the peers that left this machine first, then
 * the rest, each group by process and port.
 *
 * Connections to the internet are what the pane is for, so they go on top; a row
 * without an owner sorts by its port rather than falling to the bottom.
 */
export function sortSockets(sockets: readonly NetSocket[]): NetSocket[] {
  return [...sockets].sort(
    (a, b) =>
      Number(b.publicPeer) - Number(a.publicPeer) ||
      a.process.localeCompare(b.process) ||
      a.pid - b.pid ||
      a.remotePort - b.remotePort ||
      a.localPort - b.localPort,
  )
}

export interface SocketGroup {
  /** The process name, or its pid where it has no name, or 'unknown'. */
  name: string
  pid: number
  sockets: NetSocket[]
  /** Distinct countries among the peers, most connections first. */
  countries: string[]
  /** Peers on the public internet. */
  outside: number
}

/**
 * Groups rows by the program holding them, like modules in a rack.
 *
 * A machine's socket table is mostly one program repeated - a browser holds
 * dozens - so the process is the unit worth reading, and the rows under it are
 * the detail.
 */
export function groupByProcess(sockets: readonly NetSocket[]): SocketGroup[] {
  const groups = new Map<string, SocketGroup>()
  for (const socket of sockets) {
    const key = socket.pid === 0 ? `name:${socket.process}` : `pid:${socket.pid}`
    const group = groups.get(key) ?? {
      name: socket.process || (socket.pid === 0 ? 'unknown' : `pid ${socket.pid}`),
      pid: socket.pid,
      sockets: [],
      countries: [],
      outside: 0,
    }
    group.sockets.push(socket)
    if (socket.publicPeer) group.outside += 1
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    group.countries = topCountries(group.sockets)
  }
  // The busiest outward-facing programs first: that is what the pane is watching.
  return [...groups.values()].sort(
    (a, b) =>
      b.outside - a.outside || b.sockets.length - a.sockets.length || a.name.localeCompare(b.name),
  )
}

function topCountries(sockets: readonly NetSocket[]): string[] {
  const counts = new Map<string, number>()
  for (const socket of sockets) {
    if (socket.country === '') continue
    counts.set(socket.country, (counts.get(socket.country) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([code]) => code)
}

/**
 * Hides the second half of an address, for a screenshot or a shared screen.
 *
 * Half of an IPv4 address still says which network it is; the rest is what
 * identifies a machine, so it is the rest that goes.
 */
export function maskAddress(address: string): string {
  if (address === '') return ''
  if (address.includes(':')) {
    const groups = address.split(':')
    return `${groups.slice(0, 2).join(':')}:····`
  }
  const octets = address.split('.')
  if (octets.length !== 4) return address
  return `${octets[0]}.${octets[1]}.·.·`
}
