import { type CliResult, HOUR, MINUTE, type Probe, type RunCli } from '@shared/cloud-cli/probe'
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
import { nextBoundary } from '@shared/wall-clock'
import { isPartialAnswer, notStarted } from '../cloud-cli/scheduler.js'

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
  now(): number
  /** The last rate reading has under 10% left (github.md §3): every period four times as long. */
  rateLow(): boolean
  /** When a probe last read, from its outcome: what the longer periods count from. */
  readAt(id: string): number | null
  /** The board's last REFRESH (0 before any): a press reads the paced probes at once. */
  refreshedAt(): number
  /**
   * No call before this time: GitHub said to wait (`retry-after` on a secondary limit, or the
   * hour's limit spent until `x-ratelimit-reset`). Every probe but the free ones waits for it.
   * The limit is the user's, not a board's: the hold is the service's, shared by every board.
   */
  heldUntil(): number
  /** GitHub asked to wait until then: every board holds (never sooner than a hold already set). */
  hold(until: number): void
  /**
   * The probes a hold kept from reading since they last read: the service runs them once the
   * hold is over (on the board's first publish after it), not a whole period on.
   */
  heldBack: Set<string>
  /** The repositories each per-repository probe asked for in its last reading of all of them. */
  tried: Map<string, readonly string[]>
  /**
   * When each per-repository probe last asked for every watched repository: its pace counts from
   * that reading, never from a retry of the few that did not answer. A reading the scheduler
   * dropped (the board hidden or halted while its calls waited) leaves it, and `tried` and
   * `unheard`, as they were: shown again, the probe reads at once.
   */
  fullAt: Map<string, number>
  /**
   * The repositories each per-repository probe's last kept reading did not hear from (neither an
   * answer nor the repository's refusal): all a retry asks for, whenever it runs before its next
   * reading of all of them - after its back-off, or once a hold that kept it back is over.
   */
  unheard: Map<string, readonly string[]>
}

/**
 * How long to wait after a secondary limit that names no time: GitHub's documentation asks for
 * at least a minute when neither `retry-after` nor `x-ratelimit-remaining: 0` comes with it.
 */
export const SECONDARY_WAIT_MS = 60_000

/** GitHub's message for either limit ("API rate limit exceeded", "secondary rate limit"). */
const RATE_LIMITED = /rate limit/i

/**
 * What GitHub's refusal says about waiting: a secondary limit's `retry-after` (seconds), the
 * hour's limit spent (`x-ratelimit-remaining: 0`) until its reset, or a minute for a refusal
 * that only says so in its message (a secondary limit can come as a plain 403 or 429). Null for
 * any other answer: a 403 for push access or a scope is the repository's or the token's.
 */
export function waitAsked(http: HttpAnswer, now: number, stderr = ''): number | null {
  if (http.status !== 403 && http.status !== 429) return null
  const after = Number(http.headers.get('retry-after') ?? Number.NaN)
  if (Number.isFinite(after) && after > 0) return now + after * 1000
  const reset = Number(http.headers.get('x-ratelimit-reset') ?? Number.NaN)
  // A reset already past (this clock ahead of GitHub's, a stale header) would hold nothing:
  // GitHub's minute instead.
  if (http.headers.get('x-ratelimit-remaining') === '0' && Number.isFinite(reset))
    return reset * 1000 > now ? reset * 1000 : now + SECONDARY_WAIT_MS
  if (http.status === 429 || RATE_LIMITED.test(http.body) || RATE_LIMITED.test(stderr))
    return now + SECONDARY_WAIT_MS
  return null
}

/** A conditional answer, and whether it was a refusal for the rate limit (`waitAsked`). */
export interface GhAnswer extends HttpAnswer {
  limited: boolean
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
): Promise<GhAnswer | null> {
  const before = ctx.conditional.get(path)
  const argv = ['api', '-i', '-X', 'GET', path]
  if (before?.etag !== undefined) argv.push('-H', `If-None-Match: ${before.etag}`)
  else if (before?.lastModified !== undefined)
    argv.push('-H', `If-Modified-Since: ${before.lastModified}`)
  const result = await cli({ tool: 'gh', argv, tolerated })
  const parsed = parseHttp(result.stdout)
  if (parsed === null) return null
  const until = waitAsked(parsed, ctx.now(), result.stderr)
  if (until !== null) ctx.hold(until)
  const http: GhAnswer = { ...parsed, limited: until !== null }
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
 * Whether a GraphQL call without data was refused for a rate limit: the hour's points spent
 * (`"type": "RATE_LIMITED"`, gh's "API rate limit exceeded") or a secondary limit (a 403 that says
 * so, a 429). Read without `-i`, the answer has no headers to say how long.
 */
export function graphqlLimited(result: CliResult): boolean {
  return (
    RATE_LIMITED.test(result.stderr) ||
    /HTTP 429/.test(result.stderr) ||
    /"type"\s*:\s*"RATE_LIMITED"/.test(result.stdout)
  )
}

/**
 * A GraphQL query's answer: its data, also when it carries errors beside it (gh exits 1 for a
 * pinned repository deleted, or a field the token may not read; the parsers read what is there).
 * A refusal for a rate limit holds every board as a REST one does, for GitHub's minute.
 */
const graphql = async (
  cli: RunCli,
  ctx: GhContext,
  query: string,
  variables: Record<string, string> = {},
) => {
  const call = {
    tool: 'gh' as const,
    argv: ['api', 'graphql', '--input', '-'],
    stdin: graphqlBody(query, variables),
  }
  const result = await cli(call)
  if (result.ok || isPartialAnswer(call, result)) return result.stdout
  if (graphqlLimited(result)) ctx.hold(ctx.now() + SECONDARY_WAIT_MS)
  return null
}

/** How often a per-repository probe reads every watched repository: events and runs at their pace. */
function repoPeriod(ctx: GhContext, probe: { id: string; every: number }): number {
  return PACED.has(probe.id) ? repoEvery(ctx.repos().length) : probe.every
}

/**
 * Whether a per-repository probe reads every watched repository now: never yet, or not since a
 * REFRESH, a repository added since (read at once, never a whole period on), or its period's
 * boundary come since it last did. What was asked for counts, not what answered: a repository
 * that never answers must not read the others every 5 minutes.
 */
function readsAll(ctx: GhContext, probe: { id: string; every: number }): boolean {
  const at = ctx.fullAt.get(probe.id)
  if (at === undefined || ctx.refreshedAt() > at) return true
  const tried = new Set(ctx.tried.get(probe.id) ?? [])
  if (!ctx.repos().every((repo) => tried.has(repo.name))) return true
  return ctx.now() >= nextBoundary(at, repoPeriod(ctx, probe))
}

/**
 * The repositories a per-repository reading asks for (github.md §3): every watched one when it
 * `readsAll`; otherwise only those the last reading did not hear from - the others' answers
 * stand, and their pace is not moved by the retry (a 2% chance of a 502 a call once read twelve
 * repositories again on every retry, past the 5% budget). The scheduler runs it then only for a
 * retry: after its back-off, once a hold that kept the retry back is over (the held run settled
 * with no problem, so "the last reading failed" no longer said so, and the repository waited for
 * the next pace), or as the list of repositories changed. Null: nothing to read now - every
 * repository heard from, between its readings of them all.
 */
function asking(
  ctx: GhContext,
  probe: { id: string; every: number },
): { names: string[]; all: boolean } | null {
  const names = ctx.repos().map((repo) => repo.name)
  if (readsAll(ctx, probe)) return { names, all: true }
  const unheard = new Set(ctx.unheard.get(probe.id) ?? [])
  const again = names.filter((name) => unheard.has(name))
  return again.length > 0 ? { names: again, all: false } : null
}

/**
 * Each watched repository's answer to one REST path, failures tolerated (push access, admin…).
 * A repository that fails this time keeps its last good answer (cloud-cli.md §3.1). Only a 403
 * or 404 that is not the rate limit is the repository's own "no" (null: needs push access, not
 * an admin); any other failure (offline, a timeout, a 5xx, the rate limit) says nothing about
 * it, and one never read stays out of the reading - its tile says "not read yet". Such a failure
 * is the probe's (the scheduler's rule for gh's tolerated calls): it retries on its back-off,
 * asking only the repositories not heard from (`asking`). When none of those asked answered,
 * there is no reading (null): what was read before stands, and the probe is not counted as read
 * for a whole period while every tile says "not read yet". A call the scheduler did not start
 * (the board hidden or halted while it waited) drops the reading: nothing is noted, or a board
 * hidden during its events reading was shown again "read now" and read them 10 minutes on.
 */
async function perRepo<T>(
  cli: RunCli,
  ctx: GhContext,
  probe: { id: string; every: number },
  pathOf: (repo: string) => string,
  parse: (body: string) => T,
  previous: Record<string, T | null> | null,
): Promise<Record<string, T | null> | null> {
  const plan = asking(ctx, probe)
  if (plan === null) return withoutUnwatched(ctx, previous)
  const { names, all } = plan
  const startedAt = ctx.now()
  let dropped = false
  const watched: RunCli = async (call) => {
    const result = await cli(call)
    if (notStarted(result)) dropped = true
    return result
  }
  const kept = (name: string): [string, T | null] | null =>
    previous !== null && name in previous ? [name, previous[name] ?? null] : null
  const read = async (name: string) => {
    const http = await conditionalGet(watched, ctx, pathOf(name), true)
    const answered = http !== null && (http.status === 200 || http.status === 304)
    const refused = http !== null && !http.limited && (http.status === 403 || http.status === 404)
    // Neither an answer nor the repository's refusal: what it had stands, never "refused".
    if (!answered && !refused) return { name, entry: kept(name), fresh: false }
    const value = answered ? parse(http.body) : null
    return { name, entry: [name, value ?? previous?.[name] ?? null] as const, fresh: true }
  }
  // All at once: the shared CLI lanes bound how many run, and a board of twelve repositories
  // no longer reads them one after another.
  const answers = await Promise.all(names.map(read))
  if (dropped) return null
  if (all) {
    ctx.tried.set(probe.id, names)
    // A reading in which no repository answered is no reading: it stays due, shown again. An
    // empty list read all there was.
    if (names.length === 0 || answers.some((answer) => answer.fresh))
      ctx.fullAt.set(probe.id, startedAt)
  }
  ctx.unheard.set(
    probe.id,
    answers.flatMap((answer) => (answer.fresh ? [] : [answer.name])),
  )
  if (names.length > 0 && !answers.some((answer) => answer.fresh)) return null
  const asked = new Map(answers.map((answer) => [answer.name, answer.entry]))
  const entries = ctx
    .repos()
    .map(({ name }) => (asked.has(name) ? (asked.get(name) ?? null) : kept(name)))
  return Object.fromEntries(entries.flatMap((entry) => (entry === null ? [] : [entry])))
}

/**
 * The last reading without the repositories no longer watched, or null (nothing new) when it
 * holds none. With nothing to read, the reading of the list that dropped a repository would
 * otherwise leave its events, runs and reports standing until the probe next reads them all (an
 * hour for the reports), under its name, though nothing says any more whether it is private.
 */
function withoutUnwatched<T>(
  ctx: GhContext,
  previous: Record<string, T | null> | null,
): Record<string, T | null> | null {
  if (previous === null) return null
  const watched = new Set(ctx.repos().map((repo) => repo.name))
  const entries = Object.entries(previous)
  if (entries.every(([name]) => watched.has(name))) return null
  return Object.fromEntries(entries.filter(([name]) => watched.has(name)))
}

/**
 * A probe that reads each watched repository. Its back-off holds only the retry of the
 * repositories it did not hear from: its next reading of all of them goes ahead on its pace
 * (`dueThroughBackoff`), so one broken repository never backs off the others - unless it heard
 * from none (offline), when the back-off holds it all.
 */
function perRepoProbe<T>(
  id: string,
  every: number,
  pathOf: (repo: string) => string,
  parse: (body: string) => T,
): Probe<GhContext, Record<string, T | null> | null> {
  const probe: Probe<GhContext, Record<string, T | null> | null> = {
    id,
    after: 'repos',
    every,
    cost: 'free',
    run: (ctx, cli, previous) => perRepo(cli, ctx, probe, pathOf, parse, previous),
    dueThroughBackoff: (ctx) => {
      if (ctx.now() < ctx.heldUntil() || ctx.rateLow() || !readsAll(ctx, probe)) return false
      const unheard = new Set(ctx.unheard.get(id) ?? [])
      return ctx.repos().some((repo) => !unheard.has(repo.name))
    },
    readAllAt: (ctx) => ctx.fullAt.get(id) ?? null,
  }
  return probe
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

/**
 * How long after its last reading the inbox reads again: `X-Poll-Interval` rounded up to whole
 * minutes, the period of its timer (90 s is every other minute). The timer starts a reading on
 * the minute's boundary.
 */
export function inboxWait(pollSeconds: number): number {
  return Math.max(1, Math.ceil((pollSeconds * 1000) / MINUTE)) * MINUTE
}

export const inboxProbe: Probe<GhContext, InboxReading | null> = {
  id: 'inbox',
  every: MINUTE,
  cost: 'free',
  run: async (ctx, cli, previous) => {
    // Never sooner than GitHub's X-Poll-Interval asks (github.md §3): the timer runs every
    // minute, and an interval of two minutes skips every other one. `readAt` is when the last
    // reading ended, a slow one well after its boundary: half the timer's period short of the
    // wait (as `heldToRate`), so a reading of over 5 s no longer skipped the next minute.
    const at = ctx.readAt('inbox')
    const wait = inboxWait(previous?.pollSeconds ?? 60)
    if (previous !== null && at !== null && ctx.now() - at < wait - MINUTE / 2) return null
    const path = `notifications?per_page=50${ctx.spec.inbox === 'participating' ? '&participating=true' : ''}`
    const http = await conditionalGet(cli, ctx, path, true)
    if (http === null) return null
    // A 403 for the rate limit is no answer about the token's scope: the last reading stands,
    // and the board is THROTTLED, never "gh auth refresh -s notifications".
    if (http.limited) return null
    // An interval empty, zero or not a number would read every minute: GitHub's 60 s instead.
    const poll = Number(http.headers.get('x-poll-interval') ?? Number.NaN)
    if (http.status === 200 || http.status === 304) {
      return {
        notifications: parseNotifications(http.body),
        pollSeconds: Number.isFinite(poll) && poll > 0 ? poll : 60,
        status: http.status,
      }
    }
    // Only a refusal is the token's (no notifications scope, a fine-grained token): a 5xx says
    // nothing about the inbox, and the last reading stands rather than an empty one.
    if (http.status !== 401 && http.status !== 403 && http.status !== 404) return null
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
    const answer = await graphql(cli, ctx, QUEUE_QUERY, { triage: triageSearch(repos) })
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
    const answer = await graphql(
      cli,
      ctx,
      pinned === null ? OWN_REPOS_QUERY : pinnedReposQuery(pinned),
    )
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

export const eventsProbe: Probe<GhContext, Record<string, RepoEvent[] | null> | null> =
  perRepoProbe('events', 5 * MINUTE, (repo) => `repos/${repo}/events?per_page=30`, parseEvents)

export const runsProbe: Probe<GhContext, Record<string, Run[] | null> | null> = perRepoProbe(
  'runs',
  5 * MINUTE,
  (repo) => `repos/${repo}/actions/runs?per_page=20`,
  parseRuns,
)

// Conditional like the others: an unchanged answer is a 304, free of the rate limit.
export const trafficProbe: Probe<GhContext, Record<string, number[] | null> | null> = perRepoProbe(
  'traffic',
  6 * HOUR,
  (repo) => `repos/${repo}/traffic/views`,
  (body) => parseTraffic(body) ?? [],
)

export const advisoriesProbe: Probe<GhContext, Record<string, number | null> | null> = perRepoProbe(
  'advisories',
  HOUR,
  (repo) => `repos/${repo}/security-advisories?state=triage`,
  (body) => parseAdvisories(body) ?? 0,
)

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
    const answer = await graphql(cli, ctx, aheadQuery(repos))
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
  run: async (ctx, cli) => {
    const answer = await graphql(cli, ctx, CONTRIB_QUERY)
    return answer === null ? null : parseContribAnswer(answer)
  },
}

/**
 * How often each watched repository's events and runs are read: every 5 minutes up to seven
 * repositories, every 10 from eight (user decision 2026-11-08: under 5% of the hourly REST limit
 * with twelve busy repositories and no 304s, github.md §3). The worst hour counts every call as
 * if none answered 304: 60 inbox readings, events and runs per repository, advisories hourly and
 * traffic every six hours - seven repositories about 237 calls (4.7%), twelve about 218 (4.4%),
 * where twelve at 5 minutes were about 362 (7.2%).
 */
export const FRESH_REPOS = 7
export function repoEvery(repositories: number): number {
  return repositories > FRESH_REPOS ? 10 * MINUTE : 5 * MINUTE
}

/** The probes read at `repoEvery`; their timer still runs every 5 minutes. */
const PACED: ReadonlySet<string> = new Set(['events', 'runs'])

/**
 * A probe that spends the rate limit, held to it: nothing while GitHub said to wait, and while
 * the limit runs low (under 10%), its period four times as long (github.md §3). Answering null is
 * "nothing new": the last reading stays. A probe the hold kept back is noted (`heldBack`) and run
 * once the hold is over, not a whole period on. The sign-in and `rate_limit` cost no rate limit
 * and always run - the latter is how the pane sees the limit come back. A REFRESH press reads
 * nothing more while held or low: GitHub asked to wait, and a press every 30 s would spend what
 * the longer periods save (the pane says so). Events and runs keep their pace (`repoEvery`,
 * kept by `perRepo`); a retry after a failed reading asks only the repositories not heard from.
 */
export function heldToRate<T>(probe: Probe<GhContext, T>): Probe<GhContext, T> {
  return {
    ...probe,
    run: async (ctx, cli, previous) => {
      const now = ctx.now()
      if (now < ctx.heldUntil()) {
        ctx.heldBack.add(probe.id)
        return null as T
      }
      ctx.heldBack.delete(probe.id)
      // A per-repository probe counts from its last reading of all repositories, not a retry's.
      const at = ctx.fullAt.get(probe.id) ?? ctx.readAt(probe.id)
      const every = repoPeriod(ctx, probe)
      // Half the timer's period short of it: a reading ends a few seconds after its boundary.
      const slack = probe.every / 2
      if (ctx.rateLow() && at !== null && now - at < 4 * every - slack) return null as T
      return probe.run(ctx, cli, previous)
    },
  }
}

/** The whole table, in the order a board starts them: who first, then what waits, then the rest. */
export const GITHUB_PROBES: readonly Probe<GhContext, unknown>[] = [
  authProbe,
  rateProbe,
  ...[
    reposProbe,
    queueProbe,
    inboxProbe,
    runsProbe,
    eventsProbe,
    contribProbe,
    advisoriesProbe,
    aheadProbe,
    trafficProbe,
  ].map((probe) => heldToRate(probe as Probe<GhContext, unknown>)),
]

/** The table with the periods the probes keep for this many repositories: the ledger's card says them. */
export function probePeriods(
  repositories: number,
): { id: string; every: number; cost: Probe<GhContext, unknown>['cost'] }[] {
  return GITHUB_PROBES.map((probe) => ({
    id: probe.id,
    every: PACED.has(probe.id) ? repoEvery(repositories) : probe.every,
    cost: probe.cost,
  }))
}
