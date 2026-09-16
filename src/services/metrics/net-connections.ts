/**
 * Established TCP connections: where this machine is talking to, by address.
 *
 * eDEX-UI asked systeminformation's networkConnections(), which runs netstat (and
 * on Windows, PowerShell) for every reading. Here Linux reads /proc/net/tcp*
 * directly, Windows gets the table from the long-lived sampler (IP Helper, see
 * windows-sampler.ts), and only macOS still runs netstat.
 *
 * The parsers and the address filter are pure and unit-tested.
 */

function isPublicV4(a: number, b: number): boolean {
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 169 && b === 254) return false // link-local
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 100 && b >= 64 && b <= 127) return false // carrier-grade NAT
  return a < 224 // not multicast or reserved
}

function isPublicV6(ip: string): boolean {
  const v6 = ip.toLowerCase()
  // Unspecified and loopback, compressed ("::1") or with every group as /proc writes them.
  if (/^[0:]*$/.test(v6) || /^[0:]*:0*1$/.test(v6)) return false
  // link-local fe80::/10, unique local fc00::/7, multicast ff00::/8
  return !/^(fe[89ab]|f[cd]|ff)/.test(v6)
}

/** True for an address on the public internet - not loopback, private, link-local or unspecified. */
export function isPublicAddress(ip: string): boolean {
  const v4 = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/i.exec(ip)
  if (v4) return isPublicV4(Number(v4[1]), Number(v4[2]))
  return ip.includes(':') && isPublicV6(ip)
}

/** Unique public remote addresses, in first-seen order. */
export function publicRemotes(addresses: Iterable<string>): string[] {
  const seen = new Set<string>()
  for (const raw of addresses) {
    const ip = raw.replace(/^::ffff:/i, '').replace(/%.*$/, '')
    if (isPublicAddress(ip)) seen.add(ip)
  }
  return [...seen]
}

/** ESTABLISHED in the kernel's tcp_states numbering. */
const TCP_ESTABLISHED = '03'

/**
 * Parses /proc/net/tcp or /proc/net/tcp6 into established remote addresses.
 * Addresses there are hex in host byte order: IPv4 as one little-endian 32-bit
 * word, IPv6 as four little-endian 32-bit words.
 */
export function parseProcNetTcp(text: string): string[] {
  const remotes: string[] = []
  for (const line of text.split('\n').slice(1)) {
    const fields = line.trim().split(/\s+/)
    if (fields.length < 4 || fields[3] !== TCP_ESTABLISHED) continue
    const address = decodeProcAddress((fields[2] ?? '').split(':')[0] ?? '')
    if (address !== null) remotes.push(address)
  }
  return remotes
}

function decodeProcAddress(hex: string): string | null {
  if (hex.length === 8) {
    const bytes = hex.match(/../g)?.map((h) => Number.parseInt(h, 16)) ?? []
    return bytes.reverse().join('.')
  }
  if (hex.length !== 32) return null
  const words = hex.match(/.{8}/g) ?? []
  const bytes = words.flatMap((w) => (w.match(/../g) ?? []).reverse())
  // A dual-stack socket talking to an IPv4 peer is listed here as ::ffff:a.b.c.d.
  // Written as eight hex groups it would pass the private-address filter and the
  // GeoIP database would not know it, so it is given in the dotted form.
  const mapped =
    bytes.slice(0, 10).every((b) => b === '00') &&
    bytes.slice(10, 12).join('').toUpperCase() === 'FFFF'
  if (mapped)
    return `::ffff:${bytes
      .slice(12)
      .map((b) => Number.parseInt(b, 16))
      .join('.')}`
  const groups: string[] = []
  for (let i = 0; i < 16; i += 2) {
    groups.push(`${bytes[i]}${bytes[i + 1]}`.replace(/^0+(?=.)/, ''))
  }
  return groups.join(':').toLowerCase()
}

/** Parses `netstat -anp tcp` (macOS/BSD): the foreign address of ESTABLISHED rows. */
export function parseBsdNetstat(text: string): string[] {
  const remotes: string[] = []
  for (const line of text.split('\n')) {
    const fields = line.trim().split(/\s+/)
    if (fields.length < 6 || !/^tcp[46]*$/.test(fields[0] ?? '') || fields[5] !== 'ESTABLISHED') {
      continue
    }
    // "93.184.216.34.443" or "2606:2800:220:1:248:1893:25c8:1946.443"
    const foreign = fields[4] ?? ''
    const dot = foreign.lastIndexOf('.')
    if (dot > 0) remotes.push(foreign.slice(0, dot))
  }
  return remotes
}
