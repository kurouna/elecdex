import type { CliCall, CliResult, RunCli } from '@shared/cloud-cli/probe'
import {
  allAlarms,
  listMetrics,
  metricData,
  resourceRoutes,
  resourceStatistics,
  sweepAnswer,
} from './stub-aws-resources.js'
import { ACCOUNT, DAY, HOUR, iso, ok, result } from './stub-common.js'

/**
 * A stand-in AWS CLI for tests and screenshots (`ELECDEX_CLOUD_STUB`): never the real CLI, never
 * an account, never the network. It answers in the shapes the probes' `--query` leaves (checked
 * against AWS CLI 2.39.6, 2026-11-07), for a made-up account "acme-prod". The mode comes from the
 * variable, or from `globalThis.__elecdexCloud.aws` so an e2e spec can change it while the app
 * runs: demo (the default), signedout, partial, nobilling, nocli, offline, process (a profile
 * signing in through credential_process), and RESOURCES' quiet (nothing looks forgotten) and
 * noregion (Bedrock and OpenSearch Serverless offered nowhere the pane reads but us-east-1);
 * RESOURCES' answers are in stub-aws-resources.ts.
 */

type Mode =
  | 'demo'
  | 'signedout'
  | 'partial'
  | 'nobilling'
  | 'nocli'
  | 'offline'
  | 'process'
  | 'quiet'
  | 'noregion'
const MODES: readonly Mode[] = [
  'demo',
  'signedout',
  'partial',
  'nobilling',
  'nocli',
  'offline',
  'process',
  'quiet',
  'noregion',
]

const denied = (action: string) =>
  result(
    false,
    '',
    `An error occurred (AccessDeniedException) when calling the operation: User: arn:aws:sts::${ACCOUNT}:assumed-role/ReadOnly/aki is not authorized to perform: ${action} on resource: arn:aws:${action.split(':')[0]}::${ACCOUNT}:*`,
  )

/** The made-up account's things, in the region they live in. */
const INSTANCES = (now: number) => ({
  'ap-northeast-1': [
    instance('i-0a1b2c3d4e5f60001', 'web-1', 'm6i.large', 'running', now - 41 * DAY, ['sg-0web']),
    instance('i-0a1b2c3d4e5f60002', 'web-2', 'm6i.large', 'running', now - 41 * DAY, ['sg-0web']),
    instance('i-0a1b2c3d4e5f60003', 'dev-box', 't3.large', 'running', now - 96 * DAY, ['sg-0dev']),
    instance('i-0a1b2c3d4e5f60004', 'bastion', 't3.micro', 'running', now - 210 * DAY, ['sg-0ssh']),
    {
      ...instance('i-0a1b2c3d4e5f60005', 'batch-old', 'c5.xlarge', 'stopped', now - 300 * DAY, [
        'sg-0dev',
      ]),
      reason: `User initiated (${iso(now - 45 * DAY)
        .slice(0, 19)
        .replace('T', ' ')} GMT)`,
    },
  ],
  'us-east-1': [
    instance('i-0f9e8d7c6b5a40001', 'ml-train', 'g5.xlarge', 'running', now - 6 * DAY, ['sg-0ml']),
  ],
})

function instance(
  id: string,
  name: string,
  type: string,
  state: string,
  launch: number,
  sgs: string[],
) {
  return {
    id,
    type,
    state,
    launch: iso(launch),
    az: id.startsWith('i-0f')
      ? 'us-east-1a'
      : id.endsWith('1')
        ? 'ap-northeast-1a'
        : 'ap-northeast-1c',
    life: null,
    name,
    platform: 'Linux/UNIX',
    reason: '',
    vols: [`vol-${id.slice(2, 10)}`],
    sgs,
    vpc: 'vpc-0acme',
    subnet: 'subnet-0a',
    ip: '10.0.1.23',
    pub: name === 'bastion' ? '203.0.113.10' : null,
    imds: name === 'dev-box' ? 'optional' : 'required',
  }
}

const VOLUMES = (now: number) => ({
  'ap-northeast-1': [
    ...Object.values(INSTANCES(now))
      .flat()
      .filter((i) => !i.id.startsWith('i-0f'))
      .map((i) => ({
        id: `vol-${i.id.slice(2, 10)}`,
        size: i.name === 'batch-old' ? 200 : 50,
        type: 'gp3',
        state: 'in-use',
        iops: 3000,
        at: i.id,
        created: i.launch,
        name: `${i.name}-root`,
      })),
    {
      id: 'vol-0old0data',
      size: 500,
      type: 'gp2',
      state: 'available',
      iops: 1500,
      at: null,
      created: iso(now - 400 * DAY),
      name: 'old-data',
    },
    {
      id: 'vol-0scratch1',
      size: 100,
      type: 'gp3',
      state: 'available',
      iops: 3000,
      at: null,
      created: iso(now - 20 * DAY),
      name: null,
    },
  ],
  'us-east-1': [
    {
      id: 'vol-0f9e8d7c',
      size: 400,
      type: 'gp3',
      state: 'in-use',
      iops: 3000,
      at: 'i-0f9e8d7c6b5a40001',
      created: iso(now - 6 * DAY),
      name: 'ml-train-root',
    },
  ],
})

const TB = 1024 ** 4
const GB = 1024 ** 3

const BUCKETS: Record<string, [string, string, number][]> = {
  'ap-northeast-1': [
    ['acme-logs-archive', 'StandardStorage', 3.2 * TB],
    ['acme-logs-archive', 'GlacierStorage', 10.4 * TB],
    ['acme-assets', 'StandardStorage', 120 * GB],
    ['acme-backups', 'StandardIAStorage', 860 * GB],
  ],
  'us-east-1': [['acme-ml-datasets', 'StandardStorage', 1.6 * TB]],
}

const TRAIL = (now: number) => [
  trail(
    'e1',
    now - 20 * 60_000,
    'ConsoleLogin',
    'signin.amazonaws.com',
    'aki',
    'IAMUser',
    { ConsoleLogin: 'Success' },
    'Yes',
  ),
  trail('e2', now - 35 * 60_000, 'RunInstances', 'ec2.amazonaws.com', 'aki', 'AssumedRole'),
  trail(
    'e3',
    now - 2 * HOUR,
    'AuthorizeSecurityGroupIngress',
    'ec2.amazonaws.com',
    'ops',
    'IAMUser',
  ),
  trail(
    'e4',
    now - 3 * HOUR,
    'PutBucketPolicy',
    's3.amazonaws.com',
    'ci-bot',
    'IAMUser',
    null,
    null,
    'AccessDenied',
  ),
  trail(
    'e5',
    now - 5 * HOUR,
    'ConsoleLogin',
    'signin.amazonaws.com',
    'ops',
    'IAMUser',
    { ConsoleLogin: 'Success' },
    'No',
  ),
  trail(
    'e6',
    now - 7 * HOUR,
    'UpdateFunctionCode20150331v2',
    'lambda.amazonaws.com',
    'ci-bot',
    'IAMUser',
  ),
  trail('e7', now - 9 * HOUR, 'CreateRole', 'iam.amazonaws.com', 'aki', 'AssumedRole'),
  trail(
    'e8',
    now - 13 * HOUR,
    'ConsoleLogin',
    'signin.amazonaws.com',
    'guest',
    'IAMUser',
    { ConsoleLogin: 'Failure' },
    'No',
  ),
  trail('e9', now - 15 * HOUR, 'StopInstances', 'ec2.amazonaws.com', 'aki', 'AssumedRole'),
  trail('e10', now - 18 * HOUR, 'CreateTags', 'ec2.amazonaws.com', 'autoscaling', 'AWSService'),
]

function trail(
  id: string,
  at: number,
  name: string,
  source: string,
  user: string,
  type: string,
  response: Record<string, string> | null = null,
  mfa: string | null = null,
  error: string | null = null,
) {
  return {
    id,
    t: iso(at),
    n: name,
    s: source,
    u: user,
    e: JSON.stringify({
      userIdentity: { type, userName: user },
      awsRegion: 'ap-northeast-1',
      errorCode: error,
      responseElements: response,
      additionalEventData: mfa === null ? null : { MFAUsed: mfa },
      sourceIPAddress: '198.51.100.7',
    }),
  }
}

/** The month so far: about $27 a day, so the quota and budget lines have something to show. */
function billingPoints(now: number): [string, number][] {
  const d = new Date(now)
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  const last = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)
  const out: [string, number][] = []
  for (let t = last; t < start; t += DAY)
    out.push([iso(t), Math.round(((t - last) / DAY + 1) * 25.4 * 100) / 100])
  for (let t = start; t <= now; t += DAY)
    out.push([iso(t), Math.round(((t - start) / DAY + 1) * 27.3 * 100) / 100])
  return out
}

const SERVICES: [string, number][] = [
  ['AmazonEC2', 0.36],
  ['AmazonRDS', 0.24],
  ['AmazonEKS', 0.11],
  ['AmazonVPC', 0.09],
  ['AmazonS3', 0.08],
  ['AWSELB', 0.04],
  ['AmazonCloudWatch', 0.03],
  ['AWSLambda', 0.01],
]

const credentialReport = (now: number) =>
  Buffer.from(
    [
      'user,arn,user_creation_time,password_enabled,password_last_used,password_last_changed,password_next_rotation,mfa_active,access_key_1_active,access_key_1_last_rotated,access_key_2_active,access_key_2_last_rotated',
      `<root_account>,arn,${iso(now - 900 * DAY)},not_supported,${iso(now - 60 * DAY)},not_supported,not_supported,true,false,N/A,false,N/A`,
      `aki,arn,${iso(now - 800 * DAY)},true,${iso(now - HOUR)},N/A,N/A,true,false,N/A,false,N/A`,
      `ops,arn,${iso(now - 300 * DAY)},true,${iso(now - 5 * HOUR)},N/A,N/A,false,false,N/A,false,N/A`,
      `ci-bot,arn,${iso(now - 500 * DAY)},false,N/A,N/A,N/A,false,true,${iso(now - 212 * DAY)},false,N/A`,
    ].join('\n'),
  ).toString('base64')

type Route = (call: CliCall, region: string, now: number, mode: Mode) => CliResult

const regional =
  <T>(
    table: (now: number) => Record<string, T[]>,
    quiet: (row: T) => T | null = (row) => row,
  ): Route =>
  (_c, region, now, mode) =>
    ok(
      (table(now)[region] ?? [])
        .map((row) => (mode === 'quiet' ? quiet(row) : row))
        .filter((row): row is T => row !== null),
    )

const ROUTES: Record<string, Route> = {
  // The region; credential_process is not set (exit 1, as the real CLI answers a missing key).
  'configure get': (call, _r, _n, mode) =>
    call.argv[2] === 'region'
      ? result(true, 'ap-northeast-1\n')
      : mode === 'process'
        ? result(true, 'C:\\Tools\\sign-in.exe --profile acme\n')
        : result(false, ''),
  'configure list-profiles': () => result(true, 'default\nacme-prod\nacme-dev\n'),
  'sts get-caller-identity': () =>
    ok({ account: ACCOUNT, arn: `arn:aws:sts::${ACCOUNT}:assumed-role/ReadOnly/aki` }),
  'iam list-account-aliases': () => ok('acme-prod'),
  'iam get-account-summary': () => ok({ mfa: 1, keys: 0, users: 4, roles: 37 }),
  'iam generate-credential-report': () => ok('COMPLETE'),
  'iam get-credential-report': (_c, _r, now) => ok(credentialReport(now)),
  'cloudwatch list-metrics': (call, region, _now, mode) => {
    const resources = listMetrics(call, region, mode)
    if (resources !== null) return resources
    const namespace = call.argv[call.argv.indexOf('--namespace') + 1]
    if (namespace === 'AWS/Billing')
      return ok(
        mode === 'nobilling'
          ? []
          : [
              [{ Name: 'Currency', Value: 'USD' }],
              ...SERVICES.map(([name]) => [
                { Name: 'ServiceName', Value: name },
                { Name: 'Currency', Value: 'USD' },
              ]),
            ],
      )
    return ok(
      (BUCKETS[region] ?? []).map(([bucket, storage]) => [
        { Name: 'BucketName', Value: bucket },
        { Name: 'StorageType', Value: storage },
      ]),
    )
  },
  'cloudwatch get-metric-statistics': (call, region, now, mode) =>
    resourceStatistics(call, now, mode) ?? statistics(call, region, now, mode),
  'cloudwatch get-metric-data': (call, _region, now, mode) => metricData(call, now, mode),
  'budgets describe-budgets': (_c, _r, _n, mode) =>
    mode === 'partial'
      ? denied('budgets:ViewBudget')
      : ok([{ n: 'monthly', limit: '1000.0', actual: '824.3', forecast: '1102.0' }]),
  'freetier get-account-plan-state': (_c, _r, _n, mode) =>
    mode === 'partial'
      ? denied('freetier:GetAccountPlanState')
      : ok({ accountPlanType: 'PAID', accountPlanStatus: 'ACTIVE' }),
  'freetier get-free-tier-usage': () => ok([]),
  'route53domains list-domains': (_c, _r, now) =>
    ok([{ n: 'acme.example', auto: true, exp: iso(now + 200 * DAY) }]),
  'savingsplans describe-savings-plans': (_c, _r, now) =>
    ok([{ id: 'sp-0acme1', end: iso(now + 19 * DAY), type: 'Compute' }]),
  'cloudwatch describe-alarms': (call, region, now, mode) =>
    !call.argv.includes('--state-value')
      ? allAlarms(region, mode)
      : ok(
          region === 'ap-northeast-1'
            ? {
                m: [
                  {
                    n: 'orders-db-cpu-high',
                    s: iso(now - 42 * 60_000),
                    ns: 'AWS/RDS',
                    metric: 'CPUUtilization',
                    dim: 'orders-db',
                  },
                ],
                c: [],
              }
            : { m: [], c: [] },
        ),
  'ec2 describe-instance-status': () => ok([]),
  'cloudformation list-stacks': (_c, region, now) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            { n: 'payments', s: 'UPDATE_ROLLBACK_FAILED', t: iso(now - 3 * HOUR), d: 'DRIFTED' },
            { n: 'network', s: 'UPDATE_COMPLETE', t: iso(now - 30 * DAY), d: 'IN_SYNC' },
            { n: 'web', s: 'CREATE_COMPLETE', t: iso(now - 41 * DAY), d: 'NOT_CHECKED' },
          ]
        : [],
    ),
  'cloudtrail lookup-events': (call, region, now) => {
    const byResource = call.argv.some((a) => a.startsWith('AttributeKey=ResourceName'))
    if (byResource)
      return ok([
        {
          id: 'h1',
          t: iso(now - 2 * DAY),
          n: 'StartInstances',
          s: 'ec2.amazonaws.com',
          u: 'aki',
          e: null,
        },
        {
          id: 'h2',
          t: iso(now - 9 * DAY),
          n: 'ModifyInstanceAttribute',
          s: 'ec2.amazonaws.com',
          u: 'ops',
          e: null,
        },
      ])
    return ok(region === 'ap-northeast-1' ? TRAIL(now) : [])
  },
  'ec2 describe-instances': regional(INSTANCES, (i) => (i.state === 'stopped' ? null : i)),
  'ec2 describe-volumes': regional(VOLUMES, (v) => (v.state === 'available' ? null : v)),
  'ec2 describe-addresses': (_c, region, _n, mode) =>
    ok(
      region === 'ap-northeast-1' && mode !== 'quiet'
        ? [
            {
              ip: '203.0.113.10',
              alloc: 'eipalloc-01',
              assoc: 'eipassoc-01',
              inst: 'i-0a1b2c3d4e5f60004',
              eni: 'eni-01',
              domain: 'vpc',
            },
            {
              ip: '203.0.113.77',
              alloc: 'eipalloc-02',
              assoc: null,
              inst: null,
              eni: null,
              domain: 'vpc',
            },
          ]
        : [],
    ),
  'ec2 describe-nat-gateways': (_c, region) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            {
              id: 'nat-0acme01',
              state: 'available',
              vpc: 'vpc-0acme',
              conn: 'public',
              name: 'main-nat',
            },
          ]
        : [],
    ),
  'elbv2 describe-load-balancers': (_c, region, now) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            {
              arn: `arn:aws:elasticloadbalancing:ap-northeast-1:${ACCOUNT}:loadbalancer/app/web-alb/50dc6c495c0c9188`,
              name: 'web-alb',
              type: 'application',
              scheme: 'internet-facing',
              state: 'active',
              created: iso(now - 41 * DAY),
            },
          ]
        : [],
    ),
  'ec2 describe-security-groups': (_c, region) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            { id: 'sg-0ssh', name: 'bastion-ssh', perms: [{ p: 'tcp', f: 22, t: 22 }] },
            { id: 'sg-0web', name: 'web', perms: [{ p: 'tcp', f: 443, t: 443 }] },
            { id: 'sg-0dev', name: 'dev', perms: [] },
          ]
        : [],
    ),
  'rds describe-db-instances': (_c, region, now) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            {
              id: 'orders-db',
              engine: 'postgres',
              version: '16.4',
              class: 'db.r6g.large',
              state: 'available',
              multi: true,
              storage: 200,
              support: 'open-source-rds-extended-support',
              created: iso(now - 500 * DAY),
            },
          ]
        : [],
    ),
  'lambda list-functions': (_c, region, now) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            { n: 'thumbnailer', r: 'python3.12', m: 512, t: iso(now - 7 * HOUR) },
            { n: 'legacy-cron', r: 'nodejs16.x', m: 128, t: iso(now - 700 * DAY) },
          ]
        : [],
    ),
  'eks list-clusters': (_c, region) => ok(region === 'ap-northeast-1' ? ['platform'] : []),
  'eks describe-cluster-versions': () =>
    ok([
      {
        v: '1.29',
        end: '2025-03-23T00:00:00Z',
        ext: '2026-03-23T00:00:00Z',
        s: 'EXTENDED_SUPPORT',
      },
      {
        v: '1.33',
        end: '2026-07-29T00:00:00Z',
        ext: '2027-07-29T00:00:00Z',
        s: 'STANDARD_SUPPORT',
      },
    ]),
  'eks describe-cluster': () =>
    ok({ v: '1.29', s: 'ACTIVE', p: 'EXTENDED', c: '2024-02-01T00:00:00Z' }),
  'acm list-certificates': (_c, region, now) =>
    ok(
      region === 'ap-northeast-1'
        ? [
            {
              arn: `arn:aws:acm:ap-northeast-1:${ACCOUNT}:certificate/0b3f9f0c-1d2e-4f5a-8b7c-9d0e1f2a3b4c`,
              d: 'api.acme.example',
              t: 'IMPORTED',
              exp: iso(now + 5 * DAY),
              use: true,
              k: 'RSA_2048',
              s: 'ISSUED',
            },
          ]
        : [],
    ),
  'backup list-backup-jobs': () => ok([]),
  'guardduty list-detectors': (_c, region, _n, mode) =>
    mode === 'partial'
      ? denied('guardduty:ListDetectors')
      : ok(region === 'ap-northeast-1' ? 'd1acme' : null),
  'guardduty get-findings-statistics': () =>
    ok([
      { s: 5, c: 2 },
      { s: 2, c: 6 },
    ]),
  'ec2 describe-reserved-instances': () => ok([]),
  'ce get-cost-and-usage': () =>
    ok({
      ResultsByTime: [
        {
          Groups: SERVICES.map(([name, share]) => ({
            Keys: [name.replace(/^Amazon/, 'Amazon ')],
            Metrics: { UnblendedCost: { Amount: String(Math.round(share * 800 * 100) / 100) } },
          })),
        },
      ],
    }),
  'ce get-cost-forecast': () => ok({ Total: { Amount: '1080.40' } }),
}

function statistics(call: CliCall, region: string, now: number, mode: Mode): CliResult {
  const namespace = call.argv[call.argv.indexOf('--namespace') + 1]
  const dims = call.argv.filter((a) => a.startsWith('Name='))
  if (namespace === 'AWS/Billing') {
    const service = dims.find((d) => d.startsWith('Name=ServiceName'))?.split('Value=')[1]
    const points = billingPoints(now)
    if (service === undefined) return ok(points)
    const share = SERVICES.find(([name]) => name === service)?.[1] ?? 0
    return ok(points.slice(-1).map(([t, usd]) => [t, Math.round(usd * share * 100) / 100]))
  }
  if (namespace === 'AWS/S3') {
    const bucket = dims[0]?.split('Value=')[1]
    const storage = dims[1]?.split('Value=')[1]
    const found = (BUCKETS[region] ?? []).find(([b, s]) => b === bucket && s === storage)
    return ok(found ? [[iso(now - DAY), found[2]]] : [])
  }
  const id = dims[0]?.split('Value=')[1] ?? ''
  const idle = id === 'i-0a1b2c3d4e5f60003' && mode !== 'quiet'
  return ok(
    Array.from({ length: 7 }, (_, i) => ({
      t: iso(now - (7 - i) * DAY),
      avg: idle ? 0.6 + (i % 3) * 0.2 : 31 + i * 2,
      max: idle ? 3.1 : 78,
    })),
  )
}

const RESOURCES: Record<string, Route> = resourceRoutes()

const regionOf = (call: CliCall) => call.argv[call.argv.indexOf('--region') + 1] ?? 'us-east-1'

/** The endpoint's first label where it is not the command's name. */
const ENDPOINT: Record<string, string> = {
  opensearchserverless: 'aoss',
  sagemaker: 'api.sagemaker',
}

/**
 * Offline, AWS CLI names the endpoint of the call it could not reach: Bedrock's offline reads
 * just like a region without Bedrock (aws.md §14.4), which the probes must tell apart.
 */
const unreachable = (call: CliCall): CliResult => {
  const service = call.argv[0] ?? 'sts'
  return result(
    false,
    '',
    `Could not connect to the endpoint URL: "https://${ENDPOINT[service] ?? service}.${regionOf(call)}.amazonaws.com/"`,
  )
}

export function stubAws(initial: string): RunCli {
  const modeNow = (): Mode => {
    const live = (globalThis as { __elecdexCloud?: { aws?: string } }).__elecdexCloud?.aws
    const value = live ?? initial
    return (MODES as readonly string[]).includes(value) ? (value as Mode) : 'demo'
  }
  return async (call: CliCall) => {
    const mode = modeNow()
    if (mode === 'nocli') return { ...result(false, ''), missing: true }
    if (mode === 'offline') return unreachable(call)
    const verb = `${call.argv[0]} ${call.argv[1]}`
    if (call.argv[0] === '--version')
      return result(true, 'aws-cli/2.39.6 Python/3.13.7 Windows/11 exe/AMD64\n')
    if (mode === 'signedout' && call.argv[0] !== 'configure')
      return result(
        false,
        '',
        "aws: [ERROR]: Unable to refresh login credentials because of a change in your password. Please reauthenticate with your new password using 'aws login'.",
      )
    const now = Date.now()
    const swept = sweepAnswer(call, regionOf(call), now, mode)
    if (swept !== null) return swept
    const route = ROUTES[verb] ?? RESOURCES[verb]
    return route === undefined
      ? result(false, '', `aws: [ERROR]: the stand-in does not answer ${verb}`)
      : route(call, regionOf(call), now, mode)
  }
}
