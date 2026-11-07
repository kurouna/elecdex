import type { CliLink, LedgerSummary } from '../cloud-cli/ledger.js'
import type { StatusIncident } from '../cloud-cli/status.js'

/**
 * AWS STATUS (docs/aws.md): what main sends a pane. Only what the probes' `--query` kept: counts,
 * states, short ids, Name tags, dates and regions. No tag but Name, no policy, rule, user data or
 * environment variable is ever read, so none can cross.
 */

export type Weight = 'danger' | 'warn' | 'info' | 'quiet'

/** The services the pane counts and drills into (aws.md §5.5). */
export type AwsService =
  | 'ec2'
  | 'ebs'
  | 'eip'
  | 's3'
  | 'nat'
  | 'elb'
  | 'rds'
  | 'eks'
  | 'lambda'
  | 'stacks'
  | 'acm'
  | 'alarms'

/** A pane's board: one profile, up to four regions (aws.md §2, §8). */
export interface AwsBoardSpec {
  profile: string
  /** Empty: the profile's own region. */
  regions: string[]
  /** CloudTrail read (ACTIVITY and the PULSE). */
  activity: boolean
  /** Every period four times as long, but the billing metric's. */
  slow: boolean
}

export interface AttentionItem {
  /** Stable for the same finding: `kind:region:id`. */
  id: string
  weight: Weight
  tag: 'ALARM' | 'HEALTH' | 'STACK' | 'SECURITY' | 'EXPIRY' | 'SUPPORT' | 'COST' | 'BUDGET' | 'PLAN'
  title: string
  region: string | null
  /** The resource it is about, for the drill-down's third step; null for the account's own. */
  item: { service: AwsService; id: string } | null
  since: number
  /** The limit or rule behind it, in words (the card says it). */
  why: string
}

/** One service's line on ACTIVE: what runs and bills now, at list prices (aws.md §5.0). */
export interface ActiveService {
  service: AwsService
  label: string
  /** "17 running", "4.2 TB", "3 attached". */
  count: string
  idle: number
  waste: number
  /** ≈ USD a month at list prices; null for what bills by use only. */
  monthly: number | null
  regions: string[]
  /** The biggest five, for the row's card. */
  top: { name: string; monthly: number; detail: string }[]
}

export interface ActiveView {
  perHour: number
  perMonth: number
  services: ActiveService[]
  /** Services with nothing billing now, in one quiet line. */
  quiet: string[]
  /** Where the unit prices came from (aws.md §5.0). */
  prices: { source: 'bundled'; asOf: string }
  /** Types or classes with no price in the table: counted, not priced. */
  unpriced: string[]
}

export interface Budget {
  name: string
  limit: number
  actual: number
  forecast: number | null
}

export type CostExplorerState = 'unasked' | 'on' | 'off' | 'later' | 'refused'

/** Cost Explorer, the one paid API, as this account has it (aws.md §3.3). */
export interface CostExplorerView {
  state: CostExplorerState
  every: 'manual' | 'day' | '12h'
  /** Requests a month at most. */
  cap: number
  usedThisMonth: number
  answeredAt: number | null
  /** Whether this pane shows the question now (asked once per account, LATER once a start). */
  ask: boolean
  /** Its last answer: by service, month to date, and AWS's forecast for the month. */
  services: { name: string; usd: number }[] | null
  forecast: number | null
  readAt: number | null
  refusedWhy: string | null
}

export interface QuotaView {
  usd: number
  steps: '80-100' | '100'
  /** The share of the quota spent this month (0..), null when off or not read. */
  share: number | null
  /** No billing metric, or not in USD: the quota cannot be checked. */
  unavailable: string | null
}

export interface CostView {
  /** The billing metric is there ("Receive CloudWatch billing alerts"). */
  billing: boolean
  /** Month to date, USD, from the UTC month's points only. */
  mtd: number | null
  /** Last month to the same day. */
  lastSameDay: number | null
  /** A straight line from full days only. */
  projected: number | null
  /** Month to date, a point a day (UTC), this month and last. */
  daily: number[]
  lastDaily: number[]
  /** By service (the metric's ServiceName), highest first, top 12 and OTHER. */
  services: { name: string; usd: number }[]
  budgets: Budget[]
  plan: PlanView | null
  ce: CostExplorerView
  quota: QuotaView
  readAt: number | null
}

export type PlanView =
  | { kind: 'credits'; status: string; remaining: number | null; expires: number | null }
  | { kind: 'legacy'; items: { service: string; usage: string; share: number }[] }

export interface TrailEvent {
  id: string
  at: number
  name: string
  source: string
  region: string
  /** IAMUser, AssumedRole, Root…; AWSService ones are dropped. */
  who: string
  whoType: string
  error: string | null
  /** A console sign-in: its result and whether MFA was used. */
  login: { ok: boolean; mfa: boolean } | null
  /** What makes it stand out (root, no MFA, IAM/SG/KMS change, denied, failed sign-in). */
  mark: 'root' | 'nomfa' | 'iam' | 'denied' | 'failed' | null
}

/** One fifteen minutes of the PULSE: writes, errors, sign-ins. */
export interface PulseBin {
  at: number
  writes: number
  errors: number
  logins: number
}

export interface AccountView {
  rootMfa: boolean | null
  rootKeys: boolean | null
  rootUsedAt: number | null
  users: number | null
  roles: number | null
  mfaLessUsers: string[]
  oldKeys: { user: string; days: number }[]
  guardduty: { high: number; medium: number; low: number } | null
}

/** What came and went since the day's first reading (aws.md §4.3). */
export interface ChangeLine {
  since: number
  parts: { service: AwsService; added: string[]; removed: string[] }[]
}

export interface AwsBoard {
  key: string
  link: CliLink
  signIn: string | null
  problem: string | null
  /** Operations refused (PARTIAL), by name only. */
  denied: string[]
  profile: string
  /** The profile signs in through credential_process: each CLI start runs it. */
  credentialProcess: boolean
  account: { id: string; alias: string | null; arn: string } | null
  regions: string[]
  attention: AttentionItem[]
  /** How many checks ran, for "nothing needs attention · 31 checks". */
  checks: number
  alarms: number
  active: ActiveView
  cost: CostView
  activity: TrailEvent[] | null
  /** 50 shown: older ones not read. */
  activityCapped: boolean
  pulse: PulseBin[] | null
  accountView: AccountView
  changes: ChangeLine | null
  incidents: StatusIncident[]
  ledger: LedgerSummary
  cliVersion: string | null
  executable: string | null
  readAt: number | null
}

/** A drill-down list's row (the second step): main's reading, the columns by `DRILL`. */
export interface DrillRow {
  id: string
  region: string
  name: string
  weight: Weight | null
  cells: Record<string, string | number | null>
}

/** The third step: one resource, its fields, what is related, and its findings. */
export interface DrillItem {
  service: AwsService
  id: string
  region: string
  name: string
  state: string | null
  fields: { label: string; value: string; masked?: boolean }[]
  related: { service: AwsService; id: string; name: string; note: string }[]
  attention: AttentionItem[]
}

export interface HistoryEvent {
  at: number
  who: string
  name: string
  error: string | null
}
