import type { CredentialRow, DbInstance, Identity, Instance, Summary, Volume } from './parse.js'
import { emptyResourceReadings, type ResourceReadings } from './resource-readings.js'
import type { Budget, PlanView, TrailEvent } from './types.js'

/**
 * Everything a board's probes last read, in one value (main builds it from the scheduler's
 * outcomes): what the pure judgements of shared/aws take. A region's reading is null when it
 * failed or was not read yet; a whole probe's is null the same way.
 */

export type PerRegion<T> = Record<string, T | null>

export interface Stack {
  name: string
  status: string
  at: number | null
  drift: string | null
}

export interface Nat {
  id: string
  state: string
  vpc: string | null
  connectivity: string | null
  name: string | null
}

export interface Balancer {
  arn: string
  name: string
  type: string
  scheme: string | null
  state: string | null
  created: number | null
}

export interface Address {
  ip: string
  alloc: string | null
  associated: boolean
  instance: string | null
  domain: string | null
}

export interface OpenGroup {
  id: string
  name: string | null
  /** Only the verdict crosses: which of SSH, RDP and every port it opens to the world. */
  ports: ('ssh' | 'rdp' | 'all')[]
}

export interface LambdaFunction {
  name: string
  runtime: string | null
  memory: number | null
  modified: number | null
}

export interface Cluster {
  name: string
  version: string | null
  status: string | null
  support: string | null
  /** The end of its version's standard support (describe-cluster-versions). */
  standardEnds: number | null
}

export interface Certificate {
  arn: string
  domain: string | null
  type: string | null
  expires: number | null
  inUse: boolean
  key: string | null
  status: string | null
}

export interface BucketSize {
  bucket: string
  storage: string
  bytes: number
}

export interface CpuWeek {
  avg: number[]
  max: number[]
  /** When main read it (it keeps a week a day). */
  at?: number
}

export interface AwsReadings {
  now: number
  regions: string[]
  identity: Identity | null
  alias: string | null
  summary: Summary | null
  credentials: CredentialRow[] | null
  /** The billing metric's daily maxima, [time, USD], from the first of last month (UTC). */
  billing: [number, number][] | null
  /** Whether the account has the billing metric at all (list-metrics answered with one). */
  billingThere: boolean | null
  billingServices: { name: string; usd: number }[] | null
  budgets: Budget[] | null
  plan: PlanView | null
  domains: { name: string; auto: boolean; expires: number | null }[] | null
  savings: { id: string; end: number | null; type: string | null }[] | null
  alarms: PerRegion<{
    metric: { name: string; since: number | null; namespace: string | null; dim: string | null }[]
    composite: { name: string; since: number | null }[]
  }>
  impaired: PerRegion<string[]>
  stacks: PerRegion<Stack[]>
  trail: PerRegion<TrailEvent[]>
  instances: PerRegion<Instance[]>
  volumes: PerRegion<Volume[]>
  addresses: PerRegion<Address[]>
  nats: PerRegion<Nat[]>
  balancers: PerRegion<Balancer[]>
  openGroups: PerRegion<OpenGroup[]>
  databases: PerRegion<DbInstance[]>
  functions: PerRegion<LambdaFunction[]>
  clusters: PerRegion<Cluster[]>
  certificates: PerRegion<Certificate[]>
  backups: PerRegion<{ id: string; type: string | null; at: number | null }[]>
  buckets: PerRegion<BucketSize[]>
  cpu: PerRegion<Record<string, CpuWeek>>
  guardduty: PerRegion<{ high: number; medium: number; low: number }>
  reserved: PerRegion<{ id: string; end: number | null; type: string | null; count: number }[]>
  /** RESOURCES' readings and main's memory of the account (aws.md §14). */
  res: ResourceReadings
}

/** A per-region reading's rows, each with its region. */
export function everywhere<T>(per: PerRegion<T[]>): (T & { region: string })[] {
  return Object.entries(per).flatMap(([region, rows]) =>
    (rows ?? []).map((row) => ({ ...row, region })),
  )
}

export const emptyReadings = (now: number, regions: string[]): AwsReadings => ({
  now,
  regions,
  identity: null,
  alias: null,
  summary: null,
  credentials: null,
  billing: null,
  billingThere: null,
  billingServices: null,
  budgets: null,
  plan: null,
  domains: null,
  savings: null,
  alarms: {},
  impaired: {},
  stacks: {},
  trail: {},
  instances: {},
  volumes: {},
  addresses: {},
  nats: {},
  balancers: {},
  openGroups: {},
  databases: {},
  functions: {},
  clusters: {},
  certificates: {},
  backups: {},
  buckets: {},
  cpu: {},
  guardduty: {},
  reserved: {},
  res: emptyResourceReadings(),
})
