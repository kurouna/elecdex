import type { CliCall, CliResult } from '@shared/cloud-cli/probe'
import { ACCOUNT, DAY, dimensionsOf, HOUR, iso, ok, result } from './stub-common.js'

/**
 * The stand-in's answers for RESOURCES (aws.md §14; `ELECDEX_CLOUD_STUB`): the made-up account
 * acme-prod's lists, metrics and GetMetricData, in the shapes the probes' `--query` leaves. The
 * flavour is the mock's (docs/aws-mock): a GPU instance left on in a region the pane does not
 * show, the idle dev box, empty buckets, an orphan log
 * group, flow logs kept forever, an unused provisioned table, a dead-letter backlog, a topic with
 * no subscribers, a quiet WebSocket API and distribution, a Provisioned Throughput whose base
 * model has no calls, an unused custom model, a knowledge base's collection nobody searches, a
 * notebook left InService, an endpoint with no bytes, an orphan snapshot, an unused image, an
 * idle cache, a stream with no records, a disabled key, an empty zone, and things in two
 * regions the pane does not show. Modes: `quiet` (nothing looks forgotten), `noregion` (Bedrock
 * and OpenSearch Serverless have no endpoint in ap-northeast-1). No real account, no person.
 */

export type ResourceMode = 'demo' | 'quiet' | 'noregion' | string

const GB = 1024 ** 3
const TOKYO = 'ap-northeast-1'
const VIRGINIA = 'us-east-1'

const arg = (call: CliCall, name: string): string | undefined => {
  const eq = call.argv.find((a) => a.startsWith(`${name}=`))
  if (eq !== undefined) return eq.slice(name.length + 1)
  const i = call.argv.indexOf(name)
  return i < 0 ? undefined : call.argv[i + 1]
}

type Route = (call: CliCall, region: string, now: number, mode: ResourceMode) => CliResult

const inTokyo = <T>(region: string, rows: T[]): T[] => (region === TOKYO ? rows : [])

/** Where Bedrock and OpenSearch Serverless are said to have no endpoint, in `noregion`. */
const unreachable = (service: string, region: string): CliResult =>
  result(
    false,
    '',
    `Could not connect to the endpoint URL: "https://${service}.${region}.amazonaws.com/"`,
  )

const notOffered = (mode: ResourceMode, region: string) => mode === 'noregion' && region === TOKYO

/* ---- The lists ---- */

const BUCKETS = (now: number, mode: ResourceMode) => [
  ['acme-logs-archive', iso(now - 900 * DAY), TOKYO],
  ['acme-assets', iso(now - 700 * DAY), TOKYO],
  ['acme-backups', iso(now - 600 * DAY), TOKYO],
  ['acme-ml-datasets', iso(now - 120 * DAY), VIRGINIA],
  ...(mode === 'quiet'
    ? []
    : [
        ['acme-tmp-2023', iso(now - 730 * DAY), TOKYO],
        ['acme-old-site', iso(now - 1100 * DAY), VIRGINIA],
      ]),
]

const LOG_GROUPS = (now: number, mode: ResourceMode) => [
  ['/aws/lambda/thumbnailer', now - 200 * DAY, 30, 2.1 * GB, 'STANDARD'],
  ['/aws/lambda/legacy-cron', now - 700 * DAY, null, 0.2 * GB, 'STANDARD'],
  ['/aws/eks/platform/cluster', now - 400 * DAY, 90, 18 * GB, 'STANDARD'],
  ['vpc-flow-logs', now - 800 * DAY, mode === 'quiet' ? 365 : null, 124 * GB, 'STANDARD'],
  ...(mode === 'quiet'
    ? []
    : [['/aws/lambda/old-resizer', now - 900 * DAY, null, 38 * GB, 'STANDARD']]),
]

const TABLES = (now: number, mode: ResourceMode) => ({
  orders: {
    n: 'orders',
    s: 'ACTIVE',
    c: iso(now - 500 * DAY),
    b: 4.2 * GB,
    i: 1_840_000,
    m: 'PAY_PER_REQUEST',
    r: 0,
    w: 0,
    k: 'STANDARD',
  },
  ...(mode === 'quiet'
    ? {}
    : {
        'sessions-legacy': {
          n: 'sessions-legacy',
          s: 'ACTIVE',
          c: iso(now - 800 * DAY),
          b: 0.3 * GB,
          i: 21_000,
          m: 'PROVISIONED',
          r: 50,
          w: 25,
          k: 'STANDARD',
        },
      }),
})

const QUEUES = (mode: ResourceMode) => ({
  orders: {
    m: '12',
    c: '1650000000',
    r: JSON.stringify({
      deadLetterTargetArn: `arn:aws:sqs:${TOKYO}:${ACCOUNT}:orders-dlq`,
      maxReceiveCount: 5,
    }),
  },
  'orders-dlq': { m: mode === 'quiet' ? '0' : '2140', c: '1650000000', r: null },
  ...(mode === 'quiet' ? {} : { 'import-jobs.fifo': { m: '0', c: '1600000000', r: null } }),
})

const tokyoArn = (service: string, rest: string) => `arn:aws:${service}:${TOKYO}:${ACCOUNT}:${rest}`

const BEDROCK_PT = (now: number, mode: ResourceMode) =>
  mode === 'quiet'
    ? []
    : [
        {
          n: 'pt-claude-batch',
          a: tokyoArn('bedrock', 'provisioned-model/q7x2k9m3p1ab'),
          m: `arn:aws:bedrock:${TOKYO}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          f: `arn:aws:bedrock:${TOKYO}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          s: 'InService',
          u: 1,
          d: 'OneMonth',
          e: iso(now + 25 * DAY),
          c: iso(now - 5 * DAY),
        },
      ]

const USED_MODELS: Record<string, string[]> = {
  [TOKYO]: ['apac.anthropic.claude-sonnet-4-20250514-v1:0'],
  [VIRGINIA]: ['us.anthropic.claude-3-5-haiku-20241022-v1:0', 'amazon.titan-embed-text-v2:0'],
}

function bedrockRoutes(): Record<string, Route> {
  const gate =
    (service: string, route: Route): Route =>
    (call, region, now, mode) =>
      notOffered(mode, region) ? unreachable(service, region) : route(call, region, now, mode)
  return {
    'bedrock list-provisioned-model-throughputs': gate('bedrock', (_c, region, now, mode) =>
      ok(inTokyo(region, BEDROCK_PT(now, mode))),
    ),
    'bedrock list-custom-models': gate('bedrock', (_c, region, now, mode) =>
      ok(
        inTokyo(
          region,
          [
            {
              n: 'support-tuned-v2',
              a: tokyoArn('bedrock', 'custom-model/amazon.titan-text-lite-v1/s8d7f6g5h4j3'),
              b: `arn:aws:bedrock:${TOKYO}::foundation-model/amazon.titan-text-lite-v1`,
              c: iso(now - 200 * DAY),
            },
          ].filter(() => mode !== 'quiet'),
        ),
      ),
    ),
    'bedrock list-imported-models': gate('bedrock', () => ok([])),
    'bedrock list-guardrails': gate('bedrock', (_c, region, now) =>
      ok(
        inTokyo(region, [
          { id: 'gr0acme01', n: 'support-guard', s: 'READY', c: iso(now - 90 * DAY) },
        ]),
      ),
    ),
    'bedrock list-inference-profiles': gate('bedrock', (call, region) =>
      ok(
        arg(call, '--type-equals') === 'SYSTEM_DEFINED'
          ? [
              { id: 'apac.anthropic.claude-sonnet-4-20250514-v1:0', n: 'APAC Claude Sonnet 4' },
              { id: 'us.anthropic.claude-3-5-haiku-20241022-v1:0', n: 'US Claude 3.5 Haiku' },
            ]
          : inTokyo(region, [
              {
                id: 'ip0support',
                n: 'support-app',
                s: 'ACTIVE',
                m: [
                  `arn:aws:bedrock:${TOKYO}::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0`,
                ],
              },
            ]),
      ),
    ),
    'bedrock list-foundation-models': () =>
      ok([
        { id: 'anthropic.claude-3-haiku-20240307-v1:0', n: 'Claude 3 Haiku' },
        { id: 'anthropic.claude-sonnet-4-20250514-v1:0', n: 'Claude Sonnet 4' },
        { id: 'amazon.titan-embed-text-v2:0', n: 'Titan Text Embeddings V2' },
      ]),
    'bedrock-agent list-agents': gate('bedrock-agent', (_c, region, now) =>
      ok(
        inTokyo(region, [
          { id: 'AG0ACME01', n: 'support-agent', s: 'PREPARED', u: iso(now - 12 * DAY) },
        ]),
      ),
    ),
    'bedrock-agent list-knowledge-bases': gate('bedrock-agent', (_c, region, now) =>
      ok(inTokyo(region, [{ id: 'KB0ACME01', n: 'docs-kb', s: 'ACTIVE', u: iso(now - 60 * DAY) }])),
    ),
    'bedrock-agent get-knowledge-base': gate('bedrock-agent', () =>
      ok({ t: 'OPENSEARCH_SERVERLESS', c: tokyoArn('aoss', 'collection/kb0docs0coll') }),
    ),
    'bedrock-agentcore-control list-agent-runtimes': gate('bedrock-agentcore-control', () =>
      ok([]),
    ),
  }
}

/* ---- The metrics ---- */

const dims = (...pairs: [string, string][]) => pairs.map(([Name, Value]) => ({ Name, Value }))

/** What list-metrics finds: only what is used (`quiet` mode: everything is). */
function presence(
  namespace: string,
  metric: string,
  region: string,
  mode: ResourceMode,
): unknown[] {
  const all = mode === 'quiet'
  const table: Record<string, unknown[][]> = {
    'AWS/Lambda Invocations': [
      dims(['FunctionName', 'thumbnailer']),
      ...(all ? [dims(['FunctionName', 'legacy-cron'])] : []),
    ],
    'AWS/SQS NumberOfMessagesSent': [
      dims(['QueueName', 'orders']),
      dims(['QueueName', 'orders-dlq']),
    ],
    'AWS/SNS NumberOfMessagesPublished': [
      dims(['TopicName', 'alerts']),
      ...(all ? [dims(['TopicName', 'deploy-notices'])] : []),
    ],
    'AWS/ApiGateway Count': [dims(['ApiName', 'orders-api'])],
    'AWS/ApiGateway ConnectCount': all ? [dims(['ApiId', 'ws0chat01'])] : [],
    'AWS/ApplicationELB RequestCount': [dims(['LoadBalancer', 'app/web-alb/50dc6c495c0c9188'])],
    'AWS/Logs IncomingBytes': [
      dims(['LogGroupName', '/aws/lambda/thumbnailer']),
      dims(['LogGroupName', '/aws/eks/platform/cluster']),
      ...(all ? [dims(['LogGroupName', 'vpc-flow-logs'])] : []),
    ],
    'AWS/DynamoDB ConsumedReadCapacityUnits': [dims(['TableName', 'orders'])],
    'AWS/DynamoDB ConsumedWriteCapacityUnits': [dims(['TableName', 'orders'])],
    'AWS/AOSS SearchRequestRate': all
      ? [
          dims(
            ['CollectionName', 'kb-docs'],
            ['CollectionId', 'kb0docs0coll'],
            ['ClientId', ACCOUNT],
          ),
        ]
      : [],
    'AWS/AOSS SearchOCU': [dims(['ClientId', ACCOUNT])],
    'AWS/AOSS IndexingOCU': [dims(['ClientId', ACCOUNT])],
    'AWS/PrivateLinkEndpoints BytesProcessed': all
      ? [
          dims(
            ['VPC Id', 'vpc-0acme'],
            ['VPC Endpoint Id', 'vpce-0acme0ssm'],
            ['Endpoint Type', 'Interface'],
            ['Service Name', 'com.amazonaws.ap-northeast-1.ssm'],
          ),
        ]
      : [],
    'AWS/ElastiCache CurrConnections': [
      dims(['CacheClusterId', 'sessions-cache-001'], ['CacheNodeId', '0001']),
    ],
    'AWS/Kinesis IncomingRecords': all ? [dims(['StreamName', 'clickstream-old'])] : [],
    'AWS/SageMaker Invocations': [],
    'AWS/CloudFront Requests': [
      dims(['DistributionId', 'E1ACMEWEB'], ['Region', 'Global']),
      ...(all ? [dims(['DistributionId', 'E2OLDSITE'], ['Region', 'Global'])] : []),
    ],
    'AWS/Bedrock Invocations': (USED_MODELS[region] ?? [])
      .concat(
        all && region === TOKYO
          ? ['anthropic.claude-3-haiku-20240307-v1:0', 'support-tuned-v2']
          : [],
      )
      .map((id) => dims(['ModelId', id])),
  }
  const rows = table[`${namespace} ${metric}`] ?? []
  return region === TOKYO || namespace === 'AWS/Bedrock' || namespace === 'AWS/CloudFront'
    ? rows
    : []
}

export function listMetrics(call: CliCall, region: string, mode: ResourceMode): CliResult | null {
  const namespace = arg(call, '--namespace') ?? ''
  if (namespace === 'AWS/Billing' || namespace === 'AWS/S3') return null
  if (namespace === 'AWS/Bedrock' && notOffered(mode, region)) return ok([])
  return ok(presence(namespace, arg(call, '--metric-name') ?? '', region, mode))
}

/** A day's value for a metric of a resource: zero for what the demo leaves idle. */
function dailyValue(
  metric: string,
  dimensions: { Name: string; Value: string }[],
  mode: ResourceMode,
): number {
  if (mode === 'quiet') return metric === 'CPUUtilization' ? 35 : 1000
  const value = dimensions.map((d) => d.Value).join(' ')
  const idle: Record<string, (v: string) => boolean> = {
    CPUUtilization: (v) => v.includes('i-0a1b2c3d4e5f60003'),
    NetworkOut: (v) => v.includes('i-0a1b2c3d4e5f60003'),
    CurrConnections: (v) => v.includes('sessions-cache'),
    IncomingRecords: (v) => v.includes('clickstream-old'),
    ConsumedReadCapacityUnits: (v) => v.includes('sessions-legacy'),
    ConsumedWriteCapacityUnits: (v) => v.includes('sessions-legacy'),
    IncomingBytes: (v) => v.includes('vpc-flow-logs'),
  }
  if (idle[metric]?.(value) === true)
    return metric === 'CPUUtilization' ? 0.4 : metric === 'NetworkOut' ? 900_000 : 0
  if (metric === 'SearchOCU' || metric === 'IndexingOCU') return 2
  if (metric === 'InputTokenCount') return 940_000
  if (metric === 'OutputTokenCount') return 100_000
  return metric === 'CPUUtilization' ? 35 : 5_000
}

const QuerySchemaless = (
  raw: string,
): {
  Id: string
  MetricStat?: { Metric?: { MetricName?: string; Dimensions?: { Name: string; Value: string }[] } }
}[] => {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ReturnType<typeof QuerySchemaless>) : []
  } catch {
    return []
  }
}

/** GetMetricData: thirty daily points per query, zeros as no points (as AWS leaves them out). */
export function metricData(call: CliCall, now: number, mode: ResourceMode): CliResult {
  const queries = QuerySchemaless(arg(call, '--metric-data-queries') ?? '[]')
  return ok(
    queries.map((query) => {
      const metric = query.MetricStat?.Metric?.MetricName ?? ''
      const value = dailyValue(metric, query.MetricStat?.Metric?.Dimensions ?? [], mode)
      const days = value === 0 ? 0 : 30
      return {
        id: query.Id,
        t: Array.from({ length: days }, (_, i) => iso(now - (days - i) * DAY)),
        v: Array.from({ length: days }, () => value),
      }
    }),
  )
}

/** The statistics fallback for RESOURCES' namespaces (GetMetricData off). */
export function resourceStatistics(
  call: CliCall,
  now: number,
  mode: ResourceMode,
): CliResult | null {
  const namespace = arg(call, '--namespace') ?? ''
  if (['AWS/Billing', 'AWS/S3', 'AWS/EC2'].includes(namespace)) return null
  const metric = arg(call, '--metric-name') ?? ''
  const value = dailyValue(metric, dimensionsOf(call.argv), mode)
  return ok(
    value === 0 ? [] : Array.from({ length: 14 }, (_, i) => [iso(now - (14 - i) * DAY), value]),
  )
}

/* ---- Outside the pane: the sweep, and describe-regions ---- */

export const ENABLED_REGIONS = [
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'eu-central-1',
  'eu-north-1',
  'eu-west-1',
  'eu-west-2',
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-2',
]

/** The sweep's describes, by their `--query` (the pane's own reads keep their shapes). */
export function sweepAnswer(
  call: CliCall,
  region: string,
  now: number,
  mode: ResourceMode,
): CliResult | null {
  const query = arg(call, '--query') ?? ''
  const verb = `${call.argv[0]} ${call.argv[1]}`
  const found = SWEEP.find(([v, mark]) => v === verb && query.includes(mark))
  if (found === undefined) return null
  return ok(mode === 'quiet' ? [] : (found[2](now)[region] ?? []))
}

/** The sweep's calls by verb and a mark of their `--query`, and what each region has. */
const SWEEP: [string, string, (now: number) => Record<string, unknown[]>][] = [
  [
    'ec2 describe-instances',
    's:State.Name',
    (now) => ({
      'us-west-2': [
        { id: 'i-0b7c6d5e4f3a20001', type: 'g5.xlarge', s: 'running', l: iso(now - 270 * DAY) },
      ],
    }),
  ],
  [
    'ec2 describe-volumes',
    'g:Size',
    () => ({ 'us-west-2': [{ id: 'vol-0b7c6d5e', g: 100, t: 'gp3', s: 'available' }] }),
  ],
  [
    'ec2 describe-nat-gateways',
    's:State}',
    () => ({ 'ap-southeast-1': [{ id: 'nat-0b7c6d5e01', s: 'available' }] }),
  ],
  ['ec2 describe-addresses', 'id:AllocationId', () => ({})],
]

/* ---- Every other list ---- */

export function resourceRoutes(): Record<string, Route> {
  return {
    ...bedrockRoutes(),
    's3api list-buckets': (_c, _r, now, mode) => ok(BUCKETS(now, mode)),
    'logs describe-log-groups': (_c, region, now, mode) =>
      ok(inTokyo(region, LOG_GROUPS(now, mode))),
    'dynamodb list-tables': (_c, region, now, mode) =>
      ok(inTokyo(region, Object.keys(TABLES(now, mode)))),
    'dynamodb describe-table': (call, _r, now, mode) =>
      ok((TABLES(now, mode) as Record<string, unknown>)[arg(call, '--table-name') ?? ''] ?? null),
    'ecs list-clusters': (_c, region) =>
      ok(inTokyo(region, [tokyoArn('ecs', 'cluster/web'), tokyoArn('ecs', 'cluster/batch-old')])),
    'ecs describe-clusters': (_c, _r, _n, mode) =>
      ok([
        { n: 'web', s: 'ACTIVE', svc: 2, run: 6, pend: 0 },
        {
          n: 'batch-old',
          s: 'ACTIVE',
          svc: mode === 'quiet' ? 1 : 0,
          run: mode === 'quiet' ? 1 : 0,
          pend: 0,
        },
      ]),
    'ecs list-services': (call) =>
      ok(
        arg(call, '--cluster') === 'web'
          ? [tokyoArn('ecs', 'service/web/frontend'), tokyoArn('ecs', 'service/web/worker')]
          : [],
      ),
    'ecs describe-services': (_c, _r, now, mode) =>
      ok([
        { n: 'frontend', d: 4, r: 4, l: 'FARGATE', c: iso(now - 300 * DAY) },
        {
          n: 'worker',
          d: mode === 'quiet' ? 2 : 0,
          r: mode === 'quiet' ? 2 : 0,
          l: 'FARGATE',
          c: iso(now - 300 * DAY),
        },
      ]),
    'eks list-nodegroups': () => ok(['general']),
    'eks list-fargate-profiles': () => ok([]),
    'elbv2 describe-target-groups': (_c, region) =>
      ok(
        inTokyo(region, [
          {
            n: 'web-tg',
            arn: tokyoArn('elasticloadbalancing', 'targetgroup/web-tg/6d0ecf831eec9f09'),
            lbs: [tokyoArn('elasticloadbalancing', 'loadbalancer/app/web-alb/50dc6c495c0c9188')],
          },
          // A group left behind by a load balancer deleted: its targets are not asked for.
          {
            n: 'old-tg',
            arn: tokyoArn('elasticloadbalancing', 'targetgroup/old-tg/1a2b3c4d5e6f7a8b'),
            lbs: [],
          },
        ]),
      ),
    'elbv2 describe-target-health': () => ok(2),
    'elb describe-load-balancers': () => ok([]),
    'sqs list-queues': (_c, region, _n, mode) =>
      ok(
        inTokyo(
          region,
          Object.keys(QUEUES(mode)).map(
            (n) => `https://sqs.${TOKYO}.amazonaws.com/${ACCOUNT}/${n}`,
          ),
        ),
      ),
    'sqs get-queue-attributes': (call, _r, _n, mode) =>
      ok(
        (QUEUES(mode) as Record<string, unknown>)[
          (arg(call, '--queue-url') ?? '').split('/').at(-1) ?? ''
        ] ?? null,
      ),
    'sns list-topics': (_c, region) =>
      ok(inTokyo(region, [tokyoArn('sns', 'alerts'), tokyoArn('sns', 'deploy-notices')])),
    'sns list-subscriptions': (_c, region, _n, mode) =>
      ok(
        inTokyo(region, [
          tokyoArn('sns', 'alerts'),
          tokyoArn('sns', 'alerts'),
          ...(mode === 'quiet' ? [tokyoArn('sns', 'deploy-notices')] : []),
        ]),
      ),
    'apigateway get-rest-apis': (_c, region, now) =>
      ok(inTokyo(region, [{ id: 'a1b2c3d4e5', n: 'orders-api', c: iso(now - 400 * DAY) }])),
    'apigatewayv2 get-apis': (_c, region, now) =>
      ok(
        inTokyo(region, [
          { id: 'ws0chat01', n: 'chat-ws', p: 'WEBSOCKET', c: iso(now - 500 * DAY) },
        ]),
      ),
    'cloudfront list-distributions': (_c, _r, now) =>
      ok([
        ['E1ACMEWEB', true, 'Deployed', iso(now - 30 * DAY), 'www.acme.example'],
        ['E2OLDSITE', true, 'Deployed', iso(now - 600 * DAY), 'old.acme.example'],
      ]),
    'opensearchserverless list-collections': (_c, region, _n, mode) =>
      notOffered(mode, region)
        ? unreachable('aoss', region)
        : ok(inTokyo(region, ['kb0docs0coll'])),
    'opensearchserverless batch-get-collection': (_c, region, now) =>
      ok(
        inTokyo(region, [
          {
            id: 'kb0docs0coll',
            n: 'kb-docs',
            t: 'VECTORSEARCH',
            s: 'ACTIVE',
            c: now - 60 * DAY,
            k: tokyoArn('kms', 'key/auto'),
          },
        ]),
      ),
    'ec2 describe-vpc-endpoints': (_c, region, now) =>
      ok(
        inTokyo(region, [
          {
            id: 'vpce-0acme0ssm',
            svc: 'com.amazonaws.ap-northeast-1.ssm',
            s: 'available',
            azs: 2,
            c: iso(now - 300 * DAY),
            vpc: 'vpc-0acme',
            name: 'ssm',
          },
        ]),
      ),
    'ec2 describe-transit-gateway-attachments': () => ok([]),
    'ec2 describe-vpn-connections': () => ok([]),
    'ec2 describe-vpcs': (_c, region) =>
      ok(
        inTokyo(region, [
          { id: 'vpc-0acme', d: false },
          { id: 'vpc-0default', d: true },
        ]),
      ),
    'ec2 describe-regions': () => ok(ENABLED_REGIONS),
    'ec2 describe-snapshots': (_c, region, now, mode) =>
      ok(
        inTokyo(region, [
          { id: 'snap-0ami01', v: 'vol-0a1b2c3d1', g: 50, c: iso(now - 400 * DAY), t: 'standard' },
          ...(mode === 'quiet'
            ? []
            : [
                {
                  id: 'snap-0orphan01',
                  v: 'vol-0gone0001',
                  g: 200,
                  c: iso(now - 500 * DAY),
                  t: 'standard',
                },
              ]),
        ]),
      ),
    'ec2 describe-images': (_c, region, now, mode) =>
      ok(
        inTokyo(region, [
          {
            id: 'ami-0old01',
            n: 'web-base-2024',
            c: iso(now - 400 * DAY),
            l: iso(now - (mode === 'quiet' ? 3 : 300) * DAY),
            s: ['snap-0ami01'],
            st: 'available',
          },
        ]),
      ),
    'sagemaker list-endpoints': () => ok([]),
    'sagemaker list-notebook-instances': (_c, region, now, mode) =>
      ok(
        inTokyo(region, [
          {
            n: 'exp-notebook',
            s: mode === 'quiet' ? 'Stopped' : 'InService',
            t: 'ml.t3.large',
            c: iso(now - 90 * DAY),
            m: iso(now - 40 * DAY),
          },
        ]),
      ),
    'sagemaker list-apps': () => ok([]),
    'ecr describe-repositories': (_c, region, now) =>
      ok(inTokyo(region, [{ n: 'web', c: iso(now - 500 * DAY) }])),
    'ecr describe-images': (_c, _r, now) =>
      ok([{ b: 0.4 * GB, p: iso(now - 3 * DAY), l: iso(now - HOUR) }]),
    'elasticache describe-cache-clusters': (_c, region, now) =>
      ok(
        inTokyo(region, [
          {
            id: 'sessions-cache-001',
            t: 'cache.r6g.large',
            e: 'redis',
            s: 'available',
            n: 1,
            c: iso(now - 400 * DAY),
            g: 'sessions-cache',
          },
        ]),
      ),
    'elasticache describe-serverless-caches': () => ok([]),
    'opensearch list-domain-names': () => ok([]),
    'opensearch describe-domains': () => ok([]),
    'redshift describe-clusters': () => ok([]),
    'redshift-serverless list-workgroups': () => ok([]),
    'kinesis list-streams': (_c, region, now) =>
      ok(
        inTokyo(region, [
          { n: 'clickstream-old', s: 'ACTIVE', m: 'PROVISIONED', c: iso(now - 700 * DAY) },
        ]),
      ),
    'kinesis describe-stream-summary': () => ok(2),
    'transfer list-servers': () => ok([]),
    'kms list-keys': (_c, region) =>
      ok(
        inTokyo(region, [
          '0aaa1111-2222-3333-4444-555566667777',
          '0bbb1111-2222-3333-4444-555566667777',
        ]),
      ),
    'kms list-aliases': (_c, region) =>
      ok(inTokyo(region, [{ a: 'alias/aws/s3', k: '0bbb1111-2222-3333-4444-555566667777' }])),
    'kms describe-key': (_c, _r, now, mode) =>
      ok({
        id: '0aaa1111-2222-3333-4444-555566667777',
        m: 'CUSTOMER',
        s: mode === 'quiet' ? 'Enabled' : 'Disabled',
        c: iso(now - 600 * DAY),
        d: null,
        sp: 'SYMMETRIC_DEFAULT',
      }),
    'route53 list-hosted-zones': (_c, _r, _n, mode) =>
      ok([
        { id: '/hostedzone/Z0ACME0001', n: 'acme.example.', c: 14, p: false },
        {
          id: '/hostedzone/Z0ACME0002',
          n: 'old-acme.example.',
          c: mode === 'quiet' ? 5 : 2,
          p: false,
        },
      ]),
  }
}

/** Every alarm (all states): one watches an instance that is gone. */
export function allAlarms(region: string, mode: ResourceMode): CliResult {
  return ok(
    inTokyo(region, [
      {
        n: 'orders-db-cpu-high',
        s: 'ALARM',
        ns: 'AWS/RDS',
        d: 'DBInstanceIdentifier',
        v: 'orders-db',
      },
      {
        n: 'web-5xx',
        s: 'OK',
        ns: 'AWS/ApplicationELB',
        d: 'LoadBalancer',
        v: 'app/web-alb/50dc6c495c0c9188',
      },
      ...(mode === 'quiet'
        ? []
        : [
            {
              n: 'batch-2023-cpu',
              s: 'INSUFFICIENT_DATA',
              ns: 'AWS/EC2',
              d: 'InstanceId',
              v: 'i-0gone00000000001',
            },
          ]),
    ]),
  )
}
