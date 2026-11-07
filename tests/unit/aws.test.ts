import { describe, expect, it } from 'vitest'
import {
  asksNow,
  type BillingFile,
  billingStore,
  freshAccount,
  rolled,
} from '../../src/main/aws/billing-store'
import { AWS_PROBES, costExplorerDue, openPorts } from '../../src/main/aws/probes'
import { AwsService, type CloudAlert } from '../../src/main/aws/service'
import { concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubAws } from '../../src/main/cloud-cli/stub-aws'
import { activeCost, isIdle } from '../../src/shared/aws/active'
import { attention, stoppedAt } from '../../src/shared/aws/attention'
import { billingMonth, quotaCrossed } from '../../src/shared/aws/billing'
import { awsBoardKey, parseAwsBoardKey, readAwsPane } from '../../src/shared/aws/board'
import { changesSince } from '../../src/shared/aws/changes'
import { consoleUrl, isConsoleUrl } from '../../src/shared/aws/console-url'
import { DRILL, facets, filterRows, sortRows } from '../../src/shared/aws/drill'
import { parseCredentialReport } from '../../src/shared/aws/parse'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import { parseTrail, pulseBins } from '../../src/shared/aws/trail'
import type { AwsBoard, DrillRow } from '../../src/shared/aws/types'
import type { CliCall } from '../../src/shared/cloud-cli/probe'

/** AWS STATUS (docs/aws.md): the judgements, the money, the drill-down, and the board on the stand-in. */

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 8, 3)
const R = 'ap-northeast-1'

const readings = (over: Partial<AwsReadings> = {}): AwsReadings => ({
  ...emptyReadings(NOW, [R]),
  ...over,
})

const instance = (over: Record<string, unknown> = {}) => ({
  id: 'i-1',
  type: 'm6i.large',
  state: 'running',
  launch: new Date(NOW - 10 * DAY).toISOString(),
  az: `${R}a`,
  life: null,
  name: 'web-1',
  platform: 'Linux/UNIX',
  reason: '',
  vols: [],
  sgs: ['sg-1'],
  vpc: 'vpc-1',
  subnet: 'subnet-1',
  ip: '10.0.0.1',
  pub: null,
  imds: 'required',
  ...over,
})

describe('the board key', () => {
  it('has one spelling per spec, takes only names AWS CLI allows, and never an option', () => {
    const key = awsBoardKey({
      profile: 'acme-prod',
      regions: [R, R, 'nope', 'us-east-1'],
      activity: true,
      slow: false,
    })
    expect(key).toBe(
      '{"profile":"acme-prod","regions":["ap-northeast-1","us-east-1"],"activity":true,"slow":false}',
    )
    expect(parseAwsBoardKey(key)).toMatchObject({ profile: 'acme-prod', regions: [R, 'us-east-1'] })
    for (const bad of [
      '{"profile":"--debug","regions":[],"activity":true,"slow":false}',
      '{"profile":"a b","regions":[],"activity":true,"slow":false}',
      '{"regions":[],"activity":true,"slow":false,"profile":"x"}',
      '{"profile":"x","regions":["us-east-1","us-east-2","us-west-2","eu-west-1","eu-west-2"],"activity":true,"slow":false}',
      '{"profile":"x","regions":["../x"],"activity":true,"slow":false}',
      123,
    ])
      expect(parseAwsBoardKey(bad)).toBeNull()
  })

  it('reads the pane state with defaults, and a drill place only of a known service', () => {
    expect(readAwsPane(undefined)).toMatchObject({
      spec: { profile: 'default', regions: [], activity: true, slow: false },
      tab: 'attention',
      drill: null,
    })
    expect(
      readAwsPane({ drill: { service: 'ec2', filters: { state: 'running', x: 1 }, item: 'i-1' } })
        .drill,
    ).toEqual({
      service: 'ec2',
      filters: { state: 'running' },
      sort: null,
      item: 'i-1',
    })
    expect(readAwsPane({ drill: { service: 'iam' } }).drill).toBeNull()
  })
})

describe('ATTENTION', () => {
  it('finds the alarm, the unattached, the long-stopped and the open SSH, heaviest first', () => {
    const items = attention(
      readings({
        alarms: {
          [R]: {
            metric: [{ name: 'cpu-high', since: NOW - 60_000, namespace: 'AWS/EC2', dim: 'i-1' }],
            composite: [],
          },
        },
        volumes: {
          [R]: [
            {
              id: 'vol-1',
              size: 100,
              type: 'gp3',
              state: 'available',
              iops: null,
              at: null,
              created: null,
              name: null,
            },
          ],
        },
        addresses: {
          [R]: [
            { ip: '203.0.113.1', alloc: null, associated: false, instance: null, domain: 'vpc' },
          ],
        },
        instances: {
          [R]: [
            instance(),
            instance({
              id: 'i-2',
              name: 'old',
              state: 'stopped',
              reason: 'User initiated (2026-09-01 00:00:00 GMT)',
            }),
            instance({
              id: 'i-3',
              name: 'recent',
              state: 'stopped',
              reason: 'User initiated (2026-11-01 00:00:00 GMT)',
            }),
          ],
        },
        openGroups: {
          [R]: [
            { id: 'sg-1', name: 'ssh', ports: ['ssh'] },
            { id: 'sg-unused', name: 'x', ports: ['all'] },
          ],
        },
      }),
    )
    expect(items.map((i) => i.id)).toEqual([
      `alarm:${R}:cpu-high`,
      `security:sg:${R}:sg-1`,
      // COST by the oldest first: the instance stopped in September, then today's two by id.
      `cost:stopped:${R}:i-2`,
      `cost:eip:${R}:203.0.113.1`,
      `cost:volume:${R}:vol-1`,
    ])
  })

  it('weighs a certificate by days left: danger in seven, warn in thirty, nothing after, nothing unused', () => {
    const cert = (days: number, inUse = true) => ({
      arn: `arn:${days}:${inUse}`,
      domain: 'x.example',
      type: 'AMAZON_ISSUED',
      expires: NOW + days * DAY,
      inUse,
      key: 'RSA_2048',
      status: 'ISSUED',
    })
    const items = attention(
      readings({ certificates: { [R]: [cert(6), cert(29), cert(31), cert(3, false)] } }),
    )
    expect(items.map((i) => [i.weight, i.title])).toEqual([
      ['danger', 'x.example expires in 6d'],
      ['warn', 'x.example expires in 29d'],
    ])
  })

  it('reads the root, MFA-less users and old keys from the summary and the report', () => {
    const items = attention(
      readings({
        summary: { mfa: 0, keys: 1, users: 2, roles: 3 },
        credentials: [
          {
            user: '<root_account>',
            password: false,
            mfa: false,
            keys: [],
            passwordUsed: NOW - 3_600_000,
          },
          {
            user: 'ops',
            password: true,
            mfa: false,
            keys: [{ active: true, rotated: NOW - 100 * DAY }],
            passwordUsed: null,
          },
          {
            user: 'ci',
            password: false,
            mfa: false,
            keys: [{ active: true, rotated: NOW - 80 * DAY }],
            passwordUsed: null,
          },
        ],
      }),
    )
    expect(items.map((i) => i.id).sort()).toEqual(
      [
        'security:root-mfa',
        'security:root-keys',
        `security:root-used:${NOW - 3_600_000}`,
        'security:nomfa:ops',
        `expiry:key:ops:${NOW - 100 * DAY}`,
      ].sort(),
    )
  })

  it('reads a stopped date from the transition reason', () => {
    expect(stoppedAt('User initiated (2026-09-01 12:30:00 GMT)')).toBe(Date.UTC(2026, 8, 1, 12, 30))
    expect(stoppedAt('')).toBeNull()
  })
})

describe('ACTIVE', () => {
  it('estimates what runs at list prices, leaves spot and unknown types unpriced, and counts IDLE and WASTE', () => {
    const view = activeCost(
      readings({
        instances: {
          [R]: [
            instance(),
            instance({ id: 'i-2', life: 'spot' }),
            instance({ id: 'i-3', type: 'x9.huge' }),
          ],
        },
        cpu: { [R]: { 'i-1': { avg: [1, 1, 1, 1, 1, 1, 1], max: [5, 5, 5, 5, 5, 5, 5] } } },
        volumes: {
          [R]: [
            {
              id: 'vol-1',
              size: 100,
              type: 'gp3',
              state: 'available',
              iops: null,
              at: null,
              created: null,
              name: null,
            },
          ],
        },
      }),
    )
    const ec2 = view.services.find((s) => s.service === 'ec2')
    expect(ec2).toMatchObject({ count: '2 running', idle: 1 })
    // m6i.large in Tokyo: US East's price times the region's ratio, 730 hours.
    expect(ec2?.monthly).toBeCloseTo(0.096 * 1.27 * 730, 2)
    expect(view.unpriced).toEqual(['x9.huge'])
    expect(view.services.find((s) => s.service === 'ebs')).toMatchObject({ waste: 1 })
    expect(view.quiet).toContain('RDS')
    expect(view.prices.source).toBe('bundled')
  })

  it('calls an instance idle only on a full week under both limits', () => {
    expect(isIdle({ avg: [1, 1, 1, 1, 1, 1, 1], max: [9, 9, 9, 9, 9, 9, 9] })).toBe(true)
    expect(isIdle({ avg: [1, 1, 1, 1, 1, 1, 1], max: [9, 9, 9, 9, 9, 9, 10] })).toBe(false)
    expect(isIdle({ avg: [1, 1, 1], max: [1, 1, 1] })).toBe(false)
    expect(isIdle(undefined)).toBe(false)
  })
})

describe('the billing month', () => {
  const point = (iso: string, usd: number): [number, number] => [Date.parse(iso), usd]

  it('counts the UTC month, lines up last month to the same day, and projects from full days only', () => {
    const now = Date.UTC(2026, 10, 3, 12)
    const month = billingMonth(
      [
        point('2026-10-01T00:00:00Z', 10),
        point('2026-10-02T00:00:00Z', 20),
        point('2026-10-03T00:00:00Z', 30),
        point('2026-11-01T00:00:00Z', 12),
        point('2026-11-02T00:00:00Z', 24),
        point('2026-11-03T00:00:00Z', 30),
      ],
      now,
    )
    expect(month.mtd).toBe(30)
    expect(month.lastSameDay).toBe(30)
    // Two full days (24 by the end of the 2nd) of a thirty-day month.
    expect(month.projected).toBe(360)
  })

  it('does not take last month for this one in the hours before 00:00 UTC on the 1st', () => {
    // 2026-11-01 08:00 in Tokyo is still October in UTC.
    const now = Date.UTC(2026, 9, 31, 23)
    expect(billingMonth([point('2026-10-31T00:00:00Z', 800)], now).mtd).toBe(800)
    const november = billingMonth([point('2026-10-31T00:00:00Z', 800)], Date.UTC(2026, 10, 1, 1))
    expect(november.mtd).toBe(0)
  })

  it('says each quota step once, the highest only when several pass at once', () => {
    expect(quotaCrossed(850, 1000, '80-100', [])).toBe(0.8)
    expect(quotaCrossed(850, 1000, '80-100', [0.8])).toBeNull()
    expect(quotaCrossed(1200, 1000, '80-100', [])).toBe(1)
    expect(quotaCrossed(850, 1000, '100', [])).toBeNull()
    expect(quotaCrossed(850, 0, '80-100', [])).toBeNull()
  })
})

describe('CloudTrail', () => {
  const row = (over: Record<string, unknown> = {}, inner: Record<string, unknown> = {}) => ({
    id: 'e1',
    t: '2026-11-08T11:00:00+09:00',
    n: 'RunInstances',
    s: 'ec2.amazonaws.com',
    u: 'aki',
    e: JSON.stringify({
      userIdentity: { type: 'IAMUser' },
      awsRegion: R,
      sourceIPAddress: '198.51.100.7',
      ...inner,
    }),
    ...over,
  })

  it("keeps the fixed fields only, drops AWS's own automation, and marks root, a failed sign-in and no MFA", () => {
    const events = parseTrail(
      JSON.stringify([
        row(),
        row({ id: 'e2' }, { userIdentity: { type: 'AWSService' } }),
        row(
          { id: 'e3', n: 'ConsoleLogin' },
          { responseElements: { ConsoleLogin: 'Failure' }, additionalEventData: { MFAUsed: 'No' } },
        ),
        row(
          { id: 'e4', n: 'ConsoleLogin' },
          { responseElements: { ConsoleLogin: 'Success' }, additionalEventData: { MFAUsed: 'No' } },
        ),
        row({ id: 'e5' }, { userIdentity: { type: 'Root' } }),
      ]),
      R,
    )
    expect(events.map((e) => [e.id, e.mark])).toEqual([
      ['e1', null],
      ['e3', 'failed'],
      ['e4', 'nomfa'],
      ['e5', 'root'],
    ])
    expect(Object.keys(events[0] ?? {}).sort()).toEqual(
      ['at', 'error', 'id', 'login', 'mark', 'name', 'region', 'source', 'who', 'whoType'].sort(),
    )
    expect(JSON.stringify(events)).not.toContain('198.51.100.7')
  })

  it('puts events in 96 quarters, the quarter going on last', () => {
    const now = NOW + 5 * 60_000
    const bins = pulseBins(
      parseTrail(JSON.stringify([row({ t: new Date(now - 60_000).toISOString() })]), R),
      now,
    )
    expect(bins).toHaveLength(96)
    expect(bins.at(-1)?.writes).toBe(1)
  })
})

describe('the drill-down', () => {
  const rows: DrillRow[] = [
    {
      id: 'a',
      region: R,
      name: 'a',
      weight: null,
      cells: { state: 'running', type: 't3', monthly: 10 },
    },
    {
      id: 'b',
      region: R,
      name: 'b',
      weight: null,
      cells: { state: 'running', type: 'm6i', monthly: 90 },
    },
    {
      id: 'c',
      region: R,
      name: 'c',
      weight: null,
      cells: { state: 'stopped', type: 't3', monthly: null },
    },
  ]

  it("cross-filters: a group is counted by the other groups' filters only", () => {
    const def = {
      ...DRILL.ec2,
      facets: [
        { key: 'state', label: 'STATE' },
        { key: 'type', label: 'TYPE' },
      ],
    }
    const groups = facets(rows, def, { state: 'running' })
    expect(groups[0]?.bars.map((b) => [b.value, b.count, b.on])).toEqual([
      ['running', 2, true],
      ['stopped', 1, false],
    ])
    expect(groups[1]?.bars.map((b) => [b.value, b.count])).toEqual([
      ['m6i', 1],
      ['t3', 1],
    ])
    expect(filterRows(rows, { state: 'running', type: 't3' }).map((r) => r.id)).toEqual(['a'])
  })

  it('sorts numbers biggest first when down, and puts the empty last', () => {
    expect(sortRows(rows, 'monthly', true).map((r) => r.id)).toEqual(['b', 'a', 'c'])
    expect(sortRows(rows, 'monthly', false).map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('console URLs', () => {
  it("builds each service's page on the console's own hosts, and nothing from a bad id", () => {
    expect(consoleUrl('ec2', R, 'i-0abc')).toBe(
      `https://${R}.console.aws.amazon.com/ec2/home?region=${R}#InstanceDetails:instanceId=i-0abc`,
    )
    expect(consoleUrl('s3', R, 'my-bucket')).toBe(
      `https://s3.console.aws.amazon.com/s3/buckets/my-bucket?region=${R}`,
    )
    expect(
      consoleUrl('acm', R, 'arn:aws:acm:x:1:certificate/0b3f9f0c-1d2e-4f5a-8b7c-9d0e1f2a3b4c'),
    ).toContain('#/certificates/0b3f9f0c-1d2e-4f5a-8b7c-9d0e1f2a3b4c')
    expect(consoleUrl('ec2', 'nowhere', 'i-0')).toBeNull()
    expect(consoleUrl('ec2', R, 'i-0 <script>')).toBeNull()
    for (const service of Object.keys(DRILL) as (keyof typeof DRILL)[]) {
      const url = consoleUrl(
        service,
        R,
        service === 'acm' ? 'arn:x:certificate/0b3f9f0c-1d2e-4f5a-8b7c-9d0e1f2a3b4c' : 'x-1',
      )
      expect(url !== null && isConsoleUrl(url)).toBe(true)
    }
    expect(isConsoleUrl('https://console.aws.amazon.com.evil.example/')).toBe(false)
    expect(isConsoleUrl('http://console.aws.amazon.com/')).toBe(false)
  })
})

describe('the probes', () => {
  it('reads which ports a world-open group reaches', () => {
    expect(openPorts([{ p: 'tcp', f: 22, t: 22 }])).toEqual(['ssh'])
    expect(openPorts([{ p: '-1' }])).toEqual(['all'])
    expect(openPorts([{ p: 'tcp', f: 0, t: 65535 }])).toEqual(['all', 'rdp', 'ssh'])
    expect(openPorts([{ p: 'tcp', f: 443, t: 443 }])).toEqual([])
  })

  it('asks Cost Explorer only when on, under its cap, and when its own period has passed', () => {
    const on = {
      state: 'on' as const,
      every: 'day' as const,
      cap: 100,
      used: 0,
      lastReadAt: null,
      failedAt: null,
    }
    expect(costExplorerDue(null, true, NOW)).toBe(false)
    expect(costExplorerDue({ ...on, state: 'off' }, true, NOW)).toBe(false)
    expect(costExplorerDue(on, false, NOW)).toBe(true)
    expect(costExplorerDue({ ...on, lastReadAt: NOW - 3_600_000 }, false, NOW)).toBe(false)
    expect(costExplorerDue({ ...on, used: 99 }, true, NOW)).toBe(false)
    expect(costExplorerDue({ ...on, every: 'manual' }, false, NOW)).toBe(false)
    expect(costExplorerDue({ ...on, every: 'manual' }, true, NOW)).toBe(true)
    // REFRESH pays only in MANUAL: ONCE A DAY read an hour ago stays read.
    expect(costExplorerDue({ ...on, lastReadAt: NOW - 3_600_000 }, true, NOW)).toBe(false)
    // A failed reading is tried again an hour on, not at once.
    expect(costExplorerDue({ ...on, failedAt: NOW - 60_000 }, false, NOW)).toBe(false)
    expect(costExplorerDue({ ...on, failedAt: NOW - 3_600_000 }, false, NOW)).toBe(true)
  })

  it('marks only Cost Explorer as paid, with its setting', () => {
    const paid = AWS_PROBES.filter((p) => typeof p.cost !== 'string')
    expect(paid.map((p) => p.id)).toEqual(['cost-explorer'])
    expect(paid[0]?.cost).toEqual({ setting: 'aws.costExplorer', perRequestUsd: 0.01 })
  })
})

describe('the billing store', () => {
  it('starts the paid count and the said steps again in a new UTC month', () => {
    const account = {
      ...freshAccount(NOW),
      ce: { ...freshAccount(NOW).ce, used: 40 },
      quota: { usd: 100, steps: '100' as const, month: '2026-11', said: [1] },
    }
    const next = rolled(account, Date.UTC(2026, 11, 1, 0, 1))
    expect(next.ce.used).toBe(0)
    expect(next.quota.said).toEqual([])
    expect(rolled(account, NOW)).toEqual(account)
  })

  it('asks again after LATER only once elecdex has started since, and a day on', () => {
    const later = {
      ...freshAccount(NOW),
      ce: { ...freshAccount(NOW).ce, state: 'later' as const, answeredAt: NOW },
    }
    expect(asksNow(freshAccount(NOW), 0, NOW)).toBe(true)
    expect(asksNow(later, NOW - 1, NOW + 2 * DAY)).toBe(false)
    expect(asksNow(later, NOW + DAY, NOW + 2 * DAY)).toBe(true)
    expect(asksNow({ ...later, ce: { ...later.ce, state: 'off' } }, NOW + DAY, NOW + 2 * DAY)).toBe(
      false,
    )
  })
})

describe('the changes line', () => {
  it('says what came and went, and nothing for a service first read later', () => {
    expect(
      changesSince(
        { ec2: { a: 'web-1' } },
        { ec2: { a: 'web-1', b: 'web-2' }, nat: { n: 'nat' } },
        NOW,
      ),
    ).toEqual({
      since: NOW,
      parts: [{ service: 'ec2', added: ['web-2'], removed: [] }],
    })
  })
})

describe('the credential report', () => {
  it('reads the columns it needs, by name', () => {
    const rows = parseCredentialReport(
      'user,arn,password_enabled,password_last_used,mfa_active,access_key_1_active,access_key_1_last_rotated,access_key_2_active,access_key_2_last_rotated\nops,x,true,N/A,false,true,2026-01-01T00:00:00+00:00,false,N/A',
    )
    expect(rows).toEqual([
      {
        user: 'ops',
        password: true,
        mfa: false,
        keys: [
          { active: true, rotated: Date.parse('2026-01-01T00:00:00Z') },
          { active: false, rotated: null },
        ],
        passwordUsed: null,
      },
    ])
  })
})

/** The service on the stand-in AWS CLI, its clock still. */
function service(mode = 'demo') {
  const calls: CliCall[] = []
  const boards: AwsBoard[] = []
  const alerts: CloudAlert[] = []
  let file: BillingFile = {}
  let current = mode
  let clock = Date.now()
  const stubs = new Map<string, ReturnType<typeof stubAws>>()
  const stub = (call: CliCall) => {
    const run = stubs.get(current) ?? stubAws(current)
    stubs.set(current, run)
    return run(call)
  }
  const aws = new AwsService({
    cli: (call) => {
      calls.push(call)
      return stub(call)
    },
    limit: concurrencyLimit(2),
    billing: billingStore({ load: () => file, save: (next) => (file = next) }, () => Date.now()),
    now: () => clock,
    setTimer: () => 0,
    clearTimer: () => {},
    publish: (board) => boards.push(board),
    incidents: () => [],
    alert: (alert) => alerts.push(alert),
    cliVersion: () => '2.39.6',
    executable: () => 'stub',
    startedAt: Date.now(),
  })
  const flush = async () => {
    for (let i = 0; i < 3000; i++) await Promise.resolve()
  }
  return {
    aws,
    calls,
    boards,
    alerts,
    flush,
    last: () => boards.at(-1),
    file: () => file,
    setMode: (next: string) => {
      current = next
    },
    /** Past the 30 s between two REFRESH presses. */
    later: (ms: number) => {
      clock += ms
    },
  }
}

const KEY = awsBoardKey({
  profile: 'default',
  regions: [R, 'us-east-1'],
  activity: true,
  slow: false,
})

/** The verbs AWS STATUS may run (aws.md §3); everything else - S3's own API, logs, secrets, writes - is out. */
const READS = new Set([
  'configure get',
  'sts get-caller-identity',
  'iam list-account-aliases',
  'iam get-account-summary',
  'iam generate-credential-report',
  'iam get-credential-report',
  'cloudwatch list-metrics',
  'cloudwatch get-metric-statistics',
  'cloudwatch describe-alarms',
  'budgets describe-budgets',
  'freetier get-account-plan-state',
  'freetier get-free-tier-usage',
  'route53domains list-domains',
  'savingsplans describe-savings-plans',
  'ec2 describe-instance-status',
  'ec2 describe-instances',
  'ec2 describe-volumes',
  'ec2 describe-addresses',
  'ec2 describe-nat-gateways',
  'ec2 describe-security-groups',
  'ec2 describe-reserved-instances',
  'elbv2 describe-load-balancers',
  'cloudformation list-stacks',
  'cloudtrail lookup-events',
  'rds describe-db-instances',
  'lambda list-functions',
  'eks list-clusters',
  'eks describe-cluster',
  'eks describe-cluster-versions',
  'acm list-certificates',
  'backup list-backup-jobs',
  'guardduty list-detectors',
  'guardduty get-findings-statistics',
])

describe('AwsService on the stand-in AWS CLI', () => {
  it('reads a whole board when shown, every call a read of the table with the profile and a region', async () => {
    const s = service()
    expect(s.aws.watch(KEY)?.link).toBe('linking')
    await s.flush()
    const board = s.last()
    expect(board).toMatchObject({
      link: 'linked',
      account: { id: '482913507216', alias: 'acme-prod' },
    })
    expect(board?.alarms).toBe(1)
    expect(board?.active.services[0]?.service).toBe('ec2')
    expect(board?.cost.services.length).toBeGreaterThan(0)
    expect(board?.cost.ce.ask).toBe(true)
    for (const call of s.calls) {
      const verb = call.argv.slice(0, 2).join(' ')
      expect(READS.has(verb), verb).toBe(true)
      if (verb === 'configure get') continue
      expect(call.argv).toContain('--profile')
      expect(call.argv[call.argv.indexOf('--region') + 1]).toMatch(/^[a-z]{2}-[a-z]+-\d$/)
    }
    // Nothing paid before the user says so.
    expect(s.calls.some((c) => c.argv[0] === 'ce')).toBe(false)
  })

  it('calls Cost Explorer only after TURN ON, counts its requests, and asks no more', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    expect(s.aws.answerCostExplorer(KEY, { state: 'on', every: 'day', cap: 100 })).toBe(true)
    await s.flush()
    expect(s.calls.filter((c) => c.argv[0] === 'ce').map((c) => c.argv[1])).toEqual([
      'get-cost-and-usage',
      'get-cost-forecast',
    ])
    expect(s.last()?.cost.ce).toMatchObject({ state: 'on', usedThisMonth: 2, ask: false })
    expect(s.last()?.cost.ce.services?.length).toBeGreaterThan(0)
    expect(s.aws.answerCostExplorer(KEY, { state: 'on', cap: 123 })).toBe(false)
  })

  it('reads Cost Explorer once for two panes on one account', async () => {
    const s = service()
    const other = awsBoardKey({ profile: 'default', regions: [R], activity: false, slow: true })
    s.aws.watch(KEY)
    s.aws.watch(other)
    await s.flush()
    s.aws.answerCostExplorer(KEY, { state: 'on', every: 'day', cap: 100 })
    await s.flush()
    expect(s.calls.filter((c) => c.argv[1] === 'get-cost-and-usage')).toHaveLength(1)
    expect(s.aws.refresh(KEY)).toBe(30_000)
    await s.flush()
    // ONCE A DAY: a REFRESH does not pay again.
    expect(s.calls.filter((c) => c.argv[1] === 'get-cost-and-usage')).toHaveLength(1)
  })

  it("keeps Cost Explorer's last answer when a reading fails, and counts the request", async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    s.aws.answerCostExplorer(KEY, { state: 'on', every: 'manual', cap: 100 })
    s.aws.refresh(KEY)
    await s.flush()
    const services = s.last()?.cost.ce.services
    expect(services?.length).toBeGreaterThan(0)
    s.setMode('offline')
    s.later(31_000)
    expect(s.aws.refresh(KEY)).toBe(30_000)
    await s.flush()
    expect(s.calls.filter((c) => c.argv[1] === 'get-cost-and-usage')).toHaveLength(2)
    expect(s.last()?.cost.ce).toMatchObject({ services, usedThisMonth: 3 })
  })

  it('toasts a quota step once', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    expect(s.aws.setQuota(KEY, { usd: 50, steps: '80-100' })).toBe(true)
    await s.flush()
    expect(s.alerts.map((a) => a.title)).toEqual(['Cost quota · 100%'])
    expect(s.alerts[0]?.maskedBody).not.toContain('acme')
    s.aws.refresh(KEY)
    await s.flush()
    expect(s.alerts).toHaveLength(1)
    expect(s.aws.setQuota(KEY, { usd: -1, steps: '100' })).toBe(false)
  })

  it('opens only what it read, on the console', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    expect(s.aws.urlOf(KEY, `item:ec2:${R}:i-0a1b2c3d4e5f60001`)).toMatch(
      /^https:\/\/ap-northeast-1\.console\.aws\.amazon\.com\//,
    )
    expect(s.aws.urlOf(KEY, `item:ec2:${R}:i-nothere`)).toBeNull()
    expect(s.aws.urlOf(KEY, 'account:billing')).toBe('https://console.aws.amazon.com/billing/home')
    expect(s.aws.urlOf(KEY, 'https://example.com')).toBeNull()
    expect(s.aws.drill(KEY, 'iam')).toBeNull()
    expect(s.aws.drill(KEY, 'ec2')?.length).toBe(6)
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003')?.name).toBe('dev-box')
  })

  it('stops at the sign-in with the command to run', async () => {
    const s = service('signedout')
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()).toMatchObject({ link: 'signed-out', signIn: 'aws login --profile=default' })
  })

  it('says PARTIAL and the operation, by name only, when a read is refused', async () => {
    const s = service('partial')
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.link).toBe('partial')
    // A tolerated read refused (GuardDuty) is PARTIAL too; the Free Tier's refusal says nothing to fix.
    expect(s.last()?.denied).toEqual(['budgets:ViewBudget', 'guardduty:ListDetectors'])
    expect(JSON.stringify(s.last())).not.toContain('assumed-role/ReadOnly/aki is not')
  })

  it('says a profile signs in through credential_process, never what it runs', async () => {
    const s = service('process')
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.credentialProcess).toBe(true)
    expect(JSON.stringify(s.last())).not.toContain('sign-in.exe')
    const plain = service()
    plain.aws.watch(KEY)
    await plain.flush()
    expect(plain.last()?.credentialProcess).toBe(false)
  })

  it('says the billing metric is off, and the quota cannot be checked', async () => {
    const s = service('nobilling')
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.cost).toMatchObject({ billing: false, mtd: null })
    expect(s.last()?.cost.quota.unavailable).toMatch(/billing alerts/)
  })
})
