import { describe, expect, it } from 'vitest'
import { activeCost } from '../../src/shared/aws/active'
import { attention } from '../../src/shared/aws/attention'
import { drillItem, drillRows } from '../../src/shared/aws/drill'
import { AWS_LIMITS } from '../../src/shared/aws/facts'
import {
  applyKeep,
  forgotten,
  listedPairs,
  rank,
  seriesKey,
  useOf,
  whyOf,
} from '../../src/shared/aws/forgotten'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import {
  emptyResourceReadings,
  type ResourceReadings,
} from '../../src/shared/aws/resource-readings'
import { allResources } from '../../src/shared/aws/resources'
import type { ForgottenReason, ForgottenRow } from '../../src/shared/aws/types'

/** RESOURCES' "looks forgotten" (aws.md §14.3): each kind's rule, its words, the order and KEEP. */

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 8, 3)
const R = 'ap-northeast-1'
const iso = (at: number) => new Date(at).toISOString()

const readings = (
  over: Partial<Omit<AwsReadings, 'res'>> = {},
  res: Partial<ResourceReadings> = {},
): AwsReadings => ({
  ...emptyReadings(NOW, [R]),
  ...over,
  res: { ...emptyResourceReadings(), ...res },
})

const rows = (r: AwsReadings) => forgotten(r).rows
const reasons = (r: AwsReadings) => rows(r).map((row) => `${row.service}:${row.id}:${row.reason}`)

const volume = (over: Record<string, unknown> = {}) => ({
  id: 'vol-1',
  size: 100,
  type: 'gp3',
  state: 'available',
  iops: null,
  at: null,
  created: null,
  name: null,
  ...over,
})

const instance = (over: Record<string, unknown> = {}) => ({
  id: 'i-1',
  type: 'm6i.large',
  state: 'running',
  launch: iso(NOW - 40 * DAY),
  az: `${R}a`,
  life: null,
  name: 'web-1',
  platform: 'Linux/UNIX',
  reason: '',
  vols: [],
  sgs: [],
  vpc: 'vpc-1',
  subnet: 'subnet-1',
  ip: '10.0.0.1',
  pub: null,
  imds: 'required',
  ...over,
})

const series = (v: number[], d = 30, via: 'gmd' | 'stat' = 'gmd') => ({ v, d, via })

describe('the predicates', () => {
  it('says an unattached volume from the day elecdex first saw it so', () => {
    const r = readings(
      { volumes: { [R]: [volume()] } },
      {
        memory: {
          ...emptyResourceReadings().memory,
          unattached: { [`ebs:${R}:vol-1`]: NOW - 12 * DAY },
        },
      },
    )
    const [row] = rows(r)
    expect(row).toMatchObject({
      reason: 'unattached',
      why: 'not attached since 10-27 (first seen) · 100 GiB',
      quietFor: 'since 10-27',
      window: 12,
      billed: true,
      weight: 'warn',
    })
    expect(row?.monthly).toBeCloseTo(100 * 0.08 * 1.27)
  })

  it('counts a stopped instance from 31 days, with the GiB its volumes go on billing', () => {
    const stopped = (days: number) =>
      instance({
        state: 'stopped',
        reason: `User initiated (${iso(NOW - days * DAY)
          .slice(0, 19)
          .replace('T', ' ')} GMT)`,
      })
    const r = (days: number) =>
      readings({
        instances: { [R]: [stopped(days)] },
        volumes: { [R]: [volume({ state: 'in-use', at: 'i-1', size: 200 })] },
      })
    expect(rows(r(AWS_LIMITS.stoppedDays))).toEqual([])
    expect(rows(r(31))[0]).toMatchObject({
      reason: 'stopped',
      why: 'stopped 31 d · 200 GiB still billed',
      billed: true,
    })
  })

  it('reads low use from 14 daily points: four quiet days, not three', () => {
    const low = (n: number) =>
      readings(
        { instances: { [R]: [instance()] } },
        {
          usage: {
            [R]: {
              [seriesKey({
                ns: 'AWS/EC2',
                metric: 'CPUUtilization',
                dim: 'InstanceId',
                value: 'i-1',
              })]: series(
                Array.from({ length: 14 }, (_, i) => (i < n ? 1 : 60)),
                14,
              ),
              [seriesKey({ ns: 'AWS/EC2', metric: 'NetworkOut', dim: 'InstanceId', value: 'i-1' })]:
                series(
                  Array.from({ length: 14 }, () => 1000),
                  14,
                ),
            },
          },
        },
      )
    expect(rows(low(3))).toEqual([])
    expect(rows(low(4))[0]).toMatchObject({ reason: 'low-use', quietFor: '14 d', window: 14 })
    expect(rows(low(4))[0]?.why).toMatch(/^low use 4 of 14 d · /)
  })

  it('falls back to the 7-day CPU rule without GetMetricData, which ACTIVE counts as IDLE too', () => {
    const r = readings({
      instances: { [R]: [instance()] },
      cpu: { [R]: { 'i-1': { avg: [1, 1, 1, 1, 1, 1, 1], max: [3, 3, 3, 3, 3, 3, 3] } } },
    })
    expect(rows(r)[0]).toMatchObject({ reason: 'low-use', window: 7 })
    expect(activeCost(r).services.find((s) => s.service === 'ec2')?.idle).toBe(1)
  })

  it('says no traffic for a NAT from a series of zeros, and never from list-metrics alone', () => {
    const nat = { id: 'nat-1', state: 'available', vpc: null, connectivity: null, name: 'main' }
    const key = seriesKey({
      ns: 'AWS/NATGateway',
      metric: 'BytesOutToDestination',
      dim: 'NatGatewayId',
      value: 'nat-1',
    })
    expect(rows(readings({ nats: { [R]: [nat] } }, { presence: { [R]: {} } }))).toEqual([])
    const quiet = readings({ nats: { [R]: [nat] } }, { usage: { [R]: { [key]: series([]) } } })
    expect(rows(quiet)[0]).toMatchObject({
      reason: 'no-traffic',
      why: 'no traffic 30 d',
      window: 30,
    })
    const busy = readings({ nats: { [R]: [nat] } }, { usage: { [R]: { [key]: series([0, 5]) } } })
    expect(rows(busy)).toEqual([])
  })

  it("says 14 d+ from list-metrics, longer only from main's record, and nothing before it is read", () => {
    const fn = { name: 'cron', runtime: 'python3.12', memory: 128, modified: NOW - 300 * DAY }
    expect(rows(readings({ functions: { [R]: [fn] } }))).toEqual([])
    const listed = readings(
      { functions: { [R]: [fn] } },
      { presence: { [R]: { 'AWS/Lambda Invocations': [] } } },
    )
    expect(rows(listed)[0]).toMatchObject({
      reason: 'not-invoked',
      why: 'not invoked 14 d+',
      billed: false,
      weight: 'quiet',
    })
    const key = seriesKey({
      ns: 'AWS/Lambda',
      metric: 'Invocations',
      dim: 'FunctionName',
      value: 'cron',
    })
    const remembered = readings(
      { functions: { [R]: [fn] } },
      {
        presence: { [R]: { 'AWS/Lambda Invocations': [] } },
        memory: {
          ...emptyResourceReadings().memory,
          lastMetric: { [`${R}|${key}`]: NOW - 37 * DAY },
        },
      },
    )
    expect(rows(remembered)[0]).toMatchObject({ quietFor: 'since 10-02', window: 37 })
    const active = readings(
      { functions: { [R]: [fn] } },
      {
        presence: {
          [R]: { 'AWS/Lambda Invocations': [[{ Name: 'FunctionName', Value: 'cron' }]] },
        },
      },
    )
    expect(rows(active)).toEqual([])
  })

  it('names a log group whose function is gone, only once the functions were read', () => {
    const groups = {
      [R]: [['/aws/lambda/old', NOW - 900 * DAY, null, 38 * 1024 ** 3, 'STANDARD']] as [
        string,
        number,
        null,
        number,
        string,
      ][],
    }
    expect(rows(readings({}, { logGroups: groups }))).toEqual([])
    const r = readings({ functions: { [R]: [] } }, { logGroups: groups })
    expect(rows(r)[0]).toMatchObject({
      reason: 'orphan-log-group',
      why: 'function gone · 38 GB kept forever',
      billed: true,
    })
  })

  it('reads a provisioned table unused as capacity billed, an on-demand one as free', () => {
    const table = (m: string) => ({
      n: 't',
      s: 'ACTIVE',
      c: null,
      b: 0,
      i: 0,
      m,
      r: 50,
      w: 25,
      k: 'STANDARD',
    })
    const at = (m: string) =>
      readings(
        {},
        {
          ddb: { [R]: { names: ['t'], tables: [table(m)] } },
          presence: {
            [R]: {
              'AWS/DynamoDB ConsumedReadCapacityUnits': [],
              'AWS/DynamoDB ConsumedWriteCapacityUnits': [],
            },
          },
        },
      )
    expect(rows(at('PROVISIONED'))[0]).toMatchObject({
      reason: 'unused-capacity',
      why: 'provisioned 50/25, unused 14 d+',
      billed: true,
    })
    expect(rows(at('PAY_PER_REQUEST'))[0]).toMatchObject({
      reason: 'no-requests',
      why: 'no reads or writes 14 d+',
      billed: false,
    })
  })

  it('judges a Provisioned Throughput by its id and its base model: the base model called is use unknown', () => {
    const pt = {
      id: 'abc',
      n: 'pt-1',
      m: 'anthropic.claude-3-haiku',
      f: 'anthropic.claude-3-haiku',
      s: 'InService',
      u: 1,
      d: 'OneMonth',
      e: iso(NOW + 25 * DAY),
      c: null,
    }
    const bedrock = {
      offered: true,
      pts: [pt],
      custom: [],
      imported: [],
      guardrails: [],
      agents: [],
      kbs: [],
      runtimes: [],
      profiles: [],
    }
    const at = (called: string[]) =>
      readings({}, { bedrock: { [R]: bedrock }, bedrockUse: { [R]: called, 'us-west-2': [] } })
    expect(rows(at(['amazon.nova-pro']))[0]).toMatchObject({
      reason: 'pt-unused',
      why: 'PT billed by the hour · no calls seen 14 d+ · commitment ends 12-03',
      billed: true,
      notPriced: true,
      monthly: null,
    })
    expect(rows(at(['anthropic.claude-3-haiku']))).toEqual([])
    expect(rows(at(['arn:aws:bedrock:x:1:provisioned-model/abc']))).toEqual([])
    // Not read anywhere yet: nothing is said.
    expect(rows(readings({}, { bedrock: { [R]: bedrock } }))).toEqual([])
  })

  it('finds an alarm watching what is gone, a snapshot without its volume, an old image, a disabled key and an empty zone', () => {
    const r = readings(
      {
        instances: { [R]: [instance()] },
        volumes: { [R]: [volume({ id: 'vol-2', state: 'in-use', at: 'i-1' })] },
      },
      {
        alarmsAll: {
          [R]: [
            { n: 'cpu', s: 'OK', ns: 'AWS/EC2', d: 'InstanceId', v: 'i-gone' },
            { n: 'cpu-1', s: 'OK', ns: 'AWS/EC2', d: 'InstanceId', v: 'i-1' },
          ],
        },
        images: {
          [R]: {
            snapshots: [
              { id: 'snap-orphan', v: 'vol-gone', g: 200, c: iso(NOW - 500 * DAY), t: 'standard' },
              { id: 'snap-ami', v: 'vol-gone', g: 50, c: iso(NOW - 400 * DAY), t: 'standard' },
            ],
            images: [
              {
                id: 'ami-1',
                n: 'base',
                c: iso(NOW - 400 * DAY),
                l: iso(NOW - 91 * DAY),
                s: ['snap-ami'],
                st: 'available',
              },
            ],
          },
        },
        kms: {
          [R]: [
            { id: 'k-1', m: 'CUSTOMER', s: 'Disabled', c: null, d: null, sp: null },
            { id: 'k-2', m: 'AWS', s: 'Disabled', c: null, d: null, sp: null },
          ],
        },
        zones: [
          { id: '/hostedzone/Z1', n: 'old.example.', c: 2, p: false },
          { id: '/hostedzone/Z2', n: 'live.example.', c: 9, p: false },
        ],
      },
    )
    expect(reasons(r).sort()).toEqual([
      'alarms:cpu:alarm-orphan',
      'amis:ami-1:unused-ami',
      'kms:k-1:key-disabled',
      'route53:Z1:empty-zone',
      'snapshots:snap-orphan:orphan-snapshot',
    ])
    expect(rows(r).find((x) => x.reason === 'alarm-orphan')?.why).toBe(
      'watches i-gone, which is gone',
    )
    // The sentence names another resource: MASK hides it with the alarm's own name.
    expect(rows(r).find((x) => x.reason === 'alarm-orphan')?.names).toContain('i-gone')
  })

  it('says what the sweep found elsewhere without a word about use', () => {
    const r = readings(
      {},
      {
        sweep: {
          'us-west-2': {
            instances: [{ id: 'i-9', type: 't3.medium', s: 'running', l: iso(NOW - 270 * DAY) }],
            volumes: [{ id: 'vol-9', g: 100, t: 'gp3', s: 'in-use' }],
            nats: [],
            addresses: [{ id: 'eipalloc-9', assoc: true }],
          },
        },
      },
    )
    expect(rows(r).map((x) => x.why)).toEqual([
      'in us-west-2 · running 9 mo · use not read (region not shown)',
    ])
  })

  it('has a sentence for every reason', () => {
    const all: ForgottenReason[] = [
      'low-use',
      'stopped',
      'unattached',
      'no-traffic',
      'no-targets',
      'no-requests',
      'no-connections',
      'desired-0',
      'empty-cluster',
      'no-nodes',
      'empty',
      'unchanged',
      'orphan-log-group',
      'no-events',
      'unused-capacity',
      'no-messages',
      'no-subscribers',
      'not-invoked',
      'pt-unused',
      'unused-model',
      'no-searches',
      'alarm-orphan',
      'orphan-snapshot',
      'unused-ami',
      'no-pulls',
      'elsewhere',
      'tunnel-down',
      'left-running',
      'key-disabled',
      'empty-zone',
      'no-records',
      'no-transfers',
    ]
    for (const reason of all)
      expect(whyOf(reason, { quiet: '14 d+' }).length, reason).toBeGreaterThan(0)
  })
})

describe('how quiet is read', () => {
  it('is quiet only when every metric is, with the shortest window', () => {
    const r = readings(
      {},
      {
        usage: { [R]: { 'A|m|d=x': series([], 30) } },
        presence: { [R]: { 'A n': [] } },
      },
    )
    const specs = [
      { ns: 'A', metric: 'm', dim: 'd', value: 'x' },
      { ns: 'A', metric: 'n', dim: 'd', value: 'x' },
    ]
    expect(useOf(r, R, specs)).toMatchObject({ state: 'quiet', window: 14, quietFor: '14 d+' })
    expect(useOf(r, R, [...specs, { ns: 'B', metric: 'z', dim: 'd', value: 'x' }])).toEqual({
      state: 'unknown',
    })
  })

  it('lists the metrics the region needs, leaving out the zero-sending ones asked by their exact dimension', () => {
    const r = readings({
      functions: { [R]: [{ name: 'f', runtime: null, memory: null, modified: null }] },
      nats: { [R]: [{ id: 'n', state: 'available', vpc: null, connectivity: null, name: null }] },
    })
    expect(listedPairs([...allResources(r).values()].flat())).toEqual([
      ['AWS/Lambda', 'Invocations'],
    ])
  })
})

const row = (over: Partial<ForgottenRow>): ForgottenRow => ({
  key: 'ebs:r:x',
  names: ['x'],
  service: 'ebs',
  id: 'x',
  region: R,
  name: 'x',
  reason: 'unattached',
  why: '',
  quietFor: '',
  window: 30,
  billed: true,
  monthly: 10,
  notPriced: false,
  weight: 'warn',
  source: '',
  ...over,
})

describe('the order and KEEP', () => {
  it('puts the billed first, the unpriced first among them, then the money, a short window halved', () => {
    const ranked = rank([
      row({ key: 'free', billed: false, monthly: null }),
      row({ key: 'cheap', monthly: 5 }),
      row({ key: 'dear-short', monthly: 100, window: 3 }),
      row({ key: 'dear', monthly: 80 }),
      row({ key: 'unpriced', monthly: null, notPriced: true }),
    ])
    expect(ranked.map((x) => x.key)).toEqual(['unpriced', 'dear', 'dear-short', 'cheap', 'free'])
  })

  it('weighs danger by the amount alone', () => {
    const r = readings({ volumes: { [R]: [volume({ size: 5000, type: 'io2', iops: 2000 })] } })
    expect(rows(r)[0]?.weight).toBe('danger')
  })

  it('keeps a kept row off the list until its amount more than doubles, then shows it again and takes the mark off', () => {
    const list = [
      row({ key: 'a', monthly: 10 }),
      row({ key: 'b', monthly: 21 }),
      row({ key: 'c', monthly: 5 }),
    ]
    const kept = applyKeep(list, { a: { usd: 10 }, b: { usd: 10 }, c: { usd: 0 } })
    expect(kept.rows.map((x) => x.key)).toEqual(['b', 'c'])
    expect(kept.kept.map((x) => x.key)).toEqual(['a'])
    expect(kept.released).toEqual(['b', 'c'])
  })

  it('leaves the forgotten kinds out of ATTENTION but their one summary, and the dead-letter backlog in HEALTH', () => {
    const r = readings(
      { volumes: { [R]: [volume()] } },
      {
        sqs: {
          [R]: [
            { n: 'orders', m: 0, c: null, dlq: 'orders-dlq' },
            { n: 'orders-dlq', m: 2140, c: null, dlq: null },
          ],
        },
      },
    )
    const items = attention(r)
    // Both warn: by tag, COST before HEALTH.
    expect(items.map((i) => i.id)).toEqual(['cost:forgotten', `health:dlq:${R}:orders-dlq`])
    expect(items[1]?.title).toBe('2,140 in dead-letter queue orders-dlq')
    const kept = readings(
      { volumes: { [R]: [volume()] } },
      {
        memory: {
          ...emptyResourceReadings().memory,
          keep: { [`ebs:${R}:vol-1`]: { at: NOW, usd: 10.16, name: 'vol-1' } },
        },
      },
    )
    expect(attention(kept).map((i) => i.id)).toEqual([])
  })
})

describe("the drill-down's lists agree with RESOURCES (aws.md §14.5)", () => {
  const nat = (id: string, state: string) => ({
    id,
    state,
    vpc: 'vpc-1',
    connectivity: 'public',
    name: null,
  })

  it('relates an item to what is in its own region only', () => {
    // The lookups searched every region: the same ids read in two regions mixed their volumes.
    const r = {
      ...readings({
        instances: { [R]: [instance()], 'us-east-1': [instance({ name: 'east' })] },
        volumes: {
          [R]: [volume({ id: 'vol-tokyo', at: 'i-1', state: 'in-use' })],
          'us-east-1': [volume({ id: 'vol-east', at: 'i-1', state: 'in-use' })],
        },
      } as never),
      regions: [R, 'us-east-1'],
    }
    const east = drillItem('ec2', 'i-1', r, [], 'us-east-1')
    expect(east?.related.map((x) => x.id)).toEqual(['vol-east'])
    expect(drillItem('ebs', 'vol-tokyo', r, [], R)?.related.map((x) => x.name)).toEqual(['web-1'])
  })

  it('opens the copy of a name two regions share in the region asked for', () => {
    // CDKToolkit is in every bootstrapped region: the item once opened the first region's copy,
    // whatever row or ATTENTION line was pressed.
    const stack = (status: string) => ({ name: 'CDKToolkit', status, at: NOW, drift: null })
    const r = {
      ...readings({
        stacks: { [R]: [stack('CREATE_COMPLETE')], 'us-east-1': [stack('UPDATE_FAILED')] },
      }),
      regions: [R, 'us-east-1'],
    }
    const rows = drillRows('stacks', r, [])
    expect(rows.map((row) => `${row.region}:${row.id}`)).toEqual([
      `${R}:CDKToolkit`,
      'us-east-1:CDKToolkit',
    ])
    expect(drillItem('stacks', 'CDKToolkit', r, [], 'us-east-1')?.region).toBe('us-east-1')
    expect(drillItem('stacks', 'CDKToolkit', r, [], R)?.region).toBe(R)
    // With no region (an old saved place), the first copy, as before.
    expect(drillItem('stacks', 'CDKToolkit', r, [])?.region).toBe(R)
    // A finding is its own region's: the failed us-east-1 copy marks neither the healthy row
    // nor the healthy item.
    const found = attention(r)
    const weights = drillRows('stacks', r, found).map((row) => `${row.region}:${row.weight}`)
    expect(weights).toEqual([`${R}:null`, 'us-east-1:danger'])
    expect(drillItem('stacks', 'CDKToolkit', r, found, R)?.attention).toEqual([])
    expect(drillItem('stacks', 'CDKToolkit', r, found, 'us-east-1')?.attention).toHaveLength(1)
    // The copy asked for gone, another region's copy is not shown in its place.
    const gone = { ...r, stacks: { [R]: [stack('CREATE_COMPLETE')] } }
    expect(drillItem('stacks', 'CDKToolkit', gone, [], 'us-east-1')).toBeNull()
  })

  it('lists classic load balancers, opens a forgotten one, and prices a NAT as RESOURCES does', () => {
    const r = readings(
      {
        nats: { [R]: [nat('nat-on', 'available'), nat('nat-new', 'pending')] },
        balancers: { [R]: [] },
      },
      {
        elbTargets: {
          [R]: {
            groups: [],
            classic: [{ n: 'old-clb', c: iso(NOW - 400 * DAY), i: 0, s: 'internet-facing' }],
          },
        },
      },
    )
    const elb = drillRows('elb', r, [])
    expect(elb.map((row) => row.id)).toEqual(['old-clb'])
    expect(elb[0]?.cells).toMatchObject({ type: 'classic', scheme: 'internet-facing' })
    expect(drillItem('elb', 'old-clb', r, [])?.name).toBe('old-clb')
    // ACTIVE bills it by the hour too, as RESOURCES does.
    const active = activeCost(r).services.find((x) => x.service === 'elb')
    expect(active?.count).toBe('1')
    expect(active?.top.map((t) => t.name)).toContain('old-clb')
    // A pending NAT gateway bills as soon as it is created: priced alike in both places.
    const tile = new Map(
      allResources(r)
        .get('nat')
        ?.map((x) => [x.id, x.monthly]),
    )
    for (const row of drillRows('nat', r, []))
      expect(row.cells.monthly, row.id).toBe(tile.get(row.id))
    expect(tile.get('nat-new')).toBeGreaterThan(0)
  })

  it('lists every alarm the Also-here line counts, in every state, and the certificates it counts', () => {
    const r = readings(
      {
        alarms: {
          [R]: {
            metric: [{ name: 'cpu-high', since: NOW - DAY, namespace: 'AWS/EC2', dim: 'i-1' }],
            composite: [],
          },
        },
        certificates: {
          [R]: [],
          'us-east-1': [
            {
              arn: 'arn:aws:acm:us-east-1:1:certificate/0b3f9f0c-1d2e-4f5a-8b7c-9d0e1f2a3b4c',
              domain: 'cdn.example.com',
              type: 'AMAZON_ISSUED',
              expires: NOW + 90 * DAY,
              inUse: true,
              status: 'ISSUED',
            },
          ],
        },
      },
      {
        alarmsAll: {
          [R]: [
            { n: 'cpu-high', s: 'ALARM', ns: 'AWS/EC2', d: 'InstanceId', v: 'i-1' },
            { n: 'disk-low', s: 'OK', ns: 'AWS/EC2', d: 'InstanceId', v: 'i-1' },
            { n: 'queue-deep', s: 'INSUFFICIENT_DATA', ns: 'AWS/SQS', d: null, v: null },
          ],
        },
      },
    )
    const all = allResources(r)
    const alarms = drillRows('alarms', r, [])
    expect(alarms.map((row) => row.id).sort()).toEqual(['cpu-high', 'disk-low', 'queue-deep'])
    expect(alarms.length).toBe(all.get('alarms')?.length)
    expect(alarms.find((row) => row.id === 'cpu-high')?.cells).toMatchObject({
      state: 'ALARM',
      since: NOW - DAY,
    })
    // us-east-1's certificates are read for CloudFront even when the pane does not show it.
    expect(drillRows('acm', r, []).length).toBe(all.get('acm')?.length)
  })
})
