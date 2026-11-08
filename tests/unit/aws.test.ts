import { describe, expect, it } from 'vitest'
import {
  asksNow,
  type BillingFile,
  billingStore,
  freshAccount,
  rolled,
} from '../../src/main/aws/billing-store'
import { memoryInventory } from '../../src/main/aws/inventory-store'
import { AWS_PROBES, costExplorerDue, cpuByMetricData, openPorts } from '../../src/main/aws/probes'
import { ResourceAccounts } from '../../src/main/aws/resource-accounts'
import {
  batches,
  GMD_MAX_CHARS,
  GMD_MAX_QUERIES,
  sweepProbe,
} from '../../src/main/aws/resource-probes'
import { AwsService, BOARD_PROBES, type CloudAlert } from '../../src/main/aws/service'
import { BULK_LANES, CLI_LANES, concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubAws } from '../../src/main/cloud-cli/stub-aws'
import { activeCost } from '../../src/shared/aws/active'
import { attention } from '../../src/shared/aws/attention'
import { billingMonth, quotaCrossed } from '../../src/shared/aws/billing'
import {
  awsBoardKey,
  itemOf,
  listItem,
  parseAwsBoardKey,
  readAwsPane,
} from '../../src/shared/aws/board'
import { changesSince } from '../../src/shared/aws/changes'
import { consoleUrl, isConsoleUrl, permissionsUrl } from '../../src/shared/aws/console-url'
import { DRILL, facets, filterRows, itemColumns, sortRows } from '../../src/shared/aws/drill'
import { stoppedAt } from '../../src/shared/aws/facts'
import { isIdle, seriesKey } from '../../src/shared/aws/forgotten'
import { GROUPS } from '../../src/shared/aws/inventory'
import { parseCredentialReport, parseWith } from '../../src/shared/aws/parse'
import {
  BucketListSchema,
  DistributionsSchema,
  LogGroupsSchema,
  lastPart,
  modelIdOf,
  type Series,
} from '../../src/shared/aws/parse-resources'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import { parseTrail, pulseBins, trailName } from '../../src/shared/aws/trail'
import type { AwsBoard, AwsService as AwsKind, DrillRow } from '../../src/shared/aws/types'
import type { CliCall, CliResult } from '../../src/shared/cloud-cli/probe'

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
    // RESOURCES is the first tab (aws.md §14.0): no tab in the state opens it; the others stay.
    expect(readAwsPane(undefined)).toMatchObject({
      spec: { profile: 'default', regions: [], activity: true, slow: false },
      tab: 'resources',
      drill: null,
    })
    for (const tab of ['attention', 'active', 'cost', 'activity', 'account'])
      expect(readAwsPane({ tab }).tab).toBe(tab)
    expect(readAwsPane({ tab: 'billing' }).tab).toBe('resources')
    expect(readAwsPane({ from: 'resources' }).from).toBe('resources')
    expect(readAwsPane({ from: 'elsewhere' }).from).toBe('active')
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
    // RESOURCES' lists across services are places too; their items carry the service.
    const list = readAwsPane({
      drill: { service: 'forgotten', filters: {}, item: listItem('bedrock', 'pt:q7x') },
    }).drill
    expect(list).toEqual({ service: 'forgotten', filters: {}, sort: null, item: 'bedrock:pt:q7x' })
    expect(list && itemOf(list)).toEqual({ service: 'bedrock', id: 'pt:q7x' })
    expect(itemOf({ service: 'new', filters: {}, sort: null, item: 'iam:x' })).toBeNull()
    expect(itemOf({ service: 'ec2', filters: {}, sort: null, item: 'i-1' })).toEqual({
      service: 'ec2',
      id: 'i-1',
    })
    // `direct` (Back straight to RESOURCES) is kept only with an item.
    expect(readAwsPane({ drill: { service: 'ec2', item: 'i-1', direct: true } }).drill).toEqual({
      service: 'ec2',
      filters: {},
      sort: null,
      item: 'i-1',
      direct: true,
    })
    expect(readAwsPane({ drill: { service: 'ec2', direct: true } }).drill).not.toHaveProperty(
      'direct',
    )
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
          [R]: [{ ip: '203.0.113.1', associated: false, instance: null }],
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
    // The forgotten ones are one line pointing at RESOURCES (user decision 2026-11-08): the
    // volume and the address bill; the instance stopped in September has no volume to bill.
    expect(items.map((i) => i.id)).toEqual([
      `alarm:${R}:cpu-high`,
      `security:sg:${R}:sg-1`,
      'cost:forgotten',
    ])
    expect(items[2]?.title).toBe('2 look forgotten · ≈ $14.80/mo › RESOURCES')
    expect(items[2]?.weight).toBe('warn')
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

  it('says a budget near its limit or forecast over it in dollars, naming the budget', () => {
    // The "spent" title once lost its dollar signs to an edit, the forecast one keeping them.
    const items = attention(
      readings({
        budgets: [
          { name: 'monthly', limit: 1000, actual: 824, forecast: 900 },
          { name: 'team', limit: 500, actual: 100, forecast: 620 },
        ],
      }),
    )
    const titles = items.filter((i) => i.tag === 'BUDGET').map((i) => i.title)
    expect(titles).toEqual(
      expect.arrayContaining(['monthly: $824 of $1000 spent', 'team: forecast $620 over $500']),
    )
    expect(items.find((i) => i.title.startsWith('monthly'))?.names).toEqual(['monthly'])
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
    // Each list is sorted at first by one of its own columns, so the header shows the order.
    for (const [service, def] of Object.entries(DRILL))
      expect(
        def.columns.map((c) => c.key),
        service,
      ).toContain(def.sort)
    // A classic load balancer goes by its name, a v2 one by its ARN.
    expect(consoleUrl('elb', R, 'old-clb')).toBe(
      `https://${R}.console.aws.amazon.com/ec2/home?region=${R}#LoadBalancers:search=old-clb`,
    )
    expect(consoleUrl('elb', R, 'arn:aws:elasticloadbalancing:x:1:loadbalancer/app/w/1')).toContain(
      '#LoadBalancer:loadBalancerArn=arn',
    )
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

  it('never makes a `first` probe wait for one in the later queue', () => {
    // The alarms, the impaired check and the trail read after setup: once a later probe, it
    // waited behind another pane's first cycle of RESOURCES.
    for (const probe of BOARD_PROBES.filter((p) => p.first === true && p.after !== undefined)) {
      const before = BOARD_PROBES.find((p) => p.id === probe.after)
      expect(before?.first, `${probe.id} after ${probe.after}`).toBe(true)
    }
  })

  it('marks only Cost Explorer and GetMetricData as paid, with their settings, and ListBuckets as metered-tiny', () => {
    const priced = BOARD_PROBES.filter((p) => typeof p.cost !== 'string')
    expect(priced.map((p) => [p.id, p.cost])).toEqual([
      ['cost-explorer', { setting: 'aws.costExplorer', perRequestUsd: 0.01 }],
      ['res-buckets', { metered: 'tiny', monthlyCap: 31, decided: '2026-11-08' }],
      ['res-gmd', { setting: 'aws.getMetricData', perMetricUsd: 0.00001 }],
    ])
    expect(AWS_PROBES.some((p) => p.id.startsWith('res-'))).toBe(false)
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

/**
 * The service on the stand-in AWS CLI, its clock still. `hold` keeps the calls it picks waiting
 * for their answer until `release`, as a slow CLI would.
 */
function service(
  mode = 'demo',
  initial: BillingFile = {},
  hold?: (call: CliCall) => boolean,
  answer?: (call: CliCall) => CliResult | null,
) {
  const calls: CliCall[] = []
  const boards: AwsBoard[] = []
  const alerts: CloudAlert[] = []
  let file: BillingFile = initial
  let current = mode
  let clock = Date.now()
  const held: (() => void)[] = []
  const stubs = new Map<string, ReturnType<typeof stubAws>>()
  const stub = (call: CliCall) => {
    const own = answer?.(call)
    if (own !== undefined && own !== null) return Promise.resolve(own)
    const run = stubs.get(current) ?? stubAws(current)
    stubs.set(current, run)
    return run(call)
  }
  const aws = new AwsService({
    cli: (call) => {
      calls.push(call)
      if (hold?.(call) !== true) return stub(call)
      return new Promise((resolve) => held.push(() => resolve(stub(call))))
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
  // RESOURCES' first reading goes a few bulk probes at a time: many turns of the microtask queue.
  const flush = async () => {
    for (let i = 0; i < 20_000; i++) await Promise.resolve()
  }
  return {
    aws,
    calls,
    boards,
    alerts,
    flush,
    last: () => boards.at(-1),
    file: () => file,
    /** How many held calls wait; releasing answers them all. */
    held: () => held.length,
    release: () => {
      for (const answer of held.splice(0)) answer()
    },
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
  // RESOURCES (aws.md §14.4, §14.4a, §14.4b): lists and describes, list-metrics and GetMetricData.
  'apigateway get-rest-apis',
  'apigatewayv2 get-apis',
  'bedrock list-custom-models',
  'bedrock list-foundation-models',
  'bedrock list-guardrails',
  'bedrock list-imported-models',
  'bedrock list-inference-profiles',
  'bedrock list-provisioned-model-throughputs',
  'bedrock-agent get-knowledge-base',
  'bedrock-agent list-agents',
  'bedrock-agent list-knowledge-bases',
  'bedrock-agentcore-control list-agent-runtimes',
  'cloudfront list-distributions',
  'cloudwatch get-metric-data',
  'dynamodb describe-table',
  'dynamodb list-tables',
  'ec2 describe-images',
  'ec2 describe-regions',
  'ec2 describe-snapshots',
  'ec2 describe-transit-gateway-attachments',
  'ec2 describe-vpc-endpoints',
  'ec2 describe-vpcs',
  'ec2 describe-vpn-connections',
  'ecr describe-images',
  'ecr describe-repositories',
  'ecs describe-clusters',
  'ecs describe-services',
  'ecs list-clusters',
  'ecs list-services',
  'eks list-fargate-profiles',
  'eks list-nodegroups',
  'elasticache describe-cache-clusters',
  'elasticache describe-serverless-caches',
  'elb describe-load-balancers',
  'elbv2 describe-target-groups',
  'elbv2 describe-target-health',
  'kinesis describe-stream-summary',
  'kinesis list-streams',
  'kms describe-key',
  'kms list-aliases',
  'kms list-keys',
  'logs describe-log-groups',
  'opensearch describe-domains',
  'opensearch list-domain-names',
  'opensearchserverless batch-get-collection',
  'opensearchserverless list-collections',
  'redshift describe-clusters',
  'redshift-serverless list-workgroups',
  'route53 list-hosted-zones',
  's3api list-buckets',
  'sagemaker list-apps',
  'sagemaker list-endpoints',
  'sagemaker list-notebook-instances',
  'sns list-subscriptions',
  'sns list-topics',
  'sqs get-queue-attributes',
  'sqs list-queues',
  'transfer list-servers',
])

/** What stays forbidden (aws.md §3.4): every other S3 and Logs call, secrets, Health, Support, and CloudWatch's widget and rule reports. */
const FORBIDDEN = [
  /^s3 /,
  /^s3api (?!list-buckets$)/,
  /^logs (?!describe-log-groups$)/,
  /^secretsmanager /,
  /^health /,
  /^support /,
  /^cloudwatch get-metric-widget-image$/,
  /^cloudwatch get-insight-rule-report$/,
  /^(\S+) (create|delete|put|update|start|stop|modify|tag|untag)-/,
]

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
    // The on-demand reads too: HISTORY and the sweep's "check other regions now".
    const one = s.aws.drill(KEY, 'ec2')?.[0]
    await s.aws.history(KEY, 'ec2', one?.id, one?.region)
    s.aws.sweep(KEY, 'now')
    await s.flush()
    expect(verbs(s.calls, 'cloudtrail lookup-events').length).toBeGreaterThan(0)
    for (const call of s.calls) {
      const verb = call.argv.slice(0, 2).join(' ')
      expect(READS.has(verb), verb).toBe(true)
      for (const forbidden of FORBIDDEN) expect(forbidden.test(verb), verb).toBe(false)
      if (verb === 'configure get') continue
      expect(call.argv).toContain('--profile')
      expect(call.argv[call.argv.indexOf('--region') + 1]).toMatch(/^[a-z]{2}-[a-z]+-\d$/)
    }
    // Nothing paid before the user says so.
    expect(s.calls.some((c) => c.argv[0] === 'ce')).toBe(false)
  })

  it("leaves an instance's CPU to GetMetricData only when it read the NetworkOut too", () => {
    // Low use is judged on the pair; with the CPU alone (the cap stopped the batches between the
    // two) forgotten.ts falls back to the CPU probe's week, which must then be read.
    const key = (metric: string) =>
      seriesKey({ ns: 'AWS/EC2', metric, dim: 'InstanceId', value: 'i-1' })
    const gmd: Series = { v: [1, 2], d: 2, via: 'gmd' }
    const ctx = (usage: Record<string, Series>) => ({
      readings: () => readings({ res: { ...readings().res, usage: { [R]: usage } } }),
    })
    const one = { id: 'i-1', region: R }
    expect(cpuByMetricData(ctx({ [key('CPUUtilization')]: gmd }), one)).toBe(false)
    expect(
      cpuByMetricData(ctx({ [key('CPUUtilization')]: gmd, [key('NetworkOut')]: gmd }), one),
    ).toBe(true)
    expect(
      cpuByMetricData(
        ctx({
          [key('CPUUtilization')]: { ...gmd, via: 'stat' },
          [key('NetworkOut')]: gmd,
        }),
        one,
      ),
    ).toBe(false)
  })

  it("masks the columns that name another resource: a service's cluster, a VPC, a gateway, a volume", () => {
    // Under MASK these once showed while the row's own name was hidden.
    const masked = (service: keyof typeof DRILL, key: string) =>
      DRILL[service].columns.find((c) => c.key === key)?.masked === true
    expect(masked('ecs', 'cluster')).toBe(true)
    expect(masked('vpce', 'vpc')).toBe(true)
    expect(masked('tgw', 'tgw')).toBe(true)
    expect(masked('snapshots', 'volume')).toBe(true)
  })

  it("reads a resource's history in its own region, where two regions share its name", async () => {
    // The stand-in's `web` stack, in us-east-1 too: one name, two regions.
    const s = service('demo', {}, undefined, (call) =>
      call.argv[1] === 'list-stacks' && call.argv.includes('us-east-1')
        ? {
            ok: true,
            code: 0,
            stdout: JSON.stringify([
              { n: 'web', s: 'CREATE_COMPLETE', t: new Date().toISOString(), d: 'NOT_CHECKED' },
            ]),
            stderr: '',
            missing: false,
            timedOut: false,
            tooLarge: false,
          }
        : null,
    )
    s.aws.watch(KEY)
    await s.flush()
    expect(s.aws.drill(KEY, 'stacks')?.filter((row) => row.id === 'web')).toHaveLength(2)
    const regionOf = () => {
      const asked = verbs(s.calls, 'cloudtrail lookup-events').at(-1)?.argv ?? []
      return asked[asked.indexOf('--region') + 1]
    }
    await s.aws.history(KEY, 'stacks', 'web', 'us-east-1')
    expect(regionOf()).toBe('us-east-1')
    await s.aws.history(KEY, 'stacks', 'web', R)
    expect(regionOf()).toBe(R)
  })

  it('gives every service an item step whose fields are named once each', () => {
    // CloudFront's list has an id column, and its item once had "id" twice: the item's keyed
    // list threw, and every distribution opened into a pane fault.
    for (const [service, def] of Object.entries(DRILL)) {
      const labels = ['id', 'region', ...itemColumns(def).map((c) => c.label)]
      expect(new Set(labels).size, service).toBe(labels.length)
    }
  })

  it('opens a CloudFront distribution as its item, with its id once', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const rows = await s.aws.drill(KEY, 'cloudfront')
    const first = rows?.[0]
    expect(first).toBeDefined()
    const item = await s.aws.item(KEY, 'cloudfront', first?.id ?? '')
    expect(item?.fields.filter((f) => f.label === 'id')).toHaveLength(1)
  })

  it('asks nothing twice and nothing it does not use', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    // The billing metric's list once: billing-services takes the billing reading's.
    const billing = s.calls.filter(
      (c) => c.argv[1] === 'list-metrics' && c.argv.includes('AWS/Billing'),
    )
    expect(billing).toHaveLength(1)
    expect(s.last()?.cost.services.length).toBeGreaterThan(0)
    // A target group behind no load balancer: its health judges nothing.
    const health = verbs(s.calls, 'elbv2 describe-target-health')
    expect(health.map((c) => c.argv.find((a) => a.startsWith('--target-group-arn=')))).toEqual([
      expect.stringContaining('targetgroup/web-tg/'),
    ])
    // Deleted NAT gateways are not asked for.
    for (const call of verbs(s.calls, 'ec2 describe-nat-gateways'))
      expect(call.argv[call.argv.indexOf('--filter') + 1]).toMatch(/^Name=state,Values=/)
    // A day on, GetMetricData's fourteen days of CPU stand for the cpu probe's seven.
    const cpu = () =>
      verbs(s.calls, 'cloudwatch get-metric-statistics').filter((c) => c.argv.includes('AWS/EC2'))
        .length
    const before = cpu()
    s.later(25 * 3_600_000)
    s.aws.refresh(KEY)
    await s.flush()
    expect(cpu()).toBe(before)
    expect(s.aws.drill(KEY, 'ec2')?.find((r) => r.id === 'i-0a1b2c3d4e5f60003')?.cells.cpu).toBe(
      0.4,
    )
  })

  it('sends what it took from an answer so that it can only be read as a value', async () => {
    // GetMetricData off: the statistics run too, with the dimensions list-metrics found.
    const s = service(
      'demo',
      withBilling((a) => ({ ...a, gmd: { ...a.gmd, on: false } })),
    )
    s.aws.watch(KEY)
    await s.flush()
    const dimensioned = s.calls.filter((c) => c.argv.includes('--dimensions'))
    expect(dimensioned.length).toBeGreaterThan(10)
    for (const call of dimensioned) {
      // A JSON list: an API's name with a comma or an equals sign in it is one value.
      const list = JSON.parse(call.argv[call.argv.indexOf('--dimensions') + 1] ?? '') as unknown
      expect(Array.isArray(list), call.argv.join(' ')).toBe(true)
      expect(
        call.argv.some((a) => a.startsWith('Name=')),
        call.argv.join(' '),
      ).toBe(false)
    }
    // A single name from an answer goes as --option=value: one beginning with "-" is no option.
    for (const call of s.calls)
      for (const option of ['--name', '--detector-id', '--account-id'])
        expect(call.argv, call.argv.join(' ')).not.toContain(option)
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

  it("opens the signed-in identity's permissions page, whoever it is", () => {
    const pages = [
      [
        'arn:aws:iam::123456789012:user/shinsaku',
        'https://console.aws.amazon.com/iam/home#/users/details/shinsaku?section=permissions',
      ],
      [
        'arn:aws:iam::123456789012:user/team/ops/aki',
        'https://console.aws.amazon.com/iam/home#/users/details/aki?section=permissions',
      ],
      [
        'arn:aws:sts::123456789012:assumed-role/ReadOnly/aki',
        'https://console.aws.amazon.com/iam/home#/roles/details/ReadOnly?section=permissions',
      ],
      // Identity Center's roles: their permission sets are changed there, not in IAM.
      [
        'arn:aws:sts::123456789012:assumed-role/AWSReservedSSO_Admin_0123abcd/aki@example.com',
        'https://console.aws.amazon.com/singlesignon/home',
      ],
      ['arn:aws:iam::123456789012:root', 'https://console.aws.amazon.com/iam/home#/home'],
      [
        'arn:aws:sts::123456789012:federated-user/aki',
        'https://console.aws.amazon.com/iam/home#/home',
      ],
    ] as const
    for (const [arn, url] of pages) {
      expect(permissionsUrl(arn), arn).toBe(url)
      expect(isConsoleUrl(url), url).toBe(true)
    }
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
    // PARTIAL's ↗ IAM: the stand-in signs in as the role ReadOnly.
    expect(s.aws.urlOf(KEY, 'account:permissions')).toBe(
      'https://console.aws.amazon.com/iam/home#/roles/details/ReadOnly?section=permissions',
    )
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

/** acme-prod's account on the stand-in, with a billing entry set beforehand. */
const ACME = '482913507216'
const withBilling = (
  change: (a: ReturnType<typeof freshAccount>) => ReturnType<typeof freshAccount>,
): BillingFile => ({ [ACME]: change(freshAccount(Date.now())) })
const verbs = (calls: CliCall[], verb: string) =>
  calls.filter((c) => c.argv.slice(0, 2).join(' ') === verb)
const metricsAsked = (calls: CliCall[]) =>
  verbs(calls, 'cloudwatch get-metric-data').reduce(
    (n, c) =>
      n +
      (JSON.parse(c.argv[c.argv.indexOf('--metric-data-queries') + 1] ?? '[]') as unknown[]).length,
    0,
  )

describe('RESOURCES on the stand-in AWS CLI (aws.md §14)', () => {
  it('sweeps the regions the pane does not show behind every count, in the lanes sized for a new account', () => {
    // Some 50 describes of other regions once ran among the counts and, with the bulk lane one
    // wide, held the shown regions' lists up for a minute; the scheduler starts a judge only once
    // every count was tried (its own test). Measured 2026-11-08: decisions.md.
    expect(sweepProbe.bulk).toBe('judge')
    expect(CLI_LANES).toBeGreaterThanOrEqual(4)
    expect(BULK_LANES).toBeLessThan(CLI_LANES)
    expect(BULK_LANES).toBeGreaterThan(1)
  })

  it('reads what is there and what looks forgotten, sums it into ATTENTION, and counts GetMetricData by the metric', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const board = s.last()
    const res = board?.resources
    expect(res?.judging).toBe(false)
    expect(res?.figures.forgotten.billed).toBeGreaterThan(10)
    expect(res?.forgotten.map((f) => f.reason)).toEqual(
      expect.arrayContaining([
        'pt-unused',
        'no-searches',
        'low-use',
        'no-connections',
        'left-running',
        'unattached',
        'elsewhere',
        'no-records',
        'unused-capacity',
        'stopped',
        'orphan-snapshot',
        'no-traffic',
        'no-events',
        'unused-ami',
      ]),
    )
    expect(s.aws.drill(KEY, 'forgotten')?.map((r) => r.cells.reason)).toContain('orphan-log-group')
    // The unpriced Provisioned Throughput first among the billed (aws.md §14.2 B).
    expect(res?.forgotten[0]).toMatchObject({
      service: 'bedrock',
      reason: 'pt-unused',
      notPriced: true,
    })
    expect(board?.attention.find((a) => a.id === 'cost:forgotten')?.title).toMatch(
      /^\d+ look forgotten · ≈ \$[\d.]+k\/mo \+ 1 not priced › RESOURCES$/,
    )
    expect(board?.attention.some((a) => a.id === `health:dlq:${R}:orders-dlq`)).toBe(true)
    expect(res?.elsewhere.regions.map((x) => x.region)).toEqual(['ap-southeast-1', 'us-west-2'])
    expect(res?.alsoHere.map((x) => x.service)).toEqual(['vpc', 'acm', 'stacks', 'alarms'])
    expect(board?.ledger.paidMetrics).toBe(metricsAsked(s.calls))
    expect(board?.ledger.paidMetrics).toBeGreaterThan(0)
    expect(board?.ledger.meteredTiny).toBe(1)
    expect(verbs(s.calls, 's3api list-buckets')).toHaveLength(1)
    // Names only: no queue URL or topic ARN reaches the page.
    const text = JSON.stringify(board)
    expect(text).not.toContain('sqs.ap-northeast-1.amazonaws.com')
    expect(text).not.toContain(':sns:')
  })

  it("gives every row of a service's list its own id, as the page keys them", async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    // The stand-in once gave the Tokyo instances' root volumes one id: EBS's list threw.
    for (const which of [...GROUPS.flatMap((g) => g.services), 'forgotten', 'new', 'elsewhere']) {
      const keys = (s.aws.drill(KEY, which) ?? []).map((row) => `${row.service ?? ''}:${row.id}`)
      expect(new Set(keys).size, which).toBe(keys.length)
    }
  })

  it('reads the account once for two panes, and their lists agree', async () => {
    const s = service()
    const other = awsBoardKey({ profile: 'default', regions: [R], activity: false, slow: false })
    s.aws.watch(KEY)
    s.aws.watch(other)
    await s.flush()
    const tokyo = (verb: string) => verbs(s.calls, verb).filter((c) => c.argv.includes(R))
    expect(tokyo('logs describe-log-groups')).toHaveLength(1)
    expect(tokyo('dynamodb list-tables')).toHaveLength(1)
    expect(verbs(s.calls, 's3api list-buckets')).toHaveLength(1)
    expect(s.aws.drill(other, 'logs')?.map((r) => r.id)).toContain('vpc-flow-logs')
  })

  it('reads a shared list once for two boards of one account that reach it in the bulk lanes together', async () => {
    // Three bulk lanes: while one board's bucket list waited for S3, the other board's came in
    // a second lane and asked again - a metered call, twice.
    const s = service('demo', {}, (call) => call.argv[1] === 'list-buckets')
    const other = awsBoardKey({ profile: 'default', regions: [R], activity: false, slow: false })
    s.aws.watch(KEY)
    s.aws.watch(other)
    await s.flush()
    expect(s.held()).toBe(1)
    s.release()
    await s.flush()
    expect(verbs(s.calls, 's3api list-buckets')).toHaveLength(1)
    expect(s.file()[ACME]?.tiny.used['res-buckets']).toBe(1)
    // The second board took the first one's answer.
    expect(s.aws.drill(other, 's3')?.length).toBeGreaterThan(0)
  })

  it("never passes GetMetricData's cap when two boards of one account read other regions at once", async () => {
    // How many metrics each region asks for, read alone first.
    const alone = service()
    alone.aws.watch(KEY)
    await alone.flush()
    const asked = (calls: CliCall[], region: string) =>
      metricsAsked(calls.filter((c) => c.argv.includes(region)))
    const tokyo = asked(alone.calls, R)
    const virginia = asked(alone.calls, 'us-east-1')
    expect(Math.min(tokyo, virginia)).toBeGreaterThan(0)
    // Room for the bigger of the two only: each fits, both do not.
    const room = Math.max(tokyo, virginia)
    const cap = 100_000
    const s = service(
      'demo',
      withBilling((a) => ({ ...a, gmd: { ...a.gmd, cap, used: cap - room } })),
      (call) => call.argv[1] === 'get-metric-data',
    )
    const other = awsBoardKey({
      profile: 'default',
      regions: ['us-east-1'],
      activity: false,
      slow: false,
    })
    s.aws.watch(KEY)
    s.aws.watch(other)
    for (let i = 0; i < 5; i++) {
      await s.flush()
      s.release()
    }
    await s.flush()
    expect(metricsAsked(s.calls)).toBeLessThanOrEqual(room)
    expect(s.file()[ACME]?.gmd.used).toBeLessThanOrEqual(cap)
  })

  it("asks GetMetricData for Bedrock's tokens on the first cycle, and the statistics only once it is off", async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const bedrock = (c: CliCall) =>
      (c.argv[c.argv.indexOf('--metric-data-queries') + 1] ?? '').includes('AWS/Bedrock')
    // The models used come from res-bedrockuse: the first reading waits for it, not a day.
    expect(verbs(s.calls, 'cloudwatch get-metric-data').some(bedrock)).toBe(true)
    // Read while GetMetricData was on, the statistics kept nothing: turned off, they read now.
    const before = verbs(s.calls, 'cloudwatch get-metric-statistics').filter((c) =>
      c.argv.includes('AWS/ElastiCache'),
    ).length
    expect(before).toBe(0)
    expect(s.aws.metricData(KEY, { on: false })).toBe(true)
    await s.flush()
    expect(
      verbs(s.calls, 'cloudwatch get-metric-statistics').some((c) =>
        c.argv.includes('AWS/ElastiCache'),
      ),
    ).toBe(true)
  })

  it("asks CloudTrail for a resource's history by its name, without the kind its id starts with", async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const notebook = s.aws.drill(KEY, 'sagemaker')?.find((row) => row.id.startsWith('notebook:'))
    expect(notebook).toBeDefined()
    await s.aws.history(KEY, 'sagemaker', notebook?.id)
    const asked = verbs(s.calls, 'cloudtrail lookup-events').at(-1)?.argv ?? []
    // As JSON: a name with a comma once split into another key of the CLI's shorthand.
    expect(asked).toContain(
      JSON.stringify([
        { AttributeKey: 'ResourceName', AttributeValue: notebook?.id.slice('notebook:'.length) },
      ]),
    )
    expect(trailName('bedrock', 'pt:abc123')).toBe('abc123')
    expect(trailName('sagemaker', 'app:d-1/aki/JupyterLab/default')).toBe('default')
    // Only those services' kinds: an alarm or a stack named with a colon keeps its whole name.
    expect(trailName('alarms', 'prod:cpu-high')).toBe('prod:cpu-high')
    expect(trailName('alarms', 'app:latency-high')).toBe('app:latency-high')
    expect(trailName('stacks', 'kb:docs')).toBe('kb:docs')
    expect(trailName('elb', 'orders/api')).toBe('api')
    expect(trailName('acm', 'arn:aws:acm:us-east-1:1:certificate/0f0e')).toBe('0f0e')
    expect(trailName('logs', '/aws/lambda/old-resizer')).toBe('old-resizer')
  })

  it('lists across services, opens what it showed, and tells the third step why', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const rows = s.aws.drill(KEY, 'forgotten') ?? []
    expect(rows.length).toBe(s.last()?.resources.forgottenTotal)
    expect(rows.every((row) => row.service !== undefined)).toBe(true)
    expect(
      s.aws
        .drill(KEY, 'elsewhere')
        ?.map((r) => `${r.service}:${r.region}`)
        .sort(),
    ).toEqual(['ebs:us-west-2', 'ec2:us-west-2', 'nat:ap-southeast-1'])
    const item = s.aws.item(KEY, 'logs', '/aws/lambda/old-resizer')
    expect(item?.forgotten).toMatchObject({ reason: 'orphan-log-group' })
    expect(item?.kept).toBe(false)
    expect(s.aws.item(KEY, 'ec2', 'i-0b7c6d5e4f3a20001')?.region).toBe('us-west-2')
    expect(s.aws.urlOf(KEY, `item:logs:${R}:/aws/lambda/old-resizer`)).toBe(
      `https://${R}.console.aws.amazon.com/cloudwatch/home?region=${R}#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fold-resizer`,
    )
    expect(s.aws.urlOf(KEY, 'item:ec2:us-west-2:i-0b7c6d5e4f3a20001')).toMatch(
      /^https:\/\/us-west-2\.console/,
    )
    expect(s.aws.urlOf(KEY, 'item:ec2:us-west-2:i-nothere')).toBeNull()
  })

  it('keeps only a row of its own last list, takes a mark off, and refuses anything else', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const row = s.last()?.resources.forgotten.find((f) => f.reason === 'orphan-snapshot')
    expect(row).toBeDefined()
    expect(s.aws.keep(KEY, 'ec2:ap-northeast-1:i-not-listed', true)).toBe(false)
    expect(s.aws.keep(KEY, row?.key, 'yes')).toBe(false)
    expect(s.aws.keep(KEY, row?.key, true)).toBe(true)
    await s.flush()
    const res = s.last()?.resources
    expect(res?.forgotten.some((f) => f.key === row?.key)).toBe(false)
    expect(res?.kept.map((k) => k.key)).toEqual([row?.key])
    expect(res?.figures.forgotten.kept).toBe(1)
    expect(s.aws.item(KEY, 'snapshots', 'snap-0orphan01')?.kept).toBe(true)
    expect(s.aws.keep(KEY, row?.key, false)).toBe(true)
    expect(s.aws.keep(KEY, row?.key, false)).toBe(false)
    expect(s.aws.keep('nope', row?.key, true)).toBe(false)
  })

  it('sweeps again when asked, at most once in 30 s, and stops sweeping when turned off', async () => {
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    const nats = () =>
      verbs(s.calls, 'ec2 describe-nat-gateways').filter((c) => c.argv.includes('ap-southeast-1'))
        .length
    const before = nats()
    s.later(1000)
    expect(s.aws.sweep(KEY)).toBe(30_000)
    expect(s.aws.sweep(KEY)).toBeGreaterThan(0)
    await s.flush()
    expect(nats()).toBe(before + 1)
    expect(s.aws.sweep(KEY, 'off')).toBe(0)
    await s.flush()
    expect(s.last()?.resources.elsewhere).toMatchObject({ on: false, regions: [] })
    expect(s.last()?.resources.forgotten.some((f) => f.reason === 'elsewhere')).toBe(false)
    expect(s.aws.sweep(KEY, 'everywhere')).toBe(0)
  })

  it('falls back to the statistics without GetMetricData, and stops at its cap with GMD CAP REACHED', async () => {
    const off = service(
      'demo',
      withBilling((a) => ({ ...a, gmd: { ...a.gmd, on: false } })),
    )
    off.aws.watch(KEY)
    await off.flush()
    expect(verbs(off.calls, 'cloudwatch get-metric-data')).toHaveLength(0)
    expect(
      verbs(off.calls, 'cloudwatch get-metric-statistics').some((c) =>
        c.argv.includes('AWS/ElastiCache'),
      ),
    ).toBe(true)
    expect(
      off
        .last()
        ?.resources.forgotten.some(
          (f) => f.service === 'elasticache' && f.why === 'no connections 14 d',
        ),
    ).toBe(true)
    const capped = service(
      'demo',
      withBilling((a) => ({ ...a, gmd: { ...a.gmd, used: 99_990 } })),
    )
    capped.aws.watch(KEY)
    await capped.flush()
    expect(verbs(capped.calls, 'cloudwatch get-metric-data')).toHaveLength(0)
    expect(capped.last()?.ledger.paidNotes).toEqual(['GMD CAP REACHED'])
    expect(capped.last()?.resources.gmd).toMatchObject({ capReached: true, used: 99_990 })
    expect(capped.aws.metricData(KEY, { on: true, cap: 500_000 })).toBe(true)
    expect(capped.aws.metricData(KEY, { on: true, cap: 123 })).toBe(false)
    expect(capped.aws.metricData(KEY, { on: 'yes' })).toBe(false)
  })

  it('asks S3 for its list 31 times a month at most', async () => {
    const s = service(
      'demo',
      withBilling((a) => ({ ...a, tiny: { ...a.tiny, used: { 'res-buckets': 31 } } })),
    )
    s.aws.watch(KEY)
    await s.flush()
    expect(verbs(s.calls, 's3api list-buckets')).toHaveLength(0)
  })

  it('stays linked where a region does not offer Bedrock or OpenSearch Serverless', async () => {
    const s = service('noregion')
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.link).toBe('linked')
    expect(s.last()?.denied).toEqual([])
    expect(s.last()?.resources.notOffered).toEqual([
      { service: 'bedrock', regions: [R] },
      { service: 'aoss', regions: [R] },
    ])
  })

  it('keeps Bedrock and its Provisioned Throughput offline: no other call reached the region, so nothing is "not offered"', async () => {
    const s = service('demo')
    s.aws.watch(KEY)
    await s.flush()
    const pts = () =>
      s.last()?.resources.bedrock?.placed.find((p) => p.kind === 'pt')?.count ?? null
    expect(pts()).toBe(1)
    // The network goes: AWS CLI says the very words it says where Bedrock has no endpoint.
    s.setMode('offline')
    s.later(7 * 3_600_000)
    s.aws.refresh(KEY)
    await s.flush()
    expect(s.last()?.link).toBe('offline')
    expect(s.last()?.resources.notOffered).toEqual([])
    expect(pts()).toBe(1)
    expect(s.last()?.resources.none).not.toContain('bedrock')
  })

  it('reads GetMetricData and the bucket list again only for their period, never for REFRESH', async () => {
    const s = service('demo')
    s.aws.watch(KEY)
    await s.flush()
    const count = () => ({
      gmd: verbs(s.calls, 'cloudwatch get-metric-data').length,
      buckets: verbs(s.calls, 's3api list-buckets').length,
      logs: verbs(s.calls, 'logs describe-log-groups').length,
    })
    const before = count()
    expect(before.gmd).toBeGreaterThan(0)
    expect(before.buckets).toBe(1)
    s.later(6 * 60_000)
    s.aws.refresh(KEY)
    await s.flush()
    const after = count()
    expect(after.gmd).toBe(before.gmd)
    expect(after.buckets).toBe(before.buckets)
    // A free list is read again for the press.
    expect(after.logs).toBeGreaterThan(before.logs)
  })

  it('keeps GMD CAP REACHED for the same cap sent again, and lets the month go on for a raised one', async () => {
    const s = service(
      'demo',
      withBilling((a) => ({ ...a, gmd: { ...a.gmd, used: 99_990 } })),
    )
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.resources.gmd.capReached).toBe(true)
    // ⚙ sends the cap with every press, ON or OFF alike.
    expect(s.aws.metricData(KEY, { on: true, cap: 100_000 })).toBe(true)
    expect(s.last()?.resources.gmd.capReached).toBe(true)
    expect(s.aws.metricData(KEY, { on: false, cap: 100_000 })).toBe(true)
    expect(s.last()?.resources.gmd.capReached).toBe(true)
    expect(s.aws.metricData(KEY, { on: true, cap: 500_000 })).toBe(true)
    expect(s.last()?.resources.gmd.capReached).toBe(false)
  })

  it('says nothing looks forgotten on a tidy account', async () => {
    const s = service('quiet')
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.resources.forgotten).toEqual([])
    expect(s.last()?.attention.some((a) => a.id === 'cost:forgotten')).toBe(false)
  })
})

describe("RESOURCES' readings of every region (aws.md §14.4)", () => {
  it('takes a region disabled since, or not read for long, neither for ELSEWHERE nor for Bedrock', () => {
    const now = Date.UTC(2026, 10, 8, 3)
    const inventory = memoryInventory()
    let file: BillingFile = {}
    const accounts = new ResourceAccounts({
      inventory,
      billing: billingStore({ load: () => file, save: (next) => (file = next) }, () => now),
      now: () => now,
    })
    const day = 86_400_000
    const sweep = { instances: [], volumes: [], nats: [], addresses: [] }
    inventory.write(ACME, 'res-regions', 'global', [R, 'us-west-2', 'eu-west-1'], now - day)
    // us-west-2 is enabled and read lately; eu-west-1 read two months ago; me-south-1 since disabled.
    for (const [region, at] of [
      ['us-west-2', now - day],
      ['eu-west-1', now - 60 * day],
      ['me-south-1', now - day],
    ] as const) {
      inventory.write(ACME, 'res-sweep', region, sweep, at)
      inventory.write(ACME, 'res-bedrockuse', region, ['amazon.titan-embed-text-v2:0'], at)
    }
    const r = accounts.readings(ACME, [R], false)
    expect(Object.keys(r.sweep)).toEqual(['us-west-2'])
    expect(Object.keys(r.bedrockUse)).toEqual(['us-west-2'])
    expect(Object.keys(r.usage).sort()).toEqual([R, 'us-west-2'])
  })
})

describe('GetMetricData batches (aws.md §14.4a)', () => {
  it('asks 500 metrics a call at most, within a command line Windows takes', () => {
    const query = (i: number) => ({
      key: `k${i}`,
      ns: 'AWS/Logs',
      metric: 'IncomingBytes',
      dims: [{ Name: 'LogGroupName', Value: `/aws/lambda/function-with-a-long-name-${i}` }],
      stat: 'Sum' as const,
      days: 30,
    })
    const out = batches(Array.from({ length: 1200 }, (_, i) => query(i)))
    expect(out.flat()).toHaveLength(1200)
    for (const batch of out) {
      expect(batch.length).toBeLessThanOrEqual(GMD_MAX_QUERIES)
      expect(JSON.stringify(batch).length).toBeLessThan(GMD_MAX_CHARS * 1.5)
    }
    expect(out.length).toBeGreaterThan(3)
  })
})

describe('the parsers of RESOURCES', () => {
  it('reads the --query shapes and keeps names, never ARNs or URLs', () => {
    expect(
      parseWith(BucketListSchema, '[["b","2024-01-01T00:00:00+00:00","ap-northeast-1"]]'),
    ).toEqual([['b', '2024-01-01T00:00:00+00:00', 'ap-northeast-1']])
    expect(
      parseWith(
        LogGroupsSchema,
        '[["/aws/lambda/x",1700000000000,null,1024,"STANDARD"]]',
      )?.[0]?.[0],
    ).toBe('/aws/lambda/x')
    expect(
      parseWith(DistributionsSchema, '[["E1",true,"Deployed","2024-01-01T00:00:00Z",null]]'),
    ).toHaveLength(1)
    expect(parseWith(BucketListSchema, '[{"Name":"b"}]')).toBeNull()
    expect(lastPart('https://sqs.ap-northeast-1.amazonaws.com/482913507216/orders')).toBe('orders')
    expect(lastPart('arn:aws:sns:ap-northeast-1:482913507216:alerts')).toBe('alerts')
    expect(
      modelIdOf(
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
      ),
    ).toBe('anthropic.claude-3-haiku-20240307-v1:0')
    expect(modelIdOf(null)).toBeNull()
  })
})

describe('console URLs of RESOURCES', () => {
  it('opens each new kind on the console', () => {
    const cases: [AwsKind, string, string][] = [
      ['ecs', 'web/frontend', `/ecs/v2/clusters/web/services/frontend/health?region=${R}`],
      ['dynamodb', 'orders', `/dynamodbv2/home?region=${R}#table?name=orders`],
      ['bedrock', 'pt:abc', `/bedrock/home?region=${R}#/provisioned-throughput`],
      ['vpce', 'vpce-1', '#EndpointDetails:vpcEndpointId=vpce-1'],
      ['sagemaker', 'notebook:exp', '#/notebook-instances/exp'],
      ['kinesis', 's', '#/streams/details/s/monitoring'],
      ['kms', 'k-1', '#/kms/keys/k-1'],
    ]
    for (const [service, id, tail] of cases) {
      const url = consoleUrl(service, R, id)
      expect(url, service).toContain(tail)
      expect(url !== null && isConsoleUrl(url), service).toBe(true)
    }
    expect(consoleUrl('route53', R, 'Z1')).toBe(
      'https://console.aws.amazon.com/route53/v2/hostedzones#ListRecordSets/Z1',
    )
    expect(consoleUrl('cloudfront', R, 'E1')).toBe(
      'https://console.aws.amazon.com/cloudfront/v4/home#/distributions/E1',
    )
  })
})
