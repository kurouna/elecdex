import {
  checkPluginUrl,
  type Grant,
  PLUGIN_LIMITS,
  pluginHeaders,
  TokenBucket,
} from '@shared/plugins'

/**
 * ctx.fetch for plugins, done by main (docs/plugins.md section 7).
 *
 * Every hop of a request - the first URL and each redirect - is checked against what the
 * user granted the plugin, from settings.json; what the renderer says a plugin declared
 * is not trusted. Hosts in the plugin's session list go out with its own cookies, the
 * rest with none.
 */

export interface PluginResponseData {
  status: number
  headers: Record<string, string>
  body: string
}

/** One GET, following no redirect: the response, or where it redirects. */
export type RawRequest = (options: {
  url: string
  /** Use the plugin's own sign-in session (cookies) rather than the shared cookieless one. */
  session: boolean
  headers: Record<string, string>
  maxBytes: number
  timeoutMs: number
}) => Promise<
  | { redirect: string }
  | { status: number; headers: Record<string, string | string[]>; body: Uint8Array }
>

export interface PluginNetDeps {
  /** What the user granted an enabled plugin; null when it is not enabled. */
  grant(id: string): Grant | null
  request(id: string, options: Parameters<RawRequest>[0]): ReturnType<RawRequest>
  now(): number
  /** Test runs only: host -> 127.0.0.1:port served over plain http. */
  hostMap: ReadonlyMap<string, string>
}

export class PluginNet {
  private readonly deps: PluginNetDeps
  private readonly buckets = new Map<string, TokenBucket>()

  constructor(deps: PluginNetDeps) {
    this.deps = deps
  }

  async fetch(
    id: string,
    url: string,
    headers: Readonly<Record<string, string>> | undefined,
  ): Promise<PluginResponseData> {
    const grant = this.deps.grant(id)
    if (grant === null) throw new Error('the plugin is not enabled')
    if (!this.bucket(id).take(this.deps.now())) {
      throw new Error('too many requests: wait a moment and try again')
    }
    let current = url
    for (let hop = 0; hop <= PLUGIN_LIMITS.redirects; hop++) {
      const checked = checkPluginUrl(current, grant.hosts)
      if (!checked.ok) throw new Error(checked.error)
      const mapped = this.deps.hostMap.get(checked.url.hostname)
      const target = mapped
        ? `http://${mapped}${checked.url.pathname}${checked.url.search}`
        : checked.url.href
      const result = await this.deps.request(id, {
        url: target,
        session: grant.session.includes(checked.url.hostname),
        headers: pluginHeaders(headers),
        maxBytes: PLUGIN_LIMITS.responseBytes,
        timeoutMs: PLUGIN_LIMITS.fetchTimeoutMs,
      })
      if ('redirect' in result) {
        const next = new URL(result.redirect, target)
        // A test stub redirecting to itself stands for the host it replaces.
        current =
          mapped && next.host === mapped
            ? `https://${checked.url.hostname}${next.pathname}${next.search}`
            : next.href
        continue
      }
      return {
        status: result.status,
        headers: responseHeaders(result.headers),
        body: new TextDecoder().decode(result.body),
      }
    }
    throw new Error('too many redirects')
  }

  /** Forgets a plugin's request budget, when it is disabled or removed. */
  forget(id: string): void {
    this.buckets.delete(id)
  }

  private bucket(id: string): TokenBucket {
    let bucket = this.buckets.get(id)
    if (bucket === undefined) {
      bucket = new TokenBucket(
        PLUGIN_LIMITS.fetchBurst,
        PLUGIN_LIMITS.fetchPerMinute,
        this.deps.now(),
      )
      this.buckets.set(id, bucket)
    }
    return bucket
  }
}

/** Response headers for the plugin: lower-case, one string each, and never cookies. */
export function responseHeaders(
  raw: Readonly<Record<string, string | string[]>>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, value] of Object.entries(raw)) {
    const lower = name.toLowerCase()
    if (lower === 'set-cookie' || lower === 'set-cookie2') continue
    out[lower] = Array.isArray(value) ? value.join(', ') : value
  }
  return out
}
