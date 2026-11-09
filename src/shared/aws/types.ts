import type { CliLink, LedgerSummary } from '../cloud-cli/ledger.js'
import type { StatusIncident } from '../cloud-cli/status.js'

/**
 * AWS STATUS (docs/aws.md): what main sends a pane. Only what the probes' `--query` kept: counts,
 * states, short ids, Name tags, dates and regions. No tag but Name, no policy, rule, user data or
 * environment variable is ever read, so none can cross.
 */

export type Weight = 'danger' | 'warn' | 'info' | 'quiet'

/** The services the pane counts and drills into (aws.md §5.5, §14.4b). */
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
  | 'ecs'
  | 'dynamodb'
  | 'sqs'
  | 'sns'
  | 'apigw'
  | 'cloudfront'
  | 'bedrock'
  | 'aoss'
  | 'logs'
  | 'vpce'
  | 'tgw'
  | 'vpn'
  | 'sagemaker'
  | 'snapshots'
  | 'amis'
  | 'ecr'
  | 'elasticache'
  | 'opensearch'
  | 'redshift'
  | 'kinesis'
  | 'transfer'
  | 'kms'
  | 'route53'
  | 'vpc'

/** RESOURCES' lists across services (aws.md §14.5): the page drills into them like a service. */
export type AwsList = 'forgotten' | 'new' | 'elsewhere'

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
  /**
   * The names its title says (a resource, a user, a domain, a budget): MASK takes them out of
   * the title and keeps the rest of its words (aws.md §14.6).
   */
  names: string[]
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
  /**
   * The billing metric is there ("Receive CloudWatch billing alerts"): false when its reading
   * said it is not, null when there is no reading (not yet, refused, offline) - never "off" then.
   */
  billing: boolean | null
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
  /**
   * The credential report was read: without it, "never", "none" and an empty list would be an
   * all-clear nobody checked (refused, or not read yet), so those say "—" instead.
   */
  credentialReport: boolean
  /** The root user's last sign-in; null with a report read is "never". */
  rootUsedAt: number | null
  users: number | null
  roles: number | null
  /** Console users without MFA; null without a report. */
  mfaLessUsers: string[] | null
  /** Active access keys over 90 days; null without a report. */
  oldKeys: { user: string; days: number }[] | null
  guardduty: { high: number; medium: number; low: number } | null
}

/** What came and went since the day's first reading (aws.md §4.3). */
export interface ChangeLine {
  since: number
  parts: { service: AwsService; added: string[]; removed: string[] }[]
}

/**
 * Why a resource looks forgotten (aws.md §14.3): one word, from which its sentence, its tag and
 * the drill-down's facet are all made (shared/aws/forgotten.ts) - never a string of its own.
 */
export type ForgottenReason =
  | 'low-use'
  | 'stopped'
  | 'unattached'
  | 'no-traffic'
  | 'no-targets'
  | 'no-requests'
  | 'no-connections'
  | 'desired-0'
  | 'empty-cluster'
  | 'no-nodes'
  | 'empty'
  | 'unchanged'
  | 'orphan-log-group'
  | 'no-events'
  | 'unused-capacity'
  | 'no-messages'
  | 'no-subscribers'
  | 'not-invoked'
  | 'pt-unused'
  | 'unused-model'
  | 'no-searches'
  | 'alarm-orphan'
  | 'orphan-snapshot'
  | 'unused-ami'
  | 'no-pulls'
  | 'elsewhere'
  | 'tunnel-down'
  | 'left-running'
  | 'key-disabled'
  | 'empty-zone'
  | 'no-records'
  | 'no-transfers'

/** One row of LOOKS FORGOTTEN (aws.md §14.2 B): what was seen, never "delete it". */
export interface ForgottenRow {
  /** `kind:region:id`: what the page sends back for KEEP. */
  key: string
  service: AwsService
  /** The resource's id, for the third step (`aws.item`). */
  id: string
  region: string
  name: string
  reason: ForgottenReason
  /** The sentence ("no traffic 30 d", "not attached since 11-01 (first seen)"). */
  why: string
  /** "14 d+", "120 d", "since 11-01" or "unknown": time only, never the source. */
  quietFor: string
  /** Days the judgement covers; under the quiet days (30) it is ranked lower. */
  window: number
  /** It costs money now (by the hour or the month), not only by use. */
  billed: boolean
  /** ≈ USD a month from now at list price; null when not billed or not priced. */
  monthly: number | null
  notPriced: boolean
  /** danger from `AWS_LIMITS.forgottenDangerUsd` a month, warn when billed, quiet when not. */
  weight: Weight
  /** What it was judged by, for the card ("AWS/NATGateway · no data point in 14 d"). */
  source: string
  /**
   * Every name its sentences hold, for MASK: its own name and id, and another resource's where the
   * sentence names one (an orphan alarm "watches db-old, which is gone").
   */
  names: string[]
}

export type TileGroup =
  | 'COMPUTE'
  | 'STORAGE'
  | 'DATABASE'
  | 'NETWORK'
  | 'AI'
  | 'EDGE & API'
  | 'INTEGRATION'
  | 'SECURITY'
  | 'LOGS'

/** A part of a tile's thin state line: how many, and its tone. */
export interface TileSegment {
  n: number
  tone: 'ok' | 'warn' | 'danger' | 'off' | 'second'
  label: string
}

/** One service's tile (aws.md §14.2 C). */
export interface ResourceTile {
  service: AwsService
  label: string
  /** The big number and its noun: "10 running", "9 buckets", "152 log groups". */
  count: number
  noun: string
  segments: TileSegment[]
  /** The legend's facts: "2 idle", "1.2 TB", "3 kept forever". */
  legend: { text: string; tone: 'ok' | 'warn' | 'danger' | null }[]
  /** The pane's regions it has something in. */
  regions: string[]
  forgottenBilled: number
  forgottenQuiet: number
  /** The forgotten ones' ≈ $ a month; the frame warns from `AWS_LIMITS.tileWarnUsd`. */
  forgottenUsd: number
  frame: 'danger' | 'warn' | null
  /** ≈ $ a month of what bills by the hour or the month; null when usage-based only. */
  monthly: number | null
  /** "12.4 TB" for what is counted by size. */
  size: string | null
  usageBased: boolean
  /** Came and went in seven days (NEW 7 D). */
  added: number
  removed: number
  /** The CARDS view's count (aws.md §14.12): in use of all, over the pane's regions. */
  use: ServiceUse
}

/**
 * A service in use of all (aws.md §14.12), counted by main over the pane's regions only (what is
 * elsewhere stays in ELSEWHERE) with LOOKS FORGOTTEN's own predicate, so that always
 * `total − inUse = forgotten + stopped + quiet + kept`.
 */
export interface ServiceUse {
  /** Every resource of the service in the pane's regions. */
  total: number
  inUse: number
  /** What "in use" means, noun first: "instances running, not idle". */
  inUseWord: string
  /** Judged forgotten and billing (LOOKS FORGOTTEN's billing rows). */
  forgotten: number
  /** Not running, available or desired, and not judged forgotten: "1 stopped". */
  stopped: number
  /** Judged forgotten and costing nothing now. */
  quiet: number
  /** Judged forgotten and marked KEEP: off LOOKS FORGOTTEN, so not counted as forgotten here. */
  kept: number
  /** The forgotten ones' ≈ $ a month. */
  usd: number
  /** A forgotten one bills without a price in the table (a Provisioned Throughput). */
  notPriced: boolean
  /** By the forgotten ≈ $: warn from `AWS_LIMITS.tileWarnUsd`, danger from `forgottenDangerUsd`. */
  frame: 'danger' | 'warn' | null
  /** How many in each of the pane's regions it has something in, for the card. */
  regions: { region: string; count: number }[]
}

/** The Bedrock tile's two halves: the models used in 30 days, and what is placed (aws.md §14.2 C). */
export interface BedrockTile {
  models: {
    id: string
    name: string
    /** 30 days, when GetMetricData or the statistics read them; null when only seen listed. */
    tokensIn: number | null
    tokensOut: number | null
  }[]
  placed: {
    kind: 'pt' | 'custom' | 'imported' | 'kb' | 'agent' | 'guardrail' | 'profile' | 'runtime'
    count: number
    weight: Weight | null
  }[]
}

export interface ResourcesView {
  /** The usage metrics are not read for every region yet: "judging… (within 10 min)". */
  judging: boolean
  figures: {
    services: number
    resources: number
    regions: number
    billedByHour: { perHour: number; perMonth: number; count: number }
    forgotten: { billed: number; usd: number; notPriced: number; free: number; kept: number }
    added: number
    removed: number
    newest: { service: AwsService; name: string; at: number } | null
  }
  /** Ranked; the first 20 (the drill-down's `forgotten` list has them all). */
  forgotten: ForgottenRow[]
  forgottenTotal: number
  groups: { group: TileGroup; tiles: ResourceTile[] }[]
  bedrock: BedrockTile | null
  /** Read, and nothing there: "Checked, none here: ECS · …". */
  none: AwsService[]
  /** Not read for the first time yet (a skeleton tile). */
  pending: AwsService[]
  /** Refused, by operation: "Denied: dynamodb:ListTables". */
  denied: { service: AwsService; actions: string[] }[]
  /** Regions that do not offer a service: left out of its count. */
  notOffered: { service: AwsService; regions: string[] }[]
  alsoHere: {
    service: AwsService
    count: number
    noun: string
    /** Stacks failed or rolled back, alarms in ALARM; danger, or warn for rollbacks alone. */
    note: string | null
    noteWeight: Weight | null
  }[]
  elsewhere: {
    on: boolean
    readAt: number | null
    regions: { region: string; parts: { service: AwsService; count: number; text: string }[] }[]
  }
  /** Billed this month (the metric's ServiceName) and not read here; under $1 left out. */
  billedNotListed: { name: string; usd: number }[]
  /** The resources marked KEEP, for ⚙ (aws.md §14.3). */
  kept: { key: string; service: AwsService; name: string; at: number; usd: number }[]
  gmd: {
    on: boolean
    cap: number
    used: number
    usd: number
    capReached: boolean
  }
  quietDays: number
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
  /** RESOURCES, the first tab (aws.md §14). */
  resources: ResourcesView
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
  /**
   * Changes whenever main's readings of the board do: a probe settled, a shared reading of the
   * account came in (the sweep's too), a KEEP. The drill-down asks for its list and item again
   * then; `readAt` is the sign-in's time and moves only every fifteen minutes.
   */
  revision: string
}

/** A drill-down list's row (the second step): main's reading, the columns by `DRILL`. */
export interface DrillRow {
  id: string
  /** A row of a list across services (forgotten, new, elsewhere): the service its id is of. */
  service?: AwsService
  /** The names its cells hold beyond its own, for MASK (a forgotten row's sentence). */
  names?: string[]
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
  /** Why it looks forgotten, if it does (aws.md §14.5), and whether it is kept. */
  forgotten?: ForgottenRow | null
  kept?: boolean
}

export interface HistoryEvent {
  at: number
  who: string
  name: string
  error: string | null
}
