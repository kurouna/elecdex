import { splitCommandLine } from '@shared/command-line'
import type { NetSocket } from '@shared/metrics'
import {
  METRIC_SOURCE_IDS,
  PLUGIN_METRIC_SOURCE_IDS,
  PRIVATE_METRIC_SOURCE_IDS,
} from '@shared/metrics'
import {
  endpoint,
  groupByProcess,
  inView,
  maskAddress,
  matches,
  serviceOf,
  socketKey,
  sortSockets,
} from '@shared/sockets'
import { describe, expect, it } from 'vitest'
import { isPublicAddress } from '../../src/services/metrics/net-connections.js'
import { place } from '../../src/services/metrics/sockets/common.js'
import { parseBsdSockets } from '../../src/services/metrics/sockets/darwin.js'
import {
  identifyOwner,
  listenerOwners,
  type RawCommand,
} from '../../src/services/metrics/sockets/identify.js'
import { MAX_SOCKETS, summarize } from '../../src/services/metrics/sockets/index.js'
import { parseProcSockets } from '../../src/services/metrics/sockets/linux.js'
import { noneOwned, parseSamplerSockets } from '../../src/services/metrics/sockets/windows.js'
import { establishedRemotes, parseSamplerLine } from '../../src/services/metrics/windows-sampler.js'

/**
 * The socket table behind the connections pane.
 *
 * Three platforms read three different tables; what is tested here is that they
 * all arrive as the same row, that the peer is placed the same way the globe
 * places it, and that nothing about a socket reaches a plugin.
 */

const socket = (over: Partial<NetSocket> = {}): NetSocket => ({
  family: 4,
  localAddress: '192.0.2.2',
  localPort: 4000,
  remoteAddress: '93.184.216.34',
  remotePort: 443,
  state: 'established',
  pid: 100,
  process: 'firefox',
  country: 'US',
  publicPeer: true,
  ...over,
})

describe('the Linux table', () => {
  const tcp = [
    '  sl  local_address rem_address   st tx_rx_rcv tx_rx_snd tr tm->when retrnsmt   uid  timeout inode',
    '   0: 0100007F:0CEA 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 4021',
    '   1: 0A00020F:A2C4 08080808:01BB 01 00000000:00000000 00:00000000 00000000  1000        0 4022',
    '   2: 0A00020F:A2C6 0101A8C0:0016 06 00000000:00000000 00:00000000 00000000  1000        0 4023',
  ].join('\n')

  it('reads every socket, not only the established ones, with its state and inode', () => {
    const rows = parseProcSockets(tcp, 4)
    expect(rows.map((row) => row.state)).toEqual(['listen', 'established', 'time-wait'])
    expect(rows[0]).toMatchObject({ localAddress: '127.0.0.1', localPort: 3306, inode: '4021' })
    expect(rows[1]).toMatchObject({ remoteAddress: '8.8.8.8', remotePort: 443, inode: '4022' })
  })

  it('reads the IPv6 table, including a dual-stack socket talking to an IPv4 peer', () => {
    const tcp6 = [
      '  sl  local_address                         rem_address                           st a b c d e f inode',
      '   0: 0000000000000000FFFF00000F02000A:A2C4 0000000000000000FFFF000008080808:01BB 01 0 0 0 0 0 91',
    ].join('\n')
    const rows = parseProcSockets(tcp6, 6)
    expect(rows[0]).toMatchObject({
      family: 6,
      remoteAddress: '::ffff:8.8.8.8',
      state: 'established',
    })
    // `place` is what unwraps it, so the pane and the GeoIP database both see 8.8.8.8.
    const placed = place(rows[0] as never, () => 'US', isPublicAddress)
    expect(placed.remoteAddress).toBe('8.8.8.8')
    expect(placed.country).toBe('US')
  })
})

describe('the macOS table', () => {
  it('reads BSD endpoints, where the port is after the last dot', () => {
    const out = [
      'Active Internet connections (including servers)',
      'Proto Recv-Q Send-Q  Local Address          Foreign Address        (state)',
      'tcp4       0      0  192.168.1.20.52344     93.184.216.34.443      ESTABLISHED',
      'tcp6       0      0  2001:db8::20.52345     2606:2800:220:1::1.443 ESTABLISHED',
      'tcp4       0      0  *.22                   *.*                    LISTEN',
    ].join('\n')
    const rows = parseBsdSockets(out)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      localPort: 52_344,
      remoteAddress: '93.184.216.34',
      remotePort: 443,
    })
    expect(rows[1]).toMatchObject({ family: 6, remoteAddress: '2606:2800:220:1::1' })
    expect(rows[2]).toMatchObject({ state: 'listen', localAddress: '', localPort: 22 })
  })
})

describe('the Windows table', () => {
  const rows = [
    '4|5|192.0.2.2|4821|93.184.216.34|443|2140',
    '4|2|0.0.0.0|22|0.0.0.0|0|812',
    '6|5|::1|5310|::1|9229|3312',
  ]

  it('unpacks a row and names the process from the same tick', () => {
    const names = new Map([
      [2140, 'firefox'],
      [812, 'sshd'],
    ])
    const parsed = parseSamplerSockets(rows, names)
    expect(parsed[0]).toMatchObject({ state: 'established', remotePort: 443, process: 'firefox' })
    expect(parsed[1]).toMatchObject({ state: 'listen', localPort: 22, process: 'sshd' })
    // A pid the process table did not carry loses its name rather than the row.
    expect(parsed[2]).toMatchObject({ family: 6, process: '' })
  })

  it('does not credit the idle process with every socket', () => {
    // Before the P/Invoke has compiled, and on a machine that cannot compile it,
    // the fallback table carries no owners and writes pid 0 - and the process
    // table has a name for pid 0, so every row was shown as "Idle".
    const fallback = rows.map((row) => row.replace(/\|\d+$/, '|0'))
    const parsed = parseSamplerSockets(fallback, new Map([[0, 'Idle']]))
    expect(parsed.every((socket) => socket.process === '')).toBe(true)
    expect(noneOwned(parsed)).toBe(true)
    expect(noneOwned(parseSamplerSockets(rows, new Map()))).toBe(false)
    expect(noneOwned([])).toBe(false)
  })

  it('keeps the globe working off the same emit', () => {
    expect(establishedRemotes(rows)).toEqual(['93.184.216.34', '::1'])
  })

  it('takes the packed rows off the wire, including the one-row collapse', () => {
    expect(parseSamplerLine('{"t":"tcp","data":["4|5|a|1|b|2|3"]}')).toEqual({
      kind: 'tcp',
      rows: ['4|5|a|1|b|2|3'],
    })
    expect(parseSamplerLine('{"t":"tcp","data":"4|5|a|1|b|2|3"}')).toEqual({
      kind: 'tcp',
      rows: ['4|5|a|1|b|2|3'],
    })
  })

  it('takes the listeners off the wire, one or many, with long lines cut', () => {
    const one = parseSamplerLine(
      '{"t":"lsnr","data":{"p":12,"e":"C:\\\\node.exe","c":"node a.js"}}',
    )
    expect(one).toEqual({ kind: 'lsnr', data: [{ p: 12, e: 'C:\\node.exe', c: 'node a.js' }] })
    const long = parseSamplerLine(
      JSON.stringify({ t: 'lsnr', data: [{ p: 1, e: '', c: 'x'.repeat(9000) }] }),
    )
    expect(long?.kind === 'lsnr' && long.data[0]?.c.length).toBe(4096)
    expect(parseSamplerLine('{"t":"lsnr","data":[]}')).toEqual({ kind: 'lsnr', data: [] })
  })
})

describe('what a listening process is', () => {
  const win = (commandLine: string, exe = ''): RawCommand => ({ pid: 1, exe, commandLine, cwd: '' })
  const nix = (args: string[], cwd = ''): RawCommand => ({
    pid: 1,
    exe: '',
    commandLine: args.join(String.fromCharCode(0)),
    cwd,
  })

  it('splits a Windows command line as the C runtime does', () => {
    expect(splitCommandLine('"C:\\Program Files\\nodejs\\node.exe" a.js --port 5')).toEqual([
      'C:\\Program Files\\nodejs\\node.exe',
      'a.js',
      '--port',
      '5',
    ])
    // Backslashes are literal unless they come before a quote.
    expect(splitCommandLine('x "a\\\\" b\\c "d\\"e" ""')).toEqual(['x', 'a\\', 'b\\c', 'd"e', ''])
  })

  it('names the package a node server runs and the project it serves', () => {
    const vite = win(
      '"C:\\Program Files\\nodejs\\node.exe" C:\\work\\elecdex\\node_modules\\vite\\bin\\vite.js --port 5173',
      'C:\\Program Files\\nodejs\\node.exe',
    )
    expect(identifyOwner(vite)).toEqual({ tool: 'vite', project: 'elecdex' })
    const next = nix(['node', '/home/u/shop/node_modules/.bin/next', 'dev'])
    expect(identifyOwner(next)).toEqual({ tool: 'next', project: 'shop' })
    const scoped = nix(['node', '/w/app/node_modules/@angular/cli/bin/ng.js', 'serve'])
    expect(identifyOwner(scoped).tool).toBe('@angular/cli')
  })

  it('names a plain script by its file and its folder, or the working directory', () => {
    expect(identifyOwner(win('node --inspect C:\\src\\api\\server.js'))).toEqual({
      tool: 'server',
      project: 'api',
    })
    expect(identifyOwner(nix(['node', 'index.js'], '/home/u/blog'))).toEqual({
      tool: 'index',
      project: 'blog',
    })
    expect(identifyOwner(nix(['deno', 'run', '-A', '/p/bot/main.ts']))).toEqual({
      tool: 'main',
      project: 'bot',
    })
  })

  it('names a Python module or script, and sees through a venv', () => {
    expect(identifyOwner(nix(['python3', '-m', 'http.server', '8000'], '/home/u/site'))).toEqual({
      tool: 'http.server',
      project: 'site',
    })
    const venv = win(
      'C:\\p\\ml\\.venv\\Scripts\\python.exe C:\\p\\ml\\.venv\\Scripts\\uvicorn-script.py app:app',
    )
    expect(identifyOwner(venv)).toEqual({ tool: 'uvicorn-script', project: 'ml' })
  })

  it('names what svchost hosts, and says nothing about a program its name already names', () => {
    expect(identifyOwner(win('C:\\Windows\\system32\\svchost.exe -k RPCSS -p')).tool).toBe('RPCSS')
    expect(
      identifyOwner(win('C:\\Windows\\system32\\svchost.exe -k netsvcs -s Dnscache')).tool,
    ).toBe('Dnscache')
    expect(identifyOwner(nix(['postgres', '-D', '/var/lib/postgresql']))).toEqual({
      tool: '',
      project: '',
    })
    // A process that was not ours to read has neither an executable nor a line.
    expect(identifyOwner(win(''))).toEqual({ tool: '', project: '' })
  })

  it('keeps only what it can say, and never the command line itself', () => {
    const owners = listenerOwners([
      { ...win('node C:\\a\\b\\tool.js --token=SECRET'), pid: 7 },
      { ...win(''), pid: 8 },
    ])
    expect(owners).toEqual({ '7': { tool: 'tool', project: 'b' } })
    expect(JSON.stringify(owners)).not.toContain('SECRET')
  })

  it('cuts a long name rather than letting it push the row about', () => {
    const tool = identifyOwner(win(`node C:\\p\\x\\${'a'.repeat(80)}.js`)).tool
    expect(tool).toHaveLength(40)
    expect(tool.endsWith('…')).toBe(true)
  })
})

describe('placing a peer', () => {
  it("never places a private address, and empties a listening socket's peer", () => {
    const lan = place(
      {
        family: 4,
        localAddress: '192.168.1.5',
        localPort: 5000,
        remoteAddress: '192.168.1.9',
        remotePort: 445,
        state: 'established',
        pid: 1,
        process: 'smbd',
      },
      () => 'US',
      isPublicAddress,
    )
    expect(lan.publicPeer).toBe(false)
    expect(lan.country).toBe('')

    const listening = place(
      {
        family: 4,
        localAddress: '0.0.0.0',
        localPort: 22,
        remoteAddress: '0.0.0.0',
        remotePort: 12_345,
        state: 'listen',
        pid: 2,
        process: 'sshd',
      },
      () => 'US',
      isPublicAddress,
    )
    expect(listening.remoteAddress).toBe('')
    expect(listening.remotePort).toBe(0)
  })
})

describe('summarize', () => {
  it('counts the whole table and keeps the rows worth drawing', () => {
    const many = [
      ...Array.from({ length: MAX_SOCKETS }, (_, i) =>
        socket({ localPort: 10_000 + i, state: 'time-wait', publicPeer: false, country: '' }),
      ),
      socket({ localPort: 9000 }),
      socket({ localPort: 22, state: 'listen', publicPeer: false, country: '' }),
    ]
    const out = summarize(many, false)
    expect(out.sockets).toHaveLength(MAX_SOCKETS)
    expect(out.established).toBe(1)
    expect(out.listening).toBe(1)
    expect(out.dropped).toBe(2)
    // The peer on the internet is the reason the pane exists: it is kept first.
    expect(out.sockets[0]?.localPort).toBe(9000)
  })
})

describe('what the pane makes of a table', () => {
  it('names the ports a person would recognise, and nobody else', () => {
    expect(serviceOf(443)).toBe('https')
    expect(serviceOf(5432)).toBe('postgres')
    expect(serviceOf(49_152)).toBe('')
  })

  it('writes an endpoint the way every tool writes it', () => {
    expect(endpoint('8.8.8.8', 443)).toBe('8.8.8.8:443')
    expect(endpoint('2001:db8::1', 443)).toBe('[2001:db8::1]:443')
  })

  it('splits the two views so a socket is in exactly one of them', () => {
    const listening = socket({ state: 'listen' })
    expect(inView(listening, 'listening')).toBe(true)
    expect(inView(listening, 'active')).toBe(false)
    expect(inView(socket({ state: 'time-wait' }), 'active')).toBe(true)
  })

  it('filters on what the row shows, so a match is always visible', () => {
    expect(matches(socket(), 'https')).toBe(true)
    expect(matches(socket(), 'FIREFOX')).toBe(true)
    expect(matches(socket(), '216.34')).toBe(true)
    expect(matches(socket(), 'chrome')).toBe(false)
    expect(matches(socket(), '  ')).toBe(true)
  })

  it('puts the peers outside this network first', () => {
    const order = sortSockets([
      socket({ process: 'zsh', publicPeer: false, localPort: 1 }),
      socket({ process: 'aria', publicPeer: true, localPort: 2 }),
    ])
    expect(order.map((entry) => entry.localPort)).toEqual([2, 1])
  })

  it('groups by the program, busiest outward first, and keeps two pids apart', () => {
    const groups = groupByProcess([
      socket({ pid: 1, process: 'quiet', publicPeer: false, country: '' }),
      socket({ pid: 2, process: 'busy', country: 'US' }),
      socket({ pid: 2, process: 'busy', country: 'JP' }),
      socket({ pid: 3, process: 'busy', country: 'US' }),
    ])
    expect(groups.map((group) => [group.name, group.pid, group.sockets.length])).toEqual([
      ['busy', 2, 2],
      ['busy', 3, 1],
      ['quiet', 1, 1],
    ])
    expect(groups[0]?.countries).toEqual(['JP', 'US'])
  })

  it('gives a socket a key that survives the next reading', () => {
    expect(socketKey(socket())).toBe(socketKey(socket({ state: 'close-wait' })))
    expect(socketKey(socket())).not.toBe(socketKey(socket({ localPort: 1 })))
  })

  it('tells apart two listening sockets that differ only in their stack', () => {
    // A service bound to both holds 0.0.0.0:22 and [::]:22: same pid, same port,
    // no peer. One key for both makes the pane's keyed list throw.
    const listen = {
      state: 'listen' as const,
      pid: 812,
      localPort: 22,
      remoteAddress: '',
      remotePort: 0,
    }
    expect(socketKey(socket({ ...listen, family: 4, localAddress: '0.0.0.0' }))).not.toBe(
      socketKey(socket({ ...listen, family: 6, localAddress: '::' })),
    )
  })

  it('masks the half of an address that identifies a machine', () => {
    expect(maskAddress('93.184.216.34')).toBe('93.184.·.·')
    expect(maskAddress('2001:db8:1:2::9')).toBe('2001:db8:····')
    expect(maskAddress('')).toBe('')
  })
})

describe('what a plugin may be granted', () => {
  it('leaves the socket table out, and accounts for every other source', () => {
    expect(PLUGIN_METRIC_SOURCE_IDS).not.toContain('net.sockets')
    expect(PRIVATE_METRIC_SOURCE_IDS).toContain('net.sockets')
    // A new source has to be put in one list or the other on purpose.
    expect([...PLUGIN_METRIC_SOURCE_IDS, ...PRIVATE_METRIC_SOURCE_IDS].sort()).toEqual(
      [...METRIC_SOURCE_IDS].sort(),
    )
  })
})
