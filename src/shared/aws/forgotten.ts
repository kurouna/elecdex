import { AWS_LIMITS } from './facts.js'
import type { Presence, Series } from './parse-resources.js'
import type { AwsReadings, CpuWeek } from './readings.js'
import { allResources, elsewhereRows, type Res, readIn, resKey } from './resources.js'
import type { AwsService, ForgottenReason, ForgottenRow, Weight } from './types.js'

/**
 * "Looks forgotten" (aws.md §14.3): one predicate per kind over RESOURCES' rows, each saying
 * what was seen - which reason, over how long a window, from what - never "delete it". The
 * sentence of every reason is made here and only here (`whyOf`), so LOOKS FORGOTTEN, the
 * drill-down, ATTENTION's summary and ACTIVE's IDLE and WASTE say the same thing. Pure.
 *
 * How quiet is read: a series of daily values (GetMetricData, or a statistic when it is off)
 * says "no traffic 30 d"; without one, list-metrics' answer says only that no data point came in
 * 14 days ("14 d+", longer from main's own record of when the metric was last listed). A metric
 * AWS sends zeros for (NAT, RDS, ElastiCache…) is never judged by its presence.
 */

const DAY = 86_400_000
const days = (ms: number) => Math.floor(ms / DAY)
const mmdd = (at: number) => new Date(at).toISOString().slice(5, 10)

/** IDLE when GetMetricData is off: a running instance's 7-day CPU under both (ACTIVE's rule). */
export const IDLE = { avgPercent: 2, maxPercent: 10 } as const

/** Whether a running instance's week of CPU says it is doing nothing. */
export function isIdle(week: { avg: number[]; max: number[] } | undefined): boolean {
  if (week === undefined || week.avg.length < 7) return false
  const avg = week.avg.reduce((s, v) => s + v, 0) / week.avg.length
  return avg < IDLE.avgPercent && Math.max(...week.max) < IDLE.maxPercent
}

/** What a predicate says: the facts its sentence is made of travel in `facts`. */
export interface Finding {
  reason: ForgottenReason
  billed: boolean
  quietFor: string
  window: number
  cost: number | null
  notPriced?: boolean
  source: string
  facts?: Facts
}

export interface Facts {
  quiet?: string
  since?: string
  days?: number
  lowDays?: number
  cpu?: string
  gib?: number
  size?: string
  rcu?: number
  wcu?: number
  ends?: string
  gone?: string
  what?: string
  ocu?: number
  peers?: number
  region?: string
}

/** The sentence of each reason (aws.md §14.3's examples), from its facts. */
const TEXT: Record<ForgottenReason, (f: Facts) => string> = {
  'low-use': (f) => `low use ${f.lowDays} of ${f.days} d · ${f.cpu} % CPU`,
  stopped: (f) => `stopped ${f.days} d${f.gib ? ` · ${f.gib} GiB still billed` : ''}`,
  unattached: (f) => `not attached since ${f.since} (first seen)${f.gib ? ` · ${f.gib} GiB` : ''}`,
  'no-traffic': (f) => `no traffic ${f.quiet}`,
  'no-targets': () => 'no targets',
  'no-requests': (f) => `no ${f.what ?? 'requests'} ${f.quiet}${f.ends ? ` · ${f.ends}` : ''}`,
  'no-connections': (f) => `no connections ${f.quiet}`,
  'desired-0': () => 'desired 0 · nothing runs',
  'empty-cluster': () => 'empty cluster · no services, no tasks',
  'no-nodes': () => 'no nodes · control plane billed',
  empty: (f) => `empty${f.days !== undefined ? ` · created ${ageText(f.days)} ago` : ''}`,
  unchanged: (f) => `unchanged since ${f.since} · ${f.size} mostly in STANDARD`,
  'orphan-log-group': (f) => `${f.what ?? 'source'} gone · ${f.size}${f.ends ?? ''}`,
  'no-events': (f) => `no events ${f.quiet} · ${f.size} kept forever`,
  'unused-capacity': (f) => `provisioned ${f.rcu}/${f.wcu}, unused ${f.quiet}`,
  'no-messages': (f) => `no messages ${f.quiet}`,
  'no-subscribers': () => 'no subscribers',
  'not-invoked': (f) => `not invoked ${f.quiet}`,
  'pt-unused': (f) =>
    `PT billed by the hour · no calls seen ${f.quiet}${f.ends ? ` · commitment ends ${f.ends}` : ''}`,
  'unused-model': (f) => `${f.what ?? 'custom model'} unused ${f.quiet}`,
  'no-searches': (f) =>
    `no searches ${f.quiet}${f.ocu === undefined ? '' : f.peers ? ` · shares ${f.ocu} OCU with ${f.peers} collection${f.peers === 1 ? '' : 's'}` : ` · ${f.ocu} OCU its own`}`,
  'alarm-orphan': (f) => `watches ${f.gone}, which is gone`,
  'orphan-snapshot': (f) =>
    `its volume is gone · ${f.gib} GiB${f.days !== undefined ? ` · ${ageText(f.days)} old` : ''}`,
  'unused-ami': (f) => `no launch ${f.quiet} · ${f.gib} GiB of snapshots`,
  'no-pulls': (f) => `no push or pull ${f.quiet}${f.size ? ` · ${f.size}` : ''}`,
  elsewhere: (f) => `in ${f.region} · ${f.what} · use not read (region not shown)`,
  'tunnel-down': (f) => `every tunnel down ${f.quiet}`,
  'left-running': (f) => `${f.what ?? 'InService'} ${f.quiet}`,
  'key-disabled': () => 'disabled, no deletion scheduled · billed monthly',
  'empty-zone': () => 'only NS and SOA records',
  'no-records': (f) => `no records ${f.quiet}`,
  'no-transfers': (f) => `no transfers ${f.quiet}`,
}

export const whyOf = (reason: ForgottenReason, facts: Facts = {}): string => TEXT[reason](facts)

/** "2 y", "9 mo", "41 d". */
export function ageText(d: number): string {
  if (d >= 730) return `${Math.floor(d / 365)} y`
  if (d >= 60) return `${Math.floor(d / 30)} mo`
  return `${d} d`
}

/* ---- How quiet: a series, list-metrics, or not known ---- */

/** One metric that says a resource is used, by the dimension that names it. */
export interface MetricSpec {
  ns: string
  metric: string
  dim: string
  value: string
  /** AWS sends zeros for it while the resource exists: its presence says nothing. */
  always?: boolean
  /**
   * The one dimension is the metric's whole dimension set, so it can be asked for without
   * list-metrics finding it first; otherwise only the sets list-metrics found are asked for.
   */
  exact?: boolean
}

export const seriesKey = (spec: Pick<MetricSpec, 'ns' | 'metric' | 'dim' | 'value'>): string =>
  `${spec.ns}|${spec.metric}|${spec.dim}=${spec.value}`

export type Use =
  | { state: 'quiet'; window: number; quietFor: string; source: string }
  | { state: 'active' }
  | { state: 'unknown' }

function seriesUse(spec: MetricSpec, series: Series): Use {
  if (series.v.some((v) => v > 0)) return { state: 'active' }
  return {
    state: 'quiet',
    window: series.d,
    quietFor: `${series.d} d`,
    source: `${spec.ns} ${spec.metric} · ${series.d} daily points, none above 0 (${series.via === 'gmd' ? 'get-metric-data' : 'get-metric-statistics'})`,
  }
}

function presenceUse(
  spec: MetricSpec,
  presence: Presence | null | undefined,
  lastSeen: number | undefined,
  now: number,
): Use {
  const listed = presence?.[`${spec.ns} ${spec.metric}`]
  if (listed === undefined || spec.always === true) return { state: 'unknown' }
  if (listed.some((dims) => dims.some((d) => d.Name === spec.dim && d.Value === spec.value)))
    return { state: 'active' }
  // Longer than list-metrics' fourteen days only by main's own record of the last listing.
  const longer = lastSeen !== undefined && now - lastSeen > 14 * DAY
  return {
    state: 'quiet',
    window: longer ? days(now - lastSeen) : 14,
    quietFor: longer ? `since ${mmdd(lastSeen)}` : '14 d+',
    source: `${spec.ns} ${spec.metric} not in list-metrics (no data point in 14 d)`,
  }
}

/** Quiet only when every metric is: the shortest window and its words. */
export function useOf(
  r: AwsReadings,
  region: string,
  specs: readonly MetricSpec[],
  presence: Presence | null | undefined = r.res.presence[region],
): Use {
  let quiet: Extract<Use, { state: 'quiet' }> | null = null
  for (const spec of specs) {
    const key = seriesKey(spec)
    const series = r.res.usage[region]?.[key]
    const one =
      series === undefined
        ? presenceUse(spec, presence, r.res.memory.lastMetric[`${region}|${key}`], r.now)
        : seriesUse(spec, series)
    if (one.state !== 'quiet') return one
    if (quiet === null || one.window < quiet.window) quiet = one
  }
  return quiet ?? { state: 'unknown' }
}

/** The metrics that say each kind is used (aws.md §14.3, §14.4b). */
export const USE: Partial<Record<AwsService, (x: Res) => MetricSpec[]>> = {
  nat: (x) => [
    {
      ns: 'AWS/NATGateway',
      metric: 'BytesOutToDestination',
      dim: 'NatGatewayId',
      value: x.id,
      always: true,
      exact: true,
    },
  ],
  rds: (x) => [
    {
      ns: 'AWS/RDS',
      metric: 'DatabaseConnections',
      dim: 'DBInstanceIdentifier',
      value: x.id,
      always: true,
      exact: true,
    },
  ],
  elb: (x) => {
    const value = String(x.cells.dimension ?? x.id)
    if (x.cells.type === 'classic')
      return [
        { ns: 'AWS/ELB', metric: 'RequestCount', dim: 'LoadBalancerName', value, exact: true },
      ]
    if (x.cells.type === 'network')
      return [
        { ns: 'AWS/NetworkELB', metric: 'ProcessedBytes', dim: 'LoadBalancer', value, exact: true },
      ]
    if (x.cells.type === 'gateway') return []
    return [
      { ns: 'AWS/ApplicationELB', metric: 'RequestCount', dim: 'LoadBalancer', value, exact: true },
    ]
  },
  lambda: (x) => [
    { ns: 'AWS/Lambda', metric: 'Invocations', dim: 'FunctionName', value: x.id, exact: true },
  ],
  sqs: (x) => [
    { ns: 'AWS/SQS', metric: 'NumberOfMessagesSent', dim: 'QueueName', value: x.id, exact: true },
  ],
  sns: (x) => [
    {
      ns: 'AWS/SNS',
      metric: 'NumberOfMessagesPublished',
      dim: 'TopicName',
      value: x.id,
      exact: true,
    },
  ],
  apigw: (x) =>
    x.cells.type === 'REST'
      ? [{ ns: 'AWS/ApiGateway', metric: 'Count', dim: 'ApiName', value: x.name, exact: true }]
      : x.cells.type === 'WebSocket'
        ? [{ ns: 'AWS/ApiGateway', metric: 'ConnectCount', dim: 'ApiId', value: x.id, exact: true }]
        : [{ ns: 'AWS/ApiGateway', metric: 'Count', dim: 'ApiId', value: x.id, exact: true }],
  cloudfront: (x) => [
    { ns: 'AWS/CloudFront', metric: 'Requests', dim: 'DistributionId', value: x.id },
  ],
  logs: (x) => [
    { ns: 'AWS/Logs', metric: 'IncomingBytes', dim: 'LogGroupName', value: x.id, exact: true },
  ],
  dynamodb: (x) => [
    {
      ns: 'AWS/DynamoDB',
      metric: 'ConsumedReadCapacityUnits',
      dim: 'TableName',
      value: x.id,
      exact: true,
    },
    {
      ns: 'AWS/DynamoDB',
      metric: 'ConsumedWriteCapacityUnits',
      dim: 'TableName',
      value: x.id,
      exact: true,
    },
  ],
  aoss: (x) => [{ ns: 'AWS/AOSS', metric: 'SearchRequestRate', dim: 'CollectionId', value: x.id }],
  vpce: (x) => [
    {
      ns: 'AWS/PrivateLinkEndpoints',
      metric: 'BytesProcessed',
      dim: 'VPC Endpoint Id',
      value: x.id,
    },
  ],
  tgw: (x) => [
    { ns: 'AWS/TransitGateway', metric: 'BytesIn', dim: 'TransitGatewayAttachment', value: x.id },
  ],
  elasticache: (x) =>
    x.cells.kind === 'serverless'
      ? []
      : [
          {
            ns: 'AWS/ElastiCache',
            metric: 'CurrConnections',
            dim: 'CacheClusterId',
            value: x.id,
            always: true,
          },
        ],
  opensearch: (x) => [
    { ns: 'AWS/ES', metric: 'SearchRate', dim: 'DomainName', value: x.id, always: true },
    { ns: 'AWS/ES', metric: 'IndexingRate', dim: 'DomainName', value: x.id, always: true },
  ],
  redshift: (x) =>
    x.cells.kind === 'cluster'
      ? [
          {
            ns: 'AWS/Redshift',
            metric: 'DatabaseConnections',
            dim: 'ClusterIdentifier',
            value: x.id,
            always: true,
            exact: true,
          },
        ]
      : [],
  kinesis: (x) => [
    { ns: 'AWS/Kinesis', metric: 'IncomingRecords', dim: 'StreamName', value: x.id, exact: true },
  ],
  transfer: (x) => [
    { ns: 'AWS/Transfer', metric: 'BytesIn', dim: 'ServerId', value: x.id, exact: true },
    { ns: 'AWS/Transfer', metric: 'BytesOut', dim: 'ServerId', value: x.id, exact: true },
  ],
  sagemaker: (x) =>
    x.cells.kind === 'endpoint'
      ? [{ ns: 'AWS/SageMaker', metric: 'Invocations', dim: 'EndpointName', value: x.name }]
      : [],
}

/**
 * The "namespace metric" pairs list-metrics is asked for in a region (the `quiet` probe): those
 * of the region's resources, but the ones asked for by their one exact dimension that AWS sends
 * zeros for anyway (NAT, RDS, Redshift: list-metrics would only say they exist).
 */
export function listedPairs(rows: readonly Res[]): [string, string][] {
  const pairs = new Map<string, [string, string]>()
  for (const x of rows)
    for (const spec of USE[x.service]?.(x) ?? [])
      if (!(spec.always === true && spec.exact === true))
        pairs.set(`${spec.ns} ${spec.metric}`, [spec.ns, spec.metric])
  if (rows.some((x) => x.service === 'aoss')) {
    pairs.set('AWS/AOSS SearchOCU', ['AWS/AOSS', 'SearchOCU'])
    pairs.set('AWS/AOSS IndexingOCU', ['AWS/AOSS', 'IndexingOCU'])
  }
  return [...pairs.values()].sort((x, y) => `${x[0]} ${x[1]}`.localeCompare(`${y[0]} ${y[1]}`))
}

/* ---- The predicates ---- */

interface Ctx {
  r: AwsReadings
  /** EBS monthly by the instance it is attached to. */
  volumesOf: Map<string, { gib: number; usd: number }>
}

type Predicate = (x: Res, c: Ctx) => Finding | null

const num = (x: Res, key: string): number | null =>
  typeof x.cells[key] === 'number' ? (x.cells[key] as number) : null

const gbText = (gb: number): string =>
  gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`

/** A predicate from a kind's metrics: quiet means the reason, with its money if it bills. */
function quietBy(reason: ForgottenReason, facts: (x: Res) => Facts = () => ({})): Predicate {
  return (x, c) => {
    const specs = USE[x.service]?.(x) ?? []
    if (specs.length === 0) return null
    const presence = x.service === 'cloudfront' ? c.r.res.cloudfrontPresence : undefined
    const use =
      presence === undefined ? useOf(c.r, x.region, specs) : useOf(c.r, x.region, specs, presence)
    if (use.state !== 'quiet') return null
    return {
      reason,
      billed: x.hourly || (x.monthly ?? 0) > 0,
      quietFor: use.quietFor,
      window: use.window,
      cost: x.monthly,
      notPriced: x.notPriced,
      source: use.source,
      facts: { quiet: use.quietFor, ...facts(x) },
    }
  }
}

/** Trusted Advisor's low use on GetMetricData's daily points, else ACTIVE's 7-day CPU rule. */
function lowUse(x: Res, c: Ctx): Finding | null {
  const usage = c.r.res.usage[x.region]
  const cpu =
    usage?.[seriesKey({ ns: 'AWS/EC2', metric: 'CPUUtilization', dim: 'InstanceId', value: x.id })]
  const net =
    usage?.[seriesKey({ ns: 'AWS/EC2', metric: 'NetworkOut', dim: 'InstanceId', value: x.id })]
  if (cpu !== undefined && net !== undefined && cpu.v.length > 0) {
    const n = Math.min(cpu.v.length, net.v.length)
    const low = cpu.v
      .slice(-n)
      .filter(
        (v, i) =>
          v <= AWS_LIMITS.lowUseCpuPercent &&
          (net.v.slice(-n)[i] ?? 0) <= AWS_LIMITS.lowUseNetworkBytes,
      ).length
    if (low < AWS_LIMITS.lowUseDays) return null
    const avg = cpu.v.reduce((s, v) => s + v, 0) / cpu.v.length
    return {
      reason: 'low-use',
      billed: true,
      quietFor: `${cpu.d} d`,
      window: cpu.d,
      cost: x.monthly,
      notPriced: x.notPriced,
      source: `AWS/EC2 CPUUtilization and NetworkOut · daily, ${cpu.d} d (${cpu.via === 'gmd' ? 'get-metric-data' : 'get-metric-statistics'})`,
      facts: { lowDays: low, days: n, cpu: avg.toFixed(1) },
    }
  }
  const week: CpuWeek | undefined = c.r.cpu[x.region]?.[x.id] ?? undefined
  if (!isIdle(week) || week === undefined) return null
  const avg = week.avg.reduce((s, v) => s + v, 0) / week.avg.length
  return {
    reason: 'low-use',
    billed: true,
    quietFor: '7 d',
    window: 7,
    cost: x.monthly,
    notPriced: x.notPriced,
    source: `AWS/EC2 CPUUtilization · 7 daily averages under ${IDLE.avgPercent} %, maxima under ${IDLE.maxPercent} %`,
    facts: { lowDays: week.avg.length, days: week.avg.length, cpu: avg.toFixed(1) },
  }
}

function ec2(x: Res, c: Ctx): Finding | null {
  if (x.state === 'stopped') {
    const at = num(x, 'stoppedAt')
    if (at === null || days(c.r.now - at) <= AWS_LIMITS.stoppedDays) return null
    const d = days(c.r.now - at)
    const vols = c.volumesOf.get(`${x.region}:${x.id}`)
    return {
      reason: 'stopped',
      billed: (vols?.usd ?? 0) > 0,
      quietFor: `${d} d`,
      window: d,
      cost: vols?.usd ?? null,
      source: 'describe-instances · StateTransitionReason; its volumes from describe-volumes',
      facts: { days: d, ...(vols ? { gib: vols.gib } : {}) },
    }
  }
  return x.hourly ? lowUse(x, c) : null
}

/** A volume or an address unattached: counted from main's first sight of it so (aws.md §14.3). */
function unattached(x: Res, c: Ctx): Finding | null {
  const loose = x.service === 'ebs' ? x.state === 'available' : x.state === 'not associated'
  if (!loose) return null
  const key = resKey(x)
  const since = c.r.res.memory.unattached[key] ?? c.r.res.memory.seen[key] ?? c.r.now
  const gib = num(x, 'gib')
  return {
    reason: 'unattached',
    billed: true,
    quietFor: `since ${mmdd(since)}`,
    window: days(c.r.now - since),
    cost: x.monthly,
    notPriced: x.monthly === null,
    source: `${x.service === 'ebs' ? 'describe-volumes · state available' : 'describe-addresses · no association'} · first seen by elecdex`,
    facts: { since: mmdd(since), ...(gib === null ? {} : { gib }) },
  }
}

function elb(x: Res, c: Ctx): Finding | null {
  if (!x.hourly) return null
  const noTargets =
    x.cells.type === 'classic'
      ? x.cells.instances === 0
      : (() => {
          const groups = c.r.res.elbTargets[x.region]?.groups
          if (groups === undefined) return false
          const mine = groups.filter((g) => g.lbs.includes(String(x.cells.dimension)))
          return mine.every((g) => g.targets === 0)
        })()
  if (noTargets)
    return {
      reason: 'no-targets',
      billed: true,
      quietFor: 'unknown',
      window: 0,
      cost: x.monthly,
      source:
        x.cells.type === 'classic'
          ? 'elb describe-load-balancers · no instances'
          : 'describe-target-health · no target in its groups',
    }
  return quietBy('no-requests')(x, c)
}

function s3(x: Res, c: Ctx): Finding | null {
  if (x.cells.empty === 'yes')
    return {
      reason: 'empty',
      billed: false,
      quietFor: 'unknown',
      window: 0,
      cost: null,
      source: 'in list-buckets, no BucketSizeBytes in its region',
      facts: x.created === null ? {} : { days: days(c.r.now - x.created) },
    }
  const kept = c.r.res.memory.s3[x.id]
  const share = num(x, 'standardShare') ?? 0
  const bytes = num(x, 'bytes') ?? 0
  if (kept === undefined || bytes <= 0 || share < 0.5) return null
  const d = days(c.r.now - kept.since)
  if (d < AWS_LIMITS.unchangedDays) return null
  return {
    reason: 'unchanged',
    billed: true,
    quietFor: `since ${mmdd(kept.since)}`,
    window: d,
    cost: x.monthly,
    source:
      "BucketSizeBytes flat since then (elecdex's own record) · mostly STANDARD, no lifecycle seen",
    facts: { since: mmdd(kept.since), size: gbText(bytes / 1024 ** 3) },
  }
}

/** A log group whose source is gone: said from the names alone, no call needed. */
/** The source a log group's name says it belongs to, when that source's list says it is gone. */
function goneSource(
  x: Res,
  r: AwsReadings,
): { what: 'function' | 'database'; name: string } | null {
  const fn = /^\/aws\/lambda\/(.+)$/.exec(x.id)?.[1]
  if (fn !== undefined)
    return readIn('lambda', r, x.region) && !r.functions[x.region]?.some((f) => f.name === fn)
      ? { what: 'function', name: fn }
      : null
  const db = /^\/aws\/rds\/(?:instance|cluster)\/([^/]+)\//.exec(x.id)?.[1]
  if (db === undefined) return null
  return readIn('rds', r, x.region) && !r.databases[x.region]?.some((d) => d.id === db)
    ? { what: 'database', name: db }
    : null
}

/** A log group whose source is gone: said from the names alone, no call needed. */
function logs(x: Res, c: Ctx): Finding | null {
  const gb = num(x, 'gb') ?? 0
  const forever = x.cells.retention === 'never'
  const gone = goneSource(x, c.r)
  const money = { billed: gb > 0, cost: gb > 0 ? x.monthly : null }
  if (gone !== null)
    return {
      reason: 'orphan-log-group',
      ...money,
      quietFor: 'unknown',
      window: 0,
      source: `no ${gone.what === 'function' ? 'Lambda function' : 'database'} named ${gone.name} in its region · no call needed`,
      facts: { what: gone.what, size: gbText(gb), ends: forever ? ' kept forever' : '' },
    }
  if (!forever) return null
  const quiet = quietBy('no-events', () => ({ size: gbText(gb) }))(x, c)
  return quiet === null ? null : { ...quiet, ...money }
}

function dynamodb(x: Res, c: Ctx): Finding | null {
  const provisioned = x.cells.mode === 'PROVISIONED'
  const found = quietBy(provisioned ? 'unused-capacity' : 'no-requests', () =>
    provisioned
      ? { rcu: num(x, 'rcu') ?? 0, wcu: num(x, 'wcu') ?? 0 }
      : { what: 'reads or writes' },
  )(x, c)
  return found === null ? null : { ...found, billed: provisioned }
}

const free =
  (p: Predicate): Predicate =>
  (x, c) => {
    const found = p(x, c)
    return found === null ? null : { ...found, billed: false, cost: null, notPriced: false }
  }

/** The model ids Bedrock reported Invocations for, in any region (cross-region inference). */
const bedrockCalled = (r: AwsReadings): string[] | null => {
  const lists = Object.values(r.res.bedrockUse).filter((x): x is string[] => x !== null)
  return lists.length === 0 ? null : lists.flat()
}

const calledAs = (called: readonly string[], id: string | null | undefined) =>
  id !== null &&
  id !== undefined &&
  id !== '' &&
  called.some((m) => m === id || m.endsWith(`/${id}`))

/** Bedrock: a Provisioned Throughput, or a custom or imported model nobody calls. */
function bedrock(x: Res, c: Ctx): Finding | null {
  const called = bedrockCalled(c.r)
  if (called === null) return null
  const kind = x.cells.kind
  if (kind === 'pt') return provisionedThroughput(x, c, called)
  if (kind !== 'custom' && kind !== 'imported') return null
  const id = x.id.slice(x.id.indexOf(':') + 1)
  if (calledAs(called, id) || calledAs(called, x.name)) return null
  return {
    reason: 'unused-model',
    billed: kind === 'custom',
    quietFor: '14 d+',
    window: 14,
    cost: kind === 'custom' ? x.monthly : null,
    source: 'not in AWS/Bedrock Invocations (list-metrics, every enabled region)',
    facts: { quiet: '14 d+', what: kind === 'custom' ? 'custom model' : 'imported model' },
  }
}

/**
 * A Provisioned Throughput is forgotten only when neither it nor its base model has any call
 * in the window: Bedrock's documents do not say which ModelId a PT's invocations report
 * (checked 2026-11-08), so the base model's calls make its use unknown, not forgotten.
 */
function provisionedThroughput(x: Res, c: Ctx, called: readonly string[]): Finding | null {
  if (x.state !== 'InService') return null
  const id = x.id.slice(x.id.indexOf(':') + 1)
  const names = [id, String(x.cells.model ?? ''), String(x.cells.base ?? '')]
  if (names.some((name) => calledAs(called, name))) return null
  const ends = num(x, 'commitmentEnds')
  return {
    reason: 'pt-unused',
    billed: true,
    quietFor: '14 d+',
    window: 14,
    cost: null,
    notPriced: true,
    source:
      'neither its id nor its base model in AWS/Bedrock Invocations (list-metrics, every enabled region)',
    facts: { quiet: '14 d+', ...(ends !== null && ends > c.r.now ? { ends: mmdd(ends) } : {}) },
  }
}

/** The dimension an alarm watches, and the kind whose list says whether it is still there. */
const ALARM_DIMS: Record<
  string,
  { service: AwsService; ids: (r: AwsReadings, region: string) => string[] | undefined }
> = {
  InstanceId: { service: 'ec2', ids: (r, g) => r.instances[g]?.map((i) => i.id) },
  DBInstanceIdentifier: { service: 'rds', ids: (r, g) => r.databases[g]?.map((d) => d.id) },
  VolumeId: { service: 'ebs', ids: (r, g) => r.volumes[g]?.map((v) => v.id) },
  NatGatewayId: { service: 'nat', ids: (r, g) => r.nats[g]?.map((n) => n.id) },
  FunctionName: { service: 'lambda', ids: (r, g) => r.functions[g]?.map((f) => f.name) },
  TableName: { service: 'dynamodb', ids: (r, g) => r.res.ddb[g]?.names },
  QueueName: { service: 'sqs', ids: (r, g) => r.res.sqs[g]?.map((q) => q.n) },
}

function alarms(x: Res, c: Ctx): Finding | null {
  const watch = ALARM_DIMS[String(x.cells.dimName ?? '')]
  const value = x.cells.dimValue
  if (watch === undefined || typeof value !== 'string') return null
  const ids = watch.ids(c.r, x.region)
  if (ids === undefined || ids.includes(value)) return null
  return {
    reason: 'alarm-orphan',
    billed: true,
    quietFor: 'unknown',
    window: 0,
    cost: x.monthly,
    source: 'describe-alarms (all states) · its dimension against the lists',
    facts: { gone: value },
  }
}

function snapshots(x: Res, c: Ctx): Finding | null {
  const volume = x.cells.volume
  if (x.cells.ami === 'yes' || typeof volume !== 'string' || !readIn('ebs', c.r, x.region))
    return null
  if (c.r.volumes[x.region]?.some((v) => v.id === volume)) return null
  const age = x.created === null ? undefined : days(c.r.now - x.created)
  return {
    reason: 'orphan-snapshot',
    billed: true,
    quietFor: age === undefined ? 'unknown' : `${age} d`,
    window: age ?? 0,
    cost: x.monthly,
    source:
      'describe-snapshots --owner-ids self · its volume not in describe-volumes, no image of yours uses it',
    facts: { gib: num(x, 'gib') ?? 0, ...(age === undefined ? {} : { days: age }) },
  }
}

/** Not used for `limit` days since `at` (null: never), counted from its creation then. */
function unusedSince(
  at: number | null,
  created: number | null,
  now: number,
  limit: number,
): number | null {
  const last = at ?? created
  if (last === null) return null
  const d = days(now - last)
  return d > limit ? d : null
}

function amis(x: Res, c: Ctx): Finding | null {
  if (x.state !== 'available') return null
  const d = unusedSince(num(x, 'lastLaunched'), x.created, c.r.now, AWS_LIMITS.unusedImageDays)
  if (d === null) return null
  return {
    reason: 'unused-ami',
    billed: (x.monthly ?? 0) > 0,
    quietFor: `${d} d`,
    window: d,
    cost: x.monthly,
    source: 'describe-images --owners self · LastLaunchedTime',
    facts: { quiet: `${d} d`, gib: num(x, 'gib') ?? 0 },
  }
}

function ecr(x: Res, c: Ctx): Finding | null {
  const last = Math.max(num(x, 'pulled') ?? 0, num(x, 'pushed') ?? 0)
  const d = unusedSince(last > 0 ? last : null, x.created, c.r.now, AWS_LIMITS.unusedImageDays)
  if (d === null) return null
  const gb = num(x, 'gb') ?? 0
  return {
    reason: 'no-pulls',
    billed: gb > 0,
    quietFor: `${d} d`,
    window: d,
    cost: gb > 0 ? x.monthly : null,
    source: 'ecr describe-images · imagePushedAt and lastRecordedPullTime',
    facts: { quiet: `${d} d`, ...(gb > 0 ? { size: gbText(gb) } : {}) },
  }
}

function vpn(x: Res, c: Ctx): Finding | null {
  const tunnels = num(x, 'tunnels') ?? 0
  const change = num(x, 'lastChange')
  if (!x.hourly || tunnels === 0 || num(x, 'tunnelsUp') !== 0 || change === null) return null
  const d = days(c.r.now - change)
  if (d < AWS_LIMITS.tunnelDownDays) return null
  return {
    reason: 'tunnel-down',
    billed: true,
    quietFor: `${d} d`,
    window: d,
    cost: x.monthly,
    source: 'describe-vpn-connections · VgwTelemetry status DOWN since its last change',
    facts: { quiet: `${d} d` },
  }
}

function sagemaker(x: Res, c: Ctx): Finding | null {
  if (x.state !== 'InService') return null
  if (x.cells.kind === 'endpoint')
    return quietBy('no-requests', () => ({ what: 'invocations' }))(x, c)
  const since = num(x, 'since')
  if (since === null) return null
  const d = days(c.r.now - since)
  const limit = x.cells.kind === 'notebook' ? AWS_LIMITS.notebookDays : AWS_LIMITS.studioAppDays
  if (d < limit) return null
  return {
    reason: 'left-running',
    billed: true,
    quietFor: `${d} d`,
    window: d,
    cost: x.monthly,
    notPriced: x.notPriced,
    source: `sagemaker list-${x.cells.kind === 'notebook' ? 'notebook-instances' : 'apps'} · InService since then`,
    facts: {
      quiet: `${d} d`,
      what: `${x.cells.kind === 'notebook' ? 'notebook' : 'Studio app'} InService`,
    },
  }
}

const kms = (x: Res): Finding | null =>
  x.state === 'Disabled'
    ? {
        reason: 'key-disabled',
        billed: true,
        quietFor: 'unknown',
        window: 0,
        cost: x.monthly,
        source: 'kms describe-key · KeyState Disabled, no DeletionDate',
      }
    : null

const route53 = (x: Res): Finding | null =>
  (num(x, 'records') ?? 3) <= 2
    ? {
        reason: 'empty-zone',
        billed: true,
        quietFor: 'unknown',
        window: 0,
        cost: x.monthly,
        source: 'route53 list-hosted-zones · ResourceRecordSetCount 2',
      }
    : null

const PREDICATES: Partial<Record<AwsService, Predicate>> = {
  ec2,
  ebs: unattached,
  eip: unattached,
  nat: (x, c) => (x.hourly ? quietBy('no-traffic')(x, c) : null),
  elb,
  rds: (x, c) => (x.hourly ? quietBy('no-connections')(x, c) : null),
  eks: (x) =>
    x.cells.nodegroups === 0 && x.cells.fargate === 0
      ? {
          reason: 'no-nodes',
          billed: true,
          quietFor: 'unknown',
          window: 0,
          cost: x.monthly,
          source: 'eks list-nodegroups and list-fargate-profiles: none',
        }
      : null,
  ecs: (x) => {
    if (x.cells.kind === 'service' && x.cells.desired === 0)
      return {
        reason: 'desired-0',
        billed: false,
        quietFor: 'unknown',
        window: 0,
        cost: null,
        source: 'ecs describe-services · desiredCount 0',
      }
    if (x.cells.kind === 'cluster' && x.cells.services === 0 && x.cells.tasks === 0)
      return {
        reason: 'empty-cluster',
        billed: false,
        quietFor: 'unknown',
        window: 0,
        cost: null,
        source: 'ecs describe-clusters · no services, no tasks',
      }
    return null
  },
  s3,
  logs,
  dynamodb,
  sqs: free(quietBy('no-messages')),
  sns: (x, c) =>
    x.cells.subs === 0
      ? {
          reason: 'no-subscribers',
          billed: false,
          quietFor: 'unknown',
          window: 0,
          cost: null,
          source: 'sns list-subscriptions (topic ARNs only)',
        }
      : free(quietBy('no-messages'))(x, c),
  apigw: free(
    quietBy('no-requests', (x) => ({
      what: x.cells.type === 'WebSocket' ? 'connections' : 'requests',
    })),
  ),
  cloudfront: (x, c) =>
    x.cells.enabled === 'yes'
      ? free(quietBy('no-requests', () => ({ ends: 'still enabled' })))(x, c)
      : null,
  lambda: free(quietBy('not-invoked')),
  bedrock,
  aoss: quietBy('no-searches', (x) => {
    const ocu = num(x, 'ocu')
    return ocu === null ? {} : { ocu, peers: num(x, 'peers') ?? 0 }
  }),
  alarms,
  snapshots,
  amis,
  ecr,
  vpce: (x, c) => (x.hourly ? quietBy('no-traffic')(x, c) : null),
  tgw: (x, c) => (x.hourly ? quietBy('no-traffic')(x, c) : null),
  vpn,
  sagemaker,
  elasticache: (x, c) => (x.hourly ? quietBy('no-connections')(x, c) : null),
  opensearch: quietBy('no-searches'),
  redshift: (x, c) => (x.hourly ? quietBy('no-connections')(x, c) : null),
  kinesis: (x, c) => (x.hourly ? quietBy('no-records')(x, c) : null),
  transfer: (x, c) => (x.hourly ? quietBy('no-transfers')(x, c) : null),
  kms,
  route53,
}

/** What the sweep saw that bills: by kind, its words (aws.md §14.2 D). */
const ELSEWHERE: Partial<Record<AwsService, (x: Res, now: number) => string | null>> = {
  ec2: (x, now) =>
    x.state === 'running'
      ? `running${x.created === null ? '' : ` ${ageText(days(now - x.created))}`}`
      : null,
  ebs: (x) => (x.state === 'available' ? `volume not attached · ${num(x, 'gib') ?? 0} GiB` : null),
  nat: () => 'NAT gateway',
  eip: (x) => (x.state === 'not associated' ? 'address not associated' : null),
}

/** Outside the pane's regions only describe was read: what is there, never how it is used. */
function elsewhere(x: Res, now: number): Finding | null {
  const what = ELSEWHERE[x.service]?.(x, now) ?? null
  if (what === null) return null
  return {
    reason: 'elsewhere',
    billed: true,
    quietFor: 'unknown',
    window: 0,
    cost: x.monthly,
    notPriced: x.notPriced,
    source: `the weekly sweep · describe only in ${x.region}`,
    facts: { region: x.region, what },
  }
}

function weightOf(billed: boolean, monthly: number | null): Weight {
  if (!billed) return 'quiet'
  return (monthly ?? 0) >= AWS_LIMITS.forgottenDangerUsd ? 'danger' : 'warn'
}

function rowOf(x: Res, f: Finding): ForgottenRow {
  return {
    key: resKey(x),
    service: x.service,
    id: x.id,
    region: x.region,
    name: x.name,
    reason: f.reason,
    why: whyOf(f.reason, f.facts),
    quietFor: f.quietFor,
    window: f.window,
    billed: f.billed,
    monthly: f.billed ? f.cost : null,
    notPriced: f.billed && (f.notPriced === true || f.cost === null),
    weight: weightOf(f.billed, f.cost),
    source: f.source,
    reshown: false,
  }
}

/**
 * The order (aws.md §14.2 B): what bills before what does not, the unpriced first among the
 * billed (their amount is unknown, not small), then the ≈ $ a month from now - halved for a
 * window shorter than the quiet days, so a judgement on a few days ranks lower - and the
 * longer quiet breaking ties.
 */
export function rank(
  rows: readonly ForgottenRow[],
  quietDays: number = AWS_LIMITS.quietDays,
): ForgottenRow[] {
  const score = (row: ForgottenRow) =>
    (row.monthly ?? 0) * (row.window >= quietDays || row.window === 0 ? 1 : 0.5)
  return [...rows].sort(
    (a, b) =>
      Number(b.billed) - Number(a.billed) ||
      Number(b.notPriced) - Number(a.notPriced) ||
      score(b) - score(a) ||
      b.window - a.window ||
      a.key.localeCompare(b.key),
  )
}

export interface ForgottenList {
  /** Shown, ranked. */
  rows: ForgottenRow[]
  /** Marked KEEP and still under twice their amount then. */
  kept: ForgottenRow[]
  /** KEEP marks to take off: their ≈ $ more than doubled (their rows are in `rows`, `reshown`). */
  released: string[]
}

const cache = new WeakMap<AwsReadings, ForgottenList>()

/** Every resource that looks forgotten, KEEP applied (aws.md §14.3). Computed once a reading. */
export function forgotten(r: AwsReadings): ForgottenList {
  const known = cache.get(r)
  if (known !== undefined) return known
  const resources = allResources(r)
  const c: Ctx = { r, volumesOf: volumesByInstance(resources.get('ebs') ?? []) }
  const all: ForgottenRow[] = []
  for (const [service, rows] of resources) {
    const predicate = PREDICATES[service]
    for (const x of predicate === undefined ? [] : rows) {
      const found = predicate?.(x, c) ?? null
      if (found !== null) all.push(rowOf(x, found))
    }
  }
  for (const x of elsewhereRows(r)) {
    const found = elsewhere(x, r.now)
    if (found !== null) all.push(rowOf(x, found))
  }
  const list = applyKeep(rank(all), r.res.memory.keep)
  cache.set(r, list)
  return list
}

/** The GiB and ≈ $ of the volumes attached to each instance, by `region:instance`. */
function volumesByInstance(volumes: readonly Res[]): Map<string, { gib: number; usd: number }> {
  const out = new Map<string, { gib: number; usd: number }>()
  for (const v of volumes) {
    const at = v.cells.attached
    if (typeof at !== 'string') continue
    const key = `${v.region}:${at}`
    const before = out.get(key) ?? { gib: 0, usd: 0 }
    out.set(key, { gib: before.gib + (num(v, 'gib') ?? 0), usd: before.usd + (v.monthly ?? 0) })
  }
  return out
}

/** KEEP (aws.md §14.3): a kept row leaves the list until its ≈ $ more than doubles. */
export function applyKeep(
  rows: readonly ForgottenRow[],
  keep: Readonly<Record<string, { usd: number }>>,
): ForgottenList {
  const shown: ForgottenRow[] = []
  const kept: ForgottenRow[] = []
  const released: string[] = []
  for (const row of rows) {
    const mark = keep[row.key]
    if (mark === undefined) shown.push(row)
    else if ((row.monthly ?? 0) > mark.usd * AWS_LIMITS.keepReshow && (row.monthly ?? 0) > 0) {
      released.push(row.key)
      shown.push({ ...row, reshown: true })
    } else kept.push(row)
  }
  return { rows: shown, kept, released }
}

/** The forgotten row of one resource, kept or not: the drill-down's third step. */
export function forgottenOf(
  r: AwsReadings,
  service: AwsService,
  region: string,
  id: string,
): { row: ForgottenRow; kept: boolean } | null {
  const key = `${service}:${region}:${id}`
  const list = forgotten(r)
  const shown = list.rows.find((row) => row.key === key)
  if (shown !== undefined) return { row: shown, kept: false }
  const kept = list.kept.find((row) => row.key === key)
  return kept === undefined ? null : { row: kept, kept: true }
}
