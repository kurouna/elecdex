import { existsSync, readFileSync } from 'node:fs'
import type { ElectronApplication } from '@playwright/test'

/**
 * What leaves the machine: every request main makes, or that a session of the app sends, to a
 * host that is not this one (CLAUDE.md, Tests: "Tests never contact external services").
 *
 * Opt-in, from the test side only. `recordExternalRequests` wraps, in main, every way a request
 * can start - Electron's `net.fetch` and `net.request`, Node's global `fetch`, `http(s).request`
 * and `get`, `net.connect`, `tls.connect`, `dns.lookup` - and listens on every session's
 * `webRequest` with observers only (`onSendHeaders`, `onBeforeRedirect`, `onCompleted`,
 * `onErrorOccurred`; the app registers none, and these never hold a request). A request
 * to 127.0.0.1, ::1 or localhost is not noted; anything else is, before it is made.
 *
 * What it cannot see:
 *  - what happened before it was installed: main's start (an `app.evaluate` runs once the window
 *    is up). `netLogArgs` and `netLogHosts` cover that for Chromium's network stack (every
 *    session, `net.fetch` too) from the very first request, through Chromium's own net log; Node's
 *    own requests at start are not covered by anything a test can do.
 *  - other processes: the metrics collector (a utilityProcess) and the Windows sampler it starts.
 *    Their internet echo (`PING_HOST`, services/metrics/sources.ts) is ICMP and not a request at
 *    all; contracts/no-external.spec.ts reads it from the samples instead.
 */

/** One request noted: by what, and to where. */
export type ExternalRequest = string

/**
 * Starts noting requests to other hosts in main. Safe to call twice; what the app does is
 * unchanged, only watched.
 */
export async function recordExternalRequests(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ app: electronApp, net, session }) => {
    const g = globalThis as { __e2eExternal?: string[] }
    if (g.__e2eExternal !== undefined) return
    const seen: string[] = []
    g.__e2eExternal = seen

    const local = (raw: string): boolean => {
      const host = raw
        .toLowerCase()
        .replace(/^\[|\]$/g, '')
        .replace(/^::ffff:/, '')
      return (
        host === '' ||
        host === 'localhost' ||
        host.endsWith('.localhost') ||
        host === '::1' ||
        host === '0.0.0.0' ||
        /^127\.\d+\.\d+\.\d+$/.test(host)
      )
    }
    const note = (via: string, target: string, host: string | null): void => {
      if (host === null || local(host)) return
      const line = `${via} ${target}`.slice(0, 300)
      if (!seen.includes(line) && seen.length < 500) seen.push(line)
    }
    /** The host of a URL that goes over the network; null for app:, file:, data: and the like. */
    const hostOfUrl = (url: string): string | null => {
      try {
        const parsed = new URL(url)
        return /^(https?|wss?|ftp):$/.test(parsed.protocol) ? parsed.hostname : null
      } catch {
        return null
      }
    }
    const noteUrl = (via: string, url: unknown): void => {
      const text =
        typeof url === 'string'
          ? url
          : url instanceof URL
            ? url.href
            : typeof (url as { url?: unknown } | null)?.url === 'string'
              ? (url as { url: string }).url
              : ''
      note(via, text, hostOfUrl(text))
    }
    /** Node's request options: a URL, or an object naming a host (and not a socket path). */
    const noteOptions = (via: string, first: unknown): void => {
      if (typeof first === 'string' || first instanceof URL) {
        noteUrl(via, first)
        return
      }
      const o = (typeof first === 'object' && first !== null ? first : {}) as Record<
        string,
        unknown
      >
      // No host named is this machine: a socket path or a pipe (Docker's engine), or Node's
      // default of localhost.
      const host = String(o.hostname ?? o.host ?? 'localhost').replace(/:\d+$/, '')
      note(via, `${host}:${String(o.port ?? '')}`, host)
    }

    // Electron's net: weather, feeds, quakes, ORBIT, the AI providers, plugins.
    const netFetch = net.fetch.bind(net)
    net.fetch = ((input: unknown, init?: unknown) => {
      noteUrl('net.fetch', input)
      return netFetch(input as never, init as never)
    }) as typeof net.fetch
    const netRequest = net.request.bind(net)
    net.request = ((options: unknown) => {
      if (typeof options === 'string') noteUrl('net.request', options)
      else if (typeof (options as { url?: unknown }).url === 'string') {
        noteUrl('net.request', (options as { url: string }).url)
      } else noteOptions('net.request', options)
      return netRequest(options as never)
    }) as typeof net.request

    // Node's global fetch: the update check, markets.
    const nodeFetch = globalThis.fetch.bind(globalThis)
    globalThis.fetch = ((input: unknown, init?: unknown) => {
      noteUrl('fetch', input)
      return nodeFetch(input as never, init as never)
    }) as typeof fetch

    // Node's own sockets, under anything a library does: a module object's properties are what
    // a CommonJS caller reads, and syncBuiltinESMExports carries them to ES module imports.
    const builtin = (name: string) =>
      (
        process as unknown as { getBuiltinModule(id: string): Record<string, unknown> }
      ).getBuiltinModule(name)
    const wrap = (
      module: Record<string, unknown>,
      key: string,
      via: string,
      see: (args: unknown[]) => void,
    ) => {
      const original = module[key] as (...a: unknown[]) => unknown
      if (typeof original !== 'function') return
      module[key] = function (this: unknown, ...args: unknown[]) {
        see(args)
        return original.apply(this, args)
      }
      Object.defineProperty(module[key], 'name', { value: via })
    }
    for (const name of ['node:http', 'node:https']) {
      const mod = builtin(name)
      for (const key of ['request', 'get']) {
        wrap(mod, key, `${name}.${key}`, (args) => noteOptions(`${name.slice(5)}.${key}`, args[0]))
      }
    }
    const socketTarget = (via: string) => (args: unknown[]) => {
      const [first, second] = args
      if (typeof first === 'number') {
        const host = typeof second === 'string' ? second : 'localhost'
        note(via, `${host}:${first}`, host)
      } else noteOptions(via, first)
    }
    const nodeNet = builtin('node:net')
    wrap(nodeNet, 'connect', 'net.connect', socketTarget('net.connect'))
    wrap(nodeNet, 'createConnection', 'net.createConnection', socketTarget('net.createConnection'))
    wrap(builtin('node:tls'), 'connect', 'tls.connect', socketTarget('tls.connect'))
    const dns = builtin('node:dns')
    wrap(dns, 'lookup', 'dns.lookup', (args) =>
      note('dns.lookup', String(args[0]), String(args[0])),
    )
    const dnsPromises = dns.promises as Record<string, unknown>
    wrap(dnsPromises, 'lookup', 'dns.promises.lookup', (args) =>
      note('dns.lookup', String(args[0]), String(args[0])),
    )
    ;(builtin('node:module') as { syncBuiltinESMExports(): void }).syncBuiltinESMExports()

    // Every session: the workspace's, the web panes', a plugin's sign-in, any made later.
    const watch = (ses: Electron.Session): void => {
      const tagged = ses as Electron.Session & { __e2eExternal?: true }
      if (tagged.__e2eExternal) return
      tagged.__e2eExternal = true
      const web = ses.webRequest
      web.onSendHeaders((details) => noteUrl('session', details.url))
      web.onBeforeRedirect((details) => noteUrl('session redirect', details.redirectURL))
      web.onCompleted((details) => noteUrl('session', details.url))
      web.onErrorOccurred((details) => noteUrl('session', details.url))
    }
    watch(session.defaultSession)
    watch(session.fromPartition('persist:web'))
    electronApp.on('session-created', watch)
  })
}

/** The requests to other hosts noted since {@link recordExternalRequests}, in order. */
export const externalRequests = (app: ElectronApplication): Promise<ExternalRequest[]> =>
  app.evaluate(() => [...((globalThis as { __e2eExternal?: string[] }).__e2eExternal ?? [])])

/**
 * Electron switches that have Chromium write its net log - every request of every session and of
 * `net.fetch`, from before the first window - to `file`, for {@link netLogHosts} once the app
 * has quit (the file is whole only then).
 */
export const netLogArgs = (file: string): string[] => [`--log-net-log=${file}`]

/** The host a net log value names (a URL, `host:port`, `[v6]:port`, a bare address), or null. */
function hostIn(raw: string): string | null {
  try {
    if (raw.includes('://')) {
      const url = new URL(raw)
      return /^(https?|wss?|ftp):$/.test(url.protocol) ? url.hostname : null
    }
  } catch {
    return null
  }
  if (raw.startsWith('[')) return raw.replace(/^\[([^\]]*)\](:\d+)?$/, '$1')
  // A bare IPv6 address has colons of its own: only a host:port with one colon loses a port.
  return (raw.match(/:/g) ?? []).length === 1 ? raw.replace(/:\d+$/, '') : raw
}

/** Whether `host` (lower case, no brackets) is this machine, or no host on a network at all. */
function isLocal(host: string): boolean {
  return (
    // A name with neither a dot nor a colon is no host on a network (app://elecdex's own name).
    !/[.:]/.test(host) ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    host === '0.0.0.0' ||
    /^127\.\d+\.\d+\.\d+$/.test(host) ||
    // Chromium asks whether IPv6 reaches the internet by connecting a UDP socket to Google's
    // public DNS address and reading the route; it sends nothing (HostResolverManager's probe).
    host === '2001:4860:4860::8888'
  )
}

/** The other hosts Chromium's net log names: in URLs, host resolutions and socket addresses. */
export function netLogHosts(file: string): string[] {
  if (!existsSync(file)) return [`no net log was written at ${file}`]
  const text = readFileSync(file, 'utf8')
  const hosts = new Set<string>()
  for (const m of text.matchAll(/"(?:url|original_url|host|address)":"([^"]+)"/g)) {
    const host = hostIn(m[1] ?? '')
      ?.toLowerCase()
      .replace(/^\[|\]$/g, '')
    if (host !== undefined && host !== '' && !isLocal(host)) hosts.add(host)
  }
  return [...hosts].sort()
}
