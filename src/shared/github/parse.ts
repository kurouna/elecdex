import { z } from 'zod'
import type { RunState } from './types.js'

/**
 * Reading gh's answers (docs/github.md §3). Each answer is checked with zod and cut down to the
 * fields the pane shows; bodies, comments and e-mail addresses are never kept. Pure: the tests
 * feed it answers saved from the real API.
 */

/** `gh api -i` prints the status line and headers, a blank line, then the body. */
export interface HttpAnswer {
  status: number
  headers: Map<string, string>
  body: string
}

export function parseHttp(stdout: string): HttpAnswer | null {
  const match = /^HTTP\/[\d.]+ (\d{3})[^\r\n]*\r?\n/.exec(stdout)
  if (match === null) return null
  const split = stdout.search(/\r?\n\r?\n/)
  const head = split < 0 ? stdout : stdout.slice(0, split)
  const body = split < 0 ? '' : stdout.slice(split).replace(/^\r?\n\r?\n/, '')
  const headers = new Map<string, string>()
  for (const line of head.split(/\r?\n/).slice(1)) {
    const colon = line.indexOf(':')
    if (colon > 0)
      headers.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim())
  }
  return { status: Number(match[1]), headers, body }
}

export const time = (iso: string | null | undefined): number => {
  const ms = iso ? Date.parse(iso) : Number.NaN
  return Number.isFinite(ms) ? ms : 0
}

/* ---- gh auth status --json hosts ---- */

const AuthSchema = z.object({
  hosts: z.record(
    z.string(),
    z.array(
      z.object({
        state: z.string(),
        active: z.boolean().optional(),
        login: z.string().optional(),
        scopes: z.string().optional(),
        tokenSource: z.string().optional(),
      }),
    ),
  ),
})

export interface AuthState {
  signedIn: boolean
  login: string | null
  scopes: string[]
  /** keyring, oauth_token, GH_TOKEN, GITHUB_TOKEN… */
  tokenSource: string | null
}

export function parseAuth(json: string): AuthState {
  const parsed = AuthSchema.safeParse(safeJson(json))
  const accounts = parsed.success ? (parsed.data.hosts['github.com'] ?? []) : []
  const account = accounts.find((entry) => entry.active === true) ?? accounts[0]
  if (account === undefined) return { signedIn: false, login: null, scopes: [], tokenSource: null }
  return {
    signedIn: account.state === 'success',
    login: account.login ?? null,
    scopes: (account.scopes ?? '')
      .split(',')
      .map((scope) => scope.trim())
      .filter((scope) => scope !== ''),
    tokenSource: account.tokenSource ?? null,
  }
}

/* ---- rate_limit ---- */

const RateSchema = z.object({
  resources: z.object({
    core: z.object({ limit: z.number(), remaining: z.number(), reset: z.number() }),
    graphql: z.object({ limit: z.number(), remaining: z.number(), reset: z.number() }),
  }),
})

export function parseRate(json: string) {
  const parsed = RateSchema.safeParse(safeJson(json))
  if (!parsed.success) return null
  const { core, graphql } = parsed.data.resources
  return {
    rest: core.remaining,
    restLimit: core.limit,
    gql: graphql.remaining,
    gqlLimit: graphql.limit,
    reset: core.reset * 1000,
    low: core.remaining < core.limit * 0.1 || graphql.remaining < graphql.limit * 0.1,
  }
}

/* ---- notifications ---- */

const NotificationSchema = z.object({
  id: z.string(),
  unread: z.boolean(),
  reason: z.string(),
  updated_at: z.string(),
  subject: z.object({ title: z.string(), url: z.string().nullable(), type: z.string() }),
  repository: z.object({ full_name: z.string(), private: z.boolean() }),
})

export type Notification = z.infer<typeof NotificationSchema>

export function parseNotifications(json: string): Notification[] {
  const parsed = z.array(NotificationSchema).safeParse(safeJson(json))
  return parsed.success ? parsed.data : []
}

/** The number at the end of a notification's API URL (…/pulls/412, …/issues/88, …/discussions/5). */
export function subjectNumber(url: string | null): number | null {
  const match = url === null ? null : /\/(?:pulls|issues|discussions)\/(\d+)$/.exec(url)
  return match === null ? null : Number(match[1])
}

/* ---- GraphQL: PRs, issues, repositories, contributions ---- */

const Repo = z.object({ nameWithOwner: z.string(), isPrivate: z.boolean() })
const Who = z.object({ login: z.string() }).nullable()

export const PullSchema = z.object({
  number: z.number(),
  title: z.string(),
  url: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  isDraft: z.boolean().optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
  repository: Repo,
  author: Who,
  /** FIRST_TIME_CONTRIBUTOR, FIRST_TIMER, CONTRIBUTOR, MEMBER, OWNER… (GraphQL's CommentAuthorAssociation). */
  authorAssociation: z.string().nullable().optional(),
  reviewDecision: z.string().nullable().optional(),
  mergeable: z.string().nullable().optional(),
  commits: z
    .object({
      nodes: z.array(
        z.object({
          commit: z.object({ statusCheckRollup: z.object({ state: z.string() }).nullable() }),
        }),
      ),
    })
    .optional(),
})

export type Pull = z.infer<typeof PullSchema>

export const IssueSchema = z.object({
  number: z.number(),
  title: z.string(),
  url: z.string(),
  createdAt: z.string(),
  repository: Repo,
  author: Who,
  authorAssociation: z.string().nullable().optional(),
})

export type Issue = z.infer<typeof IssueSchema>

/** Search nodes come as `{}` for a type the fragment did not match: those are dropped. */
const nodesOf = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ nodes: z.array(z.unknown()) }).transform((value) =>
    value.nodes.flatMap((node) => {
      const parsed = schema.safeParse(node)
      return parsed.success ? [parsed.data as z.infer<T>] : []
    }),
  )

const QueueAnswer = z.object({
  data: z.object({
    review: nodesOf(PullSchema),
    mine: nodesOf(PullSchema),
    assigned: nodesOf(IssueSchema),
    triage: nodesOf(IssueSchema),
  }),
})

export function parseQueueAnswer(json: string) {
  const parsed = QueueAnswer.safeParse(safeJson(json))
  return parsed.success ? parsed.data.data : null
}

const ReleaseSchema = z.object({
  tagName: z.string(),
  isPrerelease: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  url: z.string(),
  releaseAssets: z.object({ nodes: z.array(z.object({ downloadCount: z.number() })) }),
})

export type Release = z.infer<typeof ReleaseSchema>

export const RepoSchema = z.object({
  nameWithOwner: z.string(),
  isPrivate: z.boolean(),
  isArchived: z.boolean(),
  stargazerCount: z.number(),
  forkCount: z.number(),
  issues: z.object({ totalCount: z.number() }),
  pullRequests: z.object({ totalCount: z.number() }),
  releases: z.object({ nodes: z.array(ReleaseSchema) }),
  hasVulnerabilityAlertsEnabled: z.boolean().nullable().optional(),
  vulnerabilityAlerts: z.object({ totalCount: z.number() }).nullable().optional(),
  defaultBranchRef: z.object({ name: z.string() }).nullable(),
})

export type RepoNode = z.infer<typeof RepoSchema>

/** The repositories of an OWN or PINNED answer, in order; a pinned one that does not exist is null. */
export function parseReposAnswer(json: string, pinned: number | null): (RepoNode | null)[] | null {
  const raw = safeJson(json) as { data?: Record<string, unknown> } | null
  const data = raw?.data
  if (data === undefined || data === null) return null
  if (pinned === null) {
    const nodes =
      (data.viewer as { repositories?: { nodes?: unknown[] } } | undefined)?.repositories?.nodes ??
      []
    return nodes.map((node) => {
      const parsed = RepoSchema.safeParse(node)
      return parsed.success ? parsed.data : null
    })
  }
  return Array.from({ length: pinned }, (_, i) => {
    const parsed = RepoSchema.safeParse(data[`r${i}`])
    return parsed.success ? parsed.data : null
  })
}

const ContribAnswer = z.object({
  data: z.object({
    viewer: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number(),
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({ date: z.string(), contributionCount: z.number() }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
})

export function parseContribAnswer(json: string): { total: number; days: number[] } | null {
  const parsed = ContribAnswer.safeParse(safeJson(json))
  if (!parsed.success) return null
  const calendar = parsed.data.data.viewer.contributionsCollection.contributionCalendar
  const days = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => day.contributionCount),
  )
  return { total: calendar.totalContributions, days: days.slice(-371) }
}

const RepoPullsAnswer = z.object({
  data: z.object({
    repository: z
      .object({
        pullRequests: nodesOf(PullSchema),
        releases: z.object({ nodes: z.array(ReleaseSchema) }),
      })
      .nullable(),
  }),
})

export function parseRepoPullsAnswer(json: string) {
  const parsed = RepoPullsAnswer.safeParse(safeJson(json))
  return parsed.success ? parsed.data.data.repository : null
}

/* ---- REST: events, runs, traffic ---- */

const EventSchema = z.object({
  type: z.string(),
  actor: z.object({ login: z.string() }),
  created_at: z.string(),
  payload: z.object({ action: z.string().optional() }).passthrough().optional(),
})

export type RepoEvent = z.infer<typeof EventSchema>

export function parseEvents(json: string): RepoEvent[] {
  const parsed = z.array(z.unknown()).safeParse(safeJson(json))
  if (!parsed.success) return []
  return parsed.data.flatMap((entry) => {
    const event = EventSchema.safeParse(entry)
    return event.success ? [event.data] : []
  })
}

const RunSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  head_branch: z.string().nullable(),
  event: z.string(),
  status: z.string().nullable(),
  conclusion: z.string().nullable(),
  display_title: z.string().nullable().optional(),
  run_started_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
})

export type Run = z.infer<typeof RunSchema>

export function parseRuns(json: string): Run[] {
  const parsed = z.object({ workflow_runs: z.array(z.unknown()) }).safeParse(safeJson(json))
  if (!parsed.success) return []
  return parsed.data.workflow_runs.flatMap((entry) => {
    const run = RunSchema.safeParse(entry)
    return run.success ? [run.data] : []
  })
}

/** A run's lamp: success, failure, still going, waiting for a maintainer, or cancelled. */
export function runState(run: Pick<Run, 'status' | 'conclusion'>): RunState {
  if (run.status === 'action_required' || run.conclusion === 'action_required') return 'action'
  if (run.status !== 'completed') return 'pending'
  switch (run.conclusion) {
    case 'success':
      return 'success'
    case 'failure':
    case 'timed_out':
    case 'startup_failure':
      return 'failure'
    case 'cancelled':
    case 'skipped':
    case 'neutral':
      return 'cancelled'
    default:
      return 'none'
  }
}

export function parseTraffic(json: string): number[] | null {
  const parsed = z
    .object({ views: z.array(z.object({ count: z.number() })) })
    .safeParse(safeJson(json))
  return parsed.success ? parsed.data.views.map((day) => day.count).slice(-14) : null
}

const AheadSchema = z.object({
  ref: z.object({ compare: z.object({ aheadBy: z.number() }).nullable() }).nullable(),
})

/** The `aheadQuery` answer: each alias's count, or null (no such tag, or no compare read). */
export function parseAheadAnswer(json: string, count: number): (number | null)[] {
  const data = (safeJson(json) as { data?: Record<string, unknown> | null } | null)?.data ?? null
  return Array.from({ length: count }, (_, i) => {
    const parsed = AheadSchema.safeParse(data?.[`r${i}`])
    return parsed.success ? (parsed.data.ref?.compare?.aheadBy ?? null) : null
  })
}

export function parseAdvisories(json: string): number | null {
  const parsed = z.array(z.unknown()).safeParse(safeJson(json))
  return parsed.success ? parsed.data.length : null
}

export function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
