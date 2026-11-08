import { GMD_PRICE_USD, METERED_TINY_CAP } from '@shared/aws/billing'
import { listedPairs, type MetricSpec, seriesKey, USE } from '@shared/aws/forgotten'
import { IdsSchema, ms, PointsSchema, parseWith } from '@shared/aws/parse'
import {
  AlarmsAllSchema,
  AossSchema,
  ApisSchema,
  ApisV2Schema,
  BedrockNamesSchema,
  BedrockSchema,
  BucketListSchema,
  CachesSchema,
  ClassicSchema,
  DdbSchema,
  DdbTableSchema,
  type Dimensions,
  DimensionsSchema,
  DistributionsSchema,
  EcrSchema,
  EcsClustersSchema,
  EcsSchema,
  EcsServicesSchema,
  EksNodesSchema,
  ElbTargetsSchema,
  ImagesSchema,
  KinesisSchema,
  KmsSchema,
  LogGroupsSchema,
  lastPart,
  MetricDataSchema,
  modelIdOf,
  OsDomainsSchema,
  type Presence,
  PresenceSchema,
  PtSchema,
  QueueAttributesSchema,
  RedshiftSchema,
  RegionListSchema,
  RestApisSchema,
  SagemakerSchema,
  type Series,
  SnsSchema,
  SqsSchema,
  type SweepRegion,
  SweepRegionSchema,
  TargetGroupsSchema,
  TgwSchema,
  TransferSchema,
  type Usage,
  UsageSchema,
  VpceSchema,
  VpcsSchema,
  VpnSchema,
  ZonesSchema,
} from '@shared/aws/parse-resources'
import type { PerRegion } from '@shared/aws/readings'
import { allResources, balancerDimension, GLOBAL, type Res } from '@shared/aws/resources'
import { classifyCliError } from '@shared/cloud-cli/errors'
import type { CliCall, CliResult, Probe, ProbeCost, RunCli } from '@shared/cloud-cli/probe'
import { DAY, HOUR, isFree, MINUTE } from '@shared/cloud-cli/probe'
import { z } from 'zod'
import { notStarted } from '../cloud-cli/scheduler.js'
import { type AwsContext, dimensionsArg, iso, NAME_TAG } from './probes.js'

/**
 * RESOURCES' probes (aws.md §14.4, §14.4a, §14.4b): free describes and lists with `--query`
 * keeping the fields the tab shows and `--max-items` bounding them, list-metrics to know what is
 * used, GetMetricData (paid, under the account's cap) for 30 days of the billed candidates, and
 * the weekly sweep of the regions the pane does not show. Every reading is the account's: kept
 * in `aws-inventory.json` and read again only after its period, whichever pane of the account
 * reads it first (`AwsContext.shared`).
 *
 * Every call is tolerated: a refusal is still PARTIAL by its operation's name, a region without
 * the service is `not-offered`, and a failure keeps the last answer. A single value a call takes
 * from an answer (a table's name) goes as `--option=value`, so a name can never read as an
 * option; a list of them (`--clusters`, `--ids`, `--services`, `--domain-names`) cannot, and holds
 * only ARNs and ids AWS makes, none of which begins with "-". Dimensions go as JSON.
 */

const WEEK = 7 * DAY
/** The key a global reading is kept under. */
export const GLOBAL_KEY = 'global'

/** The per-account readings a board shares with the others of its account (aws.md §14.4). */
export interface SharedReads {
  get<T>(probe: string, region: string, schema: z.ZodType<T>): { at: number; value: T } | null
  put(probe: string, region: string, value: unknown): void
  /**
   * One board of the account at a time per probe and region: a second board waits for the
   * first's turn to end and then finds its answer in the store. The bulk lanes run three
   * readings at once, so two boards of one account would otherwise call the CLI twice for one
   * reading - and twice under a paid cap.
   */
  turn<T>(probe: string, region: string, work: () => Promise<T>): Promise<T>
  sweep(): { on: boolean; asked: number | null }
  gmdAvailable(): boolean
  /**
   * GetMetricData's cap, checked and taken in one step before the call: `n` metrics reserved
   * when this month has room for them, false (the cap reached) when it has not.
   */
  gmdReserve(n: number): boolean
  /** Metrics reserved for a call that was never started (the board stopped while it waited). */
  gmdRefund(n: number): void
  gmdCapReached(): void
  /** One more metered-tiny request this month, under its fixed cap; false when none is left. */
  tiny(probe: string, cap: number): boolean
  /** A metered-tiny request taken for a call that was never started. */
  tinyRefund(probe: string): void
}

interface Options {
  tolerated?: boolean
  silent?: boolean
}

const call = (ctx: AwsContext, region: string, argv: string[], options: Options = {}): CliCall => ({
  tool: 'aws',
  argv: [...argv, '--profile', ctx.spec.profile, '--region', region],
  tolerated: options.tolerated ?? true,
  ...(options.silent === true ? { silent: true } : {}),
})

/**
 * A read of one call: the parsed answer, or null; `notOffered` when the region lacks the
 * service. The CLI's words for that are its words offline too, so they count only while another
 * call of the board in that region has just reached AWS (aws.md §14.4); otherwise it is the
 * network, and nothing is kept as "not offered".
 */
async function ask<T>(
  cli: RunCli,
  ctx: AwsContext,
  region: string,
  argv: string[],
  schema: z.ZodType<T>,
  options: Options = {},
): Promise<{ value: T | null; notOffered: boolean }> {
  const result: CliResult = await cli(call(ctx, region, argv, options))
  if (!result.ok)
    return {
      value: null,
      notOffered: classifyCliError('aws', result).kind === 'not-offered' && ctx.reached(region),
    }
  return { value: parseWith(schema, answerText(result)), notOffered: false }
}

/** An empty answer is the `--query` of an absent key: JSON's null. */
const answerText = (result: CliResult): string =>
  result.stdout.trim() === '' ? 'null' : result.stdout

const q = async <T>(
  cli: RunCli,
  ctx: AwsContext,
  region: string,
  argv: string[],
  schema: z.ZodType<T>,
  options: Options = {},
): Promise<T | null> => (await ask(cli, ctx, region, argv, schema, options)).value

/** A list that answers null when empty (`--query` of an absent key). */
const list = <T>(schema: z.ZodType<T[]>) => schema.nullable().transform((v) => v ?? [])

type ReadRegion<T> = (cli: RunCli, ctx: AwsContext, region: string) => Promise<T | null>

interface SharedSpec<T> {
  id: string
  every: number
  cost: ProbeCost
  schema: z.ZodType<T>
  read: ReadRegion<T>
  /** The regions it reads; the pane's by default. A global one reads `GLOBAL_KEY` once. */
  regions?: (ctx: AwsContext) => string[]
  global?: boolean
  bulk: 'count' | 'judge'
  after?: string
}

/**
 * Whether a kept reading may stand: younger than the board's period for it, and not older than
 * a REFRESH press by five minutes (a press reads again what is not a few minutes old). Like Cost
 * Explorer (`costExplorerDue`), a call that costs money - paid, or metered under its fixed cap -
 * never reads again for a press, only for its period.
 */
function fresh(ctx: AwsContext, id: string, cost: ProbeCost, at: number): boolean {
  const now = ctx.now()
  if (now - at >= ctx.every(id)) return false
  if (!isFree(cost)) return true
  return !(ctx.refreshedAt() > at && now - at > 5 * MINUTE)
}

/**
 * One region's reading for the account, kept for every board of it: the kept answer while
 * `keep` says it may stand, else read now, or what it had when the reading fails. The look at
 * the store and the reading are one turn of the account's (`SharedReads.turn`): a board that
 * comes while another reads waits, and then takes that answer instead of calling the CLI.
 */
function readOnce<T>(
  store: SharedReads,
  id: string,
  region: string,
  spec: {
    schema: z.ZodType<T>
    keep: (kept: { at: number; value: T }) => boolean
    fallback: T | null
    read: () => Promise<T | null>
  },
): Promise<T | null> {
  return store.turn(id, region, async () => {
    const kept = store.get(id, region, spec.schema)
    if (kept !== null && spec.keep(kept)) return kept.value
    const value = await spec.read()
    if (value !== null) store.put(id, region, value)
    return value ?? kept?.value ?? spec.fallback
  })
}

/** A probe whose readings are the account's, per region, kept and shared (aws.md §14.4). */
function shared<T>(spec: SharedSpec<T>): Probe<AwsContext, PerRegion<T>> {
  return {
    id: spec.id,
    every: spec.every,
    cost: spec.cost,
    after: spec.after ?? 'identity',
    bulk: spec.bulk,
    run: async (ctx, cli, previous) => {
      const store = ctx.shared()
      if (store === null) return previous ?? {}
      const out: PerRegion<T> = {}
      const regions = spec.global === true ? [GLOBAL_KEY] : (spec.regions?.(ctx) ?? ctx.regions())
      for (const region of regions)
        out[region] = await readOnce(store, spec.id, region, {
          schema: spec.schema,
          keep: (kept) => fresh(ctx, spec.id, spec.cost, kept.at),
          fallback: previous?.[region] ?? null,
          read: () => spec.read(cli, ctx, region === GLOBAL_KEY ? GLOBAL : region),
        })
      return out
    },
  }
}

const count = <T>(
  id: string,
  every: number,
  schema: z.ZodType<T>,
  read: ReadRegion<T>,
  extra: Partial<SharedSpec<T>> = {},
) => shared({ id, every, cost: 'free', schema, read, bulk: 'count', ...extra })

/* ---- The lists (aws.md §14.4, §14.4b) ---- */

/** S3's bucket list: metered-tiny, 31 requests a month per account at most (user decision 2026-11-08). */
export const bucketListProbe = shared({
  id: 'res-buckets',
  every: DAY,
  cost: { metered: 'tiny', monthlyCap: METERED_TINY_CAP, decided: '2026-11-08' },
  schema: BucketListSchema,
  global: true,
  bulk: 'count',
  read: async (cli, ctx, region) => {
    const store = ctx.shared()
    if (store?.tiny('res-buckets', METERED_TINY_CAP) !== true) return null
    const result = await cli(
      call(ctx, region, [
        's3api',
        'list-buckets',
        '--max-items',
        '1000',
        '--query',
        'Buckets[].[Name,CreationDate,BucketRegion]',
      ]),
    )
    // Taken before the call; a call never started is given back.
    if (notStarted(result)) store.tinyRefund('res-buckets')
    return result.ok ? parseWith(list(BucketListSchema), answerText(result)) : null
  },
})

const logGroupsProbe = count('res-logs', 6 * HOUR, LogGroupsSchema, (cli, ctx, region) =>
  q(
    cli,
    ctx,
    region,
    [
      'logs',
      'describe-log-groups',
      '--max-items',
      '1000',
      '--query',
      'logGroups[].[logGroupName,creationTime,retentionInDays,storedBytes,logGroupClass]',
    ],
    list(LogGroupsSchema),
  ),
)

const ddbProbe = count('res-ddb', 6 * HOUR, DdbSchema, async (cli, ctx, region) => {
  const names = await q(
    cli,
    ctx,
    region,
    ['dynamodb', 'list-tables', '--max-items', '100', '--query', 'TableNames'],
    list(IdsSchema),
  )
  if (names === null) return null
  const tables = []
  // Fifty described at most: a table's billing mode and capacity are only in describe-table.
  for (const name of names.slice(0, 50)) {
    const table = await q(
      cli,
      ctx,
      region,
      [
        'dynamodb',
        'describe-table',
        `--table-name=${name}`,
        '--query',
        'Table.{n:TableName,s:TableStatus,c:CreationDateTime,b:TableSizeBytes,i:ItemCount,m:BillingModeSummary.BillingMode,r:ProvisionedThroughput.ReadCapacityUnits,w:ProvisionedThroughput.WriteCapacityUnits,k:TableClassSummary.TableClass}',
      ],
      DdbTableSchema,
    )
    if (table !== null) tables.push(table)
  }
  return { names, tables }
})

const ecsProbe = count('res-ecs', HOUR, EcsSchema, async (cli, ctx, region) => {
  const arns = await q(
    cli,
    ctx,
    region,
    ['ecs', 'list-clusters', '--max-items', '50', '--query', 'clusterArns'],
    list(IdsSchema),
  )
  if (arns === null) return null
  if (arns.length === 0) return { clusters: [], services: [] }
  const clusters = await q(
    cli,
    ctx,
    region,
    [
      'ecs',
      'describe-clusters',
      '--clusters',
      ...arns,
      '--query',
      'clusters[].{n:clusterName,s:status,svc:activeServicesCount,run:runningTasksCount,pend:pendingTasksCount}',
    ],
    list(EcsClustersSchema),
  )
  if (clusters === null) return null
  const services = []
  for (const cluster of clusters.filter((c) => (c.svc ?? 0) > 0).slice(0, 20)) {
    const ids = await q(
      cli,
      ctx,
      region,
      [
        'ecs',
        'list-services',
        `--cluster=${cluster.n}`,
        '--max-items',
        '100',
        '--query',
        'serviceArns',
      ],
      list(IdsSchema),
    )
    for (let i = 0; i < (ids ?? []).length; i += 10) {
      const rows = await q(
        cli,
        ctx,
        region,
        [
          'ecs',
          'describe-services',
          `--cluster=${cluster.n}`,
          '--services',
          ...(ids ?? []).slice(i, i + 10),
          '--query',
          'services[].{n:serviceName,d:desiredCount,r:runningCount,l:launchType,c:createdAt}',
        ],
        list(EcsServicesSchema),
      )
      services.push(...(rows ?? []).map((s) => ({ cl: cluster.n, ...s })))
    }
  }
  return { clusters, services }
})

const eksNodesProbe = count(
  'res-eks',
  DAY,
  EksNodesSchema,
  async (cli, ctx, region) => {
    const out = []
    for (const cluster of ctx.clusterNames(region).slice(0, 20)) {
      const nodegroups = await q(
        cli,
        ctx,
        region,
        ['eks', 'list-nodegroups', `--cluster-name=${cluster}`, '--query', 'nodegroups'],
        list(IdsSchema),
      )
      const fargate = await q(
        cli,
        ctx,
        region,
        [
          'eks',
          'list-fargate-profiles',
          `--cluster-name=${cluster}`,
          '--query',
          'fargateProfileNames',
        ],
        list(IdsSchema),
      )
      out.push({ cluster, nodegroups, fargate })
    }
    return out
  },
  // The clusters' names come from the board's own clusters reading.
  { after: 'clusters' },
)

const elbTargetsProbe = count('res-elb', 6 * HOUR, ElbTargetsSchema, async (cli, ctx, region) => {
  const groups = await q(
    cli,
    ctx,
    region,
    [
      'elbv2',
      'describe-target-groups',
      '--max-items',
      '400',
      '--query',
      'TargetGroups[].{n:TargetGroupName,arn:TargetGroupArn,lbs:LoadBalancerArns}',
    ],
    list(TargetGroupsSchema),
  )
  const classic = await q(
    cli,
    ctx,
    region,
    [
      'elb',
      'describe-load-balancers',
      '--max-items',
      '100',
      '--query',
      'LoadBalancerDescriptions[].{n:LoadBalancerName,c:CreatedTime,i:length(Instances),s:Scheme}',
    ],
    list(ClassicSchema),
  )
  if (groups === null && classic === null) return null
  const out = []
  let asked = 0
  for (const group of groups ?? []) {
    // Only a group behind a load balancer is judged by its targets ("no targets" is the
    // balancer's), fifty of them at most; the rest are listed without.
    const behind = (group.lbs ?? []).length > 0
    const targets =
      behind && asked++ < 50
        ? await q(
            cli,
            ctx,
            region,
            [
              'elbv2',
              'describe-target-health',
              `--target-group-arn=${group.arn}`,
              '--query',
              'length(TargetHealthDescriptions)',
            ],
            z.number(),
          )
        : null
    out.push({ n: group.n, lbs: (group.lbs ?? []).map(balancerDimension), targets })
  }
  return { groups: out, classic: classic ?? [] }
})

/** The dead-letter target's name from a redrive policy's JSON (its ARN's last part). */
function redriveTarget(policy: string | null | undefined): string | null {
  if (policy === null || policy === undefined) return null
  try {
    const target = (JSON.parse(policy) as { deadLetterTargetArn?: unknown }).deadLetterTargetArn
    return typeof target === 'string' ? lastPart(target) : null
  } catch {
    return null
  }
}

const sqsProbe = count('res-sqs', 6 * HOUR, SqsSchema, async (cli, ctx, region) => {
  const urls = await q(
    cli,
    ctx,
    region,
    ['sqs', 'list-queues', '--max-items', '100', '--query', 'QueueUrls'],
    list(IdsSchema),
  )
  if (urls === null) return null
  const out = []
  // The URL names the account: it is used for the call and dropped; only the name is kept.
  for (const url of urls.slice(0, 50)) {
    const a = await q(
      cli,
      ctx,
      region,
      [
        'sqs',
        'get-queue-attributes',
        `--queue-url=${url}`,
        '--attribute-names',
        'ApproximateNumberOfMessages',
        'CreatedTimestamp',
        'RedrivePolicy',
        '--query',
        'Attributes.{m:ApproximateNumberOfMessages,c:CreatedTimestamp,r:RedrivePolicy}',
      ],
      QueueAttributesSchema,
    )
    out.push({
      n: lastPart(url),
      m: a?.m ? Number(a.m) : null,
      c: a?.c ? Number(a.c) * 1000 : null,
      dlq: redriveTarget(a?.r),
    })
  }
  return out
})

const snsProbe = count('res-sns', 6 * HOUR, SnsSchema, async (cli, ctx, region) => {
  const topics = await q(
    cli,
    ctx,
    region,
    ['sns', 'list-topics', '--max-items', '200', '--query', 'Topics[].TopicArn'],
    list(IdsSchema),
  )
  if (topics === null) return null
  // The subscriptions' topics only: their endpoints (addresses, URLs) never enter main.
  const subs = await q(
    cli,
    ctx,
    region,
    ['sns', 'list-subscriptions', '--max-items', '1000', '--query', 'Subscriptions[].TopicArn'],
    list(IdsSchema),
  )
  const counts: Record<string, number> = {}
  for (const arn of subs ?? []) counts[lastPart(arn)] = (counts[lastPart(arn)] ?? 0) + 1
  return { topics: topics.map(lastPart), subs: counts }
})

const apisProbe = count('res-apis', 6 * HOUR, ApisSchema, async (cli, ctx, region) => {
  const rest = await q(
    cli,
    ctx,
    region,
    [
      'apigateway',
      'get-rest-apis',
      '--max-items',
      '100',
      '--query',
      'items[].{id:id,n:name,c:createdDate}',
    ],
    list(RestApisSchema),
  )
  const v2 = await q(
    cli,
    ctx,
    region,
    [
      'apigatewayv2',
      'get-apis',
      '--max-items',
      '100',
      '--query',
      'Items[].{id:ApiId,n:Name,p:ProtocolType,c:CreatedDate}',
    ],
    list(ApisV2Schema),
  )
  return rest === null && v2 === null ? null : { rest: rest ?? [], v2: v2 ?? [] }
})

const distributionsProbe = count(
  'res-cloudfront',
  6 * HOUR,
  DistributionsSchema,
  (cli, ctx, region) =>
    q(
      cli,
      ctx,
      region,
      [
        'cloudfront',
        'list-distributions',
        '--max-items',
        '100',
        '--query',
        'DistributionList.Items[].[Id,Enabled,Status,LastModifiedTime,Aliases.Items[0]]',
      ],
      list(DistributionsSchema),
    ),
  { global: true },
)

const ptQuery =
  'provisionedModelSummaries[].{n:provisionedModelName,a:provisionedModelArn,m:modelArn,f:foundationModelArn,s:status,u:modelUnits,d:commitmentDuration,e:commitmentExpirationTime,c:creationTime}'

const ptRows = (rows: z.infer<typeof PtSchema>) =>
  rows.map((p) => ({
    id: lastPart(p.a),
    n: p.n,
    m: modelIdOf(p.m),
    f: modelIdOf(p.f),
    s: p.s,
    u: p.u,
    d: p.d,
    e: p.e,
    c: p.c,
  }))

const Named = z.array(
  z.object({
    id: z.string(),
    n: z.string().nullable().optional(),
    s: z.string().nullable().optional(),
    u: z.union([z.string(), z.number()]).nullable().optional(),
    c: z.union([z.string(), z.number()]).nullable().optional(),
  }),
)
const Models = z.array(
  z.object({
    n: z.string(),
    a: z.string(),
    b: z.string().nullable().optional(),
    c: z.union([z.string(), z.number()]).nullable().optional(),
  }),
)
const Profiles = z.array(
  z.object({
    id: z.string(),
    n: z.string().nullable().optional(),
    s: z.string().nullable().optional(),
    m: z.array(z.string()).nullable().optional(),
  }),
)
const KbStore = z.object({
  t: z.string().nullable().optional(),
  c: z.string().nullable().optional(),
})

async function knowledgeBases(cli: RunCli, ctx: AwsContext, region: string) {
  const kbs =
    (await q(
      cli,
      ctx,
      region,
      [
        'bedrock-agent',
        'list-knowledge-bases',
        '--max-items',
        '100',
        '--query',
        'knowledgeBaseSummaries[].{id:knowledgeBaseId,n:name,s:status,u:updatedAt}',
      ],
      list(Named),
    )) ?? []
  const out = []
  for (const [i, kb] of kbs.entries()) {
    // Twenty linked to their vector store at most (get-knowledge-base, one call each).
    const store =
      i < 20
        ? await q(
            cli,
            ctx,
            region,
            [
              'bedrock-agent',
              'get-knowledge-base',
              `--knowledge-base-id=${kb.id}`,
              '--query',
              'knowledgeBase.storageConfiguration.{t:type,c:opensearchServerlessConfiguration.collectionArn}',
            ],
            KbStore,
          )
        : null
    out.push({
      id: kb.id,
      n: kb.n,
      s: kb.s,
      u: kb.u,
      store: store?.t ?? null,
      collection: store?.c ? lastPart(store.c) : null,
    })
  }
  return out
}

/** What Bedrock has placed (aws.md §14.4): one call says whether the region offers it at all. */
const bedrockProbe = count('res-bedrock', 6 * HOUR, BedrockSchema, async (cli, ctx, region) => {
  const pts = await ask(
    cli,
    ctx,
    region,
    ['bedrock', 'list-provisioned-model-throughputs', '--query', ptQuery],
    list(PtSchema),
  )
  const empty = {
    pts: [],
    custom: [],
    imported: [],
    guardrails: [],
    agents: [],
    kbs: [],
    runtimes: [],
    profiles: [],
  }
  if (pts.notOffered) return { offered: false, ...empty }
  if (pts.value === null) return null
  const custom = await q(
    cli,
    ctx,
    region,
    [
      'bedrock',
      'list-custom-models',
      '--max-items',
      '100',
      '--query',
      'modelSummaries[].{n:modelName,a:modelArn,b:baseModelArn,c:creationTime}',
    ],
    list(Models),
  )
  const imported = await q(
    cli,
    ctx,
    region,
    [
      'bedrock',
      'list-imported-models',
      '--max-items',
      '100',
      '--query',
      'modelSummaries[].{n:modelName,a:modelArn,c:creationTime}',
    ],
    list(Models),
  )
  const guardrails = await q(
    cli,
    ctx,
    region,
    [
      'bedrock',
      'list-guardrails',
      '--max-items',
      '100',
      '--query',
      'guardrails[].{id:id,n:name,s:status,c:createdAt}',
    ],
    list(Named),
  )
  const profiles = await q(
    cli,
    ctx,
    region,
    [
      'bedrock',
      'list-inference-profiles',
      '--type-equals',
      'APPLICATION',
      '--max-items',
      '100',
      '--query',
      'inferenceProfileSummaries[].{id:inferenceProfileId,n:inferenceProfileName,s:status,m:models[].modelArn}',
    ],
    list(Profiles),
  )
  const agents = await q(
    cli,
    ctx,
    region,
    [
      'bedrock-agent',
      'list-agents',
      '--max-items',
      '100',
      '--query',
      'agentSummaries[].{id:agentId,n:agentName,s:agentStatus,u:updatedAt}',
    ],
    list(Named),
  )
  const runtimes = await q(
    cli,
    ctx,
    region,
    [
      'bedrock-agentcore-control',
      'list-agent-runtimes',
      '--max-items',
      '100',
      '--query',
      'agentRuntimes[].{id:agentRuntimeId,n:agentRuntimeName,s:status,u:lastUpdatedAt}',
    ],
    list(Named),
  )
  return {
    offered: true,
    pts: ptRows(pts.value),
    custom: (custom ?? []).map((m) => ({ id: lastPart(m.a), n: m.n, b: modelIdOf(m.b), c: m.c })),
    imported: (imported ?? []).map((m) => ({ id: lastPart(m.a), n: m.n, c: m.c })),
    guardrails: (guardrails ?? []).map((g) => ({ id: g.id, n: g.n, s: g.s, c: g.c })),
    agents: (agents ?? []).map((a) => ({ id: a.id, n: a.n, s: a.s, u: a.u })),
    kbs: await knowledgeBases(cli, ctx, region),
    runtimes: (runtimes ?? []).map((x) => ({ id: x.id, n: x.n, s: x.s, u: x.u })),
    profiles: (profiles ?? []).map((p) => ({
      id: p.id,
      n: p.n,
      s: p.s,
      m: (p.m ?? []).map((a) => modelIdOf(a) ?? a),
    })),
  }
})

const PtRowsSchema = BedrockSchema.shape.pts

/** Provisioned Throughput bills by the hour: its list is read every hour (aws.md §14.4). */
const bedrockPtProbe = count('res-bedrock-pt', HOUR, PtRowsSchema, async (cli, ctx, region) => {
  const pts = await ask(
    cli,
    ctx,
    region,
    ['bedrock', 'list-provisioned-model-throughputs', '--query', ptQuery],
    list(PtSchema),
  )
  if (pts.notOffered) return []
  return pts.value === null ? null : ptRows(pts.value)
})

const NamesRows = z.array(z.object({ id: z.string(), n: z.string().nullable().optional() }))

/** The models' and system inference profiles' display names, once a week. */
const bedrockNamesProbe = count(
  'res-bedrock-names',
  WEEK,
  BedrockNamesSchema,
  // In us-east-1, which offers Bedrock: the names are the same in every region.
  async (cli, ctx, region) => {
    const models = await q(
      cli,
      ctx,
      region,
      ['bedrock', 'list-foundation-models', '--query', 'modelSummaries[].{id:modelId,n:modelName}'],
      list(NamesRows),
    )
    const profiles = await q(
      cli,
      ctx,
      region,
      [
        'bedrock',
        'list-inference-profiles',
        '--type-equals',
        'SYSTEM_DEFINED',
        '--max-items',
        '200',
        '--query',
        'inferenceProfileSummaries[].{id:inferenceProfileId,n:inferenceProfileName}',
      ],
      list(NamesRows),
    )
    if (models === null && profiles === null) return null
    const record = (rows: z.infer<typeof NamesRows> | null) =>
      Object.fromEntries((rows ?? []).map((m) => [m.id, m.n ?? m.id]))
    return { models: record(models), profiles: record(profiles) }
  },
  { global: true },
)

const CollectionRows = z.array(
  z.object({
    id: z.string(),
    n: z.string(),
    t: z.string().nullable().optional(),
    s: z.string().nullable().optional(),
    c: z.union([z.string(), z.number()]).nullable().optional(),
    k: z.string().nullable().optional(),
  }),
)

const aossProbe = count('res-aoss', HOUR, AossSchema, async (cli, ctx, region) => {
  const ids = await ask(
    cli,
    ctx,
    region,
    ['opensearchserverless', 'list-collections', '--query', 'collectionSummaries[].id'],
    list(IdsSchema),
  )
  if (ids.notOffered) return { offered: false, collections: [] }
  if (ids.value === null) return null
  if (ids.value.length === 0) return { offered: true, collections: [] }
  const rows = await q(
    cli,
    ctx,
    region,
    [
      'opensearchserverless',
      'batch-get-collection',
      '--ids',
      ...ids.value.slice(0, 100),
      '--query',
      'collectionDetails[].{id:id,n:name,t:type,s:status,c:createdDate,k:kmsKeyArn}',
    ],
    list(CollectionRows),
  )
  if (rows === null) return null
  return { offered: true, collections: rows.map((c) => ({ ...c, k: c.k ? lastPart(c.k) : null })) }
})

const vpceProbe = count('res-vpce', 6 * HOUR, VpceSchema, (cli, ctx, region) =>
  q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-vpc-endpoints',
      '--filters',
      'Name=vpc-endpoint-type,Values=Interface',
      '--max-items',
      '200',
      '--query',
      `VpcEndpoints[].{id:VpcEndpointId,svc:ServiceName,s:State,azs:length(SubnetIds),c:CreationTimestamp,vpc:VpcId,name:${NAME_TAG}}`,
    ],
    list(VpceSchema),
  ),
)

const tgwProbe = count('res-tgw', 6 * HOUR, TgwSchema, (cli, ctx, region) =>
  q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-transit-gateway-attachments',
      '--max-items',
      '200',
      '--query',
      'TransitGatewayAttachments[].{id:TransitGatewayAttachmentId,tgw:TransitGatewayId,t:ResourceType,s:State,c:CreationTime}',
    ],
    list(TgwSchema),
  ),
)

const vpnProbe = count('res-vpn', 6 * HOUR, VpnSchema, (cli, ctx, region) =>
  q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-vpn-connections',
      '--query',
      `VpnConnections[].{id:VpnConnectionId,s:State,st:VgwTelemetry[].Status,ch:VgwTelemetry[].LastStatusChange,name:${NAME_TAG}}`,
    ],
    list(VpnSchema),
  ),
)

const sagemakerProbe = count(
  'res-sagemaker',
  6 * HOUR,
  SagemakerSchema,
  async (cli, ctx, region) => {
    const shape = SagemakerSchema.shape
    const endpoints = await q(
      cli,
      ctx,
      region,
      [
        'sagemaker',
        'list-endpoints',
        '--max-items',
        '100',
        '--query',
        'Endpoints[].{n:EndpointName,s:EndpointStatus,c:CreationTime,m:LastModifiedTime}',
      ],
      list(shape.endpoints),
    )
    const notebooks = await q(
      cli,
      ctx,
      region,
      [
        'sagemaker',
        'list-notebook-instances',
        '--max-items',
        '100',
        '--query',
        'NotebookInstances[].{n:NotebookInstanceName,s:NotebookInstanceStatus,t:InstanceType,c:CreationTime,m:LastModifiedTime}',
      ],
      list(shape.notebooks),
    )
    const apps = await q(
      cli,
      ctx,
      region,
      [
        'sagemaker',
        'list-apps',
        '--max-items',
        '100',
        '--query',
        'Apps[].{d:DomainId,u:UserProfileName,sp:SpaceName,t:AppType,n:AppName,s:Status,c:CreationTime,it:ResourceSpec.InstanceType}',
      ],
      list(shape.apps),
    )
    if (endpoints === null && notebooks === null && apps === null) return null
    return { endpoints: endpoints ?? [], notebooks: notebooks ?? [], apps: apps ?? [] }
  },
)

const imagesProbe = count('res-images', DAY, ImagesSchema, async (cli, ctx, region) => {
  const shape = ImagesSchema.shape
  const snapshots = await q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-snapshots',
      '--owner-ids',
      'self',
      '--max-items',
      '1000',
      '--query',
      'Snapshots[].{id:SnapshotId,v:VolumeId,g:VolumeSize,c:StartTime,t:StorageTier}',
    ],
    list(shape.snapshots),
  )
  const images = await q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-images',
      '--owners',
      'self',
      '--max-items',
      '500',
      '--query',
      'Images[].{id:ImageId,n:Name,c:CreationDate,l:LastLaunchedTime,s:BlockDeviceMappings[].Ebs.SnapshotId,st:State}',
    ],
    list(shape.images),
  )
  return snapshots === null && images === null
    ? null
    : { snapshots: snapshots ?? [], images: images ?? [] }
})

const Repos = z.array(
  z.object({ n: z.string(), c: z.union([z.string(), z.number()]).nullable().optional() }),
)
const ImageDetails = z.array(
  z.object({
    b: z.number().nullable().optional(),
    p: z.union([z.string(), z.number()]).nullable().optional(),
    l: z.union([z.string(), z.number()]).nullable().optional(),
  }),
)

const latest = (times: (string | number | null | undefined)[]): number | null => {
  const all = times.map((t) => ms(t ?? null)).filter((t): t is number => t !== null)
  return all.length === 0 ? null : Math.max(...all)
}

const ecrProbe = count('res-ecr', DAY, EcrSchema, async (cli, ctx, region) => {
  const repos = await q(
    cli,
    ctx,
    region,
    [
      'ecr',
      'describe-repositories',
      '--max-items',
      '200',
      '--query',
      'repositories[].{n:repositoryName,c:createdAt}',
    ],
    list(Repos),
  )
  if (repos === null) return null
  const out = []
  for (const [i, repo] of repos.entries()) {
    // Twenty repositories' images summed at most: the rest are counted, not sized.
    const images =
      i < 20
        ? await q(
            cli,
            ctx,
            region,
            [
              'ecr',
              'describe-images',
              `--repository-name=${repo.n}`,
              '--max-items',
              '1000',
              '--query',
              'imageDetails[].{b:imageSizeInBytes,p:imagePushedAt,l:lastRecordedPullTime}',
            ],
            list(ImageDetails),
          )
        : null
    out.push({
      n: repo.n,
      c: repo.c,
      b: images === null ? null : images.reduce((s, x) => s + (x.b ?? 0), 0),
      p: images === null ? null : latest(images.map((x) => x.p)),
      l: images === null ? null : latest(images.map((x) => x.l)),
      k: images === null ? null : images.length,
    })
  }
  return out
})

const cachesProbe = count('res-caches', 6 * HOUR, CachesSchema, async (cli, ctx, region) => {
  const shape = CachesSchema.shape
  const clusters = await q(
    cli,
    ctx,
    region,
    [
      'elasticache',
      'describe-cache-clusters',
      '--max-items',
      '200',
      '--query',
      'CacheClusters[].{id:CacheClusterId,t:CacheNodeType,e:Engine,s:CacheClusterStatus,n:NumCacheNodes,c:CacheClusterCreateTime,g:ReplicationGroupId}',
    ],
    list(shape.clusters),
  )
  const serverless = await q(
    cli,
    ctx,
    region,
    [
      'elasticache',
      'describe-serverless-caches',
      '--max-items',
      '100',
      '--query',
      'ServerlessCaches[].{n:ServerlessCacheName,e:Engine,s:Status,c:CreateTime}',
    ],
    list(shape.serverless),
  )
  return clusters === null && serverless === null
    ? null
    : { clusters: clusters ?? [], serverless: serverless ?? [] }
})

const osDomainsProbe = count(
  'res-osdomains',
  6 * HOUR,
  OsDomainsSchema,
  async (cli, ctx, region) => {
    const names = await q(
      cli,
      ctx,
      region,
      ['opensearch', 'list-domain-names', '--query', 'DomainNames[].DomainName'],
      list(IdsSchema),
    )
    if (names === null) return null
    const out = []
    for (let i = 0; i < Math.min(names.length, 50); i += 5) {
      const rows = await q(
        cli,
        ctx,
        region,
        [
          'opensearch',
          'describe-domains',
          '--domain-names',
          ...names.slice(i, i + 5),
          '--query',
          'DomainStatusList[].{n:DomainName,t:ClusterConfig.InstanceType,k:ClusterConfig.InstanceCount,e:EngineVersion,d:Deleted,cr:Created}',
        ],
        list(OsDomainsSchema),
      )
      out.push(...(rows ?? []))
    }
    return out
  },
)

const redshiftProbe = count('res-redshift', 6 * HOUR, RedshiftSchema, async (cli, ctx, region) => {
  const shape = RedshiftSchema.shape
  const clusters = await q(
    cli,
    ctx,
    region,
    [
      'redshift',
      'describe-clusters',
      '--max-items',
      '100',
      '--query',
      'Clusters[].{id:ClusterIdentifier,t:NodeType,n:NumberOfNodes,s:ClusterStatus,c:ClusterCreateTime}',
    ],
    list(shape.clusters),
  )
  const workgroups = await q(
    cli,
    ctx,
    region,
    [
      'redshift-serverless',
      'list-workgroups',
      '--max-items',
      '100',
      '--query',
      'workgroups[].{n:workgroupName,s:status,b:baseCapacity,c:creationDate}',
    ],
    list(shape.workgroups),
  )
  return clusters === null && workgroups === null
    ? null
    : { clusters: clusters ?? [], workgroups: workgroups ?? [] }
})

const Streams = z.array(
  z.object({
    n: z.string(),
    s: z.string().nullable().optional(),
    m: z.string().nullable().optional(),
    c: z.union([z.string(), z.number()]).nullable().optional(),
  }),
)

const kinesisProbe = count('res-kinesis', 6 * HOUR, KinesisSchema, async (cli, ctx, region) => {
  const streams = await q(
    cli,
    ctx,
    region,
    [
      'kinesis',
      'list-streams',
      '--max-items',
      '100',
      '--query',
      'StreamSummaries[].{n:StreamName,s:StreamStatus,m:StreamModeDetails.StreamMode,c:StreamCreationTimestamp}',
    ],
    list(Streams),
  )
  if (streams === null) return null
  const out = []
  let described = 0
  for (const stream of streams) {
    // A provisioned stream bills by its shards: twenty counted at most.
    const shards =
      stream.m !== 'ON_DEMAND' && described++ < 20
        ? await q(
            cli,
            ctx,
            region,
            [
              'kinesis',
              'describe-stream-summary',
              `--stream-name=${stream.n}`,
              '--query',
              'StreamDescriptionSummary.OpenShardCount',
            ],
            z.number(),
          )
        : null
    out.push({ ...stream, sh: shards })
  }
  return out
})

const transferProbe = count('res-transfer', 6 * HOUR, TransferSchema, (cli, ctx, region) =>
  q(
    cli,
    ctx,
    region,
    [
      'transfer',
      'list-servers',
      '--max-items',
      '100',
      '--query',
      'Servers[].{id:ServerId,s:State,e:EndpointType,u:UserCount}',
    ],
    list(TransferSchema),
  ),
)

const Aliases = z.array(z.object({ a: z.string(), k: z.string().nullable().optional() }))
const KeyMeta = KmsSchema.element

const kmsProbe = count('res-kms', DAY, KmsSchema, async (cli, ctx, region) => {
  const keys = await q(
    cli,
    ctx,
    region,
    ['kms', 'list-keys', '--max-items', '500', '--query', 'Keys[].KeyId'],
    list(IdsSchema),
  )
  if (keys === null) return null
  const aliases =
    (await q(
      cli,
      ctx,
      region,
      [
        'kms',
        'list-aliases',
        '--max-items',
        '500',
        '--query',
        'Aliases[].{a:AliasName,k:TargetKeyId}',
      ],
      list(Aliases),
    )) ?? []
  // AWS managed keys (aliased alias/aws/…) are free and not described.
  const managed = new Set(aliases.filter((a) => a.a.startsWith('alias/aws/')).map((a) => a.k))
  const out = []
  for (const id of keys.filter((k) => !managed.has(k)).slice(0, 50)) {
    const meta = await q(
      cli,
      ctx,
      region,
      [
        'kms',
        'describe-key',
        `--key-id=${id}`,
        '--query',
        'KeyMetadata.{id:KeyId,m:KeyManager,s:KeyState,c:CreationDate,d:DeletionDate,sp:KeySpec}',
      ],
      KeyMeta,
    )
    if (meta !== null) out.push(meta)
  }
  return out
})

const zonesProbe = count(
  'res-zones',
  DAY,
  ZonesSchema,
  (cli, ctx, region) =>
    q(
      cli,
      ctx,
      region,
      [
        'route53',
        'list-hosted-zones',
        '--max-items',
        '200',
        '--query',
        'HostedZones[].{id:Id,n:Name,c:ResourceRecordSetCount,p:Config.PrivateZone}',
      ],
      list(ZonesSchema),
    ),
  { global: true },
)

const vpcsProbe = count('res-vpcs', 6 * HOUR, VpcsSchema, (cli, ctx, region) =>
  q(
    cli,
    ctx,
    region,
    ['ec2', 'describe-vpcs', '--max-items', '200', '--query', 'Vpcs[].{id:VpcId,d:IsDefault}'],
    list(VpcsSchema),
  ),
)

/** Every alarm in every state, for "watches what is gone" and the Also-here count (aws.md §14.3). */
const alarmsAllProbe = shared({
  id: 'res-alarms',
  every: 6 * HOUR,
  cost: 'free-tier',
  schema: AlarmsAllSchema,
  bulk: 'count',
  read: (cli, ctx, region) =>
    q(
      cli,
      ctx,
      region,
      [
        'cloudwatch',
        'describe-alarms',
        '--alarm-types',
        'MetricAlarm',
        '--max-items',
        '500',
        '--query',
        'MetricAlarms[].{n:AlarmName,s:StateValue,ns:Namespace,d:Dimensions[0].Name,v:Dimensions[0].Value}',
      ],
      list(AlarmsAllSchema),
    ),
})

/** The account's enabled regions (describe-regions answers only those), once a week. */
export const regionsProbe = count(
  'res-regions',
  WEEK,
  RegionListSchema,
  (cli, ctx, region) =>
    q(
      cli,
      ctx,
      region,
      ['ec2', 'describe-regions', '--query', 'Regions[].RegionName'],
      list(RegionListSchema),
    ),
  { global: true },
)

/**
 * The enabled regions the pane does not show (aws.md §14.2 D): all of them, thirteen with four
 * shown. A cut by name would drop us-west-2, where much is left behind; sixteen bound it.
 */
function otherRegions(ctx: AwsContext): string[] {
  const enabled = ctx.shared()?.get('res-regions', GLOBAL_KEY, RegionListSchema)?.value ?? []
  return enabled
    .filter((r) => !ctx.regions().includes(r))
    .sort()
    .slice(0, 16)
}

const SweepInstances = SweepRegionSchema.shape.instances
const SweepVolumes = SweepRegionSchema.shape.volumes
const SweepNats = SweepRegionSchema.shape.nats
const SweepAddresses = z.array(
  z.object({
    id: z.string().nullable().optional(),
    ip: z.string().nullable().optional(),
    a: z.string().nullable().optional(),
  }),
)

/** One region of the sweep: four describes, silent (an SCP refusing a region is expected). */
async function sweepRegion(
  cli: RunCli,
  ctx: AwsContext,
  region: string,
): Promise<SweepRegion | null> {
  const silent = { silent: true }
  const instances = await q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-instances',
      '--filters',
      'Name=instance-state-name,Values=running,stopped',
      '--max-items',
      '200',
      '--query',
      'Reservations[].Instances[].{id:InstanceId,type:InstanceType,s:State.Name,l:LaunchTime}',
    ],
    list(SweepInstances),
    silent,
  )
  if (instances === null) return null
  const volumes = await q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-volumes',
      '--max-items',
      '200',
      '--query',
      'Volumes[].{id:VolumeId,g:Size,t:VolumeType,s:State}',
    ],
    list(SweepVolumes),
    silent,
  )
  const nats = await q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-nat-gateways',
      // What bills by the hour only (ELSEWHERE counts no other).
      '--filter',
      'Name=state,Values=pending,available',
      '--max-items',
      '50',
      '--query',
      'NatGateways[].{id:NatGatewayId,s:State}',
    ],
    list(SweepNats),
    silent,
  )
  const addresses = await q(
    cli,
    ctx,
    region,
    [
      'ec2',
      'describe-addresses',
      '--query',
      'Addresses[].{id:AllocationId,ip:PublicIp,a:AssociationId}',
    ],
    list(SweepAddresses),
    silent,
  )
  return {
    instances,
    volumes: volumes ?? [],
    nats: (nats ?? []).filter((n) => n.s !== 'deleted'),
    addresses: (addresses ?? []).map((a) => ({
      id: a.id ?? a.ip ?? '?',
      assoc: a.a !== null && a.a !== undefined,
    })),
  }
}

/**
 * The weekly sweep (aws.md §14.2 D), and "check other regions now": ON unless the account turned
 * it off; a press reads every region again, whatever its age.
 */
export const sweepProbe: Probe<AwsContext, PerRegion<SweepRegion>> = {
  id: 'res-sweep',
  every: WEEK,
  cost: 'free',
  after: 'res-regions',
  // Behind every count: some 50 describes of regions the pane does not show once held up the
  // shown regions' own lists for a minute on a new account.
  bulk: 'judge',
  run: async (ctx, cli, previous) => {
    const store = ctx.shared()
    if (store === null) return previous ?? {}
    // Off, only a press reads: each region once, its reading kept until the next press.
    const { on, asked } = store.sweep()
    if (!on && asked === null) return {}
    const out: PerRegion<SweepRegion> = {}
    for (const region of otherRegions(ctx))
      out[region] = await readOnce(store, 'res-sweep', region, {
        schema: SweepRegionSchema,
        // Young (off: any age), and not older than the last "check other regions now".
        keep: (kept) =>
          (!on || ctx.now() - kept.at < ctx.every('res-sweep')) &&
          (asked === null || kept.at >= asked),
        fallback: null,
        read: () => sweepRegion(cli, ctx, region),
      })
    return out
  },
}

/* ---- How used: list-metrics, GetMetricData, statistics (aws.md §14.4, §14.4a) ---- */

const regionRows = (ctx: AwsContext, region: string): Res[] =>
  [...allResources(ctx.readings()).values()]
    .flat()
    .filter((x) => x.region === region && x.global !== true)

/** What list-metrics finds per pair for the region's resources (free tier, aws.md §14.4). */
const quietProbe = shared({
  id: 'res-quiet',
  every: DAY,
  cost: 'free-tier',
  schema: PresenceSchema,
  bulk: 'judge',
  read: async (cli, ctx, region) => {
    const out: Presence = {}
    for (const [ns, metric] of listedPairs(regionRows(ctx, region))) {
      const dims = await q(
        cli,
        ctx,
        region,
        [
          'cloudwatch',
          'list-metrics',
          '--namespace',
          ns,
          '--metric-name',
          metric,
          '--max-items',
          '500',
          '--query',
          'Metrics[].Dimensions',
        ],
        list(DimensionsSchema),
      )
      if (dims !== null) out[`${ns} ${metric}`] = dims
    }
    return out
  },
})

/** CloudFront's requests are in us-east-1 under Region=Global. */
const cloudfrontQuietProbe = shared({
  id: 'res-cf-quiet',
  every: DAY,
  cost: 'free-tier',
  schema: PresenceSchema,
  bulk: 'judge',
  global: true,
  read: async (cli, ctx, region) => {
    if ((ctx.readings().res.distributions ?? []).length === 0) return {}
    const dims = await q(
      cli,
      ctx,
      region,
      [
        'cloudwatch',
        'list-metrics',
        '--namespace',
        'AWS/CloudFront',
        '--metric-name',
        'Requests',
        '--dimensions',
        dimensionsArg([{ Name: 'Region', Value: 'Global' }]),
        '--max-items',
        '500',
        '--query',
        'Metrics[].Dimensions',
      ],
      list(DimensionsSchema),
    )
    return dims === null ? null : { 'AWS/CloudFront Requests': dims }
  },
})

/** The regions Bedrock's use is asked in: every enabled one (cross-region inference reports where called). */
const bedrockRegions = (ctx: AwsContext): string[] => [
  ...new Set([
    ...ctx.regions(),
    ...(ctx.shared()?.get('res-regions', GLOBAL_KEY, RegionListSchema)?.value ?? []),
  ]),
]

const modelIds = (dims: Dimensions): string[] =>
  [
    ...new Set(dims.flatMap((set) => set.filter((d) => d.Name === 'ModelId').map((d) => d.Value))),
  ].sort()

/**
 * The models called, per region. After res-quiet, so that the usage readings, after this one,
 * have both what list-metrics found and which models to ask for (the enabled regions it reads,
 * res-regions, is a count, read before any judgement).
 */
const bedrockUseProbe = shared({
  id: 'res-bedrockuse',
  every: DAY,
  cost: 'free-tier',
  schema: z.array(z.string()),
  bulk: 'judge',
  after: 'res-quiet',
  regions: bedrockRegions,
  read: async (cli, ctx, region) => {
    const silent = !ctx.regions().includes(region)
    const found = await ask(
      cli,
      ctx,
      region,
      [
        'cloudwatch',
        'list-metrics',
        '--namespace',
        'AWS/Bedrock',
        '--metric-name',
        'Invocations',
        '--max-items',
        '500',
        '--query',
        'Metrics[].Dimensions',
      ],
      list(DimensionsSchema),
      silent ? { silent: true } : {},
    )
    return found.value === null ? null : modelIds(found.value)
  },
})

/** One metric to read daily: its series key, and the dimension set asked for. */
export interface MetricQuery {
  key: string
  ns: string
  metric: string
  dims: { Name: string; Value: string }[]
  stat: 'Sum' | 'Maximum' | 'Average'
  /** Days the judgement looks at (EC2's low use is fourteen). */
  days: number
}

const STAT: Record<string, MetricQuery['stat']> = {
  DatabaseConnections: 'Maximum',
  CurrConnections: 'Maximum',
  SearchOCU: 'Maximum',
  IndexingOCU: 'Maximum',
  CPUUtilization: 'Average',
}

/** The dimension sets list-metrics found for a spec, or its one exact dimension. */
function dimsOf(
  spec: MetricSpec,
  presence: Presence | null | undefined,
): { Name: string; Value: string }[][] {
  const found = (presence?.[`${spec.ns} ${spec.metric}`] ?? []).filter((set) =>
    set.some((d) => d.Name === spec.dim && d.Value === spec.value),
  )
  if (found.length > 0) return found.slice(0, 4)
  return spec.exact === true ? [[{ Name: spec.dim, Value: spec.value }]] : []
}

const billed = (x: Res) => x.hourly || (x.monthly ?? 0) > 0

/**
 * What GetMetricData (or, without it, the statistics) reads in a region: the billed candidates'
 * usage metrics, EC2's CPU and network for low use, OpenSearch Serverless' OCUs, the log groups'
 * ingestion and Bedrock's tokens (aws.md §14.4a). Free kinds stay on list-metrics' answer.
 */
export function metricQueries(ctx: AwsContext, region: string): MetricQuery[] {
  const r = ctx.readings()
  const presence = r.res.presence[region]
  const out: MetricQuery[] = []
  const add = (
    spec: MetricSpec,
    days = 30,
    stat: MetricQuery['stat'] = STAT[spec.metric] ?? 'Sum',
  ) => {
    for (const dims of dimsOf(spec, presence))
      out.push({ key: seriesKey(spec), ns: spec.ns, metric: spec.metric, dims, stat, days })
  }
  for (const x of regionRows(ctx, region)) for (const [spec, days] of rowSpecs(x)) add(spec, days)
  out.push(...ocuQueries(presence))
  for (const id of (r.res.bedrockUse[region] ?? []).slice(0, 40))
    for (const metric of ['Invocations', 'InputTokenCount', 'OutputTokenCount'])
      add({ ns: 'AWS/Bedrock', metric, dim: 'ModelId', value: id, exact: true }, 30, 'Sum')
  return out
}

/** A resource's metrics to read daily: low use's for EC2, else its usage metrics when it bills. */
function rowSpecs(x: Res): [MetricSpec, number][] {
  if (x.service === 'ec2')
    return x.hourly
      ? [
          [
            {
              ns: 'AWS/EC2',
              metric: 'CPUUtilization',
              dim: 'InstanceId',
              value: x.id,
              exact: true,
            },
            14,
          ],
          [
            { ns: 'AWS/EC2', metric: 'NetworkOut', dim: 'InstanceId', value: x.id, exact: true },
            14,
          ],
        ]
      : []
  // A log group bills what it keeps; its ingestion is the column of the drill-down (§14.5).
  const stored = x.service === 'logs' && typeof x.cells.gb === 'number' && x.cells.gb > 0
  if (!stored && (x.service === 'logs' || !billed(x))) return []
  return (USE[x.service]?.(x) ?? []).map((spec) => [spec, 30])
}

/** OpenSearch Serverless' OCUs: account-level, by the dimension sets list-metrics found. */
function ocuQueries(presence: Presence | null | undefined): MetricQuery[] {
  return ['SearchOCU', 'IndexingOCU'].flatMap((metric) =>
    (presence?.[`AWS/AOSS ${metric}`] ?? []).slice(0, 4).map((dims) => ({
      key: seriesKey({
        ns: 'AWS/AOSS',
        metric,
        dim: dims[0]?.Name ?? 'ClientId',
        value: dims[0]?.Value ?? '',
      }),
      ns: 'AWS/AOSS',
      metric,
      dims,
      stat: 'Maximum' as const,
      days: 30,
    })),
  )
}

/** Five hundred queries a call at most, and a command line Windows takes (32 767 characters). */
export const GMD_MAX_QUERIES = 500
export const GMD_MAX_CHARS = 24_000

const queryJson = (query: MetricQuery, i: number) =>
  JSON.stringify({
    Id: `q${i}`,
    MetricStat: {
      Metric: { Namespace: query.ns, MetricName: query.metric, Dimensions: query.dims },
      Period: 86400,
      Stat: query.stat,
    },
    ReturnData: true,
  })

/** The queries in calls, each within both limits. */
export function batches(queries: readonly MetricQuery[]): MetricQuery[][] {
  const out: MetricQuery[][] = []
  let current: MetricQuery[] = []
  let chars = 2
  for (const query of queries) {
    const size = queryJson(query, current.length).length + 1
    if (current.length > 0 && (current.length >= GMD_MAX_QUERIES || chars + size > GMD_MAX_CHARS)) {
      out.push(current)
      current = []
      chars = 2
    }
    current.push(query)
    chars += size
  }
  if (current.length > 0) out.push(current)
  return out
}

/** Daily values by day, summed over the dimension sets of one series. */
function collect(
  into: Map<string, { days: number; byDay: Map<string, number> }>,
  query: MetricQuery,
  times: string[],
  values: number[],
): void {
  const series = into.get(query.key) ?? { days: query.days, byDay: new Map<string, number>() }
  times.forEach((t, i) => {
    const day = t.slice(0, 10)
    series.byDay.set(day, (series.byDay.get(day) ?? 0) + (values[i] ?? 0))
  })
  into.set(query.key, series)
}

function toUsage(
  into: Map<string, { days: number; byDay: Map<string, number> }>,
  via: Series['via'],
): Usage {
  const out: Usage = {}
  for (const [key, series] of into) {
    const v = [...series.byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, n]) => n)
    out[key] = { v: v.slice(-series.days), d: series.days, via }
  }
  return out
}

const dayStart = (at: number) => Math.floor(at / DAY) * DAY

/** GetMetricData, paid by the metric under the account's monthly cap (aws.md §14.4a). */
async function readMetricData(cli: RunCli, ctx: AwsContext, region: string): Promise<Usage | null> {
  const store = ctx.shared()
  if (store === null || !store.gmdAvailable()) return null
  const queries = metricQueries(ctx, region)
  if (queries.length === 0) return {}
  const into: Collected = new Map()
  for (const batch of batches(queries)) {
    // Taken before the call, in the same step as the check: another board's reading of another
    // region, running in another bulk lane meanwhile, finds what is left after this one.
    if (!store.gmdReserve(batch.length)) {
      // The month's cap: the rest is judged by list-metrics and the statistics until the 1st.
      store.gmdCapReached()
      return toUsage(into, 'gmd')
    }
    if (!(await readBatch(cli, ctx, region, { batch, store }, into))) return null
  }
  return toUsage(into, 'gmd')
}

type Collected = Map<string, { days: number; byDay: Map<string, number> }>

/**
 * One call of up to 500 metrics, reserved by the caller: its count is spent whatever it
 * answers, and given back only when the call was never started.
 */
async function readBatch(
  cli: RunCli,
  ctx: AwsContext,
  region: string,
  { batch, store }: { batch: readonly MetricQuery[]; store: SharedReads },
  into: Collected,
): Promise<boolean> {
  const now = ctx.now()
  const result = await cli(
    call(ctx, region, [
      'cloudwatch',
      'get-metric-data',
      '--start-time',
      iso(dayStart(now) - 30 * DAY),
      '--end-time',
      iso(now),
      '--scan-by',
      'TimestampAscending',
      '--metric-data-queries',
      `[${batch.map(queryJson).join(',')}]`,
      '--query',
      'MetricDataResults[].{id:Id,t:Timestamps,v:Values}',
    ]),
  )
  if (notStarted(result)) store.gmdRefund(batch.length)
  if (!result.ok) return false
  for (const row of parseWith(MetricDataSchema, result.stdout) ?? []) {
    const query = batch[Number(row.id.slice(1))]
    if (query !== undefined) collect(into, query, row.t ?? [], row.v ?? [])
  }
  // A metric with no point in 30 days is a series of none: quiet, not unread.
  for (const query of batch)
    if (!into.has(query.key)) into.set(query.key, { days: query.days, byDay: new Map() })
  return true
}

const gmdRegions = (ctx: AwsContext): string[] => [
  ...new Set([
    ...ctx.regions(),
    ...Object.entries(ctx.readings().res.bedrockUse)
      .filter(([, ids]) => (ids ?? []).length > 0)
      .map(([region]) => region),
  ]),
]

/** GetMetricData reads what res-quiet listed and the models res-bedrockuse found, after both. */
export const metricDataProbe = shared({
  id: 'res-gmd',
  every: DAY,
  cost: { setting: 'aws.getMetricData', perMetricUsd: GMD_PRICE_USD },
  schema: UsageSchema,
  bulk: 'judge',
  after: 'res-bedrockuse',
  regions: gmdRegions,
  read: readMetricData,
})

/**
 * Without GetMetricData: a statistic each for twenty billed candidates at most (free tier).
 * While GetMetricData is there it reads nothing and keeps nothing: an empty reading kept for a
 * day would stand for the statistics after the cap is reached or GetMetricData turned off.
 */
async function readStatistics(cli: RunCli, ctx: AwsContext, region: string): Promise<Usage | null> {
  const store = ctx.shared()
  if (store === null || store.gmdAvailable()) return null
  const now = ctx.now()
  const queries = metricQueries(ctx, region).filter(
    (query) => query.ns !== 'AWS/EC2' && query.ns !== 'AWS/Logs',
  )
  // The candidates with a zero-sending metric first: list-metrics cannot judge them.
  const picked = [
    ...queries.filter((x) => x.ns !== 'AWS/Bedrock'),
    ...queries.filter((x) => x.ns === 'AWS/Bedrock'),
  ].slice(0, 20)
  const into = new Map<string, { days: number; byDay: Map<string, number> }>()
  for (const query of picked) {
    const points = await q(
      cli,
      ctx,
      region,
      [
        'cloudwatch',
        'get-metric-statistics',
        '--namespace',
        query.ns,
        '--metric-name',
        query.metric,
        '--dimensions',
        dimensionsArg(query.dims),
        '--start-time',
        iso(dayStart(now) - 14 * DAY),
        '--end-time',
        iso(now),
        '--period',
        '86400',
        '--statistics',
        query.stat,
        '--query',
        `Datapoints[].[Timestamp,${query.stat}]`,
      ],
      list(PointsSchema),
    )
    if (points === null) continue
    collect(
      into,
      { ...query, days: 14 },
      points.map(([t]) => new Date(ms(t) ?? 0).toISOString()),
      points.map(([, v]) => v),
    )
  }
  return toUsage(into, 'stat')
}

/** After GetMetricData's reading: it reads only what the cap left, or when it is off. */
const lastUseProbe = shared({
  id: 'res-lastuse',
  every: DAY,
  cost: 'free-tier',
  schema: UsageSchema,
  bulk: 'judge',
  after: 'res-gmd',
  regions: gmdRegions,
  read: readStatistics,
})

/** RESOURCES' probes: the lists first (`bulk` count), then the judgement and the sweep. */
export const RESOURCE_PROBES: readonly Probe<AwsContext, unknown>[] = [
  regionsProbe,
  bucketListProbe,
  logGroupsProbe,
  ddbProbe,
  ecsProbe,
  eksNodesProbe,
  elbTargetsProbe,
  sqsProbe,
  snsProbe,
  apisProbe,
  distributionsProbe,
  bedrockProbe,
  bedrockPtProbe,
  bedrockNamesProbe,
  aossProbe,
  vpceProbe,
  tgwProbe,
  vpnProbe,
  sagemakerProbe,
  imagesProbe,
  ecrProbe,
  cachesProbe,
  osDomainsProbe,
  redshiftProbe,
  kinesisProbe,
  transferProbe,
  kmsProbe,
  zonesProbe,
  vpcsProbe,
  alarmsAllProbe,
  sweepProbe,
  quietProbe,
  cloudfrontQuietProbe,
  bedrockUseProbe,
  metricDataProbe,
  lastUseProbe,
] as readonly Probe<AwsContext, unknown>[]

/** Each stored reading's schema, for building the readings back from the store. */
export const STORED = {
  'res-buckets': BucketListSchema,
  'res-logs': LogGroupsSchema,
  'res-ddb': DdbSchema,
  'res-ecs': EcsSchema,
  'res-eks': EksNodesSchema,
  'res-elb': ElbTargetsSchema,
  'res-sqs': SqsSchema,
  'res-sns': SnsSchema,
  'res-apis': ApisSchema,
  'res-cloudfront': DistributionsSchema,
  'res-bedrock': BedrockSchema,
  'res-bedrock-pt': PtRowsSchema,
  'res-bedrock-names': BedrockNamesSchema,
  'res-aoss': AossSchema,
  'res-vpce': VpceSchema,
  'res-tgw': TgwSchema,
  'res-vpn': VpnSchema,
  'res-sagemaker': SagemakerSchema,
  'res-images': ImagesSchema,
  'res-ecr': EcrSchema,
  'res-caches': CachesSchema,
  'res-osdomains': OsDomainsSchema,
  'res-redshift': RedshiftSchema,
  'res-kinesis': KinesisSchema,
  'res-transfer': TransferSchema,
  'res-kms': KmsSchema,
  'res-zones': ZonesSchema,
  'res-vpcs': VpcsSchema,
  'res-alarms': AlarmsAllSchema,
  'res-regions': RegionListSchema,
  'res-sweep': SweepRegionSchema,
  'res-quiet': PresenceSchema,
  'res-cf-quiet': PresenceSchema,
  'res-bedrockuse': z.array(z.string()),
  'res-gmd': UsageSchema,
  'res-lastuse': UsageSchema,
} as const
