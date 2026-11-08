import { CE_PRICE_USD } from '@shared/aws/billing'
import { regionName } from '@shared/aws/board'
import { seriesKey } from '@shared/aws/forgotten'
import {
  AddressesSchema,
  AlarmsSchema,
  BackupJobsSchema,
  BalancersSchema,
  BillingMetricsSchema,
  BudgetsSchema,
  CertificatesSchema,
  ClusterSchema,
  ClusterVersionsSchema,
  CostServicesSchema,
  DbInstancesSchema,
  DomainsSchema,
  ForecastSchema,
  FreeTierSchema,
  FunctionsSchema,
  IdentitySchema,
  IdsSchema,
  InstancesSchema,
  ms,
  NatsSchema,
  OpenGroupsSchema,
  PlanStateSchema,
  PointsSchema,
  parseCredentialReport,
  parseWith,
  ReservedSchema,
  SavingsSchema,
  SeveritySchema,
  StacksSchema,
  StatPointsSchema,
  SummarySchema,
  VolumesSchema,
} from '@shared/aws/parse'
import type { AwsReadings, Certificate, CpuWeek, PerRegion } from '@shared/aws/readings'
import { GLOBAL } from '@shared/aws/resources'
import { parseTrail, TRAIL_MAX } from '@shared/aws/trail'
import type { AwsBoardSpec, Budget, PlanView } from '@shared/aws/types'
import type { CliResult, Probe, ProbeCost, RunCli } from '@shared/cloud-cli/probe'
import { DAY, HOUR, MINUTE } from '@shared/cloud-cli/probe'
import { z } from 'zod'
import type { SharedReads } from './resource-probes.js'

/**
 * AWS STATUS's probes (aws.md §3): every call is a read named here, with `--query` keeping only
 * the fields the pane shows and `--max-items` bounding it, against the pane's profile and a
 * region named on the call. Global services are asked in us-east-1. Nothing here writes, and the
 * forbidden table (aws.md §3.4: S3's own API but ListBuckets, logs but describe-log-groups,
 * secrets, Health, Support) has no entry - the catalog test holds every call to this file's and
 * resource-probes.ts's verbs. GetMetricData is RESOURCES' paid probe (aws.md §14.4a).
 */

export interface CostExplorerSettings {
  state: 'unasked' | 'on' | 'off' | 'later' | 'refused'
  every: 'manual' | 'day' | '12h'
  cap: number
  used: number
  lastReadAt: number | null
  /** The last reading that failed (not refused): tried again an hour on, not at once. */
  failedAt: number | null
}

/** What a Cost Explorer reading came to, for the account's store. */
export type CostExplorerAnswer =
  | { kind: 'read'; services: { name: string; usd: number }[]; forecast: number | null }
  | { kind: 'refused' }
  | { kind: 'failed' }

export interface AwsContext {
  spec: AwsBoardSpec
  /** The regions read: the pane's, or the profile's own. */
  regions(): string[]
  account(): string | null
  /**
   * Takes the account's one Cost Explorer reading, when it is due and no other board of the
   * account is reading it: two panes on one account never both pay.
   */
  claimCostExplorer(): boolean
  /** The reading's end, whatever it came to (it gives the claim back). */
  costExplorerAnswered(answer: CostExplorerAnswer): void
  /** A REFRESH press is reading now (MANUAL Cost Explorer runs then). */
  refreshing(): boolean
  /** The services the billing reading listed with a USD series; null before it read. */
  billedServices(): string[] | null
  /** The running instances of the last reading, for their CPU weeks. */
  running(): { id: string; region: string; launch: number }[]
  now(): number
  /** RESOURCES' readings, the account's (aws.md §14.4); null until the account is known. */
  shared(): SharedReads | null
  /** The board's last readings, as RESOURCES' judgements take them. */
  readings(): AwsReadings
  /** A probe's period on this board (SLOW makes it four times as long). */
  every(id: string): number
  /** When REFRESH was last pressed (0: never). */
  refreshedAt(): number
  /** The EKS clusters of the last reading in a region. */
  clusterNames(region: string): string[]
  /**
   * Whether a call of this board in `region` reached AWS lately and none failed for the network
   * since: what tells a region without a service from the network being down (aws.md §14.4).
   */
  reached(region: string): boolean
}

/** One AWS CLI call against the pane's profile in `region`. */
export const awsCall = (
  ctx: AwsContext,
  region: string,
  argv: string[],
  tolerated = false,
): { tool: 'aws'; argv: string[]; tolerated?: boolean } => ({
  tool: 'aws',
  argv: [...argv, '--profile', ctx.spec.profile, '--region', region],
  ...(tolerated ? { tolerated: true } : {}),
})

const read = async <T>(
  cli: RunCli,
  ctx: AwsContext,
  region: string,
  argv: string[],
  schema: z.ZodType<T>,
  tolerated = false,
): Promise<T | null> => {
  const result: CliResult = await cli(awsCall(ctx, region, argv, tolerated))
  return result.ok ? parseWith(schema, result.stdout.trim() === '' ? 'null' : result.stdout) : null
}

const nullable = <T>(schema: z.ZodType<T>) => schema.nullable()

/** A time as AWS CLI takes it: ISO 8601 to the second, in UTC. */
export const iso = (at: number) => new Date(at).toISOString().replace(/\.\d{3}Z$/, 'Z')

/** A probe that reads each region in turn; a region that fails is null, the others stay. */
function regional<T>(
  id: string,
  every: number,
  cost: ProbeCost,
  readRegion: (cli: RunCli, ctx: AwsContext, region: string) => Promise<T | null>,
): Probe<AwsContext, PerRegion<T>> {
  return {
    id,
    every,
    cost,
    after: 'setup',
    // A region that fails this time keeps its last good answer (cloud-cli.md §3.1).
    run: async (ctx, cli, previous) => {
      const out: PerRegion<T> = {}
      for (const region of ctx.regions())
        out[region] = (await readRegion(cli, ctx, region)) ?? previous?.[region] ?? null
      return out
    },
  }
}

/**
 * CloudWatch's `--dimensions` as JSON, never the `Name=…,Value=…` shorthand: a value taken from
 * an answer (an API's name, a bucket's) may hold a comma or an equals sign, which the shorthand
 * would read as another key.
 */
export const dimensionsArg = (dims: readonly { Name: string; Value: string }[]): string =>
  JSON.stringify(dims.map((d) => ({ Name: d.Name, Value: d.Value })))

/** The Name tag of a resource, the only tag a `--query` keeps. */
export const NAME_TAG = 'Tags[?Key==`Name`]|[0].Value'

/* ---- Global ---- */

/** The profile's own region (a local read of ~/.aws/config) when the pane names none. */
export const setupProbe: Probe<AwsContext, { region: string | null; credentialProcess: boolean }> =
  {
    id: 'setup',
    every: DAY,
    cost: 'free',
    // The alarms, the impaired check and the trail are `first` and read after it: it goes ahead
    // of RESOURCES' reads too, or another pane's first cycle would hold them all up.
    first: true,
    run: async (ctx, cli) => {
      const result = await cli({
        tool: 'aws',
        argv: ['configure', 'get', 'region', '--profile', ctx.spec.profile],
        tolerated: true,
      })
      // A profile signing in through credential_process runs that program on every CLI start,
      // which may open a window (cloud-cli.md §3.1): the pane says so. Its value is never kept.
      const process = await cli({
        tool: 'aws',
        argv: ['configure', 'get', 'credential_process', '--profile', ctx.spec.profile],
        tolerated: true,
      })
      return {
        region: regionName(result.stdout.trim()),
        credentialProcess: process.ok && process.stdout.trim() !== '',
      }
    },
    keyOf: (value) => value.region ?? '',
  }

export const identityProbe: Probe<AwsContext, z.infer<typeof IdentitySchema> | null> = {
  id: 'identity',
  first: true,
  every: 15 * MINUTE,
  cost: 'free',
  run: (ctx, cli) =>
    read(
      cli,
      ctx,
      GLOBAL,
      ['sts', 'get-caller-identity', '--query', '{account:Account,arn:Arn}'],
      IdentitySchema,
    ),
  keyOf: (value) => value?.account ?? '',
}

const aliasProbe: Probe<AwsContext, { alias: string | null } | null> = {
  id: 'alias',
  every: DAY,
  cost: 'free',
  run: async (ctx, cli) => {
    const alias = await read(
      cli,
      ctx,
      GLOBAL,
      ['iam', 'list-account-aliases', '--query', 'AccountAliases[0]'],
      nullable(z.string()),
      true,
    )
    return { alias }
  },
}

const summaryProbe: Probe<AwsContext, z.infer<typeof SummarySchema> | null> = {
  id: 'summary',
  every: HOUR,
  cost: 'free',
  run: (ctx, cli) =>
    read(
      cli,
      ctx,
      GLOBAL,
      [
        'iam',
        'get-account-summary',
        '--query',
        'SummaryMap.{mfa:AccountMFAEnabled,keys:AccountAccessKeysPresent,users:Users,roles:Roles}',
      ],
      SummarySchema,
    ),
}

const credentialsProbe: Probe<AwsContext, ReturnType<typeof parseCredentialReport> | null> = {
  id: 'credentials',
  every: 6 * HOUR,
  cost: 'free',
  run: async (ctx, cli) => {
    // Generating is asked first; a report still being made answers next time (six hours).
    await cli(awsCall(ctx, GLOBAL, ['iam', 'generate-credential-report', '--query', 'State'], true))
    const content = await read(
      cli,
      ctx,
      GLOBAL,
      ['iam', 'get-credential-report', '--query', 'Content'],
      z.string(),
      true,
    )
    return content === null
      ? null
      : parseCredentialReport(Buffer.from(content, 'base64').toString('utf8'))
  },
}

/** What the billing reading found: the month's points, and the services the metric lists. */
export interface BillingReading {
  points: [number, number][]
  there: boolean
  usd: boolean
  /** The services with a USD series (ServiceName), forty at most: billing-services reads them. */
  services: string[]
}

/** The month so far and last month, from the billing metric (free tier; us-east-1 only). */
export const billingProbe: Probe<AwsContext, BillingReading | null> = {
  id: 'billing',
  every: 6 * HOUR,
  cost: 'free-tier',
  run: async (ctx, cli) => {
    const metrics = await read(
      cli,
      ctx,
      GLOBAL,
      [
        'cloudwatch',
        'list-metrics',
        '--namespace',
        'AWS/Billing',
        '--metric-name',
        'EstimatedCharges',
        '--max-items',
        '200',
        '--query',
        'Metrics[].Dimensions',
      ],
      BillingMetricsSchema,
    )
    if (metrics === null) return null
    const currencies = new Set(
      metrics.flatMap((dims) => dims.filter((d) => d.Name === 'Currency').map((d) => d.Value)),
    )
    const services = billedServices(metrics)
    if (metrics.length === 0) return { points: [], there: false, usd: false, services }
    // Billed in another currency only: the USD series is not there to ask for.
    if (!currencies.has('USD')) return { points: [], there: true, usd: false, services }
    const now = ctx.now()
    const d = new Date(now)
    const lastMonth = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)
    const points = await read(
      cli,
      ctx,
      GLOBAL,
      [
        'cloudwatch',
        'get-metric-statistics',
        '--namespace',
        'AWS/Billing',
        '--metric-name',
        'EstimatedCharges',
        '--dimensions',
        dimensionsArg([{ Name: 'Currency', Value: 'USD' }]),
        '--start-time',
        iso(lastMonth),
        '--end-time',
        iso(now),
        '--period',
        '86400',
        '--statistics',
        'Maximum',
        '--query',
        'Datapoints[].[Timestamp,Maximum]',
      ],
      PointsSchema,
    )
    return {
      points: (points ?? [])
        .map(([t, usd]): [number, number] => [ms(t) ?? 0, usd])
        .sort((a, b) => a[0] - b[0]),
      there: true,
      usd: true,
      services,
    }
  },
}

/** The services of the billing metric's USD series by service, forty at most. */
function billedServices(metrics: { Name: string; Value: string }[][]): string[] {
  return [
    ...new Set(
      metrics.flatMap((dims) =>
        dims.length === 2 && dims.some((d) => d.Name === 'Currency' && d.Value === 'USD')
          ? dims.filter((d) => d.Name === 'ServiceName').map((d) => d.Value)
          : [],
      ),
    ),
  ].slice(0, 40)
}

/**
 * This month by service: a statistic each for the services the billing reading listed (free
 * tier). After it, from its answer: the same list-metrics twice was a call for nothing.
 */
const billingServicesProbe: Probe<AwsContext, { name: string; usd: number }[] | null> = {
  id: 'billing-services',
  every: 6 * HOUR,
  cost: 'free-tier',
  after: 'billing',
  run: async (ctx, cli) => {
    const services = ctx.billedServices()
    if (services === null) return null
    const now = ctx.now()
    const d = new Date(now)
    const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
    const out: { name: string; usd: number }[] = []
    for (const name of services) {
      const points = await read(
        cli,
        ctx,
        GLOBAL,
        [
          'cloudwatch',
          'get-metric-statistics',
          '--namespace',
          'AWS/Billing',
          '--metric-name',
          'EstimatedCharges',
          '--dimensions',
          dimensionsArg([
            { Name: 'ServiceName', Value: name },
            { Name: 'Currency', Value: 'USD' },
          ]),
          '--start-time',
          iso(start),
          '--end-time',
          iso(now),
          '--period',
          '86400',
          '--statistics',
          'Maximum',
          '--query',
          'Datapoints[].[Timestamp,Maximum]',
        ],
        PointsSchema,
        true,
      )
      const usd = Math.max(0, ...(points ?? []).map(([, v]) => v))
      out.push({ name, usd })
    }
    return out.sort((a, b) => b.usd - a.usd)
  },
}

const budgetsProbe: Probe<AwsContext, Budget[] | null> = {
  id: 'budgets',
  every: 6 * HOUR,
  cost: 'free',
  after: 'identity',
  run: async (ctx, cli) => {
    const account = ctx.account()
    if (account === null) return null
    const rows = await read(
      cli,
      ctx,
      GLOBAL,
      [
        'budgets',
        'describe-budgets',
        `--account-id=${account}`,
        '--max-items',
        '50',
        '--query',
        'Budgets[].{n:BudgetName,limit:BudgetLimit.Amount,actual:CalculatedSpend.ActualSpend.Amount,forecast:CalculatedSpend.ForecastedSpend.Amount}',
      ],
      // Not tolerated: a role that may not read budgets is PARTIAL, by the operation's name.
      nullable(BudgetsSchema),
    )
    return (rows ?? []).map((b) => ({
      name: b.n,
      limit: Number(b.limit ?? 0),
      actual: Number(b.actual ?? 0),
      forecast: b.forecast == null ? null : Number(b.forecast),
    }))
  },
}

const planProbe: Probe<AwsContext, PlanView | null> = {
  id: 'plan',
  every: 12 * HOUR,
  cost: 'free',
  run: async (ctx, cli) => {
    const state = await read(
      cli,
      ctx,
      GLOBAL,
      ['freetier', 'get-account-plan-state'],
      PlanStateSchema,
      true,
    )
    if (state !== null && state.accountPlanType !== null && state.accountPlanType !== undefined) {
      // A paid account without free-tier credits says nothing worth a band (aws.md §3.1).
      if (state.accountPlanType === 'PAID') return null
      return {
        kind: 'credits',
        status: state.accountPlanStatus ?? '',
        remaining: state.accountPlanRemainingCredits?.amount ?? null,
        expires: ms(state.accountPlanExpirationDate ?? null),
      }
    }
    const usage = await read(
      cli,
      ctx,
      GLOBAL,
      [
        'freetier',
        'get-free-tier-usage',
        '--max-items',
        '100',
        '--query',
        'freeTierUsages[].{s:service,u:usageType,a:actualUsageAmount,l:limit}',
      ],
      nullable(FreeTierSchema),
      true,
    )
    if (usage === null) return null
    return {
      kind: 'legacy',
      items: usage
        .filter((u) => (u.l ?? 0) > 0)
        .map((u) => ({ service: u.s ?? '', usage: u.u ?? '', share: (u.a ?? 0) / (u.l ?? 1) }))
        .sort((a, b) => b.share - a.share)
        .slice(0, 10),
    }
  },
}

const domainsProbe: Probe<
  AwsContext,
  { name: string; auto: boolean; expires: number | null }[] | null
> = {
  id: 'domains',
  every: DAY,
  cost: 'free',
  run: async (ctx, cli) => {
    const rows = await read(
      cli,
      ctx,
      GLOBAL,
      [
        'route53domains',
        'list-domains',
        '--max-items',
        '100',
        '--query',
        'Domains[].{n:DomainName,auto:AutoRenew,exp:Expiry}',
      ],
      nullable(DomainsSchema),
      true,
    )
    return rows === null
      ? null
      : rows.map((d) => ({ name: d.n, auto: d.auto === true, expires: ms(d.exp ?? null) }))
  },
}

const savingsProbe: Probe<
  AwsContext,
  { id: string; end: number | null; type: string | null }[] | null
> = {
  id: 'savings',
  every: DAY,
  cost: 'free',
  run: async (ctx, cli) => {
    const rows = await read(
      cli,
      ctx,
      GLOBAL,
      [
        'savingsplans',
        'describe-savings-plans',
        '--states',
        'active',
        '--query',
        'savingsPlans[].{id:savingsPlanId,end:end,type:savingsPlanType}',
      ],
      nullable(SavingsSchema),
      true,
    )
    return rows === null
      ? null
      : rows.map((p) => ({ id: p.id, end: ms(p.end ?? null), type: p.type ?? null }))
  },
}

/* ---- Regional ---- */

const alarmsProbe = regional('alarms', 5 * MINUTE, 'free-tier', async (cli, ctx, region) => {
  const a = await read(
    cli,
    ctx,
    region,
    [
      'cloudwatch',
      'describe-alarms',
      '--state-value',
      'ALARM',
      '--alarm-types',
      'CompositeAlarm',
      'MetricAlarm',
      '--max-items',
      '100',
      '--query',
      '{m:MetricAlarms[].{n:AlarmName,s:StateUpdatedTimestamp,ns:Namespace,dim:Dimensions[0].Value},c:CompositeAlarms[].{n:AlarmName,s:StateUpdatedTimestamp}}',
    ],
    AlarmsSchema,
  )
  if (a === null) return null
  return {
    metric: (a.m ?? []).map((x) => ({
      name: x.n,
      since: ms(x.s ?? null),
      namespace: x.ns ?? null,
      dim: x.dim ?? null,
    })),
    composite: (a.c ?? []).map((x) => ({ name: x.n, since: ms(x.s ?? null) })),
  }
})

const impairedProbe = regional('impaired', 5 * MINUTE, 'free', (cli, ctx, region) =>
  read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-instance-status',
      '--filters',
      'Name=instance-status.status,Values=impaired',
      '--max-items',
      '100',
      '--query',
      'InstanceStatuses[].InstanceId',
    ],
    IdsSchema,
  ),
)

/** Every stack but the deleted ones. */
const STACK_STATES = [
  'CREATE_IN_PROGRESS',
  'CREATE_FAILED',
  'CREATE_COMPLETE',
  'ROLLBACK_IN_PROGRESS',
  'ROLLBACK_FAILED',
  'ROLLBACK_COMPLETE',
  'DELETE_IN_PROGRESS',
  'DELETE_FAILED',
  'UPDATE_IN_PROGRESS',
  'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
  'UPDATE_COMPLETE',
  'UPDATE_FAILED',
  'UPDATE_ROLLBACK_IN_PROGRESS',
  'UPDATE_ROLLBACK_FAILED',
  'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
  'UPDATE_ROLLBACK_COMPLETE',
  'REVIEW_IN_PROGRESS',
  'IMPORT_IN_PROGRESS',
  'IMPORT_COMPLETE',
  'IMPORT_ROLLBACK_IN_PROGRESS',
  'IMPORT_ROLLBACK_FAILED',
  'IMPORT_ROLLBACK_COMPLETE',
]

const stacksProbe = regional('stacks', 15 * MINUTE, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'cloudformation',
      'list-stacks',
      '--stack-status-filter',
      ...STACK_STATES,
      '--max-items',
      '500',
      '--query',
      'StackSummaries[].{n:StackName,s:StackStatus,t:LastUpdatedTime||CreationTime,d:DriftInformation.StackDriftStatus}',
    ],
    StacksSchema,
  )
  return rows === null
    ? null
    : rows.map((s) => ({ name: s.n, status: s.s, at: ms(s.t ?? null), drift: s.d ?? null }))
})

const trailProbe = regional('trail', 15 * MINUTE, 'free', async (cli, ctx, region) => {
  if (!ctx.spec.activity) return []
  const result = await cli(
    awsCall(ctx, region, [
      'cloudtrail',
      'lookup-events',
      '--lookup-attributes',
      'AttributeKey=ReadOnly,AttributeValue=false',
      '--max-items',
      String(TRAIL_MAX),
      '--query',
      'Events[].{id:EventId,t:EventTime,n:EventName,s:EventSource,u:Username,e:CloudTrailEvent}',
    ]),
  )
  return result.ok ? parseTrail(result.stdout, region) : null
})

const instancesProbe = regional('instances', HOUR, 'free', (cli, ctx, region) =>
  read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-instances',
      '--max-items',
      '1000',
      '--query',
      `Reservations[].Instances[].{id:InstanceId,type:InstanceType,state:State.Name,launch:LaunchTime,az:Placement.AvailabilityZone,life:InstanceLifecycle,name:${NAME_TAG},platform:PlatformDetails,reason:StateTransitionReason,sgs:SecurityGroups[].GroupId,vpc:VpcId,subnet:SubnetId,ip:PrivateIpAddress,pub:PublicIpAddress,imds:MetadataOptions.HttpTokens}`,
    ],
    InstancesSchema,
  ),
)
// The instances' ids decide which CPU weeks are read.
instancesProbe.keyOf = (value) =>
  Object.values(value)
    .flatMap((rows) => (rows ?? []).filter((i) => i.state === 'running').map((i) => i.id))
    .sort()
    .join(' ')

const volumesProbe = regional('volumes', HOUR, 'free', (cli, ctx, region) =>
  read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-volumes',
      '--max-items',
      '1000',
      '--query',
      `Volumes[].{id:VolumeId,size:Size,type:VolumeType,state:State,iops:Iops,at:Attachments[0].InstanceId,created:CreateTime,name:${NAME_TAG}}`,
    ],
    VolumesSchema,
  ),
)

const addressesProbe = regional('addresses', HOUR, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-addresses',
      '--query',
      'Addresses[].{ip:PublicIp,assoc:AssociationId,inst:InstanceId}',
    ],
    AddressesSchema,
  )
  return rows === null
    ? null
    : rows.map((a) => ({
        ip: a.ip,
        associated: a.assoc != null,
        instance: a.inst ?? null,
      }))
})

const natsProbe = regional('nats', HOUR, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-nat-gateways',
      // A deleted gateway stays in the answer for about an hour: not asked for at all.
      '--filter',
      'Name=state,Values=pending,available,deleting,failed',
      '--max-items',
      '200',
      '--query',
      `NatGateways[].{id:NatGatewayId,state:State,vpc:VpcId,conn:ConnectivityType,name:${NAME_TAG}}`,
    ],
    NatsSchema,
  )
  return rows === null
    ? null
    : rows
        .filter((n) => n.state !== 'deleted')
        .map((n) => ({
          id: n.id,
          state: n.state,
          vpc: n.vpc ?? null,
          connectivity: n.conn ?? null,
          name: n.name ?? null,
        }))
})

const balancersProbe = regional('balancers', HOUR, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'elbv2',
      'describe-load-balancers',
      '--max-items',
      '200',
      '--query',
      'LoadBalancers[].{arn:LoadBalancerArn,name:LoadBalancerName,type:Type,scheme:Scheme,state:State.Code,created:CreatedTime}',
    ],
    BalancersSchema,
  )
  return rows === null
    ? null
    : rows.map((b) => ({
        arn: b.arn,
        name: b.name,
        type: b.type ?? 'application',
        scheme: b.scheme ?? null,
        state: b.state ?? null,
        created: ms(b.created ?? null),
      }))
})

/** Which of SSH, RDP and every port a group's world-open rules reach: the verdict alone crosses. */
export function openPorts(
  perms: {
    p?: string | null | undefined
    f?: number | null | undefined
    t?: number | null | undefined
  }[],
): ('ssh' | 'rdp' | 'all')[] {
  const out = new Set<'ssh' | 'rdp' | 'all'>()
  for (const perm of perms) {
    if (perm.p === '-1') {
      out.add('all')
      continue
    }
    const from = perm.f ?? 0
    const to = perm.t ?? 65535
    if (from <= 0 && to >= 65535) out.add('all')
    if (from <= 22 && to >= 22) out.add('ssh')
    if (from <= 3389 && to >= 3389) out.add('rdp')
  }
  return [...out].sort()
}

const openGroupsProbe = regional('open-groups', HOUR, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-security-groups',
      '--max-items',
      '1000',
      '--query',
      "SecurityGroups[].{id:GroupId,name:GroupName,perms:IpPermissions[?IpRanges[?CidrIp=='0.0.0.0/0'] || Ipv6Ranges[?CidrIpv6=='::/0']].{p:IpProtocol,f:FromPort,t:ToPort}}",
    ],
    OpenGroupsSchema,
  )
  return rows === null
    ? null
    : rows
        .map((g) => ({ id: g.id, name: g.name ?? null, ports: openPorts(g.perms ?? []) }))
        .filter((g) => g.ports.length > 0)
})

const databasesProbe = regional('databases', HOUR, 'free', (cli, ctx, region) =>
  read(
    cli,
    ctx,
    region,
    [
      'rds',
      'describe-db-instances',
      '--max-items',
      '200',
      '--query',
      'DBInstances[].{id:DBInstanceIdentifier,engine:Engine,version:EngineVersion,class:DBInstanceClass,state:DBInstanceStatus,multi:MultiAZ,support:EngineLifecycleSupport,created:InstanceCreateTime}',
    ],
    DbInstancesSchema,
  ),
)

const functionsProbe = regional('functions', HOUR, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'lambda',
      'list-functions',
      '--max-items',
      '1000',
      '--query',
      'Functions[].{n:FunctionName,r:Runtime,m:MemorySize,t:LastModified}',
    ],
    FunctionsSchema,
  )
  return rows === null
    ? null
    : rows.map((f) => ({
        name: f.n,
        runtime: f.r ?? null,
        memory: f.m ?? null,
        modified: ms(f.t ?? null),
      }))
})

const clustersProbe = regional('clusters', DAY, 'free', async (cli, ctx, region) => {
  const names = await read(
    cli,
    ctx,
    region,
    ['eks', 'list-clusters', '--max-items', '50', '--query', 'clusters'],
    IdsSchema,
  )
  if (names === null) return null
  if (names.length === 0) return []
  const versions =
    (await read(
      cli,
      ctx,
      region,
      [
        'eks',
        'describe-cluster-versions',
        '--query',
        'clusterVersions[].{v:clusterVersion,end:endOfStandardSupportDate}',
      ],
      ClusterVersionsSchema,
      true,
    )) ?? []
  const ends = new Map(versions.map((v) => [v.v, ms(v.end ?? null)]))
  const out = []
  for (const name of names) {
    const c = await read(
      cli,
      ctx,
      region,
      [
        'eks',
        'describe-cluster',
        `--name=${name}`,
        '--query',
        'cluster.{v:version,s:status,p:upgradePolicy.supportType}',
      ],
      ClusterSchema,
      true,
    )
    out.push({
      name,
      version: c?.v ?? null,
      status: c?.s ?? null,
      support: c?.p ?? null,
      standardEnds: c?.v ? (ends.get(c.v) ?? null) : null,
    })
  }
  return out
})

const KEY_TYPES =
  'keyTypes=RSA_1024,RSA_2048,RSA_3072,RSA_4096,EC_prime256v1,EC_secp384r1,EC_secp521r1'

/** Certificates in the pane's regions, and in us-east-1 for CloudFront's (aws.md §3.1). */
export const certificatesProbe: Probe<AwsContext, PerRegion<Certificate[]>> = {
  id: 'certificates',
  every: DAY,
  cost: 'free',
  after: 'setup',
  run: async (ctx, cli, previous) => {
    const out: PerRegion<Certificate[]> = {}
    for (const region of [...new Set([...ctx.regions(), GLOBAL])]) {
      const rows = await read(
        cli,
        ctx,
        region,
        [
          'acm',
          'list-certificates',
          '--includes',
          KEY_TYPES,
          '--max-items',
          '500',
          '--query',
          'CertificateSummaryList[].{arn:CertificateArn,d:DomainName,t:Type,exp:NotAfter,use:InUse,s:Status}',
        ],
        CertificatesSchema,
        region === GLOBAL && !ctx.regions().includes(GLOBAL),
      )
      out[region] =
        rows === null
          ? (previous?.[region] ?? null)
          : rows.map((c) => ({
              arn: c.arn,
              domain: c.d ?? null,
              type: c.t ?? null,
              expires: ms(c.exp ?? null),
              inUse: c.use === true,
              status: c.s ?? null,
            }))
    }
    return out
  },
}

const backupsProbe = regional('backups', HOUR, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'backup',
      'list-backup-jobs',
      '--by-state',
      'FAILED',
      '--by-created-after',
      iso(ctx.now() - DAY),
      '--max-items',
      '50',
      '--query',
      'BackupJobs[].{id:BackupJobId,t:CreationDate,type:ResourceType}',
    ],
    BackupJobsSchema,
    true,
  )
  return rows === null
    ? null
    : rows.map((j) => ({ id: j.id, type: j.type ?? null, at: ms(j.t ?? null) }))
})

/** Fifty bucket-class pairs at most, a statistic each: S3's own API is never called (LIST bills). */
const MAX_BUCKET_METRICS = 50

const bucketsProbe = regional('buckets', DAY, 'free-tier', async (cli, ctx, region) => {
  const dims = await read(
    cli,
    ctx,
    region,
    [
      'cloudwatch',
      'list-metrics',
      '--namespace',
      'AWS/S3',
      '--metric-name',
      'BucketSizeBytes',
      '--max-items',
      '500',
      '--query',
      'Metrics[].Dimensions',
    ],
    BillingMetricsSchema,
  )
  if (dims === null) return null
  const pairs = dims
    .map((d) => ({
      bucket: d.find((x) => x.Name === 'BucketName')?.Value ?? '',
      storage: d.find((x) => x.Name === 'StorageType')?.Value ?? '',
    }))
    .filter((p) => p.bucket !== '' && p.storage !== '')
    .slice(0, MAX_BUCKET_METRICS)
  const now = ctx.now()
  const out = []
  for (const pair of pairs) {
    const points = await read(
      cli,
      ctx,
      region,
      [
        'cloudwatch',
        'get-metric-statistics',
        '--namespace',
        'AWS/S3',
        '--metric-name',
        'BucketSizeBytes',
        '--dimensions',
        dimensionsArg([
          { Name: 'BucketName', Value: pair.bucket },
          { Name: 'StorageType', Value: pair.storage },
        ]),
        '--start-time',
        iso(now - 3 * DAY),
        '--end-time',
        iso(now),
        '--period',
        '86400',
        '--statistics',
        'Average',
        '--query',
        'Datapoints[].[Timestamp,Average]',
      ],
      PointsSchema,
      true,
    )
    const latest = [...(points ?? [])].sort((a, b) => (ms(b[0]) ?? 0) - (ms(a[0]) ?? 0))[0]
    if (latest !== undefined) out.push({ ...pair, bytes: latest[1] })
  }
  return out
})

/** The 7-day CPU of running instances (50 at most), for IDLE: one statistic each, free tier. */
const MAX_CPU = 50

export const cpuProbe: Probe<AwsContext, PerRegion<Record<string, CpuWeek>>> = {
  id: 'cpu',
  every: DAY,
  cost: 'free-tier',
  after: 'instances',
  // The instances changing re-runs it: only new ones, or a week read a day ago, are asked.
  run: async (ctx, cli, previous) => {
    const running = ctx
      .running()
      // The longest running first (aws.md §3.1): they are the ones left on.
      .sort((a, b) => a.launch - b.launch)
      .slice(0, MAX_CPU)
    const now = ctx.now()
    const out: PerRegion<Record<string, CpuWeek>> = {}
    for (const instance of running) {
      // GetMetricData already read its CPU, fourteen days of it, in one call for the region.
      if (cpuByMetricData(ctx, instance)) continue
      const kept = previous?.[instance.region]?.[instance.id]
      if (kept?.at !== undefined && now - kept.at < DAY) {
        out[instance.region] = { ...out[instance.region], [instance.id]: kept }
        continue
      }
      const points = await read(
        cli,
        ctx,
        instance.region,
        [
          'cloudwatch',
          'get-metric-statistics',
          '--namespace',
          'AWS/EC2',
          '--metric-name',
          'CPUUtilization',
          '--dimensions',
          dimensionsArg([{ Name: 'InstanceId', Value: instance.id }]),
          '--start-time',
          iso(now - 7 * DAY),
          '--end-time',
          iso(now),
          '--period',
          '86400',
          '--statistics',
          'Average',
          'Maximum',
          '--query',
          'Datapoints[].{t:Timestamp,avg:Average,max:Maximum}',
        ],
        StatPointsSchema,
        true,
      )
      const sorted = [...(points ?? [])].sort((a, b) => (ms(a.t) ?? 0) - (ms(b.t) ?? 0))
      const region = out[instance.region] ?? {}
      out[instance.region] = region
      region[instance.id] = {
        avg: sorted.map((p) => p.avg ?? 0),
        max: sorted.map((p) => p.max ?? 0),
        at: now,
      }
    }
    return out
  },
}

/**
 * Whether RESOURCES' GetMetricData has an instance's daily CPU and its NetworkOut both, the pair
 * forgotten.ts judges low use by. With the CPU alone (the month's cap stopped the batches between
 * the two) it falls back to this probe's week, which must then be read.
 */
export function cpuByMetricData(
  ctx: Pick<AwsContext, 'readings'>,
  instance: { id: string; region: string },
): boolean {
  const usage = ctx.readings().res.usage[instance.region]
  const read = (metric: string) => {
    const series =
      usage?.[seriesKey({ ns: 'AWS/EC2', metric, dim: 'InstanceId', value: instance.id })]
    return series !== undefined && series.via === 'gmd' && series.v.length > 0
  }
  return read('CPUUtilization') && read('NetworkOut')
}

const guarddutyProbe = regional('guardduty', HOUR, 'free', async (cli, ctx, region) => {
  const detector = await read(
    cli,
    ctx,
    region,
    ['guardduty', 'list-detectors', '--query', 'DetectorIds[0]'],
    nullable(z.string()),
    true,
  )
  if (detector === null) return null
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'guardduty',
      'get-findings-statistics',
      `--detector-id=${detector}`,
      '--group-by',
      'SEVERITY',
      '--query',
      'FindingStatistics.GroupedBySeverity[].{s:Severity,c:TotalFindings}',
    ],
    SeveritySchema,
    true,
  )
  if (rows === null) return null
  const sum = (lo: number, hi: number) =>
    rows.filter((r) => r.s >= lo && r.s < hi).reduce((n, r) => n + r.c, 0)
  return { high: sum(7, 11), medium: sum(4, 7), low: sum(0, 4) }
})

const reservedProbe = regional('reserved', DAY, 'free', async (cli, ctx, region) => {
  const rows = await read(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-reserved-instances',
      '--filters',
      'Name=state,Values=active',
      '--query',
      'ReservedInstances[].{id:ReservedInstancesId,end:End,type:InstanceType,n:InstanceCount}',
    ],
    ReservedSchema,
    true,
  )
  return rows === null
    ? null
    : rows.map((r) => ({ id: r.id, end: ms(r.end ?? null), type: r.type ?? null, count: r.n ?? 1 }))
})

// The sign-in, alarms, health and the trail go ahead of RESOURCES' bulk reads (aws.md §14.4).
alarmsProbe.first = true
impairedProbe.first = true
trailProbe.first = true

/* ---- Paid: Cost Explorer, only when the user turned it on (aws.md §3.3) ---- */

/** Whether Cost Explorer may be asked now: on, under its cap, and its own period passed. */
export function costExplorerDue(
  settings: CostExplorerSettings | null,
  refreshing: boolean,
  now: number,
): boolean {
  if (settings === null || settings.state !== 'on') return false
  // Two requests a reading (the month by service, and the forecast).
  if (settings.used + 2 > settings.cap) return false
  // REFRESH reads only in MANUAL; ONCE A DAY and EVERY 12 H keep their frequency (aws.md §3.3).
  if (settings.every === 'manual') return refreshing
  if (settings.failedAt !== null && now - settings.failedAt < HOUR) return false
  const period = settings.every === '12h' ? 12 * HOUR : DAY
  return settings.lastReadAt === null || now - settings.lastReadAt >= period
}

/**
 * The paid probe. Its answer goes to the account's store (`costExplorerAnswered`), not the
 * board, and its calls are tolerated: a failure is tried again an hour on, never by the
 * scheduler's backoff, which would pay again within minutes.
 */
export const costExplorerProbe: Probe<AwsContext, null> = {
  id: 'cost-explorer',
  every: 12 * HOUR,
  cost: { setting: 'aws.costExplorer', perRequestUsd: CE_PRICE_USD },
  // The account first: before it is known nothing can be claimed.
  after: 'identity',
  run: async (ctx, cli) => {
    if (!ctx.claimCostExplorer()) return null
    try {
      ctx.costExplorerAnswered(await readCostExplorer(ctx, cli))
    } catch {
      ctx.costExplorerAnswered({ kind: 'failed' })
    }
    return null
  },
}

async function readCostExplorer(ctx: AwsContext, cli: RunCli): Promise<CostExplorerAnswer> {
  const now = ctx.now()
  const d = new Date(now)
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)
  const today = new Date(now).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10)
  const month = await cli(
    awsCall(
      ctx,
      GLOBAL,
      [
        'ce',
        'get-cost-and-usage',
        '--time-period',
        `Start=${start},End=${start === today ? end : today}`,
        '--granularity',
        'MONTHLY',
        '--metrics',
        'UnblendedCost',
        '--group-by',
        'Type=DIMENSION,Key=SERVICE',
      ],
      true,
    ),
  )
  if (!month.ok)
    return /AccessDenied|not authorized|not enabled|DataUnavailable/i.test(month.stderr)
      ? { kind: 'refused' }
      : { kind: 'failed' }
  const parsed = parseWith(CostServicesSchema, month.stdout)
  const totals = new Map<string, number>()
  for (const period of parsed?.ResultsByTime ?? [])
    for (const group of period.Groups ?? []) {
      const name = group.Keys[0] ?? 'Other'
      totals.set(name, (totals.get(name) ?? 0) + Number(group.Metrics.UnblendedCost?.Amount ?? 0))
    }
  const forecast = await read(
    cli,
    ctx,
    GLOBAL,
    [
      'ce',
      'get-cost-forecast',
      '--time-period',
      `Start=${today},End=${end}`,
      '--granularity',
      'MONTHLY',
      '--metric',
      'UNBLENDED_COST',
    ],
    ForecastSchema,
    true,
  )
  return {
    kind: 'read',
    services: [...totals.entries()]
      .map(([name, usd]) => ({ name, usd }))
      .sort((a, b) => b.usd - a.usd),
    forecast: forecast?.Total?.Amount === undefined ? null : Number(forecast.Total.Amount),
  }
}

/** The whole table, most needed first. */
export const AWS_PROBES: readonly Probe<AwsContext, unknown>[] = [
  setupProbe,
  identityProbe,
  alarmsProbe,
  impairedProbe,
  billingProbe,
  summaryProbe,
  stacksProbe,
  trailProbe,
  instancesProbe,
  volumesProbe,
  addressesProbe,
  natsProbe,
  balancersProbe,
  databasesProbe,
  openGroupsProbe,
  functionsProbe,
  budgetsProbe,
  aliasProbe,
  planProbe,
  credentialsProbe,
  billingServicesProbe,
  certificatesProbe,
  clustersProbe,
  backupsProbe,
  guarddutyProbe,
  reservedProbe,
  domainsProbe,
  savingsProbe,
  bucketsProbe,
  cpuProbe,
  costExplorerProbe,
]

/** SLOW ×4: every period four times as long, but the billing metric's (aws.md §5.6). */
export function slowed(
  probes: readonly Probe<AwsContext, unknown>[],
): Probe<AwsContext, unknown>[] {
  return probes.map((probe) =>
    probe.id === 'billing' || probe.id === 'cost-explorer' || probe.id === 'setup'
      ? probe
      : { ...probe, every: probe.every * 4 },
  )
}
