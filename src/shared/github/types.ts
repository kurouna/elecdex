import type { CliLink, LedgerSummary } from '../cloud-cli/ledger.js'
import type { StatusIncident } from '../cloud-cli/status.js'

/**
 * What GITHUB STATUS shows (docs/github.md): one board per host and watched repositories, built in
 * main from gh's answers and sent whole. Titles, branch and workflow names are other people's
 * text: the page draws them as text only. Items carry an opaque `id`; the page opens one through
 * `github.open(id)` and main builds the URL from its own reading (§7).
 */

export type Weight = 'danger' | 'warn' | 'info' | 'quiet'

export type ItemKind = 'pr' | 'issue' | 'ci' | 'security' | 'run' | 'release' | 'discussion'

/** One thing that waits on the user, the same PR never twice (§4). */
export interface QueueItem {
  id: string
  kind: ItemKind
  weight: Weight
  repo: string
  number: number | null
  title: string
  /** The verdict or the reason: FAILING, CONFLICT, REVIEW, WAITING 4D, MENTION, TRIAGE… */
  tag: string
  tagWeight: Weight
  /** When it started waiting (ms), or null when no reading says (a count of alerts or reports). */
  since: number | null
  by: string | null
  /** Its author's first contribution to the repository (FIRST_TIME_CONTRIBUTOR, FIRST_TIMER). */
  newcomer?: true
  mine: boolean
  /** One sentence for its card: why it is here. */
  why: string
  private: boolean
}

export type InboxReason =
  | 'review'
  | 'mention'
  | 'assign'
  | 'ci'
  | 'security'
  | 'subscribed'
  | 'other'

export interface InboxItem {
  id: string
  kind: ItemKind
  repo: string
  number: number | null
  title: string
  reason: InboxReason
  unread: boolean
  updatedAt: number
  private: boolean
}

export type InboxState =
  | { readable: true; items: InboxItem[]; pollSeconds: number }
  | { readable: false; why: 'fine-grained' | 'env-token' | 'scope'; command: string | null }

/** What happened in one watched repository in the last 24 hours, folded by kind. */
export interface RepoEvents {
  repo: string
  at: number
  parts: { label: string; count: number }[]
  mine: number
  private: boolean
}

export type RunState = 'success' | 'failure' | 'pending' | 'action' | 'cancelled' | 'none'

export interface RunItem {
  id: string
  state: RunState
  workflow: string
  branch: string
  title: string
  event: string
  seconds: number | null
  at: number
}

export interface RepoTile {
  name: string
  private: boolean
  stars: number
  /** Stars today minus seven days ago, from elecdex's own notes (§6); null until there are any. */
  starsDelta7: number | null
  starsSince: string | null
  starSpark: number[]
  forks: number
  issues: number
  pulls: number
  /** Open alerts; 'off' when Dependabot alerts are disabled; null when not readable. */
  alerts: number | 'off' | null
  release: {
    tag: string
    prerelease: boolean
    at: number
    downloads: number
    ahead: number | null
  } | null
  defaultBranch: string
  /** The default branch's last runs, oldest first. */
  runs: RunState[]
  red: boolean
  /** The last 14 days' views; null when GitHub refused them (push access); 'unread' before an answer. */
  views14: number[] | null | 'unread'
  advisories: number | null
}

export interface Contributions {
  total: number
  /** The last 371 days (53 weeks), oldest first. */
  days: number[]
  week: number
  lastWeek: number
  streak: number
  best: number
}

export interface RateState {
  rest: number
  restLimit: number
  gql: number
  gqlLimit: number
  /** When REST's window resets (ms). */
  reset: number
  low: boolean
}

export interface GithubBoard {
  key: string
  link: CliLink
  /** The command to copy when signed out, never run by the pane. */
  signIn: string | null
  /** A short, redacted sentence when the link is an error. */
  problem: string | null
  login: string | null
  scopes: string[]
  queue: QueueItem[]
  inbox: InboxState
  events: RepoEvents[]
  repos: RepoTile[]
  contrib: Contributions | null
  rate: RateState | null
  incidents: StatusIncident[]
  ledger: LedgerSummary
  ghVersion: string | null
  executable: string | null
  readAt: number | null
  nextInboxAt: number | null
  /** Until when GitHub asked to wait (`retry-after`, or the spent limit's reset); null when it did not. */
  heldUntil: number | null
}

/** One repository's inside, read when the page opens it (§5.3). */
export interface RepoDetail {
  key: string
  repo: string
  runs: RunItem[]
  pulls: {
    id: string
    number: number
    title: string
    by: string
    verdict: string
    verdictWeight: Weight
    ci: RunState
    since: number
  }[]
  releases: {
    id: string
    tag: string
    prerelease: boolean
    at: number
    downloads: number
    ahead: number | null
  }[]
  readAt: number
}

/** The board a pane asks for: the host is github.com in v1; repositories AUTO or PINNED. */
export interface GithubBoardSpec {
  repos: 'auto' | string[]
  inbox: 'all' | 'participating'
}
