import { sinceOrder } from '../cloud-cli/ledger.js'
import type { Issue, Notification, Pull, RepoEvent } from './parse.js'
import { subjectNumber, time } from './parse.js'
import type {
  InboxItem,
  InboxReason,
  ItemKind,
  QueueItem,
  RepoEvents,
  RunState,
  Weight,
} from './types.js'

/**
 * GITHUB STATUS's judgements (docs/github.md §4), pure. Thresholds are named in `GH_LIMITS` so a
 * card can quote them.
 */
export const GH_LIMITS = {
  /** A review request is overdue after this many days (warn), then danger. */
  reviewWarnDays: 3,
  reviewDangerDays: 7,
  /** Repositories watched at most (PINNED). */
  maxRepos: 12,
  /** EVENTS folds what happened in this many hours. */
  eventsHours: 24,
} as const

const DAY_MS = 86_400_000

/** A PR's tag: the worst of failing checks, a conflict, changes asked, then the milder states. */
export function prVerdict(pull: Pull): { tag: string; weight: Weight; ci: RunState } {
  const rollup = pull.commits?.nodes[0]?.commit.statusCheckRollup?.state ?? null
  const ci: RunState =
    rollup === 'SUCCESS'
      ? 'success'
      : rollup === 'FAILURE' || rollup === 'ERROR'
        ? 'failure'
        : rollup === null
          ? 'none'
          : 'pending'
  if (ci === 'failure') return { tag: 'Failing', weight: 'danger', ci }
  if (pull.mergeable === 'CONFLICTING') return { tag: 'Conflict', weight: 'warn', ci }
  if (pull.reviewDecision === 'CHANGES_REQUESTED') return { tag: 'Changes', weight: 'warn', ci }
  if (pull.isDraft === true) return { tag: 'Draft', weight: 'quiet', ci }
  // GitHub starts working mergeability out on the first question and answers UNKNOWN meanwhile.
  if (ci === 'pending' || pull.mergeable === 'UNKNOWN')
    return { tag: 'Pending', weight: 'info', ci }
  if (pull.reviewDecision === 'APPROVED') return { tag: 'Approved', weight: 'quiet', ci }
  return { tag: 'Waiting', weight: 'quiet', ci }
}

/** The tag of a review request by how long it has waited. */
export function waitingTag(since: number, now: number): { tag: string; weight: Weight } {
  const days = Math.floor((now - since) / DAY_MS)
  if (days >= GH_LIMITS.reviewDangerDays) return { tag: `Waiting ${days}d`, weight: 'danger' }
  if (days >= GH_LIMITS.reviewWarnDays) return { tag: `Waiting ${days}d`, weight: 'warn' }
  return { tag: 'Review', weight: 'info' }
}

const OWNER_REPO = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/

/** A watched repository name as checked owner/name, or null (cloud-cli.md §2.5: no `.` or `..`). */
export function repoName(raw: unknown): string | null {
  if (typeof raw !== 'string' || !OWNER_REPO.test(raw)) return null
  const [owner, name] = raw.split('/')
  if (owner === '.' || owner === '..' || name === '.' || name === '..') return null
  return raw
}

/**
 * A URL main may open for an item: github.com only, in the shapes the pane links to. API URLs of
 * notifications (api.github.com/repos/o/r/pulls/n) become their pages. Anything else is null.
 */
export function htmlUrlOf(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '')
    return null
  if (url.hostname === 'api.github.com') {
    const match = /^\/repos\/([^/]+\/[^/]+)\/(pulls|issues|discussions)\/(\d+)$/.exec(url.pathname)
    if (match === null || repoName(match[1]) === null) return null
    return `https://github.com/${match[1]}/${match[2] === 'pulls' ? 'pull' : match[2]}/${match[3]}`
  }
  if (url.hostname === 'www.githubstatus.com') {
    return /^\/incidents\/[a-z0-9]{6,20}$/.test(url.pathname)
      ? `https://www.githubstatus.com${url.pathname}`
      : null
  }
  if (url.hostname !== 'github.com') return null
  // A release's tag may hold slashes (changesets' `@scope/name@1.2.3`): the rest of the path is its.
  const match =
    /^\/([^/]+\/[^/]+)(\/(pull|issues|discussions)\/\d+|\/actions\/runs\/\d+|\/actions|\/releases\/tag\/.+|\/security\/advisories|\/security\/dependabot|\/security)?\/?$/.exec(
      url.pathname,
    )
  if (match === null || repoName(match[1]) === null) return null
  return `https://github.com${url.pathname.replace(/\/$/, '')}`
}

const KIND_OF_SUBJECT: Record<string, ItemKind> = {
  PullRequest: 'pr',
  Issue: 'issue',
  CheckSuite: 'ci',
  WorkflowRun: 'ci',
  RepositoryVulnerabilityAlert: 'security',
  RepositoryDependabotAlertsThread: 'security',
  Release: 'release',
  Discussion: 'discussion',
}

const REASON: Record<string, InboxReason> = {
  review_requested: 'review',
  mention: 'mention',
  team_mention: 'mention',
  assign: 'assign',
  ci_activity: 'ci',
  security_alert: 'security',
  subscribed: 'subscribed',
}

export function inboxItems(notifications: readonly Notification[]): {
  items: InboxItem[]
  urls: Map<string, string>
} {
  const urls = new Map<string, string>()
  const items = notifications.map((n): InboxItem => {
    const id = `inbox:${n.id}`
    const number = subjectNumber(n.subject.url)
    const page = n.subject.url !== null ? htmlUrlOf(n.subject.url) : null
    urls.set(id, page ?? `https://github.com/${n.repository.full_name}`)
    return {
      id,
      kind: KIND_OF_SUBJECT[n.subject.type] ?? 'issue',
      repo: n.repository.full_name,
      number,
      title: n.subject.title,
      reason: REASON[n.reason] ?? 'other',
      unread: n.unread,
      updatedAt: time(n.updated_at),
      private: n.repository.private,
    }
  })
  return { items, urls }
}

export interface QueueInput {
  review: readonly Pull[]
  mine: readonly Pull[]
  assigned: readonly Issue[]
  triage: readonly Issue[]
  notifications: readonly Notification[]
  /** Watched repositories whose default branch's latest run failed. */
  red: readonly {
    repo: string
    workflow: string
    failures: number
    at: number
    url: string
    private: boolean
  }[]
  /** Runs waiting for a maintainer's approval (first-time contributors). */
  approvals: readonly {
    repo: string
    title: string
    at: number
    url: string
    private: boolean
    id: number
  }[]
  advisories: readonly { repo: string; count: number; private: boolean }[]
  /** Open Dependabot alerts on watched repositories (the tiles' count). */
  alerts: readonly { repo: string; count: number; private: boolean }[]
  me: string | null
  now: number
}

const ORDER: Record<Weight, number> = { danger: 0, warn: 1, info: 2, quiet: 3 }

/** One queue row, the page it opens, and what it is the same thing as (a PR's repo#number). */
interface Candidate {
  item: QueueItem
  url: string
  key: string
}

const keyOf = (repo: string, number: number) => `${repo}#${number}`

const issueKind = (url: string): ItemKind => (url.includes('/pull/') ? 'pr' : 'issue')

function redCandidates(input: QueueInput): Candidate[] {
  return input.red.map((red) => ({
    key: `red:${red.repo}`,
    url: red.url,
    item: {
      id: `red:${red.repo}`,
      kind: 'ci',
      weight: 'danger',
      repo: red.repo,
      number: null,
      title: `${red.workflow} failed on the default branch${red.failures > 1 ? ` ${red.failures} times in a row` : ''}`,
      tag: 'Main red',
      tagWeight: 'danger',
      since: red.at,
      by: null,
      mine: true,
      why: "The default branch's latest run failed (actions/runs).",
      private: red.private,
    },
  }))
}

/**
 * A repository's open Dependabot alerts, one row a repository (github.md §2: QUEUE's SECURITY
 * says them as well as the private reports). The count is what the tile already reads; each
 * alert's severity is not read, so warn rather than danger.
 */
function alertCandidates(input: QueueInput): Candidate[] {
  return input.alerts
    .filter((alert) => alert.count > 0)
    .map((alert) => ({
      key: `alerts:${alert.repo}`,
      url: `https://github.com/${alert.repo}/security/dependabot`,
      item: {
        id: `alerts:${alert.repo}`,
        kind: 'security',
        weight: 'warn',
        repo: alert.repo,
        number: null,
        title: `${alert.count} open Dependabot alert${alert.count > 1 ? 's' : ''}`,
        tag: 'Dependabot',
        tagWeight: 'warn',
        since: null,
        by: null,
        mine: true,
        why: 'Dependabot alerts open on the repository (vulnerabilityAlerts, OPEN).',
        private: alert.private,
      },
    }))
}

function advisoryCandidates(input: QueueInput): Candidate[] {
  return input.advisories
    .filter((advisory) => advisory.count > 0)
    .map((advisory) => ({
      key: `advisory:${advisory.repo}`,
      url: `https://github.com/${advisory.repo}/security/advisories`,
      item: {
        id: `advisory:${advisory.repo}`,
        kind: 'security',
        weight: 'danger',
        repo: advisory.repo,
        number: null,
        title: `${advisory.count} private vulnerability report${advisory.count > 1 ? 's' : ''} to triage`,
        tag: 'Security',
        tagWeight: 'danger',
        since: null,
        by: null,
        mine: true,
        why: 'Reported privately (security-advisories?state=triage): nobody else can see it yet.',
        private: advisory.private,
      },
    }))
}

function mineCandidates(input: QueueInput): Candidate[] {
  return input.mine.flatMap((pull): Candidate[] => {
    const verdict = prVerdict(pull)
    if (verdict.weight !== 'danger' && verdict.weight !== 'warn') return []
    const key = keyOf(pull.repository.nameWithOwner, pull.number)
    return [
      {
        key,
        url: pull.url,
        item: {
          id: `pr:${key}`,
          kind: 'pr',
          weight: verdict.weight,
          repo: pull.repository.nameWithOwner,
          number: pull.number,
          title: pull.title,
          tag: verdict.tag,
          tagWeight: verdict.weight,
          since: time(pull.updatedAt ?? pull.createdAt),
          by: input.me,
          mine: true,
          why: `Your PR. The tag is the worst of: checks ${verdict.ci}, mergeable ${pull.mergeable ?? 'unknown'}, review ${pull.reviewDecision ?? 'none'}.`,
          private: pull.repository.isPrivate,
        },
      },
    ]
  })
}

function approvalCandidates(input: QueueInput): Candidate[] {
  return input.approvals.map((approval) => ({
    key: `approve:${approval.repo}:${approval.id}`,
    url: approval.url,
    item: {
      id: `approve:${approval.repo}:${approval.id}`,
      kind: 'run',
      weight: 'warn',
      repo: approval.repo,
      number: null,
      title: `Approve workflows: ${approval.title}`,
      tag: 'Approve',
      tagWeight: 'warn',
      since: approval.at,
      by: null,
      mine: false,
      why: 'A run waits for a maintainer to approve it (actions/runs?status=action_required). Approving is a write: the pane only shows it.',
      private: approval.private,
    },
  }))
}

function reviewCandidates(input: QueueInput): Candidate[] {
  return input.review.map((pull) => {
    const since = time(pull.createdAt)
    const wait = waitingTag(since, input.now)
    const key = keyOf(pull.repository.nameWithOwner, pull.number)
    return {
      key,
      url: pull.url,
      item: {
        id: `pr:${key}`,
        kind: 'pr',
        weight: wait.weight,
        repo: pull.repository.nameWithOwner,
        number: pull.number,
        title: pull.title,
        tag: wait.tag,
        tagWeight: wait.weight,
        since,
        by: pull.author?.login ?? null,
        mine: false,
        why: `Review requested. Warn after ${GH_LIMITS.reviewWarnDays} days, danger after ${GH_LIMITS.reviewDangerDays}. +${pull.additions ?? 0} −${pull.deletions ?? 0}.`,
        private: pull.repository.isPrivate,
      },
    }
  })
}

function mentionCandidates(input: QueueInput): Candidate[] {
  return input.notifications
    .filter((n) => n.reason === 'mention' || n.reason === 'team_mention')
    .map((n) => {
      const number = subjectNumber(n.subject.url)
      const page = n.subject.url !== null ? htmlUrlOf(n.subject.url) : null
      return {
        key: number === null ? `mention:${n.id}` : keyOf(n.repository.full_name, number),
        url: page ?? `https://github.com/${n.repository.full_name}`,
        item: {
          id: `mention:${n.id}`,
          kind: KIND_OF_SUBJECT[n.subject.type] ?? 'issue',
          weight: 'info',
          repo: n.repository.full_name,
          number,
          title: n.subject.title,
          tag: 'Mention',
          tagWeight: 'info',
          since: time(n.updated_at),
          by: null,
          mine: false,
          why: 'A mention from the inbox, folded in here once.',
          private: n.repository.private,
        },
      }
    })
}

function issueCandidates(issues: readonly Issue[], prefix: 'assigned' | 'triage'): Candidate[] {
  const assigned = prefix === 'assigned'
  return issues.map((issue) => {
    const key = keyOf(issue.repository.nameWithOwner, issue.number)
    return {
      key,
      url: issue.url,
      item: {
        id: `${prefix}:${key}`,
        kind: issueKind(issue.url),
        weight: assigned ? 'info' : 'quiet',
        repo: issue.repository.nameWithOwner,
        number: issue.number,
        title: issue.title,
        tag: assigned ? 'Assigned' : 'Triage',
        tagWeight: assigned ? 'info' : 'quiet',
        since: time(issue.createdAt),
        by: issue.author?.login ?? null,
        mine: false,
        why: assigned
          ? 'Assigned to you.'
          : 'Open in a watched repository with no comment, label or assignee yet.',
        private: issue.repository.isPrivate,
      },
    }
  })
}

/**
 * The QUEUE: what waits on the user, the same thing never twice (a PR that is both a review
 * request and a notification is one row, in its heavier place), heaviest first and oldest first
 * within a weight. Only URLs `htmlUrlOf` accepts are kept for opening.
 */
export function buildQueue(input: QueueInput): { items: QueueItem[]; urls: Map<string, string> } {
  const candidates = [
    ...redCandidates(input),
    ...advisoryCandidates(input),
    ...alertCandidates(input),
    ...mineCandidates(input),
    ...approvalCandidates(input),
    ...reviewCandidates(input),
    ...mentionCandidates(input),
    ...issueCandidates(input.assigned, 'assigned'),
    ...issueCandidates(input.triage, 'triage'),
  ]
  const seen = new Set<string>()
  const items: QueueItem[] = []
  const urls = new Map<string, string>()
  for (const { item, url, key } of candidates) {
    if (seen.has(key)) continue
    seen.add(key)
    items.push(item)
    const safe = htmlUrlOf(url)
    if (safe !== null) urls.set(item.id, safe)
  }
  items.sort((a, b) => ORDER[a.weight] - ORDER[b.weight] || sinceOrder(a.since, b.since))
  return { items, urls }
}

const EVENT_LABEL: Record<string, string> = {
  WatchEvent: '★',
  ForkEvent: 'forks',
  IssuesEvent: 'issues opened',
  PullRequestEvent: 'PRs opened',
  ReleaseEvent: 'releases',
  PushEvent: 'pushes',
  IssueCommentEvent: 'comments',
  PullRequestReviewEvent: 'reviews',
}

/** What happened in one repository since `since`, folded by kind; the user's own actions counted apart. */
export function foldEvents(
  repo: string,
  events: readonly RepoEvent[],
  me: string | null,
  since: number,
  isPrivate: boolean,
): RepoEvents | null {
  const counts = new Map<string, number>()
  let mine = 0
  let at = 0
  for (const event of events) {
    const when = time(event.created_at)
    if (when < since) continue
    if (
      (event.type === 'IssuesEvent' || event.type === 'PullRequestEvent') &&
      event.payload?.action !== 'opened'
    )
      continue
    const label = EVENT_LABEL[event.type]
    if (label === undefined) continue
    at = Math.max(at, when)
    if (me !== null && event.actor.login === me) {
      mine += 1
      continue
    }
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  if (counts.size === 0 && mine === 0) return null
  return {
    repo,
    at,
    parts: [...counts.entries()].map(([label, count]) => ({ label, count })),
    mine,
    private: isPrivate,
  }
}

/** Days in a row with a contribution up to today (or yesterday, while today has none yet), and the best run. */
export function streaks(days: readonly number[]): { streak: number; best: number } {
  let best = 0
  let run = 0
  for (const count of days) {
    run = count > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  let streak = 0
  const end = days.length > 0 && days[days.length - 1] === 0 ? days.length - 2 : days.length - 1
  for (let i = end; i >= 0 && (days[i] ?? 0) > 0; i--) streak += 1
  return { streak, best }
}

/**
 * Stars now minus seven days ago, from the daily notes (`date` → count): with fewer days noted,
 * since the first of them (`since`). Today's own note is no base: it is the count of this very
 * reading (noted as it is built), so a first look and the rest of that day have no change yet.
 */
export function starDelta(
  notes: Readonly<Record<string, number>>,
  today: string,
  current: number,
): { delta: number | null; since: string | null; spark: number[] } {
  const dates = Object.keys(notes).sort()
  const spark = dates.length === 0 ? [current] : dates.slice(-30).map((date) => notes[date] ?? 0)
  const past = dates.filter((date) => date < today)
  if (past.length === 0) return { delta: null, since: null, spark }
  const weekAgo = new Date(Date.parse(`${today}T00:00:00Z`) - 7 * DAY_MS).toISOString().slice(0, 10)
  const base = past.filter((date) => date <= weekAgo).pop()
  if (base === undefined)
    return { delta: current - (notes[past[0] ?? today] ?? current), since: past[0] ?? null, spark }
  return { delta: current - (notes[base] ?? current), since: null, spark }
}
