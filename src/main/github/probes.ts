import { HOUR, MINUTE, type Probe, type RunCli } from '@shared/cloud-cli/probe'
import {
  type AuthState,
  type HttpAnswer,
  type Notification,
  parseAdvisories,
  parseAheadAnswer,
  parseAuth,
  parseContribAnswer,
  parseEvents,
  parseHttp,
  parseNotifications,
  parseQueueAnswer,
  parseRate,
  parseReposAnswer,
  parseRuns,
  parseTraffic,
  type RepoEvent,
  type RepoNode,
  type Run,
} from '@shared/github/parse'
import {
  aheadQuery,
  CONTRIB_QUERY,
  graphqlBody,
  OWN_REPOS_QUERY,
  pinnedReposQuery,
  QUEUE_QUERY,
  triageSearch,
} from '@shared/github/queries'
import type { GithubBoardSpec, RateState } from '@shared/github/types'
import { isPartialAnswer } from '../cloud-cli/scheduler.js'

/**
 * GITHUB STATUS's probe table (docs/github.md §3): every call is `gh api -X GET …`, `gh api graphql
 * --input -` with a body from queries.ts, or `gh auth status --json hosts`. Nothing else is run
 * (a unit test collects the calls). Conditional requests (ETag, Last-Modified) answer 304 at no
 * rate limit; the last answer is kept in the board's context.
 */

export interface GhContext {
  spec: GithubBoardSpec
  /** The watched repositories as the last `repos` reading listed them (or the pinned names). */
  repos(): readonly {
    name: string
    private: boolean
    defaultBranch: string
    release: string | null
  }[]
  /** The answers behind conditional requests: path → validators and body. */
  conditional: Map<string, { etag?: string; lastModified?: string; body: string }>
}

/**
 * GET with the validators of the last answer. A 304 gives back the body kept from before; null
 * when gh printed no status line at all (not started, timed out).
 */
export async function conditionalGet(
  cli: RunCli,
  ctx: GhContext,
  path: string,
  tolerated = false,
): Promise<HttpAnswer | null> {
  const before = ctx.conditional.get(path)
  const argv = ['api', '-i', '-X', 'GET', path]
  if (before?.etag !== undefined) argv.push('-H', `If-None-Match: ${before.etag}`)
  else if (before?.lastModified !== undefined)
    argv.push('-H', `If-Modified-Since: ${before.lastModified}`)
  const result = await cli({ tool: 'gh', argv, tolerated })
  const http = parseHttp(result.stdout)
  if (http === null) return null
  if (http.status === 304 && before !== undefined) return { ...http, body: before.body }
  if (http.status === 200) {
    const etag = http.headers.get('etag')
    const lastModified = http.headers.get('last-modified')
    ctx.conditional.set(path, {
      body: http.body,
      ...(etag === undefined ? {} : { etag }),
      ...(lastModified === undefined ? {} : { lastModified }),
    })
  }
  return http
}

/**
 * A GraphQL query's answer: its data, also when it carries errors beside it (gh exits 1 for a
 * pinned repository deleted, or a field the token may not read; the parsers read what is there).
 */
const graphql = async (cli: RunCli, query: string, variables: Record<string, string> = {}) => {
  const call = {
    tool: 'gh' as const,
    argv: ['api', 'graphql', '--input', '-'],
    stdin: graphqlBody(query, variables),
  }
  const result = await cli(call)
  return result.ok || isPartialAnswer(call, result) ? result.stdout : null
}

/**
 * Each watched repository's answer to one REST path, failures tolerated (push access, admin…).
 * A repository that fails this time keeps its last good answer (cloud-cli.md §3.1).
 */
async function perRepo<T>(
  cli: RunCli,
  ctx: GhContext,
  pathOf: (repo: string) => string,
  parse: (body: string) => T,
  conditional: boolean,
  previous: Record<string, T | null> | null,
): Promise<Record<string, T | null>> {
  // All at once: the shared CLI lanes bound how many run, and a board of twelve repositories
  // no longer reads them one after another.
  const read = async (name: string): Promise<[string, T | null]> => {
    const path = pathOf(name)
    let value: T | null = null
    if (conditional) {
      const http = await conditionalGet(cli, ctx, path, true)
      value =
        http !== null && (http.status === 200 || http.status === 304) ? parse(http.body) : null
    } else {
      const result = await cli({ tool: 'gh', argv: ['api', '-X', 'GET', path], tolerated: true })
      value = result.ok ? parse(result.stdout) : null
    }
    return [name, value ?? previous?.[name] ?? null]
  }
  return Object.fromEntries(await Promise.all(ctx.repos().map((repo) => read(repo.name))))
}

export interface InboxReading {
  notifications: Notification[]
  pollSeconds: number
  /** The answer's status: 403 is a token that may not read notifications (fine-grained). */
  status: number
}

export const authProbe: Probe<GhContext, AuthState | null> = {
  id: 'auth',
  every: 15 * MINUTE,
  cost: 'free',
  run: async (_ctx, cli) => {
    const result = await cli({ tool: 'gh', argv: ['auth', 'status', '--json', 'hosts'] })
    // Signed out, gh still prints the JSON (state is not "success"): read it either way. With no
    // JSON at all (no gh, offline) there is nothing to say about the sign-in.
    return result.stdout.trim() === '' ? null : parseAuth(result.stdout)
  },
}

export const rateProbe: Probe<GhContext, RateState | null> = {
  id: 'rate',
  every: 5 * MINUTE,
  cost: 'free',
  run: async (_ctx, cli) => {
    const result = await cli({ tool: 'gh', argv: ['api', '-X', 'GET', 'rate_limit'] })
    return result.ok ? parseRate(result.stdout) : null
  },
}

export const inboxProbe: Probe<GhContext, InboxReading | null> = {
  id: 'inbox',
  every: MINUTE,
  cost: 'free',
  run: async (ctx, cli) => {
    const path = `notifications?per_page=50${ctx.spec.inbox === 'participating' ? '&participating=true' : ''}`
    const http = await conditionalGet(cli, ctx, path, true)
    if (http === null) return null
    const poll = Number(http.headers.get('x-poll-interval') ?? '60')
    if (http.status === 200 || http.status === 304) {
      return {
        notifications: parseNotifications(http.body),
        pollSeconds: Number.isFinite(poll) ? poll : 60,
        status: http.status,
      }
    }
    return { notifications: [], pollSeconds: 60, status: http.status }
  },
}

export const queueProbe: Probe<GhContext, ReturnType<typeof parseQueueAnswer>> = {
  id: 'queue',
  // TRIAGE searches the watched repositories: their list first.
  after: 'repos',
  every: 5 * MINUTE,
  cost: 'free',
  run: async (ctx, cli) => {
    const repos = ctx.repos().map((repo) => repo.name)
    const answer = await graphql(cli, QUEUE_QUERY, { triage: triageSearch(repos) })
    return answer === null ? null : parseQueueAnswer(answer)
  },
}

export interface ReposReading {
  names: string[]
  nodes: (RepoNode | null)[]
}

export const reposProbe: Probe<GhContext, ReposReading | null> = {
  id: 'repos',
  every: 15 * MINUTE,
  cost: 'free',
  run: async (ctx, cli) => {
    const pinned = ctx.spec.repos === 'auto' ? null : ctx.spec.repos
    const answer = await graphql(cli, pinned === null ? OWN_REPOS_QUERY : pinnedReposQuery(pinned))
    if (answer === null) return null
    const nodes = parseReposAnswer(answer, pinned === null ? null : pinned.length)
    if (nodes === null) return null
    const kept = pinned === null ? nodes.filter((node) => node !== null && !node.isArchived) : nodes
    return { names: pinned ?? kept.map((node) => node?.nameWithOwner ?? ''), nodes: kept }
  },
  // The per-repository probes read each name, its default branch and its latest release.
  keyOf: (reading: ReposReading | null) =>
    reading === null
      ? ''
      : reading.nodes
          .map(
            (node, i) =>
              `${reading.names[i] ?? ''}@${node?.defaultBranchRef?.name ?? ''}@${node?.releases.nodes[0]?.tagName ?? ''}`,
          )
          .join(' '),
}

export const eventsProbe: Probe<GhContext, Record<string, RepoEvent[] | null>> = {
  id: 'events',
  after: 'repos',
  every: 5 * MINUTE,
  cost: 'free',
  run: (ctx, cli, previous) =>
    perRepo(cli, ctx, (repo) => `repos/${repo}/events?per_page=30`, parseEvents, true, previous),
}

export const runsProbe: Probe<GhContext, Record<string, Run[] | null>> = {
  id: 'runs',
  after: 'repos',
  every: 5 * MINUTE,
  cost: 'free',
  run: (ctx, cli, previous) =>
    perRepo(
      cli,
      ctx,
      (repo) => `repos/${repo}/actions/runs?per_page=20`,
      parseRuns,
      true,
      previous,
    ),
}

export const trafficProbe: Probe<GhContext, Record<string, number[] | null>> = {
  id: 'traffic',
  after: 'repos',
  every: 6 * HOUR,
  cost: 'free',
  run: (ctx, cli, previous) =>
    perRepo(
      cli,
      ctx,
      (repo) => `repos/${repo}/traffic/views`,
      (body) => parseTraffic(body) ?? [],
      // Conditional like the others: an unchanged answer is a 304, free of the rate limit.
      true,
      previous,
    ),
}

export const advisoriesProbe: Probe<GhContext, Record<string, number | null>> = {
  id: 'advisories',
  after: 'repos',
  every: HOUR,
  cost: 'free',
  run: (ctx, cli, previous) =>
    perRepo(
      cli,
      ctx,
      (repo) => `repos/${repo}/security-advisories?state=triage`,
      (body) => parseAdvisories(body) ?? 0,
      true,
      previous,
    ),
}

/**
 * The commits since each latest release, one GraphQL query for every watched repository: REST's
 * compare answered the range's commits and diffs (megabytes) for one number, a call each.
 */
export const aheadProbe: Probe<GhContext, Record<string, number | null> | null> = {
  id: 'ahead',
  after: 'repos',
  every: HOUR,
  cost: 'free',
  run: async (ctx, cli, previous) => {
    const repos = ctx
      .repos()
      .flatMap((repo) => (repo.release === null ? [] : [{ ...repo, release: repo.release }]))
    if (repos.length === 0) return {}
    const answer = await graphql(cli, aheadQuery(repos))
    if (answer === null) return null
    const counts = parseAheadAnswer(answer, repos.length)
    return Object.fromEntries(
      repos.map((repo, i) => [repo.name, counts[i] ?? previous?.[repo.name] ?? null]),
    )
  },
}

export const contribProbe: Probe<GhContext, { total: number; days: number[] } | null> = {
  id: 'contrib',
  every: HOUR,
  cost: 'free',
  run: async (_ctx, cli) => {
    const answer = await graphql(cli, CONTRIB_QUERY)
    return answer === null ? null : parseContribAnswer(answer)
  },
}

/** The whole table, in the order a board starts them: who first, then what waits, then the rest. */
export const GITHUB_PROBES: readonly Probe<GhContext, unknown>[] = [
  authProbe,
  rateProbe,
  reposProbe,
  queueProbe,
  inboxProbe,
  runsProbe,
  eventsProbe,
  contribProbe,
  advisoriesProbe,
  aheadProbe,
  trafficProbe,
]
